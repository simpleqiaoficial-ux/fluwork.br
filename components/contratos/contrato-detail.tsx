"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Download, RefreshCw, XCircle, ArrowLeft, FileText, Send, Eye, PenLine, Ban, Clock, RotateCw, Archive, FileEdit, FileSignature } from "lucide-react"
import { toast } from "sonner"
import { reenviarContrato, cancelarContrato } from "@/app/actions/contratos"
import { AditivoSection } from "@/components/contratos/aditivo-section"

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "success" | "warning" | "destructive" }> = {
  draft: { label: "Rascunho", variant: "secondary" },
  sent: { label: "Enviado", variant: "outline" },
  viewed: { label: "Visualizado", variant: "warning" },
  signed: { label: "Assinado", variant: "success" },
  refused: { label: "Recusado", variant: "destructive" },
  expired: { label: "Link expirado", variant: "destructive" },
  cancelled: { label: "Cancelado", variant: "outline" },
  archived: { label: "Arquivado", variant: "secondary" },
}

const VIGENCIA_VARIANT: Record<string, "success" | "warning" | "destructive" | "outline"> = {
  verde: "success",
  amarelo: "warning",
  laranja: "warning",
  vermelho: "destructive",
  cinza: "outline",
}

const RENOVACAO_LABEL: Record<string, string> = {
  automatica: "Automática",
  mediante_aviso: "Mediante aviso prévio",
  sem_renovacao: "Sem renovação",
}

const EVENTO_CONFIG: Record<string, { label: string; icon: typeof FileText }> = {
  criado: { label: "Contrato criado", icon: FileText },
  enviado: { label: "Enviado para assinatura", icon: Send },
  reenviado: { label: "Convite reenviado", icon: RefreshCw },
  visualizado: { label: "Visualizado pelo prestador", icon: Eye },
  aceite_marcado: { label: "Aceite marcado", icon: PenLine },
  assinado: { label: "Assinado eletronicamente", icon: PenLine },
  recusado: { label: "Recusado pelo prestador", icon: XCircle },
  expirado: { label: "Link expirado", icon: Clock },
  cancelado: { label: "Cancelado", icon: Ban },
  vigencia_iniciada: { label: "Vigência iniciada", icon: FileSignature },
  aditivo_criado: { label: "Aditivo criado", icon: FileEdit },
  aditivo_enviado: { label: "Aditivo enviado para assinatura", icon: Send },
  aditivo_assinado: { label: "Aditivo assinado", icon: PenLine },
  aditivo_recusado: { label: "Aditivo recusado", icon: XCircle },
  renovado: { label: "Contrato renovado", icon: RotateCw },
  encerrado: { label: "Vigência encerrada", icon: Ban },
  arquivado: { label: "Contrato arquivado", icon: Archive },
  senha_definida: { label: "Senha de acesso definida", icon: PenLine },
}

function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor)
}

function formatarDataHora(data?: string | null): string {
  if (!data) return "—"
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(data))
}

interface ContratoDetailProps {
  contrato: any
}

