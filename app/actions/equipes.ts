"use server"

import { and, asc, eq, isNull } from "drizzle-orm"
import { db } from "@/lib/db"
import { colaboradores, equipes, gerentesEquipes } from "@/lib/db/schema"
import { toEquipeDTO } from "@/lib/db/mappers"
import { revalidatePath } from "next/cache"
import { getCurrentUser, getEffectiveEmpresaId } from "@/lib/tenant"
import type { Equipe, NovaEquipe } from "@/types/equipe"

export async function listarEquipes(): Promise<Equipe[]> {
  const usuario = await getCurrentUser()
  if (!usuario) return []

  try {
    const empresaEfetiva = getEffectiveEmpresaId(usuario)
    const rows = await db.query.equipes.findMany({
      where: empresaEfetiva === null ? undefined : eq(equipes.empresaId, empresaEfetiva),
      orderBy: asc(equipes.nome),
      with: {
        supervisor: true,
        gerentes: {
          with: {
            gerente: true,
          },
        },
      },
    })

    return rows.map((equipe: any) =>
      toEquipeDTO({
        ...equipe,
        gerentes: (equipe.gerentes || [])
          .map((item: any) => item.gerente)
          .filter(Boolean)
          .map((gerente: any) => ({ id: gerente.id, nome_completo: gerente.nomeCompleto })),
      }),
    )
  } catch (error) {
    console.error("[v0] Erro ao listar equipes:", error)
    throw new Error("Erro ao listar equipes")
  }
}

export async function criarEquipe(equipe: NovaEquipe): Promise<void> {
  const usuario = await getCurrentUser()
  if (!usuario || !["Adm", "Financeiro"].includes(usuario.tipo_acesso)) {
    throw new Error("Sem permissão")
  }

  try {
    await db.insert(equipes).values({
      empresaId: usuario.empresa_id!,
      nome: equipe.nome,
      supervisorId: equipe.supervisor_id,
    })
  } catch (error) {
    console.error("[v0] Erro ao criar equipe:", error)
    throw new Error("Erro ao criar equipe")
  }

  revalidatePath("/cadastros/equipes")
}

export async function atualizarEquipe(id: string, equipe: Partial<NovaEquipe>): Promise<void> {
  const usuario = await getCurrentUser()
  if (!usuario || !["Adm", "Financeiro"].includes(usuario.tipo_acesso)) {
    throw new Error("Sem permissão")
  }

  try {
    const updateData: Partial<typeof equipes.$inferInsert> = {}
    if (equipe.nome !== undefined) updateData.nome = equipe.nome
    if (equipe.supervisor_id !== undefined) updateData.supervisorId = equipe.supervisor_id

    await db
      .update(equipes)
      .set(updateData)
      .where(
        usuario.tipo_acesso === "SuperAdmin"
          ? eq(equipes.id, id)
          : and(eq(equipes.id, id), eq(equipes.empresaId, usuario.empresa_id!)),
      )
  } catch (error) {
    console.error("[v0] Erro ao atualizar equipe:", error)
    throw new Error("Erro ao atualizar equipe")
  }

  revalidatePath("/cadastros/equipes")
}

export async function deletarEquipe(id: string): Promise<void> {
  const usuario = await getCurrentUser()
  if (!usuario || !["Adm", "Financeiro"].includes(usuario.tipo_acesso)) {
    throw new Error("Sem permissão")
  }

  try {
    await db
      .delete(equipes)
      .where(
        usuario.tipo_acesso === "SuperAdmin"
          ? eq(equipes.id, id)
          : and(eq(equipes.id, id), eq(equipes.empresaId, usuario.empresa_id!)),
      )
  } catch (error) {
    console.error("[v0] Erro ao deletar equipe:", error)
    throw new Error("Erro ao deletar equipe")
  }

  revalidatePath("/cadastros/equipes")
}

