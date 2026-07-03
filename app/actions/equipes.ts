"use server"

import { createAdminClient } from "@/lib/supabase-server"
import { revalidatePath } from "next/cache"
import type { Equipe, NovaEquipe } from "@/types/equipe"

export async function listarEquipes(): Promise<Equipe[]> {
  const supabase = await createAdminClient()

  const { data, error } = await supabase
    .from("equipes")
    .select(`
      *,
      supervisor:colaboradores!supervisor_id(
        id,
        nome_completo
      )
    `)
    .order("nome", { ascending: true })

  if (error) {
    console.error("[v0] Erro ao listar equipes:", error)
    throw new Error("Erro ao listar equipes")
  }

  // Buscar TODOS os gerentes de todas as equipes em uma única query
  const { data: todasGerentesData } = await supabase.from("gerentes_equipes").select(`
      equipe_id,
      colaboradores!gerentes_equipes_gerente_id_fkey(
        id,
        nome_completo
      )
    `)

  // Organizar gerentes por equipe
  const gerentesPorEquipe = new Map<string, any[]>()
  todasGerentesData?.forEach((item: any) => {
    if (!gerentesPorEquipe.has(item.equipe_id)) {
      gerentesPorEquipe.set(item.equipe_id, [])
    }
    if (item.colaboradores) {
      gerentesPorEquipe.get(item.equipe_id)!.push(item.colaboradores)
    }
  })

  // Montar resposta final
  const equipesComGerentes = (data || []).map((equipe: any) => ({
    ...equipe,
    gerentes: gerentesPorEquipe.get(equipe.id) || [],
  }))

  return equipesComGerentes
}

export async function criarEquipe(equipe: NovaEquipe): Promise<void> {
  const supabase = await createAdminClient()

  const { error } = await supabase.from("equipes").insert({
    nome: equipe.nome,
    supervisor_id: equipe.supervisor_id,
  })

  if (error) {
    console.error("[v0] Erro ao criar equipe:", error)
    throw new Error("Erro ao criar equipe")
  }

  revalidatePath("/cadastros/equipes")
}

export async function atualizarEquipe(id: string, equipe: Partial<NovaEquipe>): Promise<void> {
  const supabase = await createAdminClient()

  const { error } = await supabase.from("equipes").update(equipe).eq("id", id)

  if (error) {
    console.error("[v0] Erro ao atualizar equipe:", error)
    throw new Error("Erro ao atualizar equipe")
  }

  revalidatePath("/cadastros/equipes")
}

export async function deletarEquipe(id: string): Promise<void> {
  const supabase = await createAdminClient()

  const { error } = await supabase.from("equipes").delete().eq("id", id)

  if (error) {
    console.error("[v0] Erro ao deletar equipe:", error)
    throw new Error("Erro ao deletar equipe")
  }

  revalidatePath("/cadastros/equipes")
}

export async function listarSupervisores(): Promise<Array<{ id: string; nome_completo: string }>> {
  const supabase = await createAdminClient()

  const { data, error } = await supabase
    .from("colaboradores")
    .select("id, nome_completo")
    .eq("tipo_acesso", "Supervisor")
    .order("nome_completo", { ascending: true })

  if (error) {
    console.error("[v0] Erro ao listar supervisores:", error)
    throw new Error("Erro ao listar supervisores")
  }

  return data || []
}

export async function listarColaboradoresPorEquipe(equipeId: string) {
  const supabase = await createAdminClient()

  const { data, error } = await supabase
    .from("colaboradores")
    .select("id, nome_completo, tipo_acesso, email")
    .eq("equipe_id", equipeId)
    .order("nome_completo", { ascending: true })

  if (error) {
    console.error("[v0] Erro ao listar colaboradores da equipe:", error)
    throw new Error("Erro ao listar colaboradores da equipe")
  }

  return data || []
}

export async function vincularGerenteEquipe(gerenteId: string, equipeId: string): Promise<void> {
  const supabase = await createAdminClient()

  const { data: existing } = await supabase
    .from("gerentes_equipes")
    .select("*")
    .eq("gerente_id", gerenteId)
    .eq("equipe_id", equipeId)
    .single()

  if (existing) {
    return // Already linked
  }

  const { error } = await supabase.from("gerentes_equipes").insert({
    gerente_id: gerenteId,
    equipe_id: equipeId,
  })

  if (error) {
    console.error("[v0] Erro ao vincular gerente à equipe:", error)
    throw new Error("Erro ao vincular gerente à equipe")
  }

  revalidatePath("/cadastros/equipes")
}

