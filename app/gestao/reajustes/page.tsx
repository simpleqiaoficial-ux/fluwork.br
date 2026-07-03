import { getUsuarioLogado } from "@/lib/auth-utils"
import { redirect } from "next/navigation"
import { ReajustesPageContent } from "@/components/reajustes-page-content"

export default async function ReajustesPage() {
  const usuario = await getUsuarioLogado()

  if (!usuario) {
    redirect("/login")
  }

  if (!["Financeiro", "Adm"].includes(usuario.tipo_acesso)) {
    redirect("/")
  }

  return <ReajustesPageContent />
}
