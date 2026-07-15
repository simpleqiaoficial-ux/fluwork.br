// Roteamento automático — nunca uma escolha do usuário nem confiado do cliente. Chamado uma
// única vez, no servidor, dentro da Server Action de criação do chamado.
export interface ClassificacaoTicket {
  nivelSuporte: "nivel_1" | "nivel_2"
  equipeResponsavel: "empresa" | "fluwork"
}

const ROTEAMENTO_POR_CATEGORIA: Record<string, ClassificacaoTicket> = {
  pedido_aprovacao: { nivelSuporte: "nivel_1", equipeResponsavel: "empresa" },
  pagamento: { nivelSuporte: "nivel_1", equipeResponsavel: "empresa" },
  nota_fiscal: { nivelSuporte: "nivel_1", equipeResponsavel: "empresa" },
  contrato: { nivelSuporte: "nivel_1", equipeResponsavel: "empresa" },
  cadastro_acesso: { nivelSuporte: "nivel_1", equipeResponsavel: "empresa" },
  duvida_processo: { nivelSuporte: "nivel_1", equipeResponsavel: "empresa" },
  erro_sistema: { nivelSuporte: "nivel_2", equipeResponsavel: "fluwork" },
  lentidao_indisponibilidade: { nivelSuporte: "nivel_2", equipeResponsavel: "fluwork" },
  seguranca_acesso_indevido: { nivelSuporte: "nivel_2", equipeResponsavel: "fluwork" },
  // Adm da empresa decide se escala pro nível 2 — ver escalarTicket em app/actions/support-tickets.ts.
  outro_assunto: { nivelSuporte: "nivel_1", equipeResponsavel: "empresa" },
}

export function classificarTicket(categoria: string): ClassificacaoTicket {
  const classificacao = ROTEAMENTO_POR_CATEGORIA[categoria]
  if (!classificacao) {
    throw new Error(`Categoria de suporte desconhecida: ${categoria}`)
  }
  return classificacao
}
