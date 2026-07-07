"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/ui/status-badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, ChevronRight, Building2 } from "lucide-react"

interface EmpresaRow {
  id: string
  razao_social: string
  nome_fantasia?: string | null
  cnpj: string
  status: string
  created_at?: string | null
}

interface EmpresasListProps {
  empresas: EmpresaRow[]
}

export function EmpresasList({ empresas }: EmpresasListProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Empresas</h1>
          <p className="text-sm text-muted-foreground mt-1">Empresas clientes cadastradas na plataforma</p>
        </div>
        <Link href="/admin/empresas/nova">
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Nova empresa
          </Button>
        </Link>
      </div>

      {empresas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Building2 className="h-8 w-8 text-muted-foreground mb-3" />
          <h3 className="font-semibold text-foreground">Nenhuma empresa cadastrada</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            Crie a primeira empresa cliente e o usuário administrador dela.
          </p>
          <Link href="/admin/empresas/nova">
            <Button variant="outline" size="sm" className="mt-4 gap-2">
              <Plus className="h-4 w-4" />
              Criar primeira empresa
            </Button>
          </Link>
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empresa</TableHead>
                <TableHead className="hidden sm:table-cell">CNPJ</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[60px] text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {empresas.map((empresa) => {
                return (
                  <TableRow key={empresa.id}>
                    <TableCell>
                      <Link href={`/admin/empresas/${empresa.id}`} className="flex flex-col">
                        <span className="font-medium text-foreground hover:underline">
                          {empresa.nome_fantasia || empresa.razao_social}
                        </span>
                        {empresa.nome_fantasia && (
                          <span className="text-xs text-muted-foreground">{empresa.razao_social}</span>
                        )}
                      </Link>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">{empresa.cnpj}</TableCell>
                    <TableCell>
                      <StatusBadge entity="empresa" status={empresa.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/admin/empresas/${empresa.id}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
