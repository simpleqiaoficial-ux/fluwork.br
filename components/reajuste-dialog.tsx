"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { aplicarReajuste } from "@/app/actions/reajustes"
import type { Colaborador } from "@/types/colaborador"
import { Percent, DollarSign } from "lucide-react"

interface ReajusteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  colaborador: Colaborador
  onSuccess: () => void
}

export function ReajusteDialog({ open, onOpenChange, colaborador, onSuccess }: ReajusteDialogProps) {
  const [tipoReajuste, setTipoReajuste] = useState<"porcentagem" | "valor">("porcentagem")
  const [valorReajuste, setValorReajuste] = useState("")
  const [motivo, setMotivo] = useState("")
  const [loading, setLoading] = useState(false)

  const calcularNovoSalario = () => {
    const valor = Number.parseFloat(valorReajuste) || 0
    if (tipoReajuste === "porcentagem") {
      return colaborador.salario + colaborador.salario * (valor / 100)
    }
    return colaborador.salario + valor
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const resultado = await aplicarReajuste({
        colaborador_id: colaborador.id,
        tipo_reajuste: tipoReajuste,
        valor_reajuste: Number.parseFloat(valorReajuste),
        motivo: motivo || undefined,
      })

      const mensagem = `Reajuste aplicado com sucesso!\n\nPrestador: ${resultado.colaborador}\nValor Contratual Anterior: ${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(resultado.salarioAnterior)}\nNovo Valor Contratual: ${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(resultado.salarioNovo)}`

      alert(mensagem)
      setValorReajuste("")
      setMotivo("")
      onSuccess()
    } catch (error: any) {
      alert(error.message || "Erro ao aplicar reajuste")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Aplicar Reajuste Contratual</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4 pb-4 border-b">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Prestador</p>
              <p className="font-medium">{colaborador.nome_completo}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Valor contratual atual</p>
              <p className="font-medium tabular-nums">
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(colaborador.salario)}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <Label>Tipo de reajuste</Label>
            <RadioGroup value={tipoReajuste} onValueChange={(v) => setTipoReajuste(v as "porcentagem" | "valor")}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="porcentagem" id="porcentagem" />
                <Label htmlFor="porcentagem" className="flex items-center gap-2 cursor-pointer">
                  <Percent className="w-4 h-4" />
                  Porcentagem
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="valor" id="valor" />
                <Label htmlFor="valor" className="flex items-center gap-2 cursor-pointer">
                  <DollarSign className="w-4 h-4" />
                  Valor Fixo
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="valor">{tipoReajuste === "porcentagem" ? "Porcentagem (%)" : "Valor (R$)"}</Label>
            <Input
              id="valor"
              type="number"
              step="0.01"
              value={valorReajuste}
              onChange={(e) => setValorReajuste(e.target.value)}
              placeholder={tipoReajuste === "porcentagem" ? "Ex: 10" : "Ex: 500.00"}
              required
            />
          </div>

          {valorReajuste && (
            <div className="border-t pt-3">
              <p className="text-xs text-muted-foreground mb-1">Novo valor contratual</p>
              <p className="text-2xl font-semibold tabular-nums">
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(calcularNovoSalario())}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="motivo">
              Motivo <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="motivo"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ex: Reajuste anual, promoção, etc."
              rows={3}
              required
            />
          </div>

          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !valorReajuste || !motivo.trim()} className="flex-1">
              {loading ? "Aplicando..." : "Aplicar Reajuste"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
