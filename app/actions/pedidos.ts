"use server"

import { and, asc, desc, eq, gt, gte, inArray, isNull, lt, lte, or } from "drizzle-orm"
import { db } from "@/lib/db"
import { colaboradores, empresas, equipes, gerentesEquipes, pedidosPagamento, notasFiscais } from "@/lib/db/schema"
import { toPedidoDTO } from "@/lib/db/mappers"
import type { NovoPedido, AcaoPedido } from "@/types/pedido"
import { revalidatePath } from "next/cache"
import { getSession } from "@/lib/session"
import { uploadFile } from "@/lib/gcs"
import { registrarAuditoria } from "@/lib/audit"
import { assertNaoImpersonando, getEffectiveEmpresaIdFromSession } from "@/lib/tenant"
import { sendLembreteNotaFiscalEmail } from "@/lib/email"
import { formatCurrency } from "@/lib/utils"

export async function criarPedido(data: NovoPedido) {
  const session = await getSession()
  if (!session || !["Supervisor", "Adm", "Gerente", "Financeiro"].includes(session.tipoAcesso)) {
    throw new Error("Você não tem permissão para criar pedidos")
  }

  if (data.tipo_pedido !== "reembolso_km" && data.conducao > 0) {
    const hoje = new Date()
    const primeiroDiaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
    const ultimoDiaMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0, 23, 59, 59)

    let pedidosExistentes
    try {
      pedidosExistentes = await db
        .select({ id: pedidosPagamento.id })
        .from(pedidosPagamento)
        .where(
          and(
            eq(pedidosPagamento.colaboradorId, data.colaborador_id),
            gt(pedidosPagamento.conducao, "0"),
            gte(pedidosPagamento.createdAt, primeiroDiaMes),
            lte(pedidosPagamento.createdAt, ultimoDiaMes),
          ),
        )
    } catch (error) {
      console.error("[v0] Erro ao verificar pedidos existentes:", error)
      throw new Error("Erro ao verificar pedidos existentes")
    }

    if (pedidosExistentes && pedidosExistentes.length > 0) {
      throw new Error("Este prestador já recebeu condução este mês. Apenas uma condução por mês é permitida.")
    }
  }

  let valorTotal = 0
  let valorTotalHorasExtras = 0

  if (data.tipo_pedido === "reembolso_km") {
    valorTotal = data.valor_km
    valorTotalHorasExtras = 0
  } else {
    let colaborador
    try {
      ;[colaborador] = await db
        .select({ salario: colaboradores.salario })
        .from(colaboradores)
        .where(eq(colaboradores.id, data.colaborador_id))
    } catch (error) {
      console.error("[v0] Erro ao buscar colaborador:", error)
      throw new Error("Prestador não encontrado")
    }

    if (!colaborador) {
      console.error("[v0] Erro ao buscar colaborador:", "colaborador não encontrado")
      throw new Error("Prestador não encontrado")
    }

    const salarioColaborador = Number(colaborador.salario)
    const valorHoraNormal = salarioColaborador / 220
    const valorHora50 = valorHoraNormal * 1.5
    const valorHora100 = valorHoraNormal * 2

    const valorHorasExtras50 = data.horas_extras_50 * valorHora50
    const valorHorasExtras100 = data.horas_extras_100 * valorHora100
    valorTotalHorasExtras = valorHorasExtras50 + valorHorasExtras100

    // Condução e KM ficam fora do valor da nota (aparecem mas não calculam)
    valorTotal =
      salarioColaborador +
      valorTotalHorasExtras +
      data.valor_plantao +
      (data.comissao || 0) -
      (data.valor_desconto || 0)
  }

  // Gerente e Financeiro pulam aprovacao do gerente
  const statusInicial = ["Gerente", "Financeiro"].includes(session.tipoAcesso) ? "pendente_financeiro" : "pendente_gerente"

  const dadosPedido =
    data.tipo_pedido === "reembolso_km"
      ? {
          empresaId: session.empresaId!,
          colaboradorId: data.colaborador_id,
          tipoPedido: data.tipo_pedido,
          horasExtras: "0",
          horasExtras50: "0",
          horasExtras100: "0",
          motivoHorasExtras: null,
          valorKm: data.valor_km.toString(),
          conducao: "0",
          valorPlantao: "0",
          motivoPlantao: null,
          comissao: "0",
          motivoComissao: null,
          valorDesconto: "0",
          motivoDesconto: null,
          valorTotal: valorTotal.toString(),
          status: statusInicial,
          criadoPorColaboradorId: session.colaboradorId,
        }
      : {
          empresaId: session.empresaId!,
          colaboradorId: data.colaborador_id,
          tipoPedido: data.tipo_pedido,
          horasExtras: valorTotalHorasExtras.toString(),
          horasExtras50: data.horas_extras_50.toString(),
          horasExtras100: data.horas_extras_100.toString(),
          motivoHorasExtras: data.motivo_horas_extras || null,
          valorKm: data.valor_km.toString(),
          conducao: data.conducao.toString(),
          valorPlantao: data.valor_plantao.toString(),
          motivoPlantao: data.motivo_plantao || null,
          comissao: (data.comissao || 0).toString(),
          motivoComissao: data.motivo_comissao || null,
          valorDesconto: (data.valor_desconto || 0).toString(),
          motivoDesconto: data.motivo_desconto || null,
          valorTotal: valorTotal.toString(),
          status: statusInicial,
          criadoPorColaboradorId: session.colaboradorId,
        }

  let pedido
  try {
    ;[pedido] = await db.insert(pedidosPagamento).values(dadosPedido).returning()
  } catch (error) {
    console.error("[v0] Erro ao criar pedido:", error)
    throw new Error("Erro ao criar pedido de pagamento")
  }

  revalidatePath("/pedidos")
  return toPedidoDTO(pedido)
}

export async function acaoGerente(data: AcaoPedido) {
  const session = await getSession()
  if (!session || (session.tipoAcesso !== "Gerente" && session.tipoAcesso !== "Adm")) {
    throw new Error("Apenas gerentes podem realizar esta ação")
  }

  const updates: any = {
    observacaoGerente: data.observacao,
    dataAprovacaoGerente: new Date(),
    aprovadoPorGerenteId: session.colaboradorId,
  }

  if (data.acao === "aprovar") {
    updates.aprovadoGerente = true
    updates.status = "pendente_financeiro"
  } else if (data.acao === "recusar") {
    updates.aprovadoGerente = false
    updates.status = "recusado"
  } else if (data.acao === "corrigir") {
    updates.aprovadoGerente = null
    updates.status = "correcao"
    updates.correcaoSolicitadaPor = "gerente"
  }

  try {
    await db.update(pedidosPagamento).set(updates).where(eq(pedidosPagamento.id, data.pedido_id))
  } catch (error) {
    console.error("[v0] Erro ao atualizar pedido:", error)
    throw new Error("Erro ao processar ação")
  }

  revalidatePath("/aprovacoes")
  revalidatePath("/historico")
}

