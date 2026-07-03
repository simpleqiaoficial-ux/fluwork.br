"use server"

import { getSupabaseServerClient } from "@/lib/supabase-server"
import type { NovoPedido, AcaoPedido } from "@/types/pedido"
import { revalidatePath } from "next/cache"
import { getSession } from "@/lib/session"
import { put } from "@vercel/blob"

export async function criarPedido(data: NovoPedido) {
  const supabase = await getSupabaseServerClient()

  const session = await getSession()
  if (!session || !["Supervisor", "Adm", "Gerente", "Financeiro"].includes(session.tipoAcesso)) {
    throw new Error("Voce nao tem permissao para criar pedidos")
  }

  if (data.tipo_pedido !== "reembolso_km" && data.conducao > 0) {
    const hoje = new Date()
    const primeiroDiaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
    const ultimoDiaMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0, 23, 59, 59)

    const { data: pedidosExistentes, error: pedidosError } = await supabase
      .from("pedidos_pagamento")
      .select("id, conducao, created_at")
      .eq("colaborador_id", data.colaborador_id)
      .gt("conducao", 0)
      .gte("created_at", primeiroDiaMes.toISOString())
      .lte("created_at", ultimoDiaMes.toISOString())

    if (pedidosError) {
      console.error("[v0] Erro ao verificar pedidos existentes:", pedidosError)
      throw new Error("Erro ao verificar pedidos existentes")
    }

    if (pedidosExistentes && pedidosExistentes.length > 0) {
      throw new Error("Este colaborador já recebeu condução este mês. Apenas uma condução por mês é permitida.")
    }
  }

  let valorTotal = 0
  let valorTotalHorasExtras = 0

  if (data.tipo_pedido === "reembolso_km") {
    valorTotal = data.valor_km
    valorTotalHorasExtras = 0
  } else {
    const { data: colaborador, error: colaboradorError } = await supabase
      .from("colaboradores")
      .select("salario")
      .eq("id", data.colaborador_id)
      .single()

    if (colaboradorError || !colaborador) {
      console.error("[v0] Erro ao buscar colaborador:", colaboradorError)
      throw new Error("Colaborador não encontrado")
    }

    const valorHoraNormal = colaborador.salario / 220
    const valorHora50 = valorHoraNormal * 1.5
    const valorHora100 = valorHoraNormal * 2

    const valorHorasExtras50 = data.horas_extras_50 * valorHora50
    const valorHorasExtras100 = data.horas_extras_100 * valorHora100
    valorTotalHorasExtras = valorHorasExtras50 + valorHorasExtras100

    // Condução e KM ficam fora do valor da nota (aparecem mas não calculam)
    valorTotal =
      colaborador.salario +
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
          colaborador_id: data.colaborador_id,
          tipo_pedido: data.tipo_pedido,
          horas_extras: 0,
          horas_extras_50: 0,
          horas_extras_100: 0,
          motivo_horas_extras: null,
          valor_km: data.valor_km,
          conducao: 0,
          valor_plantao: 0,
          motivo_plantao: null,
          comissao: 0,
          motivo_comissao: null,
          valor_desconto: 0,
          motivo_desconto: null,
          valor_total: valorTotal,
          status: statusInicial,
          criado_por_colaborador_id: session.colaboradorId,
        }
      : {
          colaborador_id: data.colaborador_id,
          tipo_pedido: data.tipo_pedido,
          horas_extras: valorTotalHorasExtras,
          horas_extras_50: data.horas_extras_50,
          horas_extras_100: data.horas_extras_100,
          motivo_horas_extras: data.motivo_horas_extras || null,
          valor_km: data.valor_km,
          conducao: data.conducao,
          valor_plantao: data.valor_plantao,
          motivo_plantao: data.motivo_plantao || null,
          comissao: data.comissao || 0,
          motivo_comissao: data.motivo_comissao || null,
          valor_desconto: data.valor_desconto || 0,
          motivo_desconto: data.motivo_desconto || null,
          valor_total: valorTotal,
          status: statusInicial,
          criado_por_colaborador_id: session.colaboradorId,
        }

  const { data: pedido, error } = await supabase.from("pedidos_pagamento").insert(dadosPedido).select().single()

  if (error) {
    console.error("[v0] Erro ao criar pedido:", error)
    throw new Error("Erro ao criar pedido de pagamento")
  }

  revalidatePath("/pedidos")
  return pedido
}

export async function acaoGerente(data: AcaoPedido) {
  const supabase = await getSupabaseServerClient()

  const session = await getSession()
  if (!session || (session.tipoAcesso !== "Gerente" && session.tipoAcesso !== "Adm")) {
    throw new Error("Apenas gerentes podem realizar esta ação")
  }

  const updates: any = {
    observacao_gerente: data.observacao,
    data_aprovacao_gerente: new Date().toISOString(),
    aprovado_por_gerente_id: session.colaboradorId,
  }

  if (data.acao === "aprovar") {
    updates.aprovado_gerente = true
    updates.status = "pendente_financeiro"
  } else if (data.acao === "recusar") {
    updates.aprovado_gerente = false
    updates.status = "recusado"
  } else if (data.acao === "corrigir") {
    updates.aprovado_gerente = null
    updates.status = "correcao"
    updates.correcao_solicitada_por = "gerente"
  }

  const { error } = await supabase.from("pedidos_pagamento").update(updates).eq("id", data.pedido_id)

  if (error) {
    console.error("[v0] Erro ao atualizar pedido:", error)
    throw new Error("Erro ao processar ação")
  }

  revalidatePath("/aprovacoes")
  revalidatePath("/historico")
}

