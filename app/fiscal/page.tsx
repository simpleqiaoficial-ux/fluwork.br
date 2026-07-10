import { getUsuarioLogado } from "@/lib/auth-utils"
import { podeVisualizarPagina } from "@/lib/tenant"
import { redirect } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Search, XCircle, Calculator, BarChart3, Building, Clock } from "lucide-react"

const cards = [
  {
    title: "Emissão de NFSe",
    description: "Emita notas fiscais de serviço de forma automática.",
    icon: FileText,
  },
  {
    title: "Consulta de Notas",
    description: "Visualize todas as notas fiscais emitidas.",
    icon: Search,
  },
  {
    title: "Cancelamento de Notas",
    description: "Solicite cancelamento de notas fiscais emitidas.",
    icon: XCircle,
  },
  {
    title: "Cálculo de Impostos",
    description: "Simule e acompanhe tributos da empresa.",
    icon: Calculator,
  },
  {
    title: "Relatórios Fiscais",
    description: "Gere relatórios para controle e contabilidade.",
    icon: BarChart3,
  },
  {
    title: "Integração com Prefeituras",
    description: "Emissão automatizada através das prefeituras integradas.",
    icon: Building,
  },
]

const proximasFuncionalidades = [
  "Emissão automática após pagamento",
  "Integração com contadores",
  "Gestão tributária inteligente",
  "IA para dúvidas fiscais",
]

export default async function FiscalPage() {
  const usuario = await getUsuarioLogado()

  if (!usuario) {
    redirect("/login")
  }

  if (!podeVisualizarPagina(usuario, ["Financeiro", "Adm"])) {
    redirect("/")
  }

  return (
    <div className="container mx-auto px-4 lg:px-6 py-8 max-w-5xl">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-xl font-semibold text-foreground">Fiscal</h1>
            <Badge variant="secondary" className="text-xs font-medium">
              Em Desenvolvimento
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Gerencie suas notas fiscais e obrigações fiscais em um único lugar.
          </p>
        </div>
      </div>

      {/* Cards grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-10">
        {cards.map((item) => {
          const Icon = item.icon
          return (
            <Card key={item.title} className="h-full opacity-80 cursor-default select-none">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                  <Badge variant="outline" className="text-[11px] font-normal gap-1">
                    <Clock className="h-3 w-3" />
                    Em desenvolvimento
                  </Badge>
                </div>
                <CardTitle className="text-base mt-4">{item.title}</CardTitle>
                <CardDescription className="text-sm leading-relaxed">
                  {item.description}
                </CardDescription>
              </CardHeader>
            </Card>
          )
        })}
      </div>

      {/* Proximas funcionalidades */}
      <div className="border-t pt-6">
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-4">
          Próximas funcionalidades
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {proximasFuncionalidades.map((label) => (
            <li key={label} className="text-sm text-muted-foreground">
              {label}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
