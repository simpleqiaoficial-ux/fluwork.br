"use client"

import type { PedidoPagamento } from "@/types/pedido"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Check, X, AlertCircle, Percent, Calendar, Clock, User } from "lucide-react"
import { acaoGerente, acaoFinanceiro } from "@/app/actions/pedidos"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useMaskedCurrency } from "@/components/currency-display"
import { useSystemStatus } from "./system-status-provider"
import { SystemSuspendedDialog } from "./system-suspended-dialog"

interface AprovacaoItemProps {
  pedido: PedidoPagamento
  tipoAcesso: string
}

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

  const getStatusBadge = () => {
    const statusMap = {
      pendente_gerente: { label: "Aguardando Gerente", variant: "secondary" as const },
      pendente_financeiro: { label: "Aguardando Financeiro", variant: "secondary" as const },
      correcao: { label: "Correção Solicitada", variant: "outline" as const },
    }
    return statusMap[pedido.status as keyof typeof statusMap] || { label: pedido.status, variant: "secondary" as const }
  }

  const status = getStatusBadge()

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

  return (
    <>
      <SystemSuspendedDialog 
        open={suspendedDialogOpen} 
        onOpenChange={setSuspendedDialogOpen}
        reason={suspensionReason}
      />
      
      <Card className="p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-lg">{colaboradorNome}</h3>
          <div className="space-y-1">
            {pedido.criado_por && (
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <User className="w-3 h-3" />
                Solicitado por {pedido.criado_por.nome_completo}
              </p>
            )}
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Criado em {dataHoraCriacao}
            </p>
            {tipoAcesso === "Financeiro" && dataHoraAprovacaoGerente && (
              <p className="text-sm text-green-600 flex items-center gap-1">
                <Check className="w-3 h-3" />
                Aprovado pelo gerente em {dataHoraAprovacaoGerente}
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {isReembolsoKM && (
            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300">
              Reembolso KM
            </Badge>
          )}
          <Badge variant={status.variant}>{status.label}</Badge>
        </div>
      </div>

      {isReembolsoKM ? (
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-muted-foreground">Quilometragem</p>
            <p className="font-semibold">
              {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(pedido.valor_km)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Valor Total</p>
            <p className="font-semibold text-lg text-primary">
              {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(pedido.valor_total)}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div>
            <p className="text-sm text-muted-foreground">Salário Base</p>
            <p className="font-semibold">
              {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(colaboradorSalario)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Horas Extras</p>
            <p className="font-semibold">
              {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(pedido.horas_extras)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Quilometragem</p>
            <p className="font-semibold">
              {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(pedido.valor_km)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Valor Total</p>
            <p className="font-semibold text-lg text-primary">
              {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(pedido.valor_total)}
            </p>
          </div>
        </div>
      )}

      {pedido.horas_extras && pedido.horas_extras > 0 && pedido.motivo_horas_extras && (
        <div className="mb-4 p-4 bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-md">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            <p className="text-sm font-medium text-orange-900 dark:text-orange-100">Horas Extras</p>
          </div>
          <p className="text-lg font-semibold text-orange-700 dark:text-orange-300 mb-2">
            {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(pedido.horas_extras)}
          </p>
          <div className="mt-2 p-2 bg-orange-100 dark:bg-orange-900 border border-orange-300 dark:border-orange-700 rounded">
            <p className="text-xs font-medium text-orange-900 dark:text-orange-100">Motivo:</p>
            <p className="text-sm text-orange-800 dark:text-orange-200">{pedido.motivo_horas_extras}</p>
          </div>
        </div>
      )}

      {pedido.valor_plantao && pedido.valor_plantao > 0 && (
        <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Plantão</p>
          </div>
          <p className="text-lg font-semibold text-blue-700 dark:text-blue-300 mb-2">
            {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(pedido.valor_plantao)}
          </p>
          {pedido.motivo_plantao && (
            <div className="mt-2 p-2 bg-blue-100 dark:bg-blue-900 border border-blue-300 dark:border-blue-700 rounded">
              <p className="text-xs font-medium text-blue-900 dark:text-blue-100">Motivo:</p>
              <p className="text-sm text-blue-800 dark:text-blue-200">{pedido.motivo_plantao}</p>
            </div>
          )}
        </div>
      )}

      {pedido.valor_desconto && pedido.valor_desconto > 0 && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-md">
          <div className="flex items-center gap-2 mb-2">
            <Percent className="w-5 h-5 text-red-600 dark:text-red-400" />
            <p className="text-sm font-medium text-red-900 dark:text-red-100">Desconto Aplicado</p>
          </div>
          <p className="text-lg font-semibold text-red-700 dark:text-red-300 mb-2">
            - {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(pedido.valor_desconto)}
          </p>
          {pedido.motivo_desconto && (
            <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded">
              <p className="text-xs font-medium text-amber-900 dark:text-amber-100">Motivo:</p>
              <p className="text-sm text-amber-800 dark:text-amber-200">{pedido.motivo_desconto}</p>
            </div>
          )}
        </div>
      )}

      {pedido.observacao_gerente && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md">
          <p className="text-sm font-medium mb-1 text-blue-900 dark:text-blue-100">Observação do Gerente:</p>
          <p className="text-sm text-blue-800 dark:text-blue-200">{pedido.observacao_gerente}</p>
        </div>
      )}

      {pedido.observacao_financeiro && (
        <div className="mb-4 p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-md">
          <p className="text-sm font-medium mb-1 text-green-900 dark:text-green-100">Observação do Financeiro:</p>
          <p className="text-sm text-green-800 dark:text-green-200">{pedido.observacao_financeiro}</p>
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
              Esta data será visível para o colaborador, supervisor e gerente
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
      </Card>
    </>
  )
}
