// Wrapper da API da Focus NFe (emissão de NFS-e), no mesmo estilo de lib/email.ts: uma
// função exportada por operação, config lida do env, erro tipado propagado pro chamador.
// Toda chamada grava um evento em focus_nfe_eventos (nunca com certificado/senha).

import { db } from "@/lib/db"
import { focusNfeEventos } from "@/lib/db/schema"

interface FocusNfeConfig {
  baseUrl: string
  token: string
  environment: string
}

function getConfig(): FocusNfeConfig {
  const baseUrl = process.env.FOCUS_NFE_BASE_URL
  const token = process.env.FOCUS_NFE_TOKEN
  if (!baseUrl) throw new Error("FOCUS_NFE_BASE_URL não configurado")
  if (!token) throw new Error("FOCUS_NFE_TOKEN não configurado")
  return { baseUrl: baseUrl.replace(/\/$/, ""), token, environment: process.env.FOCUS_NFE_ENVIRONMENT || "sandbox" }
}

export interface FocusNfeErroDetalhe {
  codigo?: string
  mensagem: string
}

export interface FocusNfeResultado<T> {
  success: boolean
  statusCode: number
  data?: T
  mensagem?: string
  erros?: FocusNfeErroDetalhe[]
}

function extrairMensagemErro(corpo: unknown): string {
  if (!corpo) return "Erro desconhecido na Focus NFe"
  if (typeof corpo === "string") return corpo
  if (Array.isArray(corpo)) {
    const mensagens = corpo.map((e) => e?.mensagem || e?.codigo).filter(Boolean)
    return mensagens.length > 0 ? mensagens.join("; ") : "Erro desconhecido na Focus NFe"
  }
  const obj = corpo as Record<string, unknown>
  return (obj.mensagem as string) || (obj.message as string) || "Erro desconhecido na Focus NFe"
}

function extrairErros(corpo: unknown): FocusNfeErroDetalhe[] | undefined {
  if (Array.isArray(corpo)) {
    return corpo.map((e) => ({ codigo: e?.codigo, mensagem: e?.mensagem || String(e) }))
  }
  const obj = corpo as Record<string, unknown> | null
  if (obj && Array.isArray(obj.erros)) return obj.erros as FocusNfeErroDetalhe[]
  return undefined
}

// 5xx/timeout são transitórios e elegíveis a retry; 4xx é erro de validação/negócio (nosso ou
// da prefeitura) e nunca deve ser repetido automaticamente — retornamos na hora pro chamador.
const RETRY_DELAYS_MS = [1000, 3000, 9000]

async function focusRequest<T>(path: string, init: RequestInit): Promise<FocusNfeResultado<T>> {
  const { baseUrl, token } = getConfig()
  const auth = Buffer.from(`${token}:`).toString("base64")
  const url = `${baseUrl}${path}`

  for (let tentativa = 0; tentativa <= RETRY_DELAYS_MS.length; tentativa++) {
    try {
      const response = await fetch(url, {
        ...init,
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json",
          ...(init.headers || {}),
        },
      })

      const texto = await response.text()
      let corpo: unknown = null
      try {
        corpo = texto ? JSON.parse(texto) : null
      } catch {
        corpo = texto
      }

      if (response.ok) {
        return { success: true, statusCode: response.status, data: corpo as T }
      }

      if (response.status >= 400 && response.status < 500) {
        return {
          success: false,
          statusCode: response.status,
          mensagem: extrairMensagemErro(corpo),
          erros: extrairErros(corpo),
        }
      }

      // 5xx — cai pro retry abaixo.
    } catch {
      // erro de rede/timeout — cai pro retry abaixo.
    }

    if (tentativa < RETRY_DELAYS_MS.length) {
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAYS_MS[tentativa]))
    }
  }

  return {
    success: false,
    statusCode: 0,
    mensagem: "Não foi possível se comunicar com a Focus NFe agora. Tente novamente em instantes.",
  }
}

type TipoEventoFocus = "cadastro_empresa_focus" | "emissao_solicitada" | "consulta_status" | "webhook_recebido" | "erro"

