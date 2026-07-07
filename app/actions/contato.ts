"use server"

import { z } from "zod"
import { sendContatoComercialEmail } from "@/lib/email"

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
