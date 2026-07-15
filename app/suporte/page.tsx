import Link from "next/link"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { listarMeusTickets } from "@/app/actions/support-tickets"
import { TicketList } from "@/components/support/ticket-list"

export default async function SuportePage() {
  const tickets = await listarMeusTickets()

  return (
    <div className="container mx-auto py-8 px-4 lg:px-6 max-w-5xl">
      <div className="mb-8 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Central de Suporte</h1>
          <p className="text-sm text-muted-foreground">Seus chamados de suporte</p>
        </div>
        <Button asChild className="gap-1.5 shrink-0">
          <Link href="/suporte/novo">
            <Plus className="h-4 w-4" />
            Abrir chamado
          </Link>
        </Button>
      </div>

      <TicketList tickets={tickets} />
    </div>
  )
}
