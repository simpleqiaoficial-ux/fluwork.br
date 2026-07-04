"use server"

import { and, desc, eq, inArray } from "drizzle-orm"
import { db } from "@/lib/db"
import { faturas, faturasColaboradores } from "@/lib/db/schema"
import { toFaturaDTO } from "@/lib/db/mappers"
import { revalidatePath } from "next/cache"
import { getCurrentUser } from "@/lib/tenant"
import type { Fatura, StatusFatura, FaturaFormData } from "@/types/fatura"

// Nota: `isAdmin` não vem mais de quem chama (era um booleano confiado sem checagem contra
// a sessão real) — a permissão é sempre derivada de `getCurrentUser()` aqui dentro.
export async function getFaturas(colaboradorId?: string) {
  const usuario = await getCurrentUser()
  if (!usuario) return []

  const isAdmin = ["Adm", "Financeiro", "SuperAdmin"].includes(usuario.tipo_acesso)

  if (isAdmin) {
    // Admin/Financeiro vê todas as faturas da própria empresa (SuperAdmin vê todas as empresas)
    try {
      const rows = await db.query.faturas.findMany({
        where: usuario.tipo_acesso === "SuperAdmin" ? undefined : eq(faturas.empresaId, usuario.empresa_id!),
        with: {
          colaboradores: {
            with: { colaborador: true },
          },
        },
        orderBy: [desc(faturas.createdAt)],
      })

      // Mapear para o formato esperado
      return rows.map((f) =>
        toFaturaDTO({
          ...f,
          colaboradoresPermitidos: f.colaboradores?.map((cp) => ({
            colaborador_id: cp.colaboradorId,
            colaborador: cp.colaborador
              ? {
                  id: cp.colaborador.id,
                  nome: cp.colaborador.nomeCompleto,
                  email: cp.colaborador.email,
                }
              : undefined,
          })),
        }),
      ) as Fatura[]
    } catch (error) {
      console.error("[v0] Erro ao buscar faturas:", error)
      return []
    }
  } else if (colaboradorId) {
    // Nunca confia no colaboradorId do caller — só permite o próprio usuário logado.
    if (colaboradorId !== usuario.id) return []

    // Colaborador vê apenas faturas onde está permitido
    let faturaIdsRows
    try {
      faturaIdsRows = await db
        .select({ fatura_id: faturasColaboradores.faturaId })
        .from(faturasColaboradores)
        .where(eq(faturasColaboradores.colaboradorId, colaboradorId))
    } catch (permError) {
      console.error("Erro ao buscar permissões:", permError)
      return []
    }

    if (!faturaIdsRows || faturaIdsRows.length === 0) {
      return []
    }

    const ids = faturaIdsRows.map((f) => f.fatura_id)

    try {
      const rows = await db
        .select()
        .from(faturas)
        .where(inArray(faturas.id, ids))
        .orderBy(desc(faturas.createdAt))

      return (rows || []).map((f) => toFaturaDTO(f)) as Fatura[]
    } catch (error) {
      console.error("[v0] Erro ao buscar faturas colaborador:", error)
      return []
    }
  }

  return []
}

export async function getFaturaById(id: string) {
  const usuario = await getCurrentUser()
  if (!usuario) return null

  try {
    const row = await db.query.faturas.findFirst({
      where: eq(faturas.id, id),
      with: {
        colaboradores: {
          with: { colaborador: true },
        },
      },
    })

    if (!row) {
      throw new Error("Fatura não encontrada")
    }

    if (usuario.tipo_acesso !== "SuperAdmin" && row.empresaId !== usuario.empresa_id) {
      throw new Error("Sem permissão para acessar esta fatura")
    }

    // Mapear para o formato esperado
    return toFaturaDTO({
      ...row,
      colaboradoresPermitidos: row.colaboradores?.map((cp) => ({
        colaborador_id: cp.colaboradorId,
        colaborador: cp.colaborador
          ? {
              id: cp.colaborador.id,
              nome: cp.colaborador.nomeCompleto,
              email: cp.colaborador.email,
            }
          : undefined,
      })),
    }) as Fatura
  } catch (error) {
    console.error("[v0] Erro ao buscar fatura:", error)
    return null
  }
}

