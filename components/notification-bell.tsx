"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { contarPendencias } from "@/app/actions/contadores"

interface PendenciaItem {
  key: "aprovacoes" | "painelFinanceiro" | "acompanhamento" | "correcoes"
  label: string
  href: string
}

const PENDENCIA_ITEMS: PendenciaItem[] = [
  { key: "aprovacoes", label: "Aprovações pendentes", href: "/aprovacoes" },
  { key: "painelFinanceiro", label: "Aguardando pagamento", href: "/financeiro" },
  { key: "acompanhamento", label: "Aguardando anexo fiscal", href: "/acompanhamento" },
  { key: "correcoes", label: "Correções solicitadas", href: "/historico" },
]

/** Agrega as mesmas contagens reais já usadas nos badges da sidebar (contarPendencias) num
 *  sino no header — sem inventar um sistema de notificações novo, só uma outra vitrine pros
 *  mesmos números que já existem e já levam pra fila real ao clicar. */
export function NotificationBell() {
  const [pendencias, setPendencias] = useState({ aprovacoes: 0, painelFinanceiro: 0, correcoes: 0, acompanhamento: 0 })
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const fetchPendencias = async () => {
      try {
        setPendencias(await contarPendencias())
      } catch {}
    }
    fetchPendencias()
    const interval = setInterval(fetchPendencias, 30000)
    return () => clearInterval(interval)
  }, [])

  const itensComPendencia = PENDENCIA_ITEMS.filter((item) => (pendencias?.[item.key] ?? 0) > 0)
  const total = itensComPendencia.reduce((sum, item) => sum + (pendencias?.[item.key] ?? 0), 0)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-8 w-8" title="Notificações">
          <Bell className="h-4 w-4 text-muted-foreground" />
          {total > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold tabular-nums text-destructive-foreground">
              {total > 99 ? "99+" : total}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-2">
        <p className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Pendências
        </p>
        {itensComPendencia.length === 0 ? (
          <p className="px-2 py-3 text-sm text-muted-foreground">Nenhuma pendência no momento.</p>
        ) : (
          <div className="space-y-0.5">
            {itensComPendencia.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                onClick={() => setOpen(false)}
                className="flex items-center justify-between gap-3 rounded-md px-2 py-2 text-sm text-foreground hover:bg-accent/60 transition-colors"
              >
                <span>{item.label}</span>
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[11px] font-semibold tabular-nums text-primary-foreground">
                  {pendencias?.[item.key] ?? 0}
                </span>
              </Link>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
