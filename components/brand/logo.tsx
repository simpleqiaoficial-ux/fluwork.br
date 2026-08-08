import { cn } from "@/lib/utils"

interface LogoProps {
  className?: string
  iconClassName?: string
  /** Esconde o wordmark "FLUXTEME" ao lado do ícone — usado em espaços bem estreitos (sidebar
   *  recolhida, favicon-like). */
  showWordmark?: boolean
  size?: number
  /** Variante clara — usada sobre fundo escuro (sidebar navy, que é sempre escura independente
   *  do tema do app). Troca a haste pra branco e a barra pra Aqua, conforme o manual de marca. */
  dark?: boolean
}

/** Ícone oficial da Fluxteme: um F geométrico construído em dois blocos — a haste/braço superior
 *  na cor estrutural (Navy no claro, branco no escuro) e a barra horizontal como único elemento
 *  cromático (Teal no claro, Aqua no escuro). Construído em SVG (não é a fonte "F" estilizada)
 *  pra nunca distorcer/esticar/rotacionar como qualquer outro elemento de interface. */
function FluxtemeIcon({ className, size, dark }: { className?: string; size: number; dark: boolean }) {
  const hasteColor = dark ? "#FFFFFF" : "#011832"
  const barColor = dark ? "#00AEDE" : "#00668A"
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={cn("shrink-0", className)}
      role="img"
      aria-label="Fluxteme"
    >
      <rect x="22" y="15" width="20" height="70" fill={hasteColor} />
      <rect x="22" y="15" width="48" height="20" fill={hasteColor} />
      <rect x="22" y="45" width="38" height="20" fill={barColor} />
    </svg>
  )
}

/** Logo oficial da Fluxteme — um só componente reutilizado em toda a marca (sidebar, landing,
 *  login). Wordmark sempre em caixa alta ("FLUXTEME"), conforme o Manual de Marca v2.0. */
export function Logo({ className, iconClassName, showWordmark = true, size = 36, dark = false }: LogoProps) {
  return (
    <span className={cn("inline-flex flex-col items-center gap-1", className)}>
      <FluxtemeIcon size={size} dark={dark} className={iconClassName} />
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
