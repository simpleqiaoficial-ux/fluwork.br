import { getUsuarioLogado } from "@/lib/auth-utils"
import { redirect } from "next/navigation"
import { listarContratos } from "@/app/actions/contratos"
import { ContratosList } from "@/components/contratos/contratos-list"

export default async function ContratosPage() {
  const usuario = await getUsuarioLogado()

  if (!usuario) {
    redirect("/login")
  }

  if (!["Financeiro", "Adm"].includes(usuario.tipo_acesso)) {
    redirect("/")
  }

  const contratos = await listarContratos()

  return (
    <div className="container mx-auto px-4 lg:px-6 py-8 max-w-5xl">
      <ContratosList contratos={contratos as any} />
    </div>
  )
}