export async function acaoFinanceiro(data: AcaoPedido) {
  const session = await getSession()
  if (!session) {
    throw new Error("Usuário não autenticado")
  }

  if (!["Financeiro", "Adm"].includes(session.tipoAcesso)) {
    throw new Error("Apenas financeiro pode realizar esta ação")
  }

  const updates: any = {
    observacaoFinanceiro: data.observacao,
    dataAprovacaoFinanceiro: new Date(),
    aprovadoPorFinanceiroId: session.colaboradorId,
  }

  if (data.acao === "aprovar") {
    if (!data.data_previsao_pagamento) {
      throw new Error("Data de previsão de pagamento é obrigatória")
    }
    updates.aprovadoFinanceiro = true
    updates.status = "aprovado"
    const [ano, mes, dia] = data.data_previsao_pagamento.split("-")
    const dataPrevisao = new Date(Number(ano), Number(mes) - 1, Number(dia), 12, 0, 0)
    updates.dataPrevisaoPagamento = dataPrevisao.toISOString().split("T")[0]
    const dataLimite = new Date()
    dataLimite.setDate(dataLimite.getDate() + 2)
    updates.dataLimiteAnexoNota = dataLimite
  } else if (data.acao === "recusar") {
    updates.aprovadoFinanceiro = false
    updates.status = "recusado"
  } else if (data.acao === "corrigir") {
    updates.aprovadoFinanceiro = null
    updates.status = "correcao"
    updates.correcaoSolicitadaPor = "financeiro"
  }

  try {
    await db.update(pedidosPagamento).set(updates).where(eq(pedidosPagamento.id, data.pedido_id))
  } catch (error) {
    console.error("[v0] Erro ao atualizar pedido:", error)
    throw new Error("Erro ao processar ação")
  }

  revalidatePath("/aprovacoes")
  revalidatePath("/meus-pagamentos")
  revalidatePath("/historico")
}

export async function listarPedidos() {
  const session = await getSession()
  if (!session) return []

  try {
    const empresaEfetiva = getEffectiveEmpresaIdFromSession(session)
    const rows = await db.query.pedidosPagamento.findMany({
      where: empresaEfetiva === null ? undefined : eq(pedidosPagamento.empresaId, empresaEfetiva),
      orderBy: desc(pedidosPagamento.createdAt),
      with: {
        colaborador: true,
        criadoPorColaborador: true,
      },
    })

    return rows.map((row: any) => toPedidoDTO({ ...row, criadoPor: row.criadoPorColaborador }))
  } catch (error) {
    console.error("[v0] Erro ao listar pedidos:", error)
    throw new Error("Erro ao listar pedidos")
  }
}

export async function listarPedidosComFiltros(filtros?: { dataInicio?: string; dataFim?: string }) {
  const session = await getSession()
  if (!session) return []

  try {
    const conditions = []

    const empresaEfetivaFiltros = getEffectiveEmpresaIdFromSession(session)
    if (empresaEfetivaFiltros !== null) {
      conditions.push(eq(pedidosPagamento.empresaId, empresaEfetivaFiltros))
    }
    if (filtros?.dataInicio) {
      conditions.push(gte(pedidosPagamento.createdAt, new Date(filtros.dataInicio)))
    }
    if (filtros?.dataFim) {
      // Adicionar 1 dia para incluir todo o dia final
      const dataFimAjustada = new Date(filtros.dataFim)
      dataFimAjustada.setDate(dataFimAjustada.getDate() + 1)
      conditions.push(lt(pedidosPagamento.createdAt, dataFimAjustada))
    }

    const rows = await db.query.pedidosPagamento.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      orderBy: desc(pedidosPagamento.createdAt),
      with: {
        colaborador: { with: { equipe: true, centroCusto: true } },
        criadoPorColaborador: true,
      },
    })

    return rows.map((row: any) => toPedidoDTO({ ...row, criadoPor: row.criadoPorColaborador }))
  } catch (error) {
    console.error("[v0] Erro ao listar pedidos com filtros:", error)
    throw new Error("Erro ao listar pedidos")
  }
}

export async function listarPedidosPendentes() {
  const session = await getSession()

  if (!session) {
    throw new Error("Usuário não autenticado")
  }

  console.log("[v0] Listando pedidos pendentes para:", session.tipoAcesso)

  let statusFiltro: string[] = []

  if (session.tipoAcesso === "Gerente") {
    statusFiltro = ["pendente_gerente"]
  } else if (session.tipoAcesso === "Financeiro") {
    statusFiltro = ["pendente_financeiro"]
  } else if (session.tipoAcesso === "Adm") {
    statusFiltro = ["pendente_gerente", "pendente_financeiro"]
  }

  console.log("[v0] Filtrando por status:", statusFiltro)

  let colaboradorIds: string[] = []

  if (session.tipoAcesso === "Gerente") {
    // Buscar equipes do gerente
    let gerenteEquipes
    try {
      gerenteEquipes = await db
        .select({ equipeId: gerentesEquipes.equipeId })
        .from(gerentesEquipes)
        .where(eq(gerentesEquipes.gerenteId, session.colaboradorId))
    } catch (error) {
      console.error("[v0] Erro ao buscar equipes do gerente:", error)
      throw new Error("Erro ao buscar equipes do gerente")
    }

    const equipeIds = gerenteEquipes.map((e) => e.equipeId)

    if (equipeIds.length === 0) {
      return []
    }

    // Buscar colaboradores das equipes do gerente
    let colaboradoresRows
    try {
      colaboradoresRows = await db
        .select({ id: colaboradores.id })
        .from(colaboradores)
        .where(inArray(colaboradores.equipeId, equipeIds))
    } catch (error) {
      console.error("[v0] Erro ao buscar colaboradores:", error)
      throw new Error("Erro ao buscar prestadores")
    }

    colaboradorIds = colaboradoresRows.map((c) => c.id)

    if (colaboradorIds.length === 0) {
      return []
    }

    console.log("[v0] Gerente filtrando por colaboradores das suas equipes:", colaboradorIds.length)
  }

  try {
    const conditions = [
      inArray(pedidosPagamento.status, statusFiltro),
      or(isNull(pedidosPagamento.notaEmitida), eq(pedidosPagamento.notaEmitida, false)),
    ]

    if (session.tipoAcesso === "Gerente" && colaboradorIds.length > 0) {
      conditions.push(inArray(pedidosPagamento.colaboradorId, colaboradorIds))
    }

    if (session.tipoAcesso !== "SuperAdmin") {
      conditions.push(eq(pedidosPagamento.empresaId, session.empresaId!))
    }

    const rows = await db.query.pedidosPagamento.findMany({
      where: and(...conditions),
      orderBy: desc(pedidosPagamento.createdAt),
      with: {
        colaborador: true,
        criadoPorColaborador: true,
      },
    })

    console.log("[v0] Pedidos encontrados:", rows.length)

    return rows.map((row: any) => toPedidoDTO({ ...row, criadoPor: row.criadoPorColaborador }))
  } catch (error) {
    console.error("[v0] Erro ao listar pedidos pendentes:", error)
    throw new Error("Erro ao listar pedidos pendentes")
  }
}

/** Pedidos criados pelo próprio usuário logado — usado pelo Adm em /historico, que não tem
 *  vínculo de "equipe supervisionada" como Supervisor/Gerente têm (listarPedidosPorSupervisor
 *  dependia disso e sempre voltava vazio pra Adm sem equipe atribuída). */
export async function listarPedidosCriadosPorMim() {
  const session = await getSession()
  if (!session) throw new Error("Usuário não autenticado")

  try {
    const rows = await db.query.pedidosPagamento.findMany({
      where: eq(pedidosPagamento.criadoPorColaboradorId, session.colaboradorId),
      orderBy: desc(pedidosPagamento.createdAt),
      with: {
        colaborador: true,
        criadoPorColaborador: true,
      },
    })

    return rows.map((row: any) => toPedidoDTO({ ...row, criadoPor: row.criadoPorColaborador }))
  } catch (error) {
    console.error("[v0] Erro ao listar pedidos criados pelo usuário:", error)
    throw new Error("Erro ao listar pedidos")
  }
}

