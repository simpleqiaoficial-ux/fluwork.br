import { eq } from "drizzle-orm"
import { db } from "./db"
import { colaboradores } from "./db/schema"
import { toColaboradorDTO } from "./db/mappers"
import { getSession } from "./session"

export async function getUsuarioLogado() {
  const session = await getSession()

  if (!session) return null

  const [colaborador] = await db.select().from(colaboradores).where(eq(colaboradores.id, session.colaboradorId))
  if (!colaborador) return null

  // view_as_empresa_id só existe na sessão (não é uma coluna de colaboradores) — anexado
  // aqui pra todo call site que já usa getUsuarioLogado() poder checar via
  // lib/tenant.ts:getEffectiveEmpresaId sem precisar ler a sessão de novo.
  return { ...toColaboradorDTO(colaborador), view_as_empresa_id: session.viewAsEmpresaId ?? null }
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
