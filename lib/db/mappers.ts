// Mapeia as linhas do Drizzle (camelCase, seguindo lib/db/schema.ts) para o formato
// snake_case que os componentes e types/*.ts sempre esperaram (herdado do Supabase JS
// client, que retornava as colunas Postgres cruas). Mantém o contrato de dados idêntico
// ao anterior para não quebrar nenhum componente durante a migração para Drizzle.

import { calcularSituacaoVigencia } from "@/lib/contracts/vigencia"

type AnyRow = Record<string, any>

export function toEmpresaDTO(row: AnyRow) {
  if (!row) return row
  return {
    id: row.id,
    razao_social: row.razaoSocial,
    nome_fantasia: row.nomeFantasia,
    cnpj: row.cnpj,
    email: row.email,
    telefone: row.telefone,
    endereco: row.endereco,
    logo_url: row.logoUrl,
    papel_timbrado_url: row.papelTimbradoUrl,
    rodape_contrato: row.rodapeContrato,
    representante_nome: row.representanteNome,
    representante_documento: row.representanteDocumento,
    representante_cargo: row.representanteCargo,
    status: row.status,
    created_at: row.createdAt,
    updated_at: row.updatedAt,
  }
}

export function toColaboradorDTO(row: AnyRow) {
  if (!row) return row
  return {
    id: row.id,
    empresa_id: row.empresaId,
    nome_completo: row.nomeCompleto,
    salario: row.salario == null ? row.salario : Number(row.salario),
    cnpj: row.cnpj,
    razao_social: row.razaoSocial,
    data_abertura: row.dataAbertura,
    endereco_cep: row.enderecoCep,
    endereco_logradouro: row.enderecoLogradouro,
    endereco_numero: row.enderecoNumero,
    endereco_complemento: row.enderecoComplemento,
    endereco_bairro: row.enderecoBairro,
    endereco_cidade: row.enderecoCidade,
    endereco_uf: row.enderecoUf,
    data_nascimento: row.dataNascimento,
    data_aniversario_contrato: row.dataAniversarioContrato,
    email: row.email,
    user_id: row.userId,
    tipo_acesso: row.tipoAcesso,
    equipe_id: row.equipeId,
    dia_pagamento: row.diaPagamento,
    chave_pix: row.chavePix,
    tipo_chave_pix: row.tipoChavePix,
    centro_custo_id: row.centroCustoId,
    senha_hash: row.senhaHash,
    created_at: row.createdAt,
    ...(row.equipe !== undefined && { equipe: row.equipe ? { id: row.equipe.id, nome: row.equipe.nome } : row.equipe }),
    ...(row.centroCusto !== undefined && {
      centro_custo: row.centroCusto
        ? { id: row.centroCusto.id, numero: row.centroCusto.numero, nome: row.centroCusto.nome }
        : row.centroCusto,
    }),
  }
}

export function toCentroCustoDTO(row: AnyRow) {
  if (!row) return row
  return {
    id: row.id,
    empresa_id: row.empresaId,
    numero: row.numero,
    nome: row.nome,
    created_at: row.createdAt,
  }
}

export function toEquipeDTO(row: AnyRow) {
  if (!row) return row
  return {
    id: row.id,
    empresa_id: row.empresaId,
    nome: row.nome,
    supervisor_id: row.supervisorId,
    created_at: row.createdAt,
    ...(row.supervisor !== undefined && {
      supervisor: row.supervisor
        ? { id: row.supervisor.id, nome_completo: row.supervisor.nomeCompleto }
        : row.supervisor,
    }),
    ...(row.gerentes !== undefined && { gerentes: row.gerentes }),
  }
}

