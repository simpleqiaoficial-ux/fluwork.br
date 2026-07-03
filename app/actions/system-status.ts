"use server"

import { createAdminClient } from "@/lib/supabase-server"
import { getSession } from "@/lib/session"
import { revalidatePath } from "next/cache"

export type SystemStatus = {
  id: string
  is_active: boolean
  suspended_reason: string | null
  suspended_at: string | null
  suspended_by: string | null
  reactivated_at: string | null
  reactivated_by: string | null
  created_at: string
  updated_at: string
}

/**
 * Obtem o status atual do sistema
 */
export async function getSystemStatus(): Promise<{
  success: boolean
  data?: SystemStatus
  error?: string
}> {
  try {
    const supabase = await createAdminClient()
    
    const { data, error } = await supabase
      .from("system_status")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      return { success: false, error: error.message }
    }

    // Se nao existe registro, o sistema esta ativo por padrao
    if (!data) {
      return { 
        success: true, 
        data: {
          id: "",
          is_active: true,
          suspended_reason: null,
          suspended_at: null,
          suspended_by: null,
          reactivated_at: null,
          reactivated_by: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      }
    }

    return { success: true, data }
  } catch (error) {
    return { success: false, error: "Erro ao obter status do sistema" }
  }
}

/**
 * Suspende o sistema (apenas Adm)
 */
export async function suspendSystem(reason: string): Promise<{
  success: boolean
  error?: string
}> {
  const session = await getSession()

  if (!session?.colaboradorId) {
    return { success: false, error: "Usuario nao autenticado" }
  }

  if (session.tipoAcesso !== "Adm") {
    return { success: false, error: "Apenas administradores podem suspender o sistema" }
  }

  if (!reason || reason.trim().length < 5) {
    return { success: false, error: "Informe um motivo valido para a suspensao" }
  }

  try {
    const supabase = await createAdminClient()

    // Verifica se ja existe um registro
    const { data: existing } = await supabase
      .from("system_status")
      .select("id")
      .limit(1)
      .maybeSingle()

    if (existing) {
      // Atualiza o registro existente
      const { error } = await supabase
        .from("system_status")
        .update({
          is_active: false,
          suspended_reason: reason.trim(),
          suspended_at: new Date().toISOString(),
          suspended_by: session.colaboradorId,
          reactivated_at: null,
          reactivated_by: null,
          updated_at: new Date().toISOString()
        })
        .eq("id", existing.id)

      if (error) {
        return { success: false, error: error.message }
      }
    } else {
      // Cria novo registro
      const { error } = await supabase
        .from("system_status")
        .insert({
          is_active: false,
          suspended_reason: reason.trim(),
          suspended_at: new Date().toISOString(),
          suspended_by: session.colaboradorId
        })

      if (error) {
        return { success: false, error: error.message }
      }
    }

    revalidatePath("/")
    return { success: true }
  } catch (error) {
    return { success: false, error: "Erro ao suspender o sistema" }
  }
}

/**
 * Reativa o sistema (apenas Adm)
 */
export async function reactivateSystem(): Promise<{
  success: boolean
  error?: string
}> {
  const session = await getSession()

  if (!session?.colaboradorId) {
    return { success: false, error: "Usuario nao autenticado" }
  }

  if (session.tipoAcesso !== "Adm") {
    return { success: false, error: "Apenas administradores podem reativar o sistema" }
  }

  try {
    const supabase = await createAdminClient()

    const { data: existing } = await supabase
      .from("system_status")
      .select("id")
      .limit(1)
      .maybeSingle()

    if (!existing) {
      return { success: false, error: "Nenhum registro de status encontrado" }
    }

    const { error } = await supabase
      .from("system_status")
      .update({
        is_active: true,
        reactivated_at: new Date().toISOString(),
        reactivated_by: session.colaboradorId,
        updated_at: new Date().toISOString()
      })
      .eq("id", existing.id)

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath("/")
    return { success: true }
  } catch (error) {
    return { success: false, error: "Erro ao reativar o sistema" }
  }
}
