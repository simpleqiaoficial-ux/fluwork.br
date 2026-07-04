import { getUsuarioLogado } from "@/lib/auth-utils"
import { redirect, notFound } from "next/navigation"
import { getEmpresaById, getEmpresaStats } from "@/app/actions/empresas"
import { EmpresaDetail } from "@/components/admin/empresa-detail"

export default async function EmpresaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const usuario = await getUsuarioLogado()

  if (!usuario) redirect("/login")
  if (usuario.tipo_acesso !== "SuperAdmin") redirect("/")

  const { id } = await params
  const empresa = await getEmpresaById(id)
  if (!empresa) notFound()

  const stats = await getEmpresaStats(id)

  return (
    <div className="container mx-auto px-4 lg:px-6 py-8 max-w-4xl">
      <EmpresaDetail empresa={empresa} stats={stats} />
    </div>
  )
}
