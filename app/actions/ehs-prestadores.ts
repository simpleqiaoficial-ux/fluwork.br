"use server"

import { and, eq, ne } from "drizzle-orm"
import { db } from "@/lib/db"
import { colaboradores, ehsDocumentos } from "@/lib/db/schema"
import { getTenantScope } from "@/lib/tenant"
import { exigirPermissaoEhs } from "@/lib/ehs/permissions"
import { calcularComplianceDocumentos } from "@/lib/ehs/compliance"
import { toColaboradorDTO } from "@/lib/db/mappers"

/** "Prestador" no módulo EHS é o mesmo colaborador operacional já cadastrado no resto do
 *  FluWork — não existe uma tabela separada. Isolar por tipoAcesso = "Colaborador" mantém
 *  fora da lista qualquer papel administrativo/financeiro. */
export async function listarPrestadoresEhs() {
  const scope = await getTenantScope()
  await exigirPermissaoEhs(scope.usuario.tipo_acesso, "prestador", "visualizar")

  const where = scope.isSuperAdmin
    ? eq(colaboradores.tipoAcesso, "Colaborador")
    : and(eq(colaboradores.tipoAcesso, "Colaborador"), eq(colaboradores.empresaId, scope.empresaId!))

  const [prestadores, documentos] = await Promise.all([
    db.select({ id: colaboradores.id, nomeCompleto: colaboradores.nomeCompleto, email: colaboradores.email, fotoUrl: colaboradores.fotoUrl }).from(colaboradores).where(where),
    db
      .select({ colaboradorId: ehsDocumentos.colaboradorId, status: ehsDocumentos.status, dataValidade: ehsDocumentos.dataValidade })
      .from(ehsDocumentos)
      .where(ne(ehsDocumentos.status, "substituido")),
  ])

  const documentosPorColaborador = new Map<string, { status: string; dataValidade: string | null }[]>()
  for (const documento of documentos) {
    const lista = documentosPorColaborador.get(documento.colaboradorId) || []
    lista.push({ status: documento.status, dataValidade: documento.dataValidade })
    documentosPorColaborador.set(documento.colaboradorId, lista)
  }

  return prestadores.map((prestador) => ({
    id: prestador.id,
    nome_completo: prestador.nomeCompleto,
    email: prestador.email,
    foto_url: prestador.fotoUrl,
    compliance: calcularComplianceDocumentos(documentosPorColaborador.get(prestador.id) || []),
  }))
}

export async function buscarPrestadorEhsPorId(id: string) {
  const scope = await getTenantScope()
  await exigirPermissaoEhs(scope.usuario.tipo_acesso, "prestador", "visualizar")

  const [colaborador] = await db.select().from(colaboradores).where(eq(colaboradores.id, id))
  if (!colaborador) return null
  if (!scope.isSuperAdmin && colaborador.empresaId !== scope.empresaId) throw new Error("Sem permissão para acessar este prestador")

  const documentosAtivos = await db
    .select({ status: ehsDocumentos.status, dataValidade: ehsDocumentos.dataValidade })
    .from(ehsDocumentos)
    .where(and(eq(ehsDocumentos.colaboradorId, id), ne(ehsDocumentos.status, "substituido")))

  // Nunca deixa o hash de senha chegar ao componente de cliente — o DTO genérico de
  // colaborador inclui esse campo pra usos internos, mas aqui o objeto vira prop de UI.
  const { senha_hash, ...prestador } = toColaboradorDTO(colaborador)

  return {
    ...prestador,
    compliance: calcularComplianceDocumentos(documentosAtivos.map((d) => ({ status: d.status, dataValidade: d.dataValidade }))),
  }
}
