"use server"

import crypto from "crypto"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { contracts, contractAmendments, contractSigners, contractSignatureEvents, contractAttachments, colaboradores, empresas } from "@/lib/db/schema"
import { toContratoAditivoDTO, toEmpresaDTO } from "@/lib/db/mappers"
import { getUsuarioLogado } from "@/lib/auth-utils"
import { gerarToken, hashToken, gerarExpiracao } from "@/lib/contracts/token"
import { montarDadosAditivo } from "@/lib/contracts/montar-dados-aditivo"
import { gerarPdfAditivo } from "@/lib/pdf/aditivo-pdf"
import { uploadFile } from "@/lib/gcs"
import { sendAditivoConviteEmail } from "@/lib/email"

const ADMIN_ROLES = ["Adm", "Financeiro"]

const TIPO_LABEL: Record<string, string> = {
  aditivo_salarial: "Aditivo Salarial",
  aditivo_clausulas: "Alteração de Cláusulas",
  renovacao: "Renovação Contratual",
  outro: "Aditivo Contratual",
}

async function exigirAdmin() {
  const usuario = await getUsuarioLogado()
  if (!usuario || !ADMIN_ROLES.includes(usuario.tipo_acesso)) {
    throw new Error("Sem permissão para acessar aditivos")
  }
  return usuario
}

async function getContratoOuFalha(contractId: string, usuario: NonNullable<Awaited<ReturnType<typeof getUsuarioLogado>>>) {
  const [contrato] = await db.select().from(contracts).where(eq(contracts.id, contractId))
  if (!contrato) throw new Error("Contrato não encontrado")
  if (usuario.tipo_acesso !== "SuperAdmin" && contrato.empresaId !== usuario.empresa_id) {
    throw new Error("Sem permissão para acessar este contrato")
  }
  return contrato
}

export interface AditivoFormData {
  tipo: "aditivo_salarial" | "aditivo_clausulas" | "renovacao" | "outro"
  descricao?: string
  novo_valor?: number
  nova_data_termino?: string
  novas_clausulas?: string
}

export async function listarAditivosDoContrato(contractId: string) {
  const usuario = await exigirAdmin()
  await getContratoOuFalha(contractId, usuario)

  const rows = await db.query.contractAmendments.findMany({
    where: eq(contractAmendments.contractId, contractId),
    orderBy: (amendments, { asc }) => [asc(amendments.versao)],
    with: { events: { orderBy: (events, { desc }) => [desc(events.createdAt)] } },
  })
  return rows.map(toContratoAditivoDTO)
}

export async function criarAditivo(contractId: string, formData: AditivoFormData) {
  const usuario = await exigirAdmin()
  const contrato = await getContratoOuFalha(contractId, usuario)

  // Só faz sentido criar aditivo sobre um contrato já assinado/vigente — antes disso, o
  // fluxo correto é apenas editar o rascunho, não gerar uma nova versão.
  if (contrato.status !== "signed") {
    return { success: false, error: "Só é possível criar um aditivo em contratos assinados" }
  }

  const camposAlterados: Record<string, { de: unknown; para: unknown }> = {}
  if (formData.novo_valor != null) camposAlterados.valor = { de: contrato.valor, para: String(formData.novo_valor) }
  if (formData.nova_data_termino) camposAlterados.data_termino = { de: contrato.dataTermino, para: formData.nova_data_termino }
  if (formData.novas_clausulas) camposAlterados.clausulas = { de: contrato.clausulasAdicionais, para: formData.novas_clausulas }

  if (Object.keys(camposAlterados).length === 0) {
    return { success: false, error: "Informe ao menos uma alteração para o aditivo" }
  }

  const novaVersao = contrato.versaoAtual + 1

  let aditivo
  try {
    ;[aditivo] = await db
      .insert(contractAmendments)
      .values({
        contractId: contrato.id,
        tipo: formData.tipo,
        versao: novaVersao,
        descricao: formData.descricao || null,
        camposAlterados,
        novoValor: formData.novo_valor != null ? String(formData.novo_valor) : null,
        novaDataTermino: formData.nova_data_termino || null,
        novasClausulas: formData.novas_clausulas || null,
        status: "draft",
        criadoPor: usuario.id,
      })
      .returning()
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Erro ao criar aditivo" }
  }

  await db.update(contracts).set({ versaoAtual: novaVersao, updatedAt: new Date() }).where(eq(contracts.id, contrato.id))

  await db.insert(contractSignatureEvents).values({
    contractId: contrato.id,
    amendmentId: aditivo.id,
    tipoEvento: "aditivo_criado",
    contractVersao: novaVersao,
    atorColaboradorId: usuario.id,
  })

  try {
    const [empresaRow] = await db.select().from(empresas).where(eq(empresas.id, contrato.empresaId))
    const empresa = toEmpresaDTO(empresaRow)
    const dados = montarDadosAditivo(toContratoAditivoDTO(aditivo) as any, contrato as any, empresa)
    const pdfBuffer = await gerarPdfAditivo(dados)
    const objectPath = `contratos/${contrato.id}/v${novaVersao}-aditivo-rascunho.pdf`
    await uploadFile(pdfBuffer, objectPath, "application/pdf")
    const hash = crypto.createHash("sha256").update(pdfBuffer).digest("hex")

    await db.insert(contractAttachments).values({
      contractId: contrato.id,
      tipo: "rascunho",
      versao: novaVersao,
      objectPath,
      hashSha256: hash,
      tamanhoBytes: pdfBuffer.length,
      geradoPor: usuario.id,
    })

    await db.update(contractAmendments).set({ pdfPath: objectPath, updatedAt: new Date() }).where(eq(contractAmendments.id, aditivo.id))
  } catch (error) {
    console.error("[aditivos] Erro ao gerar PDF de rascunho do aditivo:", error)
  }

  revalidatePath(`/contratos/${contrato.id}`)
  return { success: true, id: aditivo.id }
}

