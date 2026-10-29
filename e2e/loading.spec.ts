import { test, expect } from '@playwright/test'
import { resetApp } from './helpers'

test.describe('12. Carregamento, falha e recuperação', () => {
  test('skeleton com shimmer durante carregamento lento', async ({ page }) => {
    await resetApp(page, 'slow')
    await page.goto('/')

    await expect(page.locator('.shimmer').first()).toBeVisible()
    await expect(page.locator('article').first()).toBeVisible({ timeout: 15_000 })
  })

  test('erro de servidor exibe estado de falha com nova tentativa', async ({ page }) => {
    await resetApp(page, 'http-500')
    await page.goto('/')

    await expect(page.getByRole('alert')).toContainText('Não foi possível carregar o catálogo')
    await expect(page.getByRole('button', { name: 'Tentar novamente' })).toBeVisible()
  })
})
