"use server"

import { createClient, createAdminClient } from "@/lib/supabase-server"
import { revalidatePath } from "next/cache"
import type { Fatura, StatusFatura, FaturaFormData } from "@/types/fatura"

export async function getFaturas(colaboradorId?: string, isAdmin?: boolean) {
  const supabase = await createClient()

  if (isAdmin) {
    // Admin vê todas as faturas
    const { data, error } = await supabase
      .from("faturas")
      .select(`
        *,
        colaboradores_permitidos:faturas_colaboradores(
          colaborador_id,
          colaborador:colaboradores(id, nome_completo, email)
        )
      `)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Erro ao buscar faturas:", error)
      return []
    }

    // Mapear para o formato esperado
    return (data || []).map(f => ({
      ...f,
      colaboradores_permitidos: f.colaboradores_permitidos?.map((cp: { colaborador_id: string; colaborador: { id: string; nome_completo: string; email: string } }) => ({
        colaborador_id: cp.colaborador_id,
        colaborador: cp.colaborador ? {
          id: cp.colaborador.id,
          nome: cp.colaborador.nome_completo,
          email: cp.colaborador.email
        } : undefined
      }))
    })) as Fatura[]
  } else if (colaboradorId) {
    // Colaborador vê apenas faturas onde está permitido
    const { data: faturaIds, error: permError } = await supabase
      .from("faturas_colaboradores")
      .select("fatura_id")
      .eq("colaborador_id", colaboradorId)

    if (permError) {
      console.error("Erro ao buscar permissões:", permError)
      return []
    }

    if (!faturaIds || faturaIds.length === 0) {
      return []
    }

    const ids = faturaIds.map(f => f.fatura_id)

    const { data, error } = await supabase
      .from("faturas")
      .select("*")
      .in("id", ids)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Erro ao buscar faturas colaborador:", error)
      return []
    }

    return (data || []) as Fatura[]
  }

  return []
}

export async function getFaturaById(id: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("faturas")
    .select(`
      *,
      colaboradores_permitidos:faturas_colaboradores(
        colaborador_id,
        colaborador:colaboradores(id, nome_completo, email)
      )
    `)
    .eq("id", id)
    .single()

  if (error) {
    console.error("[v0] Erro ao buscar fatura:", error)
    return null
  }

  // Mapear para o formato esperado
  return {
    ...data,
    colaboradores_permitidos: data.colaboradores_permitidos?.map((cp: { colaborador_id: string; colaborador: { id: string; nome_completo: string; email: string } }) => ({
      colaborador_id: cp.colaborador_id,
      colaborador: cp.colaborador ? {
        id: cp.colaborador.id,
        nome: cp.colaborador.nome_completo,
        email: cp.colaborador.email
      } : undefined
    }))
  } as Fatura
}

export async function createFatura(formData: FaturaFormData, pdfUrl: string, criadorId: string) {
  const supabase = await createAdminClient()

  console.log("[v0] createFatura chamada com:", { 
    formData, 
    pdfUrl, 
    criadorId,
    colaboradoresCount: formData.colaboradores_ids.length 
  })

  // Verificar se criadorId é um UUID válido
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  const criadorIdFinal = uuidRegex.test(criadorId) ? criadorId : null

  console.log("[v0] criadorIdFinal:", criadorIdFinal)

  // Criar a fatura
  const { data: fatura, error: faturaError } = await supabase
    .from("faturas")
    .insert({
      titulo: formData.titulo,
      descricao: formData.descricao,
      valor: formData.valor,
      data_vencimento: formData.data_vencimento,
      arquivo_pdf_url: pdfUrl,
      criado_por: criadorIdFinal,
      status: "pendente"
    })
    .select()
    .single()

  console.log("[v0] Resultado insert fatura:", { 
    fatura: fatura ? { 
      id: fatura.id, 
      titulo: fatura.titulo, 
      valor: fatura.valor,
      status: fatura.status 
    } : null, 
    faturaError 
  })

  if (faturaError) {
    console.error("[v0] Erro ao criar fatura:", {
      message: faturaError.message,
      details: faturaError.details,
      hint: faturaError.hint
    })
    return { success: false, error: faturaError.message }
  }

  if (!fatura) {
    console.error("[v0] Nenhuma fatura retornada após insert")
    return { success: false, error: "Nenhuma fatura retornada" }
  }

  console.log("[v0] Fatura criada com ID:", fatura.id)

  // Adicionar colaboradores permitidos
  if (formData.colaboradores_ids.length > 0) {
    const colaboradoresData = formData.colaboradores_ids.map(colabId => ({
      fatura_id: fatura.id,
      colaborador_id: colabId
    }))

    console.log("[v0] Adicionando colaboradores:", colaboradoresData)

    const { error: permError } = await supabase
      .from("faturas_colaboradores")
      .insert(colaboradoresData)

    if (permError) {
      console.error("[v0] Erro ao adicionar colaboradores:", {
        message: permError.message,
        details: permError.details
      })
    } else {
      console.log("[v0] Colaboradores adicionados com sucesso")
    }
  }

  console.log("[v0] Revalidando paths...")
  revalidatePath("/faturas")
  
  console.log("[v0] Retornando fatura criada:", { id: fatura.id, titulo: fatura.titulo })
  return { success: true, fatura }
}

export async function updateFaturaStatus(id: string, status: StatusFatura) {
  const supabase = await createClient()

  const { error } = await supabase
    .from("faturas")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)

  if (error) {
    console.error("Erro ao atualizar status:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/faturas")
  return { success: true }
}

export async function updateFatura(id: string, formData: Partial<FaturaFormData>) {
  const supabase = await createClient()

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString()
  }

  if (formData.titulo) updateData.titulo = formData.titulo
  if (formData.descricao !== undefined) updateData.descricao = formData.descricao
  if (formData.valor) updateData.valor = formData.valor
  if (formData.data_vencimento) updateData.data_vencimento = formData.data_vencimento

  const { error } = await supabase
    .from("faturas")
    .update(updateData)
    .eq("id", id)

  if (error) {
    console.error("Erro ao atualizar fatura:", error)
    return { success: false, error: error.message }
  }

  // Atualizar colaboradores se fornecidos
  if (formData.colaboradores_ids) {
    // Remover todos os colaboradores atuais
    await supabase
      .from("faturas_colaboradores")
      .delete()
      .eq("fatura_id", id)

    // Adicionar novos colaboradores
    if (formData.colaboradores_ids.length > 0) {
      const colaboradoresData = formData.colaboradores_ids.map(colabId => ({
        fatura_id: id,
        colaborador_id: colabId
      }))

      await supabase
        .from("faturas_colaboradores")
        .insert(colaboradoresData)
    }
  }

  revalidatePath("/faturas")
  return { success: true }
}

export async function deleteFatura(id: string) {
  const supabase = await createClient()

  // Primeiro deletar as permissões
  await supabase
    .from("faturas_colaboradores")
    .delete()
    .eq("fatura_id", id)

  // Depois deletar a fatura
  const { error } = await supabase
    .from("faturas")
    .delete()
    .eq("id", id)

  if (error) {
    console.error("Erro ao deletar fatura:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/faturas")
  return { success: true }
}

export async function updateFaturaPdf(id: string, pdfUrl: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from("faturas")
    .update({ arquivo_pdf_url: pdfUrl, updated_at: new Date().toISOString() })
    .eq("id", id)

  if (error) {
    console.error("Erro ao atualizar PDF:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/faturas")
  return { success: true }
}
