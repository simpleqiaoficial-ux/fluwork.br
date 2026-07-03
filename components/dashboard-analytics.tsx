"use client"

import { useState, useMemo } from "react"
import type { PedidoPagamento } from "@/types/pedido"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useMaskedCurrency } from "@/components/currency-display"
import {
  DollarSign,
  Clock,
  Car,
  Bus,
  Briefcase,
  TrendingUp,
  Calendar,
  Search,
  Download,
  ChevronDown,
  ChevronUp,
  Receipt,
  Filter,
} from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"

interface DashboardAnalyticsProps {
  pedidos: PedidoPagamento[]
  equipes: Array<{ id: string; nome: string }>
}

const STATUS_LABELS: Record<string, string> = {
  pendente_gerente: "Pend. Gerente",
  pendente_financeiro: "Pend. Financeiro",
  aprovado: "Aprovado",
  recusado: "Recusado",
  correcao: "Correção",
  pago: "Pago",
  nota_recebida: "Nota Recebida",
}

const STATUS_COLORS: Record<string, string> = {
  pendente_gerente: "bg-amber-50 text-amber-800 border-amber-200",
  pendente_financeiro: "bg-sky-50 text-sky-800 border-sky-200",
  aprovado: "bg-emerald-50 text-emerald-800 border-emerald-200",
  recusado: "bg-red-50 text-red-800 border-red-200",
  correcao: "bg-orange-50 text-orange-800 border-orange-200",
  pago: "bg-green-50 text-green-800 border-green-200",
  nota_recebida: "bg-teal-50 text-teal-800 border-teal-200",
}

const PIE_COLORS = ["#171717", "#404040", "#737373", "#a3a3a3", "#d4d4d4"]

const TIPO_LABELS: Record<string, string> = {
  salario: "Salario",
  horas_extras: "Horas Extras",
  reembolso_km: "Reembolso KM",
  plantao: "Plantao",
  conducao: "Conducao",
}

function formatDateBR(dateString: string) {
  const d = new Date(dateString)
  return d.toLocaleDateString("pt-BR")
}

