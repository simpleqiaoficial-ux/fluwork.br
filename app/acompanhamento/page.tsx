import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"
import { listarPedidosComNotaPendente } from "@/app/actions/pedidos"
import { AcompanhamentoPendenciasList } from "@/components/acompanhamento-pendencias-list"

export default async function AcompanhamentoPage() {
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  // Apenas Supervisor, Gerente, Financeiro e Adm podem acessar
  if (!["Supervisor", "Gerente", "Financeiro", "Adm"].includes(session.tipoAcesso)) {
    redirect("/")
  }

  const pedidosPendentes = await listarPedidosComNotaPendente()

  return (
    <div className="container mx-auto px-4 lg:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold mb-1 text-foreground">Aguardando Nota Fiscal</h1>
        <p className="text-sm text-muted-foreground">
          Prestadores com pagamento aprovado que ainda não emitiram ou anexaram a nota fiscal
        </p>
      </div>

      <AcompanhamentoPendenciasList pedidos={pedidosPendentes as any} />
    </div>
  )
}
