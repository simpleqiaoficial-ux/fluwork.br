"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { gerarLinkAssinaturaProprio } from "@/app/actions/contratos"
import { FileSignature, Loader2 } from "lucide-react"
import { toast } from "sonner"

export function AssinarAgoraButton({ contratoId }: { contratoId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    setLoading(true)
    try {
      const result = await gerarLinkAssinaturaProprio(contratoId)
      if (!result.success || !result.url) {
        toast.error(("error" in result && result.error) || "Erro ao abrir contrato para assinatura")
        return
      }
      router.push(result.url)
    } catch {
      toast.error("Erro ao abrir contrato para assinatura")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button size="sm" onClick={handleClick} disabled={loading} className="gap-1.5">
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileSignature className="h-3.5 w-3.5" />}
      {loading ? "Abrindo..." : "Assinar agora"}
    </Button>
  )
}
