"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { DollarSign, Clock, Car, Bus, Percent, AlertCircle, Award } from "lucide-react"
import type { NovoPedido } from "@/types/pedido"

interface PedidoConfirmationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  loading: boolean
  pedido: NovoPedido
  colaboradorNome: string
  salario: number
}

export function PedidoConfirmationDialog({
  open,
  onOpenChange,
  onConfirm,
  loading,
  pedido,
  colaboradorNome,
  salario,
}: PedidoConfirmationDialogProps) {
  const fmt = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v)

  const valorHoraNormal = salario / 220
  const valorHe50 = pedido.horas_extras_50 * valorHoraNormal * 1.5
  const valorHe100 = pedido.horas_extras_100 * valorHoraNormal * 2
  const valorTotalHe = valorHe50 + valorHe100

  // Condução e KM ficam fora do valor da nota (aparecem mas não calculam)
  const valorTotal =
    pedido.tipo_pedido === "reembolso_km"
      ? pedido.valor_km
      : salario +
        valorTotalHe +
        pedido.valor_plantao +
        (pedido.comissao || 0) -
        (pedido.valor_desconto || 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Confirmar Pedido de Pagamento</DialogTitle>
          <DialogDescription>Revise os detalhes antes de enviar o pedido</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Colaborador */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm font-semibold text-blue-900 mb-1">Colaborador</p>
            <p className="text-lg font-bold text-blue-700">{colaboradorNome}</p>
          </div>

          {pedido.tipo_pedido === "reembolso_km" ? (
            <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <Car className="h-5 w-5 text-green-500" />
                <span className="font-medium text-green-900">Reembolso KM</span>
              </div>
              <span className="text-lg font-bold text-green-700">{fmt(pedido.valor_km)}</span>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Salario Base */}
              <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-500" />
                  <span className="font-medium text-green-900">Salario Base</span>
                </div>
                <span className="text-lg font-bold text-green-700">{fmt(salario)}</span>
              </div>

              {/* Horas Extras */}
              {(pedido.horas_extras_50 > 0 || pedido.horas_extras_100 > 0) && (
                <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-5 w-5 text-orange-500" />
                    <span className="font-medium text-orange-900">Horas Extras</span>
                  </div>
                  {pedido.horas_extras_50 > 0 && (
                    <p className="text-sm text-orange-700 ml-7">
                      {pedido.horas_extras_50}h a 50% = {fmt(valorHe50)}
                    </p>
                  )}
                  {pedido.horas_extras_100 > 0 && (
                    <p className="text-sm text-orange-700 ml-7">
                      {pedido.horas_extras_100}h a 100% = {fmt(valorHe100)}
                    </p>
                  )}
                  {pedido.motivo_horas_extras && (
                    <p className="text-xs text-orange-600 ml-7 mt-1">Motivo: {pedido.motivo_horas_extras}</p>
                  )}
                  <p className="text-lg font-bold text-orange-700 ml-7 mt-1">Total: {fmt(valorTotalHe)}</p>
                </div>
              )}

              {/* KM */}
              {pedido.valor_km > 0 && (
                <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Car className="h-5 w-5 text-green-500" />
                    <span className="font-medium text-green-900">Quilometragem</span>
                  </div>
                  <span className="text-lg font-bold text-green-700">{fmt(pedido.valor_km)}</span>
                </div>
              )}

              {/* Conducao */}
              {pedido.conducao > 0 && (
                <div className="flex items-center justify-between p-3 bg-teal-50 border border-teal-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Bus className="h-5 w-5 text-teal-500" />
                    <span className="font-medium text-teal-900">Conducao</span>
                  </div>
                  <span className="text-lg font-bold text-teal-700">{fmt(pedido.conducao)}</span>
                </div>
              )}

              {/* Plantao */}
              {pedido.valor_plantao > 0 && (
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-purple-500" />
                      <span className="font-medium text-purple-900">Plantao</span>
                    </div>
                    <span className="text-lg font-bold text-purple-700">{fmt(pedido.valor_plantao)}</span>
                  </div>
                  {pedido.motivo_plantao && <p className="text-sm text-purple-600 ml-7">Motivo: {pedido.motivo_plantao}</p>}
                </div>
              )}

              {/* Comissao */}
              {(pedido.comissao || 0) > 0 && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <Award className="h-5 w-5 text-blue-500" />
                      <span className="font-medium text-blue-900">Comissao</span>
                    </div>
                    <span className="text-lg font-bold text-blue-700">{fmt(pedido.comissao || 0)}</span>
                  </div>
                  {pedido.motivo_comissao && <p className="text-sm text-blue-600 ml-7">Motivo: {pedido.motivo_comissao}</p>}
                </div>
              )}

              {/* Desconto */}
              {(pedido.valor_desconto || 0) > 0 && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <Percent className="h-5 w-5 text-red-500" />
                      <span className="font-medium text-red-900">Desconto</span>
                    </div>
                    <span className="text-lg font-bold text-red-700">- {fmt(pedido.valor_desconto || 0)}</span>
                  </div>
                  {pedido.motivo_desconto && <p className="text-sm text-red-600 ml-7">Motivo: {pedido.motivo_desconto}</p>}
                </div>
              )}
            </div>
          )}

          {/* Valor Total */}
          <div className="p-5 bg-muted border rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-green-600 rounded-lg">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
                <span className="text-lg font-semibold text-green-900">Valor Total do Pedido</span>
              </div>
              <span className="text-3xl font-bold text-green-700">{fmt(valorTotal)}</span>
            </div>
          </div>

          {/* Aviso */}
          <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
            <p className="text-sm text-amber-900">
              Ao confirmar, este pedido sera enviado para aprovacao. Revise todos os valores antes de prosseguir.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={onConfirm} disabled={loading}>
            {loading ? "Enviando..." : "Confirmar e Enviar Pedido"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