export async function listarSupervisores(): Promise<Array<{ id: string; nome_completo: string }>> {
  const usuario = await getCurrentUser()
  if (!usuario) return []

  try {
    const rows = await db
      .select({ id: colaboradores.id, nomeCompleto: colaboradores.nomeCompleto })
      .from(colaboradores)
      .where(
        getEffectiveEmpresaId(usuario) === null
          ? eq(colaboradores.tipoAcesso, "Supervisor")
          : and(eq(colaboradores.tipoAcesso, "Supervisor"), eq(colaboradores.empresaId, getEffectiveEmpresaId(usuario)!)),
      )
      .orderBy(asc(colaboradores.nomeCompleto))

    return rows.map((row) => ({ id: row.id, nome_completo: row.nomeCompleto }))
  } catch (error) {
    console.error("[v0] Erro ao listar supervisores:", error)
    throw new Error("Erro ao listar supervisores")
  }
}

export async function listarColaboradoresPorEquipe(equipeId: string) {
  try {
    const rows = await db
      .select({
        id: colaboradores.id,
        nomeCompleto: colaboradores.nomeCompleto,
        tipoAcesso: colaboradores.tipoAcesso,
        email: colaboradores.email,
      })
      .from(colaboradores)
      .where(eq(colaboradores.equipeId, equipeId))
      .orderBy(asc(colaboradores.nomeCompleto))

    return rows.map((row) => ({
      id: row.id,
      nome_completo: row.nomeCompleto,
      tipo_acesso: row.tipoAcesso,
      email: row.email,
    }))
  } catch (error) {
    console.error("[v0] Erro ao listar colaboradores da equipe:", error)
    throw new Error("Erro ao listar prestadores da equipe")
  }
}

export async function vincularGerenteEquipe(gerenteId: string, equipeId: string): Promise<void> {
  const usuario = await getCurrentUser()
  if (!usuario || !["Adm", "Financeiro"].includes(usuario.tipo_acesso)) {
    throw new Error("Sem permissão")
  }

  try {
    const [existing] = await db
      .select()
      .from(gerentesEquipes)
      .where(and(eq(gerentesEquipes.gerenteId, gerenteId), eq(gerentesEquipes.equipeId, equipeId)))

    if (existing) {
      return // Already linked
    }

    await db.insert(gerentesEquipes).values({
      empresaId: usuario.empresa_id!,
      gerenteId,
      equipeId,
    })
  } catch (error) {
    console.error("[v0] Erro ao vincular gerente à equipe:", error)
    throw new Error("Erro ao vincular gerente à equipe")
  }

  revalidatePath("/cadastros/equipes")
}

export async function desvincularGerenteEquipe(gerenteId: string, equipeId: string): Promise<void> {
  try {
    await db
      .delete(gerentesEquipes)
      .where(and(eq(gerentesEquipes.gerenteId, gerenteId), eq(gerentesEquipes.equipeId, equipeId)))
  } catch (error) {
    console.error("[v0] Erro ao desvincular gerente da equipe:", error)
    throw new Error("Erro ao desvincular gerente da equipe")
  }

  revalidatePath("/cadastros/equipes")
}

export async function listarEquipesPorGerente(gerenteId: string): Promise<Equipe[]> {
  try {
    const rows = await db.query.gerentesEquipes.findMany({
      where: eq(gerentesEquipes.gerenteId, gerenteId),
      with: {
        equipe: {
          with: {
            supervisor: true,
          },
        },
      },
    })

    return rows
      .map((item: any) => item.equipe)
      .filter(Boolean)
      .map((equipe: any) => toEquipeDTO(equipe))
  } catch (error) {
    console.error("[v0] Erro ao listar equipes do gerente:", error)
    throw new Error("Erro ao listar equipes do gerente")
  }
}

export async function listarGerentes(): Promise<Array<{ id: string; nome_completo: string }>> {
  const usuario = await getCurrentUser()
  if (!usuario) return []

  try {
    const rows = await db
      .select({ id: colaboradores.id, nomeCompleto: colaboradores.nomeCompleto })
      .from(colaboradores)
      .where(
        getEffectiveEmpresaId(usuario) === null
          ? eq(colaboradores.tipoAcesso, "Gerente")
          : and(eq(colaboradores.tipoAcesso, "Gerente"), eq(colaboradores.empresaId, getEffectiveEmpresaId(usuario)!)),
      )
      .orderBy(asc(colaboradores.nomeCompleto))

    return rows.map((row) => ({ id: row.id, nome_completo: row.nomeCompleto }))
  } catch (error) {
    console.error("[v0] Erro ao listar gerentes:", error)
    throw new Error("Erro ao listar gerentes")
  }
}

