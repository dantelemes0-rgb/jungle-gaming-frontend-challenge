import { http, HttpResponse } from 'msw'
import Decimal from 'decimal.js'
import { getDb, resetDb, saveDb, touchCartsContaining } from '../db/store'
import { publishRealtime } from '../socket/bus'
import { isScenario, SCENARIOS, setScenario } from '../scenarios'
import { bootstrap } from './helpers'

export const controlHandlers = [
  http.post('/api/__mock/reset', async ({ request }) => {
    await bootstrap()
    const body = (await request.json().catch(() => ({}))) as { scenario?: string }
    if (isScenario(body.scenario)) setScenario(body.scenario)
    await resetDb()
    return HttpResponse.json({ ok: true })
  }),

  http.post('/api/__mock/scenario', async ({ request }) => {
    await bootstrap()
    const body = (await request.json().catch(() => ({}))) as { scenario?: string }
    if (!isScenario(body.scenario)) {
      return HttpResponse.json(
        { error: { code: 'INVALID_SCENARIO', message: 'Cenário desconhecido.' } },
        { status: 400 },
      )
    }
    setScenario(body.scenario)
    await resetDb()
    return HttpResponse.json({ ok: true, scenario: body.scenario })
  }),

  http.get('/api/__mock/state', async () => {
    await bootstrap()
    const db = getDb()
    return HttpResponse.json({
      seed: db.seed,
      users: db.users.map((user) => ({ id: user.id, email: user.email })),
      nfts: db.nfts.length,
      carts: Object.keys(db.carts),
      orders: db.orders.map((order) => ({ id: order.id, status: order.status })),
      sessions: db.sessions.length,
    })
  }),

  http.get('/api/__mock/scenarios', async () =>
    HttpResponse.json({ scenarios: SCENARIOS }),
  ),

  /** Hook determinístico para testes: altera preço/estoque e emite nft.updated. */
  http.post('/api/__mock/price-change', async ({ request }) => {    await bootstrap()
    const body = (await request.json().catch(() => ({}))) as {
      nftId?: string
      factor?: number
    }
    const db = getDb()
    const nft = body.nftId
      ? db.nfts.find((item) => item.id === body.nftId)
      : db.nfts.find((item) => item.editionsAvailable > 1)
    if (!nft) {
      return HttpResponse.json(
        { error: { code: 'NFT_NOT_FOUND', message: 'NFT não encontrado.' } },
        { status: 404 },
      )
    }

    nft.priceEth = new Decimal(nft.priceEth).times(body.factor ?? 1.2).toFixed(4)
    nft.version += 1
    nft.updatedAt = new Date().toISOString()
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

    return HttpResponse.json({ ok: true, nftId: nft.id, priceEth: nft.priceEth })
  }),
]
