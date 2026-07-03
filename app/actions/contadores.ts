"use server"

import { createAdminClient } from "@/lib/supabase-server"
import { getSession } from "@/lib/session"

export async function contarPendencias() {
  const session = await getSession()
  if (!session) return { aprovacoes: 0, painelFinanceiro: 0, correcoes: 0 }

  const supabase = await createAdminClient()
  const tipoAcesso = session.tipoAcesso

  let aprovacoes = 0
  let painelFinanceiro = 0
  let correcoes = 0

  try {
    if (tipoAcesso === "Gerente") {
      // Gerente: conta pedidos pendentes das suas equipes
      const { data: equipesData } = await supabase
        .from("gerentes_equipes")
        .select("equipe_id")
        .eq("gerente_id", session.colaboradorId)

      const equipeIds = equipesData?.map((e) => e.equipe_id) || []

      if (equipeIds.length > 0) {
        const { count } = await supabase
          .from("pedidos_pagamento")
          .select("colaborador_id, colaboradores!colaborador_id(equipe_id)", {
            count: "exact",
            head: true,
          })
          .eq("status", "pendente_gerente")
          .in("colaboradores.equipe_id", equipeIds)

        aprovacoes = count || 0
      }

      // Contar correções pendentes para pedidos que o gerente criou
      const { count: correcoesGerenteCount } = await supabase
        .from("pedidos_pagamento")
        .select("*", { count: "exact", head: true })
        .eq("criado_por_colaborador_id", session.colaboradorId)
        .eq("status", "correcao")

      correcoes = correcoesGerenteCount || 0
    } else if (tipoAcesso === "Supervisor") {
      // Supervisor: conta pedidos pendentes da sua equipe
      const { data: colaborador } = await supabase
        .from("colaboradores")
        .select("equipe_id")
        .eq("id", session.colaboradorId)
        .single()

      if (colaborador?.equipe_id) {
        const { count } = await supabase
          .from("pedidos_pagamento")
          .select("colaborador_id, colaboradores!colaborador_id(equipe_id)", {
            count: "exact",
            head: true,
          })
          .eq("status", "pendente_gerente")
          .eq("colaboradores.equipe_id", colaborador.equipe_id)

        aprovacoes = count || 0
      }
    } else if (tipoAcesso === "Financeiro" || tipoAcesso === "Adm") {
      const { count: pendentesCount } = await supabase
        .from("pedidos_pagamento")
        .select("*", { count: "exact", head: true })
        .eq("status", "pendente_financeiro")

      const { count: aprovadosCount } = await supabase
        .from("pedidos_pagamento")
        .select("*", { count: "exact", head: true })
        .eq("status", "aprovado")

      // Aprovações pendentes no painel financeiro (aguardando aprovação ou pagamento)
      aprovacoes = (pendentesCount || 0) + (aprovadosCount || 0)
      painelFinanceiro = aprovacoes

      const { count: correcoesCount } = await supabase
        .from("pedidos_pagamento")
        .select("*", { count: "exact", head: true })
        .eq("status", "correcao_solicitada")

      correcoes = correcoesCount || 0
    }

    return { aprovacoes, painelFinanceiro, correcoes }
  } catch (error) {
    console.error("[v0] Erro ao contar pendências:", error)
    return { aprovacoes: 0, painelFinanceiro: 0, correcoes: 0 }
  }
}
