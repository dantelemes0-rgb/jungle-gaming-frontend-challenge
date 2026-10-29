import type { Cart, Nft, Order, User, Wallet } from '@/shared/api/contracts'

export interface DbUser extends User {
  salt: string
  passwordHash: string
}

export interface DbWallet extends Wallet {
  userId: string
}

export interface DbCartLine {
  nftId: string
  qty: number
}

export interface DbCart {
  items: DbCartLine[]
  couponCode: string | null
  version: number
  updatedAt: string
}

export interface DbSession {
  token: string
  userId: string
  expiresAt: string
}

export interface DbCoupon {
  code: string
  percent: number
  expiresAt: string | null
}

export interface DbOrder extends Order {
  userId: string
  idempotencyKey: string
  payloadHash: string
  /** Resultado definido no momento da criação (determinístico por cenário). */
  simulatedOutcome?: 'confirmed' | 'declined'
}

export interface Db {
  schemaVersion: 1
  seed: string
  users: DbUser[]
  wallets: DbWallet[]
  nfts: Nft[]
  favorites: Record<string, string[]>
  carts: Record<string, DbCart>
  sessions: DbSession[]
  orders: DbOrder[]
  coupons: DbCoupon[]
  idempotency: Record<string, { payloadHash: string; orderId: string }>
}

export type { Cart, Nft, Order, User, Wallet }
