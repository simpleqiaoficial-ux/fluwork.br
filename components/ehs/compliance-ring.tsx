import { cn } from "@/lib/utils"

interface ComplianceRingProps {
  score: number | null
  cor: "verde" | "amarelo" | "vermelho" | "cinza"
  size?: number
  className?: string
}

const COR_VAR: Record<ComplianceRingProps["cor"], string> = {
  verde: "hsl(var(--success))",
  amarelo: "hsl(var(--warning))",
  vermelho: "hsl(var(--destructive))",
  cinza: "hsl(var(--muted-foreground))",
}

/** Anel de Compliance Score — SVG simples, sem lib de gráfico nova. */
export function ComplianceRing({ score, cor, size = 96, className }: ComplianceRingProps) {
  const strokeWidth = size * 0.09
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const percentual = score ?? 0
  const dashOffset = circumference - (percentual / 100) * circumference
  const corResolvida = COR_VAR[cor]

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="hsl(var(--border))" strokeWidth={strokeWidth} fill="none" />
        {score !== null && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={corResolvida}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            fill="none"
            className="transition-[stroke-dashoffset] duration-500 ease-out"
          />
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {score !== null ? (
          <span className="text-lg font-semibold tabular-nums text-foreground">{score}%</span>
        ) : (
          <span className="text-[10px] text-muted-foreground text-center px-2 leading-tight">Sem documentos</span>
        )}
      </div>
    </div>
  )
}
