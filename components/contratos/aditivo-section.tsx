"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { FileEdit, Send, Ban, Plus } from "lucide-react"
import { toast } from "sonner"
import { criarAditivo, enviarAditivo, cancelarAditivo, type AditivoFormData } from "@/app/actions/contrato-aditivos"

interface Aditivo {
  id: string
  tipo: string
  versao: number
  descricao?: string | null
  status: string
  created_at: string
}

interface AditivoSectionProps {
  contractId: string
  contratoStatus: string
  aditivos: Aditivo[]
}

const TIPO_LABEL: Record<string, string> = {
  aditivo_salarial: "Aditivo Salarial",
  aditivo_clausulas: "Alteração de Cláusulas",
  renovacao: "Renovação Contratual",
  outro: "Aditivo Contratual",
}

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "success" | "warning" | "destructive" }> = {
  draft: { label: "Rascunho", variant: "secondary" },
  sent: { label: "Enviado", variant: "outline" },
  viewed: { label: "Visualizado", variant: "warning" },
  signed: { label: "Assinado", variant: "success" },
  refused: { label: "Recusado", variant: "destructive" },
  expired: { label: "Link expirado", variant: "destructive" },
  cancelled: { label: "Cancelado", variant: "outline" },
}

const CAMPOS_INICIAIS = {
  tipo: "aditivo_salarial" as AditivoFormData["tipo"],
  descricao: "",
  novo_valor: "",
  nova_data_termino: "",
  novas_clausulas: "",
}

export function AditivoSection({ contractId, contratoStatus, aditivos }: AditivoSectionProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [campos, setCampos] = useState(CAMPOS_INICIAIS)
  const [loading, setLoading] = useState(false)
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const handleCriar = async () => {
    setLoading(true)
    try {
      const result = await criarAditivo(contractId, {
        tipo: campos.tipo,
        descricao: campos.descricao || undefined,
        novo_valor: campos.novo_valor ? Number(campos.novo_valor) : undefined,
        nova_data_termino: campos.nova_data_termino || undefined,
        novas_clausulas: campos.novas_clausulas || undefined,
      })
      if (result.success) {
        toast.success("Aditivo criado como rascunho")
        setOpen(false)
        setCampos(CAMPOS_INICIAIS)
        router.refresh()
      } else {
        toast.error(result.error || "Erro ao criar aditivo")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleEnviar = async (id: string) => {
    setLoadingId(id)
    try {
      const result = await enviarAditivo(id)
      if (result.success) {
        toast.success("Aditivo enviado para assinatura")
        router.refresh()
      } else {
        toast.error(result.error || "Erro ao enviar aditivo")
      }
    } finally {
      setLoadingId(null)
    }
  }

  const handleCancelar = async (id: string) => {
    setLoadingId(id)
    try {
      const result = await cancelarAditivo(id)
      if (result.success) {
        toast.success("Aditivo cancelado")
        router.refresh()
      } else {
        toast.error(result.error || "Erro ao cancelar aditivo")
      }
    } finally {
      setLoadingId(null)
    }
  }

  if (contratoStatus !== "signed" && aditivos.length === 0) {
    return null
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Aditivos e renovações</p>
        {contratoStatus === "signed" && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="gap-2">
                <Plus className="h-4 w-4" />
                Novo aditivo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Novo aditivo</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select value={campos.tipo} onValueChange={(v) => setCampos({ ...campos, tipo: v as AditivoFormData["tipo"] })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="aditivo_salarial">Aditivo Salarial</SelectItem>
                      <SelectItem value="aditivo_clausulas">Alteração de Cláusulas</SelectItem>
                      <SelectItem value="renovacao">Renovação Contratual</SelectItem>
                      <SelectItem value="outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {campos.tipo === "aditivo_salarial" && (
                  <div className="space-y-2">
                    <Label htmlFor="novo_valor">Novo valor (R$)</Label>
                    <Input
                      id="novo_valor"
                      type="number"
                      step="0.01"
                      min="0"
                      value={campos.novo_valor}
                      onChange={(e) => setCampos({ ...campos, novo_valor: e.target.value })}
                    />
                  </div>
                )}

                {(campos.tipo === "renovacao" || campos.tipo === "aditivo_clausulas") && (
                  <div className="space-y-2">
                    <Label htmlFor="nova_data_termino">Nova data de término</Label>
                    <Input
                      id="nova_data_termino"
                      type="date"
                      value={campos.nova_data_termino}
                      onChange={(e) => setCampos({ ...campos, nova_data_termino: e.target.value })}
                    />
                  </div>
                )}

                {campos.tipo === "aditivo_clausulas" && (
                  <div className="space-y-2">
                    <Label htmlFor="novas_clausulas">Novas cláusulas</Label>
                    <Textarea
                      id="novas_clausulas"
                      rows={3}
                      className="resize-none"
                      value={campos.novas_clausulas}
                      onChange={(e) => setCampos({ ...campos, novas_clausulas: e.target.value })}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="descricao">Descrição (opcional)</Label>
                  <Textarea
                    id="descricao"
                    rows={2}
                    className="resize-none"
                    value={campos.descricao}
                    onChange={(e) => setCampos({ ...campos, descricao: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCriar} disabled={loading}>
                  {loading ? "Criando..." : "Criar aditivo"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {aditivos.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum aditivo criado ainda.</p>
      ) : (
        <div className="rounded-md border divide-y">
          {aditivos.map((aditivo) => {
            const statusConfig = STATUS_CONFIG[aditivo.status] || { label: aditivo.status, variant: "outline" as const }
            return (
              <div key={aditivo.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <FileEdit className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium">
                      Versão {aditivo.versao} · {TIPO_LABEL[aditivo.tipo] || aditivo.tipo}
                    </p>
                    {aditivo.descricao && <p className="text-xs text-muted-foreground truncate">{aditivo.descricao}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
                  {aditivo.status === "draft" && (
                    <Button size="sm" variant="outline" className="gap-1 h-8 text-xs" disabled={loadingId === aditivo.id} onClick={() => handleEnviar(aditivo.id)}>
                      <Send className="h-3.5 w-3.5" />
                      Enviar
                    </Button>
                  )}
                  {!["signed", "cancelled", "refused"].includes(aditivo.status) && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="gap-1 h-8 text-xs text-destructive hover:text-destructive"
                      disabled={loadingId === aditivo.id}
                      onClick={() => handleCancelar(aditivo.id)}
                    >
                      <Ban className="h-3.5 w-3.5" />
                      Cancelar
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
