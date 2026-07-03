// Versão atual dos termos - incrementar quando os termos forem alterados
export const CURRENT_TERMS_VERSION = "1.0.0"

export type TermsAcceptance = {
  id: string
  user_id: string
  version: string
  accepted: boolean
  accepted_at: string | null
  ip_address: string | null
  device_info: string | null
  user_agent: string | null
  created_at: string
}

export type TermsAcceptanceWithUser = TermsAcceptance & {
  colaborador?: {
    nome_completo: string
    email: string
  }
}
