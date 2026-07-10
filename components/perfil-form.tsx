"use client"

import type React from "react"
import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Loader2, Camera, Lock } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { atualizarMeuPerfil, uploadFotoPerfil } from "@/app/actions/perfil"
import { getPapelLabel } from "@/lib/papel-labels"
import { useMaskedCurrency } from "@/components/currency-display"

interface PerfilColaborador {
  nomeCompleto: string
  email: string
  dataNascimento: string | null
  cnpj: string | null
  razaoSocial: string | null
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

const TIPO_CHAVE_PIX_LABELS: Record<string, string> = {
  cpf: "CPF",
  cnpj: "CNPJ",
  email: "E-mail",
  telefone: "Telefone",
  aleatoria: "Chave Aleatória",
}

function formatarCnpj(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 14)
  return digits
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2")
}

function iniciais(nome: string) {
  const partes = nome.trim().split(/\s+/).filter(Boolean)
  return (partes[0]?.[0] || "").concat(partes.length > 1 ? partes[partes.length - 1][0] : "").toUpperCase()
}

function CampoSomenteLeitura({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground">{value || "—"}</p>
    </div>
  )
}

export function PerfilForm({ colaborador, tipoAcesso, salario, diaPagamento }: PerfilFormProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { formatValue } = useMaskedCurrency()

  const [form, setForm] = useState({
    nome_completo: colaborador.nomeCompleto,
    email: colaborador.email,
    data_nascimento: colaborador.dataNascimento || "",
  })

  const [fotoUrl, setFotoUrl] = useState(colaborador.fotoUrl)
  const [uploadingFoto, setUploadingFoto] = useState(false)
  const [salvando, setSalvando] = useState(false)

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

      <div className="flex justify-end">
        <Button onClick={handleSalvar} disabled={salvando}>
          {salvando && <Loader2 className="h-4 w-4 animate-spin" />}
          {salvando ? "Salvando..." : "Salvar alterações"}
        </Button>
      </div>

      <Card className="bg-muted/30 border-dashed">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Lock className="h-3.5 w-3.5 text-muted-foreground" />
            Definido pelo administrador
          </CardTitle>
          <CardDescription>
            Esses dados são de responsabilidade da empresa — fale com o administrador ou o financeiro pra alterá-los.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Perfil de acesso</p>
            <Badge variant="outline">{getPapelLabel(tipoAcesso)}</Badge>
          </div>
          <CampoSomenteLeitura label="Valor contratual" value={formatValue(salario)} />
          <CampoSomenteLeitura label="Dia de pagamento" value={`Dia ${diaPagamento}`} />
          <CampoSomenteLeitura label="CNPJ" value={colaborador.cnpj ? formatarCnpj(colaborador.cnpj) : ""} />
          <CampoSomenteLeitura label="Razão Social" value={colaborador.razaoSocial || ""} />
          <CampoSomenteLeitura
            label="Cidade/UF"
            value={[colaborador.enderecoCidade, colaborador.enderecoUf].filter(Boolean).join(" / ")}
          />
          <CampoSomenteLeitura
            label="Chave PIX"
            value={colaborador.chavePix ? `${colaborador.chavePix} (${TIPO_CHAVE_PIX_LABELS[colaborador.tipoChavePix || ""] || colaborador.tipoChavePix})` : ""}
          />
        </CardContent>
      </Card>
    </div>
  )
}
