"use server"

import { createAdminClient } from "@/lib/supabase-server"
import { getSession } from "@/lib/session"
import { revalidatePath } from "next/cache"
import type { CentroCusto } from "@/types/colaborador"

export async function listarCentrosCusto(): Promise<CentroCusto[]> {
  const supabase = await createAdminClient()
  const { data, error } = await supabase
    .from("centros_custo")
    .select("*")
    .order("numero", { ascending: true })

  if (error) {
    console.error("[v0] Erro ao listar centros de custo:", error)
    throw new Error("Erro ao listar centros de custo")
  }

  return data || []
}

export async function criarCentroCusto(dados: { numero: string; nome: string }): Promise<void> {
  const session = await getSession()
  if (!session || (session.tipoAcesso !== "Adm" && session.tipoAcesso !== "Financeiro")) {
    throw new Error("Sem permissão")
  }

  const supabase = await createAdminClient()

  const { error } = await supabase.from("centros_custo").insert({
    numero: dados.numero.trim(),
    nome: dados.nome.trim(),
  })

  if (error) {
    if (error.code === "23505") {
      throw new Error("Ja existe um centro de custo com esse numero")
    }
    console.error("[v0] Erro ao criar centro de custo:", error)
    throw new Error("Erro ao criar centro de custo")
  }

  revalidatePath("/centros-custo")
  revalidatePath("/colaboradores")
}

export async function editarCentroCusto(id: string, dados: { numero: string; nome: string }): Promise<void> {
  const session = await getSession()
  if (!session || (session.tipoAcesso !== "Adm" && session.tipoAcesso !== "Financeiro")) {
    throw new Error("Sem permissao")
  }

  const supabase = await createAdminClient()

  const { error } = await supabase
    .from("centros_custo")
    .update({
      numero: dados.numero.trim(),
      nome: dados.nome.trim(),
    })
    .eq("id", id)

  if (error) {
    if (error.code === "23505") {
      throw new Error("Ja existe um centro de custo com esse numero")
    }
    console.error("[v0] Erro ao editar centro de custo:", error)
    throw new Error("Erro ao editar centro de custo")
  }

  revalidatePath("/centros-custo")
  revalidatePath("/colaboradores")
}

export async function excluirCentroCusto(id: string): Promise<void> {
  const session = await getSession()
  if (!session || (session.tipoAcesso !== "Adm" && session.tipoAcesso !== "Financeiro")) {
    throw new Error("Sem permissao")
  }

  const supabase = await createAdminClient()

  // Check if any collaborators are using this centro de custo
  const { data: colaboradores } = await supabase
    .from("colaboradores")
    .select("id")
    .eq("centro_custo_id", id)
    .limit(1)

  if (colaboradores && colaboradores.length > 0) {
    throw new Error("Nao e possivel excluir: existem colaboradores vinculados a este centro de custo")
  }

  const { error } = await supabase.from("centros_custo").delete().eq("id", id)

  if (error) {
    console.error("[v0] Erro ao excluir centro de custo:", error)
    throw new Error("Erro ao excluir centro de custo")
  }

  revalidatePath("/centros-custo")
}
