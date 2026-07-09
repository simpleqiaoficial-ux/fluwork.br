import { NextResponse, type NextRequest } from "next/server"
import { and, eq, or, sql } from "drizzle-orm"
import { getSession } from "@/lib/session"
import { downloadFile } from "@/lib/gcs"
import { db } from "@/lib/db"
import { contracts, contractSigners } from "@/lib/db/schema"

const ADMIN_ROLES = ["Adm", "Financeiro"]

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }

  const { id } = await params
  const [contrato] = await db.select().from(contracts).where(eq(contracts.id, id))

  if (!contrato || !contrato.pdfSignedPath) {
    return NextResponse.json({ error: "Contrato assinado não encontrado" }, { status: 404 })
  }

  if (!ADMIN_ROLES.includes(session.tipoAcesso)) {
    const [signer] = await db
      .select({ id: contractSigners.id })
      .from(contractSigners)
      .where(
        and(
          eq(contractSigners.contractId, id),
          or(
            eq(contractSigners.colaboradorId, session.colaboradorId),
            sql`lower(${contractSigners.email}) = lower(${session.email})`,
          ),
        ),
      )

    if (!signer) {
      return NextResponse.json({ error: "Sem permissão para acessar este contrato" }, { status: 403 })
    }
  }

  const arquivo = await downloadFile(contrato.pdfSignedPath)
  if (!arquivo) {
    return NextResponse.json({ error: "Arquivo não encontrado" }, { status: 404 })
  }

  return new NextResponse(new Uint8Array(arquivo.buffer), {
    headers: {
      "Content-Type": arquivo.contentType,
      "Content-Disposition": `inline; filename="contrato-${contrato.numero}.pdf"`,
      "Cache-Control": "private, max-age=0, no-store",
    },
  })
}
