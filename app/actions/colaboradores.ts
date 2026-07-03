"use server"

import { getSupabaseServerClient } from "@/lib/supabase-server"
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

export async function criarColaborador(data: NovoColaborador) {
  await checkPermission(["Adm", "Financeiro"])

  const supabase = await getSupabaseServerClient()

  const sanitizedEmail = data.email?.trim().toLowerCase()
  if (!sanitizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sanitizedEmail)) {
    throw new Error("Email inválido")
  }

  const { data: emailExistente } = await supabase
    .from("colaboradores")
    .select("email")
    .eq("email", sanitizedEmail)
    .maybeSingle()

  if (emailExistente) {
    throw new Error("Este email já está cadastrado no sistema")
  }

  if (data.tipo_acesso === "Supervisor" && data.equipe_id) {
    const { data: supervisorExistente } = await supabase
      .from("colaboradores")
      .select("nome_completo, equipe_id")
      .eq("equipe_id", data.equipe_id)
      .eq("tipo_acesso", "Supervisor")
      .maybeSingle()

    if (supervisorExistente) {
      const { data: equipe } = await supabase.from("equipes").select("nome").eq("id", data.equipe_id).single()

      throw new Error(
        `Já existe um supervisor (${supervisorExistente.nome_completo}) nesta equipe (${equipe?.nome}). Cada equipe pode ter apenas um supervisor.`,
      )
    }
  }

  const hashedPassword = await bcrypt.hash(data.senha, 10)

  const { data: colaborador, error } = await supabase
    .from("colaboradores")
    .insert({
      nome_completo: data.nome_completo,
      salario: data.salario,
      cnpj: data.cnpj,
      data_nascimento: data.data_nascimento,
      data_aniversario_contrato: data.data_aniversario_contrato || null,
      email: sanitizedEmail,
      tipo_acesso: data.tipo_acesso,
      equipe_id: data.equipe_id,
      dia_pagamento: data.dia_pagamento,
      chave_pix: data.chave_pix || null,
      tipo_chave_pix: data.tipo_chave_pix || null,
      centro_custo_id: data.centro_custo_id || null,
      senha_hash: hashedPassword,
      user_id: null,
    })
    .select()
    .single()

  if (error) {
    console.error("[v0] Erro ao criar colaborador:", error)
    throw new Error("Erro ao salvar dados do colaborador. Por favor, tente novamente.")
  }

  console.log("[v0] Colaborador criado com sucesso:", colaborador.id)

  revalidatePath("/colaboradores")
  revalidatePath("/cadastros/colaboradores")
  revalidatePath("/gestao")
  return colaborador
}

