import Link from "next/link"
import { Plus, ShieldAlert } from "lucide-react"
import { ColaboradoresList } from "@/components/colaboradores-list"
import { Suspense } from "react"
import { getUsuarioLogado } from "@/lib/auth-utils"
import { podeVisualizarPagina } from "@/lib/tenant"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default async function ColaboradoresPage() {
  const usuario = await getUsuarioLogado()

  if (!usuario) {
    redirect("/login")
  }

  if (!podeVisualizarPagina(usuario, ["Adm", "Financeiro"])) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <Card className="border-destructive">
          <CardContent className="py-12 text-center">
            <ShieldAlert className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Acesso Negado</h2>
            <p className="text-muted-foreground">Apenas administradores e financeiro podem acessar esta página.</p>
          </CardContent>
        </Card>
      </div>
    )
  }
  // </CHANGE>

  return (
    <div className="container mx-auto py-8 px-4 lg:px-6 max-w-4xl">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold mb-1 text-foreground">Prestadores</h1>
          <p className="text-sm text-muted-foreground">Gerencie os prestadores da sua empresa</p>
        </div>
        <Link href="/cadastros/colaboradores/novo">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Prestador
          </Button>
        </Link>
      </div>

      <Suspense fallback={<div>Carregando...</div>}>
        <ColaboradoresList usuarioLogadoTipoAcesso={usuario.tipo_acesso} />
      </Suspense>
    </div>
  )
}
