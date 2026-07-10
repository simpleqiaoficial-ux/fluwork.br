import { SetupInstructions } from "@/components/setup-instructions"

export default function SetupPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-xl font-semibold tracking-tight">Configuração do Sistema</h1>
          <p className="text-sm text-muted-foreground mt-1.5">
            Siga as instruções abaixo para configurar o FluWork corretamente
          </p>
        </div>
        <SetupInstructions />
      </div>
    </div>
  )
}
