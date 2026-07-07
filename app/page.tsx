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
import { LandingPage } from "@/components/landing/landing-page"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "FluWork — Tudo o que sua empresa precisa em um único lugar",
  description:
    "FluWork é o ecossistema empresarial que conecta, organiza e impulsiona sua operação: financeiro, prestadores de serviço, EHS, medicina ocupacional, documentos e muito mais, em uma única plataforma.",
  keywords: [
    "ecossistema empresarial",
    "plataforma de gestão empresarial",
    "gestão de prestadores de serviço",
    "EHS",
    "medicina ocupacional",
    "ASO",
    "gestão de documentos",
    "dashboard executivo",
    "software de gestão",
  ],
  openGraph: {
    title: "FluWork — Tudo o que sua empresa precisa em um único lugar",
    description:
      "Uma plataforma completa para conectar, organizar e impulsionar sua empresa. Módulos de financeiro, prestadores, EHS, ASO, documentos e muito mais.",
    type: "website",
    locale: "pt_BR",
    siteName: "FluWork",
    images: [{ url: "/fluwork-logo.png", width: 1200, height: 1200, alt: "FluWork" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "FluWork — Tudo o que sua empresa precisa em um único lugar",
    description: "Uma plataforma completa para conectar, organizar e impulsionar sua empresa.",
    images: ["/fluwork-logo.png"],
  },
  robots: { index: true, follow: true },
}

export default async function Home() {
  const session = await getSession()

  if (!session) {
    return <LandingPage />
  }

  if (session?.tipoAcesso === "Colaborador") {
    redirect("/meus-pagamentos")
  }

  // SuperAdmin não pertence a nenhuma empresa — o painel dele é outro, não esse dashboard
  // (que hoje mistura dados de todas as empresas quando visto sem escopo de uma só) — exceto
  // quando está "visualizando como empresa", caso em que este é exatamente o dashboard certo.
  if (session?.tipoAcesso === "SuperAdmin" && !session.viewAsEmpresaId) {
    redirect("/admin")
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

      <DashboardAnalytics pedidos={pedidos} equipes={equipes} prorrogacoesPendentes={prorrogacoesPendentes} />
    </div>
  )
}
