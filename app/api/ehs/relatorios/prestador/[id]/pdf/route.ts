import { NextResponse, type NextRequest } from "next/server"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { empresas } from "@/lib/db/schema"
import { getTenantScope } from "@/lib/tenant"
import { exigirPermissaoEhs } from "@/lib/ehs/permissions"
import { calcularSituacaoValidade } from "@/lib/ehs/validade"
import { buscarPrestadorEhsPorId } from "@/app/actions/ehs-prestadores"
import { listarDocumentosPrestadorEhs } from "@/app/actions/ehs-documentos"
import { gerarRelatorioPrestadorPdf } from "@/lib/pdf/ehs-compliance-pdf"

function formatarData(data?: string | null) {
  if (!data) return "—"
  return new Intl.DateTimeFormat("pt-BR").format(new Date(data))
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  try {
    const scope = await getTenantScope()
    await exigirPermissaoEhs(scope.usuario.tipo_acesso, "relatorio", "exportar")

    const prestador = await buscarPrestadorEhsPorId(id)
    if (!prestador) return NextResponse.json({ error: "Prestador não encontrado" }, { status: 404 })

    const documentosPorTipo = await listarDocumentosPrestadorEhs(id)
    const empresaId = scope.isSuperAdmin ? prestador.empresa_id : scope.empresaId
    const [empresa] = empresaId ? await db.select({ nome: empresas.nomeFantasia, razaoSocial: empresas.razaoSocial, cnpj: empresas.cnpj }).from(empresas).where(eq(empresas.id, empresaId)) : []

    const pdfBuffer = await gerarRelatorioPrestadorPdf({
      empresa: { nome: empresa?.nome || empresa?.razaoSocial || "FluWork", cnpj: empresa?.cnpj },
      prestador: { nome: prestador.nome_completo, cnpj: prestador.cnpj, email: prestador.email },
      geradoEm: new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date()),
      compliance: {
        score: prestador.compliance.score,
        validos: prestador.compliance.validos,
        vencidos: prestador.compliance.vencidos,
        proximosVencer: prestador.compliance.proximosVencer,
        total: prestador.compliance.total,
      },
      documentos: documentosPorTipo.map(({ tipo, atual }) => ({
        nome: tipo.nome,
        categoria: tipo.categoria,
        status: atual?.status || "ausente",
        versao: atual?.versao || 0,
        dataEmissaoFormatada: formatarData(atual?.data_emissao),
        dataValidadeFormatada: formatarData(atual?.data_validade),
        situacaoLabel: !atual ? "Não enviado" : atual.status === "rejeitado" ? "Rejeitado" : calcularSituacaoValidade(atual.data_validade).label,
      })),
    })

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="compliance-${prestador.nome_completo.replace(/\s+/g, "-").toLowerCase()}.pdf"`,
        "Cache-Control": "private, max-age=0, no-store",
      },
    })
  } catch (error) {
    console.error("[ehs] Erro ao gerar PDF de compliance:", error)
    return NextResponse.json({ error: "Erro ao gerar relatório" }, { status: 500 })
  }
}
