import { drizzle } from "drizzle-orm/node-postgres"
import { Pool } from "pg"
import * as schema from "./schema"

declare global {
  // eslint-disable-next-line no-var
  var __fluxopayPgPool: Pool | undefined
}

const pool =
  global.__fluxopayPgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined,
    max: 10,
  })

if (process.env.NODE_ENV !== "production") {
  global.__fluxopayPgPool = pool
}

export const db = drizzle(pool, { schema })
