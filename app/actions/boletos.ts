"use server"

import { getSupabaseServerClient } from "@/lib/supabase-server"
import { revalidatePath } from "next/cache"
import type { Boleto, CreateBoletoInput, UpdateBoletoInput } from "@/types/boleto"

export async function listarBoletos() {
  const supabase = await getSupabaseServerClient()

  const { data, error } = await supabase
    .from("boletos")
    .select(`
      *,
      centro_custo:centros_custo(id, nome)
    `)
    .eq("ativo", true)
    .order("banco", { ascending: true })

  if (error) {
    console.error("[v0] Erro ao listar boletos:", error)
    return []
  }

  return (data || []) as Boleto[]
}

export async function listarTodosBoletos() {
  const supabase = await getSupabaseServerClient()

  const { data, error } = await supabase
    .from("boletos")
    .select(`
      *,
      centro_custo:centros_custo(id, nome)
    `)
    .order("banco", { ascending: true })

  if (error) {
    console.error("[v0] Erro ao listar todos os boletos:", error)
    return []
  }

  return (data || []) as Boleto[]
}

export async function criarBoleto(input: CreateBoletoInput) {
  const supabase = await getSupabaseServerClient()

  // Validar dados
  if (!input.numero_boleto?.trim()) {
    return { success: false, error: "Número do boleto é obrigatório" }
  }

  if (!input.banco?.trim()) {
    return { success: false, error: "Banco é obrigatório" }
  }

  if (!input.agencia?.trim()) {
    return { success: false, error: "Agência é obrigatória" }
  }

  if (!input.conta?.trim()) {
    return { success: false, error: "Conta é obrigatória" }
  }

  // Verificar se o boleto já existe
  const { data: existente } = await supabase
    .from("boletos")
    .select("id")
    .eq("numero_boleto", input.numero_boleto)
    .single()

  if (existente) {
    return { success: false, error: "Este número de boleto já existe" }
  }

  const { data: boleto, error } = await supabase
    .from("boletos")
    .insert({
      numero_boleto: input.numero_boleto.trim(),
      banco: input.banco.trim(),
      agencia: input.agencia.trim(),
      conta: input.conta.trim(),
      tipo: input.tipo,
      centro_custo_id: input.centro_custo_id || null,
      ativo: true
    })
    .select(
      `
        *,
        centro_custo:centros_custo(id, nome)
      `
    )
    .single()

  if (error) {
    console.error("[v0] Erro ao criar boleto:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/cadastros")
  return { success: true, boleto }
}

export async function atualizarBoleto(id: string, input: UpdateBoletoInput) {
  const supabase = await getSupabaseServerClient()

  const { data: boleto, error } = await supabase
    .from("boletos")
    .update({
      ...(input.numero_boleto && { numero_boleto: input.numero_boleto.trim() }),
      ...(input.banco && { banco: input.banco.trim() }),
      ...(input.agencia && { agencia: input.agencia.trim() }),
      ...(input.conta && { conta: input.conta.trim() }),
      ...(input.tipo && { tipo: input.tipo }),
      ...(input.centro_custo_id !== undefined && { centro_custo_id: input.centro_custo_id }),
      ...(input.ativo !== undefined && { ativo: input.ativo })
    })
    .eq("id", id)
    .select(
      `
        *,
        centro_custo:centros_custo(id, nome)
      `
    )
    .single()

  if (error) {
    console.error("[v0] Erro ao atualizar boleto:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/cadastros")
  return { success: true, boleto }
}

export async function deletarBoleto(id: string) {
  const supabase = await getSupabaseServerClient()

  const { error } = await supabase
    .from("boletos")
    .delete()
    .eq("id", id)

  if (error) {
    console.error("[v0] Erro ao deletar boleto:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/cadastros")
  return { success: true }
}
