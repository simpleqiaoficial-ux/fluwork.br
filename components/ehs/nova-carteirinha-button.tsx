"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CarteirinhaUploadDialog } from "@/components/ehs/carteirinha-upload-dialog"

interface PrestadorOpcao {
  id: string
  nome_completo: string
}

export function NovaCarteirinhaButton({ clienteId, prestadores }: { clienteId: string; prestadores: PrestadorOpcao[] }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setOpen(true)} disabled={prestadores.length === 0}>
        <Plus className="h-3.5 w-3.5" />
        Nova carteirinha
      </Button>
      <CarteirinhaUploadDialog open={open} onOpenChange={setOpen} clienteId={clienteId} prestadores={prestadores} />
    </>
  )
}
