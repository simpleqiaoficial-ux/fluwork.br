import { redirect } from "next/navigation"
import { eq } from "drizzle-orm"
import { getSession } from "@/lib/session"
import { db } from "@/lib/db"
import { colaboradores } from "@/lib/db/schema"
import { PerfilForm } from "@/components/perfil-form"

export default async function PerfilPage() {
  const session = await getSession()
  if (!session) {
    redirect("/login")
  }

  const [colaborador] = await db
    .select({
      nomeCompleto: colaboradores.nomeCompleto,
      email: colaboradores.email,
      dataNascimento: colaboradores.dataNascimento,
      cnpj: colaboradores.cnpj,
      razaoSocial: colaboradores.razaoSocial,
      enderecoCidade: colaboradores.enderecoCidade,
      enderecoUf: colaboradores.enderecoUf,
      chavePix: colaboradores.chavePix,
      tipoChavePix: colaboradores.tipoChavePix,
      fotoUrl: colaboradores.fotoUrl,
      tipoAcesso: colaboradores.tipoAcesso,
      salario: colaboradores.salario,
      diaPagamento: colaboradores.diaPagamento,
    })
    .from(colaboradores)
    .where(eq(colaboradores.id, session.colaboradorId))

  if (!colaborador) {
    redirect("/login")
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 lg:px-6 py-8 max-w-3xl">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold mb-1 text-foreground">Meu Perfil</h1>
          <p className="text-sm text-muted-foreground">Atualize seus dados pessoais e sua foto de perfil</p>
        </div>

        <PerfilForm
          colaborador={{
            nomeCompleto: colaborador.nomeCompleto,
            email: colaborador.email || "",
            dataNascimento: colaborador.dataNascimento,
            cnpj: colaborador.cnpj,
            razaoSocial: colaborador.razaoSocial,
            enderecoCidade: colaborador.enderecoCidade,
            enderecoUf: colaborador.enderecoUf,
            chavePix: colaborador.chavePix,
            tipoChavePix: colaborador.tipoChavePix,
            fotoUrl: colaborador.fotoUrl,
          }}
          tipoAcesso={colaborador.tipoAcesso || "Colaborador"}
          salario={Number(colaborador.salario)}
          diaPagamento={colaborador.diaPagamento || 1}
        />
      </main>
    </div>
  )
}
