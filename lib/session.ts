import { cookies } from "next/headers"

export interface SessionData {
  colaboradorId: string
  email: string
  nomeCompleto: string
  tipoAcesso: string
  // null só é válido quando tipoAcesso === "SuperAdmin" (usuário do time FluWork, sem empresa).
  empresaId: string | null
  cnpj?: string
  salario?: number
}

export async function createSession(data: SessionData) {
  const cookieStore = await cookies()
  const sessionData = JSON.stringify(data)

  cookieStore.set("fluxopay_session", sessionData, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 dias
    path: "/",
  })
}

export async function getSession(): Promise<SessionData | null> {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get("fluxopay_session")

  if (!sessionCookie) return null

  try {
    return JSON.parse(sessionCookie.value)
  } catch {
    return null
  }
}

export async function destroySession() {
  const cookieStore = await cookies()
  cookieStore.delete("fluxopay_session")
}
