import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, Building2, Calendar, Clock, MapPin, Phone, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "@/components/ui/status-badge"
import { buscarIntegracaoEhsPorId } from "@/app/actions/ehs-integracoes"
import { situacaoExibicaoIntegracao } from "@/lib/ehs/integracoes"
import { IntegracaoStatusActions } from "@/components/ehs/integracao-status-actions"

function formatarData(data: string) {
  return new Intl.DateTimeFormat("pt-BR").format(new Date(data))
}

interface IntegracaoEhsDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function IntegracaoEhsDetailPage({ params }: IntegracaoEhsDetailPageProps) {
  const { id } = await params
  const integracao = await buscarIntegracaoEhsPorId(id)
  if (!integracao) notFound()

  return (
    <div className="container mx-auto py-8 px-4 lg:px-6 max-w-3xl">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Link href="/ehs/integracoes">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-semibold text-foreground">
                {integracao.cliente?.nome} · {integracao.colaborador?.nome_completo}
              </h1>
              <StatusBadge entity="ehs_integracao" status={situacaoExibicaoIntegracao(integracao)} />
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              {formatarData(integracao.data_agendada)}
              {integracao.horario ? ` às ${integracao.horario}` : ""}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ações</CardTitle>
          </CardHeader>
          <CardContent>
            <IntegracaoStatusActions integracaoId={integracao.id} status={integracao.status} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Detalhes</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="flex items-start gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Cliente</p>
                <p>
                  <Link href={`/ehs/clientes/${integracao.cliente?.id}`} className="hover:underline">
                    {integracao.cliente?.nome || "—"}
                  </Link>
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <User className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Prestador</p>
                <p>
                  <Link href={`/ehs/prestadores/${integracao.colaborador?.id}`} className="hover:underline">
                    {integracao.colaborador?.nome_completo || "—"}
                  </Link>
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Data</p>
                <p>{formatarData(integracao.data_agendada)}</p>
              </div>
            </div>
            {integracao.horario && (
              <div className="flex items-start gap-2">
                <Clock className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Horário</p>
                  <p>{integracao.horario}</p>
                </div>
              </div>
            )}
            {(integracao.endereco_local || integracao.cidade) && (
              <div className="flex items-start gap-2 sm:col-span-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Local</p>
                  <p>
                    {[integracao.endereco_local, integracao.sala, integracao.local, integracao.cidade].filter(Boolean).join(" · ")}
                  </p>
                </div>
              </div>
            )}
            {integracao.telefone && (
              <div className="flex items-start gap-2">
                <Phone className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Telefone</p>
                  <p>{integracao.telefone}</p>
                </div>
              </div>
            )}
            {integracao.tempo_estimado_minutos && (
              <div className="flex items-start gap-2">
                <Clock className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Tempo estimado</p>
                  <p>{integracao.tempo_estimado_minutos} min</p>
                </div>
              </div>
            )}
            {integracao.data_validade && (
              <div className="flex items-start gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Válido até</p>
                  <p>{formatarData(integracao.data_validade)}</p>
                </div>
              </div>
            )}
            {integracao.observacoes && (
              <div className="sm:col-span-2 pt-2 border-t">
                <p className="text-xs text-muted-foreground mb-1">Observações</p>
                <p className="whitespace-pre-wrap">{integracao.observacoes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
