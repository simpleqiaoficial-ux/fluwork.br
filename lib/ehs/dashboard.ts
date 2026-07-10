import { and, eq, ne } from "drizzle-orm"
import { db } from "@/lib/db"
import { ehsClientes, ehsDocumentos, ehsIntegracoes } from "@/lib/db/schema"
import { getTenantScope } from "@/lib/tenant"
import { exigirPermissaoEhs } from "@/lib/ehs/permissions"
import { calcularComplianceDocumentos, type ComplianceResultado } from "@/lib/ehs/compliance"

export interface PrestadorComplianceResumo {
  id: string
  nome_completo: string
  cor: ComplianceResultado["cor"]
}

export interface ComplianceClienteEhs {
  id: string
  nome: string
  prestadores: PrestadorComplianceResumo[]
}

/** Compliance dos prestadores agrupado por cliente — alimenta o heatmap do dashboard. Reaproveita
 *  o mesmo cálculo de Compliance Score do Prestador (lib/ehs/compliance.ts), só que agregado
 *  pela ótica do cliente em vez da ótica individual. */
export async function listarComplianceClientesEhs(): Promise<ComplianceClienteEhs[]> {
  const scope = await getTenantScope()
  await exigirPermissaoEhs(scope.usuario.tipo_acesso, "dashboard", "visualizar")

  const escopoClientes = scope.isSuperAdmin ? eq(ehsClientes.status, "ativo") : and(eq(ehsClientes.status, "ativo"), eq(ehsClientes.empresaId, scope.empresaId!))
  const clientes = await db.select({ id: ehsClientes.id, nome: ehsClientes.nome }).from(ehsClientes).where(escopoClientes)
  if (clientes.length === 0) return []

  const escopoIntegracoes = scope.isSuperAdmin ? undefined : eq(ehsIntegracoes.empresaId, scope.empresaId!)
  const integracoes = await db.query.ehsIntegracoes.findMany({ where: escopoIntegracoes, with: { colaborador: true } })

  const escopoDocumentos = scope.isSuperAdmin
    ? ne(ehsDocumentos.status, "substituido")
    : and(ne(ehsDocumentos.status, "substituido"), eq(ehsDocumentos.empresaId, scope.empresaId!))
  const documentos = await db.select({ colaboradorId: ehsDocumentos.colaboradorId, status: ehsDocumentos.status, dataValidade: ehsDocumentos.dataValidade }).from(ehsDocumentos).where(escopoDocumentos)

  const documentosPorColaborador = new Map<string, { status: string; dataValidade: string | null }[]>()
  for (const documento of documentos) {
    const lista = documentosPorColaborador.get(documento.colaboradorId) || []
    lista.push({ status: documento.status, dataValidade: documento.dataValidade })
    documentosPorColaborador.set(documento.colaboradorId, lista)
  }

  return clientes
    .map((cliente) => {
      const vinculados = new Map<string, { id: string; nome_completo: string }>()
      for (const integracao of integracoes) {
        if (integracao.clienteId === cliente.id && integracao.colaborador && !vinculados.has(integracao.colaboradorId)) {
          vinculados.set(integracao.colaboradorId, { id: integracao.colaborador.id, nome_completo: integracao.colaborador.nomeCompleto })
        }
      }
      const prestadores = Array.from(vinculados.values()).map((prestador) => ({
        ...prestador,
        cor: calcularComplianceDocumentos(documentosPorColaborador.get(prestador.id) || []).cor,
      }))
      return { id: cliente.id, nome: cliente.nome, prestadores }
    })
    .filter((cliente) => cliente.prestadores.length > 0)
}
