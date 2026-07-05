import { getUsuarioLogado } from "@/lib/auth-utils"
import { redirect } from "next/navigation"
import { NovoContratoWizard } from "@/components/contratos/novo-contrato-wizard"
import { obterEmpresaAtual } from "@/app/actions/contratos"
import { listarEquipes } from "@/app/actions/equipes"

export default async function NovoContratoPage() {
  const usuario = await getUsuarioLogado()

  if (!usuario) {
    redirect("/login")
  }

  if (!["Financeiro", "Adm"].includes(usuario.tipo_acesso)) {
    redirect("/")
  }

  const [empresa, equipes] = await Promise.all([obterEmpresaAtual(), listarEquipes()])

  return (
    <div className="container mx-auto px-4 lg:px-6 py-8 max-w-2xl">
      <NovoContratoWizard empresa={empresa as any} equipes={equipes.map((e) => ({ id: e.id, nome: e.nome }))} />
    </div>
  )
}
