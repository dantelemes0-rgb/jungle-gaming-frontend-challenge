import { test, expect } from '@playwright/test'
import {
  addToCart,
  fillCheckoutAndConfirm,
  login,
  resetApp,
  USERS,
} from './helpers'

test.describe('13. Cobertura extra do §9', () => {
  test.beforeEach(async ({ page }) => {
    await resetApp(page)
  })

  test('socket cai e reconecta, ressincronizando os dados', async ({ page }) => {
    await resetApp(page, 'socket-drop')
    await login(page, 'ana')

    await expect(page.getByText(/Conexão restabelecida/)).toBeVisible({ timeout: 25_000 })
  })

  test('pedido pendente sobrevive ao refresh e confirma', async ({ page }) => {
    await login(page, 'ana')
    await addToCart(page, 'nft-04')
    await fillCheckoutAndConfirm(page)

    await expect(page).toHaveURL(/\/orders\/ord-/)
    await page.reload()

    await expect(page.getByText('Confirmado', { exact: true })).toBeVisible({ timeout: 20_000 })
  })

  test('evento antigo não regride o estoque', async ({ page }) => {
    await resetApp(page, 'stale-events')
    await login(page, 'ana')
    await page.goto('/nft/nft-01')

    await page.waitForTimeout(3000)

    const apiStock = await page.evaluate(async () => {
      const response = await fetch('/api/nfts/nft-01')
      const data = (await response.json()) as { editionsAvailable: number }
      return data.editionsAvailable
    })

    await expect(page.getByText(/\d+ de \d+ edições disponíveis/)).toContainText(
      `${apiStock} de`,
    )
  })

  test('clique repetido não cria pedido duplicado', async ({ page }) => {
    await login(page, 'ana')
    await addToCart(page, 'nft-15')
    await page.goto('/checkout')
    await expect(page.getByText('Subtotal')).toBeVisible()
    await page.getByRole('button', { name: 'Revisar pedido' }).click()
    await page.getByRole('checkbox').check()

    const before = await page.evaluate(async () => {
      const token = localStorage.getItem('jg.token')
      const response = await fetch('/api/orders', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      const data = (await response.json()) as { items: unknown[] }
      return data.items.length
    })

    await page.evaluate(() => {
      const button = [...document.querySelectorAll('button')].find(
        (item) => item.textContent?.trim() === 'Confirmar e pagar',
      )
      button?.click()
      button?.click()
    })

    await expect(page).toHaveURL(/\/orders\/ord-/, { timeout: 20_000 })

    const after = await page.evaluate(async () => {
      const token = localStorage.getItem('jg.token')
      const response = await fetch('/api/orders', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      const data = (await response.json()) as { items: unknown[] }
      return data.items.length
    })
    expect(after).toBe(before + 1)
  })

  test('cadastro cria conta e autentica', async ({ page }) => {
    const email = `novo.${Date.now()}@jungle.test`

    await page.goto('/register')
    await page.getByLabel('Nome').fill('Novo Colecionador')
    await page.getByLabel('E-mail').fill(email)
    await page.getByLabel('Senha', { exact: true }).fill('jungle123')
    await page.getByLabel('Confirmar senha').fill('jungle123')
    await page.getByRole('button', { name: 'Criar conta' }).click()

    await expect(page.getByRole('button', { name: 'Menu da conta' })).toBeVisible({
      timeout: 20_000,
    })
    await page.goto('/cart')
    await expect(page.getByText('Seu carrinho está vazio')).toBeVisible()
  })

  test('avatar por preset persiste após refresh', async ({ page }) => {
    await login(page, 'ana')
    await page.goto('/account/profile')

    await page.getByRole('button', { name: 'Usar avatar 2' }).click()
    await expect(page.getByText('Avatar atualizado.')).toBeVisible()

    await page.reload()
    const avatar = page.locator('img[src*="avatar-02"]').first()
    await expect(avatar).toBeVisible()
  })

  test('mudança de estoque chega por socket no detalhe', async ({ page }) => {
    await login(page, 'ana')
    await page.goto('/nft/nft-09')

    const label = page.getByText(/\d+ de \d+ edições disponíveis/)
    await expect(label).toBeVisible()

    const initial = Number((await label.innerText()).split(' ')[0])

    await page.evaluate(async () => {
      await fetch('/api/__mock/stock-change', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nftId: 'nft-09', delta: -2 }),
      })
    })

    await expect(label).toContainText(`${initial - 2} de`, { timeout: 15_000 })
  })

  test('troca de usuário mantém favoritos separados', async ({ page }) => {
    await login(page, 'ana')
    await page.goto('/nft/nft-10')
    await page.getByRole('button', { name: 'Adicionar aos favoritos' }).click()
    await expect(page.getByRole('button', { name: 'Remover dos favoritos' })).toBeVisible()

    await page.getByRole('button', { name: 'Menu da conta' }).click()
    await page.getByRole('menuitem', { name: 'Sair' }).click()
    await expect(page.getByRole('link', { name: 'Entrar' })).toBeVisible()

    await login(page, 'bruno')
    await page.goto('/nft/nft-10')
    await expect(page.getByRole('button', { name: 'Adicionar aos favoritos' })).toBeVisible()
    await expect(page.getByText(USERS.ana.email)).toHaveCount(0)
  })
})
