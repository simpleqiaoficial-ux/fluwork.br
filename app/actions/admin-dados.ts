"use server"

import { and, count, desc, eq, ilike, or } from "drizzle-orm"
import { db } from "@/lib/db"
import { colaboradores, empresas, equipes, pedidosPagamento, historicoReajustes, notasFiscais, contracts, faturas } from "@/lib/db/schema"
import { toContratoDTO } from "@/lib/db/mappers"
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

export interface ContratosAdminFiltro {
  empresaId?: string
  busca?: string
  page?: number
}

// Espelho cross-empresa de contratos — só leitura + reaproveita cancelarContrato/
// arquivarContrato já existentes (nunca edição de campo livre de status, que quebraria
// o fluxo de assinatura).
export async function listarContratosAdmin(filtro: ContratosAdminFiltro = {}) {
  await requireSuperAdmin()

  const condicoes = []
  if (filtro.empresaId) condicoes.push(eq(contracts.empresaId, filtro.empresaId))
  if (filtro.busca?.trim()) {
    const termo = `%${filtro.busca.trim()}%`
    condicoes.push(or(ilike(contracts.numero, termo), ilike(contracts.prestadorNome, termo), ilike(contracts.prestadorCpfCnpj, termo)))
  }
  const where = condicoes.length > 0 ? and(...condicoes) : undefined
  const page = Math.max(1, filtro.page || 1)
  const PAGE_SIZE_CONTRATOS = 25

  const [rows, totalRows] = await Promise.all([
    db.query.contracts.findMany({
      where,
      orderBy: [desc(contracts.createdAt)],
      limit: PAGE_SIZE_CONTRATOS,
      offset: (page - 1) * PAGE_SIZE_CONTRATOS,
      with: { empresa: true },
    }),
    db.select({ value: count() }).from(contracts).where(where),
  ])

  const total = totalRows[0]?.value || 0

  return {
    registros: rows.map(toContratoDTO),
    total,
    page,
    total_paginas: Math.max(1, Math.ceil(total / PAGE_SIZE_CONTRATOS)),
  }
}

export interface PedidosAdminFiltro {
  empresaId?: string
  busca?: string
  page?: number
}

const PAGE_SIZE_PEDIDOS = 25

