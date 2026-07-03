"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search } from "lucide-react"
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
        <h3 className="text-base font-semibold mb-1">Todos os colaboradores anexaram suas notas</h3>
        <p className="text-sm text-muted-foreground">Nenhum pedido aprovado aguardando nota fiscal no momento.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div>
        <h3 className="text-sm font-medium mb-4">Filtros</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="snDataInicio" className="text-xs text-muted-foreground">
              Data início
            </Label>
            <Input
              id="snDataInicio"
              type="date"
              value={filtros.dataInicio}
              onChange={(e) => setFiltros({ ...filtros, dataInicio: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="snDataFim" className="text-xs text-muted-foreground">
              Data fim
            </Label>
            <Input
              id="snDataFim"
              type="date"
              value={filtros.dataFim}
              onChange={(e) => setFiltros({ ...filtros, dataFim: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="snNome" className="text-xs text-muted-foreground">
              Colaborador
            </Label>
            <Input
              id="snNome"
              type="text"
              placeholder="Digite o nome..."
              value={filtros.colaboradorNome}
              onChange={(e) => setFiltros({ ...filtros, colaboradorNome: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="snEquipe" className="text-xs text-muted-foreground">
              Equipe
            </Label>
            <Select value={filtros.equipeId} onValueChange={(value) => setFiltros({ ...filtros, equipeId: value })}>
              <SelectTrigger id="snEquipe">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas</SelectItem>
                {equipes.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <Button onClick={handleFiltrar} size="sm">
            <Search className="w-3.5 h-3.5" />
            Filtrar
          </Button>
          <Button variant="ghost" size="sm" onClick={handleLimparFiltros}>
            Limpar
          </Button>
        </div>
      </div>

      {/* Aviso */}
      <div className="border-l-2 border-warning pl-4 py-0.5">
        <p className="text-sm font-medium text-warning">Pedidos aguardando nota fiscal</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Esses pedidos foram aprovados mas o colaborador ainda não anexou a nota fiscal. O pagamento não pode ser
          efetuado sem a nota.
        </p>
      </div>

      {/* Lista */}
      <div>
        <p className="text-sm text-muted-foreground mb-3">
          {pedidos.length} {pedidos.length === 1 ? "pedido" : "pedidos"} aguardando nota
        </p>

        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Colaborador</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead>Sem nota há</TableHead>
                <TableHead className="text-right">Valor NF</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Prazo</TableHead>
                <TableHead>Situação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pedidos.map((pedido) => {
                const salarioBase = pedido.colaborador?.salario || 0
                const valorNF =
                  salarioBase +
                  (pedido.horas_extras || 0) +
                  (pedido.conducao || 0) +
                  (pedido.valor_plantao || 0) -
                  (pedido.valor_desconto || 0)
                const diasDesdeAprovacao = Math.floor(
                  (Date.now() - new Date(pedido.created_at).getTime()) / (1000 * 60 * 60 * 24),
                )
                const temDeadline = pedido.data_limite_anexo_nota
                const deadlineExpirado = temDeadline && new Date(pedido.data_limite_anexo_nota).getTime() < Date.now()

                return (
                  <TableRow key={pedido.id}>
                    <TableCell className="font-medium">{pedido.colaborador?.nome_completo || "Colaborador"}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(pedido.created_at).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {diasDesdeAprovacao} {diasDesdeAprovacao === 1 ? "dia" : "dias"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{formatValue(valorNF)}</TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">
                      {formatValue(pedido.valor_total)}
                    </TableCell>
                    <TableCell className={deadlineExpirado ? "text-destructive font-medium" : "text-muted-foreground"}>
                      {temDeadline ? new Date(pedido.data_limite_anexo_nota).toLocaleDateString("pt-BR") : "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Badge variant="warning" className="font-normal">
                          Sem nota
                        </Badge>
                        {deadlineExpirado && (
                          <Badge variant="destructive" className="font-normal">
                            Prazo expirado
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
