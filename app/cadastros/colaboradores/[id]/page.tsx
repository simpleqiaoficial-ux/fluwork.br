import { getUsuarioLogado } from "@/lib/auth-utils"
import { redirect, notFound } from "next/navigation"
import { getColaboradorById } from "@/app/actions/colaboradores"
import { listarContratosDoColaborador } from "@/app/actions/contratos"
import { ColaboradorProfileTabs } from "@/components/colaborador-profile-tabs"

export default async function ColaboradorProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const usuario = await getUsuarioLogado()

  if (!usuario) {
    redirect("/login")
  }

  if (!["Adm", "Financeiro", "SuperAdmin"].includes(usuario.tipo_acesso)) {
    redirect("/")
  }

  const { id } = await params
  const colaborador = await getColaboradorById(id)

  if (!colaborador) {
    notFound()
  }

  const contratos = await listarContratosDoColaborador(id)

  return (
    <div className="container mx-auto px-4 lg:px-6 py-8 max-w-4xl">
      <ColaboradorProfileTabs colaborador={colaborador as any} contratos={contratos as any} />
    </div>
  )
}
