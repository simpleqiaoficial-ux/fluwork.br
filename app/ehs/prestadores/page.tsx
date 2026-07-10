import { seedTiposDocumentoEhs } from "@/lib/ehs/tipos-documento"
import { listarPrestadoresEhs } from "@/app/actions/ehs-prestadores"
import { PrestadoresEhsList } from "@/components/ehs/prestadores-list"

export default async function PrestadoresEhsPage() {
  await seedTiposDocumentoEhs()
  const prestadores = await listarPrestadoresEhs()

  return (
    <div className="container mx-auto py-8 px-4 lg:px-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-xl font-semibold mb-1 text-foreground">Prestadores</h1>
        <p className="text-sm text-muted-foreground">Colaboradores com documentação de compliance acompanhada pelo módulo EHS</p>
      </div>

      <PrestadoresEhsList prestadores={prestadores} />
    </div>
  )
}
