"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CheckCircle2, FileText, Download, ExternalLink, RefreshCw, Calendar, User } from "lucide-react"

interface ArquivoAnexado {
  nome: string
  tipo: string
  tamanhoBytes: number
  url: string
}

interface NotaAnexadaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  arquivo: ArquivoAnexado
  enviadoEm: Date
  responsavelNome: string
  onSubstituir: () => void
}

function formatarTamanho(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function NotaAnexadaDialog({ open, onOpenChange, arquivo, enviadoEm, responsavelNome, onSubstituir }: NotaAnexadaDialogProps) {
  const extensao = arquivo.nome.split(".").pop()?.toUpperCase() || arquivo.tipo.toUpperCase()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader className="items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-success/10">
            <CheckCircle2 className="h-8 w-8 text-success" />
          </div>
          <DialogTitle className="text-lg">Nota fiscal anexada com sucesso!</DialogTitle>
          <DialogDescription>O financeiro foi notificado e vai revisar em breve.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-lg border p-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{arquivo.nome}</p>
              <p className="text-xs text-muted-foreground">
                {extensao} · {formatarTamanho(arquivo.tamanhoBytes)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              <span>
                {enviadoEm.toLocaleDateString("pt-BR")} às {enviadoEm.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <User className="h-3.5 w-3.5" />
              <span className="truncate">{responsavelNome}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <Button variant="outline" size="sm" asChild className="gap-2">
              <a href={arquivo.url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3.5 w-3.5" />
                Abrir documento
              </a>
            </Button>
            <Button variant="outline" size="sm" asChild className="gap-2">
              <a href={arquivo.url} download={arquivo.nome}>
                <Download className="h-3.5 w-3.5" />
                Download
              </a>
            </Button>
            <Button variant="outline" size="sm" onClick={onSubstituir} className="gap-2">
              <RefreshCw className="h-3.5 w-3.5" />
              Substituir arquivo
            </Button>
          </div>

          <Button className="w-full" onClick={() => onOpenChange(false)}>
            Concluir
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
