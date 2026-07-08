"use server"

import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { colaboradores, empresas, notasFiscais, pedidosPagamento } from "@/lib/db/schema"
import { toNotaFiscalDTO } from "@/lib/db/mappers"
import { getSession } from "@/lib/session"
import { getUsuarioLogado } from "@/lib/auth-utils"
import { cadastrarEmpresaFocus, emitirNfse, consultarNfse, baixarArquivoFocus, type EnderecoFocus } from "@/lib/focus-nfe"
import { resolverCodigoMunicipio } from "@/lib/ibge"
import { uploadFile } from "@/lib/gcs"

const REGIMES_VALIDOS = ["simples_nacional", "simples_nacional_excesso", "regime_normal"]

async function exigirAcessoColaborador(colaboradorId: string) {
  const usuario = await getUsuarioLogado()
  if (!usuario) throw new Error("Não autenticado")
  const podeAdm = ["Adm", "Financeiro", "SuperAdmin"].includes(usuario.tipo_acesso)
  const ehProprio = usuario.id === colaboradorId
  if (!podeAdm && !ehProprio) throw new Error("Sem permissão para configurar dados fiscais deste prestador")
  return usuario
}

/** Cadastra o prestador na Focus NFe (certificado digital + inscrição municipal + regime
 *  tributário) — pré-requisito pra "Emitir NFS-e pelo FluWork". O certificado e a senha só
 *  existem durante esta chamada, nunca são persistidos no FluWork (ver lib/focus-nfe.ts). */
export async function cadastrarPrestadorFocusNfe(colaboradorId: string, formData: FormData) {
  await exigirAcessoColaborador(colaboradorId)

  const inscricaoMunicipal = String(formData.get("inscricao_municipal") || "").trim()
  const regimeTributario = String(formData.get("regime_tributario") || "")
  const certificado = formData.get("certificado") as File | null
  const senhaCertificado = String(formData.get("senha_certificado") || "")

  if (!inscricaoMunicipal || !regimeTributario || !certificado || !senhaCertificado) {
    return { success: false, error: "Preencha todos os campos e selecione o certificado digital" }
  }
  if (!REGIMES_VALIDOS.includes(regimeTributario)) {
    return { success: false, error: "Regime tributário inválido" }
  }
  if (!/\.(pfx|p12)$/i.test(certificado.name)) {
    return { success: false, error: "O certificado precisa ser um arquivo .pfx ou .p12" }
  }
  if (certificado.size > 10 * 1024 * 1024) {
    return { success: false, error: "Certificado maior que 10MB" }
  }

  const [colaborador] = await db.select().from(colaboradores).where(eq(colaboradores.id, colaboradorId))
  if (!colaborador) return { success: false, error: "Prestador não encontrado" }
  if (!colaborador.cnpj || !colaborador.razaoSocial) {
    return { success: false, error: "Cadastre o CNPJ e a razão social do prestador antes de configurar a emissão de NFS-e" }
  }
  if (
    !colaborador.enderecoLogradouro ||
    !colaborador.enderecoNumero ||
    !colaborador.enderecoBairro ||
    !colaborador.enderecoCidade ||
    !colaborador.enderecoUf ||
    !colaborador.enderecoCep
  ) {
    return { success: false, error: "Complete o endereço do prestador antes de configurar a emissão de NFS-e" }
  }

  let codigoMunicipioIbge = colaborador.codigoMunicipioIbge
  if (!codigoMunicipioIbge) {
    codigoMunicipioIbge = await resolverCodigoMunicipio(colaborador.enderecoCidade, colaborador.enderecoUf)
  }
  if (!codigoMunicipioIbge) {
    return { success: false, error: "Não foi possível identificar o código do município — confira cidade/UF do endereço" }
  }

  const certificadoBase64 = Buffer.from(await certificado.arrayBuffer()).toString("base64")

  const endereco: EnderecoFocus = {
    logradouro: colaborador.enderecoLogradouro,
    numero: colaborador.enderecoNumero,
    complemento: colaborador.enderecoComplemento,
    bairro: colaborador.enderecoBairro,
    cep: colaborador.enderecoCep,
    cidade: colaborador.enderecoCidade,
    uf: colaborador.enderecoUf,
    codigoMunicipioIbge,
  }

  const resultado = await cadastrarEmpresaFocus({
    cnpj: colaborador.cnpj,
    razaoSocial: colaborador.razaoSocial,
    inscricaoMunicipal,
    regimeTributario: regimeTributario as "simples_nacional" | "simples_nacional_excesso" | "regime_normal",
    endereco,
    certificadoBase64,
    senhaCertificado,
    colaboradorId,
  })

  if (resultado.success) {
    await db
      .update(colaboradores)
      .set({
        inscricaoMunicipal,
        regimeTributario,
        codigoMunicipioIbge,
        focusStatusCadastro: "cadastrado",
        focusCadastradoEm: new Date(),
        focusMotivoErroCadastro: null,
      })
      .where(eq(colaboradores.id, colaboradorId))
  } else {
    await db
      .update(colaboradores)
      .set({
        inscricaoMunicipal,
        regimeTributario,
        focusStatusCadastro: "erro",
        focusMotivoErroCadastro: resultado.mensagem || "Erro ao cadastrar na Focus NFe",
      })
      .where(eq(colaboradores.id, colaboradorId))
  }

  revalidatePath(`/cadastros/colaboradores/${colaboradorId}`)
  revalidatePath("/meus-pagamentos/fiscal")

  return resultado.success ? { success: true } : { success: false, error: resultado.mensagem || "Erro ao cadastrar na Focus NFe" }
}

