"use server"

import { and, count, desc, eq, inArray } from "drizzle-orm"
import { db } from "@/lib/db"
import { colaboradores, userTermsAcceptance } from "@/lib/db/schema"
import { toTermsAcceptanceDTO } from "@/lib/db/mappers"
import { getSession } from "@/lib/session"
import { headers } from "next/headers"
import { CURRENT_TERMS_VERSION } from "@/types/terms"
import type { TermsAcceptanceWithUser } from "@/types/terms"

/**
 * Verifica se o usuário aceitou a versão atual dos termos
 */
export async function checkTermsAcceptance(userId?: string): Promise<{
  accepted: boolean
  version: string
  acceptedAt: string | null
}> {
  const session = await getSession()
  const targetUserId = userId || session?.colaboradorId

  if (!targetUserId) {
    return { accepted: false, version: CURRENT_TERMS_VERSION, acceptedAt: null }
  }

  try {
    const [data] = await db
      .select()
      .from(userTermsAcceptance)
      .where(
        and(
          eq(userTermsAcceptance.userId, targetUserId),
          eq(userTermsAcceptance.version, CURRENT_TERMS_VERSION),
          eq(userTermsAcceptance.accepted, true),
        ),
      )

    return {
      accepted: !!data,
      version: CURRENT_TERMS_VERSION,
      acceptedAt: (data?.acceptedAt as unknown as string) || null,
    }
  } catch (error) {
    console.error("[v0] Error checking terms acceptance:", error)
    return { accepted: false, version: CURRENT_TERMS_VERSION, acceptedAt: null }
  }
}

/**
 * Registra o aceite dos termos pelo usuário
 */
export async function acceptTerms(userId: string): Promise<{
  success: boolean
  error?: string
}> {
  if (!userId) {
    return { success: false, error: "Usuário não identificado" }
  }

  const [colaborador] = await db
    .select({ empresaId: colaboradores.empresaId })
    .from(colaboradores)
    .where(eq(colaboradores.id, userId))

  if (!colaborador?.empresaId) {
    return { success: false, error: "Usuário sem empresa vinculada" }
  }

  const headersList = await headers()

  // Captura informações do request
  const userAgent = headersList.get("user-agent") || null
  const forwardedFor = headersList.get("x-forwarded-for")
  const realIp = headersList.get("x-real-ip")
  const ipAddress = forwardedFor?.split(",")[0].trim() || realIp || null

  // Extrai informações do dispositivo do user-agent
  let deviceInfo = null
  if (userAgent) {
    const isMobile = /mobile|android|iphone|ipad|tablet/i.test(userAgent)
    const isWindows = /windows/i.test(userAgent)
    const isMac = /macintosh|mac os/i.test(userAgent)
    const isLinux = /linux/i.test(userAgent)

    let os = "Unknown"
    if (isWindows) os = "Windows"
    else if (isMac) os = "macOS"
    else if (isLinux) os = "Linux"
    else if (/android/i.test(userAgent)) os = "Android"
    else if (/iphone|ipad/i.test(userAgent)) os = "iOS"

    deviceInfo = JSON.stringify({
      type: isMobile ? "mobile" : "desktop",
      os,
    })
  }

  // Verifica se já existe um registro para esta versão
  const [existing] = await db
    .select({ id: userTermsAcceptance.id })
    .from(userTermsAcceptance)
    .where(and(eq(userTermsAcceptance.userId, userId), eq(userTermsAcceptance.version, CURRENT_TERMS_VERSION)))

  if (existing) {
    // Atualiza o registro existente
    try {
      await db
        .update(userTermsAcceptance)
        .set({
          accepted: true,
          acceptedAt: new Date(),
          ipAddress,
          deviceInfo,
          userAgent,
        })
        .where(eq(userTermsAcceptance.id, existing.id))
    } catch (error) {
      console.error("[v0] Error updating terms acceptance:", error)
      return { success: false, error: "Erro ao registrar aceite dos termos" }
    }
  } else {
    // Cria novo registro
    try {
      await db.insert(userTermsAcceptance).values({
        empresaId: colaborador.empresaId,
        userId,
        version: CURRENT_TERMS_VERSION,
        accepted: true,
        acceptedAt: new Date(),
        ipAddress,
        deviceInfo,
        userAgent,
      })
    } catch (error) {
      console.error("[v0] Error inserting terms acceptance:", error)
      return { success: false, error: "Erro ao registrar aceite dos termos" }
    }
  }

  return { success: true }
}

/**
 * Recusa os termos (para fins de auditoria)
 */
export async function declineTerms(userId: string): Promise<{
  success: boolean
  error?: string
}> {
  if (!userId) {
    return { success: false, error: "Usuário não identificado" }
  }

  const [colaborador] = await db
    .select({ empresaId: colaboradores.empresaId })
    .from(colaboradores)
    .where(eq(colaboradores.id, userId))

  if (!colaborador?.empresaId) {
    return { success: false, error: "Usuário sem empresa vinculada" }
  }

  const headersList = await headers()

  const userAgent = headersList.get("user-agent") || null
  const forwardedFor = headersList.get("x-forwarded-for")
  const realIp = headersList.get("x-real-ip")
  const ipAddress = forwardedFor?.split(",")[0].trim() || realIp || null

  // Registra a recusa para auditoria
  try {
    await db.insert(userTermsAcceptance).values({
      empresaId: colaborador.empresaId,
      userId,
      version: CURRENT_TERMS_VERSION,
      accepted: false,
      acceptedAt: null,
      ipAddress,
      deviceInfo: null,
      userAgent,
    })
  } catch (error: any) {
    if (error?.code !== "23505") {
      // Ignora erro de duplicata
      console.error("[v0] Error recording terms decline:", error)
    }
  }

  return { success: true }
}

