import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { NovoTicketForm } from "@/components/support/novo-ticket-form"

export default async function NovoTicketPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; digest?: string; pathname?: string }>
}) {
  const params = await searchParams

  return (
    <div className="container mx-auto py-8 px-4 lg:px-6 max-w-2xl">
      <div className="mb-8 flex items-center gap-3">
        <Link href="/suporte">
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-foreground">Abrir chamado</h1>
          <p className="text-sm text-muted-foreground">Conte o que está acontecendo — a gente direciona pra quem resolve</p>
        </div>
      </div>

      <NovoTicketForm
        contextoErroInicial={
          params.message ? { message: params.message, digest: params.digest || null, pathname: params.pathname || null } : undefined
        }
      />
    </div>
  )
}
