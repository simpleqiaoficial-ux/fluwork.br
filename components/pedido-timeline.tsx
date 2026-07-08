"use client"

import { Check, Clock, XCircle, FileText, AlertTriangle, CreditCard, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import type { PedidoPagamento } from "@/types/pedido"

interface PedidoTimelineProps {
  pedido: Pick<
    PedidoPagamento,
    | "created_at"
    | "status"
    | "data_aprovacao_gerente"
    | "data_aprovacao_financeiro"
    | "data_emissao_nota"
    | "data_nota_recebida"
    | "aprovado_gerente"
    | "aprovado_financeiro"
    | "aprovado_por_gerente"
    | "aprovado_por_financeiro"
    | "nota_emitida"
    | "correcao_solicitada_por"
    | "observacao_gerente"
    | "observacao_financeiro"
    | "criado_por"
  >
}

type EtapaEstado = "completo" | "atual" | "erro" | "pendente"

interface Etapa {
  id: string
  label: string
  estado: EtapaEstado
  quem?: string
  quando?: string
  observacao?: string
}

function formatarDataHora(valor?: string) {
  if (!valor) return null
  const data = new Date(valor)
  return {
    data: data.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }),
    hora: data.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
  }
}

const SITUACAO_ATUAL: Record<string, { label: string; descricao: string; proxima?: string; tom: "sucesso" | "atencao" | "erro" | "neutro" }> = {
  pendente_gerente: { label: "Aguardando aprovação do gerente", descricao: "O pedido foi lançado e está na fila do gerente responsável.", proxima: "Aprovação do financeiro", tom: "atencao" },
  pendente_financeiro: { label: "Aguardando aprovação do financeiro", descricao: "O gerente já aprovou — falta a validação final do financeiro.", proxima: "Pagamento aprovado, prestador anexa a nota fiscal", tom: "atencao" },
  aprovado: { label: "Aprovado — aguardando nota fiscal", descricao: "O pagamento foi aprovado. O prestador precisa emitir ou anexar a nota fiscal.", proxima: "Financeiro recebe e aprova a nota fiscal", tom: "atencao" },
  recusado: { label: "Recusado", descricao: "Este pedido foi recusado e não segue mais no fluxo.", tom: "erro" },
  correcao: { label: "Correção solicitada", descricao: "Foi pedido um ajuste no pedido — revise e reenvie.", proxima: "Reenviar o pedido corrigido", tom: "atencao" },
  nota_recebida: { label: "Nota fiscal recebida", descricao: "A nota foi aprovada pelo financeiro — falta só o pagamento.", proxima: "Pagamento", tom: "sucesso" },
  pago: { label: "Pagamento concluído", descricao: "O ciclo deste pedido foi encerrado com sucesso.", tom: "sucesso" },
  aguardando_prorrogacao: { label: "Prorrogação de prazo em análise", descricao: "O prestador pediu mais tempo pra anexar a nota fiscal.", proxima: "Financeiro decide a prorrogação", tom: "atencao" },
  prorrogacao_negada: { label: "Prorrogação negada", descricao: "O prazo pra anexar a nota fiscal expirou e a prorrogação foi negada.", proxima: "Falar com o supervisor", tom: "erro" },
}

const TOM_CLASSES: Record<string, string> = {
  sucesso: "bg-success/10 text-success",
  atencao: "bg-warning/15 text-warning",
  erro: "bg-destructive/10 text-destructive",
  neutro: "bg-muted text-muted-foreground",
}

const TOM_ICON: Record<string, LucideIcon> = { sucesso: Check, atencao: Clock, erro: XCircle, neutro: Clock }

const ESTADO_CIRCLE: Record<EtapaEstado, string> = {
  completo: "border-primary bg-primary text-primary-foreground",
  atual: "border-primary bg-background ring-4 ring-primary/20 text-primary",
  erro: "border-destructive bg-destructive text-destructive-foreground",
  pendente: "border-muted-foreground/30 bg-background text-muted-foreground",
}

const ESTADO_TEXT: Record<EtapaEstado, string> = {
  completo: "text-foreground",
  atual: "text-foreground font-semibold",
  erro: "text-destructive",
  pendente: "text-muted-foreground",
}

