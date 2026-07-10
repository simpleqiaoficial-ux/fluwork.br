"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { CheckCircle2, Loader2, XCircle, CalendarClock, Ban, FileCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  confirmarIntegracaoEhs,
  marcarCompareceuIntegracaoEhs,
  marcarNaoCompareceuIntegracaoEhs,
  reagendarIntegracaoEhs,
  concluirIntegracaoEhs,
  cancelarIntegracaoEhs,
} from "@/app/actions/ehs-integracoes"
import { TRANSICOES_STATUS_INTEGRACAO } from "@/lib/ehs/integracoes"

type DialogAberto = "reagendar" | "concluir" | "cancelar" | null

export function IntegracaoStatusActions({ integracaoId, status }: { integracaoId: string; status: string }) {
  const router = useRouter()
  const [carregando, setCarregando] = useState<string | null>(null)
  const [dialogAberto, setDialogAberto] = useState<DialogAberto>(null)
  const [novaData, setNovaData] = useState("")
  const [novoHorario, setNovoHorario] = useState("")
  const [dataValidade, setDataValidade] = useState("")
  const [motivo, setMotivo] = useState("")

  const transicoes = TRANSICOES_STATUS_INTEGRACAO[status] || []

  const executar = async (acao: string, fn: () => Promise<{ success: boolean; error?: string }>) => {
    setCarregando(acao)
    try {
      const result = await fn()
      if (!result.success) {
        toast.error(result.error || "Erro ao atualizar integração")
        return
      }
      toast.success("Integração atualizada")
      setDialogAberto(null)
      router.refresh()
    } finally {
      setCarregando(null)
    }
  }

  if (transicoes.length === 0) return null

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {transicoes.includes("confirmado") && (
          <Button size="sm" className="gap-1.5" disabled={!!carregando} onClick={() => executar("confirmado", () => confirmarIntegracaoEhs(integracaoId))}>
            {carregando === "confirmado" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
            Confirmar
          </Button>
        )}
        {transicoes.includes("compareceu") && (
          <Button size="sm" variant="outline" className="gap-1.5" disabled={!!carregando} onClick={() => executar("compareceu", () => marcarCompareceuIntegracaoEhs(integracaoId))}>
            {carregando === "compareceu" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
            Marcar presença
          </Button>
        )}
        {transicoes.includes("nao_compareceu") && (
          <Button size="sm" variant="outline" className="gap-1.5 text-destructive" disabled={!!carregando} onClick={() => executar("nao_compareceu", () => marcarNaoCompareceuIntegracaoEhs(integracaoId))}>
            {carregando === "nao_compareceu" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
            Não compareceu
          </Button>
        )}
        {transicoes.includes("reagendado") && (
          <Button size="sm" variant="outline" className="gap-1.5" disabled={!!carregando} onClick={() => setDialogAberto("reagendar")}>
            <CalendarClock className="h-3.5 w-3.5" />
            Reagendar
          </Button>
        )}
        {transicoes.includes("concluido") && (
          <Button size="sm" className="gap-1.5" disabled={!!carregando} onClick={() => setDialogAberto("concluir")}>
            <FileCheck className="h-3.5 w-3.5" />
            Concluir
          </Button>
        )}
        {transicoes.includes("cancelado") && (
          <Button size="sm" variant="ghost" className="gap-1.5 text-destructive" disabled={!!carregando} onClick={() => setDialogAberto("cancelar")}>
            <Ban className="h-3.5 w-3.5" />
            Cancelar
          </Button>
        )}
      </div>

      <Dialog open={dialogAberto === "reagendar"} onOpenChange={(open) => !open && setDialogAberto(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Reagendar integração</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reagendar-data">Nova data</Label>
              <Input id="reagendar-data" type="date" value={novaData} onChange={(e) => setNovaData(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reagendar-horario">Novo horário</Label>
              <Input id="reagendar-horario" type="time" value={novoHorario} onChange={(e) => setNovoHorario(e.target.value)} />
            </div>
            <Button
              className="w-full"
              disabled={!novaData || !!carregando}
              onClick={() => executar("reagendado", () => reagendarIntegracaoEhs(integracaoId, novaData, novoHorario || null))}
            >
              {carregando === "reagendado" && <Loader2 className="h-4 w-4 animate-spin" />}
              Confirmar novo agendamento
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogAberto === "concluir"} onOpenChange={(open) => !open && setDialogAberto(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Concluir integração</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="concluir-validade">Válido até</Label>
              <Input id="concluir-validade" type="date" value={dataValidade} onChange={(e) => setDataValidade(e.target.value)} />
            </div>
            <Button className="w-full" disabled={!dataValidade || !!carregando} onClick={() => executar("concluido", () => concluirIntegracaoEhs(integracaoId, dataValidade))}>
              {carregando === "concluido" && <Loader2 className="h-4 w-4 animate-spin" />}
              Concluir
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogAberto === "cancelar"} onOpenChange={(open) => !open && setDialogAberto(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Cancelar integração</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea placeholder="Motivo do cancelamento (opcional)" value={motivo} onChange={(e) => setMotivo(e.target.value)} rows={3} />
            <Button variant="destructive" className="w-full" disabled={!!carregando} onClick={() => executar("cancelado", () => cancelarIntegracaoEhs(integracaoId, motivo))}>
              {carregando === "cancelado" && <Loader2 className="h-4 w-4 animate-spin" />}
              Confirmar cancelamento
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
