"use server"

import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { empresas } from "@/lib/db/schema"
import { toEmpresaDTO } from "@/lib/db/mappers"
import { getUsuarioLogado } from "@/lib/auth-utils"
import { resolverCodigoMunicipio } from "@/lib/ibge"

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
  // Endereço estruturado + configuração fiscal padrão — usados na emissão de NFS-e.
  endereco_cep?: string
  endereco_logradouro?: string
  endereco_numero?: string
  endereco_complemento?: string
  endereco_bairro?: string
  endereco_cidade?: string
  endereco_uf?: string
  codigo_servico_padrao?: string
  discriminacao_servico_padrao?: string
  aliquota_iss_padrao?: number | null
  iss_retido_padrao?: boolean
  link_emissao_manual?: string
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
  if (data.endereco_cep !== undefined) updateData.enderecoCep = data.endereco_cep?.trim() || null
  if (data.endereco_logradouro !== undefined) updateData.enderecoLogradouro = data.endereco_logradouro?.trim() || null
  if (data.endereco_numero !== undefined) updateData.enderecoNumero = data.endereco_numero?.trim() || null
  if (data.endereco_complemento !== undefined) updateData.enderecoComplemento = data.endereco_complemento?.trim() || null
  if (data.endereco_bairro !== undefined) updateData.enderecoBairro = data.endereco_bairro?.trim() || null
  if (data.endereco_cidade !== undefined) updateData.enderecoCidade = data.endereco_cidade?.trim() || null
  if (data.endereco_uf !== undefined) updateData.enderecoUf = data.endereco_uf?.trim().toUpperCase() || null
  if (data.codigo_servico_padrao !== undefined) updateData.codigoServicoPadrao = data.codigo_servico_padrao?.trim() || null
  if (data.discriminacao_servico_padrao !== undefined)
    updateData.discriminacaoServicoPadrao = data.discriminacao_servico_padrao?.trim() || null
  if (data.aliquota_iss_padrao !== undefined)
    updateData.aliquotaIssPadrao = data.aliquota_iss_padrao == null ? null : data.aliquota_iss_padrao.toString()
  if (data.iss_retido_padrao !== undefined) updateData.issRetidoPadrao = data.iss_retido_padrao
  if (data.link_emissao_manual !== undefined) updateData.linkEmissaoManual = data.link_emissao_manual?.trim() || null

  // Resolve e cacheia o código de município IBGE sempre que cidade/UF mudam — evita ter que
  // recalcular isso a cada emissão de NFS-e.
  if (data.endereco_cidade !== undefined || data.endereco_uf !== undefined) {
    const [atual] = await db
      .select({ enderecoCidade: empresas.enderecoCidade, enderecoUf: empresas.enderecoUf })
      .from(empresas)
      .where(eq(empresas.id, usuario.empresa_id!))
    const cidade = (data.endereco_cidade ?? atual?.enderecoCidade)?.trim()
    const uf = (data.endereco_uf ?? atual?.enderecoUf)?.trim()
    if (cidade && uf) {
      updateData.codigoMunicipioIbge = await resolverCodigoMunicipio(cidade, uf)
    }
  }

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
