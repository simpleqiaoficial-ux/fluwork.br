"use server"

import { desc, eq, inArray } from "drizzle-orm"
import { db } from "@/lib/db"
import { colaboradores, equipes, historicoReajustes } from "@/lib/db/schema"
import { toHistoricoReajusteDTO } from "@/lib/db/mappers"
import { getSession } from "@/lib/session"
import { revalidatePath } from "next/cache"
import type { NovoReajuste, HistoricoReajuste } from "@/types/reajuste"

export async function aplicarReajuste(data: NovoReajuste) {
  const session = await getSession()

  if (!session) {
    throw new Error("Usuário não autenticado")
  }

  // Apenas Financeiro e Adm podem aplicar reajustes
  if (session.tipoAcesso !== "Financeiro" && session.tipoAcesso !== "Adm") {
    throw new Error("Você não tem permissão para aplicar reajustes")
  }

  if (!data.motivo || data.motivo.trim() === "") {
    throw new Error("O motivo do reajuste é obrigatório")
  }

  const [colaborador] = await db
    .select({ salario: colaboradores.salario, nomeCompleto: colaboradores.nomeCompleto })
    .from(colaboradores)
    .where(eq(colaboradores.id, data.colaborador_id))

  if (!colaborador) {
    throw new Error("Colaborador não encontrado")
  }

  const salarioAnterior = Number(colaborador.salario)

  // Calcular novo salário
  let salarioNovo: number
  if (data.tipo_reajuste === "porcentagem") {
    salarioNovo = salarioAnterior + salarioAnterior * (data.valor_reajuste / 100)
  } else {
    salarioNovo = salarioAnterior + data.valor_reajuste
  }

  // Arredondar para 2 casas decimais
  salarioNovo = Math.round(salarioNovo * 100) / 100

  await db.transaction(async (tx) => {
    try {
      await tx.insert(historicoReajustes).values({
        colaboradorId: data.colaborador_id,
        salarioAnterior: salarioAnterior.toString(),
        salarioNovo: salarioNovo.toString(),
        tipoReajuste: data.tipo_reajuste,
        valorReajuste: data.valor_reajuste.toString(),
        motivo: data.motivo,
        aplicadoPor: session.colaboradorId,
      })
    } catch (historicoError) {
      console.error("[v0] Erro ao registrar histórico:", historicoError)
      throw new Error("Erro ao registrar histórico de reajuste")
    }

    // Atualizar salário do colaborador e avançar a data de aniversário de contrato em 1 ano
    const novaDataAniversario = new Date()
    novaDataAniversario.setFullYear(novaDataAniversario.getFullYear() + 1)

    try {
      await tx
        .update(colaboradores)
        .set({
          salario: salarioNovo.toString(),
          dataAniversarioContrato: novaDataAniversario.toISOString().split("T")[0],
        })
        .where(eq(colaboradores.id, data.colaborador_id))
    } catch (updateError) {
      console.error("[v0] Erro ao atualizar colaborador:", updateError)
      throw new Error("Erro ao aplicar reajuste")
    }
  })

  revalidatePath("/financeiro/colaboradores")
  revalidatePath("/colaboradores")
  revalidatePath("/cadastros/colaboradores")
  revalidatePath("/meus-pagamentos")
  revalidatePath("/gestao/reajustes")
  revalidatePath("/gestao")
  revalidatePath("/")

  return {
    colaborador: colaborador.nomeCompleto,
    salarioAnterior,
    salarioNovo,
    tipo: data.tipo_reajuste,
    valor: data.valor_reajuste,
  }
}

export async function listarHistoricoReajustes(colaboradorId?: string): Promise<HistoricoReajuste[]> {
  try {
    const session = await getSession()

    if (!session) {
      throw new Error("Usuário não autenticado")
    }

    let whereClause = colaboradorId ? eq(historicoReajustes.colaboradorId, colaboradorId) : undefined

    // Filtrar por colaborador se especificado
    if (!colaboradorId) {
      // Aplicar filtros de permissão
      if (session.tipoAcesso === "Supervisor") {
        // Supervisor vê apenas reajustes dos colaboradores da sua equipe
        const equipesDoSupervisor = await db
          .select({ id: equipes.id })
          .from(equipes)
          .where(eq(equipes.supervisorId, session.colaboradorId))

        if (equipesDoSupervisor.length > 0) {
          const equipeIds = equipesDoSupervisor.map((e) => e.id)
          const colaboradoresDaEquipe = await db
            .select({ id: colaboradores.id })
            .from(colaboradores)
            .where(inArray(colaboradores.equipeId, equipeIds))

          if (colaboradoresDaEquipe.length > 0) {
            const colaboradorIds = colaboradoresDaEquipe.map((c) => c.id)
            whereClause = inArray(historicoReajustes.colaboradorId, colaboradorIds)
          } else {
            return []
          }
        } else {
          return []
        }
      } else if (session.tipoAcesso === "Colaborador") {
        // Colaborador vê apenas seus próprios reajustes
        whereClause = eq(historicoReajustes.colaboradorId, session.colaboradorId)
      }
      // Gerente, Financeiro e Adm veem todos
    }

    const rows = await db.query.historicoReajustes.findMany({
      where: whereClause,
      orderBy: [desc(historicoReajustes.createdAt)],
      with: {
        colaborador: true,
        aplicadoPorColaborador: true,
      },
    })

    // toHistoricoReajusteDTO espera a chave `aplicadorColaborador`; a relation no schema
    // chama-se `aplicadoPorColaborador` — renomeia aqui para casar com o mapper.
    return rows.map((row) =>
      toHistoricoReajusteDTO({ ...row, aplicadorColaborador: row.aplicadoPorColaborador }),
    ) as HistoricoReajuste[]
  } catch (error) {
    console.error("[v0] Erro ao listar histórico de reajustes:", error)
    // Return empty array on any error including rate limiting
    return []
  }
}
