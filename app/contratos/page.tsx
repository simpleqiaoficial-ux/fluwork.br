import { getUsuarioLogado } from "@/lib/auth-utils"
import { redirect } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  FilePlus,
  Library,
  PenLine,
  FolderOpen,
  ShieldCheck,
  RefreshCw,
  Clock,
  Sparkles,
  MessageCircle,
  Bot,
  Scale,
  CreditCard,
  CheckCircle2,
} from "lucide-react"

const cards = [
  {
    title: "Criar Contrato",
    description: "Gere contratos personalizados em poucos minutos.",
    icon: FilePlus,
    color: "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800",
  },
  {
    title: "Biblioteca de Modelos",
    description: "Utilize modelos prontos para diferentes serviços.",
    icon: Library,
    color: "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800",
  },
  {
    title: "Assinatura Eletrônica",
    description: "Assine documentos digitalmente com validade jurídica.",
    icon: PenLine,
    color: "bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-400 dark:border-indigo-800",
  },
  {
    title: "Gestão de Contratos",
    description: "Acompanhe contratos ativos e encerrados.",
    icon: FolderOpen,
    color: "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800",
  },
  {
    title: "Armazenamento Seguro",
    description: "Centralize todos os documentos da empresa.",
    icon: ShieldCheck,
    color: "bg-teal-50 text-teal-600 border-teal-200 dark:bg-teal-950/30 dark:text-teal-400 dark:border-teal-800",
  },
  {
    title: "Renovação Automática",
    description: "Receba alertas e automatize renovações.",
    icon: RefreshCw,
    color: "bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-800",
  },
]

const proximasFuncionalidades = [
  { label: "Assinatura por WhatsApp", icon: MessageCircle },
  { label: "Contratos gerados por IA", icon: Bot },
  { label: "Revisão jurídica por IA", icon: Scale },
  { label: "Integração com pagamentos", icon: CreditCard },
  { label: "Contrato automático após aprovação de proposta", icon: CheckCircle2 },
]

export default async function ContratosPage() {
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
            <h1 className="text-2xl font-semibold text-foreground">Contratos</h1>
            <Badge variant="secondary" className="text-xs font-medium">
              Em Desenvolvimento
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Crie, assine e gerencie contratos digitais.
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
