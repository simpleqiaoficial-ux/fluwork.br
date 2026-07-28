"use server"

import { eq, and, asc } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { empresaModulos, empresas } from "@/lib/db/schema"
import { requireSuperAdmin } from "@/lib/tenant"
import { registrarAuditoria } from "@/lib/audit"
import { MODULOS, type Modulo, type ModulosBloqueados } from "@/lib/modulos"
import { getModulosBloqueadosDaEmpresa } from "@/lib/modulos-server"

export async function listarModulosBloqueados(empresaId: string): Promise<ModulosBloqueados> {
  await requireSuperAdmin()
  return getModulosBloqueadosDaEmpresa(empresaId)
}

export interface EmpresaComModulos {
  id: string
  nome: string
  razaoSocial: string
  cnpj: string
  modulos: ModulosBloqueados
}

/** Visão consolidada pra tela /admin/modulos — todas as empresas de uma vez, em vez de abrir
 *  o detalhe de cada uma pra ver o que está bloqueado. */
export async function listarEmpresasComModulos(): Promise<EmpresaComModulos[]> {
  await requireSuperAdmin()

  const empresasRows = await db
    .select({ id: empresas.id, razaoSocial: empresas.razaoSocial, nomeFantasia: empresas.nomeFantasia, cnpj: empresas.cnpj })
    .from(empresas)
    .orderBy(asc(empresas.razaoSocial))

  const modulosRows = await db.select().from(empresaModulos)
  const porEmpresa = new Map<string, ModulosBloqueados>()
  for (const row of modulosRows) {
    if (!MODULOS.includes(row.modulo as Modulo)) continue
    if (!porEmpresa.has(row.empresaId)) {
      porEmpresa.set(row.empresaId, { financeiro: null, contratos: null, ehs: null })
    }
    porEmpresa.get(row.empresaId)![row.modulo as Modulo] = { motivo: row.motivo, bloqueadoEm: row.bloqueadoEm }
  }

  return empresasRows.map((empresa) => ({
    id: empresa.id,
    nome: empresa.nomeFantasia || empresa.razaoSocial,
    razaoSocial: empresa.razaoSocial,
    cnpj: empresa.cnpj,
    modulos: porEmpresa.get(empresa.id) || { financeiro: null, contratos: null, ehs: null },
  }))
}

export async function bloquearModulo(empresaId: string, modulo: Modulo, motivo: string) {
  const usuario = await requireSuperAdmin()

  if (!MODULOS.includes(modulo)) {
    return { success: false, error: "Módulo inválido" }
  }
  if (!motivo.trim()) {
    return { success: false, error: "Informe o motivo do bloqueio" }
  }

  try {
    await db
      .insert(empresaModulos)
      .values({ empresaId, modulo, motivo: motivo.trim(), bloqueadoPor: usuario.id })
      .onConflictDoUpdate({
        target: [empresaModulos.empresaId, empresaModulos.modulo],
        set: { motivo: motivo.trim(), bloqueadoEm: new Date(), bloqueadoPor: usuario.id },
      })
  } catch (error) {
    console.error("[modulos] Erro ao bloquear módulo:", error)
    return { success: false, error: error instanceof Error ? error.message : "Erro ao bloquear módulo" }
  }

  await registrarAuditoria({
    colaboradorId: usuario.id,
    empresaId,
    acao: "modulo_bloqueado",
    tabela: "empresa_modulos",
    registroId: empresaId,
    detalhes: { modulo, motivo: motivo.trim() },
  })

  revalidatePath("/admin/empresas")
  revalidatePath(`/admin/empresas/${empresaId}`)
  return { success: true }
}

export async function liberarModulo(empresaId: string, modulo: Modulo) {
  const usuario = await requireSuperAdmin()

  if (!MODULOS.includes(modulo)) {
    return { success: false, error: "Módulo inválido" }
  }

  try {
    await db.delete(empresaModulos).where(and(eq(empresaModulos.empresaId, empresaId), eq(empresaModulos.modulo, modulo)))
  } catch (error) {
    console.error("[modulos] Erro ao liberar módulo:", error)
    return { success: false, error: error instanceof Error ? error.message : "Erro ao liberar módulo" }
  }

  await registrarAuditoria({
    colaboradorId: usuario.id,
    empresaId,
    acao: "modulo_liberado",
    tabela: "empresa_modulos",
    registroId: empresaId,
    detalhes: { modulo },
  })

  revalidatePath("/admin/empresas")
  revalidatePath(`/admin/empresas/${empresaId}`)
  return { success: true }
}
