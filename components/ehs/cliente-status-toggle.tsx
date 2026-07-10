"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Loader2, Power } from "lucide-react"
import { Button } from "@/components/ui/button"
import { alternarStatusClienteEhs } from "@/app/actions/ehs-clientes"

export function ClienteStatusToggle({ clienteId, status }: { clienteId: string; status: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    setLoading(true)
    try {
      const result = await alternarStatusClienteEhs(clienteId)
      if (!result.success) {
        toast.error(result.error || "Erro ao alterar status")
        return
      }
      toast.success(result.status === "ativo" ? "Cliente ativado" : "Cliente desativado")
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleClick} disabled={loading} className="gap-1.5">
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Power className="h-3.5 w-3.5" />}
      {status === "ativo" ? "Desativar" : "Ativar"}
    </Button>
  )
}
