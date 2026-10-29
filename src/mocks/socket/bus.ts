export type RealtimeEvent = {
  event: 'nft.updated' | 'order.updated' | 'session.expired'
  payload: Record<string, unknown>
}

type Listener = (event: RealtimeEvent) => void

const listeners = new Set<Listener>()

export function subscribeRealtime(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function publishRealtime(event: RealtimeEvent): void {
  listeners.forEach((listener) => listener(event))
}
