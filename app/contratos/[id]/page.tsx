import { getUsuarioLogado } from "@/lib/auth-utils"
import { redirect, notFound } from "next/navigation"
import { getContratoById } from "@/app/actions/contratos"
import { ContratoDetail } from "@/components/contratos/contrato-detail"

export default async function ContratoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const usuario = await getUsuarioLogado()

  if (!usuario) {
    redirect("/login")
  }

  if (!["Financeiro", "Adm"].includes(usuario.tipo_acesso)) {
    redirect("/")
  }

  const { id } = await params
  const contrato = await getContratoById(id)

  if (!contrato) {
    notFound()
  }

  return (
    <div className="container mx-auto px-4 lg:px-6 py-8 max-w-4xl">
      <ContratoDetail contrato={contrato} />
    </div>
  )
}
