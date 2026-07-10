import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { ClienteForm } from "@/components/ehs/cliente-form"

export default function NovoClienteEhsPage() {
  return (
    <div className="container mx-auto py-8 px-4 lg:px-6 max-w-3xl">
      <div className="mb-8 flex items-center gap-3">
        <Link href="/ehs/clientes">
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-foreground">Novo Cliente</h1>
          <p className="text-sm text-muted-foreground">Cadastre uma nova empresa contratante</p>
        </div>
      </div>

      <ClienteForm />
    </div>
  )
}
