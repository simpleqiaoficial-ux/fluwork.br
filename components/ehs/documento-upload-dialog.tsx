"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Loader2, FileUp } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"
import { uploadDocumentoEhs } from "@/app/actions/ehs-documentos"
import { CATEGORIA_LABELS } from "@/lib/ehs/documento-categorias"

interface TipoDocumentoOpcao {
  id: string
  nome: string
  categoria: string
}

interface DocumentoUploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  colaboradorId: string
  tipos: TipoDocumentoOpcao[]
  tipoDocumentoIdInicial?: string
}

export function DocumentoUploadDialog({ open, onOpenChange, colaboradorId, tipos, tipoDocumentoIdInicial }: DocumentoUploadDialogProps) {
  const router = useRouter()
  const [tipoDocumentoId, setTipoDocumentoId] = useState(tipoDocumentoIdInicial || "")
  const [dataEmissao, setDataEmissao] = useState("")
  const [dataValidade, setDataValidade] = useState("")
  const [observacoes, setObservacoes] = useState("")
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [enviando, setEnviando] = useState(false)

  const categorias = Array.from(new Set(tipos.map((t) => t.categoria)))

  const resetar = () => {
    setTipoDocumentoId(tipoDocumentoIdInicial || "")
    setDataEmissao("")
    setDataValidade("")
    setObservacoes("")
    setArquivo(null)
  }

  const handleEnviar = async () => {
    if (!tipoDocumentoId) {
      toast.error("Selecione o tipo de documento")
      return
    }
    if (!arquivo) {
      toast.error("Selecione um arquivo")
      return
    }
    setEnviando(true)
    try {
      const formData = new FormData()
      formData.append("colaborador_id", colaboradorId)
      formData.append("tipo_documento_id", tipoDocumentoId)
      if (dataEmissao) formData.append("data_emissao", dataEmissao)
      if (dataValidade) formData.append("data_validade", dataValidade)
      if (observacoes) formData.append("observacoes", observacoes)
      formData.append("file", arquivo)

      const result = await uploadDocumentoEhs(formData)
      if (!result.success) {
        toast.error(result.error || "Erro ao enviar documento")
        return
      }
      toast.success("Documento enviado")
      resetar()
      onOpenChange(false)
      router.refresh()
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Enviar documento</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Tipo de documento</Label>
            <Select value={tipoDocumentoId} onValueChange={setTipoDocumentoId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {categorias.map((categoria) => (
                  <SelectGroup key={categoria}>
                    <SelectLabel>{CATEGORIA_LABELS[categoria] || categoria}</SelectLabel>
                    {tipos
                      .filter((t) => t.categoria === categoria)
                      .map((tipo) => (
                        <SelectItem key={tipo.id} value={tipo.id}>
                          {tipo.nome}
                        </SelectItem>
                      ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="documento-emissao">Data de emissão</Label>
              <Input id="documento-emissao" type="date" value={dataEmissao} onChange={(e) => setDataEmissao(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="documento-validade">Válido até</Label>
              <Input id="documento-validade" type="date" value={dataValidade} onChange={(e) => setDataValidade(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Arquivo</Label>
            <label className="flex items-center gap-3 p-4 rounded-lg border border-dashed cursor-pointer hover:bg-muted/50 transition-colors">
              <FileUp className="w-5 h-5 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{arquivo ? arquivo.name : "Clique para selecionar o arquivo"}</p>
                <p className="text-xs text-muted-foreground mt-0.5">PDF, JPG ou PNG · máximo 10MB</p>
              </div>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) setArquivo(file)
                  e.target.value = ""
                }}
              />
            </label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="documento-observacoes">Observações</Label>
            <Textarea id="documento-observacoes" rows={2} value={observacoes} onChange={(e) => setObservacoes(e.target.value)} />
          </div>

          <Button onClick={handleEnviar} disabled={enviando} className="w-full">
            {enviando && <Loader2 className="h-4 w-4 animate-spin" />}
            {enviando ? "Enviando..." : "Enviar documento"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
