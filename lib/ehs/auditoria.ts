import { headers } from "next/headers"
import { desc, eq, and } from "drizzle-orm"
import { db } from "@/lib/db"
import { ehsAuditoria } from "@/lib/db/schema"

interface RegistrarAuditoriaParams {
  empresaId: string
  tabela: string
  registroId: string
  acao: "criado" | "atualizado" | "excluido"
  atorId?: string | null
  campo?: string | null
  valorAntigo?: string | null
  valorNovo?: string | null
}

/** Log técnico campo-a-campo do módulo EHS — best-effort, nunca derruba a operação principal
 *  se falhar (mesmo espírito do registrarAuditoria genérico em lib/audit.ts). */
export async function registrarAuditoriaEhs(params: RegistrarAuditoriaParams) {
  try {
    const headersList = await headers()
    const ip = headersList.get("x-forwarded-for")?.split(",")[0]?.trim() || headersList.get("x-real-ip") || undefined
    const userAgent = headersList.get("user-agent") || undefined
    await db.insert(ehsAuditoria).values({
      empresaId: params.empresaId,
      tabela: params.tabela,
      registroId: params.registroId,
      acao: params.acao,
      atorId: params.atorId ?? null,
      campo: params.campo ?? null,
      valorAntigo: params.valorAntigo ?? null,
      valorNovo: params.valorNovo ?? null,
      ip,
      userAgent,
    })
  } catch (error) {
    console.error("[ehs] Erro ao registrar auditoria:", error)
  }
}

/** Compara dois objetos rasos e registra uma linha de auditoria por campo que mudou. */
export async function registrarDiffAuditoriaEhs(
  base: Omit<RegistrarAuditoriaParams, "campo" | "valorAntigo" | "valorNovo" | "acao">,
  antes: Record<string, unknown>,
  depois: Record<string, unknown>,
) {
  for (const campo of Object.keys(depois)) {
    const valorAntigo = antes[campo]
    const valorNovo = depois[campo]
    if (valorNovo === undefined) continue
    if (String(valorAntigo ?? "") === String(valorNovo ?? "")) continue
    await registrarAuditoriaEhs({
      ...base,
      acao: "atualizado",
      campo,
      valorAntigo: valorAntigo === null || valorAntigo === undefined ? null : String(valorAntigo),
      valorNovo: valorNovo === null || valorNovo === undefined ? null : String(valorNovo),
    })
  }
}

/** Histórico de um registro específico — usado na aba "Histórico"/"Auditoria" de qualquer
 *  entidade do módulo (cliente, prestador, integração, documento...), sem precisar de uma
 *  consulta dedicada por entidade. */
export async function listarAuditoriaEhs(tabela: string, registroId: string) {
  const rows = await db.query.ehsAuditoria.findMany({
    where: and(eq(ehsAuditoria.tabela, tabela), eq(ehsAuditoria.registroId, registroId)),
    orderBy: [desc(ehsAuditoria.createdAt)],
    with: { ator: true },
  })
  return rows.map((row) => ({
    id: row.id,
    acao: row.acao,
    campo: row.campo,
    valor_antigo: row.valorAntigo,
    valor_novo: row.valorNovo,
    ator_nome: row.ator?.nomeCompleto || null,
    created_at: row.createdAt,
  }))
}
