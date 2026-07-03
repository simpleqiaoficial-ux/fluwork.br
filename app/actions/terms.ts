"use server"

import { createAdminClient } from "@/lib/supabase-server"
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

  const supabase = await createAdminClient()

  const { data, error } = await supabase
    .from("user_terms_acceptance")
    .select("*")
    .eq("user_id", targetUserId)
    .eq("version", CURRENT_TERMS_VERSION)
    .eq("accepted", true)
    .maybeSingle()

  if (error) {
    console.error("[v0] Error checking terms acceptance:", error)
    return { accepted: false, version: CURRENT_TERMS_VERSION, acceptedAt: null }
  }

  return {
    accepted: !!data,
    version: CURRENT_TERMS_VERSION,
    acceptedAt: data?.accepted_at || null,
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

  const supabase = await createAdminClient()
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
  const { data: existing } = await supabase
    .from("user_terms_acceptance")
    .select("id")
    .eq("user_id", userId)
    .eq("version", CURRENT_TERMS_VERSION)
    .maybeSingle()

  if (existing) {
    // Atualiza o registro existente
    const { error } = await supabase
      .from("user_terms_acceptance")
      .update({
        accepted: true,
        accepted_at: new Date().toISOString(),
        ip_address: ipAddress,
        device_info: deviceInfo,
        user_agent: userAgent,
      })
      .eq("id", existing.id)

    if (error) {
      console.error("[v0] Error updating terms acceptance:", error)
      return { success: false, error: "Erro ao registrar aceite dos termos" }
    }
  } else {
    // Cria novo registro
    const { error } = await supabase.from("user_terms_acceptance").insert({
      user_id: userId,
      version: CURRENT_TERMS_VERSION,
      accepted: true,
      accepted_at: new Date().toISOString(),
      ip_address: ipAddress,
      device_info: deviceInfo,
      user_agent: userAgent,
    })

    if (error) {
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

  const supabase = await createAdminClient()
  const headersList = await headers()

  const userAgent = headersList.get("user-agent") || null
  const forwardedFor = headersList.get("x-forwarded-for")
  const realIp = headersList.get("x-real-ip")
  const ipAddress = forwardedFor?.split(",")[0].trim() || realIp || null

  // Registra a recusa para auditoria
  const { error } = await supabase.from("user_terms_acceptance").insert({
    user_id: userId,
    version: CURRENT_TERMS_VERSION,
    accepted: false,
    accepted_at: null,
    ip_address: ipAddress,
    device_info: null,
    user_agent: userAgent,
  })

  if (error && error.code !== "23505") {
    // Ignora erro de duplicata
    console.error("[v0] Error recording terms decline:", error)
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

  if (!session || !["Admin", "Financeiro", "Gestor"].includes(session.tipoAcesso)) {
    return { data: [], error: "Sem permissão para visualizar aceites" }
  }

  const supabase = await createAdminClient()

  let query = supabase
    .from("user_terms_acceptance")
    .select("*")
    .order("created_at", { ascending: false })

  if (filters?.version) {
    query = query.eq("version", filters.version)
  }

  if (filters?.accepted !== undefined) {
    query = query.eq("accepted", filters.accepted)
  }

  const { data: acceptances, error } = await query

  if (error) {
    console.error("[v0] Error listing terms acceptances:", error)
    return { data: [], error: "Erro ao listar aceites" }
  }

  // Busca informações dos usuários
  const userIds = [...new Set(acceptances?.map((a) => a.user_id) || [])]
  
  const { data: colaboradores } = await supabase
    .from("colaboradores")
    .select("id, nome_completo, email")
    .in("id", userIds)

  const colaboradoresMap = new Map(
    colaboradores?.map((c) => [c.id, { nome_completo: c.nome_completo, email: c.email }]) || []
  )

  const result: TermsAcceptanceWithUser[] = (acceptances || []).map((acceptance) => ({
    ...acceptance,
    colaborador: colaboradoresMap.get(acceptance.user_id),
  }))

  // Filtra por busca se necessário
  if (filters?.search) {
    const searchLower = filters.search.toLowerCase()
    return {
      data: result.filter(
        (item) =>
          item.colaborador?.nome_completo.toLowerCase().includes(searchLower) ||
          item.colaborador?.email.toLowerCase().includes(searchLower)
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

  if (!session || !["Admin", "Financeiro", "Gestor"].includes(session.tipoAcesso)) {
    return {
      totalUsers: 0,
      acceptedCurrentVersion: 0,
      pendingAcceptance: 0,
      declinedCurrentVersion: 0,
    }
  }

  const supabase = await createAdminClient()

  // Total de usuários ativos
  const { count: totalUsers } = await supabase
    .from("colaboradores")
    .select("*", { count: "exact", head: true })
    .eq("ativo", true)

  // Aceites da versão atual
  const { count: acceptedCurrentVersion } = await supabase
    .from("user_terms_acceptance")
    .select("*", { count: "exact", head: true })
    .eq("version", CURRENT_TERMS_VERSION)
    .eq("accepted", true)

  // Recusas da versão atual
  const { count: declinedCurrentVersion } = await supabase
    .from("user_terms_acceptance")
    .select("*", { count: "exact", head: true })
    .eq("version", CURRENT_TERMS_VERSION)
    .eq("accepted", false)

  return {
    totalUsers: totalUsers || 0,
    acceptedCurrentVersion: acceptedCurrentVersion || 0,
    pendingAcceptance: (totalUsers || 0) - (acceptedCurrentVersion || 0),
    declinedCurrentVersion: declinedCurrentVersion || 0,
  }
}
