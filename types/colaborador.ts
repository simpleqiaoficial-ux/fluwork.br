export type TipoAcesso = "Colaborador" | "Supervisor" | "Gerente" | "Financeiro" | "Adm"

export interface Colaborador {
  id: string
  nome_completo: string
  salario: number
  cnpj: string | null
  data_nascimento: string | null
  data_aniversario_contrato: string | null
  email: string
  user_id: string | null
  tipo_acesso: TipoAcesso
  equipe_id: string | null
  dia_pagamento: number
  chave_pix: string | null
  tipo_chave_pix: string | null
  centro_custo_id: string | null
  created_at: string
  equipe?: {
    id: string
    nome: string
  }
  centro_custo?: {
    id: string
    numero: string
    nome: string
  }
  bloqueado?: boolean
  data_ultimo_pedido?: string
}

export interface NovoColaborador {
  nome_completo: string
  salario: number
  cnpj: string
  data_nascimento: string
  data_aniversario_contrato: string
  email: string
  senha: string
  tipo_acesso: TipoAcesso
  equipe_id: string | null
  dia_pagamento: number
  chave_pix: string | null
  tipo_chave_pix: string | null
  centro_custo_id: string | null
}

export interface CentroCusto {
  id: string
  numero: string
  nome: string
  created_at: string
}
