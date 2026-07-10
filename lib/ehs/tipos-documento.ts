import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { ehsTiposDocumento } from "@/lib/db/schema"
import { TIPOS_DOCUMENTO_SEED } from "@/lib/ehs/documento-categorias"

/** Garante que o catálogo de tipos de documento existe no banco. Idempotente. */
export async function seedTiposDocumentoEhs() {
  for (const tipo of TIPOS_DOCUMENTO_SEED) {
    const [existente] = await db
      .select({ id: ehsTiposDocumento.id })
      .from(ehsTiposDocumento)
      .where(eq(ehsTiposDocumento.nome, tipo.nome))
    if (!existente) {
      await db.insert(ehsTiposDocumento).values(tipo)
    }
  }
}
