"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { solicitarRecuperacaoSenha } from "@/app/actions/auth"
import { AlertCircle, CheckCircle2, Loader2, ArrowLeft } from "lucide-react"

export function EsqueciSenhaForm() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const result = await solicitarRecuperacaoSenha(email)
      if (result.success) {
        setEnviado(true)
      } else {
        setError(result.error || "Erro ao solicitar recuperação de senha")
      }
    } catch {
      setError("Erro inesperado. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  if (enviado) {
    return (
      <div className="space-y-5 text-center">
        <div className="flex justify-center">
          <CheckCircle2 className="h-10 w-10 text-success" />
        </div>
        <div>
          <p className="font-medium text-foreground">Verifique seu e-mail</p>
          <p className="text-sm text-muted-foreground mt-1.5">
            Se <span className="font-medium text-foreground">{email}</span> estiver cadastrado, você vai receber um
            link para redefinir sua senha em instantes.
          </p>
        </div>
        <Link href="/login" className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
          <ArrowLeft className="h-3.5 w-3.5" />
          Voltar para o login
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          type="email"
          placeholder="seu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
        />
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enviar link de recuperação"}
      </Button>

      <Link href="/login" className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-3.5 w-3.5" />
        Voltar para o login
      </Link>
    </form>
  )
}
