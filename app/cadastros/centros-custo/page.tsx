import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"
import { listarCentrosCusto } from "@/app/actions/centros-custo"
import { CentrosCustoList } from "@/components/centros-custo-list"

export default async function CentrosCustoPage() {
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  if (session.tipoAcesso !== "Adm" && session.tipoAcesso !== "Financeiro") {
    redirect("/")
  }

  const centros = await listarCentrosCusto()

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <CentrosCustoList centros={centros} />
    </div>
  )
}
