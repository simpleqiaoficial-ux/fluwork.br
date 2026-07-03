"use client"

import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Folder, ChevronRight, FileText, Clock, CheckCircle } from "lucide-react"

interface MesData {
  key: string
  ano: number
  mes: number
  total: number
  pendentes: number
  recebidas: number
}

interface NotasMesesListProps {
  meses: MesData[]
}

const MESES_NOMES = [
  "Janeiro",
  "Fevereiro",
  "Marco",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
]

export function NotasMesesList({ meses }: NotasMesesListProps) {
  if (meses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="rounded-full bg-muted p-6 mb-4">
          <Folder className="w-12 h-12 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Nenhuma nota encontrada</h3>
        <p className="text-muted-foreground">
          As notas fiscais aparecero aqui organizadas por mes quando forem anexadas.
        </p>
      </div>
    )
  }

  // Agrupa por ano
  const mesePorAno = meses.reduce(
    (acc, mes) => {
      if (!acc[mes.ano]) {
        acc[mes.ano] = []
      }
      acc[mes.ano].push(mes)
      return acc
    },
    {} as Record<number, MesData[]>
  )

  const anos = Object.keys(mesePorAno)
    .map(Number)
    .sort((a, b) => b - a)

  return (
    <div className="space-y-8">
      {anos.map((ano) => (
        <div key={ano}>
          <h2 className="text-lg font-semibold mb-4 text-foreground flex items-center gap-2">
            <span className="bg-foreground text-background px-3 py-1 rounded text-sm">{ano}</span>
          </h2>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {mesePorAno[ano].map((mes) => (
              <Link key={mes.key} href={`/gestao/notas/${mes.key}`} className="group">
                <Card className="p-4 transition-all hover:shadow-md hover:border-foreground/20 group-hover:bg-muted/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-amber-50 text-amber-600 border border-amber-200">
                        <Folder className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-medium text-foreground">
                          {MESES_NOMES[mes.mes - 1]}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {String(mes.mes).padStart(2, "0")}/{mes.ano}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </div>

                  <div className="mt-4 flex items-center gap-3 text-xs">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <FileText className="h-3.5 w-3.5" />
                      <span>{mes.total} {mes.total === 1 ? "nota" : "notas"}</span>
                    </div>

                    {mes.pendentes > 0 && (
                      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs px-2 py-0">
                        <Clock className="h-3 w-3 mr-1" />
                        {mes.pendentes} pendente{mes.pendentes > 1 ? "s" : ""}
                      </Badge>
                    )}

                    {mes.recebidas > 0 && (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs px-2 py-0">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        {mes.recebidas}
                      </Badge>
                    )}
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
