"use server"

import { desc, eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { systemStatus } from "@/lib/db/schema"
import { toSystemStatusDTO } from "@/lib/db/mappers"
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
    const [data] = await db
      .select()
      .from(systemStatus)
      .orderBy(desc(systemStatus.createdAt))
      .limit(1)

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

    return { success: true, data: toSystemStatusDTO(data) as SystemStatus }
  } catch (error) {
    return { success: false, error: "Erro ao obter status do sistema" }
  }
}

/**
 * Suspende o sistema inteiro (apenas SuperAdmin — é um interruptor de manutenção da
 * plataforma inteira, não algo que o admin de uma empresa cliente deveria controlar).
 */
export async function suspendSystem(reason: string): Promise<{
  success: boolean
  error?: string
}> {
  const session = await getSession()

  if (!session?.colaboradorId) {
    return { success: false, error: "Usuário não autenticado" }
  }

  if (session.tipoAcesso !== "SuperAdmin") {
    return { success: false, error: "Apenas o time FluWork pode suspender o sistema" }
  }

  if (!reason || reason.trim().length < 5) {
    return { success: false, error: "Informe um motivo válido para a suspensão" }
  }

  try {
    // Verifica se ja existe um registro
    const [existing] = await db
      .select({ id: systemStatus.id })
      .from(systemStatus)
      .limit(1)

    if (existing) {
      // Atualiza o registro existente
      try {
        await db
          .update(systemStatus)
          .set({
            isActive: false,
            suspendedReason: reason.trim(),
            suspendedAt: new Date(),
            suspendedBy: session.colaboradorId,
            reactivatedAt: null,
            reactivatedBy: null,
            updatedAt: new Date()
          })
          .where(eq(systemStatus.id, existing.id))
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : String(error) }
      }
    } else {
      // Cria novo registro
      try {
        await db.insert(systemStatus).values({
          isActive: false,
          suspendedReason: reason.trim(),
          suspendedAt: new Date(),
          suspendedBy: session.colaboradorId
        })
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : String(error) }
      }
    }

    revalidatePath("/")
    return { success: true }
  } catch (error) {
    return { success: false, error: "Erro ao suspender o sistema" }
  }
}

/**
 * Reativa o sistema inteiro (apenas SuperAdmin)
 */
export async function reactivateSystem(): Promise<{
  success: boolean
  error?: string
}> {
  const session = await getSession()

  if (!session?.colaboradorId) {
    return { success: false, error: "Usuário não autenticado" }
  }

  if (session.tipoAcesso !== "SuperAdmin") {
    return { success: false, error: "Apenas o time FluWork pode reativar o sistema" }
  }

  try {
    const [existing] = await db
      .select({ id: systemStatus.id })
      .from(systemStatus)
      .limit(1)

    if (!existing) {
      return { success: false, error: "Nenhum registro de status encontrado" }
    }

    try {
      await db
        .update(systemStatus)
        .set({
          isActive: true,
          reactivatedAt: new Date(),
          reactivatedBy: session.colaboradorId,
          updatedAt: new Date()
        })
        .where(eq(systemStatus.id, existing.id))
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }

    revalidatePath("/")
    return { success: true }
  } catch (error) {
    return { success: false, error: "Erro ao reativar o sistema" }
  }
}
