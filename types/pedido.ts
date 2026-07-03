export interface PedidoPagamento {
  id: string
  colaborador_id: string
  tipo_pedido?: "completo" | "reembolso_km"
  horas_extras: number
  horas_extras_50?: number
  horas_extras_100?: number
  motivo_horas_extras?: string
  valor_km: number
  conducao: number
  valor_plantao: number
  motivo_plantao?: string
  comissao?: number
  motivo_comissao?: string
  valor_total: number
  valor_desconto: number
  motivo_desconto?: string
  created_at: string
  status: StatusPedido
  aprovado_gerente: boolean
  aprovado_financeiro: boolean
  observacao_gerente?: string
  observacao_financeiro?: string
  data_aprovacao_gerente?: string
  data_aprovacao_financeiro?: string
  data_previsao_pagamento?: string
  criado_por_colaborador_id?: string
  criado_por?: {
    nome_completo: string
    tipo_acesso: string
  }
  aprovado_por_gerente?: {
    id: string
    nome_completo: string
  }
  aprovado_por_financeiro?: {
    id: string
    nome_completo: string
  }
  nota_emitida?: boolean
  data_emissao_nota?: string
  nota_fiscal_url?: string
  data_nota_recebida?: string
  notas_fiscais?: {
    arquivo_xml_url: string
    arquivo_pdf_url: string
    created_at: string
  }
  colaborador?: {
    nome_completo: string
    salario: number
    tipo_acesso: string
    equipe_id?: string
    centro_custo_id?: string
    equipe?: { id: string; nome: string }
    centro_custo?: { id: string; numero: string; nome: string }
  }
  colaboradores?: {
    nome_completo: string
    salario: number
    tipo_acesso: string
  }
}

export type StatusPedido = "pendente_gerente" | "pendente_financeiro" | "aprovado" | "recusado" | "correcao" | "pago" | "nota_recebida"

export interface NovoPedido {
  colaborador_id: string
  tipo_pedido: "completo" | "reembolso_km"
  horas_extras_50: number
  horas_extras_100: number
  motivo_horas_extras?: string
  valor_km: number
  conducao: number
  valor_plantao: number
  motivo_plantao?: string
  comissao: number
  motivo_comissao?: string
  valor_desconto: number
  motivo_desconto?: string
}

export interface AcaoPedido {
  pedido_id: string
  acao: "aprovar" | "recusar" | "corrigir"
  observacao?: string
  data_previsao_pagamento?: string
}

export interface CorrecaoPedido {
  horas_extras_50: number
  horas_extras_100: number
  motivo_horas_extras?: string
  valor_km: number
  conducao: number
  valor_plantao: number
  motivo_plantao?: string
  comissao: number
  motivo_comissao?: string
  valor_desconto: number
  motivo_desconto?: string
}
