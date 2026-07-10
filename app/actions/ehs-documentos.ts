"use server"

import crypto from "crypto"
import { revalidatePath } from "next/cache"
import { and, desc, eq, ne } from "drizzle-orm"
import { db } from "@/lib/db"
import { ehsDocumentos, ehsTiposDocumento, colaboradores } from "@/lib/db/schema"
import { getTenantScope, assertNaoImpersonando } from "@/lib/tenant"
import { exigirPermissaoEhs } from "@/lib/ehs/permissions"
import { registrarAuditoriaEhs } from "@/lib/ehs/auditoria"
import { registrarTimelineEhs } from "@/lib/ehs/timeline"
import { toDocumentoEhsDTO, toTipoDocumentoEhsDTO } from "@/lib/db/mappers"
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

export async function listarTiposDocumentoEhs() {
  const scope = await getTenantScope()
  await exigirPermissaoEhs(scope.usuario.tipo_acesso, "documento", "visualizar")

  const tipos = await db
    .select()
    .from(ehsTiposDocumento)
    .where(eq(ehsTiposDocumento.ativo, true))
    .orderBy(ehsTiposDocumento.categoria, ehsTiposDocumento.nome)

  return tipos.map(toTipoDocumentoEhsDTO)
}

/** Documentos de um prestador, agrupados por tipo — versão atual (a linha com status
 *  diferente de "substituido") mais o histórico completo de versões anteriores. */
export async function listarDocumentosPrestadorEhs(colaboradorId: string) {
  const scope = await getTenantScope()
  await exigirPermissaoEhs(scope.usuario.tipo_acesso, "documento", "visualizar")

  const [colaborador] = await db.select({ id: colaboradores.id, empresaId: colaboradores.empresaId }).from(colaboradores).where(eq(colaboradores.id, colaboradorId))
  if (!colaborador) throw new Error("Prestador não encontrado")
  if (!scope.isSuperAdmin && colaborador.empresaId !== scope.empresaId) throw new Error("Sem permissão para acessar este prestador")

  const [tipos, documentos] = await Promise.all([
    db.select().from(ehsTiposDocumento).where(eq(ehsTiposDocumento.ativo, true)).orderBy(ehsTiposDocumento.categoria, ehsTiposDocumento.nome),
    db.query.ehsDocumentos.findMany({
      where: eq(ehsDocumentos.colaboradorId, colaboradorId),
      orderBy: [desc(ehsDocumentos.versao)],
      with: { responsavelColaborador: true },
    }),
  ])

  const documentosDTO = documentos.map(toDocumentoEhsDTO)

  return tipos.map((tipo) => {
    const versoesDoTipo = documentosDTO.filter((d) => d.tipo_documento_id === tipo.id)
    const atual = versoesDoTipo.find((d) => d.status !== "substituido") || versoesDoTipo[0] || null
    const historico = versoesDoTipo.filter((d) => d.id !== atual?.id)
    return { tipo: toTipoDocumentoEhsDTO(tipo), atual, historico }
  })
}

interface UploadDocumentoResult {
  success: boolean
  error?: string
}

