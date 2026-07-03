"use server"

import { createAdminClient } from "@/lib/supabase-server"
import type { DadosNotaFiscal, ResultadoValidacao } from "@/types/nota-fiscal"
import { limparCpfCnpj } from "@/lib/nfse-parser"

// Função para validar nota fiscal
export async function validarNotaFiscal(
  pedidoId: string,
  colaboradorId: string,
  dados: DadosNotaFiscal,
): Promise<ResultadoValidacao> {
  const supabase = await createAdminClient()
  const mensagens: string[] = []

  console.log("[v0] ===== INICIANDO VALIDAÇÃO =====")
  console.log("[v0] Pedido ID recebido:", pedidoId)
  console.log("[v0] Colaborador ID recebido:", colaboradorId)
  console.log("[v0] Dados da nota:", JSON.stringify(dados, null, 2))

  // 1. VALIDAÇÃO DE IDENTIDADE
  const { data: colaborador } = await supabase
    .from("colaboradores")
    .select("nome_completo, cnpj")
    .eq("id", colaboradorId)
    .single()

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
  const { data: pedido } = await supabase
    .from("pedidos_pagamento")
    .select("created_at, data_previsao_pagamento")
    .eq("id", pedidoId)
    .single()

  const dataPedido = new Date(pedido?.created_at || "")
  const mesPedido = dataPedido.getMonth() + 1
  const anoPedido = dataPedido.getFullYear()

  const validacao_competencia = dados.competencia_mes === mesPedido && dados.competencia_ano === anoPedido

  if (!validacao_competencia) {
    mensagens.push(
      `Competência da nota (${dados.competencia_mes.toString().padStart(2, "0")}/${dados.competencia_ano}) não corresponde ao mês/ano do pedido (${mesPedido.toString().padStart(2, "0")}/${anoPedido})`,
    )
  }

  // 3. VALIDAÇÃO DE VALOR (FLEXÍVEL - PERMITE SEM KM E SEM DESCONTO)
  const { data: pedidoCompleto, error: pedidoError } = await supabase
    .from("pedidos_pagamento")
    .select("*")
    .eq("id", pedidoId)
    .single()

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
  const valorTotalPedido = pedidoCompleto.valor_total || 0

  // Calcula o valor sem KM e sem desconto (salário + HE + condução + plantão)
  const salarioBase = pedidoCompleto.tipo_pedido === "completo" ? pedidoCompleto.salario_base || 0 : 0
  const horasExtras = pedidoCompleto.horas_extras || 0
  const conducao = pedidoCompleto.conducao || 0
  const plantao = pedidoCompleto.valor_plantao || 0
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
  const { data: notasDuplicadas } = await supabase
    .from("notas_fiscais")
    .select("id, numero_nfse, pedido_id")
    .or(`numero_nfse.eq.${dados.numero_nfse},chave_acesso.eq.${dados.chave_acesso || ""}`)
    .neq("pedido_id", pedidoId)
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
  const supabase = await createAdminClient()

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

  const { data, error } = await supabase
    .from("notas_fiscais")
    .insert({
      pedido_id: pedidoId,
      colaborador_id: colaboradorId,
      numero_nfse: dados.numero_nfse,
      chave_acesso: dados.chave_acesso,
      competencia_mes: dados.competencia_mes,
      competencia_ano: dados.competencia_ano,
      valor_servico: dados.valor_servico,
      cpf_cnpj_prestador: dados.cpf_cnpj_prestador,
      arquivo_xml_url: arquivoXmlUrl,
      arquivo_pdf_url: arquivoPdfUrl || null,
      validacao_identidade: validacao.validacao_identidade,
      validacao_competencia: validacao.validacao_competencia,
      validacao_valor: validacao.validacao_valor,
      validacao_duplicidade: validacao.validacao_duplicidade,
      status: "aprovado",
    })
    .select()
    .single()

  if (error) {
    console.error("[v0] ❌ ERRO ao inserir nota fiscal:", error)
    console.error("[v0] Detalhes do erro:", JSON.stringify(error, null, 2))
    return { success: false, error: error.message }
  }

  console.log("[v0] ✅ Nota fiscal inserida com sucesso!")
  console.log("[v0] Dados da nota inserida:", JSON.stringify(data, null, 2))

  console.log("[v0] Atualizando pedido para marcar nota como anexada...")

  // Atualizar pedido para indicar que tem nota anexada
  const { error: updateError } = await supabase
    .from("pedidos_pagamento")
    .update({
      nota_fiscal_anexada: true,
      nota_emitida: true,
      data_emissao_nota: new Date().toISOString(),
      nota_fiscal_url: arquivoXmlUrl,
    })
    .eq("id", pedidoId)

  if (updateError) {
    console.error("[v0] ❌ ERRO ao atualizar pedido:", updateError)
  } else {
    console.log("[v0] ✅ Pedido atualizado com sucesso!")
  }

  return { success: true, data }
}

// Função para listar notas fiscais (para o financeiro)
export async function listarNotasFiscais() {
  const supabase = await createAdminClient()

  const { data, error } = await supabase
    .from("notas_fiscais")
    .select(
      `
      *,
      colaboradores(nome_completo, cnpj),
      pedidos_pagamento(valor_total, created_at, status)
    `,
    )
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Erro ao listar notas fiscais:", error)
    return []
  }

  return data || []
}

// Função para aprovar/rejeitar nota manualmente (financeiro)
export async function aprovarRejeitarNota(notaId: string, status: "aprovado" | "rejeitado", observacao?: string) {
  const supabase = await createAdminClient()

  const { data: user } = await supabase.auth.getUser()

  const { error } = await supabase
    .from("notas_fiscais")
    .update({
      status,
      aprovado_por: user.user?.id,
      data_aprovacao: new Date().toISOString(),
      observacao_financeiro: observacao,
    })
    .eq("id", notaId)

  if (error) {
    console.error("Erro ao atualizar nota fiscal:", error)
    return { success: false, error: error.message }
  }

  return { success: true }
}