export function PedidoTimeline({ pedido }: PedidoTimelineProps) {
  const isCorrecao = pedido.status === "correcao"
  const isRecusado = pedido.status === "recusado"
  const isConcluido = pedido.status === "pago"

  const lancado = formatarDataHora(pedido.created_at)
  const aprovGerente = formatarDataHora(pedido.data_aprovacao_gerente)
  const aprovFinanceiro = formatarDataHora(pedido.data_aprovacao_financeiro)
  const nota = formatarDataHora(pedido.data_emissao_nota || pedido.data_nota_recebida)

  const gerenteRecusou = pedido.aprovado_gerente === false || (isCorrecao && pedido.correcao_solicitada_por !== "financeiro")
  const financeiroRecusou = pedido.aprovado_financeiro === false || (isCorrecao && pedido.correcao_solicitada_por === "financeiro")

  const etapas: Etapa[] = [
    {
      id: "lancado",
      label: "Pedido lançado",
      estado: "completo",
      quem: pedido.criado_por?.nome_completo,
      quando: lancado ? `${lancado.data} às ${lancado.hora}` : undefined,
    },
    {
      id: "gerente",
      label: gerenteRecusou ? "Recusado pelo gerente" : "Aprovação do gerente",
      estado: gerenteRecusou ? "erro" : pedido.aprovado_gerente ? "completo" : pedido.status === "pendente_gerente" ? "atual" : "pendente",
      quem: pedido.aprovado_por_gerente?.nome_completo,
      quando: aprovGerente ? `${aprovGerente.data} às ${aprovGerente.hora}` : undefined,
      observacao: pedido.observacao_gerente || undefined,
    },
    {
      id: "financeiro",
      label: financeiroRecusou ? "Recusado pelo financeiro" : "Aprovação do financeiro",
      estado: financeiroRecusou ? "erro" : pedido.aprovado_financeiro ? "completo" : pedido.status === "pendente_financeiro" ? "atual" : "pendente",
      quem: pedido.aprovado_por_financeiro?.nome_completo,
      quando: aprovFinanceiro ? `${aprovFinanceiro.data} às ${aprovFinanceiro.hora}` : undefined,
      observacao: pedido.observacao_financeiro || undefined,
    },
    {
      id: "nota",
      label: "Nota fiscal",
      estado:
        pedido.nota_emitida || pedido.status === "nota_recebida" || pedido.status === "pago"
          ? "completo"
          : pedido.status === "aprovado"
            ? "atual"
            : "pendente",
      quando: nota ? `${nota.data} às ${nota.hora}` : undefined,
    },
    {
      id: "pagamento",
      label: "Pagamento",
      estado: pedido.status === "pago" ? "completo" : pedido.status === "nota_recebida" ? "atual" : "pendente",
    },
  ]

  const situacao = SITUACAO_ATUAL[pedido.status || ""] ?? { label: pedido.status || "—", descricao: "", tom: "neutro" as const }
  const TomIcon = TOM_ICON[situacao.tom]

  return (
    <div className="space-y-6">
      {/* Situação atual — destacada, separada do histórico abaixo */}
      <div className={cn("rounded-lg p-4", TOM_CLASSES[situacao.tom])}>
        <div className="flex items-center gap-2 font-semibold">
          <TomIcon className="h-4 w-4 shrink-0" />
          {situacao.label}
        </div>
        {situacao.descricao && <p className="mt-1 text-sm opacity-90">{situacao.descricao}</p>}
        {situacao.proxima && !isRecusado && (
          <p className="mt-2 text-xs font-medium uppercase tracking-wide opacity-75">Próxima etapa: {situacao.proxima}</p>
        )}
      </div>

      {/* Histórico — timeline vertical */}
      <div className="relative pl-9">
        <div className="absolute left-[15px] top-1 bottom-1 w-0.5 bg-border" />
        <div className="space-y-6">
          {etapas.map((etapa) => (
            <div key={etapa.id} className="relative">
              <div
                className={cn(
                  "absolute -left-9 flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors",
                  ESTADO_CIRCLE[etapa.estado],
                )}
              >
                {etapa.estado === "completo" ? (
                  <Check className="h-4 w-4" />
                ) : etapa.estado === "erro" ? (
                  <XCircle className="h-4 w-4" />
                ) : etapa.estado === "atual" ? (
                  <Clock className="h-4 w-4 animate-pulse" />
                ) : etapa.id === "nota" ? (
                  <FileText className="h-4 w-4" />
                ) : etapa.id === "pagamento" ? (
                  <CreditCard className="h-4 w-4" />
                ) : (
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                )}
              </div>

              <div className="pb-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={cn("text-sm", ESTADO_TEXT[etapa.estado])}>{etapa.label}</span>
                  {etapa.quando && <span className="text-xs text-muted-foreground">{etapa.quando}</span>}
                </div>
                {etapa.quem && <p className="text-xs text-muted-foreground mt-0.5">por {etapa.quem}</p>}
                {etapa.observacao && (
                  <div className="mt-1.5 flex items-start gap-1.5 rounded-md bg-muted/50 px-2.5 py-1.5 text-xs text-muted-foreground">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                    <span>{etapa.observacao}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
