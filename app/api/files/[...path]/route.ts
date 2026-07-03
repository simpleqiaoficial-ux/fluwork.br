import { NextResponse, type NextRequest } from "next/server"
import { getSession } from "@/lib/session"
import { getSignedDownloadUrl } from "@/lib/gcs"

export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const session = await getSession()

  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }

  const { path } = await params
  const objectPath = path.map(decodeURIComponent).join("/")

  try {
    const signedUrl = await getSignedDownloadUrl(objectPath)
    return NextResponse.redirect(signedUrl)
  } catch (error) {
    console.error("[gcs] Erro ao gerar URL assinada:", error)
    return NextResponse.json({ error: "Arquivo não encontrado" }, { status: 404 })
  }
}