export async function desvincularGerenteEquipe(gerenteId: string, equipeId: string): Promise<void> {
  const supabase = await createAdminClient()

  const { error } = await supabase
    .from("gerentes_equipes")
    .delete()
    .eq("gerente_id", gerenteId)
    .eq("equipe_id", equipeId)

  if (error) {
    console.error("[v0] Erro ao desvincular gerente da equipe:", error)
    throw new Error("Erro ao desvincular gerente da equipe")
  }

  revalidatePath("/cadastros/equipes")
}

export async function listarEquipesPorGerente(gerenteId: string): Promise<Equipe[]> {
  const supabase = await createAdminClient()

  const { data, error } = await supabase
    .from("gerentes_equipes")
    .select(`
      equipe:equipes(
        *,
        supervisor:colaboradores!supervisor_id(
          id,
          nome_completo
        )
      )
    `)
    .eq("gerente_id", gerenteId)

  if (error) {
    console.error("[v0] Erro ao listar equipes do gerente:", error)
    throw new Error("Erro ao listar equipes do gerente")
  }

  return data?.map((item: any) => item.equipe).filter(Boolean) || []
}

export async function listarGerentes(): Promise<Array<{ id: string; nome_completo: string }>> {
  const supabase = await createAdminClient()

  const { data, error } = await supabase
    .from("colaboradores")
    .select("id, nome_completo")
    .eq("tipo_acesso", "Gerente")
    .order("nome_completo", { ascending: true })

  if (error) {
    console.error("[v0] Erro ao listar gerentes:", error)
    throw new Error("Erro ao listar gerentes")
  }

  return data || []
}

export async function listarColaboradoresSemEquipe(): Promise<Array<{ id: string; nome_completo: string; tipo_acesso: string; email: string }>> {
  const supabase = await createAdminClient()

  const { data, error } = await supabase
    .from("colaboradores")
    .select("id, nome_completo, tipo_acesso, email")
    .is("equipe_id", null)
    .order("nome_completo", { ascending: true })

  if (error) {
    console.error("[v0] Erro ao listar colaboradores sem equipe:", error)
    throw new Error("Erro ao listar colaboradores sem equipe")
  }

  return data || []
}

export async function vincularColaboradorEquipe(colaboradorId: string, equipeId: string): Promise<void> {
  const supabase = await createAdminClient()

  const { error } = await supabase
    .from("colaboradores")
    .update({ equipe_id: equipeId })
    .eq("id", colaboradorId)

  if (error) {
    console.error("[v0] Erro ao vincular colaborador:", error)
    throw new Error("Erro ao vincular colaborador a equipe")
  }

  revalidatePath("/cadastros/equipes")
  revalidatePath(`/cadastros/equipes/${equipeId}`)
}

export async function removerColaboradorEquipe(colaboradorId: string): Promise<void> {
  const supabase = await createAdminClient()

  const { error } = await supabase
    .from("colaboradores")
    .update({ equipe_id: null })
    .eq("id", colaboradorId)

  if (error) {
    console.error("[v0] Erro ao remover colaborador da equipe:", error)
    throw new Error("Erro ao remover colaborador da equipe")
  }

  revalidatePath("/cadastros/equipes")
  revalidatePath("/colaboradores")
}

export async function buscarEquipe(equipeId: string): Promise<Equipe | null> {
  const supabase = await createAdminClient()

  const { data, error } = await supabase
    .from("equipes")
    .select(`
      *,
      supervisor:colaboradores!supervisor_id(
        id,
        nome_completo
      )
    `)
    .eq("id", equipeId)
    .single()

  if (error) {
    console.error("[v0] Erro ao buscar equipe:", error)
    return null
  }

  // Buscar gerentes
  const { data: gerentesData } = await supabase
    .from("gerentes_equipes")
    .select(`
      colaboradores!gerentes_equipes_gerente_id_fkey(
        id,
        nome_completo
      )
    `)
    .eq("equipe_id", equipeId)

  const gerentes = gerentesData?.map((item: any) => item.colaboradores).filter(Boolean) || []

  return { ...data, gerentes }
}

export async function sincronizarGerentesEquipe(equipeId: string, gerentesIds: string[]): Promise<void> {
  const supabase = await createAdminClient()

  await supabase.from("gerentes_equipes").delete().eq("equipe_id", equipeId)

  if (gerentesIds.length > 0) {
    const inserts = gerentesIds.map((gerenteId) => ({
      gerente_id: gerenteId,
      equipe_id: equipeId,
    }))

    const { error } = await supabase.from("gerentes_equipes").insert(inserts)

    if (error) {
      console.error("[v0] Erro ao sincronizar gerentes da equipe:", error)
      throw new Error("Erro ao sincronizar gerentes da equipe")
    }
  }

  revalidatePath("/cadastros/equipes")
}
