import { Resend } from "resend"
import { COMPANY_INFO } from "@/lib/company-info"

function getClient() {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) throw new Error("RESEND_API_KEY não configurado")
  return new Resend(apiKey)
}

function getFromAddress() {
  return process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev"
}

// Texto placeholder — revisar antes de valer como comunicação oficial da empresa.

export async function sendContratoConviteEmail(params: {
  to: string
  prestadorNome: string
  tipoServico: string
  valorFormatado: string
  signingUrl: string
  expiraEmFormatado: string
}) {
  const client = getClient()
  await client.emails.send({
    from: getFromAddress(),
    to: params.to,
    subject: `Contrato para assinatura — ${COMPANY_INFO.marca}`,
    html: `
      <p>Olá, ${params.prestadorNome}.</p>
      <p>Você recebeu um contrato de prestação de serviços (${params.tipoServico}, valor ${params.valorFormatado}) da ${COMPANY_INFO.marca} para revisar e assinar eletronicamente.</p>
      <p><a href="${params.signingUrl}" style="display:inline-block;background:#1a56db;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;">Visualizar e assinar contrato</a></p>
      <p>Este link é pessoal e expira em ${params.expiraEmFormatado}.</p>
      <p>${COMPANY_INFO.marca} · ${COMPANY_INFO.razaoSocial} · CNPJ ${COMPANY_INFO.cnpj}</p>
    `,
  })
}

export async function sendContratoAssinadoPrestadorEmail(params: {
  to: string
  prestadorNome: string
  numero: string
  pdfBuffer: Buffer
}) {
  const client = getClient()
  await client.emails.send({
    from: getFromAddress(),
    to: params.to,
    subject: "Contrato assinado com sucesso",
    html: `
      <p>Olá, ${params.prestadorNome}.</p>
      <p>Seu contrato nº ${params.numero} foi assinado com sucesso. Segue em anexo a versão final em PDF.</p>
      <p>${COMPANY_INFO.marca} · ${COMPANY_INFO.razaoSocial} · CNPJ ${COMPANY_INFO.cnpj}</p>
    `,
    attachments: [
      { filename: `contrato-${params.numero}.pdf`, content: params.pdfBuffer },
    ],
  })
}

export async function sendContratoAssinadoEmpresaEmail(params: {
  to: string
  prestadorNome: string
  numero: string
  contractDetailUrl: string
}) {
  const client = getClient()
  await client.emails.send({
    from: getFromAddress(),
    to: params.to,
    subject: `Contrato assinado: ${params.prestadorNome}`,
    html: `
      <p>O contrato nº ${params.numero}, de ${params.prestadorNome}, foi assinado eletronicamente.</p>
      <p><a href="${params.contractDetailUrl}">Ver detalhes do contrato</a></p>
    `,
  })
}
