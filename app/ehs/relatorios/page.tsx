import { redirect } from "next/navigation"
import { FileSpreadsheet, FileText } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getCurrentUser, podeVisualizarPagina } from "@/lib/tenant"

export default async function RelatoriosEhsPage() {
  const usuario = await getCurrentUser()
  if (!usuario) redirect("/login")
  if (!podeVisualizarPagina(usuario, ["Adm", "EHS", "SuperAdmin"])) redirect("/")

  return (
    <div className="container mx-auto py-8 px-4 lg:px-6 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-xl font-semibold mb-1 text-foreground">Relatórios</h1>
        <p className="text-sm text-muted-foreground">Exportações do módulo EHS, geradas na hora — nunca armazenadas</p>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
              Relatório completo (Excel)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Uma planilha com quatro abas: Clientes, Prestadores (com Compliance Score), Documentos e Pendências — o retrato atual do módulo.
            </p>
            <Button asChild className="gap-1.5">
              <a href="/api/ehs/relatorios/excel">
                <FileSpreadsheet className="h-4 w-4" />
                Baixar planilha
              </a>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              Compliance por prestador (PDF)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Um relatório individual com o Compliance Score e todos os documentos de um prestador — disponível direto na página de cada{" "}
              <a href="/ehs/prestadores" className="text-primary hover:underline">
                Prestador
              </a>
              , no botão "Exportar PDF".
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
