"use server"

import { revalidatePath } from "next/cache"
import { and, desc, eq, inArray, sql } from "drizzle-orm"
import { db } from "@/lib/db"
import { supportTickets, supportRetentionConfig, colaboradores } from "@/lib/db/schema"
import { getTenantScope, assertNaoImpersonando, requireSuperAdmin } from "@/lib/tenant"
import { classificarTicket } from "@/lib/support/routing"
import { calcularPrioridadeInicial } from "@/lib/support/prioridade"
import { getCategoriaSuporte } from "@/lib/support/categorias"
import { toTicketSuporteDTO } from "@/lib/db/mappers"
import { registrarAuditoriaSuporte } from "@/lib/support/auditoria"
import {
  sendTicketCriadoEmail,
  sendTicketAtendimentoIniciadoEmail,
  sendTicketAguardandoUsuarioEmail,
  sendTicketResolvidoEmail,
  sendTicketFechadoEmail,
} from "@/lib/email"

function linkTicket(id: string) {
  return `${process.env.APP_BASE_URL || ""}/suporte/${id}`
}

const JANELA_REABERTURA_DIAS = 7
const DIAS_RETENCAO_DEFAULT = 90
const STATUS_ABERTOS = ["novo", "em_triagem", "em_atendimento", "aguardando_usuario", "aguardando_empresa", "aguardando_fluwork", "reaberto"]

interface CriarTicketInput {
  titulo: string
  categoria: string
  subcategoria?: string | null
  descricao: string
  relatedEntityType?: "PEDIDO" | "NOTA_FISCAL" | "CONTRATO" | "COLABORADOR" | "NONE"
  relatedEntityId?: string | null
  origem?: "manual" | "erro_automatico"
  contextoErro?: { message: string; digest: string | null; pathname: string | null } | null
}

/** Criação — nivelSuporte/equipeResponsavel/prioridade são sempre calculados aqui no servidor
 *  a partir da categoria, nunca aceitos do cliente. */
export async function criarTicket(input: CriarTicketInput) {
  const scope = await getTenantScope()
  await assertNaoImpersonando()

  if (scope.usuario.tipo_acesso === "SuperAdmin") {
    return { success: false, error: "SuperAdmin não abre chamado pessoal — chamados chegam para atendimento" }
  }
  if (!input.titulo?.trim()) return { success: false, error: "Informe um título" }
  if (!input.descricao?.trim()) return { success: false, error: "Descreva o problema" }
  if (!getCategoriaSuporte(input.categoria)) return { success: false, error: "Categoria inválida" }

  const relatedEntityType = input.relatedEntityType || "NONE"
  const relatedEntityId = relatedEntityType === "NONE" ? null : input.relatedEntityId || null

  // Aviso básico de duplicidade — mesmo usuário + categoria + item relacionado + chamado ainda
  // aberto. Não bloqueia a criação, só sinaliza (o usuário decide se quer abrir mesmo assim).
  const duplicado = await db.query.supportTickets.findFirst({
    where: and(
      eq(supportTickets.criadoPorId, scope.usuario.id),
      eq(supportTickets.categoria, input.categoria),
      relatedEntityId ? eq(supportTickets.relatedEntityId, relatedEntityId) : sql`${supportTickets.relatedEntityId} IS NULL`,
      inArray(supportTickets.status, STATUS_ABERTOS),
    ),
  })

  const { nivelSuporte, equipeResponsavel } = classificarTicket(input.categoria)
  const prioridade = calcularPrioridadeInicial(input.categoria)

  const [novoTicket] = await db
    .insert(supportTickets)
    .values({
      empresaId: scope.usuario.empresa_id,
      criadoPorId: scope.usuario.id,
      titulo: input.titulo.trim(),
      categoria: input.categoria,
      subcategoria: input.subcategoria || null,
      descricao: input.descricao.trim(),
      nivelSuporte,
      equipeResponsavel,
      prioridade,
      relatedEntityType,
      relatedEntityId,
      origem: input.origem || "manual",
      contextoErro: input.contextoErro || null,
    })
    .returning()

  await registrarAuditoriaSuporte({
    ticketId: novoTicket.id,
    acao: "TICKET_CREATED",
    atorId: scope.usuario.id,
    campo: "status",
    valorNovo: "novo",
  })

  const dto = toTicketSuporteDTO(novoTicket)

  if (scope.usuario.email) {
    try {
      await sendTicketCriadoEmail({
        to: scope.usuario.email,
        nomeSolicitante: scope.usuario.nome_completo,
        numero: dto.numero,
        titulo: novoTicket.titulo,
        ticketUrl: linkTicket(novoTicket.id),
      })
    } catch (error) {
      console.error("[support] Erro ao enviar e-mail de chamado criado:", error)
    }
  }

  revalidatePath("/suporte")
  return { success: true, ticketId: novoTicket.id, numero: dto.numero, duplicadoAviso: !!duplicado }
}

