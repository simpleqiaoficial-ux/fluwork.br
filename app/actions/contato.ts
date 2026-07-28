"use server"

import { z } from "zod"
import { eq } from "drizzle-orm"
import { sendContatoComercialEmail, sendSolicitacaoModuloEmail } from "@/lib/email"
import { getSession } from "@/lib/session"
import { db } from "@/lib/db"
import { empresas } from "@/lib/db/schema"
import { MODULOS, MODULO_LABELS } from "@/lib/modulos"

const contatoSchema = z.object({
  nome: z.string().trim().min(2, "Informe seu nome").max(120),
  empresa: z.string().trim().min(2, "Informe o nome da empresa").max(160),
  email: z.string().trim().email("E-mail inválido").max(160),
  telefone: z.string().trim().max(40).optional(),
  mensagem: z.string().trim().max(2000).optional(),
})

export async function enviarContatoComercial(formData: FormData) {
  // Honeypot: campo invisível para humanos — se vier preenchido, é bot. Finge sucesso sem enviar e-mail.
  if (formData.get("website")) {
    return { success: true }
  }

  const parsed = contatoSchema.safeParse({
    nome: formData.get("nome"),
    empresa: formData.get("empresa"),
    email: formData.get("email"),
    telefone: formData.get("telefone") || undefined,
    mensagem: formData.get("mensagem") || undefined,
  })

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Preencha os campos corretamente." }
  }

  try {
    await sendContatoComercialEmail(parsed.data)
    return { success: true }
  } catch (error) {
    console.error("[v0] Erro ao enviar contato comercial:", error)
    return { success: false, error: "Não foi possível enviar agora. Tente novamente em instantes." }
  }
}

// "geral" cobre o botão "Contatar comercial" na tela de empresa bloqueada por status
// (inadimplência/suspensão) — não é um módulo bloqueável de verdade, só um rótulo pro e-mail.
const MODULO_OU_GERAL = [...MODULOS, "geral"] as const
type ModuloOuGeral = (typeof MODULO_OU_GERAL)[number]

const solicitacaoModuloSchema = z.object({
  modulo: z.enum(MODULO_OU_GERAL as unknown as [ModuloOuGeral, ...ModuloOuGeral[]]),
  mensagem: z.string().trim().max(2000).optional(),
})

/** Disparado a partir das telas de módulo/empresa bloqueada (usuário já autenticado) —
 *  identidade (nome/empresa/e-mail) vem sempre da sessão no servidor, nunca de dado enviado
 *  pelo client. */
export async function solicitarLiberacaoModulo(modulo: ModuloOuGeral, mensagem?: string) {
  const session = await getSession()
  if (!session || !session.empresaId) {
    return { success: false, error: "Sessão inválida. Faça login novamente." }
  }

  const parsed = solicitacaoModuloSchema.safeParse({ modulo, mensagem })
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." }
  }

  const [empresa] = await db
    .select({ razaoSocial: empresas.razaoSocial, nomeFantasia: empresas.nomeFantasia, cnpj: empresas.cnpj })
    .from(empresas)
    .where(eq(empresas.id, session.empresaId))
  if (!empresa) {
    return { success: false, error: "Empresa não encontrada." }
  }

  try {
    await sendSolicitacaoModuloEmail({
      nomeSolicitante: session.nomeCompleto,
      empresaNome: empresa.nomeFantasia || empresa.razaoSocial,
      empresaCnpj: empresa.cnpj,
      emailSolicitante: session.email,
      moduloLabel: parsed.data.modulo === "geral" ? "Acesso à plataforma" : MODULO_LABELS[parsed.data.modulo],
      mensagem: parsed.data.mensagem,
    })
    return { success: true }
  } catch (error) {
    console.error("[v0] Erro ao enviar solicitação de módulo:", error)
    return { success: false, error: "Não foi possível enviar agora. Tente novamente em instantes." }
  }
}
