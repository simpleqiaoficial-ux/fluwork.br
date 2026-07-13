import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { StatusBadge } from "@/components/ui/status-badge"
import { EmptyState } from "@/components/ui/empty-state"
import { ComplianceRing } from "@/components/ehs/compliance-ring"
import { ConfirmarPresencaButton } from "@/components/ehs/confirmar-presenca-button"
import { CarteirinhasList } from "@/components/ehs/carteirinhas-list"
import { buscarMeuPortalEhs } from "@/app/actions/ehs-portal"
import { getPapelLabel } from "@/lib/papel-labels"
import { calcularSituacaoValidade } from "@/lib/ehs/validade"
import { situacaoExibicaoIntegracao } from "@/lib/ehs/integracoes"
import { FileText, CalendarClock, CreditCard, ShieldAlert } from "lucide-react"

function iniciais(nome: string) {
  return nome.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase()
}

function formatarData(data?: string | null) {
  if (!data) return "—"
  return new Intl.DateTimeFormat("pt-BR").format(new Date(data))
}

export default async function MeuCompliancePage() {
  const resultado = await buscarMeuPortalEhs()

  if (!resultado.ok && resultado.motivo === "nao_autenticado") {
    redirect("/login")
  }

  if (!resultado.ok) {
    return (
      <div className="container mx-auto py-10 px-4 max-w-lg">
        <EmptyState
          icon={ShieldAlert}
          title="Este portal não está disponível pro seu papel"
          description={`Sua conta está com o papel "${getPapelLabel(resultado.motivo === "papel_invalido" ? resultado.papelAtual : "")}". O Meu Compliance é liberado pra todos os papéis, exceto Administrador — quem administra já acompanha o compliance de todo mundo pelo módulo EHS.`}
          className="py-16"
        />
      </div>
    )
  }

  const portal = resultado.portal
  const integracoesFuturas = portal.integracoes.filter((i: any) => ["agendado", "confirmado", "reagendado"].includes(i.status))
  const integracoesPassadas = portal.integracoes.filter((i: any) => !["agendado", "confirmado", "reagendado"].includes(i.status))
  const documentosAusentes = portal.documentosPorTipo.filter((d: any) => !d.atual).length

  return (
    <div className="container mx-auto py-6 px-4 sm:py-8 lg:px-6 max-w-3xl space-y-4 sm:space-y-6">
      {/* Bloco 1: identidade + score — tudo numa única faixa horizontal, sem coluna lateral
          que sobra vazia quando o resto da página é mais alto. */}
      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12 shrink-0">
                <AvatarImage src={portal.foto_url || undefined} alt={portal.nome_completo} />
                <AvatarFallback>{iniciais(portal.nome_completo)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-lg font-semibold text-foreground truncate">{portal.nome_completo}</p>
                <p className="text-sm text-muted-foreground">Meu Compliance</p>
              </div>
            </div>

            <div className="flex items-center gap-5 sm:ml-auto sm:pl-5 sm:border-l">
              <ComplianceRing score={portal.compliance.score} cor={portal.compliance.cor} size={80} className="shrink-0" />
              <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                <div>
                  <p className="text-xs text-muted-foreground">Válidos</p>
                  <p className="text-base font-semibold tabular-nums text-success">{portal.compliance.validos}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Vencidos</p>
                  <p className="text-base font-semibold tabular-nums text-destructive">{portal.compliance.vencidos}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Vencendo</p>
                  <p className="text-base font-semibold tabular-nums text-warning">{portal.compliance.proximosVencer}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Não enviados</p>
                  <p className="text-base font-semibold tabular-nums text-muted-foreground">{documentosAusentes}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Blocos seguintes: todos com a mesma largura cheia, empilhados — nada de coluna curta
          ao lado de coluna longa (é o que deixava a tela torta no celular e no desktop). */}
      {portal.carteirinhas.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              Minhas carteirinhas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CarteirinhasList carteirinhas={portal.carteirinhas} mostrarCliente />
          </CardContent>
        </Card>
      )}

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
              <div key={tipo.id} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-md border p-3 text-sm">
                <span className="font-medium min-w-0 truncate">{tipo.nome}</span>
                {atual ? (
                  atual.status === "rejeitado" ? (
                    <StatusBadge entity="ehs_documento" status="rejeitado" />
                  ) : (
                    situacao && (
                      <span className={`text-xs shrink-0 ${situacao.cor === "verde" ? "text-success" : situacao.cor === "cinza" ? "text-muted-foreground" : "text-warning"}`}>
                        {situacao.chave === "vigente" ? `Válido até ${formatarData(atual.data_validade)}` : situacao.label}
                      </span>
                    )
                  )
                ) : (
                  <span className="text-xs text-muted-foreground shrink-0">Não enviado</span>
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
                  <div className="min-w-0">
                    <p className="font-medium truncate">{integracao.cliente?.nome || "Cliente"}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatarData(integracao.data_agendada)}
                      {integracao.horario ? ` às ${integracao.horario}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
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
  )
}
