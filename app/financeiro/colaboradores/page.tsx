import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"
import { ColaboradoresFinanceiroList } from "@/components/colaboradores-financeiro-list"

export default async function FinanceiroColaboradoresPage() {
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  if (session.tipoAcesso !== "Financeiro" && session.tipoAcesso !== "Adm") {
    redirect("/")
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Gestão de Prestadores</h1>
          <p className="text-muted-foreground mt-2">Visualize e aplique reajustes de valor contratual</p>
        </div>
        <ColaboradoresFinanceiroList />
      </main>
    </div>
  )
}
