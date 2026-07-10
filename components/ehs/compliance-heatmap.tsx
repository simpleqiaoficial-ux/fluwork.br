import Link from "next/link"
import { cn } from "@/lib/utils"
import type { ComplianceClienteEhs } from "@/lib/ehs/dashboard"

const COR_QUADRADO: Record<string, string> = {
  verde: "bg-success",
  amarelo: "bg-warning",
  vermelho: "bg-destructive",
  cinza: "bg-muted-foreground/40",
}

export function ComplianceHeatmap({ clientes }: { clientes: ComplianceClienteEhs[] }) {
  return (
    <div className="space-y-3">
      {clientes.map((cliente) => (
        <div key={cliente.id} className="flex items-center gap-3">
          <Link href={`/ehs/clientes/${cliente.id}`} className="w-40 shrink-0 truncate text-sm hover:underline">
            {cliente.nome}
          </Link>
          <div className="flex flex-wrap gap-1">
            {cliente.prestadores.map((prestador) => (
              <Link key={prestador.id} href={`/ehs/prestadores/${prestador.id}`} title={prestador.nome_completo}>
                <span className={cn("block h-4 w-4 rounded-sm transition-transform hover:scale-110", COR_QUADRADO[prestador.cor])} />
              </Link>
            ))}
          </div>
          <span className="ml-auto shrink-0 text-xs text-muted-foreground tabular-nums">{cliente.prestadores.length}</span>
        </div>
      ))}
    </div>
  )
}
