"use client"

import { useState } from "react"
import type { PedidoPagamento } from "@/types/pedido"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatCurrency } from "@/lib/utils"
import { ChevronDown, ChevronUp } from "lucide-react"

interface HistoricoListProps {
  pedidos: PedidoPagamento[]
}

const STATUS_LABELS: Record<string, string> = {
  pendente_gerente: "Aguardando Gerente",
  pendente_financeiro: "Aguardando Financeiro",
  aprovado: "Aprovado",
  pago: "Pago",
  nota_recebida: "Nota Recebida",
  recusado: "Recusado",
  correcao: "Correção Solicitada",
}

const STATUS_VARIANT: Record<string, "outline" | "success" | "destructive" | "warning"> = {
  pendente_gerente: "outline",
  pendente_financeiro: "outline",
  aprovado: "success",
  pago: "success",
  nota_recebida: "success",
  recusado: "destructive",
  correcao: "warning",
}

export function HistoricoList({ pedidos }: HistoricoListProps) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null)

  if (pedidos.length === 0) {
    return (
      <div className="flex items-center justify-center py-16 text-center">
        <p className="text-muted-foreground text-sm">Nenhum pedido criado ainda</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Prestador</TableHead>
            <TableHead>Criado em</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Valor total</TableHead>
            <TableHead className="w-8" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {pedidos.map((pedido) => {
            const colaboradorNome = pedido.colaborador?.nome_completo || "N/A"
            const colaboradorSalario = pedido.colaborador?.salario || 0
            const isReembolsoKm = pedido.tipo_pedido === "reembolso_km"
            const isExpanded = expandedRow === pedido.id

            return (
              <>
                <TableRow
                  key={pedido.id}
                  className="cursor-pointer"
                  onClick={() => setExpandedRow(isExpanded ? null : pedido.id)}
                >
                  <TableCell className="font-medium">{colaboradorNome}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(pedido.created_at).toLocaleDateString("pt-BR")}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-normal">
                      {isReembolsoKm ? "Reembolso KM" : "Completo"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[pedido.status] || "outline"} className="font-normal">
                      {STATUS_LABELS[pedido.status] || pedido.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-semibold tabular-nums">
                    {formatCurrency(pedido.valor_total)}
                  </TableCell>
                  <TableCell>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </TableCell>
                </TableRow>

                {isExpanded && (
                  <TableRow key={`${pedido.id}-detail`}>
                    <TableCell colSpan={6} className="bg-muted/20 px-6 py-5">
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-4 text-sm">
                          {isReembolsoKm ? (
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Quilometragem</p>
                              <p className="font-medium tabular-nums">{formatCurrency(pedido.valor_km)}</p>
                            </div>
                          ) : (
                            <>
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Valor Contratual Base</p>
                                <p className="font-medium tabular-nums">{formatCurrency(colaboradorSalario)}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Horas Extras</p>
                                <p className="font-medium tabular-nums">{formatCurrency(pedido.horas_extras)}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Quilometragem</p>
                                <p className="font-medium tabular-nums">{formatCurrency(pedido.valor_km)}</p>
                              </div>
                              {pedido.valor_desconto > 0 && (
                                <div>
                                  <p className="text-xs text-muted-foreground mb-1">Desconto</p>
                                  <p className="font-medium tabular-nums text-destructive">
                                    -{formatCurrency(pedido.valor_desconto)}
                                  </p>
                                  {pedido.motivo_desconto && (
                                    <p className="text-xs text-muted-foreground mt-1">{pedido.motivo_desconto}</p>
                                  )}
                                </div>
                              )}
                            </>
                          )}
                        </div>

                        {(pedido.observacao_gerente || pedido.observacao_financeiro) && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t text-sm">
                            {pedido.observacao_gerente && (
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Observação do gerente</p>
                                <p>{pedido.observacao_gerente}</p>
                              </div>
                            )}
                            {pedido.observacao_financeiro && (
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Observação do financeiro</p>
                                <p>{pedido.observacao_financeiro}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
