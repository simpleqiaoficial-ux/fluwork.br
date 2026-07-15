"use server"

import { revalidatePath } from "next/cache"
import { and, asc, eq, sql } from "drizzle-orm"
import { db } from "@/lib/db"
import { supportTickets, supportAttachments } from "@/lib/db/schema"
import { getTenantScope, assertNaoImpersonando } from "@/lib/tenant"
import { uploadFile } from "@/lib/gcs"
import { toAnexoSuporteDTO } from "@/lib/db/mappers"
import { registrarAuditoriaSuporte } from "@/lib/support/auditoria"

const TAMANHO_MAXIMO = 10 * 1024 * 1024 // 10MB
const TIPOS_ARQUIVO_PERMITIDOS = ["application/pdf", "image/jpeg", "image/png"]

function sanitizarNomeArquivo(nome: string) {
  return nome
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .toLowerCase()
}

function inferirContentType(fileNameLower: string, declarado: string): string {
  if (TIPOS_ARQUIVO_PERMITIDOS.includes(declarado)) return declarado
  if (fileNameLower.endsWith(".pdf")) return "application/pdf"
  if (fileNameLower.endsWith(".png")) return "image/png"
  if (fileNameLower.endsWith(".jpg") || fileNameLower.endsWith(".jpeg")) return "image/jpeg"
  return declarado
}

/** Confere a assinatura binária real do arquivo (primeiros bytes) em vez de confiar só no
 *  Content-Type/extensão declarados pelo navegador — MIME e extensão são só metadados que
 *  quem envia controla; a assinatura é o próprio conteúdo. */
function assinaturaBateComTipo(buffer: Buffer, contentType: string): boolean {
  if (buffer.length < 4) return false
  if (contentType === "application/pdf") return buffer.toString("ascii", 0, 4) === "%PDF"
  if (contentType === "image/jpeg") return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff
  if (contentType === "image/png") return buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47
  return false
}

export async function anexarArquivoTicket(ticketId: string, formData: FormData, messageId?: string) {
  try {
    const scope = await getTenantScope()
    await assertNaoImpersonando()

    const ticket = await db.query.supportTickets.findFirst({ where: eq(supportTickets.id, ticketId) })
    if (!ticket) return { success: false, error: "Chamado não encontrado" }

    const ehDono = ticket.criadoPorId === scope.usuario.id
    const ehAgente = scope.isSuperAdmin || (scope.usuario.tipo_acesso === "Adm" && ticket.empresaId === scope.usuario.empresa_id)
    if (!ehDono && !ehAgente) return { success: false, error: "Sem permissão para anexar arquivos neste chamado" }

    const file = formData.get("file") as File | null
    if (!file) return { success: false, error: "Selecione um arquivo" }
    if (file.size > TAMANHO_MAXIMO) return { success: false, error: "Arquivo muito grande. Máximo 10MB" }

    const fileNameLower = file.name.toLowerCase()
    const contentType = inferirContentType(fileNameLower, file.type)
    if (!TIPOS_ARQUIVO_PERMITIDOS.includes(contentType)) {
      return { success: false, error: "Envie um arquivo PDF, JPG ou PNG" }
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    if (!assinaturaBateComTipo(buffer, contentType)) {
      return { success: false, error: "O conteúdo do arquivo não corresponde ao tipo esperado" }
    }

    const nomeSanitizado = sanitizarNomeArquivo(file.name)
    const objectPath = await uploadFile(buffer, `suporte/${ticketId}/${Date.now()}-${nomeSanitizado}`, contentType)

    const [novoAnexo] = await db
      .insert(supportAttachments)
      .values({
        ticketId,
        messageId: messageId || null,
        enviadoPorId: scope.usuario.id,
        objectPath,
        nomeOriginal: file.name,
        nomeSanitizado,
        contentType,
        tamanhoBytes: file.size,
      })
      .returning()

    await registrarAuditoriaSuporte({ ticketId, acao: "ATTACHMENT_UPLOADED", atorId: scope.usuario.id, campo: "anexo", valorNovo: nomeSanitizado })

    revalidatePath(`/suporte/${ticketId}`)
    return { success: true, anexo: toAnexoSuporteDTO(novoAnexo) }
  } catch (error) {
    console.error("[support] Erro no upload de anexo:", error)
    return { success: false, error: error instanceof Error ? error.message : "Erro ao enviar anexo" }
  }
}

export async function listarAnexosTicket(ticketId: string) {
  const scope = await getTenantScope()

  const ticket = await db.query.supportTickets.findFirst({ where: eq(supportTickets.id, ticketId) })
  if (!ticket) throw new Error("Chamado não encontrado")

  const ehDono = ticket.criadoPorId === scope.usuario.id
  const ehAgente = scope.isSuperAdmin || (scope.usuario.tipo_acesso === "Adm" && ticket.empresaId === scope.usuario.empresa_id)
  if (!ehDono && !ehAgente) throw new Error("Sem permissão para acessar este chamado")

  const rows = await db.query.supportAttachments.findMany({
    where: and(eq(supportAttachments.ticketId, ticketId), sql`${supportAttachments.excluidoEm} IS NULL`),
    orderBy: [asc(supportAttachments.createdAt)],
  })
  return rows.map(toAnexoSuporteDTO)
}

export async function removerAnexo(anexoId: string) {
  const scope = await getTenantScope()
  await assertNaoImpersonando()

  const anexo = await db.query.supportAttachments.findFirst({ where: eq(supportAttachments.id, anexoId) })
  if (!anexo) return { success: false, error: "Anexo não encontrado" }

  const ticket = await db.query.supportTickets.findFirst({ where: eq(supportTickets.id, anexo.ticketId) })
  if (!ticket) return { success: false, error: "Chamado não encontrado" }

  const ehDonoDoAnexo = anexo.enviadoPorId === scope.usuario.id
  const ehAgente = scope.isSuperAdmin || (scope.usuario.tipo_acesso === "Adm" && ticket.empresaId === scope.usuario.empresa_id)
  if (!ehDonoDoAnexo && !ehAgente) return { success: false, error: "Sem permissão para remover este anexo" }

  await db.update(supportAttachments).set({ excluidoEm: new Date() }).where(eq(supportAttachments.id, anexoId))

  revalidatePath(`/suporte/${anexo.ticketId}`)
  return { success: true }
}
