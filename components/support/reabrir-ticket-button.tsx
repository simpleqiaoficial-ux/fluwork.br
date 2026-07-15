"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Loader2, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { reabrirTicket } from "@/app/actions/support-tickets"

export function ReabrirTicketButton({ ticketId }: { ticketId: string }) {
  const router = useRouter()
  const [carregando, setCarregando] = useState(false)

  const handleReabrir = async () => {
    setCarregando(true)
    try {
      const result = await reabrirTicket(ticketId)
      if (!result.success) {
        toast.error(result.error || "Erro ao reabrir chamado")
        return
      }
      toast.success("Chamado reaberto")
      router.refresh()
    } finally {
      setCarregando(false)
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleReabrir} disabled={carregando} className="gap-1.5">
      {carregando ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
      Reabrir chamado
    </Button>
  )
}
