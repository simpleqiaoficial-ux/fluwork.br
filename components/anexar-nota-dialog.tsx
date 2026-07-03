"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Loader2, FileText } from "lucide-react"
import { uploadNotaFiscal, marcarNotaEmitida } from "@/app/actions/pedidos"
import { useRouter } from "next/navigation"

interface AnexarNotaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  pedidoId: string
  colaboradorId: string
  valorEsperado: number
  mesAnoEsperado: { mes: number; ano: number }
}

export function AnexarNotaDialog({
  open,
  onOpenChange,
  pedidoId,
  colaboradorId,
  valorEsperado,
  mesAnoEsperado,
}: AnexarNotaDialogProps) {
  const router = useRouter()
  const [arquivoPdf, setArquivoPdf] = useState<File | null>(null)
  const [arquivoPdfUrl, setArquivoPdfUrl] = useState<string | null>(null)
  const [uploadandoPdf, setUploadandoPdf] = useState(false)
  const [salvando, setSalvando] = useState(false)

  const handleArquivoPdfSelecionado = async (file: File) => {
    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")
    if (!file || !isPdf) {
      alert("Por favor, selecione um arquivo PDF válido")
      return
    }

    setArquivoPdf(file)
    setUploadandoPdf(true)

    try {
      const formData = new FormData()
      formData.append("file", file)
      const uploadResult = await uploadNotaFiscal(formData)

      if (!uploadResult.success || !uploadResult.url) {
        throw new Error(uploadResult.error || "Erro ao fazer upload do PDF")
      }

      setArquivoPdfUrl(uploadResult.url)
    } catch (error) {
      console.error("Erro ao processar PDF:", error)
      alert(`Erro ao processar PDF: ${error instanceof Error ? error.message : "Erro desconhecido"}`)
      setArquivoPdf(null)
    } finally {
      setUploadandoPdf(false)
    }
  }

  const handleAnexar = async () => {
    if (!arquivoPdf || !arquivoPdfUrl) {
      alert("Por favor, envie o arquivo PDF da nota fiscal")
      return
    }

    setSalvando(true)
    try {
      const result = await marcarNotaEmitida(pedidoId, arquivoPdfUrl)

      if (!result || (typeof result === "object" && "success" in result && !result.success)) {
        alert(`Erro ao anexar nota: ${(result as any)?.error || "Erro desconhecido"}`)
        return
      }

      alert("Nota fiscal anexada com sucesso! O financeiro foi notificado.")
      onOpenChange(false)
      router.refresh()
    } catch (error) {
      console.error("Erro ao anexar nota:", error)
      alert(`Erro ao anexar nota fiscal: ${error instanceof Error ? error.message : "Erro desconhecido"}`)
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Anexar Nota Fiscal</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Arquivo PDF da Nota Fiscal *</Label>
            <label className="flex items-center gap-2 p-4 mt-2 rounded-lg border-2 border-dashed cursor-pointer hover:bg-muted/50 transition-colors">
              {uploadandoPdf ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileText className="w-5 h-5" />}
              <div className="flex-1">
                <p className="text-sm font-medium">
                  {uploadandoPdf
                    ? "Enviando PDF..."
                    : arquivoPdf
                      ? `${arquivoPdf.name} ✓`
                      : "Clique para selecionar o arquivo PDF"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Anexe o PDF da nota fiscal para enviar ao financeiro
                </p>
              </div>
              <input
                type="file"
                accept=".pdf,application/pdf"
                className="hidden"
                disabled={uploadandoPdf}
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleArquivoPdfSelecionado(file)
                  // Limpar o input para permitir selecionar o mesmo arquivo novamente
                  e.target.value = ""
                }}
              />
            </label>
          </div>

          <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
            <p className="text-sm font-medium text-blue-900 mb-2">Informações do Pedido:</p>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>
                • Competência: {mesAnoEsperado.mes.toString().padStart(2, "0")}/{mesAnoEsperado.ano}
              </li>
              <li>• Valor: R$ {valorEsperado.toFixed(2).replace(".", ",")}</li>
            </ul>
          </div>

          <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
            <p className="text-sm text-amber-900">
              ⚠️ Certifique-se de que o PDF da nota fiscal contém todas as informações corretas antes de anexar. O
              financeiro irá revisar a nota.
            </p>
          </div>

          <Button onClick={handleAnexar} disabled={!arquivoPdf || !arquivoPdfUrl || salvando} className="w-full">
            {salvando ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              "Enviar Nota Fiscal"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
