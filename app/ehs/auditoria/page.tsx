import { listarAuditoriaGeralEhs } from "@/lib/ehs/auditoria"
import { AuditoriaGeralList } from "@/components/ehs/auditoria-geral-list"

export default async function AuditoriaGeralEhsPage() {
  const eventos = await listarAuditoriaGeralEhs()

  return (
    <div className="container mx-auto py-8 px-4 lg:px-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-xl font-semibold mb-1 text-foreground">Auditoria</h1>
        <p className="text-sm text-muted-foreground">Log técnico de tudo que mudou no módulo — quem, quando e o que exatamente</p>
      </div>

      <AuditoriaGeralList eventos={eventos} />
    </div>
  )
}
