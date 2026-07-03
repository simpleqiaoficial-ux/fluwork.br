import { getUsuarioLogado } from "@/lib/auth-utils"
import { redirect } from "next/navigation"
import { getSupabaseServerClient } from "@/lib/supabase-server"
import { NotasMesesList } from "@/components/notas-meses-list"

async function listarMesesComNotas() {
  const supabase = await getSupabaseServerClient()

  const { data, error } = await supabase
    .from("pedidos_pagamento")
    .select("created_at, status")
    .in("status", ["pendente_financeiro", "aprovado", "nota_recebida", "pago"])
    .not("nota_fiscal_url", "is", null)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[v0] Erro ao buscar meses com notas:", error)
    return []
  }

  // Agrupa por mes/ano e conta quantas notas tem em cada
  const mesesMap = new Map<string, { total: number; pendentes: number; recebidas: number }>()

  data?.forEach((pedido) => {
    const date = new Date(pedido.created_at)
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
}

export default async function NotasPage() {
  const usuario = await getUsuarioLogado()

  if (!usuario) {
    redirect("/login")
  }

  if (!["Financeiro", "Adm"].includes(usuario.tipo_acesso)) {
    redirect("/")
  }

  const meses = await listarMesesComNotas()

  return (
    <div className="container mx-auto px-4 lg:px-6 py-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold mb-1 text-foreground">Gerenciamento de Notas</h1>
        <p className="text-sm text-muted-foreground">
          Visualize e gerencie as notas fiscais organizadas por periodo
        </p>
      </div>

      <NotasMesesList meses={meses} />
    </div>
  )
}
