import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { PedidoForm } from "@/components/pedido-form"
import { listarColaboradoresComGerente } from "@/app/actions/colaboradores"
import { getSession } from "@/lib/session"
import { AlertCircle, LogIn } from "lucide-react"
import { getPapelLabel } from "@/lib/papel-labels"

export default async function PedidosPage() {
  const session = await getSession()

  if (!session) {
    return (
      <div className="container mx-auto py-8 px-4 lg:px-6 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold mb-1 text-foreground">Solicitações</h1>
          <p className="text-sm text-muted-foreground">Crie ordens de pagamento para prestadores</p>
        </div>
        <Alert>
          <LogIn className="h-4 w-4" />
          <AlertTitle>Login Necessário</AlertTitle>
          <AlertDescription className="mt-2">
            Você precisa fazer login como <strong>Lançador de Ordem ou 1º Aprovador</strong> para criar ordens de pagamento.
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
          <h1 className="text-2xl font-semibold mb-1 text-foreground">Solicitações</h1>
          <p className="text-sm text-muted-foreground">Crie ordens de pagamento para prestadores</p>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Acesso Restrito</AlertTitle>
          <AlertDescription className="mt-2">
            Você não tem permissão para criar ordens de pagamento.
            <br />
            Seu perfil atual: <strong>{getPapelLabel(session.tipoAcesso)}</strong>
          </AlertDescription>
          <div className="flex gap-2 mt-4">
            <Button asChild variant="outline">
              <a href="/">Voltar ao Início</a>
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
          <h1 className="text-2xl font-semibold mb-1 text-foreground">Solicitações</h1>
          <p className="text-sm text-muted-foreground">Crie ordens de pagamento para prestadores</p>
        </div>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Nenhum Prestador Disponível</AlertTitle>
          <AlertDescription className="mt-2">
            {session.tipoAcesso === "Supervisor"
              ? "Você não possui prestadores na sua equipe."
              : "Você não possui equipes vinculadas. Entre em contato com o administrador."}
          </AlertDescription>
          <Button asChild className="mt-4" variant="outline">
            <a href="/">Voltar ao Início</a>
          </Button>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 lg:px-6 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold mb-1 text-foreground">Solicitações</h1>
        <p className="text-sm text-muted-foreground">
          {["Gerente", "Financeiro", "Adm"].includes(session.tipoAcesso)
            ? "Crie ordens de pagamento para prestadores"
            : "Crie ordens de pagamento da sua equipe"}
        </p>
      </div>
      <PedidoForm colaboradores={colaboradores} tipoAcesso={session.tipoAcesso} />
    </div>
  )
}