export async function acaoFinanceiro(data: AcaoPedido) {
  const supabase = await getSupabaseServerClient()

  const session = await getSession()
  if (!session) {
    throw new Error("Usuário não autenticado")
  }

  if (!["Financeiro", "Adm"].includes(session.tipoAcesso)) {
    throw new Error("Apenas financeiro pode realizar esta ação")
  }

  const updates: any = {
    observacao_financeiro: data.observacao,
    data_aprovacao_financeiro: new Date().toISOString(),
    aprovado_por_financeiro_id: session.colaboradorId,
  }

  if (data.acao === "aprovar") {
    if (!data.data_previsao_pagamento) {
      throw new Error("Data de previsão de pagamento é obrigatória")
    }
    updates.aprovado_financeiro = true
    updates.status = "aprovado"
    const [ano, mes, dia] = data.data_previsao_pagamento.split("-")
    const dataPrevisao = new Date(Number(ano), Number(mes) - 1, Number(dia), 12, 0, 0)
    updates.data_previsao_pagamento = dataPrevisao.toISOString().split("T")[0]
    const dataLimite = new Date()
    dataLimite.setDate(dataLimite.getDate() + 2)
    updates.data_limite_anexo_nota = dataLimite.toISOString()
  } else if (data.acao === "recusar") {
    updates.aprovado_financeiro = false
    updates.status = "recusado"
  } else if (data.acao === "corrigir") {
    updates.aprovado_financeiro = null
    updates.status = "correcao"
    updates.correcao_solicitada_por = "financeiro"
  }

  const { error } = await supabase.from("pedidos_pagamento").update(updates).eq("id", data.pedido_id)

  if (error) {
    console.error("[v0] Erro ao atualizar pedido:", error)
    throw new Error("Erro ao processar ação")
  }

  revalidatePath("/aprovacoes")
  revalidatePath("/meus-pagamentos")
  revalidatePath("/historico")
}

export async function listarPedidos() {
  const supabase = await getSupabaseServerClient()

  const { data, error } = await supabase
    .from("pedidos_pagamento")
    .select(
      `
      *,
      colaborador:colaboradores!colaborador_id (
        nome_completo,
        salario,
        tipo_acesso
      ),
      criado_por:colaboradores!criado_por_colaborador_id (
        nome_completo,
        tipo_acesso
      )
    `,
    )
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[v0] Erro ao listar pedidos:", error)
    throw new Error("Erro ao listar pedidos")
  }

  return data
}

export async function listarPedidosComFiltros(filtros?: { dataInicio?: string; dataFim?: string }) {
  const supabase = await getSupabaseServerClient()

  let query = supabase.from("pedidos_pagamento").select(
    `
      *,
      colaborador:colaboradores!colaborador_id (
        nome_completo,
        salario,
        tipo_acesso,
        equipe_id,
        centro_custo_id,
        equipe:equipes!colaboradores_equipe_id_fkey (
          id,
          nome
        ),
        centro_custo:centros_custo!colaboradores_centro_custo_id_fkey (
          id,
          numero,
          nome
        )
      ),
      criado_por:colaboradores!criado_por_colaborador_id (
        nome_completo,
        tipo_acesso
      )
    `,
  )

  // Aplicar filtros de data se fornecidos
  if (filtros?.dataInicio) {
    query = query.gte("created_at", filtros.dataInicio)
  }
  if (filtros?.dataFim) {
    // Adicionar 1 dia para incluir todo o dia final
    const dataFimAjustada = new Date(filtros.dataFim)
    dataFimAjustada.setDate(dataFimAjustada.getDate() + 1)
    query = query.lt("created_at", dataFimAjustada.toISOString())
  }

  query = query.order("created_at", { ascending: false })

  const { data, error } = await query

  if (error) {
    console.error("[v0] Erro ao listar pedidos com filtros:", error)
    throw new Error("Erro ao listar pedidos")
  }

  return data
}

export async function listarPedidosPendentes() {
  const supabase = await getSupabaseServerClient()

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
    const { data: gerenteEquipes, error: gerenteEquipesError } = await supabase
      .from("gerentes_equipes")
      .select("equipe_id")
      .eq("gerente_id", session.colaboradorId)

    if (gerenteEquipesError) {
      console.error("[v0] Erro ao buscar equipes do gerente:", gerenteEquipesError)
      throw new Error("Erro ao buscar equipes do gerente")
    }

    const equipeIds = gerenteEquipes.map((e) => e.equipe_id)

    if (equipeIds.length === 0) {
      return []
    }

    // Buscar colaboradores das equipes do gerente
    const { data: colaboradores, error: colaboradoresError } = await supabase
      .from("colaboradores")
      .select("id")
      .in("equipe_id", equipeIds)

    if (colaboradoresError) {
      console.error("[v0] Erro ao buscar colaboradores:", colaboradoresError)
      throw new Error("Erro ao buscar colaboradores")
    }

    colaboradorIds = colaboradores.map((c) => c.id)

    if (colaboradorIds.length === 0) {
      return []
    }

    console.log("[v0] Gerente filtrando por colaboradores das suas equipes:", colaboradorIds.length)
  }

  let query = supabase
    .from("pedidos_pagamento")
    .select(
      `
      *,
      colaborador:colaboradores!colaborador_id (
        nome_completo,
        salario,
        tipo_acesso,
        equipe_id
      ),
      criado_por:colaboradores!criado_por_colaborador_id (
        nome_completo,
        tipo_acesso
      )
    `,
    )
    .in("status", statusFiltro)
    .or("nota_emitida.is.null,nota_emitida.eq.false") // Apenas pedidos sem nota anexada

  if (session.tipoAcesso === "Gerente" && colaboradorIds.length > 0) {
    query = query.in("colaborador_id", colaboradorIds)
  }

  query = query.order("created_at", { ascending: false })

  const { data, error } = await query

  if (error) {
    console.error("[v0] Erro ao listar pedidos pendentes:", error)
    throw new Error("Erro ao listar pedidos pendentes")
  }

  console.log("[v0] Pedidos encontrados:", data?.length || 0)

  return data
}

