import { type NextRequest, NextResponse } from "next/server"
import { uploadFile } from "@/lib/gcs"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "Nenhum arquivo fornecido" }, { status: 400 })
    }

    const fileName = file.name.toLowerCase()
    const hasValidExtension = fileName.endsWith(".pdf") || fileName.endsWith(".xml")
    const hasValidType =
      file.type === "application/pdf" ||
      file.type === "text/xml" ||
      file.type === "application/xml"
    // Em dispositivos móveis, o MIME type pode vir vazio - validar pela extensão também
    const isValidFile = hasValidType || hasValidExtension

    if (!isValidFile) {
      return NextResponse.json({ error: "Apenas arquivos PDF ou XML são permitidos" }, { status: 400 })
    }

    // Validar tamanho máximo (10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: "Arquivo muito grande. Máximo 10MB" }, { status: 400 })
    }

    // Sanitizar nome do arquivo para evitar caracteres problemáticos
    const safeFileName = file.name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // remove acentos
      .replace(/[^a-zA-Z0-9._-]/g, "_") // substitui especiais por underscore
      .toLowerCase()

    const timestamp = Date.now()
    const filename = `nota-fiscal-${timestamp}-${safeFileName}`

    const contentType =
      file.type === "application/pdf" || fileName.endsWith(".pdf")
        ? "application/pdf"
        : "application/xml"

    const buffer = Buffer.from(await file.arrayBuffer())
    const objectPath = await uploadFile(buffer, `nota-fiscal/${filename}`, contentType)

    return NextResponse.json({
      url: `/api/files/${objectPath}`,
      filename: file.name,
      size: file.size,
    })
  } catch (error) {
    console.error("[v0] Erro no upload de nota fiscal:", error)
    const message = error instanceof Error ? error.message : "Erro desconhecido"
    return NextResponse.json({ error: `Falha no upload: ${message}` }, { status: 500 })
  }
}