export async function listarPedidosParaCorrecao() {
  const session = await getSession()

  if (!session) {
    throw new Error("Usuário não autenticado")
  }

  console.log("[v0] Listando pedidos para correção do supervisor:", session.colaboradorId)

  try {
    const rows = await db.query.pedidosPagamento.findMany({
      where: and(
        eq(pedidosPagamento.criadoPorColaboradorId, session.colaboradorId),
        eq(pedidosPagamento.status, "correcao"),
      ),
      orderBy: desc(pedidosPagamento.createdAt),
      with: {
        colaborador: true,
        criadoPorColaborador: true,
      },
    })

    console.log("[v0] Pedidos para correção encontrados:", rows.length)

    return rows.map((row: any) => toPedidoDTO({ ...row, criadoPor: row.criadoPorColaborador }))
  } catch (error) {
    console.error("[v0] Erro ao listar pedidos para correção:", error)
    throw new Error("Erro ao listar pedidos para correção")
  }
}

// Não tinha checagem de permissão nenhuma antes (nem sessão, nem papel, nem empresa) —
// qualquer chamada conseguia excluir qualquer pedido de qualquer empresa. Adicionado o
// mesmo padrão de gate + escopo por empresa usado no resto do arquivo.
export async function deletarPedido(id: string) {
  const session = await getSession()
  if (!session || !["Adm", "Financeiro", "SuperAdmin"].includes(session.tipoAcesso)) {
    throw new Error("Você não tem permissão para excluir pedidos")
  }
  await assertNaoImpersonando()

  const [pedido] = await db.select().from(pedidosPagamento).where(eq(pedidosPagamento.id, id))
  if (!pedido) throw new Error("Pedido não encontrado")
  if (session.tipoAcesso !== "SuperAdmin" && pedido.empresaId !== session.empresaId) {
    throw new Error("Pedido não encontrado")
  }

  // notas_fiscais.pedido_id tem onDelete: cascade — excluir o pedido apaga a nota vinculada.
  const [notaVinculada] = await db.select({ id: notasFiscais.id }).from(notasFiscais).where(eq(notasFiscais.pedidoId, id)).limit(1)
  if (notaVinculada) {
    throw new Error("Não é possível excluir: este pedido tem uma nota fiscal vinculada. Remova a nota fiscal primeiro.")
  }

  try {
    await db.delete(pedidosPagamento).where(eq(pedidosPagamento.id, id))
  } catch (error) {
    console.error("[v0] Erro ao deletar pedido:", error)
    throw new Error("Erro ao deletar pedido")
  }

  if (session.tipoAcesso === "SuperAdmin") {
    await registrarAuditoria({
      colaboradorId: session.colaboradorId,
      empresaId: pedido.empresaId,
      acao: "pedido_excluido",
      tabela: "pedidos_pagamento",
      registroId: id,
    })
  }

  revalidatePath("/pedidos")
  revalidatePath("/admin/dados/pedidos")
}

export async function listarPedidosPorSupervisor(supervisorId: string) {
  // Buscar equipes onde o usuário é supervisor
  let equipesRows
  try {
    equipesRows = await db.select({ id: equipes.id }).from(equipes).where(eq(equipes.supervisorId, supervisorId))
  } catch (error) {
    console.error("[v0] Erro ao buscar equipes do supervisor:", error)
    throw new Error("Erro ao buscar equipes")
  }

  const equipeIds = equipesRows.map((e) => e.id)

  if (equipeIds.length === 0) {
    return []
  }

  let colaboradoresRows
  try {
    colaboradoresRows = await db
      .select({ id: colaboradores.id })
      .from(colaboradores)
      .where(and(inArray(colaboradores.equipeId, equipeIds), inArray(colaboradores.tipoAcesso, ["Colaborador", "Supervisor"])))
  } catch (error) {
    console.error("[v0] Erro ao buscar colaboradores:", error)
    throw new Error("Erro ao buscar prestadores")
  }

  const colaboradorIds = colaboradoresRows.map((c) => c.id)

  if (colaboradorIds.length === 0) {
    return []
  }

  // Buscar pedidos dos colaboradores da equipe
  try {
    const rows = await db.query.pedidosPagamento.findMany({
      where: inArray(pedidosPagamento.colaboradorId, colaboradorIds),
      orderBy: desc(pedidosPagamento.createdAt),
      with: {
        colaborador: true,
        criadoPorColaborador: true,
      },
    })

    return rows.map((row: any) => toPedidoDTO({ ...row, criadoPor: row.criadoPorColaborador }))
  } catch (error) {
    console.error("[v0] Erro ao listar pedidos do supervisor:", error)
    throw new Error("Erro ao listar pedidos")
  }
}

export async function listarPedidosPorGerente(gerenteId: string, filtros?: { dataInicio?: string; dataFim?: string }) {
  // Buscar equipes onde o gerente está vinculado
  let gerenteEquipesRows
  try {
    gerenteEquipesRows = await db
      .select({ equipeId: gerentesEquipes.equipeId })
      .from(gerentesEquipes)
      .where(eq(gerentesEquipes.gerenteId, gerenteId))
  } catch (error) {
    console.error("[v0] Erro ao buscar equipes do gerente:", error)
    throw new Error("Erro ao buscar equipes do gerente")
  }

  const equipeIds = gerenteEquipesRows.map((e) => e.equipeId)

  if (equipeIds.length === 0) {
    return []
  }

  let colaboradoresRows
  try {
    colaboradoresRows = await db
      .select({ id: colaboradores.id })
      .from(colaboradores)
      .where(inArray(colaboradores.equipeId, equipeIds))
  } catch (error) {
    console.error("[v0] Erro ao buscar colaboradores:", error)
    throw new Error("Erro ao buscar prestadores")
  }

  const colaboradorIds = colaboradoresRows.map((c) => c.id)

  if (colaboradorIds.length === 0) {
    return []
  }

  // Buscar pedidos dos colaboradores das equipes
  try {
    const conditions = [inArray(pedidosPagamento.colaboradorId, colaboradorIds)]

    if (filtros?.dataInicio) {
      conditions.push(gte(pedidosPagamento.createdAt, new Date(filtros.dataInicio)))
    }
    if (filtros?.dataFim) {
      const dataFimAjustada = new Date(filtros.dataFim)
      dataFimAjustada.setDate(dataFimAjustada.getDate() + 1)
      conditions.push(lt(pedidosPagamento.createdAt, dataFimAjustada))
    }

    const rows = await db.query.pedidosPagamento.findMany({
      where: and(...conditions),
      orderBy: desc(pedidosPagamento.createdAt),
      with: {
        colaborador: true,
        criadoPorColaborador: true,
      },
    })

    return rows.map((row: any) => toPedidoDTO({ ...row, criadoPor: row.criadoPorColaborador }))
  } catch (error) {
    console.error("[v0] Erro ao listar pedidos do gerente:", error)
    throw new Error("Erro ao listar pedidos")
  }
}

