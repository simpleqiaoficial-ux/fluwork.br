export interface NotaFiscal {
  id: string
  pedido_id: string
  colaborador_id: string
  numero_nfse: string
  chave_acesso?: string
  competencia_mes: number
  competencia_ano: number
  valor_servico: number
  cpf_cnpj_prestador: string
  arquivo_url: string
  validacao_identidade: boolean
  validacao_competencia: boolean
  validacao_valor: boolean
  validacao_duplicidade: boolean
  mensagem_validacao?: string
  status: "pendente" | "aprovado" | "rejeitado"
  aprovado_por?: string
  data_aprovacao?: string
  observacao_financeiro?: string
  created_at: string
  updated_at: string
}

export interface DadosNotaFiscal {
  numero_nfse: string
  chave_acesso?: string
  competencia_mes: number
  competencia_ano: number
  valor_servico: number
  cpf_cnpj_prestador: string
}

export interface ResultadoValidacao {
  valido: boolean
  validacao_identidade: boolean
  validacao_competencia: boolean
  validacao_valor: boolean
  validacao_duplicidade: boolean
  mensagens: string[]
}
