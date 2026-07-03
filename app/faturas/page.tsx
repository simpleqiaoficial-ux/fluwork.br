import { redirect } from "next/navigation"
import { getSession } from "@/lib/session"
import { getFaturas } from "@/app/actions/faturas"
import { getColaboradores } from "@/app/actions/colaboradores"
import { FaturasList } from "@/components/faturas-list"
import { SidebarNavigation } from "@/components/sidebar-navigation"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { UserHeader } from "@/components/user-header"
import { FileText } from "lucide-react"

export default async function FaturasPage() {
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  const tipoAcesso = session.tipoAcesso?.toLowerCase() || ""
  const isAdm = tipoAcesso === "adm"
  const isFinanceiro = tipoAcesso === "financeiro"
  const canViewFaturas = isAdm || isFinanceiro
  const canManageFaturas = isAdm // Apenas Adm pode criar/editar/deletar
  const shouldViewAllFaturas = isAdm || isFinanceiro // Adm e Financeiro veem todas as faturas
  const colaboradorId = session.colaboradorId?.toString() || ""
  
  // Se não é Adm nem Financeiro, redirecionar
  if (!canViewFaturas) {
    redirect("/")
  }
  
  const faturas = await getFaturas(colaboradorId, shouldViewAllFaturas)
  const colaboradores = canManageFaturas ? await getColaboradores() : []

  return (
    <SidebarProvider>
      <SidebarNavigation
        userName={session.nomeCompleto}
        userRole={session.tipoAcesso}
        colaboradorId={colaboradorId}
      />
      <SidebarInset>
        <UserHeader colaboradorId={colaboradorId} />
        <main className="flex-1 p-4 md:p-6">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <FileText className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold tracking-tight">Faturas</h1>
            </div>
            <p className="text-muted-foreground">
              {canManageFaturas 
                ? "Gerencie as faturas e controle quem pode visualizá-las."
                : "Visualize, exporte e gerencie as faturas de pagamento."
              }
            </p>
          </div>

          <FaturasList 
            faturas={faturas}
            colaboradores={colaboradores}
            isAdmin={canManageFaturas}
            colaboradorId={colaboradorId}
            tipoAcesso={session.tipoAcesso || ""}
          />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