export async function listarColaboradores() {
  const supabase = await getSupabaseServerClient()
  const session = await getSession()

  if (!session) {
    throw new Error("Usuário não autenticado")
  }

  const tresDiasAtras = new Date()
  tresDiasAtras.setDate(tresDiasAtras.getDate() - 3)
  const dataLimite = tresDiasAtras.toISOString()

  if (session.tipoAcesso === "Supervisor") {
    const { data: equipes, error: equipesError } = await supabase
      .from("equipes")
      .select("id")
      .eq("supervisor_id", session.colaboradorId)

    if (equipesError) {
      console.error("[v0] Erro ao buscar equipes do supervisor:", equipesError)
      throw new Error("Erro ao buscar equipes")
    }

    const equipeIds = equipes.map((e) => e.id)

    if (equipeIds.length === 0) {
      return []
    }

    const { data, error } = await supabase
      .from("colaboradores")
      .select("*, equipe:equipes!equipe_id(nome)")
      .in("equipe_id", equipeIds)
      .in("tipo_acesso", ["Colaborador"])
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Erro ao listar colaboradores:", error)
      throw new Error("Erro ao listar colaboradores")
    }

    const colaboradoresComBloqueio = await Promise.all(
      data.map(async (colaborador) => {
        const { data: pedidoRecente } = await supabase
          .from("pedidos_pagamento")
          .select("created_at")
          .eq("colaborador_id", colaborador.id)
          .gte("created_at", dataLimite)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle()

        return {
          ...colaborador,
          bloqueado: !!pedidoRecente,
          data_ultimo_pedido: pedidoRecente?.created_at,
        }
      }),
    )

    return colaboradoresComBloqueio
  }

  if (session.tipoAcesso === "Gerente") {
    const { data: gerenteEquipes, error: gerenteEquipesError } = await supabase
      .from("gerentes_equipes")
      .select("equipe_id")
      .eq("gerente_id", session.colaboradorId)

    if (gerenteEquipesError) {
      console.error("[v0] Erro ao buscar equipes do gerente:", gerenteEquipesError)
      throw new Error("Erro ao buscar equipes do gerente")
    }

    const equipeIds = gerenteEquipes.map((e) => e.equipe_id)

    if (equipeIds.length === 0) {
      return []
    }

    const { data, error } = await supabase
      .from("colaboradores")
      .select("*, equipe:equipes!equipe_id(nome)")
      .in("equipe_id", equipeIds)
      .in("tipo_acesso", ["Colaborador", "Supervisor"])
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Erro ao listar colaboradores:", error)
      throw new Error("Erro ao listar colaboradores")
    }

    const colaboradoresComBloqueio = await Promise.all(
      data.map(async (colaborador) => {
        const { data: pedidoRecente } = await supabase
          .from("pedidos_pagamento")
          .select("created_at")
          .eq("colaborador_id", colaborador.id)
          .gte("created_at", dataLimite)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle()

        return {
          ...colaborador,
          bloqueado: !!pedidoRecente,
          data_ultimo_pedido: pedidoRecente?.created_at,
        }
      }),
    )

    return colaboradoresComBloqueio
  }

  const { data, error } = await supabase
    .from("colaboradores")
    .select("*, equipe:equipes!equipe_id(nome)")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[v0] Erro ao listar colaboradores:", error)
    throw new Error("Erro ao listar colaboradores")
  }

  const colaboradoresComBloqueio = await Promise.all(
    data.map(async (colaborador) => {
      const { data: pedidoRecente } = await supabase
        .from("pedidos_pagamento")
        .select("created_at")
        .eq("colaborador_id", colaborador.id)
        .gte("created_at", dataLimite)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      return {
        ...colaborador,
        bloqueado: !!pedidoRecente,
        data_ultimo_pedido: pedidoRecente?.created_at,
      }
    }),
  )

  return colaboradoresComBloqueio
}

export async function getColaboradores() {
  const supabase = await getSupabaseServerClient()

  const { data, error } = await supabase
    .from("colaboradores")
    .select("id, nome_completo, email")
    .order("nome_completo", { ascending: true })

  if (error) {
    console.error("[v0] Erro ao listar colaboradores para faturas:", error)
    return []
  }

  if (!data || data.length === 0) {
    return []
  }

  return (data || []).map(col => ({
    id: col.id,
    nome: col.nome_completo,
    email: col.email
  }))
}

export async function deletarColaborador(id: string) {
  await checkPermission(["Adm", "Financeiro"])

  const supabase = await getSupabaseServerClient()

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(id)) {
    throw new Error("ID inválido")
  }

  const { data: pedidos, error: pedidosError } = await supabase
    .from("pedidos_pagamento")
    .select("id")
    .eq("criado_por_colaborador_id", id)
    .limit(1)

  if (pedidosError) {
    console.error("[v0] Erro ao verificar pedidos do colaborador:", pedidosError)
    throw new Error("Erro ao verificar pedidos do colaborador")
  }

  if (pedidos && pedidos.length > 0) {
    throw new Error(
      "Não é possível deletar este colaborador porque ele possui pedidos associados. Para manter o histórico, o colaborador será mantido no sistema.",
    )
  }

  const { data: colaborador } = await supabase.from("colaboradores").select("user_id").eq("id", id).maybeSingle()

  if (!colaborador) {
    throw new Error("Colaborador não encontrado")
  }

  const { error } = await supabase.from("colaboradores").delete().eq("id", id)

  if (error) {
    console.error("[v0] Erro ao deletar colaborador:", error)
    throw new Error("Erro ao deletar colaborador")
  }

  revalidatePath("/colaboradores")
}