export async function listarColaboradoresSemEquipe(): Promise<
  Array<{ id: string; nome_completo: string; tipo_acesso: string; email: string }>
> {
  const usuario = await getCurrentUser()
  if (!usuario) return []

  try {
    const rows = await db
      .select({
        id: colaboradores.id,
        nomeCompleto: colaboradores.nomeCompleto,
        tipoAcesso: colaboradores.tipoAcesso,
        email: colaboradores.email,
      })
      .from(colaboradores)
      .where(
        getEffectiveEmpresaId(usuario) === null
          ? isNull(colaboradores.equipeId)
          : and(isNull(colaboradores.equipeId), eq(colaboradores.empresaId, getEffectiveEmpresaId(usuario)!)),
      )
      .orderBy(asc(colaboradores.nomeCompleto))

    return rows.map((row) => ({
      id: row.id,
      nome_completo: row.nomeCompleto,
      tipo_acesso: row.tipoAcesso as string,
      email: row.email as string,
    }))
  } catch (error) {
    console.error("[v0] Erro ao listar colaboradores sem equipe:", error)
    throw new Error("Erro ao listar prestadores sem equipe")
  }
}

export async function vincularColaboradorEquipe(colaboradorId: string, equipeId: string): Promise<void> {
  try {
    await db.update(colaboradores).set({ equipeId }).where(eq(colaboradores.id, colaboradorId))
  } catch (error) {
    console.error("[v0] Erro ao vincular colaborador:", error)
    throw new Error("Erro ao vincular prestador a equipe")
  }

  revalidatePath("/cadastros/equipes")
  revalidatePath(`/cadastros/equipes/${equipeId}`)
}

export async function removerColaboradorEquipe(colaboradorId: string): Promise<void> {
  try {
    await db.update(colaboradores).set({ equipeId: null }).where(eq(colaboradores.id, colaboradorId))
  } catch (error) {
    console.error("[v0] Erro ao remover colaborador da equipe:", error)
    throw new Error("Erro ao remover prestador da equipe")
  }

  revalidatePath("/cadastros/equipes")
  revalidatePath("/colaboradores")
}

export async function buscarEquipe(equipeId: string): Promise<Equipe | null> {
  try {
    const row = await db.query.equipes.findFirst({
      where: eq(equipes.id, equipeId),
      with: {
        supervisor: true,
        gerentes: {
          with: {
            gerente: true,
          },
        },
      },
    })

    if (!row) {
      console.error("[v0] Erro ao buscar equipe:", "equipe não encontrada")
      return null
    }

    const gerentes = (row as any).gerentes
      .map((item: any) => item.gerente)
      .filter(Boolean)
      .map((gerente: any) => ({ id: gerente.id, nome_completo: gerente.nomeCompleto }))

    return toEquipeDTO({ ...row, gerentes })
  } catch (error) {
    console.error("[v0] Erro ao buscar equipe:", error)
    return null
  }
}

export async function sincronizarGerentesEquipe(equipeId: string, gerentesIds: string[]): Promise<void> {
  const usuario = await getCurrentUser()
  if (!usuario || !["Adm", "Financeiro"].includes(usuario.tipo_acesso)) {
    throw new Error("Sem permissão")
  }

  try {
    await db.transaction(async (tx) => {
      await tx.delete(gerentesEquipes).where(eq(gerentesEquipes.equipeId, equipeId))

      if (gerentesIds.length > 0) {
        const inserts = gerentesIds.map((gerenteId) => ({
          empresaId: usuario.empresa_id!,
          gerenteId,
          equipeId,
        }))

        await tx.insert(gerentesEquipes).values(inserts)
      }
    })
  } catch (error) {
    console.error("[v0] Erro ao sincronizar gerentes da equipe:", error)
    throw new Error("Erro ao sincronizar gerentes da equipe")
  }

  revalidatePath("/cadastros/equipes")
}
