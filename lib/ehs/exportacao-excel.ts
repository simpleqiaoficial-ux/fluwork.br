import * as XLSX from "xlsx"
import { and, eq, ne } from "drizzle-orm"
import { db } from "@/lib/db"
import { ehsDocumentos } from "@/lib/db/schema"
import { getTenantScope } from "@/lib/tenant"
import { exigirPermissaoEhs } from "@/lib/ehs/permissions"
import { listarClientesEhs } from "@/app/actions/ehs-clientes"
import { listarPrestadoresEhs } from "@/app/actions/ehs-prestadores"
import { listarPendenciasEhs } from "@/lib/ehs/pendencias"
import { calcularSituacaoValidade } from "@/lib/ehs/validade"

function formatarData(data?: string | Date | null) {
  if (!data) return ""
  return new Intl.DateTimeFormat("pt-BR").format(new Date(data))
}

/** Workbook único com o retrato atual do módulo EHS — cada aba é uma visão já existente no
 *  produto (Clientes, Prestadores, Documentos, Pendências), só que tabulada pra planilha.
 *  Gerado sob demanda a cada download, nunca armazenado. */
export async function gerarWorkbookEhs(): Promise<Buffer> {
  const scope = await getTenantScope()
  await exigirPermissaoEhs(scope.usuario.tipo_acesso, "relatorio", "exportar")

  const [clientes, prestadores, pendencias] = await Promise.all([listarClientesEhs(), listarPrestadoresEhs(), listarPendenciasEhs()])

  const escopoDocumentos = scope.isSuperAdmin
    ? ne(ehsDocumentos.status, "substituido")
    : and(ne(ehsDocumentos.status, "substituido"), eq(ehsDocumentos.empresaId, scope.empresaId!))
  const documentos = await db.query.ehsDocumentos.findMany({ where: escopoDocumentos, with: { tipoDocumento: true, colaborador: true } })

  const wb = XLSX.utils.book_new()

  const abaClientes = clientes.map((c: any) => ({
    Nome: c.nome,
    "Razão Social": c.razao_social || "",
    CNPJ: c.cnpj || "",
    Cidade: c.endereco_cidade || "",
    UF: c.endereco_uf || "",
    Status: c.status,
    "Prestadores vinculados": c.prestadores_vinculados,
  }))
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(abaClientes), "Clientes")

  const abaPrestadores = prestadores.map((p: any) => ({
    Nome: p.nome_completo,
    "E-mail": p.email || "",
    "Compliance Score": p.compliance.score === null ? "" : `${p.compliance.score}%`,
    Válidos: p.compliance.validos,
    Vencidos: p.compliance.vencidos,
    "Vencendo em breve": p.compliance.proximosVencer,
  }))
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(abaPrestadores), "Prestadores")

  const abaDocumentos = documentos.map((d) => ({
    Prestador: d.colaborador?.nomeCompleto || "",
    Documento: d.tipoDocumento?.nome || "",
    Categoria: d.tipoDocumento?.categoria || "",
    Versão: d.versao,
    Status: d.status,
    Situação: calcularSituacaoValidade(d.dataValidade).label,
    Emissão: formatarData(d.dataEmissao),
    Validade: formatarData(d.dataValidade),
  }))
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(abaDocumentos), "Documentos")

  const abaPendencias = pendencias.map((p) => ({
    Tipo: p.tipo,
    Título: p.titulo,
    Descrição: p.descricao,
    Data: formatarData(p.data),
  }))
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(abaPendencias), "Pendências")

  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer
}
