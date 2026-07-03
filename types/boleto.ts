export interface Boleto {
  id: string
  numero_boleto: string
  banco: string
  agencia: string
  conta: string
  tipo: "receita" | "despesa"
  centro_custo_id: string | null
  ativo: boolean
  criado_em: string
  atualizado_em: string
  centro_custo?: {
    id: string
    nome: string
  }
}

export interface CreateBoletoInput {
  numero_boleto: string
  banco: string
  agencia: string
  conta: string
  tipo: "receita" | "despesa"
  centro_custo_id?: string | null
}

export interface UpdateBoletoInput extends Partial<CreateBoletoInput> {
  ativo?: boolean
}
