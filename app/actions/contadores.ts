"use server"

import { and, count, eq, inArray } from "drizzle-orm"
import { db } from "@/lib/db"
import { colaboradores, gerentesEquipes, pedidosPagamento } from "@/lib/db/schema"
import { getSession } from "@/lib/session"

export async function contarPendencias() {
  const session = await getSession()
  if (!session) return { aprovacoes: 0, painelFinanceiro: 0, correcoes: 0 }

  const tipoAcesso = session.tipoAcesso

  let aprovacoes = 0
  let painelFinanceiro = 0
  let correcoes = 0

  try {
    if (tipoAcesso === "Gerente") {
      // Gerente: conta pedidos pendentes das suas equipes
      const equipesData = await db
        .select({ equipeId: gerentesEquipes.equipeId })
        .from(gerentesEquipes)
        .where(eq(gerentesEquipes.gerenteId, session.colaboradorId))

      const equipeIds = equipesData?.map((e) => e.equipeId).filter((id): id is string => !!id) || []

      if (equipeIds.length > 0) {
        const [{ value }] = await db
          .select({ value: count() })
          .from(pedidosPagamento)
          .innerJoin(colaboradores, eq(pedidosPagamento.colaboradorId, colaboradores.id))
          .where(and(eq(pedidosPagamento.status, "pendente_gerente"), inArray(colaboradores.equipeId, equipeIds)))

        aprovacoes = value || 0
      }

      // Contar correções pendentes para pedidos que o gerente criou
      const [{ value: correcoesGerenteCount }] = await db
        .select({ value: count() })
        .from(pedidosPagamento)
        .where(
          and(
            eq(pedidosPagamento.criadoPorColaboradorId, session.colaboradorId),
            eq(pedidosPagamento.status, "correcao"),
          ),
        )

      correcoes = correcoesGerenteCount || 0
    } else if (tipoAcesso === "Supervisor") {
      // Supervisor: conta pedidos pendentes da sua equipe
      const [colaborador] = await db
        .select({ equipeId: colaboradores.equipeId })
        .from(colaboradores)
        .where(eq(colaboradores.id, session.colaboradorId))

      if (colaborador?.equipeId) {
        const [{ value }] = await db
          .select({ value: count() })
          .from(pedidosPagamento)
          .innerJoin(colaboradores, eq(pedidosPagamento.colaboradorId, colaboradores.id))
          .where(
            and(eq(pedidosPagamento.status, "pendente_gerente"), eq(colaboradores.equipeId, colaborador.equipeId)),
          )

        aprovacoes = value || 0
      }
    } else if (tipoAcesso === "Financeiro" || tipoAcesso === "Adm" || tipoAcesso === "SuperAdmin") {
      const escopoEmpresa =
        tipoAcesso === "SuperAdmin" ? undefined : eq(pedidosPagamento.empresaId, session.empresaId!)

      const [{ value: pendentesCount }] = await db
        .select({ value: count() })
        .from(pedidosPagamento)
        .where(
          escopoEmpresa
            ? and(eq(pedidosPagamento.status, "pendente_financeiro"), escopoEmpresa)
            : eq(pedidosPagamento.status, "pendente_financeiro"),
        )

      const [{ value: aprovadosCount }] = await db
        .select({ value: count() })
        .from(pedidosPagamento)
        .where(
          escopoEmpresa ? and(eq(pedidosPagamento.status, "aprovado"), escopoEmpresa) : eq(pedidosPagamento.status, "aprovado"),
        )

      // Aprovações pendentes no painel financeiro (aguardando aprovação ou pagamento)
      aprovacoes = (pendentesCount || 0) + (aprovadosCount || 0)
      painelFinanceiro = aprovacoes

      const [{ value: correcoesCount }] = await db
        .select({ value: count() })
        .from(pedidosPagamento)
        .where(
          escopoEmpresa
            ? and(eq(pedidosPagamento.status, "correcao_solicitada"), escopoEmpresa)
            : eq(pedidosPagamento.status, "correcao_solicitada"),
        )

      correcoes = correcoesCount || 0
    }

    return { aprovacoes, painelFinanceiro, correcoes }
  } catch (error) {
    console.error("[v0] Erro ao contar pendências:", error)
    return { aprovacoes: 0, painelFinanceiro: 0, correcoes: 0 }
  }
}
