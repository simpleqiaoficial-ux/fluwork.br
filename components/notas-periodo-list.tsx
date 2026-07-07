"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { StatusBadge } from "@/components/ui/status-badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download, Search, ChevronDown, ChevronUp, FileX } from "lucide-react"
import type { PedidoPagamento } from "@/types/pedido"
import { useMaskedCurrency } from "@/components/currency-display"
import { EmptyState } from "@/components/ui/empty-state"

interface NotasPeriodoListProps {
  pedidos: PedidoPagamento[]
}

export function NotasPeriodoList({ pedidos }: NotasPeriodoListProps) {
  const { formatValue } = useMaskedCurrency()
  const [searchTerm, setSearchTerm] = useState("")
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const filteredPedidos = pedidos.filter((pedido) => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    return (
      pedido.colaborador?.nome_completo?.toLowerCase().includes(search) ||
      pedido.colaborador?.cnpj?.includes(search)
    )
  })

  if (pedidos.length === 0) {
    return (
      <EmptyState
        icon={FileX}
        title="Nenhuma nota neste período"
        description="Não foram encontradas notas fiscais para este mês."
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou CNPJ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        <span className="text-sm text-muted-foreground">
          {filteredPedidos.length} {filteredPedidos.length === 1 ? "resultado" : "resultados"}
        </span>
      </div>

      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Prestador</TableHead>
              <TableHead>Data</TableHead>
              <TableHead className="text-right">Valor NF</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-8" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPedidos.map((pedido) => {
              let notaFiscal = null
              if (pedido.notas_fiscais) {
                notaFiscal = Array.isArray(pedido.notas_fiscais)
                  ? pedido.notas_fiscais[0] || null
                  : pedido.notas_fiscais
              }
              const pdfUrl = notaFiscal?.arquivo_pdf_url || pedido.nota_fiscal_url
              const xmlUrl = notaFiscal?.arquivo_xml_url

              const isReembolsoKm = pedido.tipo_pedido === "reembolso_km"
              const valorNF = isReembolsoKm
                ? pedido.valor_km
                : (pedido.colaborador?.salario || 0) +
                  (pedido.horas_extras || 0) +
                  (pedido.valor_plantao || 0) +
                  (pedido.comissao || 0) -
                  (pedido.valor_desconto || 0)

              const isExpanded = expandedId === pedido.id

              return (
                <>
                  <TableRow
                    key={pedido.id}
                    className="cursor-pointer"
                    onClick={() => setExpandedId(isExpanded ? null : pedido.id)}
                  >
                    <TableCell className="font-medium">
                      {pedido.colaborador?.nome_completo || "Prestador"}
                      {isReembolsoKm && (
                        <Badge variant="outline" className="font-normal ml-2">
                          Reembolso KM
                        </Badge>
                      )}
                      {pedido.colaborador?.cnpj && (
                        <span className="block text-xs text-muted-foreground font-normal mt-0.5">
                          {pedido.colaborador.cnpj}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(pedido.created_at).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">{formatValue(valorNF)}</TableCell>
                    <TableCell>
                      <StatusBadge entity="pedido" status={pedido.status} />
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
                      <TableCell colSpan={5} className="bg-muted/20 px-6 py-5">
                        <div className="space-y-4">
                          {isReembolsoKm ? (
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Quilometragem (reembolso)</p>
                              <p className="font-medium tabular-nums">{formatValue(pedido.valor_km || 0)}</p>
                            </div>
                          ) : (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-4 text-sm">
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Valor Contratual</p>
                                <p className="font-medium tabular-nums">
                                  {formatValue(pedido.colaborador?.salario || 0)}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Horas extras</p>
                                <p className="font-medium tabular-nums">{formatValue(pedido.horas_extras || 0)}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Plantão</p>
                                <p className="font-medium tabular-nums">{formatValue(pedido.valor_plantao || 0)}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Comissão</p>
                                <p className="font-medium tabular-nums">{formatValue(pedido.comissao || 0)}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Condução (fora da NF)</p>
                                <p className="font-medium tabular-nums">{formatValue(pedido.conducao || 0)}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Quilometragem (fora da NF)</p>
                                <p className="font-medium tabular-nums">{formatValue(pedido.valor_km || 0)}</p>
                              </div>
                              {(pedido.valor_desconto || 0) > 0 && (
                                <div>
                                  <p className="text-xs text-muted-foreground mb-1">Desconto</p>
                                  <p className="font-medium tabular-nums text-destructive">
                                    -{formatValue(pedido.valor_desconto || 0)}
                                  </p>
                                  {pedido.motivo_desconto && (
                                    <p className="text-xs text-muted-foreground mt-0.5">{pedido.motivo_desconto}</p>
                                  )}
                                </div>
                              )}
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-4 border-t">
                            <span className="text-sm font-medium">Total do pedido</span>
                            <span className="font-semibold tabular-nums">{formatValue(pedido.valor_total)}</span>
                          </div>

                          {(pdfUrl || xmlUrl) && (
                            <div className="flex gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
                              {pdfUrl && (
                                <Button asChild variant="outline" size="sm">
                                  <a href={pdfUrl} download target="_blank" rel="noopener noreferrer">
                                    <Download className="w-3.5 h-3.5" />
                                    Baixar PDF
                                  </a>
                                </Button>
                              )}
                              {xmlUrl && (
                                <Button asChild variant="outline" size="sm">
                                  <a href={xmlUrl} download target="_blank" rel="noopener noreferrer">
                                    <Download className="w-3.5 h-3.5" />
                                    Baixar XML
                                  </a>
                                </Button>
                              )}
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
    </div>
  )
}
