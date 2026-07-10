// Situação "vencido" de uma integração nunca é persistida — igual à validade de documento
// (lib/ehs/validade.ts) e à vigência de contrato: só existe pra uma integração já concluída
// cuja data_validade (do crachá/liberação gerada) já passou, calculado a cada leitura.

export function situacaoExibicaoIntegracao(integracao: { status: string; data_validade: string | Date | null }): string {
  if (integracao.status !== "concluido" || !integracao.data_validade) return integracao.status
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const validade = new Date(integracao.data_validade)
  return validade < hoje ? "vencido" : integracao.status
}

export const TRANSICOES_STATUS_INTEGRACAO: Record<string, string[]> = {
  agendado: ["confirmado", "compareceu", "nao_compareceu", "reagendado", "cancelado"],
  confirmado: ["compareceu", "nao_compareceu", "reagendado", "cancelado"],
  reagendado: ["confirmado", "compareceu", "nao_compareceu", "cancelado"],
  nao_compareceu: ["reagendado", "cancelado"],
  compareceu: ["concluido"],
  concluido: [],
  cancelado: [],
}
