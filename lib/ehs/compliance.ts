import { calcularSituacaoValidade } from "@/lib/ehs/validade"

// Compliance Score de um prestador — calculado em tempo de leitura a partir dos documentos
// que ele realmente tem cadastrados (nunca inventa um total "obrigatório" fixo). Um documento
// conta como conforme quando está com status "valido" e a data de validade (se houver) ainda
// não passou; "próximo de vencer" não derruba o score, só sinaliza o alerta visual (amarelo).

export interface DocumentoParaCompliance {
  status: string
  dataValidade: string | Date | null
}

export interface ComplianceResultado {
  /** null quando o prestador ainda não tem nenhum documento cadastrado. */
  score: number | null
  cor: "verde" | "amarelo" | "vermelho" | "cinza"
  total: number
  validos: number
  vencidos: number
  proximosVencer: number
}

export function calcularComplianceDocumentos(documentos: DocumentoParaCompliance[]): ComplianceResultado {
  if (documentos.length === 0) {
    return { score: null, cor: "cinza", total: 0, validos: 0, vencidos: 0, proximosVencer: 0 }
  }

  let vencidos = 0
  let proximosVencer = 0

  for (const documento of documentos) {
    if (documento.status === "rejeitado") {
      vencidos++
      continue
    }
    const situacao = calcularSituacaoValidade(documento.dataValidade)
    if (situacao.chave === "vencido") {
      vencidos++
    } else if (["vence_7", "vence_15", "vence_30"].includes(situacao.chave)) {
      proximosVencer++
    }
  }

  const total = documentos.length
  const validos = total - vencidos
  const score = Math.round((validos / total) * 100)
  const cor = vencidos > 0 ? "vermelho" : proximosVencer > 0 ? "amarelo" : "verde"

  return { score, cor, total, validos, vencidos, proximosVencer }
}
