"use server"

import crypto from "crypto"
import bcrypt from "bcryptjs"
import { and, eq, inArray, isNull } from "drizzle-orm"
import { headers } from "next/headers"
import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import {
  contracts,
  contractSigners,
  contractSignatureEvents,
  contractAttachments,
  contractAmendments,
  colaboradores,
  empresas,
} from "@/lib/db/schema"
import { toContratoDTO, toContratoSignatarioDTO, toEmpresaDTO, toContratoAditivoDTO } from "@/lib/db/mappers"
import { hashToken } from "@/lib/contracts/token"
import { montarDadosContrato } from "@/lib/contracts/montar-dados-contrato"
import { montarDadosAditivo } from "@/lib/contracts/montar-dados-aditivo"
import { gerarPdfAssinado } from "@/lib/pdf/contrato-pdf"
import { gerarPdfAditivo } from "@/lib/pdf/aditivo-pdf"
import { uploadFile } from "@/lib/gcs"
import { sendContratoAssinadoPrestadorEmail, sendContratoAssinadoEmpresaEmail } from "@/lib/email"

// Nenhuma função neste arquivo chama getSession()/getUsuarioLogado() — por design, o
// único mecanismo de autorização aqui é o token de assinatura.

async function capturarRequestInfo() {
  const headersList = await headers()
  const userAgent = headersList.get("user-agent") || null
  const forwardedFor = headersList.get("x-forwarded-for")
  const realIp = headersList.get("x-real-ip")
  const ipAddress = forwardedFor?.split(",")[0].trim() || realIp || null
  return { userAgent, ipAddress }
}

export async function validarTokenAssinatura(token: string) {
  const tokenHash = hashToken(token)

  const signerRow = await db.query.contractSigners.findFirst({
    where: eq(contractSigners.tokenHash, tokenHash),
    with: { contract: { with: { empresa: true } }, amendment: true, colaborador: true },
  })

  if (!signerRow || !signerRow.contract) {
    return { ok: false as const, reason: "invalido" as const }
  }

  const precisaDefinirSenha = !!signerRow.colaboradorId && !signerRow.colaborador?.senhaHash
  const signer = signerRow

  // Aditivo: mesmo pipeline de token/expiração/visualização, só que o "documento" sendo
  // acompanhado é o aditivo (contract_amendments), não o contrato base.
  if (signer.amendmentId && signer.amendment) {
    let aditivo = signer.amendment
    const statusTerminal = ["signed", "refused", "cancelled", "expired"].includes(aditivo.status || "")

    if (!statusTerminal && signer.tokenExpiraEm && signer.tokenExpiraEm < new Date()) {
      await db.update(contractAmendments).set({ status: "expired", updatedAt: new Date() }).where(eq(contractAmendments.id, aditivo.id))
      await db.update(contractSigners).set({ status: "expirado", updatedAt: new Date() }).where(eq(contractSigners.id, signer.id))
      await db.insert(contractSignatureEvents).values({
        contractId: signer.contractId,
        amendmentId: aditivo.id,
        signerId: signer.id,
        tipoEvento: "expirado",
        contractVersao: aditivo.versao,
      })
      aditivo = { ...aditivo, status: "expired" }
    } else if (aditivo.status === "sent") {
      const { userAgent, ipAddress } = await capturarRequestInfo()
      await db
        .update(contractAmendments)
        .set({ status: "viewed", visualizadoEm: new Date(), updatedAt: new Date() })
        .where(eq(contractAmendments.id, aditivo.id))
      await db
        .update(contractSigners)
        .set({
          status: "visualizado",
          primeiraVisualizacaoEm: signer.primeiraVisualizacaoEm || new Date(),
          ipUltimoAcesso: ipAddress,
          userAgentUltimoAcesso: userAgent,
          updatedAt: new Date(),
        })
        .where(eq(contractSigners.id, signer.id))
      await db.insert(contractSignatureEvents).values({
        contractId: signer.contractId,
        amendmentId: aditivo.id,
        signerId: signer.id,
        tipoEvento: "visualizado",
        ipAddress,
        userAgent,
        contractVersao: aditivo.versao,
      })
      aditivo = { ...aditivo, status: "viewed" }
    }

    return {
      ok: true as const,
      tipo: "aditivo" as const,
      contrato: toContratoDTO(signer.contract),
      aditivo: toContratoAditivoDTO(aditivo),
      signatario: toContratoSignatarioDTO(signer),
      precisa_definir_senha: precisaDefinirSenha,
    }
  }

  let contrato = signerRow.contract
  const statusTerminal = ["signed", "refused", "cancelled", "expired"].includes(contrato.status || "")

  if (!statusTerminal && signer.tokenExpiraEm && signer.tokenExpiraEm < new Date()) {
    await db.update(contracts).set({ status: "expired", updatedAt: new Date() }).where(eq(contracts.id, contrato.id))
    await db
      .update(contractSigners)
      .set({ status: "expirado", updatedAt: new Date() })
      .where(eq(contractSigners.id, signer.id))
    await db.insert(contractSignatureEvents).values({
      contractId: contrato.id,
      signerId: signer.id,
      tipoEvento: "expirado",
      contractVersao: contrato.versaoAtual,
    })
    contrato = { ...contrato, status: "expired" }
  } else if (contrato.status === "sent") {
    const { userAgent, ipAddress } = await capturarRequestInfo()
    await db
      .update(contracts)
      .set({ status: "viewed", visualizadoEm: new Date(), updatedAt: new Date() })
      .where(eq(contracts.id, contrato.id))
    await db
      .update(contractSigners)
      .set({
        status: "visualizado",
        primeiraVisualizacaoEm: signer.primeiraVisualizacaoEm || new Date(),
        ipUltimoAcesso: ipAddress,
        userAgentUltimoAcesso: userAgent,
        updatedAt: new Date(),
      })
      .where(eq(contractSigners.id, signer.id))
    await db.insert(contractSignatureEvents).values({
      contractId: contrato.id,
      signerId: signer.id,
      tipoEvento: "visualizado",
      ipAddress,
      userAgent,
      contractVersao: contrato.versaoAtual,
    })
    contrato = { ...contrato, status: "viewed" }
  }

  return {
    ok: true as const,
    tipo: "contrato" as const,
    contrato: toContratoDTO(contrato),
    signatario: toContratoSignatarioDTO(signer),
    precisa_definir_senha: precisaDefinirSenha,
  }
}

