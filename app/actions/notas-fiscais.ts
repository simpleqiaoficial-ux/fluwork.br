"use server"

import { and, desc, eq, ne, or } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { colaboradores, notasFiscais, pedidosPagamento } from "@/lib/db/schema"
import { toNotaFiscalDTO } from "@/lib/db/mappers"
import { getSession } from "@/lib/session"
import { registrarAuditoria } from "@/lib/audit"
import type { DadosNotaFiscal, ResultadoValidacao } from "@/types/nota-fiscal"
import { limparCpfCnpj } from "@/lib/nfse-parser"

// Função para validar nota fiscal
export async function validarNotaFiscal(
  pedidoId: string,
  colaboradorId: string,
  dados: DadosNotaFiscal,
): Promise<ResultadoValidacao> {
  const mensagens: string[] = []

  console.log("[v0] ===== INICIANDO VALIDAÇÃO =====")
  console.log("[v0] Pedido ID recebido:", pedidoId)
  console.log("[v0] Colaborador ID recebido:", colaboradorId)
  console.log("[v0] Dados da nota:", JSON.stringify(dados, null, 2))

  // 1. VALIDAÇÃO DE IDENTIDADE
  const [colaborador] = await db
    .select({ nomeCompleto: colaboradores.nomeCompleto, cnpj: colaboradores.cnpj })
    .from(colaboradores)
    .where(eq(colaboradores.id, colaboradorId))

  const cnpjColaboradorLimpo = limparCpfCnpj(colaborador?.cnpj || "")
  const cnpjNotaLimpo = limparCpfCnpj(dados.cpf_cnpj_prestador)
  const validacao_identidade = cnpjColaboradorLimpo === cnpjNotaLimpo

  console.log("[v0] CNPJ Colaborador (limpo):", cnpjColaboradorLimpo)
  console.log("[v0] CNPJ Nota (limpo):", cnpjNotaLimpo)
  console.log("[v0] Validação identidade:", validacao_identidade)

  if (!validacao_identidade) {
    mensagens.push(
      `CPF/CNPJ da nota (${dados.cpf_cnpj_prestador}) não corresponde ao CPF/CNPJ do colaborador (${colaborador?.cnpj || "não encontrado"})`,
    )
  }

  // 2. VALIDAÇÃO DE COMPETÊNCIA
  const [pedido] = await db
    .select({ createdAt: pedidosPagamento.createdAt, dataPrevisaoPagamento: pedidosPagamento.dataPrevisaoPagamento })
    .from(pedidosPagamento)
    .where(eq(pedidosPagamento.id, pedidoId))

  const dataPedido = new Date(pedido?.createdAt || "")
  const mesPedido = dataPedido.getMonth() + 1
  const anoPedido = dataPedido.getFullYear()

  const validacao_competencia = dados.competencia_mes === mesPedido && dados.competencia_ano === anoPedido

  if (!validacao_competencia) {
    mensagens.push(
      `Competência da nota (${dados.competencia_mes.toString().padStart(2, "0")}/${dados.competencia_ano}) não corresponde ao mês/ano do pedido (${mesPedido.toString().padStart(2, "0")}/${anoPedido})`,
    )
  }

  // 3. VALIDAÇÃO DE VALOR (FLEXÍVEL - PERMITE SEM KM E SEM DESCONTO)
  const [pedidoCompleto] = await db.select().from(pedidosPagamento).where(eq(pedidosPagamento.id, pedidoId))

  if (!pedidoCompleto) {
    mensagens.push("Pedido não encontrado no sistema")
    return {
      valido: false,
      validacao_identidade,
      validacao_competencia,
      validacao_valor: false,
      validacao_duplicidade: false,
      mensagens,
    }
  }

  // Calcula o valor total do pedido
  const valorTotalPedido = Number(pedidoCompleto.valorTotal || 0)

  // Calcula o valor sem KM e sem desconto (salário + HE + condução + plantão)
  const salarioBase = pedidoCompleto.tipoPedido === "completo" ? Number(pedidoCompleto.salarioBase || 0) : 0
  const horasExtras = Number(pedidoCompleto.horasExtras || 0)
  const conducao = Number(pedidoCompleto.conducao || 0)
  const plantao = Number(pedidoCompleto.valorPlantao || 0)
  const valorSemKmDesconto = salarioBase + horasExtras + conducao + plantao

  console.log("[v0] Valor total do pedido:", valorTotalPedido)
  console.log("[v0] Valor sem KM e desconto:", valorSemKmDesconto)
  console.log("[v0] Valor da nota:", dados.valor_servico)

  // Aceita se o valor da nota bate com o valor total OU com o valor sem KM/desconto
  const bateComValorTotal = Math.abs(dados.valor_servico - valorTotalPedido) < 0.01
  const bateComValorSemKmDesconto = Math.abs(dados.valor_servico - valorSemKmDesconto) < 0.01
  const validacao_valor = bateComValorTotal || bateComValorSemKmDesconto

  console.log("[v0] Bate com valor total?", bateComValorTotal)
  console.log("[v0] Bate com valor sem KM/desconto?", bateComValorSemKmDesconto)
  console.log("[v0] Validação valor:", validacao_valor)

  if (!validacao_valor) {
    mensagens.push(
      `Valor da nota (R$ ${dados.valor_servico.toFixed(2)}) não corresponde ao valor do pedido. Valores aceitos: R$ ${valorTotalPedido.toFixed(2)} (com KM e desconto) ou R$ ${valorSemKmDesconto.toFixed(2)} (sem KM e desconto).`,
    )
  }

  // 4. VALIDAÇÃO DE DUPLICIDADE
  const notasDuplicadas = await db
    .select({ id: notasFiscais.id, numeroNfse: notasFiscais.numeroNfse, pedidoId: notasFiscais.pedidoId })
    .from(notasFiscais)
    .where(
      and(
        or(eq(notasFiscais.numeroNfse, dados.numero_nfse), eq(notasFiscais.chaveAcesso, dados.chave_acesso || "")),
        ne(notasFiscais.pedidoId, pedidoId),
      ),
    )
    .limit(1)

  const notaExistente = notasDuplicadas && notasDuplicadas.length > 0 ? notasDuplicadas[0] : null
  const validacao_duplicidade = !notaExistente

  if (!validacao_duplicidade) {
    mensagens.push(`Nota fiscal ${dados.numero_nfse} já foi anexada anteriormente em outro pedido`)
  }

  const valido = validacao_identidade && validacao_competencia && validacao_valor && validacao_duplicidade

  console.log("[v0] ===== RESULTADO DA VALIDAÇÃO =====")
  console.log("[v0] Válido:", valido)
  console.log("[v0] Mensagens:", mensagens)

  return {
    valido,
    validacao_identidade,
    validacao_competencia,
    validacao_valor,
    validacao_duplicidade,
    mensagens,
  }
}

