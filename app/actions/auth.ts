"use server"

import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { colaboradores } from "@/lib/db/schema"
import { createSession, destroySession, getSession } from "@/lib/session"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import bcrypt from "bcryptjs"

const loginAttempts = new Map<string, { count: number; lastAttempt: number }>()

function checkRateLimit(email: string): boolean {
  const now = Date.now()
  const attempt = loginAttempts.get(email)

  if (attempt) {
    // Reset after 15 minutes
    if (now - attempt.lastAttempt > 15 * 60 * 1000) {
      loginAttempts.delete(email)
      return true
    }

    // Block after 5 attempts
    if (attempt.count >= 5) {
      return false
    }

    attempt.count++
    attempt.lastAttempt = now
  } else {
    loginAttempts.set(email, { count: 1, lastAttempt: now })
  }

  return true
}

export async function login(email: string, password: string) {
  if (!email || !password) {
    return { error: "Email e senha são obrigatórios." }
  }

  const sanitizedEmail = email.trim().toLowerCase()

  if (!checkRateLimit(sanitizedEmail)) {
    return {
      error: "Muitas tentativas de login. Tente novamente em 15 minutos.",
    }
  }

  let colaborador
  try {
    ;[colaborador] = await db.select().from(colaboradores).where(eq(colaboradores.email, sanitizedEmail))
  } catch (dbError) {
    console.error("[v0] Database error during login:", dbError)
    return { error: "Erro ao processar login. Tente novamente." }
  }

  if (!colaborador) {
    return { error: "Email ou senha incorretos." }
  }

  let senhaValida = false
  const isBcryptHash = colaborador.senhaHash?.startsWith("$2a$") || colaborador.senhaHash?.startsWith("$2b$")

  if (isBcryptHash) {
    // Password is already hashed with bcrypt
    senhaValida = await bcrypt.compare(password, colaborador.senhaHash!)
  } else {
    // Password is in plain text - compare directly and migrate
    senhaValida = colaborador.senhaHash === password

    if (senhaValida) {
      // Migrate to bcrypt hash
      const hashedPassword = await bcrypt.hash(password, 10)
      await db.update(colaboradores).set({ senhaHash: hashedPassword }).where(eq(colaboradores.id, colaborador.id))

      console.log("[v0] Migrated password to bcrypt for user:", sanitizedEmail)
    }
  }

  if (!senhaValida) {
    return { error: "Email ou senha incorretos." }
  }

  // Todo papel exceto SuperAdmin precisa estar vinculado a uma empresa — um colaborador
  // sem empresa_id nesse caso é um dado inconsistente, não um login válido.
  if (colaborador.tipoAcesso !== "SuperAdmin" && !colaborador.empresaId) {
    console.error("[v0] Login bloqueado: colaborador sem empresa_id", { id: colaborador.id })
    return { error: "Sua conta está com um cadastro incompleto. Contate o administrador." }
  }

  // Clear rate limiting on successful login
  loginAttempts.delete(sanitizedEmail)

  await createSession({
    colaboradorId: colaborador.id,
    email: colaborador.email!,
    nomeCompleto: colaborador.nomeCompleto,
    tipoAcesso: colaborador.tipoAcesso!,
    empresaId: colaborador.empresaId,
    cnpj: colaborador.cnpj ?? undefined,
    salario: Number(colaborador.salario),
  })

  revalidatePath("/", "layout")

  if (colaborador.tipoAcesso === "Colaborador") {
    redirect("/meus-pagamentos")
  } else {
    redirect("/")
  }
}

export async function logout() {
  await destroySession()
  revalidatePath("/", "layout")
  redirect("/login")
}

export async function getUsuarioLogado() {
  return await getSession()
}

export async function redefinirSenha(senhaAtual: string, novaSenha: string) {
  const session = await getSession()

  if (!session?.colaboradorId) {
    return {
      success: false,
      error: "Usuário não autenticado",
    }
  }

  if (novaSenha.length < 8) {
    return {
      success: false,
      error: "A nova senha deve ter no mínimo 8 caracteres",
    }
  }

  if (!/[A-Z]/.test(novaSenha) || !/[a-z]/.test(novaSenha) || !/[0-9]/.test(novaSenha)) {
    return {
      success: false,
      error: "A senha deve conter letras maiúsculas, minúsculas e números",
    }
  }

  // Verificar senha atual
  const [colaborador] = await db
    .select({ senhaHash: colaboradores.senhaHash })
    .from(colaboradores)
    .where(eq(colaboradores.id, session.colaboradorId))

  if (!colaborador) {
    return {
      success: false,
      error: "Prestador não encontrado",
    }
  }

  let senhaAtualValida = false
  const isBcryptHash = colaborador.senhaHash?.startsWith("$2a$") || colaborador.senhaHash?.startsWith("$2b$")

  if (isBcryptHash) {
    senhaAtualValida = await bcrypt.compare(senhaAtual, colaborador.senhaHash!)
  } else {
    // Legacy plain text password
    senhaAtualValida = colaborador.senhaHash === senhaAtual
  }

  if (!senhaAtualValida) {
    return {
      success: false,
      error: "Senha atual incorreta",
    }
  }

  // Hash the new password
  const hashedPassword = await bcrypt.hash(novaSenha, 10)

  // Atualizar senha
  try {
    await db.update(colaboradores).set({ senhaHash: hashedPassword }).where(eq(colaboradores.id, session.colaboradorId))
  } catch (error) {
    return {
      success: false,
      error: "Erro ao atualizar senha: " + (error instanceof Error ? error.message : String(error)),
    }
  }

  return {
    success: true,
    message: "Senha atualizada com sucesso!",
  }
}
