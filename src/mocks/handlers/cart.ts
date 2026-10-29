import { http, HttpResponse } from 'msw'
import { z } from 'zod'
import {
  cartKey,
  computeCart,
  getDb,
  getDbCart,
  saveDb,
  touchCart,
  MAX_QTY_PER_ITEM,
} from '../db/store'
import { scenarioFromRequest } from '../scenarios'
import {
  apiError,
  bootstrap,
  parseBody,
  readUser,
  simulateLatency,
  unauthorized,
} from './helpers'

const addItemSchema = z.object({
  nftId: z.string().min(1),
  qty: z.number().int().min(1).max(MAX_QTY_PER_ITEM),
})

const updateItemSchema = z.object({
  qty: z.number().int().min(1).max(MAX_QTY_PER_ITEM),
})

const mergeSchema = z.object({
  items: z.array(addItemSchema).max(50),
})

const couponSchema = z.object({
  code: z.string().trim().min(1),
})

function currentCart(request: Request) {
  const user = readUser(request)
  return { user, cart: getDbCart(user?.id ?? null), key: cartKey(user?.id ?? null) }
}

export const cartHandlers = [
  http.get('/api/cart', async ({ request }) => {
    await bootstrap()
    await simulateLatency(request)
    const { cart } = currentCart(request)
    return HttpResponse.json(computeCart(cart))
  }),

  http.post('/api/cart/items', async ({ request }) => {
    await bootstrap()
    await simulateLatency(request)
    const parsed = await parseBody(request, addItemSchema)
    if ('response' in parsed) return parsed.response

    const db = getDb()
    const nft = db.nfts.find((item) => item.id === parsed.data.nftId)
    if (!nft) return apiError(404, 'NFT_NOT_FOUND', 'NFT não encontrado.')

    if (scenarioFromRequest(request) === 'edition-sold-out' || nft.editionsAvailable === 0) {
      return apiError(409, 'EDITION_SOLD_OUT', 'Esta edição está esgotada.')
    }

    const { cart } = currentCart(request)
    const existing = cart.items.find((item) => item.nftId === nft.id)
    const nextQty = (existing?.qty ?? 0) + parsed.data.qty
    const maxQty = Math.min(MAX_QTY_PER_ITEM, nft.editionsAvailable)
    if (nextQty > maxQty) {
      return apiError(409, 'INSUFFICIENT_STOCK', `Máximo de ${maxQty} unidades para este NFT.`, [
        { field: 'qty', message: `Máximo de ${maxQty}` },
      ])
    }

    if (existing) existing.qty = nextQty
    else cart.items.push({ nftId: nft.id, qty: parsed.data.qty })

    touchCart(cart)
    return HttpResponse.json(computeCart(cart), { status: 201 })
  }),

  http.patch('/api/cart/items/:nftId', async ({ request, params }) => {
    await bootstrap()
    await simulateLatency(request)
    const parsed = await parseBody(request, updateItemSchema)
    if ('response' in parsed) return parsed.response

    const { cart } = currentCart(request)
    const line = cart.items.find((item) => item.nftId === params.nftId)
    if (!line) return apiError(404, 'CART_ITEM_NOT_FOUND', 'Item não está no carrinho.')

    const nft = getDb().nfts.find((item) => item.id === params.nftId)
    if (!nft) return apiError(404, 'NFT_NOT_FOUND', 'NFT não encontrado.')

    const maxQty = Math.min(MAX_QTY_PER_ITEM, nft.editionsAvailable)
    if (parsed.data.qty > maxQty) {
      return apiError(409, 'INSUFFICIENT_STOCK', `Máximo de ${maxQty} unidades.`, [
        { field: 'qty', message: `Máximo de ${maxQty}` },
      ])
    }

    line.qty = parsed.data.qty
    touchCart(cart)
    return HttpResponse.json(computeCart(cart))
  }),

  http.delete('/api/cart/items/:nftId', async ({ request, params }) => {
    await bootstrap()
    await simulateLatency(request)
    const { cart } = currentCart(request)
    cart.items = cart.items.filter((item) => item.nftId !== params.nftId)
    touchCart(cart)
    return HttpResponse.json(computeCart(cart))
  }),

  http.post('/api/cart/merge', async ({ request }) => {
    await bootstrap()
    await simulateLatency(request)
    const user = readUser(request)
    if (!user) return unauthorized()

    const parsed = await parseBody(request, mergeSchema)
    if ('response' in parsed) return parsed.response

    const db = getDb()
    const guest = db.carts.guest
    const lines = [...(guest?.items ?? []), ...parsed.data.items]

    const cart = getDbCart(user.id)
    for (const line of lines) {
      const nft = db.nfts.find((item) => item.id === line.nftId)
      if (!nft || nft.editionsAvailable === 0) continue
      const maxQty = Math.min(MAX_QTY_PER_ITEM, nft.editionsAvailable)
      const existing = cart.items.find((item) => item.nftId === line.nftId)
      if (existing) existing.qty = Math.min(maxQty, existing.qty + line.qty)
      else cart.items.push({ nftId: line.nftId, qty: Math.min(maxQty, line.qty) })
    }

    db.carts.guest = { items: [], couponCode: null, version: 1, updatedAt: new Date().toISOString() }
    cart.version += 1
    cart.updatedAt = new Date().toISOString()
    saveDb()

    return HttpResponse.json(computeCart(cart))
  }),

  http.post('/api/cart/coupon', async ({ request }) => {
    await bootstrap()
    await simulateLatency(request)
    const parsed = await parseBody(request, couponSchema)
    if ('response' in parsed) return parsed.response

    const { cart } = currentCart(request)
    const code = parsed.data.code.toUpperCase()
    const scenario = scenarioFromRequest(request)

    if (scenario === 'coupon-invalid' || code === 'INVALID') {
      return apiError(422, 'COUPON_INVALID', 'Cupom inválido.')
    }
    if (scenario === 'coupon-expired' || code === 'EXPIRED10') {
      return apiError(410, 'COUPON_EXPIRED', 'Este cupom expirou.')
    }

    const coupon = getDb().coupons.find((item) => item.code === code)
    if (!coupon) return apiError(422, 'COUPON_INVALID', 'Cupom inválido.')
    if (coupon.expiresAt && new Date(coupon.expiresAt).getTime() <= Date.now()) {
      return apiError(410, 'COUPON_EXPIRED', 'Este cupom expirou.')
    }

    cart.couponCode = code
    touchCart(cart)
    return HttpResponse.json(computeCart(cart))
  }),

  http.delete('/api/cart/coupon', async ({ request }) => {
    await bootstrap()
    await simulateLatency(request)
    const { cart } = currentCart(request)
    cart.couponCode = null
    touchCart(cart)
    return HttpResponse.json(computeCart(cart))
  }),
]
