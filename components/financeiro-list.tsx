"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FileText, DollarSign, Clock, Car, Percent, Download, Search, Calendar } from "lucide-react"
import type { PedidoPagamento } from "@/types/pedido"
import { useRouter } from "next/navigation"
import { useMaskedCurrency } from "@/components/currency-display"

interface FinanceiroListProps {
  pedidos: PedidoPagamento[]
}

export function FinanceiroList({ pedidos }: FinanceiroListProps) {
  const router = useRouter()
  const { formatValue } = useMaskedCurrency()
  const [filtros, setFiltros] = useState({
    dataInicio: "",
    dataFim: "",
    colaboradorNome: "",
  })

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
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="rounded-full bg-muted p-6 mb-4">
          <FileText className="w-12 h-12 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Nenhum pedido para processar</h3>
        <p className="text-muted-foreground">Não há pedidos aprovados com nota fiscal no momento.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Search className="w-5 h-5" />
          Filtros
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="dataInicio">Data Início</Label>
            <Input
              id="dataInicio"
              type="date"
              value={filtros.dataInicio}
              onChange={(e) => setFiltros({ ...filtros, dataInicio: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dataFim">Data Fim</Label>
            <Input
              id="dataFim"
              type="date"
              value={filtros.dataFim}
              onChange={(e) => setFiltros({ ...filtros, dataFim: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="colaboradorNome">Nome do Colaborador</Label>
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
          <Button onClick={handleFiltrar} className="flex items-center gap-2">
            <Search className="w-4 h-4" />
            Filtrar
          </Button>
          <Button variant="outline" onClick={handleLimparFiltros}>
            Limpar Filtros
          </Button>
        </div>
      </Card>

      {/* Lista de Pedidos */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {pedidos.length} {pedidos.length === 1 ? "pedido encontrado" : "pedidos encontrados"}
          </p>
        </div>

        {pedidos.map((pedido) => {
          const isReembolsoKm = pedido.tipo_pedido === "reembolso_km"
          const salarioBase = isReembolsoKm ? 0 : pedido.colaborador?.salario || 0

          return (
            <Card key={pedido.id} className="p-6">
              <div className="space-y-4">
                {/* Header com nome e data */}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-semibold">{pedido.colaborador?.nome_completo || "Colaborador"}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(pedido.created_at).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                  <Badge variant="default" className="bg-green-500">
                    {isReembolsoKm ? "Reembolso KM" : "Nota Emitida"}
                  </Badge>
                </div>

                {/* Valores */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {isReembolsoKm ? (
                    <>
                      <div className="space-y-1 col-span-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Car className="w-4 h-4" />
                          Quilometragem (Reembolso)
                        </div>
                        <p className="text-lg font-semibold">
                          {formatValue(pedido.valor_km)}
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <DollarSign className="w-4 h-4" />
                          Salário Base
                        </div>
                        <p className="text-lg font-semibold">
                          {formatValue(salarioBase)}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          Horas Extras
                        </div>
                        <p className="text-lg font-semibold">
                          {formatValue(pedido.horas_extras)}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Car className="w-4 h-4" />
                          Quilometragem
                        </div>
                        <p className="text-lg font-semibold">
                          {formatValue(pedido.valor_km)}
                        </p>
                      </div>

                      {pedido.valor_plantao > 0 && (
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="w-4 h-4" />
                            Plantão
                          </div>
                          <p className="text-lg font-semibold">
                            {formatValue(pedido.valor_plantao)}
                          </p>
                        </div>
                      )}

                      {pedido.valor_desconto > 0 && (
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Percent className="w-4 h-4" />
                            Desconto
                          </div>
                          <p className="text-lg font-semibold text-red-600">
                            {formatValue(pedido.valor_desconto, true)}
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {pedido.horas_extras > 0 && pedido.motivo_horas_extras && (
                  <Card className="bg-orange-50 border-orange-200 p-3">
                    <p className="text-sm font-medium text-orange-900">Motivo das Horas Extras:</p>
                    <p className="text-sm text-orange-800 mt-1">{pedido.motivo_horas_extras}</p>
                  </Card>
                )}

                {/* Motivo do desconto */}
                {pedido.motivo_desconto && (
                  <Card className="bg-amber-50 border-amber-200 p-3">
                    <p className="text-sm font-medium text-amber-900">Motivo do Desconto:</p>
                    <p className="text-sm text-amber-800 mt-1">{pedido.motivo_desconto}</p>
                  </Card>
                )}

                {!isReembolsoKm && (
                  <Card className="bg-blue-50 border-blue-200 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-blue-900">Valor da Nota Fiscal</p>
                        <p className="text-xs text-blue-700 mt-1">
                          (Salário + Horas Extras + Condução + Plantão - Desconto)
                        </p>
                      </div>
                      <p className="text-2xl font-bold text-blue-900">
                        {formatValue(
                          salarioBase +
                          pedido.horas_extras +
                          (pedido.conducao || 0) +
                          pedido.valor_plantao -
                          pedido.valor_desconto
                        )}
                      </p>
                    </div>
                  </Card>
                )}

                {/* Valor total do pedido */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <span className="text-lg font-semibold">Valor Total do Pedido</span>
                  <span className="text-2xl font-bold">
                    {formatValue(pedido.valor_total)}
                  </span>
                </div>

                {!isReembolsoKm && pedido.notas_fiscais && pedido.notas_fiscais.length > 0 && (
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="font-medium">Nota Fiscal Anexada</p>
                        <p className="text-sm text-muted-foreground">
                          Emitida em{" "}
                          {pedido.data_emissao_nota
                            ? new Date(pedido.data_emissao_nota).toLocaleDateString("pt-BR")
                            : "N/A"}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button asChild variant="outline" size="sm">
                        <a
                          href={pedido.notas_fiscais[0].arquivo_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          download
                          onClick={(e) => {
                            const url = pedido.notas_fiscais[0]?.arquivo_url
                            if (!url || url.includes("undefined") || url.includes("null")) {
                              e.preventDefault()
                              alert("Arquivo XML não disponível ou foi removido.")
                            }
                          }}
                        >
                          <Download className="w-4 h-4 mr-2" />
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
                            <Download className="w-4 h-4 mr-2" />
                            Baixar PDF
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
