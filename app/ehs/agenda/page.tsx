import Link from "next/link"
import { ChevronLeft, ChevronRight, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { listarIntegracoesEhs } from "@/app/actions/ehs-integracoes"
import { AgendaMes } from "@/components/ehs/agenda-mes"

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
]

interface AgendaEhsPageProps {
  searchParams: Promise<{ mes?: string }>
}

export default async function AgendaEhsPage({ searchParams }: AgendaEhsPageProps) {
  const { mes: mesParam } = await searchParams
  const hoje = new Date()
  const [anoStr, mesStr] = (mesParam || `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`).split("-")
  const ano = Number(anoStr)
  const mes = Number(mesStr)

  const de = `${ano}-${String(mes).padStart(2, "0")}-01`
  const ate = new Date(ano, mes, 0).toISOString().slice(0, 10)

  const integracoes = await listarIntegracoesEhs({ de, ate })

  const mesAnterior = mes === 1 ? `${ano - 1}-12` : `${ano}-${String(mes - 1).padStart(2, "0")}`
  const mesProximo = mes === 12 ? `${ano + 1}-01` : `${ano}-${String(mes + 1).padStart(2, "0")}`

  return (
    <div className="container mx-auto py-8 px-4 lg:px-6 max-w-6xl">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold mb-1 text-foreground">Agenda</h1>
          <p className="text-sm text-muted-foreground">Integrações agendadas por dia</p>
        </div>
        <Button asChild className="gap-1.5">
          <Link href="/ehs/integracoes/nova">
            <Plus className="h-4 w-4" />
            Nova integração
          </Link>
        </Button>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Button asChild variant="outline" size="icon" className="h-8 w-8">
            <Link href={`/ehs/agenda?mes=${mesAnterior}`}>
              <ChevronLeft className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="icon" className="h-8 w-8">
            <Link href={`/ehs/agenda?mes=${mesProximo}`}>
              <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
          <span className="ml-2 text-sm font-medium">
            {MESES[mes - 1]} {ano}
          </span>
        </div>
        <Link href="/ehs/integracoes" className="text-sm text-primary hover:underline">
          Ver lista
        </Link>
      </div>

      <AgendaMes ano={ano} mes={mes} integracoes={integracoes} />
    </div>
  )
}