export async function uploadDocumentoEhs(formData: FormData): Promise<UploadDocumentoResult> {
  try {
    const scope = await getTenantScope()
    await exigirPermissaoEhs(scope.usuario.tipo_acesso, "documento", "criar")
    await assertNaoImpersonando()

    const colaboradorId = String(formData.get("colaborador_id") || "")
    const tipoDocumentoId = String(formData.get("tipo_documento_id") || "")
    const dataEmissao = (formData.get("data_emissao") as string) || null
    const dataValidade = (formData.get("data_validade") as string) || null
    const observacoes = (formData.get("observacoes") as string) || null
    const file = formData.get("file") as File | null

    if (!colaboradorId || !tipoDocumentoId) return { success: false, error: "Selecione o prestador e o tipo de documento" }
    if (!file) return { success: false, error: "Selecione um arquivo" }

    const [colaborador] = await db.select({ id: colaboradores.id, empresaId: colaboradores.empresaId }).from(colaboradores).where(eq(colaboradores.id, colaboradorId))
    if (!colaborador) return { success: false, error: "Prestador não encontrado" }
    if (!colaborador.empresaId) return { success: false, error: "Prestador sem empresa vinculada" }
    if (!scope.isSuperAdmin && colaborador.empresaId !== scope.empresaId) return { success: false, error: "Sem permissão para este prestador" }

    const fileNameLower = file.name.toLowerCase()
    const temExtensaoValida = [".pdf", ".jpg", ".jpeg", ".png"].some((ext) => fileNameLower.endsWith(ext))
    if (!TIPOS_ARQUIVO_PERMITIDOS.includes(file.type) && !temExtensaoValida) {
      return { success: false, error: "Envie um arquivo PDF, JPG ou PNG" }
    }
    if (file.size > TAMANHO_MAXIMO) return { success: false, error: "Arquivo muito grande. Máximo 10MB" }

    const versoesExistentes = await db
      .select({ versao: ehsDocumentos.versao })
      .from(ehsDocumentos)
      .where(and(eq(ehsDocumentos.colaboradorId, colaboradorId), eq(ehsDocumentos.tipoDocumentoId, tipoDocumentoId)))
    const novaVersao = versoesExistentes.reduce((max, v) => Math.max(max, v.versao), 0) + 1

    const buffer = Buffer.from(await file.arrayBuffer())
    const hashSha256 = crypto.createHash("sha256").update(buffer).digest("hex")
    const contentType = file.type || (fileNameLower.endsWith(".png") ? "image/png" : fileNameLower.endsWith(".jpg") || fileNameLower.endsWith(".jpeg") ? "image/jpeg" : "application/pdf")
    const objectPath = await uploadFile(
      buffer,
      `ehs-documentos/${colaboradorId}/${tipoDocumentoId}/v${novaVersao}-${Date.now()}-${sanitizarNomeArquivo(file.name)}`,
      contentType,
    )

    const empresaId = colaborador.empresaId

    if (novaVersao > 1) {
      await db
        .update(ehsDocumentos)
        .set({ status: "substituido" })
        .where(and(eq(ehsDocumentos.colaboradorId, colaboradorId), eq(ehsDocumentos.tipoDocumentoId, tipoDocumentoId), ne(ehsDocumentos.status, "substituido")))
    }

    const [novoDocumento] = await db
      .insert(ehsDocumentos)
      .values({
        empresaId,
        colaboradorId,
        tipoDocumentoId,
        versao: novaVersao,
        objectPath,
        hashSha256,
        tamanhoBytes: file.size,
        dataEmissao,
        dataValidade,
        status: "valido",
        observacoes,
        responsavelId: scope.usuario.id,
      })
      .returning()

    const [tipoDocumento] = await db.select({ nome: ehsTiposDocumento.nome }).from(ehsTiposDocumento).where(eq(ehsTiposDocumento.id, tipoDocumentoId))

    await registrarAuditoriaEhs({
      empresaId,
      tabela: "ehs_documentos",
      registroId: novoDocumento.id,
      acao: "criado",
      atorId: scope.usuario.id,
      campo: "documento",
      valorNovo: `${tipoDocumento?.nome || "Documento"} · versão ${novaVersao}`,
    })
    await registrarTimelineEhs({
      empresaId,
      colaboradorId,
      tipoEvento: "documento_enviado",
      descricao: `${tipoDocumento?.nome || "Documento"} enviado (versão ${novaVersao})`,
      atorId: scope.usuario.id,
    })

    revalidatePath(`/ehs/prestadores/${colaboradorId}`)
    return { success: true }
  } catch (error) {
    console.error("[ehs] Erro no upload de documento:", error)
    return { success: false, error: error instanceof Error ? error.message : "Erro ao enviar documento" }
  }
}

export async function rejeitarDocumentoEhs(documentoId: string, motivo: string) {
  const scope = await getTenantScope()
  await exigirPermissaoEhs(scope.usuario.tipo_acesso, "documento", "rejeitar")
  await assertNaoImpersonando()

  const documento = await db.query.ehsDocumentos.findFirst({ where: eq(ehsDocumentos.id, documentoId), with: { tipoDocumento: true } })
  if (!documento) return { success: false, error: "Documento não encontrado" }
  if (!scope.isSuperAdmin && documento.empresaId !== scope.empresaId) return { success: false, error: "Sem permissão para este documento" }

  await db
    .update(ehsDocumentos)
    .set({ status: "rejeitado", observacoes: motivo ? `${documento.observacoes ? documento.observacoes + " · " : ""}Rejeitado: ${motivo}` : documento.observacoes })
    .where(eq(ehsDocumentos.id, documentoId))

  await registrarAuditoriaEhs({
    empresaId: documento.empresaId,
    tabela: "ehs_documentos",
    registroId: documento.id,
    acao: "atualizado",
    atorId: scope.usuario.id,
    campo: "status",
    valorAntigo: documento.status,
    valorNovo: "rejeitado",
  })
  await registrarTimelineEhs({
    empresaId: documento.empresaId,
    colaboradorId: documento.colaboradorId,
    tipoEvento: "documento_rejeitado",
    descricao: `${documento.tipoDocumento?.nome || "Documento"} (versão ${documento.versao}) rejeitado${motivo ? `: ${motivo}` : ""}`,
    atorId: scope.usuario.id,
  })

  revalidatePath(`/ehs/prestadores/${documento.colaboradorId}`)
  return { success: true }
}
