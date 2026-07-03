"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Upload, FileText, X, Loader2 } from "lucide-react"
import { updateFatura, updateFaturaPdf, getFaturaById } from "@/app/actions/faturas"
import { useToast } from "@/hooks/use-toast"
import type { Fatura } from "@/types/fatura"

interface ColaboradorSimples {
  id: string
  nome: string
  email: string
}

interface EditarFaturaDialogProps {
  fatura: Fatura
  colaboradores: ColaboradorSimples[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onFaturaUpdated: (fatura: Fatura) => void
}

export function EditarFaturaDialog({ 
  fatura, 
  colaboradores, 
  open, 
  onOpenChange,
  onFaturaUpdated 
}: EditarFaturaDialogProps) {
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [selectedColaboradores, setSelectedColaboradores] = useState<string[]>([])
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    titulo: "",
    descricao: "",
    valor: "",
    data_vencimento: "",
  })

  useEffect(() => {
    if (fatura) {
      setFormData({
        titulo: fatura.titulo,
        descricao: fatura.descricao || "",
        valor: fatura.valor.toString(),
        data_vencimento: fatura.data_vencimento,
      })
      setSelectedColaboradores(
        fatura.colaboradores_permitidos?.map(c => c.colaborador_id) || []
      )
    }
  }, [fatura])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.type !== "application/pdf") {
        toast({ title: "Apenas arquivos PDF são permitidos", variant: "destructive" })
        return
      }
      if (file.size > 10 * 1024 * 1024) {
        toast({ title: "Arquivo muito grande. Máximo 10MB", variant: "destructive" })
        return
      }
      setPdfFile(file)
    }
  }

  const toggleColaborador = (id: string) => {
    setSelectedColaboradores(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    )
  }

  const selectAll = () => {
    if (selectedColaboradores.length === colaboradores.length) {
      setSelectedColaboradores([])
    } else {
      setSelectedColaboradores(colaboradores.map(c => c.id))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (selectedColaboradores.length === 0) {
      toast({ title: "Selecione pelo menos um colaborador", variant: "destructive" })
      return
    }

    setLoading(true)

    try {
      // Upload do novo PDF se houver
      let pdfUrl = fatura.arquivo_pdf_url
      if (pdfFile) {
        setUploading(true)
        const uploadFormData = new FormData()
        uploadFormData.append("file", pdfFile)

        let uploadRes: Response
        try {
          uploadRes = await fetch("/api/upload-fatura", {
            method: "POST",
            body: uploadFormData,
          })
        } catch (fetchError) {
          throw new Error("Falha na conexão ao enviar PDF. Verifique sua internet e tente novamente.")
        }

        const uploadData = await uploadRes.json()

        if (!uploadRes.ok) {
          throw new Error(uploadData.error || `Erro no upload do PDF (status ${uploadRes.status})`)
        }

        if (!uploadData.url) {
          throw new Error("Servidor não retornou URL do arquivo. Tente novamente.")
        }

        pdfUrl = uploadData.url
        setUploading(false)

        // Atualizar URL do PDF
        await updateFaturaPdf(fatura.id, pdfUrl)
      }

      // Atualizar fatura
      const result = await updateFatura(fatura.id, {
        titulo: formData.titulo,
        descricao: formData.descricao || undefined,
        valor: parseFloat(formData.valor),
        data_vencimento: formData.data_vencimento,
        colaboradores_ids: selectedColaboradores,
      })

      if (result.success) {
        // Buscar fatura atualizada
        const faturaAtualizada = await getFaturaById(fatura.id)
        if (faturaAtualizada) {
          onFaturaUpdated(faturaAtualizada)
        }
        
        toast({ title: "Fatura atualizada com sucesso" })
        onOpenChange(false)
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      toast({ 
        title: "Erro ao atualizar fatura", 
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive" 
      })
    } finally {
      setLoading(false)
      setUploading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Editar Fatura</DialogTitle>
          <DialogDescription>
            Atualize as informações da fatura e os colaboradores com acesso.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-4 pb-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="edit-titulo">Título *</Label>
                  <Input
                    id="edit-titulo"
                    value={formData.titulo}
                    onChange={(e) => setFormData(prev => ({ ...prev, titulo: e.target.value }))}
                    placeholder="Ex: Fatura Março 2024"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-valor">Valor (R$) *</Label>
                  <Input
                    id="edit-valor"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.valor}
                    onChange={(e) => setFormData(prev => ({ ...prev, valor: e.target.value }))}
                    placeholder="0,00"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-data_vencimento">Data de Vencimento *</Label>
                <Input
                  id="edit-data_vencimento"
                  type="date"
                  value={formData.data_vencimento}
                  onChange={(e) => setFormData(prev => ({ ...prev, data_vencimento: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-descricao">Descrição</Label>
                <Textarea
                  id="edit-descricao"
                  value={formData.descricao}
                  onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                  placeholder="Descrição opcional da fatura..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>PDF da Fatura</Label>
                {fatura.arquivo_pdf_url && !pdfFile && (
                  <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/50 mb-2">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">PDF atual</p>
                      <a 
                        href={fatura.arquivo_pdf_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline"
                      >
                        Visualizar PDF
                      </a>
                    </div>
                  </div>
                )}
                
                {!pdfFile ? (
                  <div className="border-2 border-dashed rounded-lg p-6 text-center">
                    <Input
                      type="file"
                      accept="application/pdf"
                      onChange={handleFileChange}
                      className="hidden"
                      id="edit-pdf-upload"
                    />
                    <label
                      htmlFor="edit-pdf-upload"
                      className="cursor-pointer flex flex-col items-center gap-2"
                    >
                      <Upload className="h-8 w-8 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Clique para substituir o PDF
                      </span>
                      <span className="text-xs text-muted-foreground">Máximo 10MB</span>
                    </label>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/50">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{pdfFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(pdfFile.size / 1024 / 1024).toFixed(2)} MB (novo)
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setPdfFile(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Colaboradores que podem visualizar *</Label>
                  <Button type="button" variant="link" size="sm" onClick={selectAll}>
                    {selectedColaboradores.length === colaboradores.length ? "Desmarcar todos" : "Selecionar todos"}
                  </Button>
                </div>
                <div className="border rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
                  {colaboradores.map((colaborador) => (
                    <div key={colaborador.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`edit-colab-${colaborador.id}`}
                        checked={selectedColaboradores.includes(colaborador.id)}
                        onCheckedChange={() => toggleColaborador(colaborador.id)}
                      />
                      <label
                        htmlFor={`edit-colab-${colaborador.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {colaborador.nome}
                      </label>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  {selectedColaboradores.length} colaborador{selectedColaboradores.length !== 1 ? "es" : ""} selecionado{selectedColaboradores.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
          </ScrollArea>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {uploading ? "Enviando PDF..." : loading ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
