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
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Plus,
  Trash2,
  Clock,
  Bus,
  AlertCircle,
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
  { label: string; desc: string; icon: typeof Clock; unidade: string; isDesconto?: boolean }
> = {
  hora_extra_normal: {
    label: "Hora Extra Normal",
    desc: "Sem adicional percentual",
    icon: Clock,
    unidade: "horas",
  },
  hora_extra_50: {
    label: "Hora Extra 50%",
    desc: "Adicional de 50% sobre hora normal",
    icon: Clock,
    unidade: "horas",
  },
  hora_extra_100: {
    label: "Hora Extra 100%",
    desc: "Adicional de 100% sobre hora normal",
    icon: Clock,
    unidade: "horas",
  },
  plantao: {
    label: "Plantão",
    desc: "Valor fixo por plantão realizado",
    icon: AlertCircle,
    unidade: "valor",
  },
  conducao: {
    label: "Condução",
    desc: "Vale transporte / deslocamento",
    icon: Bus,
    unidade: "valor",
  },
  reembolso_km: {
    label: "Reembolso KM",
    desc: "Quilometragem percorrida",
    icon: MapPin,
    unidade: "valor",
  },
  comissao: {
    label: "Comissão",
    desc: "Comissão sobre vendas/resultados",
    icon: Award,
    unidade: "valor",
  },
  desconto_dias: {
    label: "Desconto por Dias",
    desc: "Cálculo: valor contratual / 22 dias úteis x qtd",
    icon: Percent,
    unidade: "dias",
    isDesconto: true,
  },
  desconto_horas: {
    label: "Desconto por Horas",
    desc: "Cálculo: valor hora x quantidade",
    icon: Percent,
    unidade: "horas",
    isDesconto: true,
  },
  desconto_valor: {
    label: "Desconto Fixo",
    desc: "Valor fixo de desconto",
    icon: Percent,
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
      setAddingError("O motivo é obrigatório")
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
    if (!selectedColaborador) { setError("Selecione um prestador"); return }
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

  const StepHeader = ({ n, title }: { n: number; title: string }) => (
    <div className="flex items-center gap-2.5 mb-4">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold">
        {n}
      </span>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
    </div>
  )

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6 space-y-8">
          {/* Step 1: Colaborador Selection */}
          <section>
            <StepHeader n={1} title="Selecione o prestador" />

            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1 space-y-1">
                  <Label className="text-xs text-muted-foreground">Buscar prestador</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Nome ou e-mail..."
                      value={buscaColaborador}
                      onChange={(e) => setBuscaColaborador(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Dia de pagamento</Label>
                  <Select value={filtroDiaPagamento} onValueChange={setFiltroDiaPagamento}>
                    <SelectTrigger className="w-full sm:w-32">
                      <SelectValue placeholder="Dia" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="1">Dia 1</SelectItem>
                      <SelectItem value="15">Dia 15</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Select value={selectedColaborador} onValueChange={(v) => { setSelectedColaborador(v); setItems([]) }}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o prestador" />
                </SelectTrigger>
                <SelectContent>
                  {colaboradoresFiltrados.map((c) => (
                    <SelectItem key={c.id} value={c.id} disabled={c.bloqueado}>
                      {c.nome_completo} - {fmt(c.salario)} (Dia {c.dia_pagamento})
                      {c.bloqueado ? " [já lançado]" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {colaborador && (
                <div className="flex flex-wrap gap-x-5 gap-y-1.5 rounded-md bg-muted/50 px-3 py-2.5 text-xs">
                  <span className="text-muted-foreground">Valor contratual <span className="font-semibold text-foreground tabular-nums">{fmt(salario)}</span></span>
                  <span className="text-muted-foreground">Valor hora <span className="font-semibold text-foreground tabular-nums">{fmt(valorHoraNormal)}</span></span>
                  <span className="text-muted-foreground">Valor dia <span className="font-semibold text-foreground tabular-nums">{fmt(valorDiario)}</span></span>
                  <span className="text-muted-foreground">Pagamento no dia <span className="font-semibold text-foreground tabular-nums">{colaborador.dia_pagamento}</span></span>
                </div>
              )}

              <div className="space-y-1 pt-1">
                <Label className="text-xs text-muted-foreground">Tipo de pedido</Label>
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
          </section>

          {/* Step 2: Item Builder */}
          {selectedColaborador && (
            <section className="pt-8 border-t">
              <StepHeader n={2} title="Adicionar itens" />

              <div className="space-y-4">
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
                        className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                          isActive
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-transparent bg-muted text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {cfg.label}
                      </button>
                    )
                  })}
                </div>

                {/* Active Item Form */}
                {currentConfig && addingTipo && (
                  <div className="rounded-md border p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <currentConfig.icon className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-sm">{currentConfig.label}</span>
                      <span className="text-xs text-muted-foreground">{currentConfig.desc}</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {currentConfig.unidade !== "valor" && (
                        <div className="space-y-1">
                          <Label className="text-xs">
                            Quantidade ({currentConfig.unidade === "dias" ? "dias úteis" : "horas"})
                          </Label>
                          <Input
                            type="number"
                            step={currentConfig.unidade === "dias" ? "1" : "0.5"}
                            min="0"
                            placeholder={`Ex: ${currentConfig.unidade === "dias" ? "3" : "2"}`}
                            value={addingQtd}
                            onChange={(e) => setAddingQtd(e.target.value)}
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
                          />
                        </div>
                      )}

                      <div className="space-y-1 sm:col-span-1">
                        <Label className="text-xs">
                          Motivo <span className="text-destructive">*</span>
                        </Label>
                        <Textarea
                          placeholder="Descreva o motivo..."
                          value={addingMotivo}
                          onChange={(e) => { setAddingMotivo(e.target.value); setAddingError("") }}
                          className="min-h-[60px] text-sm resize-none"
                          rows={2}
                        />
                      </div>
                    </div>

                    {addingError && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {addingError}
                      </p>
                    )}

                    <Button type="button" size="sm" onClick={addItem} className="w-full sm:w-auto">
                      <Plus className="h-4 w-4" />
                      Adicionar ao Pedido
                    </Button>
                  </div>
                )}

                {/* Added Items List */}
                {items.length > 0 && (
                  <div className="pt-2">
                    <p className="text-xs text-muted-foreground mb-2">
                      {items.length} {items.length === 1 ? "item adicionado" : "itens adicionados"}
                    </p>
                    <div className="rounded-md border divide-y">
                      {items.map((item) => {
                        const cfg = ITEM_CONFIG[item.tipo]
                        const Icon = cfg.icon
                        const val = calcularValorItem(item)
                        return (
                          <div key={item.id} className="flex items-start justify-between gap-3 px-3 py-2.5">
                            <div className="flex items-start gap-2 min-w-0 flex-1">
                              <Icon className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground" />
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-medium text-sm">{cfg.label}</span>
                                  {cfg.unidade !== "valor" && (
                                    <span className="text-xs text-muted-foreground">{item.quantidade} {cfg.unidade}</span>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5 truncate">{item.motivo}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <span className={`font-medium text-sm whitespace-nowrap tabular-nums ${cfg.isDesconto ? "text-destructive" : "text-foreground"}`}>
                                {cfg.isDesconto ? "− " : "+ "}{fmt(val)}
                              </span>
                              <Button type="button" variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => removeItem(item.id)}>
                                <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                              </Button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Step 3: Summary */}
          {selectedColaborador && (
            <section className="pt-8 border-t">
              <StepHeader n={3} title="Resumo do pedido" />

              <div className="space-y-2">
                {tipoPedido === "completo" && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Valor Contratual Base</span>
                    <span className="font-medium tabular-nums">{fmt(resumo.salario)}</span>
                  </div>
                )}
                {resumo.horasExtras > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Horas Extras</span>
                    <span className="font-medium tabular-nums">+ {fmt(resumo.horasExtras)}</span>
                  </div>
                )}
                {resumo.plantao > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Plantão</span>
                    <span className="font-medium tabular-nums">+ {fmt(resumo.plantao)}</span>
                  </div>
                )}
                {resumo.conducao > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Condução</span>
                    <span className="font-medium tabular-nums">+ {fmt(resumo.conducao)}</span>
                  </div>
                )}
                {resumo.km > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Reembolso KM</span>
                    <span className="font-medium tabular-nums">+ {fmt(resumo.km)}</span>
                  </div>
                )}
                {resumo.comissao > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Comissão</span>
                    <span className="font-medium tabular-nums">+ {fmt(resumo.comissao)}</span>
                  </div>
                )}
                {resumo.desconto > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Descontos</span>
                    <span className="font-medium tabular-nums text-destructive">− {fmt(resumo.desconto)}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center mt-4 rounded-md bg-primary/5 px-3 py-3">
                <span className="font-semibold text-sm">Total Líquido</span>
                <span className="font-semibold text-lg tabular-nums text-primary">{fmt(resumo.totalLiquido)}</span>
              </div>

              {error && (
                <Alert variant="destructive" className="mt-3">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button className="w-full mt-4" size="lg" onClick={handleSubmitClick} disabled={loading || !selectedColaborador}>
                <Send className="h-4 w-4" />
                {loading ? "Enviando..." : "Enviar Pedido"}
              </Button>
            </section>
          )}
        </CardContent>
      </Card>

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
