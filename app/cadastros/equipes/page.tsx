import { listarEquipes } from "@/app/actions/equipes"
import { EquipesList } from "@/components/equipes-list"
import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"
import { createAdminClient } from "@/lib/supabase-server"

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
  const supabase = await createAdminClient()
  const { data: counts } = await supabase
    .from("colaboradores")
    .select("equipe_id")
    .not("equipe_id", "is", null)

  const membrosCount: Record<string, number> = {}
  counts?.forEach((c: any) => {
    if (c.equipe_id) {
      membrosCount[c.equipe_id] = (membrosCount[c.equipe_id] || 0) + 1
    }
  })

  return (
    <div className="container mx-auto px-4 lg:px-6 py-8 max-w-5xl">
      <EquipesList equipes={equipes} membrosCount={membrosCount} />
    </div>
  )
}
