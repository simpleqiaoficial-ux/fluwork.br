"use server"

import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { colaboradores } from "@/lib/db/schema"
import { getUsuarioLogado } from "@/lib/auth-utils"
import { cadastrarEmpresaFocus, type EnderecoFocus } from "@/lib/focus-nfe"
import { resolverCodigoMunicipio } from "@/lib/ibge"

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
