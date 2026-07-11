"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Loader2, FileUp } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { criarCarteirinhaEhs } from "@/app/actions/ehs-carteirinhas"

interface PrestadorOpcao {
  id: string
  nome_completo: string
}

interface CarteirinhaUploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  clienteId: string
  prestadores: PrestadorOpcao[]
  colaboradorIdInicial?: string
}

export function CarteirinhaUploadDialog({ open, onOpenChange, clienteId, prestadores, colaboradorIdInicial }: CarteirinhaUploadDialogProps) {
  const router = useRouter()
  const [colaboradorId, setColaboradorId] = useState(colaboradorIdInicial || "")
  const [titulo, setTitulo] = useState("")
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [enviando, setEnviando] = useState(false)

  const resetar = () => {
    setColaboradorId(colaboradorIdInicial || "")
    setTitulo("")
    setArquivo(null)
  }

  const handleEnviar = async () => {
    if (!colaboradorId) {
      toast.error("Selecione o prestador")
      return
    }
    if (!arquivo) {
      toast.error("Selecione o arquivo da carteirinha")
      return
    }
    setEnviando(true)
    try {
      const formData = new FormData()
      formData.append("cliente_id", clienteId)
      formData.append("colaborador_id", colaboradorId)
      if (titulo) formData.append("titulo", titulo)
      formData.append("file", arquivo)

      const result = await criarCarteirinhaEhs(formData)
      if (!result.success) {
        toast.error(result.error || "Erro ao criar carteirinha")
        return
      }
      toast.success("Carteirinha emitida")
      resetar()
      onOpenChange(false)
      router.refresh()
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nova carteirinha digital</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Prestador</Label>
            <Select value={colaboradorId} onValueChange={setColaboradorId} disabled={!!colaboradorIdInicial}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o prestador" />
              </SelectTrigger>
              <SelectContent>
                {prestadores.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.nome_completo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="carteirinha-titulo">Título (opcional)</Label>
            <Input id="carteirinha-titulo" placeholder="Ex: Crachá de acesso 2026" value={titulo} onChange={(e) => setTitulo(e.target.value)} />
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

          <Button onClick={handleEnviar} disabled={enviando} className="w-full">
            {enviando && <Loader2 className="h-4 w-4 animate-spin" />}
            {enviando ? "Enviando..." : "Emitir carteirinha"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
