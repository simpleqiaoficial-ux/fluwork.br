import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"
import { RedefinirSenhaForm } from "@/components/redefinir-senha-form"

export default async function RedefinirSenhaPage() {
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  return (
    <div className="container mx-auto max-w-2xl py-10 px-4">
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Redefinir Senha</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Altere sua senha de acesso ao sistema. Por segurança, você precisará informar sua senha atual.
          </p>
        </div>

        <RedefinirSenhaForm />
      </div>
    </div>
  )
}
