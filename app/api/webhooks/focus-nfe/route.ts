import { NextRequest, NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { notasFiscais } from "@/lib/db/schema"
import { consultarEAtualizarStatusEmissao } from "@/app/actions/focus-nfe"

// Recebe a notificação da Focus NFe quando o status de uma emissão muda. Rota pública (sem
// cookie de sessão) — autenticada por segredo compartilhado, não por login. Nunca confia no
// corpo do webhook: só usa o `ref` pra identificar a nota e sempre confirma via consulta
// direta à API (consultarEAtualizarStatusEmissao), que é a mesma função usada pelo fallback
// de polling e pelo botão "Atualizar status" da UI.
export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-webhook-secret") || request.nextUrl.searchParams.get("secret")
  if (!secret || secret !== process.env.FOCUS_NFE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 })
  }

  const ref = body?.ref as string | undefined
  if (!ref) {
    return NextResponse.json({ error: "missing ref" }, { status: 400 })
  }

  const [nota] = await db.select({ id: notasFiscais.id }).from(notasFiscais).where(eq(notasFiscais.focusRef, ref))
  if (!nota) {
    // Referência desconhecida (ex.: webhook de ambiente diferente) — responde 200 pra Focus
    // não ficar retentando, só ignora.
    return NextResponse.json({ ok: true })
  }

  await consultarEAtualizarStatusEmissao(nota.id)

  return NextResponse.json({ ok: true })
}
