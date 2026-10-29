import { expect, type Page } from '@playwright/test'

export const USERS = {
  ana: { email: 'ana@jungle.test', password: 'jungle123', name: 'Ana Ribeiro' },
  bruno: { email: 'bruno@jungle.test', password: 'jungle123', name: 'Bruno Salles' },
} as const

export type Scenario =
  | 'default'
  | 'empty-catalog'
  | 'slow'
  | 'variable-latency'
  | 'http-500'
  | 'offline'
  | 'session-expired'
  | 'register-conflict'
  | 'favorite-failure'
  | 'coupon-invalid'
  | 'coupon-expired'
  | 'price-changed'
  | 'edition-sold-out'
  | 'order-timeout'
  | 'payment-declined'
  | 'socket-drop'
  | 'duplicate-events'
  | 'stale-events'

/**
 * Estado limpo e determinístico: zera o storage (DB do mock, token, carrinho guest)
 * e deixa o app re-semear a base no reload. Não usa endpoint de reset para evitar
 * corrida entre a chamada e o reload.
 */
export async function resetApp(page: Page, scenario: Scenario = 'default'): Promise<void> {
  await page.goto('/')
  await page.evaluate((next) => {
    localStorage.clear()
    localStorage.setItem('jg.mock.scenario', next)
  }, scenario)
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Catálogo' })).toBeVisible()
}

/** Troca o cenário mantendo sessão, carrinho e dados atuais. */
export async function setScenario(page: Page, scenario: Scenario): Promise<void> {
  await page.evaluate((next) => {
    localStorage.setItem('jg.mock.scenario', next)
  }, scenario)
  await page.reload()
}

export async function login(page: Page, user: keyof typeof USERS = 'ana'): Promise<void> {
  const credentials = USERS[user]
  await page.goto('/login')
  await page.getByLabel('E-mail').fill(credentials.email)
  await page.getByLabel('Senha').fill(credentials.password)
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page).not.toHaveURL(/\/login/, { timeout: 20_000 })
  await expect(page.getByRole('button', { name: 'Menu da conta' })).toBeVisible()
}

export async function addToCart(page: Page, nftId = 'nft-03'): Promise<void> {
  await page.goto(`/nft/${nftId}`)
  await expect(page.getByRole('button', { name: 'Adicionar ao carrinho' })).toBeVisible()

  const response = page.waitForResponse(
    (res) => res.url().includes('/api/cart/items') && res.request().method() === 'POST',
  )
  await page.getByRole('button', { name: 'Adicionar ao carrinho' }).click()
  await response
  await page.waitForFunction(() => {
    const raw = localStorage.getItem('jg.mock.db.v1')
    if (!raw) return false
    const db = JSON.parse(raw) as { carts?: Record<string, { items: unknown[] }> }
    return Object.values(db.carts ?? {}).some((cart) => cart.items.length > 0)
  })
  await expect(page.getByRole('button', { name: 'Finalizar compra' })).toBeVisible()
}

export async function fillCheckoutAndConfirm(page: Page): Promise<void> {
  await page.goto('/checkout')
  await expect(page.getByRole('heading', { name: 'Finalizar compra' })).toBeVisible()
  await expect(page.getByText('Subtotal')).toBeVisible()

  await page.getByRole('button', { name: 'Revisar pedido' }).click()
  await expect(page.getByRole('heading', { name: 'Revisão do pedido' })).toBeVisible()

  await page.getByRole('checkbox').check()
  await page.getByRole('button', { name: 'Confirmar e pagar' }).click()
}
