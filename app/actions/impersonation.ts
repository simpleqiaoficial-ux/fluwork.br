"use server"

import { eq } from "drizzle-orm"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { empresas } from "@/lib/db/schema"
import { requireSuperAdmin } from "@/lib/tenant"
import { getSession, updateSession } from "@/lib/session"
import { registrarAuditoria } from "@/lib/audit"

// "Visualizar como empresa" — somente leitura. A identidade real do SuperAdmin nunca muda
// (tipoAcesso continua "SuperAdmin"); só grava viewAsEmpresaId na sessão, que os helpers em
// lib/tenant.ts (getEffectiveEmpresaId/getEffectiveEmpresaIdFromSession) passam a respeitar
// nas consultas de leitura. Mutação continua bloqueada por lib/tenant.ts:assertNaoImpersonando.
export async function iniciarVisualizacaoComoEmpresa(empresaId: string) {
  const usuario = await requireSuperAdmin()

  const [empresa] = await db.select().from(empresas).where(eq(empresas.id, empresaId))
  if (!empresa) {
    return { success: false, error: "Empresa não encontrada" }
  }

  await updateSession({
    viewAsEmpresaId: empresa.id,
    viewAsEmpresaNome: empresa.nomeFantasia || empresa.razaoSocial,
  })

  await registrarAuditoria({
    colaboradorId: usuario.id,
    empresaId: empresa.id,
    acao: "visualizacao_como_empresa_iniciada",
    tabela: "empresas",
    registroId: empresa.id,
  })

  revalidatePath("/", "layout")
  redirect("/")
}

export async function sairDaVisualizacaoComoEmpresa() {
  const session = await getSession()
  const empresaId = session?.viewAsEmpresaId

  await updateSession({ viewAsEmpresaId: null, viewAsEmpresaNome: null })

  if (session?.colaboradorId && empresaId) {
    await registrarAuditoria({
      colaboradorId: session.colaboradorId,
      empresaId,
      acao: "visualizacao_como_empresa_encerrada",
      tabela: "empresas",
      registroId: empresaId,
    })
  }

  revalidatePath("/", "layout")
  redirect("/admin")
}