async function registrarEventoFocus(params: {
  notaFiscalId?: string | null
  colaboradorId?: string | null
  tipoEvento: TipoEventoFocus
  statusHttp?: number
  payload?: unknown
  mensagem?: string
}) {
  try {
    await db.insert(focusNfeEventos).values({
      notaFiscalId: params.notaFiscalId || null,
      colaboradorId: params.colaboradorId || null,
      tipoEvento: params.tipoEvento,
      statusHttp: params.statusHttp,
      payload: (params.payload ?? null) as any,
      mensagem: params.mensagem,
    })
  } catch (error) {
    console.error("[v0] Erro ao registrar evento Focus NFe:", error)
  }
}

const REGIME_TRIBUTARIO_FOCUS: Record<string, number> = {
  simples_nacional: 1,
  simples_nacional_excesso: 2,
  regime_normal: 3,
}

export interface EnderecoFocus {
  logradouro: string
  numero: string
  complemento?: string | null
  bairro: string
  cep: string
  cidade: string
  uf: string
  codigoMunicipioIbge: string
}

export interface CadastroEmpresaFocusParams {
  cnpj: string
  razaoSocial: string
  nomeFantasia?: string | null
  inscricaoMunicipal: string
  regimeTributario: "simples_nacional" | "simples_nacional_excesso" | "regime_normal"
  endereco: EnderecoFocus
  certificadoBase64: string
  senhaCertificado: string
  colaboradorId: string
}

/** Cadastra o CNPJ do prestador na Focus NFe (pré-requisito pra emitir NFS-e por API).
 *  O certificado/senha só existem dentro desta função — nunca são retornados nem logados. */
export async function cadastrarEmpresaFocus(params: CadastroEmpresaFocusParams): Promise<FocusNfeResultado<unknown>> {
  const payload = {
    nome: params.razaoSocial,
    nome_fantasia: params.nomeFantasia || params.razaoSocial,
    cnpj: params.cnpj.replace(/\D/g, ""),
    inscricao_municipal: params.inscricaoMunicipal,
    regime_tributario: REGIME_TRIBUTARIO_FOCUS[params.regimeTributario] ?? 1,
    habilita_nfse: true,
    logradouro: params.endereco.logradouro,
    numero: params.endereco.numero,
    complemento: params.endereco.complemento || undefined,
    bairro: params.endereco.bairro,
    cep: params.endereco.cep.replace(/\D/g, ""),
    municipio: params.endereco.cidade,
    uf: params.endereco.uf,
    codigo_municipio: params.endereco.codigoMunicipioIbge,
    arquivo_certificado_base64: params.certificadoBase64,
    senha_certificado: params.senhaCertificado,
  }

  const resultado = await focusRequest<unknown>("/v2/empresas", { method: "POST", body: JSON.stringify(payload) })

  const { arquivo_certificado_base64, senha_certificado, ...payloadSanitizado } = payload
  await registrarEventoFocus({
    colaboradorId: params.colaboradorId,
    tipoEvento: "cadastro_empresa_focus",
    statusHttp: resultado.statusCode,
    payload: {
      request: payloadSanitizado,
      response: resultado.success ? resultado.data : { mensagem: resultado.mensagem, erros: resultado.erros },
    },
    mensagem: resultado.success ? "Empresa cadastrada na Focus NFe" : resultado.mensagem,
  })

  return resultado
}

export interface EmitirNfsePayload {
  prestadorCnpj: string
  prestadorInscricaoMunicipal: string
  tomador: {
    cnpj: string
    razaoSocial: string
    email?: string | null
    endereco: EnderecoFocus
  }
  servico: {
    discriminacao: string
    codigoServico: string
    aliquota: number
    issRetido: boolean
    valor: number
    codigoMunicipioPrestacao: string
  }
  optanteSimplesNacional: boolean
}

/** Solicita a emissão de uma NFS-e. `ref` é a nossa referência única (idempotente do lado da
 *  Focus — reenviar o mesmo ref não duplica). Nomes exatos de campo conferidos contra a doc
 *  oficial da Focus NFe v2 / sandbox antes de ir pra produção — ver plano da fase 6. */
