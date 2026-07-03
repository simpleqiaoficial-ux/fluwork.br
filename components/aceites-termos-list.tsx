"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Search, FileCheck, FileX, Users, Clock, Monitor, Smartphone } from "lucide-react"

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
        <h1 className="text-2xl font-bold">Aceites de Termos de Uso</h1>
        <p className="text-muted-foreground">
          Gerencie e acompanhe os aceites dos termos de uso pelos colaboradores
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Usuarios</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">Usuarios ativos no sistema</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Termos Aceitos</CardTitle>
            <FileCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.acceptedCurrentVersion}</div>
            <p className="text-xs text-muted-foreground">Versao {CURRENT_TERMS_VERSION}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{stats.pendingAcceptance}</div>
            <p className="text-xs text-muted-foreground">Ainda nao aceitaram</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recusados</CardTitle>
            <FileX className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.declinedCurrentVersion}</div>
            <p className="text-xs text-muted-foreground">Recusaram os termos</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Historico de Aceites</CardTitle>
          <CardDescription>
            Lista detalhada de todos os aceites e recusas registrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
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
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">Carregando...</div>
            </div>
          ) : acceptances.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <FileCheck className="mb-2 h-12 w-12 text-muted-foreground/50" />
              <p className="text-muted-foreground">Nenhum registro encontrado</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Colaborador</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Versao</TableHead>
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
                          <div>
                            <div className="font-medium">
                              {acceptance.colaborador?.nome_completo || "Usuario desconhecido"}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {acceptance.colaborador?.email || "-"}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {acceptance.accepted ? (
                            <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                              Aceito
                            </Badge>
                          ) : (
                            <Badge variant="destructive">Recusado</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{acceptance.version}</Badge>
                        </TableCell>
                        <TableCell>{formatDate(acceptance.accepted_at || acceptance.created_at)}</TableCell>
                        <TableCell>
                          {deviceInfo ? (
                            <div className="flex items-center gap-2">
                              {deviceInfo.type === "mobile" ? (
                                <Smartphone className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <Monitor className="h-4 w-4 text-muted-foreground" />
                              )}
                              <span className="text-sm">{deviceInfo.os}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-sm">
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
        </CardContent>
      </Card>
    </div>
  )
}
