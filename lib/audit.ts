"use server"

import { headers } from "next/headers"
import { db } from "@/lib/db"
import { auditLog } from "@/lib/db/schema"

interface RegistrarAuditoriaParams {
  colaboradorId?: string | null
  empresaId?: string | null
  acao: string
  tabela?: string
  registroId?: string
  detalhes?: Record<string, unknown>
}

/**
 * Grava uma linha em audit_log — usado por toda ação sensível do painel SuperAdmin
 * (edição/exclusão de dados de outra empresa, mudança de status, impersonation).
 * Best-effort: uma falha ao gravar o log nunca deve derrubar a ação que está sendo auditada.
 */
export async function registrarAuditoria(params: RegistrarAuditoriaParams): Promise<void> {
  try {
    const headersList = await headers()
    const forwardedFor = headersList.get("x-forwarded-for")
    const realIp = headersList.get("x-real-ip")
    const ipAddress = forwardedFor?.split(",")[0].trim() || realIp || null

    await db.insert(auditLog).values({
      empresaId: params.empresaId || null,
      colaboradorId: params.colaboradorId || null,
      acao: params.acao,
      tabela: params.tabela || null,
      registroId: params.registroId || null,
      detalhes: params.detalhes || null,
      ipAddress,
    })
  } catch (error) {
    console.error("[audit] Erro ao gravar log de auditoria:", error)
  }
}
