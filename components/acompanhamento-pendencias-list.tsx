"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"
import { CountdownTimer } from "@/components/countdown-timer"
import { formatCurrency } from "@/lib/utils"
import { enviarLembreteNotaFiscal } from "@/app/actions/pedidos"
import { toast } from "sonner"
import { Calendar, Check, Clock, FileCheck2, Loader2, Mail, Link2, User } from "lucide-react"
import type { PedidoPagamento } from "@/types/pedido"

interface AcompanhamentoPendenciasListProps {
  pedidos: PedidoPagamento[]
}

function formatarData(data?: string) {
  if (!data) return "—"
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(data))
}

export function AcompanhamentoPendenciasList({ pedidos }: AcompanhamentoPendenciasListProps) {
  const [enviandoId, setEnviandoId] = useState<string | null>(null)

  const handleEnviarLembrete = async (pedidoId: string) => {
    setEnviandoId(pedidoId)
    try {
      await enviarLembreteNotaFiscal(pedidoId)
      toast.success("Lembrete enviado por e-mail ao prestador.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao enviar lembrete")
    } finally {
      setEnviandoId(null)
    }
  }

  const handleCopiarLink = async (pedidoId: string) => {
    const url = `${window.location.origin}/meus-pagamentos`
    try {
      await navigator.clipboard.writeText(url)
      toast.success("Link copiado.")
    } catch {
      toast.error("Não foi possível copiar o link")
    }
  }

  if (pedidos.length === 0) {
    return (
      <EmptyState
        icon={FileCheck2}
        title="Nenhuma pendência de anexo fiscal"
        description="Todos os prestadores estão em dia — nenhuma ordem de pagamento aprovada aguardando anexo fiscal no momento."
      />
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        {pedidos.length} {pedidos.length === 1 ? "prestador aguardando" : "prestadores aguardando"} anexo fiscal
      </p>

      {pedidos.map((pedido) => (
        <Card key={pedido.id}>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-foreground">{pedido.colaborador?.nome_completo || "Prestador"}</span>
                    <Badge variant="warning" className="font-normal">
                      Aguardando anexo fiscal
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      Aprovado em {formatarData(pedido.data_aprovacao_financeiro)}
                    </span>
                    <span className="font-medium tabular-nums text-foreground">{formatCurrency(pedido.valor_total)}</span>
                  </div>

                  {/* Indicador de etapa — Aprovado (concluído) → Nota fiscal (etapa atual) */}
                  <div className="flex items-center gap-1.5 pt-1 text-xs">
                    <span className="flex items-center gap-1 text-success">
                      <Check className="h-3.5 w-3.5" /> Aprovado
                    </span>
                    <span className="h-px w-4 bg-border" />
                    <span className="flex items-center gap-1 font-medium text-warning">
                      <Clock className="h-3.5 w-3.5" /> Nota fiscal
                    </span>
                  </div>

                  {pedido.data_limite_anexo_nota && (
                    <div className="pt-1">
                      <CountdownTimer dataLimite={pedido.data_limite_anexo_nota} />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex shrink-0 gap-2">
                <Button
                  size="sm"
                  onClick={() => handleEnviarLembrete(pedido.id)}
                  disabled={enviandoId === pedido.id}
                  className="gap-2"
                >
                  {enviandoId === pedido.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                  Enviar lembrete
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleCopiarLink(pedido.id)} className="gap-2">
                  <Link2 className="h-4 w-4" />
                  Copiar link
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
