import { test, expect } from '@playwright/test'
import { addToCart, login, resetApp } from './helpers'

test.describe('5. Carrinho', () => {
  test.beforeEach(async ({ page }) => {
    await resetApp(page)
  })

  test('adiciona, altera quantidade e persiste após refresh', async ({ page }) => {
    await addToCart(page, 'nft-02')
    await page.goto('/cart')
    await expect(page.getByText('Itens do carrinho')).toBeVisible()

    const patch = page.waitForResponse(
      (res) => res.url().includes('/api/cart/items/') && res.request().method() === 'PATCH',
    )
    await page.getByRole('button', { name: /Aumentar quantidade de/i }).click()
    await patch

    const group = page.getByRole('group', { name: /Quantidade de/i })
    await expect(group).toContainText('2')

    await page.reload()
    await expect(page.getByRole('button', { name: 'Finalizar compra' })).toBeVisible()
    await expect(page.getByRole('group', { name: /Quantidade de/i })).toContainText('2')
  })

  test('aplica cupom válido, rejeita inválido e remove', async ({ page }) => {
    await addToCart(page, 'nft-02')
    await page.goto('/cart')
    await expect(page.getByText('Itens do carrinho')).toBeVisible()

    await page.getByLabel('Cupom de desconto').fill('INVALID')
    await page.getByRole('button', { name: 'Aplicar' }).click()
    await expect(page.getByText('Cupom inválido.')).toBeVisible()

    await page.getByLabel('Cupom de desconto').fill('GREEN10')
    await page.getByRole('button', { name: 'Aplicar' }).click()
    await expect(page.getByText(/Desconto/)).toBeVisible()

    await page.getByRole('button', { name: 'Remover cupom' }).click()
    await expect(page.getByText(/Desconto/)).toHaveCount(0)
  })

  test('remove item e esvazia o carrinho', async ({ page }) => {
    await addToCart(page, 'nft-02')
    await page.goto('/cart')
    await expect(page.getByText('Itens do carrinho')).toBeVisible()

    await page.getByRole('button', { name: /Remover .* do carrinho/ }).click()
    await expect(page.getByText('Seu carrinho está vazio')).toBeVisible()
  })

  test('preserva itens do visitante ao autenticar', async ({ page }) => {
    await addToCart(page, 'nft-11')
    await login(page, 'ana')
    await page.goto('/cart')

    await expect(page.getByRole('button', { name: 'Finalizar compra' })).toBeVisible()
    await expect(page.getByText('Seu carrinho está vazio')).toHaveCount(0)
  })
})
