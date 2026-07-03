import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { PedidoForm } from "@/components/pedido-form"
import { listarColaboradoresComGerente } from "@/app/actions/colaboradores"
import { getSession } from "@/lib/session"
import { AlertCircle, LogIn } from "lucide-react"

export default async function PedidosPage() {
  const session = await getSession()

  if (!session) {
    return (
      <div className="container mx-auto py-8 px-4 lg:px-6 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold mb-1 text-foreground">Criar Pedido</h1>
          <p className="text-sm text-muted-foreground">Crie pedidos de pagamento para colaboradores</p>
        </div>
        <Alert>
          <LogIn className="h-4 w-4" />
          <AlertTitle>Login Necessario</AlertTitle>
          <AlertDescription className="mt-2">
            Voce precisa fazer login como <strong>Supervisor ou Gerente</strong> para criar pedidos de pagamento.
          </AlertDescription>
          <Button asChild className="mt-4">
            <a href="/login">Fazer Login</a>
          </Button>
        </Alert>
      </div>
    )
  }

  if (!["Supervisor", "Adm", "Gerente", "Financeiro"].includes(session.tipoAcesso)) {
    return (
      <div className="container mx-auto py-8 px-4 lg:px-6 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold mb-1 text-foreground">Criar Pedido</h1>
          <p className="text-sm text-muted-foreground">Crie pedidos de pagamento para colaboradores</p>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Acesso Restrito</AlertTitle>
          <AlertDescription className="mt-2">
            Voce nao tem permissao para criar pedidos de pagamento.
            <br />
            Seu perfil atual: <strong>{session.tipoAcesso}</strong>
          </AlertDescription>
          <div className="flex gap-2 mt-4">
            <Button asChild variant="outline">
              <a href="/">Voltar ao Inicio</a>
            </Button>
          </div>
        </Alert>
      </div>
    )
  }

  const colaboradores = await listarColaboradoresComGerente()

  if (colaboradores.length === 0) {
    return (
      <div className="container mx-auto py-8 px-4 lg:px-6 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold mb-1 text-foreground">Criar Pedido</h1>
          <p className="text-sm text-muted-foreground">Crie pedidos de pagamento para colaboradores</p>
        </div>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Nenhum Colaborador Disponivel</AlertTitle>
          <AlertDescription className="mt-2">
            {session.tipoAcesso === "Supervisor"
              ? "Voce nao possui colaboradores na sua equipe."
              : "Voce nao possui equipes vinculadas. Entre em contato com o administrador."}
          </AlertDescription>
          <Button asChild className="mt-4" variant="outline">
            <a href="/">Voltar ao Inicio</a>
          </Button>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 lg:px-6 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold mb-1 text-foreground">Criar Pedido</h1>
        <p className="text-sm text-muted-foreground">
          {["Gerente", "Financeiro", "Adm"].includes(session.tipoAcesso)
            ? "Crie pedidos de pagamento para colaboradores"
            : "Crie pedidos de pagamento da sua equipe"}
        </p>
      </div>
      <PedidoForm colaboradores={colaboradores} tipoAcesso={session.tipoAcesso} />
    </div>
  )
}
