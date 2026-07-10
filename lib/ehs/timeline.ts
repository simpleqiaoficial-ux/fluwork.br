import { desc, eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { ehsTimelineEventos } from "@/lib/db/schema"

interface RegistrarTimelineParams {
  empresaId: string
  colaboradorId: string
  tipoEvento: string
  descricao: string
  atorId?: string | null
  detalhes?: Record<string, unknown>
}

/** Feed narrativo por prestador — best-effort, nunca derruba a operação principal se falhar. */
export async function registrarTimelineEhs(params: RegistrarTimelineParams) {
  try {
    await db.insert(ehsTimelineEventos).values({
      empresaId: params.empresaId,
      colaboradorId: params.colaboradorId,
      tipoEvento: params.tipoEvento,
      descricao: params.descricao,
      atorId: params.atorId ?? null,
      detalhes: params.detalhes ?? {},
    })
  } catch (error) {
    console.error("[ehs] Erro ao registrar timeline:", error)
  }
}

export async function listarTimelineEhs(colaboradorId: string) {
  const rows = await db.query.ehsTimelineEventos.findMany({
    where: eq(ehsTimelineEventos.colaboradorId, colaboradorId),
    orderBy: [desc(ehsTimelineEventos.createdAt)],
    with: { ator: true },
  })
  return rows.map((row) => ({
    id: row.id,
    tipo_evento: row.tipoEvento,
    descricao: row.descricao,
    detalhes: row.detalhes,
    ator_nome: row.ator?.nomeCompleto || null,
    created_at: row.createdAt,
  }))
}
