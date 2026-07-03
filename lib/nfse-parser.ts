/**
 * Parser para Notas Fiscais de Serviço Eletrônicas (NFS-e) brasileiras
 * Suporta o formato XML padrão nacional (ABRASF)
 */

export interface DadosNFSeExtraidos {
  numero_nfse: string
  chave_acesso?: string
  competencia_mes: number
  competencia_ano: number
  valor_servico: number
  cpf_cnpj_prestador: string
  nome_prestador?: string
  cpf_cnpj_tomador?: string
  nome_tomador?: string
  descricao_servico?: string
  data_emissao?: string
}

/**
 * Extrai dados de um arquivo XML de NFS-e
 */
export async function parseNFSeXML(xmlContent: string): Promise<DadosNFSeExtraidos> {
  try {
    // Remover BOM se existir
    const cleanXml = xmlContent.replace(/^\uFEFF/, "")

    // Extrair número da NFS-e
    const numeroMatch = cleanXml.match(/<nNFSe>(\d+)<\/nNFSe>/)
    if (!numeroMatch) {
      throw new Error("Número da NFS-e não encontrado no XML")
    }
    const numero_nfse = numeroMatch[1]

    // Extrair chave de acesso (do atributo Id)
    const chaveMatch = cleanXml.match(/Id="(?:NFS|DPS)(\d+)"/)
    const chave_acesso = chaveMatch ? chaveMatch[1] : undefined

    // Extrair data de competência
    const competenciaMatch = cleanXml.match(/<dCompet>(\d{4})-(\d{2})-\d{2}<\/dCompet>/)
    if (!competenciaMatch) {
      throw new Error("Data de competência não encontrada no XML")
    }
    const competencia_ano = Number.parseInt(competenciaMatch[1])
    const competencia_mes = Number.parseInt(competenciaMatch[2])

    // Extrair valor do serviço (vServ ou vLiq)
    const valorServMatch = cleanXml.match(/<vServ>([\d.]+)<\/vServ>/)
    const valorLiqMatch = cleanXml.match(/<vLiq>([\d.]+)<\/vLiq>/)
    const valorStr = valorServMatch ? valorServMatch[1] : valorLiqMatch ? valorLiqMatch[1] : null

    if (!valorStr) {
      throw new Error("Valor do serviço não encontrado no XML")
    }
    const valor_servico = Number.parseFloat(valorStr)

    // Extrair CNPJ/CPF do prestador (dentro de <prest> ou <emit>)
    const cnpjPrestMatch = cleanXml.match(/<(?:prest|emit)>[\s\S]*?<CNPJ>(\d+)<\/CNPJ>/)
    const cpfPrestMatch = cleanXml.match(/<(?:prest|emit)>[\s\S]*?<CPF>(\d+)<\/CPF>/)
    const cpf_cnpj_prestador = cnpjPrestMatch ? cnpjPrestMatch[1] : cpfPrestMatch ? cpfPrestMatch[1] : ""

    if (!cpf_cnpj_prestador) {
      throw new Error("CPF/CNPJ do prestador não encontrado no XML")
    }

    // Extrair nome do prestador
    const nomePrestMatch = cleanXml.match(/<(?:prest|emit)>[\s\S]*?<xNome>([^<]+)<\/xNome>/)
    const nome_prestador = nomePrestMatch ? nomePrestMatch[1].trim() : undefined

    // Extrair CNPJ/CPF do tomador
    const cnpjTomaMatch = cleanXml.match(/<toma>[\s\S]*?<CNPJ>(\d+)<\/CNPJ>/)
    const cpfTomaMatch = cleanXml.match(/<toma>[\s\S]*?<CPF>(\d+)<\/CPF>/)
    const cpf_cnpj_tomador = cnpjTomaMatch ? cnpjTomaMatch[1] : cpfTomaMatch ? cpfTomaMatch[1] : undefined

    // Extrair nome do tomador
    const nomeTomaMatch = cleanXml.match(/<toma>[\s\S]*?<xNome>([^<]+)<\/xNome>/)
    const nome_tomador = nomeTomaMatch ? nomeTomaMatch[1].trim() : undefined

    // Extrair descrição do serviço
    const descServMatch = cleanXml.match(/<xDescServ>([^<]+)<\/xDescServ>/)
    const descricao_servico = descServMatch ? descServMatch[1].trim() : undefined

    // Extrair data de emissão
    const dataEmissaoMatch = cleanXml.match(/<dhEmi>([^<]+)<\/dhEmi>/)
    const data_emissao = dataEmissaoMatch ? dataEmissaoMatch[1] : undefined

    return {
      numero_nfse,
      chave_acesso,
      competencia_mes,
      competencia_ano,
      valor_servico,
      cpf_cnpj_prestador,
      nome_prestador,
      cpf_cnpj_tomador,
      nome_tomador,
      descricao_servico,
      data_emissao,
    }
  } catch (error) {
    console.error("[v0] Erro ao fazer parse do XML da NFS-e:", error)
    throw new Error(`Erro ao processar XML da NFS-e: ${error instanceof Error ? error.message : "Formato inválido"}`)
  }
}

