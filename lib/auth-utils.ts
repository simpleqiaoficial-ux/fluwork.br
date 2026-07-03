import { eq } from "drizzle-orm"
import { db } from "./db"
import { colaboradores } from "./db/schema"
import { toColaboradorDTO } from "./db/mappers"
import { getSession } from "./session"

export async function getUsuarioLogado() {
  const session = await getSession()

  if (!session) return null

  const [colaborador] = await db.select().from(colaboradores).where(eq(colaboradores.id, session.colaboradorId))

  return colaborador ? toColaboradorDTO(colaborador) : null
}

export function podeAcessarRota(tipoAcesso: string, rota: string): boolean {
  const permissoes: Record<string, string[]> = {
    Adm: ["/", "/colaboradores", "/pedidos", "/aprovacoes"],
    Financeiro: ["/", "/aprovacoes", "/meus-pagamentos"],
    Gerente: ["/", "/aprovacoes", "/meus-pagamentos"],
    Supervisor: ["/", "/pedidos", "/meus-pagamentos"],
    Colaborador: ["/", "/meus-pagamentos"],
  }

  return permissoes[tipoAcesso]?.includes(rota) || false
}
