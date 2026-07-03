import {
  listarPedidosComFiltros,
  listarPedidosPorSupervisor,
  listarPedidosPorGerente,
  listarSolicitacoesProrrogacao,
} from "./actions/pedidos"
import { listarEquipes, listarEquipesPorGerente } from "./actions/equipes"
import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"
import { DashboardAnalytics } from "@/components/dashboard-analytics"
import { SystemControl } from "@/components/system-control"

export default async function Home() {
  const session = await getSession()

  if (session?.tipoAcesso === "Colaborador") {
    redirect("/meus-pagamentos")
  }

  let pedidos: any[] = []
  let equipes: Array<{ id: string; nome: string }> = []

  try {
    if (session?.tipoAcesso === "Supervisor") {
      pedidos = await listarPedidosPorSupervisor(session.colaboradorId)
    } else if (session?.tipoAcesso === "Gerente") {
      pedidos = await listarPedidosPorGerente(session.colaboradorId, {})
    } else {
      pedidos = await listarPedidosComFiltros({})
    }
  } catch (error) {
    console.error("[v0] Erro ao listar pedidos:", error)
  }

  try {
    if (session?.tipoAcesso === "Gerente") {
      equipes = (await listarEquipesPorGerente(session.colaboradorId)).map((e) => ({ id: e.id, nome: e.nome }))
    } else {
      equipes = (await listarEquipes()).map((e) => ({ id: e.id, nome: e.nome }))
    }
  } catch (error) {
    console.error("[v0] Erro ao listar equipes:", error)
  }

  const isAdmin = session?.tipoAcesso === "Adm"

  let prorrogacoesPendentes = 0
  if (session?.tipoAcesso === "Adm" || session?.tipoAcesso === "Financeiro") {
    try {
      prorrogacoesPendentes = (await listarSolicitacoesProrrogacao()).length
    } catch (error) {
      console.error("[v0] Erro ao contar prorrogacoes pendentes:", error)
    }
  }

  return (
    <div className="container mx-auto py-8 px-4 lg:px-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold mb-1 text-foreground">Visão Geral</h1>
        <p className="text-sm text-muted-foreground">Panorama de contratos, valores e aprovações de prestadores</p>
      </div>

      {isAdmin && (
        <div className="mb-8">
          <SystemControl />
        </div>
      )}

      <DashboardAnalytics pedidos={pedidos} equipes={equipes} prorrogacoesPendentes={prorrogacoesPendentes} />
    </div>
  )
}
