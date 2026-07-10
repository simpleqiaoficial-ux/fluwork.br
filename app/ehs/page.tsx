import { redirect } from "next/navigation"
import { and, count, eq, ne } from "drizzle-orm"
import { db } from "@/lib/db"
import { colaboradores, ehsClientes, ehsDocumentos, ehsIntegracoes } from "@/lib/db/schema"
import { getCurrentUser, getTenantScope, podeVisualizarPagina } from "@/lib/tenant"
import { seedPermissoesEhs } from "@/lib/ehs/permissions"
import { seedTiposDocumentoEhs } from "@/lib/ehs/tipos-documento"
import { calcularSituacaoValidade } from "@/lib/ehs/validade"
import { KpiCard } from "@/components/ui/kpi-card"
import { Card, CardContent } from "@/components/ui/card"
import { Building2, FileWarning, ShieldCheck, Users } from "lucide-react"

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

  const escopoIntegracoes = scope.empresaId === null ? undefined : eq(ehsIntegracoes.empresaId, scope.empresaId)
  const [{ value: integracoesAgendadas }] = await db
    .select({ value: count() })
    .from(ehsIntegracoes)
    .where(escopoIntegracoes)

  // Vencimento é sempre calculado em tempo de leitura (nunca persistido) — busca só os
  // documentos vigentes (não substituídos) e filtra em memória pela data de validade.
  const escopoDocumentos = scope.empresaId === null ? undefined : eq(ehsDocumentos.empresaId, scope.empresaId)
  const documentosAtivos = await db
    .select({ dataValidade: ehsDocumentos.dataValidade })
    .from(ehsDocumentos)
    .where(escopoDocumentos ? and(ne(ehsDocumentos.status, "substituido"), escopoDocumentos) : ne(ehsDocumentos.status, "substituido"))
  const documentosPendentes = documentosAtivos.filter((d) => calcularSituacaoValidade(d.dataValidade).chave === "vencido").length

  return (
    <div className="container mx-auto py-8 px-4 lg:px-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-xl font-semibold mb-1 text-foreground">Dashboard EHS</h1>
        <p className="text-sm text-muted-foreground">Gestão de terceiros e compliance de Segurança do Trabalho</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-8">
        <KpiCard icon={Users} accent="primary" label="Prestadores cadastrados" value={String(prestadoresCadastrados)} />
        <KpiCard icon={Building2} accent="primary" label="Clientes ativos" value={String(clientesAtivos)} />
        <KpiCard icon={ShieldCheck} accent="primary" label="Integrações" value={String(integracoesAgendadas)} />
        <KpiCard icon={FileWarning} accent="warning" label="Documentos vencidos" value={String(documentosPendentes)} />
      </div>

      <Card className="border-dashed">
        <CardContent className="p-8 text-center">
          <ShieldCheck className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="font-medium text-foreground">Módulo EHS & Compliance em construção</p>
          <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
            Clientes, Prestadores e Documentos já estão no ar. Integrações, Agenda, Central de
            Pendências e os demais recursos chegam nas próximas fases.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
