"use client"

import type { PedidoPagamento } from "@/types/pedido"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { StatusBadge } from "@/components/ui/status-badge"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Check, X, AlertCircle, Calendar, Clock, User } from "lucide-react"
import { acaoGerente, acaoFinanceiro } from "@/app/actions/pedidos"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSystemStatus } from "./system-status-provider"
import { SystemSuspendedDialog } from "./system-suspended-dialog"

interface AprovacaoItemProps {
  pedido: PedidoPagamento
  tipoAcesso: string
}

const fmtCurrency = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v)

export function AprovacaoItem({ pedido, tipoAcesso }: AprovacaoItemProps) {
  const [observacao, setObservacao] = useState("")
  const [dataPrevisao, setDataPrevisao] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const { isSystemSuspended, suspensionReason } = useSystemStatus()
  const [suspendedDialogOpen, setSuspendedDialogOpen] = useState(false)

  const handleAcao = async (acao: "aprovar" | "recusar" | "corrigir") => {
    if (isSystemSuspended) {
      setSuspendedDialogOpen(true)
      return
    }
    if ((acao === "recusar" || acao === "corrigir") && !observacao.trim()) {
      setError("Por favor, adicione uma observação explicando o motivo")
      return
    }

    if (tipoAcesso === "Financeiro" && acao === "aprovar" && !dataPrevisao) {
      setError("Por favor, informe a data de previsão de pagamento")
      return
    }

    setLoading(true)
    setError("")
    try {
      if (tipoAcesso === "Gerente" || tipoAcesso === "Adm") {
        await acaoGerente({ pedido_id: pedido.id, acao, observacao })
      } else if (tipoAcesso === "Financeiro") {
        await acaoFinanceiro({ pedido_id: pedido.id, acao, observacao, data_previsao_pagamento: dataPrevisao })
      }
      router.refresh()
    } catch (error) {
      setError("Erro ao processar ação. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  const colaboradorNome = pedido.colaborador?.nome_completo || "N/A"
  const colaboradorSalario = pedido.colaborador?.salario || 0

  const isReembolsoKM = pedido.tipo_pedido === "reembolso_km"

  const dataHoraCriacao = new Date(pedido.created_at).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })

  const dataHoraAprovacaoGerente = pedido.data_aprovacao_gerente
    ? new Date(pedido.data_aprovacao_gerente).toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : null

  const temHorasExtras = !!(pedido.horas_extras && pedido.horas_extras > 0 && pedido.motivo_horas_extras)
  const temPlantao = !!(pedido.valor_plantao && pedido.valor_plantao > 0)
  const temDesconto = !!(pedido.valor_desconto && pedido.valor_desconto > 0)
  const temDetalhes = temHorasExtras || temPlantao || temDesconto || !!pedido.observacao_gerente || !!pedido.observacao_financeiro

  return (
    <>
      <SystemSuspendedDialog
        open={suspendedDialogOpen}
        onOpenChange={setSuspendedDialogOpen}
        reason={suspensionReason}
      />

      <div className="border rounded-lg p-5">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h3 className="font-medium text-base">{colaboradorNome}</h3>
            <div className="mt-1 space-y-0.5">
              {pedido.criado_por && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <User className="w-3 h-3" />
                  Solicitado por {pedido.criado_por.nome_completo}
                </p>
              )}
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Criado em {dataHoraCriacao}
              </p>
              {tipoAcesso === "Financeiro" && dataHoraAprovacaoGerente && (
                <p className="text-xs text-success flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  Aprovado pelo gerente em {dataHoraAprovacaoGerente}
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            {isReembolsoKM && <Badge variant="outline">Reembolso KM</Badge>}
            <StatusBadge entity="pedido" status={pedido.status} />
          </div>
        </div>

        {isReembolsoKM ? (
          <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Quilometragem</p>
              <p className="font-medium tabular-nums">{fmtCurrency(pedido.valor_km)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Valor Total</p>
              <p className="font-semibold text-base tabular-nums">{fmtCurrency(pedido.valor_total)}</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Valor Contratual Base</p>
              <p className="font-medium tabular-nums">{fmtCurrency(colaboradorSalario)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Horas Extras</p>
              <p className="font-medium tabular-nums">{fmtCurrency(pedido.horas_extras)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Quilometragem</p>
              <p className="font-medium tabular-nums">{fmtCurrency(pedido.valor_km)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Valor Total</p>
              <p className="font-semibold text-base tabular-nums">{fmtCurrency(pedido.valor_total)}</p>
            </div>
          </div>
        )}

        {temDetalhes && (
          <div className="divide-y border-t border-b mb-4 text-sm">
            {temHorasExtras && (
              <div className="py-2.5">
                <p className="text-xs text-muted-foreground mb-0.5">Motivo das horas extras</p>
                <p>{pedido.motivo_horas_extras}</p>
              </div>
            )}
            {temPlantao && (
              <div className="py-2.5 flex justify-between gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Plantão</p>
                  {pedido.motivo_plantao && <p>{pedido.motivo_plantao}</p>}
                </div>
                <span className="font-medium tabular-nums shrink-0">{fmtCurrency(pedido.valor_plantao)}</span>
              </div>
            )}
            {temDesconto && (
              <div className="py-2.5">
                <div className="flex justify-between gap-4">
                  <span className="text-xs text-muted-foreground">Desconto aplicado</span>
                  <span className="font-medium text-destructive tabular-nums">
                    − {fmtCurrency(pedido.valor_desconto)}
                  </span>
                </div>
                {pedido.motivo_desconto && (
                  <p className="text-xs text-muted-foreground mt-1">{pedido.motivo_desconto}</p>
                )}
              </div>
            )}
            {pedido.observacao_gerente && (
              <div className="py-2.5">
                <p className="text-xs text-muted-foreground mb-0.5">Observação do gerente</p>
                <p>{pedido.observacao_gerente}</p>
              </div>
            )}
            {pedido.observacao_financeiro && (
              <div className="py-2.5">
                <p className="text-xs text-muted-foreground mb-0.5">Observação do financeiro</p>
                <p>{pedido.observacao_financeiro}</p>
              </div>
            )}
          </div>
        )}

        <div className="space-y-3">
          {tipoAcesso === "Financeiro" && (
            <div className="space-y-2">
              <Label htmlFor="data-previsao" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Data de Previsão de Pagamento *
              </Label>
              <Input
                id="data-previsao"
                type="date"
                value={dataPrevisao}
                onChange={(e) => {
                  setDataPrevisao(e.target.value)
                  setError("")
                }}
                min={new Date().toISOString().split("T")[0]}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Esta data será visível para o prestador, supervisor e gerente
              </p>
            </div>
          )}

          <Textarea
            placeholder="Adicione uma observação (obrigatória para recusar ou solicitar correção)"
            value={observacao}
            onChange={(e) => {
              setObservacao(e.target.value)
              setError("")
            }}
            className="min-h-[80px]"
          />

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2 flex-wrap">
            <Button onClick={() => handleAcao("aprovar")} disabled={loading} className="flex-1 min-w-[140px]">
              <Check className="w-4 h-4 mr-2" />
              Aprovar
            </Button>
            <Button
              onClick={() => handleAcao("corrigir")}
              disabled={loading}
              variant="outline"
              className="flex-1 min-w-[140px]"
            >
              <AlertCircle className="w-4 h-4 mr-2" />
              Solicitar Correção
            </Button>
            <Button
              onClick={() => handleAcao("recusar")}
              disabled={loading}
              variant="destructive"
              className="flex-1 min-w-[140px]"
            >
              <X className="w-4 h-4 mr-2" />
              Recusar
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
