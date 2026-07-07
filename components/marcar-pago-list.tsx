"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Download,
  Search,
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

const STATUS_LABELS: Record<string, string> = {
  nota_recebida: "Nota Recebida",
  pago: "Pago",
}

const STATUS_VARIANT: Record<string, "outline" | "success"> = {
  nota_recebida: "success",
  pago: "success",
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
  const [confirmAprovarId, setConfirmAprovarId] = useState<string | null>(null)
  const [confirmRecusarId, setConfirmRecusarId] = useState<string | null>(null)
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
    try {
      setRejectingId(pedidoId)
      await recusarNotaFiscal(pedidoId, motivo)
      alert("Nota fiscal recusada. O prestador foi notificado.")
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
        <CreditCard className="w-8 h-8 text-muted-foreground mb-4" />
        <h3 className="text-base font-semibold mb-1">Nenhum pedido pronto para pagamento</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          Todos os pedidos com nota fiscal já foram pagos ou não há pedidos com nota anexada.
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

      <div>
        <h3 className="text-sm font-medium mb-4">Filtros</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="mpDataInicio" className="text-xs text-muted-foreground">Data início</Label>
            <Input
              id="mpDataInicio"
              type="date"
              value={filtros.dataInicio}
              onChange={(e) => setFiltros({ ...filtros, dataInicio: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="mpDataFim" className="text-xs text-muted-foreground">Data fim</Label>
            <Input
              id="mpDataFim"
              type="date"
              value={filtros.dataFim}
              onChange={(e) => setFiltros({ ...filtros, dataFim: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="mpNome" className="text-xs text-muted-foreground">Prestador</Label>
            <Input
              id="mpNome"
              type="text"
              placeholder="Digite o nome..."
              value={filtros.colaboradorNome}
              onChange={(e) => setFiltros({ ...filtros, colaboradorNome: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="mpEquipe" className="text-xs text-muted-foreground">Equipe</Label>
            <Select value={filtros.equipeId} onValueChange={(value) => setFiltros({ ...filtros, equipeId: value })}>
              <SelectTrigger id="mpEquipe">
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
        <div className="flex gap-2 mt-4">
          <Button onClick={handleFiltrar} size="sm">
            <Search className="w-3.5 h-3.5" />
            Filtrar
          </Button>
          <Button variant="ghost" size="sm" onClick={handleLimparFiltros}>
            Limpar
          </Button>
        </div>
      </div>

      <div>
        <p className="text-sm text-muted-foreground mb-3">
          {pedidos.length} {pedidos.length === 1 ? "pedido pronto" : "pedidos prontos"} para pagamento
        </p>

        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Prestador</TableHead>
                <TableHead>Emitida em</TableHead>
                <TableHead className="text-right">Valor NF</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-8" />
              </TableRow>
            </TableHeader>
            <TableBody>
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
                const aguardandoAcao = pedido.status !== "nota_recebida" && pedido.status !== "pago"
                const statusLabel = STATUS_LABELS[pedido.status] || (isReembolsoKm ? "Reembolso KM" : "Nota Anexada")
                const statusVariant = STATUS_VARIANT[pedido.status] || "outline"

                return (
                  <>
                    <TableRow
                      key={pedido.id}
                      className="cursor-pointer"
                      onClick={() => setExpandedId(isExpanded ? null : pedido.id)}
                    >
                      <TableCell className="font-medium">{pedido.colaborador?.nome_completo || "Prestador"}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {pedido.data_emissao_nota
                          ? new Date(pedido.data_emissao_nota).toLocaleDateString("pt-BR")
                          : new Date(pedido.created_at).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{formatValue(valorEsperadoNF)}</TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">{formatValue(pedido.valor_total)}</TableCell>
                      <TableCell>
                        <Badge variant={statusVariant} className="font-normal">
                          {statusLabel}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </TableCell>
                    </TableRow>

                    {isExpanded && (
                      <TableRow key={`${pedido.id}-detail`}>
                        <TableCell colSpan={6} className="bg-muted/20 px-6 py-5">
                          <div className="space-y-4">
                            {isReembolsoKm ? (
                              <div className="text-sm">
                                <p className="text-xs text-muted-foreground mb-1">Quilometragem (reembolso)</p>
                                <p className="font-medium tabular-nums">{formatValue(pedido.valor_km || 0)}</p>
                              </div>
                            ) : (
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-4 text-sm">
                                <div>
                                  <p className="text-xs text-muted-foreground mb-1">Valor contratual</p>
                                  <p className="font-medium tabular-nums">{formatValue(pedido.colaborador?.salario || 0)}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground mb-1">Horas extras</p>
                                  <p className="font-medium tabular-nums">{formatValue(pedido.horas_extras || 0)}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground mb-1">Plantão</p>
                                  <p className="font-medium tabular-nums">{formatValue(pedido.valor_plantao || 0)}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground mb-1">Comissão</p>
                                  <p className="font-medium tabular-nums">{formatValue(pedido.comissao || 0)}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground mb-1">Condução (fora da NF)</p>
                                  <p className="font-medium tabular-nums">{formatValue(pedido.conducao || 0)}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground mb-1">Quilometragem (fora da NF)</p>
                                  <p className="font-medium tabular-nums">{formatValue(pedido.valor_km || 0)}</p>
                                </div>
                                {(pedido.valor_desconto || 0) > 0 && (
                                  <div>
                                    <p className="text-xs text-muted-foreground mb-1">Desconto</p>
                                    <p className="font-medium tabular-nums text-destructive">
                                      -{formatValue(pedido.valor_desconto || 0)}
                                    </p>
                                    {pedido.motivo_desconto && (
                                      <p className="text-xs text-muted-foreground mt-1">{pedido.motivo_desconto}</p>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}

                            {(pdfUrl || xmlUrl) && (
                              <div className="flex gap-2 pt-4 border-t">
                                {pdfUrl && (
                                  <Button asChild variant="outline" size="sm">
                                    <a
                                      href={pdfUrl}
                                      download
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={(e) => {
                                        if (!pdfUrl || pdfUrl.includes("undefined")) {
                                          e.preventDefault()
                                          alert("PDF não disponível.")
                                        }
                                      }}
                                    >
                                      <Download className="w-3.5 h-3.5" />
                                      PDF
                                    </a>
                                  </Button>
                                )}
                                {xmlUrl && (
                                  <Button asChild variant="outline" size="sm">
                                    <a href={xmlUrl} download target="_blank" rel="noopener noreferrer">
                                      <Download className="w-3.5 h-3.5" />
                                      XML
                                    </a>
                                  </Button>
                                )}
                              </div>
                            )}

                            {!aguardandoAcao ? (
                              <div className="flex items-center gap-2 text-success pt-4 border-t text-sm">
                                <CheckCircle className="w-4 h-4" />
                                <span className="font-medium">
                                  {pedido.status === "pago" ? "Pagamento concluído" : "Nota recebida — aguardando pagamento"}
                                </span>
                              </div>
                            ) : (
                              <div className="space-y-3 pt-4 border-t">
                                <div className="space-y-1.5">
                                  <Label htmlFor={`motivo-mp-${pedido.id}`} className="text-xs text-muted-foreground">
                                    Motivo da recusa (se houver erro)
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
                                <div className="flex gap-2">
                                  <Button
                                    onClick={() => {
                                      if (isSystemSuspended) {
                                        setSuspendedDialogOpen(true)
                                        return
                                      }
                                      setConfirmAprovarId(pedido.id)
                                    }}
                                    disabled={approvingId === pedido.id}
                                    size="sm"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                    {approvingId === pedido.id ? "Processando..." : "Nota Recebida"}
                                  </Button>
                                  <Button
                                    onClick={() => {
                                      if (isSystemSuspended) {
                                        setSuspendedDialogOpen(true)
                                        return
                                      }
                                      if (!motivoRecusa[pedido.id]?.trim()) {
                                        alert("Por favor, informe o motivo da recusa")
                                        return
                                      }
                                      setConfirmRecusarId(pedido.id)
                                    }}
                                    disabled={rejectingId === pedido.id}
                                    variant="destructive"
                                    size="sm"
                                  >
                                    <XCircle className="w-4 h-4" />
                                    {rejectingId === pedido.id ? "Recusando..." : "Recusar Nota"}
                                  </Button>
                                </div>

                                <AlertDialog
                                  open={confirmAprovarId === pedido.id}
                                  onOpenChange={(open) => !open && setConfirmAprovarId(null)}
                                >
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Marcar nota como recebida?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Confirma que a nota fiscal deste pedido foi recebida e conferida?
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => {
                                          setConfirmAprovarId(null)
                                          handleAprovarNota(pedido.id)
                                        }}
                                      >
                                        Confirmar
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>

                                <AlertDialog
                                  open={confirmRecusarId === pedido.id}
                                  onOpenChange={(open) => !open && setConfirmRecusarId(null)}
                                >
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Recusar esta nota fiscal?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        O prestador será notificado e precisará reenviar a nota corrigida.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                      <AlertDialogAction
                                        className={buttonVariants({ variant: "destructive" })}
                                        onClick={() => {
                                          setConfirmRecusarId(null)
                                          handleRecusarNota(pedido.id)
                                        }}
                                      >
                                        Recusar
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
