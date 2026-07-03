"use client"

import type { Colaborador } from "@/types/colaborador"
import type { NovoPedido } from "@/types/pedido"
import { useState, useMemo, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  Plus,
  Trash2,
  Clock,
  Car,
  Bus,
  AlertCircle,
  DollarSign,
  Percent,
  Award,
  MapPin,
  Send,
  Search,
} from "lucide-react"
import { criarPedido } from "@/app/actions/pedidos"
import { useRouter } from "next/navigation"
import { PedidoConfirmationDialog } from "@/components/pedido-confirmation-dialog"

type ItemTipo =
  | "hora_extra_normal"
  | "hora_extra_50"
  | "hora_extra_100"
  | "plantao"
  | "conducao"
  | "reembolso_km"
  | "comissao"
  | "desconto_dias"
  | "desconto_horas"
  | "desconto_valor"

interface PedidoItem {
  id: string
  tipo: ItemTipo
  quantidade: number
  valor: number
  motivo: string
}

const ITEM_CONFIG: Record<
  ItemTipo,
  { label: string; desc: string; icon: typeof Clock; color: string; bgCard: string; unidade: string; isDesconto?: boolean }
> = {
  hora_extra_normal: {
    label: "Hora Extra Normal",
    desc: "Sem adicional percentual",
    icon: Clock,
    color: "text-sky-700",
    bgCard: "bg-sky-50 border-sky-200",
    unidade: "horas",
  },
  hora_extra_50: {
    label: "Hora Extra 50%",
    desc: "Adicional de 50% sobre hora normal",
    icon: Clock,
    color: "text-amber-700",
    bgCard: "bg-amber-50 border-amber-200",
    unidade: "horas",
  },
  hora_extra_100: {
    label: "Hora Extra 100%",
    desc: "Adicional de 100% sobre hora normal",
    icon: Clock,
    color: "text-orange-700",
    bgCard: "bg-orange-50 border-orange-200",
    unidade: "horas",
  },
  plantao: {
    label: "Plantao",
    desc: "Valor fixo por plantao realizado",
    icon: AlertCircle,
    color: "text-purple-700",
    bgCard: "bg-purple-50 border-purple-200",
    unidade: "valor",
  },
  conducao: {
    label: "Conducao",
    desc: "Vale transporte / deslocamento",
    icon: Bus,
    color: "text-teal-700",
    bgCard: "bg-teal-50 border-teal-200",
    unidade: "valor",
  },
  reembolso_km: {
    label: "Reembolso KM",
    desc: "Quilometragem percorrida",
    icon: MapPin,
    color: "text-green-700",
    bgCard: "bg-green-50 border-green-200",
    unidade: "valor",
  },
  comissao: {
    label: "Comissao",
    desc: "Comissao sobre vendas/resultados",
    icon: Award,
    color: "text-blue-700",
    bgCard: "bg-blue-50 border-blue-200",
    unidade: "valor",
  },
  desconto_dias: {
    label: "Desconto por Dias",
    desc: "Calculo: salario / 22 dias uteis x qtd",
    icon: Percent,
    color: "text-red-700",
    bgCard: "bg-red-50 border-red-200",
    unidade: "dias",
    isDesconto: true,
  },
  desconto_horas: {
    label: "Desconto por Horas",
    desc: "Calculo: valor hora x quantidade",
    icon: Percent,
    color: "text-red-700",
    bgCard: "bg-red-50 border-red-200",
    unidade: "horas",
    isDesconto: true,
  },
  desconto_valor: {
    label: "Desconto Fixo",
    desc: "Valor fixo de desconto",
    icon: Percent,
    color: "text-red-700",
    bgCard: "bg-red-50 border-red-200",
    unidade: "valor",
    isDesconto: true,
  },
}

interface PedidoFormProps {
  colaboradores: Colaborador[]
  tipoAcesso?: string
}

