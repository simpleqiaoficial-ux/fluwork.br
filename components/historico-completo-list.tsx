"use client"

import { useState } from "react"
import type { PedidoPagamento } from "@/types/pedido"
import type { Equipe } from "@/types/equipe"
import { StatusBadge } from "@/components/ui/status-badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatCurrency } from "@/lib/utils"
import { Search, Filter, ChevronDown, ChevronUp, Download } from "lucide-react"
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
      {/* Indicadores */}
      <div className="flex flex-wrap gap-x-10 gap-y-5 pb-6 border-b">
        <div>
          <p className="text-xs text-muted-foreground mb-1.5">Total de pedidos</p>
          <p className="text-2xl font-semibold tabular-nums">{stats.total}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1.5">Valor total</p>
          <p className="text-2xl font-semibold tabular-nums">{formatCurrency(stats.valorTotal)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1.5">Aprovados</p>
          <p className="text-2xl font-semibold tabular-nums">{stats.aprovados}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1.5">Pendentes</p>
          <p className="text-2xl font-semibold tabular-nums">{stats.pendentes}</p>
        </div>
      </div>

      {/* Filtros */}
      <div>
        <Button
          variant="outline"
          onClick={() => setMostrarFiltros(!mostrarFiltros)}
          className="flex items-center gap-2"
          size="sm"
        >
          <Filter className="w-4 h-4" />
          Filtros
          {mostrarFiltros ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </Button>

        {mostrarFiltros && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t">
            <div className="space-y-1.5">
              <Label htmlFor="dataInicio" className="text-xs text-muted-foreground">Data Início</Label>
              <Input
                id="dataInicio"
                type="date"
                value={filtros.dataInicio}
                onChange={(e) => setFiltros({ ...filtros, dataInicio: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="dataFim" className="text-xs text-muted-foreground">Data Fim</Label>
              <Input
                id="dataFim"
                type="date"
                value={filtros.dataFim}
                onChange={(e) => setFiltros({ ...filtros, dataFim: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="colaboradorNome" className="text-xs text-muted-foreground">Nome do Prestador</Label>
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

            <div className="space-y-1.5">
              <Label htmlFor="equipe" className="text-xs text-muted-foreground">Equipe</Label>
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

            <div className="space-y-1.5">
              <Label htmlFor="status" className="text-xs text-muted-foreground">Status</Label>
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
              <Button variant="ghost" onClick={limparFiltros} size="sm" className="w-full">
                Limpar Filtros
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Lista de Pedidos */}
      <div>
        <p className="text-sm text-muted-foreground mb-3">
          {pedidosFiltrados.length} {pedidosFiltrados.length === 1 ? "pedido encontrado" : "pedidos encontrados"}
        </p>

        {pedidosFiltrados.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-center">
            <p className="text-muted-foreground text-sm">Nenhum pedido encontrado com os filtros aplicados</p>
          </div>
        ) : (
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Prestador</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead className="hidden md:table-cell">Criado por</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="w-8" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {pedidosFiltrados.map((pedido) => {
                  const expandido = pedidosExpandidos.has(pedido.id)
                  const colaboradorNome = pedido.colaborador?.nome_completo || "N/A"
                  const criadoPor = pedido.criado_por?.nome_completo || "N/A"
                  const notaFiscal = Array.isArray(pedido.notas_fiscais)
                    ? pedido.notas_fiscais[0]
                    : pedido.notas_fiscais || null

                  return (
                    <>
                      <TableRow
                        key={pedido.id}
                        className="cursor-pointer"
                        onClick={() => togglePedido(pedido.id)}
                      >
                        <TableCell>
                          <p className="font-medium truncate">{colaboradorNome}</p>
                          {pedido.nota_emitida && (
                            <p className="text-xs text-muted-foreground mt-0.5">Nota enviada</p>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(pedido.created_at), "dd/MM/yyyy")}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground">{criadoPor}</TableCell>
                        <TableCell>
                          <StatusBadge entity="pedido" status={pedido.status} />
                        </TableCell>
                        <TableCell className="text-right font-semibold tabular-nums">
                          {formatCurrency(pedido.valor_total)}
                        </TableCell>
                        <TableCell>
                          {expandido ? (
                            <ChevronUp className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          )}
                        </TableCell>
                      </TableRow>

                      {expandido && (
                        <TableRow key={`${pedido.id}-detail`}>
                          <TableCell colSpan={6} className="bg-muted/20 px-6 py-5">
                            <div className="space-y-4">
                              {pedido.tipo_pedido === "completo" && (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-4 text-sm">
                                  <div>
                                    <p className="text-xs text-muted-foreground mb-1">Valor Contratual Base</p>
                                    <p className="font-medium tabular-nums">{formatCurrency(pedido.colaborador?.salario || 0)}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground mb-1">Horas Extras</p>
                                    <p className="font-medium tabular-nums">{formatCurrency(pedido.horas_extras)}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground mb-1">Quilometragem</p>
                                    <p className="font-medium tabular-nums">{formatCurrency(pedido.valor_km)}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground mb-1">Condução</p>
                                    <p className="font-medium tabular-nums">{formatCurrency(pedido.conducao)}</p>
                                  </div>
                                  {pedido.valor_plantao > 0 && (
                                    <div>
                                      <p className="text-xs text-muted-foreground mb-1">Plantão</p>
                                      <p className="font-medium tabular-nums">{formatCurrency(pedido.valor_plantao)}</p>
                                    </div>
                                  )}
                                  {pedido.valor_desconto > 0 && (
                                    <div>
                                      <p className="text-xs text-muted-foreground mb-1">Desconto</p>
                                      <p className="font-medium tabular-nums text-destructive">
                                        -{formatCurrency(pedido.valor_desconto)}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              )}

                              {(pedido.observacao_gerente || pedido.observacao_financeiro) && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t text-sm">
                                  {pedido.observacao_gerente && (
                                    <div>
                                      <p className="text-xs text-muted-foreground mb-1">Observação do gerente</p>
                                      <p>{pedido.observacao_gerente}</p>
                                    </div>
                                  )}
                                  {pedido.observacao_financeiro && (
                                    <div>
                                      <p className="text-xs text-muted-foreground mb-1">Observação do financeiro</p>
                                      <p>{pedido.observacao_financeiro}</p>
                                    </div>
                                  )}
                                </div>
                              )}

                              {notaFiscal && (
                                <div className="pt-4 border-t">
                                  <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div className="flex gap-6 text-sm">
                                      <div>
                                        <p className="text-xs text-muted-foreground mb-1">Número NFS-e</p>
                                        <p className="font-medium">{notaFiscal.numero_nfse || "N/A"}</p>
                                      </div>
                                      <div>
                                        <p className="text-xs text-muted-foreground mb-1">Valor</p>
                                        <p className="font-medium tabular-nums">{formatCurrency(notaFiscal.valor_servico)}</p>
                                      </div>
                                    </div>
                                    <div className="flex gap-2">
                                      {notaFiscal.arquivo_xml_url && (
                                        <Button size="sm" variant="outline" asChild>
                                          <a href={notaFiscal.arquivo_xml_url} download target="_blank" rel="noopener noreferrer">
                                            <Download className="w-3.5 h-3.5" />
                                            XML
                                          </a>
                                        </Button>
                                      )}
                                      {notaFiscal.arquivo_pdf_url && (
                                        <Button size="sm" variant="outline" asChild>
                                          <a href={notaFiscal.arquivo_pdf_url} download target="_blank" rel="noopener noreferrer">
                                            <Download className="w-3.5 h-3.5" />
                                            PDF
                                          </a>
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  )
}
