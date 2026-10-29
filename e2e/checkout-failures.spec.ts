import { test, expect } from '@playwright/test'
import { addToCart, fillCheckoutAndConfirm, login, resetApp } from './helpers'

test.describe('7. Falhas de pagamento, clique repetido e timeout', () => {
  test('pagamento recusado preserva os itens no carrinho', async ({ page }) => {
    await resetApp(page, 'payment-declined')
    await login(page, 'ana')
    await addToCart(page, 'nft-10')
    await fillCheckoutAndConfirm(page)

    await expect(page.getByText('Pagamento recusado', { exact: false }).first()).toBeVisible({
      timeout: 15_000,
    })
    await expect(page.getByText('Recusado', { exact: true })).toBeVisible()

    await page.goto('/cart')
    await expect(page.getByText('Seu carrinho está vazio')).toHaveCount(0)
  })

  test('timeout após criação recupera o mesmo pedido ao reenviar', async ({ page }) => {
    await resetApp(page, 'order-timeout')
    await login(page, 'ana')
    await addToCart(page, 'nft-12')
    await fillCheckoutAndConfirm(page)

    await expect(page.getByRole('alert')).toContainText('Não foi possível conectar', {
      timeout: 15_000,
    })

    await page.getByRole('button', { name: 'Confirmar e pagar' }).click()
    await expect(page).toHaveURL(/\/orders\/ord-/, { timeout: 15_000 })
    await expect(page.getByText('Confirmado', { exact: true })).toBeVisible({ timeout: 15_000 })
  })
})
