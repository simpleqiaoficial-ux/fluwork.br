import { listarTodosPedidos } from "@/app/actions/pedidos"
import { listarEquipes } from "@/app/actions/equipes"
import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"
import { HistoricoCompletoList } from "@/components/historico-completo-list"

export default async function HistoricoCompletoPage() {
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  if (!["Adm", "Gerente", "Financeiro"].includes(session.tipoAcesso)) {
    redirect("/")
  }

  const [pedidos, equipes] = await Promise.all([listarTodosPedidos(), listarEquipes()])

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Histórico Completo de Pedidos</h1>
        <p className="text-muted-foreground">
          {session.tipoAcesso === "Gerente"
            ? "Visualize todos os pedidos das suas equipes"
            : "Visualize todos os pedidos de pagamento do sistema"}
        </p>
      </div>

      <HistoricoCompletoList pedidos={pedidos} equipes={equipes} />
    </div>
  )
}
