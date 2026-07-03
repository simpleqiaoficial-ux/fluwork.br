"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CalendarDays, TrendingUp, AlertTriangle } from "lucide-react"
import { ReajusteDialog } from "./reajuste-dialog"
import type { Colaborador } from "@/types/colaborador"

interface AniversarioInfo {
  colaborador: Colaborador
  diasRestantes: number
  dataAniversario: Date
  urgencia: "vencido" | "critico" | "atencao" | "normal"
}

interface Props {
  colaboradores: Colaborador[]
  onReajusteAplicado?: () => void
}

const URGENCIA_VARIANT: Record<AniversarioInfo["urgencia"], "destructive" | "warning" | "outline"> = {
  vencido: "destructive",
  critico: "warning",
  atencao: "warning",
  normal: "outline",
}

export function AniversariosContratoDashboard({ colaboradores, onReajusteAplicado }: Props) {
  const [selectedColaborador, setSelectedColaborador] = useState<Colaborador | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const calcularAniversarios = (): AniversarioInfo[] => {
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)

    return colaboradores
      .filter(c => c.data_aniversario_contrato)
      .map(colaborador => {
        // A data armazenada é a data de início do contrato
        // O aniversário é quando completa 1 ano (ou mais anos)
        const dataInicio = new Date(colaborador.data_aniversario_contrato! + "T12:00:00")

        // Calcular o próximo aniversário de contrato
        const proximoAniversario = new Date(dataInicio)
        proximoAniversario.setFullYear(hoje.getFullYear())

        // Se o aniversário deste ano já passou, pega o do ano que vem
        if (proximoAniversario < hoje) {
          proximoAniversario.setFullYear(hoje.getFullYear() + 1)
        }

        // Se o aniversário ainda é este ano mas a data inicial é maior que hoje (contrato novo)
        // pega o do ano que vem
        if (dataInicio > hoje) {
          proximoAniversario.setFullYear(dataInicio.getFullYear() + 1)
        }

        const diffTime = proximoAniversario.getTime() - hoje.getTime()
        const diasRestantes = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

        let urgencia: "vencido" | "critico" | "atencao" | "normal"
        if (diasRestantes <= 0) {
          urgencia = "vencido"
        } else if (diasRestantes <= 30) {
          urgencia = "critico"
        } else if (diasRestantes <= 60) {
          urgencia = "atencao"
        } else if (diasRestantes <= 90) {
          urgencia = "normal"
        } else {
          return null // Mais de 3 meses, não mostrar
        }

        return {
          colaborador,
          diasRestantes,
          dataAniversario: proximoAniversario,
          urgencia
        }
      })
      .filter((item): item is AniversarioInfo => item !== null)
      .sort((a, b) => a.diasRestantes - b.diasRestantes)
  }

  const aniversarios = calcularAniversarios()

  const vencidos = aniversarios.filter(a => a.urgencia === "vencido")
  const criticos = aniversarios.filter(a => a.urgencia === "critico")
  const atencao = aniversarios.filter(a => a.urgencia === "atencao")
  const normais = aniversarios.filter(a => a.urgencia === "normal")
  const semData = colaboradores.filter(c => !c.data_aniversario_contrato)

  const handleAplicarReajuste = (colaborador: Colaborador) => {
    setSelectedColaborador(colaborador)
    setDialogOpen(true)
  }

  const formatarData = (data: Date) => {
    return data.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })
  }

  const formatarSalario = (valor: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor)
  }

  const totalPendentes = aniversarios.length

  if (totalPendentes === 0 && semData.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <p className="text-sm font-medium text-foreground">Tudo em dia</p>
          <p className="text-xs text-muted-foreground mt-1">Nenhum aniversário de contrato nos próximos 3 meses</p>
        </CardContent>
      </Card>
    )
  }

  if (totalPendentes === 0 && semData.length > 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
            Aniversários de Contrato
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <AlertTriangle className="h-4 w-4" />
            <span>{semData.length} colaborador(es) sem data de aniversário cadastrada</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              Aniversários de Contrato
            </CardTitle>
            {totalPendentes > 0 && (
              <Badge variant="secondary" className="font-normal">
                {totalPendentes} pendente{totalPendentes > 1 ? "s" : ""}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Resumo */}
          <div className="flex flex-wrap gap-x-8 gap-y-4 pb-5 border-b">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Vencidos</p>
              <p className="text-xl font-semibold tabular-nums">{vencidos.length}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">{"< 1 mês"}</p>
              <p className="text-xl font-semibold tabular-nums">{criticos.length}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">{"< 2 meses"}</p>
              <p className="text-xl font-semibold tabular-nums">{atencao.length}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">{"< 3 meses"}</p>
              <p className="text-xl font-semibold tabular-nums">{normais.length}</p>
            </div>
          </div>

          {/* Lista de aniversários */}
          <div className="divide-y max-h-[350px] overflow-y-auto pr-1">
            {aniversarios.map((item) => {
              const isVencido = item.urgencia === "vencido"
              const diasText = isVencido
                ? `Vencido há ${Math.abs(item.diasRestantes)} dia${Math.abs(item.diasRestantes) > 1 ? 's' : ''}`
                : `${item.diasRestantes} dias`

              return (
                <div
                  key={item.colaborador.id}
                  className="flex items-center justify-between gap-4 py-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm text-foreground truncate">
                        {item.colaborador.nome_completo}
                      </span>
                      <Badge variant={URGENCIA_VARIANT[item.urgencia]} className="font-normal">
                        {diasText}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatarData(item.dataAniversario)} · {formatarSalario(item.colaborador.salario)}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant={isVencido ? "default" : "outline"}
                    onClick={() => handleAplicarReajuste(item.colaborador)}
                    className="shrink-0"
                  >
                    <TrendingUp className="h-4 w-4 mr-1" />
                    {isVencido ? "Aplicar Reajuste" : "Reajustar"}
                  </Button>
                </div>
              )
            })}
          </div>

          {/* Alerta de colaboradores sem data */}
          {semData.length > 0 && (
            <div className="flex items-center gap-2 pt-1 text-xs text-muted-foreground">
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>{semData.length} colaborador(es) sem data de aniversário cadastrada</span>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedColaborador && (
        <ReajusteDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          colaborador={selectedColaborador}
          onSuccess={() => {
            setDialogOpen(false)
            setSelectedColaborador(null)
            onReajusteAplicado?.()
          }}
        />
      )}
    </>
  )
}
