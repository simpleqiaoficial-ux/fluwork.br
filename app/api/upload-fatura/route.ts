import { type NextRequest, NextResponse } from "next/server"
import { uploadFile } from "@/lib/gcs"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file || file.size === 0) {
      return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 })
    }

    // Validar tipo de arquivo — em mobile o MIME pode vir vazio, então valida também pela extensão
    const fileName = file.name.toLowerCase()
    const hasValidExtension = fileName.endsWith(".pdf")
    const hasValidType = file.type === "application/pdf" || file.type === "application/octet-stream"
    if (!hasValidType && !hasValidExtension) {
      return NextResponse.json({ error: "Apenas arquivos PDF são permitidos" }, { status: 400 })
    }

    // Validar tamanho (max 10MB)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json({ error: "Arquivo muito grande. Máximo 10MB" }, { status: 400 })
    }

    // Sanitizar nome do arquivo para evitar caracteres problemáticos
    const safeFileName = file.name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // remove acentos
      .replace(/[^a-zA-Z0-9._-]/g, "_") // substitui especiais por underscore
      .toLowerCase()

    const uniqueFileName = `faturas/${Date.now()}-${safeFileName}`

    // Upload para o Google Cloud Storage (bucket privado)
    const buffer = Buffer.from(await file.arrayBuffer())
    const objectPath = await uploadFile(buffer, uniqueFileName, "application/pdf")

    return NextResponse.json({ url: `/api/files/${objectPath}` })
  } catch (error) {
    console.error("[v0] Erro no upload de fatura:", error)
    const message = error instanceof Error ? error.message : "Erro desconhecido"
    return NextResponse.json({ error: `Erro ao fazer upload do arquivo: ${message}` }, { status: 500 })
  }
}
