"use server"

import { and, asc, eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { centrosCusto, colaboradores } from "@/lib/db/schema"
import { toCentroCustoDTO } from "@/lib/db/mappers"
import { getSession } from "@/lib/session"
import { revalidatePath } from "next/cache"
import { getEffectiveEmpresaIdFromSession } from "@/lib/tenant"
import type { CentroCusto } from "@/types/colaborador"

export async function listarCentrosCusto(): Promise<CentroCusto[]> {
  const session = await getSession()
  if (!session) return []

  try {
    const empresaEfetiva = getEffectiveEmpresaIdFromSession(session)
    const data = await db
      .select()
      .from(centrosCusto)
      .where(empresaEfetiva === null ? undefined : eq(centrosCusto.empresaId, empresaEfetiva))
      .orderBy(asc(centrosCusto.numero))

    return (data || []).map(toCentroCustoDTO) as CentroCusto[]
  } catch (error) {
    console.error("[v0] Erro ao listar centros de custo:", error)
    throw new Error("Erro ao listar centros de custo")
  }
}

export async function criarCentroCusto(dados: { numero: string; nome: string }): Promise<void> {
  const session = await getSession()
  if (!session || (session.tipoAcesso !== "Adm" && session.tipoAcesso !== "Financeiro")) {
    throw new Error("Sem permissão")
  }

  try {
    await db.insert(centrosCusto).values({
      empresaId: session.empresaId!,
      numero: dados.numero.trim(),
      nome: dados.nome.trim(),
    })
  } catch (error: any) {
    if (error?.code === "23505") {
      throw new Error("Já existe um centro de custo com esse número")
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
    throw new Error("Sem permissão")
  }

  try {
    await db
      .update(centrosCusto)
      .set({
        numero: dados.numero.trim(),
        nome: dados.nome.trim(),
      })
      .where(and(eq(centrosCusto.id, id), eq(centrosCusto.empresaId, session.empresaId!)))
  } catch (error: any) {
    if (error?.code === "23505") {
      throw new Error("Já existe um centro de custo com esse número")
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
    throw new Error("Sem permissão")
  }

  // Check if any collaborators are using this centro de custo
  const colaboradoresVinculados = await db
    .select({ id: colaboradores.id })
    .from(colaboradores)
    .where(eq(colaboradores.centroCustoId, id))
    .limit(1)

  if (colaboradoresVinculados && colaboradoresVinculados.length > 0) {
    throw new Error("Não é possível excluir: existem prestadores vinculados a este centro de custo")
  }

  try {
    await db.delete(centrosCusto).where(and(eq(centrosCusto.id, id), eq(centrosCusto.empresaId, session.empresaId!)))
  } catch (error) {
    console.error("[v0] Erro ao excluir centro de custo:", error)
    throw new Error("Erro ao excluir centro de custo")
  }

  revalidatePath("/centros-custo")
}