export async function aceitarEAssinarContrato(token: string, confirmEmail: string, novaSenha?: string) {
  const tokenHash = hashToken(token)
  const { userAgent, ipAddress } = await capturarRequestInfo()

  const signerRow = await db.query.contractSigners.findFirst({
    where: eq(contractSigners.tokenHash, tokenHash),
    with: { contract: true, amendment: true, colaborador: true },
  })

  if (!signerRow || !signerRow.contract) {
    return { success: false, error: "Link inválido." }
  }

  if (signerRow.email.toLowerCase() !== confirmEmail.trim().toLowerCase()) {
    return { success: false, error: "O e-mail informado não corresponde ao destinatário deste contrato." }
  }

  if (signerRow.tokenExpiraEm < new Date()) {
    return { success: false, error: "Este link expirou. Solicite um novo envio ao responsável." }
  }

  // Definição de senha de primeiro acesso — só se aplica quando o colaborador vinculado
  // ainda não tem senha (evita que alguém reenvie a mesma requisição e troque a senha depois).
  const precisaDefinirSenha = !!signerRow.colaboradorId && !signerRow.colaborador?.senhaHash
  if (precisaDefinirSenha) {
    if (!novaSenha || novaSenha.length < 8) {
      return { success: false, error: "A senha deve ter no mínimo 8 caracteres" }
    }
    if (!/[A-Z]/.test(novaSenha) || !/[a-z]/.test(novaSenha) || !/[0-9]/.test(novaSenha)) {
      return { success: false, error: "A senha deve conter letras maiúsculas, minúsculas e números" }
    }
  }

  if (signerRow.amendmentId && signerRow.amendment) {
    return assinarAditivo(signerRow as any, { userAgent, ipAddress }, precisaDefinirSenha, novaSenha)
  }

  // Guarda otimista: só assina se o contrato ainda estiver pendente de assinatura.
  const [contratoAtualizado] = await db
    .update(contracts)
    .set({ status: "signed", assinadoEm: new Date(), updatedAt: new Date() })
    .where(and(eq(contracts.id, signerRow.contractId), inArray(contracts.status, ["sent", "viewed"])))
    .returning()

  if (!contratoAtualizado) {
    return { success: false, error: "Este contrato já foi assinado, recusado ou cancelado." }
  }

  await db
    .update(contractSigners)
    .set({
      status: "assinado",
      tokenUsadoEm: new Date(),
      ipUltimoAcesso: ipAddress,
      userAgentUltimoAcesso: userAgent,
      updatedAt: new Date(),
    })
    .where(eq(contractSigners.id, signerRow.id))

  if (precisaDefinirSenha && signerRow.colaboradorId) {
    // Guarda contra dupla submissão: só grava se ainda não tiver senha (evita sobrescrever
    // uma senha já definida por uma segunda chamada com o mesmo token).
    const senhaHash = await bcrypt.hash(novaSenha!, 10)
    await db
      .update(colaboradores)
      .set({ senhaHash })
      .where(and(eq(colaboradores.id, signerRow.colaboradorId), isNull(colaboradores.senhaHash)))
    await db.insert(contractSignatureEvents).values({
      contractId: contratoAtualizado.id,
      signerId: signerRow.id,
      tipoEvento: "senha_definida",
      ipAddress,
      userAgent,
      contractVersao: contratoAtualizado.versaoAtual,
    })
  }

  const [empresaRow] = await db.select().from(empresas).where(eq(empresas.id, contratoAtualizado.empresaId))
  const empresa = toEmpresaDTO(empresaRow)

  const dados = montarDadosContrato(toContratoDTO(contratoAtualizado) as any, empresa, {
    nome: signerRow.nome,
    cpfCnpj: signerRow.cpfCnpj,
    email: signerRow.email,
    assinadoEm: contratoAtualizado.assinadoEm!,
    ip: ipAddress,
  })

  const pdfBuffer = await gerarPdfAssinado(dados)
  const pdfHash = crypto.createHash("sha256").update(pdfBuffer).digest("hex")
  const objectPath = `contratos/${contratoAtualizado.id}/v${contratoAtualizado.versaoAtual}-assinado.pdf`

  await uploadFile(pdfBuffer, objectPath, "application/pdf")

  await db.insert(contractAttachments).values({
    contractId: contratoAtualizado.id,
    tipo: "assinado",
    versao: contratoAtualizado.versaoAtual,
    objectPath,
    hashSha256: pdfHash,
    tamanhoBytes: pdfBuffer.length,
  })

  await db
    .update(contracts)
    .set({ pdfSignedPath: objectPath, pdfHash, updatedAt: new Date() })
    .where(eq(contracts.id, contratoAtualizado.id))

  await db.insert(contractSignatureEvents).values({
    contractId: contratoAtualizado.id,
    signerId: signerRow.id,
    tipoEvento: "assinado",
    ipAddress,
    userAgent,
    tokenHash,
    contractVersao: contratoAtualizado.versaoAtual,
    pdfHash,
    emailSnapshot: signerRow.email,
  })

  const empresaEmail = { nome: empresa.nome_fantasia || empresa.razao_social, razaoSocial: empresa.razao_social, cnpj: empresa.cnpj }

  // E-mails de confirmação são best-effort — não derrubam a assinatura já gravada.
  try {
    await sendContratoAssinadoPrestadorEmail({
      to: signerRow.email,
      prestadorNome: signerRow.nome,
      numero: contratoAtualizado.numero,
      pdfBuffer,
      empresa: empresaEmail,
    })
  } catch (error) {
    console.error("[contratos] Erro ao enviar e-mail de confirmação ao prestador:", error)
  }

  try {
    const [criador] = await db
      .select({ email: colaboradores.email })
      .from(colaboradores)
      .where(eq(colaboradores.id, contratoAtualizado.criadoPor))
    const notifyEmail = process.env.RESEND_ADMIN_NOTIFY_EMAIL || criador?.email
    if (notifyEmail) {
      const baseUrl = process.env.APP_BASE_URL || ""
      await sendContratoAssinadoEmpresaEmail({
        to: notifyEmail,
        prestadorNome: signerRow.nome,
        numero: contratoAtualizado.numero,
        contractDetailUrl: `${baseUrl}/contratos/${contratoAtualizado.id}`,
      })
    }
  } catch (error) {
    console.error("[contratos] Erro ao enviar e-mail de confirmação à empresa:", error)
  }

  revalidatePath(`/contratos/${contratoAtualizado.id}`)
  revalidatePath("/contratos")
  revalidatePath("/meus-contratos")

  return { success: true }
}

