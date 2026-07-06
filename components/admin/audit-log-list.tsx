"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ChevronLeft, ChevronRight, ScrollText } from "lucide-react"
import { listarAuditLog } from "@/app/actions/admin-logs"

interface AuditLogRow {
  id: string
  acao: string
  tabela?: string | null
  registro_id?: string | null
  ip_address?: string | null
  created_at: string
  empresa?: { id: string; nome: string } | null
  colaborador?: { id: string; nome_completo: string } | null
}

interface AuditLogListProps {
  registrosIniciais: AuditLogRow[]
  totalInicial: number
  totalPaginasInicial: number
  acoes: string[]
  empresas: Array<{ id: string; nome: string }>
}

function formatarDataHora(data: string): string {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "medium" }).format(new Date(data))
}

export function AuditLogList({ registrosIniciais, totalInicial, totalPaginasInicial, acoes, empresas }: AuditLogListProps) {
  const [registros, setRegistros] = useState(registrosIniciais)
  const [total, setTotal] = useState(totalInicial)
  const [totalPaginas, setTotalPaginas] = useState(totalPaginasInicial)
  const [page, setPage] = useState(1)
  const [empresaId, setEmpresaId] = useState("todas")
  const [acao, setAcao] = useState("todas")
  const [dataInicio, setDataInicio] = useState("")
  const [dataFim, setDataFim] = useState("")
  const [isPending, startTransition] = useTransition()

  const recarregar = (novaPage: number, overrides?: { empresaId?: string; acao?: string; dataInicio?: string; dataFim?: string }) => {
    const filtro = {
      empresaId: (overrides?.empresaId ?? empresaId) === "todas" ? undefined : overrides?.empresaId ?? empresaId,
      acao: (overrides?.acao ?? acao) === "todas" ? undefined : overrides?.acao ?? acao,
      dataInicio: (overrides?.dataInicio ?? dataInicio) || undefined,
      dataFim: (overrides?.dataFim ?? dataFim) || undefined,
      page: novaPage,
    }
    startTransition(async () => {
      const resultado = await listarAuditLog(filtro)
      setRegistros(resultado.registros as any)
      setTotal(resultado.total)
      setTotalPaginas(resultado.total_paginas)
      setPage(novaPage)
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Log de auditoria</h1>
        <p className="text-sm text-muted-foreground mt-1">Ações administrativas realizadas na plataforma</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <Select
          value={empresaId}
          onValueChange={(v) => {
            setEmpresaId(v)
            recarregar(1, { empresaId: v })
          }}
        >
          <SelectTrigger className="w-full sm:w-[220px]">
            <SelectValue placeholder="Empresa" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas as empresas</SelectItem>
            {empresas.map((empresa) => (
              <SelectItem key={empresa.id} value={empresa.id}>
                {empresa.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={acao}
          onValueChange={(v) => {
            setAcao(v)
            recarregar(1, { acao: v })
          }}
        >
          <SelectTrigger className="w-full sm:w-[220px]">
            <SelectValue placeholder="Ação" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas as ações</SelectItem>
            {acoes.map((item) => (
              <SelectItem key={item} value={item}>
                {item}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          type="date"
          value={dataInicio}
          onChange={(e) => {
            setDataInicio(e.target.value)
            recarregar(1, { dataInicio: e.target.value })
          }}
          className="w-full sm:w-[160px]"
        />
        <Input
          type="date"
          value={dataFim}
          onChange={(e) => {
            setDataFim(e.target.value)
            recarregar(1, { dataFim: e.target.value })
          }}
          className="w-full sm:w-[160px]"
        />
      </div>

      <p className="text-sm text-muted-foreground">{total} registro{total !== 1 ? "s" : ""}</p>

      {registros.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <ScrollText className="h-8 w-8 text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">Nenhum registro de auditoria encontrado com estes filtros.</p>
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data/hora</TableHead>
                <TableHead>Ator</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>Ação</TableHead>
                <TableHead className="hidden md:table-cell">Registro</TableHead>
                <TableHead className="hidden lg:table-cell">IP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {registros.map((registro) => (
                <TableRow key={registro.id}>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    {formatarDataHora(registro.created_at)}
                  </TableCell>
                  <TableCell className="text-sm">{registro.colaborador?.nome_completo || "—"}</TableCell>
                  <TableCell className="text-sm">{registro.empresa?.nome || "—"}</TableCell>
                  <TableCell className="text-sm font-medium">{registro.acao}</TableCell>
                  <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                    {registro.tabela ? `${registro.tabela}${registro.registro_id ? ` · ${registro.registro_id.slice(0, 8)}` : ""}` : "—"}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">{registro.ip_address || "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {totalPaginas > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-muted-foreground">
            Página {page} de {totalPaginas}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 1 || isPending} onClick={() => recarregar(page - 1)}>
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>
            <Button variant="outline" size="sm" disabled={page === totalPaginas || isPending} onClick={() => recarregar(page + 1)}>
              Próxima
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
