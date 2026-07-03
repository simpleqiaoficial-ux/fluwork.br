"use client"

import { useState } from "react"
import type { HistoricoReajuste } from "@/types/reajuste"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ChevronDown, ChevronUp } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface HistoricoReajustesListProps {
  reajustes: HistoricoReajuste[]
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)
}

export function HistoricoReajustesList({ reajustes }: HistoricoReajustesListProps) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null)

  if (reajustes.length === 0) {
    return (
      <div className="flex items-center justify-center py-16 text-center">
        <p className="text-muted-foreground text-sm">Nenhum reajuste registrado</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Colaborador</TableHead>
            <TableHead>Data</TableHead>
            <TableHead className="text-right">Salário anterior</TableHead>
            <TableHead className="text-right">Reajuste</TableHead>
            <TableHead className="text-right">Novo salário</TableHead>
            <TableHead className="w-8" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {reajustes.map((reajuste) => {
            const isExpanded = expandedRow === reajuste.id

            return (
              <>
                <TableRow
                  key={reajuste.id}
                  className="cursor-pointer"
                  onClick={() => setExpandedRow(isExpanded ? null : reajuste.id)}
                >
                  <TableCell className="font-medium">{reajuste.colaborador?.nome_completo}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(reajuste.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatMoney(reajuste.salario_anterior)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-success font-medium">
                    {reajuste.tipo_reajuste === "porcentagem"
                      ? `+${reajuste.valor_reajuste}%`
                      : `+${formatMoney(reajuste.valor_reajuste)}`}
                  </TableCell>
                  <TableCell className="text-right font-semibold tabular-nums">
                    {formatMoney(reajuste.salario_novo)}
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
                  <TableRow key={`${reajuste.id}-detail`}>
                    <TableCell colSpan={6} className="bg-muted/20 px-6 py-5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Motivo</p>
                          <p>{reajuste.motivo}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Aplicado por</p>
                          <p className="font-medium">{reajuste.aplicador?.nome_completo}</p>
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
