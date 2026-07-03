"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { formatCurrency } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Calendar, User, DollarSign, Clock, Car, Briefcase, AlertCircle } from "lucide-react"

interface PedidoDetailModalProps {
  pedido: any
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PedidoDetailModal({ pedido, open, onOpenChange }: PedidoDetailModalProps) {
  if (!pedido) return null

  const isReembolsoKm = pedido.tipo_pedido === "reembolso_km"

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pendente_supervisor":
        return "bg-yellow-100 text-yellow-800 border-yellow-300"
      case "pendente_gerente":
        return "bg-orange-100 text-orange-800 border-orange-300"
      case "pendente_financeiro":
        return "bg-blue-100 text-blue-800 border-blue-300"
      case "aprovado":
        return "bg-green-100 text-green-800 border-green-300"
      case "pago":
        return "bg-emerald-100 text-emerald-800 border-emerald-300"
      case "nota_recebida":
        return "bg-teal-100 text-teal-800 border-teal-300"
      case "recusado":
        return "bg-red-100 text-red-800 border-red-300"
      case "correcao_solicitada":
        return "bg-purple-100 text-purple-800 border-purple-300"
      default:
        return "bg-gray-100 text-gray-800 border-gray-300"
    }
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pendente_supervisor: "Aguardando Supervisor",
      pendente_gerente: "Aguardando Gerente",
      pendente_financeiro: "Aguardando Financeiro",
      aprovado: "Aprovado",
      pago: "Pago",
      nota_recebida: "Nota Recebida",
      recusado: "Recusado",
      correcao_solicitada: "Correção Solicitada",
    }
    return labels[status] || status
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center justify-between">
            <span>Detalhes do Pedido</span>
            <Badge className={getStatusColor(pedido.status)}>{getStatusLabel(pedido.status)}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Informações do Colaborador */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Colaborador</p>
                    <p className="font-semibold text-lg">{pedido.colaborador?.nome_completo || "N/A"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Data de Criação</p>
                    <p className="font-semibold">
                      {new Date(pedido.created_at).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
                {pedido.criador && (
                  <div className="flex items-start gap-3">
                    <User className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Criado por</p>
                      <p className="font-semibold">{pedido.criador.nome_completo}</p>
                    </div>
                  </div>
                )}
                {pedido.data_previsao_pagamento && (
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Previsão de Pagamento</p>
                      <p className="font-semibold">
                        {new Date(pedido.data_previsao_pagamento).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Tipo de Pedido */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-4">
                <Briefcase className="w-5 h-5 text-muted-foreground" />
                <h3 className="font-semibold text-lg">Tipo de Pedido</h3>
              </div>
              <Badge variant="outline" className="text-base px-4 py-2">
                {isReembolsoKm ? "Reembolso de Quilometragem" : "Pedido Completo"}
              </Badge>
            </CardContent>
          </Card>

          {/* Valores */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-4">
                <DollarSign className="w-5 h-5 text-muted-foreground" />
                <h3 className="font-semibold text-lg">Valores</h3>
              </div>
              <div className="space-y-3">
                {!isReembolsoKm && (
                  <>
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-muted-foreground">Salário Base</span>
                      <span className="font-semibold">{formatCurrency(pedido.salario_base)}</span>
                    </div>
                    {pedido.horas_extras > 0 && (
                      <div className="flex justify-between items-center py-2 border-b">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-orange-600" />
                          <span className="text-muted-foreground">Horas Extras</span>
                        </div>
                        <span className="font-semibold text-orange-600">{formatCurrency(pedido.horas_extras)}</span>
                      </div>
                    )}
                    {pedido.motivo_horas_extras && (
                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                        <p className="text-sm text-orange-800">
                          <span className="font-semibold">Motivo:</span> {pedido.motivo_horas_extras}
                        </p>
                      </div>
                    )}
                    {pedido.valor_plantao > 0 && (
                      <>
                        <div className="flex justify-between items-center py-2 border-b">
                          <span className="text-muted-foreground">Plantão</span>
                          <span className="font-semibold text-blue-600">{formatCurrency(pedido.valor_plantao)}</span>
                        </div>
                        {pedido.motivo_plantao && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <p className="text-sm text-blue-800">
                              <span className="font-semibold">Motivo:</span> {pedido.motivo_plantao}
                            </p>
                          </div>
                        )}
                      </>
                    )}
                    {pedido.valor_desconto > 0 && (
                      <>
                        <div className="flex justify-between items-center py-2 border-b">
                          <span className="text-muted-foreground">Desconto</span>
                          <span className="font-semibold text-red-600">-{formatCurrency(pedido.valor_desconto)}</span>
                        </div>
                        {pedido.motivo_desconto && (
                          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                            <p className="text-sm text-red-800">
                              <span className="font-semibold">Motivo:</span> {pedido.motivo_desconto}
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}
                {pedido.valor_km > 0 && (
                  <div className="flex justify-between items-center py-2 border-b">
                    <div className="flex items-center gap-2">
                      <Car className="w-4 h-4 text-purple-600" />
                      <span className="text-muted-foreground">Quilometragem</span>
                    </div>
                    <span className="font-semibold text-purple-600">{formatCurrency(pedido.valor_km)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center py-3 bg-primary/5 rounded-lg px-3 mt-4">
                  <span className="font-bold text-lg">Valor Total</span>
                  <span className="font-bold text-2xl text-primary">{formatCurrency(pedido.valor_total)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Observações */}
          {pedido.observacao_recusa && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-lg text-red-800 mb-2">Observação de Recusa/Correção</h3>
                    <p className="text-red-700">{pedido.observacao_recusa}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
