"use client"

import { useTransition } from "react"
import { Eye, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { sairDaVisualizacaoComoEmpresa } from "@/app/actions/impersonation"

interface ImpersonationBannerProps {
  empresaNome: string
}

export function ImpersonationBanner({ empresaNome }: ImpersonationBannerProps) {
  const [isPending, startTransition] = useTransition()

  const handleSair = () => {
    startTransition(async () => {
      await sairDaVisualizacaoComoEmpresa()
    })
  }

  return (
    <div className="sticky top-0 z-50 flex items-center justify-between gap-3 bg-warning px-4 py-2 text-sm font-medium text-warning-foreground">
      <div className="flex items-center gap-2">
        <Eye className="h-4 w-4 shrink-0" />
        <span>
          Visualizando como <strong>{empresaNome}</strong> — modo somente leitura
        </span>
      </div>
      <Button
        size="sm"
        variant="outline"
        className="h-7 gap-1.5 border-warning-foreground/30 bg-warning text-warning-foreground hover:bg-warning/90 hover:text-warning-foreground"
        onClick={handleSair}
        disabled={isPending}
      >
        <LogOut className="h-3.5 w-3.5" />
        {isPending ? "Saindo..." : "Sair da visualização"}
      </Button>
    </div>
  )
}
