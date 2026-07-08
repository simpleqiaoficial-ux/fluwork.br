"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
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
import { CheckCircle2, Clock, AlertCircle, ExternalLink, Loader2, RefreshCw, Zap, Upload } from "lucide-react"
import { toast } from "sonner"
import {
  obterNotaFiscalDoPedido,
  obterLinkEmissaoManual,
  emitirNfseFluWork,
  consultarEAtualizarStatusEmissao,
} from "@/app/actions/focus-nfe"

interface NotaFiscalResumo {
  id: string
  origem: string
  status: string | null
  focus_status: string | null
  focus_motivo_erro: string | null
  numero_nfse: string | null
  arquivo_pdf_url: string | null
}

interface EmissaoNfseCardProps {
  pedidoId: string
  focusStatusCadastroColaborador: string
  onEmitirManualClick: () => void
}

/** Bloco de emissão de NFS-e dentro do pagamento aprovado — mostra as duas opções (manual ou
 *  pelo FluWork) quando ainda não há nota, ou o status da emissão em curso quando já existe. */
export function EmissaoNfseCard({ pedidoId, focusStatusCadastroColaborador, onEmitirManualClick }: EmissaoNfseCardProps) {
  const router = useRouter()
  const [nota, setNota] = useState<NotaFiscalResumo | null>(null)
  const [linkEmissaoManual, setLinkEmissaoManual] = useState<string | null>(null)
  const [loadingNota, setLoadingNota] = useState(true)
  const [emitindo, setEmitindo] = useState(false)
  const [atualizando, setAtualizando] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  useEffect(() => {
    let ativo = true
    Promise.all([obterNotaFiscalDoPedido(pedidoId), obterLinkEmissaoManual()]).then(([n, link]) => {
      if (ativo) {
        setNota(n as NotaFiscalResumo | null)
        setLinkEmissaoManual(link)
        setLoadingNota(false)
      }
    })
    return () => {
      ativo = false
    }
  }, [pedidoId])

  const handleEmitir = async () => {
    setConfirmOpen(false)
    setEmitindo(true)
    try {
      const resultado = await emitirNfseFluWork(pedidoId)
      if (resultado.success) {
        toast.success("Emissão solicitada! Acompanhe o status abaixo.")
        const n = await obterNotaFiscalDoPedido(pedidoId)
        setNota(n as NotaFiscalResumo | null)
        router.refresh()
      } else {
        toast.error(resultado.error || "Erro ao solicitar emissão")
      }
    } finally {
      setEmitindo(false)
    }
  }

  const handleAtualizarStatus = async () => {
    if (!nota?.id) return
    setAtualizando(true)
    try {
      await consultarEAtualizarStatusEmissao(nota.id)
      const n = await obterNotaFiscalDoPedido(pedidoId)
      setNota(n as NotaFiscalResumo | null)
      router.refresh()
    } finally {
      setAtualizando(false)
    }
  }

  if (loadingNota) {
    return <p className="text-sm text-muted-foreground">Carregando...</p>
  }

  // Nota manual já anexada — a UI de "Nota emitida" em meus-pagamentos-list.tsx já cobre isso.
  if (nota && nota.origem === "manual") {
    return null
  }

  let corpo: React.ReactNode

  if (nota && nota.origem === "focus_nfe" && nota.focus_status === "autorizado") {
    corpo = (
      <div className="space-y-2">
        <Badge variant="success">
          <CheckCircle2 className="h-3 w-3" />
          NFS-e autorizada{nota.numero_nfse ? ` · nº ${nota.numero_nfse}` : ""}
        </Badge>
        {nota.arquivo_pdf_url && (
          <div>
            <Button variant="outline" size="sm" asChild>
              <a href={nota.arquivo_pdf_url} target="_blank" rel="noreferrer">
                <ExternalLink className="h-4 w-4" />
                Ver NFS-e
              </a>
            </Button>
          </div>
        )}
      </div>
    )
  } else if (nota && nota.origem === "focus_nfe" && nota.focus_status === "erro_autorizacao") {
    corpo = (
      <div className="space-y-2">
        <Badge variant="destructive">
          <AlertCircle className="h-3 w-3" />
          Erro na emissão
        </Badge>
        {nota.focus_motivo_erro && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{nota.focus_motivo_erro}</AlertDescription>
          </Alert>
        )}
        <Button size="sm" onClick={() => setConfirmOpen(true)} disabled={emitindo} className="gap-2">
          {emitindo && <Loader2 className="h-4 w-4 animate-spin" />}
          Tentar novamente
        </Button>
      </div>
    )
  } else if (nota && nota.origem === "focus_nfe") {
    corpo = (
      <div className="space-y-2">
        <Badge variant="warning">
          <Clock className="h-3 w-3" />
          Processando autorização na prefeitura
        </Badge>
        <div>
          <Button variant="outline" size="sm" onClick={handleAtualizarStatus} disabled={atualizando} className="gap-2">
            {atualizando ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Atualizar status
          </Button>
        </div>
      </div>
    )
  } else {
    corpo = (
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-2">
          <Button size="sm" onClick={() => setConfirmOpen(true)} disabled={focusStatusCadastroColaborador !== "cadastrado"} className="gap-2">
            <Zap className="h-4 w-4" />
            Emitir NFS-e pelo FluWork
          </Button>
          <Button size="sm" variant="outline" onClick={onEmitirManualClick} className="gap-2">
            <Upload className="h-4 w-4" />
            Emitir manualmente
          </Button>
        </div>
        {focusStatusCadastroColaborador !== "cadastrado" && (
          <p className="text-xs text-muted-foreground">
            Pra emitir direto pelo FluWork,{" "}
            <Link href="/meus-pagamentos/fiscal" className="text-primary hover:underline">
              complete sua configuração fiscal
            </Link>
            .
          </p>
        )}
        {linkEmissaoManual && (
          <a
            href={linkEmissaoManual}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-primary hover:underline inline-flex items-center gap-1"
          >
            <ExternalLink className="h-3 w-3" />
            Abrir sistema de emissão manual
          </a>
        )}
      </div>
    )
  }

  return (
    <>
      {corpo}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Emitir NFS-e pelo FluWork?</AlertDialogTitle>
            <AlertDialogDescription>
              A nota será emitida automaticamente com o valor aprovado deste pagamento. Essa ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleEmitir} disabled={emitindo}>
              {emitindo ? "Emitindo..." : "Confirmar emissão"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
