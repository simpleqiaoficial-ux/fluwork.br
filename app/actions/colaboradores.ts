"use server"

import { and, asc, desc, eq, gte, inArray, ne, or } from "drizzle-orm"
import { db } from "@/lib/db"
import { colaboradores, equipes, gerentesEquipes, pedidosPagamento, centrosCusto, historicoReajustes, notasFiscais } from "@/lib/db/schema"
import { toColaboradorDTO } from "@/lib/db/mappers"
import type { NovoColaborador } from "@/types/colaborador"
import { revalidatePath } from "next/cache"
import { getSession } from "@/lib/session"
import { registrarAuditoria } from "@/lib/audit"
import { assertNaoImpersonando, getEffectiveEmpresaIdFromSession } from "@/lib/tenant"
import bcrypt from "bcryptjs"

async function checkPermission(requiredRoles: string[]) {
  const session = await getSession()

  if (!session) {
    throw new Error("Usuário não autenticado")
  }

  if (!requiredRoles.includes(session.tipoAcesso)) {
    throw new Error("Você não tem permissão para realizar esta ação")
  }

  // Todas as funções deste arquivo que passam por aqui são mutações — bloqueia quando o
  // SuperAdmin está em modo "visualizar como empresa" (somente leitura).
  await assertNaoImpersonando()

  return session
}

// Anexa a flag `bloqueado`/`data_ultimo_pedido` a uma lista de linhas de colaboradores,
// verificando se houve pedido de pagamento criado nos últimos 3 dias. Equivalente ao
// Promise.all repetido em cada branch da versão Supabase original.
async function attachBloqueio(rows: any[], dataLimite: Date) {
  return Promise.all(
    rows.map(async (colaborador) => {
      const [pedidoRecente] = await db
        .select({ createdAt: pedidosPagamento.createdAt })
        .from(pedidosPagamento)
        .where(and(eq(pedidosPagamento.colaboradorId, colaborador.id), gte(pedidosPagamento.createdAt, dataLimite)))
        .orderBy(desc(pedidosPagamento.createdAt))
        .limit(1)

      return {
        ...toColaboradorDTO(colaborador),
        bloqueado: !!pedidoRecente,
        data_ultimo_pedido: pedidoRecente?.createdAt ? pedidoRecente.createdAt.toISOString() : undefined,
      }
    }),
  )
}

