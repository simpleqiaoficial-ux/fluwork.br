"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Loader2, CheckCircle2, AlertTriangle, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { criarClienteEhs, atualizarClienteEhs, type ClienteEhsInput, type ClienteEhsResponsavelInput } from "@/app/actions/ehs-clientes"
import { consultarCnpj } from "@/app/actions/cnpj"

interface ClienteFormValues {
  nome: string
  razao_social: string
  cnpj: string
  endereco_cep: string
  endereco_logradouro: string
  endereco_numero: string
  endereco_complemento: string
  endereco_bairro: string
  endereco_cidade: string
  endereco_uf: string
  observacoes: string
  responsaveis: ClienteEhsResponsavelInput[]
}

interface ClienteFormProps {
  clienteId?: string
  valoresIniciais?: Partial<ClienteFormValues>
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

const ESTADO_VAZIO: ClienteFormValues = {
  nome: "",
  razao_social: "",
  cnpj: "",
  endereco_cep: "",
  endereco_logradouro: "",
  endereco_numero: "",
  endereco_complemento: "",
  endereco_bairro: "",
  endereco_cidade: "",
  endereco_uf: "",
  observacoes: "",
  responsaveis: [],
}

export function ClienteForm({ clienteId, valoresIniciais }: ClienteFormProps) {
  const router = useRouter()
  const [form, setForm] = useState<ClienteFormValues>({ ...ESTADO_VAZIO, ...valoresIniciais })
  const [salvando, setSalvando] = useState(false)
  const [cnpjStatus, setCnpjStatus] = useState<"idle" | "loading" | "found" | "not-found">("idle")

  const handleCnpjBlur = async () => {
    const digits = form.cnpj.replace(/\D/g, "")
    if (digits.length !== 14) {
      setCnpjStatus("idle")
      return
    }
    setCnpjStatus("loading")
    const resultado = await consultarCnpj(digits)
    if (!resultado.success) {
      setCnpjStatus("not-found")
      return
    }
    setCnpjStatus("found")
    setForm((prev) => ({
      ...prev,
      nome: prev.nome || resultado.nome || prev.nome,
      razao_social: resultado.razaoSocial || prev.razao_social,
      endereco_cep: resultado.endereco?.cep ? formatarCep(resultado.endereco.cep) : prev.endereco_cep,
      endereco_logradouro: resultado.endereco?.logradouro || prev.endereco_logradouro,
      endereco_numero: resultado.endereco?.numero || prev.endereco_numero,
      endereco_complemento: resultado.endereco?.complemento || prev.endereco_complemento,
      endereco_bairro: resultado.endereco?.bairro || prev.endereco_bairro,
      endereco_cidade: resultado.endereco?.cidade || prev.endereco_cidade,
      endereco_uf: resultado.endereco?.uf || prev.endereco_uf,
    }))
  }

  const addResponsavel = () => {
    setForm((prev) => ({ ...prev, responsaveis: [...prev.responsaveis, { nome: "", cargo: "", telefone: "", email: "" }] }))
  }

  const updateResponsavel = (index: number, patch: Partial<ClienteEhsResponsavelInput>) => {
    setForm((prev) => ({
      ...prev,
      responsaveis: prev.responsaveis.map((r, i) => (i === index ? { ...r, ...patch } : r)),
    }))
  }

  const removeResponsavel = (index: number) => {
    setForm((prev) => ({ ...prev, responsaveis: prev.responsaveis.filter((_, i) => i !== index) }))
  }

  const handleSalvar = async () => {
    if (!form.nome.trim()) {
      toast.error("Informe o nome do cliente")
      return
    }
    setSalvando(true)
    try {
      const payload: ClienteEhsInput = {
        nome: form.nome,
        razao_social: form.razao_social || null,
        cnpj: form.cnpj.replace(/\D/g, "") || null,
        endereco_cep: form.endereco_cep.replace(/\D/g, "") || null,
        endereco_logradouro: form.endereco_logradouro || null,
        endereco_numero: form.endereco_numero || null,
        endereco_complemento: form.endereco_complemento || null,
        endereco_bairro: form.endereco_bairro || null,
        endereco_cidade: form.endereco_cidade || null,
        endereco_uf: form.endereco_uf || null,
        observacoes: form.observacoes || null,
        responsaveis: form.responsaveis,
      }

      const result = clienteId ? await atualizarClienteEhs(clienteId, payload) : await criarClienteEhs(payload)

      if (!result.success) {
        toast.error(result.error || "Erro ao salvar cliente")
        return
      }
      toast.success(clienteId ? "Cliente atualizado" : "Cliente cadastrado")
      router.push(clienteId ? `/ehs/clientes/${clienteId}` : `/ehs/clientes/${"id" in result ? result.id : ""}`)
      router.refresh()
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dados do cliente</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="cliente-cnpj">CNPJ</Label>
            <div className="relative">
              <Input
                id="cliente-cnpj"
                placeholder="00.000.000/0000-00"
                value={form.cnpj}
                onChange={(e) => setForm({ ...form, cnpj: formatarCnpj(e.target.value) })}
                onBlur={handleCnpjBlur}
                className="pr-9"
              />
              {cnpjStatus === "loading" && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
              )}
              {cnpjStatus === "found" && (
                <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-success" />
              )}
              {cnpjStatus === "not-found" && (
                <AlertTriangle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-warning" />
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="cliente-nome">Nome</Label>
            <Input
              id="cliente-nome"
              placeholder="Ex: John Deere"
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="cliente-razao">Razão Social</Label>
            <Input
              id="cliente-razao"
              value={form.razao_social}
              onChange={(e) => setForm({ ...form, razao_social: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cliente-cep">CEP</Label>
            <Input
              id="cliente-cep"
              value={form.endereco_cep}
              onChange={(e) => setForm({ ...form, endereco_cep: formatarCep(e.target.value) })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cliente-logradouro">Logradouro</Label>
            <Input
              id="cliente-logradouro"
              value={form.endereco_logradouro}
              onChange={(e) => setForm({ ...form, endereco_logradouro: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cliente-numero">Número</Label>
            <Input
              id="cliente-numero"
              value={form.endereco_numero}
              onChange={(e) => setForm({ ...form, endereco_numero: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cliente-complemento">Complemento</Label>
            <Input
              id="cliente-complemento"
              value={form.endereco_complemento}
              onChange={(e) => setForm({ ...form, endereco_complemento: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cliente-bairro">Bairro</Label>
            <Input
              id="cliente-bairro"
              value={form.endereco_bairro}
              onChange={(e) => setForm({ ...form, endereco_bairro: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cliente-cidade">Cidade</Label>
            <Input
              id="cliente-cidade"
              value={form.endereco_cidade}
              onChange={(e) => setForm({ ...form, endereco_cidade: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cliente-uf">UF</Label>
            <Input
              id="cliente-uf"
              maxLength={2}
              value={form.endereco_uf}
              onChange={(e) => setForm({ ...form, endereco_uf: e.target.value.toUpperCase() })}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="cliente-observacoes">Observações</Label>
            <Textarea
              id="cliente-observacoes"
              rows={3}
              value={form.observacoes}
              onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Responsáveis</CardTitle>
          <Button type="button" variant="outline" size="sm" onClick={addResponsavel} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            Adicionar
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {form.responsaveis.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum responsável adicionado ainda.</p>
          ) : (
            form.responsaveis.map((responsavel, index) => (
              <div key={index} className="grid grid-cols-1 sm:grid-cols-4 gap-3 rounded-md border p-3">
                <Input
                  placeholder="Nome"
                  value={responsavel.nome}
                  onChange={(e) => updateResponsavel(index, { nome: e.target.value })}
                />
                <Input
                  placeholder="Cargo"
                  value={responsavel.cargo || ""}
                  onChange={(e) => updateResponsavel(index, { cargo: e.target.value })}
                />
                <Input
                  placeholder="Telefone"
                  value={responsavel.telefone || ""}
                  onChange={(e) => updateResponsavel(index, { telefone: e.target.value })}
                />
                <div className="flex gap-2">
                  <Input
                    placeholder="E-mail"
                    value={responsavel.email || ""}
                    onChange={(e) => updateResponsavel(index, { email: e.target.value })}
                  />
                  <Button type="button" variant="ghost" size="icon" className="shrink-0 text-destructive" onClick={() => removeResponsavel(index)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => router.back()} disabled={salvando}>
          Cancelar
        </Button>
        <Button onClick={handleSalvar} disabled={salvando}>
          {salvando && <Loader2 className="h-4 w-4 animate-spin" />}
          {salvando ? "Salvando..." : clienteId ? "Salvar alterações" : "Cadastrar cliente"}
        </Button>
      </div>
    </div>
  )
}