export async function listarPedidosParaCorrecao() {
  const supabase = await getSupabaseServerClient()

  const session = await getSession()

  if (!session) {
    throw new Error("Usuário não autenticado")
  }

  console.log("[v0] Listando pedidos para correção do supervisor:", session.colaboradorId)

  const { data, error } = await supabase
    .from("pedidos_pagamento")
    .select(
      `
      *,
      colaborador:colaboradores!colaborador_id (
        nome_completo,
        salario,
        tipo_acesso,
        equipe_id
      ),
      criado_por:colaboradores!criado_por_colaborador_id (
        nome_completo,
        tipo_acesso
      )
    `,
    )
    .eq("criado_por_colaborador_id", session.colaboradorId)
    .eq("status", "correcao")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[v0] Erro ao listar pedidos para correção:", error)
    throw new Error("Erro ao listar pedidos para correção")
  }

  console.log("[v0] Pedidos para correção encontrados:", data?.length || 0)

  return data || []
}

export async function deletarPedido(id: string) {
  const supabase = await getSupabaseServerClient()

  const { error } = await supabase.from("pedidos_pagamento").delete().eq("id", id)

  if (error) {
    console.error("[v0] Erro ao deletar pedido:", error)
    throw new Error("Erro ao deletar pedido")
  }

  revalidatePath("/pedidos")
}

export async function listarPedidosPorSupervisor(supervisorId: string) {
  const supabase = await getSupabaseServerClient()

  // Buscar equipes onde o usuário é supervisor
  const { data: equipes, error: equipesError } = await supabase
    .from("equipes")
    .select("id")
    .eq("supervisor_id", supervisorId)

  if (equipesError) {
    console.error("[v0] Erro ao buscar equipes do supervisor:", equipesError)
    throw new Error("Erro ao buscar equipes")
  }

  const equipeIds = equipes.map((e) => e.id)

  if (equipeIds.length === 0) {
    return []
  }

  const { data: colaboradores, error: colaboradoresError } = await supabase
    .from("colaboradores")
    .select("id")
    .in("equipe_id", equipeIds)
    .in("tipo_acesso", ["Colaborador", "Supervisor"])

  if (colaboradoresError) {
    console.error("[v0] Erro ao buscar colaboradores:", colaboradoresError)
    throw new Error("Erro ao buscar colaboradores")
  }

  const colaboradorIds = colaboradores.map((c) => c.id)

  if (colaboradorIds.length === 0) {
    return []
  }

  // Buscar pedidos dos colaboradores da equipe
  const { data, error } = await supabase
    .from("pedidos_pagamento")
    .select(
      `
      *,
      colaborador:colaboradores!colaborador_id (
        nome_completo,
        salario,
        tipo_acesso,
        equipe_id
      ),
      criado_por:colaboradores!criado_por_colaborador_id (
        nome_completo,
        tipo_acesso
      )
    `,
    )
    .in("colaborador_id", colaboradorIds)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[v0] Erro ao listar pedidos do supervisor:", error)
    throw new Error("Erro ao listar pedidos")
  }

  return data
}