export async function corrigirPedido(
  pedidoId: string,
  data: {
    horas_extras_50: number
    horas_extras_100: number
    valor_km: number
    conducao: number
    valor_plantao: number
    motivo_plantao?: string
    comissao: number
    motivo_comissao?: string
    valor_desconto: number
    motivo_desconto?: string
  },
) {
  const session = await getSession()
  if (!session || (session.tipoAcesso !== "Supervisor" && session.tipoAcesso !== "Adm" && session.tipoAcesso !== "Gerente")) {
    throw new Error("Sem permissão para corrigir pedidos")
  }

  // Buscar o pedido atual para saber qual era o status anterior
  let pedidoAtual
  try {
    pedidoAtual = await db.query.pedidosPagamento.findFirst({
      where: eq(pedidosPagamento.id, pedidoId),
      with: { colaborador: true },
    })
  } catch (error) {
    console.error("[v0] Erro ao buscar pedido:", error)
    throw new Error("Pedido não encontrado")
  }

  if (!pedidoAtual) {
    console.error("[v0] Erro ao buscar pedido:", "pedido não encontrado")
    throw new Error("Pedido não encontrado")
  }

  // Gerentes só podem corrigir pedidos que eles mesmos criaram
  if (session.tipoAcesso === "Gerente" && pedidoAtual.criadoPorColaboradorId !== session.colaboradorId) {
    throw new Error("Você só pode corrigir pedidos que você criou")
  }

  const salarioColaborador = Number((pedidoAtual as any).colaborador.salario)
  const valorHoraNormal = salarioColaborador / 220
  const valorHorasExtras50 = data.horas_extras_50 * valorHoraNormal * 1.5
  const valorHorasExtras100 = data.horas_extras_100 * valorHoraNormal * 2
  const valorTotalHorasExtras = valorHorasExtras50 + valorHorasExtras100

  // Condução e KM ficam fora do valor da nota (aparecem mas não calculam)
  const valorTotal =
    salarioColaborador +
    valorTotalHorasExtras +
    data.valor_plantao +
    (data.comissao || 0) -
    data.valor_desconto

  // Determinar para qual status enviar baseado em quem solicitou a correção
  let novoStatus = "pendente_gerente"
  if (pedidoAtual.correcaoSolicitadaPor === "financeiro") {
    // Se o financeiro solicitou correção, volta para o financeiro
    novoStatus = "pendente_financeiro"
  } else if (pedidoAtual.correcaoSolicitadaPor === "gerente") {
    // Se o gerente solicitou correção, volta para o gerente
    novoStatus = "pendente_gerente"
  } else if (pedidoAtual.observacaoFinanceiro) {
    // Fallback: se o financeiro tem observação, provavelmente foi ele
    novoStatus = "pendente_financeiro"
  }

  try {
    await db
      .update(pedidosPagamento)
      .set({
        horasExtras50: data.horas_extras_50.toString(),
        horasExtras100: data.horas_extras_100.toString(),
        horasExtras: valorTotalHorasExtras.toString(),
        valorKm: data.valor_km.toString(),
        conducao: data.conducao.toString(),
        valorPlantao: data.valor_plantao.toString(),
        motivoPlantao: data.motivo_plantao || null,
        comissao: (data.comissao || 0).toString(),
        motivoComissao: data.motivo_comissao || null,
        valorDesconto: data.valor_desconto.toString(),
        motivoDesconto: data.motivo_desconto || null,
        valorTotal: valorTotal.toString(),
        status: novoStatus,
        // Limpar observações anteriores e campo de quem solicitou
        observacaoGerente: null,
        observacaoFinanceiro: null,
        correcaoSolicitadaPor: null,
      })
      .where(eq(pedidosPagamento.id, pedidoId))
  } catch (error) {
    console.error("[v0] Erro ao corrigir pedido:", error)
    throw new Error("Erro ao corrigir pedido")
  }

  revalidatePath("/historico")
  revalidatePath("/aprovacoes")
}

export async function marcarNotaEmitida(pedidoId: string, notaFiscalUrl: string) {
  const session = await getSession()
  if (!session) {
    throw new Error("Usuário não autenticado")
  }

  // Verificar se o pedido pertence ao colaborador logado
  let pedido
  try {
    ;[pedido] = await db
      .select({
        colaboradorId: pedidosPagamento.colaboradorId,
        empresaId: pedidosPagamento.empresaId,
        status: pedidosPagamento.status,
        valorTotal: pedidosPagamento.valorTotal,
      })
      .from(pedidosPagamento)
      .where(eq(pedidosPagamento.id, pedidoId))
  } catch (error) {
    console.error("[v0] Erro ao buscar pedido:", error)
    throw new Error("Pedido não encontrado")
  }

  if (!pedido) {
    console.error("[v0] Erro ao buscar pedido:", "pedido não encontrado")
    throw new Error("Pedido não encontrado")
  }

  if (pedido.colaboradorId !== session.colaboradorId) {
    throw new Error("Você não tem permissão para marcar esta nota")
  }

  if (pedido.status !== "aprovado") {
    throw new Error("Apenas pedidos aprovados podem ter nota emitida")
  }

  if (!notaFiscalUrl) {
    throw new Error("É necessário anexar o PDF da nota fiscal")
  }

  const [colaborador] = await db
    .select({ cnpj: colaboradores.cnpj })
    .from(colaboradores)
    .where(eq(colaboradores.id, pedido.colaboradorId))

  if (!colaborador?.cnpj) {
    throw new Error("Cadastre o CNPJ do prestador antes de anexar a nota fiscal")
  }

  const agora = new Date()

  try {
    await db
      .update(pedidosPagamento)
      .set({
        notaEmitida: true,
        dataEmissaoNota: agora,
        notaFiscalUrl: notaFiscalUrl,
        status: "pendente_financeiro", // Envia de volta pro financeiro
      })
      .where(eq(pedidosPagamento.id, pedidoId))

    // Conecta a linha em notasFiscais (fonte de verdade que o financeiro aprova/recusa) —
    // upsert porque o prestador pode reenviar depois de uma recusa (pedidoId é único).
    const [notaExistente] = await db
      .select({ id: notasFiscais.id })
      .from(notasFiscais)
      .where(eq(notasFiscais.pedidoId, pedidoId))

    if (notaExistente) {
      await db
        .update(notasFiscais)
        .set({
          arquivoPdfUrl: notaFiscalUrl,
          valorServico: pedido.valorTotal,
          status: "pendente",
          observacaoFinanceiro: null,
          updatedAt: agora,
        })
        .where(eq(notasFiscais.id, notaExistente.id))
    } else {
      await db.insert(notasFiscais).values({
        empresaId: pedido.empresaId,
        pedidoId,
        colaboradorId: pedido.colaboradorId,
        competenciaMes: agora.getMonth() + 1,
        competenciaAno: agora.getFullYear(),
        valorServico: pedido.valorTotal,
        cpfCnpjPrestador: colaborador.cnpj,
        arquivoPdfUrl: notaFiscalUrl,
        status: "pendente",
      })
    }
  } catch (error) {
    console.error("[v0] Erro ao marcar nota como emitida:", error)
    throw new Error("Erro ao marcar nota como emitida")
  }

  revalidatePath("/meus-pagamentos")
  revalidatePath("/financeiro")

  return { success: true }
}

export async function uploadNotaFiscal(formData: FormData) {
  try {
    const file = formData.get("file") as File

    if (!file) {
      throw new Error("Nenhum arquivo fornecido")
    }

    const allowedTypes = ["application/pdf", "text/xml", "application/xml"]
    const fileName = file.name.toLowerCase()
    const hasValidExtension = fileName.endsWith(".pdf") || fileName.endsWith(".xml")
    const hasValidType = allowedTypes.includes(file.type)
    // Em dispositivos móveis, o MIME type pode vir vazio - validar pela extensão também
    if (!hasValidType && !hasValidExtension) {
      throw new Error("Apenas arquivos PDF ou XML são permitidos")
    }

    // Validar tamanho máximo (10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      throw new Error("Arquivo muito grande. Máximo 10MB")
    }

    // Upload para o Google Cloud Storage (bucket privado) com nome único
    const timestamp = Date.now()
    const safeFileName = file.name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // remove acentos
      .replace(/[^a-zA-Z0-9._-]/g, "_") // substitui especiais por underscore
      .toLowerCase()
    const filename = `nota-fiscal-${timestamp}-${safeFileName}`
    const contentType =
      file.type === "application/pdf" || fileName.endsWith(".pdf") ? "application/pdf" : "application/xml"

    const buffer = Buffer.from(await file.arrayBuffer())
    const objectPath = await uploadFile(buffer, `nota-fiscal/${filename}`, contentType)

    return {
      success: true,
      url: `/api/files/${objectPath}`,
      filename: file.name,
      size: file.size,
    }
  } catch (error) {
    console.error("[v0] Erro no upload:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro ao fazer upload",
    }
  }
}

