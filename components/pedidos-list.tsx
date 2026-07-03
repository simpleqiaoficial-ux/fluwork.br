import { listarPedidos, listarPedidosPorSupervisor, listarPedidosPorGerente } from "@/app/actions/pedidos"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PedidoItem } from "./pedido-item"
import { getSession } from "@/lib/session"

export async function PedidosList() {
  const session = await getSession()

  let pedidos
  if (session?.tipoAcesso === "Supervisor") {
    pedidos = await listarPedidosPorSupervisor(session.colaboradorId)
  } else if (session?.tipoAcesso === "Gerente") {
    pedidos = await listarPedidosPorGerente(session.colaboradorId)
  } else {
    pedidos = await listarPedidos()
  }

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle>Pedidos de Pagamento</CardTitle>
        <CardDescription>
          {pedidos.length} pedido{pedidos.length !== 1 ? "s" : ""} registrado{pedidos.length !== 1 ? "s" : ""}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {pedidos.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">Nenhum pedido criado ainda</p>
        ) : (
          <div className="max-h-[600px] overflow-y-auto pr-2 space-y-3">
            {pedidos.map((pedido) => (
              <PedidoItem key={pedido.id} pedido={pedido} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
