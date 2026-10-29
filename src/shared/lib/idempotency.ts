const STORAGE_KEY = 'jg.checkout.idempotency'

/**
 * A chave de idempotência nasce por tentativa de checkout e sobrevive ao refresh
 * (sessionStorage). Assim, um retry após timeout recupera o MESMO pedido.
 */
export function getOrCreateIdempotencyKey(): string {
  const existing = sessionStorage.getItem(STORAGE_KEY)
  if (existing) return existing

  const key = crypto.randomUUID()
  sessionStorage.setItem(STORAGE_KEY, key)
  return key
}

export function resetIdempotencyKey(): void {
  sessionStorage.removeItem(STORAGE_KEY)
}
