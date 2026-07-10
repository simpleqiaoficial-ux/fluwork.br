import Link from "next/link"
import { LoginForm } from "@/components/auth/login-form"
import { Logo } from "@/components/brand/logo"

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b">
        <nav className="max-w-5xl mx-auto flex items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center">
            <Logo size={32} />
          </Link>
          <div className="flex items-center gap-6 text-sm">
            <Link href="/faq" className="text-muted-foreground hover:text-foreground transition-colors">
              FAQ
            </Link>
            <Link href="/termos" className="text-muted-foreground hover:text-foreground transition-colors">
              Termos
            </Link>
            <Link href="/privacidade" className="text-muted-foreground hover:text-foreground transition-colors">
              Privacidade
            </Link>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h1 className="text-xl font-semibold tracking-tight">Acesse sua conta</h1>
            <p className="text-sm text-muted-foreground mt-1.5">Entre com suas credenciais para continuar</p>
          </div>

          <LoginForm />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-6 px-4">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <p>2026 FluWork - Simpleqia. Todos os direitos reservados.</p>
          <div className="flex items-center gap-3">
            <span>simpleqia.oficial@gmail.com</span>
            <span>·</span>
            <span>(11) 91486-0806</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
