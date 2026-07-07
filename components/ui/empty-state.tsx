import Link from "next/link"
import type { LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface EmptyStateAction {
  label: string
  href?: string
  onClick?: () => void
}

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: EmptyStateAction
  className?: string
}

/** Empty state padrão do sistema — ícone + título + descrição + CTA opcional. */
export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 text-center", className)}>
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <Icon className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="mt-4 font-semibold text-foreground">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action &&
        (action.href ? (
          <Link href={action.href}>
            <Button variant="outline" size="sm" className="mt-4 gap-2">
              {action.label}
            </Button>
          </Link>
        ) : (
          <Button variant="outline" size="sm" className="mt-4 gap-2" onClick={action.onClick}>
            {action.label}
          </Button>
        ))}
    </div>
  )
}
