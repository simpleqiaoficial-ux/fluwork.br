import { getUsuarioLogado } from "@/lib/auth-utils"
import { redirect } from "next/navigation"
import { listarEmpresasComModulos } from "@/app/actions/modulos"
import { ModulosAdminList } from "@/components/admin/modulos-admin-list"

export default async function AdminModulosPage() {
  const usuario = await getUsuarioLogado()

  if (!usuario) redirect("/login")
  if (usuario.tipo_acesso !== "SuperAdmin") redirect("/")

  const empresas = await listarEmpresasComModulos()

  return (
    <div className="container mx-auto px-4 lg:px-6 py-8 max-w-5xl">
      <ModulosAdminList empresas={empresas} />
    </div>
  )
}
