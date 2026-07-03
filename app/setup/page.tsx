import { SetupInstructions } from "@/components/setup-instructions"

export default function SetupPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Configuração do Sistema</h1>
          <p className="text-muted-foreground mt-2">
            Siga as instruções abaixo para configurar o FluxoPay corretamente
          </p>
        </div>
        <SetupInstructions />
      </div>
    </div>
  )
}
