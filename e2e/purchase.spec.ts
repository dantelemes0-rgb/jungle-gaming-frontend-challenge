import { test, expect } from '@playwright/test'
import { addToCart, fillCheckoutAndConfirm, login, resetApp } from './helpers'

test.describe('6. Compra completa até o recibo', () => {
  test('catálogo → carrinho → checkout → confirmação', async ({ page }) => {
    await resetApp(page)
    await login(page, 'ana')
    await addToCart(page, 'nft-08')
    await fillCheckoutAndConfirm(page)

    await expect(page).toHaveURL(/\/orders\/ord-/)
    await expect(page.getByText('Confirmado', { exact: true })).toBeVisible({ timeout: 15_000 })
    await expect(page.getByRole('heading', { name: 'Recibo' })).toBeVisible()
    await expect(page.getByText('Transação (simulada)')).toBeVisible()
    await expect(page.getByText(/Snapshot do pedido/)).toBeVisible()

    await page.getByRole('button', { name: /Abrir carrinho/ }).click()
    await expect(page.getByText('Seu carrinho está vazio')).toBeVisible()
  })
})
