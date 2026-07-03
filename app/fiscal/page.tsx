import { getUsuarioLogado } from "@/lib/auth-utils"
import { redirect } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  FileText,
  Search,
  XCircle,
  Calculator,
  BarChart3,
  Building,
  Clock,
  Sparkles,
  Zap,
  Users,
  Brain,
} from "lucide-react"

const cards = [
  {
    title: "Emissão de NFSe",
    description: "Emita notas fiscais de serviço de forma automática.",
    icon: FileText,
    color: "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800",
  },
  {
    title: "Consulta de Notas",
    description: "Visualize todas as notas fiscais emitidas.",
    icon: Search,
    color: "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800",
  },
  {
    title: "Cancelamento de Notas",
    description: "Solicite cancelamento de notas fiscais emitidas.",
    icon: XCircle,
    color: "bg-red-50 text-red-600 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800",
  },
  {
    title: "Cálculo de Impostos",
    description: "Simule e acompanhe tributos da empresa.",
    icon: Calculator,
    color: "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800",
  },
  {
    title: "Relatórios Fiscais",
    description: "Gere relatórios para controle e contabilidade.",
    icon: BarChart3,
    color: "bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-800",
  },
  {
    title: "Integração com Prefeituras",
    description: "Emissão automatizada através das prefeituras integradas.",
    icon: Building,
    color: "bg-sky-50 text-sky-600 border-sky-200 dark:bg-sky-950/30 dark:text-sky-400 dark:border-sky-800",
  },
]

const proximasFuncionalidades = [
  { label: "Emissão automática após pagamento", icon: Zap },
  { label: "Integração com contadores", icon: Users },
  { label: "Gestão tributária inteligente", icon: Sparkles },
  { label: "IA para dúvidas fiscais", icon: Brain },
]

export default async function FiscalPage() {
  const usuario = await getUsuarioLogado()

  if (!usuario) {
    redirect("/login")
  }

  if (!["Financeiro", "Adm"].includes(usuario.tipo_acesso)) {
    redirect("/")
  }

  return (
    <div className="container mx-auto px-4 lg:px-6 py-8 max-w-5xl">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-semibold text-foreground">Fiscal</h1>
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
            <Card
              key={item.title}
              className="h-full border border-border/60 bg-card opacity-80 cursor-default select-none"
            >
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className={`p-3 rounded-lg border ${item.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <Badge
                    variant="outline"
                    className="text-[11px] font-medium text-amber-600 border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-700 flex items-center gap-1"
                  >
                    <Clock className="h-3 w-3" />
                    Em Desenvolvimento
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
      <div className="rounded-xl border border-border/60 bg-muted/30 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Próximas Funcionalidades</h2>
        </div>
        <ul className="grid gap-2 sm:grid-cols-2">
          {proximasFuncionalidades.map((item) => {
            const Icon = item.icon
            return (
              <li
                key={item.label}
                className="flex items-center gap-2.5 text-sm text-muted-foreground"
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Icon className="h-3.5 w-3.5" />
                </div>
                {item.label}
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
