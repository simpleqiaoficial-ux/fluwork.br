"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, FileText, AlertCircle } from "lucide-react"
import { uploadNotaFiscal, marcarNotaEmitida } from "@/app/actions/pedidos"
import { useRouter } from "next/navigation"
import { NotaAnexadaDialog } from "@/components/nota-anexada-dialog"

interface AnexarNotaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  pedidoId: string
  colaboradorId: string
  colaboradorNome?: string
  valorEsperado: number
  mesAnoEsperado: { mes: number; ano: number }
}

export function AnexarNotaDialog({
  open,
  onOpenChange,
  pedidoId,
  colaboradorId,
  colaboradorNome,
  valorEsperado,
  mesAnoEsperado,
}: AnexarNotaDialogProps) {
  const router = useRouter()
  const [arquivoPdf, setArquivoPdf] = useState<File | null>(null)
  const [arquivoPdfUrl, setArquivoPdfUrl] = useState<string | null>(null)
  const [uploadandoPdf, setUploadandoPdf] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState("")
  const [sucessoAberto, setSucessoAberto] = useState(false)
  const [enviadoEm, setEnviadoEm] = useState<Date | null>(null)

  const handleArquivoPdfSelecionado = async (file: File) => {
    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")
    if (!file || !isPdf) {
      setErro("Por favor, selecione um arquivo PDF válido")
      return
    }

    setErro("")
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
      setErro(`Erro ao processar PDF: ${error instanceof Error ? error.message : "Erro desconhecido"}`)
      setArquivoPdf(null)
    } finally {
      setUploadandoPdf(false)
    }
  }

  const handleAnexar = async () => {
    if (!arquivoPdf || !arquivoPdfUrl) {
      setErro("Por favor, envie o arquivo PDF da nota fiscal")
      return
    }

    setErro("")
    setSalvando(true)
    try {
      const result = await marcarNotaEmitida(pedidoId, arquivoPdfUrl)

      if (!result || (typeof result === "object" && "success" in result && !result.success)) {
        setErro(`Erro ao anexar nota: ${(result as any)?.error || "Erro desconhecido"}`)
        return
      }

      setEnviadoEm(new Date())
      onOpenChange(false)
      setSucessoAberto(true)
      router.refresh()
    } catch (error) {
      console.error("Erro ao anexar nota:", error)
      setErro(`Erro ao anexar nota fiscal: ${error instanceof Error ? error.message : "Erro desconhecido"}`)
    } finally {
      setSalvando(false)
    }
  }

  const handleSubstituir = () => {
    setSucessoAberto(false)
    setArquivoPdf(null)
    setArquivoPdfUrl(null)
    onOpenChange(true)
  }

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Anexar Nota Fiscal</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label>Arquivo PDF da Nota Fiscal *</Label>
            <label className="flex items-center gap-3 p-4 rounded-lg border border-dashed cursor-pointer hover:bg-muted/50 transition-colors">
              {uploadandoPdf ? (
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              ) : (
                <FileText className="w-5 h-5 text-muted-foreground" />
              )}
              <div className="flex-1">
                <p className="text-sm font-medium">
                  {uploadandoPdf
                    ? "Enviando PDF..."
                    : arquivoPdf
                      ? arquivoPdf.name
                      : "Clique para selecionar o arquivo PDF"}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Anexe o PDF da nota fiscal para enviar ao aprovador final
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

          <div className="divide-y border-t border-b">
            <div className="flex justify-between items-center py-2.5">
              <span className="text-xs text-muted-foreground">Competência</span>
              <span className="text-sm font-medium">
                {mesAnoEsperado.mes.toString().padStart(2, "0")}/{mesAnoEsperado.ano}
              </span>
            </div>
            <div className="flex justify-between items-center py-2.5">
              <span className="text-xs text-muted-foreground">Valor esperado</span>
              <span className="text-sm font-medium">R$ {valorEsperado.toFixed(2).replace(".", ",")}</span>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Certifique-se de que o PDF da nota fiscal contém todas as informações corretas antes de anexar. O
            aprovador final irá revisar a nota.
          </p>

          {erro && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{erro}</AlertDescription>
            </Alert>
          )}

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

    {arquivoPdf && arquivoPdfUrl && enviadoEm && (
      <NotaAnexadaDialog
        open={sucessoAberto}
        onOpenChange={setSucessoAberto}
        arquivo={{ nome: arquivoPdf.name, tipo: arquivoPdf.type || "application/pdf", tamanhoBytes: arquivoPdf.size, url: arquivoPdfUrl }}
        enviadoEm={enviadoEm}
        responsavelNome={colaboradorNome || "Você"}
        onSubstituir={handleSubstituir}
      />
    )}
    </>
  )
}
