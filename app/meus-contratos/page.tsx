import { getUsuarioLogado } from "@/lib/auth-utils"
import { redirect } from "next/navigation"
import { listarContratosDoUsuario } from "@/app/actions/contratos"
import { StatusBadge } from "@/components/ui/status-badge"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FileSignature, Download, Clock } from "lucide-react"

function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor)
}

export default async function MeusContratosPage() {
  const usuario = await getUsuarioLogado()

  if (!usuario) {
    redirect("/login")
  }

  const contratos = await listarContratosDoUsuario()

  return (
    <div className="container mx-auto px-4 lg:px-6 py-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground">Meus Contratos</h1>
        <p className="text-sm text-muted-foreground mt-1">Contratos enviados para você assinar</p>
      </div>

      {contratos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <FileSignature className="h-8 w-8 text-muted-foreground mb-3" />
          <h3 className="font-semibold text-foreground">Nenhum contrato recebido</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            Quando um contrato for enviado para o seu e-mail, ele aparecerá aqui.
          </p>
        </div>
      ) : (
        <div className="rounded-md border divide-y">
          {contratos.map((contrato: any) => {
            return (
              <div key={contrato.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{contrato.tipo_servico}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {contrato.numero} · {formatarMoeda(contrato.valor)}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {contrato.status === "sent" || contrato.status === "viewed" ? (
                    <Badge variant="warning">
                      <Clock className="h-3 w-3" />
                      Aguardando sua assinatura
                    </Badge>
                  ) : (
                    <StatusBadge entity="contrato" status={contrato.status} />
                  )}
                  {contrato.status === "signed" && (
                    <a href={`/api/contratos/${contrato.id}/pdf`} target="_blank" rel="noreferrer">
                      <Button size="icon" variant="ghost" className="h-8 w-8">
                        <Download className="h-4 w-4" />
                      </Button>
                    </a>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
