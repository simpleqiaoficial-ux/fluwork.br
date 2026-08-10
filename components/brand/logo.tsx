import { cn } from "@/lib/utils"

interface LogoProps {
  className?: string
  iconClassName?: string
  /** Esconde o wordmark "FLUXTEME" ao lado do ícone — usado em espaços bem estreitos (sidebar
   *  recolhida, favicon-like). */
  showWordmark?: boolean
  size?: number
  /** Variante clara do wordmark — usada sobre fundo escuro (sidebar navy, que é sempre escura
   *  independente do tema do app). O ícone em si já carrega o próprio fundo navy→teal, não
   *  precisa de variante própria. */
  dark?: boolean
}

/** Logo oficial da Fluxteme — asset real da marca (F geométrico, barra cromática), reutilizado
 *  em toda a marca (sidebar, landing, login). Nunca distorcer/esticar/rotacionar nem aplicar
 *  efeitos por cima, conforme o Manual de Marca v2.0. Wordmark sempre em caixa alta. */
export function Logo({ className, iconClassName, showWordmark = true, size = 36, dark = false }: LogoProps) {
  return (
    <span className={cn("inline-flex flex-col items-center gap-1", className)}>
      <img
        src="/fluxteme-logo.png"
        alt="Fluxteme"
        width={size}
        height={size}
        className={cn("shrink-0 rounded-[22%] object-contain", iconClassName)}
        style={{ width: size, height: size }}
      />
      {showWordmark && (
        <span
          className={cn(
            "font-heading text-xs font-medium uppercase leading-none tracking-wider",
            dark ? "text-white" : "text-foreground",
          )}
        >
          FLUXTEME
        </span>
      )}
    </span>
  )
}
