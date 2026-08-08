"use client"

import { useState } from "react"
import { Ban } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ModuloContatoDialog } from "@/components/modulo-contato-dialog"
import type { Modulo } from "@/lib/modulos"

interface ModuloBloqueadoCardProps {
  modulo: Modulo
  moduloLabel: string
  motivo: string
  nome: string
  empresa: string
  email: string
}

/** Substitui o conteúdo da página (mantendo sidebar/header) quando a rota atual pertence a
 *  um módulo bloqueado pra empresa — ver moduloDaRota() em lib/modulos.ts e o gate central em
 *  app/layout.tsx. */
export function ModuloBloqueadoCard({ modulo, moduloLabel, motivo, nome, empresa, email }: ModuloBloqueadoCardProps) {
  const [contatoAberto, setContatoAberto] = useState(false)

  return (
    <div className="container mx-auto px-4 lg:px-6 py-16 max-w-lg">
      <div className="rounded-lg border border-dashed p-8 text-center space-y-4">
        <div className="flex flex-col items-center gap-3">
          <Ban className="h-8 w-8 text-destructive" />
          <Badge variant="destructive">Módulo bloqueado</Badge>
        </div>
        <div className="space-y-1.5">
          <h1 className="text-lg font-semibold text-foreground">O módulo {moduloLabel} está bloqueado</h1>
          <p className="text-sm text-muted-foreground">{motivo}</p>
        </div>
        <Button onClick={() => setContatoAberto(true)}>Contatar comercial</Button>
      </div>

      <ModuloContatoDialog
        open={contatoAberto}
        onOpenChange={setContatoAberto}
        modulo={modulo}
        moduloLabel={moduloLabel}
        nome={nome}
        empresa={empresa}
        email={email}
      />
    </div>
  )
}
