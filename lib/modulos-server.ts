import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { empresaModulos } from "@/lib/db/schema"
import { MODULOS, MODULO_LABELS, NENHUM_BLOQUEIO, type Modulo, type ModulosBloqueados } from "@/lib/modulos"

// Funções server-only de módulos (tocam o banco via `pg`) — nunca importar isto de um
// componente "use client". Constantes/tipos compartilhados ficam em lib/modulos.ts.

/** Busca os módulos bloqueados de uma empresa. Sem linha na tabela = módulo liberado.
 *
 *  Chamada em toda navegação autenticada (app/layout.tsx) — se a migration da tabela
 *  `empresa_modulos` ainda não rodou nesse ambiente, falha em modo aberto (ninguém bloqueado)
 *  em vez de derrubar o app inteiro pra qualquer usuário de empresa. */
export async function getModulosBloqueadosDaEmpresa(empresaId: string): Promise<ModulosBloqueados> {
  let rows: (typeof empresaModulos.$inferSelect)[]
  try {
    rows = await db.select().from(empresaModulos).where(eq(empresaModulos.empresaId, empresaId))
  } catch (error) {
    console.error("[modulos] Erro ao buscar módulos bloqueados (tabela empresa_modulos existe? rodou a migration 0016?):", error)
    return { ...NENHUM_BLOQUEIO }
  }

  const resultado: ModulosBloqueados = { ...NENHUM_BLOQUEIO }
  for (const row of rows) {
    if (MODULOS.includes(row.modulo as Modulo)) {
      resultado[row.modulo as Modulo] = { motivo: row.motivo, bloqueadoEm: row.bloqueadoEm }
    }
  }
  return resultado
}

/** Lança erro amigável se o módulo estiver bloqueado pra essa empresa — usar no início de
 *  Server Actions de mutação sensíveis (defesa em profundidade além do gate de rota). */
export async function requireModuloLiberado(empresaId: string, modulo: Modulo): Promise<void> {
  const bloqueios = await getModulosBloqueadosDaEmpresa(empresaId)
  const bloqueio = bloqueios[modulo]
  if (bloqueio) {
    throw new Error(`Módulo ${MODULO_LABELS[modulo]} está bloqueado para sua empresa: ${bloqueio.motivo}`)
  }
}