export async function criarColaborador(data: NovoColaborador) {
  const session = await checkPermission(["Adm", "Financeiro"])

  const sanitizedEmail = data.email?.trim().toLowerCase()
  if (!sanitizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sanitizedEmail)) {
    throw new Error("Email inválido")
  }

  const [emailExistente] = await db
    .select({ email: colaboradores.email })
    .from(colaboradores)
    .where(eq(colaboradores.email, sanitizedEmail))

  if (emailExistente) {
    throw new Error("Este email já está cadastrado no sistema")
  }

  // Nunca confiar que equipe_id/centro_custo_id vindos do formulário pertencem à empresa
  // de quem está criando — mesmo que os dropdowns já só mostrem opções da própria empresa.
  if (session.tipoAcesso !== "SuperAdmin") {
    if (data.equipe_id) {
      const [equipeAlvo] = await db.select({ empresaId: equipes.empresaId }).from(equipes).where(eq(equipes.id, data.equipe_id))
      if (!equipeAlvo || equipeAlvo.empresaId !== session.empresaId) {
        throw new Error("Equipe inválida")
      }
    }
    if (data.centro_custo_id) {
      const [centroAlvo] = await db
        .select({ empresaId: centrosCusto.empresaId })
        .from(centrosCusto)
        .where(eq(centrosCusto.id, data.centro_custo_id))
      if (!centroAlvo || centroAlvo.empresaId !== session.empresaId) {
        throw new Error("Centro de custo inválido")
      }
    }
  }

  if (data.tipo_acesso === "Supervisor" && data.equipe_id) {
    const [supervisorExistente] = await db
      .select({ nomeCompleto: colaboradores.nomeCompleto, equipeId: colaboradores.equipeId })
      .from(colaboradores)
      .where(and(eq(colaboradores.equipeId, data.equipe_id), eq(colaboradores.tipoAcesso, "Supervisor")))

    if (supervisorExistente) {
      const [equipe] = await db.select({ nome: equipes.nome }).from(equipes).where(eq(equipes.id, data.equipe_id))

      throw new Error(
        `Já existe um supervisor (${supervisorExistente.nomeCompleto}) nesta equipe (${equipe?.nome}). Cada equipe pode ter apenas um supervisor.`,
      )
    }
  }

  const hashedPassword = await bcrypt.hash(data.senha, 10)

  // Nome de exibição: se ninguém vinculou uma pessoa física, usa a razão social/nome
  // fantasia da empresa (o cadastro sempre gira em torno do CNPJ, a pessoa é opcional).
  const nomeCompleto = data.nome_completo?.trim() || data.razao_social?.trim() || "Prestador"

  let colaborador
  try {
    ;[colaborador] = await db
      .insert(colaboradores)
      .values({
        empresaId: session.empresaId!,
        nomeCompleto,
        salario: data.salario.toString(),
        cnpj: data.cnpj,
        razaoSocial: data.razao_social || null,
        dataAbertura: data.data_abertura || null,
        enderecoCep: data.endereco_cep || null,
        enderecoLogradouro: data.endereco_logradouro || null,
        enderecoNumero: data.endereco_numero || null,
        enderecoComplemento: data.endereco_complemento || null,
        enderecoBairro: data.endereco_bairro || null,
        enderecoCidade: data.endereco_cidade || null,
        enderecoUf: data.endereco_uf || null,
        dataNascimento: data.data_nascimento || null,
        dataAniversarioContrato: data.data_aniversario_contrato || null,
        email: sanitizedEmail,
        tipoAcesso: data.tipo_acesso,
        equipeId: data.equipe_id,
        diaPagamento: data.dia_pagamento,
        chavePix: data.chave_pix || null,
        tipoChavePix: data.tipo_chave_pix || null,
        centroCustoId: data.centro_custo_id || null,
        senhaHash: hashedPassword,
        userId: null,
      })
      .returning()
  } catch (error) {
    console.error("[v0] Erro ao criar colaborador:", error)
    throw new Error("Erro ao salvar dados do prestador. Por favor, tente novamente.")
  }

  console.log("[v0] Colaborador criado com sucesso:", colaborador.id)

  revalidatePath("/colaboradores")
  revalidatePath("/cadastros/colaboradores")
  revalidatePath("/gestao")
  return toColaboradorDTO(colaborador)
}

// Usado no perfil do colaborador (app/cadastros/colaboradores/[id]) — traz um único registro
// com o mesmo escopo de empresa das demais consultas administrativas deste arquivo.
export async function getColaboradorById(id: string) {
  const session = await getSession()
  if (!session) throw new Error("Usuário não autenticado")

  const row = await db.query.colaboradores.findFirst({
    where: eq(colaboradores.id, id),
    with: { equipe: true, centroCusto: true },
  })

  if (!row) return null
  if (session.tipoAcesso !== "SuperAdmin" && row.empresaId !== session.empresaId) {
    throw new Error("Prestador não encontrado")
  }

  return toColaboradorDTO(row)
}

