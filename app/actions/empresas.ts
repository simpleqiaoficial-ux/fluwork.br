"use server"

import { and, asc, count, desc, eq, ne } from "drizzle-orm"
import bcrypt from "bcryptjs"
import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { empresas, colaboradores, contracts, pedidosPagamento } from "@/lib/db/schema"
import { toEmpresaDTO, toColaboradorDTO } from "@/lib/db/mappers"
import { requireSuperAdmin } from "@/lib/tenant"
import { registrarAuditoria } from "@/lib/audit"

export interface EmpresaFormData {
  razao_social: string
  nome_fantasia?: string
  cnpj: string
  email?: string
  telefone?: string
  endereco?: string
}

export interface PrimeiroAdminFormData {
  nome_completo: string
  email: string
  senha: string
}

export async function listarEmpresas() {
  await requireSuperAdmin()
  const rows = await db.select().from(empresas).orderBy(desc(empresas.createdAt))
  return rows.map(toEmpresaDTO)
}

export async function getEmpresaById(id: string) {
  await requireSuperAdmin()
  const row = await db.query.empresas.findFirst({
    where: eq(empresas.id, id),
    with: { bloqueadoPorColaborador: true },
  })
  if (!row) return null
  return toEmpresaDTO(row)
}

export async function getEmpresaStats(id: string) {
  await requireSuperAdmin()

  const [{ value: totalColaboradores }] = await db
    .select({ value: count() })
    .from(colaboradores)
    .where(eq(colaboradores.empresaId, id))

  const [{ value: totalContratos }] = await db.select({ value: count() }).from(contracts).where(eq(contracts.empresaId, id))

  const [{ value: contratosAssinados }] = await db
    .select({ value: count() })
    .from(contracts)
    .where(and(eq(contracts.empresaId, id), eq(contracts.status, "signed")))

  const [{ value: totalPedidos }] = await db
    .select({ value: count() })
    .from(pedidosPagamento)
    .where(eq(pedidosPagamento.empresaId, id))

  return {
    total_colaboradores: totalColaboradores || 0,
    total_contratos: totalContratos || 0,
    contratos_assinados: contratosAssinados || 0,
    total_pedidos: totalPedidos || 0,
  }
}

export async function getDashboardGlobalStats() {
  await requireSuperAdmin()

  const [{ value: totalEmpresas }] = await db.select({ value: count() }).from(empresas)
  const [{ value: empresasAtivas }] = await db.select({ value: count() }).from(empresas).where(eq(empresas.status, "active"))
  const [{ value: empresasBloqueadas }] = await db
    .select({ value: count() })
    .from(empresas)
    .where(eq(empresas.status, "blocked"))
  const [{ value: totalUsuarios }] = await db.select({ value: count() }).from(colaboradores)
  const [{ value: totalPrestadores }] = await db
    .select({ value: count() })
    .from(colaboradores)
    .where(eq(colaboradores.tipoAcesso, "Colaborador"))
  const [{ value: totalContratosEnviados }] = await db.select({ value: count() }).from(contracts)
  const [{ value: totalContratosAssinados }] = await db
    .select({ value: count() })
    .from(contracts)
    .where(eq(contracts.status, "signed"))
  const [{ value: totalPagamentos }] = await db
    .select({ value: count() })
    .from(pedidosPagamento)
    .where(eq(pedidosPagamento.status, "pago"))

  return {
    total_empresas: totalEmpresas || 0,
    empresas_ativas: empresasAtivas || 0,
    empresas_bloqueadas: empresasBloqueadas || 0,
    total_usuarios: totalUsuarios || 0,
    total_prestadores: totalPrestadores || 0,
    total_contratos_enviados: totalContratosEnviados || 0,
    total_contratos_assinados: totalContratosAssinados || 0,
    total_pagamentos: totalPagamentos || 0,
  }
}

