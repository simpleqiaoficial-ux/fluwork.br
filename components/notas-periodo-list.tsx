"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  FileText,
  Download,
  Search,
  Calendar,
  DollarSign,
  Receipt,
  CheckCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  User,
} from "lucide-react"
import type { PedidoPagamento } from "@/types/pedido"
import { useMaskedCurrency } from "@/components/currency-display"

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
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="rounded-full bg-muted p-6 mb-4">
          <FileText className="w-12 h-12 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Nenhuma nota neste periodo</h3>
        <p className="text-muted-foreground">
          Nao foram encontradas notas fiscais para este mes.
        </p>
      </div>
    )
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "nota_recebida":
        return (
          <Badge variant="default" className="bg-teal-600 text-xs">
            <CheckCircle className="w-3 h-3 mr-1" />
            Nota Recebida
          </Badge>
        )
      case "pago":
        return (
          <Badge variant="default" className="bg-emerald-600 text-xs">
            <CheckCircle className="w-3 h-3 mr-1" />
            Pago
          </Badge>
        )
      case "pendente_financeiro":
      case "aprovado":
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs">
            <Clock className="w-3 h-3 mr-1" />
            Pendente
          </Badge>
        )
      default:
        return null
    }
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

      <div className="space-y-2">
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
            <Card key={pedido.id} className="p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-semibold truncate">
                      {pedido.colaborador?.nome_completo || "Colaborador"}
                    </h3>
                    {getStatusBadge(pedido.status)}
                    {isReembolsoKm && (
                      <Badge variant="outline" className="text-xs">
                        Reembolso KM
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(pedido.created_at).toLocaleDateString("pt-BR")}
                    </span>
                    <span className="flex items-center gap-1 font-medium text-blue-600">
                      <Receipt className="w-3 h-3" />
                      NF: {formatValue(valorNF)}
                    </span>
                    {pedido.colaborador?.cnpj && (
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {pedido.colaborador.cnpj}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {pdfUrl && (
                    <Button asChild variant="outline" size="sm" className="h-8 bg-transparent">
                      <a href={pdfUrl} download target="_blank" rel="noopener noreferrer">
                        <Download className="w-3.5 h-3.5 mr-1" />
                        PDF
                      </a>
                    </Button>
                  )}
                  {xmlUrl && (
                    <Button asChild variant="outline" size="sm" className="h-8 bg-transparent">
                      <a href={xmlUrl} download target="_blank" rel="noopener noreferrer">
                        <Download className="w-3.5 h-3.5 mr-1" />
                        XML
                      </a>
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setExpandedId(isExpanded ? null : pedido.id)}
                    className="h-8 px-2"
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              {isExpanded && (
                <div className="mt-3 pt-3 border-t space-y-3">
                  {isReembolsoKm ? (
                    <div className="bg-muted/30 p-2 rounded">
                      <span className="text-xs text-muted-foreground block">Quilometragem (Reembolso)</span>
                      <span className="font-semibold text-sm">{formatValue(pedido.valor_km || 0)}</span>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs bg-muted/30 p-2 rounded">
                        <div>
                          <span className="text-muted-foreground block">Salario</span>
                          <span className="font-semibold">{formatValue(pedido.colaborador?.salario || 0)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block">Horas Extras</span>
                          <span className="font-semibold">{formatValue(pedido.horas_extras || 0)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block">Plantao</span>
                          <span className="font-semibold">{formatValue(pedido.valor_plantao || 0)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block">Comissao</span>
                          <span className="font-semibold">{formatValue(pedido.comissao || 0)}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs bg-teal-50 border border-teal-200 p-2 rounded">
                        <div>
                          <span className="text-teal-700 block">Conducao (fora da NF)</span>
                          <span className="font-semibold text-teal-800">{formatValue(pedido.conducao || 0)}</span>
                        </div>
                        <div>
                          <span className="text-teal-700 block">Quilometragem (fora da NF)</span>
                          <span className="font-semibold text-teal-800">{formatValue(pedido.valor_km || 0)}</span>
                        </div>
                      </div>
                    </>
                  )}

                  {(pedido.valor_desconto || 0) > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded p-2">
                      <span className="text-xs text-muted-foreground block">Desconto</span>
                      <span className="font-semibold text-red-600 text-sm">
                        -{formatValue(pedido.valor_desconto || 0)}
                      </span>
                      {pedido.motivo_desconto && (
                        <span className="text-xs text-muted-foreground block mt-1">
                          Motivo: {pedido.motivo_desconto}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="bg-blue-50 border border-blue-200 rounded p-2">
                    <div className="flex justify-between items-end">
                      {!isReembolsoKm && (
                        <div>
                          <div className="text-xs text-muted-foreground">Valor para Nota Fiscal</div>
                          <div className="text-sm font-semibold text-blue-600">{formatValue(valorNF)}</div>
                        </div>
                      )}
                      <div className={`text-right ${isReembolsoKm ? "w-full" : ""}`}>
                        <div className="text-xs text-muted-foreground">Total do Pedido</div>
                        <div className="text-sm font-semibold">{formatValue(pedido.valor_total)}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}