export async function listarColaboradores() {
  const session = await getSession()

  if (!session) {
    throw new Error("Usuário não autenticado")
  }

  const tresDiasAtras = new Date()
  tresDiasAtras.setDate(tresDiasAtras.getDate() - 3)

  if (session.tipoAcesso === "Supervisor") {
    let equipesRows
    try {
      equipesRows = await db
        .select({ id: equipes.id })
        .from(equipes)
        .where(eq(equipes.supervisorId, session.colaboradorId))
    } catch (equipesError) {
      console.error("[v0] Erro ao buscar equipes do supervisor:", equipesError)
      throw new Error("Erro ao buscar equipes")
    }

    const equipeIds = equipesRows.map((e) => e.id)

    if (equipeIds.length === 0) {
      return []
    }

    let rows
    try {
      rows = await db.query.colaboradores.findMany({
        where: and(inArray(colaboradores.equipeId, equipeIds), inArray(colaboradores.tipoAcesso, ["Colaborador"])),
        orderBy: [desc(colaboradores.createdAt)],
        with: { equipe: true },
      })
    } catch (error) {
      console.error("[v0] Erro ao listar colaboradores:", error)
      throw new Error("Erro ao listar prestadores")
    }

    return attachBloqueio(rows, tresDiasAtras)
  }

  if (session.tipoAcesso === "Gerente") {
    let gerenteEquipesRows
    try {
      gerenteEquipesRows = await db
        .select({ equipeId: gerentesEquipes.equipeId })
        .from(gerentesEquipes)
        .where(eq(gerentesEquipes.gerenteId, session.colaboradorId))
    } catch (gerenteEquipesError) {
      console.error("[v0] Erro ao buscar equipes do gerente:", gerenteEquipesError)
      throw new Error("Erro ao buscar equipes do gerente")
    }

    const equipeIds = gerenteEquipesRows.map((e) => e.equipeId)

    if (equipeIds.length === 0) {
      return []
    }

    let rows
    try {
      rows = await db.query.colaboradores.findMany({
        where: and(
          inArray(colaboradores.equipeId, equipeIds),
          inArray(colaboradores.tipoAcesso, ["Colaborador", "Supervisor"]),
        ),
        orderBy: [desc(colaboradores.createdAt)],
        with: { equipe: true },
      })
    } catch (error) {
      console.error("[v0] Erro ao listar colaboradores:", error)
      throw new Error("Erro ao listar prestadores")
    }

    return attachBloqueio(rows, tresDiasAtras)
  }

  let rows
  try {
    rows = await db.query.colaboradores.findMany({
      where: getEffectiveEmpresaIdFromSession(session) === null ? undefined : eq(colaboradores.empresaId, getEffectiveEmpresaIdFromSession(session)!),
      orderBy: [desc(colaboradores.createdAt)],
      with: { equipe: true },
    })
  } catch (error) {
    console.error("[v0] Erro ao listar colaboradores:", error)
    throw new Error("Erro ao listar prestadores")
  }

  return attachBloqueio(rows, tresDiasAtras)
}

export async function deletarColaborador(id: string) {
  const session = await checkPermission(["Adm", "Financeiro", "SuperAdmin"])

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(id)) {
    throw new Error("ID inválido")
  }

  let empresaAlvoId: string | null = null
  if (session.tipoAcesso !== "SuperAdmin") {
    const [alvo] = await db.select({ empresaId: colaboradores.empresaId }).from(colaboradores).where(eq(colaboradores.id, id))
    if (!alvo || alvo.empresaId !== session.empresaId) {
      throw new Error("Prestador não encontrado")
    }
    empresaAlvoId = alvo.empresaId
  }

  // Checa toda tabela com FK pra colaborador_id que ou (a) tem onDelete: cascade — apagaria
  // esse histórico em silêncio (pedidos_pagamento.colaborador_id, historico_reajustes,
  // notas_fiscais) — ou (b) não tem onDelete configurado — geraria um erro cru de FK do
  // Postgres em vez de uma mensagem clara (pedidos_pagamento.criado_por_colaborador_id, o
  // único vínculo que a checagem original cobria).
  try {
    const [[pedidoDono], [pedidoCriador], [reajuste], [nota]] = await Promise.all([
      db.select({ id: pedidosPagamento.id }).from(pedidosPagamento).where(eq(pedidosPagamento.colaboradorId, id)).limit(1),
      db.select({ id: pedidosPagamento.id }).from(pedidosPagamento).where(eq(pedidosPagamento.criadoPorColaboradorId, id)).limit(1),
      db.select({ id: historicoReajustes.id }).from(historicoReajustes).where(eq(historicoReajustes.colaboradorId, id)).limit(1),
      db.select({ id: notasFiscais.id }).from(notasFiscais).where(eq(notasFiscais.colaboradorId, id)).limit(1),
    ])
    if (pedidoDono || pedidoCriador || reajuste || nota) {
      throw new Error(
        "Não é possível deletar este colaborador porque ele possui pedidos, reajustes ou notas fiscais associados. Para manter o histórico, o colaborador será mantido no sistema.",
      )
    }
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Não é possível deletar")) throw error
    console.error("[v0] Erro ao verificar vínculos do colaborador:", error)
    throw new Error("Erro ao verificar vínculos do prestador")
  }

  const [colaborador] = await db
    .select({ userId: colaboradores.userId, empresaId: colaboradores.empresaId })
    .from(colaboradores)
    .where(eq(colaboradores.id, id))

  if (!colaborador) {
    throw new Error("Prestador não encontrado")
  }

  try {
    await db.delete(colaboradores).where(eq(colaboradores.id, id))
  } catch (error) {
    console.error("[v0] Erro ao deletar colaborador:", error)
    throw new Error("Erro ao deletar prestador")
  }

  if (session.tipoAcesso === "SuperAdmin") {
    await registrarAuditoria({
      colaboradorId: session.colaboradorId,
      empresaId: empresaAlvoId ?? colaborador.empresaId,
      acao: "colaborador_excluido",
      tabela: "colaboradores",
      registroId: id,
    })
  }

  revalidatePath("/colaboradores")
  revalidatePath("/admin/dados/colaboradores")
}