// Espelho cross-empresa de pedidos de pagamento — só leitura + exclusão (sem edição de
// campo: status é regido pelo fluxo de aprovação Gerente→Financeiro já existente).
export async function listarPedidosAdmin(filtro: PedidosAdminFiltro = {}) {
  await requireSuperAdmin()

  const condicoes = []
  if (filtro.empresaId) condicoes.push(eq(pedidosPagamento.empresaId, filtro.empresaId))
  if (filtro.busca?.trim()) {
    condicoes.push(ilike(colaboradores.nomeCompleto, `%${filtro.busca.trim()}%`))
  }
  const where = condicoes.length > 0 ? and(...condicoes) : undefined
  const page = Math.max(1, filtro.page || 1)

  const [rows, totalRows] = await Promise.all([
    db
      .select({
        id: pedidosPagamento.id,
        valorTotal: pedidosPagamento.valorTotal,
        status: pedidosPagamento.status,
        createdAt: pedidosPagamento.createdAt,
        empresaId: pedidosPagamento.empresaId,
        empresaNome: empresas.nomeFantasia,
        empresaRazaoSocial: empresas.razaoSocial,
        colaboradorNome: colaboradores.nomeCompleto,
      })
      .from(pedidosPagamento)
      .leftJoin(empresas, eq(pedidosPagamento.empresaId, empresas.id))
      .leftJoin(colaboradores, eq(pedidosPagamento.colaboradorId, colaboradores.id))
      .where(where)
      .orderBy(desc(pedidosPagamento.createdAt))
      .limit(PAGE_SIZE_PEDIDOS)
      .offset((page - 1) * PAGE_SIZE_PEDIDOS),
    db
      .select({ value: count() })
      .from(pedidosPagamento)
      .leftJoin(colaboradores, eq(pedidosPagamento.colaboradorId, colaboradores.id))
      .where(where),
  ])

  const total = totalRows[0]?.value || 0

  return {
    registros: rows.map((row) => ({
      id: row.id,
      valor_total: row.valorTotal == null ? row.valorTotal : Number(row.valorTotal),
      status: row.status,
      created_at: row.createdAt,
      empresa_id: row.empresaId,
      empresa_nome: row.empresaNome || row.empresaRazaoSocial,
      colaborador_nome: row.colaboradorNome,
    })),
    total,
    page,
    total_paginas: Math.max(1, Math.ceil(total / PAGE_SIZE_PEDIDOS)),
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

export interface FaturasAdminFiltro {
  empresaId?: string
  page?: number
}

const PAGE_SIZE_FATURAS = 25

export async function listarFaturasAdmin(filtro: FaturasAdminFiltro = {}) {
  await requireSuperAdmin()

  const where = filtro.empresaId ? eq(faturas.empresaId, filtro.empresaId) : undefined
  const page = Math.max(1, filtro.page || 1)

  const [rows, totalRows] = await Promise.all([
    db
      .select({
        id: faturas.id,
        titulo: faturas.titulo,
        valor: faturas.valor,
        dataVencimento: faturas.dataVencimento,
        status: faturas.status,
        empresaId: faturas.empresaId,
        empresaNome: empresas.nomeFantasia,
        empresaRazaoSocial: empresas.razaoSocial,
      })
      .from(faturas)
      .leftJoin(empresas, eq(faturas.empresaId, empresas.id))
      .where(where)
      .orderBy(desc(faturas.dataVencimento))
      .limit(PAGE_SIZE_FATURAS)
      .offset((page - 1) * PAGE_SIZE_FATURAS),
    db.select({ value: count() }).from(faturas).where(where),
  ])

  const total = totalRows[0]?.value || 0

  return {
    registros: rows.map((row) => ({
      id: row.id,
      titulo: row.titulo,
      valor: row.valor == null ? row.valor : Number(row.valor),
      data_vencimento: row.dataVencimento,
      status: row.status,
      empresa_id: row.empresaId,
      empresa_nome: row.empresaNome || row.empresaRazaoSocial,
    })),
    total,
    page,
    total_paginas: Math.max(1, Math.ceil(total / PAGE_SIZE_FATURAS)),
  }
}

export interface NotasFiscaisAdminFiltro {
  empresaId?: string
  page?: number
}

const PAGE_SIZE_NOTAS = 25

export async function listarNotasFiscaisAdmin(filtro: NotasFiscaisAdminFiltro = {}) {
  await requireSuperAdmin()

  const where = filtro.empresaId ? eq(notasFiscais.empresaId, filtro.empresaId) : undefined
  const page = Math.max(1, filtro.page || 1)

  const [rows, totalRows] = await Promise.all([
    db
      .select({
        id: notasFiscais.id,
        numeroNfse: notasFiscais.numeroNfse,
        valorServico: notasFiscais.valorServico,
        competenciaMes: notasFiscais.competenciaMes,
        competenciaAno: notasFiscais.competenciaAno,
        status: notasFiscais.status,
        empresaId: notasFiscais.empresaId,
        empresaNome: empresas.nomeFantasia,
        empresaRazaoSocial: empresas.razaoSocial,
        colaboradorNome: colaboradores.nomeCompleto,
      })
      .from(notasFiscais)
      .leftJoin(empresas, eq(notasFiscais.empresaId, empresas.id))
      .leftJoin(colaboradores, eq(notasFiscais.colaboradorId, colaboradores.id))
      .where(where)
      .orderBy(desc(notasFiscais.createdAt))
      .limit(PAGE_SIZE_NOTAS)
      .offset((page - 1) * PAGE_SIZE_NOTAS),
    db.select({ value: count() }).from(notasFiscais).where(where),
  ])

  const total = totalRows[0]?.value || 0

  return {
    registros: rows.map((row) => ({
      id: row.id,
      numero_nfse: row.numeroNfse,
      valor_servico: row.valorServico == null ? row.valorServico : Number(row.valorServico),
      competencia: `${String(row.competenciaMes).padStart(2, "0")}/${row.competenciaAno}`,
      status: row.status,
      empresa_id: row.empresaId,
      empresa_nome: row.empresaNome || row.empresaRazaoSocial,
      colaborador_nome: row.colaboradorNome,
    })),
    total,
    page,
    total_paginas: Math.max(1, Math.ceil(total / PAGE_SIZE_NOTAS)),
  }
}
