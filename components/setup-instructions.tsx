import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function SetupInstructions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuração do banco de dados</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-muted-foreground">
        <p>
          O FluxoPay usa Postgres (Drizzle ORM) via a variável de ambiente <code>DATABASE_URL</code>.
        </p>
        <p>
          Rode as migrations com <code>pnpm db:migrate</code> após configurar a variável de ambiente.
        </p>
      </CardContent>
    </Card>
  )
}