export async function listarPedidosPorGerente(gerenteId: string, filtros?: { dataInicio?: string; dataFim?: string }) {
  const supabase = await getSupabaseServerClient()

  // Buscar equipes onde o gerente está vinculado
  const { data: gerenteEquipes, error: gerenteEquipesError } = await supabase
    .from("gerentes_equipes")
    .select("equipe_id")
    .eq("gerente_id", gerenteId)

  if (gerenteEquipesError) {
    console.error("[v0] Erro ao buscar equipes do gerente:", gerenteEquipesError)
    throw new Error("Erro ao buscar equipes do gerente")
  }

  const equipeIds = gerenteEquipes.map((e) => e.equipe_id)

  if (equipeIds.length === 0) {
    return []
  }

  const { data: colaboradores, error: colaboradoresError } = await supabase
    .from("colaboradores")
    .select("id")
    .in("equipe_id", equipeIds)

  if (colaboradoresError) {
    console.error("[v0] Erro ao buscar colaboradores:", colaboradoresError)
    throw new Error("Erro ao buscar colaboradores")
  }

  const colaboradorIds = colaboradores.map((c) => c.id)

  if (colaboradorIds.length === 0) {
    return []
  }

  // Buscar pedidos dos colaboradores das equipes
  let query = supabase
    .from("pedidos_pagamento")
    .select(
      `
      *,
      colaborador:colaboradores!colaborador_id (
        nome_completo,
        salario,
        tipo_acesso,
        equipe_id
      ),
      criado_por:colaboradores!criado_por_colaborador_id (
        nome_completo,
        tipo_acesso
      )
    `,
    )
    .in("colaborador_id", colaboradorIds)

  // Aplicar filtros de data se fornecidos
  if (filtros?.dataInicio) {
    query = query.gte("created_at", filtros.dataInicio)
  }
  if (filtros?.dataFim) {
    const dataFimAjustada = new Date(filtros.dataFim)
    dataFimAjustada.setDate(dataFimAjustada.getDate() + 1)
    query = query.lt("created_at", dataFimAjustada.toISOString())
  }

  query = query.order("created_at", { ascending: false })

  const { data, error } = await query

  if (error) {
    console.error("[v0] Erro ao listar pedidos do gerente:", error)
    throw new Error("Erro ao listar pedidos")
  }

  return data
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
  const supabase = await getSupabaseServerClient()

  const session = await getSession()
  if (!session || (session.tipoAcesso !== "Supervisor" && session.tipoAcesso !== "Adm" && session.tipoAcesso !== "Gerente")) {
    throw new Error("Sem permissão para corrigir pedidos")
  }

  // Buscar o pedido atual para saber qual era o status anterior
  const { data: pedidoAtual, error: pedidoError } = await supabase
    .from("pedidos_pagamento")
    .select("*, colaborador:colaboradores!colaborador_id(salario)")
    .eq("id", pedidoId)
    .single()

  if (pedidoError || !pedidoAtual) {
    console.error("[v0] Erro ao buscar pedido:", pedidoError)
    throw new Error("Pedido não encontrado")
  }

  // Gerentes só podem corrigir pedidos que eles mesmos criaram
  if (session.tipoAcesso === "Gerente" && pedidoAtual.criado_por_colaborador_id !== session.colaboradorId) {
    throw new Error("Você só pode corrigir pedidos que você criou")
  }

  const valorHoraNormal = pedidoAtual.colaborador.salario / 220
  const valorHorasExtras50 = data.horas_extras_50 * valorHoraNormal * 1.5
  const valorHorasExtras100 = data.horas_extras_100 * valorHoraNormal * 2
  const valorTotalHorasExtras = valorHorasExtras50 + valorHorasExtras100

  // Condução e KM ficam fora do valor da nota (aparecem mas não calculam)
  const valorTotal =
    pedidoAtual.colaborador.salario +
    valorTotalHorasExtras +
    data.valor_plantao +
    (data.comissao || 0) -
    data.valor_desconto

  // Determinar para qual status enviar baseado em quem solicitou a correção
  let novoStatus = "pendente_gerente"
  if (pedidoAtual.correcao_solicitada_por === "financeiro") {
    // Se o financeiro solicitou correção, volta para o financeiro
    novoStatus = "pendente_financeiro"
  } else if (pedidoAtual.correcao_solicitada_por === "gerente") {
    // Se o gerente solicitou correção, volta para o gerente
    novoStatus = "pendente_gerente"
  } else if (pedidoAtual.observacao_financeiro) {
    // Fallback: se o financeiro tem observação, provavelmente foi ele
    novoStatus = "pendente_financeiro"
  }

  const { error } = await supabase
    .from("pedidos_pagamento")
    .update({
      horas_extras_50: data.horas_extras_50,
      horas_extras_100: data.horas_extras_100,
      horas_extras: valorTotalHorasExtras,
      valor_km: data.valor_km,
      conducao: data.conducao,
      valor_plantao: data.valor_plantao,
      motivo_plantao: data.motivo_plantao || null,
      comissao: data.comissao || 0,
      motivo_comissao: data.motivo_comissao || null,
      valor_desconto: data.valor_desconto,
      motivo_desconto: data.motivo_desconto || null,
      valor_total: valorTotal,
      status: novoStatus,
      // Limpar observações anteriores e campo de quem solicitou
      observacao_gerente: null,
      observacao_financeiro: null,
      correcao_solicitada_por: null,
    })
    .eq("id", pedidoId)

  if (error) {
    console.error("[v0] Erro ao corrigir pedido:", error)
    throw new Error("Erro ao corrigir pedido")
  }

  revalidatePath("/historico")
  revalidatePath("/aprovacoes")
}

