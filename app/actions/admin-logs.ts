"use server"

import { and, count, desc, eq, gte, lte } from "drizzle-orm"
import { db } from "@/lib/db"
import { auditLog } from "@/lib/db/schema"
import { toAuditLogDTO } from "@/lib/db/mappers"
import { requireSuperAdmin } from "@/lib/tenant"

const PAGE_SIZE = 30

export interface AuditLogFiltro {
  empresaId?: string
  acao?: string
  dataInicio?: string
  dataFim?: string
  page?: number
}

export async function listarAuditLog(filtro: AuditLogFiltro = {}) {
  await requireSuperAdmin()

  const condicoes = []
  if (filtro.empresaId) condicoes.push(eq(auditLog.empresaId, filtro.empresaId))
  if (filtro.acao) condicoes.push(eq(auditLog.acao, filtro.acao))
  if (filtro.dataInicio) condicoes.push(gte(auditLog.createdAt, new Date(filtro.dataInicio)))
  if (filtro.dataFim) condicoes.push(lte(auditLog.createdAt, new Date(filtro.dataFim)))

  const where = condicoes.length > 0 ? and(...condicoes) : undefined
  const page = Math.max(1, filtro.page || 1)

  const [rows, totalRows] = await Promise.all([
    db.query.auditLog.findMany({
      where,
      orderBy: [desc(auditLog.createdAt)],
      limit: PAGE_SIZE,
      offset: (page - 1) * PAGE_SIZE,
      with: { empresa: true, colaborador: true },
    }),
    db.select({ value: count() }).from(auditLog).where(where),
  ])

  const total = totalRows[0]?.value || 0

  return {
    registros: rows.map(toAuditLogDTO),
    total,
    page,
    total_paginas: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  }
}

// Lista de ações distintas já registradas — usada pro dropdown de filtro.
export async function listarAcoesDistintasAuditLog(): Promise<string[]> {
  await requireSuperAdmin()
  const rows = await db.selectDistinct({ acao: auditLog.acao }).from(auditLog).orderBy(auditLog.acao)
  return rows.map((r) => r.acao)
}