export async function createFatura(formData: FaturaFormData, pdfUrl: string, _criadorId: string) {
  // O criadorId de quem chama nunca é confiável (vem do client) — sempre deriva da sessão real.
  const usuario = await getCurrentUser()
  if (!usuario || !["Adm", "Financeiro"].includes(usuario.tipo_acesso)) {
    return { success: false, error: "Sem permissão para criar fatura" }
  }

  console.log("[v0] createFatura chamada com:", {
    formData,
    pdfUrl,
    criadorId: usuario.id,
    colaboradoresCount: formData.colaboradores_ids.length,
  })

  // Criar a fatura
  let fatura
  try {
    ;[fatura] = await db
      .insert(faturas)
      .values({
        empresaId: usuario.empresa_id!,
        titulo: formData.titulo,
        descricao: formData.descricao,
        valor: formData.valor != null ? String(formData.valor) : formData.valor,
        dataVencimento: formData.data_vencimento,
        arquivoPdfUrl: pdfUrl,
        criadoPor: usuario.id,
        status: "pendente",
      })
      .returning()
  } catch (faturaError: any) {
    console.error("[v0] Erro ao criar fatura:", {
      message: faturaError?.message,
      details: faturaError?.detail,
      hint: faturaError?.hint,
    })
    return { success: false, error: faturaError instanceof Error ? faturaError.message : String(faturaError) }
  }

  console.log("[v0] Resultado insert fatura:", {
    fatura: fatura
      ? {
          id: fatura.id,
          titulo: fatura.titulo,
          valor: fatura.valor,
          status: fatura.status,
        }
      : null,
    faturaError: null,
  })

  if (!fatura) {
    console.error("[v0] Nenhuma fatura retornada após insert")
    return { success: false, error: "Nenhuma fatura retornada" }
  }

  console.log("[v0] Fatura criada com ID:", fatura.id)

  // Adicionar colaboradores permitidos
  if (formData.colaboradores_ids.length > 0) {
    const colaboradoresData = formData.colaboradores_ids.map((colabId) => ({
      faturaId: fatura.id,
      colaboradorId: colabId,
    }))

    console.log("[v0] Adicionando colaboradores:", colaboradoresData)

    try {
      await db.insert(faturasColaboradores).values(colaboradoresData)
      console.log("[v0] Colaboradores adicionados com sucesso")
    } catch (permError: any) {
      console.error("[v0] Erro ao adicionar colaboradores:", {
        message: permError?.message,
        details: permError?.detail,
      })
    }
  }

  console.log("[v0] Revalidando paths...")
  revalidatePath("/faturas")

  console.log("[v0] Retornando fatura criada:", { id: fatura.id, titulo: fatura.titulo })
  return { success: true, fatura: toFaturaDTO(fatura) }
}

export async function updateFaturaStatus(id: string, status: StatusFatura) {
  const usuario = await getCurrentUser()
  if (!usuario || !["Adm", "Financeiro"].includes(usuario.tipo_acesso)) {
    return { success: false, error: "Sem permissão" }
  }

  try {
    await db
      .update(faturas)
      .set({ status, updatedAt: new Date() })
      .where(and(eq(faturas.id, id), eq(faturas.empresaId, usuario.empresa_id!)))
  } catch (error) {
    console.error("Erro ao atualizar status:", error)
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }

  revalidatePath("/faturas")
  return { success: true }
}

export async function updateFatura(id: string, formData: Partial<FaturaFormData>) {
  const usuario = await getCurrentUser()
  if (!usuario || !["Adm", "Financeiro"].includes(usuario.tipo_acesso)) {
    return { success: false, error: "Sem permissão" }
  }

  const updateData: Record<string, unknown> = {
    updatedAt: new Date(),
  }

  if (formData.titulo) updateData.titulo = formData.titulo
  if (formData.descricao !== undefined) updateData.descricao = formData.descricao
  if (formData.valor) updateData.valor = String(formData.valor)
  if (formData.data_vencimento) updateData.dataVencimento = formData.data_vencimento

  try {
    // Transação: garante que a atualização da fatura e a substituição dos
    // colaboradores permitidos ocorram de forma atômica (o código original
    // fazia delete-then-insert sequencial e não-atômico aqui).
    await db.transaction(async (tx) => {
      await tx
        .update(faturas)
        .set(updateData)
        .where(and(eq(faturas.id, id), eq(faturas.empresaId, usuario.empresa_id!)))

      // Atualizar colaboradores se fornecidos
      if (formData.colaboradores_ids) {
        // Remover todos os colaboradores atuais
        await tx.delete(faturasColaboradores).where(eq(faturasColaboradores.faturaId, id))

        // Adicionar novos colaboradores
        if (formData.colaboradores_ids.length > 0) {
          const colaboradoresData = formData.colaboradores_ids.map((colabId) => ({
            faturaId: id,
            colaboradorId: colabId,
          }))

          await tx.insert(faturasColaboradores).values(colaboradoresData)
        }
      }
    })
  } catch (error) {
    console.error("Erro ao atualizar fatura:", error)
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }

  revalidatePath("/faturas")
  return { success: true }
}

export async function deleteFatura(id: string) {
  const usuario = await getCurrentUser()
  if (!usuario || !["Adm", "Financeiro"].includes(usuario.tipo_acesso)) {
    return { success: false, error: "Sem permissão" }
  }

  try {
    // Transação: garante que a remoção das permissões e da fatura ocorram de
    // forma atômica (o código original fazia dois deletes sequenciais e
    // não-atômicos aqui).
    await db.transaction(async (tx) => {
      // Primeiro deletar as permissões
      await tx.delete(faturasColaboradores).where(eq(faturasColaboradores.faturaId, id))

      // Depois deletar a fatura (só se for da própria empresa)
      await tx.delete(faturas).where(and(eq(faturas.id, id), eq(faturas.empresaId, usuario.empresa_id!)))
    })
  } catch (error) {
    console.error("Erro ao deletar fatura:", error)
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }

  revalidatePath("/faturas")
  return { success: true }
}

export async function updateFaturaPdf(id: string, pdfUrl: string) {
  const usuario = await getCurrentUser()
  if (!usuario || !["Adm", "Financeiro"].includes(usuario.tipo_acesso)) {
    return { success: false, error: "Sem permissão" }
  }

  try {
    await db
      .update(faturas)
      .set({ arquivoPdfUrl: pdfUrl, updatedAt: new Date() })
      .where(and(eq(faturas.id, id), eq(faturas.empresaId, usuario.empresa_id!)))
  } catch (error) {
    console.error("Erro ao atualizar PDF:", error)
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }

  revalidatePath("/faturas")
  return { success: true }
}
