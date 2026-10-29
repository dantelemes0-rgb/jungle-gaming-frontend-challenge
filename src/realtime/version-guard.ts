/**
 * Garante idempotência e ordenação dos eventos em tempo real.
 * - duplicata (mesmo eventId) → descarta
 * - versão <= última aplicada → descarta (não regride estado)
 */
export class VersionGuard {
  private readonly versions = new Map<string, number>()
  private readonly seen = new Set<string>()
  private readonly order: string[] = []

  shouldApply(kind: string, id: string, version: number, eventId: string): boolean {
    if (this.seen.has(eventId)) return false

    this.seen.add(eventId)
    this.order.push(eventId)
    if (this.order.length > 200) {
      const oldest = this.order.shift()
      if (oldest) this.seen.delete(oldest)
    }

    const key = `${kind}:${id}`
    const current = this.versions.get(key)
    if (current !== undefined && version <= current) return false

    this.versions.set(key, version)
    return true
  }

  reset(): void {
    this.versions.clear()
    this.seen.clear()
    this.order.length = 0
  }
}