export function toPedidoDTO(row: AnyRow) {
  if (!row) return row
  return {
    id: row.id,
    empresa_id: row.empresaId,
    colaborador_id: row.colaboradorId,
    tipo_pedido: row.tipoPedido,
    horas_extras: row.horasExtras == null ? row.horasExtras : Number(row.horasExtras),
    horas_extras_50: row.horasExtras50 == null ? row.horasExtras50 : Number(row.horasExtras50),
    horas_extras_100: row.horasExtras100 == null ? row.horasExtras100 : Number(row.horasExtras100),
    motivo_horas_extras: row.motivoHorasExtras,
    valor_km: row.valorKm == null ? row.valorKm : Number(row.valorKm),
    conducao: row.conducao == null ? row.conducao : Number(row.conducao),
    valor_plantao: row.valorPlantao == null ? row.valorPlantao : Number(row.valorPlantao),
    motivo_plantao: row.motivoPlantao,
    comissao: row.comissao == null ? row.comissao : Number(row.comissao),
    motivo_comissao: row.motivoComissao,
    valor_total: row.valorTotal == null ? row.valorTotal : Number(row.valorTotal),
    valor_desconto: row.valorDesconto == null ? row.valorDesconto : Number(row.valorDesconto),
    motivo_desconto: row.motivoDesconto,
    created_at: row.createdAt,
    status: row.status,
    aprovado_gerente: row.aprovadoGerente,
    aprovado_financeiro: row.aprovadoFinanceiro,
    observacao_gerente: row.observacaoGerente,
    observacao_financeiro: row.observacaoFinanceiro,
    data_aprovacao_gerente: row.dataAprovacaoGerente,
    data_aprovacao_financeiro: row.dataAprovacaoFinanceiro,
    data_previsao_pagamento: row.dataPrevisaoPagamento,
    criado_por_colaborador_id: row.criadoPorColaboradorId,
    salario_base: row.salarioBase == null ? row.salarioBase : Number(row.salarioBase),
    nota_emitida: row.notaEmitida,
    data_emissao_nota: row.dataEmissaoNota,
    nota_fiscal_url: row.notaFiscalUrl,
    nota_fiscal_anexada: row.notaFiscalAnexada,
    data_limite_anexo_nota: row.dataLimiteAnexoNota,
    data_nota_recebida: row.dataNotaRecebida,
    prorrogacao_solicitada: row.prorrogacaoSolicitada,
    motivo_prorrogacao: row.motivoProrrogacao,
    data_solicitacao_prorrogacao: row.dataSolicitacaoProrrogacao,
    prorrogacao_aprovada: row.prorrogacaoAprovada,
    observacao_prorrogacao: row.observacaoProrrogacao,
    correcao_solicitada_por: row.correcaoSolicitadaPor,
    aprovado_por_gerente_id: row.aprovadoPorGerenteId,
    aprovado_por_financeiro_id: row.aprovadoPorFinanceiroId,
    ...(row.criadoPor !== undefined && {
      criado_por: row.criadoPor
        ? { nome_completo: row.criadoPor.nomeCompleto, tipo_acesso: row.criadoPor.tipoAcesso }
        : row.criadoPor,
    }),
    ...(row.aprovadoPorGerente !== undefined && {
      aprovado_por_gerente: row.aprovadoPorGerente
        ? { id: row.aprovadoPorGerente.id, nome_completo: row.aprovadoPorGerente.nomeCompleto }
        : row.aprovadoPorGerente,
    }),
    ...(row.aprovadoPorFinanceiro !== undefined && {
      aprovado_por_financeiro: row.aprovadoPorFinanceiro
        ? { id: row.aprovadoPorFinanceiro.id, nome_completo: row.aprovadoPorFinanceiro.nomeCompleto }
        : row.aprovadoPorFinanceiro,
    }),
    ...(row.notaFiscal !== undefined && {
      // O Supabase/PostgREST sempre retornava o embedded select reverso (pedido -> notas_fiscais)
      // como ARRAY (mesmo com no máximo 1 item, por causa da constraint UNIQUE(pedido_id)).
      // Vários componentes (financeiro-list.tsx, etc.) fazem .length/.[0] em cima disso — manter
      // como array preserva o contrato original.
      notas_fiscais: row.notaFiscal
        ? [
            {
              arquivo_url: row.notaFiscal.arquivoXmlUrl,
              arquivo_xml_url: row.notaFiscal.arquivoXmlUrl,
              arquivo_pdf_url: row.notaFiscal.arquivoPdfUrl,
              created_at: row.notaFiscal.createdAt,
            },
          ]
        : [],
    }),
    ...(row.colaborador !== undefined && {
      colaborador: row.colaborador
        ? {
            nome_completo: row.colaborador.nomeCompleto,
            salario: row.colaborador.salario == null ? row.colaborador.salario : Number(row.colaborador.salario),
            tipo_acesso: row.colaborador.tipoAcesso,
            equipe_id: row.colaborador.equipeId,
            centro_custo_id: row.colaborador.centroCustoId,
            cnpj: row.colaborador.cnpj,
            ...(row.colaborador.equipe !== undefined && {
              equipe: row.colaborador.equipe
                ? { id: row.colaborador.equipe.id, nome: row.colaborador.equipe.nome }
                : row.colaborador.equipe,
            }),
            ...(row.colaborador.centroCusto !== undefined && {
              centro_custo: row.colaborador.centroCusto
                ? {
                    id: row.colaborador.centroCusto.id,
                    numero: row.colaborador.centroCusto.numero,
                    nome: row.colaborador.centroCusto.nome,
                  }
                : row.colaborador.centroCusto,
            }),
          }
        : row.colaborador,
    }),
  }
}

