"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, User, DollarSign, AlertCircle, CheckCircle, XCircle } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
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
      <Card>
        <CardContent className="py-12 text-center">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <p className="text-lg font-medium mb-2">Nenhuma solicitação pendente</p>
          <p className="text-muted-foreground">Todas as solicitações de prorrogação foram processadas</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <div className="space-y-4">
        {solicitacoes.map((solicitacao) => {
          const prazoExpirado = new Date(solicitacao.data_limite_anexo_nota).getTime() < new Date().getTime()
          const diasAtrasado = Math.ceil(
            (new Date().getTime() - new Date(solicitacao.data_limite_anexo_nota).getTime()) / (1000 * 60 * 60 * 24),
          )

          return (
            <Card key={solicitacao.id} className="border-orange-200 bg-orange-50/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-6 h-6 text-orange-600" />
                    <div>
                      <CardTitle className="text-lg">Solicitação de Prorrogação de Prazo</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        Solicitado em{" "}
                        {new Date(solicitacao.data_solicitacao_prorrogacao).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                  {prazoExpirado && (
                    <span className="px-3 py-1 text-sm font-medium bg-red-100 text-red-700 rounded-full">
                      {diasAtrasado} {diasAtrasado === 1 ? "dia" : "dias"} atrasado
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-white border">
                    <User className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Colaborador</p>
                      <p className="font-semibold">{solicitacao.colaborador.nome_completo}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-lg bg-white border">
                    <DollarSign className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Valor Total</p>
                      <p className="font-semibold">{formatCurrency(solicitacao.valor_total)}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-lg bg-white border">
                    <Calendar className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Prazo Original</p>
                      <p className="font-semibold">
                        {new Date(solicitacao.data_limite_anexo_nota).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-white border border-orange-200">
                  <p className="text-sm font-medium mb-2 text-orange-900">Motivo da Solicitação:</p>
                  <p className="text-sm text-gray-700">{solicitacao.motivo_prorrogacao}</p>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => handleAbrirDialog(solicitacao, "aprovar")}
                    disabled={loading === solicitacao.id}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Aprovar Prorrogação
                  </Button>
                  <Button
                    onClick={() => handleAbrirDialog(solicitacao, "negar")}
                    disabled={loading === solicitacao.id}
                    variant="destructive"
                    className="flex-1"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Negar Solicitação
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {acaoSelecionada === "aprovar" ? "Aprovar Prorrogação de Prazo" : "Negar Solicitação"}
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
                <Label htmlFor="novaData">Nova Data Limite *</Label>
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
                {acaoSelecionada === "aprovar" ? "Observação (opcional)" : "Motivo da Negação *"}
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
              onClick={handleResponder}
              disabled={
                !!loading ||
                (acaoSelecionada === "negar" && !observacao.trim()) ||
                (acaoSelecionada === "aprovar" && !novaData)
              }
              className={acaoSelecionada === "aprovar" ? "bg-green-600 hover:bg-green-700" : ""}
            >
              {loading ? "Processando..." : acaoSelecionada === "aprovar" ? "Aprovar" : "Negar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