export function ContratoDetail({ contrato }: ContratoDetailProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [motivo, setMotivo] = useState("")

  const statusConfig = STATUS_CONFIG[contrato.status] || { label: contrato.status, variant: "outline" as const }
  const podeReenviar = ["sent", "viewed", "expired"].includes(contrato.status)
  const podeCancelar = !["signed", "cancelled"].includes(contrato.status)
  const signatario = contrato.signatarios?.[0]

  const handleReenviar = async () => {
    setLoading(true)
    try {
      const result = await reenviarContrato(contrato.id)
      if (result.success) {
        toast.success("Convite reenviado")
        router.refresh()
      } else {
        toast.error(result.error || "Erro ao reenviar")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleCancelar = async () => {
    setLoading(true)
    try {
      const result = await cancelarContrato(contrato.id, motivo || undefined)
      if (result.success) {
        toast.success("Contrato cancelado")
        setCancelOpen(false)
        router.refresh()
      } else {
        toast.error(result.error || "Erro ao cancelar")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/contratos" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-3">
          <ArrowLeft className="h-3.5 w-3.5" />
          Contratos
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-foreground">{contrato.numero}</h1>
              <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">{contrato.tipo_servico}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {contrato.status === "signed" && contrato.pdf_signed_path && (
              <a href={`/api/contratos/${contrato.id}/pdf`} target="_blank" rel="noreferrer">
                <Button size="sm" variant="outline" className="gap-2">
                  <Download className="h-4 w-4" />
                  Baixar PDF assinado
                </Button>
              </a>
            )}
            {podeReenviar && (
              <Button size="sm" variant="outline" className="gap-2" disabled={loading} onClick={handleReenviar}>
                <RefreshCw className="h-4 w-4" />
                Reenviar
              </Button>
            )}
            {podeCancelar && (
              <Button size="sm" variant="ghost" className="gap-2 text-destructive hover:text-destructive" onClick={() => setCancelOpen(true)}>
                <XCircle className="h-4 w-4" />
                Cancelar
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="rounded-md border p-4 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Prestador</p>
          <p className="text-sm"><span className="text-muted-foreground">Nome: </span>{contrato.prestador_nome}</p>
          <p className="text-sm"><span className="text-muted-foreground">CPF/CNPJ: </span>{contrato.prestador_cpf_cnpj}</p>
          <p className="text-sm"><span className="text-muted-foreground">E-mail: </span>{contrato.prestador_email}</p>
          {contrato.prestador_endereco && (
            <p className="text-sm"><span className="text-muted-foreground">Endereço: </span>{contrato.prestador_endereco}</p>
          )}
        </div>
        <div className="rounded-md border p-4 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Condições</p>
          <p className="text-sm"><span className="text-muted-foreground">Valor: </span>{formatarMoeda(contrato.valor)}</p>
          <p className="text-sm"><span className="text-muted-foreground">Prazo: </span>{contrato.prazo}</p>
          <p className="text-sm"><span className="text-muted-foreground">Início: </span>{new Intl.DateTimeFormat("pt-BR").format(new Date(contrato.data_inicio))}</p>
          {signatario && (
            <p className="text-sm"><span className="text-muted-foreground">Status do signatário: </span>{signatario.status}</p>
          )}
        </div>
      </div>

      {contrato.situacao_vigencia && contrato.situacao_vigencia.chave !== "sem_vigencia" && (
        <div className="rounded-md border p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Vigência</p>
            <Badge variant={VIGENCIA_VARIANT[contrato.situacao_vigencia.cor]}>
              {contrato.situacao_vigencia.emoji} {contrato.situacao_vigencia.label}
            </Badge>
          </div>
          <div className="grid gap-2 sm:grid-cols-3 text-sm">
            <p><span className="text-muted-foreground">Término: </span>{new Intl.DateTimeFormat("pt-BR").format(new Date(contrato.data_termino))}</p>
            <p>
              <span className="text-muted-foreground">Dias restantes: </span>
              {contrato.situacao_vigencia.diasRestantes !== null ? `${contrato.situacao_vigencia.diasRestantes} dias` : "—"}
            </p>
            <p><span className="text-muted-foreground">Renovação: </span>{RENOVACAO_LABEL[contrato.tipo_renovacao || ""] || "Sem renovação"}</p>
          </div>
          {contrato.situacao_vigencia.percentualDecorrido !== null && (
            <div className="space-y-1">
              <Progress value={contrato.situacao_vigencia.percentualDecorrido} className="h-2" />
              <p className="text-xs text-muted-foreground">{contrato.situacao_vigencia.percentualDecorrido}% da vigência decorrida</p>
            </div>
          )}
        </div>
      )}

      <AditivoSection contractId={contrato.id} contratoStatus={contrato.status} aditivos={contrato.aditivos || []} />

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Histórico</p>
        <div className="rounded-md border divide-y">
          {(contrato.eventos || []).map((evento: any) => {
            const config = EVENTO_CONFIG[evento.tipo_evento] || { label: evento.tipo_evento, icon: FileText }
            const Icon = config.icon
            return (
              <div key={evento.id} className="flex items-start gap-3 px-4 py-3">
                <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{config.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatarDataHora(evento.created_at)}
                    {evento.ip_address && ` · IP ${evento.ip_address}`}
                  </p>
                </div>
              </div>
            )
          })}
          {(!contrato.eventos || contrato.eventos.length === 0) && (
            <p className="px-4 py-3 text-sm text-muted-foreground">Nenhum evento registrado</p>
          )}
        </div>
      </div>

      <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar contrato?</AlertDialogTitle>
            <AlertDialogDescription>
              O link de assinatura do prestador deixará de funcionar. Essa ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            placeholder="Motivo do cancelamento (opcional)"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            rows={2}
            className="resize-none"
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelar}
              disabled={loading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading ? "Cancelando..." : "Cancelar contrato"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
