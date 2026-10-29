import { test, expect } from '@playwright/test'
import { login, resetApp, setScenario } from './helpers'

test.describe('4. Favoritos com atualização otimista', () => {
  test.beforeEach(async ({ page }) => {
    await resetApp(page)
    await login(page, 'ana')
  })

  test('favorita e persiste após refresh', async ({ page }) => {
    await page.goto('/nft/nft-08')
    const put = page.waitForResponse(
      (res) => res.url().includes('/api/favorites/nft-08') && res.request().method() === 'PUT',
    )
    await page.getByRole('button', { name: 'Adicionar aos favoritos' }).click()
    await put
    await expect(page.getByRole('button', { name: 'Remover dos favoritos' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )

    await page.reload()
    await expect(page.getByRole('button', { name: 'Remover dos favoritos' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  test('falha na mutation faz rollback do estado', async ({ page }) => {
    await page.goto('/nft/nft-09')
    await setScenario(page, 'favorite-failure')

    await page.getByRole('button', { name: 'Adicionar aos favoritos' }).click()

    await expect(page.getByRole('button', { name: 'Adicionar aos favoritos' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
    await expect(page.getByText(/Não foi possível atualizar o favorito/)).toBeVisible()
  })
})
