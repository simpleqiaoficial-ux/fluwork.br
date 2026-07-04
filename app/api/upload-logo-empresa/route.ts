import { type NextRequest, NextResponse } from "next/server"
import { uploadFile } from "@/lib/gcs"
import { getSession } from "@/lib/session"

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session || session.tipoAcesso !== "Adm" || !session.empresaId) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file || file.size === 0) {
      return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 })
    }

    const fileName = file.name.toLowerCase()
    const extensoesValidas = [".png", ".jpg", ".jpeg", ".svg"]
    const hasValidExtension = extensoesValidas.some((ext) => fileName.endsWith(ext))
    const hasValidType = ["image/png", "image/jpeg", "image/svg+xml"].includes(file.type)
    if (!hasValidType && !hasValidExtension) {
      return NextResponse.json({ error: "Apenas imagens PNG, JPG ou SVG são permitidas" }, { status: 400 })
    }

    const maxSize = 2 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json({ error: "Arquivo muito grande. Máximo 2MB" }, { status: 400 })
    }

    const normalized = file.name.normalize("NFD")
    const withoutAccents = normalized.split("").filter((ch) => {
      const code = ch.codePointAt(0) || 0
      return !(code >= 0x0300 && code <= 0x036f)
    }).join("")
    const safeFileName = withoutAccents.replace(/[^a-zA-Z0-9._-]/g, "_").toLowerCase()

    const objectPath = `empresas/${session.empresaId}/logo-${Date.now()}-${safeFileName}`

    const buffer = Buffer.from(await file.arrayBuffer())
    await uploadFile(buffer, objectPath, file.type || "application/octet-stream")

    return NextResponse.json({ url: `/api/logos/${objectPath}` })
  } catch (error) {
    console.error("[upload-logo-empresa] Erro no upload:", error)
    const message = error instanceof Error ? error.message : "Erro desconhecido"
    return NextResponse.json({ error: `Erro ao fazer upload da logo: ${message}` }, { status: 500 })
  }
}
