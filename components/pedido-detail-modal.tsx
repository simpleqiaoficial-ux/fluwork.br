"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { formatCurrency } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { AlertCircle } from "lucide-react"

interface PedidoDetailModalProps {
  pedido: any
  open: boolean
  onOpenChange: (open: boolean) => void
}

const STATUS_VARIANT: Record<string, "outline" | "success" | "destructive" | "warning"> = {
  pendente_supervisor: "outline",
  pendente_gerente: "outline",
  pendente_financeiro: "outline",
  aprovado: "success",
  pago: "success",
  nota_recebida: "success",
  recusado: "destructive",
  correcao_solicitada: "warning",
}

const STATUS_LABELS: Record<string, string> = {
  pendente_supervisor: "Aguardando supervisor",
  pendente_gerente: "Aguardando gerente",
  pendente_financeiro: "Aguardando financeiro",
  aprovado: "Aprovado",
  pago: "Pago",
  nota_recebida: "Nota recebida",
  recusado: "Recusado",
  correcao_solicitada: "Correção solicitada",
}

export function PedidoDetailModal({ pedido, open, onOpenChange }: PedidoDetailModalProps) {
  if (!pedido) return null

  const isReembolsoKm = pedido.tipo_pedido === "reembolso_km"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Detalhes do pedido</span>
            <Badge variant={STATUS_VARIANT[pedido.status] || "outline"} className="font-normal">
              {STATUS_LABELS[pedido.status] || pedido.status}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações gerais */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Prestador</p>
              <p className="font-medium">{pedido.colaborador?.nome_completo || "N/A"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Data de criação</p>
              <p className="font-medium">
                {new Date(pedido.created_at).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
            {pedido.criador && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Criado por</p>
                <p className="font-medium">{pedido.criador.nome_completo}</p>
              </div>
            )}
            {pedido.data_previsao_pagamento && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Previsão de pagamento</p>
                <p className="font-medium">{new Date(pedido.data_previsao_pagamento).toLocaleDateString("pt-BR")}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-muted-foreground mb-1">Tipo de pedido</p>
              <p className="font-medium">{isReembolsoKm ? "Reembolso de quilometragem" : "Pedido completo"}</p>
            </div>
          </div>

          {/* Valores */}
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-3">Valores</p>
            <div className="divide-y">
              {!isReembolsoKm && (
                <>
                  <div className="flex justify-between items-center py-2.5">
                    <span className="text-sm text-muted-foreground">Valor contratual base</span>
                    <span className="font-medium tabular-nums">{formatCurrency(pedido.salario_base)}</span>
                  </div>
                  {pedido.horas_extras > 0 && (
                    <div className="py-2.5">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Horas extras</span>
                        <span className="font-medium tabular-nums">{formatCurrency(pedido.horas_extras)}</span>
                      </div>
                      {pedido.motivo_horas_extras && (
                        <p className="text-xs text-muted-foreground mt-1">{pedido.motivo_horas_extras}</p>
                      )}
                    </div>
                  )}
                  {pedido.valor_plantao > 0 && (
                    <div className="py-2.5">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Plantão</span>
                        <span className="font-medium tabular-nums">{formatCurrency(pedido.valor_plantao)}</span>
                      </div>
                      {pedido.motivo_plantao && (
                        <p className="text-xs text-muted-foreground mt-1">{pedido.motivo_plantao}</p>
                      )}
                    </div>
                  )}
                  {pedido.valor_desconto > 0 && (
                    <div className="py-2.5">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Desconto</span>
                        <span className="font-medium tabular-nums text-destructive">
                          -{formatCurrency(pedido.valor_desconto)}
                        </span>
                      </div>
                      {pedido.motivo_desconto && (
                        <p className="text-xs text-muted-foreground mt-1">{pedido.motivo_desconto}</p>
                      )}
                    </div>
                  )}
                </>
              )}
              {pedido.valor_km > 0 && (
                <div className="flex justify-between items-center py-2.5">
                  <span className="text-sm text-muted-foreground">Quilometragem</span>
                  <span className="font-medium tabular-nums">{formatCurrency(pedido.valor_km)}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-3">
                <span className="font-semibold">Valor total</span>
                <span className="font-semibold text-lg tabular-nums">{formatCurrency(pedido.valor_total)}</span>
              </div>
            </div>
          </div>

          {/* Observação de recusa/correção */}
          {pedido.observacao_recusa && (
            <div className="border-l-2 border-destructive pl-4 py-1">
              <div className="flex items-center gap-2 text-destructive mb-1">
                <AlertCircle className="w-4 h-4" />
                <p className="text-sm font-medium">Observação de recusa/correção</p>
              </div>
              <p className="text-sm text-muted-foreground">{pedido.observacao_recusa}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