export async function marcarNotaEmitida(pedidoId: string, notaFiscalUrl: string) {
  const supabase = await getSupabaseServerClient()

  const session = await getSession()
  if (!session) {
    throw new Error("Usuário não autenticado")
  }

  // Verificar se o pedido pertence ao colaborador logado
  const { data: pedido, error: pedidoError } = await supabase
    .from("pedidos_pagamento")
    .select("colaborador_id, status")
    .eq("id", pedidoId)
    .single()

  if (pedidoError || !pedido) {
    console.error("[v0] Erro ao buscar pedido:", pedidoError)
    throw new Error("Pedido não encontrado")
  }

  if (pedido.colaborador_id !== session.colaboradorId) {
    throw new Error("Você não tem permissão para marcar esta nota")
  }

  if (pedido.status !== "aprovado") {
    throw new Error("Apenas pedidos aprovados podem ter nota emitida")
  }

  if (!notaFiscalUrl) {
    throw new Error("É necessário anexar o PDF da nota fiscal")
  }

  const { error } = await supabase
    .from("pedidos_pagamento")
    .update({
      nota_emitida: true,
      data_emissao_nota: new Date().toISOString(),
      nota_fiscal_url: notaFiscalUrl,
      status: "pendente_financeiro", // Envia de volta pro financeiro
    })
    .eq("id", pedidoId)

  if (error) {
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

    // Upload to Vercel Blob com nome único
    const timestamp = Date.now()
    const filename = `nota-fiscal-${timestamp}-${file.name}`

    const blob = await put(filename, file, {
      access: "public",
    })

    return {
      success: true,
      url: blob.url,
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
  const supabase = await getSupabaseServerClient()

  const session = await getSession()

  if (!session) {
    throw new Error("Usuário não autenticado")
  }

  if (!["Financeiro", "Adm"].includes(session.tipoAcesso)) {
    throw new Error("Apenas financeiro pode acessar esta página")
  }

  console.log("[v0] Listando pedidos para financeiro com filtros:", filtros)

  let query = supabase
    .from("pedidos_pagamento")
    .select(
      `
      *,
      colaborador:colaboradores!colaborador_id (
        nome_completo,
        salario,
        tipo_acesso
      ),
      criado_por:colaboradores!criado_por_colaborador_id (
        nome_completo,
        tipo_acesso
      ),
      notas_fiscais (
        id,
        numero_nfse,
        chave_acesso,
        valor_servico,
        cpf_cnpj_prestador,
        arquivo_xml_url,
        arquivo_pdf_url,
        created_at
      )
    `,
    )
    .eq("status", "pendente_financeiro")
    .eq("nota_emitida", true)

  // Aplicar filtro de data
  if (filtros?.dataInicio) {
    query = query.gte("created_at", filtros.dataInicio)
  }
  if (filtros?.dataFim) {
    query = query.lte("created_at", filtros.dataFim)
  }

  const { data, error } = await query

  console.log("[v0] Query executada. Erro:", error)
  console.log("[v0] Dados retornados:", data?.length || 0)

  if (error) {
    console.error("[v0] Erro ao listar pedidos para financeiro:", error)
    throw new Error("Erro ao listar pedidos para financeiro")
  }

  let pedidosFiltrados = (data || []).filter(
    (pedido) => pedido.tipo_pedido === "reembolso_km" || (pedido.notas_fiscais && pedido.notas_fiscais.length > 0),
  )

  // Filtrar por nome do colaborador se fornecido
  if (filtros?.colaboradorNome) {
    const nomeNormalizado = filtros.colaboradorNome.toLowerCase()
    pedidosFiltrados = pedidosFiltrados.filter((pedido) =>
      pedido.colaborador?.nome_completo?.toLowerCase().includes(nomeNormalizado),
    )
  }

  console.log("[v0] Pedidos para financeiro encontrados:", pedidosFiltrados.length)
  console.log(
    "[v0] Pedidos com notas_fiscais:",
    pedidosFiltrados.map((p) => ({
      id: p.id,
      nota_emitida: p.nota_emitida,
      notas_count: p.notas_fiscais?.length || 0,
    })),
  )

  return pedidosFiltrados
}

export async function listarPedidosComNotaPendente() {
  const supabase = await getSupabaseServerClient()

  const session = await getSession()

  if (!session) {
    throw new Error("Usuário não autenticado")
  }

  console.log("[v0] Listando pedidos com nota pendente para:", session.tipoAcesso)

  let query = supabase
    .from("pedidos_pagamento")
    .select(
      `
      *,
      colaborador:colaboradores!colaborador_id (
        nome_completo,
        salario,
        tipo_acesso,
        equipe_id
      ),
      criado_por:colaboradores!criado_por_colaborador_id (
        nome_completo,
        tipo_acesso
      )
    `,
    )
    .eq("tipo_pedido", "completo")
    .eq("status", "aprovado")
    .or("nota_emitida.is.null,nota_emitida.eq.false")

  if (session.tipoAcesso === "Supervisor") {
    const { data: equipes, error: equipesError } = await supabase
      .from("equipes")
      .select("id")
      .eq("supervisor_id", session.colaboradorId)

    if (equipesError) {
      console.error("[v0] Erro ao buscar equipes do supervisor:", equipesError)
      return []
    }

    const equipeIds = equipes.map((e) => e.id)

    if (equipeIds.length === 0) {
      return []
    }

    const { data: colaboradores, error: colaboradoresError } = await supabase
      .from("colaboradores")
      .select("id")
      .in("equipe_id", equipeIds)

    if (colaboradoresError) {
      console.error("[v0] Erro ao buscar colaboradores:", colaboradoresError)
      return []
    }

    const colaboradorIds = colaboradores.map((c) => c.id)

    if (colaboradorIds.length === 0) {
      return []
    }

    query = query.in("colaborador_id", colaboradorIds)
  } else if (session.tipoAcesso === "Gerente") {
    const { data: gerenteEquipes, error: gerenteEquipesError } = await supabase
      .from("gerentes_equipes")
      .select("equipe_id")
      .eq("gerente_id", session.colaboradorId)

    if (gerenteEquipesError) {
      console.error("[v0] Erro ao buscar equipes do gerente:", gerenteEquipesError)
      return []
    }

    const equipeIds = gerenteEquipes.map((e) => e.equipe_id)

    if (equipeIds.length === 0) {
      return []
    }

    const { data: colaboradores, error: colaboradoresError } = await supabase
      .from("colaboradores")
      .select("id")
      .in("equipe_id", equipeIds)

    if (colaboradoresError) {
      console.error("[v0] Erro ao buscar colaboradores:", colaboradoresError)
      return []
    }

    const colaboradorIds = colaboradores.map((c) => c.id)

    if (colaboradorIds.length === 0) {
      return []
    }

    query = query.in("colaborador_id", colaboradorIds)
  }
  // Financeiro e Adm veem todos os pedidos

  query = query.order("data_aprovacao_financeiro", { ascending: true })

  const { data, error } = await query

  if (error) {
    console.error("[v0] Erro ao listar pedidos com nota pendente:", error)
    throw new Error("Erro ao listar pedidos com nota pendente")
  }

  console.log("[v0] Pedidos com nota pendente encontrados:", data?.length || 0)

  return data || []
}

export async function solicitarProrrogacaoPrazo(pedidoId: string, motivo: string) {
  const supabase = await getSupabaseServerClient()

  const session = await getSession()
  if (!session) {
    throw new Error("Usuário não autenticado")
  }

  const { data: pedido, error: pedidoError } = await supabase
    .from("pedidos_pagamento")
    .select("colaborador_id, status, data_limite_anexo_nota")
    .eq("id", pedidoId)
    .single()

  if (pedidoError || !pedido) {
    console.error("[v0] Erro ao buscar pedido:", pedidoError)
    throw new Error("Pedido não encontrado")
  }

  if (pedido.colaborador_id !== session.colaboradorId) {
    throw new Error("Você não tem permissão para solicitar prorrogação deste pedido")
  }

  if (pedido.status !== "aprovado") {
    throw new Error("Apenas pedidos aprovados podem ter prorrogação solicitada")
  }

  const { error } = await supabase
    .from("pedidos_pagamento")
    .update({
      prorrogacao_solicitada: true,
      motivo_prorrogacao: motivo,
      data_solicitacao_prorrogacao: new Date().toISOString(),
      prorrogacao_aprovada: null,
      status: "aguardando_prorrogacao",
    })
    .eq("id", pedidoId)

  if (error) {
    console.error("[v0] Erro ao solicitar prorrogação:", error)
    throw new Error("Erro ao solicitar prorrogação de prazo")
  }

  revalidatePath("/meus-pagamentos")
  revalidatePath("/financeiro")

  return { success: true, message: "Solicitação enviada ao financeiro com sucesso!" }
}

export async function listarSolicitacoesProrrogacao() {
  const supabase = await getSupabaseServerClient()

  const session = await getSession()

  if (!session) {
    throw new Error("Usuário não autenticado")
  }

  if (!["Financeiro", "Adm"].includes(session.tipoAcesso)) {
    throw new Error("Apenas financeiro pode acessar esta página")
  }

  const { data, error } = await supabase
    .from("pedidos_pagamento")
    .select(
      `
      *,
      colaborador:colaboradores!colaborador_id (
        nome_completo,
        salario,
        tipo_acesso
      )
    `,
    )
    .eq("status", "aguardando_prorrogacao")
    .eq("prorrogacao_solicitada", true)
    .is("prorrogacao_aprovada", null)
    .order("data_solicitacao_prorrogacao", { ascending: true })

  if (error) {
    console.error("[v0] Erro ao listar solicitações de prorrogação:", error)
    throw new Error("Erro ao listar solicitações")
  }

  return data || []
}

export async function responderSolicitacaoProrrogacao(
  pedidoId: string,
  aprovado: boolean,
  observacao?: string,
  diasExtensao?: number,
) {
  const supabase = await getSupabaseServerClient()

  const session = await getSession()

  if (!session) {
    throw new Error("Usuário não autenticado")
  }

  if (!["Financeiro", "Adm"].includes(session.tipoAcesso)) {
    throw new Error("Apenas financeiro pode aprovar prorrogações")
  }

  const updates: any = {
    observacao_prorrogacao: observacao || null,
  }

  if (aprovado) {
    // Renovar o prazo
    const novaDataLimite = new Date()
    novaDataLimite.setDate(novaDataLimite.getDate() + (diasExtensao || 2))
    updates.data_limite_anexo_nota = novaDataLimite.toISOString()
    updates.status = "aprovado"
    updates.prorrogacao_solicitada = false
    updates.prorrogacao_aprovada = true
  } else {
    // Manter status aguardando_prorrogacao se negado
    updates.status = "prorrogacao_negada"
    updates.prorrogacao_aprovada = false
  }

  const { error } = await supabase.from("pedidos_pagamento").update(updates).eq("id", pedidoId)

  if (error) {
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
  const supabase = await getSupabaseServerClient()

  const session = await getSession()

  if (!session) {
    throw new Error("Usuário não autenticado")
  }

  if (!["Adm", "Gerente", "Financeiro"].includes(session.tipoAcesso)) {
    throw new Error("Acesso negado")
  }

  console.log("[v0] Listando todos os pedidos com filtros:", filtros)

  let equipesPermitidas: string[] = []

  if (session.tipoAcesso === "Gerente") {
    // Buscar equipes gerenciadas por este gerente
    const { data: equipesGerente, error: equipesError } = await supabase
      .from("gerentes_equipes")
      .select("equipe_id")
      .eq("gerente_id", session.colaboradorId)

    if (equipesError) {
      console.error("[v0] Erro ao buscar equipes do gerente:", equipesError)
      throw new Error("Erro ao buscar equipes")
    }

    equipesPermitidas = equipesGerente?.map((eq) => eq.equipe_id) || []

    if (equipesPermitidas.length === 0) {
      console.log("[v0] Gerente não possui equipes vinculadas")
      return []
    }
  }

  let query = supabase.from("pedidos_pagamento").select(
    `
      *,
      colaborador:colaboradores!colaborador_id (
        nome_completo,
        salario,
        tipo_acesso,
        equipe_id
      ),
      criado_por:colaboradores!criado_por_colaborador_id (
        nome_completo,
        tipo_acesso
      ),
      notas_fiscais (
        id,
        numero_nfse,
        chave_acesso,
        valor_servico,
        cpf_cnpj_prestador,
        arquivo_xml_url,
        arquivo_pdf_url,
        created_at
      )
    `,
  )

  // Aplicar filtro de data
  if (filtros?.dataInicio) {
    query = query.gte("created_at", filtros.dataInicio)
  }
  if (filtros?.dataFim) {
    const dataFimAjustada = new Date(filtros.dataFim)
    dataFimAjustada.setDate(dataFimAjustada.getDate() + 1)
    query = query.lt("created_at", dataFimAjustada.toISOString())
  }

  // Aplicar filtro de status
  if (filtros?.status && filtros.status !== "todos") {
    query = query.eq("status", filtros.status)
  }

  query = query.order("created_at", { ascending: false })

  const { data, error } = await query

  if (error) {
    console.error("[v0] Erro ao listar todos os pedidos:", error)
    throw new Error("Erro ao listar todos os pedidos")
  }

  let pedidosFiltrados = data || []

  if (session.tipoAcesso === "Gerente" && equipesPermitidas.length > 0) {
    pedidosFiltrados = pedidosFiltrados.filter(
      (pedido) => pedido.colaborador?.equipe_id && equipesPermitidas.includes(pedido.colaborador.equipe_id),
    )
  }

  // Filtrar por equipe se fornecido
  if (filtros?.equipeId && filtros.equipeId !== "todas") {
    if (filtros.equipeId === "sem-equipe") {
      pedidosFiltrados = pedidosFiltrados.filter((pedido) => !pedido.colaborador?.equipe_id)
    } else {
      pedidosFiltrados = pedidosFiltrados.filter((pedido) => pedido.colaborador?.equipe_id === filtros.equipeId)
    }
  }

  // Filtrar por nome do colaborador se fornecido
  if (filtros?.colaboradorNome) {
    const nomeNormalizado = filtros.colaboradorNome.toLowerCase()
    pedidosFiltrados = pedidosFiltrados.filter((pedido) =>
      pedido.colaborador?.nome_completo?.toLowerCase().includes(nomeNormalizado),
    )
  }

  console.log("[v0] Total de pedidos encontrados:", pedidosFiltrados.length)

  return pedidosFiltrados
}

export async function aprovarNotaFiscal(pedidoId: string) {
  const supabase = await getSupabaseServerClient()

  const session = await getSession()
  if (!session) {
    throw new Error("Usuário não autenticado")
  }

  if (!["Financeiro", "Adm"].includes(session.tipoAcesso)) {
    throw new Error("Apenas financeiro pode aprovar notas fiscais")
  }

  try {
    const { error } = await supabase
      .from("pedidos_pagamento")
      .update({
        status: "nota_recebida",
        data_nota_recebida: new Date().toISOString(),
      })
      .eq("id", pedidoId)

    if (error) {
      console.error("[v0] Erro ao aprovar nota fiscal:", error)
      throw new Error(`Erro ao aprovar nota fiscal: ${error.message}`)
    }
  } catch (err) {
    console.error("[v0] Exceção ao aprovar nota fiscal:", err)
    throw err instanceof Error ? err : new Error("Erro ao aprovar nota fiscal")
  }

  revalidatePath("/financeiro")
  revalidatePath("/meus-pagamentos")

  return { success: true }
}

export async function recusarNotaFiscal(pedidoId: string, motivo: string) {
  const supabase = await getSupabaseServerClient()

  const session = await getSession()
  if (!session) {
    throw new Error("Usuário não autenticado")
  }

  if (!["Financeiro", "Adm"].includes(session.tipoAcesso)) {
    throw new Error("Apenas financeiro pode recusar notas fiscais")
  }

  try {
    const { error } = await supabase
      .from("pedidos_pagamento")
      .update({
        status: "aprovado",
        nota_emitida: false,
        nota_fiscal_url: null,
        observacao_financeiro: motivo,
      })
      .eq("id", pedidoId)

    if (error) {
      console.error("[v0] Erro ao recusar nota fiscal:", error)
      throw new Error(`Erro ao recusar nota fiscal: ${error.message}`)
    }
  } catch (err) {
    console.error("[v0] Exceção ao recusar nota fiscal:", err)
    throw err instanceof Error ? err : new Error("Erro ao recusar nota fiscal")
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
  const supabase = await getSupabaseServerClient()
  const session = await getSession()

  if (!session) throw new Error("Usuário não autenticado")
  if (!["Financeiro", "Adm"].includes(session.tipoAcesso)) throw new Error("Sem permissão")

  let query = supabase
    .from("pedidos_pagamento")
    .select(`
      *,
      colaborador:colaboradores!colaborador_id (
        nome_completo, salario, tipo_acesso, equipe_id, cnpj, email
      ),
      notas_fiscais ( id )
    `)
    .in("status", ["pendente_financeiro", "aprovado"])
    .is("nota_fiscal_url", null)
    .order("created_at", { ascending: false })

  if (filtros?.dataInicio) query = query.gte("created_at", filtros.dataInicio)
  if (filtros?.dataFim) {
    const d = new Date(filtros.dataFim)
    d.setDate(d.getDate() + 1)
    query = query.lt("created_at", d.toISOString())
  }

  const { data, error } = await query
  if (error) { console.error("[v0] Erro ao listar pedidos sem nota:", error); throw new Error("Erro ao listar") }

  let result = (data || []).filter((p: any) => {
    const hasNota = p.notas_fiscais && ((Array.isArray(p.notas_fiscais) && p.notas_fiscais.length > 0) || (!Array.isArray(p.notas_fiscais) && p.notas_fiscais))
    const isReembolsoKm = p.tipo_pedido === "reembolso_km"
    return !hasNota && !isReembolsoKm
  })

  if (filtros?.equipeId && filtros.equipeId !== "todas") {
    result = result.filter((p: any) => p.colaborador?.equipe_id === filtros.equipeId)
  }
  if (filtros?.colaboradorNome) {
    const nome = filtros.colaboradorNome.toLowerCase()
    result = result.filter((p: any) => p.colaborador?.nome_completo?.toLowerCase().includes(nome))
  }

  return result
}

export async function listarPedidosComNota(filtros?: {
  dataInicio?: string
  dataFim?: string
  colaboradorNome?: string
  equipeId?: string
}) {
  const supabase = await getSupabaseServerClient()
  const session = await getSession()

  if (!session) throw new Error("Usuário não autenticado")
  if (!["Financeiro", "Adm"].includes(session.tipoAcesso)) throw new Error("Sem permissão")

  let query = supabase
    .from("pedidos_pagamento")
    .select(`
      *,
      colaborador:colaboradores!colaborador_id (
        nome_completo, salario, tipo_acesso, equipe_id
      ),
      criado_por:colaboradores!criado_por_colaborador_id (
        nome_completo, tipo_acesso
      ),
      notas_fiscais (
        id, numero_nfse, chave_acesso, valor_servico, cpf_cnpj_prestador,
arquivo_xml_url, arquivo_pdf_url, created_at
  )
  `)
  .in("status", ["pendente_financeiro", "aprovado", "nota_recebida"])
  .order("created_at", { ascending: false })

  if (filtros?.dataInicio) query = query.gte("created_at", filtros.dataInicio)
  if (filtros?.dataFim) {
    const d = new Date(filtros.dataFim)
    d.setDate(d.getDate() + 1)
    query = query.lt("created_at", d.toISOString())
  }

  const { data, error } = await query
  if (error) { console.error("[v0] Erro ao listar pedidos com nota:", error); throw new Error("Erro ao listar") }

  let result = (data || []).filter((p: any) => {
    const hasNota = p.nota_fiscal_url || (p.notas_fiscais && ((Array.isArray(p.notas_fiscais) && p.notas_fiscais.length > 0) || (!Array.isArray(p.notas_fiscais) && p.notas_fiscais)))
    const isReembolsoKm = p.tipo_pedido === "reembolso_km"
    return hasNota || isReembolsoKm
  })

  if (filtros?.equipeId && filtros.equipeId !== "todas") {
    result = result.filter((p: any) => p.colaborador?.equipe_id === filtros.equipeId)
  }
  if (filtros?.colaboradorNome) {
    const nome = filtros.colaboradorNome.toLowerCase()
    result = result.filter((p: any) => p.colaborador?.nome_completo?.toLowerCase().includes(nome))
  }

  return result
}

export async function listarNotasEnviadas(filtros?: {
  dataInicio?: string
  dataFim?: string
  colaboradorNome?: string
  equipeId?: string
}) {
  const supabase = await getSupabaseServerClient()

  const session = await getSession()

  if (!session) {
    throw new Error("Usuário não autenticado")
  }

  if (!["Financeiro", "Adm"].includes(session.tipoAcesso)) {
    throw new Error("Apenas financeiro pode acessar esta página")
  }

  console.log("[v0] Listando notas enviadas com filtros:", filtros)

  let query = supabase
    .from("pedidos_pagamento")
    .select(
      `
      *,
      colaborador:colaboradores!colaborador_id (
        nome_completo,
        salario,
        tipo_acesso,
        equipe_id
      ),
      criado_por:colaboradores!criado_por_colaborador_id (
        nome_completo,
        tipo_acesso
      ),
      notas_fiscais (
        id,
        numero_nfse,
        chave_acesso,
        valor_servico,
        cpf_cnpj_prestador,
        arquivo_xml_url,
        arquivo_pdf_url,
        created_at
      )
    `,
    )
    .in("status", ["pendente_financeiro", "aprovado", "pago", "nota_recebida"])

  // Aplicar filtro de data
  if (filtros?.dataInicio) {
    query = query.gte("created_at", filtros.dataInicio)
  }
  if (filtros?.dataFim) {
    const dataFimAjustada = new Date(filtros.dataFim)
    dataFimAjustada.setDate(dataFimAjustada.getDate() + 1)
    query = query.lt("created_at", dataFimAjustada.toISOString())
  }

  query = query.order("created_at", { ascending: false })

  const { data, error } = await query

  if (error) {
    console.error("[v0] Erro ao listar notas enviadas:", error)
    throw new Error("Erro ao listar notas enviadas")
  }

  let pedidosFiltrados = data || []

  // Filtrar por equipe se fornecido
  if (filtros?.equipeId && filtros.equipeId !== "todas") {
    pedidosFiltrados = pedidosFiltrados.filter((pedido) => pedido.colaborador?.equipe_id === filtros.equipeId)
  }

  // Filtrar por nome do colaborador se fornecido
  if (filtros?.colaboradorNome) {
    const nomeMinusculo = filtros.colaboradorNome.toLowerCase()
    pedidosFiltrados = pedidosFiltrados.filter((pedido) =>
      pedido.colaborador?.nome_completo.toLowerCase().includes(nomeMinusculo),
    )
  }

  console.log("[v0] Notas enviadas encontradas:", pedidosFiltrados.length)

  return pedidosFiltrados
}

export async function listarPedidosPagos(filtros?: {
  dataInicio?: string
  dataFim?: string
  colaboradorNome?: string
  equipeId?: string
}) {
  const supabase = await getSupabaseServerClient()
  const session = await getSession()

  if (!session) throw new Error("Usuário não autenticado")
  if (!["Financeiro", "Adm"].includes(session.tipoAcesso)) throw new Error("Sem permissão")

  let query = supabase
    .from("pedidos_pagamento")
    .select(`
      *,
      colaborador:colaboradores!colaborador_id (
        nome_completo, salario, tipo_acesso, equipe_id
      ),
      criado_por:colaboradores!criado_por_colaborador_id (
        nome_completo, tipo_acesso
      ),
      notas_fiscais (
        id, numero_nfse, chave_acesso, valor_servico, cpf_cnpj_prestador,
        arquivo_xml_url, arquivo_pdf_url, created_at
      )
    `)
    .eq("status", "pago")
    .order("created_at", { ascending: false })

  if (filtros?.dataInicio) query = query.gte("created_at", filtros.dataInicio)
  if (filtros?.dataFim) {
    const d = new Date(filtros.dataFim)
    d.setDate(d.getDate() + 1)
    query = query.lt("created_at", d.toISOString())
  }

  const { data, error } = await query
  if (error) { console.error("[v0] Erro ao listar pedidos pagos:", error); throw new Error("Erro ao listar") }

  let result = data || []

  if (filtros?.equipeId && filtros.equipeId !== "todas") {
    result = result.filter((p: any) => p.colaborador?.equipe_id === filtros.equipeId)
  }
  if (filtros?.colaboradorNome) {
    const nome = filtros.colaboradorNome.toLowerCase()
    result = result.filter((p: any) => p.colaborador?.nome_completo?.toLowerCase().includes(nome))
  }

  console.log("[v0] Pedidos pagos encontrados:", result.length)

  return result
}
