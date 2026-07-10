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

// Mesmo azul de marca usado em todo o app (--primary: 224 76% 48%) — clientes de e-mail não
// leem CSS custom properties, então o hex precisa ficar hardcoded aqui.
const BRAND_BLUE = "#1E4FD8"

// Casco visual único reaproveitado em todo e-mail transacional — cabeçalho com a marca, corpo
// com o conteúdo específico de cada tipo de e-mail, rodapé com aviso padrão. Sem isso, cada
// e-mail era um parágrafo solto sem identidade nenhuma da FluWork.
function emailShell(innerHtml: string) {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background:#F3F5F8; padding:32px 16px; margin:0;">
      <div style="max-width:480px; margin:0 auto; background:#ffffff; border-radius:8px; overflow:hidden; border:1px solid #E2E8F0;">
        <div style="padding:22px 32px; border-bottom:1px solid #E2E8F0;">
          <span style="font-size:18px; font-weight:700; color:${BRAND_BLUE}; letter-spacing:-0.01em;">FluWork</span>
        </div>
        <div style="padding:32px; color:#0F172A; font-size:14px; line-height:1.65;">
          ${innerHtml}
        </div>
        <div style="padding:18px 32px; background:#F8FAFC; border-top:1px solid #E2E8F0; font-size:12px; color:#64748B; line-height:1.5;">
          Este é um e-mail automático da FluWork — não é necessário responder.
        </div>
      </div>
    </div>
  `
}

function emailButton(href: string, label: string) {
  return `<p style="margin:24px 0;"><a href="${href}" style="display:inline-block;background:${BRAND_BLUE};color:#fff;padding:11px 22px;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px;">${label}</a></p>`
}

function empresaRodape(empresa: EmpresaEmail) {
  return `<p style="margin-top:24px; color:#64748B; font-size:12px;">${empresa.nome} · ${empresa.razaoSocial} · CNPJ ${empresa.cnpj}</p>`
}

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
    html: emailShell(`
      <p>Olá, ${escapeHtml(params.prestadorNome)}.</p>
      <p>Você recebeu um contrato de prestação de serviços (${escapeHtml(params.tipoServico)}, valor ${params.valorFormatado}) da ${escapeHtml(params.empresa.nome)} para revisar e assinar eletronicamente.</p>
      ${introducaoAcesso}
      ${emailButton(params.signingUrl, params.precisaDefinirSenha ? "Definir senha e assinar contrato" : "Visualizar e assinar contrato")}
      <p style="color:#64748B; font-size:13px;">Este link é pessoal e expira em ${params.expiraEmFormatado}.</p>
      ${empresaRodape(params.empresa)}
    `),
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
    html: emailShell(`
      <p>Olá, ${escapeHtml(params.prestadorNome)}.</p>
      <p>A ${escapeHtml(params.empresa.nome)} enviou um termo aditivo (${escapeHtml(params.tipoAditivoLabel)}) referente ao seu contrato nº ${params.numeroContrato} para revisar e assinar eletronicamente.</p>
      ${emailButton(params.signingUrl, "Visualizar e assinar aditivo")}
      <p style="color:#64748B; font-size:13px;">Este link é pessoal e expira em ${params.expiraEmFormatado}.</p>
      ${empresaRodape(params.empresa)}
    `),
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
    html: emailShell(`
      <p>Olá, ${escapeHtml(params.prestadorNome)}.</p>
      <p>Seu contrato nº ${params.numero} foi assinado com sucesso. Segue em anexo a versão final em PDF.</p>
      ${empresaRodape(params.empresa)}
    `),
    attachments: [
      { filename: `contrato-${params.numero}.pdf`, content: params.pdfBuffer },
    ],
  })
}

export async function sendOrdemLancadaEmail(params: {
  to: string
  prestadorNome: string
  valorFormatado: string
  minhasOrdensUrl: string
  empresa: EmpresaEmail
}) {
  const client = getClient()
  await client.emails.send({
    from: getFromAddress(),
    to: params.to,
    subject: `Nova ordem de pagamento — ${params.empresa.nome}`,
    html: emailShell(`
      <p>Olá, ${escapeHtml(params.prestadorNome)}.</p>
      <p>Uma ordem de pagamento de serviço foi lançada para você na plataforma, no valor de ${params.valorFormatado}.</p>
      ${emailButton(params.minhasOrdensUrl, "Acompanhar ordem de pagamento")}
      ${empresaRodape(params.empresa)}
    `),
  })
}

export async function sendOrdemAprovadaEmail(params: {
  to: string
  prestadorNome: string
  valorFormatado: string
  minhasOrdensUrl: string
  empresa: EmpresaEmail
}) {
  const client = getClient()
  await client.emails.send({
    from: getFromAddress(),
    to: params.to,
    subject: `Ordem de pagamento aprovada — ${params.empresa.nome}`,
    html: emailShell(`
      <p>Olá, ${escapeHtml(params.prestadorNome)}.</p>
      <p>Sua ordem de pagamento de ${params.valorFormatado} foi aprovada. Você já pode anexar sua nota fiscal na plataforma.</p>
      ${emailButton(params.minhasOrdensUrl, "Anexar nota fiscal")}
      ${empresaRodape(params.empresa)}
    `),
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
    html: emailShell(`
      <p>Olá, ${escapeHtml(params.prestadorNome)}.</p>
      <p>Seu pagamento de ${params.valorFormatado}, aprovado em ${params.dataAprovacaoFormatada}, está aguardando a nota fiscal pra seguir pro pagamento.</p>
      ${emailButton(params.meusPagamentosUrl, "Emitir ou anexar nota fiscal")}
      ${empresaRodape(params.empresa)}
    `),
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
    html: emailShell(`
      <p><strong>Nome:</strong> ${escapeHtml(params.nome)}</p>
      <p><strong>Empresa:</strong> ${escapeHtml(params.empresa)}</p>
      <p><strong>E-mail:</strong> ${escapeHtml(params.email)}</p>
      ${params.telefone ? `<p><strong>Telefone:</strong> ${escapeHtml(params.telefone)}</p>` : ""}
      ${params.mensagem ? `<p><strong>Mensagem:</strong><br/>${escapeHtml(params.mensagem).replace(/\n/g, "<br/>")}</p>` : ""}
    `),
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
    html: emailShell(`
      <p>O contrato nº ${params.numero}, de ${escapeHtml(params.prestadorNome)}, foi assinado eletronicamente.</p>
      ${emailButton(params.contractDetailUrl, "Ver detalhes do contrato")}
    `),
  })
}

export async function sendRecuperarSenhaEmail(params: {
  to: string
  nomeCompleto: string
  resetUrl: string
  expiraEmFormatado: string
}) {
  const client = getClient()
  await client.emails.send({
    from: getFromAddress(),
    to: params.to,
    subject: "Redefinir sua senha — FluWork",
    html: emailShell(`
      <p>Olá, ${escapeHtml(params.nomeCompleto)}.</p>
      <p>Recebemos uma solicitação para redefinir a senha da sua conta na FluWork.</p>
      ${emailButton(params.resetUrl, "Redefinir minha senha")}
      <p style="color:#64748B; font-size:13px;">Este link é pessoal, só pode ser usado uma vez e expira em ${params.expiraEmFormatado}.</p>
      <p style="color:#64748B; font-size:13px;">Se você não pediu essa alteração, ignore este e-mail — sua senha continua a mesma.</p>
    `),
  })
}