export async function emitirNfse(
  ref: string,
  payload: EmitirNfsePayload,
  contexto: { notaFiscalId: string; colaboradorId: string },
): Promise<FocusNfeResultado<unknown>> {
  const corpo = {
    data_emissao: new Date().toISOString(),
    prestador: {
      cnpj: payload.prestadorCnpj.replace(/\D/g, ""),
      inscricao_municipal: payload.prestadorInscricaoMunicipal,
    },
    tomador: {
      cnpj: payload.tomador.cnpj.replace(/\D/g, ""),
      razao_social: payload.tomador.razaoSocial,
      email: payload.tomador.email || undefined,
      endereco: {
        logradouro: payload.tomador.endereco.logradouro,
        numero: payload.tomador.endereco.numero,
        complemento: payload.tomador.endereco.complemento || undefined,
        bairro: payload.tomador.endereco.bairro,
        cep: payload.tomador.endereco.cep.replace(/\D/g, ""),
        codigo_municipio: payload.tomador.endereco.codigoMunicipioIbge,
        uf: payload.tomador.endereco.uf,
      },
    },
    servico: {
      discriminacao: payload.servico.discriminacao,
      item_lista_servico: payload.servico.codigoServico,
      aliquota: payload.servico.aliquota,
      iss_retido: payload.servico.issRetido,
      valor_servicos: payload.servico.valor,
      codigo_municipio: payload.servico.codigoMunicipioPrestacao,
    },
    optante_simples_nacional: payload.optanteSimplesNacional,
  }

  const resultado = await focusRequest<unknown>(`/v2/nfse?ref=${encodeURIComponent(ref)}`, {
    method: "POST",
    body: JSON.stringify(corpo),
  })

  await registrarEventoFocus({
    notaFiscalId: contexto.notaFiscalId,
    colaboradorId: contexto.colaboradorId,
    tipoEvento: "emissao_solicitada",
    statusHttp: resultado.statusCode,
    payload: {
      request: corpo,
      response: resultado.success ? resultado.data : { mensagem: resultado.mensagem, erros: resultado.erros },
    },
    mensagem: resultado.success ? "Emissão solicitada" : resultado.mensagem,
  })

  return resultado
}

/** Consulta o status atual de uma emissão pelo ref. Usada tanto pelo webhook (que nunca confia
 *  cegamente no corpo recebido, sempre confirma aqui) quanto pelo polling de fallback. */
export async function consultarNfse(
  ref: string,
  contexto?: { notaFiscalId?: string; colaboradorId?: string },
): Promise<FocusNfeResultado<unknown>> {
  const resultado = await focusRequest<unknown>(`/v2/nfse/${encodeURIComponent(ref)}`, { method: "GET" })

  await registrarEventoFocus({
    notaFiscalId: contexto?.notaFiscalId,
    colaboradorId: contexto?.colaboradorId,
    tipoEvento: "consulta_status",
    statusHttp: resultado.statusCode,
    payload: resultado.success ? resultado.data : { mensagem: resultado.mensagem },
    mensagem: resultado.success ? `status consultado` : resultado.mensagem,
  })

  return resultado
}

/** Baixa um arquivo (PDF/XML) retornado pela Focus pra reenviar pro nosso próprio GCS —
 *  o app nunca referencia URLs externas diretamente em campos persistidos (mesmo padrão já
 *  usado pra PDF de contrato, ver lib/gcs.ts). */
export async function baixarArquivoFocus(url: string): Promise<Buffer | null> {
  try {
    const { token } = getConfig()
    const auth = Buffer.from(`${token}:`).toString("base64")
    const response = await fetch(url, { headers: { Authorization: `Basic ${auth}` } })
    if (!response.ok) return null
    const arrayBuffer = await response.arrayBuffer()
    return Buffer.from(arrayBuffer)
  } catch (error) {
    console.error("[v0] Erro ao baixar arquivo da Focus NFe:", error)
    return null
  }
}

export { registrarEventoFocus }
