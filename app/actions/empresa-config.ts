"use server"

import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { empresas } from "@/lib/db/schema"
import { toEmpresaDTO } from "@/lib/db/mappers"
import { getUsuarioLogado } from "@/lib/auth-utils"

// Auto-atendimento do EMPRESA_ADMIN pra configurar os dados da própria empresa (papel timbrado
// dos contratos). Diferente de app/actions/empresas.ts, que é exclusivo do SuperAdmin — aqui o
// escopo é sempre a própria empresa de quem chama, nunca um id arbitrário vindo do cliente.

async function exigirEmpresaAdmin() {
  const usuario = await getUsuarioLogado()
  if (!usuario || usuario.tipo_acesso !== "Adm" || !usuario.empresa_id) {
    throw new Error("Sem permissão para configurar a empresa")
  }
  return usuario
}

export async function obterMinhaEmpresa() {
  const usuario = await exigirEmpresaAdmin()
  const [row] = await db.select().from(empresas).where(eq(empresas.id, usuario.empresa_id!))
  if (!row) throw new Error("Empresa não encontrada")
  return toEmpresaDTO(row)
}

export interface EmpresaConfigFormData {
  razao_social?: string
  nome_fantasia?: string
  cnpj?: string
  email?: string
  telefone?: string
  endereco?: string
  representante_nome?: string
  representante_documento?: string
  representante_cargo?: string
  rodape_contrato?: string
}

export async function atualizarMinhaEmpresa(data: EmpresaConfigFormData) {
  const usuario = await exigirEmpresaAdmin()

  const updateData: Record<string, unknown> = { updatedAt: new Date() }
  if (data.razao_social !== undefined) updateData.razaoSocial = data.razao_social.trim()
  if (data.nome_fantasia !== undefined) updateData.nomeFantasia = data.nome_fantasia?.trim() || null
  if (data.cnpj !== undefined) updateData.cnpj = data.cnpj.trim()
  if (data.email !== undefined) updateData.email = data.email?.trim() || null
  if (data.telefone !== undefined) updateData.telefone = data.telefone?.trim() || null
  if (data.endereco !== undefined) updateData.endereco = data.endereco?.trim() || null
  if (data.representante_nome !== undefined) updateData.representanteNome = data.representante_nome?.trim() || null
  if (data.representante_documento !== undefined)
    updateData.representanteDocumento = data.representante_documento?.trim() || null
  if (data.representante_cargo !== undefined) updateData.representanteCargo = data.representante_cargo?.trim() || null
  if (data.rodape_contrato !== undefined) updateData.rodapeContrato = data.rodape_contrato?.trim() || null

  try {
    await db.update(empresas).set(updateData).where(eq(empresas.id, usuario.empresa_id!))
  } catch (error) {
    console.error("[empresa-config] Erro ao atualizar empresa:", error)
    return { success: false, error: error instanceof Error ? error.message : "Erro ao atualizar dados da empresa" }
  }

  revalidatePath("/contratos/configuracoes")
  return { success: true }
}

export async function atualizarLogoMinhaEmpresa(logoUrl: string) {
  const usuario = await exigirEmpresaAdmin()

  try {
    await db.update(empresas).set({ logoUrl, updatedAt: new Date() }).where(eq(empresas.id, usuario.empresa_id!))
  } catch (error) {
    console.error("[empresa-config] Erro ao atualizar logo:", error)
    return { success: false, error: error instanceof Error ? error.message : "Erro ao atualizar logo" }
  }

  revalidatePath("/contratos/configuracoes")
  return { success: true }
}
