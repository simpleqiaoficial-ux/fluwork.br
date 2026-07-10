import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, Users, Building2, Pencil, ShieldAlert, UserCircle2, History } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "@/components/ui/status-badge"
import { EmptyState } from "@/components/ui/empty-state"
import { KpiCard } from "@/components/ui/kpi-card"
import { buscarClienteEhsPorId } from "@/app/actions/ehs-clientes"
import { listarAuditoriaEhs } from "@/lib/ehs/auditoria"
import { ClienteStatusToggle } from "@/components/ehs/cliente-status-toggle"

const AUDITORIA_LABELS: Record<string, string> = {
  criado: "Cliente cadastrado",
  atualizado: "Dado atualizado",
  excluido: "Cliente excluído",
}

interface ClienteEhsDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function ClienteEhsDetailPage({ params }: ClienteEhsDetailPageProps) {
  const { id } = await params
  const cliente = await buscarClienteEhsPorId(id)
  if (!cliente) notFound()

  const auditoria = await listarAuditoriaEhs("ehs_clientes", id)

  return (
    <div className="container mx-auto py-8 px-4 lg:px-6 max-w-6xl">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Link href="/ehs/clientes">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-foreground">{cliente.nome}</h1>
              <StatusBadge entity="ehs_cliente" status={cliente.status} />
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              {[cliente.razao_social, cliente.cnpj].filter(Boolean).join(" · ") || "Sem razão social/CNPJ cadastrados"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ClienteStatusToggle clienteId={cliente.id} status={cliente.status} />
          <Button asChild variant="outline" size="sm" className="gap-1.5">
            <Link href={`/ehs/clientes/${cliente.id}/editar`}>
              <Pencil className="h-3.5 w-3.5" />
              Editar
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 mb-8">
        <KpiCard icon={Users} accent="primary" label="Prestadores vinculados" value={String(cliente.prestadores.length)} />
        <KpiCard icon={ShieldAlert} accent="warning" label="Integrações vencidas" value="0" />
        <KpiCard icon={ShieldAlert} accent="warning" label="Integrações próximas" value="0" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                Prestadores vinculados
              </CardTitle>
            </CardHeader>
            <CardContent>
              {cliente.prestadores.length === 0 ? (
                <EmptyState
                  icon={Users}
                  title="Nenhum prestador integrado ainda"
                  description="A vinculação entre prestador e cliente acontece através de uma Integração — recurso das próximas fases do módulo."
                  className="py-10"
                />
              ) : (
                <div className="space-y-2">
                  {cliente.prestadores.map((prestador) => (
                    <div key={prestador.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
                      <span className="font-medium">{prestador.nome_completo}</span>
                      <span className="text-xs text-muted-foreground">{prestador.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <History className="h-4 w-4 text-muted-foreground" />
                Histórico
              </CardTitle>
            </CardHeader>
            <CardContent>
              {auditoria.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma alteração registrada ainda.</p>
              ) : (
                <div className="space-y-3">
                  {auditoria.map((evento) => (
                    <div key={evento.id} className="flex items-start justify-between gap-3 text-sm border-b pb-3 last:border-0 last:pb-0">
                      <div>
                        <p className="font-medium">
                          {AUDITORIA_LABELS[evento.acao] || evento.acao}
                          {evento.campo && <span className="text-muted-foreground"> · {evento.campo}</span>}
                        </p>
                        {evento.campo && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {evento.valor_antigo || "—"} → {evento.valor_novo || "—"}
                          </p>
                        )}
                        {evento.ator_nome && (
                          <p className="text-xs text-muted-foreground mt-0.5">por {evento.ator_nome}</p>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(evento.created_at).toLocaleString("pt-BR")}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                Endereço
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-1">
              {cliente.endereco_logradouro ? (
                <>
                  <p>
                    {cliente.endereco_logradouro}, {cliente.endereco_numero}
                    {cliente.endereco_complemento ? ` · ${cliente.endereco_complemento}` : ""}
                  </p>
                  <p>{cliente.endereco_bairro}</p>
                  <p>
                    {cliente.endereco_cidade}
                    {cliente.endereco_uf ? `/${cliente.endereco_uf}` : ""} {cliente.endereco_cep ? `· ${cliente.endereco_cep}` : ""}
                  </p>
                </>
              ) : (
                <p>Endereço não cadastrado.</p>
              )}
              {cliente.observacoes && (
                <p className="pt-2 border-t mt-2 whitespace-pre-wrap">{cliente.observacoes}</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <UserCircle2 className="h-4 w-4 text-muted-foreground" />
                Responsáveis
              </CardTitle>
            </CardHeader>
            <CardContent>
              {cliente.responsaveis.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum responsável cadastrado.</p>
              ) : (
                <div className="space-y-3">
                  {cliente.responsaveis.map((responsavel: any) => (
                    <div key={responsavel.id} className="text-sm">
                      <p className="font-medium">{responsavel.nome}</p>
                      {responsavel.cargo && <p className="text-xs text-muted-foreground">{responsavel.cargo}</p>}
                      {(responsavel.telefone || responsavel.email) && (
                        <p className="text-xs text-muted-foreground">
                          {[responsavel.telefone, responsavel.email].filter(Boolean).join(" · ")}
                        </p>
                      )}
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
