"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { redefinirSenhaComToken } from "@/app/actions/auth"
import { AlertCircle, CheckCircle2, Eye, EyeOff, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface RedefinirSenhaTokenFormProps {
  token: string
}

export function RedefinirSenhaTokenForm({ token }: RedefinirSenhaTokenFormProps) {
  const router = useRouter()
  const [novaSenha, setNovaSenha] = useState("")
  const [confirmarSenha, setConfirmarSenha] = useState("")
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [sucesso, setSucesso] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (novaSenha !== confirmarSenha) {
      setError("As senhas não coincidem")
      return
    }

    setLoading(true)
    try {
      const result = await redefinirSenhaComToken(token, novaSenha)
      if (result.success) {
        setSucesso(true)
        toast.success("Senha redefinida com sucesso")
        setTimeout(() => router.push("/login"), 2000)
      } else {
        setError(result.error || "Erro ao redefinir senha")
      }
    } catch {
      setError("Erro inesperado. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  if (sucesso) {
    return (
      <div className="space-y-3 text-center">
        <div className="flex justify-center">
          <CheckCircle2 className="h-10 w-10 text-success" />
        </div>
        <p className="font-medium text-foreground">Senha redefinida com sucesso!</p>
        <p className="text-sm text-muted-foreground">Redirecionando para o login...</p>
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
        <Label htmlFor="novaSenha">Nova senha</Label>
        <div className="relative">
          <Input
            id="novaSenha"
            type={mostrarSenha ? "text" : "password"}
            value={novaSenha}
            onChange={(e) => setNovaSenha(e.target.value)}
            placeholder="Mínimo 8 caracteres"
            className="pr-10"
            disabled={loading}
            required
          />
          <button
            type="button"
            onClick={() => setMostrarSenha(!mostrarSenha)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {mostrarSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <p className="text-xs text-muted-foreground">Use letras maiúsculas, minúsculas e números.</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmarSenha">Confirmar nova senha</Label>
        <Input
          id="confirmarSenha"
          type={mostrarSenha ? "text" : "password"}
          value={confirmarSenha}
          onChange={(e) => setConfirmarSenha(e.target.value)}
          disabled={loading}
          required
        />
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Redefinir senha"}
      </Button>
    </form>
  )
}