export async function atualizarColaborador(id: string, data: Partial<NovoColaborador>) {
  const session = await checkPermission(["Adm", "Financeiro", "SuperAdmin"])

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(id)) {
    throw new Error("ID inválido")
  }

  const [alvoAtual] = await db.select({ empresaId: colaboradores.empresaId }).from(colaboradores).where(eq(colaboradores.id, id))
  if (session.tipoAcesso !== "SuperAdmin") {
    if (!alvoAtual || alvoAtual.empresaId !== session.empresaId) {
      throw new Error("Prestador não encontrado")
    }
  }

  if (data.email) {
    const sanitizedEmail = data.email.trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sanitizedEmail)) {
      throw new Error("Email inválido")
    }
    data.email = sanitizedEmail

    const [emailExistente] = await db
      .select({ email: colaboradores.email, id: colaboradores.id })
      .from(colaboradores)
      .where(and(eq(colaboradores.email, sanitizedEmail), ne(colaboradores.id, id)))

    if (emailExistente) {
      throw new Error("Este email já está cadastrado em outro prestador")
    }
  }

  if (session.tipoAcesso !== "SuperAdmin") {
    if (data.equipe_id) {
      const [equipeAlvo] = await db.select({ empresaId: equipes.empresaId }).from(equipes).where(eq(equipes.id, data.equipe_id))
      if (!equipeAlvo || equipeAlvo.empresaId !== session.empresaId) {
        throw new Error("Equipe inválida")
      }
    }
    if (data.centro_custo_id) {
      const [centroAlvo] = await db
        .select({ empresaId: centrosCusto.empresaId })
        .from(centrosCusto)
        .where(eq(centrosCusto.id, data.centro_custo_id))
      if (!centroAlvo || centroAlvo.empresaId !== session.empresaId) {
        throw new Error("Centro de custo inválido")
      }
    }
  }

  if (data.tipo_acesso === "Supervisor" && data.equipe_id) {
    const [supervisorExistente] = await db
      .select({ nomeCompleto: colaboradores.nomeCompleto, equipeId: colaboradores.equipeId, id: colaboradores.id })
      .from(colaboradores)
      .where(
        and(
          eq(colaboradores.equipeId, data.equipe_id),
          eq(colaboradores.tipoAcesso, "Supervisor"),
          ne(colaboradores.id, id),
        ),
      )

    if (supervisorExistente) {
      const [equipe] = await db.select({ nome: equipes.nome }).from(equipes).where(eq(equipes.id, data.equipe_id))

      throw new Error(
        `Já existe um supervisor (${supervisorExistente.nomeCompleto}) nesta equipe (${equipe?.nome}). Cada equipe pode ter apenas um supervisor.`,
      )
    }
  }

  const updateData: any = {}
  if (data.nome_completo) updateData.nomeCompleto = data.nome_completo
  if (data.email) updateData.email = data.email
  if (data.cnpj) updateData.cnpj = data.cnpj
  if (data.razao_social !== undefined) updateData.razaoSocial = data.razao_social || null
  if (data.data_abertura !== undefined) updateData.dataAbertura = data.data_abertura || null
  if (data.endereco_cep !== undefined) updateData.enderecoCep = data.endereco_cep || null
  if (data.endereco_logradouro !== undefined) updateData.enderecoLogradouro = data.endereco_logradouro || null
  if (data.endereco_numero !== undefined) updateData.enderecoNumero = data.endereco_numero || null
  if (data.endereco_complemento !== undefined) updateData.enderecoComplemento = data.endereco_complemento || null
  if (data.endereco_bairro !== undefined) updateData.enderecoBairro = data.endereco_bairro || null
  if (data.endereco_cidade !== undefined) updateData.enderecoCidade = data.endereco_cidade || null
  if (data.endereco_uf !== undefined) updateData.enderecoUf = data.endereco_uf || null
  if (data.data_nascimento !== undefined) updateData.dataNascimento = data.data_nascimento || null
  if (data.data_aniversario_contrato !== undefined)
    updateData.dataAniversarioContrato = data.data_aniversario_contrato || null
  if (data.tipo_acesso) updateData.tipoAcesso = data.tipo_acesso
  if (data.salario !== undefined) updateData.salario = data.salario.toString()
  if ("equipe_id" in data) updateData.equipeId = data.equipe_id ?? null
  if (data.dia_pagamento !== undefined) updateData.diaPagamento = data.dia_pagamento
  if (data.chave_pix !== undefined) updateData.chavePix = data.chave_pix || null
  if (data.tipo_chave_pix !== undefined) updateData.tipoChavePix = data.tipo_chave_pix || null
  if (data.centro_custo_id !== undefined) updateData.centroCustoId = data.centro_custo_id || null

  console.log("[v0] atualizarColaborador updateData:", JSON.stringify(updateData))

  if (data.senha) {
    updateData.senhaHash = await bcrypt.hash(data.senha, 10)
  }

  try {
    await db.update(colaboradores).set(updateData).where(eq(colaboradores.id, id))
  } catch (error) {
    console.error("[v0] Erro ao atualizar colaborador:", error)
    throw new Error("Erro ao atualizar prestador. Por favor, tente novamente.")
  }

  if (session.tipoAcesso === "SuperAdmin") {
    await registrarAuditoria({
      colaboradorId: session.colaboradorId,
      empresaId: alvoAtual?.empresaId ?? null,
      acao: "colaborador_atualizado",
      tabela: "colaboradores",
      registroId: id,
      detalhes: { campos_alterados: Object.keys(updateData).filter((k) => k !== "senhaHash") },
    })
  }

  revalidatePath("/colaboradores")
  revalidatePath("/cadastros/colaboradores")
  revalidatePath("/gestao")
  revalidatePath("/cadastros/equipes")
  revalidatePath("/admin/dados/colaboradores")
  revalidatePath("/", "layout")
}

