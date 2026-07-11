import Link from "next/link"
import { redirect } from "next/navigation"
import { count, getTableName } from "drizzle-orm"
import { db } from "@/lib/db"
import { getUsuarioLogado } from "@/lib/auth-utils"
import { TABELAS_REGISTRADAS } from "@/lib/admin/tabelas-registry"
import { Card, CardContent } from "@/components/ui/card"
import { ChevronRight } from "lucide-react"

export default async function EspelhoDadosPage() {
  const usuario = await getUsuarioLogado()
  if (!usuario) redirect("/login")
  if (usuario.tipo_acesso !== "SuperAdmin") redirect("/")

  const tabelas = await Promise.all(
    TABELAS_REGISTRADAS.map(async (registro) => {
      const [{ total }] = await db.select({ total: count() }).from(registro.table)
      return { ...registro, slug: getTableName(registro.table), total: Number(total) }
    }),
  )

  const grupos = Array.from(new Set(tabelas.map((t) => t.grupo)))

  return (
    <div className="container mx-auto py-8 px-4 lg:px-6 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-xl font-semibold mb-1 text-foreground">Espelho de Dados</h1>
        <p className="text-sm text-muted-foreground">Visão somente leitura de todas as tabelas do banco de produção — {tabelas.length} tabelas</p>
      </div>

      <div className="space-y-8">
        {grupos.map((grupo) => (
          <div key={grupo}>
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">{grupo}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {tabelas
                .filter((t) => t.grupo === grupo)
                .map((t) => (
                  <Link key={t.slug} href={`/admin/dados/tabela/${t.slug}`}>
                    <Card className="hover:border-primary/40 transition-colors h-full">
                      <CardContent className="p-4 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{t.label}</p>
                          <p className="text-xs text-muted-foreground font-mono truncate">{t.slug}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-sm font-semibold tabular-nums text-muted-foreground">{t.total}</span>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
