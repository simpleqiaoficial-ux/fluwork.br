import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { listarClientesEhs } from "@/app/actions/ehs-clientes"
import { listarPrestadoresEhs } from "@/app/actions/ehs-prestadores"
import { IntegracaoForm } from "@/components/ehs/integracao-form"

interface NovaIntegracaoEhsPageProps {
  searchParams: Promise<{ cliente?: string; prestador?: string }>
}

export default async function NovaIntegracaoEhsPage({ searchParams }: NovaIntegracaoEhsPageProps) {
  const { cliente, prestador } = await searchParams
  const [clientes, prestadores] = await Promise.all([listarClientesEhs(), listarPrestadoresEhs()])

  return (
    <div className="container mx-auto py-8 px-4 lg:px-6 max-w-3xl">
      <div className="mb-8 flex items-center gap-3">
        <Link href="/ehs/integracoes">
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-foreground">Nova Integração</h1>
          <p className="text-sm text-muted-foreground">Agende um prestador em um cliente</p>
        </div>
      </div>

      <IntegracaoForm
        clientes={clientes.filter((c) => c.status === "ativo").map((c) => ({ id: c.id, nome: c.nome }))}
        prestadores={prestadores.map((p) => ({ id: p.id, nome_completo: p.nome_completo, foto_url: p.foto_url }))}
        clienteIdInicial={cliente}
        colaboradorIdInicial={prestador}
      />
    </div>
  )
}
