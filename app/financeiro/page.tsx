import { listarPedidosSemNota, listarPedidosComNota, listarSolicitacoesProrrogacao } from "@/app/actions/pedidos"
import { getUsuarioLogado } from "@/lib/auth-utils"
import { podeVisualizarPagina } from "@/lib/tenant"
import { PedidosSemNotaList } from "@/components/pedidos-sem-nota-list"
import { MarcarPagoList } from "@/components/marcar-pago-list"
import { SolicitacoesProrrogacaoList } from "@/components/solicitacoes-prorrogacao-list"
import { redirect } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileWarning, CreditCard, Clock } from "lucide-react"

export default async function FinanceiroPage({
  searchParams,
}: {
  searchParams: Promise<{
    tab?: string
    dataInicio?: string
    dataFim?: string
    colaboradorNome?: string
    equipeId?: string
  }>
}) {
  const usuario = await getUsuarioLogado()

  if (!usuario) {
    redirect("/login")
  }

  if (!podeVisualizarPagina(usuario, ["Financeiro", "Adm"])) {
    redirect("/")
  }

  const params = await searchParams

  const filtros = {
    dataInicio: params.dataInicio,
    dataFim: params.dataFim,
    colaboradorNome: params.colaboradorNome,
    equipeId: params.equipeId,
  }

  let pedidosSemNota: any[] = []
  let pedidosComNota: any[] = []
  let solicitacoes: any[] = []

  try {
    const [semNota, comNota, prorro] = await Promise.allSettled([
      listarPedidosSemNota(filtros),
      listarPedidosComNota(filtros),
      listarSolicitacoesProrrogacao(),
    ])
    pedidosSemNota = semNota.status === "fulfilled" ? semNota.value : []
    pedidosComNota = comNota.status === "fulfilled" ? comNota.value : []
    solicitacoes = prorro.status === "fulfilled" ? prorro.value : []
  } catch (error) {
    console.error("[v0] Erro ao carregar dados financeiro:", error)
  }

  const defaultTab = params.tab || "pagar"

  return (
    <div className="container mx-auto px-4 lg:px-6 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold mb-1 text-foreground">Painel Financeiro</h1>
        <p className="text-sm text-muted-foreground">Gerencie pagamentos, notas fiscais e prorrogações</p>
      </div>

      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="grid w-full max-w-2xl grid-cols-3 h-10">
          <TabsTrigger value="pagar" className="flex items-center gap-2 text-sm">
            <CreditCard className="w-4 h-4" />
            <span className="hidden sm:inline">Notas Recebidas</span>
            <span className="sm:hidden">Notas</span>
            {pedidosComNota.length > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded bg-foreground text-xs font-semibold text-background px-1.5">
                {pedidosComNota.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="sem-nota" className="flex items-center gap-2 text-sm">
            <FileWarning className="w-4 h-4" />
            <span className="hidden sm:inline">Sem Nota</span>
            <span className="sm:hidden">Sem Nota</span>
            {pedidosSemNota.length > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded bg-foreground text-xs font-semibold text-background px-1.5">
                {pedidosSemNota.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="prorrogacoes" className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4" />
            <span className="hidden sm:inline">Prorrogações</span>
            <span className="sm:hidden">Prorrog.</span>
            {solicitacoes.length > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded bg-foreground text-xs font-semibold text-background px-1.5">
                {solicitacoes.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pagar" className="mt-6">
          <MarcarPagoList pedidos={pedidosComNota} />
        </TabsContent>
        <TabsContent value="sem-nota" className="mt-6">
          <PedidosSemNotaList pedidos={pedidosSemNota} />
        </TabsContent>
        <TabsContent value="prorrogacoes" className="mt-6">
          <SolicitacoesProrrogacaoList solicitacoes={solicitacoes} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
