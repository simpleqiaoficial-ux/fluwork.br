import { getUsuarioLogado } from "@/lib/auth-utils"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, UsersRound, Building2, ChevronRight } from "lucide-react"

export default async function CadastrosPage() {
  const usuario = await getUsuarioLogado()

  if (!usuario) {
    redirect("/login")
  }

  if (!["Financeiro", "Adm"].includes(usuario.tipo_acesso)) {
    redirect("/")
  }

  const cadastros = [
    {
      href: "/cadastros/colaboradores",
      title: "Prestadores",
      description: "Gerencie os prestadores do sistema, incluindo dados pessoais, valores contratuais e acessos.",
      icon: Users,
    },
    {
      href: "/cadastros/equipes",
      title: "Equipes",
      description: "Organize prestadores em equipes e defina supervisores responsaveis.",
      icon: UsersRound,
    },
    {
      href: "/cadastros/centros-custo",
      title: "Centros de Custo",
      description: "Gerencie os centros de custo para organizacao financeira dos pagamentos.",
      icon: Building2,
    },
  ]

  return (
    <div className="container mx-auto px-4 lg:px-6 py-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold mb-1 text-foreground">Cadastros</h1>
        <p className="text-sm text-muted-foreground">
          Gerencie prestadores, equipes e centros de custo do sistema
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {cadastros.map((item) => {
          const Icon = item.icon
          return (
            <Link key={item.href} href={item.href} className="group">
              <Card className="h-full transition-colors hover:border-foreground/20 group-hover:bg-muted/30">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </div>
                  <CardTitle className="text-base mt-4">{item.title}</CardTitle>
                  <CardDescription className="text-sm leading-relaxed">
                    {item.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
