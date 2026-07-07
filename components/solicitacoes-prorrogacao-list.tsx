"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ChevronDown, ChevronUp, CheckCircle2 } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { EmptyState } from "@/components/ui/empty-state"
import { useState } from "react"
import { responderSolicitacaoProrrogacao } from "@/app/actions/pedidos"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"

interface Pedido {
  id: string
  colaborador_id: string
  valor_total: number
  created_at: string
  data_limite_anexo_nota: string
  motivo_prorrogacao: string
  data_solicitacao_prorrogacao: string
  colaborador: {
    nome_completo: string
    salario: number
  }
}

interface SolicitacoesProrrogacaoListProps {
  solicitacoes: Pedido[]
}

export function SolicitacoesProrrogacaoList({ solicitacoes }: SolicitacoesProrrogacaoListProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [acaoSelecionada, setAcaoSelecionada] = useState<"aprovar" | "negar" | null>(null)
  const [pedidoSelecionado, setPedidoSelecionado] = useState<Pedido | null>(null)
  const [observacao, setObservacao] = useState("")
  const [novaData, setNovaData] = useState("")
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const router = useRouter()

  const handleAbrirDialog = (pedido: Pedido, acao: "aprovar" | "negar") => {
    setPedidoSelecionado(pedido)
    setAcaoSelecionada(acao)
    setDialogOpen(true)
  }

  const handleResponder = async () => {
    if (!pedidoSelecionado || !acaoSelecionada) return

    try {
      setLoading(pedidoSelecionado.id)

      let diasExtensao: number | undefined
      if (acaoSelecionada === "aprovar") {
        if (!novaData) {
          alert("Por favor, selecione a nova data limite")
          return
        }
        const dataEscolhida = new Date(novaData + "T12:00:00")
        const hoje = new Date()
        diasExtensao = Math.ceil((dataEscolhida.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))

        if (diasExtensao < 1) {
          alert("A nova data deve ser futura")
          return
        }
      }

      await responderSolicitacaoProrrogacao(
        pedidoSelecionado.id,
        acaoSelecionada === "aprovar",
        observacao,
        diasExtensao,
      )
      setDialogOpen(false)
      setObservacao("")
      setNovaData("")
      setPedidoSelecionado(null)
      setAcaoSelecionada(null)
      router.refresh()
    } catch (error) {
      console.error("[v0] Erro ao responder solicitação:", error)
      alert(error instanceof Error ? error.message : "Erro ao processar solicitação")
    } finally {
      setLoading(null)
    }
  }

  if (solicitacoes.length === 0) {
    return (
      <EmptyState
        icon={CheckCircle2}
        title="Nenhuma solicitação pendente"
        description="Todas as solicitações de prorrogação foram processadas."
      />
    )
  }

  return (
    <>
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Prestador</TableHead>
              <TableHead className="text-right">Valor total</TableHead>
              <TableHead>Prazo original</TableHead>
              <TableHead>Situação</TableHead>
              <TableHead>Ações</TableHead>
              <TableHead className="w-8" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {solicitacoes.map((solicitacao) => {
              const prazoExpirado = new Date(solicitacao.data_limite_anexo_nota).getTime() < new Date().getTime()
              const diasAtrasado = Math.ceil(
                (new Date().getTime() - new Date(solicitacao.data_limite_anexo_nota).getTime()) /
                  (1000 * 60 * 60 * 24),
              )
              const isExpanded = expandedId === solicitacao.id
              const isLoading = loading === solicitacao.id

              return (
                <>
                  <TableRow
                    key={solicitacao.id}
                    className="cursor-pointer"
                    onClick={() => setExpandedId(isExpanded ? null : solicitacao.id)}
                  >
                    <TableCell className="font-medium">{solicitacao.colaborador.nome_completo}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(solicitacao.valor_total)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(solicitacao.data_limite_anexo_nota).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell>
                      {prazoExpirado ? (
                        <Badge variant="destructive" className="font-normal">
                          {diasAtrasado} {diasAtrasado === 1 ? "dia" : "dias"} atrasado
                        </Badge>
                      ) : (
                        <Badge variant="warning" className="font-normal">
                          Pendente
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAbrirDialog(solicitacao, "aprovar")}
                          disabled={isLoading}
                        >
                          Aprovar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleAbrirDialog(solicitacao, "negar")}
                          disabled={isLoading}
                        >
                          Negar
                        </Button>
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
                    <TableRow key={`${solicitacao.id}-detail`}>
                      <TableCell colSpan={6} className="bg-muted/20 px-6 py-4">
                        <p className="text-xs text-muted-foreground mb-1">Motivo da solicitação</p>
                        <p className="text-sm">{solicitacao.motivo_prorrogacao}</p>
                        <p className="text-xs text-muted-foreground mt-3">
                          Solicitado em{" "}
                          {new Date(solicitacao.data_solicitacao_prorrogacao).toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              )
            })}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {acaoSelecionada === "aprovar" ? "Aprovar prorrogação de prazo" : "Negar solicitação"}
            </DialogTitle>
            <DialogDescription>
              {acaoSelecionada === "aprovar"
                ? "Configure o novo prazo para o colaborador anexar a nota fiscal."
                : "Informe o motivo da negação da solicitação."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {acaoSelecionada === "aprovar" && (
              <div>
                <Label htmlFor="novaData">Nova data limite *</Label>
                <Input
                  id="novaData"
                  type="date"
                  value={novaData}
                  onChange={(e) => setNovaData(e.target.value)}
                  min={new Date(Date.now() + 86400000).toISOString().split("T")[0]}
                  className="mt-2"
                />
                {novaData && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Novo prazo: {new Date(novaData + "T12:00:00").toLocaleDateString("pt-BR")}
                  </p>
                )}
              </div>
            )}
            <div>
              <Label htmlFor="observacao">
                {acaoSelecionada === "aprovar" ? "Observação (opcional)" : "Motivo da negação *"}
              </Label>
              <Textarea
                id="observacao"
                placeholder={
                  acaoSelecionada === "aprovar"
                    ? "Adicione uma observação sobre a prorrogação..."
                    : "Explique o motivo da negação..."
                }
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                rows={4}
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDialogOpen(false)
                setObservacao("")
                setNovaData("")
                setPedidoSelecionado(null)
                setAcaoSelecionada(null)
              }}
              disabled={!!loading}
            >
              Cancelar
            </Button>
            <Button
              variant={acaoSelecionada === "negar" ? "destructive" : "default"}
              onClick={handleResponder}
              disabled={
                !!loading ||
                (acaoSelecionada === "negar" && !observacao.trim()) ||
                (acaoSelecionada === "aprovar" && !novaData)
              }
            >
              {loading ? "Processando..." : acaoSelecionada === "aprovar" ? "Aprovar" : "Negar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
