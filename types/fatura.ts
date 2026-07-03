export type StatusFatura = 'pendente' | 'pago' | 'vencido'

export interface Fatura {
  id: string
  titulo: string
  descricao?: string
  valor: number
  data_vencimento: string
  status: StatusFatura
  arquivo_pdf_url?: string
  criado_por: string
  created_at: string
  updated_at: string
  // Joined data
  colaboradores_permitidos?: ColaboradorPermitido[]
  criador?: {
    nome: string
  }
}

export interface ColaboradorPermitido {
  colaborador_id: string
  colaborador?: {
    id: string
    nome: string
    email: string
  }
}

export interface FaturaFormData {
  titulo: string
  descricao?: string
  valor: number
  data_vencimento: string
  colaboradores_ids: string[]
}
