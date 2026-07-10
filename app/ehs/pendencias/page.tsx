import { listarPendenciasEhs } from "@/lib/ehs/pendencias"
import { PendenciasEhsList } from "@/components/ehs/pendencias-list"

export default async function PendenciasEhsPage() {
  const pendencias = await listarPendenciasEhs()

  return (
    <div className="container mx-auto py-8 px-4 lg:px-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-xl font-semibold mb-1 text-foreground">Central de Pendências</h1>
        <p className="text-sm text-muted-foreground">Documentos e integrações que precisam de atenção agora</p>
      </div>

      <PendenciasEhsList pendencias={pendencias} />
    </div>
  )
}