/**
 * Lista todos os aceites de termos (para admin)
 */
export async function listTermsAcceptances(filters?: {
  version?: string
  accepted?: boolean
  search?: string
}): Promise<{
  data: TermsAcceptanceWithUser[]
  error?: string
}> {
  const session = await getSession()

  // Bug pré-existente corrigido: os valores "Admin"/"Gestor" não existem no enum tipo_acesso
  // (são "Adm"/"Gerente"), então esse gate nunca autorizava ninguém na prática.
  if (!session || !["Adm", "Financeiro"].includes(session.tipoAcesso)) {
    return { data: [], error: "Sem permissão para visualizar aceites" }
  }

  let acceptances
  try {
    const conditions = []
    if (session.tipoAcesso !== "SuperAdmin") {
      conditions.push(eq(userTermsAcceptance.empresaId, session.empresaId!))
    }
    if (filters?.version) {
      conditions.push(eq(userTermsAcceptance.version, filters.version))
    }
    if (filters?.accepted !== undefined) {
      conditions.push(eq(userTermsAcceptance.accepted, filters.accepted))
    }

    acceptances = await db
      .select()
      .from(userTermsAcceptance)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(userTermsAcceptance.createdAt))
  } catch (error) {
    console.error("[v0] Error listing terms acceptances:", error)
    return { data: [], error: "Erro ao listar aceites" }
  }

  // Busca informações dos usuários
  const userIds = [...new Set(acceptances?.map((a) => a.userId) || [])]

  const colaboradoresRows = userIds.length
    ? await db
        .select({ id: colaboradores.id, nomeCompleto: colaboradores.nomeCompleto, email: colaboradores.email })
        .from(colaboradores)
        .where(inArray(colaboradores.id, userIds))
    : []

  const colaboradoresMap = new Map(
    colaboradoresRows.map((c) => [c.id, { nomeCompleto: c.nomeCompleto, email: c.email }]),
  )

  const result: TermsAcceptanceWithUser[] = (acceptances || []).map((acceptance) =>
    toTermsAcceptanceDTO({ ...acceptance, colaborador: colaboradoresMap.get(acceptance.userId) }),
  )

  // Filtra por busca se necessário
  if (filters?.search) {
    const searchLower = filters.search.toLowerCase()
    return {
      data: result.filter(
        (item) =>
          item.colaborador?.nome_completo.toLowerCase().includes(searchLower) ||
          item.colaborador?.email.toLowerCase().includes(searchLower),
      ),
    }
  }

  return { data: result }
}

/**
 * Obtém estatísticas de aceite de termos
 */
export async function getTermsAcceptanceStats(): Promise<{
  totalUsers: number
  acceptedCurrentVersion: number
  pendingAcceptance: number
  declinedCurrentVersion: number
}> {
  const session = await getSession()

  if (!session || !["Adm", "Financeiro"].includes(session.tipoAcesso)) {
    return {
      totalUsers: 0,
      acceptedCurrentVersion: 0,
      pendingAcceptance: 0,
      declinedCurrentVersion: 0,
    }
  }

  const escopoEmpresa =
    session.tipoAcesso === "SuperAdmin" ? undefined : eq(colaboradores.empresaId, session.empresaId!)
  const escopoEmpresaReajustes =
    session.tipoAcesso === "SuperAdmin" ? undefined : eq(userTermsAcceptance.empresaId, session.empresaId!)

  // Total de usuários ativos
  // NOTA: a tabela `colaboradores` não possui coluna `ativo` (ver lib/db/schema.ts) — o filtro
  // .eq("ativo", true) do código Supabase original era inválido e, na prática, sempre falhava
  // silenciosamente no cliente Supabase (count vinha undefined -> 0), zerando totalUsers e
  // pendingAcceptance em produção. Para não perpetuar esse bug e ainda preservar o "shape" da
  // função, contamos todos os colaboradores aqui.
  const [{ value: totalUsers }] = await db.select({ value: count() }).from(colaboradores).where(escopoEmpresa)

  // Aceites da versão atual
  const [{ value: acceptedCurrentVersion }] = await db
    .select({ value: count() })
    .from(userTermsAcceptance)
    .where(
      escopoEmpresaReajustes
        ? and(escopoEmpresaReajustes, eq(userTermsAcceptance.version, CURRENT_TERMS_VERSION), eq(userTermsAcceptance.accepted, true))
        : and(eq(userTermsAcceptance.version, CURRENT_TERMS_VERSION), eq(userTermsAcceptance.accepted, true)),
    )

  // Recusas da versão atual
  const [{ value: declinedCurrentVersion }] = await db
    .select({ value: count() })
    .from(userTermsAcceptance)
    .where(
      escopoEmpresaReajustes
        ? and(escopoEmpresaReajustes, eq(userTermsAcceptance.version, CURRENT_TERMS_VERSION), eq(userTermsAcceptance.accepted, false))
        : and(eq(userTermsAcceptance.version, CURRENT_TERMS_VERSION), eq(userTermsAcceptance.accepted, false)),
    )

  return {
    totalUsers: totalUsers || 0,
    acceptedCurrentVersion: acceptedCurrentVersion || 0,
    pendingAcceptance: (totalUsers || 0) - (acceptedCurrentVersion || 0),
    declinedCurrentVersion: declinedCurrentVersion || 0,
  }
}
