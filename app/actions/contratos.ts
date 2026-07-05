"use server"

import crypto from "crypto"
import { and, desc, eq, isNull, or, sql } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import {
  contracts,
  contractSigners,
  contractSignatureEvents,
  contractAttachments,
  contractTemplates,
  colaboradores,
  empresas,
  equipes,
} from "@/lib/db/schema"
import { toContratoDTO, toEmpresaDTO } from "@/lib/db/mappers"
import { getUsuarioLogado } from "@/lib/auth-utils"
import { gerarToken, hashToken, gerarExpiracao } from "@/lib/contracts/token"
import { montarDadosContrato } from "@/lib/contracts/montar-dados-contrato"
import { gerarPdfRascunho } from "@/lib/pdf/contrato-pdf"
import { uploadFile } from "@/lib/gcs"
import { sendContratoConviteEmail } from "@/lib/email"

const ADMIN_ROLES = ["Adm", "Financeiro"]
const TEMPLATE_PADRAO_SLUG = "prestacao-servicos-pj-padrao"

async function getEmpresaOuFalha(empresaId: string) {
  const [row] = await db.select().from(empresas).where(eq(empresas.id, empresaId))
  if (!row) throw new Error("Empresa não encontrada")
  return toEmpresaDTO(row)
}

async function exigirAdmin() {
  const usuario = await getUsuarioLogado()
  if (!usuario || !ADMIN_ROLES.includes(usuario.tipo_acesso)) {
    throw new Error("Sem permissão para acessar contratos")
  }
  return usuario
}

function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor)
}

async function getOrCriarTemplatePadrao(empresaId: string) {
  const [existente] = await db
    .select()
    .from(contractTemplates)
    .where(and(eq(contractTemplates.slug, TEMPLATE_PADRAO_SLUG), eq(contractTemplates.empresaId, empresaId)))
  if (existente) return existente

  const [novo] = await db
    .insert(contractTemplates)
    .values({
      empresaId,
      nome: "Prestação de Serviços PJ – Padrão",
      slug: TEMPLATE_PADRAO_SLUG,
      corpo: "Modelo padrão de contrato de prestação de serviços PJ.",
      camposVariaveis: [
        "prestador_nome",
        "prestador_cpf_cnpj",
        "prestador_email",
        "prestador_endereco",
        "tipo_servico",
        "valor",
        "prazo",
        "data_inicio",
        "clausulas_adicionais",
      ],
    })
    .returning()
  return novo
}

async function gerarNumeroUnico(): Promise<string> {
  const ano = new Date().getFullYear()
  for (let tentativa = 0; tentativa < 8; tentativa++) {
    const sufixo = crypto.randomInt(100000, 999999)
    const numero = `FLW-${ano}-${sufixo}`
    const [existente] = await db.select({ id: contracts.id }).from(contracts).where(eq(contracts.numero, numero))
    if (!existente) return numero
  }
  throw new Error("Não foi possível gerar um número de contrato único")
}

export interface ContratoFormData {
  prestador_nome: string
  prestador_cpf_cnpj: string
  prestador_email: string
  prestador_endereco?: string
  tipo_servico: string
  valor: number
  prazo: string
  data_inicio: string
  clausulas_adicionais?: string
  equipe_id?: string
  data_termino?: string
  renovacao_automatica?: boolean
  tipo_renovacao?: "automatica" | "mediante_aviso" | "sem_renovacao"
  periodo_renovacao_meses?: number
}

// Dados da própria empresa do admin logado — usado pro preview do wizard de novo contrato.
export async function obterEmpresaAtual() {
  const usuario = await exigirAdmin()
  return getEmpresaOuFalha(usuario.empresa_id!)
}

export async function listarContratos() {
  const usuario = await exigirAdmin()
  const rows = await db
    .select()
    .from(contracts)
    .where(usuario.tipo_acesso === "SuperAdmin" ? undefined : eq(contracts.empresaId, usuario.empresa_id!))
    .orderBy(desc(contracts.createdAt))
  return rows.map(toContratoDTO)
}

export async function getContratoById(id: string) {
  const usuario = await exigirAdmin()
  const row = await db.query.contracts.findFirst({
    where: eq(contracts.id, id),
    with: {
      signers: true,
      events: { orderBy: [desc(contractSignatureEvents.createdAt)] },
      criadoPorColaborador: true,
    },
  })
  if (!row) return null
  if (usuario.tipo_acesso !== "SuperAdmin" && row.empresaId !== usuario.empresa_id) {
    throw new Error("Sem permissão para acessar este contrato")
  }
  return toContratoDTO(row)
}

