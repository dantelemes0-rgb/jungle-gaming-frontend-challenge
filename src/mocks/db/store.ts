import Decimal from 'decimal.js'
import type { Cart, Quote } from '@/shared/api/contracts'
import { hashString } from '@/shared/lib/prng'
import { readJson, writeJson } from '@/shared/lib/storage'
import { createSeedDb, hashPassword } from './seed'
import type { Db, DbCart, DbSession, DbUser } from './schema'
import { publishRealtime } from '../socket/bus'

export const DB_KEY = 'jg.mock.db.v1'
export const ORDER_SETTLE_MS = 1400
export const SESSION_TTL_MS = 2 * 60 * 60 * 1000
export const NETWORK_FEE_ETH = '0.0025'
export const MAX_QTY_PER_ITEM = 10

let cached: Db | null = null

export async function ensureDb(): Promise<Db> {
  if (cached) return cached
  const stored = readJson<Db | null>(DB_KEY, null)
  if (stored && stored.schemaVersion === 1 && stored.seed === 'greenmint-v1') {
    cached = stored
    return cached
  }
  cached = await createSeedDb()
  saveDb()
  return cached
}

export function getDb(): Db {
  if (!cached) throw new Error('DB do mock não inicializado')
  return cached
}

export function saveDb(): void {
  if (cached) writeJson(DB_KEY, cached)
}

export async function resetDb(): Promise<Db> {
  cached = await createSeedDb()
  saveDb()
  return cached
}

export function nowIso(): string {
  return new Date().toISOString()
}

