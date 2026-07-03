import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"
import { AceitesTermosList } from "@/components/aceites-termos-list"

export default async function AceitesPage() {
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  if (!["Adm", "Financeiro"].includes(session.tipoAcesso)) {
    redirect("/")
  }

  return (
    <div className="container mx-auto p-6">
      <AceitesTermosList />
    </div>
  )
}
