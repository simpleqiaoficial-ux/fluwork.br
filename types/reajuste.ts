export interface HistoricoReajuste {
  id: string
  colaborador_id: string
  salario_anterior: number
  salario_novo: number
  tipo_reajuste: "porcentagem" | "valor"
  valor_reajuste: number
  motivo: string // motivo agora é obrigatório
  aplicado_por: string // Corrigido de aplicado_por_id para aplicado_por
  created_at: string
  colaborador?: {
    nome_completo: string
  }
  aplicador?: {
    nome_completo: string
  }
}

export interface NovoReajuste {
  colaborador_id: string
  tipo_reajuste: "porcentagem" | "valor"
  valor_reajuste: number
  motivo: string // motivo agora é obrigatório
}
