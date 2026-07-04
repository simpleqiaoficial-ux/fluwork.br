import { getUsuarioLogado } from "@/lib/auth-utils"
import { redirect } from "next/navigation"
import { NovoContratoWizard } from "@/components/contratos/novo-contrato-wizard"

export default async function NovoContratoPage() {
  const usuario = await getUsuarioLogado()

  if (!usuario) {
    redirect("/login")
  }

  if (!["Financeiro", "Adm"].includes(usuario.tipo_acesso)) {
    redirect("/")
  }

  return (
    <div className="container mx-auto px-4 lg:px-6 py-8 max-w-2xl">
      <NovoContratoWizard />
    </div>
  )
}
