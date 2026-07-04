"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { criarEmpresaComAdmin } from "@/app/actions/empresas"

export function NovaEmpresaForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [empresa, setEmpresa] = useState({
    razao_social: "",
    nome_fantasia: "",
    cnpj: "",
    email: "",
    telefone: "",
    endereco: "",
  })
  const [admin, setAdmin] = useState({ nome_completo: "", email: "", senha: "" })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const result = await criarEmpresaComAdmin(empresa, admin)
      if (result.success) {
        toast.success("Empresa criada com sucesso")
        router.push(`/admin/empresas/${result.empresa!.id}`)
      } else {
        toast.error(result.error || "Erro ao criar empresa")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dados da empresa</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-x-4 gap-y-5 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="razao_social">Razão social</Label>
            <Input
              id="razao_social"
              value={empresa.razao_social}
              onChange={(e) => setEmpresa({ ...empresa, razao_social: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nome_fantasia">Nome fantasia (opcional)</Label>
            <Input
              id="nome_fantasia"
              value={empresa.nome_fantasia}
              onChange={(e) => setEmpresa({ ...empresa, nome_fantasia: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cnpj">CNPJ</Label>
            <Input
              id="cnpj"
              placeholder="00.000.000/0000-00"
              value={empresa.cnpj}
              onChange={(e) => setEmpresa({ ...empresa, cnpj: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="empresa_email">E-mail (opcional)</Label>
            <Input
              id="empresa_email"
              type="email"
              value={empresa.email}
              onChange={(e) => setEmpresa({ ...empresa, email: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="telefone">Telefone (opcional)</Label>
            <Input
              id="telefone"
              value={empresa.telefone}
              onChange={(e) => setEmpresa({ ...empresa, telefone: e.target.value })}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="endereco">Endereço (opcional)</Label>
            <Input
              id="endereco"
              value={empresa.endereco}
              onChange={(e) => setEmpresa({ ...empresa, endereco: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Administrador da empresa</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-x-4 gap-y-5 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="admin_nome">Nome completo</Label>
            <Input
              id="admin_nome"
              value={admin.nome_completo}
              onChange={(e) => setAdmin({ ...admin, nome_completo: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="admin_email">E-mail</Label>
            <Input
              id="admin_email"
              type="email"
              value={admin.email}
              onChange={(e) => setAdmin({ ...admin, email: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="admin_senha">Senha</Label>
            <Input
              id="admin_senha"
              type="password"
              placeholder="Mínimo 8 caracteres"
              minLength={8}
              value={admin.senha}
              onChange={(e) => setAdmin({ ...admin, senha: e.target.value })}
              required
            />
          </div>
        </CardContent>
      </Card>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Criando..." : "Criar empresa"}
      </Button>
    </form>
  )
}
