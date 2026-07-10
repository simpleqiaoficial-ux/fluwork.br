import Link from "next/link"
import { redirect } from "next/navigation"
import { and, count, eq, ne } from "drizzle-orm"
import { db } from "@/lib/db"
import { colaboradores, ehsClientes, ehsDocumentos } from "@/lib/db/schema"
import { getCurrentUser, getTenantScope, podeVisualizarPagina } from "@/lib/tenant"
import { seedPermissoesEhs } from "@/lib/ehs/permissions"
import { seedTiposDocumentoEhs } from "@/lib/ehs/tipos-documento"
import { calcularSituacaoValidade } from "@/lib/ehs/validade"
import { listarPendenciasEhs } from "@/lib/ehs/pendencias"
import { listarComplianceClientesEhs } from "@/lib/ehs/dashboard"
import { listarIntegracoesEhs } from "@/app/actions/ehs-integracoes"
import { KpiCard } from "@/components/ui/kpi-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import { StatusBadge } from "@/components/ui/status-badge"
import { ComplianceHeatmap } from "@/components/ehs/compliance-heatmap"
import { Building2, ShieldAlert, ShieldCheck, Users, CalendarClock, Gauge, ArrowRight } from "lucide-react"

function formatarData(data: string) {
  return new Intl.DateTimeFormat("pt-BR").format(new Date(data))
}

export default async function EhsDashboardPage() {
  const usuario = await getCurrentUser()
  if (!usuario) redirect("/login")
  if (!podeVisualizarPagina(usuario, ["Adm", "EHS", "SuperAdmin"])) redirect("/")

  // Garante que o catálogo de permissões/tipos de documento do módulo existe — idempotente,
  // seguro em toda carga.
  await seedPermissoesEhs()
  await seedTiposDocumentoEhs()

  const scope = await getTenantScope()
  const escopoEmpresa = scope.empresaId === null ? undefined : eq(colaboradores.empresaId, scope.empresaId)

  const [{ value: prestadoresCadastrados }] = await db
    .select({ value: count() })
    .from(colaboradores)
    .where(escopoEmpresa ? and(eq(colaboradores.tipoAcesso, "Colaborador"), escopoEmpresa) : eq(colaboradores.tipoAcesso, "Colaborador"))

  const escopoClientes = scope.empresaId === null ? undefined : eq(ehsClientes.empresaId, scope.empresaId)
  const [{ value: clientesAtivos }] = await db
    .select({ value: count() })
    .from(ehsClientes)
    .where(escopoClientes ? and(eq(ehsClientes.status, "ativo"), escopoClientes) : eq(ehsClientes.status, "ativo"))

  // Vencimento é sempre calculado em tempo de leitura (nunca persistido) — busca só os
  // documentos vigentes (não substituídos) e filtra em memória pela data de validade.
  const escopoDocumentos = scope.empresaId === null ? undefined : eq(ehsDocumentos.empresaId, scope.empresaId)
  const documentosAtivos = await db
    .select({ dataValidade: ehsDocumentos.dataValidade })
    .from(ehsDocumentos)
    .where(escopoDocumentos ? and(ne(ehsDocumentos.status, "substituido"), escopoDocumentos) : ne(ehsDocumentos.status, "substituido"))
  const documentosPendentes = documentosAtivos.filter((d) => calcularSituacaoValidade(d.dataValidade).chave === "vencido").length

  const hoje = new Date().toISOString().slice(0, 10)
  const em7dias = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

  const [pendencias, complianceClientes, integracoesSemana] = await Promise.all([
    listarPendenciasEhs(),
    listarComplianceClientesEhs(),
    listarIntegracoesEhs({ de: hoje, ate: em7dias }),
  ])

  const proximasIntegracoes = integracoesSemana.filter((i) => ["agendado", "confirmado", "reagendado"].includes(i.status)).slice(0, 5)

  const totalPrestadoresComVinculo = complianceClientes.reduce((acc, c) => acc + c.prestadores.length, 0)
  const prestadoresVerdes = complianceClientes.reduce((acc, c) => acc + c.prestadores.filter((p) => p.cor === "verde").length, 0)
  const complianceMedio = totalPrestadoresComVinculo > 0 ? Math.round((prestadoresVerdes / totalPrestadoresComVinculo) * 100) : null

  return (
    <div className="container mx-auto py-8 px-4 lg:px-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-xl font-semibold mb-1 text-foreground">Dashboard EHS</h1>
        <p className="text-sm text-muted-foreground">Gestão de terceiros e compliance de Segurança do Trabalho</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6 mb-8">
        <KpiCard icon={Users} accent="primary" label="Prestadores" value={String(prestadoresCadastrados)} />
        <KpiCard icon={Building2} accent="primary" label="Clientes ativos" value={String(clientesAtivos)} />
        <KpiCard icon={CalendarClock} accent="primary" label="Integrações (7d)" value={String(proximasIntegracoes.length)} />
        <KpiCard icon={Gauge} accent={complianceMedio === null ? "primary" : complianceMedio >= 80 ? "success" : complianceMedio >= 50 ? "warning" : "destructive"} label="Compliance médio" value={complianceMedio === null ? "—" : `${complianceMedio}%`} />
        <KpiCard icon={ShieldAlert} accent="warning" label="Documentos vencidos" value={String(documentosPendentes)} />
        <KpiCard icon={ShieldAlert} accent={pendencias.length > 0 ? "destructive" : "primary"} label="Pendências" value={String(pendencias.length)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-muted-foreground" />
              Compliance por cliente
            </CardTitle>
          </CardHeader>
          <CardContent>
            {complianceClientes.length === 0 ? (
              <EmptyState icon={Building2} title="Nenhum prestador integrado ainda" description="O mapa de compliance aparece assim que houver integrações vinculando prestadores a clientes." className="py-10" />
            ) : (
              <ComplianceHeatmap clientes={complianceClientes} />
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-dashed">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-1">
                <p className="font-medium text-foreground text-sm">Central de Pendências</p>
                <ShieldAlert className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground mb-3">Documentos e integrações que precisam de atenção agora.</p>
              <Button asChild variant="outline" size="sm" className="w-full gap-1.5">
                <Link href="/ehs/pendencias">
                  Ver {pendencias.length} pendência{pendencias.length === 1 ? "" : "s"}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CalendarClock className="h-4 w-4 text-muted-foreground" />
                Próximas integrações
              </CardTitle>
            </CardHeader>
            <CardContent>
              {proximasIntegracoes.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma integração nos próximos 7 dias.</p>
              ) : (
                <div className="space-y-2">
                  {proximasIntegracoes.map((integracao) => (
                    <Link key={integracao.id} href={`/ehs/integracoes/${integracao.id}`} className="flex items-center justify-between gap-2 rounded-md border p-2.5 text-sm hover:border-primary/40 transition-colors">
                      <div className="min-w-0">
                        <p className="font-medium truncate">{integracao.colaborador?.nome_completo}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {integracao.cliente?.nome} · {formatarData(integracao.data_agendada)}
                        </p>
                      </div>
                      <StatusBadge entity="ehs_integracao" status={integracao.status} />
                    </Link>
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
