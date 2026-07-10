"use client"

import { useState } from "react"
import Link from "next/link"
import { AlertTriangle, Clock, XCircle, CalendarClock, ShieldAlert } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import type { PendenciaEhs, TipoPendenciaEhs } from "@/lib/ehs/pendencias"

const TIPO_CONFIG: Record<TipoPendenciaEhs, { label: string; icon: typeof AlertTriangle; variant: "destructive" | "warning" }> = {
  documento_vencido: { label: "Documento vencido", icon: AlertTriangle, variant: "destructive" },
  documento_proximo: { label: "Vence em breve", icon: Clock, variant: "warning" },
  documento_rejeitado: { label: "Documento rejeitado", icon: XCircle, variant: "destructive" },
  integracao_nao_confirmada: { label: "Integração não confirmada", icon: CalendarClock, variant: "warning" },
  integracao_vencida: { label: "Integração vencida", icon: ShieldAlert, variant: "destructive" },
}

function formatarData(data: string) {
  return new Intl.DateTimeFormat("pt-BR").format(new Date(data))
}

export function PendenciasEhsList({ pendencias }: { pendencias: PendenciaEhs[] }) {
  const [filtro, setFiltro] = useState<TipoPendenciaEhs | "todos">("todos")

  const tiposComItens = Array.from(new Set(pendencias.map((p) => p.tipo)))
  const filtradas = filtro === "todos" ? pendencias : pendencias.filter((p) => p.tipo === filtro)

  if (pendencias.length === 0) {
    return <EmptyState icon={ShieldAlert} title="Nenhuma pendência no momento" description="Documentos e integrações que precisam de atenção aparecem aqui automaticamente." className="py-16" />
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button variant={filtro === "todos" ? "default" : "outline"} size="sm" onClick={() => setFiltro("todos")}>
          Todas ({pendencias.length})
        </Button>
        {tiposComItens.map((tipo) => (
          <Button key={tipo} variant={filtro === tipo ? "default" : "outline"} size="sm" onClick={() => setFiltro(tipo)}>
            {TIPO_CONFIG[tipo].label} ({pendencias.filter((p) => p.tipo === tipo).length})
          </Button>
        ))}
      </div>

      <div className="space-y-2">
        {filtradas.map((pendencia) => {
          const config = TIPO_CONFIG[pendencia.tipo]
          const Icon = config.icon
          return (
            <Link key={pendencia.id} href={pendencia.href}>
              <Card className="p-4 flex items-center gap-3 hover:border-primary/40 transition-colors">
                <Icon className={`h-4 w-4 shrink-0 ${config.variant === "destructive" ? "text-destructive" : "text-warning"}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{pendencia.titulo}</p>
                  <p className="text-xs text-muted-foreground truncate">{pendencia.descricao}</p>
                </div>
                <Badge variant={config.variant}>{formatarData(pendencia.data)}</Badge>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
