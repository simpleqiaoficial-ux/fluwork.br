"use server"

import { and, asc, desc, eq, gte, inArray, ne, or } from "drizzle-orm"
import { db } from "@/lib/db"
import { colaboradores, equipes, gerentesEquipes, pedidosPagamento, centrosCusto } from "@/lib/db/schema"
import { toColaboradorDTO } from "@/lib/db/mappers"
import type { NovoColaborador } from "@/types/colaborador"
import { revalidatePath } from "next/cache"
import { getSession } from "@/lib/session"
import bcrypt from "bcryptjs"

async function checkPermission(requiredRoles: string[]) {
  const session = await getSession()

  if (!session) {
    throw new Error("Usuário não autenticado")
  }

  if (!requiredRoles.includes(session.tipoAcesso)) {
    throw new Error("Você não tem permissão para realizar esta ação")
  }

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

  let colaborador
  try {
    ;[colaborador] = await db
      .insert(colaboradores)
      .values({
        empresaId: session.empresaId!,
        nomeCompleto: data.nome_completo,
        salario: data.salario.toString(),
        cnpj: data.cnpj,
        dataNascimento: data.data_nascimento,
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
      where: session.tipoAcesso === "SuperAdmin" ? undefined : eq(colaboradores.empresaId, session.empresaId!),
      orderBy: [desc(colaboradores.createdAt)],
      with: { equipe: true },
    })
  } catch (error) {
    console.error("[v0] Erro ao listar colaboradores:", error)
    throw new Error("Erro ao listar prestadores")
  }

  return attachBloqueio(rows, tresDiasAtras)
}

export async function getColaboradores() {
  const session = await getSession()
  if (!session) return []

  try {
    const data = await db
      .select({ id: colaboradores.id, nomeCompleto: colaboradores.nomeCompleto, email: colaboradores.email })
      .from(colaboradores)
      .where(session.tipoAcesso === "SuperAdmin" ? undefined : eq(colaboradores.empresaId, session.empresaId!))
      .orderBy(asc(colaboradores.nomeCompleto))

    if (!data || data.length === 0) {
      return []
    }

    return data.map((col) => ({
      id: col.id,
      nome: col.nomeCompleto,
      email: col.email,
    }))
  } catch (error) {
    console.error("[v0] Erro ao listar colaboradores para faturas:", error)
    return []
  }
}

export async function deletarColaborador(id: string) {
  const session = await checkPermission(["Adm", "Financeiro"])

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(id)) {
    throw new Error("ID inválido")
  }

  if (session.tipoAcesso !== "SuperAdmin") {
    const [alvo] = await db.select({ empresaId: colaboradores.empresaId }).from(colaboradores).where(eq(colaboradores.id, id))
    if (!alvo || alvo.empresaId !== session.empresaId) {
      throw new Error("Prestador não encontrado")
    }
  }

  let pedidos
  try {
    pedidos = await db
      .select({ id: pedidosPagamento.id })
      .from(pedidosPagamento)
      .where(eq(pedidosPagamento.criadoPorColaboradorId, id))
      .limit(1)
  } catch (pedidosError) {
    console.error("[v0] Erro ao verificar pedidos do colaborador:", pedidosError)
    throw new Error("Erro ao verificar pedidos do prestador")
  }

  if (pedidos && pedidos.length > 0) {
    throw new Error(
      "Não é possível deletar este colaborador porque ele possui pedidos associados. Para manter o histórico, o colaborador será mantido no sistema.",
    )
  }

  const [colaborador] = await db
    .select({ userId: colaboradores.userId })
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

  revalidatePath("/colaboradores")
}

export async function atualizarColaborador(id: string, data: Partial<NovoColaborador>) {
  const session = await checkPermission(["Adm", "Financeiro"])

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(id)) {
    throw new Error("ID inválido")
  }

  if (session.tipoAcesso !== "SuperAdmin") {
    const [alvo] = await db.select({ empresaId: colaboradores.empresaId }).from(colaboradores).where(eq(colaboradores.id, id))
    if (!alvo || alvo.empresaId !== session.empresaId) {
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
  if (data.data_nascimento) updateData.dataNascimento = data.data_nascimento
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

  revalidatePath("/colaboradores")
  revalidatePath("/cadastros/colaboradores")
  revalidatePath("/gestao")
  revalidatePath("/cadastros/equipes")
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
      where: session.tipoAcesso === "SuperAdmin" ? undefined : eq(colaboradores.empresaId, session.empresaId!),
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
      where: session.tipoAcesso === "SuperAdmin" ? undefined : eq(colaboradores.empresaId, session.empresaId!),
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
