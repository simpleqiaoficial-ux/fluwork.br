import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"

export type KpiAccent = "primary" | "success" | "warning" | "destructive"

// Cor semântica vive no número em si, não numa forma decorativa em volta do ícone — mantém
// a leitura "o que precisa de atenção" sem recair no padrão ícone-em-círculo/quadrado genérico.
// Mesmo padrão já estabelecido em components/dashboard-analytics.tsx — extraído aqui porque o
// módulo EHS reaproveita este card em várias telas (dashboard, cliente, prestador, pendências).
const KPI_VALUE_CLASSES: Record<KpiAccent, string> = {
  primary: "text-foreground",
  success: "text-success",
  warning: "text-warning",
  destructive: "text-destructive",
}

interface KpiCardProps {
  icon: LucideIcon
  accent: KpiAccent
  label: string
  value: string
  description?: string
}

export function KpiCard({ icon: Icon, accent, label, value, description }: KpiCardProps) {
  return (
    <Card className="shadow-none animate-in fade-in slide-in-from-bottom-1 duration-300">
      <CardContent className="p-5">
        <div className="flex items-center gap-1.5">
          <Icon className="h-3.5 w-3.5 text-muted-foreground/70" />
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
        <p className={cn("mt-2 text-xl font-semibold tabular-nums", KPI_VALUE_CLASSES[accent])}>{value}</p>
        {description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}
      </CardContent>
    </Card>
  )
}
