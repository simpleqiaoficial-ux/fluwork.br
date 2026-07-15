import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/ui/status-badge"
import { getTicketById } from "@/app/actions/support-tickets"
import { listarMensagensTicket } from "@/app/actions/support-messages"
import { listarAnexosTicket } from "@/app/actions/support-attachments"
import { getCurrentUser } from "@/lib/tenant"
import { getLabelCategoriaSuporte } from "@/lib/support/categorias"
import { listarAuditoriaTicket } from "@/lib/support/auditoria"
import { TicketThread } from "@/components/support/ticket-thread"
import { TicketAgentPanel } from "@/components/support/ticket-agent-panel"
import { ReabrirTicketButton } from "@/components/support/reabrir-ticket-button"
import { TicketAuditTab } from "@/components/support/ticket-audit-tab"

const STATUS_ENCERRADOS = ["resolvido", "fechado", "arquivado"]

export default async function TicketDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const ticket = await getTicketById(id)
  if (!ticket) notFound()

  const [mensagens, anexos, usuario] = await Promise.all([listarMensagensTicket(id), listarAnexosTicket(id), getCurrentUser()])

  const ehDono = usuario?.id === ticket.criado_por_id
  const ehAgente = !!usuario && (usuario.tipo_acesso === "SuperAdmin" || (usuario.tipo_acesso === "Adm" && ticket.empresa_id === usuario.empresa_id))
  const statusEncerrado = STATUS_ENCERRADOS.includes(ticket.status)
  const auditoria = ehAgente ? await listarAuditoriaTicket(id) : []

  return (
    <div className="container mx-auto py-8 px-4 lg:px-6 max-w-4xl">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/suporte">
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground font-mono">{ticket.numero}</p>
          <h1 className="text-lg font-semibold text-foreground truncate">{ticket.titulo}</h1>
        </div>
        <StatusBadge entity="chamado" status={ticket.status} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-md border p-4 text-sm space-y-1">
            <p className="text-muted-foreground">
              {getLabelCategoriaSuporte(ticket.categoria)}
              {ticket.subcategoria ? ` · ${ticket.subcategoria}` : ""}
            </p>
            <p className="whitespace-pre-wrap">{ticket.descricao}</p>
          </div>

          <TicketThread
            ticketId={id}
            mensagens={mensagens}
            anexos={anexos}
            ehAgente={ehAgente}
            podeResponder={ehDono || ehAgente}
            statusEncerrado={statusEncerrado}
          />

          {ehDono && statusEncerrado && <ReabrirTicketButton ticketId={id} />}
        </div>

        {ehAgente && (
          <div className="space-y-4">
            <TicketAgentPanel ticket={ticket} ehSuperAdmin={usuario?.tipo_acesso === "SuperAdmin"} />
            <TicketAuditTab registros={auditoria} />
          </div>
        )}
      </div>
    </div>
  )
}
