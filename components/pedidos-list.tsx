import { listarPedidos, listarPedidosPorSupervisor, listarPedidosPorGerente } from "@/app/actions/pedidos"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getSession } from "@/lib/session"
import { formatCurrency } from "@/lib/utils"
import { EmptyState } from "@/components/ui/empty-state"
import { Inbox } from "lucide-react"

function formatDateBR(dateString: string) {
  return new Date(dateString).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

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
    <div>
      <h2 className="text-sm font-medium">Pedidos de pagamento</h2>
      <p className="text-xs text-muted-foreground mt-1 mb-4">
        {pedidos.length} pedido{pedidos.length !== 1 ? "s" : ""} registrado{pedidos.length !== 1 ? "s" : ""}
      </p>

      {pedidos.length === 0 ? (
        <EmptyState icon={Inbox} title="Nenhum pedido criado ainda" />
      ) : (
        <div className="rounded-lg border max-h-[600px] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Prestador</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Valor total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pedidos.map((pedido) => {
                const colaboradorNome = pedido.colaborador?.nome_completo || "N/A"
                const isReembolsoKm = pedido.tipo_pedido === "reembolso_km"

                return (
                  <TableRow key={pedido.id}>
                    <TableCell className="font-medium">{colaboradorNome}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDateBR(pedido.created_at)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-normal">
                        {isReembolsoKm ? "Reembolso KM" : "Completo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">
                      {formatCurrency(pedido.valor_total)}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
