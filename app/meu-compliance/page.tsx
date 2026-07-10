import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { StatusBadge } from "@/components/ui/status-badge"
import { EmptyState } from "@/components/ui/empty-state"
import { ComplianceRing } from "@/components/ehs/compliance-ring"
import { ConfirmarPresencaButton } from "@/components/ehs/confirmar-presenca-button"
import { buscarMeuPortalEhs } from "@/app/actions/ehs-portal"
import { calcularSituacaoValidade } from "@/lib/ehs/validade"
import { situacaoExibicaoIntegracao } from "@/lib/ehs/integracoes"
import { FileText, CalendarClock } from "lucide-react"

function iniciais(nome: string) {
  return nome.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase()
}

function formatarData(data?: string | null) {
  if (!data) return "—"
  return new Intl.DateTimeFormat("pt-BR").format(new Date(data))
}

export default async function MeuCompliancePage() {
  const portal = await buscarMeuPortalEhs()
  if (!portal) redirect("/meus-pagamentos")

  const integracoesFuturas = portal.integracoes.filter((i: any) => ["agendado", "confirmado", "reagendado"].includes(i.status))
  const integracoesPassadas = portal.integracoes.filter((i: any) => !["agendado", "confirmado", "reagendado"].includes(i.status))
  const documentosAusentes = portal.documentosPorTipo.filter((d: any) => !d.atual).length

  return (
    <div className="container mx-auto py-8 px-4 lg:px-6 max-w-4xl">
      <div className="mb-8 flex items-center gap-3">
        <Avatar className="h-12 w-12">
          <AvatarImage src={portal.foto_url || undefined} alt={portal.nome_completo} />
          <AvatarFallback>{iniciais(portal.nome_completo)}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-xl font-semibold text-foreground">Meu Compliance</h1>
          <p className="text-sm text-muted-foreground">{portal.nome_completo}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <Card className="lg:col-span-1">
          <CardContent className="flex flex-col items-center gap-4 p-6">
            <ComplianceRing score={portal.compliance.score} cor={portal.compliance.cor} size={128} />
            <p className="text-sm text-muted-foreground -mt-1">Seu Compliance Score</p>
            <div className="grid grid-cols-2 gap-3 w-full pt-2 border-t">
              <div>
                <p className="text-xs text-muted-foreground">Válidos</p>
                <p className="text-lg font-semibold tabular-nums text-success">{portal.compliance.validos}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Vencidos</p>
                <p className="text-lg font-semibold tabular-nums text-destructive">{portal.compliance.vencidos}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Vencendo em breve</p>
                <p className="text-lg font-semibold tabular-nums text-warning">{portal.compliance.proximosVencer}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Não enviados</p>
                <p className="text-lg font-semibold tabular-nums text-muted-foreground">{documentosAusentes}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                Meus documentos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {portal.documentosPorTipo.map(({ tipo, atual }: any) => {
                const situacao = atual ? calcularSituacaoValidade(atual.data_validade) : null
                return (
                  <div key={tipo.id} className="flex items-center justify-between gap-3 rounded-md border p-3 text-sm">
                    <span className="font-medium">{tipo.nome}</span>
                    {atual ? (
                      atual.status === "rejeitado" ? (
                        <StatusBadge entity="ehs_documento" status="rejeitado" />
                      ) : (
                        situacao && <span className={`text-xs ${situacao.cor === "verde" ? "text-success" : situacao.cor === "cinza" ? "text-muted-foreground" : "text-warning"}`}>{situacao.chave === "vigente" ? `Válido até ${formatarData(atual.data_validade)}` : situacao.label}</span>
                      )
                    ) : (
                      <span className="text-xs text-muted-foreground">Não enviado</span>
                    )}
                  </div>
                )
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CalendarClock className="h-4 w-4 text-muted-foreground" />
                Minhas integrações
              </CardTitle>
            </CardHeader>
            <CardContent>
              {portal.integracoes.length === 0 ? (
                <EmptyState icon={CalendarClock} title="Nenhuma integração agendada" description="Quando você for agendado em um cliente, aparece aqui." className="py-10" />
              ) : (
                <div className="space-y-2">
                  {[...integracoesFuturas, ...integracoesPassadas].map((integracao: any) => (
                    <div key={integracao.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3 text-sm">
                      <div>
                        <p className="font-medium">{integracao.cliente?.nome || "Cliente"}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatarData(integracao.data_agendada)}
                          {integracao.horario ? ` às ${integracao.horario}` : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge entity="ehs_integracao" status={situacaoExibicaoIntegracao(integracao)} />
                        {integracao.status === "agendado" && <ConfirmarPresencaButton integracaoId={integracao.id} />}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
