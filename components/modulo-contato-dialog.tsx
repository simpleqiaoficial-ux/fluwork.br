"use client"

import { useState } from "react"
import type { FormEvent } from "react"
import { CheckCircle2, Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { solicitarLiberacaoModulo } from "@/app/actions/contato"

interface ModuloContatoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  modulo: "financeiro" | "contratos" | "ehs" | "geral"
  moduloLabel: string
  nome: string
  empresa: string
  email: string
}

/** Dialog de "Contatar comercial" nas telas de módulo/empresa bloqueada — identidade
 *  (nome/empresa/e-mail) já vem pronta da sessão, só pede uma mensagem opcional pra não
 *  fazer quem já está logado redigitar os próprios dados. */
export function ModuloContatoDialog({ open, onOpenChange, modulo, moduloLabel, nome, empresa, email }: ModuloContatoDialogProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const [mensagem, setMensagem] = useState("")

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError(null)
    const result = await solicitarLiberacaoModulo(modulo, mensagem.trim() || undefined)
    setLoading(false)
    if (result.success) {
      setSent(true)
    } else {
      setError(result.error ?? "Não foi possível enviar agora. Tente novamente.")
    }
  }

  function handleOpenChange(next: boolean) {
    onOpenChange(next)
    if (!next) {
      setTimeout(() => {
        setSent(false)
        setError(null)
        setMensagem("")
      }, 200)
    }
  }

  const assunto = modulo === "geral" ? "regularizar o acesso à plataforma" : `a liberação do módulo ${moduloLabel}`

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        {sent ? (
          <div className="flex flex-col items-center py-6 text-center">
            <CheckCircle2 className="h-10 w-10 text-success" aria-hidden="true" />
            <h3 className="mt-4 text-lg font-semibold text-foreground">Recebemos sua solicitação</h3>
            <p className="mt-1.5 text-sm text-muted-foreground">Nosso time comercial vai entrar em contato pra {assunto}.</p>
            <Button className="mt-6" onClick={() => handleOpenChange(false)}>
              Fechar
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Contatar comercial</DialogTitle>
              <DialogDescription>Vamos avisar o time comercial que {empresa} quer {assunto}.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="rounded-md border bg-muted/40 p-3 text-sm space-y-1">
                <p>
                  <span className="text-muted-foreground">Nome:</span> {nome}
                </p>
                <p>
                  <span className="text-muted-foreground">Empresa:</span> {empresa}
                </p>
                <p>
                  <span className="text-muted-foreground">E-mail:</span> {email}
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="modulo-contato-mensagem">Mensagem (opcional)</Label>
                <Textarea
                  id="modulo-contato-mensagem"
                  value={mensagem}
                  onChange={(e) => setMensagem(e.target.value)}
                  maxLength={2000}
                  rows={3}
                  placeholder="Conte um pouco mais sobre o que sua empresa precisa"
                  disabled={loading}
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full gap-2" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                Enviar
              </Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
