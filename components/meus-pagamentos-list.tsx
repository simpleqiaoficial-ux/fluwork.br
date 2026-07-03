"use client"

import type { Colaborador } from "@/types/colaborador"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Calendar,
  Clock,
  CheckCircle,
  Upload,
  ExternalLink,
  AlertCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
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
        <div className="flex items-center justify-center py-16 text-center">
          <p className="text-muted-foreground text-sm">
            {isHistorico
              ? "Nenhum pagamento no histórico ainda"
              : colaborador?.tipo_acesso === "Colaborador"
                ? "Nenhum pagamento aprovado ainda"
                : "Nenhum pagamento registrado ainda"}
          </p>
        </div>
      )
    }

    return (
      <div className="divide-y">
        {pedidos.map((pedido) => {
          // Valor da NF = Salário + HE + Plantão - Desconto (sem condução e KM)
          const valorParaEmitir =
            (colaborador?.salario || 0) +
            pedido.horas_extras +
            (pedido.valor_plantao || 0) -
            (pedido.valor_desconto || 0)
          const isReembolsoKm = pedido.tipo_pedido === "reembolso_km"

          const prazoExpirado = pedido.data_limite_anexo_nota
            ? new Date(pedido.data_limite_anexo_nota).getTime() < new Date().getTime()
            : false

          const aguardandoProrrogacao = pedido.status === "aguardando_prorrogacao"
          const prorrogacaoNegada = pedido.status === "prorrogacao_negada"

          const isExpandedHistorico = isHistorico && expandedHistorico === pedido.id

          return (
            <div key={pedido.id} className="py-6 first:pt-0 last:pb-0 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold">
                    {isReembolsoKm ? "Reembolso de Quilometragem" : "Pedido de Pagamento"}
                  </h3>
                  {isReembolsoKm && (
                    <Badge variant="outline" className="font-normal">Apenas KM</Badge>
                  )}
                  {isHistorico && (
                    <Badge
                      variant={
                        pedido.status === "pago" || pedido.status === "nota_recebida" ? "success" : "outline"
                      }
                      className="font-normal"
                    >
                      {pedido.status === "pago" ? "Pago" : pedido.status === "nota_recebida" ? "Nota Recebida" : "Em Análise"}
                    </Badge>
                  )}
                  {aguardandoProrrogacao && (
                    <Badge variant="warning" className="font-normal">Aguardando Prorrogação</Badge>
                  )}
                  {prorrogacaoNegada && (
                    <Badge variant="destructive" className="font-normal">Prorrogação Negada</Badge>
                  )}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-sm text-muted-foreground">
                    {new Date(pedido.created_at).toLocaleDateString("pt-BR")}
                  </span>
                  {isHistorico && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setExpandedHistorico(isExpandedHistorico ? null : pedido.id)}
                    >
                      {isExpandedHistorico ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </Button>
                  )}
                </div>
              </div>

              {/* Timeline de Status do Pedido */}
              {!isHistorico && (
                <div>
                  <h4 className="text-xs text-muted-foreground mb-3">Acompanhe o progresso do seu pedido</h4>
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
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">
                        {isReembolsoKm ? "Quilometragem (Reembolso)" : "Valor para Nota Fiscal"}
                      </p>
                      <p className="text-2xl font-semibold tabular-nums">
                        {formatValue(isReembolsoKm ? pedido.valor_km : valorParaEmitir)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground mb-1">Total do pedido</p>
                      <p className="text-base font-medium tabular-nums">{formatValue(pedido.valor_total)}</p>
                    </div>
                  </div>

                  {pedido.valor_desconto && pedido.valor_desconto > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Desconto</span>
                      <span className="text-destructive font-medium tabular-nums">
                        -{formatValue(pedido.valor_desconto)}
                      </span>
                    </div>
                  )}

                  {pedido.nota_fiscal_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openPdfSafely(pedido.nota_fiscal_url)}
                    >
                      <ExternalLink className="w-4 h-4" />
                      Ver Nota Fiscal
                    </Button>
                  )}
                </div>
              ) : (
                <>
                  {isReembolsoKm ? (
                    <div className="text-sm">
                      <p className="text-xs text-muted-foreground mb-1">Quilometragem</p>
                      <p className="font-medium tabular-nums">{formatValue(pedido.valor_km)}</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-x-6 gap-y-4 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Valor Contratual Base</p>
                        <p className="font-medium tabular-nums">{formatValue(colaborador?.salario || 0)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Horas Extras</p>
                        <p className="font-medium tabular-nums">{formatValue(pedido.horas_extras)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Quilometragem</p>
                        <p className="font-medium tabular-nums">{formatValue(pedido.valor_km)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Condução</p>
                        <p className="font-medium tabular-nums">{formatValue(pedido.conducao)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Plantão</p>
                        <p className="font-medium tabular-nums">{formatValue(pedido.valor_plantao)}</p>
                      </div>
                    </div>
                  )}

                  {!isReembolsoKm && pedido.valor_desconto && pedido.valor_desconto > 0 && (
                    <div className="text-sm">
                      <p className="text-xs text-muted-foreground mb-1">Desconto aplicado</p>
                      <p className="font-medium tabular-nums text-destructive">
                        -{formatValue(pedido.valor_desconto)}
                      </p>
                      {pedido.motivo_desconto && (
                        <p className="text-xs text-muted-foreground mt-1">{pedido.motivo_desconto}</p>
                      )}
                    </div>
                  )}

                  {aguardandoProrrogacao && (
                    <div className="border-l-2 border-warning pl-4 py-1">
                      <div className="flex items-center gap-2 text-warning mb-1">
                        <Clock className="w-4 h-4" />
                        <p className="text-sm font-medium">Solicitação de prorrogação em análise</p>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Sua solicitação de prorrogação de prazo foi enviada ao financeiro e está aguardando aprovação.
                      </p>
                      {pedido.motivo_prorrogacao && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Motivo informado: {pedido.motivo_prorrogacao}
                        </p>
                      )}
                    </div>
                  )}

                  {prorrogacaoNegada && (
                    <div className="border-l-2 border-destructive pl-4 py-1">
                      <div className="flex items-center gap-2 text-destructive mb-1">
                        <XCircle className="w-4 h-4" />
                        <p className="text-sm font-medium">Prorrogação negada</p>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Sua solicitação de prorrogação foi negada pelo financeiro.
                      </p>
                      {pedido.observacao_prorrogacao && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Motivo da negação: {pedido.observacao_prorrogacao}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground mt-2">
                        Entre em contato com o seu supervisor para resolver esta situação.
                      </p>
                    </div>
                  )}

                  {pedido.status === "aprovado" && !isReembolsoKm && !isHistorico && (
                    <div className="space-y-3 pt-4 border-t">
                      <div>
                        <p className="font-medium text-sm mb-1">Valor para emitir nota</p>
                        <p className="text-xs text-muted-foreground mb-2">
                          Salário base + horas extras + condução + plantão − desconto
                        </p>
                        <p className="text-2xl font-semibold tabular-nums">{formatValue(valorParaEmitir)}</p>
                      </div>

                      {pedido.nota_emitida ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-success text-sm">
                            <CheckCircle className="w-4 h-4" />
                            <span className="font-medium">
                              Nota emitida
                              {pedido.data_emissao_nota &&
                                ` em ${new Date(pedido.data_emissao_nota).toLocaleDateString("pt-BR")}`}
                            </span>
                          </div>
                          {pedido.nota_fiscal_url && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openPdfSafely(pedido.nota_fiscal_url)}
                            >
                              <ExternalLink className="w-4 h-4" />
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
                              <div className="border-l-2 border-destructive pl-4 py-1">
                                <div className="flex items-center gap-2 text-destructive mb-1">
                                  <AlertCircle className="w-4 h-4" />
                                  <p className="text-sm font-medium">Você não anexou a nota a tempo</p>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  O prazo para anexar a nota fiscal expirou. Você precisa solicitar uma nova data ao
                                  financeiro.
                                </p>
                              </div>
                              <Button
                                onClick={() => {
                                  setPedidoSelecionado(pedido)
                                  setProrrogacaoDialogOpen(true)
                                }}
                                size="sm"
                              >
                                <Clock className="w-4 h-4" />
                                Solicitar Nova Data
                              </Button>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <p className="text-sm text-muted-foreground">Você já emitiu sua nota?</p>
                              <Button
                                onClick={() => {
                                  setPedidoSelecionado(pedido)
                                  setDialogOpen(true)
                                }}
                                size="sm"
                              >
                                <Upload className="w-4 h-4" />
                                Anexar Nota Fiscal
                              </Button>
                              <p className="text-xs text-muted-foreground">A nota será validada automaticamente</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {isHistorico && pedido.nota_fiscal_url && (
                    <div className="space-y-2 pt-4 border-t">
                      <div className="flex items-center gap-2 text-success text-sm">
                        <CheckCircle className="w-4 h-4" />
                        <span className="font-medium">
                          Nota fiscal enviada
                          {pedido.data_emissao_nota &&
                            ` em ${new Date(pedido.data_emissao_nota).toLocaleDateString("pt-BR")}`}
                        </span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openPdfSafely(pedido.nota_fiscal_url)}
                      >
                        <ExternalLink className="w-4 h-4" />
                        Ver Nota Fiscal
                      </Button>
                      {(pedido.status === "pago" || pedido.status === "nota_recebida") && (
                        <p className="text-sm font-medium">Pagamento aprovado</p>
                      )}
                    </div>
                  )}

                  {pedido.data_previsao_pagamento && (
                    <div className="flex items-center gap-2 text-sm pt-4 border-t">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Previsão de pagamento:</span>
                      <span className="font-medium">
                        {pedido.data_previsao_pagamento.includes("T")
                          ? new Date(pedido.data_previsao_pagamento).toLocaleDateString("pt-BR")
                          : new Date(pedido.data_previsao_pagamento + "T12:00:00").toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t">
                    <span className="font-semibold">Valor Total</span>
                    <span className="text-xl font-semibold tabular-nums">{formatValue(pedido.valor_total)}</span>
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div>
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
