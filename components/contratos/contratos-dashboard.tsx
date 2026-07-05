import { FileCheck, Clock3, AlertTriangle, Ban, FileSignature, RotateCw } from "lucide-react"
import type { ContratosDashboardStats } from "@/app/actions/contratos"

interface ContratosDashboardProps {
  stats: ContratosDashboardStats
}

export function ContratosDashboard({ stats }: ContratosDashboardProps) {
  const cards = [
    { label: "Contratos ativos", valor: stats.ativos, icon: FileCheck },
    { label: "Vencendo em 90 dias", valor: stats.vencendo_90, icon: Clock3 },
    { label: "Vencendo em 60 dias", valor: stats.vencendo_60, icon: Clock3 },
    { label: "Vencendo em 30 dias", valor: stats.vencendo_30, icon: AlertTriangle },
    { label: "Vencidos", valor: stats.vencidos, icon: AlertTriangle },
    { label: "Aguardando assinatura", valor: stats.aguardando_assinatura, icon: FileSignature },
    { label: "Cancelados", valor: stats.cancelados, icon: Ban },
    { label: "Renovados no mês", valor: stats.renovados_no_mes, icon: RotateCw },
  ]

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <div key={card.label} className="rounded-md border p-3">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Icon className="h-4 w-4" />
              <span className="text-xs font-medium uppercase tracking-wide">{card.label}</span>
            </div>
            <p className="text-xl font-semibold tabular-nums mt-1.5">{card.valor}</p>
          </div>
        )
      })}
    </div>
  )
}
