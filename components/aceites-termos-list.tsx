"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  listTermsAcceptances,
  getTermsAcceptanceStats,
} from "@/app/actions/terms"
import { CURRENT_TERMS_VERSION, type TermsAcceptanceWithUser } from "@/types/terms"
import { Search, Monitor, Smartphone, FileCheck } from "lucide-react"
import { EmptyState } from "@/components/ui/empty-state"

export function AceitesTermosList() {
  const [acceptances, setAcceptances] = useState<TermsAcceptanceWithUser[]>([])
  const [stats, setStats] = useState({
    totalUsers: 0,
    acceptedCurrentVersion: 0,
    pendingAcceptance: 0,
    declinedCurrentVersion: 0,
  })
  const [search, setSearch] = useState("")
  const [filterAccepted, setFilterAccepted] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(true)

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [acceptancesResult, statsResult] = await Promise.all([
        listTermsAcceptances({
          version: CURRENT_TERMS_VERSION,
          accepted: filterAccepted === "all" ? undefined : filterAccepted === "accepted",
          search: search || undefined,
        }),
        getTermsAcceptanceStats(),
      ])

      setAcceptances(acceptancesResult.data)
      setStats(statsResult)
    } catch (error) {
      console.error("[v0] Error loading terms data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [filterAccepted])

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData()
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-"
    return new Date(dateString).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const parseDeviceInfo = (deviceInfo: string | null) => {
    if (!deviceInfo) return null
    try {
      return JSON.parse(deviceInfo)
    } catch {
      return null
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Aceites de Termos de Uso</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gerencie e acompanhe os aceites dos termos de uso pelos colaboradores
        </p>
      </div>

      {/* Indicadores */}
      <div className="flex flex-wrap gap-x-10 gap-y-5 pb-6 border-b">
        <div>
          <p className="text-xs text-muted-foreground mb-1.5">Total de usuários</p>
          <p className="text-2xl font-semibold tabular-nums">{stats.totalUsers}</p>
          <p className="text-xs text-muted-foreground mt-1">Usuários ativos no sistema</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1.5">Termos aceitos</p>
          <p className="text-2xl font-semibold tabular-nums text-success">{stats.acceptedCurrentVersion}</p>
          <p className="text-xs text-muted-foreground mt-1">Versão {CURRENT_TERMS_VERSION}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1.5">Pendentes</p>
          <p className="text-2xl font-semibold tabular-nums text-warning">{stats.pendingAcceptance}</p>
          <p className="text-xs text-muted-foreground mt-1">Ainda não aceitaram</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1.5">Recusados</p>
          <p className="text-2xl font-semibold tabular-nums text-destructive">{stats.declinedCurrentVersion}</p>
          <p className="text-xs text-muted-foreground mt-1">Recusaram os termos</p>
        </div>
      </div>

      {/* Historico */}
      <div>
        <div className="mb-4">
          <h2 className="text-sm font-medium text-foreground">Histórico de aceites</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Lista detalhada de todos os aceites e recusas registrados
          </p>
        </div>

        <div className="mb-4 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filterAccepted} onValueChange={setFilterAccepted}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="accepted">Aceitos</SelectItem>
              <SelectItem value="declined">Recusados</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-sm text-muted-foreground">Carregando...</p>
          </div>
        ) : acceptances.length === 0 ? (
          <EmptyState
            icon={FileCheck}
            title="Nenhum registro encontrado"
            description="Ajuste os filtros de busca para encontrar aceites de termos."
          />
        ) : (
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Prestador</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Versão</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Dispositivo</TableHead>
                  <TableHead>IP</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {acceptances.map((acceptance) => {
                  const deviceInfo = parseDeviceInfo(acceptance.device_info)
                  return (
                    <TableRow key={acceptance.id}>
                      <TableCell>
                        <div className="font-medium">
                          {acceptance.colaborador?.nome_completo || "Usuário desconhecido"}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {acceptance.colaborador?.email || "-"}
                        </div>
                      </TableCell>
                      <TableCell>
                        {acceptance.accepted ? (
                          <Badge variant="success">Aceito</Badge>
                        ) : (
                          <Badge variant="destructive">Recusado</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{acceptance.version}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDate(acceptance.accepted_at || acceptance.created_at)}
                      </TableCell>
                      <TableCell>
                        {deviceInfo ? (
                          <div className="flex items-center gap-2 text-sm">
                            {deviceInfo.type === "mobile" ? (
                              <Smartphone className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Monitor className="h-4 w-4 text-muted-foreground" />
                            )}
                            {deviceInfo.os}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-sm text-muted-foreground">
                          {acceptance.ip_address || "-"}
                        </span>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  )
}
