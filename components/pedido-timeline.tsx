"use client"

import { Check, Clock, AlertCircle, XCircle, FileText, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface PedidoTimelineProps {
  pedido: {
    created_at: string
    status: string
    data_aprovacao_gerente?: string
    data_aprovacao_financeiro?: string
    data_emissao_nota?: string
    data_nota_recebida?: string
    aprovado_gerente?: boolean
    aprovado_financeiro?: boolean
    nota_emitida?: boolean
    correcao_solicitada_por?: string
  }
}

export function PedidoTimeline({ pedido }: PedidoTimelineProps) {
  const formatDateTime = (dateString?: string) => {
    if (!dateString) return null
    const date = new Date(dateString)
    return {
      date: date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }),
      time: date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    }
  }

  const isCorrecao = pedido.status === "correcao"
  const isRecusado = pedido.status === "recusado"
  const isConcluido = pedido.nota_emitida === true || pedido.status === "pago" || pedido.status === "nota_recebida"

  // Determine which stage we're at
  const getStageInfo = () => {
    if (isCorrecao) {
      return {
        stage: "correcao",
        message: pedido.correcao_solicitada_por === "financeiro" 
          ? "Correção solicitada pelo Financeiro" 
          : "Correção solicitada pelo Gerente",
        description: "Seu pedido precisa de ajustes. Verifique as observações e reenvie.",
      }
    }
    if (isRecusado) {
      return {
        stage: "recusado",
        message: pedido.aprovado_gerente === false 
          ? "Recusado pelo Gerente" 
          : "Recusado pelo Financeiro",
        description: "Infelizmente seu pedido foi recusado.",
      }
    }
    if (isConcluido) {
      return { stage: "concluido", message: "Concluído", description: null }
    }
    if (pedido.status === "pendente_gerente") {
      return { stage: "gerente", message: "Aguardando Gerente", description: null }
    }
    if (pedido.status === "pendente_financeiro") {
      return { stage: "financeiro", message: "Aguardando Financeiro", description: null }
    }
    if (pedido.status === "aprovado" && !pedido.nota_emitida) {
      return { stage: "anexar_nota", message: "Aprovado! Anexe sua nota fiscal", description: null }
    }
    return { stage: "unknown", message: "Status desconhecido", description: null }
  }

  const stageInfo = getStageInfo()

  // 4 etapas apenas - sem "Pagamento"
  const steps = [
    {
      id: "lancado",
      label: "Pedido Lançado",
      dateTime: formatDateTime(pedido.created_at),
      completed: true,
      current: pedido.status === "pendente_gerente",
    },
    {
      id: "gerente",
      label: pedido.aprovado_gerente ? "Aprovado pelo Gerente" : "Aguardando Gerente",
      dateTime: formatDateTime(pedido.data_aprovacao_gerente),
      completed: pedido.aprovado_gerente === true,
      current: pedido.status === "pendente_gerente",
      error: pedido.aprovado_gerente === false || (isCorrecao && pedido.correcao_solicitada_por !== "financeiro"),
    },
    {
      id: "financeiro",
      label: pedido.aprovado_financeiro ? "Aprovado pelo Financeiro" : "Aguardando Financeiro",
      dateTime: formatDateTime(pedido.data_aprovacao_financeiro),
      completed: pedido.aprovado_financeiro === true,
      current: pedido.status === "pendente_financeiro",
      error: pedido.aprovado_financeiro === false || (isCorrecao && pedido.correcao_solicitada_por === "financeiro"),
    },
    {
      id: "nota",
      label: isConcluido ? "Concluído" : "Anexar Nota",
      dateTime: formatDateTime(pedido.data_emissao_nota || pedido.data_nota_recebida),
      completed: isConcluido,
      current: pedido.status === "aprovado" && !pedido.nota_emitida,
    },
  ]

  return (
    <div className="w-full space-y-4">
      {/* Alert for Correction or Rejection */}
      {(isCorrecao || isRecusado) && (
        <Alert variant={isRecusado ? "destructive" : "default"} className={cn(
          isCorrecao && "border-amber-500 bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-100"
        )}>
          {isCorrecao ? (
            <AlertTriangle className="h-4 w-4 text-amber-600" />
          ) : (
            <XCircle className="h-4 w-4" />
          )}
          <AlertTitle>{stageInfo.message}</AlertTitle>
          {stageInfo.description && (
            <AlertDescription>{stageInfo.description}</AlertDescription>
          )}
        </Alert>
      )}

      {/* Current Status Badge */}
      {!isCorrecao && !isRecusado && (
        <div className="flex items-center justify-center">
          <div className={cn(
            "inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium",
            isConcluido 
              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
              : stageInfo.stage === "anexar_nota"
                ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100"
                : "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100"
          )}>
            {isConcluido ? (
              <Check className="h-4 w-4" />
            ) : stageInfo.stage === "anexar_nota" ? (
              <FileText className="h-4 w-4" />
            ) : (
              <Clock className="h-4 w-4" />
            )}
            {stageInfo.message}
          </div>
        </div>
      )}

      {/* Desktop Timeline - 4 steps */}
      <div className="hidden md:block pt-2">
        <div className="relative flex items-start justify-between">
          {/* Background Line */}
          <div className="absolute top-5 left-[12.5%] right-[12.5%] h-1 bg-muted rounded-full" />
          
          {/* Progress Line */}
          <div 
            className={cn(
              "absolute top-5 left-[12.5%] h-1 rounded-full transition-all duration-500",
              isCorrecao || isRecusado ? "bg-destructive" : "bg-primary"
            )}
            style={{ 
              width: `${Math.min(75, Math.max(0, (steps.filter(s => s.completed).length - 1) / (steps.length - 1) * 75))}%` 
            }}
          />

          {steps.map((step, index) => (
            <div key={step.id} className="relative flex flex-col items-center" style={{ width: "25%" }}>
              {/* Date/Time above */}
              <div className="mb-2 text-center h-12 flex flex-col justify-end">
                {step.dateTime && (
                  <>
                    <span className="text-xs font-medium text-foreground block">
                      {step.dateTime.date}
                    </span>
                    <span className="text-xs text-muted-foreground block">
                      {step.dateTime.time}
                    </span>
                  </>
                )}
              </div>

              {/* Circle */}
              <div
                className={cn(
                  "relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-3 transition-all duration-300 shadow-sm",
                  step.completed && !step.error
                    ? "border-primary bg-primary text-primary-foreground"
                    : step.error
                      ? "border-destructive bg-destructive text-destructive-foreground"
                      : step.current
                        ? "border-primary bg-background ring-4 ring-primary/20"
                        : "border-muted-foreground/30 bg-background"
                )}
              >
                {step.completed && !step.error ? (
                  <Check className="h-5 w-5" />
                ) : step.error ? (
                  <XCircle className="h-5 w-5" />
                ) : step.current ? (
                  <Clock className="h-5 w-5 text-primary animate-pulse" />
                ) : (
                  <span className="text-xs font-medium text-muted-foreground">{index + 1}</span>
                )}
              </div>

              {/* Label below */}
              <div className="mt-2 text-center px-1">
                <span
                  className={cn(
                    "text-xs font-medium leading-tight block",
                    step.completed && !step.error
                      ? "text-primary"
                      : step.error
                        ? "text-destructive"
                        : step.current
                          ? "text-foreground font-semibold"
                          : "text-muted-foreground"
                  )}
                >
                  {step.label}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mobile Timeline - Vertical */}
      <div className="md:hidden">
        <div className="relative pl-10">
          {/* Vertical Line */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-muted" />
          
          {steps.map((step, index) => (
            <div key={step.id} className="relative pb-6 last:pb-0">
              {/* Progress Line */}
              {step.completed && !step.error && index < steps.length - 1 && (
                <div 
                  className="absolute left-4 top-8 w-0.5 bg-primary"
                  style={{ height: "calc(100% - 2rem)" }}
                />
              )}

              {/* Circle */}
              <div
                className={cn(
                  "absolute left-0 flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all duration-300",
                  step.completed && !step.error
                    ? "border-primary bg-primary text-primary-foreground"
                    : step.error
                      ? "border-destructive bg-destructive text-destructive-foreground"
                      : step.current
                        ? "border-primary bg-background ring-4 ring-primary/20"
                        : "border-muted-foreground/30 bg-background"
                )}
              >
                {step.completed && !step.error ? (
                  <Check className="h-4 w-4" />
                ) : step.error ? (
                  <XCircle className="h-4 w-4" />
                ) : step.current ? (
                  <Clock className="h-4 w-4 text-primary animate-pulse" />
                ) : (
                  <span className="text-xs font-medium text-muted-foreground">{index + 1}</span>
                )}
              </div>

              {/* Content */}
              <div className="ml-2">
                <span
                  className={cn(
                    "text-sm font-medium block",
                    step.completed && !step.error
                      ? "text-primary"
                      : step.error
                        ? "text-destructive"
                        : step.current
                          ? "text-foreground font-semibold"
                          : "text-muted-foreground"
                  )}
                >
                  {step.label}
                </span>
                {step.dateTime && (
                  <span className="text-xs text-muted-foreground">
                    {step.dateTime.date} {step.dateTime.time}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
