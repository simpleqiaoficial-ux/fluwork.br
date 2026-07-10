import Link from "next/link"
import { AlertTriangle } from "lucide-react"
import { validarTokenRecuperacaoSenha } from "@/app/actions/auth"
import { RedefinirSenhaTokenForm } from "@/components/auth/redefinir-senha-token-form"
import { Logo } from "@/components/brand/logo"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface RedefinirSenhaPageProps {
  params: Promise<{ token: string }>
}

export default async function RedefinirSenhaTokenPage({ params }: RedefinirSenhaPageProps) {
  const { token } = await params
  const tokenValido = await validarTokenRecuperacaoSenha(token)

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b">
        <nav className="max-w-5xl mx-auto flex items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center">
            <Logo size={32} />
          </Link>
        </nav>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-16 bg-muted/30">
        <div className="w-full max-w-sm">
          {tokenValido ? (
            <>
              <div className="mb-6 text-center">
                <h1 className="text-xl font-semibold tracking-tight">Redefinir senha</h1>
                <p className="text-sm text-muted-foreground mt-1.5">Escolha uma nova senha para sua conta</p>
              </div>
              <Card>
                <CardContent className="pt-6">
                  <RedefinirSenhaTokenForm token={token} />
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center space-y-4">
                <div className="flex justify-center">
                  <AlertTriangle className="h-10 w-10 text-warning" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Link inválido ou expirado</p>
                  <p className="text-sm text-muted-foreground mt-1.5">
                    Esse link de redefinição de senha não é mais válido. Solicite um novo.
                  </p>
                </div>
                <Button asChild className="w-full">
                  <Link href="/esqueci-senha">Solicitar novo link</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <footer className="border-t py-6 px-4">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <p>2026 FluWork - Simpleqia. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  )
}