// Cria a empresa cliente e já vincula o primeiro usuário EMPRESA_ADMIN (papel "Adm") a ela.
export async function criarEmpresaComAdmin(empresa: EmpresaFormData, admin: PrimeiroAdminFormData) {
  const usuario = await requireSuperAdmin()

  if (!empresa.razao_social.trim() || !empresa.cnpj.trim()) {
    return { success: false, error: "Razão social e CNPJ são obrigatórios" }
  }

  const emailAdmin = admin.email.trim().toLowerCase()
  if (!emailAdmin || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailAdmin)) {
    return { success: false, error: "E-mail do administrador inválido" }
  }
  if (!admin.senha || admin.senha.length < 8) {
    return { success: false, error: "A senha do administrador deve ter no mínimo 8 caracteres" }
  }

  const [emailExistente] = await db.select({ email: colaboradores.email }).from(colaboradores).where(eq(colaboradores.email, emailAdmin))
  if (emailExistente) {
    return { success: false, error: "Este e-mail já está cadastrado no sistema" }
  }

  const [cnpjExistente] = await db.select({ id: empresas.id }).from(empresas).where(eq(empresas.cnpj, empresa.cnpj.trim()))
  if (cnpjExistente) {
    return { success: false, error: "Já existe uma empresa cadastrada com esse CNPJ" }
  }

  let novaEmpresa
  let novoAdmin
  try {
    const resultado = await db.transaction(async (tx) => {
      const [empresaRow] = await tx
        .insert(empresas)
        .values({
          razaoSocial: empresa.razao_social.trim(),
          nomeFantasia: empresa.nome_fantasia?.trim() || null,
          cnpj: empresa.cnpj.trim(),
          email: empresa.email?.trim() || null,
          telefone: empresa.telefone?.trim() || null,
          endereco: empresa.endereco?.trim() || null,
          status: "active",
        })
        .returning()

      const senhaHash = await bcrypt.hash(admin.senha, 10)

      const [adminRow] = await tx
        .insert(colaboradores)
        .values({
          empresaId: empresaRow.id,
          nomeCompleto: admin.nome_completo.trim(),
          email: emailAdmin,
          senhaHash,
          tipoAcesso: "Adm",
          salario: "0",
          diaPagamento: 1,
        })
        .returning()

      return { empresaRow, adminRow }
    })
    novaEmpresa = resultado.empresaRow
    novoAdmin = resultado.adminRow
  } catch (error) {
    console.error("[empresas] Erro ao criar empresa:", error)
    return { success: false, error: error instanceof Error ? error.message : "Erro ao criar empresa" }
  }

  await registrarAuditoria({
    colaboradorId: usuario.id,
    empresaId: novaEmpresa.id,
    acao: "empresa_criada",
    tabela: "empresas",
    registroId: novaEmpresa.id,
    detalhes: { razao_social: novaEmpresa.razaoSocial, admin_email: novoAdmin.email },
  })

  revalidatePath("/admin/empresas")
  return { success: true, empresa: toEmpresaDTO(novaEmpresa), admin: toColaboradorDTO(novoAdmin) }
}

export async function atualizarEmpresa(id: string, data: Partial<EmpresaFormData>) {
  const usuario = await requireSuperAdmin()

  const updateData: Record<string, unknown> = { updatedAt: new Date() }
  if (data.razao_social !== undefined) updateData.razaoSocial = data.razao_social.trim()
  if (data.nome_fantasia !== undefined) updateData.nomeFantasia = data.nome_fantasia?.trim() || null
  if (data.cnpj !== undefined) updateData.cnpj = data.cnpj.trim()
  if (data.email !== undefined) updateData.email = data.email?.trim() || null
  if (data.telefone !== undefined) updateData.telefone = data.telefone?.trim() || null
  if (data.endereco !== undefined) updateData.endereco = data.endereco?.trim() || null

  try {
    await db.update(empresas).set(updateData).where(eq(empresas.id, id))
  } catch (error) {
    console.error("[empresas] Erro ao atualizar empresa:", error)
    return { success: false, error: error instanceof Error ? error.message : "Erro ao atualizar empresa" }
  }

  await registrarAuditoria({
    colaboradorId: usuario.id,
    empresaId: id,
    acao: "empresa_atualizada",
    tabela: "empresas",
    registroId: id,
    detalhes: data as Record<string, unknown>,
  })

  revalidatePath("/admin/empresas")
  revalidatePath(`/admin/empresas/${id}`)
  return { success: true }
}

