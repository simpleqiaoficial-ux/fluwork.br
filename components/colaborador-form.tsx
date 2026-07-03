"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { criarColaborador } from "@/app/actions/colaboradores"
import { listarEquipes } from "@/app/actions/equipes"
import { listarCentrosCusto } from "@/app/actions/centros-custo"
import { useRouter } from "next/navigation"
import type { TipoAcesso, CentroCusto } from "@/types/colaborador"
import { toast } from "sonner"

interface ColaboradorFormProps {
  usuarioLogadoTipoAcesso?: string
}

export function ColaboradorForm({ usuarioLogadoTipoAcesso }: ColaboradorFormProps) {
  const isAdm = usuarioLogadoTipoAcesso === "Adm"
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [equipes, setEquipes] = useState<Array<{ id: string; nome: string }>>([])
  const [centrosCusto, setCentrosCusto] = useState<CentroCusto[]>([])
  const [formData, setFormData] = useState({
    nome_completo: "",
    salario: "",
    cnpj: "",
    data_nascimento: "",
    data_aniversario_contrato: "",
    email: "",
    senha: "",
    tipo_acesso: "Colaborador" as TipoAcesso,
    equipe_id: "0",
    dia_pagamento: "1",
    chave_pix: "",
    tipo_chave_pix: "",
    centro_custo_id: "0",
  })

  useEffect(() => {
    Promise.all([listarEquipes(), listarCentrosCusto()]).then(([equipesData, ccData]) => {
      setEquipes(equipesData)
      setCentrosCusto(ccData)
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await criarColaborador({
        nome_completo: formData.nome_completo,
        salario: Number.parseFloat(formData.salario),
        cnpj: formData.cnpj,
        data_nascimento: formData.data_nascimento,
        data_aniversario_contrato: formData.data_aniversario_contrato,
        email: formData.email,
        senha: formData.senha,
        tipo_acesso: formData.tipo_acesso,
        equipe_id: formData.equipe_id === "0" ? null : formData.equipe_id,
        dia_pagamento: Number.parseInt(formData.dia_pagamento),
        chave_pix: formData.chave_pix || null,
        tipo_chave_pix: formData.tipo_chave_pix || null,
        centro_custo_id: formData.centro_custo_id === "0" ? null : formData.centro_custo_id,
      })

      toast.success("Colaborador cadastrado com sucesso!")

      setFormData({
        nome_completo: "",
        salario: "",
        cnpj: "",
        data_nascimento: "",
        data_aniversario_contrato: "",
        email: "",
        senha: "",
        tipo_acesso: "Colaborador",
        equipe_id: "0",
        dia_pagamento: "1",
        chave_pix: "",
        tipo_chave_pix: "",
        centro_custo_id: "0",
      })
      router.refresh()
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Erro ao cadastrar colaborador"
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Novo Colaborador</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="nome_completo">Nome Completo</Label>
              <Input
                id="nome_completo"
                placeholder="Joao da Silva"
                value={formData.nome_completo}
                onChange={(e) => setFormData({ ...formData, nome_completo: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="joao@exemplo.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="senha">Senha</Label>
              <Input
                id="senha"
                type="password"
                placeholder="Minimo 6 caracteres"
                minLength={6}
                value={formData.senha}
                onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cnpj">CNPJ</Label>
              <Input
                id="cnpj"
                placeholder="00.000.000/0000-00"
                value={formData.cnpj}
                onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="data_nascimento">Data de Nascimento</Label>
              <Input
                id="data_nascimento"
                type="date"
                value={formData.data_nascimento}
                onChange={(e) => setFormData({ ...formData, data_nascimento: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="data_aniversario_contrato">Data Aniversário Contrato</Label>
              <Input
                id="data_aniversario_contrato"
                type="date"
                value={formData.data_aniversario_contrato}
                onChange={(e) => setFormData({ ...formData, data_aniversario_contrato: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo_acesso">Tipo de Acesso</Label>
              <Select
                value={formData.tipo_acesso}
                onValueChange={(value) => setFormData({ ...formData, tipo_acesso: value as TipoAcesso })}
              >
                <SelectTrigger id="tipo_acesso">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Colaborador">Colaborador</SelectItem>
                  <SelectItem value="Supervisor">Supervisor</SelectItem>
                  <SelectItem value="Gerente">Gerente</SelectItem>
                  <SelectItem value="Financeiro">Financeiro</SelectItem>
                  {isAdm && <SelectItem value="Adm">Administrador</SelectItem>}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="equipe">Equipe</Label>
              <Select
                value={formData.equipe_id}
                onValueChange={(value) => setFormData({ ...formData, equipe_id: value })}
              >
                <SelectTrigger id="equipe">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Sem equipe</SelectItem>
                  {equipes.map((equipe) => (
                    <SelectItem key={equipe.id} value={equipe.id}>
                      {equipe.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dia_pagamento">Dia de Pagamento</Label>
              <Select
                value={formData.dia_pagamento}
                onValueChange={(value) => setFormData({ ...formData, dia_pagamento: value })}
              >
                <SelectTrigger id="dia_pagamento">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Dia 1</SelectItem>
                  <SelectItem value="15">Dia 15</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="salario">Salario Base (R$)</Label>
              <Input
                id="salario"
                type="number"
                step="0.01"
                min="0"
                placeholder="3000.00"
                value={formData.salario}
                onChange={(e) => setFormData({ ...formData, salario: e.target.value })}
                required
              />
            </div>

            {/* Centro de Custo */}
            <div className="space-y-2">
              <Label htmlFor="centro_custo">Centro de Custo</Label>
              <Select
                value={formData.centro_custo_id}
                onValueChange={(value) => setFormData({ ...formData, centro_custo_id: value })}
              >
                <SelectTrigger id="centro_custo">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Sem centro de custo</SelectItem>
                  {centrosCusto.map((cc) => (
                    <SelectItem key={cc.id} value={cc.id}>
                      {cc.numero} - {cc.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* PIX */}
            <div className="space-y-2">
              <Label htmlFor="tipo_chave_pix">Tipo Chave PIX</Label>
              <Select
                value={formData.tipo_chave_pix || "none"}
                onValueChange={(value) => setFormData({ ...formData, tipo_chave_pix: value === "none" ? "" : value })}
              >
                <SelectTrigger id="tipo_chave_pix">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem PIX</SelectItem>
                  <SelectItem value="cpf">CPF</SelectItem>
                  <SelectItem value="cnpj">CNPJ</SelectItem>
                  <SelectItem value="email">E-mail</SelectItem>
                  <SelectItem value="telefone">Telefone</SelectItem>
                  <SelectItem value="aleatoria">Chave Aleatoria</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.tipo_chave_pix && (
              <div className="space-y-2">
                <Label htmlFor="chave_pix">Chave PIX</Label>
                <Input
                  id="chave_pix"
                  placeholder="Informe a chave PIX"
                  value={formData.chave_pix}
                  onChange={(e) => setFormData({ ...formData, chave_pix: e.target.value })}
                />
              </div>
            )}
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Cadastrando..." : "Cadastrar Colaborador"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
