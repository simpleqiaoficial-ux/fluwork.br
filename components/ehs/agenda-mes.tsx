import Link from "next/link"
import { cn } from "@/lib/utils"
import { situacaoExibicaoIntegracao } from "@/lib/ehs/integracoes"

interface IntegracaoAgenda {
  id: string
  status: string
  data_agendada: string
  horario: string | null
  data_validade: string | null
  cliente?: { id: string; nome: string } | null
  colaborador?: { id: string; nome_completo: string } | null
}

const COR_DOT: Record<string, string> = {
  agendado: "bg-muted-foreground",
  confirmado: "bg-primary",
  compareceu: "bg-success",
  nao_compareceu: "bg-destructive",
  reagendado: "bg-warning",
  cancelado: "bg-muted-foreground",
  concluido: "bg-success",
  vencido: "bg-destructive",
}

const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]

export function AgendaMes({ ano, mes, integracoes }: { ano: number; mes: number; integracoes: IntegracaoAgenda[] }) {
  const primeiroDia = new Date(ano, mes - 1, 1)
  const diasNoMes = new Date(ano, mes, 0).getDate()
  const offsetInicial = primeiroDia.getDay()
  const hojeStr = new Date().toISOString().slice(0, 10)

  const porDia = new Map<number, IntegracaoAgenda[]>()
  for (const integracao of integracoes) {
    const dia = Number(integracao.data_agendada.slice(8, 10))
    const lista = porDia.get(dia) || []
    lista.push(integracao)
    porDia.set(dia, lista)
  }

  const celulas: (number | null)[] = [...Array(offsetInicial).fill(null), ...Array.from({ length: diasNoMes }, (_, i) => i + 1)]
  while (celulas.length % 7 !== 0) celulas.push(null)

  return (
    // Calendário rola só dentro da própria caixa em telas estreitas — nunca a página inteira,
    // pra não precisar dar zoom/pinch pra enxergar os dias da semana.
    <div className="rounded-lg border overflow-x-auto">
      <div className="min-w-[560px]">
        <div className="grid grid-cols-7 border-b bg-muted/40">
          {DIAS_SEMANA.map((dia) => (
            <div key={dia} className="p-2 text-center text-xs font-medium text-muted-foreground">
              {dia}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {celulas.map((dia, index) => {
            const dataStr = dia ? `${ano}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}` : null
            const eventos = dia ? porDia.get(dia) || [] : []
            return (
              <div key={index} className={cn("min-h-[96px] border-b border-r p-1.5 last:border-r-0", !dia && "bg-muted/20")}>
                {dia && (
                  <>
                    <span className={cn("inline-flex h-5 w-5 items-center justify-center rounded-full text-xs", dataStr === hojeStr ? "bg-primary text-primary-foreground font-medium" : "text-muted-foreground")}>
                      {dia}
                    </span>
                    <div className="mt-1 space-y-1">
                      {eventos.slice(0, 3).map((evento) => (
                        <Link
                          key={evento.id}
                          href={`/ehs/integracoes/${evento.id}`}
                          className="flex items-center gap-1 rounded px-1 py-0.5 text-[11px] hover:bg-muted truncate"
                        >
                          <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", COR_DOT[situacaoExibicaoIntegracao(evento)] || "bg-muted-foreground")} />
                          <span className="truncate">{evento.colaborador?.nome_completo || evento.cliente?.nome || "Integração"}</span>
                        </Link>
                      ))}
                      {eventos.length > 3 && <p className="px-1 text-[10px] text-muted-foreground">+{eventos.length - 3} mais</p>}
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