// Assinatura de aditivo — mesma verificação de e-mail/token/senha já feita pelo chamador
// (aceitarEAssinarContrato); aqui só o documento assinado é o aditivo, cujo efeito é
// aplicado de volta no contrato base (valor/vigência/cláusulas), nunca sobrescrevendo o
// histórico (a versão anterior do PDF permanece em contract_attachments).
async function assinarAditivo(
  signerRow: NonNullable<Awaited<ReturnType<typeof db.query.contractSigners.findFirst>>> & {
    contract: NonNullable<any>
    amendment: NonNullable<any>
  },
  request: { userAgent: string | null; ipAddress: string | null },
  precisaDefinirSenha: boolean,
  novaSenha?: string,
) {
  const { userAgent, ipAddress } = request

  const [aditivoAtualizado] = await db
    .update(contractAmendments)
    .set({ status: "signed", assinadoEm: new Date(), updatedAt: new Date() })
    .where(and(eq(contractAmendments.id, signerRow.amendmentId!), inArray(contractAmendments.status, ["sent", "viewed"])))
    .returning()

  if (!aditivoAtualizado) {
    return { success: false, error: "Este aditivo já foi assinado, recusado ou cancelado." }
  }

  await db
    .update(contractSigners)
    .set({
      status: "assinado",
      tokenUsadoEm: new Date(),
      ipUltimoAcesso: ipAddress,
      userAgentUltimoAcesso: userAgent,
      updatedAt: new Date(),
    })
    .where(eq(contractSigners.id, signerRow.id))

  if (precisaDefinirSenha && signerRow.colaboradorId) {
    const senhaHash = await bcrypt.hash(novaSenha!, 10)
    await db
      .update(colaboradores)
      .set({ senhaHash })
      .where(and(eq(colaboradores.id, signerRow.colaboradorId), isNull(colaboradores.senhaHash)))
    await db.insert(contractSignatureEvents).values({
      contractId: signerRow.contractId,
      amendmentId: aditivoAtualizado.id,
      signerId: signerRow.id,
      tipoEvento: "senha_definida",
      ipAddress,
      userAgent,
      contractVersao: aditivoAtualizado.versao,
    })
  }

  const [empresaRow] = await db.select().from(empresas).where(eq(empresas.id, signerRow.contract.empresaId))
  const empresa = toEmpresaDTO(empresaRow)

  const dados = montarDadosAditivo(
    toContratoAditivoDTO(aditivoAtualizado) as any,
    { numero: signerRow.contract.numero, prestador_nome: signerRow.contract.prestadorNome, prestador_cpf_cnpj: signerRow.contract.prestadorCpfCnpj, prestador_email: signerRow.contract.prestadorEmail },
    empresa,
    { nome: signerRow.nome, cpfCnpj: signerRow.cpfCnpj, email: signerRow.email, assinadoEm: aditivoAtualizado.assinadoEm!, ip: ipAddress },
  )

  const pdfBuffer = await gerarPdfAditivo(dados)
  const pdfHash = crypto.createHash("sha256").update(pdfBuffer).digest("hex")
  const objectPath = `contratos/${signerRow.contractId}/v${aditivoAtualizado.versao}-aditivo-assinado.pdf`
  await uploadFile(pdfBuffer, objectPath, "application/pdf")

  await db.insert(contractAttachments).values({
    contractId: signerRow.contractId,
    tipo: "assinado",
    versao: aditivoAtualizado.versao,
    objectPath,
    hashSha256: pdfHash,
    tamanhoBytes: pdfBuffer.length,
  })

  await db.update(contractAmendments).set({ pdfPath: objectPath, updatedAt: new Date() }).where(eq(contractAmendments.id, aditivoAtualizado.id))

  // Aplica o efeito do aditivo de volta no contrato base — nunca substitui o histórico
  // (a versão anterior do PDF/valores continua em contract_attachments/contract_signature_events).
  const efeitos: Record<string, unknown> = { versaoAtual: aditivoAtualizado.versao, updatedAt: new Date() }
  if (aditivoAtualizado.novoValor != null) efeitos.valor = aditivoAtualizado.novoValor
  if (aditivoAtualizado.novaDataTermino != null) efeitos.dataTermino = aditivoAtualizado.novaDataTermino
  if (aditivoAtualizado.novasClausulas != null) efeitos.clausulasAdicionais = aditivoAtualizado.novasClausulas
  if (aditivoAtualizado.tipo === "renovacao") efeitos.dataUltimaRenovacao = new Date()

  await db.update(contracts).set(efeitos).where(eq(contracts.id, signerRow.contractId))

  await db.insert(contractSignatureEvents).values({
    contractId: signerRow.contractId,
    amendmentId: aditivoAtualizado.id,
    signerId: signerRow.id,
    tipoEvento: aditivoAtualizado.tipo === "renovacao" ? "renovado" : "aditivo_assinado",
    ipAddress,
    userAgent,
    contractVersao: aditivoAtualizado.versao,
    pdfHash,
    emailSnapshot: signerRow.email,
  })

  revalidatePath(`/contratos/${signerRow.contractId}`)
  revalidatePath("/contratos")
  revalidatePath("/meus-contratos")

  return { success: true }
}

