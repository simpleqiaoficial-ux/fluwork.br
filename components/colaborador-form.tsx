"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { criarColaborador } from "@/app/actions/colaboradores"
import { listarEquipes } from "@/app/actions/equipes"
import { listarCentrosCusto } from "@/app/actions/centros-custo"
import { consultarCnpj } from "@/app/actions/cnpj"
import { useRouter } from "next/navigation"
import type { TipoAcesso, CentroCusto } from "@/types/colaborador"
import { toast } from "sonner"
import { Loader2, CheckCircle2, AlertTriangle } from "lucide-react"

interface ColaboradorFormProps {
  usuarioLogadoTipoAcesso?: string
}

function formatarCnpj(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 14)
  return digits
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2")
}

function formatarCep(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8)
  return digits.replace(/(\d{5})(\d)/, "$1-$2")
}

const ESTADO_INICIAL = {
  nome_completo: "",
  salario: "",
  cnpj: "",
  razao_social: "",
  data_abertura: "",
  endereco_cep: "",
  endereco_logradouro: "",
  endereco_numero: "",
  endereco_complemento: "",
  endereco_bairro: "",
  endereco_cidade: "",
  endereco_uf: "",
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
}

export function ColaboradorForm({ usuarioLogadoTipoAcesso }: ColaboradorFormProps) {
  const isAdm = usuarioLogadoTipoAcesso === "Adm"
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [equipes, setEquipes] = useState<Array<{ id: string; nome: string }>>([])
  const [centrosCusto, setCentrosCusto] = useState<CentroCusto[]>([])
  const [cnpjStatus, setCnpjStatus] = useState<"idle" | "loading" | "found" | "not-found">("idle")
  const [cnpjSituacao, setCnpjSituacao] = useState<string | null>(null)
  const [pessoaFisicaAtivo, setPessoaFisicaAtivo] = useState(false)
  const [formData, setFormData] = useState(ESTADO_INICIAL)

  useEffect(() => {
    Promise.all([listarEquipes(), listarCentrosCusto()]).then(([equipesData, ccData]) => {
      setEquipes(equipesData)
      setCentrosCusto(ccData)
    })
  }, [])

  const handleCnpjBlur = async () => {
    const digits = formData.cnpj.replace(/\D/g, "")
    if (digits.length !== 14) {
      setCnpjStatus("idle")
      setCnpjSituacao(null)
      return
    }

    setCnpjStatus("loading")
    setCnpjSituacao(null)
    const resultado = await consultarCnpj(digits)

    if (!resultado.success) {
      setCnpjStatus("not-found")
      return
    }

    setCnpjStatus("found")
    setCnpjSituacao(resultado.situacao ?? null)
    setFormData((prev) => ({
      ...prev,
      razao_social: resultado.razaoSocial || prev.razao_social,
      data_abertura: resultado.dataAbertura || prev.data_abertura,
      endereco_cep: resultado.endereco?.cep ? formatarCep(resultado.endereco.cep) : prev.endereco_cep,
      endereco_logradouro: resultado.endereco?.logradouro || prev.endereco_logradouro,
      endereco_numero: resultado.endereco?.numero || prev.endereco_numero,
      endereco_complemento: resultado.endereco?.complemento || prev.endereco_complemento,
      endereco_bairro: resultado.endereco?.bairro || prev.endereco_bairro,
      endereco_cidade: resultado.endereco?.cidade || prev.endereco_cidade,
      endereco_uf: resultado.endereco?.uf || prev.endereco_uf,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await criarColaborador({
        nome_completo: pessoaFisicaAtivo ? formData.nome_completo : "",
        salario: Number.parseFloat(formData.salario),
        cnpj: formData.cnpj,
        razao_social: formData.razao_social || null,
        data_abertura: formData.data_abertura || null,
        endereco_cep: formData.endereco_cep || null,
        endereco_logradouro: formData.endereco_logradouro || null,
        endereco_numero: formData.endereco_numero || null,
        endereco_complemento: formData.endereco_complemento || null,
        endereco_bairro: formData.endereco_bairro || null,
        endereco_cidade: formData.endereco_cidade || null,
        endereco_uf: formData.endereco_uf || null,
        data_nascimento: pessoaFisicaAtivo ? formData.data_nascimento || null : null,
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

      toast.success("Prestador cadastrado com sucesso!")

      setFormData(ESTADO_INICIAL)
      setPessoaFisicaAtivo(false)
      setCnpjStatus("idle")
      setCnpjSituacao(null)
      router.refresh()
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Erro ao cadastrar prestador"
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dados do prestador</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Empresa (CNPJ) */}
          <div className="space-y-5">
            <h3 className="text-sm font-semibold text-foreground">Empresa</h3>
            <div className="grid gap-x-4 gap-y-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="cnpj">CNPJ</Label>
                <div className="relative">
                  <Input
                    id="cnpj"
                    placeholder="00.000.000/0000-00"
                    value={formData.cnpj}
                    onChange={(e) => setFormData({ ...formData, cnpj: formatarCnpj(e.target.value) })}
                    onBlur={handleCnpjBlur}
                    className="pr-9"
                    required
                  />
                  {cnpjStatus === "loading" && (
                    <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                  )}
                  {cnpjStatus === "found" && (
                    <CheckCircle2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-success" />
                  )}
                  {cnpjStatus === "not-found" && (
                    <AlertTriangle className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-warning" />
                  )}
                </div>
                {cnpjStatus === "found" && (
                  <p className="text-xs text-muted-foreground">
                    Dados localizados na Receita Federal
                    {cnpjSituacao && cnpjSituacao.toUpperCase() !== "ATIVA" ? ` — situação: ${cnpjSituacao}` : ""}
                  </p>
                )}
                {cnpjStatus === "not-found" && (
                  <p className="text-xs text-muted-foreground">
                    CNPJ não encontrado na Receita Federal — confira o número informado
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="data_abertura">Data de Abertura</Label>
                <Input
                  id="data_abertura"
                  type="date"
                  value={formData.data_abertura}
                  onChange={(e) => setFormData({ ...formData, data_abertura: e.target.value })}
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="razao_social">Razão Social</Label>
                <Input
                  id="razao_social"
                  placeholder="Preenchido automaticamente pelo CNPJ"
                  value={formData.razao_social}
                  onChange={(e) => setFormData({ ...formData, razao_social: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endereco_cep">CEP</Label>
                <Input
                  id="endereco_cep"
                  placeholder="00000-000"
                  value={formData.endereco_cep}
                  onChange={(e) => setFormData({ ...formData, endereco_cep: formatarCep(e.target.value) })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endereco_uf">UF</Label>
                <Input
                  id="endereco_uf"
                  placeholder="SP"
                  maxLength={2}
                  value={formData.endereco_uf}
                  onChange={(e) => setFormData({ ...formData, endereco_uf: e.target.value.toUpperCase() })}
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="endereco_logradouro">Logradouro</Label>
                <Input
                  id="endereco_logradouro"
                  placeholder="Rua, avenida..."
                  value={formData.endereco_logradouro}
                  onChange={(e) => setFormData({ ...formData, endereco_logradouro: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endereco_numero">Número</Label>
                <Input
                  id="endereco_numero"
                  value={formData.endereco_numero}
                  onChange={(e) => setFormData({ ...formData, endereco_numero: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endereco_complemento">Complemento</Label>
                <Input
                  id="endereco_complemento"
                  value={formData.endereco_complemento}
                  onChange={(e) => setFormData({ ...formData, endereco_complemento: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endereco_bairro">Bairro</Label>
                <Input
                  id="endereco_bairro"
                  value={formData.endereco_bairro}
                  onChange={(e) => setFormData({ ...formData, endereco_bairro: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endereco_cidade">Cidade</Label>
                <Input
                  id="endereco_cidade"
                  value={formData.endereco_cidade}
                  onChange={(e) => setFormData({ ...formData, endereco_cidade: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Pessoa física (opcional) */}
          <div className="space-y-5 border-t pt-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Pessoa física (opcional)</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Vincule o nome de uma pessoa responsável para facilitar a gestão — o acesso continua sendo da empresa
                </p>
              </div>
              <Switch checked={pessoaFisicaAtivo} onCheckedChange={setPessoaFisicaAtivo} />
            </div>

            {pessoaFisicaAtivo && (
              <div className="grid gap-x-4 gap-y-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="nome_completo">Nome Completo</Label>
                  <Input
                    id="nome_completo"
                    placeholder="João da Silva"
                    value={formData.nome_completo}
                    onChange={(e) => setFormData({ ...formData, nome_completo: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="data_nascimento">Data de Nascimento</Label>
                  <Input
                    id="data_nascimento"
                    type="date"
                    value={formData.data_nascimento}
                    onChange={(e) => setFormData({ ...formData, data_nascimento: e.target.value })}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Acesso à plataforma */}
          <div className="space-y-5 border-t pt-6">
            <h3 className="text-sm font-semibold text-foreground">Acesso à plataforma</h3>
            <div className="grid gap-x-4 gap-y-5 sm:grid-cols-2">
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
                  placeholder="Mínimo 6 caracteres"
                  minLength={6}
                  value={formData.senha}
                  onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tipo_acesso">Perfil de Acesso</Label>
                <Select
                  value={formData.tipo_acesso}
                  onValueChange={(value) => setFormData({ ...formData, tipo_acesso: value as TipoAcesso })}
                >
                  <SelectTrigger id="tipo_acesso">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Colaborador">Prestador</SelectItem>
                    <SelectItem value="Supervisor">Lançador de Ordem</SelectItem>
                    <SelectItem value="Gerente">1º Aprovador</SelectItem>
                    <SelectItem value="Financeiro">Aprovador Final</SelectItem>
                    {isAdm && <SelectItem value="Adm">Administrador</SelectItem>}
                    {isAdm && <SelectItem value="EHS">EHS</SelectItem>}
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
            </div>
          </div>

          {/* Contrato e pagamento */}
          <div className="space-y-5 border-t pt-6">
            <h3 className="text-sm font-semibold text-foreground">Contrato e pagamento</h3>
            <div className="grid gap-x-4 gap-y-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="salario">Valor Contratual Base (R$)</Label>
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

              <div className="space-y-2">
                <Label htmlFor="tipo_chave_pix">Tipo Chave PIX</Label>
                <Select
                  value={formData.tipo_chave_pix || "none"}
                  onValueChange={(value) =>
                    setFormData({ ...formData, tipo_chave_pix: value === "none" ? "" : value })
                  }
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
                    <SelectItem value="aleatoria">Chave Aleatória</SelectItem>
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
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Cadastrando..." : "Cadastrar Prestador"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
