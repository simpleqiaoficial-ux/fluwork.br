import { getUsuarioLogado } from "@/lib/auth-utils"
import { redirect } from "next/navigation"
import { listarPedidosAdmin } from "@/app/actions/admin-dados"
import { listarEmpresas } from "@/app/actions/empresas"
import { PedidosAdminList } from "@/components/admin/pedidos-admin-list"

export default async function AdminPedidosPage() {
  const usuario = await getUsuarioLogado()

  if (!usuario) redirect("/login")
  if (usuario.tipo_acesso !== "SuperAdmin") redirect("/")

  const [resultado, empresasList] = await Promise.all([listarPedidosAdmin({}), listarEmpresas()])

  return (
    <div className="container mx-auto px-4 lg:px-6 py-8 max-w-5xl">
      <PedidosAdminList
        registrosIniciais={resultado.registros as any}
        totalInicial={resultado.total}
        totalPaginasInicial={resultado.total_paginas}
        empresas={empresasList.map((e: any) => ({ id: e.id, nome: e.nome_fantasia || e.razao_social }))}
      />
    </div>
  )
}
