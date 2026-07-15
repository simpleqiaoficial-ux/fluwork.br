// Versão reduzida da Fase 1 — prioridade default por categoria, escalada por tempo parado sem
// resposta. O motor de SLA completo com pausa (aguardando_usuario não conta tempo) fica pra
// Fase 2, como o próprio faseamento do usuário já previa.
export type PrioridadeSuporte = "baixa" | "media" | "alta" | "critica"

const PRIORIDADE_DEFAULT_POR_CATEGORIA: Record<string, PrioridadeSuporte> = {
  pedido_aprovacao: "media",
  pagamento: "alta",
  nota_fiscal: "media",
  contrato: "media",
  cadastro_acesso: "media",
  duvida_processo: "baixa",
  erro_sistema: "alta",
  lentidao_indisponibilidade: "alta",
  seguranca_acesso_indevido: "critica",
  outro_assunto: "baixa",
}

const ORDEM_PRIORIDADE: PrioridadeSuporte[] = ["baixa", "media", "alta", "critica"]

/** Prioridade inicial, calculada uma vez na criação do chamado. */
export function calcularPrioridadeInicial(categoria: string): PrioridadeSuporte {
  return PRIORIDADE_DEFAULT_POR_CATEGORIA[categoria] ?? "media"
}

/** Escalonamento simples por tempo parado — chamado sem primeira resposta há muito tempo sobe
 *  de prioridade automaticamente. Nunca rebaixa (rebaixar é sempre uma decisão manual do agente). */
export function escalonarPrioridadePorTempo(
  prioridadeAtual: PrioridadeSuporte,
  horasAbertoSemResposta: number,
): PrioridadeSuporte {
  const indiceAtual = ORDEM_PRIORIDADE.indexOf(prioridadeAtual)
  let indiceAlvo = indiceAtual

  if (horasAbertoSemResposta >= 72) indiceAlvo = ORDEM_PRIORIDADE.indexOf("critica")
  else if (horasAbertoSemResposta >= 48) indiceAlvo = Math.max(indiceAlvo, ORDEM_PRIORIDADE.indexOf("alta"))
  else if (horasAbertoSemResposta >= 24) indiceAlvo = Math.max(indiceAlvo, ORDEM_PRIORIDADE.indexOf("media"))

  return ORDEM_PRIORIDADE[Math.max(indiceAtual, indiceAlvo)]
}
