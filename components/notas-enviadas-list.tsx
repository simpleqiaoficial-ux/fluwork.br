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
import { Download, Search, ChevronDown, ChevronUp, FileX } from "lucide-react"
import type { PedidoPagamento } from "@/types/pedido"
import { useRouter } from "next/navigation"
import { EmptyState } from "@/components/ui/empty-state"
import { listarEquipes } from "@/app/actions/equipes"
import { aprovarNotaFiscal, recusarNotaFiscal } from "@/app/actions/pedidos"
import type { Equipe } from "@/types/equipe"
import type { Pedido } from "@/types/pedido" // Import Pedido type
import { toast } from "sonner"

interface NotasEnviadasListProps {
  pedidos: PedidoPagamento[]
  canApprove?: boolean
}

function formatDateBR(dateString: string) {
  return new Date(dateString).toLocaleDateString("pt-BR")
}

function formatReais(value: number) {
  return `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
}

export function NotasEnviadasList({ pedidos, canApprove = true }: NotasEnviadasListProps) {
  const router = useRouter()
  const [equipes, setEquipes] = useState<Equipe[]>([])
  const [approvingId, setApprovingId] = useState<string | null>(null)
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [motivoRecusa, setMotivoRecusa] = useState<{ [key: string]: string }>({})
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
      toast.error(
        "Este pedido não pode ser aprovado pois não possui nota fiscal anexada. Solicite ao prestador que anexe a nota fiscal primeiro.",
      )
      return
    }

    try {
      setApprovingId(pedidoId)
      await aprovarNotaFiscal(pedidoId)
      toast.success("Nota marcada como recebida com sucesso!")
      router.refresh()
    } catch (error) {
      console.error("[v0] Erro ao aprovar nota:", error)
      toast.error(error instanceof Error ? error.message : "Erro ao aprovar nota fiscal")
    } finally {
      setApprovingId(null)
    }
  }

  const handleRecusarNota = async (pedidoId: string) => {
    const motivo = motivoRecusa[pedidoId]?.trim()

    if (!motivo) {
      toast.error("Por favor, informe o motivo da recusa")
      return
    }

    try {
      setRejectingId(pedidoId)
      await recusarNotaFiscal(pedidoId, motivo)
      toast.success("Nota fiscal recusada. O prestador foi notificado para anexar uma nova nota.")
      setMotivoRecusa({ ...motivoRecusa, [pedidoId]: "" })
      router.refresh()
    } catch (error) {
      console.error("[v0] Erro ao recusar nota:", error)
      toast.error(error instanceof Error ? error.message : "Erro ao recusar nota fiscal")
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
      <EmptyState
        icon={FileX}
        title="Nenhuma nota fiscal enviada"
        description="Não há notas fiscais anexadas pelos prestadores no momento."
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div>
        <h3 className="text-sm font-medium mb-4">Filtros</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="dataInicio" className="text-xs text-muted-foreground">
              Data início
            </Label>
            <Input
              id="dataInicio"
              type="date"
              value={filtros.dataInicio}
              onChange={(e) => setFiltros({ ...filtros, dataInicio: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dataFim" className="text-xs text-muted-foreground">
              Data fim
            </Label>
            <Input
              id="dataFim"
              type="date"
              value={filtros.dataFim}
              onChange={(e) => setFiltros({ ...filtros, dataFim: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="colaboradorNome" className="text-xs text-muted-foreground">
              Colaborador
            </Label>
            <Input
              id="colaboradorNome"
              type="text"
              placeholder="Digite o nome..."
              value={filtros.colaboradorNome}
              onChange={(e) => setFiltros({ ...filtros, colaboradorNome: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="equipe" className="text-xs text-muted-foreground">
              Equipe
            </Label>
            <Select value={filtros.equipeId} onValueChange={(value) => setFiltros({ ...filtros, equipeId: value })}>
              <SelectTrigger id="equipe">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas</SelectItem>
                <SelectItem value="sem-equipe">Sem equipe</SelectItem>
                {equipes.map((equipe) => (
                  <SelectItem key={equipe.id} value={equipe.id}>
                    {equipe.nome}
                  </SelectItem>
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

      {/* Lista de notas */}
      <div>
        <p className="text-sm text-muted-foreground mb-3">
          {pedidos.length} {pedidos.length === 1 ? "nota encontrada" : "notas encontradas"}
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
                  if (Array.isArray(pedido.notas_fiscais)) {
                    notaFiscal = pedido.notas_fiscais[0] || null
                  } else {
                    notaFiscal = pedido.notas_fiscais
                  }
                }

                const pdfUrl = notaFiscal?.arquivo_pdf_url || pedido.nota_fiscal_url

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
                  <>
                    <TableRow
                      key={pedido.id}
                      className="cursor-pointer"
                      onClick={() => setExpandedId(isExpanded ? null : pedido.id)}
                    >
                      <TableCell className="font-medium">
                        {pedido.colaborador?.nome_completo || "Prestador"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {pedido.data_emissao_nota ? formatDateBR(pedido.data_emissao_nota) : "N/A"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{formatReais(valorEsperadoNF)}</TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">
                        {formatReais(pedido.valor_total)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Badge variant={isPaid ? "success" : "warning"} className="font-normal">
                            {isPaid ? "Pago" : "Pendente"}
                          </Badge>
                          {!isPaid && !canBeApproved && (
                            <Badge variant="destructive" className="font-normal">
                              Sem nota fiscal
                            </Badge>
                          )}
                        </div>
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
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Quilometragem (reembolso)</p>
                                <p className="font-medium tabular-nums">{formatReais(pedido.valor_km || 0)}</p>
                              </div>
                            ) : (
                              <div className="grid grid-cols-2 md:grid-cols-5 gap-x-6 gap-y-4 text-sm">
                                <div>
                                  <p className="text-xs text-muted-foreground mb-1">Valor Contratual</p>
                                  <p className="font-medium tabular-nums">
                                    {formatReais(pedido.colaborador?.salario || 0)}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground mb-1">Horas extras</p>
                                  <p className="font-medium tabular-nums">{formatReais(pedido.horas_extras || 0)}</p>
                                  {pedido.motivo_horas_extras && (
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                      {pedido.motivo_horas_extras}
                                    </p>
                                  )}
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground mb-1">Condução</p>
                                  <p className="font-medium tabular-nums">{formatReais(pedido.conducao || 0)}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground mb-1">Quilometragem</p>
                                  <p className="font-medium tabular-nums">{formatReais(pedido.valor_km || 0)}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground mb-1">Plantão</p>
                                  <p className="font-medium tabular-nums">{formatReais(pedido.valor_plantao || 0)}</p>
                                </div>
                                {(pedido.valor_desconto || 0) > 0 && (
                                  <div>
                                    <p className="text-xs text-muted-foreground mb-1">Desconto</p>
                                    <p className="font-medium tabular-nums text-destructive">
                                      -{formatReais(pedido.valor_desconto || 0)}
                                    </p>
                                    {pedido.motivo_desconto && (
                                      <p className="text-xs text-muted-foreground mt-0.5">
                                        {pedido.motivo_desconto}
                                      </p>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}

                            {!canBeApproved && (
                              <div className="border-l-2 border-destructive pl-4 py-0.5">
                                <p className="text-sm font-medium text-destructive">Aguardando nota fiscal</p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  O colaborador ainda precisa emitir e anexar a nota fiscal. Este pedido não pode ser
                                  aprovado até que a nota seja anexada.
                                </p>
                              </div>
                            )}

                            {pedido.status === "pendente_financeiro" && canApprove && (
                              <div className="space-y-3 pt-2 border-t">
                                <div className="space-y-1.5 pt-3">
                                  <Label htmlFor={`motivo-${pedido.id}`} className="text-xs text-muted-foreground">
                                    Motivo da recusa (se houver erro na nota)
                                  </Label>
                                  <Textarea
                                    id={`motivo-${pedido.id}`}
                                    placeholder="Ex: Valor da nota está incorreto, falta informação, etc."
                                    value={motivoRecusa[pedido.id] || ""}
                                    onChange={(e) => setMotivoRecusa({ ...motivoRecusa, [pedido.id]: e.target.value })}
                                    rows={2}
                                    className="text-sm"
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                </div>
                                <div
                                  className="flex flex-wrap items-center gap-2"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Button
                                    onClick={() => setConfirmAprovarId(pedido.id)}
                                    disabled={approvingId === pedido.id || !canBeApproved}
                                    size="sm"
                                  >
                                    {approvingId === pedido.id ? "Processando..." : "Marcar nota recebida"}
                                  </Button>
                                  <Button
                                    onClick={() => {
                                      if (!motivoRecusa[pedido.id]?.trim()) {
                                        toast.error("Por favor, informe o motivo da recusa")
                                        return
                                      }
                                      setConfirmRecusarId(pedido.id)
                                    }}
                                    disabled={rejectingId === pedido.id}
                                    variant="outline"
                                    className="text-destructive hover:text-destructive"
                                    size="sm"
                                  >
                                    {rejectingId === pedido.id ? "Recusando..." : "Recusar nota"}
                                  </Button>

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
                                          O prestador será notificado para anexar uma nova nota corrigida.
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
                                  {pdfUrl && (
                                    <Button
                                      asChild
                                      variant="ghost"
                                      size="sm"
                                      className="ml-auto"
                                    >
                                      <a
                                        href={pdfUrl}
                                        download
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={(e) => {
                                          if (!pdfUrl || pdfUrl.includes("undefined") || pdfUrl.includes("null")) {
                                            e.preventDefault()
                                            console.error("[v0] Invalid PDF URL:", pdfUrl)
                                            toast.error("Arquivo PDF não disponível ou foi removido.")
                                          }
                                        }}
                                      >
                                        <Download className="w-3.5 h-3.5" />
                                        Baixar PDF
                                      </a>
                                    </Button>
                                  )}
                                </div>
                              </div>
                            )}

                            {!(pedido.status === "pendente_financeiro" && canApprove) && pdfUrl && (
                              <div className="pt-3 border-t" onClick={(e) => e.stopPropagation()}>
                                <Button asChild variant="outline" size="sm">
                                  <a
                                    href={pdfUrl}
                                    download
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => {
                                      if (!pdfUrl || pdfUrl.includes("undefined") || pdfUrl.includes("null")) {
                                        e.preventDefault()
                                        toast.error("Arquivo PDF não disponível ou foi removido.")
                                      }
                                    }}
                                  >
                                    <Download className="w-3.5 h-3.5" />
                                    Baixar PDF
                                  </a>
                                </Button>
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
