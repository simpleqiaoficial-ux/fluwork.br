import Link from "next/link"
import { EsqueciSenhaForm } from "@/components/auth/esqueci-senha-form"
import { Logo } from "@/components/brand/logo"
import { Card, CardContent } from "@/components/ui/card"

export default function EsqueciSenhaPage() {
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
          <div className="mb-6 text-center">
            <h1 className="text-xl font-semibold tracking-tight">Esqueci minha senha</h1>
            <p className="text-sm text-muted-foreground mt-1.5">
              Informe seu e-mail e enviaremos um link para redefinir sua senha
            </p>
          </div>

          <Card>
            <CardContent className="pt-6">
              <EsqueciSenhaForm />
            </CardContent>
          </Card>
        </div>
      </main>

      <footer className="border-t py-6 px-4">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <p>2026 FluWork - Simpleqia. Todos os direitos reservados.</p>
          <div className="flex items-center gap-3">
            <span>simpleqia.oficial@gmail.com</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
