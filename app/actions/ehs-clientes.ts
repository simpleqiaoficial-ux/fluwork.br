"use server"

import { count, desc, eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { colaboradores, ehsClienteResponsaveis, ehsClientes, ehsIntegracoes } from "@/lib/db/schema"
import { assertNaoImpersonando, getTenantScope } from "@/lib/tenant"
import { exigirPermissaoEhs } from "@/lib/ehs/permissions"
import { registrarAuditoriaEhs, registrarDiffAuditoriaEhs } from "@/lib/ehs/auditoria"
import { toClienteEhsDTO } from "@/lib/db/mappers"
import { situacaoExibicaoIntegracao } from "@/lib/ehs/integracoes"

export interface ClienteEhsResponsavelInput {
  nome: string
  cargo?: string | null
  telefone?: string | null
  email?: string | null
}

export interface ClienteEhsInput {
  nome: string
  razao_social?: string | null
  cnpj?: string | null
  endereco_cep?: string | null
  endereco_logradouro?: string | null
  endereco_numero?: string | null
  endereco_complemento?: string | null
  endereco_bairro?: string | null
  endereco_cidade?: string | null
  endereco_uf?: string | null
  observacoes?: string | null
  responsaveis?: ClienteEhsResponsavelInput[]
}

export async function listarClientesEhs() {
  const scope = await getTenantScope()
  await exigirPermissaoEhs(scope.usuario.tipo_acesso, "cliente", "visualizar")

  const escopo = scope.empresaId === null ? undefined : eq(ehsClientes.empresaId, scope.empresaId)
  const rows = await db.query.ehsClientes.findMany({
    where: escopo,
    orderBy: [desc(ehsClientes.createdAt)],
  })

  // Prestadores vinculados por cliente — via integrações agendadas/concluídas.
  return Promise.all(
    rows.map(async (cliente) => {
      const vinculos = await db
        .selectDistinct({ colaboradorId: ehsIntegracoes.colaboradorId })
        .from(ehsIntegracoes)
        .where(eq(ehsIntegracoes.clienteId, cliente.id))
      return { ...toClienteEhsDTO(cliente), prestadores_vinculados: vinculos.length }
    }),
  )
}

export async function buscarClienteEhsPorId(id: string) {
  const scope = await getTenantScope()
  await exigirPermissaoEhs(scope.usuario.tipo_acesso, "cliente", "visualizar")

  const cliente = await db.query.ehsClientes.findFirst({
    where: eq(ehsClientes.id, id),
    with: { responsaveis: true },
  })
  if (!cliente) return null
  if (scope.empresaId !== null && cliente.empresaId !== scope.empresaId) {
    throw new Error("Sem permissão para acessar este cliente")
  }

  const integracoesRows = await db.query.ehsIntegracoes.findMany({
    where: eq(ehsIntegracoes.clienteId, id),
    with: { colaborador: true },
    orderBy: [desc(ehsIntegracoes.createdAt)],
  })

  const prestadoresMap = new Map<string, { id: string; nome_completo: string; foto_url: string | null; status: string }>()
  for (const integ of integracoesRows) {
    if (!integ.colaborador || prestadoresMap.has(integ.colaboradorId)) continue
    prestadoresMap.set(integ.colaboradorId, {
      id: integ.colaborador.id,
      nome_completo: integ.colaborador.nomeCompleto,
      foto_url: integ.colaborador.fotoUrl,
      status: situacaoExibicaoIntegracao({ status: integ.status, data_validade: integ.dataValidade }),
    })
  }

  return { ...toClienteEhsDTO(cliente), prestadores: Array.from(prestadoresMap.values()) }
}

export async function criarClienteEhs(data: ClienteEhsInput) {
  const scope = await getTenantScope()
  await exigirPermissaoEhs(scope.usuario.tipo_acesso, "cliente", "criar")
  await assertNaoImpersonando()

  if (!data.nome?.trim()) {
    return { success: false, error: "Informe o nome do cliente" }
  }
  if (scope.empresaId === null) {
    return { success: false, error: "Selecione uma empresa antes de cadastrar um cliente" }
  }

  let clienteId: string
  try {
    const [cliente] = await db
      .insert(ehsClientes)
      .values({
        empresaId: scope.empresaId,
        nome: data.nome.trim(),
        razaoSocial: data.razao_social || null,
        cnpj: data.cnpj || null,
        enderecoCep: data.endereco_cep || null,
        enderecoLogradouro: data.endereco_logradouro || null,
        enderecoNumero: data.endereco_numero || null,
        enderecoComplemento: data.endereco_complemento || null,
        enderecoBairro: data.endereco_bairro || null,
        enderecoCidade: data.endereco_cidade || null,
        enderecoUf: data.endereco_uf || null,
        observacoes: data.observacoes || null,
        criadoPor: scope.usuario.id,
      })
      .returning({ id: ehsClientes.id })
    clienteId = cliente.id
  } catch (error) {
    console.error("[ehs] Erro ao criar cliente:", error)
    return { success: false, error: "Erro ao criar cliente" }
  }

  const responsaveisValidos = (data.responsaveis || []).filter((r) => r.nome?.trim())
  if (responsaveisValidos.length > 0) {
    await db.insert(ehsClienteResponsaveis).values(
      responsaveisValidos.map((r) => ({
        clienteId,
        nome: r.nome.trim(),
        cargo: r.cargo || null,
        telefone: r.telefone || null,
        email: r.email || null,
      })),
    )
  }

  await registrarAuditoriaEhs({
    empresaId: scope.empresaId,
    tabela: "ehs_clientes",
    registroId: clienteId,
    acao: "criado",
    atorId: scope.usuario.id,
  })

  revalidatePath("/ehs/clientes")
  return { success: true, id: clienteId }
}

export async function atualizarClienteEhs(id: string, data: ClienteEhsInput) {
  const scope = await getTenantScope()
  await exigirPermissaoEhs(scope.usuario.tipo_acesso, "cliente", "editar")
  await assertNaoImpersonando()

  const [atual] = await db.select().from(ehsClientes).where(eq(ehsClientes.id, id))
  if (!atual) return { success: false, error: "Cliente não encontrado" }
  if (scope.empresaId !== null && atual.empresaId !== scope.empresaId) {
    return { success: false, error: "Sem permissão para editar este cliente" }
  }
  if (!data.nome?.trim()) {
    return { success: false, error: "Informe o nome do cliente" }
  }

  const updateData = {
    nome: data.nome.trim(),
    razaoSocial: data.razao_social || null,
    cnpj: data.cnpj || null,
    enderecoCep: data.endereco_cep || null,
    enderecoLogradouro: data.endereco_logradouro || null,
    enderecoNumero: data.endereco_numero || null,
    enderecoComplemento: data.endereco_complemento || null,
    enderecoBairro: data.endereco_bairro || null,
    enderecoCidade: data.endereco_cidade || null,
    enderecoUf: data.endereco_uf || null,
    observacoes: data.observacoes || null,
    updatedAt: new Date(),
  }

  try {
    await db.update(ehsClientes).set(updateData).where(eq(ehsClientes.id, id))
  } catch (error) {
    console.error("[ehs] Erro ao atualizar cliente:", error)
    return { success: false, error: "Erro ao atualizar cliente" }
  }

  await registrarDiffAuditoriaEhs(
    { empresaId: atual.empresaId, tabela: "ehs_clientes", registroId: id, atorId: scope.usuario.id },
    atual,
    updateData,
  )

  // Responsáveis: substitui a lista inteira — mais simples que diff incremental pra este form.
  if (data.responsaveis !== undefined) {
    await db.delete(ehsClienteResponsaveis).where(eq(ehsClienteResponsaveis.clienteId, id))
    const responsaveisValidos = data.responsaveis.filter((r) => r.nome?.trim())
    if (responsaveisValidos.length > 0) {
      await db.insert(ehsClienteResponsaveis).values(
        responsaveisValidos.map((r) => ({
          clienteId: id,
          nome: r.nome.trim(),
          cargo: r.cargo || null,
          telefone: r.telefone || null,
          email: r.email || null,
        })),
      )
    }
  }

  revalidatePath("/ehs/clientes")
  revalidatePath(`/ehs/clientes/${id}`)
  return { success: true }
}

export async function alternarStatusClienteEhs(id: string) {
  const scope = await getTenantScope()
  await exigirPermissaoEhs(scope.usuario.tipo_acesso, "cliente", "editar")
  await assertNaoImpersonando()

  const [atual] = await db
    .select({ empresaId: ehsClientes.empresaId, status: ehsClientes.status })
    .from(ehsClientes)
    .where(eq(ehsClientes.id, id))
  if (!atual) return { success: false, error: "Cliente não encontrado" }
  if (scope.empresaId !== null && atual.empresaId !== scope.empresaId) {
    return { success: false, error: "Sem permissão para alterar este cliente" }
  }

  const novoStatus = atual.status === "ativo" ? "inativo" : "ativo"
  await db.update(ehsClientes).set({ status: novoStatus, updatedAt: new Date() }).where(eq(ehsClientes.id, id))

  await registrarAuditoriaEhs({
    empresaId: atual.empresaId,
    tabela: "ehs_clientes",
    registroId: id,
    acao: "atualizado",
    atorId: scope.usuario.id,
    campo: "status",
    valorAntigo: atual.status,
    valorNovo: novoStatus,
  })

  revalidatePath("/ehs/clientes")
  revalidatePath(`/ehs/clientes/${id}`)
  return { success: true, status: novoStatus }
}

export async function excluirClienteEhs(id: string) {
  const scope = await getTenantScope()
  await exigirPermissaoEhs(scope.usuario.tipo_acesso, "cliente", "excluir")
  await assertNaoImpersonando()

  const [atual] = await db.select({ empresaId: ehsClientes.empresaId }).from(ehsClientes).where(eq(ehsClientes.id, id))
  if (!atual) return { success: false, error: "Cliente não encontrado" }
  if (scope.empresaId !== null && atual.empresaId !== scope.empresaId) {
    return { success: false, error: "Sem permissão para excluir este cliente" }
  }

  const [{ value: totalIntegracoes }] = await db
    .select({ value: count() })
    .from(ehsIntegracoes)
    .where(eq(ehsIntegracoes.clienteId, id))
  if (totalIntegracoes > 0) {
    return { success: false, error: "Este cliente já tem integrações registradas — desative em vez de excluir." }
  }

  await db.delete(ehsClientes).where(eq(ehsClientes.id, id))

  await registrarAuditoriaEhs({
    empresaId: atual.empresaId,
    tabela: "ehs_clientes",
    registroId: id,
    acao: "excluido",
    atorId: scope.usuario.id,
  })

  revalidatePath("/ehs/clientes")
  return { success: true }
}
