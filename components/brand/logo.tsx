import { cn } from "@/lib/utils"

interface LogoProps {
  className?: string
  iconClassName?: string
  /** Esconde o texto "FluWork" ao lado do ícone — usado em espaços bem estreitos (sidebar recolhida, favicon-like). */
  showWordmark?: boolean
  size?: number
  /** Variante clara do wordmark — usada sobre a sidebar navy, que é sempre escura independente do tema do app. */
  dark?: boolean
}

/** Logo oficial do FluWork — um só componente reutilizado em toda a marca (sidebar, landing, login). */
export function Logo({ className, iconClassName, showWordmark = true, size = 36, dark = false }: LogoProps) {
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
        <span
          className={cn(
            "text-xs font-semibold leading-none tracking-tight",
            dark ? "text-white" : "text-primary",
          )}
        >
          FluWork
        </span>
      )}
    </span>
  )
}
