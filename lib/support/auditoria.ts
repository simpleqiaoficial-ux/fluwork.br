import crypto from "crypto"
import { headers } from "next/headers"
import { desc, eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { supportAuditLog } from "@/lib/db/schema"
import { toAuditoriaSuporteDTO } from "@/lib/db/mappers"

export type AcaoAuditoriaSuporte =
  | "TICKET_CREATED"
  | "TICKET_VIEWED"
  | "TICKET_ASSIGNED"
  | "STATUS_CHANGED"
  | "PRIORITY_CHANGED"
  | "MESSAGE_SENT"
  | "INTERNAL_NOTE_CREATED"
  | "ATTACHMENT_UPLOADED"
  | "TICKET_ESCALATED"
  | "TICKET_RETURNED"
  | "TICKET_RESOLVED"
  | "TICKET_CLOSED"
  | "TICKET_REOPENED"
  | "TICKET_ARCHIVED"
  | "DATA_ANONYMIZED"
  | "DATA_REMOVED"

interface RegistrarAuditoriaSuporteParams {
  ticketId: string
  acao: AcaoAuditoriaSuporte
  atorId?: string | null
  campo?: string | null
  valorAntigo?: string | null
  valorNovo?: string | null
}

/** Log técnico campo-a-campo do módulo de suporte — mesmo espírito de registrarAuditoriaEhs,
 *  mas guarda sha256(IP) em vez do IP cru (decisão explícita do usuário pra este módulo). */
export async function registrarAuditoriaSuporte(params: RegistrarAuditoriaSuporteParams) {
  try {
    const headersList = await headers()
    const ip = headersList.get("x-forwarded-for")?.split(",")[0]?.trim() || headersList.get("x-real-ip") || null
    const ipHash = ip ? crypto.createHash("sha256").update(ip).digest("hex") : null
    const userAgent = headersList.get("user-agent") || undefined
    await db.insert(supportAuditLog).values({
      ticketId: params.ticketId,
      acao: params.acao,
      atorId: params.atorId ?? null,
      campo: params.campo ?? null,
      valorAntigo: params.valorAntigo ?? null,
      valorNovo: params.valorNovo ?? null,
      ipHash,
      userAgent,
    })
  } catch (error) {
    console.error("[support] Erro ao registrar auditoria:", error)
  }
}

/** Compara dois objetos rasos e registra uma linha de auditoria por campo que mudou. */
export async function registrarDiffAuditoriaSuporte(
  ticketId: string,
  atorId: string | null,
  antes: Record<string, unknown>,
  depois: Record<string, unknown>,
) {
  for (const campo of Object.keys(depois)) {
    const valorAntigo = antes[campo]
    const valorNovo = depois[campo]
    if (valorNovo === undefined) continue
    if (String(valorAntigo ?? "") === String(valorNovo ?? "")) continue
    await registrarAuditoriaSuporte({
      ticketId,
      atorId,
      acao: "STATUS_CHANGED",
      campo,
      valorAntigo: valorAntigo === null || valorAntigo === undefined ? null : String(valorAntigo),
      valorNovo: valorNovo === null || valorNovo === undefined ? null : String(valorNovo),
    })
  }
}

/** Histórico completo de um chamado — só visível pra Adm do tenant e SuperAdmin (checado por
 *  quem chama, aqui não há filtro de tenant porque o ticketId já vem de uma leitura que
 *  passou por assertSameCompany). */
export async function listarAuditoriaTicket(ticketId: string) {
  const rows = await db.query.supportAuditLog.findMany({
    where: eq(supportAuditLog.ticketId, ticketId),
    orderBy: [desc(supportAuditLog.createdAt)],
    with: { ator: true },
  })
  return rows.map(toAuditoriaSuporteDTO)
}
