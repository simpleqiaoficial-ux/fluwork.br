import { listarEquipes } from "@/app/actions/equipes"
import { EquipesList } from "@/components/equipes-list"
import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { colaboradores } from "@/lib/db/schema"
import { isNotNull } from "drizzle-orm"

export default async function EquipesPage() {
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  if (!["Adm", "Financeiro"].includes(session.tipoAcesso)) {
    redirect("/")
  }

  const equipes = await listarEquipes()

  // Count members per team
  const counts = await db
    .select({ equipeId: colaboradores.equipeId })
    .from(colaboradores)
    .where(isNotNull(colaboradores.equipeId))

  const membrosCount: Record<string, number> = {}
  counts.forEach((c) => {
    if (c.equipeId) {
      membrosCount[c.equipeId] = (membrosCount[c.equipeId] || 0) + 1
    }
  })

  return (
    <div className="container mx-auto px-4 lg:px-6 py-8 max-w-5xl">
      <EquipesList equipes={equipes} membrosCount={membrosCount} />
    </div>
  )
}