export async function enviarAditivo(aditivoId: string) {
  const usuario = await exigirAdmin()

  const [aditivo] = await db.select().from(contractAmendments).where(eq(contractAmendments.id, aditivoId))
  if (!aditivo || aditivo.status !== "draft") {
    return { success: false, error: "Aditivo não está em rascunho" }
  }

  const contrato = await getContratoOuFalha(aditivo.contractId, usuario)

  if (!contrato.prestadorColaboradorId) {
    return { success: false, error: "Este contrato não tem um prestador com acesso à plataforma vinculado" }
  }

  const [colaborador] = await db.select().from(colaboradores).where(eq(colaboradores.id, contrato.prestadorColaboradorId))
  if (!colaborador || !colaborador.email) {
    return { success: false, error: "Prestador vinculado não encontrado" }
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
        amendmentId: aditivo.id,
        colaboradorId: colaborador.id,
        nome: colaborador.nomeCompleto,
        email: colaborador.email,
        cpfCnpj: contrato.prestadorCpfCnpj,
        status: "pendente",
        tokenHash,
        tokenExpiraEm,
      })
      .returning()
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Erro ao gerar link de assinatura do aditivo" }
  }

  await db
    .update(contractAmendments)
    .set({ status: "sent", enviadoEm: new Date(), updatedAt: new Date() })
    .where(eq(contractAmendments.id, aditivo.id))

  await db.insert(contractSignatureEvents).values({
    contractId: contrato.id,
    amendmentId: aditivo.id,
    signerId: signer.id,
    tipoEvento: "aditivo_enviado",
    tokenHash,
    contractVersao: aditivo.versao,
    atorColaboradorId: usuario.id,
  })

  const baseUrl = process.env.APP_BASE_URL || ""
  try {
    const [empresaRow] = await db.select().from(empresas).where(eq(empresas.id, contrato.empresaId))
    const empresa = toEmpresaDTO(empresaRow)
    await sendAditivoConviteEmail({
      to: colaborador.email,
      prestadorNome: colaborador.nomeCompleto,
      numeroContrato: contrato.numero,
      tipoAditivoLabel: TIPO_LABEL[aditivo.tipo] || "Aditivo Contratual",
      signingUrl: `${baseUrl}/contratos/assinar/${token}`,
      expiraEmFormatado: new Intl.DateTimeFormat("pt-BR").format(tokenExpiraEm),
      empresa: { nome: empresa.nome_fantasia || empresa.razao_social, razaoSocial: empresa.razao_social, cnpj: empresa.cnpj },
    })
  } catch (error) {
    console.error("[aditivos] Erro ao enviar e-mail de convite do aditivo:", error)
  }

  revalidatePath(`/contratos/${contrato.id}`)
  return { success: true }
}

export async function cancelarAditivo(aditivoId: string) {
  const usuario = await exigirAdmin()

  const [aditivo] = await db.select().from(contractAmendments).where(eq(contractAmendments.id, aditivoId))
  if (!aditivo || ["signed", "cancelled"].includes(aditivo.status)) {
    return { success: false, error: "Aditivo não pode ser cancelado neste status" }
  }

  const contrato = await getContratoOuFalha(aditivo.contractId, usuario)

  await db
    .update(contractAmendments)
    .set({ status: "cancelled", canceladoEm: new Date(), updatedAt: new Date() })
    .where(eq(contractAmendments.id, aditivoId))

  await db.insert(contractSignatureEvents).values({
    contractId: contrato.id,
    amendmentId: aditivo.id,
    tipoEvento: "cancelado",
    contractVersao: aditivo.versao,
    atorColaboradorId: usuario.id,
  })

  revalidatePath(`/contratos/${contrato.id}`)
  return { success: true }
}
