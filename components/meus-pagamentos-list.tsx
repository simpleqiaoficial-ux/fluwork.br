"use client"

import type { Colaborador } from "@/types/colaborador"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Calendar,
  DollarSign,
  Clock,
  MapPin,
  Percent,
  FileText,
  CheckCircle,
  Upload,
  ExternalLink,
  AlertCircle,
  XCircle,
} from "lucide-react"
import { marcarNotaEmitida, uploadNotaFiscal, solicitarProrrogacaoPrazo } from "@/app/actions/pedidos"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useMaskedCurrency } from "@/components/currency-display"
import { AnexarNotaDialog } from "./anexar-nota-dialog"
import { CountdownTimer } from "./countdown-timer"
import { PedidoTimeline } from "./pedido-timeline"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface Pedido {
  id: string
  colaborador_id: string
  horas_extras: number
  valor_km: number
  conducao: number
  valor_plantao: number
  valor_total: number
  status?: string
  created_at: string
  valor_desconto?: number
  motivo_desconto?: string
  nota_emitida?: boolean
  data_emissao_nota?: string
  nota_fiscal_url?: string
  data_previsao_pagamento?: string
  tipo_pedido?: string
  data_limite_anexo_nota?: string
  prorrogacao_solicitada?: boolean
  prorrogacao_aprovada?: boolean
  observacao_prorrogacao?: string
  motivo_prorrogacao?: string
  data_aprovacao_gerente?: string
  data_aprovacao_financeiro?: string
  data_nota_recebida?: string
  aprovado_gerente?: boolean
  aprovado_financeiro?: boolean
  correcao_solicitada_por?: string
}

interface MeusPagamentosListProps {
  pedidos: Pedido[]
  colaborador: Colaborador | null
  isHistorico?: boolean
}

