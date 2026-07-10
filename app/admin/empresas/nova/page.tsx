import { getUsuarioLogado } from "@/lib/auth-utils"
import { redirect } from "next/navigation"
import { NovaEmpresaForm } from "@/components/admin/nova-empresa-form"

export default async function NovaEmpresaPage() {
  const usuario = await getUsuarioLogado()

  if (!usuario) redirect("/login")
  if (usuario.tipo_acesso !== "SuperAdmin") redirect("/")

  return (
    <div className="container mx-auto px-4 lg:px-6 py-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-foreground">Nova empresa</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Cria a empresa cliente e o primeiro usuário administrador dela
        </p>
      </div>
      <NovaEmpresaForm />
    </div>
  )
}
