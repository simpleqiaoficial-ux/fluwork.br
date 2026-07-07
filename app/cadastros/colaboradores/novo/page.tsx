import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { ColaboradorForm } from "@/components/colaborador-form"
import { getUsuarioLogado } from "@/lib/auth-utils"
import { podeVisualizarPagina } from "@/lib/tenant"
import { redirect } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { ShieldAlert } from "lucide-react"

export default async function NovoColaboradorPage() {
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

  return (
    <div className="container mx-auto py-8 px-4 lg:px-6 max-w-3xl">
      <div className="mb-8">
        <Link
          href="/cadastros/colaboradores"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para prestadores
        </Link>
        <h1 className="text-2xl font-semibold mt-3 mb-1 text-foreground">Novo Prestador</h1>
        <p className="text-sm text-muted-foreground">Cadastre um novo prestador de serviços da sua empresa</p>
      </div>

      <ColaboradorForm usuarioLogadoTipoAcesso={usuario.tipo_acesso} />
    </div>
  )
}
