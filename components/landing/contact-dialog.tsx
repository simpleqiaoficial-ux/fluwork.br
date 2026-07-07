"use client"

import { useState } from "react"
import type { FormEvent } from "react"
import { CheckCircle2, Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { enviarContatoComercial } from "@/app/actions/contato"

interface ContactDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** Formulário de "Quero contratar" — em vez de um cadastro self-service, captura os dados
 *  do interessado e envia por e-mail para o time comercial entrar em contato. */
export function ContactDialog({ open, onOpenChange }: ContactDialogProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError(null)
    const result = await enviarContatoComercial(new FormData(event.currentTarget))
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
      }, 200)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        {sent ? (
          <div className="flex flex-col items-center py-6 text-center">
            <CheckCircle2 className="h-10 w-10 text-success" aria-hidden="true" />
            <h3 className="mt-4 text-lg font-semibold text-foreground">Recebemos seu contato</h3>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Nosso time vai analisar a necessidade da sua empresa e entrar em contato em breve.
            </p>
            <Button className="mt-6" onClick={() => handleOpenChange(false)}>
              Fechar
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Quero contratar</DialogTitle>
              <DialogDescription>
                Conte um pouco sobre sua empresa e nosso time entra em contato para apresentar a proposta.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                className="hidden"
                aria-hidden="true"
              />
              <div className="space-y-1.5">
                <Label htmlFor="contato-nome">Nome completo</Label>
                <Input id="contato-nome" name="nome" required maxLength={120} disabled={loading} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="contato-empresa">Empresa</Label>
                <Input id="contato-empresa" name="empresa" required maxLength={160} disabled={loading} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="contato-email">E-mail</Label>
                <Input id="contato-email" name="email" type="email" required maxLength={160} disabled={loading} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="contato-telefone">Telefone (opcional)</Label>
                <Input id="contato-telefone" name="telefone" maxLength={40} disabled={loading} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="contato-mensagem">O que sua empresa precisa? (opcional)</Label>
                <Textarea id="contato-mensagem" name="mensagem" maxLength={2000} rows={3} disabled={loading} />
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
