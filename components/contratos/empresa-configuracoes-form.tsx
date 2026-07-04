"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
      const result = await atualizarMinhaEmpresa(form)
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
