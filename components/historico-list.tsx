"use client"

import type { PedidoPagamento } from "@/types/pedido"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils"
import { Clock, CheckCircle, XCircle, AlertCircle, Percent, Car } from "lucide-react"

interface HistoricoListProps {
  pedidos: PedidoPagamento[]
}

export function HistoricoList({ pedidos }: HistoricoListProps) {
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pendente_gerente: { label: "Aguardando Gerente", variant: "secondary" as const, icon: Clock },
      pendente_financeiro: { label: "Aguardando Financeiro", variant: "secondary" as const, icon: Clock },
      aprovado: { label: "Aprovado", variant: "default" as const, icon: CheckCircle },
      pago: { label: "Pago", variant: "default" as const, icon: CheckCircle },
      nota_recebida: { label: "Nota Recebida", variant: "default" as const, icon: CheckCircle },
      recusado: { label: "Recusado", variant: "destructive" as const, icon: XCircle },
      correcao: { label: "Correção Solicitada", variant: "outline" as const, icon: AlertCircle },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || {
      label: status,
      variant: "secondary" as const,
      icon: Clock,
    }
    const Icon = config.icon

    return (
      <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    )
  }

  if (pedidos.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">Nenhum pedido criado ainda</p>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {pedidos.map((pedido) => {
        const colaboradorNome = pedido.colaborador?.nome_completo || "N/A"
        const colaboradorSalario = pedido.colaborador?.salario || 0
        const isReembolsoKm = pedido.tipo_pedido === "reembolso_km"

        return (
          <Card key={pedido.id} className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-lg">{colaboradorNome}</h3>
                  {isReembolsoKm && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Car className="w-3 h-3" />
                      Reembolso KM
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  Criado em {new Date(pedido.created_at).toLocaleDateString("pt-BR")}
                </p>
              </div>
              {getStatusBadge(pedido.status)}
            </div>

            {isReembolsoKm ? (
              // Apenas quilometragem para reembolso KM
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-muted-foreground">Quilometragem</p>
                  <p className="font-semibold">{formatCurrency(pedido.valor_km)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Valor Total</p>
                  <p className="font-semibold text-lg text-primary">{formatCurrency(pedido.valor_total)}</p>
                </div>
              </div>
            ) : (
              // Todos os campos para pedido completo
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Salário Base</p>
                    <p className="font-semibold">{formatCurrency(colaboradorSalario)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Horas Extras</p>
                    <p className="font-semibold">{formatCurrency(pedido.horas_extras)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Quilometragem</p>
                    <p className="font-semibold">{formatCurrency(pedido.valor_km)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Valor Total</p>
                    <p className="font-semibold text-lg text-primary">{formatCurrency(pedido.valor_total)}</p>
                  </div>
                </div>

                {pedido.valor_desconto && pedido.valor_desconto > 0 && (
                  <div className="mb-4 p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-md">
                    <div className="flex items-center gap-2 mb-2">
                      <Percent className="w-5 h-5 text-red-600 dark:text-red-400" />
                      <p className="text-sm font-medium text-red-900 dark:text-red-100">Desconto Aplicado</p>
                    </div>
                    <p className="text-lg font-semibold text-red-700 dark:text-red-300 mb-2">
                      - {formatCurrency(pedido.valor_desconto)}
                    </p>
                    {pedido.motivo_desconto && (
                      <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded">
                        <p className="text-xs font-medium text-amber-900 dark:text-amber-100">Motivo:</p>
                        <p className="text-sm text-amber-800 dark:text-amber-200">{pedido.motivo_desconto}</p>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {pedido.observacao_gerente && (
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md">
                <p className="text-sm font-medium mb-1 text-blue-900 dark:text-blue-100">Observação do Gerente:</p>
                <p className="text-sm text-blue-800 dark:text-blue-200">{pedido.observacao_gerente}</p>
              </div>
            )}

            {pedido.observacao_financeiro && (
              <div className="mt-4 p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-md">
                <p className="text-sm font-medium mb-1 text-green-900 dark:text-green-100">Observação do Financeiro:</p>
                <p className="text-sm text-green-800 dark:text-green-200">{pedido.observacao_financeiro}</p>
              </div>
            )}
          </Card>
        )
      })}
    </div>
  )
}