export function PedidoForm({ colaboradores, tipoAcesso }: PedidoFormProps) {
  const router = useRouter()
  const [selectedColaborador, setSelectedColaborador] = useState("")
  const [tipoPedido, setTipoPedido] = useState<"completo" | "reembolso_km">("completo")
  const [items, setItems] = useState<PedidoItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [pendingPedido, setPendingPedido] = useState<NovoPedido | null>(null)
  const [buscaColaborador, setBuscaColaborador] = useState("")
  const [filtroDiaPagamento, setFiltroDiaPagamento] = useState("todos")

  // Item builder state
  const [addingTipo, setAddingTipo] = useState<ItemTipo | "">("")
  const [addingQtd, setAddingQtd] = useState("")
  const [addingValor, setAddingValor] = useState("")
  const [addingMotivo, setAddingMotivo] = useState("")
  const [addingError, setAddingError] = useState("")

  const colaborador = colaboradores.find((c) => c.id === selectedColaborador)
  const salario = colaborador?.salario || 0
  const valorHoraNormal = salario / 220
  const valorDiario = salario / 22

  const colaboradoresFiltrados = useMemo(() => {
    let result = colaboradores
    if (filtroDiaPagamento !== "todos") {
      result = result.filter((c) => c.dia_pagamento === Number.parseInt(filtroDiaPagamento))
    }
    if (buscaColaborador) {
      const busca = buscaColaborador.toLowerCase()
      result = result.filter(
        (c) => c.nome_completo.toLowerCase().includes(busca) || c.email.toLowerCase().includes(busca),
      )
    }
    return result
  }, [colaboradores, buscaColaborador, filtroDiaPagamento])

  const calcularValorItem = useCallback(
    (item: PedidoItem): number => {
      switch (item.tipo) {
        case "hora_extra_normal": return item.quantidade * valorHoraNormal
        case "hora_extra_50": return item.quantidade * valorHoraNormal * 1.5
        case "hora_extra_100": return item.quantidade * valorHoraNormal * 2
        case "desconto_dias": return item.quantidade * valorDiario
        case "desconto_horas": return item.quantidade * valorHoraNormal
        case "desconto_valor": return item.valor
        case "plantao":
        case "conducao":
        case "reembolso_km":
        case "comissao":
          return item.valor
        default: return 0
      }
    },
    [valorHoraNormal, valorDiario],
  )

  const resumo = useMemo(() => {
    let totalHeNormal = 0, totalHe50 = 0, totalHe100 = 0, totalPlantao = 0, totalConducao = 0, totalKm = 0, totalComissao = 0, totalDesconto = 0

    for (const item of items) {
      const val = calcularValorItem(item)
      switch (item.tipo) {
        case "hora_extra_normal": totalHeNormal += val; break
        case "hora_extra_50": totalHe50 += val; break
        case "hora_extra_100": totalHe100 += val; break
        case "plantao": totalPlantao += val; break
        case "conducao": totalConducao += val; break
        case "reembolso_km": totalKm += val; break
        case "comissao": totalComissao += val; break
        case "desconto_dias":
        case "desconto_horas":
        case "desconto_valor": totalDesconto += val; break
      }
    }

    const horasExtras = totalHeNormal + totalHe50 + totalHe100
    // Condução e KM ficam fora do valor da nota (aparecem mas não calculam)
    const totalBruto = tipoPedido === "reembolso_km"
      ? totalKm
      : salario + horasExtras + totalPlantao + totalComissao
    const totalLiquido = totalBruto - totalDesconto

    return {
      salario: tipoPedido === "reembolso_km" ? 0 : salario,
      horasExtras,
      plantao: totalPlantao,
      conducao: totalConducao,
      km: totalKm,
      comissao: totalComissao,
      desconto: totalDesconto,
      totalBruto,
      totalLiquido,
    }
  }, [items, salario, tipoPedido, calcularValorItem])

  const addItem = () => {
    if (!addingTipo) return
    const config = ITEM_CONFIG[addingTipo]
    const qtd = parseFloat(addingQtd) || 0
    const val = parseFloat(addingValor) || 0

    if (config.unidade === "valor" && val <= 0) {
      setAddingError("Informe o valor")
      return
    }
    if (config.unidade !== "valor" && qtd <= 0) {
      setAddingError("Informe a quantidade")
      return
    }
    if (!addingMotivo.trim()) {
      setAddingError("O motivo e obrigatorio")
      return
    }

    setAddingError("")
    setItems((prev) => [
      ...prev,
      { id: crypto.randomUUID(), tipo: addingTipo as ItemTipo, quantidade: qtd, valor: val, motivo: addingMotivo.trim() },
    ])
    setAddingTipo("")
    setAddingQtd("")
    setAddingValor("")
    setAddingMotivo("")
  }

  const removeItem = (id: string) => setItems((prev) => prev.filter((i) => i.id !== id))

  const fmt = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v)

  const buildPedido = (): NovoPedido => {
    let he50Qty = 0, he100Qty = 0, valorKm = 0, valorConducao = 0, valorPlantao = 0, valorComissao = 0, valorDesconto = 0
    const motivos: string[] = []
    const motivosDesconto: string[] = []
    const motivosPlantao: string[] = []
    const motivosComissao: string[] = []

    for (const item of items) {
      const val = calcularValorItem(item)
      switch (item.tipo) {
        case "hora_extra_normal":
          // Normal hours go into horas_extras_50 bucket with 0 multiplier difference
          // We store the raw hours - the server treats them as base rate
          he50Qty += item.quantidade
          motivos.push(`HE Normal ${item.quantidade}h: ${item.motivo}`)
          break
        case "hora_extra_50":
          he50Qty += item.quantidade
          motivos.push(`HE 50% ${item.quantidade}h: ${item.motivo}`)
          break
        case "hora_extra_100":
          he100Qty += item.quantidade
          motivos.push(`HE 100% ${item.quantidade}h: ${item.motivo}`)
          break
        case "plantao":
          valorPlantao += item.valor
          motivosPlantao.push(item.motivo)
          break
        case "conducao": valorConducao += item.valor; break
        case "reembolso_km": valorKm += item.valor; break
        case "comissao":
          valorComissao += item.valor
          motivosComissao.push(item.motivo)
          break
        case "desconto_dias":
          valorDesconto += val
          motivosDesconto.push(`${item.quantidade} dias: ${item.motivo}`)
          break
        case "desconto_horas":
          valorDesconto += val
          motivosDesconto.push(`${item.quantidade}h: ${item.motivo}`)
          break
        case "desconto_valor":
          valorDesconto += item.valor
          motivosDesconto.push(`${fmt(item.valor)}: ${item.motivo}`)
          break
      }
    }

    return {
      colaborador_id: selectedColaborador,
      tipo_pedido: tipoPedido,
      horas_extras_50: he50Qty,
      horas_extras_100: he100Qty,
      motivo_horas_extras: motivos.join(" | ") || undefined,
      valor_km: valorKm,
      conducao: valorConducao,
      valor_plantao: valorPlantao,
      motivo_plantao: motivosPlantao.join(" | ") || undefined,
      comissao: valorComissao,
      motivo_comissao: motivosComissao.join(" | ") || undefined,
      valor_desconto: valorDesconto,
      motivo_desconto: motivosDesconto.join(" | ") || undefined,
    }
  }

  const handleSubmitClick = () => {
    if (!selectedColaborador) { setError("Selecione um colaborador"); return }
    if (items.length === 0 && tipoPedido === "reembolso_km") { setError("Adicione pelo menos um item"); return }
    setError("")
    setPendingPedido(buildPedido())
    setShowConfirmation(true)
  }

  const handleConfirm = async () => {
    if (!pendingPedido) return
    setLoading(true)
    setError("")
    try {
      await criarPedido(pendingPedido)
      router.push("/historico")
      router.refresh()
    } catch (err: any) {
      setError(err.message || "Erro ao criar pedido")
    } finally {
      setLoading(false)
      setShowConfirmation(false)
    }
  }

  const availableTypes: ItemTipo[] = tipoPedido === "reembolso_km"
    ? ["reembolso_km"]
    : ["hora_extra_normal", "hora_extra_50", "hora_extra_100", "plantao", "conducao", "reembolso_km", "comissao", "desconto_dias", "desconto_horas", "desconto_valor"]

  const currentConfig = addingTipo ? ITEM_CONFIG[addingTipo as ItemTipo] : null

  return (
    <div className="space-y-4">
      {/* Step 1: Colaborador Selection */}
      <Card>
        <CardContent className="pt-5 pb-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="h-6 w-6 rounded-full bg-blue-600 flex items-center justify-center">
                <span className="text-white text-xs font-bold">1</span>
              </div>
              <Label className="text-sm font-semibold">Selecione o Colaborador</Label>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou email..."
                  value={buscaColaborador}
                  onChange={(e) => setBuscaColaborador(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={filtroDiaPagamento} onValueChange={setFiltroDiaPagamento}>
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue placeholder="Dia pgto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="1">Dia 1</SelectItem>
                  <SelectItem value="15">Dia 15</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Select value={selectedColaborador} onValueChange={(v) => { setSelectedColaborador(v); setItems([]) }}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o colaborador" />
              </SelectTrigger>
              <SelectContent>
                {colaboradoresFiltrados.map((c) => (
                  <SelectItem key={c.id} value={c.id} disabled={c.bloqueado}>
                    {c.nome_completo} - {fmt(c.salario)} (Dia {c.dia_pagamento})
                    {c.bloqueado ? " [ja lancado]" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {colaborador && (
              <div className="flex flex-wrap gap-2 mt-1">
                <Badge variant="outline" className="text-xs">Salario: {fmt(salario)}</Badge>
                <Badge variant="outline" className="text-xs">Hora: {fmt(valorHoraNormal)}</Badge>
                <Badge variant="outline" className="text-xs">Dia: {fmt(valorDiario)}</Badge>
                <Badge variant="outline" className="text-xs">Pgto dia: {colaborador.dia_pagamento}</Badge>
              </div>
            )}

            <div className="pt-1">
              <Select value={tipoPedido} onValueChange={(v) => { setTipoPedido(v as "completo" | "reembolso_km"); setItems([]) }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="completo">Pagamento Completo</SelectItem>
                  <SelectItem value="reembolso_km">Somente Reembolso KM</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step 2: Item Builder */}
      {selectedColaborador && (
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="h-6 w-6 rounded-full bg-blue-600 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">2</span>
                </div>
                <Label className="text-sm font-semibold">Adicionar Itens</Label>
              </div>

              {/* Quick Type Buttons */}
              <div className="flex flex-wrap gap-1.5">
                {availableTypes.map((t) => {
                  const cfg = ITEM_CONFIG[t]
                  const Icon = cfg.icon
                  const isActive = addingTipo === t
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => { setAddingTipo(t); setAddingQtd(""); setAddingValor(""); setAddingMotivo(""); setAddingError("") }}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                        isActive
                          ? `${cfg.bgCard} ${cfg.color} ring-2 ring-offset-1 ring-current`
                          : "bg-muted/50 text-muted-foreground border-transparent hover:bg-muted"
                      }`}
                    >
                      <Icon className="h-3 w-3" />
                      {cfg.label}
                    </button>
                  )
                })}
              </div>

              {/* Active Item Form */}
              {currentConfig && addingTipo && (
                <div className={`rounded-lg border p-4 space-y-3 ${currentConfig.bgCard}`}>
                  <div className="flex items-center gap-2">
                    {(() => { const Icon = currentConfig.icon; return <Icon className={`h-4 w-4 ${currentConfig.color}`} /> })()}
                    <span className={`font-semibold text-sm ${currentConfig.color}`}>{currentConfig.label}</span>
                    <span className="text-xs text-muted-foreground">{currentConfig.desc}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {currentConfig.unidade !== "valor" && (
                      <div className="space-y-1">
                        <Label className="text-xs">
                          Quantidade ({currentConfig.unidade === "dias" ? "dias uteis" : "horas"})
                        </Label>
                        <Input
                          type="number"
                          step={currentConfig.unidade === "dias" ? "1" : "0.5"}
                          min="0"
                          placeholder={`Ex: ${currentConfig.unidade === "dias" ? "3" : "2"}`}
                          value={addingQtd}
                          onChange={(e) => setAddingQtd(e.target.value)}
                          className="bg-background"
                        />
                        {addingQtd && (
                          <p className="text-xs text-muted-foreground">
                            {"= "}
                            {fmt(calcularValorItem({
                              id: "", tipo: addingTipo as ItemTipo,
                              quantidade: parseFloat(addingQtd) || 0,
                              valor: 0, motivo: "",
                            }))}
                          </p>
                        )}
                      </div>
                    )}

                    {currentConfig.unidade === "valor" && (
                      <div className="space-y-1">
                        <Label className="text-xs">Valor (R$)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0,00"
                          value={addingValor}
                          onChange={(e) => setAddingValor(e.target.value)}
                          className="bg-background"
                        />
                      </div>
                    )}

                    <div className="space-y-1 sm:col-span-1">
                      <Label className="text-xs">
                        Motivo <span className="text-red-500">*</span>
                      </Label>
                      <Textarea
                        placeholder="Descreva o motivo..."
                        value={addingMotivo}
                        onChange={(e) => { setAddingMotivo(e.target.value); setAddingError("") }}
                        className="bg-background min-h-[60px] text-sm resize-none"
                        rows={2}
                      />
                    </div>
                  </div>

                  {addingError && (
                    <p className="text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {addingError}
                    </p>
                  )}

                  <Button type="button" size="sm" onClick={addItem} className="w-full sm:w-auto">
                    <Plus className="h-4 w-4 mr-1" />
                    Adicionar ao Pedido
                  </Button>
                </div>
              )}

              {/* Added Items List */}
              {items.length > 0 && (
                <div className="space-y-2 pt-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {items.length} {items.length === 1 ? "item adicionado" : "itens adicionados"}
                  </p>
                  {items.map((item) => {
                    const cfg = ITEM_CONFIG[item.tipo]
                    const Icon = cfg.icon
                    const val = calcularValorItem(item)
                    return (
                      <div key={item.id} className={`flex items-start justify-between gap-3 p-3 rounded-lg border ${cfg.bgCard}`}>
                        <div className="flex items-start gap-2 min-w-0 flex-1">
                          <Icon className={`h-4 w-4 shrink-0 mt-0.5 ${cfg.color}`} />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`font-medium text-sm ${cfg.color}`}>{cfg.label}</span>
                              {cfg.unidade !== "valor" && (
                                <Badge variant="secondary" className="text-xs">{item.quantidade} {cfg.unidade}</Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5 truncate">{item.motivo}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <span className={`font-semibold text-sm whitespace-nowrap ${cfg.isDesconto ? "text-red-600" : cfg.color}`}>
                            {cfg.isDesconto ? "- " : "+ "}{fmt(val)}
                          </span>
                          <Button type="button" variant="ghost" size="icon" className="h-7 w-7 shrink-0 hover:bg-red-100" onClick={() => removeItem(item.id)}>
                            <Trash2 className="h-3.5 w-3.5 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Summary */}
      {selectedColaborador && (
        <Card className="border-2 border-blue-200 bg-blue-50/30">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-6 w-6 rounded-full bg-blue-600 flex items-center justify-center">
                <span className="text-white text-xs font-bold">3</span>
              </div>
              <Label className="text-sm font-semibold">Resumo do Pedido</Label>
            </div>

            <div className="space-y-1.5">
              {tipoPedido === "completo" && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1.5"><DollarSign className="h-3.5 w-3.5" />Salario Base</span>
                  <span className="font-medium">{fmt(resumo.salario)}</span>
                </div>
              )}
              {resumo.horasExtras > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />Horas Extras</span>
                  <span className="font-medium text-amber-700">+ {fmt(resumo.horasExtras)}</span>
                </div>
              )}
              {resumo.plantao > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1.5"><AlertCircle className="h-3.5 w-3.5" />Plantao</span>
                  <span className="font-medium text-purple-700">+ {fmt(resumo.plantao)}</span>
                </div>
              )}
              {resumo.conducao > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1.5"><Bus className="h-3.5 w-3.5" />Conducao</span>
                  <span className="font-medium text-teal-700">+ {fmt(resumo.conducao)}</span>
                </div>
              )}
              {resumo.km > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1.5"><Car className="h-3.5 w-3.5" />Reembolso KM</span>
                  <span className="font-medium text-green-700">+ {fmt(resumo.km)}</span>
                </div>
              )}
              {resumo.comissao > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1.5"><Award className="h-3.5 w-3.5" />Comissao</span>
                  <span className="font-medium text-blue-700">+ {fmt(resumo.comissao)}</span>
                </div>
              )}
              {resumo.desconto > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1.5"><Percent className="h-3.5 w-3.5" />Descontos</span>
                  <span className="font-medium text-red-600">- {fmt(resumo.desconto)}</span>
                </div>
              )}

              <div className="border-t border-blue-200 pt-2 mt-2 flex justify-between">
                <span className="font-bold text-base">Total Liquido</span>
                <span className="font-bold text-lg text-blue-700">{fmt(resumo.totalLiquido)}</span>
              </div>
            </div>

            {error && (
              <div className="mt-3 p-2.5 rounded-lg bg-red-100 border border-red-200 text-red-700 text-sm flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <Button className="w-full mt-4" size="lg" onClick={handleSubmitClick} disabled={loading || !selectedColaborador}>
              <Send className="h-4 w-4 mr-2" />
              {loading ? "Enviando..." : "Enviar Pedido"}
            </Button>
          </CardContent>
        </Card>
      )}

      {pendingPedido && colaborador && (
        <PedidoConfirmationDialog
          open={showConfirmation}
          onOpenChange={setShowConfirmation}
          onConfirm={handleConfirm}
          loading={loading}
          pedido={pendingPedido}
          colaboradorNome={colaborador.nome_completo}
          salario={colaborador.salario}
        />
      )}
    </div>
  )
}