export function DashboardAnalytics({ pedidos, equipes }: DashboardAnalyticsProps) {
  const { formatValue, valoresVisiveis } = useMaskedCurrency()

  // Filters
  const [dataInicio, setDataInicio] = useState("")
  const [dataFim, setDataFim] = useState("")
  const [busca, setBusca] = useState("")
  const [statusFilter, setStatusFilter] = useState("todos")
  const [tipoFilter, setTipoFilter] = useState("todos")
  const [equipeFilter, setEquipeFilter] = useState("todas")
  const [sortField, setSortField] = useState<string>("created_at")
  const [sortAsc, setSortAsc] = useState(false)
  const [expandedRow, setExpandedRow] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)

  // Quick date presets
  const setPreset = (days: number) => {
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - days)
    setDataInicio(start.toISOString().split("T")[0])
    setDataFim(end.toISOString().split("T")[0])
  }

  const setMonthPreset = () => {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    setDataInicio(start.toISOString().split("T")[0])
    setDataFim(now.toISOString().split("T")[0])
  }

  const clearFilters = () => {
    setDataInicio("")
    setDataFim("")
    setBusca("")
    setStatusFilter("todos")
    setTipoFilter("todos")
    setEquipeFilter("todas")
  }

  // Filtered pedidos
  const filteredPedidos = useMemo(() => {
    let result = [...pedidos]

    if (dataInicio) {
      result = result.filter((p) => p.created_at >= dataInicio)
    }
    if (dataFim) {
      const end = new Date(dataFim)
      end.setDate(end.getDate() + 1)
      result = result.filter((p) => p.created_at < end.toISOString())
    }
    if (busca) {
      const q = busca.toLowerCase()
      result = result.filter(
        (p) =>
          p.colaborador?.nome_completo?.toLowerCase().includes(q) ||
          p.colaboradores?.nome_completo?.toLowerCase().includes(q),
      )
    }
    if (statusFilter !== "todos") {
      result = result.filter((p) => p.status === statusFilter)
    }
    if (tipoFilter !== "todos") {
      if (tipoFilter === "reembolso_km") {
        result = result.filter((p) => p.tipo_pedido === "reembolso_km")
      } else if (tipoFilter === "horas_extras") {
        result = result.filter((p) => (p.horas_extras_50 || 0) > 0 || (p.horas_extras_100 || 0) > 0)
      } else if (tipoFilter === "plantao") {
        result = result.filter((p) => (p.valor_plantao || 0) > 0)
      } else if (tipoFilter === "conducao") {
        result = result.filter((p) => (p.conducao || 0) > 0)
      }
    }
    if (equipeFilter !== "todas") {
      result = result.filter((p) => {
        const colab = p.colaborador || p.colaboradores
        return (colab as any)?.equipe_id === equipeFilter
      })
    }

    // Sort
    result.sort((a, b) => {
      let valA: any, valB: any
      if (sortField === "created_at") {
        valA = a.created_at
        valB = b.created_at
      } else if (sortField === "valor_total") {
        valA = a.valor_total
        valB = b.valor_total
      } else if (sortField === "nome") {
        valA = (a.colaborador?.nome_completo || a.colaboradores?.nome_completo || "").toLowerCase()
        valB = (b.colaborador?.nome_completo || b.colaboradores?.nome_completo || "").toLowerCase()
      } else if (sortField === "status") {
        valA = a.status
        valB = b.status
      }
      if (valA < valB) return sortAsc ? -1 : 1
      if (valA > valB) return sortAsc ? 1 : -1
      return 0
    })

    return result
  }, [pedidos, dataInicio, dataFim, busca, statusFilter, tipoFilter, equipeFilter, sortField, sortAsc])

  // KPI calculations
  const kpis = useMemo(() => {
    const total = filteredPedidos.reduce((s, p) => s + p.valor_total, 0)
    const salarios = filteredPedidos
      .filter((p) => p.tipo_pedido !== "reembolso_km")
      .reduce((s, p) => {
        const colab = p.colaborador || p.colaboradores
        return s + (colab?.salario || 0)
      }, 0)
    const horasExtras = filteredPedidos.reduce((s, p) => {
      const val50 = (p.horas_extras_50 || 0) * ((p.colaborador?.salario || p.colaboradores?.salario || 0) / 220) * 1.5
      const val100 =
        (p.horas_extras_100 || 0) * ((p.colaborador?.salario || p.colaboradores?.salario || 0) / 220) * 2.0
      return s + val50 + val100
    }, 0)
    const reembolsoKm = filteredPedidos.reduce((s, p) => s + (p.valor_km || 0), 0)
    const plantao = filteredPedidos.reduce((s, p) => s + (p.valor_plantao || 0), 0)
    const conducao = filteredPedidos.reduce((s, p) => s + (p.conducao || 0), 0)
    const comissao = filteredPedidos.reduce((s, p) => s + (p.comissao || 0), 0)
    const pagos = filteredPedidos.filter((p) => p.status === "pago").length
    const pendentes = filteredPedidos.filter((p) =>
      ["pendente_gerente", "pendente_financeiro"].includes(p.status),
    ).length

    return { total, salarios, horasExtras, reembolsoKm, plantao, conducao, comissao, pagos, pendentes, count: filteredPedidos.length }
  }, [filteredPedidos])

  // Monthly chart data
  const monthlyData = useMemo(() => {
    const months: Record<string, { mes: string; salario: number; horas_extras: number; reembolso_km: number; plantao: number; conducao: number }> = {}

    filteredPedidos.forEach((p) => {
      const d = new Date(p.created_at)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
      const label = d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" })

      if (!months[key]) {
        months[key] = { mes: label, salario: 0, horas_extras: 0, reembolso_km: 0, plantao: 0, conducao: 0 }
      }

      if (p.tipo_pedido === "reembolso_km") {
        months[key].reembolso_km += p.valor_km || 0
      } else {
        const colab = p.colaborador || p.colaboradores
        months[key].salario += colab?.salario || 0
        const val50 = (p.horas_extras_50 || 0) * ((colab?.salario || 0) / 220) * 1.5
        const val100 = (p.horas_extras_100 || 0) * ((colab?.salario || 0) / 220) * 2.0
        months[key].horas_extras += val50 + val100
        months[key].reembolso_km += p.valor_km || 0
        months[key].plantao += p.valor_plantao || 0
        months[key].conducao += p.conducao || 0
      }
    })

    return Object.entries(months)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, v]) => v)
  }, [filteredPedidos])

  // Pie chart data
  const pieData = useMemo(() => {
    const items = [
      { name: "Salario", value: kpis.salarios },
      { name: "Horas Extras", value: kpis.horasExtras },
      { name: "Reembolso KM", value: kpis.reembolsoKm },
      { name: "Plantao", value: kpis.plantao },
      { name: "Conducao", value: kpis.conducao },
    ].filter((i) => i.value > 0)
    return items
  }, [kpis])

  // Days with payment
  const diasComPagamento = useMemo(() => {
    const days = new Set<string>()
    filteredPedidos
      .filter((p) => p.status === "pago")
      .forEach((p) => {
        days.add(new Date(p.created_at).toLocaleDateString("pt-BR"))
      })
    return days.size
  }, [filteredPedidos])

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortAsc(!sortAsc)
    } else {
      setSortField(field)
      setSortAsc(true)
    }
  }

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) return null
    return sortAsc ? <ChevronUp className="h-3 w-3 inline ml-1" /> : <ChevronDown className="h-3 w-3 inline ml-1" />
  }

  // Export Excel (XML Spreadsheet)
  const exportExcel = () => {
    const headers = [
      "Data",
      "Colaborador",
      "Equipe",
      "Centro de Custo",
      "Tipo",
      "Status",
      "Salario Base",
      "HE 50% (h)",
      "HE 100% (h)",
      "Valor Horas Extras",
      "Reembolso KM",
      "Plantao",
      "Conducao",
      "Comissao",
      "Desconto",
      "Valor Total",
      "Criado por",
      "Previsao Pagamento",
    ]

    const escXml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")

    let xmlRows = ""
    // Header row
    xmlRows += "<Row>"
    headers.forEach((h) => {
      xmlRows += `<Cell><Data ss:Type="String">${escXml(h)}</Data></Cell>`
    })
    xmlRows += "</Row>"

    // Data rows
    filteredPedidos.forEach((p) => {
      const colab = p.colaborador || p.colaboradores
      const nome = colab?.nome_completo || ""
      const equipeNome = (colab as any)?.equipe?.nome || ""
      const ccNome = (colab as any)?.centro_custo ? `${(colab as any).centro_custo.numero} - ${(colab as any).centro_custo.nome}` : ""
      const tipo = p.tipo_pedido === "reembolso_km" ? "Reembolso KM" : "Completo"
      const salarioBase = p.tipo_pedido === "reembolso_km" ? 0 : (colab?.salario || 0)
      const he50h = p.horas_extras_50 || 0
      const he100h = p.horas_extras_100 || 0
      const valorHe =
        he50h * ((colab?.salario || 0) / 220) * 1.5 +
        he100h * ((colab?.salario || 0) / 220) * 2
      const criadoPor = p.criado_por?.nome_completo || ""
      const previsao = p.data_previsao_pagamento ? formatDateBR(p.data_previsao_pagamento) : ""

      xmlRows += "<Row>"
      xmlRows += `<Cell><Data ss:Type="String">${escXml(formatDateBR(p.created_at))}</Data></Cell>`
      xmlRows += `<Cell><Data ss:Type="String">${escXml(nome)}</Data></Cell>`
      xmlRows += `<Cell><Data ss:Type="String">${escXml(equipeNome)}</Data></Cell>`
      xmlRows += `<Cell><Data ss:Type="String">${escXml(ccNome)}</Data></Cell>`
      xmlRows += `<Cell><Data ss:Type="String">${escXml(tipo)}</Data></Cell>`
      xmlRows += `<Cell><Data ss:Type="String">${escXml(STATUS_LABELS[p.status] || p.status)}</Data></Cell>`
      xmlRows += `<Cell><Data ss:Type="Number">${salarioBase.toFixed(2)}</Data></Cell>`
      xmlRows += `<Cell><Data ss:Type="Number">${he50h}</Data></Cell>`
      xmlRows += `<Cell><Data ss:Type="Number">${he100h}</Data></Cell>`
      xmlRows += `<Cell><Data ss:Type="Number">${valorHe.toFixed(2)}</Data></Cell>`
      xmlRows += `<Cell><Data ss:Type="Number">${(p.valor_km || 0).toFixed(2)}</Data></Cell>`
      xmlRows += `<Cell><Data ss:Type="Number">${(p.valor_plantao || 0).toFixed(2)}</Data></Cell>`
      xmlRows += `<Cell><Data ss:Type="Number">${(p.conducao || 0).toFixed(2)}</Data></Cell>`
      xmlRows += `<Cell><Data ss:Type="Number">${(p.comissao || 0).toFixed(2)}</Data></Cell>`
      xmlRows += `<Cell><Data ss:Type="Number">${(p.valor_desconto || 0).toFixed(2)}</Data></Cell>`
      xmlRows += `<Cell><Data ss:Type="Number">${p.valor_total.toFixed(2)}</Data></Cell>`
      xmlRows += `<Cell><Data ss:Type="String">${escXml(criadoPor)}</Data></Cell>`
      xmlRows += `<Cell><Data ss:Type="String">${escXml(previsao)}</Data></Cell>`
      xmlRows += "</Row>"
    })

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Worksheet ss:Name="Relatorio">
    <Table>${xmlRows}</Table>
  </Worksheet>
</Workbook>`

    const blob = new Blob([xml], { type: "application/vnd.ms-excel" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `fluxopay_relatorio_${new Date().toISOString().split("T")[0]}.xls`
    a.click()
    URL.revokeObjectURL(url)
  }

  const formatTooltip = (value: number) => {
    if (!valoresVisiveis) return "R$ ------"
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="border shadow-none">
          <CardContent className="pt-5 pb-4 px-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
                <Receipt className="h-4 w-4 text-foreground" />
              </div>
            </div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Total Pedidos</p>
            <p className="text-2xl font-semibold text-foreground tabular-nums">{kpis.count}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {kpis.pagos} pagos / {kpis.pendentes} pendentes
            </p>
          </CardContent>
        </Card>

        <Card className="border shadow-none">
          <CardContent className="pt-5 pb-4 px-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-foreground" />
              </div>
            </div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Valor Total</p>
            <p className="text-xl font-semibold text-foreground tabular-nums">{formatValue(kpis.total)}</p>
            <p className="text-xs text-muted-foreground mt-1">{diasComPagamento} dias com pagamento</p>
          </CardContent>
        </Card>

        <Card className="border shadow-none">
          <CardContent className="pt-5 pb-4 px-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
                <Briefcase className="h-4 w-4 text-foreground" />
              </div>
            </div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Salarios</p>
            <p className="text-xl font-semibold text-foreground tabular-nums">{formatValue(kpis.salarios)}</p>
          </CardContent>
        </Card>

        <Card className="border shadow-none">
          <CardContent className="pt-5 pb-4 px-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
                <Clock className="h-4 w-4 text-foreground" />
              </div>
            </div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Horas Extras</p>
            <p className="text-xl font-semibold text-foreground tabular-nums">{formatValue(kpis.horasExtras)}</p>
          </CardContent>
        </Card>

        <Card className="border shadow-none">
          <CardContent className="pt-5 pb-4 px-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
                <Car className="h-4 w-4 text-foreground" />
              </div>
            </div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Reembolso KM</p>
            <p className="text-xl font-semibold text-foreground tabular-nums">{formatValue(kpis.reembolsoKm)}</p>
          </CardContent>
        </Card>

        <Card className="border shadow-none">
          <CardContent className="pt-5 pb-4 px-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
                <Bus className="h-4 w-4 text-foreground" />
              </div>
            </div>
            <p className="text-xs font-medium text-muted-foreground mb-1">{"Plantao + Conducao"}</p>
            <p className="text-xl font-semibold text-foreground tabular-nums">{formatValue(kpis.plantao + kpis.conducao)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 border shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              Gastos Mensais por Tipo
            </CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyData.length === 0 ? (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground text-sm">
                Sem dados para o periodo selecionado
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={monthlyData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                  <XAxis dataKey="mes" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => (valoresVisiveis ? `${(v / 1000).toFixed(0)}k` : "---")}
                  />
                  <Tooltip
                    formatter={(value: number, name: string) => [formatTooltip(value), TIPO_LABELS[name] || name]}
                    contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "12px" }}
                  />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px" }} />
                  <Bar dataKey="salario" name="salario" stackId="a" fill="#171717" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="horas_extras" name="horas_extras" stackId="a" fill="#404040" />
                  <Bar dataKey="reembolso_km" name="reembolso_km" stackId="a" fill="#737373" />
                  <Bar dataKey="plantao" name="plantao" stackId="a" fill="#a3a3a3" />
                  <Bar dataKey="conducao" name="conducao" stackId="a" fill="#d4d4d4" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Distribuicao por Tipo</CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length === 0 ? (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground text-sm">
                Sem dados
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatTooltip(value)} contentStyle={{ borderRadius: "8px", fontSize: "12px" }} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px" }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filters + Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              Todos os Pedidos ({filteredPedidos.length})
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
                <Filter className="h-4 w-4 mr-1" />
                Filtros
              </Button>
              <Button variant="outline" size="sm" onClick={exportExcel}>
                <Download className="h-4 w-4 mr-1" />
                Excel
              </Button>
            </div>
          </div>

          {/* Quick date presets */}
          <div className="flex flex-wrap gap-2 mt-2">
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setPreset(7)}>
              7 dias
            </Button>
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setPreset(30)}>
              30 dias
            </Button>
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setPreset(90)}>
              90 dias
            </Button>
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={setMonthPreset}>
              Este mes
            </Button>
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={clearFilters}>
              Limpar
            </Button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mt-3 pt-3 border-t">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Data inicio</label>
                <Input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} className="h-8 text-sm" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Data fim</label>
                <Input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} className="h-8 text-sm" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="pendente_gerente">Pend. Gerente</SelectItem>
                    <SelectItem value="pendente_financeiro">Pend. Financeiro</SelectItem>
                    <SelectItem value="aprovado">Aprovado</SelectItem>
                    <SelectItem value="pago">Pago</SelectItem>
                    <SelectItem value="recusado">Recusado</SelectItem>
                    <SelectItem value="correcao">Correcao</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Tipo</label>
                <Select value={tipoFilter} onValueChange={setTipoFilter}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="reembolso_km">Reembolso KM</SelectItem>
                    <SelectItem value="horas_extras">Horas Extras</SelectItem>
                    <SelectItem value="plantao">Plantao</SelectItem>
                    <SelectItem value="conducao">Conducao</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Equipe</label>
                <Select value={equipeFilter} onValueChange={setEquipeFilter}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas</SelectItem>
                    {equipes.map((e) => (
                      <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </CardHeader>
        <CardContent className="pt-0">
          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome do colaborador..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>

          {/* Table */}
          <div className="rounded-lg border overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead
                      className="cursor-pointer hover:text-foreground text-xs"
                      onClick={() => handleSort("created_at")}
                    >
                      Data <SortIcon field="created_at" />
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:text-foreground text-xs"
                      onClick={() => handleSort("nome")}
                    >
                      Colaborador <SortIcon field="nome" />
                    </TableHead>
                    <TableHead className="text-xs hidden lg:table-cell">Equipe</TableHead>
                    <TableHead className="text-xs">Tipo</TableHead>
                    <TableHead
                      className="cursor-pointer hover:text-foreground text-xs"
                      onClick={() => handleSort("status")}
                    >
                      Status <SortIcon field="status" />
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:text-foreground text-xs text-right"
                      onClick={() => handleSort("valor_total")}
                    >
                      Valor Total <SortIcon field="valor_total" />
                    </TableHead>
                    <TableHead className="text-xs w-8"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPedidos.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground text-sm">
                        Nenhum pedido encontrado com os filtros selecionados
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPedidos.map((p) => {
                      const colab = p.colaborador || p.colaboradores
                      const nome = colab?.nome_completo || "N/A"
                      const isExpanded = expandedRow === p.id
                      const tipo = p.tipo_pedido === "reembolso_km" ? "Reembolso KM" : "Completo"

                      return (
                        <> 
                          <TableRow
                            key={p.id}
                            className="cursor-pointer hover:bg-muted/30"
                            onClick={() => setExpandedRow(isExpanded ? null : p.id)}
                          >
                            <TableCell className="text-xs font-mono">{formatDateBR(p.created_at)}</TableCell>
                            <TableCell className="text-sm font-medium">{nome}</TableCell>
                            <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                              {(colab as any)?.equipe?.nome || "-"}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs font-normal">
                                {tipo}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className={`text-xs font-normal ${STATUS_COLORS[p.status] || ""}`}>
                                {STATUS_LABELS[p.status] || p.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right text-sm font-semibold">
                              {formatValue(p.valor_total)}
                            </TableCell>
                            <TableCell>
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                              )}
                            </TableCell>
                          </TableRow>
                          {isExpanded && (
                            <TableRow key={`${p.id}-detail`}>
                              <TableCell colSpan={7} className="bg-muted/20 px-6 py-3">
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                                  {p.tipo_pedido !== "reembolso_km" && (
                                    <div>
                                      <span className="text-muted-foreground text-xs block">Salario Base</span>
                                      <span className="font-medium">{formatValue(colab?.salario || 0)}</span>
                                    </div>
                                  )}
                                  {((p.horas_extras_50 || 0) > 0 || (p.horas_extras_100 || 0) > 0) && (
                                    <div>
                                      <span className="text-muted-foreground text-xs block">Horas Extras</span>
                                      <span className="font-medium">
                                        {p.horas_extras_50 || 0}h (50%) + {p.horas_extras_100 || 0}h (100%)
                                      </span>
                                      {p.motivo_horas_extras && (
                                        <span className="text-xs text-muted-foreground block">{p.motivo_horas_extras}</span>
                                      )}
                                    </div>
                                  )}
                                  {(p.valor_km || 0) > 0 && (
                                    <div>
                                      <span className="text-muted-foreground text-xs block">Reembolso KM</span>
                                      <span className="font-medium">{formatValue(p.valor_km)}</span>
                                    </div>
                                  )}
                                  {(p.valor_plantao || 0) > 0 && (
                                    <div>
                                      <span className="text-muted-foreground text-xs block">Plantao</span>
                                      <span className="font-medium">{formatValue(p.valor_plantao)}</span>
                                      {p.motivo_plantao && (
                                        <span className="text-xs text-muted-foreground block">{p.motivo_plantao}</span>
                                      )}
                                    </div>
                                  )}
                                  {(p.conducao || 0) > 0 && (
                                    <div>
                                      <span className="text-muted-foreground text-xs block">Conducao</span>
                                      <span className="font-medium">{formatValue(p.conducao)}</span>
                                    </div>
                                  )}
                                  {(p.comissao || 0) > 0 && (
                                    <div>
                                      <span className="text-muted-foreground text-xs block">Comissao</span>
                                      <span className="font-medium">{formatValue(p.comissao || 0)}</span>
                                      {p.motivo_comissao && (
                                        <span className="text-xs text-muted-foreground block">{p.motivo_comissao}</span>
                                      )}
                                    </div>
                                  )}
                                  {(p.valor_desconto || 0) > 0 && (
                                    <div>
                                      <span className="text-muted-foreground text-xs block">Desconto</span>
                                      <span className="font-medium text-red-600">{formatValue(p.valor_desconto, true)}</span>
                                      {p.motivo_desconto && (
                                        <span className="text-xs text-muted-foreground block">{p.motivo_desconto}</span>
                                      )}
                                    </div>
                                  )}
                                  {p.data_previsao_pagamento && (
                                    <div>
                                      <span className="text-muted-foreground text-xs block">Previsao Pagamento</span>
                                      <span className="font-medium">{formatDateBR(p.data_previsao_pagamento)}</span>
                                    </div>
                                  )}
                                  {(p.colaborador as any)?.equipe?.nome && (
                                    <div>
                                      <span className="text-muted-foreground text-xs block">Equipe</span>
                                      <span className="font-medium">{(p.colaborador as any).equipe.nome}</span>
                                    </div>
                                  )}
                                  {(p.colaborador as any)?.centro_custo && (
                                    <div>
                                      <span className="text-muted-foreground text-xs block">Centro de Custo</span>
                                      <span className="font-medium">{(p.colaborador as any).centro_custo.numero} - {(p.colaborador as any).centro_custo.nome}</span>
                                    </div>
                                  )}
                                  {p.criado_por && (
                                    <div>
                                      <span className="text-muted-foreground text-xs block">Criado por</span>
                                      <span className="font-medium">{p.criado_por.nome_completo}</span>
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
