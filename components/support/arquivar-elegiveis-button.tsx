"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Archive, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { arquivarTicketsElegiveis } from "@/app/actions/support-tickets"

/** Gatilho manual de retenção — Fase 1 não tem scheduler ainda (mesma decisão já tomada pro
 *  módulo EHS), então o SuperAdmin dispara isso na mão até a plataforma decidir introduzir
 *  Cloud Scheduler. Quando isso acontecer, este botão vira o job automático sem mudar a lógica. */
export function ArquivarElegiveisButton() {
  const router = useRouter()
  const [carregando, setCarregando] = useState(false)

  const handleClick = async () => {
    setCarregando(true)
    try {
      const result = await arquivarTicketsElegiveis()
      if (!result.success) {
        toast.error("Erro ao arquivar chamados elegíveis")
        return
      }
      toast.success(result.arquivados === 0 ? "Nenhum chamado elegível para arquivar" : `${result.arquivados} chamado(s) arquivado(s)`)
      router.refresh()
    } finally {
      setCarregando(false)
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleClick} disabled={carregando} className="gap-1.5">
      {carregando ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Archive className="h-3.5 w-3.5" />}
      Arquivar elegíveis
    </Button>
  )
}