export function newId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`
}

export function money(value: Decimal): string {
  return value.toDecimalPlaces(18, Decimal.ROUND_HALF_UP).toFixed()
}

/* -------------------------------------------------------------------------- */
/* Sessão                                                                      */
/* -------------------------------------------------------------------------- */

export function createSession(userId: string): DbSession {
  const db = getDb()
  const session: DbSession = {
    token: `jg_${crypto.randomUUID().replace(/-/g, '')}`,
    userId,
    expiresAt: new Date(Date.now() + SESSION_TTL_MS).toISOString(),
  }
  db.sessions = db.sessions.filter((item) => item.userId !== userId)
  db.sessions.push(session)
  saveDb()
  return session
}

export function sessionUser(request: Request): DbUser | null {
  const db = getDb()
  const header = request.headers.get('Authorization')
  if (!header?.startsWith('Bearer ')) return null

  const token = header.slice(7)
  const session = db.sessions.find((item) => item.token === token)
  if (!session) return null

  if (new Date(session.expiresAt).getTime() <= Date.now()) {
    db.sessions = db.sessions.filter((item) => item.token !== token)
    saveDb()
    return null
  }

  return db.users.find((user) => user.id === session.userId) ?? null
}

export function expireAllSessions(): void {
  const db = getDb()
  db.sessions = []
  saveDb()
  publishRealtime({
    event: 'session.expired',
    payload: { eventId: crypto.randomUUID(), at: nowIso() },
  })
}

export async function verifyPassword(user: DbUser, password: string): Promise<boolean> {
  const hash = await hashPassword(password, user.salt)
  return hash === user.passwordHash
}

/* -------------------------------------------------------------------------- */
/* Carrinho                                                                    */
/* -------------------------------------------------------------------------- */

export function cartKey(userId: string | null): string {
  return userId ?? 'guest'
}

export function getDbCart(userId: string | null): DbCart {
  const db = getDb()
  const key = cartKey(userId)
  const existing = db.carts[key]
  if (existing) return existing

  const cart: DbCart = { items: [], couponCode: null, version: 1, updatedAt: nowIso() }
  db.carts[key] = cart
  saveDb()
  return cart
}

export function touchCart(cart: DbCart): void {
  cart.version += 1
  cart.updatedAt = nowIso()
  saveDb()
}

/** Mudança de preço/estoque invalida o carrinho que contém o NFT. */
export function touchCartsContaining(nftId: string): void {
  const db = getDb()
  let changed = false
  for (const cart of Object.values(db.carts)) {
    if (cart.items.some((item) => item.nftId === nftId)) {
      cart.version += 1
      cart.updatedAt = nowIso()
      changed = true
    }
  }
  if (changed) saveDb()
}

export function couponPercent(code: string | null): number {
  if (!code) return 0
  const db = getDb()
  const coupon = db.coupons.find((item) => item.code === code.toUpperCase())
  if (!coupon) return 0
  if (coupon.expiresAt && new Date(coupon.expiresAt).getTime() <= Date.now()) return 0
  return coupon.percent
}

export function computeCart(cart: DbCart): Cart {
  const db = getDb()
  const items = cart.items.flatMap((line) => {
    const nft = db.nfts.find((item) => item.id === line.nftId)
    if (!nft) return []
    return [
      {
        nftId: nft.id,
        name: nft.name,
        imageUrl: nft.imageUrl,
        qty: line.qty,
        unitPriceEth: nft.priceEth,
        editionsAvailable: nft.editionsAvailable,
        lineTotalEth: money(new Decimal(nft.priceEth).times(line.qty)),
      },
    ]
  })

  const subtotal = items.reduce(
    (acc, item) => acc.plus(new Decimal(item.lineTotalEth)),
    new Decimal(0),
  )
  const percent = couponPercent(cart.couponCode)
  const discount = subtotal.times(percent).div(100)
  const total = subtotal.minus(discount)

  return {
    items,
    couponCode: cart.couponCode,
    subtotalEth: money(subtotal),
    discountEth: money(discount),
    totalEth: money(total),
    version: cart.version,
    updatedAt: cart.updatedAt,
  }
}

/* -------------------------------------------------------------------------- */
/* Cotação                                                                     */
/* -------------------------------------------------------------------------- */

export function buildQuote(cart: DbCart): Quote {
  const computed = computeCart(cart)
  const total = new Decimal(computed.totalEth).plus(NETWORK_FEE_ETH)
  const hash = hashString(
    JSON.stringify({
      items: computed.items.map((item) => [item.nftId, item.qty, item.unitPriceEth]),
      coupon: computed.couponCode,
      subtotal: computed.subtotalEth,
      discount: computed.discountEth,
      fee: NETWORK_FEE_ETH,
      version: computed.version,
    }),
  ).toString(16)

  return {
    id: newId('quote'),
    items: computed.items,
    couponCode: computed.couponCode,
    subtotalEth: computed.subtotalEth,
    discountEth: computed.discountEth,
    networkFeeEth: NETWORK_FEE_ETH,
    totalEth: money(total),
    expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    version: computed.version,
    hash,
  }
}

/* -------------------------------------------------------------------------- */
/* Pedido                                                                      */
/* -------------------------------------------------------------------------- */

export function settleOrder(orderId: string): void {
  const db = getDb()
  const order = db.orders.find((item) => item.id === orderId)
  if (!order || order.status !== 'pending') return

  const outcome = order.simulatedOutcome ?? 'confirmed'
  order.version += 1
  order.updatedAt = nowIso()

  if (outcome === 'declined') {
    order.status = 'declined'
    order.declineReason = 'A carteira simulada recusou a assinatura da transação.'
    saveDb()
    publishRealtime({
      event: 'order.updated',
      payload: {
        eventId: crypto.randomUUID(),
        orderId: order.id,
        userId: order.userId,
        version: order.version,
        status: order.status,
        declineReason: order.declineReason,
        at: order.updatedAt,
      },
    })
    return
  }

  order.status = 'confirmed'
  order.txHash = `0x${hashString(order.id).toString(16)}${crypto
    .randomUUID()
    .replace(/-/g, '')
    .slice(0, 48)}`
  order.explorerUrl = `https://etherscan.io/tx/${order.txHash}`

  for (const item of order.items) {
    const nft = db.nfts.find((candidate) => candidate.id === item.nftId)
    if (!nft) continue
    nft.editionsAvailable = Math.max(0, nft.editionsAvailable - item.qty)
    nft.status = nft.editionsAvailable === 0 ? 'sold_out' : 'available'
    nft.version += 1
    nft.updatedAt = order.updatedAt
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
  }

  const cart = db.carts[order.userId]
  if (cart) {
    for (const purchased of order.items) {
      const line = cart.items.find((candidate) => candidate.nftId === purchased.nftId)
      if (!line) continue
      if (line.qty <= purchased.qty) {
        cart.items = cart.items.filter((candidate) => candidate.nftId !== purchased.nftId)
      } else {
        line.qty -= purchased.qty
      }
    }
    cart.version += 1
    cart.updatedAt = nowIso()
  }

  saveDb()
  publishRealtime({
    event: 'order.updated',
    payload: {
      eventId: crypto.randomUUID(),
      orderId: order.id,
      userId: order.userId,
      version: order.version,
      status: order.status,
      txHash: order.txHash,
      at: order.updatedAt,
    },
  })
}

export function scheduleOrderSettlement(orderId: string): void {
  window.setTimeout(() => settleOrder(orderId), ORDER_SETTLE_MS + 60)
}

/** Recuperação após refresh: pedido pendente antigo é resolvido na leitura. */
export function settleIfDue(orderId: string): void {
  const order = getDb().orders.find((item) => item.id === orderId)
  if (!order || order.status !== 'pending') return
  const age = Date.now() - new Date(order.createdAt).getTime()
  if (age >= ORDER_SETTLE_MS) settleOrder(orderId)
}
