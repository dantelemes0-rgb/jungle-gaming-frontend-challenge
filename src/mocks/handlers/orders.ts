import { http, HttpResponse } from 'msw'
import { z } from 'zod'
import { networkSchema, type Order } from '@/shared/api/contracts'
import { hashString } from '@/shared/lib/prng'
import {
  buildQuote,
  getDb,
  getDbCart,
  newId,
  nowIso,
  saveDb,
  scheduleOrderSettlement,
  settleIfDue,
} from '../db/store'
import type { DbOrder } from '../db/schema'
import { scenarioFromRequest } from '../scenarios'
import {
  apiError,
  bootstrap,
  parseBody,
  readUser,
  simulateLatency,
  unauthorized,
} from './helpers'

const createOrderSchema = z.object({
  quoteId: z.string().min(1),
  quoteHash: z.string().min(1),
  quoteExpiresAt: z.string().min(1),
  walletId: z.string().min(1),
  network: networkSchema,
  payer: z.object({
    name: z.string().trim().min(2, 'Informe o nome do titular'),
    email: z.email('E-mail inválido'),
  }),
})

function toPublicOrder(order: DbOrder): Order {
  const { userId: _userId, idempotencyKey: _key, payloadHash: _hash, simulatedOutcome: _outcome, ...rest } =
    order
  return rest
}

export const orderHandlers = [
  http.post('/api/quote', async ({ request }) => {
    await bootstrap()
    await simulateLatency(request)
    const user = readUser(request)
    if (!user) return unauthorized()

    const cart = getDbCart(user.id)
    if (cart.items.length === 0) {
      return apiError(422, 'EMPTY_CART', 'Seu carrinho está vazio.')
    }

    const scenario = scenarioFromRequest(request)
    if (scenario === 'edition-sold-out') {
      return apiError(409, 'EDITION_SOLD_OUT', 'Uma das edições esgotou.')
    }

    return HttpResponse.json(buildQuote(cart))
  }),

  http.post('/api/orders', async ({ request }) => {
    await bootstrap()
    await simulateLatency(request)

    const user = readUser(request)
    if (!user) return unauthorized()

    const idempotencyKey = request.headers.get('Idempotency-Key')
    if (!idempotencyKey) {
      return apiError(400, 'BAD_REQUEST', 'Cabeçalho Idempotency-Key é obrigatório.')
    }

    const parsed = await parseBody(request, createOrderSchema)
    if ('response' in parsed) return parsed.response
    const body = parsed.data

    const db = getDb()
    const payloadHash = hashString(
      JSON.stringify([body.quoteId, body.walletId, body.network, body.payer.name, body.payer.email]),
    ).toString(16)

    // Replay idempotente: mesma chave + mesmo conteúdo → mesmo pedido.
    // O registro é escopado pelo usuário: uma chave nunca devolve pedido de outra conta.
    const recordKey = `${user.id}:${idempotencyKey}`
    const replay = db.idempotency[recordKey]
    if (replay) {
      if (replay.payloadHash !== payloadHash) {
        return apiError(409, 'IDEMPOTENCY_CONFLICT', 'Esta tentativa já foi usada com outro conteúdo.')
      }
      const order = db.orders.find((item) => item.id === replay.orderId && item.userId === user.id)
      if (order) return HttpResponse.json(toPublicOrder(order), { status: 200 })
    }

    const cart = getDbCart(user.id)
    if (cart.items.length === 0) {
      return apiError(422, 'EMPTY_CART', 'Seu carrinho está vazio.')
    }

    const scenario = scenarioFromRequest(request)
    if (scenario === 'edition-sold-out') {
      return apiError(409, 'EDITION_SOLD_OUT', 'Uma das edições esgotou durante o checkout.')
    }

    const quote = buildQuote(cart)
    const expired = new Date(body.quoteExpiresAt).getTime() <= Date.now()
    if (quote.hash !== body.quoteHash || expired) {
      return HttpResponse.json(
        {
          error: {
            code: 'QUOTE_CHANGED',
            message: 'Os valores mudaram. Revise a nova cotação.',
          },
          quote,
        },
        { status: 409 },
      )
    }

    const wallet = db.wallets.find(
      (item) => item.id === body.walletId && item.userId === user.id,
    )
    if (!wallet) return apiError(404, 'WALLET_NOT_FOUND', 'Carteira não encontrada.')

    const order: DbOrder = {
      id: newId('ord'),
      userId: user.id,
      status: 'pending',
      version: 1,
      items: quote.items,
      subtotalEth: quote.subtotalEth,
      discountEth: quote.discountEth,
      networkFeeEth: quote.networkFeeEth,
      totalEth: quote.totalEth,
      wallet: {
        id: wallet.id,
        label: wallet.label,
        address: wallet.address,
        network: body.network,
        isPrimary: wallet.isPrimary,
      },
      payer: body.payer,
      quoteId: body.quoteId,
      idempotencyKey,
      payloadHash,
      simulatedOutcome: scenario === 'payment-declined' ? 'declined' : 'confirmed',
      createdAt: nowIso(),
      updatedAt: nowIso(),
    }

    db.orders.unshift(order)
    db.idempotency[recordKey] = { payloadHash, orderId: order.id }
    saveDb()
    scheduleOrderSettlement(order.id)

    if (scenario === 'order-timeout') {
      // Pedido criado, mas a resposta "se perde": o cliente deve repetir com a MESMA chave.
      return HttpResponse.error()
    }

    return HttpResponse.json(toPublicOrder(order), { status: 201 })
  }),

  http.get('/api/orders/:id', async ({ request, params }) => {
    await bootstrap()
    await simulateLatency(request)
    const user = readUser(request)
    if (!user) return unauthorized()

    const id = String(params.id)
    settleIfDue(id)

    const order = getDb().orders.find(
      (item) => item.id === id && item.userId === user.id,
    )
    if (!order) return apiError(404, 'ORDER_NOT_FOUND', 'Pedido não encontrado.')
    return HttpResponse.json(toPublicOrder(order))
  }),

  http.get('/api/orders', async ({ request }) => {
    await bootstrap()
    await simulateLatency(request)
    const user = readUser(request)
    if (!user) return unauthorized()

    const db = getDb()
    for (const order of db.orders) settleIfDue(order.id)

    const url = new URL(request.url)
    const status = url.searchParams.get('status')
    const items = db.orders
      .filter((order) => order.userId === user.id)
      .filter((order) => (status ? order.status === status : true))
      .map(toPublicOrder)

    return HttpResponse.json({ items })
  }),
]