export async function listarColaboradoresGerente(gerenteId: string) {
  let gerenteEquipesRows
  try {
    gerenteEquipesRows = await db
      .select({ equipeId: gerentesEquipes.equipeId })
      .from(gerentesEquipes)
      .where(eq(gerentesEquipes.gerenteId, gerenteId))
  } catch (gerenteEquipesError) {
    console.error("[v0] Erro ao buscar equipes do gerente:", gerenteEquipesError)
    throw new Error("Erro ao buscar equipes do gerente")
  }

  const equipeIds = gerenteEquipesRows.map((e) => e.equipeId)

  if (equipeIds.length === 0) {
    return []
  }

  let rows
  try {
    rows = await db.query.colaboradores.findMany({
      where: inArray(colaboradores.equipeId, equipeIds),
      orderBy: [desc(colaboradores.createdAt)],
      with: { equipe: true },
    })
  } catch (error) {
    console.error("[v0] Erro ao listar colaboradores:", error)
    throw new Error("Erro ao listar prestadores")
  }

  return rows.map(toColaboradorDTO)
}

export async function listarColaboradoresComGerente() {
  const session = await getSession()

  if (!session) {
    throw new Error("Usuário não autenticado")
  }

  const tresDiasAtras = new Date()
  tresDiasAtras.setDate(tresDiasAtras.getDate() - 3)

  if (session.tipoAcesso === "Supervisor") {
    const [supervisorData] = await db
      .select({ equipeId: colaboradores.equipeId })
      .from(colaboradores)
      .where(eq(colaboradores.id, session.colaboradorId))

    if (!supervisorData?.equipeId) {
      return []
    }

    let rows
    try {
      rows = await db.query.colaboradores.findMany({
        where: and(
          eq(colaboradores.equipeId, supervisorData.equipeId),
          inArray(colaboradores.tipoAcesso, ["Supervisor", "Colaborador"]),
        ),
        orderBy: [desc(colaboradores.createdAt)],
        with: { equipe: true },
      })
    } catch (error) {
      console.error("[v0] Erro ao listar colaboradores:", error)
      throw new Error("Erro ao listar prestadores")
    }

    return attachBloqueio(rows, tresDiasAtras)
  }

  if (session.tipoAcesso === "Gerente") {
    let gerenteEquipesRows
    try {
      gerenteEquipesRows = await db
        .select({ equipeId: gerentesEquipes.equipeId })
        .from(gerentesEquipes)
        .where(eq(gerentesEquipes.gerenteId, session.colaboradorId))
    } catch (gerenteEquipesError) {
      console.error("[v0] Erro ao buscar equipes do gerente:", gerenteEquipesError)
      throw new Error("Erro ao buscar equipes do gerente")
    }

    const equipeIds = gerenteEquipesRows.map((e) => e.equipeId)

    if (equipeIds.length === 0) {
      return []
    }

    let rows
    try {
      rows = await db.query.colaboradores.findMany({
        where: and(
          or(inArray(colaboradores.equipeId, equipeIds), eq(colaboradores.id, session.colaboradorId)),
          inArray(colaboradores.tipoAcesso, ["Colaborador", "Supervisor", "Gerente"]),
        ),
        orderBy: [desc(colaboradores.createdAt)],
        with: { equipe: true },
      })
    } catch (error) {
      console.error("[v0] Erro ao listar colaboradores:", error)
      throw new Error("Erro ao listar prestadores")
    }

    return attachBloqueio(rows, tresDiasAtras)
  }

  let rows
  try {
    rows = await db.query.colaboradores.findMany({
      where: getEffectiveEmpresaIdFromSession(session) === null ? undefined : eq(colaboradores.empresaId, getEffectiveEmpresaIdFromSession(session)!),
      orderBy: [desc(colaboradores.createdAt)],
      with: { equipe: true },
    })
  } catch (error) {
    console.error("[v0] Erro ao listar colaboradores:", error)
    throw new Error("Erro ao listar prestadores")
  }

  return attachBloqueio(rows, tresDiasAtras)
}

