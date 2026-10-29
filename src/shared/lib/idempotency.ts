const STORAGE_PREFIX = 'jg.checkout.idempotency'

function storageKey(userId: string): string {
  return `${STORAGE_PREFIX}:${userId}`
}

/**
 * A chave de idempotência nasce por tentativa de checkout e sobrevive ao refresh
 * (sessionStorage). Assim, um retry após timeout recupera o MESMO pedido.
 * É escopada por usuário: a tentativa de um usuário nunca é reaproveitada por outro.
 */
export function getOrCreateIdempotencyKey(userId: string): string {
  const existing = sessionStorage.getItem(storageKey(userId))
  if (existing) return existing

  const key = crypto.randomUUID()
  sessionStorage.setItem(storageKey(userId), key)
  return key
}

/** Descarta as tentativas pendentes (pedido concluído, logout ou sessão expirada). */
export function resetIdempotencyKey(): void {
  try {
    for (const key of Object.keys(sessionStorage)) {
      if (key.startsWith(STORAGE_PREFIX)) sessionStorage.removeItem(key)
    }
  } catch {
    // storage indisponível: nada a limpar
  }
}