export async function listarPedidosParaFinanceiro(filtros?: {
  dataInicio?: string
  dataFim?: string
  colaboradorNome?: string
}) {
  const session = await getSession()

  if (!session) {
    throw new Error("Usuário não autenticado")
  }

  if (!["Financeiro", "Adm", "SuperAdmin"].includes(session.tipoAcesso)) {
    throw new Error("Apenas financeiro pode acessar esta página")
  }

  console.log("[v0] Listando pedidos para financeiro com filtros:", filtros)

  try {
    const conditions = [eq(pedidosPagamento.status, "pendente_financeiro"), eq(pedidosPagamento.notaEmitida, true)]

    if (session.tipoAcesso !== "SuperAdmin") {
      conditions.push(eq(pedidosPagamento.empresaId, session.empresaId!))
    }

    if (filtros?.dataInicio) {
      conditions.push(gte(pedidosPagamento.createdAt, new Date(filtros.dataInicio)))
    }
    if (filtros?.dataFim) {
      conditions.push(lte(pedidosPagamento.createdAt, new Date(filtros.dataFim)))
    }

    const rows = await db.query.pedidosPagamento.findMany({
      where: and(...conditions),
      with: {
        colaborador: true,
        criadoPorColaborador: true,
        notaFiscal: true,
      },
    })

    console.log("[v0] Query executada. Dados retornados:", rows.length)

    let pedidosFiltrados = rows.filter(
      (pedido: any) => pedido.tipoPedido === "reembolso_km" || !!pedido.notaFiscal,
    )

    // Filtrar por nome do colaborador se fornecido
    if (filtros?.colaboradorNome) {
      const nomeNormalizado = filtros.colaboradorNome.toLowerCase()
      pedidosFiltrados = pedidosFiltrados.filter((pedido: any) =>
        pedido.colaborador?.nomeCompleto?.toLowerCase().includes(nomeNormalizado),
      )
    }

    console.log("[v0] Pedidos para financeiro encontrados:", pedidosFiltrados.length)
    console.log(
      "[v0] Pedidos com notas_fiscais:",
      pedidosFiltrados.map((p: any) => ({
        id: p.id,
        nota_emitida: p.notaEmitida,
        notas_count: p.notaFiscal ? 1 : 0,
      })),
    )

    return pedidosFiltrados.map((row: any) => toPedidoDTO({ ...row, criadoPor: row.criadoPorColaborador }))
  } catch (error) {
    console.error("[v0] Erro ao listar pedidos para financeiro:", error)
    throw new Error("Erro ao listar pedidos para financeiro")
  }
}

export async function listarPedidosComNotaPendente() {
  const session = await getSession()

  if (!session) {
    throw new Error("Usuário não autenticado")
  }

  console.log("[v0] Listando pedidos com nota pendente para:", session.tipoAcesso)

  const conditions = [
    eq(pedidosPagamento.tipoPedido, "completo"),
    eq(pedidosPagamento.status, "aprovado"),
    or(isNull(pedidosPagamento.notaEmitida), eq(pedidosPagamento.notaEmitida, false)),
  ]

  if (session.tipoAcesso === "Supervisor") {
    let equipesRows
    try {
      equipesRows = await db.select({ id: equipes.id }).from(equipes).where(eq(equipes.supervisorId, session.colaboradorId))
    } catch (error) {
      console.error("[v0] Erro ao buscar equipes do supervisor:", error)
      return []
    }

    const equipeIds = equipesRows.map((e) => e.id)

    if (equipeIds.length === 0) {
      return []
    }

    let colaboradoresRows
    try {
      colaboradoresRows = await db
        .select({ id: colaboradores.id })
        .from(colaboradores)
        .where(inArray(colaboradores.equipeId, equipeIds))
    } catch (error) {
      console.error("[v0] Erro ao buscar colaboradores:", error)
      return []
    }

    const colaboradorIds = colaboradoresRows.map((c) => c.id)

    if (colaboradorIds.length === 0) {
      return []
    }

    conditions.push(inArray(pedidosPagamento.colaboradorId, colaboradorIds))
  } else if (session.tipoAcesso === "Gerente") {
    let gerenteEquipesRows
    try {
      gerenteEquipesRows = await db
        .select({ equipeId: gerentesEquipes.equipeId })
        .from(gerentesEquipes)
        .where(eq(gerentesEquipes.gerenteId, session.colaboradorId))
    } catch (error) {
      console.error("[v0] Erro ao buscar equipes do gerente:", error)
      return []
    }

    const equipeIds = gerenteEquipesRows.map((e) => e.equipeId)

    if (equipeIds.length === 0) {
      return []
    }

    let colaboradoresRows
    try {
      colaboradoresRows = await db
        .select({ id: colaboradores.id })
        .from(colaboradores)
        .where(inArray(colaboradores.equipeId, equipeIds))
    } catch (error) {
      console.error("[v0] Erro ao buscar colaboradores:", error)
      return []
    }

    const colaboradorIds = colaboradoresRows.map((c) => c.id)

    if (colaboradorIds.length === 0) {
      return []
    }

    conditions.push(inArray(pedidosPagamento.colaboradorId, colaboradorIds))
  } else if (session.tipoAcesso !== "SuperAdmin") {
    // Financeiro e Adm veem todos os pedidos da própria empresa (SuperAdmin vê todas as empresas)
    conditions.push(eq(pedidosPagamento.empresaId, session.empresaId!))
  }

  try {
    const rows = await db.query.pedidosPagamento.findMany({
      where: and(...conditions),
      orderBy: asc(pedidosPagamento.dataAprovacaoFinanceiro),
      with: {
        colaborador: true,
        criadoPorColaborador: true,
      },
    })

    console.log("[v0] Pedidos com nota pendente encontrados:", rows.length)

    return rows.map((row: any) => toPedidoDTO({ ...row, criadoPor: row.criadoPorColaborador }))
  } catch (error) {
    console.error("[v0] Erro ao listar pedidos com nota pendente:", error)
    throw new Error("Erro ao listar pedidos com nota pendente")
  }
}

/** Envia um lembrete por e-mail ao prestador de um pedido aprovado aguardando nota fiscal —
 *  botão principal da tela /acompanhamento. Não emite/anexa nada em nome do prestador, só
 *  cobra: a ação de fato continua exclusiva de quem é dono do pedido (/meus-pagamentos). */