export async function exportarColaboradoresExcel() {
  const session = await getSession()
  if (!session) throw new Error("Usuário não autenticado")

  let data
  try {
    data = await db.query.colaboradores.findMany({
      where: getEffectiveEmpresaIdFromSession(session) === null ? undefined : eq(colaboradores.empresaId, getEffectiveEmpresaIdFromSession(session)!),
      orderBy: [asc(colaboradores.nomeCompleto)],
      with: { equipe: true },
    })
  } catch (error) {
    console.error("[v0] Erro ao exportar colaboradores:", error)
    throw new Error("Erro ao exportar prestadores")
  }

  const dadosFormatados = data.map((colaborador) => ({
    Nome: colaborador.nomeCompleto,
    Email: colaborador.email,
    CNPJ: colaborador.cnpj || "",
    "Razão Social": colaborador.razaoSocial || "",
    "Data de Abertura": colaborador.dataAbertura
      ? new Date(colaborador.dataAbertura).toLocaleDateString("pt-BR")
      : "",
    "Data de Nascimento": colaborador.dataNascimento
      ? new Date(colaborador.dataNascimento).toLocaleDateString("pt-BR")
      : "",
    Salário: colaborador.salario
      ? new Intl.NumberFormat("pt-BR", {
          style: "currency",
          currency: "BRL",
        }).format(Number(colaborador.salario))
      : "R$ 0,00",
    "Tipo de Acesso": colaborador.tipoAcesso,
    Equipe: colaborador.equipe?.nome || "Sem equipe",
    "Dia de Pagamento": colaborador.diaPagamento || "",
    "Data de Cadastro": new Date(colaborador.createdAt!).toLocaleDateString("pt-BR"),
  }))

  return dadosFormatados
}
