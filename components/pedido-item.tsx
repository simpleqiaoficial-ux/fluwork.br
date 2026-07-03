"use client"

import type { PedidoPagamento } from "@/types/pedido"
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
    <div className="border rounded-lg p-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="flex items-center gap-2">
            <p className="font-medium text-sm">{colaboradorNome}</p>
            {isReembolsoKm && <Badge variant="outline">Reembolso KM</Badge>}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{formatarData(pedido.created_at)}</p>
        </div>
      </div>

      {isReembolsoKm ? (
        <div className="text-sm">
          <p className="text-xs text-muted-foreground mb-0.5">Quilometragem</p>
          <p className="font-medium tabular-nums">{formatValue(pedido.valor_km)}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Valor Contratual Base</p>
            <p className="font-medium tabular-nums">{formatValue(colaboradorSalario)}</p>
          </div>

          {horas50 > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">HE 50% ({horas50}h)</p>
              <p className="font-medium tabular-nums">{formatValue(valorHE50)}</p>
            </div>
          )}

          {horas100 > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">HE 100% ({horas100}h)</p>
              <p className="font-medium tabular-nums">{formatValue(valorHE100)}</p>
            </div>
          )}

          {pedido.valor_km > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Quilometragem</p>
              <p className="font-medium tabular-nums">{formatValue(pedido.valor_km)}</p>
            </div>
          )}

          {pedido.conducao > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Condução</p>
              <p className="font-medium tabular-nums">{formatValue(pedido.conducao)}</p>
            </div>
          )}

          {pedido.valor_desconto > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Desconto</p>
              <p className="font-medium tabular-nums text-destructive">{formatValue(pedido.valor_desconto, true)}</p>
            </div>
          )}
        </div>
      )}

      {pedido.motivo_desconto && (
        <p className="text-xs text-muted-foreground mt-3 pt-3 border-t">
          <span className="font-medium text-foreground">Motivo do desconto: </span>
          {pedido.motivo_desconto}
        </p>
      )}

      <div className="flex items-center justify-between pt-3 mt-3 border-t">
        <p className="text-sm text-muted-foreground">Valor Total</p>
        <p className="text-base font-semibold tabular-nums">{formatValue(pedido.valor_total)}</p>
      </div>
    </div>
  )
}