export async function enviarLembreteNotaFiscal(pedidoId: string) {
  const session = await getSession()
  if (!session) throw new Error("Usuário não autenticado")
  if (!["Supervisor", "Gerente", "Financeiro", "Adm"].includes(session.tipoAcesso)) {
    throw new Error("Sem permissão")
  }

  const [pedido] = await db
    .select({
      empresaId: pedidosPagamento.empresaId,
      colaboradorId: pedidosPagamento.colaboradorId,
      valorTotal: pedidosPagamento.valorTotal,
      dataAprovacaoFinanceiro: pedidosPagamento.dataAprovacaoFinanceiro,
      status: pedidosPagamento.status,
    })
    .from(pedidosPagamento)
    .where(eq(pedidosPagamento.id, pedidoId))
  if (!pedido) throw new Error("Pedido não encontrado")
  if (session.tipoAcesso !== "SuperAdmin" && pedido.empresaId !== session.empresaId) {
    throw new Error("Pedido não encontrado")
  }
  if (pedido.status !== "aprovado") {
    throw new Error("Este pedido não está mais aguardando nota fiscal")
  }

  const [colaborador] = await db
    .select({ nomeCompleto: colaboradores.nomeCompleto, email: colaboradores.email })
    .from(colaboradores)
    .where(eq(colaboradores.id, pedido.colaboradorId))
  if (!colaborador?.email) throw new Error("Prestador sem e-mail cadastrado")

  const [empresa] = await db
    .select({ razaoSocial: empresas.razaoSocial, nomeFantasia: empresas.nomeFantasia, cnpj: empresas.cnpj })
    .from(empresas)
    .where(eq(empresas.id, pedido.empresaId))
  if (!empresa) throw new Error("Empresa não encontrada")

  const baseUrl = process.env.APP_BASE_URL || ""

  await sendLembreteNotaFiscalEmail({
    to: colaborador.email,
    prestadorNome: colaborador.nomeCompleto,
    valorFormatado: formatCurrency(Number(pedido.valorTotal)),
    dataAprovacaoFormatada: pedido.dataAprovacaoFinanceiro
      ? new Intl.DateTimeFormat("pt-BR").format(new Date(pedido.dataAprovacaoFinanceiro))
      : "—",
    meusPagamentosUrl: `${baseUrl}/meus-pagamentos`,
    empresa: { nome: empresa.nomeFantasia || empresa.razaoSocial, razaoSocial: empresa.razaoSocial, cnpj: empresa.cnpj },
  })

  return { success: true }
}

export async function solicitarProrrogacaoPrazo(pedidoId: string, motivo: string) {
  const session = await getSession()
  if (!session) {
    throw new Error("Usuário não autenticado")
  }

  let pedido
  try {
    ;[pedido] = await db
      .select({
        colaboradorId: pedidosPagamento.colaboradorId,
        status: pedidosPagamento.status,
        dataLimiteAnexoNota: pedidosPagamento.dataLimiteAnexoNota,
      })
      .from(pedidosPagamento)
      .where(eq(pedidosPagamento.id, pedidoId))
  } catch (error) {
    console.error("[v0] Erro ao buscar pedido:", error)
    throw new Error("Pedido não encontrado")
  }

  if (!pedido) {
    console.error("[v0] Erro ao buscar pedido:", "pedido não encontrado")
    throw new Error("Pedido não encontrado")
  }

  if (pedido.colaboradorId !== session.colaboradorId) {
    throw new Error("Você não tem permissão para solicitar prorrogação deste pedido")
  }

  if (pedido.status !== "aprovado") {
    throw new Error("Apenas pedidos aprovados podem ter prorrogação solicitada")
  }

  try {
    await db
      .update(pedidosPagamento)
      .set({
        prorrogacaoSolicitada: true,
        motivoProrrogacao: motivo,
        dataSolicitacaoProrrogacao: new Date(),
        prorrogacaoAprovada: null,
        status: "aguardando_prorrogacao",
      })
      .where(eq(pedidosPagamento.id, pedidoId))
  } catch (error) {
    console.error("[v0] Erro ao solicitar prorrogação:", error)
    throw new Error("Erro ao solicitar prorrogação de prazo")
  }

  revalidatePath("/meus-pagamentos")
  revalidatePath("/financeiro")

  return { success: true, message: "Solicitação enviada ao financeiro com sucesso!" }
}

export async function listarSolicitacoesProrrogacao() {
  const session = await getSession()

  if (!session) {
    throw new Error("Usuário não autenticado")
  }

  if (!["Financeiro", "Adm", "SuperAdmin"].includes(session.tipoAcesso)) {
    throw new Error("Apenas financeiro pode acessar esta página")
  }

  try {
    const condicoes = [
      eq(pedidosPagamento.status, "aguardando_prorrogacao"),
      eq(pedidosPagamento.prorrogacaoSolicitada, true),
      isNull(pedidosPagamento.prorrogacaoAprovada),
    ]
    if (session.tipoAcesso !== "SuperAdmin") {
      condicoes.push(eq(pedidosPagamento.empresaId, session.empresaId!))
    }

    const rows = await db.query.pedidosPagamento.findMany({
      where: and(...condicoes),
      orderBy: asc(pedidosPagamento.dataSolicitacaoProrrogacao),
      with: {
        colaborador: true,
      },
    })

    return rows.map((row: any) => toPedidoDTO(row))
  } catch (error) {
    console.error("[v0] Erro ao listar solicitações de prorrogação:", error)
    throw new Error("Erro ao listar solicitações")
  }
}

export async function responderSolicitacaoProrrogacao(
  pedidoId: string,
  aprovado: boolean,
  observacao?: string,
  diasExtensao?: number,
) {
  const session = await getSession()

  if (!session) {
    throw new Error("Usuário não autenticado")
  }

  if (!["Financeiro", "Adm"].includes(session.tipoAcesso)) {
    throw new Error("Apenas financeiro pode aprovar prorrogações")
  }

  const updates: any = {
    observacaoProrrogacao: observacao || null,
  }

  if (aprovado) {
    // Renovar o prazo
    const novaDataLimite = new Date()
    novaDataLimite.setDate(novaDataLimite.getDate() + (diasExtensao || 2))
    updates.dataLimiteAnexoNota = novaDataLimite
    updates.status = "aprovado"
    updates.prorrogacaoSolicitada = false
    updates.prorrogacaoAprovada = true
  } else {
    // Manter status aguardando_prorrogacao se negado
    updates.status = "prorrogacao_negada"
    updates.prorrogacaoAprovada = false
  }

  try {
    await db.update(pedidosPagamento).set(updates).where(eq(pedidosPagamento.id, pedidoId))
  } catch (error) {
    console.error("[v0] Erro ao responder solicitação:", error)
    throw new Error("Erro ao responder solicitação de prorrogação")
  }

  revalidatePath("/financeiro")
  revalidatePath("/meus-pagamentos")

  return { success: true }
}

