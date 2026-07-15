"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { FileUp, Loader2, Lock, Paperclip } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { enviarMensagem } from "@/app/actions/support-messages"
import { anexarArquivoTicket } from "@/app/actions/support-attachments"

interface MensagemDTO {
  id: string
  tipo: string
  corpo: string
  created_at: string
  autor?: { nome_completo: string; tipo_acesso: string } | null
}

interface AnexoDTO {
  id: string
  nome_original: string
  url: string
  created_at: string
}

function formatarDataHora(data: string) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(data))
}

interface TicketThreadProps {
  ticketId: string
  mensagens: MensagemDTO[]
  anexos: AnexoDTO[]
  ehAgente: boolean
  podeResponder: boolean
  statusEncerrado: boolean
}

export function TicketThread({ ticketId, mensagens, anexos, ehAgente, podeResponder, statusEncerrado }: TicketThreadProps) {
  const router = useRouter()
  const [corpo, setCorpo] = useState("")
  const [notaInterna, setNotaInterna] = useState(false)
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [enviando, setEnviando] = useState(false)

  const mostrarCaixaResposta = podeResponder && (!statusEncerrado || ehAgente)

  const handleEnviar = async () => {
    if (!corpo.trim() && !arquivo) {
      toast.error("Escreva uma mensagem ou anexe um arquivo")
      return
    }
    setEnviando(true)
    try {
      if (corpo.trim()) {
        const result = await enviarMensagem(ticketId, corpo, notaInterna ? "nota_interna" : "mensagem")
        if (!result.success) {
          toast.error(result.error || "Erro ao enviar mensagem")
          return
        }
      }
      if (arquivo) {
        const formData = new FormData()
        formData.append("file", arquivo)
        const result = await anexarArquivoTicket(ticketId, formData)
        if (!result.success) {
          toast.error(result.error || "Erro ao enviar anexo")
          return
        }
      }
      setCorpo("")
      setArquivo(null)
      setNotaInterna(false)
      router.refresh()
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {mensagens.map((m) => (
          <Card key={m.id} className={m.tipo === "nota_interna" ? "border-warning/40 bg-warning/5" : m.tipo === "evento_sistema" ? "bg-muted/40" : ""}>
            <CardContent className="p-3 space-y-1">
              <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">
                  {m.autor?.nome_completo || "Sistema"}
                  {m.tipo === "nota_interna" && (
                    <span className="ml-1.5 inline-flex items-center gap-1 text-warning">
                      <Lock className="h-3 w-3" />
                      nota interna
                    </span>
                  )}
                </span>
                <span>{formatarDataHora(m.created_at)}</span>
              </div>
              <p className="text-sm whitespace-pre-wrap">{m.corpo}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {anexos.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">Anexos</p>
          {anexos.map((a) => (
            <a key={a.id} href={a.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline">
              <Paperclip className="h-3.5 w-3.5" />
              {a.nome_original}
            </a>
          ))}
        </div>
      )}

      {mostrarCaixaResposta ? (
        <div className="space-y-2">
          <Textarea placeholder="Escreva uma resposta..." rows={3} value={corpo} onChange={(e) => setCorpo(e.target.value)} />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                <FileUp className="h-3.5 w-3.5" />
                {arquivo ? arquivo.name : "Anexar arquivo"}
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) setArquivo(file)
                    e.target.value = ""
                  }}
                />
              </label>
              {ehAgente && (
                <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
                  <input type="checkbox" checked={notaInterna} onChange={(e) => setNotaInterna(e.target.checked)} />
                  Nota interna (não visível ao solicitante)
                </label>
              )}
            </div>
            <Button size="sm" onClick={handleEnviar} disabled={enviando}>
              {enviando && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {enviando ? "Enviando..." : "Enviar"}
            </Button>
          </div>
        </div>
      ) : (
        statusEncerrado && <p className="text-xs text-muted-foreground">Este chamado está encerrado. Reabra para continuar a conversa.</p>
      )}
    </div>
  )
}
