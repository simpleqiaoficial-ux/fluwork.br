import { redirect } from "next/navigation"
import { getUsuarioLogado } from "@/lib/auth-utils"
import { podeVisualizarPagina } from "@/lib/tenant"
import { listarTicketsEmpresa } from "@/app/actions/support-tickets"
import { TicketList } from "@/components/support/ticket-list"

export default async function SuporteEmpresaPage() {
  const usuario = await getUsuarioLogado()
  if (!usuario) redirect("/login")
  if (!podeVisualizarPagina(usuario, ["Adm"])) redirect("/suporte")

  const tickets = await listarTicketsEmpresa()

  return (
    <div className="container mx-auto py-8 px-4 lg:px-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-foreground">Chamados da empresa</h1>
        <p className="text-sm text-muted-foreground">Chamados de Nível 1 abertos pela sua equipe</p>
      </div>

      <TicketList tickets={tickets} mostrarSolicitante />
    </div>
  )
}