export async function criarContrato(formData: ContratoFormData) {
  const usuario = await exigirAdmin()
  const template = await getOrCriarTemplatePadrao(usuario.empresa_id!)
  const numero = await gerarNumeroUnico()

  // Nunca confiar que equipe_id vindo do formulário pertence à empresa de quem está criando.
  if (formData.equipe_id && usuario.tipo_acesso !== "SuperAdmin") {
    const [equipeAlvo] = await db.select({ empresaId: equipes.empresaId }).from(equipes).where(eq(equipes.id, formData.equipe_id))
    if (!equipeAlvo || equipeAlvo.empresaId !== usuario.empresa_id) {
      return { success: false, error: "Equipe inválida" }
    }
  }

  let contrato
  try {
    ;[contrato] = await db
      .insert(contracts)
      .values({
        empresaId: usuario.empresa_id!,
        templateId: template.id,
        numero,
        equipeId: formData.equipe_id || null,
        prestadorNome: formData.prestador_nome,
        prestadorCpfCnpj: formData.prestador_cpf_cnpj,
        prestadorEmail: formData.prestador_email,
        prestadorEndereco: formData.prestador_endereco || null,
        tipoServico: formData.tipo_servico,
        valor: String(formData.valor),
        prazo: formData.prazo,
        dataInicio: formData.data_inicio,
        dataTermino: formData.data_termino || null,
        renovacaoAutomatica: formData.renovacao_automatica ?? false,
        tipoRenovacao: formData.tipo_renovacao || null,
        periodoRenovacaoMeses: formData.periodo_renovacao_meses ?? null,
        clausulasAdicionais: formData.clausulas_adicionais || null,
        status: "draft",
        criadoPor: usuario.id,
      })
      .returning()
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Erro ao criar contrato" }
  }

  await db.insert(contractSignatureEvents).values({
    contractId: contrato.id,
    tipoEvento: "criado",
    contractVersao: contrato.versaoAtual,
  })

  try {
    const empresa = await getEmpresaOuFalha(usuario.empresa_id!)
    const dados = montarDadosContrato(toContratoDTO(contrato) as any, empresa)
    const pdfBuffer = await gerarPdfRascunho(dados)
    const objectPath = `contratos/${contrato.id}/v${contrato.versaoAtual}-rascunho.pdf`
    await uploadFile(pdfBuffer, objectPath, "application/pdf")
    const hash = crypto.createHash("sha256").update(pdfBuffer).digest("hex")

    await db.insert(contractAttachments).values({
      contractId: contrato.id,
      tipo: "rascunho",
      versao: contrato.versaoAtual,
      objectPath,
      hashSha256: hash,
      tamanhoBytes: pdfBuffer.length,
      geradoPor: usuario.id,
    })

    await db
      .update(contracts)
      .set({ pdfDraftPath: objectPath, updatedAt: new Date() })
      .where(eq(contracts.id, contrato.id))
  } catch (error) {
    console.error("[contratos] Erro ao gerar PDF de rascunho:", error)
  }

  revalidatePath("/contratos")
  return { success: true, id: contrato.id }
}