export async function atualizarStatusEmpresa(id: string, status: "active" | "inactive" | "blocked", motivo?: string) {
  const usuario = await requireSuperAdmin()

  if (status === "blocked" && !motivo?.trim()) {
    return { success: false, error: "Informe o motivo do bloqueio" }
  }

  const updateData: Record<string, unknown> = { status, updatedAt: new Date() }
  if (status === "blocked") {
    updateData.bloqueadoMotivo = motivo!.trim()
    updateData.bloqueadoEm = new Date()
    updateData.bloqueadoPor = usuario.id
  } else {
    // Desbloqueou (voltou pra active/inactive) — limpa o registro do bloqueio anterior.
    updateData.bloqueadoMotivo = null
    updateData.bloqueadoEm = null
    updateData.bloqueadoPor = null
  }

  try {
    await db.update(empresas).set(updateData).where(eq(empresas.id, id))
  } catch (error) {
    console.error("[empresas] Erro ao atualizar status da empresa:", error)
    return { success: false, error: error instanceof Error ? error.message : "Erro ao atualizar status" }
  }

  await registrarAuditoria({
    colaboradorId: usuario.id,
    empresaId: id,
    acao: "empresa_status_alterado",
    tabela: "empresas",
    registroId: id,
    detalhes: { novo_status: status, motivo: status === "blocked" ? motivo!.trim() : undefined },
  })

  revalidatePath("/admin/empresas")
  revalidatePath(`/admin/empresas/${id}`)
  return { success: true }
}

// ---------- Gestão de usuários de uma empresa (SuperAdmin) ----------

export async function listarUsuariosDaEmpresa(empresaId: string) {
  await requireSuperAdmin()
  const rows = await db
    .select({
      id: colaboradores.id,
      nomeCompleto: colaboradores.nomeCompleto,
      email: colaboradores.email,
      tipoAcesso: colaboradores.tipoAcesso,
    })
    .from(colaboradores)
    .where(eq(colaboradores.empresaId, empresaId))
    .orderBy(asc(colaboradores.nomeCompleto))

  return rows.map((row) => ({
    id: row.id,
    nome_completo: row.nomeCompleto,
    email: row.email,
    tipo_acesso: row.tipoAcesso,
  }))
}

export interface CredenciaisFormData {
  nome_completo?: string
  email?: string
  nova_senha?: string
}

// Edita e-mail/senha/nome de um usuário de qualquer empresa — o e-mail é o identificador de
// login em toda a plataforma (único globalmente), então checa duplicata excluindo o próprio id.
export async function atualizarCredenciaisUsuario(userId: string, data: CredenciaisFormData) {
  const usuario = await requireSuperAdmin()

  const updateData: Record<string, unknown> = {}

  if (data.nome_completo !== undefined) {
    updateData.nomeCompleto = data.nome_completo.trim()
  }

  if (data.email !== undefined) {
    const sanitizedEmail = data.email.trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sanitizedEmail)) {
      return { success: false, error: "E-mail inválido" }
    }
    const [emailExistente] = await db
      .select({ id: colaboradores.id })
      .from(colaboradores)
      .where(and(eq(colaboradores.email, sanitizedEmail), ne(colaboradores.id, userId)))
    if (emailExistente) {
      return { success: false, error: "Este e-mail já está em uso por outro usuário" }
    }
    updateData.email = sanitizedEmail
  }

  if (data.nova_senha !== undefined && data.nova_senha.trim()) {
    if (data.nova_senha.length < 8) {
      return { success: false, error: "A nova senha deve ter no mínimo 8 caracteres" }
    }
    updateData.senhaHash = await bcrypt.hash(data.nova_senha, 10)
  }

  if (Object.keys(updateData).length === 0) {
    return { success: false, error: "Nada para atualizar" }
  }

  try {
    await db.update(colaboradores).set(updateData).where(eq(colaboradores.id, userId))
  } catch (error) {
    console.error("[empresas] Erro ao atualizar credenciais do usuário:", error)
    return { success: false, error: error instanceof Error ? error.message : "Erro ao atualizar credenciais" }
  }

  const [alvo] = await db.select({ empresaId: colaboradores.empresaId }).from(colaboradores).where(eq(colaboradores.id, userId))
  await registrarAuditoria({
    colaboradorId: usuario.id,
    empresaId: alvo?.empresaId ?? null,
    acao: "credenciais_usuario_atualizadas",
    tabela: "colaboradores",
    registroId: userId,
    // Nunca logar a senha em texto puro — só o fato de que foi trocada.
    detalhes: { nome_alterado: data.nome_completo !== undefined, email_alterado: data.email !== undefined, senha_alterada: !!data.nova_senha },
  })

  revalidatePath("/admin/empresas")
  return { success: true }
}
