import { listarPedidosPorSupervisor } from "@/app/actions/pedidos"
import { getUsuarioLogado } from "@/lib/auth-utils"
import { NotasEnviadasList } from "@/components/notas-enviadas-list"
import { redirect } from "next/navigation"

export default async function SupervisorNotasEquipePage() {
  const usuario = await getUsuarioLogado()

  if (!usuario) {
    redirect("/login")
  }

  if (usuario.tipo_acesso !== "Supervisor") {
    redirect("/")
  }

  let pedidos = []
  try {
    pedidos = await listarPedidosPorSupervisor(usuario.id)
  } catch (error) {
    console.error("[v0] Erro ao carregar pedidos da equipe:", error)
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-3 text-balance">Notas da Minha Equipe</h1>
        <p className="text-lg text-muted-foreground">
          Acompanhe as notas fiscais e pagamentos dos colaboradores da sua equipe
        </p>
      </div>

      <NotasEnviadasList pedidos={pedidos} canApprove={false} />
    </div>
  )
}
