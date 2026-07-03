"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { login } from "@/app/actions/auth"
import { AlertCircle, Loader2, Mail, Lock, Eye, EyeOff } from "lucide-react"
import Link from "next/link"

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({ email: "", password: "" })
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      const result = await login(formData.email, formData.password)
      if (result?.error) setError(result.error)
    } catch {
      setError("Erro ao fazer login")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0f1a] flex flex-col">
      {/* Header Navigation */}
      <header className="w-full py-4 px-6">
        <nav className="max-w-7xl mx-auto flex items-center justify-end gap-2">
          <Link 
            href="/login" 
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium"
          >
            Login
          </Link>
          <Link 
            href="/faq" 
            className="px-4 py-2 text-gray-400 hover:text-white transition-colors text-sm font-medium"
          >
            FAQ
          </Link>
          <Link 
            href="/termos" 
            className="px-4 py-2 text-gray-400 hover:text-white transition-colors text-sm font-medium"
          >
            Termos
          </Link>
          <Link 
            href="/privacidade" 
            className="px-4 py-2 text-gray-400 hover:text-white transition-colors text-sm font-medium"
          >
            Privacidade
          </Link>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {/* Logo Area - sem icone */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold">
              <span className="text-white">Fluxo</span>
              <span className="text-primary">Pay</span>
            </h1>
            <p className="text-gray-400 mt-2 text-sm">
              Plataforma de Gestao de Prestadores - Simpleqia
            </p>
          </div>

          {/* Login Card */}
          <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6 shadow-2xl">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-white">Acesse sua conta</h2>
              <p className="text-gray-400 text-sm mt-1">Area restrita a usuarios autorizados</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <Alert variant="destructive" className="border-red-500/50 bg-red-500/10">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">E-mail</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                  <Input
                    type="email"
                    placeholder="seu@empresa.com.br"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="pl-10 h-12 bg-[#1a2332] border-gray-700 text-white placeholder:text-gray-500 focus:border-primary"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">Senha</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Digite sua senha"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    className="pl-10 pr-10 h-12 bg-[#1a2332] border-gray-700 text-white placeholder:text-gray-500 focus:border-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={loading} 
                className="w-full h-12 text-sm font-semibold bg-primary hover:bg-primary/90"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Entrar"}
              </Button>
            </form>

            </div>

          {/* Footer text */}
          <p className="text-center text-xs text-gray-500 mt-6">
            Ao acessar, voce concorda com nossos{" "}
            <Link href="/termos" className="text-primary hover:underline">Termos de Uso</Link>
            {" "}e{" "}
            <Link href="/privacidade" className="text-primary hover:underline">Politica de Privacidade</Link>
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 px-4 border-t border-gray-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <p>2025 FluxoPay - Simpleqia. Todos os direitos reservados.</p>
          <div className="flex items-center gap-4">
            <span>Suporte: simpleqia.oficial@gmail.com</span>
            <span>|</span>
            <span>(11) 91486-0806</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
