import { listarClientesEhs } from "@/app/actions/ehs-clientes"
import { ClientesEhsList } from "@/components/ehs/clientes-list"

export default async function ClientesEhsPage() {
  const clientes = await listarClientesEhs()

  return (
    <div className="container mx-auto py-8 px-4 lg:px-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-xl font-semibold mb-1 text-foreground">Clientes</h1>
        <p className="text-sm text-muted-foreground">Empresas contratantes onde seus prestadores são integrados</p>
      </div>

      <ClientesEhsList clientes={clientes} />
    </div>
  )
}
