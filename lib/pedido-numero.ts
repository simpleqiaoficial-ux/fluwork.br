/** Número legível da ordem de pagamento — derivado de dados que já existem (id + created_at),
 *  sem precisar de migração nem de um campo novo no banco. Formato: FLW-AAAAMMDD-HHMMSS-XXXX
 *  (os 4 últimos caracteres do id garantem unicidade mesmo pra pedidos criados no mesmo segundo). */
export function getNumeroPedido(pedido: { id: string; created_at: string }): string {
  const d = new Date(pedido.created_at)
  const pad = (n: number) => String(n).padStart(2, "0")
  const data = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`
  const hora = `${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
  const sufixo = pedido.id.replace(/-/g, "").slice(-4).toUpperCase()
  return `FLW-${data}-${hora}-${sufixo}`
}