// Função para anexar nota fiscal
export async function anexarNotaFiscal(
  pedidoId: string,
  colaboradorId: string,
  dados: DadosNotaFiscal,
  arquivoXmlUrl: string,
  arquivoPdfUrl?: string,
) {
  console.log("[v0] ===== ANEXANDO NOTA FISCAL =====")
  console.log("[v0] Pedido ID:", pedidoId)
  console.log("[v0] Colaborador ID:", colaboradorId)
  console.log("[v0] Arquivo XML URL:", arquivoXmlUrl)
  console.log("[v0] Arquivo PDF URL:", arquivoPdfUrl)

  // Validar nota
  const validacao = await validarNotaFiscal(pedidoId, colaboradorId, dados)

  if (!validacao.valido) {
    console.log("[v0] Validação falhou, abortando anexação")
    return {
      success: false,
      error: "Validação falhou",
      mensagens: validacao.mensagens,
    }
  }

  console.log("[v0] Validação passou, inserindo nota fiscal na tabela...")

  const [colaboradorDaNota] = await db
    .select({ empresaId: colaboradores.empresaId })
    .from(colaboradores)
    .where(eq(colaboradores.id, colaboradorId))

  if (!colaboradorDaNota?.empresaId) {
    return { success: false, error: "Prestador sem empresa vinculada" }
  }

  let data
  try {
    ;[data] = await db
      .insert(notasFiscais)
      .values({
        empresaId: colaboradorDaNota.empresaId,
        pedidoId: pedidoId,
        colaboradorId: colaboradorId,
        numeroNfse: dados.numero_nfse,
        chaveAcesso: dados.chave_acesso,
        competenciaMes: dados.competencia_mes,
        competenciaAno: dados.competencia_ano,
        valorServico: String(dados.valor_servico),
        cpfCnpjPrestador: dados.cpf_cnpj_prestador,
        arquivoXmlUrl: arquivoXmlUrl,
        arquivoPdfUrl: arquivoPdfUrl || null,
        validacaoIdentidade: validacao.validacao_identidade,
        validacaoCompetencia: validacao.validacao_competencia,
        validacaoValor: validacao.validacao_valor,
        validacaoDuplicidade: validacao.validacao_duplicidade,
        status: "aprovado",
      })
      .returning()
  } catch (error) {
    console.error("[v0] ❌ ERRO ao inserir nota fiscal:", error)
    console.error("[v0] Detalhes do erro:", JSON.stringify(error, null, 2))
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }

  console.log("[v0] ✅ Nota fiscal inserida com sucesso!")
  console.log("[v0] Dados da nota inserida:", JSON.stringify(data, null, 2))

  console.log("[v0] Atualizando pedido para marcar nota como anexada...")

  // Atualizar pedido para indicar que tem nota anexada
  try {
    await db
      .update(pedidosPagamento)
      .set({
        notaFiscalAnexada: true,
        notaEmitida: true,
        dataEmissaoNota: new Date(),
        notaFiscalUrl: arquivoXmlUrl,
      })
      .where(eq(pedidosPagamento.id, pedidoId))

    console.log("[v0] ✅ Pedido atualizado com sucesso!")
  } catch (updateError) {
    console.error("[v0] ❌ ERRO ao atualizar pedido:", updateError)
  }

  return { success: true, data: toNotaFiscalDTO(data) }
}

