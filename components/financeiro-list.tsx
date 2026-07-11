"use client"

import { useState, Fragment } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { FileText, Download, Search, ChevronDown, ChevronUp } from "lucide-react"
import type { PedidoPagamento } from "@/types/pedido"
import { useRouter } from "next/navigation"
import { useMaskedCurrency } from "@/components/currency-display"
import { EmptyState } from "@/components/ui/empty-state"

interface FinanceiroListProps {
  pedidos: PedidoPagamento[]
}

function formatDateTime(dateString: string) {
  return new Date(dateString).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

export function FinanceiroList({ pedidos }: FinanceiroListProps) {
  const router = useRouter()
  const { formatValue } = useMaskedCurrency()
  const [filtros, setFiltros] = useState({
    dataInicio: "",
    dataFim: "",
    colaboradorNome: "",
  })
  const [expandedRow, setExpandedRow] = useState<string | null>(null)

  const handleFiltrar = () => {
    const params = new URLSearchParams()
    if (filtros.dataInicio) params.set("dataInicio", filtros.dataInicio)
    if (filtros.dataFim) params.set("dataFim", filtros.dataFim)
    if (filtros.colaboradorNome) params.set("colaboradorNome", filtros.colaboradorNome)

    router.push(`/financeiro?${params.toString()}`)
  }

  const handleLimparFiltros = () => {
    setFiltros({ dataInicio: "", dataFim: "", colaboradorNome: "" })
    router.push("/financeiro")
  }

  if (pedidos.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="Nenhum pedido para processar"
        description="Não há pedidos aprovados com nota fiscal no momento."
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card className="p-5">
        <h3 className="text-sm font-medium mb-4">Filtros</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="dataInicio" className="text-xs text-muted-foreground">Data início</Label>
            <Input
              id="dataInicio"
              type="date"
              value={filtros.dataInicio}
              onChange={(e) => setFiltros({ ...filtros, dataInicio: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dataFim" className="text-xs text-muted-foreground">Data fim</Label>
            <Input
              id="dataFim"
              type="date"
              value={filtros.dataFim}
              onChange={(e) => setFiltros({ ...filtros, dataFim: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="colaboradorNome" className="text-xs text-muted-foreground">Nome do prestador</Label>
            <Input
              id="colaboradorNome"
              type="text"
              placeholder="Digite o nome..."
              value={filtros.colaboradorNome}
              onChange={(e) => setFiltros({ ...filtros, colaboradorNome: e.target.value })}
            />
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <Button onClick={handleFiltrar} size="sm">
            <Search className="w-4 h-4" />
            Filtrar
          </Button>
          <Button variant="ghost" size="sm" onClick={handleLimparFiltros}>
            Limpar filtros
          </Button>
        </div>
      </Card>

      {/* Lista de pedidos */}
      <div>
        <p className="text-sm text-muted-foreground mb-3">
          {pedidos.length} {pedidos.length === 1 ? "pedido encontrado" : "pedidos encontrados"}
        </p>

        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Prestador</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Valor total</TableHead>
                <TableHead>Nota fiscal</TableHead>
                <TableHead className="w-8" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {pedidos.map((pedido) => {
                const isReembolsoKm = pedido.tipo_pedido === "reembolso_km"
                const salarioBase = isReembolsoKm ? 0 : pedido.colaborador?.salario || 0
                const isExpanded = expandedRow === pedido.id
                const notaFiscal = pedido.notas_fiscais?.[0]

                return (
                  <Fragment key={pedido.id}>
                    <TableRow
                      className="cursor-pointer"
                      onClick={() => setExpandedRow(isExpanded ? null : pedido.id)}
                    >
                      <TableCell className="font-medium">{pedido.colaborador?.nome_completo || "Prestador"}</TableCell>
                      <TableCell className="text-muted-foreground">{formatDateTime(pedido.created_at)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-normal">
                          {isReembolsoKm ? "Reembolso KM" : "Nota emitida"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">
                        {formatValue(pedido.valor_total)}
                      </TableCell>
                      <TableCell>
                        {!isReembolsoKm && notaFiscal ? (
                          <Badge variant="success" className="font-normal">Anexada</Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
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
                      <TableRow key={`${pedido.id}-detail`}>
                        <TableCell colSpan={6} className="bg-muted/20 px-6 py-5">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-4 text-sm">
                            {isReembolsoKm ? (
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Quilometragem (reembolso)</p>
                                <p className="font-medium tabular-nums">{formatValue(pedido.valor_km)}</p>
                              </div>
                            ) : (
                              <>
                                <div>
                                  <p className="text-xs text-muted-foreground mb-1">Valor contratual base</p>
                                  <p className="font-medium tabular-nums">{formatValue(salarioBase)}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground mb-1">Horas extras</p>
                                  <p className="font-medium tabular-nums">{formatValue(pedido.horas_extras)}</p>
                                  {pedido.motivo_horas_extras && (
                                    <p className="text-xs text-muted-foreground mt-0.5">{pedido.motivo_horas_extras}</p>
                                  )}
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground mb-1">Quilometragem</p>
                                  <p className="font-medium tabular-nums">{formatValue(pedido.valor_km)}</p>
                                </div>
                                {pedido.valor_plantao > 0 && (
                                  <div>
                                    <p className="text-xs text-muted-foreground mb-1">Plantão</p>
                                    <p className="font-medium tabular-nums">{formatValue(pedido.valor_plantao)}</p>
                                  </div>
                                )}
                                {pedido.valor_desconto > 0 && (
                                  <div>
                                    <p className="text-xs text-muted-foreground mb-1">Desconto</p>
                                    <p className="font-medium tabular-nums text-destructive">
                                      {formatValue(pedido.valor_desconto, true)}
                                    </p>
                                    {pedido.motivo_desconto && (
                                      <p className="text-xs text-muted-foreground mt-0.5">{pedido.motivo_desconto}</p>
                                    )}
                                  </div>
                                )}
                                <div>
                                  <p className="text-xs text-muted-foreground mb-1">Valor da nota fiscal</p>
                                  <p className="font-medium tabular-nums">
                                    {formatValue(
                                      salarioBase +
                                        pedido.horas_extras +
                                        (pedido.conducao || 0) +
                                        pedido.valor_plantao -
                                        pedido.valor_desconto,
                                    )}
                                  </p>
                                </div>
                              </>
                            )}
                          </div>

                          {!isReembolsoKm && notaFiscal && (
                            <div className="flex items-center justify-between pt-4 mt-4 border-t">
                              <div className="flex items-center gap-2 text-sm">
                                <FileText className="w-4 h-4 text-muted-foreground" />
                                <span>
                                  Emitida em{" "}
                                  {pedido.data_emissao_nota ? formatDateTime(pedido.data_emissao_nota) : "N/A"}
                                </span>
                              </div>
                              <div className="flex gap-2">
                                <Button asChild variant="outline" size="sm">
                                  <a
                                    href={notaFiscal.arquivo_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    download
                                    onClick={(e) => {
                                      const url = notaFiscal?.arquivo_url
                                      if (!url || url.includes("undefined") || url.includes("null")) {
                                        e.preventDefault()
                                        alert("Arquivo XML não disponível ou foi removido.")
                                      }
                                    }}
                                  >
                                    <Download className="w-4 h-4" />
                                    Baixar XML
                                  </a>
                                </Button>
                                {pedido.nota_fiscal_url && (
                                  <Button asChild variant="outline" size="sm">
                                    <a
                                      href={pedido.nota_fiscal_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      download
                                      onClick={(e) => {
                                        if (
                                          !pedido.nota_fiscal_url ||
                                          pedido.nota_fiscal_url.includes("undefined") ||
                                          pedido.nota_fiscal_url.includes("null")
                                        ) {
                                          e.preventDefault()
                                          alert("Arquivo PDF não disponível ou foi removido.")
                                        }
                                      }}
                                    >
                                      <Download className="w-4 h-4" />
                                      Baixar PDF
                                    </a>
                                  </Button>
                                )}
                              </div>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
