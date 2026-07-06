import { listarPedidosPendentes } from "@/app/actions/pedidos"
import { getUsuarioLogado } from "@/lib/auth-utils"
import { podeVisualizarPagina } from "@/lib/tenant"
import { AprovacoesList } from "@/components/aprovacoes-list"
import { redirect } from "next/navigation"

export default async function AprovacoesPage() {
  const usuario = await getUsuarioLogado()

  if (!usuario) {
    redirect("/login")
  }

  if (!podeVisualizarPagina(usuario, ["Gerente", "Financeiro", "Adm"])) {
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
        <h1 className="text-2xl font-semibold mb-1 text-foreground">Aprovações Pendentes</h1>
        <p className="text-sm text-muted-foreground">
          {usuario.tipo_acesso === "Gerente"
            ? "Aprove, recuse ou solicite correções nos pedidos de pagamento"
            : "Aprove ou recuse os pedidos já aprovados pelo gerente"}
        </p>
      </div>

      <AprovacoesList pedidos={pedidos} tipoAcesso={usuario.tipo_acesso} />
    </div>
  )
}
