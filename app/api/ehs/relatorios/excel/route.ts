import { NextResponse } from "next/server"
import { gerarWorkbookEhs } from "@/lib/ehs/exportacao-excel"

export async function GET() {
  try {
    const buffer = await gerarWorkbookEhs()
    const data = new Date().toISOString().slice(0, 10)

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="relatorio-ehs-${data}.xlsx"`,
        "Cache-Control": "private, max-age=0, no-store",
      },
    })
  } catch (error) {
    console.error("[ehs] Erro ao gerar Excel:", error)
    return NextResponse.json({ error: "Erro ao gerar relatório" }, { status: 500 })
  }
}
