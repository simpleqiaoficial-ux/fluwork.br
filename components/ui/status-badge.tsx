import { Badge } from "@/components/ui/badge"
import { getStatusConfig, type StatusEntity } from "@/lib/status-config"
import { cn } from "@/lib/utils"

interface StatusBadgeProps {
  entity: StatusEntity
  status: string
  className?: string
}

/** Badge de status padrão do sistema — sempre ícone + cor + label, nunca só texto. */
export function StatusBadge({ entity, status, className }: StatusBadgeProps) {
  const config = getStatusConfig(entity, status)
  const Icon = config.icon
  return (
    <Badge variant={config.variant} className={cn(className)}>
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  )
}
