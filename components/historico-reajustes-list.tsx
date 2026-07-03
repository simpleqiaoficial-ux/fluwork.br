"use client"

import type { HistoricoReajuste } from "@/types/reajuste"
import { Card } from "@/components/ui/card"
import { TrendingUp, Calendar, User, FileText } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface HistoricoReajustesListProps {
  reajustes: HistoricoReajuste[]
}

export function HistoricoReajustesList({ reajustes }: HistoricoReajustesListProps) {
  if (reajustes.length === 0) {
    return (
      <Card className="p-8 text-center">
        <TrendingUp className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">Nenhum reajuste registrado</p>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {reajustes.map((reajuste) => (
        <Card key={reajuste.id} className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="font-semibold">{reajuste.colaborador?.nome_completo}</h3>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {format(new Date(reajuste.created_at), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Novo Salário</p>
              <p className="text-xl font-bold text-green-600">
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(reajuste.salario_novo)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-sm text-muted-foreground">Salário Anterior</p>
              <p className="font-semibold">
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(reajuste.salario_anterior)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Reajuste</p>
              <p className="font-semibold text-green-600">
                {reajuste.tipo_reajuste === "porcentagem"
                  ? `+${reajuste.valor_reajuste}%`
                  : `+${new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(reajuste.valor_reajuste)}`}
              </p>
            </div>
          </div>

          <div className="space-y-2 pt-4 border-t">
            <div className="flex items-start gap-2">
              <FileText className="w-4 h-4 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Motivo</p>
                <p className="text-sm">{reajuste.motivo}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Aplicado por: <span className="text-foreground">{reajuste.aplicador?.nome_completo}</span>
              </p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
