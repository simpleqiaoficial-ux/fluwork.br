import { getUsuarioLogado } from "@/lib/auth-utils"
import { redirect } from "next/navigation"
import { obterMinhaEmpresa } from "@/app/actions/empresa-config"
import { EmpresaConfiguracoesForm } from "@/components/contratos/empresa-configuracoes-form"

export default async function ConfiguracoesEmpresaPage() {
  const usuario = await getUsuarioLogado()

  if (!usuario) redirect("/login")
  if (usuario.tipo_acesso !== "Adm") redirect("/contratos")

  const empresa = await obterMinhaEmpresa()

  return (
    <div className="container mx-auto px-4 lg:px-6 py-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-foreground">Configurações da empresa</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Dados usados como contratante e papel timbrado nos contratos enviados aos prestadores
        </p>
      </div>
      <EmpresaConfiguracoesForm empresa={empresa} />
    </div>
  )
}