export async function listarMeusTickets() {
  const scope = await getTenantScope()
  const rows = await db.query.supportTickets.findMany({
    where: eq(supportTickets.criadoPorId, scope.usuario.id),
    orderBy: [desc(supportTickets.createdAt)],
  })
  return rows.map(toTicketSuporteDTO)
}

/** Fila do Adm da empresa — só chamados Nível 1 do próprio tenant. */
export async function listarTicketsEmpresa() {
  const scope = await getTenantScope()
  if (scope.usuario.tipo_acesso !== "Adm" && !scope.isSuperAdmin) {
    throw new Error("Sem permissão para ver a fila de chamados da empresa")
  }
  const empresaId = scope.empresaId
  if (!empresaId) throw new Error("Nenhuma empresa selecionada")

  const rows = await db.query.supportTickets.findMany({
    where: and(eq(supportTickets.empresaId, empresaId), eq(supportTickets.nivelSuporte, "nivel_1")),
    orderBy: [desc(supportTickets.createdAt)],
    with: { criadoPorColaborador: true, assumidoPorColaborador: true },
  })
  return rows.map(toTicketSuporteDTO)
}

/** Fila global do SuperAdmin — Nível 2 (inclui os que foram escalados, já que escalar muda
 *  nivelSuporte pra nivel_2), com filtro opcional por empresa. */
export async function listarTicketsGlobal(filtroEmpresaId?: string) {
  await requireSuperAdmin()

  const rows = await db.query.supportTickets.findMany({
    where: and(eq(supportTickets.nivelSuporte, "nivel_2"), filtroEmpresaId ? eq(supportTickets.empresaId, filtroEmpresaId) : undefined),
    orderBy: [desc(supportTickets.createdAt)],
    with: { criadoPorColaborador: true, assumidoPorColaborador: true, empresa: true },
  })
  return rows.map(toTicketSuporteDTO)
}

export async function getTicketById(id: string) {
  const scope = await getTenantScope()
  const ticket = await db.query.supportTickets.findFirst({
    where: eq(supportTickets.id, id),
    with: { criadoPorColaborador: true, assumidoPorColaborador: true, empresa: true },
  })
  if (!ticket) return null

  const ehDono = ticket.criadoPorId === scope.usuario.id
  const ehAdmDoTenant = scope.usuario.tipo_acesso === "Adm" && ticket.empresaId === scope.usuario.empresa_id
  if (!ehDono && !ehAdmDoTenant && !scope.isSuperAdmin) {
    throw new Error("Sem permissão para acessar este chamado")
  }

  return toTicketSuporteDTO(ticket)
}

async function exigirAgenteDoTicket(ticket: { empresaId: string | null }, scope: Awaited<ReturnType<typeof getTenantScope>>) {
  const ehAgente = scope.isSuperAdmin || (scope.usuario.tipo_acesso === "Adm" && ticket.empresaId === scope.usuario.empresa_id)
  if (!ehAgente) throw new Error("Sem permissão para este chamado")
}

