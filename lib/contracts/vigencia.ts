// Cálculo de vigência contratual — sempre derivado de datas, nunca persistido no banco.
// Isso evita qualquer job agendado/cron: a sinalização visual (badges, dashboard, barra de
// progresso) é recalculada a cada leitura, a partir de data_inicio/data_termino/status.

export type ChaveSituacaoVigencia =
  | "sem_vigencia" // contrato sem data_termino definida (prazo indeterminado ou ainda não configurado)
  | "nao_iniciado" // assinado mas data_inicio ainda não chegou
  | "vigente"
  | "vence_90"
  | "vence_60"
  | "vence_30"
  | "vence_15"
  | "vence_7"
  | "vencido"

export interface SituacaoVigencia {
  chave: ChaveSituacaoVigencia
  label: string
  cor: "verde" | "amarelo" | "laranja" | "vermelho" | "cinza"
  emoji: string
  diasRestantes: number | null
  percentualDecorrido: number | null
}

const LIMIARES: Array<{ ateDias: number; chave: ChaveSituacaoVigencia; label: string; cor: SituacaoVigencia["cor"]; emoji: string }> = [
  { ateDias: 7, chave: "vence_7", label: "Vence em 7 dias", cor: "vermelho", emoji: "🔴" },
  { ateDias: 15, chave: "vence_15", label: "Vence em 15 dias", cor: "vermelho", emoji: "🔴" },
  { ateDias: 30, chave: "vence_30", label: "Vence em 30 dias", cor: "laranja", emoji: "🟠" },
  { ateDias: 60, chave: "vence_60", label: "Vence em 60 dias", cor: "amarelo", emoji: "🟡" },
  { ateDias: 90, chave: "vence_90", label: "Vence em 90 dias", cor: "amarelo", emoji: "🟡" },
]

function diffDias(de: Date, ate: Date): number {
  const msPorDia = 24 * 60 * 60 * 1000
  return Math.ceil((ate.getTime() - de.getTime()) / msPorDia)
}

/**
 * Calcula a situação de vigência de um contrato. Só faz sentido pra contratos assinados
 * (status === 'signed') — pra qualquer outro status (rascunho, cancelado, etc.) a vigência
 * ainda não começou/não se aplica, então retorna "sem_vigencia".
 */
export function calcularSituacaoVigencia(contrato: {
  status: string
  dataInicio: string | Date
  dataTermino?: string | Date | null
}): SituacaoVigencia {
  if (contrato.status !== "signed" || !contrato.dataTermino) {
    return { chave: "sem_vigencia", label: "Sem vigência definida", cor: "cinza", emoji: "⚪", diasRestantes: null, percentualDecorrido: null }
  }

  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const inicio = new Date(contrato.dataInicio)
  const termino = new Date(contrato.dataTermino)
  const diasRestantes = diffDias(hoje, termino)

  const duracaoTotal = diffDias(inicio, termino)
  const decorrido = diffDias(inicio, hoje)
  const percentualDecorrido = duracaoTotal > 0 ? Math.min(100, Math.max(0, Math.round((decorrido / duracaoTotal) * 100))) : null

  if (hoje < inicio) {
    return { chave: "nao_iniciado", label: "Ainda não iniciado", cor: "cinza", emoji: "⚪", diasRestantes, percentualDecorrido: 0 }
  }

  if (diasRestantes < 0) {
    return { chave: "vencido", label: "Vigência encerrada", cor: "cinza", emoji: "⚫", diasRestantes, percentualDecorrido: 100 }
  }

  for (const limiar of LIMIARES) {
    if (diasRestantes <= limiar.ateDias) {
      return { chave: limiar.chave, label: limiar.label, cor: limiar.cor, emoji: limiar.emoji, diasRestantes, percentualDecorrido }
    }
  }

  return { chave: "vigente", label: "Vigente", cor: "verde", emoji: "🟢", diasRestantes, percentualDecorrido }
}