export async function enviarContrato(id: string) {
  const usuario = await exigirAdmin()

  const [contrato] = await db.select().from(contracts).where(eq(contracts.id, id))
  if (!contrato || contrato.status !== "draft") {
    return { success: false, error: "Contrato não está em rascunho" }
  }
  if (usuario.tipo_acesso !== "SuperAdmin" && contrato.empresaId !== usuario.empresa_id) {
    return { success: false, error: "Sem permissão para acessar este contrato" }
  }

  const [colaboradorExistente] = await db
    .select({ id: colaboradores.id, empresaId: colaboradores.empresaId, senhaHash: colaboradores.senhaHash })
    .from(colaboradores)
    .where(eq(colaboradores.email, contrato.prestadorEmail))

  // colaboradores.email é único na plataforma inteira (não só por empresa) — se o e-mail já
  // pertence a um colaborador de OUTRA empresa, não dá pra vincular nem pra criar um novo.
  if (colaboradorExistente && colaboradorExistente.empresaId && colaboradorExistente.empresaId !== contrato.empresaId) {
    return { success: false, error: "Este e-mail já está cadastrado em outra empresa da plataforma." }
  }

  // Contrato é a porta de entrada do colaborador na plataforma: se ainda não existe conta
  // pra esse e-mail, ela é criada agora (sem senha — definida pelo próprio prestador no link
  // de assinatura), já vinculada à equipe escolhida no wizard (que já define supervisor/gerente
  // via equipes.supervisorId/gerentes_equipes, sem precisar de tabela nova).
  let colaboradorId = colaboradorExistente?.id
  const precisaDefinirSenha = !colaboradorExistente?.senhaHash
  if (!colaboradorId) {
    try {
      const [novoColaborador] = await db
        .insert(colaboradores)
        .values({
          empresaId: contrato.empresaId,
          nomeCompleto: contrato.prestadorNome,
          email: contrato.prestadorEmail,
          cnpj: contrato.prestadorCpfCnpj,
          equipeId: contrato.equipeId,
          salario: contrato.valor,
          tipoAcesso: "Colaborador",
          senhaHash: null,
        })
        .returning()
      colaboradorId = novoColaborador.id
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Erro ao criar acesso do prestador" }
    }

    await db.update(contracts).set({ prestadorColaboradorId: colaboradorId }).where(eq(contracts.id, contrato.id))
  }

  const token = gerarToken()
  const tokenHash = hashToken(token)
  const tokenExpiraEm = gerarExpiracao(7)

  let signer
  try {
    ;[signer] = await db
      .insert(contractSigners)
      .values({
        contractId: contrato.id,
        colaboradorId,
        nome: contrato.prestadorNome,
        email: contrato.prestadorEmail,
        cpfCnpj: contrato.prestadorCpfCnpj,
        status: "pendente",
        tokenHash,
        tokenExpiraEm,
      })
      .returning()
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Erro ao gerar link de assinatura" }
  }

  await db
    .update(contracts)
    .set({ status: "sent", enviadoEm: new Date(), expiraEm: tokenExpiraEm, updatedAt: new Date() })
    .where(eq(contracts.id, id))

  await db.insert(contractSignatureEvents).values({
    contractId: id,
    signerId: signer.id,
    tipoEvento: "enviado",
    tokenHash,
    contractVersao: contrato.versaoAtual,
  })

  const baseUrl = process.env.APP_BASE_URL || ""
  try {
    const empresa = await getEmpresaOuFalha(contrato.empresaId)
    await sendContratoConviteEmail({
      to: contrato.prestadorEmail,
      prestadorNome: contrato.prestadorNome,
      tipoServico: contrato.tipoServico,
      valorFormatado: formatarMoeda(Number(contrato.valor)),
      signingUrl: `${baseUrl}/contratos/assinar/${token}`,
      expiraEmFormatado: new Intl.DateTimeFormat("pt-BR").format(tokenExpiraEm),
      empresa: { nome: empresa.nome_fantasia || empresa.razao_social, razaoSocial: empresa.razao_social, cnpj: empresa.cnpj },
      precisaDefinirSenha,
    })
  } catch (error) {
    console.error("[contratos] Erro ao enviar e-mail de convite:", error)
  }

  revalidatePath("/contratos")
  revalidatePath(`/contratos/${id}`)
  return { success: true }
}

export async function reenviarContrato(id: string) {
  const usuario = await exigirAdmin()

  const [contrato] = await db.select().from(contracts).where(eq(contracts.id, id))
  if (!contrato || !["sent", "viewed", "expired"].includes(contrato.status)) {
    return { success: false, error: "Contrato não pode ser reenviado neste status" }
  }
  if (usuario.tipo_acesso !== "SuperAdmin" && contrato.empresaId !== usuario.empresa_id) {
    return { success: false, error: "Sem permissão para acessar este contrato" }
  }

  const [signer] = await db.select().from(contractSigners).where(eq(contractSigners.contractId, id))
  if (!signer) return { success: false, error: "Signatário não encontrado" }

  let precisaDefinirSenha = true
  if (signer.colaboradorId) {
    const [colaboradorVinculado] = await db
      .select({ senhaHash: colaboradores.senhaHash })
      .from(colaboradores)
      .where(eq(colaboradores.id, signer.colaboradorId))
    precisaDefinirSenha = !colaboradorVinculado?.senhaHash
  }

  const token = gerarToken()
  const tokenHash = hashToken(token)
  const tokenExpiraEm = gerarExpiracao(7)

  await db
    .update(contractSigners)
    .set({ tokenHash, tokenExpiraEm, status: "pendente", updatedAt: new Date() })
    .where(eq(contractSigners.id, signer.id))

  await db
    .update(contracts)
    .set({ status: "sent", expiraEm: tokenExpiraEm, updatedAt: new Date() })
    .where(eq(contracts.id, id))

  await db.insert(contractSignatureEvents).values({
    contractId: id,
    signerId: signer.id,
    tipoEvento: "reenviado",
    tokenHash,
    contractVersao: contrato.versaoAtual,
  })

  const baseUrl = process.env.APP_BASE_URL || ""
  try {
    const empresa = await getEmpresaOuFalha(contrato.empresaId)
    await sendContratoConviteEmail({
      to: contrato.prestadorEmail,
      prestadorNome: contrato.prestadorNome,
      tipoServico: contrato.tipoServico,
      valorFormatado: formatarMoeda(Number(contrato.valor)),
      signingUrl: `${baseUrl}/contratos/assinar/${token}`,
      expiraEmFormatado: new Intl.DateTimeFormat("pt-BR").format(tokenExpiraEm),
      empresa: { nome: empresa.nome_fantasia || empresa.razao_social, razaoSocial: empresa.razao_social, cnpj: empresa.cnpj },
      precisaDefinirSenha,
    })
  } catch (error) {
    console.error("[contratos] Erro ao reenviar e-mail de convite:", error)
  }

  revalidatePath("/contratos")
  revalidatePath(`/contratos/${id}`)
  return { success: true }
}

