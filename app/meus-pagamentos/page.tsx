import { redirect } from "next/navigation"
import { MeusPagamentosList } from "@/components/meus-pagamentos-list"
import { getSession } from "@/lib/session"
import { listarHistoricoReajustes } from "@/app/actions/reajustes"
import { obterLinkEmissaoManual } from "@/app/actions/empresa-config"
import { HistoricoReajustesList } from "@/components/historico-reajustes-list"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { and, desc, eq, inArray } from "drizzle-orm"
import { db } from "@/lib/db"
import { colaboradores, pedidosPagamento } from "@/lib/db/schema"
import { toColaboradorDTO, toPedidoDTO } from "@/lib/db/mappers"

export default async function MeusPagamentosPage() {
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  const [colaboradorRow] = await db
    .select()
    .from(colaboradores)
    .where(eq(colaboradores.id, session.colaboradorId))

  const colaborador = toColaboradorDTO(colaboradorRow)

  // Pedidos em andamento (todos os status exceto pago e nota_recebida)
  const pedidosEmAndamentoRows = await db
    .select()
    .from(pedidosPagamento)
    .where(
      and(
        eq(pedidosPagamento.colaboradorId, session.colaboradorId),
        inArray(pedidosPagamento.status, [
          "pendente_gerente",
          "pendente_financeiro",
          "aprovado",
          "correcao",
          "aguardando_prorrogacao",
          "prorrogacao_negada",
        ]),
      ),
    )
    .orderBy(desc(pedidosPagamento.createdAt))

  // Pedidos concluídos (pago ou nota_recebida)
  const pedidosConcluidosRows = await db
    .select()
    .from(pedidosPagamento)
    .where(
      and(
        eq(pedidosPagamento.colaboradorId, session.colaboradorId),
        inArray(pedidosPagamento.status, ["pago", "nota_recebida"]),
      ),
    )
    .orderBy(desc(pedidosPagamento.createdAt))

  const pedidosEmAndamento = pedidosEmAndamentoRows.map(toPedidoDTO)
  const pedidosConcluidos = pedidosConcluidosRows.map(toPedidoDTO)

  let reajustes: any[] = []
  try {
    reajustes = await listarHistoricoReajustes(session.colaboradorId)
  } catch (error) {
    console.error("[v0] Erro ao carregar reajustes, continuando sem eles:", error)
  }

  const linkEmissaoManual = await obterLinkEmissaoManual()

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 lg:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold mb-1 text-foreground">Meus Pagamentos</h1>
          <p className="text-sm text-muted-foreground">Acompanhe o progresso dos seus pedidos de pagamento</p>
        </div>

        <Tabs defaultValue="andamento" className="w-full">
          <TabsList className="grid w-full max-w-2xl grid-cols-3 h-10">
            <TabsTrigger value="andamento" className="text-sm">Em Andamento ({pedidosEmAndamento?.length || 0})</TabsTrigger>
            <TabsTrigger value="concluidos" className="text-sm">Concluídos ({pedidosConcluidos?.length || 0})</TabsTrigger>
            <TabsTrigger value="reajustes" className="text-sm">Reajustes ({reajustes.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="andamento" className="mt-6">
            <MeusPagamentosList pedidos={pedidosEmAndamento || []} colaborador={colaborador} linkEmissaoManual={linkEmissaoManual} />
          </TabsContent>
          <TabsContent value="concluidos" className="mt-6">
            <MeusPagamentosList pedidos={pedidosConcluidos || []} colaborador={colaborador} linkEmissaoManual={linkEmissaoManual} isHistorico />
          </TabsContent>
          <TabsContent value="reajustes" className="mt-6">
            <HistoricoReajustesList reajustes={reajustes} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
