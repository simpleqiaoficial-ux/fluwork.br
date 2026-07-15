import { redirect } from "next/navigation"
import { getUsuarioLogado } from "@/lib/auth-utils"
import { listarTicketsGlobal } from "@/app/actions/support-tickets"
import { TicketList } from "@/components/support/ticket-list"
import { ArquivarElegiveisButton } from "@/components/support/arquivar-elegiveis-button"

export default async function AdminSuportePage() {
  const usuario = await getUsuarioLogado()
  if (!usuario) redirect("/login")
  if (usuario.tipo_acesso !== "SuperAdmin") redirect("/")

  const tickets = await listarTicketsGlobal()

  return (
    <div className="container mx-auto py-8 px-4 lg:px-6 max-w-6xl">
      <div className="mb-8 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Chamados de suporte (Nível 2)</h1>
          <p className="text-sm text-muted-foreground">Chamados técnicos e escalados de todas as empresas</p>
        </div>
        <ArquivarElegiveisButton />
      </div>

      <TicketList tickets={tickets} mostrarSolicitante mostrarEmpresa />
    </div>
  )
}
