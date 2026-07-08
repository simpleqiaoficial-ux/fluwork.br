import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { getSession } from "@/lib/session"
import { db } from "@/lib/db"
import { colaboradores } from "@/lib/db/schema"
import { toColaboradorDTO } from "@/lib/db/mappers"
import { eq } from "drizzle-orm"
import { FiscalFocusNfeForm } from "@/components/fiscal-focus-nfe-form"

export default async function MeuFiscalPage() {
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  const [colaboradorRow] = await db.select().from(colaboradores).where(eq(colaboradores.id, session.colaboradorId))
  if (!colaboradorRow) {
    redirect("/meus-pagamentos")
  }

  const colaborador = toColaboradorDTO(colaboradorRow)

  return (
    <div className="container mx-auto px-4 lg:px-6 py-8 max-w-lg">
      <Link
        href="/meus-pagamentos"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-3"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Meus Pagamentos
      </Link>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground">Configuração fiscal</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Cadastre seu certificado digital pra poder emitir NFS-e direto pelo FluWork
        </p>
      </div>

      <FiscalFocusNfeForm
        colaboradorId={colaborador.id}
        focusStatusCadastro={colaborador.focus_status_cadastro || "nao_cadastrado"}
        focusMotivoErroCadastro={colaborador.focus_motivo_erro_cadastro}
        inscricaoMunicipalAtual={colaborador.inscricao_municipal}
        regimeTributarioAtual={colaborador.regime_tributario}
      />
    </div>
  )
}
