import { getUsuarioLogado } from "@/lib/auth-utils"
import { podeVisualizarPagina } from "@/lib/tenant"
import { redirect } from "next/navigation"
import { ReajustesPageContent } from "@/components/reajustes-page-content"

export default async function ReajustesPage() {
  const usuario = await getUsuarioLogado()

  if (!usuario) {
    redirect("/login")
  }

  if (!podeVisualizarPagina(usuario, ["Financeiro", "Adm"])) {
    redirect("/")
  }

  return <ReajustesPageContent />
}
