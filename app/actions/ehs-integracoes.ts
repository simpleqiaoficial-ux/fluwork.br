"use server"

import { revalidatePath } from "next/cache"
import { and, asc, eq, gte, lte } from "drizzle-orm"
import { db } from "@/lib/db"
import { ehsIntegracoes, ehsClientes, colaboradores } from "@/lib/db/schema"
import { getTenantScope, assertNaoImpersonando } from "@/lib/tenant"
import { exigirPermissaoEhs } from "@/lib/ehs/permissions"
import { registrarAuditoriaEhs } from "@/lib/ehs/auditoria"
import { registrarTimelineEhs } from "@/lib/ehs/timeline"
import { TRANSICOES_STATUS_INTEGRACAO } from "@/lib/ehs/integracoes"
import { toIntegracaoEhsDTO } from "@/lib/db/mappers"

export interface IntegracaoEhsInput {
  cliente_id: string
  colaborador_id: string
  data_agendada: string
  horario?: string | null
  endereco_local?: string | null
  cidade?: string | null
  sala?: string | null
  local?: string | null
  responsavel_id?: string | null
  telefone?: string | null
  observacoes?: string | null
  tempo_estimado_minutos?: number | null
}

interface FiltrosIntegracoesEhs {
  de?: string
  ate?: string
  clienteId?: string
  colaboradorId?: string
}

export async function listarIntegracoesEhs(filtros: FiltrosIntegracoesEhs = {}) {
  const scope = await getTenantScope()
  await exigirPermissaoEhs(scope.usuario.tipo_acesso, "integracao", "visualizar")

  const condicoes = [scope.isSuperAdmin ? undefined : eq(ehsIntegracoes.empresaId, scope.empresaId!)]
  if (filtros.de) condicoes.push(gte(ehsIntegracoes.dataAgendada, filtros.de))
  if (filtros.ate) condicoes.push(lte(ehsIntegracoes.dataAgendada, filtros.ate))
  if (filtros.clienteId) condicoes.push(eq(ehsIntegracoes.clienteId, filtros.clienteId))
  if (filtros.colaboradorId) condicoes.push(eq(ehsIntegracoes.colaboradorId, filtros.colaboradorId))

  const integracoes = await db.query.ehsIntegracoes.findMany({
    where: and(...condicoes.filter((c): c is NonNullable<typeof c> => c !== undefined)),
    orderBy: [asc(ehsIntegracoes.dataAgendada)],
    with: { cliente: true, colaborador: true },
  })

  return integracoes.map(toIntegracaoEhsDTO)
}

export async function buscarIntegracaoEhsPorId(id: string) {
  const scope = await getTenantScope()
  await exigirPermissaoEhs(scope.usuario.tipo_acesso, "integracao", "visualizar")

  const integracao = await db.query.ehsIntegracoes.findFirst({
    where: eq(ehsIntegracoes.id, id),
    with: { cliente: true, colaborador: true, responsavel: true },
  })
  if (!integracao) return null
  if (!scope.isSuperAdmin && integracao.empresaId !== scope.empresaId) throw new Error("Sem permissão para acessar esta integração")

  return toIntegracaoEhsDTO(integracao)
}

