"use server"

export interface ConsultaCnpjResultado {
  success: boolean
  nome?: string
  razaoSocial?: string
  situacao?: string
  dataAbertura?: string
  endereco?: {
    cep?: string
    logradouro?: string
    numero?: string
    complemento?: string
    bairro?: string
    cidade?: string
    uf?: string
  }
  error?: string
}

/** Consulta pública de CNPJ (BrasilAPI, sem chave) usada para auto-preencher o cadastro do prestador. */
export async function consultarCnpj(cnpjRaw: string): Promise<ConsultaCnpjResultado> {
  const cnpj = cnpjRaw.replace(/\D/g, "")
  if (cnpj.length !== 14) {
    return { success: false, error: "CNPJ inválido" }
  }

  try {
    // BrasilAPI bloqueia com 403 requisições sem User-Agent — o fetch do Node não envia um por padrão.
    const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`, {
      cache: "no-store",
      headers: { "User-Agent": "FluWork/1.0 (+https://fluworkbr-mwarhzm76a-rj.a.run.app)" },
    })

    if (!response.ok) {
      return {
        success: false,
        error: response.status === 404 ? "CNPJ não encontrado" : "Não foi possível consultar o CNPJ agora",
      }
    }

    const data = await response.json()
    const razaoSocial = (data.razao_social?.trim() || undefined) as string | undefined
    const nome = (data.nome_fantasia?.trim() || razaoSocial) as string | undefined

    return {
      success: true,
      nome,
      razaoSocial,
      situacao: data.descricao_situacao_cadastral as string | undefined,
      dataAbertura: (data.data_inicio_atividade as string | undefined) || undefined,
      endereco: {
        cep: (data.cep as string | undefined) || undefined,
        logradouro: (data.logradouro as string | undefined) || undefined,
        numero: (data.numero as string | undefined) || undefined,
        complemento: (data.complemento as string | undefined) || undefined,
        bairro: (data.bairro as string | undefined) || undefined,
        cidade: (data.municipio as string | undefined) || undefined,
        uf: (data.uf as string | undefined) || undefined,
      },
    }
  } catch (error) {
    console.error("[v0] Erro ao consultar CNPJ:", error)
    return { success: false, error: "Não foi possível consultar o CNPJ agora" }
  }
}
