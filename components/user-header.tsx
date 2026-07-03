"use client"

import { User, Eye, EyeOff } from "lucide-react"
import { useValoresVisibility } from "@/contexts/valores-visibility-context"
import { Button } from "@/components/ui/button"

interface UserHeaderProps {
  nomeCompleto: string
  email: string
  cnpj?: string
  salario?: number
}

export function UserHeader({ nomeCompleto, email, cnpj, salario }: UserHeaderProps) {
  const { valoresVisiveis, toggleValoresVisiveis, mascararValor } = useValoresVisibility()

  return (
    <header className="sticky top-0 z-30 border-b bg-card">
      <div className="flex items-center gap-4 px-4 py-3 lg:px-6">
        {/* Spacer for mobile hamburger */}
        <div className="w-9 lg:hidden" />

        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 shrink-0">
          <User className="h-4 w-4 text-primary" />
        </div>

        <div className="flex flex-1 items-center gap-4 overflow-hidden">
          <span className="font-medium text-sm truncate text-foreground">{nomeCompleto}</span>
          <span className="hidden sm:inline text-xs text-muted-foreground truncate">{email}</span>
          {cnpj && (
            <span className="hidden md:inline text-xs text-muted-foreground font-mono">{cnpj}</span>
          )}
          {salario !== undefined && salario !== null && (
            <span className="hidden sm:inline text-sm font-medium text-foreground tabular-nums">
              {mascararValor(salario)}
            </span>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={toggleValoresVisiveis}
          className="shrink-0 h-8 w-8"
          title={valoresVisiveis ? "Ocultar valores" : "Mostrar valores"}
        >
          {valoresVisiveis ? (
            <Eye className="h-4 w-4 text-muted-foreground" />
          ) : (
            <EyeOff className="h-4 w-4 text-foreground" />
          )}
        </Button>
      </div>
    </header>
  )
}