export function toNotaFiscalDTO(row: AnyRow) {
  if (!row) return row
  return {
    id: row.id,
    empresa_id: row.empresaId,
    pedido_id: row.pedidoId,
    colaborador_id: row.colaboradorId,
    numero_nfse: row.numeroNfse,
    chave_acesso: row.chaveAcesso,
    competencia_mes: row.competenciaMes,
    competencia_ano: row.competenciaAno,
    valor_servico: row.valorServico == null ? row.valorServico : Number(row.valorServico),
    cpf_cnpj_prestador: row.cpfCnpjPrestador,
    arquivo_url: row.arquivoXmlUrl,
    arquivo_xml_url: row.arquivoXmlUrl,
    arquivo_pdf_url: row.arquivoPdfUrl,
    validacao_identidade: row.validacaoIdentidade,
    validacao_competencia: row.validacaoCompetencia,
    validacao_valor: row.validacaoValor,
    validacao_duplicidade: row.validacaoDuplicidade,
    mensagem_validacao: row.mensagemValidacao,
    status: row.status,
    aprovado_por: row.aprovadoPor,
    data_aprovacao: row.dataAprovacao,
    observacao_financeiro: row.observacaoFinanceiro,
    created_at: row.createdAt,
    updated_at: row.updatedAt,
  }
}

export function toHistoricoReajusteDTO(row: AnyRow) {
  if (!row) return row
  return {
    id: row.id,
    empresa_id: row.empresaId,
    colaborador_id: row.colaboradorId,
    salario_anterior: row.salarioAnterior == null ? row.salarioAnterior : Number(row.salarioAnterior),
    salario_novo: row.salarioNovo == null ? row.salarioNovo : Number(row.salarioNovo),
    tipo_reajuste: row.tipoReajuste,
    valor_reajuste: row.valorReajuste == null ? row.valorReajuste : Number(row.valorReajuste),
    motivo: row.motivo,
    aplicado_por: row.aplicadoPor,
    created_at: row.createdAt,
    ...(row.colaborador !== undefined && {
      colaborador: row.colaborador ? { nome_completo: row.colaborador.nomeCompleto } : row.colaborador,
    }),
    ...(row.aplicadoPorColaborador !== undefined && {
      aplicador: row.aplicadoPorColaborador
        ? { nome_completo: row.aplicadoPorColaborador.nomeCompleto }
        : row.aplicadoPorColaborador,
    }),
  }
}

export function toTermsAcceptanceDTO(row: AnyRow) {
  if (!row) return row
  return {
    id: row.id,
    empresa_id: row.empresaId,
    user_id: row.userId,
    version: row.version,
    accepted: row.accepted,
    accepted_at: row.acceptedAt,
    ip_address: row.ipAddress,
    device_info: row.deviceInfo,
    user_agent: row.userAgent,
    created_at: row.createdAt,
    ...(row.colaborador !== undefined && {
      colaborador: row.colaborador
        ? { nome_completo: row.colaborador.nomeCompleto, email: row.colaborador.email }
        : row.colaborador,
    }),
  }
}

