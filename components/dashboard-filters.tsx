"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Download, Filter, Search, X } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import type { PedidoPagamento } from "@/types/pedido"
import { formatCurrency } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { PedidoDetailModal } from "./pedido-detail-modal"

interface DashboardFiltersProps {
  pedidos: PedidoPagamento[]
}

export function DashboardFilters({ pedidos }: DashboardFiltersProps) {
  const router = useRouter()
  const [dataInicio, setDataInicio] = useState<Date>()
  const [dataFim, setDataFim] = useState<Date>()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("todos")
  const [tipoFilter, setTipoFilter] = useState<string>("todos")
  const [showFilters, setShowFilters] = useState(false)
  const [selectedPedido, setSelectedPedido] = useState<PedidoPagamento | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const pedidosFiltrados = pedidos.filter((pedido) => {
    const matchSearch =
      !searchTerm ||
      pedido.colaborador?.nome_completo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pedido.criado_por?.nome_completo?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchStatus =
      statusFilter === "todos" ||
      (statusFilter === "pendente_gerente" && pedido.status === "pendente_gerente") ||
      (statusFilter === "pendente_financeiro" && pedido.status === "pendente_financeiro") ||
      (statusFilter === "aprovado" && pedido.status === "aprovado") ||
      (statusFilter === "recusado" && pedido.status === "recusado") ||
      (statusFilter === "correcao" && pedido.status === "correcao") ||
      (statusFilter === "pago" && pedido.status === "pago") ||
      (statusFilter === "nota_recebida" && pedido.status === "nota_recebida")

    const matchTipo =
      tipoFilter === "todos" ||
      (tipoFilter === "completo" && pedido.tipo_pedido === "completo") ||
      (tipoFilter === "reembolso_km" && pedido.tipo_pedido === "reembolso_km")

    return matchSearch && matchStatus && matchTipo
  })

  const stats = {
    total: pedidosFiltrados.length,
    valorTotal: pedidosFiltrados.reduce((acc, p) => acc + p.valor_total, 0),
    pendentes: pedidosFiltrados.filter((p) => p.status === "pendente_gerente" || p.status === "pendente_financeiro")
      .length,
    aprovados: pedidosFiltrados.filter((p) => p.status === "aprovado").length,
    pagos: pedidosFiltrados.filter((p) => p.status === "pago").length,
  }

  const aplicarFiltros = () => {
    const params = new URLSearchParams()
    if (dataInicio) {
      params.set("dataInicio", format(dataInicio, "yyyy-MM-dd"))
    }
    if (dataFim) {
      params.set("dataFim", format(dataFim, "yyyy-MM-dd"))
    }
    router.push(`/?${params.toString()}`)
  }

  const limparFiltros = () => {
    setDataInicio(undefined)
    setDataFim(undefined)
    setSearchTerm("")
    setStatusFilter("todos")
    setTipoFilter("todos")
    router.push("/")
  }

  const filtrosRapidos = [
    {
      label: "Hoje",
      onClick: () => {
        const hoje = new Date()
        setDataInicio(hoje)
        setDataFim(hoje)
      },
    },
    {
      label: "Esta Semana",
      onClick: () => {
        const hoje = new Date()
        const primeiroDia = new Date(hoje.setDate(hoje.getDate() - hoje.getDay()))
        const ultimoDia = new Date(hoje.setDate(hoje.getDate() - hoje.getDay() + 6))
        setDataInicio(primeiroDia)
        setDataFim(ultimoDia)
      },
    },
    {
      label: "Este Mês",
      onClick: () => {
        const hoje = new Date()
        const primeiroDia = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
        const ultimoDia = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0)
        setDataInicio(primeiroDia)
        setDataFim(ultimoDia)
      },
    },
    {
      label: "Últimos 30 Dias",
      onClick: () => {
        const hoje = new Date()
        const trintaDiasAtras = new Date(hoje.setDate(hoje.getDate() - 30))
        setDataInicio(trintaDiasAtras)
        setDataFim(new Date())
      },
    },
  ]

  const exportarParaExcel = () => {
    const pedidosParaExportar = pedidosFiltrados

    const headers = [
      "Data de Criação",
      "Criado Por",
      "Colaborador",
      "Tipo de Pedido",
      "Salário Base",
      "HE 50%",
      "HE 100%",
      "Valor HE",
      "Motivo HE",
      "Condução",
      "Quilometragem",
      "Plantão",
      "Motivo Plantão",
      "Desconto",
      "Motivo Desconto",
      "Valor Total",
      "Status",
      "Nota Emitida",
      "Data Emissão Nota",
      "Observação Gerente",
      "Observação Financeiro",
      "Data Previsão Pagamento",
    ]

    const rows = pedidosParaExportar.map((pedido) => [
      format(new Date(pedido.created_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR }),
      pedido.criado_por?.nome_completo || "Não informado",
      pedido.colaborador?.nome_completo || "Não informado",
      pedido.tipo_pedido === "completo" ? "Pedido Completo" : "Reembolso KM",
      pedido.tipo_pedido === "completo" ? formatCurrency(pedido.colaborador?.salario || 0) : "-",
      pedido.tipo_pedido === "completo" ? `${pedido.horas_extras_50}h` : "-",
      pedido.tipo_pedido === "completo" ? `${pedido.horas_extras_100}h` : "-",
      pedido.tipo_pedido === "completo" ? formatCurrency(pedido.horas_extras) : "-",
      pedido.motivo_horas_extras || "-",
      pedido.tipo_pedido === "completo" ? formatCurrency(pedido.conducao) : "-",
      formatCurrency(pedido.valor_km),
      pedido.tipo_pedido === "completo" ? formatCurrency(pedido.valor_plantao) : "-",
      pedido.motivo_plantao || "-",
      pedido.tipo_pedido === "completo" ? formatCurrency(pedido.valor_desconto) : "-",
      pedido.motivo_desconto || "-",
      formatCurrency(pedido.valor_total),
      pedido.status === "pendente_gerente"
        ? "Aguardando Gerente"
        : pedido.status === "pendente_financeiro"
          ? "Aguardando Financeiro"
          : pedido.status === "aprovado"
            ? "Aprovado"
            : pedido.status === "recusado"
              ? "Recusado"
              : pedido.status === "pago"
                ? "Pago"
                : pedido.status === "nota_recebida"
                  ? "Nota Recebida"
                  : "Em Correção",
      pedido.nota_emitida ? "Sim" : "Não",
      pedido.data_emissao_nota ? format(new Date(pedido.data_emissao_nota), "dd/MM/yyyy", { locale: ptBR }) : "-",
      pedido.observacao_gerente || "-",
      pedido.observacao_financeiro || "-",
      pedido.data_previsao_pagamento
        ? format(new Date(pedido.data_previsao_pagamento), "dd/MM/yyyy", { locale: ptBR })
        : "-",
    ])

    const BOM = "\uFEFF"
    const csvContent = [headers, ...rows]
      .map((row) =>
        row
          .map((cell) => {
            const cellStr = String(cell)
            if (cellStr.includes(",") || cellStr.includes("\n") || cellStr.includes('"')) {
              return `"${cellStr.replace(/"/g, '""')}"`
            }
            return cellStr
          })
          .join(","),
      )
      .join("\n")

    const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `FluxoPay_Pedidos_${format(new Date(), "dd-MM-yyyy_HH-mm")}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleRowClick = (pedido: PedidoPagamento) => {
    setSelectedPedido(pedido)
    setIsModalOpen(true)
  }

  return (
    <div className="space-y-4 mb-8">
      <Card className="bg-card border">
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Total de Pedidos</p>
              <p className="text-2xl font-bold text-foreground">{stats.total}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Valor Total</p>
              <p className="text-2xl font-bold text-foreground">{formatCurrency(stats.valorTotal)}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Pendentes</p>
              <p className="text-2xl font-bold text-foreground">{stats.pendentes}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Aprovados</p>
              <p className="text-2xl font-bold text-foreground">{stats.aprovados}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Pagos</p>
              <p className="text-2xl font-bold text-foreground">{stats.pagos}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-2 flex-1 w-full">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por colaborador ou criador..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os Status</SelectItem>
              <SelectItem value="pendente_gerente">Aguardando Gerente</SelectItem>
              <SelectItem value="pendente_financeiro">Aguardando Financeiro</SelectItem>
              <SelectItem value="aprovado">Aprovado</SelectItem>
              <SelectItem value="pago">Pago</SelectItem>
              <SelectItem value="nota_recebida">Nota Recebida</SelectItem>
              <SelectItem value="recusado">Recusado</SelectItem>
              <SelectItem value="correcao">Em Correção</SelectItem>
            </SelectContent>
          </Select>

          <Select value={tipoFilter} onValueChange={setTipoFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os Tipos</SelectItem>
              <SelectItem value="completo">Pedido Completo</SelectItem>
              <SelectItem value="reembolso_km">Reembolso KM</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="icon" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex gap-2">
          {(searchTerm || statusFilter !== "todos" || tipoFilter !== "todos" || dataInicio || dataFim) && (
            <Button variant="outline" size="sm" onClick={limparFiltros}>
              <X className="mr-2 h-4 w-4" />
              Limpar Tudo
            </Button>
          )}
          <Button onClick={exportarParaExcel} variant="default" size="sm" className="bg-green-600 hover:bg-green-700">
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

      {showFilters && (
        <Card className="border-dashed">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn("justify-start text-left font-normal", !dataInicio && "text-muted-foreground")}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dataInicio ? format(dataInicio, "dd/MM/yyyy", { locale: ptBR }) : "Data Início"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={dataInicio} onSelect={setDataInicio} initialFocus locale={ptBR} />
                  </PopoverContent>
                </Popover>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn("justify-start text-left font-normal", !dataFim && "text-muted-foreground")}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dataFim ? format(dataFim, "dd/MM/yyyy", { locale: ptBR }) : "Data Fim"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={dataFim} onSelect={setDataFim} initialFocus locale={ptBR} />
                  </PopoverContent>
                </Popover>

                <Button onClick={aplicarFiltros} disabled={!dataInicio && !dataFim}>
                  Aplicar Datas
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                <p className="text-sm text-muted-foreground w-full mb-1">Filtros Rápidos:</p>
                {filtrosRapidos.map((filtro) => (
                  <Button key={filtro.label} variant="secondary" size="sm" onClick={filtro.onClick}>
                    {filtro.label}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {pedidosFiltrados.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="border-b sticky top-0 bg-white z-10">
                  <tr className="text-left">
                    <th className="pb-3 px-2 font-semibold">Data</th>
                    <th className="pb-3 px-2 font-semibold">Colaborador</th>
                    <th className="pb-3 px-2 font-semibold">Tipo</th>
                    <th className="pb-3 px-2 font-semibold text-right">Valor</th>
                    <th className="pb-3 px-2 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {pedidosFiltrados.map((pedido) => (
                    <tr
                      key={pedido.id}
                      onClick={() => handleRowClick(pedido)}
                      className="border-b last:border-0 hover:bg-muted/50 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-2 text-muted-foreground">
                        {format(new Date(pedido.created_at), "dd/MM/yy", { locale: ptBR })}
                      </td>
                      <td className="py-3 px-2 font-medium">{pedido.colaborador?.nome_completo}</td>
                      <td className="py-3 px-2">
                        {pedido.tipo_pedido === "reembolso_km" ? (
                          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                            Reembolso KM
                          </span>
                        ) : (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">Completo</span>
                        )}
                      </td>
                      <td className="py-3 px-2 text-right font-semibold">{formatCurrency(pedido.valor_total)}</td>
                      <td className="py-3 px-2">
                        {pedido.status === "pendente_gerente" && (
                          <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                            Aguardando Gerente
                          </span>
                        )}
                        {pedido.status === "pendente_financeiro" && (
                          <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                            Aguardando Financeiro
                          </span>
                        )}
                        {pedido.status === "aprovado" && (
                          <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">Aprovado</span>
                        )}
                        {pedido.status === "pago" && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Pago</span>
                        )}
                        {pedido.status === "nota_recebida" && (
                          <span className="text-xs bg-teal-100 text-teal-700 px-2 py-1 rounded-full">
                            Nota Recebida
                          </span>
                        )}
                        {pedido.status === "recusado" && (
                          <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">Recusado</span>
                        )}
                        {pedido.status === "correcao" && (
                          <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">Em Correção</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <PedidoDetailModal pedido={selectedPedido} open={isModalOpen} onOpenChange={setIsModalOpen} />
    </div>
  )
}
