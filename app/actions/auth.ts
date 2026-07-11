"use server"

import { eq, and, gt } from "drizzle-orm"
import { db } from "@/lib/db"
import { colaboradores } from "@/lib/db/schema"
import { createSession, destroySession, getSession } from "@/lib/session"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import bcrypt from "bcryptjs"
import crypto from "crypto"
import { sendRecuperarSenhaEmail } from "@/lib/email"

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
    fotoUrl: colaborador.fotoUrl ?? undefined,
  })

  revalidatePath("/", "layout")

  // Não chama redirect() aqui — o client component que chama login() precisa distinguir
  // sucesso de erro num try/catch, e um redirect() lançado dentro desse try acaba sendo
  // capturado como se fosse uma falha de login (o "erro ao fazer login" que aparecia mesmo
  // com a senha certa). Devolve o destino e deixa o client navegar com router.push().
  if (colaborador.tipoAcesso === "Colaborador") {
    return { redirectTo: "/meus-pagamentos" }
  } else if (colaborador.tipoAcesso === "SuperAdmin") {
    return { redirectTo: "/admin" }
  }
  return { redirectTo: "/" }
}

export async function logout() {
  await destroySession()
  revalidatePath("/", "layout")
  redirect("/login")
}

export async function getUsuarioLogado() {
  return await getSession()
}

const resetAttempts = new Map<string, { count: number; lastAttempt: number }>()

function checkResetRateLimit(email: string): boolean {
  const now = Date.now()
  const attempt = resetAttempts.get(email)
  if (attempt) {
    if (now - attempt.lastAttempt > 15 * 60 * 1000) {
      resetAttempts.delete(email)
      return true
    }
    if (attempt.count >= 3) return false
    attempt.count++
    attempt.lastAttempt = now
  } else {
    resetAttempts.set(email, { count: 1, lastAttempt: now })
  }
  return true
}

function hashResetToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex")
}

const MENSAGEM_GENERICA_RECUPERACAO = "Se este e-mail estiver cadastrado, você vai receber um link para redefinir sua senha em instantes."

// Não existe mais autoatendimento de troca de senha dentro do app (era só entrar já logado e
// trocar) — agora é sempre "esqueci minha senha" a partir do login, por e-mail, com link
// pessoal e de uso único. Resposta é sempre genérica (mesmo se o e-mail não existir) pra não
// vazar quais e-mails têm conta na plataforma.
export async function solicitarRecuperacaoSenha(email: string) {
  const sanitizedEmail = email.trim().toLowerCase()
  if (!sanitizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sanitizedEmail)) {
    return { success: false, error: "Informe um e-mail válido" }
  }

  if (!checkResetRateLimit(sanitizedEmail)) {
    return { success: false, error: "Muitas solicitações. Tente novamente em alguns minutos." }
  }

  const [colaborador] = await db
    .select({ id: colaboradores.id, nomeCompleto: colaboradores.nomeCompleto, email: colaboradores.email })
    .from(colaboradores)
    .where(eq(colaboradores.email, sanitizedEmail))

  if (colaborador?.email) {
    const rawToken = crypto.randomBytes(32).toString("hex")
    const expiraEm = new Date(Date.now() + 60 * 60 * 1000) // 1 hora

    await db
      .update(colaboradores)
      .set({ resetToken: hashResetToken(rawToken), resetTokenExpiraEm: expiraEm })
      .where(eq(colaboradores.id, colaborador.id))

    const resetUrl = `${process.env.APP_BASE_URL || ""}/redefinir-senha/${rawToken}`
    try {
      await sendRecuperarSenhaEmail({
        to: colaborador.email,
        nomeCompleto: colaborador.nomeCompleto,
        resetUrl,
        expiraEmFormatado: "1 hora",
      })
    } catch (error) {
      console.error("[v0] Erro ao enviar e-mail de recuperação de senha:", error)
    }
  }

  return { success: true, message: MENSAGEM_GENERICA_RECUPERACAO }
}

export async function validarTokenRecuperacaoSenha(token: string) {
  if (!token) return false
  const [colaborador] = await db
    .select({ id: colaboradores.id })
    .from(colaboradores)
    .where(and(eq(colaboradores.resetToken, hashResetToken(token)), gt(colaboradores.resetTokenExpiraEm, new Date())))
  return Boolean(colaborador)
}

export async function redefinirSenhaComToken(token: string, novaSenha: string) {
  if (!token) {
    return { success: false, error: "Link inválido" }
  }

  if (novaSenha.length < 8) {
    return { success: false, error: "A nova senha deve ter no mínimo 8 caracteres" }
  }
  if (!/[A-Z]/.test(novaSenha) || !/[a-z]/.test(novaSenha) || !/[0-9]/.test(novaSenha)) {
    return { success: false, error: "A senha deve conter letras maiúsculas, minúsculas e números" }
  }

  const [colaborador] = await db
    .select({ id: colaboradores.id })
    .from(colaboradores)
    .where(and(eq(colaboradores.resetToken, hashResetToken(token)), gt(colaboradores.resetTokenExpiraEm, new Date())))

  if (!colaborador) {
    return { success: false, error: "Este link é inválido ou já expirou. Solicite um novo." }
  }

  const hashedPassword = await bcrypt.hash(novaSenha, 10)

  try {
    await db
      .update(colaboradores)
      .set({ senhaHash: hashedPassword, resetToken: null, resetTokenExpiraEm: null })
      .where(eq(colaboradores.id, colaborador.id))
  } catch (error) {
    return { success: false, error: "Erro ao atualizar senha. Tente novamente." }
  }

  return { success: true, message: "Senha redefinida com sucesso! Faça login com sua nova senha." }
}