export async function atualizarStatusTicket(id: string, novoStatus: string) {
  const scope = await getTenantScope()
  await assertNaoImpersonando()

  const ticket = await db.query.supportTickets.findFirst({ where: eq(supportTickets.id, id) })
  if (!ticket) return { success: false, error: "Chamado não encontrado" }

  try {
    await exigirAgenteDoTicket(ticket, scope)
  } catch {
    return { success: false, error: "Sem permissão para alterar este chamado" }
  }

  const agora = new Date()
  const patch: Record<string, unknown> = { status: novoStatus, updatedAt: agora }
  if (!ticket.firstResponseAt && ["em_triagem", "em_atendimento", "aguardando_usuario"].includes(novoStatus)) {
    patch.firstResponseAt = agora
  }
  if (novoStatus === "resolvido") patch.resolvedAt = agora
  if (novoStatus === "fechado") patch.closedAt = agora

  await db.update(supportTickets).set(patch).where(eq(supportTickets.id, id))

  await registrarAuditoriaSuporte({
    ticketId: id,
    acao: novoStatus === "resolvido" ? "TICKET_RESOLVED" : novoStatus === "fechado" ? "TICKET_CLOSED" : "STATUS_CHANGED",
    atorId: scope.usuario.id,
    campo: "status",
    valorAntigo: ticket.status,
    valorNovo: novoStatus,
  })

  // E-mail automático de mudança de status pro solicitante — nunca bloqueia a operação principal.
  const statusComEmail = ["em_atendimento", "aguardando_usuario", "resolvido", "fechado"]
  if (statusComEmail.includes(novoStatus) && ticket.status !== novoStatus) {
    try {
      const [criador] = await db
        .select({ email: colaboradores.email, nomeCompleto: colaboradores.nomeCompleto })
        .from(colaboradores)
        .where(eq(colaboradores.id, ticket.criadoPorId))
      if (criador?.email) {
        const numero = toTicketSuporteDTO(ticket).numero
        const emailParams = { to: criador.email, nomeSolicitante: criador.nomeCompleto, numero, ticketUrl: linkTicket(id) }
        if (novoStatus === "em_atendimento") await sendTicketAtendimentoIniciadoEmail(emailParams)
        else if (novoStatus === "aguardando_usuario") await sendTicketAguardandoUsuarioEmail(emailParams)
        else if (novoStatus === "resolvido") await sendTicketResolvidoEmail(emailParams)
        else if (novoStatus === "fechado") await sendTicketFechadoEmail(emailParams)
      }
    } catch (error) {
      console.error("[support] Erro ao enviar e-mail de status do chamado:", error)
    }
  }

  revalidatePath(`/suporte/${id}`)
  revalidatePath("/suporte")
  revalidatePath("/suporte/empresa")
  revalidatePath("/admin/suporte")
  return { success: true }
}

export async function assumirTicket(id: string) {
  const scope = await getTenantScope()
  await assertNaoImpersonando()

  const ticket = await db.query.supportTickets.findFirst({ where: eq(supportTickets.id, id) })
  if (!ticket) return { success: false, error: "Chamado não encontrado" }

  try {
    await exigirAgenteDoTicket(ticket, scope)
  } catch {
    return { success: false, error: "Sem permissão para assumir este chamado" }
  }

  await db
    .update(supportTickets)
    .set({
      assumidoPorId: scope.usuario.id,
      status: ["novo", "em_triagem"].includes(ticket.status) ? "em_atendimento" : ticket.status,
      updatedAt: new Date(),
    })
    .where(eq(supportTickets.id, id))

  await registrarAuditoriaSuporte({ ticketId: id, acao: "TICKET_ASSIGNED", atorId: scope.usuario.id, campo: "assumido_por_id", valorNovo: scope.usuario.id })

  revalidatePath(`/suporte/${id}`)
  revalidatePath("/suporte/empresa")
  revalidatePath("/admin/suporte")
  return { success: true }
}

/** Escala um chamado Nível 1 para Nível 2 — preserva histórico/mensagens/anexos (nunca cria
 *  um chamado novo), só muda o roteamento. Só o Adm da própria empresa pode escalar. */
export async function escalarTicket(id: string, motivo: string) {
  const scope = await getTenantScope()
  await assertNaoImpersonando()

  if (scope.usuario.tipo_acesso !== "Adm") return { success: false, error: "Só o Administrador da empresa pode escalar um chamado" }

  const ticket = await db.query.supportTickets.findFirst({ where: eq(supportTickets.id, id) })
  if (!ticket) return { success: false, error: "Chamado não encontrado" }
  if (ticket.empresaId !== scope.usuario.empresa_id) return { success: false, error: "Sem permissão para este chamado" }
  if (ticket.nivelSuporte === "nivel_2") return { success: false, error: "Este chamado já está no nível 2" }

  await db
    .update(supportTickets)
    .set({ nivelSuporte: "nivel_2", equipeResponsavel: "fluwork", status: "em_triagem", escalationReason: motivo || null, updatedAt: new Date() })
    .where(eq(supportTickets.id, id))

  await registrarAuditoriaSuporte({
    ticketId: id,
    acao: "TICKET_ESCALATED",
    atorId: scope.usuario.id,
    campo: "nivel_suporte",
    valorAntigo: "nivel_1",
    valorNovo: "nivel_2",
  })

  revalidatePath(`/suporte/${id}`)
  revalidatePath("/suporte/empresa")
  return { success: true }
}

/** Devolve um chamado escalado de volta para a empresa — só o SuperAdmin, sempre com
 *  justificativa (auditável). */