export async function recusarContrato(token: string, motivo?: string) {
  const tokenHash = hashToken(token)
  const { userAgent, ipAddress } = await capturarRequestInfo()

  const signerRow = await db.query.contractSigners.findFirst({
    where: eq(contractSigners.tokenHash, tokenHash),
    with: { contract: true, amendment: true },
  })

  if (!signerRow || !signerRow.contract) {
    return { success: false, error: "Link inválido." }
  }

  if (signerRow.amendmentId && signerRow.amendment) {
    const [aditivoAtualizado] = await db
      .update(contractAmendments)
      .set({ status: "refused", recusadoEm: new Date(), motivoRecusa: motivo || null, updatedAt: new Date() })
      .where(and(eq(contractAmendments.id, signerRow.amendmentId), inArray(contractAmendments.status, ["sent", "viewed"])))
      .returning()

    if (!aditivoAtualizado) {
      return { success: false, error: "Este aditivo não pode mais ser recusado." }
    }

    await db.update(contractSigners).set({ status: "recusado", updatedAt: new Date() }).where(eq(contractSigners.id, signerRow.id))

    await db.insert(contractSignatureEvents).values({
      contractId: signerRow.contractId,
      amendmentId: aditivoAtualizado.id,
      signerId: signerRow.id,
      tipoEvento: "aditivo_recusado",
      ipAddress,
      userAgent,
      tokenHash,
      contractVersao: aditivoAtualizado.versao,
      detalhes: motivo ? { motivo } : undefined,
    })

    revalidatePath(`/contratos/${signerRow.contractId}`)
    revalidatePath("/contratos")
    return { success: true }
  }

  const [contratoAtualizado] = await db
    .update(contracts)
    .set({ status: "refused", recusadoEm: new Date(), motivoRecusa: motivo || null, updatedAt: new Date() })
    .where(and(eq(contracts.id, signerRow.contractId), inArray(contracts.status, ["sent", "viewed"])))
    .returning()

  if (!contratoAtualizado) {
    return { success: false, error: "Este contrato não pode mais ser recusado." }
  }

  await db
    .update(contractSigners)
    .set({ status: "recusado", updatedAt: new Date() })
    .where(eq(contractSigners.id, signerRow.id))

  await db.insert(contractSignatureEvents).values({
    contractId: contratoAtualizado.id,
    signerId: signerRow.id,
    tipoEvento: "recusado",
    ipAddress,
    userAgent,
    tokenHash,
    contractVersao: contratoAtualizado.versaoAtual,
    detalhes: motivo ? { motivo } : undefined,
  })

  revalidatePath(`/contratos/${contratoAtualizado.id}`)
  revalidatePath("/contratos")
  return { success: true }
}
