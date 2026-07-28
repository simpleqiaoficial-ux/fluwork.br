"use client"

import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ChevronRight, LockKeyhole } from "lucide-react"
import { MODULOS, MODULO_LABELS, type ModulosBloqueados } from "@/lib/modulos"

interface EmpresaComModulos {
  id: string
  nome: string
  razaoSocial: string
  cnpj: string
  modulos: ModulosBloqueados
}

interface ModulosAdminListProps {
  empresas: EmpresaComModulos[]
}

/** Visão geral de todas as empresas com o status de cada um dos 3 módulos — a ação de
 *  bloquear/liberar em si continua só no detalhe da empresa (components/admin/empresa-detail.tsx),
 *  essa tela é o ponto de entrada rápido pra ver o que está bloqueado sem abrir empresa por empresa. */
export function ModulosAdminList({ empresas }: ModulosAdminListProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Módulos</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Status de Financeiro, Contratos e EHS & Compliance por empresa. Clique em uma empresa pra bloquear ou liberar um módulo.
        </p>
      </div>

      {empresas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <LockKeyhole className="h-8 w-8 text-muted-foreground mb-3" />
          <h3 className="font-semibold text-foreground">Nenhuma empresa cadastrada</h3>
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empresa</TableHead>
                {MODULOS.map((modulo) => (
                  <TableHead key={modulo}>{MODULO_LABELS[modulo]}</TableHead>
                ))}
                <TableHead className="w-[60px] text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {empresas.map((empresa) => (
                <TableRow key={empresa.id}>
                  <TableCell>
                    <Link href={`/admin/empresas/${empresa.id}`} className="flex flex-col">
                      <span className="font-medium text-foreground hover:underline">{empresa.nome}</span>
                      {empresa.nome !== empresa.razaoSocial && (
                        <span className="text-xs text-muted-foreground">{empresa.razaoSocial}</span>
                      )}
                    </Link>
                  </TableCell>
                  {MODULOS.map((modulo) => {
                    const bloqueio = empresa.modulos[modulo]
                    return (
                      <TableCell key={modulo}>
                        <Badge variant={bloqueio ? "destructive" : "success"} title={bloqueio?.motivo} className="text-[10px]">
                          {bloqueio ? "Bloqueado" : "Liberado"}
                        </Badge>
                      </TableCell>
                    )
                  })}
                  <TableCell className="text-right">
                    <Link href={`/admin/empresas/${empresa.id}`}>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
