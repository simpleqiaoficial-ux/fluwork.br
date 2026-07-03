export interface Equipe {
  id: string
  nome: string
  supervisor_id: string | null
  created_at: string
  supervisor?: {
    id: string
    nome_completo: string
  }
  gerentes?: Array<{
    id: string
    nome_completo: string
  }>
}

export interface NovaEquipe {
  nome: string
  supervisor_id: string | null
}
