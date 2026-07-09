import { NextResponse, type NextRequest } from "next/server"
import { getSession } from "@/lib/session"
import { downloadFile } from "@/lib/gcs"

// Proxy autenticado — baixa o arquivo no servidor e devolve os bytes pelo nosso próprio
// domínio. O usuário nunca vê a URL do bucket do Google Storage (nem via redirect pra ela).
export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const session = await getSession()

  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }

  const { path } = await params
  const objectPath = path.map(decodeURIComponent).join("/")

  const arquivo = await downloadFile(objectPath)
  if (!arquivo) {
    return NextResponse.json({ error: "Arquivo não encontrado" }, { status: 404 })
  }

  const nomeArquivo = objectPath.split("/").pop() || "arquivo"

  return new NextResponse(new Uint8Array(arquivo.buffer), {
    headers: {
      "Content-Type": arquivo.contentType,
      "Content-Disposition": `inline; filename="${nomeArquivo}"`,
      "Cache-Control": "private, max-age=0, no-store",
    },
  })
}
