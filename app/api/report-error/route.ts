import { NextResponse, type NextRequest } from "next/server"

// Recebe erros não tratados do client (app/global-error.tsx) e os registra em
// formato estruturado no stdout. O Cloud Run encaminha stdout/stderr para o Cloud
// Logging automaticamente, e o Cloud Error Reporting detecta e agrupa entradas
// com severity=ERROR + stack trace sem precisar de nenhuma biblioteca extra.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, stack, digest, pathname } = body as {
      message?: string
      stack?: string
      digest?: string
      pathname?: string
    }

    console.error(
      JSON.stringify({
        severity: "ERROR",
        message: stack ? `${message ?? "Erro desconhecido"}\n${stack}` : message ?? "Erro desconhecido",
        serviceContext: { service: "fluworkbr" },
        context: {
          httpRequest: { url: pathname },
          reportLocation: digest ? { functionName: digest } : undefined,
        },
      }),
    )

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 })
  }
}
