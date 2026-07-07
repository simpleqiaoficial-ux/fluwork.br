import { cn } from "@/lib/utils"

interface LogoProps {
  className?: string
  iconClassName?: string
  /** Esconde o texto "FluWork" ao lado do ícone — usado em espaços bem estreitos (sidebar recolhida, favicon-like). */
  showWordmark?: boolean
  size?: number
}

/** Logo oficial do FluWork — um só componente reutilizado em toda a marca (sidebar, landing, login). */
export function Logo({ className, iconClassName, showWordmark = true, size = 36 }: LogoProps) {
  return (
    <span className={cn("inline-flex flex-col items-center gap-0.5", className)}>
      <img
        src="/fluwork-logo.png"
        alt="FluWork"
        width={size}
        height={size}
        className={cn("shrink-0 object-contain", iconClassName)}
        style={{ width: size, height: size }}
      />
      {showWordmark && (
        <span className="text-xs font-semibold leading-none tracking-tight text-primary">FluWork</span>
      )}
    </span>
  )
}
