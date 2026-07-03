"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  FileText,
  Download,
  Search,
  Calendar,
  DollarSign,
  Receipt,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  CreditCard,
} from "lucide-react"
import type { PedidoPagamento } from "@/types/pedido"
import { useRouter } from "next/navigation"
import { listarEquipes } from "@/app/actions/equipes"
import { aprovarNotaFiscal, recusarNotaFiscal } from "@/app/actions/pedidos"
import type { Equipe } from "@/types/equipe"
import { useMaskedCurrency } from "@/components/currency-display"
import { useSystemStatus } from "./system-status-provider"
import { SystemSuspendedDialog } from "./system-suspended-dialog"

interface MarcarPagoListProps {
  pedidos: PedidoPagamento[]
}

export function MarcarPagoList({ pedidos }: MarcarPagoListProps) {
  const router = useRouter()
  const { formatValue } = useMaskedCurrency()
  const { isSystemSuspended, suspensionReason } = useSystemStatus()
  const [suspendedDialogOpen, setSuspendedDialogOpen] = useState(false)
  const [equipes, setEquipes] = useState<Equipe[]>([])
  const [approvingId, setApprovingId] = useState<string | null>(null)
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [motivoRecusa, setMotivoRecusa] = useState<Record<string, string>>({})
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [filtros, setFiltros] = useState({
    dataInicio: "",
    dataFim: "",
    colaboradorNome: "",
    equipeId: "todas",
  })

  useEffect(() => {
    listarEquipes().then(setEquipes).catch(console.error)
  }, [])

  const handleFiltrar = () => {
    const params = new URLSearchParams()
    params.set("tab", "pagar")
    if (filtros.dataInicio) params.set("dataInicio", filtros.dataInicio)
    if (filtros.dataFim) params.set("dataFim", filtros.dataFim)
    if (filtros.colaboradorNome) params.set("colaboradorNome", filtros.colaboradorNome)
    if (filtros.equipeId && filtros.equipeId !== "todas") params.set("equipeId", filtros.equipeId)
    router.push(`/financeiro?${params.toString()}`)
  }

  const handleLimparFiltros = () => {
    setFiltros({ dataInicio: "", dataFim: "", colaboradorNome: "", equipeId: "todas" })
    router.push("/financeiro?tab=pagar")
  }

  const handleAprovarNota = async (pedidoId: string) => {
    if (isSystemSuspended) {
      setSuspendedDialogOpen(true)
      return
    }
    if (!confirm("Deseja marcar esta nota como recebida?")) return
    try {
      setApprovingId(pedidoId)
      await aprovarNotaFiscal(pedidoId)
      alert("Nota marcada como recebida com sucesso!")
      router.refresh()
    } catch (error) {
      console.error("[v0] Erro ao aprovar nota:", error)
      alert(error instanceof Error ? error.message : "Erro ao aprovar nota fiscal")
    } finally {
      setApprovingId(null)
    }
  }

  const handleRecusarNota = async (pedidoId: string) => {
    if (isSystemSuspended) {
      setSuspendedDialogOpen(true)
      return
    }
    const motivo = motivoRecusa[pedidoId]?.trim()
    if (!motivo) {
      alert("Por favor, informe o motivo da recusa")
      return
    }
    if (!confirm("Deseja recusar esta nota e solicitar correcao ao colaborador?")) return
    try {
      setRejectingId(pedidoId)
      await recusarNotaFiscal(pedidoId, motivo)
      alert("Nota fiscal recusada. O colaborador foi notificado.")
      setMotivoRecusa({ ...motivoRecusa, [pedidoId]: "" })
      router.refresh()
    } catch (error) {
      console.error("[v0] Erro ao recusar nota:", error)
      alert(error instanceof Error ? error.message : "Erro ao recusar nota fiscal")
    } finally {
      setRejectingId(null)
    }
  }

  if (pedidos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="rounded-full bg-muted p-6 mb-4">
          <CreditCard className="w-12 h-12 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Nenhum pedido pronto para pagamento</h3>
        <p className="text-muted-foreground">
          Todos os pedidos com nota fiscal ja foram pagos ou nao ha pedidos com nota anexada.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <SystemSuspendedDialog 
        open={suspendedDialogOpen} 
        onOpenChange={setSuspendedDialogOpen}
        reason={suspensionReason}
      />
      
      <Card className="p-4">
        <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
          <Search className="w-4 h-4" />
          Filtros
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="mpDataInicio" className="text-sm">Data Inicio</Label>
            <Input
              id="mpDataInicio"
              type="date"
              value={filtros.dataInicio}
              onChange={(e) => setFiltros({ ...filtros, dataInicio: e.target.value })}
              className="h-9"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="mpDataFim" className="text-sm">Data Fim</Label>
            <Input
              id="mpDataFim"
              type="date"
              value={filtros.dataFim}
              onChange={(e) => setFiltros({ ...filtros, dataFim: e.target.value })}
              className="h-9"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="mpNome" className="text-sm">Colaborador</Label>
            <Input
              id="mpNome"
              type="text"
              placeholder="Digite o nome..."
              value={filtros.colaboradorNome}
              onChange={(e) => setFiltros({ ...filtros, colaboradorNome: e.target.value })}
              className="h-9"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="mpEquipe" className="text-sm">Equipe</Label>
            <Select value={filtros.equipeId} onValueChange={(value) => setFiltros({ ...filtros, equipeId: value })}>
              <SelectTrigger id="mpEquipe" className="h-9">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas</SelectItem>
                {equipes.map((e) => (
                  <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex gap-2 mt-3">
          <Button onClick={handleFiltrar} size="sm" className="h-9">
            <Search className="w-3.5 h-3.5 mr-1.5" />
            Filtrar
          </Button>
          <Button variant="outline" size="sm" onClick={handleLimparFiltros} className="h-9 bg-transparent">
            Limpar
          </Button>
        </div>
      </Card>

      <div className="space-y-2">
        <p className="text-sm text-muted-foreground px-1">
          {pedidos.length} {pedidos.length === 1 ? "pedido pronto" : "pedidos prontos"} para pagamento
        </p>

        {pedidos.map((pedido) => {
          let notaFiscal = null
          if (pedido.notas_fiscais) {
            notaFiscal = Array.isArray(pedido.notas_fiscais) ? pedido.notas_fiscais[0] || null : pedido.notas_fiscais
          }
          const pdfUrl = notaFiscal?.arquivo_pdf_url || pedido.nota_fiscal_url
          const xmlUrl = notaFiscal?.arquivo_xml_url

          const isReembolsoKm = pedido.tipo_pedido === "reembolso_km"
          const valorEsperadoNF = isReembolsoKm
            ? pedido.valor_km
            : (pedido.colaborador?.salario || 0) +
              (pedido.horas_extras || 0) +
              (pedido.valor_plantao || 0) +
              (pedido.comissao || 0) -
              (pedido.valor_desconto || 0)

          const isExpanded = expandedId === pedido.id

          return (
            <Card key={pedido.id} className="p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold truncate">
                      {pedido.colaborador?.nome_completo || "Colaborador"}
                    </h3>
                    {pedido.status === "nota_recebida" ? (
                      <Badge variant="default" className="bg-teal-600 text-xs px-2 py-0">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Nota Recebida
                      </Badge>
                    ) : pedido.status === "pago" ? (
                      <Badge variant="default" className="bg-emerald-600 text-xs px-2 py-0">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Pago
                      </Badge>
                    ) : (
                      <Badge variant="default" className="bg-green-600 text-xs px-2 py-0">
                        <FileText className="w-3 h-3 mr-1" />
                        {isReembolsoKm ? "Reembolso KM" : "Nota Anexada"}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mt-0.5 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {pedido.data_emissao_nota
                        ? new Date(pedido.data_emissao_nota).toLocaleDateString("pt-BR")
                        : new Date(pedido.created_at).toLocaleDateString("pt-BR")}
                    </span>
                    <span className="flex items-center gap-1 font-semibold text-blue-600">
                      <Receipt className="w-3 h-3" />
                      NF: {formatValue(valorEsperadoNF)}
                    </span>
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      Total: {formatValue(pedido.valor_total)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {pdfUrl && (
                    <Button asChild variant="outline" size="sm" className="h-8 bg-transparent">
                      <a
                        href={pdfUrl}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => {
                          if (!pdfUrl || pdfUrl.includes("undefined")) {
                            e.preventDefault()
                            alert("PDF nao disponivel.")
                          }
                        }}
                      >
                        <Download className="w-3.5 h-3.5 mr-1" />
                        PDF
                      </a>
                    </Button>
                  )}
                  {xmlUrl && (
                    <Button asChild variant="outline" size="sm" className="h-8 bg-transparent">
                      <a href={xmlUrl} download target="_blank" rel="noopener noreferrer">
                        <Download className="w-3.5 h-3.5 mr-1" />
                        XML
                      </a>
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setExpandedId(isExpanded ? null : pedido.id)}
                    className="h-8 px-2"
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              {isExpanded && (
                <div className="mt-3 pt-3 border-t space-y-3">
                  {isReembolsoKm ? (
                    <div className="bg-muted/30 p-2 rounded">
                      <span className="text-xs text-muted-foreground block">Quilometragem (Reembolso)</span>
                      <span className="font-semibold text-sm">{formatValue(pedido.valor_km || 0)}</span>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs bg-muted/30 p-2 rounded">
                        <div>
                          <span className="text-muted-foreground block">Salario</span>
                          <span className="font-semibold">{formatValue(pedido.colaborador?.salario || 0)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block">Horas Extras</span>
                          <span className="font-semibold">{formatValue(pedido.horas_extras || 0)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block">Plantao</span>
                          <span className="font-semibold">{formatValue(pedido.valor_plantao || 0)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block">Comissao</span>
                          <span className="font-semibold">{formatValue(pedido.comissao || 0)}</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs bg-teal-50 border border-teal-200 p-2 rounded">
                        <div>
                          <span className="text-teal-700 block">Conducao (fora da NF)</span>
                          <span className="font-semibold text-teal-800">{formatValue(pedido.conducao || 0)}</span>
                        </div>
                        <div>
                          <span className="text-teal-700 block">Quilometragem (fora da NF)</span>
                          <span className="font-semibold text-teal-800">{formatValue(pedido.valor_km || 0)}</span>
                        </div>
                      </div>
                    </>
                  )}

                  {(pedido.valor_desconto || 0) > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded p-2">
                      <span className="text-xs text-muted-foreground block">Desconto</span>
                      <span className="font-semibold text-red-600 text-sm">
                        -{formatValue(pedido.valor_desconto || 0)}
                      </span>
                      {pedido.motivo_desconto && (
                        <span className="text-xs text-muted-foreground block mt-1">
                          Motivo: {pedido.motivo_desconto}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="bg-blue-50 border border-blue-200 rounded p-2">
                    <div className="flex justify-between items-end">
                      {!isReembolsoKm && (
                        <div>
                          <div className="text-xs text-muted-foreground">Valor para Nota Fiscal</div>
                          <div className="text-sm font-semibold text-blue-600">{formatValue(valorEsperadoNF)}</div>
                        </div>
                      )}
                      <div className={`text-right ${isReembolsoKm ? "w-full" : ""}`}>
                        <div className="text-xs text-muted-foreground">Total do Pedido</div>
                        <div className="text-sm font-semibold">{formatValue(pedido.valor_total)}</div>
                      </div>
                    </div>
                  </div>

                  {pedido.status === "nota_recebida" || pedido.status === "pago" ? (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2 text-green-700">
                        <CheckCircle className="w-5 h-5" />
                        <span className="font-medium">
                          {pedido.status === "pago" ? "Pagamento Concluído" : "Nota Recebida - Aguardando Pagamento"}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="space-y-1.5">
                        <Label htmlFor={`motivo-mp-${pedido.id}`} className="text-sm">
                          Motivo da Recusa (se houver erro)
                        </Label>
                        <Textarea
                          id={`motivo-mp-${pedido.id}`}
                          placeholder="Ex: Valor da nota incorreto..."
                          value={motivoRecusa[pedido.id] || ""}
                          onChange={(e) => setMotivoRecusa({ ...motivoRecusa, [pedido.id]: e.target.value })}
                          rows={2}
                          className="text-sm"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          onClick={() => handleAprovarNota(pedido.id)}
                          disabled={approvingId === pedido.id}
                          className="bg-green-600 hover:bg-green-700 text-white h-9"
                          size="sm"
                        >
                          <CheckCircle className="w-4 h-4 mr-1.5" />
                          {approvingId === pedido.id ? "Processando..." : "Nota Recebida"}
                        </Button>
                        <Button
                          onClick={() => handleRecusarNota(pedido.id)}
                          disabled={rejectingId === pedido.id}
                          variant="destructive"
                          className="h-9"
                          size="sm"
                        >
                          <XCircle className="w-4 h-4 mr-1.5" />
                          {rejectingId === pedido.id ? "Recusando..." : "Recusar Nota"}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}