export function MeusPagamentosList({ pedidos, colaborador, isHistorico = false }: MeusPagamentosListProps) {
  const { formatValue } = useMaskedCurrency()
  const [loading, setLoading] = useState<string | null>(null)
  const [uploadingPdf, setUploadingPdf] = useState<string | null>(null)
  const [pdfUrls, setPdfUrls] = useState<Record<string, string>>({})
  const [dialogOpen, setDialogOpen] = useState(false)
  const [pedidoSelecionado, setPedidoSelecionado] = useState<Pedido | null>(null)
  const [prorrogacaoDialogOpen, setProrrogacaoDialogOpen] = useState(false)
  const [motivoProrrogacao, setMotivoProrrogacao] = useState("")
  const [solicitandoProrrogacao, setSolicitandoProrrogacao] = useState(false)
  const [expandedHistorico, setExpandedHistorico] = useState<string | null>(null)
  const router = useRouter()

  const handlePdfUpload = async (pedidoId: string, file: File) => {
    try {
      setUploadingPdf(pedidoId)
      console.log("[v0] Iniciando upload do PDF:", file.name)

      const formData = new FormData()
      formData.append("file", file)

      const result = await uploadNotaFiscal(formData)

      if (!result.success) {
        throw new Error(result.error || "Erro ao fazer upload")
      }

      console.log("[v0] Upload concluído:", result.url)
      setPdfUrls((prev) => ({ ...prev, [pedidoId]: result.url }))
    } catch (error) {
      console.error("[v0] Erro ao fazer upload:", error)
      alert(error instanceof Error ? error.message : "Erro ao fazer upload do PDF")
    } finally {
      setUploadingPdf(null)
    }
  }

  const handleMarcarNota = async (pedidoId: string) => {
    const pdfUrl = pdfUrls[pedidoId]
    if (!pdfUrl) {
      alert("Por favor, anexe o PDF da nota fiscal antes de confirmar")
      return
    }

    try {
      setLoading(pedidoId)
      await marcarNotaEmitida(pedidoId, pdfUrl)
      router.refresh()
    } catch (error) {
      console.error("[v0] Erro ao marcar nota:", error)
      alert("Erro ao marcar nota como emitida")
    } finally {
      setLoading(null)
    }
  }

  const handleSolicitarProrrogacao = async (pedidoId: string) => {
    if (!motivoProrrogacao.trim()) {
      alert("Por favor, informe o motivo da solicitação")
      return
    }

    try {
      setSolicitandoProrrogacao(true)
      const result = await solicitarProrrogacaoPrazo(pedidoId, motivoProrrogacao)
      alert(result.message)
      setProrrogacaoDialogOpen(false)
      setMotivoProrrogacao("")
      setPedidoSelecionado(null)
      router.refresh()
    } catch (error) {
      console.error("[v0] Erro ao solicitar prorrogação:", error)
      alert(error instanceof Error ? error.message : "Erro ao solicitar prorrogação")
    } finally {
      setSolicitandoProrrogacao(false)
    }
  }

  const mesAnoEsperado = pedidoSelecionado
    ? (() => {
        const dataPedido = new Date(pedidoSelecionado.created_at)
        return {
          mes: dataPedido.getMonth() + 1,
          ano: dataPedido.getFullYear(),
        }
      })()
    : { mes: 1, ano: 2025 }

  const valorEsperado = pedidoSelecionado
    ? (colaborador?.salario || 0) +
      pedidoSelecionado.horas_extras +
      (pedidoSelecionado.conducao || 0) +
      (pedidoSelecionado.valor_plantao || 0) -
      (pedidoSelecionado.valor_desconto || 0)
    : 0

  const openPdfSafely = (url: string | undefined) => {
    if (!url || url.includes("undefined") || url.includes("null") || url.trim() === "") {
      alert("Arquivo PDF não disponível ou foi removido.")
      console.error("[v0] Invalid PDF URL:", url)
      return
    }
    window.open(url, "_blank")
  }

  const renderPedidos = (pedidos: Pedido[], isHistorico: boolean) => {
    if (!pedidos || !Array.isArray(pedidos) || pedidos.length === 0) {
      return (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              {isHistorico
                ? "Nenhum pagamento no histórico ainda"
                : colaborador?.tipo_acesso === "Colaborador"
                  ? "Nenhum pagamento aprovado ainda"
                  : "Nenhum pagamento registrado ainda"}
            </p>
          </CardContent>
        </Card>
      )
    }

    return (
      <div className="space-y-4">
        {pedidos.map((pedido) => {
          // Valor da NF = Salário + HE + Plantão - Desconto (sem condução e KM)
          const valorParaEmitir =
            (colaborador?.salario || 0) +
            pedido.horas_extras +
            (pedido.valor_plantao || 0) -
            (pedido.valor_desconto || 0)
          const isReembolsoKm = pedido.tipo_pedido === "reembolso_km"

          const dataPedido = new Date(pedido.created_at)
          const mesAnoEsperado = {
            mes: dataPedido.getMonth() + 1,
            ano: dataPedido.getFullYear(),
          }

          const prazoExpirado = pedido.data_limite_anexo_nota
            ? new Date(pedido.data_limite_anexo_nota).getTime() < new Date().getTime()
            : false

          const aguardandoProrrogacao = pedido.status === "aguardando_prorrogacao"
          const prorrogacaoNegada = pedido.status === "prorrogacao_negada"

          const isExpandedHistorico = isHistorico && expandedHistorico === pedido.id

          return (
            <Card key={pedido.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">
                      {isReembolsoKm ? "Reembolso de Quilometragem" : "Pedido de Pagamento"}
                    </CardTitle>
                    {isReembolsoKm && (
                      <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-700 rounded-full">
                        Apenas KM
                      </span>
                    )}
                    {isHistorico && (
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          pedido.status === "pago" 
                            ? "bg-emerald-100 text-emerald-700" 
                            : pedido.status === "nota_recebida" 
                              ? "bg-teal-100 text-teal-700" 
                              : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {pedido.status === "pago" 
                          ? "Pago" 
                          : pedido.status === "nota_recebida" 
                            ? "Nota Recebida" 
                            : "Em Análise"}
                      </span>
                    )}
                    {aguardandoProrrogacao && (
                      <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-700 rounded-full flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Aguardando Prorrogação
                      </span>
                    )}
                    {prorrogacaoNegada && (
                      <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full flex items-center gap-1">
                        <XCircle className="w-3 h-3" />
                        Prorrogação Negada
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    {isHistorico && (
                      <button
                        onClick={() => setExpandedHistorico(isExpandedHistorico ? null : pedido.id)}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {isExpandedHistorico ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 14l-7-7m0 0L5 14m7-7v12"
                            />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7 7 7-7" />
                          </svg>
                        )}
                      </button>
                    )}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      {new Date(pedido.created_at).toLocaleDateString("pt-BR")}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Timeline de Status do Pedido */}
                {!isHistorico && (
                  <div className="border rounded-lg p-4 bg-muted/20">
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Acompanhe o progresso do seu pedido</h4>
                    <PedidoTimeline pedido={{
                      created_at: pedido.created_at,
                      status: pedido.status || "pendente_gerente",
                      data_aprovacao_gerente: pedido.data_aprovacao_gerente,
                      data_aprovacao_financeiro: pedido.data_aprovacao_financeiro,
                      data_emissao_nota: pedido.data_emissao_nota,
                      data_nota_recebida: pedido.data_nota_recebida,
                      aprovado_gerente: pedido.aprovado_gerente,
                      aprovado_financeiro: pedido.aprovado_financeiro,
                      nota_emitida: pedido.nota_emitida,
                      correcao_solicitada_por: pedido.correcao_solicitada_por,
                    }} />
                  </div>
                )}

                {isHistorico && !isExpandedHistorico ? (
                  <div className="space-y-3">
                    {isReembolsoKm ? (
                      <div className="p-4 rounded-lg bg-muted border">
                        <div className="flex items-end justify-between">
                          <div className="flex-1">
                            <p className="text-sm text-muted-foreground font-medium mb-1">
                              Quilometragem (Reembolso)
                            </p>
                            <p className="text-3xl font-bold text-foreground">
                              {formatValue(pedido.valor_km)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground mb-1">Total do Pedido</p>
                            <p className="text-lg font-semibold text-foreground">
                              {formatValue(pedido.valor_total)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 rounded-lg bg-muted border">
                        <div className="flex items-end justify-between">
                          <div className="flex-1">
                            <p className="text-sm text-muted-foreground font-medium mb-1">
                              Valor para Nota Fiscal
                            </p>
                            <p className="text-3xl font-bold text-foreground">
                              {formatValue(valorParaEmitir)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground mb-1">Total do Pedido</p>
                            <p className="text-lg font-semibold text-foreground">
                              {formatValue(pedido.valor_total)}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Desconto summary */}
                    {pedido.valor_desconto && pedido.valor_desconto > 0 && (
                      <div className="flex items-center justify-between p-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800">
                        <span className="text-red-700 dark:text-red-300 font-medium">Desconto:</span>
                        <span className="text-red-600 dark:text-red-400 font-semibold">
                          - {formatValue(pedido.valor_desconto)}
                        </span>
                      </div>
                    )}

                    {/* Nota Fiscal link */}
                    {pedido.nota_fiscal_url && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full bg-transparent"
                        onClick={() => openPdfSafely(pedido.nota_fiscal_url)}
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Ver Nota Fiscal
                      </Button>
                    )}
                  </div>
                ) : (
                  <>
                    {isReembolsoKm ? (
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-purple-50">
                        <MapPin className="w-5 h-5 text-purple-600 mt-0.5" />
                        <div>
                          <p className="text-sm text-purple-900 font-medium">Quilometragem</p>
                          <p className="font-semibold">{formatValue(pedido.valor_km)}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                          <DollarSign className="w-5 h-5 text-primary mt-0.5" />
                          <div>
                            <p className="text-sm text-muted-foreground">Salário Base</p>
                            <p className="font-semibold">{formatValue(colaborador?.salario || 0)}</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                          <Clock className="w-5 h-5 text-primary mt-0.5" />
                          <div>
                            <p className="text-sm text-muted-foreground">Horas Extras</p>
                            <p className="font-semibold">{formatValue(pedido.horas_extras)}</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                          <MapPin className="w-5 h-5 text-primary mt-0.5" />
                          <div>
                            <p className="text-sm text-muted-foreground">Quilometragem</p>
                            <p className="font-semibold">{formatValue(pedido.valor_km)}</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                          <MapPin className="w-5 h-5 text-primary mt-0.5" />
                          <div>
                            <p className="text-sm text-muted-foreground">Condução</p>
                            <p className="font-semibold">{formatValue(pedido.conducao)}</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                          <MapPin className="w-5 h-5 text-primary mt-0.5" />
                          <div>
                            <p className="text-sm text-muted-foreground">Plantão</p>
                            <p className="font-semibold">{formatValue(pedido.valor_plantao)}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {!isReembolsoKm && pedido.valor_desconto && pedido.valor_desconto > 0 && (
                      <>
                        <div className="flex items-start gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800">
                          <Percent className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-red-900 dark:text-red-100">Desconto Aplicado</p>
                            <p className="font-semibold text-red-700 dark:text-red-300">
                              - {formatValue(pedido.valor_desconto)}
                            </p>
                          </div>
                        </div>

                        {pedido.motivo_desconto && (
                          <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800">
                            <p className="text-sm font-medium mb-1 text-amber-900 dark:text-amber-100">
                              Motivo do Desconto:
                            </p>
                            <p className="text-sm text-amber-800 dark:text-amber-200">{pedido.motivo_desconto}</p>
                          </div>
                        )}
                      </>
                    )}

                    {aguardandoProrrogacao && (
                      <div className="p-4 rounded-lg bg-orange-50 dark:bg-orange-950 border-2 border-orange-200 dark:border-orange-800">
                        <div className="flex items-start gap-3">
                          <Clock className="w-5 h-5 text-orange-600 dark:text-orange-400 mt-0.5" />
                          <div className="flex-1">
                            <p className="font-semibold text-orange-900 dark:text-orange-100 mb-2">
                              Solicitação de Prorrogação em Análise
                            </p>
                            <p className="text-sm text-orange-700 dark:text-orange-300 mb-3">
                              Sua solicitação de prorrogação de prazo foi enviada ao financeiro e está aguardando
                              aprovação.
                            </p>
                            {pedido.motivo_prorrogacao && (
                              <div className="p-3 rounded bg-white dark:bg-orange-950/30">
                                <p className="text-xs font-medium text-orange-900 dark:text-orange-100 mb-1">
                                  Motivo informado:
                                </p>
                                <p className="text-sm text-orange-800 dark:text-orange-200">
                                  {pedido.motivo_prorrogacao}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {prorrogacaoNegada && (
                      <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950 border-2 border-red-200 dark:border-red-800">
                        <div className="flex items-start gap-3">
                          <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
                          <div className="flex-1">
                            <p className="font-semibold text-red-900 dark:text-red-100 mb-2">Prorrogação Negada</p>
                            <p className="text-sm text-red-700 dark:text-red-300 mb-3">
                              Sua solicitação de prorrogação foi negada pelo financeiro.
                            </p>
                            {pedido.observacao_prorrogacao && (
                              <div className="p-3 rounded bg-white dark:bg-red-950/30">
                                <p className="text-xs font-medium text-red-900 dark:text-red-100 mb-1">
                                  Motivo da negação:
                                </p>
                                <p className="text-sm text-red-800 dark:text-red-200">
                                  {pedido.observacao_prorrogacao}
                                </p>
                              </div>
                            )}
                            <p className="text-sm text-red-700 dark:text-red-300 mt-3">
                              Entre em contato com o seu supervisor para resolver esta situação.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {pedido.status === "aprovado" && !isReembolsoKm && !isHistorico && (
                      <div className="p-4 rounded-lg bg-muted border">
                        <div className="flex items-start gap-3 mb-3">
                          <FileText className="w-5 h-5 text-muted-foreground mt-0.5" />
                          <div className="flex-1">
                            <p className="font-semibold text-foreground mb-1">
                              Valor para Emitir Nota
                            </p>
                            <p className="text-xs text-muted-foreground mb-2">
                              (Salário Base + Horas Extras + Condução + Plantão - Desconto)
                            </p>
                            <p className="text-2xl font-bold text-foreground">
                              {formatValue(valorParaEmitir)}
                            </p>
                          </div>
                        </div>

                        {pedido.nota_emitida ? (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 p-3 rounded-lg bg-green-100 dark:bg-green-900 border border-green-300 dark:border-green-700">
                              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                              <div className="flex-1">
                                <p className="font-medium text-green-900 dark:text-green-100">Nota Emitida</p>
                                <p className="text-xs text-green-700 dark:text-green-300">
                                  {pedido.data_emissao_nota &&
                                    new Date(pedido.data_emissao_nota).toLocaleDateString("pt-BR")}
                                </p>
                              </div>
                            </div>
                            {pedido.nota_fiscal_url && (
                              <Button
                                variant="outline"
                                className="w-full bg-transparent"
                                onClick={() => openPdfSafely(pedido.nota_fiscal_url)}
                              >
                                <ExternalLink className="w-4 h-4 mr-2" />
                                Ver Nota Fiscal
                              </Button>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {pedido.data_limite_anexo_nota && (
                              <CountdownTimer dataLimite={pedido.data_limite_anexo_nota} />
                            )}

                            {prazoExpirado && !pedido.prorrogacao_solicitada ? (
                              <div className="space-y-3">
                                <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950 border-2 border-red-200 dark:border-red-800">
                                  <div className="flex items-start gap-3 mb-3">
                                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
                                    <div className="flex-1">
                                      <p className="font-semibold text-red-900 dark:text-red-100 mb-2">
                                        Você não anexou a nota a tempo
                                      </p>
                                      <p className="text-sm text-red-700 dark:text-red-300">
                                        O prazo para anexar a nota fiscal expirou. Você precisa solicitar uma nova data
                                        ao financeiro.
                                      </p>
                                    </div>
                                  </div>
                                </div>
                                <Button
                                  onClick={() => {
                                    setPedidoSelecionado(pedido)
                                    setProrrogacaoDialogOpen(true)
                                  }}
                                  className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                                >
                                  <Clock className="w-4 h-4 mr-2" />
                                  Solicitar Nova Data
                                </Button>
                              </div>
                            ) : (
                              <>
                                <p className="text-sm font-medium text-green-900 dark:text-green-100">
                                  Você já emitiu sua nota?
                                </p>
                                <Button
                                  onClick={() => {
                                    setPedidoSelecionado(pedido)
                                    setDialogOpen(true)
                                  }}
                                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                                >
                                  <Upload className="w-4 h-4 mr-2" />
                                  Anexar Nota Fiscal
                                </Button>
                                <p className="text-xs text-center text-green-700 dark:text-green-300">
                                  * A nota será validada automaticamente
                                </p>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {isHistorico && pedido.nota_fiscal_url && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-green-100 dark:bg-green-900 border border-green-300 dark:border-green-700">
                          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                          <div className="flex-1">
                            <p className="font-medium text-green-900 dark:text-green-100">Nota Fiscal Enviada</p>
                            <p className="text-xs text-green-700 dark:text-green-300">
                              {pedido.data_emissao_nota &&
                                new Date(pedido.data_emissao_nota).toLocaleDateString("pt-BR")}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          className="w-full bg-transparent"
                          onClick={() => openPdfSafely(pedido.nota_fiscal_url)}
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Ver Nota Fiscal
                        </Button>
                        {(pedido.status === "pago" || pedido.status === "nota_recebida") && (
                          <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                              <p className="font-medium text-blue-900 dark:text-blue-100">Pagamento Aprovado</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {pedido.data_previsao_pagamento && (
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
                        <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        <div>
                          <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Previsão de Pagamento</p>
                          <p className="font-semibold text-blue-700 dark:text-blue-300">
                            {pedido.data_previsao_pagamento.includes("T")
                              ? new Date(pedido.data_previsao_pagamento).toLocaleDateString("pt-BR")
                              : new Date(pedido.data_previsao_pagamento + "T12:00:00").toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="pt-4 border-t">
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-semibold">Valor Total</span>
                        <span className="text-2xl font-bold text-primary">{formatValue(pedido.valor_total)}</span>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {renderPedidos(pedidos || [], isHistorico)}
      {pedidoSelecionado && (
        <>
          <AnexarNotaDialog
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            pedidoId={pedidoSelecionado.id}
            colaboradorId={colaborador?.id || ""}
            valorEsperado={valorEsperado}
            mesAnoEsperado={mesAnoEsperado}
          />

          <Dialog open={prorrogacaoDialogOpen} onOpenChange={setProrrogacaoDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Solicitar Nova Data</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="motivo">Motivo da Solicitação *</Label>
                  <Textarea
                    id="motivo"
                    placeholder="Explique o motivo pelo qual você não conseguiu anexar a nota no prazo..."
                    value={motivoProrrogacao}
                    onChange={(e) => setMotivoProrrogacao(e.target.value)}
                    rows={4}
                    className="mt-2"
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Sua solicitação será enviada ao financeiro para análise.
                </p>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setProrrogacaoDialogOpen(false)
                    setMotivoProrrogacao("")
                    setPedidoSelecionado(null)
                  }}
                  disabled={solicitandoProrrogacao}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={() => handleSolicitarProrrogacao(pedidoSelecionado.id)}
                  disabled={solicitandoProrrogacao || !motivoProrrogacao.trim()}
                >
                  {solicitandoProrrogacao ? "Enviando..." : "Enviar Solicitação"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  )
}
