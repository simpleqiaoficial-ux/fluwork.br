import { NextRequest, NextResponse } from "next/server"
import { and, eq, lt } from "drizzle-orm"
import { db } from "@/lib/db"
import { notasFiscais } from "@/lib/db/schema"
import { consultarEAtualizarStatusEmissao } from "@/app/actions/focus-nfe"

// Fallback de consulta de status pra quando o webhook da Focus NFe falha ou não chega —
// varre emissões "processando_autorizacao" há mais de 5 minutos e reconsulta cada uma.
// Protegida por segredo compartilhado (mesmo de app/api/webhooks/focus-nfe), chamada
// periodicamente por um Cloud Scheduler (configurado fora do repo).
export async function GET(request: NextRequest) {
  const secret = request.headers.get("x-cron-secret") || request.nextUrl.searchParams.get("secret")
  if (!secret || secret !== process.env.FOCUS_NFE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  const limite = new Date(Date.now() - 5 * 60 * 1000)

  const pendentes = await db
    .select({ id: notasFiscais.id })
    .from(notasFiscais)
    .where(
      and(
        eq(notasFiscais.origem, "focus_nfe"),
        eq(notasFiscais.focusStatus, "processando_autorizacao"),
        lt(notasFiscais.updatedAt, limite),
      ),
    )
    .limit(50)

  for (const nota of pendentes) {
    await consultarEAtualizarStatusEmissao(nota.id)
  }

  return NextResponse.json({ ok: true, verificadas: pendentes.length })
}
