"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  FileWarning,
  Search,
  Calendar,
  DollarSign,
  User,
  AlertTriangle,
  Clock,
} from "lucide-react"
import type { PedidoPagamento } from "@/types/pedido"
import type { Equipe } from "@/types/equipe"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { listarEquipes } from "@/app/actions/equipes"
import { useMaskedCurrency } from "@/components/currency-display"

interface PedidosSemNotaListProps {
  pedidos: PedidoPagamento[]
}

export function PedidosSemNotaList({ pedidos }: PedidosSemNotaListProps) {
  const router = useRouter()
  const { formatValue } = useMaskedCurrency()
  const [equipes, setEquipes] = useState<Equipe[]>([])
  const [filtros, setFiltros] = useState({
    dataInicio: "",
    dataFim: "",
    colaboradorNome: "",
    equipeId: "todas",
  })

  useEffect(() => {
    listarEquipes().then(setEquipes).catch(console.error)
  }, [])

  const handleFiltrar = () => {
    const params = new URLSearchParams()
    params.set("tab", "sem-nota")
    if (filtros.dataInicio) params.set("dataInicio", filtros.dataInicio)
    if (filtros.dataFim) params.set("dataFim", filtros.dataFim)
    if (filtros.colaboradorNome) params.set("colaboradorNome", filtros.colaboradorNome)
    if (filtros.equipeId && filtros.equipeId !== "todas") params.set("equipeId", filtros.equipeId)
    router.push(`/financeiro?${params.toString()}`)
  }

  const handleLimparFiltros = () => {
    setFiltros({ dataInicio: "", dataFim: "", colaboradorNome: "", equipeId: "todas" })
    router.push("/financeiro?tab=sem-nota")
  }

  if (pedidos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="rounded-full bg-green-100 p-6 mb-4">
          <FileWarning className="w-12 h-12 text-green-600" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Todos os colaboradores anexaram suas notas</h3>
        <p className="text-muted-foreground">Nenhum pedido aprovado aguardando nota fiscal no momento.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card className="p-4">
        <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
          <Search className="w-4 h-4" />
          Filtros
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="snDataInicio" className="text-sm">Data Inicio</Label>
            <Input id="snDataInicio" type="date" value={filtros.dataInicio} onChange={(e) => setFiltros({ ...filtros, dataInicio: e.target.value })} className="h-9" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="snDataFim" className="text-sm">Data Fim</Label>
            <Input id="snDataFim" type="date" value={filtros.dataFim} onChange={(e) => setFiltros({ ...filtros, dataFim: e.target.value })} className="h-9" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="snNome" className="text-sm">Colaborador</Label>
            <Input id="snNome" type="text" placeholder="Digite o nome..." value={filtros.colaboradorNome} onChange={(e) => setFiltros({ ...filtros, colaboradorNome: e.target.value })} className="h-9" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="snEquipe" className="text-sm">Equipe</Label>
            <Select value={filtros.equipeId} onValueChange={(value) => setFiltros({ ...filtros, equipeId: value })}>
              <SelectTrigger id="snEquipe" className="h-9"><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas</SelectItem>
                {equipes.map((e) => (<SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex gap-2 mt-3">
          <Button onClick={handleFiltrar} size="sm" className="h-9"><Search className="w-3.5 h-3.5 mr-1.5" />Filtrar</Button>
          <Button variant="outline" size="sm" onClick={handleLimparFiltros} className="h-9 bg-transparent">Limpar</Button>
        </div>
      </Card>

      {/* Aviso */}
      <div className="flex items-start gap-3 p-4 rounded-lg border border-amber-200 bg-amber-50">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-amber-900">Pedidos aguardando nota fiscal</p>
          <p className="text-xs text-amber-700 mt-1">Esses pedidos foram aprovados mas o colaborador ainda nao anexou a nota fiscal. O pagamento nao pode ser efetuado sem a nota.</p>
        </div>
      </div>

      {/* Lista */}
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground px-1">{pedidos.length} {pedidos.length === 1 ? "pedido" : "pedidos"} aguardando nota</p>

        {pedidos.map((pedido) => {
          const salarioBase = pedido.colaborador?.salario || 0
          const valorNF = salarioBase + (pedido.horas_extras || 0) + (pedido.conducao || 0) + (pedido.valor_plantao || 0) - (pedido.valor_desconto || 0)
          const diasDesdeAprovacao = Math.floor((Date.now() - new Date(pedido.created_at).getTime()) / (1000 * 60 * 60 * 24))
          const temDeadline = pedido.data_limite_anexo_nota
          const deadlineExpirado = temDeadline && new Date(pedido.data_limite_anexo_nota).getTime() < Date.now()

          return (
            <Card key={pedido.id} className={`p-4 ${deadlineExpirado ? "border-red-300 bg-red-50/50" : ""}`}>
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <User className="w-4 h-4 text-muted-foreground shrink-0" />
                    <h3 className="font-semibold truncate">{pedido.colaborador?.nome_completo || "Colaborador"}</h3>
                    <Badge variant="outline" className="text-xs bg-amber-100 text-amber-800 border-amber-300">
                      <FileWarning className="w-3 h-3 mr-1" />
                      Sem Nota
                    </Badge>
                    {deadlineExpirado && (
                      <Badge variant="destructive" className="text-xs bg-red-600">
                        <Clock className="w-3 h-3 mr-1" />
                        Prazo Expirado
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1.5 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Criado {new Date(pedido.created_at).toLocaleDateString("pt-BR")}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {diasDesdeAprovacao} {diasDesdeAprovacao === 1 ? "dia" : "dias"} sem nota
                    </span>
                    <span className="flex items-center gap-1 font-semibold text-foreground">
                      <DollarSign className="w-3 h-3" />
                      Valor NF: {formatValue(valorNF)}
                    </span>
                    <span className="flex items-center gap-1">
                      Total: {formatValue(pedido.valor_total)}
                    </span>
                    {temDeadline && (
                      <span className={`flex items-center gap-1 ${deadlineExpirado ? "text-red-600 font-medium" : ""}`}>
                        Prazo: {new Date(pedido.data_limite_anexo_nota).toLocaleDateString("pt-BR")}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