export async function listarTodosPedidos(filtros?: {
  dataInicio?: string
  dataFim?: string
  colaboradorNome?: string
  equipeId?: string
  status?: string
}) {
  const session = await getSession()

  if (!session) {
    throw new Error("Usuário não autenticado")
  }

  if (!["Adm", "Gerente", "Financeiro", "SuperAdmin"].includes(session.tipoAcesso)) {
    throw new Error("Acesso negado")
  }

  console.log("[v0] Listando todos os pedidos com filtros:", filtros)

  let equipesPermitidas: string[] = []

  if (session.tipoAcesso === "Gerente") {
    // Buscar equipes gerenciadas por este gerente
    let equipesGerente
    try {
      equipesGerente = await db
        .select({ equipeId: gerentesEquipes.equipeId })
        .from(gerentesEquipes)
        .where(eq(gerentesEquipes.gerenteId, session.colaboradorId))
    } catch (error) {
      console.error("[v0] Erro ao buscar equipes do gerente:", error)
      throw new Error("Erro ao buscar equipes")
    }

    equipesPermitidas = equipesGerente?.map((e) => e.equipeId) || []

    if (equipesPermitidas.length === 0) {
      console.log("[v0] Gerente não possui equipes vinculadas")
      return []
    }
  }

  try {
    const conditions = []

    const empresaEfetivaFiltros = getEffectiveEmpresaIdFromSession(session)
    if (empresaEfetivaFiltros !== null) {
      conditions.push(eq(pedidosPagamento.empresaId, empresaEfetivaFiltros))
    }
    if (filtros?.dataInicio) {
      conditions.push(gte(pedidosPagamento.createdAt, new Date(filtros.dataInicio)))
    }
    if (filtros?.dataFim) {
      const dataFimAjustada = new Date(filtros.dataFim)
      dataFimAjustada.setDate(dataFimAjustada.getDate() + 1)
      conditions.push(lt(pedidosPagamento.createdAt, dataFimAjustada))
    }
    if (filtros?.status && filtros.status !== "todos") {
      conditions.push(eq(pedidosPagamento.status, filtros.status))
    }

    const rows = await db.query.pedidosPagamento.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      orderBy: desc(pedidosPagamento.createdAt),
      with: {
        colaborador: true,
        criadoPorColaborador: true,
        notaFiscal: true,
      },
    })

    let pedidosFiltrados: any[] = rows

    if (session.tipoAcesso === "Gerente" && equipesPermitidas.length > 0) {
      pedidosFiltrados = pedidosFiltrados.filter(
        (pedido) => pedido.colaborador?.equipeId && equipesPermitidas.includes(pedido.colaborador.equipeId),
      )
    }

    // Filtrar por equipe se fornecido
    if (filtros?.equipeId && filtros.equipeId !== "todas") {
      if (filtros.equipeId === "sem-equipe") {
        pedidosFiltrados = pedidosFiltrados.filter((pedido) => !pedido.colaborador?.equipeId)
      } else {
        pedidosFiltrados = pedidosFiltrados.filter((pedido) => pedido.colaborador?.equipeId === filtros.equipeId)
      }
    }

    // Filtrar por nome do colaborador se fornecido
    if (filtros?.colaboradorNome) {
      const nomeNormalizado = filtros.colaboradorNome.toLowerCase()
      pedidosFiltrados = pedidosFiltrados.filter((pedido) =>
        pedido.colaborador?.nomeCompleto?.toLowerCase().includes(nomeNormalizado),
      )
    }

    console.log("[v0] Total de pedidos encontrados:", pedidosFiltrados.length)

    return pedidosFiltrados.map((row) => toPedidoDTO({ ...row, criadoPor: row.criadoPorColaborador }))
  } catch (error) {
    console.error("[v0] Erro ao listar todos os pedidos:", error)
    throw new Error("Erro ao listar todos os pedidos")
  }
}

export async function aprovarNotaFiscal(pedidoId: string) {
  const session = await getSession()
  if (!session) {
    throw new Error("Usuário não autenticado")
  }

  if (!["Financeiro", "Adm"].includes(session.tipoAcesso)) {
    throw new Error("Apenas financeiro pode aprovar notas fiscais")
  }

  try {
    await db
      .update(pedidosPagamento)
      .set({
        status: "nota_recebida",
        dataNotaRecebida: new Date(),
      })
      .where(eq(pedidosPagamento.id, pedidoId))

    // Sincroniza a nota associada (se existir) — antes desta mudança, pedidosPagamento
    // e notasFiscais nunca se tocavam, cada uma tinha seu próprio status desatualizado.
    await db
      .update(notasFiscais)
      .set({ status: "aprovado", aprovadoPor: session.colaboradorId, dataAprovacao: new Date(), updatedAt: new Date() })
      .where(eq(notasFiscais.pedidoId, pedidoId))
  } catch (error) {
    console.error("[v0] Erro ao aprovar nota fiscal:", error)
    console.error("[v0] Exceção ao aprovar nota fiscal:", error)
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(`Erro ao aprovar nota fiscal: ${message}`)
  }

  revalidatePath("/financeiro")
  revalidatePath("/meus-pagamentos")

  return { success: true }
}

export async function recusarNotaFiscal(pedidoId: string, motivo: string) {
  const session = await getSession()
  if (!session) {
    throw new Error("Usuário não autenticado")
  }

  if (!["Financeiro", "Adm"].includes(session.tipoAcesso)) {
    throw new Error("Apenas financeiro pode recusar notas fiscais")
  }

  try {
    await db
      .update(pedidosPagamento)
      .set({
        status: "aprovado",
        notaEmitida: false,
        notaFiscalUrl: null,
        observacaoFinanceiro: motivo,
      })
      .where(eq(pedidosPagamento.id, pedidoId))

    await db
      .update(notasFiscais)
      .set({ status: "rejeitado", observacaoFinanceiro: motivo, updatedAt: new Date() })
      .where(eq(notasFiscais.pedidoId, pedidoId))
  } catch (error) {
    console.error("[v0] Erro ao recusar nota fiscal:", error)
    console.error("[v0] Exceção ao recusar nota fiscal:", error)
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(`Erro ao recusar nota fiscal: ${message}`)
  }

  revalidatePath("/financeiro")
  revalidatePath("/meus-pagamentos")

  return { success: true }
}

/** Fecha o ciclo do pagamento — transição pra "pago" que não existia em nenhum lugar do
 *  código antes desta feature. Só permite avançar quando a nota fiscal associada já foi
 *  aprovada pelo financeiro. */
export async function marcarComoPago(pedidoId: string) {
  const session = await getSession()
  if (!session) throw new Error("Usuário não autenticado")
  if (!["Financeiro", "Adm"].includes(session.tipoAcesso)) {
    throw new Error("Apenas financeiro pode marcar um pagamento como pago")
  }

  const [pedido] = await db
    .select({ status: pedidosPagamento.status })
    .from(pedidosPagamento)
    .where(eq(pedidosPagamento.id, pedidoId))
  if (!pedido) throw new Error("Pedido não encontrado")
  if (pedido.status !== "nota_recebida") {
    throw new Error("Só é possível marcar como pago depois que a nota fiscal for recebida")
  }

  const [nota] = await db.select().from(notasFiscais).where(eq(notasFiscais.pedidoId, pedidoId))
  if (!nota || nota.status !== "aprovado") {
    throw new Error("A nota fiscal deste pagamento ainda não foi aprovada")
  }

  try {
    await db.update(pedidosPagamento).set({ status: "pago" }).where(eq(pedidosPagamento.id, pedidoId))
  } catch (error) {
    console.error("[v0] Erro ao marcar pedido como pago:", error)
    throw new Error("Erro ao marcar pedido como pago")
  }

  revalidatePath("/financeiro")
  revalidatePath("/meus-pagamentos")

  return { success: true }
}

export async function listarPedidosSemNota(filtros?: {
  dataInicio?: string
  dataFim?: string
  colaboradorNome?: string
  equipeId?: string
}) {
  const session = await getSession()

  if (!session) throw new Error("Usuário não autenticado")
  if (!["Financeiro", "Adm", "SuperAdmin"].includes(session.tipoAcesso)) throw new Error("Sem permissão")

  try {
    const conditions = [
      inArray(pedidosPagamento.status, ["pendente_financeiro", "aprovado"]),
      isNull(pedidosPagamento.notaFiscalUrl),
    ]

    if (session.tipoAcesso !== "SuperAdmin") conditions.push(eq(pedidosPagamento.empresaId, session.empresaId!))
    if (filtros?.dataInicio) conditions.push(gte(pedidosPagamento.createdAt, new Date(filtros.dataInicio)))
    if (filtros?.dataFim) {
      const d = new Date(filtros.dataFim)
      d.setDate(d.getDate() + 1)
      conditions.push(lt(pedidosPagamento.createdAt, d))
    }

    const rows = await db.query.pedidosPagamento.findMany({
      where: and(...conditions),
      orderBy: desc(pedidosPagamento.createdAt),
      with: {
        colaborador: true,
        notaFiscal: true,
      },
    })

    let result = rows.filter((p: any) => {
      const hasNota = !!p.notaFiscal
      const isReembolsoKm = p.tipoPedido === "reembolso_km"
      return !hasNota && !isReembolsoKm
    })

    if (filtros?.equipeId && filtros.equipeId !== "todas") {
      result = result.filter((p: any) => p.colaborador?.equipeId === filtros.equipeId)
    }
    if (filtros?.colaboradorNome) {
      const nome = filtros.colaboradorNome.toLowerCase()
      result = result.filter((p: any) => p.colaborador?.nomeCompleto?.toLowerCase().includes(nome))
    }

    return result.map((row: any) => toPedidoDTO(row))
  } catch (error) {
    console.error("[v0] Erro ao listar pedidos sem nota:", error)
    throw new Error("Erro ao listar")
  }
}

