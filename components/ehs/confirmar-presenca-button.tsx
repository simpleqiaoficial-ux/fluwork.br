"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { CheckCircle2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { confirmarMinhaPresencaEhs } from "@/app/actions/ehs-portal"

export function ConfirmarPresencaButton({ integracaoId }: { integracaoId: string }) {
  const router = useRouter()
  const [carregando, setCarregando] = useState(false)

  const handleClick = async () => {
    setCarregando(true)
    try {
      const result = await confirmarMinhaPresencaEhs(integracaoId)
      if (!result.success) {
        toast.error(result.error || "Erro ao confirmar presença")
        return
      }
      toast.success("Presença confirmada")
      router.refresh()
    } finally {
      setCarregando(false)
    }
  }

  return (
    <Button size="sm" className="gap-1.5" disabled={carregando} onClick={handleClick}>
      {carregando ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
      Confirmar presença
    </Button>
  )
}