export async function devolverTicket(id: string, justificativa: string) {
  const scope = await getTenantScope()
  await assertNaoImpersonando()

  if (!scope.isSuperAdmin) return { success: false, error: "Só o time FluWork pode devolver um chamado" }
  if (!justificativa?.trim()) return { success: false, error: "Informe uma justificativa" }

  const ticket = await db.query.supportTickets.findFirst({ where: eq(supportTickets.id, id) })
  if (!ticket) return { success: false, error: "Chamado não encontrado" }
  if (ticket.nivelSuporte !== "nivel_2") return { success: false, error: "Este chamado não está no nível 2" }

  await db
    .update(supportTickets)
    .set({ nivelSuporte: "nivel_1", equipeResponsavel: "empresa", status: "em_triagem", escalationReason: justificativa.trim(), updatedAt: new Date() })
    .where(eq(supportTickets.id, id))

  await registrarAuditoriaSuporte({
    ticketId: id,
    acao: "TICKET_RETURNED",
    atorId: scope.usuario.id,
    campo: "nivel_suporte",
    valorAntigo: "nivel_2",
    valorNovo: "nivel_1",
  })

  revalidatePath(`/suporte/${id}`)
  revalidatePath("/admin/suporte")
  return { success: true }
}

/** Reabertura — só quem abriu o chamado originalmente, e só dentro da janela de dias configurada. */
export async function reabrirTicket(id: string) {
  const scope = await getTenantScope()
  await assertNaoImpersonando()

  const ticket = await db.query.supportTickets.findFirst({ where: eq(supportTickets.id, id) })
  if (!ticket) return { success: false, error: "Chamado não encontrado" }
  if (ticket.criadoPorId !== scope.usuario.id) return { success: false, error: "Só quem abriu o chamado pode reabri-lo" }
  if (!["resolvido", "fechado"].includes(ticket.status)) return { success: false, error: "Este chamado não pode ser reaberto" }

  const referencia = ticket.resolvedAt || ticket.closedAt
  if (referencia) {
    const diasPassados = (Date.now() - new Date(referencia).getTime()) / (1000 * 60 * 60 * 24)
    if (diasPassados > JANELA_REABERTURA_DIAS) {
      return { success: false, error: `O prazo de ${JANELA_REABERTURA_DIAS} dias para reabertura já passou. Abra um novo chamado.` }
    }
  }

  await db
    .update(supportTickets)
    .set({ status: "reaberto", reopenedCount: ticket.reopenedCount + 1, resolvedAt: null, closedAt: null, updatedAt: new Date() })
    .where(eq(supportTickets.id, id))

  await registrarAuditoriaSuporte({ ticketId: id, acao: "TICKET_REOPENED", atorId: scope.usuario.id, campo: "status", valorAntigo: ticket.status, valorNovo: "reaberto" })

  revalidatePath(`/suporte/${id}`)
  return { success: true }
}

/** Gatilho manual de retenção (Fase 1 — sem scheduler ainda, ver plano). Arquiva chamados
 *  resolvidos/fechados há mais tempo do que o configurado, por empresa (ou o default da
 *  plataforma quando a empresa não tem override em support_retention_config). */
export async function arquivarTicketsElegiveis() {
  await requireSuperAdmin()

  const configs = await db.select().from(supportRetentionConfig)
  const configPorEmpresa = new Map(configs.filter((c) => c.empresaId).map((c) => [c.empresaId as string, c]))
  const configDefault = configs.find((c) => !c.empresaId)

  const candidatos = await db.query.supportTickets.findMany({
    where: and(inArray(supportTickets.status, ["resolvido", "fechado"]), sql`${supportTickets.archivedAt} IS NULL`),
  })

  let arquivados = 0
  for (const ticket of candidatos) {
    const referencia = ticket.closedAt || ticket.resolvedAt
    if (!referencia) continue
    const dias = (ticket.empresaId && configPorEmpresa.get(ticket.empresaId)?.diasParaArquivar) || configDefault?.diasParaArquivar || DIAS_RETENCAO_DEFAULT
    const diasPassados = (Date.now() - new Date(referencia).getTime()) / (1000 * 60 * 60 * 24)
    if (diasPassados >= dias) {
      await db.update(supportTickets).set({ status: "arquivado", archivedAt: new Date() }).where(eq(supportTickets.id, ticket.id))
      await registrarAuditoriaSuporte({ ticketId: ticket.id, acao: "TICKET_ARCHIVED", atorId: null, campo: "status", valorAntigo: ticket.status, valorNovo: "arquivado" })
      arquivados++
    }
  }

  revalidatePath("/admin/suporte")
  return { success: true, arquivados }
}
