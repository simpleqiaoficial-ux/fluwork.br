import { getUsuarioLogado } from "@/lib/auth-utils"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, TrendingUp, ChevronRight, FileCheck } from "lucide-react"
import { AniversariosContratoDashboard } from "@/components/aniversarios-contrato-dashboard"
import { db } from "@/lib/db"
import { colaboradores } from "@/lib/db/schema"
import { toColaboradorDTO } from "@/lib/db/mappers"

export default async function GestaoPage() {
  const usuario = await getUsuarioLogado()

  if (!usuario) {
    redirect("/login")
  }

  if (!["Financeiro", "Adm"].includes(usuario.tipo_acesso)) {
    redirect("/")
  }

  // Buscar todos colaboradores para verificar aniversários de contrato
  const colaboradoresRows = await db
    .select({
      id: colaboradores.id,
      nomeCompleto: colaboradores.nomeCompleto,
      salario: colaboradores.salario,
      dataAniversarioContrato: colaboradores.dataAniversarioContrato,
      email: colaboradores.email,
      tipoAcesso: colaboradores.tipoAcesso,
      cnpj: colaboradores.cnpj,
      dataNascimento: colaboradores.dataNascimento,
      equipeId: colaboradores.equipeId,
      diaPagamento: colaboradores.diaPagamento,
      chavePix: colaboradores.chavePix,
      tipoChavePix: colaboradores.tipoChavePix,
      centroCustoId: colaboradores.centroCustoId,
      createdAt: colaboradores.createdAt,
    })
    .from(colaboradores)
    .orderBy(colaboradores.nomeCompleto)

  const listaColaboradores = colaboradoresRows.map(toColaboradorDTO)

  const items = [
    {
      href: "/gestao/notas",
      title: "Gerenciar Notas",
      description: "Visualize e gerencie as notas fiscais organizadas por mês de competência.",
      icon: FileText,
      color: "bg-blue-50 text-blue-600 border-blue-200",
    },
    {
      href: "/gestao/reajustes",
      title: "Aplicar Reajustes",
      description: "Aplique reajustes salariais nos colaboradores e consulte o histórico.",
      icon: TrendingUp,
      color: "bg-emerald-50 text-emerald-600 border-emerald-200",
    },
    {
      href: "/gestao/aceites",
      title: "Aceites de Termos",
      description: "Visualize e gerencie os aceites de termos de uso dos colaboradores.",
      icon: FileCheck,
      color: "bg-violet-50 text-violet-600 border-violet-200",
    },
  ]

  return (
    <div className="container mx-auto px-4 lg:px-6 py-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold mb-1 text-foreground">Gestão de Pessoas</h1>
        <p className="text-sm text-muted-foreground">
          Gerencie notas fiscais e aplique reajustes salariais
        </p>
      </div>

      {/* Dashboard de Aniversários de Contrato */}
      <div className="mb-8">
        <AniversariosContratoDashboard colaboradores={listaColaboradores || []} />
      </div>

      {/* Cards de navegação */}
      <div className="grid gap-4 md:grid-cols-2">
        {items.map((item) => {
          const Icon = item.icon
          return (
            <Link key={item.href} href={item.href} className="group">
              <Card className="h-full transition-all hover:shadow-md hover:border-foreground/20 group-hover:bg-muted/30">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className={`p-3 rounded-lg border ${item.color}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </div>
                  <CardTitle className="text-lg mt-4">{item.title}</CardTitle>
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
