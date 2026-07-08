"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Upload } from "lucide-react"
import { toast } from "sonner"
import { atualizarMinhaEmpresa, atualizarLogoMinhaEmpresa } from "@/app/actions/empresa-config"

interface EmpresaConfiguracoesFormProps {
  empresa: any
}

export function EmpresaConfiguracoesForm({ empresa }: EmpresaConfiguracoesFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [logoUrl, setLogoUrl] = useState(empresa.logo_url || "")
  const [form, setForm] = useState({
    razao_social: empresa.razao_social || "",
    nome_fantasia: empresa.nome_fantasia || "",
    cnpj: empresa.cnpj || "",
    email: empresa.email || "",
    telefone: empresa.telefone || "",
    endereco: empresa.endereco || "",
    representante_nome: empresa.representante_nome || "",
    representante_documento: empresa.representante_documento || "",
    representante_cargo: empresa.representante_cargo || "",
    rodape_contrato: empresa.rodape_contrato || "",
    endereco_cep: empresa.endereco_cep || "",
    endereco_logradouro: empresa.endereco_logradouro || "",
    endereco_numero: empresa.endereco_numero || "",
    endereco_complemento: empresa.endereco_complemento || "",
    endereco_bairro: empresa.endereco_bairro || "",
    endereco_cidade: empresa.endereco_cidade || "",
    endereco_uf: empresa.endereco_uf || "",
    codigo_servico_padrao: empresa.codigo_servico_padrao || "",
    discriminacao_servico_padrao: empresa.discriminacao_servico_padrao || "",
    aliquota_iss_padrao: empresa.aliquota_iss_padrao?.toString() || "",
    iss_retido_padrao: Boolean(empresa.iss_retido_padrao),
    link_emissao_manual: empresa.link_emissao_manual || "",
  })

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingLogo(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      const res = await fetch("/api/upload-logo-empresa", { method: "POST", body: formData })
      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || "Erro ao enviar logo")
        return
      }

      const result = await atualizarLogoMinhaEmpresa(data.url)
      if (result.success) {
        setLogoUrl(data.url)
        toast.success("Logo atualizada")
        router.refresh()
      } else {
        toast.error(result.error || "Erro ao salvar logo")
      }
    } catch (error) {
      toast.error("Erro ao enviar logo")
    } finally {
      setUploadingLogo(false)
      e.target.value = ""
    }
  }

  const handleSalvar = async () => {
    setLoading(true)
    try {
      const result = await atualizarMinhaEmpresa({
        ...form,
        aliquota_iss_padrao: form.aliquota_iss_padrao ? Number.parseFloat(form.aliquota_iss_padrao) : null,
      })
      if (result.success) {
        toast.success("Dados da empresa atualizados")
        router.refresh()
      } else {
        toast.error(result.error || "Erro ao atualizar")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Logo</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="Logo da empresa" className="h-14 w-14 object-contain rounded-md border" />
          ) : (
            <div className="h-14 w-14 rounded-md border flex items-center justify-center text-xs text-muted-foreground">
              Sem logo
            </div>
          )}
          <div>
            <Label htmlFor="logo-upload" className="inline-flex items-center gap-2 text-sm cursor-pointer rounded-md border px-3 py-2 hover:bg-accent">
              <Upload className="h-4 w-4" />
              {uploadingLogo ? "Enviando..." : "Enviar logo"}
            </Label>
            <input
              id="logo-upload"
              type="file"
              accept="image/png,image/jpeg,image/svg+xml"
              className="hidden"
              disabled={uploadingLogo}
              onChange={handleLogoUpload}
            />
            <p className="text-xs text-muted-foreground mt-2">PNG, JPG ou SVG · máximo 2MB. Aparece no timbre dos contratos.</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dados da contratante</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-x-4 gap-y-5 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="razao_social">Razão social</Label>
            <Input id="razao_social" value={form.razao_social} onChange={(e) => setForm({ ...form, razao_social: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nome_fantasia">Nome fantasia</Label>
            <Input id="nome_fantasia" value={form.nome_fantasia} onChange={(e) => setForm({ ...form, nome_fantasia: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cnpj">CNPJ</Label>
            <Input id="cnpj" value={form.cnpj} onChange={(e) => setForm({ ...form, cnpj: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="telefone">Telefone</Label>
            <Input id="telefone" value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="endereco">Endereço</Label>
            <Input id="endereco" value={form.endereco} onChange={(e) => setForm({ ...form, endereco: e.target.value })} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Endereço estruturado</CardTitle>
          <p className="text-xs text-muted-foreground">Usado na emissão de NFS-e — separado do campo "Endereço" acima</p>
        </CardHeader>
        <CardContent className="grid gap-x-4 gap-y-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="endereco_cep">CEP</Label>
            <Input
              id="endereco_cep"
              placeholder="00000-000"
              value={form.endereco_cep}
              onChange={(e) => setForm({ ...form, endereco_cep: e.target.value })}
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Configuração fiscal (NFS-e)</CardTitle>
          <p className="text-xs text-muted-foreground">
            Usado como padrão em toda emissão de nota fiscal de serviço pelo FluWork
          </p>
        </CardHeader>
        <CardContent className="grid gap-x-4 gap-y-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="codigo_servico_padrao">Código de serviço (LC 116)</Label>
            <Input
              id="codigo_servico_padrao"
              placeholder="Ex: 01.05"
              value={form.codigo_servico_padrao}
              onChange={(e) => setForm({ ...form, codigo_servico_padrao: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="aliquota_iss_padrao">Alíquota ISS (%)</Label>
            <Input
              id="aliquota_iss_padrao"
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={form.aliquota_iss_padrao}
              onChange={(e) => setForm({ ...form, aliquota_iss_padrao: e.target.value })}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="discriminacao_servico_padrao">Discriminação padrão do serviço</Label>
            <Textarea
              id="discriminacao_servico_padrao"
              placeholder="Ex: Prestação de serviços de consultoria técnica"
              rows={2}
              className="resize-none"
              value={form.discriminacao_servico_padrao}
              onChange={(e) => setForm({ ...form, discriminacao_servico_padrao: e.target.value })}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="link_emissao_manual">Link de emissão manual</Label>
            <Input
              id="link_emissao_manual"
              placeholder="https://..."
              value={form.link_emissao_manual}
              onChange={(e) => setForm({ ...form, link_emissao_manual: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Pra onde o botão "Emitir manualmente" leva o prestador, no lugar da emissão automática
            </p>
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3 sm:col-span-2">
            <div>
              <Label htmlFor="iss_retido_padrao">ISS retido na fonte</Label>
              <p className="text-xs text-muted-foreground">Se marcado, o ISS é retido pela empresa contratante</p>
            </div>
            <Switch
              id="iss_retido_padrao"
              checked={form.iss_retido_padrao}
              onCheckedChange={(checked) => setForm({ ...form, iss_retido_padrao: checked })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Representante legal</CardTitle>
          <p className="text-xs text-muted-foreground">Aparece na cláusula de identificação da contratante nos contratos</p>
        </CardHeader>
        <CardContent className="grid gap-x-4 gap-y-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="representante_nome">Nome</Label>
            <Input
              id="representante_nome"
              value={form.representante_nome}
              onChange={(e) => setForm({ ...form, representante_nome: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="representante_documento">CPF</Label>
            <Input
              id="representante_documento"
              value={form.representante_documento}
              onChange={(e) => setForm({ ...form, representante_documento: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="representante_cargo">Cargo</Label>
            <Input
              id="representante_cargo"
              placeholder="Ex: Sócio-administrador"
              value={form.representante_cargo}
              onChange={(e) => setForm({ ...form, representante_cargo: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Rodapé do contrato (opcional)</CardTitle>
          <p className="text-xs text-muted-foreground">
            Texto customizado que substitui o rodapé padrão no preview e no PDF gerado
          </p>
        </CardHeader>
        <CardContent>
          <Textarea
            value={form.rodape_contrato}
            onChange={(e) => setForm({ ...form, rodape_contrato: e.target.value })}
            rows={2}
            className="resize-none"
          />
        </CardContent>
      </Card>

      <Button onClick={handleSalvar} disabled={loading} className="w-full">
        {loading ? "Salvando..." : "Salvar alterações"}
      </Button>
    </div>
  )
}
