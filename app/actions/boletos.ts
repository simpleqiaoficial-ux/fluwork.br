"use server"

import { and, asc, eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { boletos } from "@/lib/db/schema"
import { toBoletoDTO } from "@/lib/db/mappers"
import { revalidatePath } from "next/cache"
import { getCurrentUser, getEffectiveEmpresaId } from "@/lib/tenant"
import type { Boleto, CreateBoletoInput, UpdateBoletoInput } from "@/types/boleto"

export async function listarBoletos() {
  const usuario = await getCurrentUser()
  if (!usuario) return []

  try {
    const empresaEfetiva = getEffectiveEmpresaId(usuario)
    const data = await db.query.boletos.findMany({
      with: { centroCusto: true },
      where: empresaEfetiva === null
        ? eq(boletos.ativo, true)
        : and(eq(boletos.empresaId, empresaEfetiva), eq(boletos.ativo, true)),
      orderBy: asc(boletos.banco),
    })

    return data.map(toBoletoDTO) as Boleto[]
  } catch (error) {
    console.error("[v0] Erro ao listar boletos:", error)
    return []
  }
}

export async function listarTodosBoletos() {
  const usuario = await getCurrentUser()
  if (!usuario) return []

  try {
    const empresaEfetiva = getEffectiveEmpresaId(usuario)
    const data = await db.query.boletos.findMany({
      with: { centroCusto: true },
      where: empresaEfetiva === null ? undefined : eq(boletos.empresaId, empresaEfetiva),
      orderBy: asc(boletos.banco),
    })

    return data.map(toBoletoDTO) as Boleto[]
  } catch (error) {
    console.error("[v0] Erro ao listar todos os boletos:", error)
    return []
  }
}

export async function criarBoleto(input: CreateBoletoInput) {
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

  const usuario = await getCurrentUser()
  if (!usuario?.empresa_id) {
    return { success: false, error: "Não autenticado ou sem empresa vinculada" }
  }

  try {
    // Verificar se o boleto já existe (dentro da mesma empresa)
    const [existente] = await db
      .select({ id: boletos.id })
      .from(boletos)
      .where(and(eq(boletos.empresaId, usuario.empresa_id), eq(boletos.numeroBoleto, input.numero_boleto)))

    if (existente) {
      return { success: false, error: "Este número de boleto já existe" }
    }

    const [novoBoleto] = await db
      .insert(boletos)
      .values({
        empresaId: usuario.empresa_id,
        numeroBoleto: input.numero_boleto.trim(),
        banco: input.banco.trim(),
        agencia: input.agencia.trim(),
        conta: input.conta.trim(),
        tipoBoleto: input.tipo,
        centroCustoId: input.centro_custo_id || null,
        ativo: true,
      })
      .returning()

    const boletoComCentroCusto = await db.query.boletos.findFirst({
      with: { centroCusto: true },
      where: eq(boletos.id, novoBoleto.id),
    })

    revalidatePath("/cadastros")
    return { success: true, boleto: toBoletoDTO(boletoComCentroCusto ?? novoBoleto) }
  } catch (error) {
    console.error("[v0] Erro ao criar boleto:", error)
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
}

export async function atualizarBoleto(id: string, input: UpdateBoletoInput) {
  try {
    const [boletoAtualizado] = await db
      .update(boletos)
      .set({
        ...(input.numero_boleto && { numeroBoleto: input.numero_boleto.trim() }),
        ...(input.banco && { banco: input.banco.trim() }),
        ...(input.agencia && { agencia: input.agencia.trim() }),
        ...(input.conta && { conta: input.conta.trim() }),
        ...(input.tipo && { tipoBoleto: input.tipo }),
        ...(input.centro_custo_id !== undefined && { centroCustoId: input.centro_custo_id }),
        ...(input.ativo !== undefined && { ativo: input.ativo }),
      })
      .where(eq(boletos.id, id))
      .returning()

    const boletoComCentroCusto = await db.query.boletos.findFirst({
      with: { centroCusto: true },
      where: eq(boletos.id, boletoAtualizado.id),
    })

    revalidatePath("/cadastros")
    return { success: true, boleto: toBoletoDTO(boletoComCentroCusto ?? boletoAtualizado) }
  } catch (error) {
    console.error("[v0] Erro ao atualizar boleto:", error)
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
}

export async function deletarBoleto(id: string) {
  try {
    await db.delete(boletos).where(eq(boletos.id, id))

    revalidatePath("/cadastros")
    return { success: true }
  } catch (error) {
    console.error("[v0] Erro ao deletar boleto:", error)
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
}