/** Busca a nota fiscal (manual ou Focus) associada a um pedido, se existir. Usada pela UI
 *  do pagamento pra decidir o que mostrar (opções de emissão vs. status de uma já em curso). */
export async function obterNotaFiscalDoPedido(pedidoId: string) {
  const session = await getSession()
  if (!session) throw new Error("Usuário não autenticado")

  const [pedido] = await db
    .select({ colaboradorId: pedidosPagamento.colaboradorId, empresaId: pedidosPagamento.empresaId })
    .from(pedidosPagamento)
    .where(eq(pedidosPagamento.id, pedidoId))
  if (!pedido) return null

  const podeAdm = ["Adm", "Financeiro", "SuperAdmin"].includes(session.tipoAcesso)
  const ehProprio = pedido.colaboradorId === session.colaboradorId
  if (!podeAdm && !ehProprio) throw new Error("Sem permissão")

  const [nota] = await db.select().from(notasFiscais).where(eq(notasFiscais.pedidoId, pedidoId))
  return nota ? toNotaFiscalDTO(nota) : null
}

/** Link de emissão manual configurado pela própria empresa do usuário logado, se houver. */
export async function obterLinkEmissaoManual() {
  const session = await getSession()
  if (!session?.empresaId) return null

  const [empresa] = await db
    .select({ linkEmissaoManual: empresas.linkEmissaoManual })
    .from(empresas)
    .where(eq(empresas.id, session.empresaId))
  return empresa?.linkEmissaoManual || null
}

/** Solicita a emissão de NFS-e pelo FluWork (Focus NFe) pro pagamento. Só permitido depois
 *  da aprovação final (status "aprovado") e com o prestador já cadastrado na Focus. Impede
 *  duplicidade: reaproveita a linha existente se a última tentativa deu erro (permite
 *  "tentar novamente" sem violar o unique constraint em pedido_id). */
