// Catálogo fixo das 10 categorias da Central de Suporte — mesmo conjunto do CHECK constraint
// de support_tickets.categoria (lib/db/schema.ts). Subcategorias são só sugestões de texto
// livre pra ajudar o usuário a descrever o problema, não uma segunda taxonomia com roteamento
// próprio — o roteamento (lib/support/routing.ts) usa só a categoria.
export interface CategoriaSuporte {
  valor: string
  label: string
  subcategoriasSugeridas: string[]
}

export const CATEGORIAS_SUPORTE: CategoriaSuporte[] = [
  {
    valor: "pedido_aprovacao",
    label: "Pedido ou aprovação",
    subcategoriasSugeridas: [
      "Meu pedido não foi aprovado",
      "Pedido travado aguardando aprovação",
      "Valor do pedido está errado",
    ],
  },
  {
    valor: "pagamento",
    label: "Pagamento",
    subcategoriasSugeridas: [
      "Meu pagamento não caiu",
      "Valor recebido diferente do esperado",
      "Dúvida sobre data de pagamento",
    ],
  },
  {
    valor: "nota_fiscal",
    label: "Nota fiscal",
    subcategoriasSugeridas: [
      "Não consigo emitir a nota fiscal",
      "Nota fiscal foi rejeitada",
      "Erro ao anexar nota fiscal",
    ],
  },
  {
    valor: "contrato",
    label: "Contrato",
    subcategoriasSugeridas: [
      "Não recebi o contrato para assinar",
      "Erro ao assinar o contrato",
      "Dúvida sobre cláusula do contrato",
    ],
  },
  {
    valor: "cadastro_acesso",
    label: "Cadastro ou acesso",
    subcategoriasSugeridas: [
      "Não consigo fazer login",
      "Meus dados cadastrais estão errados",
      "Preciso trocar meu e-mail de acesso",
    ],
  },
  {
    valor: "duvida_processo",
    label: "Dúvida sobre o processo",
    subcategoriasSugeridas: ["Como funciona o fluxo de aprovação", "Não sei qual é o próximo passo"],
  },
  {
    valor: "erro_sistema",
    label: "Erro no sistema",
    subcategoriasSugeridas: ["Tela quebrada ou travando", "Mensagem de erro inesperada", "Ação não salva"],
  },
  {
    valor: "lentidao_indisponibilidade",
    label: "Lentidão ou indisponibilidade",
    subcategoriasSugeridas: ["Sistema muito lento", "Sistema fora do ar"],
  },
  {
    valor: "seguranca_acesso_indevido",
    label: "Segurança ou acesso indevido",
    subcategoriasSugeridas: ["Alguém acessou minha conta sem autorização", "Suspeita de vazamento de dados"],
  },
  {
    valor: "outro_assunto",
    label: "Outro assunto",
    subcategoriasSugeridas: [],
  },
]

export function getCategoriaSuporte(valor: string): CategoriaSuporte | undefined {
  return CATEGORIAS_SUPORTE.find((c) => c.valor === valor)
}

export function getLabelCategoriaSuporte(valor: string): string {
  return getCategoriaSuporte(valor)?.label ?? valor
}
