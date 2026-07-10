"use server"

import { and, eq, ne } from "drizzle-orm"
import { db } from "@/lib/db"
import { colaboradores } from "@/lib/db/schema"
import { getSession, updateSession } from "@/lib/session"
import { uploadFile } from "@/lib/gcs"
import { revalidatePath } from "next/cache"

export interface AtualizarPerfilInput {
  nome_completo?: string
  email?: string
  data_nascimento?: string | null
}

// Auto-serviço: qualquer papel logado edita só a própria linha (session.colaboradorId), nunca
// outro cadastro, e só os campos de "Dados pessoais" (nome, email, nascimento) + a foto (ver
// uploadFotoPerfil abaixo). CNPJ/razão social/endereço e chave PIX ficam de fora de propósito:
// são dados fiscais/de pagamento que o financeiro precisa poder confiar sem depender de o que o
// próprio prestador digitou por último — mudam de mão via app/actions/colaboradores.ts
// (atualizarColaborador, restrito a Adm/Financeiro/SuperAdmin). O mesmo vale pros campos
// administrativos (tipo_acesso, salário, equipe, dia de pagamento): abrir qualquer um desses pro
// auto-serviço seria escalonamento de privilégio ou risco de fraude no destino do pagamento.
export async function atualizarMeuPerfil(data: AtualizarPerfilInput) {
  const session = await getSession()
  if (!session) {
    return { success: false, error: "Usuário não autenticado" }
  }

  const updateData: Record<string, unknown> = {}
  const sessionUpdate: Record<string, unknown> = {}

  if (data.nome_completo !== undefined) {
    const nome = data.nome_completo.trim()
    if (!nome) {
      return { success: false, error: "Nome não pode ficar vazio" }
    }
    updateData.nomeCompleto = nome
    sessionUpdate.nomeCompleto = nome
  }

  if (data.email !== undefined) {
    const email = data.email.trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { success: false, error: "Email inválido" }
    }
    const [existente] = await db
      .select({ id: colaboradores.id })
      .from(colaboradores)
      .where(and(eq(colaboradores.email, email), ne(colaboradores.id, session.colaboradorId)))
    if (existente) {
      return { success: false, error: "Este email já está em uso por outra conta" }
    }
    updateData.email = email
    sessionUpdate.email = email
  }

  if (data.data_nascimento !== undefined) updateData.dataNascimento = data.data_nascimento || null

  if (Object.keys(updateData).length === 0) {
    return { success: true }
  }

  try {
    await db.update(colaboradores).set(updateData).where(eq(colaboradores.id, session.colaboradorId))
  } catch (error) {
    console.error("[v0] Erro ao atualizar perfil:", error)
    return { success: false, error: "Erro ao salvar seus dados. Tente novamente." }
  }

  if (Object.keys(sessionUpdate).length > 0) {
    await updateSession(sessionUpdate)
  }

  revalidatePath("/perfil")
  revalidatePath("/", "layout")
  return { success: true }
}

export async function uploadFotoPerfil(formData: FormData) {
  const session = await getSession()
  if (!session) {
    return { success: false as const, error: "Usuário não autenticado" }
  }

  const file = formData.get("file") as File | null
  if (!file) {
    return { success: false as const, error: "Nenhuma imagem fornecida" }
  }

  const fileName = file.name.toLowerCase()
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"]
  const hasValidExtension =
    fileName.endsWith(".jpg") || fileName.endsWith(".jpeg") || fileName.endsWith(".png") || fileName.endsWith(".webp")
  if (!allowedTypes.includes(file.type) && !hasValidExtension) {
    return { success: false as const, error: "Envie uma imagem JPG, PNG ou WEBP" }
  }

  const maxSize = 5 * 1024 * 1024 // 5MB
  if (file.size > maxSize) {
    return { success: false as const, error: "Imagem muito grande. Máximo 5MB" }
  }

  const ext = fileName.endsWith(".png") ? "png" : fileName.endsWith(".webp") ? "webp" : "jpg"
  const contentType = file.type || (ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg")
  const timestamp = Date.now()

  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    const objectPath = await uploadFile(buffer, `colaboradores-fotos/${session.colaboradorId}-${timestamp}.${ext}`, contentType)
    const url = `/api/files/${objectPath}`

    await db.update(colaboradores).set({ fotoUrl: url }).where(eq(colaboradores.id, session.colaboradorId))
    await updateSession({ fotoUrl: url })

    revalidatePath("/perfil")
    revalidatePath("/", "layout")
    return { success: true as const, url }
  } catch (error) {
    console.error("[v0] Erro no upload da foto de perfil:", error)
    return { success: false as const, error: "Erro ao enviar a imagem. Tente novamente." }
  }
}
