import type { Cart } from '@/shared/api/contracts'
import { deleteJson, getJson, patchJson, postJson } from '@/shared/api/http'

export async function fetchCart(signal?: AbortSignal): Promise<Cart> {
  return getJson<Cart>('/cart', signal)
}

export async function addCartItem(nftId: string, qty: number): Promise<Cart> {
  return postJson<Cart>('/cart/items', { nftId, qty })
}

export async function updateCartItem(nftId: string, qty: number): Promise<Cart> {
  return patchJson<Cart>(`/cart/items/${nftId}`, { qty })
}

export async function removeCartItem(nftId: string): Promise<Cart> {
  return deleteJson<Cart>(`/cart/items/${nftId}`)
}

export async function applyCoupon(code: string): Promise<Cart> {
  return postJson<Cart>('/cart/coupon', { code })
}

export async function removeCoupon(): Promise<Cart> {
  return deleteJson<Cart>('/cart/coupon')
}
