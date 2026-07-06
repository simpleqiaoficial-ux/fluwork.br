"use server"

import { and, count, desc, eq, ilike, or } from "drizzle-orm"
import { db } from "@/lib/db"
import { colaboradores, empresas, equipes, pedidosPagamento, historicoReajustes, notasFiscais } from "@/lib/db/schema"
import { requireSuperAdmin } from "@/lib/tenant"

const PAGE_SIZE = 25

export interface ColaboradoresAdminFiltro {
  empresaId?: string
  busca?: string
  page?: number
}

// Espelho cross-empresa de colaboradores pro painel SuperAdmin — sempre paginado (nunca
// um SELECT sem limite) e sempre com filtro por empresa disponível, exatamente pra não
// sobrecarregar o banco com um "listar tudo" de uma vez.
export async function listarColaboradoresAdmin(filtro: ColaboradoresAdminFiltro = {}) {
  await requireSuperAdmin()

  const condicoes = []
  if (filtro.empresaId) condicoes.push(eq(colaboradores.empresaId, filtro.empresaId))
  if (filtro.busca?.trim()) {
    const termo = `%${filtro.busca.trim()}%`
    condicoes.push(or(ilike(colaboradores.nomeCompleto, termo), ilike(colaboradores.email, termo), ilike(colaboradores.cnpj, termo)))
  }
  const where = condicoes.length > 0 ? and(...condicoes) : undefined
  const page = Math.max(1, filtro.page || 1)

  const [rows, totalRows] = await Promise.all([
    db
      .select({
        id: colaboradores.id,
        nomeCompleto: colaboradores.nomeCompleto,
        email: colaboradores.email,
        cnpj: colaboradores.cnpj,
        tipoAcesso: colaboradores.tipoAcesso,
        empresaId: colaboradores.empresaId,
        empresaNome: empresas.nomeFantasia,
        empresaRazaoSocial: empresas.razaoSocial,
        equipeNome: equipes.nome,
        createdAt: colaboradores.createdAt,
      })
      .from(colaboradores)
      .leftJoin(empresas, eq(colaboradores.empresaId, empresas.id))
      .leftJoin(equipes, eq(colaboradores.equipeId, equipes.id))
      .where(where)
      .orderBy(desc(colaboradores.createdAt))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db.select({ value: count() }).from(colaboradores).where(where),
  ])

  const total = totalRows[0]?.value || 0

  return {
    registros: rows.map((row) => ({
      id: row.id,
      nome_completo: row.nomeCompleto,
      email: row.email,
      cnpj: row.cnpj,
      tipo_acesso: row.tipoAcesso,
      empresa_id: row.empresaId,
      empresa_nome: row.empresaNome || row.empresaRazaoSocial,
      equipe_nome: row.equipeNome,
      created_at: row.createdAt,
    })),
    total,
    page,
    total_paginas: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  }
}

// Impacto de excluir um colaborador — mostrado antes da confirmação de exclusão, pra
// avisar exatamente o que seria apagado em cascata (ver comentário em deletarColaborador).
export async function getImpactoExclusaoColaborador(id: string) {
  await requireSuperAdmin()

  const [[{ value: pedidos }], [{ value: reajustes }], [{ value: notas }]] = await Promise.all([
    db.select({ value: count() }).from(pedidosPagamento).where(eq(pedidosPagamento.colaboradorId, id)),
    db.select({ value: count() }).from(historicoReajustes).where(eq(historicoReajustes.colaboradorId, id)),
    db.select({ value: count() }).from(notasFiscais).where(eq(notasFiscais.colaboradorId, id)),
  ])

  return {
    pedidos_pagamento: pedidos,
    historico_reajustes: reajustes,
    notas_fiscais: notas,
    bloqueia_exclusao: pedidos > 0 || reajustes > 0 || notas > 0,
  }
}