export async function atualizarColaborador(id: string, data: Partial<NovoColaborador>) {
  await checkPermission(["Adm", "Financeiro"])

  const supabase = await getSupabaseServerClient()

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(id)) {
    throw new Error("ID inválido")
  }

  if (data.email) {
    const sanitizedEmail = data.email.trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sanitizedEmail)) {
      throw new Error("Email inválido")
    }
    data.email = sanitizedEmail

    const { data: emailExistente } = await supabase
      .from("colaboradores")
      .select("email, id")
      .eq("email", sanitizedEmail)
      .neq("id", id)
      .maybeSingle()

    if (emailExistente) {
      throw new Error("Este email já está cadastrado em outro colaborador")
    }
  }

  if (data.tipo_acesso === "Supervisor" && data.equipe_id) {
    const { data: supervisorExistente } = await supabase
      .from("colaboradores")
      .select("nome_completo, equipe_id, id")
      .eq("equipe_id", data.equipe_id)
      .eq("tipo_acesso", "Supervisor")
      .neq("id", id)
      .maybeSingle()

    if (supervisorExistente) {
      const { data: equipe } = await supabase.from("equipes").select("nome").eq("id", data.equipe_id).single()

      throw new Error(
        `Já existe um supervisor (${supervisorExistente.nome_completo}) nesta equipe (${equipe?.nome}). Cada equipe pode ter apenas um supervisor.`,
      )
    }
  }

  const updateData: any = {}
  if (data.nome_completo) updateData.nome_completo = data.nome_completo
  if (data.email) updateData.email = data.email
  if (data.cnpj) updateData.cnpj = data.cnpj
  if (data.data_nascimento) updateData.data_nascimento = data.data_nascimento
  if (data.data_aniversario_contrato !== undefined) updateData.data_aniversario_contrato = data.data_aniversario_contrato || null
  if (data.tipo_acesso) updateData.tipo_acesso = data.tipo_acesso
  if (data.salario !== undefined) updateData.salario = data.salario
  if ("equipe_id" in data) updateData.equipe_id = data.equipe_id ?? null
  if (data.dia_pagamento !== undefined) updateData.dia_pagamento = data.dia_pagamento
  if (data.chave_pix !== undefined) updateData.chave_pix = data.chave_pix || null
  if (data.tipo_chave_pix !== undefined) updateData.tipo_chave_pix = data.tipo_chave_pix || null
  if (data.centro_custo_id !== undefined) updateData.centro_custo_id = data.centro_custo_id || null

  console.log("[v0] atualizarColaborador updateData:", JSON.stringify(updateData))

  if (data.senha) {
    updateData.senha_hash = await bcrypt.hash(data.senha, 10)
  }

  const { error } = await supabase.from("colaboradores").update(updateData).eq("id", id)

  if (error) {
    console.error("[v0] Erro ao atualizar colaborador:", error)
    throw new Error("Erro ao atualizar colaborador. Por favor, tente novamente.")
  }

  revalidatePath("/colaboradores")
  revalidatePath("/cadastros/colaboradores")
  revalidatePath("/gestao")
  revalidatePath("/cadastros/equipes")
  revalidatePath("/", "layout")
}

export async function listarColaboradoresGerente(gerenteId: string) {
  const supabase = await getSupabaseServerClient()

  const { data: gerenteEquipes, error: gerenteEquipesError } = await supabase
    .from("gerentes_equipes")
    .select("equipe_id")
    .eq("gerente_id", gerenteId)

  if (gerenteEquipesError) {
    console.error("[v0] Erro ao buscar equipes do gerente:", gerenteEquipesError)
    throw new Error("Erro ao buscar equipes do gerente")
  }

  const equipeIds = gerenteEquipes.map((e) => e.equipe_id)

  if (equipeIds.length === 0) {
    return []
  }

  const { data, error } = await supabase
    .from("colaboradores")
    .select("*, equipe:equipes!equipe_id(nome)")
    .in("equipe_id", equipeIds)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[v0] Erro ao listar colaboradores:", error)
    throw new Error("Erro ao listar colaboradores")
  }

  return data
}

