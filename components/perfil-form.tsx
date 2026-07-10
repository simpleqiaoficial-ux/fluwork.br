"use client"

import type React from "react"
import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Loader2, CheckCircle2, AlertTriangle, Camera } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { atualizarMeuPerfil, uploadFotoPerfil } from "@/app/actions/perfil"
import { consultarCnpj } from "@/app/actions/cnpj"
import { getPapelLabel } from "@/lib/papel-labels"
import { useMaskedCurrency } from "@/components/currency-display"

interface PerfilColaborador {
  nomeCompleto: string
  email: string
  dataNascimento: string | null
  cnpj: string | null
  razaoSocial: string | null
  dataAbertura: string | null
  enderecoCep: string | null
  enderecoLogradouro: string | null
  enderecoNumero: string | null
  enderecoComplemento: string | null
  enderecoBairro: string | null
  enderecoCidade: string | null
  enderecoUf: string | null
  chavePix: string | null
  tipoChavePix: string | null
  fotoUrl: string | null
}

interface PerfilFormProps {
  colaborador: PerfilColaborador
  tipoAcesso: string
  salario: number
  diaPagamento: number
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

function iniciais(nome: string) {
  const partes = nome.trim().split(/\s+/).filter(Boolean)
  return (partes[0]?.[0] || "").concat(partes.length > 1 ? partes[partes.length - 1][0] : "").toUpperCase()
}

export function PerfilForm({ colaborador, tipoAcesso, salario, diaPagamento }: PerfilFormProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { formatValue } = useMaskedCurrency()

  const [form, setForm] = useState({
    nome_completo: colaborador.nomeCompleto,
    email: colaborador.email,
    data_nascimento: colaborador.dataNascimento || "",
    cnpj: colaborador.cnpj ? formatarCnpj(colaborador.cnpj) : "",
    razao_social: colaborador.razaoSocial || "",
    data_abertura: colaborador.dataAbertura || "",
    endereco_cep: colaborador.enderecoCep ? formatarCep(colaborador.enderecoCep) : "",
    endereco_logradouro: colaborador.enderecoLogradouro || "",
    endereco_numero: colaborador.enderecoNumero || "",
    endereco_complemento: colaborador.enderecoComplemento || "",
    endereco_bairro: colaborador.enderecoBairro || "",
    endereco_cidade: colaborador.enderecoCidade || "",
    endereco_uf: colaborador.enderecoUf || "",
    chave_pix: colaborador.chavePix || "",
    tipo_chave_pix: colaborador.tipoChavePix || "",
  })

  const [fotoUrl, setFotoUrl] = useState(colaborador.fotoUrl)
  const [uploadingFoto, setUploadingFoto] = useState(false)
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

  const handleFotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingFoto(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      const result = await uploadFotoPerfil(formData)
      if (!result.success) {
        toast.error(result.error || "Erro ao enviar a imagem")
        return
      }
      setFotoUrl(result.url)
      toast.success("Foto de perfil atualizada")
      router.refresh()
    } finally {
      setUploadingFoto(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const handleSalvar = async () => {
    if (!form.nome_completo.trim()) {
      toast.error("O nome não pode ficar vazio")
      return
    }
    setSalvando(true)
    try {
      const result = await atualizarMeuPerfil({
        nome_completo: form.nome_completo,
        email: form.email,
        data_nascimento: form.data_nascimento || null,
        cnpj: form.cnpj.replace(/\D/g, "") || null,
        razao_social: form.razao_social || null,
        data_abertura: form.data_abertura || null,
        endereco_cep: form.endereco_cep.replace(/\D/g, "") || null,
        endereco_logradouro: form.endereco_logradouro || null,
        endereco_numero: form.endereco_numero || null,
        endereco_complemento: form.endereco_complemento || null,
        endereco_bairro: form.endereco_bairro || null,
        endereco_cidade: form.endereco_cidade || null,
        endereco_uf: form.endereco_uf || null,
        chave_pix: form.chave_pix || null,
        tipo_chave_pix: form.tipo_chave_pix || null,
      })
      if (!result.success) {
        toast.error(result.error || "Erro ao salvar")
        return
      }
      toast.success("Perfil atualizado com sucesso")
      router.refresh()
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6 flex items-center gap-4">
          {fotoUrl ? (
            <img src={fotoUrl} alt="" className="h-16 w-16 rounded-md object-cover shrink-0" />
          ) : (
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-md bg-primary/10 text-lg font-semibold text-primary">
              {iniciais(form.nome_completo)}
            </div>
          )}
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">Foto de perfil</p>
            <p className="text-xs text-muted-foreground mt-0.5">JPG, PNG ou WEBP. Máximo 5MB.</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFotoChange}
          />
          <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploadingFoto}>
            {uploadingFoto ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
            {uploadingFoto ? "Enviando..." : "Alterar foto"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dados pessoais</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="nome_completo">Nome completo</Label>
            <Input
              id="nome_completo"
              value={form.nome_completo}
              onChange={(e) => setForm({ ...form, nome_completo: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="data_nascimento">Data de nascimento</Label>
            <Input
              id="data_nascimento"
              type="date"
              value={form.data_nascimento}
              onChange={(e) => setForm({ ...form, data_nascimento: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dados do CNPJ</CardTitle>
          <CardDescription>Preenchidos automaticamente ao informar o CNPJ — revise antes de salvar.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="cnpj">CNPJ</Label>
            <div className="relative">
              <Input
                id="cnpj"
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
            <Label htmlFor="razao_social">Razão Social</Label>
            <Input
              id="razao_social"
              value={form.razao_social}
              onChange={(e) => setForm({ ...form, razao_social: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="data_abertura">Data de abertura</Label>
            <Input
              id="data_abertura"
              type="date"
              value={form.data_abertura}
              onChange={(e) => setForm({ ...form, data_abertura: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endereco_cep">CEP</Label>
            <Input
              id="endereco_cep"
              value={form.endereco_cep}
              onChange={(e) => setForm({ ...form, endereco_cep: formatarCep(e.target.value) })}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="endereco_logradouro">Logradouro</Label>
            <Input
              id="endereco_logradouro"
              value={form.endereco_logradouro}
              onChange={(e) => setForm({ ...form, endereco_logradouro: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endereco_numero">Número</Label>
            <Input
              id="endereco_numero"
              value={form.endereco_numero}
              onChange={(e) => setForm({ ...form, endereco_numero: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endereco_complemento">Complemento</Label>
            <Input
              id="endereco_complemento"
              value={form.endereco_complemento}
              onChange={(e) => setForm({ ...form, endereco_complemento: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endereco_bairro">Bairro</Label>
            <Input
              id="endereco_bairro"
              value={form.endereco_bairro}
              onChange={(e) => setForm({ ...form, endereco_bairro: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endereco_cidade">Cidade</Label>
            <Input
              id="endereco_cidade"
              value={form.endereco_cidade}
              onChange={(e) => setForm({ ...form, endereco_cidade: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endereco_uf">UF</Label>
            <Input
              id="endereco_uf"
              maxLength={2}
              value={form.endereco_uf}
              onChange={(e) => setForm({ ...form, endereco_uf: e.target.value.toUpperCase() })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dados de pagamento</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="tipo_chave_pix">Tipo de chave PIX</Label>
            <Select
              value={form.tipo_chave_pix || "none"}
              onValueChange={(value) => setForm({ ...form, tipo_chave_pix: value === "none" ? "" : value })}
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
          {form.tipo_chave_pix && (
            <div className="space-y-2">
              <Label htmlFor="chave_pix">Chave PIX</Label>
              <Input
                id="chave_pix"
                value={form.chave_pix}
                onChange={(e) => setForm({ ...form, chave_pix: e.target.value })}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-muted/30 border-dashed">
        <CardContent className="p-5 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Perfil de acesso</p>
            <Badge variant="outline">{getPapelLabel(tipoAcesso)}</Badge>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Valor contratual</p>
            <p className="font-medium tabular-nums">{formatValue(salario)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Dia de pagamento</p>
            <p className="font-medium">Dia {diaPagamento}</p>
          </div>
          <p className="text-xs text-muted-foreground w-full">
            Esses dados são definidos pelo administrador da empresa.
          </p>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSalvar} disabled={salvando}>
          {salvando && <Loader2 className="h-4 w-4 animate-spin" />}
          {salvando ? "Salvando..." : "Salvar alterações"}
        </Button>
      </div>
    </div>
  )
}
