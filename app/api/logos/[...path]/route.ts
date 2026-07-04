import { NextResponse, type NextRequest } from "next/server"
import { getSignedDownloadUrl } from "@/lib/gcs"

// Proxy PÚBLICO (sem sessão) — só serve o que estiver sob "empresas/", que é onde ficam
// logo/papel timbrado das empresas clientes. Precisa ser público porque o logo aparece tanto
// no preview em tela quanto no PDF gerado no servidor e na página pública de assinatura
// (nenhum desses tem sessão de usuário). Nunca reaproveitar isto para servir outros prefixos
// (contratos/, notas-fiscal/ etc. continuam exclusivamente atrás de /api/files, que exige sessão).
export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params
  const objectPath = path.map(decodeURIComponent).join("/")

  if (!objectPath.startsWith("empresas/")) {
    return NextResponse.json({ error: "Caminho não permitido" }, { status: 403 })
  }

  try {
    const signedUrl = await getSignedDownloadUrl(objectPath, 60)
    return NextResponse.redirect(signedUrl)
  } catch (error) {
    console.error("[logos] Erro ao gerar URL assinada:", error)
    return NextResponse.json({ error: "Arquivo não encontrado" }, { status: 404 })
  }
}
