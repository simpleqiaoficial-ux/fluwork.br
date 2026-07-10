import { getUsuarioLogado } from "@/lib/auth-utils"
import { podeVisualizarPagina, getEffectiveEmpresaId } from "@/lib/tenant"
import { redirect } from "next/navigation"
import { NotasMesesList } from "@/components/notas-meses-list"
import { db } from "@/lib/db"
import { pedidosPagamento } from "@/lib/db/schema"
import { and, desc, eq, inArray, isNotNull } from "drizzle-orm"

// `empresaId` nunca tinha filtro nenhum aqui — todo Adm/Financeiro de qualquer empresa via
// os meses com notas de TODAS as empresas da plataforma. Corrigido escopando por empresa
// (ou pela empresa impersonada, se for o SuperAdmin em modo "visualizar como").
async function listarMesesComNotas(empresaId: string | null) {
  try {
    const rows = await db
      .select({ createdAt: pedidosPagamento.createdAt, status: pedidosPagamento.status })
      .from(pedidosPagamento)
      .where(
        and(
          inArray(pedidosPagamento.status, ["pendente_financeiro", "aprovado", "nota_recebida", "pago"]),
          isNotNull(pedidosPagamento.notaFiscalUrl),
          empresaId === null ? undefined : eq(pedidosPagamento.empresaId, empresaId),
        ),
      )
      .orderBy(desc(pedidosPagamento.createdAt))

    // Agrupa por mes/ano e conta quantas notas tem em cada
    const mesesMap = new Map<string, { total: number; pendentes: number; recebidas: number }>()

    rows.forEach((pedido) => {
      const date = new Date(pedido.createdAt!)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`

      if (!mesesMap.has(key)) {
        mesesMap.set(key, { total: 0, pendentes: 0, recebidas: 0 })
      }

      const mesData = mesesMap.get(key)!
      mesData.total++
      if (pedido.status === "pendente_financeiro" || pedido.status === "aprovado") {
        mesData.pendentes++
      } else {
        mesData.recebidas++
      }
    })

    // Converte para array ordenado por data (mais recente primeiro)
    return Array.from(mesesMap.entries())
      .map(([key, counts]) => {
        const [ano, mes] = key.split("-")
        return {
          key,
          ano: parseInt(ano),
          mes: parseInt(mes),
          ...counts,
        }
      })
      .sort((a, b) => {
        if (a.ano !== b.ano) return b.ano - a.ano
        return b.mes - a.mes
      })
  } catch (error) {
    console.error("[v0] Erro ao buscar meses com notas:", error)
    return []
  }
}

export default async function NotasPage() {
  const usuario = await getUsuarioLogado()

  if (!usuario) {
    redirect("/login")
  }

  if (!podeVisualizarPagina(usuario, ["Financeiro", "Adm"])) {
    redirect("/")
  }

  const meses = await listarMesesComNotas(getEffectiveEmpresaId(usuario))

  return (
    <div className="container mx-auto px-4 lg:px-6 py-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-xl font-semibold mb-1 text-foreground">Gerenciamento de Notas</h1>
        <p className="text-sm text-muted-foreground">
          Visualize e gerencie as notas fiscais dos prestadores organizadas por mês de competência.
        </p>
      </div>

      <NotasMesesList meses={meses} />
    </div>
  )
}
