// Formatação de dados vinda de app/actions (DTOs snake_case, mesmo shape usado no resto do app).
export interface ContratoParaMontagem {
  numero: string
  prestador_nome: string
  prestador_cpf_cnpj: string
  prestador_email: string
  prestador_endereco?: string | null
  tipo_servico: string
  valor: number
  prazo: string
  data_inicio: string | Date
  clausulas_adicionais?: string | null
  versao_atual: number
}

// A empresa CLIENTE (contratante real) — nunca o FluWork, que é só o operador da plataforma.
export interface EmpresaParaMontagem {
  razao_social: string
  nome_fantasia?: string | null
  cnpj: string
  email?: string | null
  endereco?: string | null
  logo_url?: string | null
  representante_nome?: string | null
  representante_documento?: string | null
  representante_cargo?: string | null
  rodape_contrato?: string | null
}

export interface AssinaturaParaMontagem {
  nome: string
  cpfCnpj: string
  email: string
  assinadoEm: string | Date
  ip?: string | null
}

export interface DadosContrato {
  empresa: {
    razaoSocial: string
    nomeFantasia?: string
    cnpj: string
    email?: string
    endereco: string
    logoUrl?: string
    representanteNome?: string
    representanteDocumento?: string
    representanteCargo?: string
    rodapeContrato?: string
  }
  numero: string
  prestador: {
    nome: string
    cpfCnpj: string
    email: string
    endereco: string
  }
  tipoServico: string
  valorFormatado: string
  prazo: string
  dataInicioFormatada: string
  versaoAtual: number
  clausulas: string[]
  clausulasAdicionais?: string
  assinatura?: {
    nome: string
    cpfCnpj: string
    email: string
    dataHoraFormatada: string
    ip: string
  }
}

function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor)
}

function formatarData(data: string | Date): string {
  const d = typeof data === "string" ? new Date(data) : data
  return new Intl.DateTimeFormat("pt-BR").format(d)
}

function formatarDataHora(data: string | Date): string {
  const d = typeof data === "string" ? new Date(data) : data
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "medium", timeZone: "America/Sao_Paulo" }).format(d)
}

/**
 * Monta os dados estruturados do contrato — usado tanto pelo preview em tela
 * (components/contratos/contrato-preview.tsx) quanto pelo gerador de PDF
 * (lib/pdf/contrato-pdf.tsx), pra nunca divergirem.
 *
 * Texto das cláusulas é placeholder — precisa de revisão jurídica antes de valer
 * como documento real (ver plano de implementação, seção "Pendências").
 */
export function montarDadosContrato(
  contrato: ContratoParaMontagem,
  empresa: EmpresaParaMontagem,
  assinatura?: AssinaturaParaMontagem,
): DadosContrato {
  const valorFormatado = formatarMoeda(contrato.valor)
  const dataInicioFormatada = formatarData(contrato.data_inicio)
  const endereco = contrato.prestador_endereco?.trim() || "Não informado"
  const enderecoEmpresa = empresa.endereco?.trim() || "não informado"
  const nomeFantasiaEmpresa = empresa.nome_fantasia?.trim()
  const representante =
    empresa.representante_nome?.trim()
      ? `, neste ato representada por ${empresa.representante_nome.trim()}${empresa.representante_cargo?.trim() ? `, ${empresa.representante_cargo.trim()}` : ""}`
      : ""

  const clausulas = [
    `CONTRATANTE: ${empresa.razao_social}, inscrita no CNPJ sob o nº ${empresa.cnpj}${nomeFantasiaEmpresa ? `, com nome fantasia ${nomeFantasiaEmpresa}` : ""}, com sede em ${enderecoEmpresa}${representante}, doravante denominada CONTRATANTE.`,
    `CONTRATADO(A): ${contrato.prestador_nome}, inscrito(a) no CPF/CNPJ sob o nº ${contrato.prestador_cpf_cnpj}, e-mail ${contrato.prestador_email}, endereço ${endereco}, doravante denominado(a) CONTRATADO(A).`,
    `CLÁUSULA 1ª — DO OBJETO: O presente contrato tem por objeto a prestação de serviços de ${contrato.tipo_servico} pelo(a) CONTRATADO(A) em favor da CONTRATANTE, na qualidade de prestador(a) de serviços pessoa jurídica, sem vínculo empregatício de qualquer natureza.`,
    `CLÁUSULA 2ª — DO PRAZO: O presente contrato vigorará pelo prazo de ${contrato.prazo}, com início em ${dataInicioFormatada}, podendo ser prorrogado mediante acordo entre as partes.`,
    `CLÁUSULA 3ª — DO VALOR E FORMA DE PAGAMENTO: Pela prestação dos serviços, a CONTRATANTE pagará ao(à) CONTRATADO(A) o valor de ${valorFormatado}, mediante emissão de nota fiscal de serviços, nos termos e condições acordados entre as partes.`,
    `CLÁUSULA 4ª — DAS OBRIGAÇÕES DO(A) CONTRATADO(A): O(A) CONTRATADO(A) obriga-se a prestar os serviços contratados com zelo, diligência e em conformidade com os padrões técnicos aplicáveis, arcando com todos os encargos tributários, previdenciários e trabalhistas decorrentes de sua atividade como prestador(a) autônomo(a)/pessoa jurídica.`,
    `CLÁUSULA 5ª — DA RESCISÃO: O presente contrato poderá ser rescindido por qualquer das partes, mediante aviso prévio por escrito, sem prejuízo das obrigações já constituídas até a data da rescisão.`,
    `CLÁUSULA 6ª — DA CONFIDENCIALIDADE: As partes se comprometem a manter sigilo sobre todas as informações confidenciais a que tiverem acesso em razão da execução deste contrato.`,
    `CLÁUSULA 7ª — DO FORO: As partes elegem o foro da comarca de ${enderecoEmpresa} para dirimir quaisquer controvérsias oriundas do presente contrato.`,
  ]

  const result: DadosContrato = {
    empresa: {
      razaoSocial: empresa.razao_social,
      nomeFantasia: nomeFantasiaEmpresa || undefined,
      cnpj: empresa.cnpj,
      email: empresa.email || undefined,
      endereco: enderecoEmpresa,
      logoUrl: empresa.logo_url || undefined,
      representanteNome: empresa.representante_nome || undefined,
      representanteDocumento: empresa.representante_documento || undefined,
      representanteCargo: empresa.representante_cargo || undefined,
      rodapeContrato: empresa.rodape_contrato || undefined,
    },
    numero: contrato.numero,
    prestador: {
      nome: contrato.prestador_nome,
      cpfCnpj: contrato.prestador_cpf_cnpj,
      email: contrato.prestador_email,
      endereco,
    },
    tipoServico: contrato.tipo_servico,
    valorFormatado,
    prazo: contrato.prazo,
    dataInicioFormatada,
    versaoAtual: contrato.versao_atual,
    clausulas,
    clausulasAdicionais: contrato.clausulas_adicionais?.trim() || undefined,
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