// Função para listar notas fiscais (para o financeiro)
export async function listarNotasFiscais() {
  const session = await getSession()
  if (!session) return []

  try {
    const rows = await db
      .select({
        nota: notasFiscais,
        colaborador: colaboradores,
        pedido: pedidosPagamento,
      })
      .from(notasFiscais)
      .leftJoin(colaboradores, eq(notasFiscais.colaboradorId, colaboradores.id))
      .leftJoin(pedidosPagamento, eq(notasFiscais.pedidoId, pedidosPagamento.id))
      .where(session.tipoAcesso === "SuperAdmin" ? undefined : eq(notasFiscais.empresaId, session.empresaId!))
      .orderBy(desc(notasFiscais.createdAt))

    return rows.map((row) => ({
      ...toNotaFiscalDTO(row.nota),
      colaboradores: row.colaborador
        ? { nome_completo: row.colaborador.nomeCompleto, cnpj: row.colaborador.cnpj }
        : null,
      pedidos_pagamento: row.pedido
        ? {
            valor_total: row.pedido.valorTotal == null ? row.pedido.valorTotal : Number(row.pedido.valorTotal),
            created_at: row.pedido.createdAt,
            status: row.pedido.status,
          }
        : null,
    }))
  } catch (error) {
    console.error("Erro ao listar notas fiscais:", error)
    return []
  }
}

// Função para aprovar/rejeitar nota manualmente (financeiro)
export async function aprovarRejeitarNota(notaId: string, status: "aprovado" | "rejeitado", observacao?: string) {
  const session = await getSession()
  if (!session || !["Adm", "Financeiro", "SuperAdmin"].includes(session.tipoAcesso)) {
    return { success: false, error: "Sem permissão" }
  }

  // `session.empresaId` é null pro SuperAdmin — `eq(coluna, null)` nunca bate em SQL.
  const escopo =
    session.tipoAcesso === "SuperAdmin" ? eq(notasFiscais.id, notaId) : and(eq(notasFiscais.id, notaId), eq(notasFiscais.empresaId, session.empresaId!))

  try {
    await db
      .update(notasFiscais)
      .set({
        status,
        aprovadoPor: session.colaboradorId,
        dataAprovacao: new Date(),
        ...(observacao !== undefined && { observacaoFinanceiro: observacao }),
      })
      .where(escopo)
  } catch (error) {
    console.error("Erro ao atualizar nota fiscal:", error)
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }

  if (session.tipoAcesso === "SuperAdmin") {
    const [nota] = await db.select({ empresaId: notasFiscais.empresaId }).from(notasFiscais).where(eq(notasFiscais.id, notaId))
    await registrarAuditoria({
      colaboradorId: session.colaboradorId,
      empresaId: nota?.empresaId ?? null,
      acao: "nota_fiscal_status_alterado",
      tabela: "notas_fiscais",
      registroId: notaId,
      detalhes: { novo_status: status },
    })
    revalidatePath("/admin/dados/notas-fiscais")
  }

  return { success: true }
}

// Exclusão de nota fiscal só existe pelo painel SuperAdmin (não há fluxo de exclusão
// pro Adm da própria empresa hoje) — usada pra limpeza de dados de teste/erro.
export async function excluirNotaFiscalAdmin(notaId: string) {
  const session = await getSession()
  if (!session || session.tipoAcesso !== "SuperAdmin") {
    return { success: false, error: "Sem permissão" }
  }

  const [nota] = await db.select({ empresaId: notasFiscais.empresaId, pedidoId: notasFiscais.pedidoId }).from(notasFiscais).where(eq(notasFiscais.id, notaId))
  if (!nota) return { success: false, error: "Nota fiscal não encontrada" }

  try {
    await db.delete(notasFiscais).where(eq(notasFiscais.id, notaId))
  } catch (error) {
    console.error("Erro ao excluir nota fiscal:", error)
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }

  await registrarAuditoria({
    colaboradorId: session.colaboradorId,
    empresaId: nota.empresaId,
    acao: "nota_fiscal_excluida",
    tabela: "notas_fiscais",
    registroId: notaId,
  })

  revalidatePath("/admin/dados/notas-fiscais")
  return { success: true }
}
