import { getUsuarioLogado } from "@/lib/auth-utils"
import { podeVisualizarPagina, getEffectiveEmpresaId } from "@/lib/tenant"
import { redirect } from "next/navigation"
import { NotasPeriodoList } from "@/components/notas-periodo-list"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { db } from "@/lib/db"
import { pedidosPagamento } from "@/lib/db/schema"
import { and, desc, eq, gte, inArray, lt } from "drizzle-orm"
import { toPedidoDTO } from "@/lib/db/mappers"

const MESES_NOMES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
]

async function listarNotasDoPeriodo(ano: number, mes: number, empresaId: string) {
  // Define o range de datas para o mes
  const dataInicio = new Date(ano, mes - 1, 1)
  const dataFim = new Date(ano, mes, 1)

  try {
    const rows = await db.query.pedidosPagamento.findMany({
      where: and(
        eq(pedidosPagamento.empresaId, empresaId),
        inArray(pedidosPagamento.status, ["pendente_financeiro", "aprovado", "nota_recebida", "pago"]),
        gte(pedidosPagamento.createdAt, dataInicio),
        lt(pedidosPagamento.createdAt, dataFim),
      ),
      orderBy: desc(pedidosPagamento.createdAt),
      with: {
        colaborador: true,
        notaFiscal: true,
      },
    })

    // Filtra apenas pedidos com nota fiscal ou reembolso KM
    const filtrados = rows.filter((p) => {
      const hasNota = Boolean(p.notaFiscalUrl) || Boolean(p.notaFiscal)
      const isReembolsoKm = p.tipoPedido === "reembolso_km"
      return hasNota || isReembolsoKm
    })

    return filtrados.map((row) => toPedidoDTO(row))
  } catch (error) {
    console.error("[v0] Erro ao buscar notas do período:", error)
    return []
  }
}

export default async function NotasPeriodoPage({
  params,
}: {
  params: Promise<{ periodo: string }>
}) {
  const usuario = await getUsuarioLogado()

  if (!usuario) {
    redirect("/login")
  }

  if (!podeVisualizarPagina(usuario, ["Financeiro", "Adm"])) {
    redirect("/")
  }

  const { periodo } = await params
  const [anoStr, mesStr] = periodo.split("-")
  const ano = parseInt(anoStr)
  const mes = parseInt(mesStr)

  if (isNaN(ano) || isNaN(mes) || mes < 1 || mes > 12) {
    redirect("/gestao/notas")
  }

  const notas = await listarNotasDoPeriodo(ano, mes, getEffectiveEmpresaId(usuario)!)
  const mesNome = MESES_NOMES[mes - 1]

  return (
    <div className="container mx-auto px-4 lg:px-6 py-8 max-w-6xl">
      <div className="mb-6">
        <Link href="/gestao/notas">
          <Button variant="ghost" size="sm" className="mb-4 -ml-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para meses
          </Button>
        </Link>

        <h1 className="text-2xl font-semibold mb-1 text-foreground">
          {mesNome} {ano}
        </h1>
        <p className="text-sm text-muted-foreground">
          {notas.length} {notas.length === 1 ? "nota fiscal encontrada" : "notas fiscais encontradas"}
        </p>
      </div>

      <NotasPeriodoList pedidos={notas} />
    </div>
  )
}