export async function listarColaboradoresComGerente() {
  const supabase = await getSupabaseServerClient()
  const session = await getSession()

  if (!session) {
    throw new Error("Usuário não autenticado")
  }

  const tresDiasAtras = new Date()
  tresDiasAtras.setDate(tresDiasAtras.getDate() - 3)
  const dataLimite = tresDiasAtras.toISOString()

  if (session.tipoAcesso === "Supervisor") {
    const { data: supervisorData } = await supabase
      .from("colaboradores")
      .select("equipe_id")
      .eq("id", session.colaboradorId)
      .single()

    if (!supervisorData?.equipe_id) {
      return []
    }

    const { data, error } = await supabase
      .from("colaboradores")
      .select("*, equipe:equipes!equipe_id(nome)")
      .eq("equipe_id", supervisorData.equipe_id)
      .in("tipo_acesso", ["Supervisor", "Colaborador"])
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Erro ao listar colaboradores:", error)
      throw new Error("Erro ao listar colaboradores")
    }

    const colaboradoresComBloqueio = await Promise.all(
      data.map(async (colaborador) => {
        const { data: pedidoRecente } = await supabase
          .from("pedidos_pagamento")
          .select("created_at")
          .eq("colaborador_id", colaborador.id)
          .gte("created_at", dataLimite)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle()

        return {
          ...colaborador,
          bloqueado: !!pedidoRecente,
          data_ultimo_pedido: pedidoRecente?.created_at,
        }
      }),
    )

    return colaboradoresComBloqueio
  }

  if (session.tipoAcesso === "Gerente") {
    const { data: gerenteEquipes, error: gerenteEquipesError } = await supabase
      .from("gerentes_equipes")
      .select("equipe_id")
      .eq("gerente_id", session.colaboradorId)

    if (gerenteEquipesError) {
      console.error("[v0] Erro ao buscar equipes do gerente:", gerenteEquipesError)
      throw new Error("Erro ao buscar equipes do gerente")
    }

    const equipeIds = gerenteEquipes.map((e) => e.equipe_id)

    if (equipeIds.length === 0) {
      return []
    }

    const { data, error } = await supabase
      .from("colaboradores")
      .select("*, equipe:equipes!equipe_id(nome)")
      .or(`equipe_id.in.(${equipeIds.join(",")}),id.eq.${session.colaboradorId}`)
      .in("tipo_acesso", ["Colaborador", "Supervisor", "Gerente"])
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Erro ao listar colaboradores:", error)
      throw new Error("Erro ao listar colaboradores")
    }

    const colaboradoresComBloqueio = await Promise.all(
      data.map(async (colaborador) => {
        const { data: pedidoRecente } = await supabase
          .from("pedidos_pagamento")
          .select("created_at")
          .eq("colaborador_id", colaborador.id)
          .gte("created_at", dataLimite)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle()

        return {
          ...colaborador,
          bloqueado: !!pedidoRecente,
          data_ultimo_pedido: pedidoRecente?.created_at,
        }
      }),
    )

    return colaboradoresComBloqueio
  }

  const { data, error } = await supabase
    .from("colaboradores")
    .select("*, equipe:equipes!equipe_id(nome)")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[v0] Erro ao listar colaboradores:", error)
    throw new Error("Erro ao listar colaboradores")
  }

  const colaboradoresComBloqueio = await Promise.all(
    data.map(async (colaborador) => {
      const { data: pedidoRecente } = await supabase
        .from("pedidos_pagamento")
        .select("created_at")
        .eq("colaborador_id", colaborador.id)
        .gte("created_at", dataLimite)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      return {
        ...colaborador,
        bloqueado: !!pedidoRecente,
        data_ultimo_pedido: pedidoRecente?.created_at,
      }
    }),
  )

  return colaboradoresComBloqueio
}

export async function exportarColaboradoresExcel() {
  const supabase = await getSupabaseServerClient()

  const { data, error } = await supabase
    .from("colaboradores")
    .select("*, equipe:equipes!equipe_id(nome)")
    .order("nome_completo", { ascending: true })

  if (error) {
    console.error("[v0] Erro ao exportar colaboradores:", error)
    throw new Error("Erro ao exportar colaboradores")
  }

  const dadosFormatados = data.map((colaborador) => ({
    Nome: colaborador.nome_completo,
    Email: colaborador.email,
    CNPJ: colaborador.cnpj || "",
    "Data de Nascimento": colaborador.data_nascimento
      ? new Date(colaborador.data_nascimento).toLocaleDateString("pt-BR")
      : "",
    Salário: colaborador.salario
      ? new Intl.NumberFormat("pt-BR", {
          style: "currency",
          currency: "BRL",
        }).format(colaborador.salario)
      : "R$ 0,00",
    "Tipo de Acesso": colaborador.tipo_acesso,
    Equipe: colaborador.equipe?.nome || "Sem equipe",
    "Dia de Pagamento": colaborador.dia_pagamento || "",
    "Data de Cadastro": new Date(colaborador.created_at).toLocaleDateString("pt-BR"),
  }))

  return dadosFormatados
}
