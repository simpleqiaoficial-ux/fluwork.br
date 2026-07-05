import type { EmpresaParaMontagem } from "./montar-dados-contrato"

export interface AditivoParaMontagem {
  tipo: string
  versao: number
  descricao?: string | null
  campos_alterados?: Record<string, { de: any; para: any }> | null
  novo_valor?: number | null
  nova_data_termino?: string | null
  novas_clausulas?: string | null
}

export interface ContratoBaseParaMontagem {
  numero: string
  prestador_nome: string
  prestador_cpf_cnpj: string
  prestador_email: string
}

export interface AssinaturaAditivoParaMontagem {
  nome: string
  cpfCnpj: string
  email: string
  assinadoEm: string | Date
  ip?: string | null
}

export interface DadosAditivo {
  empresa: {
    razaoSocial: string
    nomeFantasia?: string
    cnpj: string
    logoUrl?: string
  }
  numeroContrato: string
  versao: number
  tipoLabel: string
  descricao?: string
  prestador: { nome: string; cpfCnpj: string; email: string }
  alteracoes: Array<{ campo: string; de: string; para: string }>
  assinatura?: {
    nome: string
    cpfCnpj: string
    email: string
    dataHoraFormatada: string
    ip: string
  }
}

const TIPO_LABEL: Record<string, string> = {
  aditivo_salarial: "Aditivo Salarial",
  aditivo_clausulas: "Alteração de Cláusulas",
  renovacao: "Renovação Contratual",
  outro: "Aditivo Contratual",
}

const CAMPO_LABEL: Record<string, string> = {
  valor: "Valor",
  data_termino: "Data de término",
  clausulas: "Cláusulas adicionais",
}

function formatarValorCampo(campo: string, valor: any): string {
  if (valor == null) return "—"
  if (campo === "valor") return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(valor))
  if (campo === "data_termino") return new Intl.DateTimeFormat("pt-BR").format(new Date(valor))
  return String(valor)
}

function formatarDataHora(data: string | Date): string {
  const d = typeof data === "string" ? new Date(data) : data
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "medium", timeZone: "America/Sao_Paulo" }).format(d)
}

export function montarDadosAditivo(
  aditivo: AditivoParaMontagem,
  contrato: ContratoBaseParaMontagem,
  empresa: EmpresaParaMontagem,
  assinatura?: AssinaturaAditivoParaMontagem,
): DadosAditivo {
  const alteracoes = Object.entries(aditivo.campos_alterados || {}).map(([campo, valores]) => ({
    campo: CAMPO_LABEL[campo] || campo,
    de: formatarValorCampo(campo, valores.de),
    para: formatarValorCampo(campo, valores.para),
  }))

  const result: DadosAditivo = {
    empresa: {
      razaoSocial: empresa.razao_social,
      nomeFantasia: empresa.nome_fantasia || undefined,
      cnpj: empresa.cnpj,
      logoUrl: empresa.logo_url || undefined,
    },
    numeroContrato: contrato.numero,
    versao: aditivo.versao,
    tipoLabel: TIPO_LABEL[aditivo.tipo] || "Aditivo Contratual",
    descricao: aditivo.descricao || undefined,
    prestador: {
      nome: contrato.prestador_nome,
      cpfCnpj: contrato.prestador_cpf_cnpj,
      email: contrato.prestador_email,
    },
    alteracoes,
  }

  if (assinatura) {
    result.assinatura = {
      nome: assinatura.nome,
      cpfCnpj: assinatura.cpfCnpj,
      email: assinatura.email,
      dataHoraFormatada: formatarDataHora(assinatura.assinadoEm),
      ip: assinatura.ip || "não capturado",
    }
  }

  return result
}
