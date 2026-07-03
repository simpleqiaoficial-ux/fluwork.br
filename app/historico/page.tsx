import { listarPedidosPorSupervisor, listarPedidosPorGerente, listarPedidosParaCorrecao } from "@/app/actions/pedidos"
import { getSession } from "@/lib/session"
import { HistoricoList } from "@/components/historico-list"
import { redirect } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CorrecaoList } from "@/components/correcao-list"

export default async function HistoricoPage() {
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  if (session.tipoAcesso !== "Supervisor" && session.tipoAcesso !== "Adm" && session.tipoAcesso !== "Gerente") {
    redirect("/")
  }

  // Buscar pedidos dependendo do tipo de acesso
  let pedidos: any[] = []
  if (session.tipoAcesso === "Gerente") {
    pedidos = await listarPedidosPorGerente(session.colaboradorId)
  } else {
    pedidos = await listarPedidosPorSupervisor(session.colaboradorId)
  }

  const pedidosCorrecao = await listarPedidosParaCorrecao()

  return (
    <div className="container mx-auto px-4 lg:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold mb-1 text-foreground">Meus Pedidos</h1>
        <p className="text-sm text-muted-foreground">Acompanhe o status de todos os pedidos de pagamento que você criou</p>
      </div>

      <Tabs defaultValue="historico" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 h-10">
          <TabsTrigger value="historico" className="text-sm">Histórico</TabsTrigger>
          <TabsTrigger value="correcoes" className="relative text-sm">
            Correções Pendentes
            {pedidosCorrecao.length > 0 && (
              <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs font-semibold text-background bg-foreground rounded">
                {pedidosCorrecao.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="historico" className="mt-6">
          <HistoricoList pedidos={pedidos} />
        </TabsContent>

        <TabsContent value="correcoes" className="mt-6">
          <CorrecaoList pedidos={pedidosCorrecao} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
