"use client"

import type { PedidoPagamento } from "@/types/pedido"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatCurrency } from "@/lib/utils"
import { Save, ChevronDown, ChevronUp, ClipboardCheck } from "lucide-react"
import { EmptyState } from "@/components/ui/empty-state"
import { useState } from "react"
import { corrigirPedido } from "@/app/actions/pedidos"
import { useRouter } from "next/navigation"

interface CorrecaoListProps {
  pedidos: PedidoPagamento[]
}

interface ValoresCorrecao {
  horas_extras_50: number
  horas_extras_100: number
  valor_km: number
  conducao: number
  valor_plantao: number
  motivo_plantao: string
  comissao: number
  motivo_comissao: string
  valor_desconto: number
  motivo_desconto: string
  resposta_correcao: string
}

export function CorrecaoList({ pedidos }: CorrecaoListProps) {
  const router = useRouter()
  const [editando, setEditando] = useState<string | null>(null)
  const [valores, setValores] = useState<{ [key: string]: ValoresCorrecao }>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [expandedRow, setExpandedRow] = useState<string | null>(null)

  const handleEditar = (pedido: PedidoPagamento) => {
    setEditando(pedido.id)
    setValores({
      ...valores,
      [pedido.id]: {
        horas_extras_50: pedido.horas_extras_50 || 0,
        horas_extras_100: pedido.horas_extras_100 || 0,
        valor_km: pedido.valor_km,
        conducao: pedido.conducao,
        valor_plantao: pedido.valor_plantao,
        motivo_plantao: pedido.motivo_plantao || "",
        comissao: pedido.comissao || 0,
        motivo_comissao: pedido.motivo_comissao || "",
        valor_desconto: pedido.valor_desconto || 0,
        motivo_desconto: pedido.motivo_desconto || "",
        resposta_correcao: "",
      },
    })
  }

  const handleSalvar = async (pedidoId: string) => {
    setLoading(true)
    setError("")
    try {
      await corrigirPedido(pedidoId, valores[pedidoId])
      setEditando(null)
      router.refresh()
    } catch (err) {
      setError("Erro ao corrigir pedido. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  if (pedidos.length === 0) {
    return (
      <EmptyState
        icon={ClipboardCheck}
        title="Nenhuma ordem aguardando correção"
        description="Todas as ordens estão em dia, sem pendências de correção."
      />
    )
  }

  return (
    <div className="rounded-lg border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Prestador</TableHead>
            <TableHead>Criado por</TableHead>
            <TableHead>Data</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Valor total</TableHead>
            <TableHead className="w-8" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {pedidos.map((pedido) => {
            const isEditando = editando === pedido.id
            const isExpanded = expandedRow === pedido.id
            const valoresAtuais = valores[pedido.id] || {
              horas_extras_50: pedido.horas_extras_50 || 0,
              horas_extras_100: pedido.horas_extras_100 || 0,
              valor_km: pedido.valor_km,
              conducao: pedido.conducao,
              valor_plantao: pedido.valor_plantao,
              motivo_plantao: pedido.motivo_plantao || "",
              comissao: pedido.comissao || 0,
              motivo_comissao: pedido.motivo_comissao || "",
              valor_desconto: pedido.valor_desconto || 0,
              motivo_desconto: pedido.motivo_desconto || "",
              resposta_correcao: "",
            }

            const colaboradorNome = pedido.colaborador?.nome_completo || "N/A"
            const colaboradorSalario = pedido.colaborador?.salario || 0

            const valorHoraNormal = colaboradorSalario / 220
            const valorHorasExtras50 = valoresAtuais.horas_extras_50 * valorHoraNormal * 1.5
            const valorHorasExtras100 = valoresAtuais.horas_extras_100 * valorHoraNormal * 2
            const valorTotalHorasExtras = valorHorasExtras50 + valorHorasExtras100

            const valorTotal =
              colaboradorSalario +
              valorTotalHorasExtras +
              valoresAtuais.valor_km +
              valoresAtuais.conducao +
              valoresAtuais.valor_plantao +
              valoresAtuais.comissao -
              valoresAtuais.valor_desconto

            const dataCriacao = new Date(pedido.created_at)
            const dataFormatada = dataCriacao.toLocaleDateString("pt-BR")
            const horaFormatada = dataCriacao.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
            const criadoPor = pedido.criado_por?.nome_completo || "N/A"

            return (
              <>
                <TableRow
                  key={pedido.id}
                  className="cursor-pointer"
                  onClick={() => setExpandedRow(isExpanded ? null : pedido.id)}
                >
                  <TableCell className="font-medium">{colaboradorNome}</TableCell>
                  <TableCell className="text-muted-foreground">{criadoPor}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {dataFormatada} às {horaFormatada}
                  </TableCell>
                  <TableCell>
                    <Badge variant="warning">Correção Solicitada</Badge>
                  </TableCell>
                  <TableCell className="text-right font-semibold tabular-nums">
                    {formatCurrency(valorTotal)}
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
                      <div className="space-y-4">
                        {(pedido.observacao_gerente || pedido.observacao_financeiro) && (
                          <div className="space-y-3">
                            {pedido.observacao_gerente && (
                              <div className="border-l-2 border-border pl-3 py-0.5">
                                <p className="text-xs font-medium text-muted-foreground mb-0.5">
                                  Observação do 1º aprovador
                                </p>
                                <p className="text-sm">{pedido.observacao_gerente}</p>
                              </div>
                            )}
                            {pedido.observacao_financeiro && (
                              <div className="border-l-2 border-border pl-3 py-0.5">
                                <p className="text-xs font-medium text-muted-foreground mb-0.5">
                                  Observação do aprovador final
                                </p>
                                <p className="text-sm">{pedido.observacao_financeiro}</p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Campo de Resposta */}
                        {(pedido.observacao_gerente || pedido.observacao_financeiro) && isEditando && (
                          <div>
                            <Label htmlFor={`resposta-${pedido.id}`} className="text-sm font-medium">
                              Resposta ao Questionamento
                            </Label>
                            <Textarea
                              id={`resposta-${pedido.id}`}
                              placeholder="Responda ao questionamento de quem solicitou a correção..."
                              value={valoresAtuais.resposta_correcao}
                              onChange={(e) =>
                                setValores({
                                  ...valores,
                                  [pedido.id]: {
                                    ...valoresAtuais,
                                    resposta_correcao: e.target.value,
                                  },
                                })
                              }
                              className="mt-1.5"
                              rows={3}
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              Esta resposta será enviada junto com a correção para quem solicitou.
                            </p>
                          </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {/* Valor Contratual Base (não editável) */}
                          <div>
                            <Label>Valor Contratual Base</Label>
                            <Input value={formatCurrency(colaboradorSalario)} disabled className="bg-muted" />
                          </div>

                          {/* Horas Extras 50% */}
                          <div>
                            <Label htmlFor={`he50-${pedido.id}`}>Horas Extras 50% (quantidade de horas)</Label>
                            <Input
                              id={`he50-${pedido.id}`}
                              type="number"
                              step="0.5"
                              value={valoresAtuais.horas_extras_50}
                              onChange={(e) =>
                                setValores({
                                  ...valores,
                                  [pedido.id]: {
                                    ...valoresAtuais,
                                    horas_extras_50: Number.parseFloat(e.target.value) || 0,
                                  },
                                })
                              }
                              disabled={!isEditando}
                              className={!isEditando ? "bg-muted" : ""}
                            />
                            {isEditando && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Valor calculado: {formatCurrency(valorHorasExtras50)}
                              </p>
                            )}
                          </div>

                          {/* Horas Extras 100% */}
                          <div>
                            <Label htmlFor={`he100-${pedido.id}`}>Horas Extras 100% (quantidade de horas)</Label>
                            <Input
                              id={`he100-${pedido.id}`}
                              type="number"
                              step="0.5"
                              value={valoresAtuais.horas_extras_100}
                              onChange={(e) =>
                                setValores({
                                  ...valores,
                                  [pedido.id]: {
                                    ...valoresAtuais,
                                    horas_extras_100: Number.parseFloat(e.target.value) || 0,
                                  },
                                })
                              }
                              disabled={!isEditando}
                              className={!isEditando ? "bg-muted" : ""}
                            />
                            {isEditando && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Valor calculado: {formatCurrency(valorHorasExtras100)}
                              </p>
                            )}
                          </div>

                          {/* Condução */}
                          <div>
                            <Label htmlFor={`conducao-${pedido.id}`}>Condução (R$)</Label>
                            <Input
                              id={`conducao-${pedido.id}`}
                              type="number"
                              step="0.01"
                              value={valoresAtuais.conducao}
                              onChange={(e) =>
                                setValores({
                                  ...valores,
                                  [pedido.id]: {
                                    ...valoresAtuais,
                                    conducao: Number.parseFloat(e.target.value) || 0,
                                  },
                                })
                              }
                              disabled={!isEditando}
                              className={!isEditando ? "bg-muted" : ""}
                            />
                          </div>

                          {/* Quilometragem */}
                          <div>
                            <Label htmlFor={`km-${pedido.id}`}>Quilometragem (R$)</Label>
                            <Input
                              id={`km-${pedido.id}`}
                              type="number"
                              step="0.01"
                              value={valoresAtuais.valor_km}
                              onChange={(e) =>
                                setValores({
                                  ...valores,
                                  [pedido.id]: {
                                    ...valoresAtuais,
                                    valor_km: Number.parseFloat(e.target.value) || 0,
                                  },
                                })
                              }
                              disabled={!isEditando}
                              className={!isEditando ? "bg-muted" : ""}
                            />
                          </div>

                          {/* Plantão */}
                          <div>
                            <Label htmlFor={`plantao-${pedido.id}`}>Plantão (R$)</Label>
                            <Input
                              id={`plantao-${pedido.id}`}
                              type="number"
                              step="0.01"
                              value={valoresAtuais.valor_plantao}
                              onChange={(e) =>
                                setValores({
                                  ...valores,
                                  [pedido.id]: {
                                    ...valoresAtuais,
                                    valor_plantao: Number.parseFloat(e.target.value) || 0,
                                  },
                                })
                              }
                              disabled={!isEditando}
                              className={!isEditando ? "bg-muted" : ""}
                            />
                          </div>

                          {/* Motivo do Plantão */}
                          {valoresAtuais.valor_plantao > 0 && (
                            <div className="sm:col-span-2">
                              <Label htmlFor={`motivo-plantao-${pedido.id}`}>Motivo do Plantão</Label>
                              <Textarea
                                id={`motivo-plantao-${pedido.id}`}
                                value={valoresAtuais.motivo_plantao}
                                onChange={(e) =>
                                  setValores({
                                    ...valores,
                                    [pedido.id]: {
                                      ...valoresAtuais,
                                      motivo_plantao: e.target.value,
                                    },
                                  })
                                }
                                disabled={!isEditando}
                                className={!isEditando ? "bg-muted" : ""}
                                rows={2}
                              />
                            </div>
                          )}

                          {/* Comissão */}
                          <div>
                            <Label htmlFor={`comissao-${pedido.id}`}>Comissão (R$)</Label>
                            <Input
                              id={`comissao-${pedido.id}`}
                              type="number"
                              step="0.01"
                              value={valoresAtuais.comissao}
                              onChange={(e) =>
                                setValores({
                                  ...valores,
                                  [pedido.id]: {
                                    ...valoresAtuais,
                                    comissao: Number.parseFloat(e.target.value) || 0,
                                  },
                                })
                              }
                              disabled={!isEditando}
                              className={!isEditando ? "bg-muted" : ""}
                            />
                          </div>

                          {/* Motivo da Comissão */}
                          {valoresAtuais.comissao > 0 && (
                            <div className="sm:col-span-2">
                              <Label htmlFor={`motivo-comissao-${pedido.id}`}>Motivo da Comissão</Label>
                              <Textarea
                                id={`motivo-comissao-${pedido.id}`}
                                value={valoresAtuais.motivo_comissao}
                                onChange={(e) =>
                                  setValores({
                                    ...valores,
                                    [pedido.id]: {
                                      ...valoresAtuais,
                                      motivo_comissao: e.target.value,
                                    },
                                  })
                                }
                                disabled={!isEditando}
                                className={!isEditando ? "bg-muted" : ""}
                                rows={2}
                              />
                            </div>
                          )}

                          {/* Desconto */}
                          <div>
                            <Label htmlFor={`desconto-${pedido.id}`}>Desconto (R$)</Label>
                            <Input
                              id={`desconto-${pedido.id}`}
                              type="number"
                              step="0.01"
                              value={valoresAtuais.valor_desconto}
                              onChange={(e) =>
                                setValores({
                                  ...valores,
                                  [pedido.id]: {
                                    ...valoresAtuais,
                                    valor_desconto: Number.parseFloat(e.target.value) || 0,
                                  },
                                })
                              }
                              disabled={!isEditando}
                              className={!isEditando ? "bg-muted" : ""}
                            />
                          </div>

                          {/* Motivo do Desconto */}
                          {valoresAtuais.valor_desconto > 0 && (
                            <div className="sm:col-span-2">
                              <Label htmlFor={`motivo-desconto-${pedido.id}`}>Motivo do Desconto</Label>
                              <Textarea
                                id={`motivo-desconto-${pedido.id}`}
                                value={valoresAtuais.motivo_desconto}
                                onChange={(e) =>
                                  setValores({
                                    ...valores,
                                    [pedido.id]: {
                                      ...valoresAtuais,
                                      motivo_desconto: e.target.value,
                                    },
                                  })
                                }
                                disabled={!isEditando}
                                className={!isEditando ? "bg-muted" : ""}
                                rows={2}
                              />
                            </div>
                          )}
                        </div>

                        <div className="pt-4 border-t">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Valor total</span>
                            <span className="text-lg font-semibold tabular-nums">{formatCurrency(valorTotal)}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Valor Contratual: {formatCurrency(colaboradorSalario)} + HE: {formatCurrency(valorTotalHorasExtras)} + Condução:{" "}
                            {formatCurrency(valoresAtuais.conducao)} + KM: {formatCurrency(valoresAtuais.valor_km)} + Plantão:{" "}
                            {formatCurrency(valoresAtuais.valor_plantao)} + Comissão: {formatCurrency(valoresAtuais.comissao)} - Desconto: {formatCurrency(valoresAtuais.valor_desconto)}
                          </p>
                        </div>

                        {error && (
                          <Alert variant="destructive">
                            <AlertDescription>{error}</AlertDescription>
                          </Alert>
                        )}

                        <div className="flex gap-2">
                          {!isEditando ? (
                            <Button onClick={() => handleEditar(pedido)}>Corrigir Pedido</Button>
                          ) : (
                            <>
                              <Button onClick={() => handleSalvar(pedido.id)} disabled={loading}>
                                <Save className="w-4 h-4" />
                                Salvar e Reenviar
                              </Button>
                              <Button onClick={() => setEditando(null)} disabled={loading} variant="outline">
                                Cancelar
                              </Button>
                            </>
                          )}
                        </div>
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
  )
}
