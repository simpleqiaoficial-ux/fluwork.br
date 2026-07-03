"use client"

import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ChevronRight } from "lucide-react"

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
  "Março",
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
  const router = useRouter()

  if (meses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <h3 className="text-base font-semibold mb-1">Nenhuma nota encontrada</h3>
        <p className="text-sm text-muted-foreground">
          As notas fiscais aparecerão aqui organizadas por mês quando forem anexadas.
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
    <div className="space-y-10">
      {anos.map((ano) => (
        <div key={ano}>
          <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">{ano}</h2>

          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mês</TableHead>
                  <TableHead>Notas</TableHead>
                  <TableHead>Pendentes</TableHead>
                  <TableHead>Recebidas</TableHead>
                  <TableHead className="w-8" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {mesePorAno[ano].map((mes) => (
                  <TableRow
                    key={mes.key}
                    className="cursor-pointer"
                    onClick={() => router.push(`/gestao/notas/${mes.key}`)}
                  >
                    <TableCell className="font-medium">
                      {MESES_NOMES[mes.mes - 1]}
                      <span className="text-muted-foreground font-normal ml-1.5">
                        {String(mes.mes).padStart(2, "0")}/{mes.ano}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {mes.total} {mes.total === 1 ? "nota" : "notas"}
                    </TableCell>
                    <TableCell>
                      {mes.pendentes > 0 ? (
                        <Badge variant="warning" className="font-normal">
                          {mes.pendentes}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {mes.recebidas > 0 ? (
                        <Badge variant="success" className="font-normal">
                          {mes.recebidas}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      ))}
    </div>
  )
}
