import Link from "next/link"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { listarIntegracoesEhs } from "@/app/actions/ehs-integracoes"
import { IntegracoesEhsList } from "@/components/ehs/integracoes-list"

export default async function IntegracoesEhsPage() {
  const integracoes = await listarIntegracoesEhs()

  return (
    <div className="container mx-auto py-8 px-4 lg:px-6 max-w-5xl">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold mb-1 text-foreground">Integrações</h1>
          <p className="text-sm text-muted-foreground">Agendamentos de prestadores em clientes</p>
        </div>
        <Button asChild className="gap-1.5">
          <Link href="/ehs/integracoes/nova">
            <Plus className="h-4 w-4" />
            Nova integração
          </Link>
        </Button>
      </div>

      <IntegracoesEhsList integracoes={integracoes} />
    </div>
  )
}