/**
 * Extrai dados de um arquivo PDF que contém XML embutido
 * Muitos PDFs de NFS-e contêm o XML como texto dentro do PDF
 */
export async function parseNFSePDF(pdfUrl: string): Promise<DadosNFSeExtraidos> {
  try {
    // Fazer fetch do PDF
    const response = await fetch(pdfUrl)
    if (!response.ok) {
      throw new Error(`Erro ao baixar PDF: ${response.statusText}`)
    }

    const arrayBuffer = await response.arrayBuffer()
    const pdfText = new TextDecoder("utf-8").decode(arrayBuffer)

    // Tentar encontrar XML embutido no PDF
    const xmlMatch = pdfText.match(/<NFSe[\s\S]*?<\/NFSe>/)
    if (xmlMatch) {
      return parseNFSeXML(xmlMatch[0])
    }

    // Se não encontrou XML, tentar extrair dados do texto do PDF
    // (alguns PDFs têm apenas o texto renderizado, sem XML)
    throw new Error(
      "Não foi possível extrair dados automaticamente deste PDF. Por favor, preencha os campos manualmente.",
    )
  } catch (error) {
    console.error("[v0] Erro ao processar PDF da NFS-e:", error)
    throw error
  }
}

/**
 * Formata CPF/CNPJ para exibição
 */
export function formatarCpfCnpj(cpfCnpj: string): string {
  const numeros = cpfCnpj.replace(/\D/g, "")

  if (numeros.length === 11) {
    // CPF: 000.000.000-00
    return numeros.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
  }
  if (numeros.length === 14) {
    // CNPJ: 00.000.000/0000-00
    return numeros.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5")
  }

  return cpfCnpj
}

/**
 * Remove formatação de CPF/CNPJ
 */
export function limparCpfCnpj(cpfCnpj: string): string {
  return cpfCnpj.replace(/[.\-/]/g, "")
}

/**
 * Extrai apenas a chave de acesso de um arquivo XML de NFS-e
 */
export function extrairChaveAcessoXML(xmlContent: string): string | null {
  try {
    const cleanXml = xmlContent.replace(/^\uFEFF/, "")

    // Tentar extrair do atributo Id
    const chaveMatch = cleanXml.match(/Id="(?:NFS|DPS)(\d+)"/)
    if (chaveMatch) {
      return chaveMatch[1]
    }

    // Tentar extrair da tag chave de acesso
    const chaveTagMatch = cleanXml.match(/<(?:chNFSe|cNFSe|chaveAcesso)>(\d+)<\/(?:chNFSe|cNFSe|chaveAcesso)>/)
    if (chaveTagMatch) {
      return chaveTagMatch[1]
    }

    return null
  } catch (error) {
    console.error("[v0] Erro ao extrair chave de acesso do XML:", error)
    return null
  }
}

/**
 * Extrai a chave de acesso de um PDF (busca no texto)
 */
export async function extrairChaveAcessoPDF(pdfUrl: string): Promise<string | null> {
  try {
    const response = await fetch(pdfUrl)
    if (!response.ok) {
      throw new Error(`Erro ao baixar PDF: ${response.statusText}`)
    }

    const arrayBuffer = await response.arrayBuffer()
    const pdfText = new TextDecoder("utf-8").decode(arrayBuffer)

    // Procurar por chave de acesso (44 dígitos)
    const chaveMatch = pdfText.match(/(\d{44})/)
    if (chaveMatch) {
      return chaveMatch[1]
    }

    // Tentar encontrar XML embutido
    const xmlMatch = pdfText.match(/<NFSe[\s\S]*?<\/NFSe>/)
    if (xmlMatch) {
      return extrairChaveAcessoXML(xmlMatch[0])
    }

    return null
  } catch (error) {
    console.error("[v0] Erro ao extrair chave de acesso do PDF:", error)
    return null
  }
}
