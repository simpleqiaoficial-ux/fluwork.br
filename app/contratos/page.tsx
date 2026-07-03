import { getUsuarioLogado } from "@/lib/auth-utils"
import { redirect } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FilePlus, Library, PenLine, FolderOpen, ShieldCheck, RefreshCw, Clock } from "lucide-react"

const cards = [
  {
    title: "Criar Contrato",
    description: "Gere contratos personalizados em poucos minutos.",
    icon: FilePlus,
  },
  {
    title: "Biblioteca de Modelos",
    description: "Utilize modelos prontos para diferentes serviços.",
    icon: Library,
  },
  {
    title: "Assinatura Eletrônica",
    description: "Assine documentos digitalmente com validade jurídica.",
    icon: PenLine,
  },
  {
    title: "Gestão de Contratos",
    description: "Acompanhe contratos ativos e encerrados.",
    icon: FolderOpen,
  },
  {
    title: "Armazenamento Seguro",
    description: "Centralize todos os documentos da empresa.",
    icon: ShieldCheck,
  },
  {
    title: "Renovação Automática",
    description: "Receba alertas e automatize renovações.",
    icon: RefreshCw,
  },
]

const proximasFuncionalidades = [
  "Assinatura por WhatsApp",
  "Contratos gerados por IA",
  "Revisão jurídica por IA",
  "Integração com pagamentos",
  "Contrato automático após aprovação de proposta",
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
