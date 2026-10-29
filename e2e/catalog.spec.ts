import { test, expect } from '@playwright/test'
import { resetApp } from './helpers'

test.describe('1. Catálogo: busca, filtros, ordenação, paginação e histórico', () => {
  test.beforeEach(async ({ page }) => {
    await resetApp(page)
  })

  test('filtra por busca e mantém o estado na URL após refresh', async ({ page }) => {
    const search = page.getByLabel('Buscar')
    await search.fill('Jardim Oculto #4')

    await expect(page).toHaveURL(/q=Jardim/)
    await expect(page.getByText(/resultado/)).toContainText('1')

    await page.reload()
    await expect(page.getByLabel('Buscar')).toHaveValue('Jardim Oculto #4')
    await expect(page.locator('article')).toHaveCount(1)
  })

  test('combina filtros e reinicia a paginação', async ({ page }) => {
    await page.getByRole('button', { name: 'Página 2' }).click()
    await expect(page).toHaveURL(/page=2/)

    await page.getByLabel('Raridade').click()
    await page.getByRole('option', { name: 'Épica' }).click()

    await expect(page).not.toHaveURL(/page=2/)
    await expect(page).toHaveURL(/rarity=epic/)
  })

  test('ordena por menor preço e restaura pelo histórico', async ({ page }) => {
    await page.getByLabel('Ordenar por').click()
    await page.getByRole('option', { name: 'Menor preço' }).click()
    await expect(page).toHaveURL(/sort=price_asc/)

    const first = page.locator('article').first()
    await expect(first).toContainText('1,4112')

    await page.getByRole('link', { name: 'Explorar' }).first().click()
    await page.goBack()

    await expect(page.getByLabel('Ordenar por')).toContainText('Menor preço')
    await expect(page.locator('article').first()).toContainText('1,4112')
  })
})
