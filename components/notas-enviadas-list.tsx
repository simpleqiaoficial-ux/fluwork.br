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
} from "lucide-react"
import type { PedidoPagamento } from "@/types/pedido"
import { useRouter } from "next/navigation"
import { listarEquipes } from "@/app/actions/equipes"
import { aprovarNotaFiscal, recusarNotaFiscal } from "@/app/actions/pedidos"
import type { Equipe } from "@/types/equipe"
import type { Pedido } from "@/types/pedido" // Import Pedido type

interface NotasEnviadasListProps {
  pedidos: PedidoPagamento[]
  canApprove?: boolean
}

export function NotasEnviadasList({ pedidos, canApprove = true }: NotasEnviadasListProps) {
  const router = useRouter()
  const [equipes, setEquipes] = useState<Equipe[]>([])
  const [approvingId, setApprovingId] = useState<string | null>(null)
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [motivoRecusa, setMotivoRecusa] = useState<{ [key: string]: string }>({})
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
    if (filtros.dataInicio) params.set("dataInicio", filtros.dataInicio)
    if (filtros.dataFim) params.set("dataFim", filtros.dataFim)
    if (filtros.colaboradorNome) params.set("colaboradorNome", filtros.colaboradorNome)
    if (filtros.equipeId && filtros.equipeId !== "todas") params.set("equipeId", filtros.equipeId)

    router.push(`/financeiro?${params.toString()}`)
  }

  const handleLimparFiltros = () => {
    setFiltros({ dataInicio: "", dataFim: "", colaboradorNome: "", equipeId: "todas" })
    router.push("/financeiro")
  }

  const handleAprovarNota = async (pedidoId: string) => {
    const pedido = pedidos.find((p) => p.id === pedidoId)
    if (!pedido) return

    // Check if nota fiscal exists
    const hasNotaFiscal =
      pedido.nota_fiscal_url ||
      (pedido.notas_fiscais &&
        ((Array.isArray(pedido.notas_fiscais) && pedido.notas_fiscais.length > 0) ||
          (!Array.isArray(pedido.notas_fiscais) && pedido.notas_fiscais)))

    // Check if it's only KM (doesn't need nota fiscal)
    const isReembolsoKm = pedido.tipo_pedido === "reembolso_km"
    const hasOnlyKm =
      !isReembolsoKm &&
      pedido.valor_km > 0 &&
      (pedido.colaborador?.salario || 0) === 0 &&
      pedido.horas_extras === 0 &&
      (pedido.conducao || 0) === 0 &&
      pedido.valor_plantao === 0

    // Block if no nota and not KM-only
    if (!hasNotaFiscal && !isReembolsoKm && !hasOnlyKm) {
      alert(
        "Este pedido não pode ser aprovado pois não possui nota fiscal anexada. Solicite ao colaborador que anexe a nota fiscal primeiro.",
      )
      return
    }

    if (!confirm("Deseja marcar esta nota como recebida?")) {
      return
    }

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
    const motivo = motivoRecusa[pedidoId]?.trim()

    if (!motivo) {
      alert("Por favor, informe o motivo da recusa")
      return
    }

    if (!confirm("Deseja recusar esta nota e solicitar correção ao colaborador?")) {
      return
    }

    try {
      setRejectingId(pedidoId)
      await recusarNotaFiscal(pedidoId, motivo)
      alert("Nota fiscal recusada. O colaborador foi notificado para anexar uma nova nota.")
      setMotivoRecusa({ ...motivoRecusa, [pedidoId]: "" })
      router.refresh()
    } catch (error) {
      console.error("[v0] Erro ao recusar nota:", error)
      alert(error instanceof Error ? error.message : "Erro ao recusar nota fiscal")
    } finally {
      setRejectingId(null)
    }
  }

  const aprovarNota = async (pedido: Pedido) => {
    const hasNotaFiscal =
      pedido.nota_fiscal_url || // Check old field first
      (pedido.notas_fiscais &&
        ((Array.isArray(pedido.notas_fiscais) && pedido.notas_fiscais.length > 0) ||
          (!Array.isArray(pedido.notas_fiscais) && pedido.notas_fiscais)))

    return hasNotaFiscal
  }

  if (pedidos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="rounded-full bg-muted p-6 mb-4">
          <FileText className="w-12 h-12 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold mb-2 flex items-center gap-2">
          <Search className="w-4 h-4" />
          Filtros
        </h3>
        <p className="text-muted-foreground">Não há notas fiscais anexadas pelos colaboradores no momento.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card className="p-4">
        <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
          <Search className="w-4 h-4" />
          Filtros
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="dataInicio" className="text-sm">
              Data Início
            </Label>
            <Input
              id="dataInicio"
              type="date"
              value={filtros.dataInicio}
              onChange={(e) => setFiltros({ ...filtros, dataInicio: e.target.value })}
              className="h-9"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dataFim" className="text-sm">
              Data Fim
            </Label>
            <Input
              id="dataFim"
              type="date"
              value={filtros.dataFim}
              onChange={(e) => setFiltros({ ...filtros, dataFim: e.target.value })}
              className="h-9"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="colaboradorNome" className="text-sm">
              Colaborador
            </Label>
            <Input
              id="colaboradorNome"
              type="text"
              placeholder="Digite o nome..."
              value={filtros.colaboradorNome}
              onChange={(e) => setFiltros({ ...filtros, colaboradorNome: e.target.value })}
              className="h-9"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="equipe" className="text-sm">
              Equipe
            </Label>
            <Select value={filtros.equipeId} onValueChange={(value) => setFiltros({ ...filtros, equipeId: value })}>
              <SelectTrigger id="equipe" className="h-9">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas</SelectItem>
                <SelectItem value="sem-equipe">Sem Equipe</SelectItem>
                {equipes.map((equipe) => (
                  <SelectItem key={equipe.id} value={equipe.id}>
                    {equipe.nome}
                  </SelectItem>
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

      {/* Lista de Notas - Compact */}
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground px-1">
          {pedidos.length} {pedidos.length === 1 ? "nota encontrada" : "notas encontradas"}
        </p>

        {pedidos.map((pedido) => {
          let notaFiscal = null

          if (pedido.notas_fiscais) {
            if (Array.isArray(pedido.notas_fiscais)) {
              notaFiscal = pedido.notas_fiscais[0] || null
            } else {
              notaFiscal = pedido.notas_fiscais
            }
          }

          const pdfUrl = notaFiscal?.arquivo_pdf_url || pedido.nota_fiscal_url
          const xmlUrl = notaFiscal?.arquivo_xml_url

          const isReembolsoKm = pedido.tipo_pedido === "reembolso_km"
          // Valor da NF = Salário + HE + Plantão + Comissão - Desconto (sem condução e KM)
          const valorEsperadoNF = isReembolsoKm
            ? pedido.valor_km
            : (pedido.colaborador?.salario || 0) +
              (pedido.horas_extras || 0) +
              (pedido.valor_plantao || 0) +
              (pedido.comissao || 0) -
              (pedido.valor_desconto || 0)

          const hasNotaFiscal =
            pedido.nota_fiscal_url ||
            (pedido.notas_fiscais &&
              ((Array.isArray(pedido.notas_fiscais) && pedido.notas_fiscais.length > 0) ||
                (!Array.isArray(pedido.notas_fiscais) && pedido.notas_fiscais)))

          const hasOnlyKm =
            pedido.valor_km > 0 &&
            (pedido.colaborador?.salario || 0) === 0 &&
            (pedido.horas_extras || 0) === 0 &&
            (pedido.conducao || 0) === 0 &&
            (pedido.valor_plantao || 0) === 0
          const canBeApproved = hasNotaFiscal || isReembolsoKm || hasOnlyKm

          const isExpanded = expandedId === pedido.id
          const isPaid = pedido.status === "pago" || pedido.status === "nota_recebida"

          return (
            <Card key={pedido.id} className="p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold truncate">
                      {pedido.colaborador?.nome_completo || "Colaborador"}
                    </h3>
                    <Badge
                      variant={isPaid ? "default" : "secondary"}
                      className={`${isPaid ? "bg-green-600" : "bg-amber-500 text-white"} text-xs px-2 py-0`}
                    >
                      {isPaid ? "Pago" : "Pendente"}
                    </Badge>
                    {!isPaid && !canBeApproved && (
                      <Badge variant="destructive" className="text-xs px-2 py-0 bg-red-600">
                        Sem Nota Fiscal
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mt-0.5">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {pedido.data_emissao_nota
                        ? new Date(pedido.data_emissao_nota).toLocaleDateString("pt-BR")
                        : "N/A"}
                    </span>
                    <span className="flex items-center gap-1 font-semibold text-blue-600">
                      <Receipt className="w-3 h-3" />
                      R$ {valorEsperadoNF.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </span>
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      Total: R$ {pedido.valor_total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
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
                          // Validate URL before opening
                          if (!pdfUrl || pdfUrl.includes("undefined") || pdfUrl.includes("null")) {
                            e.preventDefault()
                            console.error("[v0] Invalid PDF URL:", pdfUrl)
                            alert("Arquivo PDF não disponível ou foi removido.")
                          }
                        }}
                      >
                        <Download className="w-3.5 h-3.5 mr-1" />
                        PDF
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
                      <div>
                        <span className="text-xs text-muted-foreground block">Quilometragem (Reembolso)</span>
                        <span className="font-semibold text-sm">
                          R$ {(pedido.valor_km || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs bg-muted/30 p-2 rounded">
                      <div>
                        <span className="text-muted-foreground block">Salário</span>
                        <span className="font-semibold">
                          R$ {(pedido.colaborador?.salario || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">Horas Extras</span>
                        <span className="font-semibold">
                          R$ {(pedido.horas_extras || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">Condução</span>
                        <span className="font-semibold">
                          R$ {(pedido.conducao || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">Quilometragem</span>
                        <span className="font-semibold">
                          R$ {(pedido.valor_km || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">Plantão</span>
                        <span className="font-semibold">
                          R$ {(pedido.valor_plantao || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  )}

                  {pedido.horas_extras > 0 && pedido.motivo_horas_extras && (
                    <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded p-2">
                      <span className="text-xs text-muted-foreground block">Motivo das Horas Extras</span>
                      <span className="text-xs text-orange-800 dark:text-orange-200 block mt-1">
                        {pedido.motivo_horas_extras}
                      </span>
                    </div>
                  )}

                  {(() => {
                    const descontoAplicado = pedido.valor_desconto || 0

                    return descontoAplicado > 0 ? (
                      <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded p-2">
                        <span className="text-xs text-muted-foreground block">Desconto Aplicado</span>
                        <span className="font-semibold text-red-600 text-sm">
                          -R$ {descontoAplicado.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </span>
                        {pedido.motivo_desconto && (
                          <span className="text-xs text-muted-foreground block mt-1">
                            Motivo: {pedido.motivo_desconto}
                          </span>
                        )}
                      </div>
                    ) : null
                  })()}

                  <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded p-2">
                    <div className="text-xs text-muted-foreground mb-1">Resumo</div>
                    <div className="flex justify-between items-end">
                      {!isReembolsoKm && (
                        <div>
                          <div className="text-xs text-muted-foreground">Valor para Nota Fiscal</div>
                          <div className="text-sm font-semibold text-blue-600">
                            R$ {valorEsperadoNF.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </div>
                        </div>
                      )}
                      <div className={`text-right ${isReembolsoKm ? "w-full" : ""}`}>
                        <div className="text-xs text-muted-foreground">Total do Pedido</div>
                        <div className="text-sm font-semibold">
                          R$ {pedido.valor_total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                    </div>
                  </div>

                  {!canBeApproved && (
                    <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded p-3">
                      <div className="flex items-start gap-2">
                        <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold text-red-900 dark:text-red-100">Aguardando Nota Fiscal</p>
                          <p className="text-xs text-red-700 dark:text-red-200 mt-1">
                            O colaborador ainda precisa emitir e anexar a nota fiscal. Este pedido não pode ser aprovado
                            até que a nota seja anexada.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {pedido.status === "pendente_financeiro" && canApprove && (
                    <div className="space-y-2">
                      <div className="space-y-1.5">
                        <Label htmlFor={`motivo-${pedido.id}`} className="text-sm">
                          Motivo da Recusa (se houver erro na nota)
                        </Label>
                        <Textarea
                          id={`motivo-${pedido.id}`}
                          placeholder="Ex: Valor da nota está incorreto, falta informação, etc."
                          value={motivoRecusa[pedido.id] || ""}
                          onChange={(e) => setMotivoRecusa({ ...motivoRecusa, [pedido.id]: e.target.value })}
                          rows={2}
                          className="text-sm"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          onClick={() => handleAprovarNota(pedido.id)}
                          disabled={approvingId === pedido.id || !canBeApproved}
                          className="bg-green-600 hover:bg-green-700 text-white h-9 disabled:opacity-50 disabled:cursor-not-allowed"
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
