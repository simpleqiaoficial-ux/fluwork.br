import crypto from "crypto"

// Token de assinatura: bearer token de alta entropia gerado pelo sistema (não é senha
// escolhida por humano), então sha256 simples é adequado para o lookup exato — diferente
// de bcryptjs, usado em colaboradores.senhaHash contra força bruta offline de senha fraca.

export function gerarToken(): string {
  return crypto.randomBytes(32).toString("hex")
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex")
}

export function gerarExpiracao(dias = 7): Date {
  return new Date(Date.now() + dias * 24 * 60 * 60 * 1000)
}
