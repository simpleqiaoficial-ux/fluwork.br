// Cálculo de validade de documento — sempre derivado da data, nunca persistido no banco.
// Mesmo espírito de lib/contracts/vigencia.ts: sem job/cron, recalculado a cada leitura.

export type ChaveSituacaoValidade = "sem_validade" | "vigente" | "vence_90" | "vence_60" | "vence_30" | "vence_15" | "vence_7" | "vencido"

export interface SituacaoValidade {
  chave: ChaveSituacaoValidade
  label: string
  cor: "verde" | "amarelo" | "laranja" | "vermelho" | "cinza"
  diasRestantes: number | null
}

const LIMIARES: Array<{ ateDias: number; chave: ChaveSituacaoValidade; label: string; cor: SituacaoValidade["cor"] }> = [
  { ateDias: 7, chave: "vence_7", label: "Vence em 7 dias", cor: "vermelho" },
  { ateDias: 15, chave: "vence_15", label: "Vence em 15 dias", cor: "vermelho" },
  { ateDias: 30, chave: "vence_30", label: "Vence em 30 dias", cor: "laranja" },
  { ateDias: 60, chave: "vence_60", label: "Vence em 60 dias", cor: "amarelo" },
  { ateDias: 90, chave: "vence_90", label: "Vence em 90 dias", cor: "amarelo" },
]

function diffDias(de: Date, ate: Date): number {
  const msPorDia = 24 * 60 * 60 * 1000
  return Math.ceil((ate.getTime() - de.getTime()) / msPorDia)
}

export function calcularSituacaoValidade(dataValidade: string | Date | null | undefined): SituacaoValidade {
  if (!dataValidade) {
    return { chave: "sem_validade", label: "Sem validade definida", cor: "cinza", diasRestantes: null }
  }

  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const validade = new Date(dataValidade)
  const diasRestantes = diffDias(hoje, validade)

  if (diasRestantes < 0) {
    return { chave: "vencido", label: `Vencido há ${Math.abs(diasRestantes)} dia${Math.abs(diasRestantes) === 1 ? "" : "s"}`, cor: "vermelho", diasRestantes }
  }

  for (const limiar of LIMIARES) {
    if (diasRestantes <= limiar.ateDias) {
      return { chave: limiar.chave, label: limiar.label, cor: limiar.cor, diasRestantes }
    }
  }

  return { chave: "vigente", label: "Válido", cor: "verde", diasRestantes }
}