export async function criarIntegracaoEhs(data: IntegracaoEhsInput) {
  const scope = await getTenantScope()
  await exigirPermissaoEhs(scope.usuario.tipo_acesso, "integracao", "criar")
  await assertNaoImpersonando()

  if (!data.cliente_id || !data.colaborador_id) return { success: false, error: "Selecione o cliente e o prestador" }
  if (!data.data_agendada) return { success: false, error: "Informe a data do agendamento" }
  if (!scope.empresaId) return { success: false, error: "Empresa não identificada" }

  const [cliente] = await db.select({ id: ehsClientes.id, empresaId: ehsClientes.empresaId }).from(ehsClientes).where(eq(ehsClientes.id, data.cliente_id))
  if (!cliente || (!scope.isSuperAdmin && cliente.empresaId !== scope.empresaId)) return { success: false, error: "Cliente inválido" }

  const [colaborador] = await db.select({ id: colaboradores.id, empresaId: colaboradores.empresaId }).from(colaboradores).where(eq(colaboradores.id, data.colaborador_id))
  if (!colaborador || (!scope.isSuperAdmin && colaborador.empresaId !== scope.empresaId)) return { success: false, error: "Prestador inválido" }

  const empresaId = scope.isSuperAdmin ? cliente.empresaId! : scope.empresaId

  const [integracao] = await db
    .insert(ehsIntegracoes)
    .values({
      empresaId,
      clienteId: data.cliente_id,
      colaboradorId: data.colaborador_id,
      status: "agendado",
      dataAgendada: data.data_agendada,
      horario: data.horario || null,
      enderecoLocal: data.endereco_local || null,
      cidade: data.cidade || null,
      sala: data.sala || null,
      local: data.local || null,
      responsavelId: data.responsavel_id || null,
      telefone: data.telefone || null,
      observacoes: data.observacoes || null,
      tempoEstimadoMinutos: data.tempo_estimado_minutos || null,
      criadoPor: scope.usuario.id,
    })
    .returning()

  await registrarAuditoriaEhs({ empresaId, tabela: "ehs_integracoes", registroId: integracao.id, acao: "criado", atorId: scope.usuario.id })
  await registrarTimelineEhs({
    empresaId,
    colaboradorId: data.colaborador_id,
    tipoEvento: "integracao_agendada",
    descricao: `Integração agendada para ${new Date(data.data_agendada).toLocaleDateString("pt-BR")}`,
    atorId: scope.usuario.id,
  })

  revalidatePath("/ehs/agenda")
  revalidatePath("/ehs/integracoes")
  revalidatePath(`/ehs/clientes/${data.cliente_id}`)
  revalidatePath(`/ehs/prestadores/${data.colaborador_id}`)
  return { success: true, id: integracao.id }
}

export async function atualizarIntegracaoEhs(id: string, data: Partial<IntegracaoEhsInput>) {
  const scope = await getTenantScope()
  await exigirPermissaoEhs(scope.usuario.tipo_acesso, "integracao", "agendar")
  await assertNaoImpersonando()

  const integracao = await db.query.ehsIntegracoes.findFirst({ where: eq(ehsIntegracoes.id, id) })
  if (!integracao) return { success: false, error: "Integração não encontrada" }
  if (!scope.isSuperAdmin && integracao.empresaId !== scope.empresaId) return { success: false, error: "Sem permissão para esta integração" }
  const EDITAVEIS = ["agendado", "confirmado", "reagendado", "nao_compareceu"]
  if (!EDITAVEIS.includes(integracao.status)) {
    return { success: false, error: "Esta integração já está em um status final e não pode mais ser editada" }
  }

  await db
    .update(ehsIntegracoes)
    .set({
      dataAgendada: data.data_agendada ?? integracao.dataAgendada,
      horario: data.horario ?? integracao.horario,
      enderecoLocal: data.endereco_local ?? integracao.enderecoLocal,
      cidade: data.cidade ?? integracao.cidade,
      sala: data.sala ?? integracao.sala,
      local: data.local ?? integracao.local,
      responsavelId: data.responsavel_id ?? integracao.responsavelId,
      telefone: data.telefone ?? integracao.telefone,
      observacoes: data.observacoes ?? integracao.observacoes,
      tempoEstimadoMinutos: data.tempo_estimado_minutos ?? integracao.tempoEstimadoMinutos,
      updatedAt: new Date(),
    })
    .where(eq(ehsIntegracoes.id, id))

  await registrarAuditoriaEhs({ empresaId: integracao.empresaId, tabela: "ehs_integracoes", registroId: id, acao: "atualizado", atorId: scope.usuario.id })

  revalidatePath("/ehs/agenda")
  revalidatePath(`/ehs/integracoes/${id}`)
  return { success: true }
}

