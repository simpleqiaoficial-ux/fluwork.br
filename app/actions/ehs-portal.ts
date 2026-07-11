"use server"

import { revalidatePath } from "next/cache"
import { desc, eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { ehsDocumentos, ehsTiposDocumento, ehsIntegracoes, ehsCarteirinhas } from "@/lib/db/schema"
import { getUsuarioLogado } from "@/lib/auth-utils"
import { calcularComplianceDocumentos } from "@/lib/ehs/compliance"
import { toDocumentoEhsDTO, toTipoDocumentoEhsDTO, toIntegracaoEhsDTO, toCarteirinhaEhsDTO } from "@/lib/db/mappers"
import { registrarAuditoriaEhs } from "@/lib/ehs/auditoria"
import { registrarTimelineEhs } from "@/lib/ehs/timeline"

export type MeuPortalEhsResultado =
  | { ok: true; portal: Awaited<ReturnType<typeof montarPortalEhs>> }
  | { ok: false; motivo: "nao_autenticado" }
  | { ok: false; motivo: "papel_invalido"; papelAtual: string }

/** Portal do Prestador — autoatendimento sempre escopado pelo próprio usuário logado, nunca
 *  aceita um id vindo de fora. Mesmo padrão de /meus-pagamentos e /meus-contratos: não passa
 *  pelo RBAC granular do módulo EHS (lib/ehs/permissions.ts), porque essa camada controla
 *  quem vê o módulo administrativo — aqui é só o prestador vendo os próprios dados, do mesmo
 *  jeito que qualquer Colaborador já vê os próprios pagamentos/contratos.
 *
 *  Devolve um motivo explícito em vez de só `null` — a página usava um redirect silencioso
 *  pra "/meus-pagamentos" que, sem nenhuma mensagem, parecia simplesmente não funcionar (o
 *  relato foi "fica voltando pra dashboard"). Agora dá pra distinguir sessão ausente (manda
 *  pro login) de sessão válida mas com papel diferente de Colaborador (mostra o motivo). */
export async function buscarMeuPortalEhs(): Promise<MeuPortalEhsResultado> {
  const usuario = await getUsuarioLogado()
  if (!usuario) return { ok: false, motivo: "nao_autenticado" }
  if (usuario.tipo_acesso !== "Colaborador") return { ok: false, motivo: "papel_invalido", papelAtual: usuario.tipo_acesso }

  return { ok: true, portal: await montarPortalEhs(usuario) }
}

async function montarPortalEhs(usuario: { id: string; nome_completo: string; foto_url?: string | null }) {
  const [tipos, documentos, integracoes, carteirinhas] = await Promise.all([
    db.select().from(ehsTiposDocumento).where(eq(ehsTiposDocumento.ativo, true)).orderBy(ehsTiposDocumento.categoria, ehsTiposDocumento.nome),
    db.query.ehsDocumentos.findMany({ where: eq(ehsDocumentos.colaboradorId, usuario.id), orderBy: [desc(ehsDocumentos.versao)] }),
    db.query.ehsIntegracoes.findMany({ where: eq(ehsIntegracoes.colaboradorId, usuario.id), orderBy: [desc(ehsIntegracoes.dataAgendada)], with: { cliente: true } }),
    db.query.ehsCarteirinhas.findMany({ where: eq(ehsCarteirinhas.colaboradorId, usuario.id), orderBy: [desc(ehsCarteirinhas.createdAt)], with: { cliente: true } }),
  ])

  const documentosDTO = documentos.map(toDocumentoEhsDTO)
  const documentosPorTipo = tipos.map((tipo) => ({
    tipo: toTipoDocumentoEhsDTO(tipo),
    atual: documentosDTO.find((d) => d.tipo_documento_id === tipo.id && d.status !== "substituido") || null,
  }))

  const documentosAtivos = documentosDTO.filter((d) => d.status !== "substituido")
  const compliance = calcularComplianceDocumentos(documentosAtivos.map((d) => ({ status: d.status, dataValidade: d.data_validade })))

  return {
    nome_completo: usuario.nome_completo,
    foto_url: usuario.foto_url,
    compliance,
    documentosPorTipo,
    integracoes: integracoes.map(toIntegracaoEhsDTO),
    carteirinhas: carteirinhas.filter((c) => c.status === "ativa").map(toCarteirinhaEhsDTO),
  }
}

export async function confirmarMinhaPresencaEhs(integracaoId: string) {
  const usuario = await getUsuarioLogado()
  if (!usuario || usuario.tipo_acesso !== "Colaborador") return { success: false, error: "Não autenticado" }

  const integracao = await db.query.ehsIntegracoes.findFirst({ where: eq(ehsIntegracoes.id, integracaoId) })
  if (!integracao) return { success: false, error: "Integração não encontrada" }
  if (integracao.colaboradorId !== usuario.id) return { success: false, error: "Esta integração não é sua" }
  if (!["agendado", "reagendado"].includes(integracao.status)) {
    return { success: false, error: "Esta integração não pode mais ser confirmada" }
  }

  await db.update(ehsIntegracoes).set({ status: "confirmado", confirmadoEm: new Date(), updatedAt: new Date() }).where(eq(ehsIntegracoes.id, integracaoId))

  await registrarAuditoriaEhs({
    empresaId: integracao.empresaId,
    tabela: "ehs_integracoes",
    registroId: integracaoId,
    acao: "atualizado",
    atorId: usuario.id,
    campo: "status",
    valorAntigo: integracao.status,
    valorNovo: "confirmado",
  })
  await registrarTimelineEhs({
    empresaId: integracao.empresaId,
    colaboradorId: usuario.id,
    tipoEvento: "integracao_status",
    descricao: "Presença confirmada pelo próprio prestador",
    atorId: usuario.id,
  })

  revalidatePath("/meu-compliance")
  return { success: true }
}
