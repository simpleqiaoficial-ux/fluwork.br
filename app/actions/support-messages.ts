"use server"

import { revalidatePath } from "next/cache"
import { asc, eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { supportTickets, supportMessages, colaboradores } from "@/lib/db/schema"
import { getTenantScope, assertNaoImpersonando } from "@/lib/tenant"
import { toMensagemSuporteDTO, toTicketSuporteDTO } from "@/lib/db/mappers"
import { registrarAuditoriaSuporte } from "@/lib/support/auditoria"
import { sendTicketNovaRespostaEmail } from "@/lib/email"

const STATUS_ENCERRADOS = ["resolvido", "fechado", "arquivado"]

/** Envia uma mensagem na thread do chamado. "nota_interna" só pra agentes (Adm do tenant/
 *  SuperAdmin) — nunca aceita esse tipo de quem abriu o chamado. Alterna automaticamente
 *  quem está "com a bola" (aguardando_usuario/aguardando_empresa/aguardando_fluwork). */
export async function enviarMensagem(ticketId: string, corpo: string, tipo: "mensagem" | "nota_interna" = "mensagem") {
  const scope = await getTenantScope()
  await assertNaoImpersonando()

  if (!corpo?.trim()) return { success: false, error: "Escreva uma mensagem" }

  const ticket = await db.query.supportTickets.findFirst({ where: eq(supportTickets.id, ticketId) })
  if (!ticket) return { success: false, error: "Chamado não encontrado" }

  const ehDono = ticket.criadoPorId === scope.usuario.id
  const ehAgente = scope.isSuperAdmin || (scope.usuario.tipo_acesso === "Adm" && ticket.empresaId === scope.usuario.empresa_id)
  if (!ehDono && !ehAgente) return { success: false, error: "Sem permissão para responder este chamado" }
  if (tipo === "nota_interna" && !ehAgente) return { success: false, error: "Só agentes podem criar notas internas" }
  if (STATUS_ENCERRADOS.includes(ticket.status) && tipo !== "nota_interna") {
    return { success: false, error: "Este chamado está encerrado — reabra para continuar a conversa" }
  }

  const [novaMensagem] = await db
    .insert(supportMessages)
    .values({ ticketId, autorId: scope.usuario.id, tipo, corpo: corpo.trim() })
    .returning()

  if (tipo === "mensagem") {
    const novoStatus = ehDono ? (ticket.equipeResponsavel === "empresa" ? "aguardando_empresa" : "aguardando_fluwork") : "aguardando_usuario"
    await db.update(supportTickets).set({ status: novoStatus, updatedAt: new Date() }).where(eq(supportTickets.id, ticketId))
  }

  await registrarAuditoriaSuporte({
    ticketId,
    acao: tipo === "nota_interna" ? "INTERNAL_NOTE_CREATED" : "MESSAGE_SENT",
    atorId: scope.usuario.id,
  })

  // Só avisa o solicitante quando quem respondeu foi um agente — o solicitante já acompanha
  // a própria fila, não precisa de e-mail toda vez que ele mesmo escreve.
  if (tipo === "mensagem" && ehAgente && !ehDono) {
    try {
      const [criador] = await db
        .select({ email: colaboradores.email, nomeCompleto: colaboradores.nomeCompleto })
        .from(colaboradores)
        .where(eq(colaboradores.id, ticket.criadoPorId))
      if (criador?.email) {
        await sendTicketNovaRespostaEmail({
          to: criador.email,
          nomeDestinatario: criador.nomeCompleto,
          numero: toTicketSuporteDTO(ticket).numero,
          ticketUrl: `${process.env.APP_BASE_URL || ""}/suporte/${ticketId}`,
        })
      }
    } catch (error) {
      console.error("[support] Erro ao enviar e-mail de nova resposta:", error)
    }
  }

  revalidatePath(`/suporte/${ticketId}`)
  return { success: true, mensagemId: novaMensagem.id }
}

/** Thread do chamado — "nota_interna" é filtrada aqui no servidor pra quem não é agente,
 *  nunca no cliente. */
export async function listarMensagensTicket(ticketId: string) {
  const scope = await getTenantScope()

  const ticket = await db.query.supportTickets.findFirst({ where: eq(supportTickets.id, ticketId) })
  if (!ticket) throw new Error("Chamado não encontrado")

  const ehDono = ticket.criadoPorId === scope.usuario.id
  const ehAgente = scope.isSuperAdmin || (scope.usuario.tipo_acesso === "Adm" && ticket.empresaId === scope.usuario.empresa_id)
  if (!ehDono && !ehAgente) throw new Error("Sem permissão para acessar este chamado")

  const rows = await db.query.supportMessages.findMany({
    where: eq(supportMessages.ticketId, ticketId),
    orderBy: [asc(supportMessages.createdAt)],
    with: { autor: true },
  })

  const visiveis = ehAgente ? rows : rows.filter((r) => r.tipo !== "nota_interna")
  return visiveis.map(toMensagemSuporteDTO)
}
