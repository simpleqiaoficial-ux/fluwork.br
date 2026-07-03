import { getSupabaseServerClient } from "./supabase-server"
import { getSession } from "./session"

export async function getUsuarioLogado() {
  const session = await getSession()

  if (!session) return null

  const supabase = await getSupabaseServerClient()
  const { data: colaborador } = await supabase
    .from("colaboradores")
    .select("*")
    .eq("id", session.colaboradorId)
    .single()

  return colaborador
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
