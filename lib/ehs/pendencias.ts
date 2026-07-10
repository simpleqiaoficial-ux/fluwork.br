import { and, eq, ne } from "drizzle-orm"
import { db } from "@/lib/db"
import { ehsDocumentos, ehsIntegracoes } from "@/lib/db/schema"
import { getTenantScope } from "@/lib/tenant"
import { exigirPermissaoEhs } from "@/lib/ehs/permissions"
import { calcularSituacaoValidade } from "@/lib/ehs/validade"
import { situacaoExibicaoIntegracao } from "@/lib/ehs/integracoes"

export type TipoPendenciaEhs = "documento_vencido" | "documento_proximo" | "documento_rejeitado" | "integracao_nao_confirmada" | "integracao_vencida"

export interface PendenciaEhs {
  id: string
  tipo: TipoPendenciaEhs
  titulo: string
  descricao: string
  data: string
  href: string
}

/** Junta, numa única lista, tudo que precisa de atenção no módulo — documentos vencidos/
 *  próximos/rejeitados e integrações não confirmadas ou vencidas. Sempre calculado na leitura,
 *  nunca uma tabela própria — os dados-fonte (ehs_documentos, ehs_integracoes) já existem. */
export async function listarPendenciasEhs(): Promise<PendenciaEhs[]> {
  const scope = await getTenantScope()
  await exigirPermissaoEhs(scope.usuario.tipo_acesso, "dashboard", "visualizar")

  const escopoDocumentos = scope.isSuperAdmin
    ? ne(ehsDocumentos.status, "substituido")
    : and(ne(ehsDocumentos.status, "substituido"), eq(ehsDocumentos.empresaId, scope.empresaId!))

  const documentos = await db.query.ehsDocumentos.findMany({
    where: escopoDocumentos,
    with: { tipoDocumento: true, colaborador: true },
  })

  const pendencias: PendenciaEhs[] = []

  for (const documento of documentos) {
    if (!documento.colaborador) continue
    const nomeTipo = documento.tipoDocumento?.nome || "Documento"

    if (documento.status === "rejeitado") {
      pendencias.push({
        id: `doc-rejeitado-${documento.id}`,
        tipo: "documento_rejeitado",
        titulo: `${nomeTipo} rejeitado`,
        descricao: documento.colaborador.nomeCompleto,
        data: documento.createdAt.toISOString().slice(0, 10),
        href: `/ehs/prestadores/${documento.colaboradorId}`,
      })
      continue
    }

    const situacao = calcularSituacaoValidade(documento.dataValidade)
    if (situacao.chave === "vencido") {
      pendencias.push({
        id: `doc-vencido-${documento.id}`,
        tipo: "documento_vencido",
        titulo: `${nomeTipo} vencido`,
        descricao: `${documento.colaborador.nomeCompleto} · ${situacao.label}`,
        data: documento.dataValidade || documento.createdAt.toISOString().slice(0, 10),
        href: `/ehs/prestadores/${documento.colaboradorId}`,
      })
    } else if (["vence_7", "vence_15", "vence_30"].includes(situacao.chave)) {
      pendencias.push({
        id: `doc-proximo-${documento.id}`,
        tipo: "documento_proximo",
        titulo: `${nomeTipo} vence em breve`,
        descricao: `${documento.colaborador.nomeCompleto} · ${situacao.label}`,
        data: documento.dataValidade || documento.createdAt.toISOString().slice(0, 10),
        href: `/ehs/prestadores/${documento.colaboradorId}`,
      })
    }
  }

  const escopoIntegracoes = scope.isSuperAdmin ? undefined : eq(ehsIntegracoes.empresaId, scope.empresaId!)
  const integracoes = await db.query.ehsIntegracoes.findMany({
    where: escopoIntegracoes,
    with: { cliente: true, colaborador: true },
  })

  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const em2dias = new Date(hoje.getTime() + 2 * 24 * 60 * 60 * 1000)

  for (const integracao of integracoes) {
    if (!integracao.colaborador || !integracao.dataAgendada) continue
    const nomeCliente = integracao.cliente?.nome || "cliente"

    if (integracao.status === "agendado") {
      const dataAgendada = new Date(integracao.dataAgendada)
      if (dataAgendada >= hoje && dataAgendada <= em2dias) {
        pendencias.push({
          id: `integ-nao-confirmada-${integracao.id}`,
          tipo: "integracao_nao_confirmada",
          titulo: "Integração não confirmada",
          descricao: `${integracao.colaborador.nomeCompleto} em ${nomeCliente}`,
          data: integracao.dataAgendada,
          href: `/ehs/integracoes/${integracao.id}`,
        })
      }
    }

    if (situacaoExibicaoIntegracao({ status: integracao.status, data_validade: integracao.dataValidade }) === "vencido") {
      pendencias.push({
        id: `integ-vencida-${integracao.id}`,
        tipo: "integracao_vencida",
        titulo: "Integração vencida",
        descricao: `${integracao.colaborador.nomeCompleto} em ${nomeCliente}`,
        data: integracao.dataValidade || integracao.dataAgendada,
        href: `/ehs/integracoes/${integracao.id}`,
      })
    }
  }

  return pendencias.sort((a, b) => a.data.localeCompare(b.data))
}
