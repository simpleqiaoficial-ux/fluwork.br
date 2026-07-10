import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ClienteForm } from "@/components/ehs/cliente-form"
import { buscarClienteEhsPorId } from "@/app/actions/ehs-clientes"

interface EditarClienteEhsPageProps {
  params: Promise<{ id: string }>
}

export default async function EditarClienteEhsPage({ params }: EditarClienteEhsPageProps) {
  const { id } = await params
  const cliente = await buscarClienteEhsPorId(id)
  if (!cliente) notFound()

  return (
    <div className="container mx-auto py-8 px-4 lg:px-6 max-w-3xl">
      <div className="mb-8 flex items-center gap-3">
        <Link href={`/ehs/clientes/${id}`}>
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-foreground">Editar Cliente</h1>
          <p className="text-sm text-muted-foreground">{cliente.nome}</p>
        </div>
      </div>

      <ClienteForm clienteId={cliente.id} valoresIniciais={cliente} />
    </div>
  )
}
