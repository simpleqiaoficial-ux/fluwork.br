import { listarPedidosPendentes } from "@/app/actions/pedidos"
import { getUsuarioLogado } from "@/lib/auth-utils"
import { AprovacoesList } from "@/components/aprovacoes-list"
import { redirect } from "next/navigation"

export default async function AprovacoesPage() {
  const usuario = await getUsuarioLogado()

  if (!usuario) {
    redirect("/login")
  }

  if (!["Gerente", "Financeiro", "Adm"].includes(usuario.tipo_acesso)) {
    redirect("/")
  }

  let pedidos = []
  try {
    pedidos = await listarPedidosPendentes()
  } catch (error) {
    console.error("[v0] Erro ao carregar pedidos:", error)
  }

  return (
    <div className="container mx-auto px-4 lg:px-6 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold mb-1 text-foreground">Aprovacoes Pendentes</h1>
        <p className="text-sm text-muted-foreground">
          {usuario.tipo_acesso === "Gerente"
            ? "Aprove, recuse ou solicite correcoes nos pedidos de pagamento"
            : "Aprove ou recuse os pedidos ja aprovados pelo gerente"}
        </p>
      </div>

      <AprovacoesList pedidos={pedidos} tipoAcesso={usuario.tipo_acesso} />
    </div>
  )
}
