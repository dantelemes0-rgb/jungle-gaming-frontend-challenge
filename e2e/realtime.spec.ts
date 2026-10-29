import { test, expect } from '@playwright/test'
import { addToCart, login, resetApp } from './helpers'

test.describe('9/10. Tempo real: preço, duplicatas e retomada', () => {
  test.beforeEach(async ({ page }) => {
    await resetApp(page)
    await login(page, 'ana')
  })

  test('nft.updated bloqueia confirmação com cotação desatualizada', async ({ page }) => {
    await addToCart(page, 'nft-13')
    await page.goto('/checkout')
    await expect(page.getByText('Subtotal')).toBeVisible()
    await page.waitForFunction(
      () =>
        Boolean(
          (window as unknown as { __jgSocket?: { connected: boolean } }).__jgSocket?.connected,
        ),
    )

    await page.evaluate(async () => {
      await fetch('/api/__mock/price-change', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nftId: 'nft-13', factor: 1.5 }),
      })
    })

    await expect(page.getByText(/Os valores mudaram|A cotação mudou/)).toBeVisible({
      timeout: 10_000,
    })

    await page.getByRole('button', { name: 'Revisar pedido' }).click()
    await page.getByRole('checkbox').check()
    await expect(page.getByRole('button', { name: 'Confirmar e pagar' })).toBeDisabled()
  })

  test('eventos duplicados/antigos não regridem o preço', async ({ page }) => {
    await addToCart(page, 'nft-14')
    await page.goto('/cart')

    await page.evaluate(async () => {
      await fetch('/api/__mock/price-change', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nftId: 'nft-14', factor: 1.2 }),
      })
    })

    const price = page.locator('dd').filter({ hasText: 'Ξ' }).last()
    const updated = await price.innerText()
    await page.waitForTimeout(1200)
    await expect(price).toHaveText(updated)
  })
})