interface TransicaoExtra {
  novaData?: string
  novoHorario?: string | null
  dataValidade?: string
  motivo?: string
}

async function transicionarStatusIntegracaoEhs(id: string, novoStatus: string, extra: TransicaoExtra = {}) {
  const scope = await getTenantScope()
  await exigirPermissaoEhs(scope.usuario.tipo_acesso, "integracao", "agendar")
  await assertNaoImpersonando()

  const integracao = await db.query.ehsIntegracoes.findFirst({ where: eq(ehsIntegracoes.id, id), with: { cliente: true } })
  if (!integracao) return { success: false, error: "Integração não encontrada" }
  if (!scope.isSuperAdmin && integracao.empresaId !== scope.empresaId) return { success: false, error: "Sem permissão para esta integração" }

  const transicoesPermitidas = TRANSICOES_STATUS_INTEGRACAO[integracao.status] || []
  if (!transicoesPermitidas.includes(novoStatus)) {
    return { success: false, error: `Não é possível mudar de "${integracao.status}" para "${novoStatus}"` }
  }

  const patch: Record<string, unknown> = { status: novoStatus, updatedAt: new Date() }
  if (novoStatus === "confirmado") patch.confirmadoEm = new Date()
  if (novoStatus === "compareceu") patch.dataRealizada = new Date().toISOString().slice(0, 10)
  if (novoStatus === "concluido") {
    if (!extra.dataValidade) return { success: false, error: "Informe a data de validade da integração concluída" }
    patch.dataValidade = extra.dataValidade
  }
  if (novoStatus === "reagendado") {
    if (!extra.novaData) return { success: false, error: "Informe a nova data" }
    patch.dataAgendada = extra.novaData
    patch.horario = extra.novoHorario ?? null
  }
  if (novoStatus === "cancelado" && extra.motivo) {
    patch.observacoes = integracao.observacoes ? `${integracao.observacoes} · Cancelado: ${extra.motivo}` : `Cancelado: ${extra.motivo}`
  }

  await db.update(ehsIntegracoes).set(patch).where(eq(ehsIntegracoes.id, id))

  await registrarAuditoriaEhs({
    empresaId: integracao.empresaId,
    tabela: "ehs_integracoes",
    registroId: id,
    acao: "atualizado",
    atorId: scope.usuario.id,
    campo: "status",
    valorAntigo: integracao.status,
    valorNovo: novoStatus,
  })
  await registrarTimelineEhs({
    empresaId: integracao.empresaId,
    colaboradorId: integracao.colaboradorId,
    tipoEvento: "integracao_status",
    descricao: `Integração com ${integracao.cliente?.nome || "cliente"}: ${integracao.status} → ${novoStatus}`,
    atorId: scope.usuario.id,
  })

  revalidatePath("/ehs/agenda")
  revalidatePath("/ehs/integracoes")
  revalidatePath(`/ehs/integracoes/${id}`)
  revalidatePath(`/ehs/clientes/${integracao.clienteId}`)
  revalidatePath(`/ehs/prestadores/${integracao.colaboradorId}`)
  return { success: true }
}

export async function confirmarIntegracaoEhs(id: string) {
  return transicionarStatusIntegracaoEhs(id, "confirmado")
}

export async function marcarCompareceuIntegracaoEhs(id: string) {
  return transicionarStatusIntegracaoEhs(id, "compareceu")
}

export async function marcarNaoCompareceuIntegracaoEhs(id: string) {
  return transicionarStatusIntegracaoEhs(id, "nao_compareceu")
}

export async function reagendarIntegracaoEhs(id: string, novaData: string, novoHorario?: string | null) {
  return transicionarStatusIntegracaoEhs(id, "reagendado", { novaData, novoHorario })
}

export async function concluirIntegracaoEhs(id: string, dataValidade: string) {
  return transicionarStatusIntegracaoEhs(id, "concluido", { dataValidade })
}

export async function cancelarIntegracaoEhs(id: string, motivo?: string) {
  return transicionarStatusIntegracaoEhs(id, "cancelado", { motivo })
}
