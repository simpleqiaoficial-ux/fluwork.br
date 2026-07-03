"use client"

import type { PedidoPagamento } from "@/types/pedido"
import { Receipt, Clock, Car, Percent, Bus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useMaskedCurrency } from "@/components/currency-display"

interface PedidoItemProps {
  pedido: PedidoPagamento
}

export function PedidoItem({ pedido }: PedidoItemProps) {
  const { formatValue } = useMaskedCurrency()

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const colaboradorNome = pedido.colaborador?.nome_completo || pedido.colaboradores?.nome_completo || "N/A"
  const colaboradorSalario = pedido.colaborador?.salario || pedido.colaboradores?.salario || 0

  const isReembolsoKm = pedido.tipo_pedido === "reembolso_km"

  const valorHoraNormal = colaboradorSalario / 220
  const horas50 = pedido.horas_extras_50 || 0
  const horas100 = pedido.horas_extras_100 || 0
  const valorHE50 = horas50 * valorHoraNormal * 1.5
  const valorHE100 = horas100 * valorHoraNormal * 2

  return (
    <div className="border rounded-lg p-4 hover:bg-accent/50 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Receipt className="w-4 h-4 text-primary" />
            <p className="font-semibold">{colaboradorNome}</p>
            {isReembolsoKm && (
              <Badge variant="outline" className="flex items-center gap-1 text-xs">
                <Car className="w-3 h-3" />
                Reembolso KM
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{formatarData(pedido.created_at)}</p>
        </div>
      </div>

      {isReembolsoKm ? (
        <div className="grid grid-cols-1 gap-3 mb-3">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center">
              <Car className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Quilometragem</p>
              <p className="font-medium">{formatValue(pedido.valor_km)}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
              <span className="text-xs font-bold text-blue-600">R$</span>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Salário Base</p>
              <p className="font-medium">{formatValue(colaboradorSalario)}</p>
            </div>
          </div>

          {(horas50 > 0 || horas100 > 0) && (
            <>
              {horas50 > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center">
                    <Clock className="w-4 h-4 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">HE 50% ({horas50}h)</p>
                    <p className="font-medium">{formatValue(valorHE50)}</p>
                  </div>
                </div>
              )}

              {horas100 > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center">
                    <Clock className="w-4 h-4 text-red-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">HE 100% ({horas100}h)</p>
                    <p className="font-medium">{formatValue(valorHE100)}</p>
                  </div>
                </div>
              )}
            </>
          )}

          {pedido.valor_km > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center">
                <Car className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Quilometragem</p>
                <p className="font-medium">{formatValue(pedido.valor_km)}</p>
              </div>
            </div>
          )}

          {pedido.conducao > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <div className="w-8 h-8 rounded-full bg-teal-500/10 flex items-center justify-center">
                <Bus className="w-4 h-4 text-teal-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Condução</p>
                <p className="font-medium">{formatValue(pedido.conducao)}</p>
              </div>
            </div>
          )}

          {pedido.valor_desconto && pedido.valor_desconto > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center">
                <Percent className="w-4 h-4 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Desconto</p>
                <p className="font-medium text-red-600">{formatValue(pedido.valor_desconto, true)}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {pedido.motivo_desconto && (
        <div className="mb-3 p-2 bg-amber-50 border border-amber-200 rounded text-xs">
          <p className="font-semibold text-amber-900">Motivo do desconto:</p>
          <p className="text-amber-700">{pedido.motivo_desconto}</p>
        </div>
      )}

      <div className="pt-3 border-t">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">Valor Total</p>
          <p className="text-xl font-bold text-primary">{formatValue(pedido.valor_total)}</p>
        </div>
      </div>
    </div>
  )
}
