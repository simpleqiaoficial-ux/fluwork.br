import { Resend } from "resend"

// Dados da empresa CLIENTE (contratante), nunca o FluWork — vêm sempre de quem chama.
interface EmpresaEmail {
  nome: string
  razaoSocial: string
  cnpj: string
}

function getClient() {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) throw new Error("RESEND_API_KEY não configurado")
  return new Resend(apiKey)
}

function getFromAddress() {
  return process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev"
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

// Texto placeholder — revisar antes de valer como comunicação oficial da empresa.

export async function sendContratoConviteEmail(params: {
  to: string
  prestadorNome: string
  tipoServico: string
  valorFormatado: string
  signingUrl: string
  expiraEmFormatado: string
  empresa: EmpresaEmail
  // Quando true, o mesmo e-mail/link também serve como primeiro acesso à plataforma —
  // não existe um convite separado (o contrato É a porta de entrada do colaborador).
  precisaDefinirSenha?: boolean
}) {
  const client = getClient()
  const introducaoAcesso = params.precisaDefinirSenha
    ? `<p>Este também é o seu primeiro acesso à plataforma: ao abrir o link abaixo, você vai definir sua senha e, em seguida, revisar e assinar o contrato.</p>`
    : ""
  await client.emails.send({
    from: getFromAddress(),
    to: params.to,
    subject: `Contrato para assinatura — ${params.empresa.nome}`,
    html: `
      <p>Olá, ${params.prestadorNome}.</p>
      <p>Você recebeu um contrato de prestação de serviços (${params.tipoServico}, valor ${params.valorFormatado}) da ${params.empresa.nome} para revisar e assinar eletronicamente.</p>
      ${introducaoAcesso}
      <p><a href="${params.signingUrl}" style="display:inline-block;background:#1a56db;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;">${params.precisaDefinirSenha ? "Definir senha e assinar contrato" : "Visualizar e assinar contrato"}</a></p>
      <p>Este link é pessoal e expira em ${params.expiraEmFormatado}.</p>
      <p>${params.empresa.nome} · ${params.empresa.razaoSocial} · CNPJ ${params.empresa.cnpj}</p>
    `,
  })
}

export async function sendAditivoConviteEmail(params: {
  to: string
  prestadorNome: string
  numeroContrato: string
  tipoAditivoLabel: string
  signingUrl: string
  expiraEmFormatado: string
  empresa: EmpresaEmail
}) {
  const client = getClient()
  await client.emails.send({
    from: getFromAddress(),
    to: params.to,
    subject: `${params.tipoAditivoLabel} — contrato ${params.numeroContrato} · ${params.empresa.nome}`,
    html: `
      <p>Olá, ${params.prestadorNome}.</p>
      <p>A ${params.empresa.nome} enviou um termo aditivo (${params.tipoAditivoLabel}) referente ao seu contrato nº ${params.numeroContrato} para revisar e assinar eletronicamente.</p>
      <p><a href="${params.signingUrl}" style="display:inline-block;background:#1a56db;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;">Visualizar e assinar aditivo</a></p>
      <p>Este link é pessoal e expira em ${params.expiraEmFormatado}.</p>
      <p>${params.empresa.nome} · ${params.empresa.razaoSocial} · CNPJ ${params.empresa.cnpj}</p>
    `,
  })
}

export async function sendContratoAssinadoPrestadorEmail(params: {
  to: string
  prestadorNome: string
  numero: string
  pdfBuffer: Buffer
  empresa: EmpresaEmail
}) {
  const client = getClient()
  await client.emails.send({
    from: getFromAddress(),
    to: params.to,
    subject: "Contrato assinado com sucesso",
    html: `
      <p>Olá, ${params.prestadorNome}.</p>
      <p>Seu contrato nº ${params.numero} foi assinado com sucesso. Segue em anexo a versão final em PDF.</p>
      <p>${params.empresa.nome} · ${params.empresa.razaoSocial} · CNPJ ${params.empresa.cnpj}</p>
    `,
    attachments: [
      { filename: `contrato-${params.numero}.pdf`, content: params.pdfBuffer },
    ],
  })
}

export async function sendLembreteNotaFiscalEmail(params: {
  to: string
  prestadorNome: string
  valorFormatado: string
  dataAprovacaoFormatada: string
  meusPagamentosUrl: string
  empresa: EmpresaEmail
}) {
  const client = getClient()
  await client.emails.send({
    from: getFromAddress(),
    to: params.to,
    subject: `Lembrete: nota fiscal pendente — ${params.empresa.nome}`,
    html: `
      <p>Olá, ${params.prestadorNome}.</p>
      <p>Seu pagamento de ${params.valorFormatado}, aprovado em ${params.dataAprovacaoFormatada}, está aguardando a nota fiscal pra seguir pro pagamento.</p>
      <p><a href="${params.meusPagamentosUrl}" style="display:inline-block;background:#1a56db;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;">Emitir ou anexar nota fiscal</a></p>
      <p>${params.empresa.nome} · ${params.empresa.razaoSocial} · CNPJ ${params.empresa.cnpj}</p>
    `,
  })
}

export async function sendContatoComercialEmail(params: {
  nome: string
  empresa: string
  email: string
  telefone?: string
  mensagem?: string
}) {
  const client = getClient()
  await client.emails.send({
    from: getFromAddress(),
    to: "simpleqia.oficial@gmail.com",
    replyTo: params.email,
    subject: `Novo contato comercial — ${params.empresa}`,
    html: `
      <p><strong>Nome:</strong> ${escapeHtml(params.nome)}</p>
      <p><strong>Empresa:</strong> ${escapeHtml(params.empresa)}</p>
      <p><strong>E-mail:</strong> ${escapeHtml(params.email)}</p>
      ${params.telefone ? `<p><strong>Telefone:</strong> ${escapeHtml(params.telefone)}</p>` : ""}
      ${params.mensagem ? `<p><strong>Mensagem:</strong><br/>${escapeHtml(params.mensagem).replace(/\n/g, "<br/>")}</p>` : ""}
    `,
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