export function toBoletoDTO(row: AnyRow) {
  if (!row) return row
  return {
    id: row.id,
    empresa_id: row.empresaId,
    numero_boleto: row.numeroBoleto,
    banco: row.banco,
    agencia: row.agencia,
    conta: row.conta,
    tipo: row.tipoBoleto,
    centro_custo_id: row.centroCustoId,
    ativo: row.ativo,
    criado_em: row.createdAt,
    atualizado_em: row.updatedAt,
    ...(row.centroCusto !== undefined && {
      centro_custo: row.centroCusto ? { id: row.centroCusto.id, nome: row.centroCusto.nome } : row.centroCusto,
    }),
  }
}

export function toContratoTemplateDTO(row: AnyRow) {
  if (!row) return row
  return {
    id: row.id,
    empresa_id: row.empresaId,
    nome: row.nome,
    slug: row.slug,
    versao: row.versao,
    ativo: row.ativo,
    corpo: row.corpo,
    campos_variaveis: row.camposVariaveis,
    created_at: row.createdAt,
    updated_at: row.updatedAt,
  }
}

export function toContratoDTO(row: AnyRow) {
  if (!row) return row
  return {
    id: row.id,
    empresa_id: row.empresaId,
    template_id: row.templateId,
    numero: row.numero,
    prestador_colaborador_id: row.prestadorColaboradorId,
    equipe_id: row.equipeId,
    prestador_nome: row.prestadorNome,
    prestador_cpf_cnpj: row.prestadorCpfCnpj,
    prestador_email: row.prestadorEmail,
    prestador_endereco: row.prestadorEndereco,
    tipo_servico: row.tipoServico,
    valor: row.valor == null ? row.valor : Number(row.valor),
    prazo: row.prazo,
    data_inicio: row.dataInicio,
    data_termino: row.dataTermino,
    renovacao_automatica: row.renovacaoAutomatica,
    tipo_renovacao: row.tipoRenovacao,
    periodo_renovacao_meses: row.periodoRenovacaoMeses,
    data_ultima_renovacao: row.dataUltimaRenovacao,
    clausulas_adicionais: row.clausulasAdicionais,
    status: row.status,
    situacao_vigencia: calcularSituacaoVigencia({ status: row.status, dataInicio: row.dataInicio, dataTermino: row.dataTermino }),
    versao_atual: row.versaoAtual,
    pdf_draft_path: row.pdfDraftPath,
    pdf_signed_path: row.pdfSignedPath,
    pdf_hash: row.pdfHash,
    enviado_em: row.enviadoEm,
    expira_em: row.expiraEm,
    visualizado_em: row.visualizadoEm,
    assinado_em: row.assinadoEm,
    recusado_em: row.recusadoEm,
    motivo_recusa: row.motivoRecusa,
    cancelado_em: row.canceladoEm,
    cancelado_por: row.canceladoPor,
    criado_por: row.criadoPor,
    created_at: row.createdAt,
    updated_at: row.updatedAt,
    ...(row.empresa !== undefined && { empresa: row.empresa ? toEmpresaDTO(row.empresa) : row.empresa }),
    ...(row.template !== undefined && { template: row.template ? toContratoTemplateDTO(row.template) : row.template }),
    ...(row.equipe !== undefined && {
      equipe: row.equipe ? { id: row.equipe.id, nome: row.equipe.nome } : row.equipe,
    }),
    ...(row.signers !== undefined && {
      signatarios: Array.isArray(row.signers) ? row.signers.map(toContratoSignatarioDTO) : row.signers,
    }),
    ...(row.events !== undefined && {
      eventos: Array.isArray(row.events) ? row.events.map(toContratoEventoDTO) : row.events,
    }),
    ...(row.attachments !== undefined && {
      anexos: Array.isArray(row.attachments) ? row.attachments.map(toContratoAnexoDTO) : row.attachments,
    }),
    ...(row.amendments !== undefined && {
      aditivos: Array.isArray(row.amendments) ? row.amendments.map(toContratoAditivoDTO) : row.amendments,
    }),
    ...(row.criadoPorColaborador !== undefined && {
      criador: row.criadoPorColaborador
        ? { nome_completo: row.criadoPorColaborador.nomeCompleto, email: row.criadoPorColaborador.email }
        : row.criadoPorColaborador,
    }),
  }
}

