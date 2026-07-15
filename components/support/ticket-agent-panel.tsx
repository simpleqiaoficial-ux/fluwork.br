"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { atualizarStatusTicket, assumirTicket, escalarTicket, devolverTicket } from "@/app/actions/support-tickets"
import { CHAMADO_STATUS_CONFIG } from "@/lib/status-config"

interface TicketAgentPanelProps {
  ticket: {
    id: string
    status: string
    nivel_suporte: string
    assumido_por?: { id: string; nome_completo: string } | null
  }
  ehSuperAdmin: boolean
}

export function TicketAgentPanel({ ticket, ehSuperAdmin }: TicketAgentPanelProps) {
  const router = useRouter()
  const [carregando, setCarregando] = useState(false)
  const [motivo, setMotivo] = useState("")

  const executar = async (fn: () => Promise<{ success: boolean; error?: string }>) => {
    setCarregando(true)
    try {
      const result = await fn()
      if (!result.success) {
        toast.error(result.error || "Erro ao executar ação")
        return
      }
      setMotivo("")
      toast.success("Feito")
      router.refresh()
    } finally {
      setCarregando(false)
    }
  }

  const handleEscalar = () => {
    if (!motivo.trim()) {
      toast.error("Informe o motivo do escalonamento")
      return
    }
    executar(() => escalarTicket(ticket.id, motivo))
  }

  const handleDevolver = () => {
    if (!motivo.trim()) {
      toast.error("Informe a justificativa")
      return
    }
    executar(() => devolverTicket(ticket.id, motivo))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Atendimento</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Status</p>
          <Select value={ticket.status} onValueChange={(v) => executar(() => atualizarStatusTicket(ticket.id, v))} disabled={carregando}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(CHAMADO_STATUS_CONFIG).map(([valor, cfg]) => (
                <SelectItem key={valor} value={valor}>
                  {cfg.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Responsável</p>
          <p className="text-sm">{ticket.assumido_por?.nome_completo || "Ninguém ainda"}</p>
          <Button size="sm" variant="outline" onClick={() => executar(() => assumirTicket(ticket.id))} disabled={carregando} className="gap-1.5">
            {carregando && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Assumir chamado
          </Button>
        </div>

        {!ehSuperAdmin && ticket.nivel_suporte === "nivel_1" && (
          <div className="space-y-2 border-t pt-4">
            <p className="text-xs text-muted-foreground">Escalar para o time FluWork (Nível 2)</p>
            <Textarea placeholder="Motivo do escalonamento" rows={2} value={motivo} onChange={(e) => setMotivo(e.target.value)} />
            <Button size="sm" variant="outline" onClick={handleEscalar} disabled={carregando} className="gap-1.5">
              {carregando && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Escalar chamado
            </Button>
          </div>
        )}

        {ehSuperAdmin && ticket.nivel_suporte === "nivel_2" && (
          <div className="space-y-2 border-t pt-4">
            <p className="text-xs text-muted-foreground">Devolver para a empresa (Nível 1)</p>
            <Textarea placeholder="Justificativa" rows={2} value={motivo} onChange={(e) => setMotivo(e.target.value)} />
            <Button size="sm" variant="outline" onClick={handleDevolver} disabled={carregando} className="gap-1.5">
              {carregando && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Devolver chamado
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
