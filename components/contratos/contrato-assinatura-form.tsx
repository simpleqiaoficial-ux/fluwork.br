"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, PenLine, XCircle } from "lucide-react"
import { toast } from "sonner"
import { aceitarEAssinarContrato, recusarContrato } from "@/app/actions/contratos-assinatura"

interface ContratoAssinaturaFormProps {
  token: string
  emailSignatario: string
}

export function ContratoAssinaturaForm({ token, emailSignatario }: ContratoAssinaturaFormProps) {
  const router = useRouter()
  const [aceite, setAceite] = useState(false)
  const [emailConfirmacao, setEmailConfirmacao] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [mostrarRecusa, setMostrarRecusa] = useState(false)
  const [motivoRecusa, setMotivoRecusa] = useState("")

  const handleAssinar = async () => {
    setError("")
    setLoading(true)
    try {
      const result = await aceitarEAssinarContrato(token, emailConfirmacao)
      if (result.success) {
        toast.success("Contrato assinado com sucesso")
        router.refresh()
      } else {
        setError(result.error || "Erro ao assinar contrato")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleRecusar = async () => {
    setLoading(true)
    try {
      const result = await recusarContrato(token, motivoRecusa || undefined)
      if (result.success) {
        toast.success("Contrato recusado")
        router.refresh()
      } else {
        toast.error(result.error || "Erro ao recusar contrato")
      }
    } finally {
      setLoading(false)
      setMostrarRecusa(false)
    }
  }

  return (
    <div className="rounded-md border bg-card p-5 space-y-4">
      <p className="text-sm font-semibold">Confirmar e assinar</p>

      {!mostrarRecusa ? (
        <>
          <div className="space-y-2">
            <Label htmlFor="email-confirmacao" className="text-xs text-muted-foreground">
              Confirme seu e-mail para assinar
            </Label>
            <Input
              id="email-confirmacao"
              type="email"
              placeholder={emailSignatario}
              value={emailConfirmacao}
              onChange={(e) => setEmailConfirmacao(e.target.value)}
            />
          </div>

          <div className="flex items-start gap-2">
            <Checkbox id="aceite" checked={aceite} onCheckedChange={(v) => setAceite(!!v)} className="mt-0.5" />
            <label htmlFor="aceite" className="text-sm leading-snug cursor-pointer">
              Li e concordo integralmente com os termos deste contrato, e declaro estar ciente de que esta assinatura eletrônica tem validade jurídica entre as partes.
            </label>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <Button
              variant="ghost"
              className="gap-2 text-destructive hover:text-destructive"
              onClick={() => setMostrarRecusa(true)}
              disabled={loading}
            >
              <XCircle className="h-4 w-4" />
              Recusar
            </Button>
            <Button
              className="flex-1 gap-2"
              disabled={!aceite || !emailConfirmacao.trim() || loading}
              onClick={handleAssinar}
            >
              <PenLine className="h-4 w-4" />
              {loading ? "Assinando..." : "Assinar contrato"}
            </Button>
          </div>
        </>
      ) : (
        <>
          <Label htmlFor="motivo-recusa" className="text-xs text-muted-foreground">
            Motivo da recusa (opcional)
          </Label>
          <Textarea
            id="motivo-recusa"
            value={motivoRecusa}
            onChange={(e) => setMotivoRecusa(e.target.value)}
            rows={2}
            className="resize-none"
          />
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setMostrarRecusa(false)} disabled={loading}>
              Voltar
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={handleRecusar}
              disabled={loading}
            >
              {loading ? "Enviando..." : "Confirmar recusa"}
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