// Lado do prestador — não usa exigirAdmin(), escopo é sempre o próprio usuário logado.
export async function listarContratosDoUsuario() {
  const usuario = await getUsuarioLogado()
  if (!usuario) throw new Error("Não autenticado")

  // Vínculo retroativo: liga contratos enviados por e-mail antes de a conta existir.
  await db
    .update(contractSigners)
    .set({ colaboradorId: usuario.id, updatedAt: new Date() })
    .where(and(isNull(contractSigners.colaboradorId), sql`lower(${contractSigners.email}) = lower(${usuario.email})`))

  const rows = await db.query.contractSigners.findMany({
    where: or(
      eq(contractSigners.colaboradorId, usuario.id),
      sql`lower(${contractSigners.email}) = lower(${usuario.email})`,
    ),
    with: { contract: true },
    orderBy: [desc(contractSigners.createdAt)],
  })

  return rows.filter((r) => r.contract).map((r) => toContratoDTO(r.contract))
}

// Histórico contratual completo de um colaborador — usado na aba "Contratos" do perfil dele.
export async function listarContratosDoColaborador(colaboradorId: string) {
  const usuario = await exigirAdmin()

  const [colaboradorAlvo] = await db
    .select({ id: colaboradores.id, empresaId: colaboradores.empresaId })
    .from(colaboradores)
    .where(eq(colaboradores.id, colaboradorId))

  if (!colaboradorAlvo) return []
  if (usuario.tipo_acesso !== "SuperAdmin" && colaboradorAlvo.empresaId !== usuario.empresa_id) {
    throw new Error("Sem permissão para acessar este prestador")
  }

  const rows = await db.query.contracts.findMany({
    where: eq(contracts.prestadorColaboradorId, colaboradorId),
    orderBy: [desc(contracts.createdAt)],
    with: {
      amendments: { orderBy: (amendments, { asc }) => [asc(amendments.versao)] },
      events: { orderBy: [desc(contractSignatureEvents.createdAt)] },
    },
  })

  return rows.map(toContratoDTO)
}

export async function cancelarContrato(id: string, motivo?: string) {
  const usuario = await exigirAdmin()

  const [contrato] = await db.select().from(contracts).where(eq(contracts.id, id))
  if (!contrato || ["signed", "cancelled"].includes(contrato.status)) {
    return { success: false, error: "Contrato não pode ser cancelado neste status" }
  }
  if (usuario.tipo_acesso !== "SuperAdmin" && contrato.empresaId !== usuario.empresa_id) {
    return { success: false, error: "Sem permissão para acessar este contrato" }
  }

  await db
    .update(contracts)
    .set({ status: "cancelled", canceladoEm: new Date(), canceladoPor: usuario.id, updatedAt: new Date() })
    .where(eq(contracts.id, id))

  await db.insert(contractSignatureEvents).values({
    contractId: id,
    tipoEvento: "cancelado",
    contractVersao: contrato.versaoAtual,
    detalhes: motivo ? { motivo } : undefined,
  })

  revalidatePath("/contratos")
  revalidatePath(`/contratos/${id}`)
  return { success: true }
}