export async function emitirNfseFluWork(pedidoId: string) {
  const session = await getSession()
  if (!session) return { success: false, error: "Não autenticado" }

  const [pedido] = await db.select().from(pedidosPagamento).where(eq(pedidosPagamento.id, pedidoId))
  if (!pedido) return { success: false, error: "Pedido não encontrado" }
  if (pedido.colaboradorId !== session.colaboradorId) return { success: false, error: "Sem permissão" }
  if (pedido.status !== "aprovado") {
    return { success: false, error: "Só é possível emitir depois da aprovação final do pagamento" }
  }

  const [colaborador] = await db.select().from(colaboradores).where(eq(colaboradores.id, pedido.colaboradorId))
  if (!colaborador) return { success: false, error: "Prestador não encontrado" }
  if (colaborador.focusStatusCadastro !== "cadastrado" || !colaborador.cnpj || !colaborador.inscricaoMunicipal) {
    return { success: false, error: "Complete sua configuração fiscal antes de emitir pelo FluWork" }
  }

  const [empresa] = await db.select().from(empresas).where(eq(empresas.id, pedido.empresaId))
  if (!empresa) return { success: false, error: "Empresa não encontrada" }
  if (
    !empresa.enderecoLogradouro ||
    !empresa.enderecoNumero ||
    !empresa.enderecoBairro ||
    !empresa.enderecoCidade ||
    !empresa.enderecoUf ||
    !empresa.enderecoCep
  ) {
    return { success: false, error: "A empresa precisa completar o endereço fiscal antes de emitir NFS-e (Configurações)" }
  }
  if (!empresa.codigoServicoPadrao || !empresa.discriminacaoServicoPadrao || empresa.aliquotaIssPadrao == null) {
    return { success: false, error: "A empresa precisa configurar código de serviço e alíquota ISS antes de emitir NFS-e (Configurações)" }
  }

  let codigoMunicipioIbge = empresa.codigoMunicipioIbge
  if (!codigoMunicipioIbge) {
    codigoMunicipioIbge = await resolverCodigoMunicipio(empresa.enderecoCidade, empresa.enderecoUf)
    if (codigoMunicipioIbge) {
      await db.update(empresas).set({ codigoMunicipioIbge }).where(eq(empresas.id, empresa.id))
    }
  }
  if (!codigoMunicipioIbge) {
    return { success: false, error: "Não foi possível identificar o código do município da empresa" }
  }

  const [notaExistente] = await db.select().from(notasFiscais).where(eq(notasFiscais.pedidoId, pedidoId))
  if (notaExistente) {
    if (notaExistente.origem === "manual") {
      return { success: false, error: "Já existe uma nota manual anexada para este pagamento" }
    }
    if (notaExistente.focusStatus && notaExistente.focusStatus !== "erro_autorizacao") {
      return { success: false, error: "Já existe uma emissão em andamento ou concluída para este pagamento" }
    }
  }

  const ref = notaExistente?.focusRef || crypto.randomUUID()
  const agora = new Date()

  if (notaExistente) {
    await db
      .update(notasFiscais)
      .set({
        focusStatus: "processando_autorizacao",
        focusMotivoErro: null,
        valorServico: pedido.valorTotal,
        competenciaMes: agora.getMonth() + 1,
        competenciaAno: agora.getFullYear(),
        updatedAt: agora,
      })
      .where(eq(notasFiscais.id, notaExistente.id))
  } else {
    await db.insert(notasFiscais).values({
      empresaId: pedido.empresaId,
      pedidoId,
      colaboradorId: pedido.colaboradorId,
      origem: "focus_nfe",
      focusRef: ref,
      focusStatus: "processando_autorizacao",
      competenciaMes: agora.getMonth() + 1,
      competenciaAno: agora.getFullYear(),
      valorServico: pedido.valorTotal,
      cpfCnpjPrestador: colaborador.cnpj,
    })
  }

  const [notaRow] = await db.select({ id: notasFiscais.id }).from(notasFiscais).where(eq(notasFiscais.pedidoId, pedidoId))

  const resultado = await emitirNfse(
    ref,
    {
      prestadorCnpj: colaborador.cnpj,
      prestadorInscricaoMunicipal: colaborador.inscricaoMunicipal,
      tomador: {
        cnpj: empresa.cnpj,
        razaoSocial: empresa.razaoSocial,
        email: empresa.email,
        endereco: {
          logradouro: empresa.enderecoLogradouro,
          numero: empresa.enderecoNumero,
          complemento: empresa.enderecoComplemento,
          bairro: empresa.enderecoBairro,
          cep: empresa.enderecoCep,
          cidade: empresa.enderecoCidade,
          uf: empresa.enderecoUf,
          codigoMunicipioIbge,
        },
      },
      servico: {
        discriminacao: empresa.discriminacaoServicoPadrao,
        codigoServico: empresa.codigoServicoPadrao,
        aliquota: Number(empresa.aliquotaIssPadrao),
        issRetido: Boolean(empresa.issRetidoPadrao),
        valor: Number(pedido.valorTotal),
        codigoMunicipioPrestacao: codigoMunicipioIbge,
      },
      optanteSimplesNacional: colaborador.regimeTributario === "simples_nacional" || colaborador.regimeTributario === "simples_nacional_excesso",
    },
    { notaFiscalId: notaRow!.id, colaboradorId: colaborador.id },
  )

  if (!resultado.success) {
    await db
      .update(notasFiscais)
      .set({
        focusStatus: "erro_autorizacao",
        focusMotivoErro: resultado.mensagem || "Erro ao solicitar emissão",
        focusRawResponse: resultado.erros ? { erros: resultado.erros } : null,
        updatedAt: new Date(),
      })
      .where(eq(notasFiscais.id, notaRow!.id))
    revalidatePath("/meus-pagamentos")
    return { success: false, error: resultado.mensagem || "Erro ao solicitar emissão" }
  }

  revalidatePath("/meus-pagamentos")
  return { success: true }
}

