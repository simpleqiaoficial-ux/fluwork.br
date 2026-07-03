"use server"

import { parseNFSeXML, parseNFSePDF } from "@/lib/nfse-parser"
import type { DadosNFSeExtraidos } from "@/lib/nfse-parser"

/**
 * Action para fazer parse de arquivo XML de NFS-e
 */
export async function parseNFSeFile(fileContent: string, fileType: "xml" | "pdf", fileUrl?: string) {
  try {
    let dados: DadosNFSeExtraidos

    if (fileType === "xml") {
      dados = await parseNFSeXML(fileContent)
    } else if (fileType === "pdf" && fileUrl) {
      dados = await parseNFSePDF(fileUrl)
    } else {
      throw new Error("Tipo de arquivo não suportado")
    }

    return {
      success: true,
      dados,
    }
  } catch (error) {
    console.error("[v0] Erro ao fazer parse da NFS-e:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro ao processar arquivo",
    }
  }
}
