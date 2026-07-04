"use server"

import crypto from "crypto"
import { and, eq, inArray } from "drizzle-orm"
import { headers } from "next/headers"
import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { contracts, contractSigners, contractSignatureEvents, contractAttachments, colaboradores } from "@/lib/db/schema"
import { toContratoDTO, toContratoSignatarioDTO } from "@/lib/db/mappers"
import { hashToken } from "@/lib/contracts/token"
import { montarDadosContrato } from "@/lib/contracts/montar-dados-contrato"
import { gerarPdfAssinado } from "@/lib/pdf/contrato-pdf"
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
    with: { contract: true },
  })

  if (!signerRow || !signerRow.contract) {
    return { ok: false as const, reason: "invalido" as const }
  }

  let contrato = signerRow.contract
  const signer = signerRow
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
    contrato: toContratoDTO(contrato),
    signatario: toContratoSignatarioDTO(signer),
  }
}

export async function aceitarEAssinarContrato(token: string, confirmEmail: string) {
  const tokenHash = hashToken(token)
  const { userAgent, ipAddress } = await capturarRequestInfo()

  const signerRow = await db.query.contractSigners.findFirst({
    where: eq(contractSigners.tokenHash, tokenHash),
    with: { contract: true },
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

  const dados = montarDadosContrato(toContratoDTO(contratoAtualizado) as any, {
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

  // E-mails de confirmação são best-effort — não derrubam a assinatura já gravada.
  try {
    await sendContratoAssinadoPrestadorEmail({
      to: signerRow.email,
      prestadorNome: signerRow.nome,
      numero: contratoAtualizado.numero,
      pdfBuffer,
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

export async function recusarContrato(token: string, motivo?: string) {
  const tokenHash = hashToken(token)
  const { userAgent, ipAddress } = await capturarRequestInfo()

  const signerRow = await db.query.contractSigners.findFirst({
    where: eq(contractSigners.tokenHash, tokenHash),
    with: { contract: true },
  })

  if (!signerRow || !signerRow.contract) {
    return { success: false, error: "Link inválido." }
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
