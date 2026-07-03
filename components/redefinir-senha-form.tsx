"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { redefinirSenha } from "@/app/actions/auth"
import { Eye, EyeOff, CheckCircle2, AlertCircle } from "lucide-react"

export function RedefinirSenhaForm() {
  const [senhaAtual, setSenhaAtual] = useState("")
  const [novaSenha, setNovaSenha] = useState("")
  const [confirmarSenha, setConfirmarSenha] = useState("")
  const [mostrarSenhaAtual, setMostrarSenhaAtual] = useState(false)
  const [mostrarNovaSenha, setMostrarNovaSenha] = useState(false)
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)

    // Validações client-side
    if (!senhaAtual || !novaSenha || !confirmarSenha) {
      setMessage({ type: "error", text: "Por favor, preencha todos os campos" })
      return
    }

    if (novaSenha.length < 6) {
      setMessage({ type: "error", text: "A nova senha deve ter no mínimo 6 caracteres" })
      return
    }

    if (novaSenha !== confirmarSenha) {
      setMessage({ type: "error", text: "A nova senha e a confirmação não coincidem" })
      return
    }

    if (senhaAtual === novaSenha) {
      setMessage({ type: "error", text: "A nova senha deve ser diferente da senha atual" })
      return
    }

    setLoading(true)

    try {
      const result = await redefinirSenha(senhaAtual, novaSenha)

      if (result.success) {
        setMessage({ type: "success", text: result.message || "Senha alterada com sucesso!" })
        setSenhaAtual("")
        setNovaSenha("")
        setConfirmarSenha("")
      } else {
        setMessage({ type: "error", text: result.error || "Erro ao alterar senha" })
      }
    } catch (error) {
      setMessage({ type: "error", text: "Erro inesperado ao alterar senha" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Alterar Senha</CardTitle>
        <CardDescription>Digite sua senha atual e escolha uma nova senha segura</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Senha Atual */}
          <div className="space-y-2">
            <Label htmlFor="senhaAtual">Senha Atual *</Label>
            <div className="relative">
              <Input
                id="senhaAtual"
                type={mostrarSenhaAtual ? "text" : "password"}
                value={senhaAtual}
                onChange={(e) => setSenhaAtual(e.target.value)}
                placeholder="Digite sua senha atual"
                className="pr-10"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setMostrarSenhaAtual(!mostrarSenhaAtual)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {mostrarSenhaAtual ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Nova Senha */}
          <div className="space-y-2">
            <Label htmlFor="novaSenha">Nova Senha *</Label>
            <div className="relative">
              <Input
                id="novaSenha"
                type={mostrarNovaSenha ? "text" : "password"}
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                placeholder="Digite sua nova senha (mínimo 6 caracteres)"
                className="pr-10"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setMostrarNovaSenha(!mostrarNovaSenha)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {mostrarNovaSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {novaSenha && novaSenha.length < 6 && (
              <p className="text-xs text-warning">Senha deve ter no mínimo 6 caracteres</p>
            )}
          </div>

          {/* Confirmar Nova Senha */}
          <div className="space-y-2">
            <Label htmlFor="confirmarSenha">Confirmar Nova Senha *</Label>
            <div className="relative">
              <Input
                id="confirmarSenha"
                type={mostrarConfirmarSenha ? "text" : "password"}
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                placeholder="Digite novamente a nova senha"
                className="pr-10"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setMostrarConfirmarSenha(!mostrarConfirmarSenha)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {mostrarConfirmarSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {confirmarSenha && novaSenha !== confirmarSenha && (
              <p className="text-xs text-destructive">As senhas não coincidem</p>
            )}
          </div>

          {/* Mensagem de Feedback */}
          {message && (
            <Alert variant={message.type === "error" ? "destructive" : "default"}>
              {message.type === "success" ? (
                <CheckCircle2 className="h-4 w-4 text-success" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          )}

          {/* Botão de Submit */}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Alterando..." : "Alterar Senha"}
          </Button>

          {/* Dicas de Segurança */}
          <div className="pt-4 border-t space-y-2">
            <p className="text-sm font-medium">Dicas para uma senha segura</p>
            <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
              <li>Use no mínimo 6 caracteres</li>
              <li>Combine letras maiúsculas e minúsculas</li>
              <li>Inclua números e caracteres especiais</li>
              <li>Evite informações pessoais óbvias</li>
            </ul>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