export async function listarPedidosComNota(filtros?: {
  dataInicio?: string
  dataFim?: string
  colaboradorNome?: string
  equipeId?: string
}) {
  const session = await getSession()

  if (!session) throw new Error("Usuário não autenticado")
  if (!["Financeiro", "Adm", "SuperAdmin"].includes(session.tipoAcesso)) throw new Error("Sem permissão")

  try {
    const conditions = [inArray(pedidosPagamento.status, ["pendente_financeiro", "aprovado", "nota_recebida"])]

    if (session.tipoAcesso !== "SuperAdmin") conditions.push(eq(pedidosPagamento.empresaId, session.empresaId!))
    if (filtros?.dataInicio) conditions.push(gte(pedidosPagamento.createdAt, new Date(filtros.dataInicio)))
    if (filtros?.dataFim) {
      const d = new Date(filtros.dataFim)
      d.setDate(d.getDate() + 1)
      conditions.push(lt(pedidosPagamento.createdAt, d))
    }

    const rows = await db.query.pedidosPagamento.findMany({
      where: and(...conditions),
      orderBy: desc(pedidosPagamento.createdAt),
      with: {
        colaborador: true,
        criadoPorColaborador: true,
        notaFiscal: true,
      },
    })

    let result = rows.filter((p: any) => {
      const hasNota = !!p.notaFiscalUrl || !!p.notaFiscal
      const isReembolsoKm = p.tipoPedido === "reembolso_km"
      return hasNota || isReembolsoKm
    })

    if (filtros?.equipeId && filtros.equipeId !== "todas") {
      result = result.filter((p: any) => p.colaborador?.equipeId === filtros.equipeId)
    }
    if (filtros?.colaboradorNome) {
      const nome = filtros.colaboradorNome.toLowerCase()
      result = result.filter((p: any) => p.colaborador?.nomeCompleto?.toLowerCase().includes(nome))
    }

    return result.map((row: any) => toPedidoDTO({ ...row, criadoPor: row.criadoPorColaborador }))
  } catch (error) {
    console.error("[v0] Erro ao listar pedidos com nota:", error)
    throw new Error("Erro ao listar")
  }
}

export async function listarNotasEnviadas(filtros?: {
  dataInicio?: string
  dataFim?: string
  colaboradorNome?: string
  equipeId?: string
}) {
  const session = await getSession()

  if (!session) {
    throw new Error("Usuário não autenticado")
  }

  if (!["Financeiro", "Adm", "SuperAdmin"].includes(session.tipoAcesso)) {
    throw new Error("Apenas financeiro pode acessar esta página")
  }

  console.log("[v0] Listando notas enviadas com filtros:", filtros)

  try {
    const conditions = [inArray(pedidosPagamento.status, ["pendente_financeiro", "aprovado", "pago", "nota_recebida"])]

    if (session.tipoAcesso !== "SuperAdmin") {
      conditions.push(eq(pedidosPagamento.empresaId, session.empresaId!))
    }
    if (filtros?.dataInicio) {
      conditions.push(gte(pedidosPagamento.createdAt, new Date(filtros.dataInicio)))
    }
    if (filtros?.dataFim) {
      const dataFimAjustada = new Date(filtros.dataFim)
      dataFimAjustada.setDate(dataFimAjustada.getDate() + 1)
      conditions.push(lt(pedidosPagamento.createdAt, dataFimAjustada))
    }

    const rows = await db.query.pedidosPagamento.findMany({
      where: and(...conditions),
      orderBy: desc(pedidosPagamento.createdAt),
      with: {
        colaborador: true,
        criadoPorColaborador: true,
        notaFiscal: true,
      },
    })

    let pedidosFiltrados: any[] = rows

    // Filtrar por equipe se fornecido
    if (filtros?.equipeId && filtros.equipeId !== "todas") {
      pedidosFiltrados = pedidosFiltrados.filter((pedido) => pedido.colaborador?.equipeId === filtros.equipeId)
    }

    // Filtrar por nome do colaborador se fornecido
    if (filtros?.colaboradorNome) {
      const nomeMinusculo = filtros.colaboradorNome.toLowerCase()
      pedidosFiltrados = pedidosFiltrados.filter((pedido) =>
        pedido.colaborador?.nomeCompleto.toLowerCase().includes(nomeMinusculo),
      )
    }

    console.log("[v0] Notas enviadas encontradas:", pedidosFiltrados.length)

    return pedidosFiltrados.map((row) => toPedidoDTO({ ...row, criadoPor: row.criadoPorColaborador }))
  } catch (error) {
    console.error("[v0] Erro ao listar notas enviadas:", error)
    throw new Error("Erro ao listar notas enviadas")
  }
}

export async function listarPedidosPagos(filtros?: {
  dataInicio?: string
  dataFim?: string
  colaboradorNome?: string
  equipeId?: string
}) {
  const session = await getSession()

  if (!session) throw new Error("Usuário não autenticado")
  if (!["Financeiro", "Adm", "SuperAdmin"].includes(session.tipoAcesso)) throw new Error("Sem permissão")

  try {
    const conditions = [eq(pedidosPagamento.status, "pago")]

    if (session.tipoAcesso !== "SuperAdmin") conditions.push(eq(pedidosPagamento.empresaId, session.empresaId!))
    if (filtros?.dataInicio) conditions.push(gte(pedidosPagamento.createdAt, new Date(filtros.dataInicio)))
    if (filtros?.dataFim) {
      const d = new Date(filtros.dataFim)
      d.setDate(d.getDate() + 1)
      conditions.push(lt(pedidosPagamento.createdAt, d))
    }

    const rows = await db.query.pedidosPagamento.findMany({
      where: and(...conditions),
      orderBy: desc(pedidosPagamento.createdAt),
      with: {
        colaborador: true,
        criadoPorColaborador: true,
        notaFiscal: true,
      },
    })

    let result: any[] = rows

    if (filtros?.equipeId && filtros.equipeId !== "todas") {
      result = result.filter((p) => p.colaborador?.equipeId === filtros.equipeId)
    }
    if (filtros?.colaboradorNome) {
      const nome = filtros.colaboradorNome.toLowerCase()
      result = result.filter((p) => p.colaborador?.nomeCompleto?.toLowerCase().includes(nome))
    }

    console.log("[v0] Pedidos pagos encontrados:", result.length)

    return result.map((row) => toPedidoDTO({ ...row, criadoPor: row.criadoPorColaborador }))
  } catch (error) {
    console.error("[v0] Erro ao listar pedidos pagos:", error)
    throw new Error("Erro ao listar")
  }
}
