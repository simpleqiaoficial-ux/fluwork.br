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
  precisaDefinirSenha?: boolean
}

export function ContratoAssinaturaForm({ token, emailSignatario, precisaDefinirSenha }: ContratoAssinaturaFormProps) {
  const router = useRouter()
  const [aceite, setAceite] = useState(false)
  const [emailConfirmacao, setEmailConfirmacao] = useState("")
  const [senha, setSenha] = useState("")
  const [confirmarSenha, setConfirmarSenha] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [mostrarRecusa, setMostrarRecusa] = useState(false)
  const [motivoRecusa, setMotivoRecusa] = useState("")

  const senhaValida =
    !precisaDefinirSenha ||
    (senha.length >= 8 && /[A-Z]/.test(senha) && /[a-z]/.test(senha) && /[0-9]/.test(senha) && senha === confirmarSenha)

  const handleAssinar = async () => {
    setError("")
    if (precisaDefinirSenha && senha !== confirmarSenha) {
      setError("As senhas não coincidem")
      return
    }
    setLoading(true)
    try {
      const result = await aceitarEAssinarContrato(token, emailConfirmacao, precisaDefinirSenha ? senha : undefined)
      if (result.success) {
        toast.success(precisaDefinirSenha ? "Senha definida e contrato assinado com sucesso" : "Contrato assinado com sucesso")
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

          {precisaDefinirSenha && (
            <div className="space-y-3 rounded-md border bg-muted/30 p-3">
              <p className="text-xs font-medium">Este é seu primeiro acesso — defina sua senha da plataforma</p>
              <div className="space-y-2">
                <Label htmlFor="senha" className="text-xs text-muted-foreground">
                  Senha (mín. 8 caracteres, com maiúscula, minúscula e número)
                </Label>
                <Input id="senha" type="password" value={senha} onChange={(e) => setSenha(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmar-senha" className="text-xs text-muted-foreground">
                  Confirmar senha
                </Label>
                <Input
                  id="confirmar-senha"
                  type="password"
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                />
              </div>
            </div>
          )}

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
              disabled={!aceite || !emailConfirmacao.trim() || !senhaValida || loading}
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
