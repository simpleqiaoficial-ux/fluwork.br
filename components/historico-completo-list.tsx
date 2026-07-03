"use client"

import { useState } from "react"
import type { PedidoPagamento } from "@/types/pedido"
import type { Equipe } from "@/types/equipe"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatCurrency } from "@/lib/utils"
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Download,
  FileText,
} from "lucide-react"
import { format } from "date-fns"

interface HistoricoCompletoListProps {
  pedidos: PedidoPagamento[]
  equipes: Equipe[]
}

export function HistoricoCompletoList({ pedidos: pedidosIniciais, equipes }: HistoricoCompletoListProps) {
  const [filtros, setFiltros] = useState({
    dataInicio: "",
    dataFim: "",
    colaboradorNome: "",
    equipeId: "todas",
    status: "todos",
  })
  const [pedidosExpandidos, setPedidosExpandidos] = useState<Set<string>>(new Set())
  const [mostrarFiltros, setMostrarFiltros] = useState(false)

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pendente_gerente: { label: "Aguardando Gerente", variant: "secondary" as const, icon: Clock },
      pendente_financeiro: { label: "Aguardando Financeiro", variant: "secondary" as const, icon: Clock },
      aprovado: { label: "Aprovado", variant: "default" as const, icon: CheckCircle },
      pago: { label: "Pago", variant: "default" as const, icon: CheckCircle },
      nota_recebida: { label: "Nota Recebida", variant: "default" as const, icon: CheckCircle },
      recusado: { label: "Recusado", variant: "destructive" as const, icon: XCircle },
      correcao: { label: "Correção Solicitada", variant: "outline" as const, icon: AlertCircle },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || {
      label: status,
      variant: "secondary" as const,
      icon: Clock,
    }
    const Icon = config.icon

    return (
      <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    )
  }

  const pedidosFiltrados = pedidosIniciais.filter((pedido) => {
    // Filtro de data
    if (filtros.dataInicio && new Date(pedido.created_at) < new Date(filtros.dataInicio)) {
      return false
    }
    if (filtros.dataFim && new Date(pedido.created_at) > new Date(filtros.dataFim)) {
      return false
    }

    // Filtro de colaborador
    if (
      filtros.colaboradorNome &&
      !pedido.colaborador?.nome_completo?.toLowerCase().includes(filtros.colaboradorNome.toLowerCase())
    ) {
      return false
    }

    // Filtro de equipe
    if (filtros.equipeId !== "todas") {
      if (filtros.equipeId === "sem-equipe" && pedido.colaborador?.equipe_id) {
        return false
      }
      if (filtros.equipeId !== "sem-equipe" && pedido.colaborador?.equipe_id !== filtros.equipeId) {
        return false
      }
    }

    // Filtro de status
    if (filtros.status !== "todos" && pedido.status !== filtros.status) {
      return false
    }

    return true
  })

  const togglePedido = (pedidoId: string) => {
    const novosExpandidos = new Set(pedidosExpandidos)
    if (novosExpandidos.has(pedidoId)) {
      novosExpandidos.delete(pedidoId)
    } else {
      novosExpandidos.add(pedidoId)
    }
    setPedidosExpandidos(novosExpandidos)
  }

  const limparFiltros = () => {
    setFiltros({
      dataInicio: "",
      dataFim: "",
      colaboradorNome: "",
      equipeId: "todas",
      status: "todos",
    })
  }

  // Calcular estatísticas
  const stats = {
    total: pedidosFiltrados.length,
    valorTotal: pedidosFiltrados.reduce((acc, p) => acc + p.valor_total, 0),
    aprovados: pedidosFiltrados.filter((p) => p.status === "aprovado").length,
    pendentes: pedidosFiltrados.filter((p) => p.status.includes("pendente")).length,
  }

  return (
    <div className="space-y-6">
      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground mb-1">Total de Pedidos</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground mb-1">Valor Total</p>
          <p className="text-2xl font-bold text-primary">{formatCurrency(stats.valorTotal)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground mb-1">Aprovados</p>
          <p className="text-2xl font-bold text-green-600">{stats.aprovados}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground mb-1">Pendentes</p>
          <p className="text-2xl font-bold text-amber-600">{stats.pendentes}</p>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="p-6">
        <Button
          variant="outline"
          onClick={() => setMostrarFiltros(!mostrarFiltros)}
          className="w-full md:w-auto flex items-center gap-2 mb-4"
        >
          <Filter className="w-4 h-4" />
          Filtros
          {mostrarFiltros ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </Button>

        {mostrarFiltros && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="dataInicio">Data Início</Label>
              <Input
                id="dataInicio"
                type="date"
                value={filtros.dataInicio}
                onChange={(e) => setFiltros({ ...filtros, dataInicio: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="dataFim">Data Fim</Label>
              <Input
                id="dataFim"
                type="date"
                value={filtros.dataFim}
                onChange={(e) => setFiltros({ ...filtros, dataFim: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="colaboradorNome">Nome do Colaborador</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="colaboradorNome"
                  placeholder="Digite o nome..."
                  value={filtros.colaboradorNome}
                  onChange={(e) => setFiltros({ ...filtros, colaboradorNome: e.target.value })}
                  className="pl-9"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="equipe">Equipe</Label>
              <Select value={filtros.equipeId} onValueChange={(value) => setFiltros({ ...filtros, equipeId: value })}>
                <SelectTrigger id="equipe">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas as Equipes</SelectItem>
                  <SelectItem value="sem-equipe">Sem Equipe</SelectItem>
                  {equipes.map((equipe) => (
                    <SelectItem key={equipe.id} value={equipe.id}>
                      {equipe.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={filtros.status} onValueChange={(value) => setFiltros({ ...filtros, status: value })}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Status</SelectItem>
                  <SelectItem value="pendente_gerente">Aguardando Gerente</SelectItem>
                  <SelectItem value="pendente_financeiro">Aguardando Financeiro</SelectItem>
                  <SelectItem value="aprovado">Aprovado</SelectItem>
                  <SelectItem value="pago">Pago</SelectItem>
                  <SelectItem value="nota_recebida">Nota Recebida</SelectItem>
                  <SelectItem value="recusado">Recusado</SelectItem>
                  <SelectItem value="correcao">Correção Solicitada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button variant="outline" onClick={limparFiltros} className="w-full bg-transparent">
                Limpar Filtros
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Lista de Pedidos */}
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          {pedidosFiltrados.length} {pedidosFiltrados.length === 1 ? "pedido encontrado" : "pedidos encontrados"}
        </p>

        {pedidosFiltrados.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">Nenhum pedido encontrado com os filtros aplicados</p>
          </Card>
        ) : (
          pedidosFiltrados.map((pedido) => {
            const expandido = pedidosExpandidos.has(pedido.id)
            const colaboradorNome = pedido.colaborador?.nome_completo || "N/A"
            const criadoPor = pedido.criado_por?.nome_completo || "N/A"
            const notaFiscal = Array.isArray(pedido.notas_fiscais)
              ? pedido.notas_fiscais[0]
              : pedido.notas_fiscais || null

            return (
              <Card key={pedido.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-base truncate">{colaboradorNome}</h3>
                      {getStatusBadge(pedido.status)}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <span>Criado em {format(new Date(pedido.created_at), "dd/MM/yyyy")}</span>
                      <span>Por: {criadoPor}</span>
                      {pedido.nota_emitida && (
                        <Badge variant="outline" className="text-xs">
                          <FileText className="w-3 h-3 mr-1" />
                          Nota Enviada
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Valor</p>
                      <p className="font-semibold text-lg text-primary">{formatCurrency(pedido.valor_total)}</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => togglePedido(pedido.id)}>
                      {expandido ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </Button>
                  </div>
                </div>

                {expandido && (
                  <div className="mt-4 pt-4 border-t space-y-3">
                    {/* Detalhes do Pedido */}
                    {pedido.tipo_pedido === "completo" && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div>
                          <p className="text-muted-foreground">Salário Base</p>
                          <p className="font-medium">{formatCurrency(pedido.colaborador?.salario || 0)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Horas Extras</p>
                          <p className="font-medium">{formatCurrency(pedido.horas_extras)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Quilometragem</p>
                          <p className="font-medium">{formatCurrency(pedido.valor_km)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Condução</p>
                          <p className="font-medium">{formatCurrency(pedido.conducao)}</p>
                        </div>
                        {pedido.valor_plantao > 0 && (
                          <div>
                            <p className="text-muted-foreground">Plantão</p>
                            <p className="font-medium">{formatCurrency(pedido.valor_plantao)}</p>
                          </div>
                        )}
                        {pedido.valor_desconto > 0 && (
                          <div>
                            <p className="text-muted-foreground">Desconto</p>
                            <p className="font-medium text-red-600">-{formatCurrency(pedido.valor_desconto)}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Observações */}
                    {pedido.observacao_gerente && (
                      <div className="p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md text-sm">
                        <p className="font-medium mb-1">Obs. Gerente:</p>
                        <p className="text-muted-foreground">{pedido.observacao_gerente}</p>
                      </div>
                    )}

                    {pedido.observacao_financeiro && (
                      <div className="p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-md text-sm">
                        <p className="font-medium mb-1">Obs. Financeiro:</p>
                        <p className="text-muted-foreground">{pedido.observacao_financeiro}</p>
                      </div>
                    )}

                    {/* Nota Fiscal */}
                    {notaFiscal && (
                      <div className="p-3 bg-purple-50 dark:bg-purple-950 border border-purple-200 dark:border-purple-800 rounded-md">
                        <p className="font-medium mb-2 text-sm">Nota Fiscal Anexada</p>
                        <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                          <div>
                            <p className="text-muted-foreground">Número NFS-e</p>
                            <p className="font-medium">{notaFiscal.numero_nfse || "N/A"}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Valor</p>
                            <p className="font-medium">{formatCurrency(notaFiscal.valor_servico)}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {notaFiscal.arquivo_xml_url && (
                            <Button size="sm" variant="outline" asChild className="text-xs bg-transparent">
                              <a href={notaFiscal.arquivo_xml_url} download target="_blank" rel="noopener noreferrer">
                                <Download className="w-3 h-3 mr-1" />
                                XML
                              </a>
                            </Button>
                          )}
                          {notaFiscal.arquivo_pdf_url && (
                            <Button size="sm" variant="outline" asChild className="text-xs bg-transparent">
                              <a href={notaFiscal.arquivo_pdf_url} download target="_blank" rel="noopener noreferrer">
                                <Download className="w-3 h-3 mr-1" />
                                PDF
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
