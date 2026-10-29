import { ws } from 'msw'
import { toSocketIo } from '@mswjs/socket.io-binding'
import Decimal from 'decimal.js'
import { ensureDb, nowIso, saveDb, touchCartsContaining } from '../db/store'
import { getScenario } from '../scenarios'
import { publishRealtime, subscribeRealtime } from './bus'

/**
 * Intercepta a conexão WebSocket do Socket.IO (transports: ['websocket']).
 * O binding cuida do handshake Engine.IO/Socket.IO; nós emitimos eventos de texto.
 */
const socketLink = ws.link('*')

/**
 * Timers do cenário pertencem à conexão ativa: com StrictMode (ou reconexão)
 * a conexão anterior é descartada e apenas a mais recente agenda eventos.
 */
let scenarioTimers: number[] = []
let activeConnection: symbol | null = null

function clearScenarioTimers(): void {
  scenarioTimers.forEach((timer) => window.clearTimeout(timer))
  scenarioTimers = []
}

export const socketHandler = socketLink.addEventListener('connection', (connection) => {
  if (!connection.client.url.pathname.includes('/socket.io')) {
    connection.server.connect()
    return
  }

  const connectionId = Symbol('socket-connection')
  activeConnection = connectionId
  clearScenarioTimers()

  const { client } = toSocketIo(connection)

  // Heartbeat do Engine.IO: sem ele o cliente derruba a conexão após ~30 s.
  const heartbeat = window.setInterval(() => {
    try {
      connection.client.send('2')
    } catch {
      window.clearInterval(heartbeat)
    }
  }, 20_000)

  const emit = (event: string, payload: unknown) => {
    client.emit(event, payload)
  }

  // Encaminha os eventos do "servidor" (store/handlers) para este cliente.
  const unsubscribe = subscribeRealtime(({ event, payload }) => {
    client.emit(event, payload)
  })

  const schedule = (delay: number, task: () => void | Promise<void>) => {
    scenarioTimers.push(
      window.setTimeout(() => {
        void task()
      }, delay),
    )
  }

  const scenario = getScenario()

  if (scenario === 'price-changed') {
    schedule(2500, async () => {
      const db = await ensureDb()
      const cartWithItems = Object.values(db.carts).find((cart) => cart.items.length > 0)
      const cartNftId = cartWithItems?.items[0]?.nftId
      const nft =
        (cartNftId ? db.nfts.find((item) => item.id === cartNftId) : undefined) ??
        db.nfts.find((item) => item.editionsAvailable > 1)
      if (!nft) return
      nft.priceEth = new Decimal(nft.priceEth).times(1.18).toFixed(4)
      nft.version += 1
      nft.updatedAt = nowIso()
      saveDb()
      touchCartsContaining(nft.id)
      publishRealtime({
        event: 'nft.updated',
        payload: {
          eventId: crypto.randomUUID(),
          nftId: nft.id,
          version: nft.version,
          priceEth: nft.priceEth,
          editionsAvailable: nft.editionsAvailable,
          status: nft.status,
          at: nft.updatedAt,
        },
      })
    })
  }

  if (scenario === 'duplicate-events') {
    schedule(1200, async () => {
      const db = await ensureDb()
      const nft = db.nfts.find((item) => item.editionsAvailable > 1)
      if (!nft) return
      const payload = {
        eventId: crypto.randomUUID(),
        nftId: nft.id,
        version: nft.version + 1,
        priceEth: nft.priceEth,
        editionsAvailable: Math.max(0, nft.editionsAvailable - 1),
        status: 'available' as const,
        at: nowIso(),
      }
      emit('nft.updated', payload)
      emit('nft.updated', payload)
    })
  }

  if (scenario === 'stale-events') {
    schedule(1000, async () => {
      const db = await ensureDb()
      const nft = db.nfts.find((item) => item.editionsAvailable > 1)
      if (!nft) return
      nft.version += 2
      nft.editionsAvailable = Math.max(0, nft.editionsAvailable - 2)
      nft.updatedAt = nowIso()
      saveDb()
      const fresh = {
        eventId: crypto.randomUUID(),
        nftId: nft.id,
        version: nft.version,
        priceEth: nft.priceEth,
        editionsAvailable: nft.editionsAvailable,
        status: nft.status,
        at: nft.updatedAt,
      }
      emit('nft.updated', fresh)
      schedule(600, () => {
        emit('nft.updated', {
          ...fresh,
          eventId: crypto.randomUUID(),
          version: fresh.version - 1,
          editionsAvailable: fresh.editionsAvailable + 2,
        })
      })
    })
  }

  if (scenario === 'socket-drop') {
    schedule(2500, () => {
      try {
        connection.client.close()
      } catch {
        // conexão já encerrada
      }
    })
  }

  connection.client.addEventListener('close', () => {
    unsubscribe()
    window.clearInterval(heartbeat)
    if (activeConnection === connectionId) clearScenarioTimers()
  })
})
