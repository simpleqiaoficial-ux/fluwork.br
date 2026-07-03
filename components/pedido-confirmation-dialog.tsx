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
import { AlertCircle } from "lucide-react"
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
          <DialogTitle>Confirmar pedido de pagamento</DialogTitle>
          <DialogDescription>Revise os detalhes antes de enviar o pedido</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Prestador</p>
            <p className="font-medium">{colaboradorNome}</p>
          </div>

          <div className="divide-y">
            {pedido.tipo_pedido === "reembolso_km" ? (
              <div className="flex justify-between items-center py-2.5">
                <span className="text-sm text-muted-foreground">Reembolso KM</span>
                <span className="font-medium tabular-nums">{fmt(pedido.valor_km)}</span>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center py-2.5">
                  <span className="text-sm text-muted-foreground">Valor contratual base</span>
                  <span className="font-medium tabular-nums">{fmt(salario)}</span>
                </div>

                {(pedido.horas_extras_50 > 0 || pedido.horas_extras_100 > 0) && (
                  <div className="py-2.5">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Horas extras</span>
                      <span className="font-medium tabular-nums">{fmt(valorTotalHe)}</span>
                    </div>
                    {pedido.horas_extras_50 > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {pedido.horas_extras_50}h a 50% = {fmt(valorHe50)}
                      </p>
                    )}
                    {pedido.horas_extras_100 > 0 && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {pedido.horas_extras_100}h a 100% = {fmt(valorHe100)}
                      </p>
                    )}
                    {pedido.motivo_horas_extras && (
                      <p className="text-xs text-muted-foreground mt-0.5">Motivo: {pedido.motivo_horas_extras}</p>
                    )}
                  </div>
                )}

                {pedido.valor_km > 0 && (
                  <div className="flex justify-between items-center py-2.5">
                    <span className="text-sm text-muted-foreground">Quilometragem</span>
                    <span className="font-medium tabular-nums">{fmt(pedido.valor_km)}</span>
                  </div>
                )}

                {pedido.conducao > 0 && (
                  <div className="flex justify-between items-center py-2.5">
                    <span className="text-sm text-muted-foreground">Condução</span>
                    <span className="font-medium tabular-nums">{fmt(pedido.conducao)}</span>
                  </div>
                )}

                {pedido.valor_plantao > 0 && (
                  <div className="py-2.5">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Plantão</span>
                      <span className="font-medium tabular-nums">{fmt(pedido.valor_plantao)}</span>
                    </div>
                    {pedido.motivo_plantao && (
                      <p className="text-xs text-muted-foreground mt-1">Motivo: {pedido.motivo_plantao}</p>
                    )}
                  </div>
                )}

                {(pedido.comissao || 0) > 0 && (
                  <div className="py-2.5">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Comissão</span>
                      <span className="font-medium tabular-nums">{fmt(pedido.comissao || 0)}</span>
                    </div>
                    {pedido.motivo_comissao && (
                      <p className="text-xs text-muted-foreground mt-1">Motivo: {pedido.motivo_comissao}</p>
                    )}
                  </div>
                )}

                {(pedido.valor_desconto || 0) > 0 && (
                  <div className="py-2.5">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Desconto</span>
                      <span className="font-medium tabular-nums text-destructive">
                        -{fmt(pedido.valor_desconto || 0)}
                      </span>
                    </div>
                    {pedido.motivo_desconto && (
                      <p className="text-xs text-muted-foreground mt-1">Motivo: {pedido.motivo_desconto}</p>
                    )}
                  </div>
                )}
              </>
            )}

            <div className="flex justify-between items-center pt-3">
              <span className="font-semibold">Valor total do pedido</span>
              <span className="font-semibold text-lg tabular-nums">{fmt(valorTotal)}</span>
            </div>
          </div>

          <div className="border-l-2 border-warning pl-4 py-1 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-warning mt-0.5 shrink-0" />
            <p className="text-sm text-muted-foreground">
              Ao confirmar, este pedido será enviado para aprovação. Revise todos os valores antes de prosseguir.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={onConfirm} disabled={loading}>
            {loading ? "Enviando..." : "Confirmar e enviar pedido"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
