"use client"

import { useMemo, useState } from "react"
import { Wallet } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useMaskedCurrency } from "@/components/currency-display"

interface PedidoResumo {
  status?: string
  valor_total: number
  created_at: string
}

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
]

function chaveMes(dataIso: string) {
  const d = new Date(dataIso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

function labelMes(chave: string) {
  const [ano, mes] = chave.split("-").map(Number)
  return `${MESES[mes - 1]} ${ano}`
}

/** "Total recebido" do próprio prestador — soma de pedidos com status "pago", filtrável por mês
 *  de criação (mesma convenção de agrupamento por mês já usada no dashboard administrativo). */
export function TotalRecebidoCard({ pedidos }: { pedidos: PedidoResumo[] }) {
  const { formatValue } = useMaskedCurrency()
  const [mesSelecionado, setMesSelecionado] = useState("todos")

  const pagos = useMemo(() => pedidos.filter((p) => p.status === "pago"), [pedidos])

  const opcoesMes = useMemo(() => {
    const chaves = new Set(pagos.map((p) => chaveMes(p.created_at)))
    return Array.from(chaves).sort().reverse()
  }, [pagos])

  const total = useMemo(() => {
    const filtrados = mesSelecionado === "todos" ? pagos : pagos.filter((p) => chaveMes(p.created_at) === mesSelecionado)
    return filtrados.reduce((soma, p) => soma + p.valor_total, 0)
  }, [pagos, mesSelecionado])

  return (
    <Card className="mb-6">
      <CardContent className="p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5">
            <Wallet className="h-3.5 w-3.5 text-muted-foreground/70" />
            <p className="text-xs text-muted-foreground">Total recebido</p>
          </div>
          <p className="mt-2 text-xl font-semibold tabular-nums text-success">{formatValue(total)}</p>
        </div>
        <Select value={mesSelecionado} onValueChange={setMesSelecionado}>
          <SelectTrigger className="w-[180px] h-9 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todo o período</SelectItem>
            {opcoesMes.map((chave) => (
              <SelectItem key={chave} value={chave}>
                {labelMes(chave)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  )
}
