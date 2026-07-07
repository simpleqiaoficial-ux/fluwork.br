"use server"

export interface ConsultaCnpjResultado {
  success: boolean
  nome?: string
  situacao?: string
  error?: string
}

/** Consulta pública de CNPJ (BrasilAPI, sem chave) usada para auto-preencher o cadastro do prestador. */
export async function consultarCnpj(cnpjRaw: string): Promise<ConsultaCnpjResultado> {
  const cnpj = cnpjRaw.replace(/\D/g, "")
  if (cnpj.length !== 14) {
    return { success: false, error: "CNPJ inválido" }
  }

  try {
    const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`, { cache: "no-store" })

    if (!response.ok) {
      return {
        success: false,
        error: response.status === 404 ? "CNPJ não encontrado" : "Não foi possível consultar o CNPJ agora",
      }
    }

    const data = await response.json()
    const nome = (data.nome_fantasia?.trim() || data.razao_social?.trim()) as string | undefined

    return {
      success: true,
      nome: nome || undefined,
      situacao: data.descricao_situacao_cadastral as string | undefined,
    }
  } catch (error) {
    console.error("[v0] Erro ao consultar CNPJ:", error)
    return { success: false, error: "Não foi possível consultar o CNPJ agora" }
  }
}
