import Link from "next/link"
import { getSession } from "@/lib/session"
import { Logo } from "@/components/brand/logo"
import { Button } from "@/components/ui/button"
import { FileQuestion } from "lucide-react"

export default async function NotFound() {
  const session = await getSession()
  const destino = session ? "/" : "/login"
  const label = session ? "Voltar ao painel" : "Ir para o login"

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <Logo size={48} />

      <div className="mt-8 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <FileQuestion className="h-8 w-8 text-muted-foreground" />
      </div>

      <h1 className="mt-6 text-xl font-semibold text-foreground">Página não encontrada</h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        O link que você acessou não existe ou foi movido. Confira o endereço ou volte para um lugar conhecido.
      </p>

      <div className="mt-8 flex items-center gap-3">
        <Button asChild>
          <Link href={destino}>{label}</Link>
        </Button>
        {session && (
          <Button asChild variant="outline">
            <Link href="/suporte/novo?message=Página não encontrada (404)">Reportar problema</Link>
          </Button>
        )}
      </div>
    </div>
  )
}
