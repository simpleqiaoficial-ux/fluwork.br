"use server"

import { and, count, eq, inArray, isNull, or } from "drizzle-orm"
import { db } from "@/lib/db"
import { colaboradores, gerentesEquipes, pedidosPagamento } from "@/lib/db/schema"
import { getSession } from "@/lib/session"
import { getEffectiveEmpresaIdFromSession } from "@/lib/tenant"

const CONTADOR_VAZIO = { aprovacoes: 0, painelFinanceiro: 0, correcoes: 0, acompanhamento: 0 }

// Nem toda nota emitida está marcada — igual ao filtro usado nas listagens reais que estes
// contadores representam (listarPedidosPendentes, listarPedidosComNotaPendente).
const notaNaoEmitida = or(isNull(pedidosPagamento.notaEmitida), eq(pedidosPagamento.notaEmitida, false))

/** Cada contador replica exatamente a query da página que ele representa — badge só existe
 *  pra dar um número que bate com o que a pessoa vai ver ao clicar. */
export async function contarPendencias() {
  const session = await getSession()
  if (!session) return CONTADOR_VAZIO

  const tipoAcesso = session.tipoAcesso

  let aprovacoes = 0
  let painelFinanceiro = 0
  let correcoes = 0
  let acompanhamento = 0

  try {
    if (tipoAcesso === "Gerente") {
      // Espelha listarPedidosPendentes: pendente_gerente das equipes do gerente, com nota
      // ainda não emitida.
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
          .where(
            and(eq(pedidosPagamento.status, "pendente_gerente"), inArray(colaboradores.equipeId, equipeIds), notaNaoEmitida),
          )

        aprovacoes = value || 0
      }

      // Correções pendentes nos pedidos que o próprio gerente criou (badge de "Minhas Solicitações").
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
            and(
              eq(pedidosPagamento.status, "pendente_gerente"),
              eq(colaboradores.equipeId, colaborador.equipeId),
              notaNaoEmitida,
            ),
          )

        aprovacoes = value || 0
      }
    } else if (tipoAcesso === "Financeiro" || tipoAcesso === "Adm" || tipoAcesso === "SuperAdmin") {
      const empresaEfetivaContador = getEffectiveEmpresaIdFromSession(session)
      const escopoEmpresa = empresaEfetivaContador === null ? undefined : eq(pedidosPagamento.empresaId, empresaEfetivaContador)

      // "Aprovações" — espelha listarPedidosPendentes: Financeiro só pendente_financeiro,
      // Adm/SuperAdmin também pendente_gerente (aprovam as duas etapas).
      const statusAprovacoes =
        tipoAcesso === "Financeiro" ? ["pendente_financeiro"] : ["pendente_gerente", "pendente_financeiro"]
      const condicaoAprovacoes = inArray(pedidosPagamento.status, statusAprovacoes)
      const [{ value: aprovacoesCount }] = await db
        .select({ value: count() })
        .from(pedidosPagamento)
        .where(escopoEmpresa ? and(condicaoAprovacoes, escopoEmpresa, notaNaoEmitida) : and(condicaoAprovacoes, notaNaoEmitida))

      aprovacoes = aprovacoesCount || 0

      // "Acompanhamento" — espelha listarPedidosComNotaPendente: aprovado, pedido completo,
      // nota ainda não emitida. Antes reaproveitava a chave "correcoes" com um valor de status
      // que não existe no banco (sempre zerado) — badge separado agora.
      const [{ value: acompanhamentoCount }] = await db
        .select({ value: count() })
        .from(pedidosPagamento)
        .where(
          escopoEmpresa
            ? and(eq(pedidosPagamento.status, "aprovado"), eq(pedidosPagamento.tipoPedido, "completo"), escopoEmpresa, notaNaoEmitida)
            : and(eq(pedidosPagamento.status, "aprovado"), eq(pedidosPagamento.tipoPedido, "completo"), notaNaoEmitida),
        )

      acompanhamento = acompanhamentoCount || 0

      // "Painel Financeiro" — notas recebidas aguardando "marcar como pago", sem duplicar o
      // que "Aprovações" já cobre.
      const [{ value: notaRecebidaCount }] = await db
        .select({ value: count() })
        .from(pedidosPagamento)
        .where(
          escopoEmpresa
            ? and(eq(pedidosPagamento.status, "nota_recebida"), escopoEmpresa)
            : eq(pedidosPagamento.status, "nota_recebida"),
        )

      const [{ value: prorrogacaoCount }] = await db
        .select({ value: count() })
        .from(pedidosPagamento)
        .where(
          escopoEmpresa
            ? and(eq(pedidosPagamento.status, "aguardando_prorrogacao"), eq(pedidosPagamento.prorrogacaoSolicitada, true), escopoEmpresa)
            : and(eq(pedidosPagamento.status, "aguardando_prorrogacao"), eq(pedidosPagamento.prorrogacaoSolicitada, true)),
        )

      painelFinanceiro = (notaRecebidaCount || 0) + (prorrogacaoCount || 0)
    }

    return { aprovacoes, painelFinanceiro, correcoes, acompanhamento }
  } catch (error) {
    console.error("[v0] Erro ao contar pendências:", error)
    return CONTADOR_VAZIO
  }
}
