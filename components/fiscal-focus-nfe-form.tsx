"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, CheckCircle2, Clock, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { cadastrarPrestadorFocusNfe } from "@/app/actions/focus-nfe"

interface FiscalFocusNfeFormProps {
  colaboradorId: string
  focusStatusCadastro: string
  focusMotivoErroCadastro?: string | null
  inscricaoMunicipalAtual?: string | null
  regimeTributarioAtual?: string | null
}

const REGIME_LABELS: Record<string, string> = {
  simples_nacional: "Simples Nacional",
  simples_nacional_excesso: "Simples Nacional (excesso de sublimite)",
  regime_normal: "Regime Normal",
}

export function FiscalFocusNfeForm({
  colaboradorId,
  focusStatusCadastro,
  focusMotivoErroCadastro,
  inscricaoMunicipalAtual,
  regimeTributarioAtual,
}: FiscalFocusNfeFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    const form = e.currentTarget
    try {
      const resultado = await cadastrarPrestadorFocusNfe(colaboradorId, new FormData(form))
      if (resultado.success) {
        toast.success("Prestador cadastrado na Focus NFe com sucesso!")
        form.reset()
        router.refresh()
      } else {
        setError(resultado.error || "Erro ao cadastrar")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        {focusStatusCadastro === "cadastrado" && (
          <Badge variant="success">
            <CheckCircle2 className="h-3 w-3" />
            Cadastrado na Focus NFe
          </Badge>
        )}
        {focusStatusCadastro === "erro" && (
          <Badge variant="destructive">
            <AlertCircle className="h-3 w-3" />
            Erro no cadastro
          </Badge>
        )}
        {(!focusStatusCadastro || focusStatusCadastro === "nao_cadastrado") && (
          <Badge variant="neutral">
            <Clock className="h-3 w-3" />
            Não cadastrado
          </Badge>
        )}
      </div>

      {focusStatusCadastro === "erro" && focusMotivoErroCadastro && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{focusMotivoErroCadastro}</AlertDescription>
        </Alert>
      )}

      {focusStatusCadastro === "cadastrado" && (
        <p className="text-sm text-muted-foreground">
          Inscrição municipal {inscricaoMunicipalAtual} · {REGIME_LABELS[regimeTributarioAtual || ""] || regimeTributarioAtual}.
          Pra atualizar o certificado, envie um novo abaixo.
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor={`inscricao_municipal-${colaboradorId}`}>Inscrição municipal</Label>
          <Input
            id={`inscricao_municipal-${colaboradorId}`}
            name="inscricao_municipal"
            defaultValue={inscricaoMunicipalAtual || ""}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`regime_tributario-${colaboradorId}`}>Regime tributário</Label>
          <Select name="regime_tributario" defaultValue={regimeTributarioAtual || "simples_nacional"}>
            <SelectTrigger id={`regime_tributario-${colaboradorId}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="simples_nacional">Simples Nacional</SelectItem>
              <SelectItem value="simples_nacional_excesso">Simples Nacional (excesso de sublimite)</SelectItem>
              <SelectItem value="regime_normal">Regime Normal</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor={`certificado-${colaboradorId}`}>Certificado digital (.pfx ou .p12)</Label>
          <Input id={`certificado-${colaboradorId}`} name="certificado" type="file" accept=".pfx,.p12" required />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`senha_certificado-${colaboradorId}`}>Senha do certificado</Label>
          <Input
            id={`senha_certificado-${colaboradorId}`}
            name="senha_certificado"
            type="password"
            autoComplete="off"
            required
          />
          <p className="text-xs text-muted-foreground">
            A senha nunca é armazenada — é usada só nesta requisição e descartada.
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Button type="submit" disabled={loading} className="w-full gap-2">
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? "Enviando..." : "Cadastrar na Focus NFe"}
        </Button>
      </form>
    </div>
  )
}