/** Consulta o status atual da emissão na Focus NFe e atualiza nossa linha — usada pelo
 *  webhook, pelo fallback de polling e pelo botão "Atualizar status" na UI. Nunca confia
 *  cegamente no corpo do webhook: sempre confirma aqui antes de gravar qualquer mudança.
 *  NOTA: os nomes de campo da resposta da Focus (status, numero, url_download_pdf, etc.)
 *  seguem a convenção documentada da API v2 — conferir contra um retorno real de sandbox
 *  antes de operar em produção e ajustar se algum nome estiver diferente. */
export async function consultarEAtualizarStatusEmissao(notaFiscalId: string) {
  const [nota] = await db.select().from(notasFiscais).where(eq(notasFiscais.id, notaFiscalId))
  if (!nota || nota.origem !== "focus_nfe" || !nota.focusRef) {
    return { success: false, error: "Nota não encontrada ou não é uma emissão Focus NFe" }
  }

  const resultado = await consultarNfse(nota.focusRef, {
    notaFiscalId: nota.id,
    colaboradorId: nota.colaboradorId || undefined,
  })

  if (!resultado.success) {
    return { success: false, error: resultado.mensagem }
  }

  const data = resultado.data as Record<string, any>
  const statusFocus = data?.status as string | undefined
  const agora = new Date()

  if (statusFocus === "autorizado") {
    let arquivoPdfUrl = nota.arquivoPdfUrl
    let arquivoXmlUrl = nota.arquivoXmlUrl

    const urlPdf = data.url_download_pdf || data.caminho_pdf
    if (urlPdf) {
      const buffer = await baixarArquivoFocus(urlPdf)
      if (buffer) {
        const path = await uploadFile(buffer, `nota-fiscal/focus-${nota.focusRef}.pdf`, "application/pdf")
        arquivoPdfUrl = `/api/files/${path}`
      }
    }
    const urlXml = data.url_download_xml || data.caminho_xml_nota_fiscal
    if (urlXml) {
      const buffer = await baixarArquivoFocus(urlXml)
      if (buffer) {
        const path = await uploadFile(buffer, `nota-fiscal/focus-${nota.focusRef}.xml`, "application/xml")
        arquivoXmlUrl = `/api/files/${path}`
      }
    }

    await db
      .update(notasFiscais)
      .set({
        focusStatus: "autorizado",
        numeroNfse: data.numero || data.numero_nfse || null,
        focusNumeroRps: data.numero_rps || null,
        focusSerieRps: data.serie_rps || null,
        chaveAcesso: data.codigo_verificacao || null,
        arquivoPdfUrl,
        arquivoXmlUrl,
        focusRawResponse: data,
        updatedAt: agora,
      })
      .where(eq(notasFiscais.id, nota.id))

    if (nota.pedidoId) {
      await db
        .update(pedidosPagamento)
        .set({
          notaEmitida: true,
          dataEmissaoNota: agora,
          notaFiscalUrl: arquivoPdfUrl,
          status: "nota_recebida",
          dataNotaRecebida: agora,
        })
        .where(eq(pedidosPagamento.id, nota.pedidoId))
    }
  } else if (statusFocus === "erro_autorizacao") {
    const mensagemErro =
      data?.mensagem_erro ||
      (Array.isArray(data?.erros) ? data.erros.map((e: any) => e?.mensagem).filter(Boolean).join("; ") : null) ||
      "Erro na autorização da nota"
    await db
      .update(notasFiscais)
      .set({ focusStatus: "erro_autorizacao", focusMotivoErro: mensagemErro, focusRawResponse: data, updatedAt: agora })
      .where(eq(notasFiscais.id, nota.id))
  } else if (statusFocus === "cancelado") {
    await db
      .update(notasFiscais)
      .set({ focusStatus: "cancelado", focusRawResponse: data, updatedAt: agora })
      .where(eq(notasFiscais.id, nota.id))
  }
  // "processando_autorizacao" (ou status desconhecido): nada muda, ainda não resolveu.

  revalidatePath("/meus-pagamentos")
  return { success: true, status: statusFocus }
}
