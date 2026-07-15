"use client"

import Link from "next/link"
import { AlertTriangle, LifeBuoy } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface SystemSuspendedScreenProps {
  reason?: string | null
}

export function SystemSuspendedScreen({ reason }: SystemSuspendedScreenProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="flex flex-col items-center gap-3">
          <AlertTriangle className="h-8 w-8 text-destructive" />
          <Badge variant="destructive">Sistema suspenso</Badge>
        </div>

        <div className="space-y-1.5">
          <h1 className="text-xl font-semibold">Sistema temporariamente suspenso</h1>
          <p className="text-sm text-muted-foreground">
            O FluWork está em manutenção no momento.
          </p>
        </div>

        {reason && (
          <div className="border-l-2 border-destructive pl-4 py-1 text-left">
            <p className="text-sm font-medium text-destructive mb-1">Motivo</p>
            <p className="text-sm text-muted-foreground">{reason}</p>
          </div>
        )}

        <div className="pt-4 border-t space-y-3">
          <p className="text-sm text-muted-foreground">Precisa de ajuda? Acesse a Central de Suporte.</p>
          <Button asChild className="gap-1.5">
            <Link href="/suporte">
              <LifeBuoy className="h-4 w-4" />
              Acessar suporte
            </Link>
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          Agradecemos sua compreensão. O sistema voltará ao normal em breve.
        </p>
      </div>
    </div>
  )
}