export function toContratoSignatarioDTO(row: AnyRow) {
  if (!row) return row
  return {
    id: row.id,
    contract_id: row.contractId,
    amendment_id: row.amendmentId,
    colaborador_id: row.colaboradorId,
    papel: row.papel,
    nome: row.nome,
    email: row.email,
    cpf_cnpj: row.cpfCnpj,
    status: row.status,
    token_expira_em: row.tokenExpiraEm,
    token_usado_em: row.tokenUsadoEm,
    primeira_visualizacao_em: row.primeiraVisualizacaoEm,
    ip_ultimo_acesso: row.ipUltimoAcesso,
    user_agent_ultimo_acesso: row.userAgentUltimoAcesso,
    created_at: row.createdAt,
    updated_at: row.updatedAt,
  }
}

export function toContratoEventoDTO(row: AnyRow) {
  if (!row) return row
  return {
    id: row.id,
    contract_id: row.contractId,
    amendment_id: row.amendmentId,
    signer_id: row.signerId,
    ator_colaborador_id: row.atorColaboradorId,
    tipo_evento: row.tipoEvento,
    ip_address: row.ipAddress,
    user_agent: row.userAgent,
    contract_versao: row.contractVersao,
    pdf_hash: row.pdfHash,
    email_snapshot: row.emailSnapshot,
    detalhes: row.detalhes,
    created_at: row.createdAt,
  }
}

export function toContratoAnexoDTO(row: AnyRow) {
  if (!row) return row
  return {
    id: row.id,
    contract_id: row.contractId,
    tipo: row.tipo,
    versao: row.versao,
    object_path: row.objectPath,
    hash_sha256: row.hashSha256,
    tamanho_bytes: row.tamanhoBytes,
    gerado_por: row.geradoPor,
    created_at: row.createdAt,
  }
}

export function toContratoAditivoDTO(row: AnyRow) {
  if (!row) return row
  return {
    id: row.id,
    contract_id: row.contractId,
    tipo: row.tipo,
    versao: row.versao,
    descricao: row.descricao,
    campos_alterados: row.camposAlterados,
    novo_valor: row.novoValor == null ? row.novoValor : Number(row.novoValor),
    nova_data_termino: row.novaDataTermino,
    novas_clausulas: row.novasClausulas,
    status: row.status,
    enviado_em: row.enviadoEm,
    visualizado_em: row.visualizadoEm,
    assinado_em: row.assinadoEm,
    recusado_em: row.recusadoEm,
    motivo_recusa: row.motivoRecusa,
    cancelado_em: row.canceladoEm,
    pdf_path: row.pdfPath,
    criado_por: row.criadoPor,
    created_at: row.createdAt,
    updated_at: row.updatedAt,
    ...(row.signers !== undefined && {
      signatarios: Array.isArray(row.signers) ? row.signers.map(toContratoSignatarioDTO) : row.signers,
    }),
    ...(row.events !== undefined && {
      eventos: Array.isArray(row.events) ? row.events.map(toContratoEventoDTO) : row.events,
    }),
  }
}

export function toSystemStatusDTO(row: AnyRow) {
  if (!row) return row
  return {
    id: row.id,
    is_active: row.isActive,
    suspended_reason: row.suspendedReason,
    suspended_at: row.suspendedAt,
    suspended_by: row.suspendedBy,
    reactivated_at: row.reactivatedAt,
    reactivated_by: row.reactivatedBy,
    created_at: row.createdAt,
    updated_at: row.updatedAt,
  }
}

export function toAuditLogDTO(row: AnyRow) {
  if (!row) return row
  return {
    id: row.id,
    empresa_id: row.empresaId,
    colaborador_id: row.colaboradorId,
    acao: row.acao,
    tabela: row.tabela,
    registro_id: row.registroId,
    detalhes: row.detalhes,
    ip_address: row.ipAddress,
    created_at: row.createdAt,
    ...(row.empresa !== undefined && {
      empresa: row.empresa ? { id: row.empresa.id, nome: row.empresa.nomeFantasia || row.empresa.razaoSocial } : row.empresa,
    }),
    ...(row.colaborador !== undefined && {
      colaborador: row.colaborador ? { id: row.colaborador.id, nome_completo: row.colaborador.nomeCompleto } : row.colaborador,
    }),
  }
}
