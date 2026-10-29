import { test, expect } from '@playwright/test'
import { resetApp } from './helpers'

test.describe('2. Detalhe do NFT', () => {
  test.beforeEach(async ({ page }) => {
    await resetApp(page)
  })

  test('acesso direto por URL funciona', async ({ page }) => {
    await page.goto('/nft/nft-05')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.getByText('Preço atual')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Adicionar ao carrinho' })).toBeVisible()
  })

  test('NFT inexistente mostra estado de recurso não encontrado', async ({ page }) => {
    await page.goto('/nft/nft-999')
    await expect(page.getByText('NFT não encontrado')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Explorar catálogo' })).toBeVisible()
  })

  test('respeita o limite de quantidade por edição', async ({ page }) => {
    await page.goto('/nft/nft-01')
    const increase = page.getByRole('button', { name: /Aumentar quantidade/i })
    for (let index = 0; index < 12; index += 1) {
      if (await increase.isDisabled()) break
      await increase.click()
    }
    await expect(increase).toBeDisabled()
  })
})
