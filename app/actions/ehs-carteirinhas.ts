"use server"

import { revalidatePath } from "next/cache"
import { desc, eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { ehsCarteirinhas, ehsClientes, colaboradores } from "@/lib/db/schema"
import { getTenantScope, assertNaoImpersonando } from "@/lib/tenant"
import { exigirPermissaoEhs } from "@/lib/ehs/permissions"
import { registrarAuditoriaEhs } from "@/lib/ehs/auditoria"
import { registrarTimelineEhs } from "@/lib/ehs/timeline"
import { toCarteirinhaEhsDTO } from "@/lib/db/mappers"
import { uploadFile } from "@/lib/gcs"

const TIPOS_ARQUIVO_PERMITIDOS = ["application/pdf", "image/jpeg", "image/png"]
const TAMANHO_MAXIMO = 10 * 1024 * 1024 // 10MB

function sanitizarNomeArquivo(nome: string) {
  return nome
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .toLowerCase()
}

export async function listarCarteirinhasClienteEhs(clienteId: string) {
  const scope = await getTenantScope()
  await exigirPermissaoEhs(scope.usuario.tipo_acesso, "carteirinha", "visualizar")

  const carteirinhas = await db.query.ehsCarteirinhas.findMany({
    where: eq(ehsCarteirinhas.clienteId, clienteId),
    orderBy: [desc(ehsCarteirinhas.createdAt)],
    with: { colaborador: true },
  })
  return carteirinhas.map(toCarteirinhaEhsDTO)
}

export async function listarCarteirinhasPrestadorEhs(colaboradorId: string) {
  const scope = await getTenantScope()
  await exigirPermissaoEhs(scope.usuario.tipo_acesso, "carteirinha", "visualizar")

  const carteirinhas = await db.query.ehsCarteirinhas.findMany({
    where: eq(ehsCarteirinhas.colaboradorId, colaboradorId),
    orderBy: [desc(ehsCarteirinhas.createdAt)],
    with: { cliente: true },
  })
  return carteirinhas.map(toCarteirinhaEhsDTO)
}

interface CriarCarteirinhaResult {
  success: boolean
  error?: string
  id?: string
}

export async function criarCarteirinhaEhs(formData: FormData): Promise<CriarCarteirinhaResult> {
  try {
    const scope = await getTenantScope()
    await exigirPermissaoEhs(scope.usuario.tipo_acesso, "carteirinha", "criar")
    await assertNaoImpersonando()

    const clienteId = String(formData.get("cliente_id") || "")
    const colaboradorId = String(formData.get("colaborador_id") || "")
    const titulo = (formData.get("titulo") as string) || null
    const file = formData.get("file") as File | null

    if (!clienteId || !colaboradorId) return { success: false, error: "Selecione o cliente e o prestador" }
    if (!file) return { success: false, error: "Selecione um arquivo" }

    const [cliente] = await db.select({ id: ehsClientes.id, empresaId: ehsClientes.empresaId }).from(ehsClientes).where(eq(ehsClientes.id, clienteId))
    if (!cliente) return { success: false, error: "Cliente não encontrado" }
    if (!scope.isSuperAdmin && cliente.empresaId !== scope.empresaId) return { success: false, error: "Sem permissão para este cliente" }

    const [colaborador] = await db.select({ id: colaboradores.id, empresaId: colaboradores.empresaId }).from(colaboradores).where(eq(colaboradores.id, colaboradorId))
    if (!colaborador) return { success: false, error: "Prestador não encontrado" }
    if (!colaborador.empresaId || (!scope.isSuperAdmin && colaborador.empresaId !== scope.empresaId)) return { success: false, error: "Sem permissão para este prestador" }

    const fileNameLower = file.name.toLowerCase()
    const temExtensaoValida = [".pdf", ".jpg", ".jpeg", ".png"].some((ext) => fileNameLower.endsWith(ext))
    if (!TIPOS_ARQUIVO_PERMITIDOS.includes(file.type) && !temExtensaoValida) {
      return { success: false, error: "Envie um arquivo PDF, JPG ou PNG" }
    }
    if (file.size > TAMANHO_MAXIMO) return { success: false, error: "Arquivo muito grande. Máximo 10MB" }

    const buffer = Buffer.from(await file.arrayBuffer())
    const contentType = file.type || (fileNameLower.endsWith(".png") ? "image/png" : fileNameLower.endsWith(".jpg") || fileNameLower.endsWith(".jpeg") ? "image/jpeg" : "application/pdf")
    const objectPath = await uploadFile(buffer, `ehs-carteirinhas/${clienteId}/${colaboradorId}/${Date.now()}-${sanitizarNomeArquivo(file.name)}`, contentType)

    const empresaId = cliente.empresaId

    const [carteirinha] = await db
      .insert(ehsCarteirinhas)
      .values({ empresaId, clienteId, colaboradorId, titulo, objectPath, status: "ativa", criadoPor: scope.usuario.id })
      .returning()

    await registrarAuditoriaEhs({ empresaId, tabela: "ehs_carteirinhas", registroId: carteirinha.id, acao: "criado", atorId: scope.usuario.id })
    await registrarTimelineEhs({
      empresaId,
      colaboradorId,
      tipoEvento: "carteirinha_emitida",
      descricao: `Carteirinha digital emitida${titulo ? ` (${titulo})` : ""}`,
      atorId: scope.usuario.id,
    })

    revalidatePath(`/ehs/clientes/${clienteId}`)
    revalidatePath(`/ehs/prestadores/${colaboradorId}`)
    return { success: true, id: carteirinha.id }
  } catch (error) {
    console.error("[ehs] Erro ao criar carteirinha:", error)
    return { success: false, error: error instanceof Error ? error.message : "Erro ao criar carteirinha" }
  }
}

export async function alternarStatusCarteirinhaEhs(id: string) {
  const scope = await getTenantScope()
  await exigirPermissaoEhs(scope.usuario.tipo_acesso, "carteirinha", "desativar")
  await assertNaoImpersonando()

  const [atual] = await db.select({ empresaId: ehsCarteirinhas.empresaId, status: ehsCarteirinhas.status, clienteId: ehsCarteirinhas.clienteId, colaboradorId: ehsCarteirinhas.colaboradorId }).from(ehsCarteirinhas).where(eq(ehsCarteirinhas.id, id))
  if (!atual) return { success: false, error: "Carteirinha não encontrada" }
  if (!scope.isSuperAdmin && atual.empresaId !== scope.empresaId) return { success: false, error: "Sem permissão para esta carteirinha" }

  const novoStatus = atual.status === "ativa" ? "inativa" : "ativa"
  await db.update(ehsCarteirinhas).set({ status: novoStatus }).where(eq(ehsCarteirinhas.id, id))

  await registrarAuditoriaEhs({
    empresaId: atual.empresaId,
    tabela: "ehs_carteirinhas",
    registroId: id,
    acao: "atualizado",
    atorId: scope.usuario.id,
    campo: "status",
    valorAntigo: atual.status,
    valorNovo: novoStatus,
  })

  revalidatePath(`/ehs/clientes/${atual.clienteId}`)
  revalidatePath(`/ehs/prestadores/${atual.colaboradorId}`)
  return { success: true, status: novoStatus }
}
