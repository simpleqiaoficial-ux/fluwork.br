import { getUsuarioLogado } from "@/lib/auth-utils"
import { redirect } from "next/navigation"
import { listarEmpresas } from "@/app/actions/empresas"
import { EmpresasList } from "@/components/admin/empresas-list"

export default async function AdminEmpresasPage() {
  const usuario = await getUsuarioLogado()

  if (!usuario) redirect("/login")
  if (usuario.tipo_acesso !== "SuperAdmin") redirect("/")

  const empresasList = await listarEmpresas()

  return (
    <div className="container mx-auto px-4 lg:px-6 py-8 max-w-5xl">
      <EmpresasList empresas={empresasList as any} />
    </div>
  )
}
