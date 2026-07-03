import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"
import { listarPedidosComNotaPendente } from "@/app/actions/pedidos"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, FileText, User, Calendar, DollarSign } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

export default async function AcompanhamentoPage() {
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  // Apenas Supervisor, Gerente e Financeiro podem acessar
  if (!["Supervisor", "Gerente", "Financeiro", "Adm"].includes(session.tipoAcesso)) {
    redirect("/")
  }

  const pedidosPendentes = await listarPedidosComNotaPendente()

  const calcularDiasDesdeAprovacao = (dataAprovacao: string | null) => {
    if (!dataAprovacao) return 0
    const hoje = new Date()
    const dataAprov = new Date(dataAprovacao)
    const diffTime = Math.abs(hoje.getTime() - dataAprov.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Acompanhamento de Pedidos</h1>
          <p className="text-muted-foreground">
            Monitore colaboradores que ainda não emitiram ou anexaram a nota fiscal após aprovação
          </p>
        </div>

        {pedidosPendentes.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium mb-2">Nenhuma pendência encontrada</p>
              <p className="text-sm text-muted-foreground">
                Todos os colaboradores estão em dia com suas notas fiscais
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <Card className="border-destructive bg-destructive/5">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-destructive" />
                  <CardTitle className="text-destructive">Notas Fiscais Pendentes</CardTitle>
                </div>
                <CardDescription>
                  {pedidosPendentes.length}{" "}
                  {pedidosPendentes.length === 1 ? "colaborador precisa" : "colaboradores precisam"} emitir e anexar
                  nota fiscal
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {pedidosPendentes.map((pedido) => {
                  const diasDesdeAprovacao = calcularDiasDesdeAprovacao(pedido.data_aprovacao_financeiro)

                  return (
                    <Card key={pedido.id} className="border-destructive/20">
                      <CardContent className="pt-6">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <User className="w-4 h-4 text-muted-foreground" />
                              <span className="font-semibold">{pedido.colaborador?.nome_completo}</span>
                              <Badge variant="destructive" className="text-xs">
                                Pendente
                              </Badge>
                            </div>

                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                <span>
                                  Aprovado em{" "}
                                  {pedido.data_aprovacao_financeiro
                                    ? new Date(pedido.data_aprovacao_financeiro).toLocaleDateString("pt-BR", {
                                        day: "2-digit",
                                        month: "2-digit",
                                        year: "numeric",
                                      })
                                    : "N/A"}
                                </span>
                                {diasDesdeAprovacao > 0 && <span>({diasDesdeAprovacao} dias atrás)</span>}
                              </div>

                              <div className="flex items-center gap-1">
                                <DollarSign className="w-3 h-3" />
                                <span>{formatCurrency(pedido.valor_total)}</span>
                              </div>
                            </div>
                          </div>

                          <div className="text-sm text-destructive font-medium">Aguardando nota fiscal</div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}
