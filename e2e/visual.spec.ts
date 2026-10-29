import { test, expect } from '@playwright/test'
import { addToCart, login, resetApp } from './helpers'

test.describe('Regressão visual', () => {
  test.beforeEach(async ({ page }) => {
    await resetApp(page)
  })

  test('início', async ({ page }) => {
    await expect(page.locator('article').first()).toBeVisible()
    await expect(page).toHaveScreenshot('home.png', { fullPage: false, maxDiffPixelRatio: 0.02 })
  })

  test('detalhe do NFT', async ({ page }) => {
    await page.goto('/nft/nft-03')
    await expect(page.getByText('Preço atual')).toBeVisible()
    await expect(page).toHaveScreenshot('detail.png', { maxDiffPixelRatio: 0.02 })
  })

  test('carrinho', async ({ page }) => {
    await login(page, 'ana')
    await addToCart(page, 'nft-04')
    await page.goto('/cart')
    await expect(page.getByText('Total')).toBeVisible()
    await expect(page).toHaveScreenshot('cart.png', { maxDiffPixelRatio: 0.02 })
  })

  test('pagamento', async ({ page }) => {
    await login(page, 'ana')
    await addToCart(page, 'nft-04')
    await page.goto('/checkout')
    await expect(page.getByText('Subtotal')).toBeVisible()
    await expect(page).toHaveScreenshot('checkout.png', { maxDiffPixelRatio: 0.02 })
  })
})
