"use client"

import { useMemo, useState } from "react"
import { Wallet, CheckCircle2, Receipt, ShieldCheck } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useMaskedCurrency } from "@/components/currency-display"

interface PedidoResumo {
  status?: string
  valor_total: number
  created_at: string
}

interface PrestadorKpiRowProps {
  pedidos: PedidoResumo[]
  empresaAtiva: boolean
  prestadorDesde: string
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

/** Linha de KPIs do próprio prestador — Total recebido (filtrável por mês) + Ordens concluídas
 *  + Ticket médio, tudo derivado só de pedidos com status "pago" (dinheiro que já caiu de
 *  verdade), mais o status da empresa contratante. Sem indicador de variação (%) porque isso
 *  exigiria definir um período de comparação — preferi omitir a inventar um número. */
export function TotalRecebidoCard({ pedidos, empresaAtiva, prestadorDesde }: PrestadorKpiRowProps) {
  const { formatValue } = useMaskedCurrency()
  const [mesSelecionado, setMesSelecionado] = useState("todos")

  const pagos = useMemo(() => pedidos.filter((p) => p.status === "pago"), [pedidos])

  const opcoesMes = useMemo(() => {
    const chaves = new Set(pagos.map((p) => chaveMes(p.created_at)))
    return Array.from(chaves).sort().reverse()
  }, [pagos])

  const pagosFiltrados = useMemo(() => {
    return mesSelecionado === "todos" ? pagos : pagos.filter((p) => chaveMes(p.created_at) === mesSelecionado)
  }, [pagos, mesSelecionado])

  const total = pagosFiltrados.reduce((soma, p) => soma + p.valor_total, 0)
  const ticketMedio = pagosFiltrados.length > 0 ? total / pagosFiltrados.length : 0

  return (
    <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
      <Card className="col-span-2 lg:col-span-1">
        <CardContent className="p-5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <Wallet className="h-3.5 w-3.5 text-muted-foreground/70" />
              <p className="text-xs text-muted-foreground">Total recebido</p>
            </div>
            <Select value={mesSelecionado} onValueChange={setMesSelecionado}>
              <SelectTrigger className="h-6 w-auto gap-1 border-none px-1.5 text-[11px] text-muted-foreground shadow-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="end">
                <SelectItem value="todos">Todo período</SelectItem>
                {opcoesMes.map((chave) => (
                  <SelectItem key={chave} value={chave}>
                    {labelMes(chave)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <p className="mt-2 text-xl font-semibold tabular-nums text-success">{formatValue(total)}</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-muted-foreground/70" />
            <p className="text-xs text-muted-foreground">Ordens pagas</p>
          </div>
          <p className="mt-2 text-xl font-semibold tabular-nums text-foreground">{pagosFiltrados.length}</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <div className="flex items-center gap-1.5">
            <Receipt className="h-3.5 w-3.5 text-muted-foreground/70" />
            <p className="text-xs text-muted-foreground">Ticket médio</p>
          </div>
          <p className="mt-2 text-xl font-semibold tabular-nums text-foreground">{formatValue(ticketMedio)}</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground/70" />
            <p className="text-xs text-muted-foreground">Status da conta</p>
          </div>
          <p className={`mt-2 text-xl font-semibold ${empresaAtiva ? "text-success" : "text-destructive"}`}>
            {empresaAtiva ? "Ativa" : "Bloqueada"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Desde {prestadorDesde}</p>
        </CardContent>
      </Card>
    </div>
  )
}
