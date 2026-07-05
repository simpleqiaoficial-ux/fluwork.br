import { getUsuarioLogado } from "@/lib/auth-utils"
import { redirect } from "next/navigation"
import { listarContratos, getContratosDashboardStats } from "@/app/actions/contratos"
import { ContratosList } from "@/components/contratos/contratos-list"
import { ContratosDashboard } from "@/components/contratos/contratos-dashboard"

export default async function ContratosPage() {
  const usuario = await getUsuarioLogado()

  if (!usuario) {
    redirect("/login")
  }

  if (!["Financeiro", "Adm", "SuperAdmin"].includes(usuario.tipo_acesso)) {
    redirect("/")
  }

  const [contratos, stats] = await Promise.all([listarContratos(), getContratosDashboardStats()])

  return (
    <div className="container mx-auto px-4 lg:px-6 py-8 max-w-5xl space-y-6">
      <ContratosDashboard stats={stats} />
      <ContratosList contratos={contratos as any} tipoAcesso={usuario.tipo_acesso} />
    </div>
  )
}
