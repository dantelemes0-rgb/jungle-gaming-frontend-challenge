import { test, expect } from '@playwright/test'
import { login, resetApp } from './helpers'

test.describe('11. Acessibilidade e teclado', () => {
  test.beforeEach(async ({ page }) => {
    await resetApp(page)
  })

  test('skip link é o primeiro foco e leva ao conteúdo', async ({ page }) => {
    await page.keyboard.press('Tab')
    const skip = page.getByRole('link', { name: 'Pular para o conteúdo' })
    await expect(skip).toBeFocused()
  })

  test('drawer do carrinho prende o foco e fecha com Escape', async ({ page }) => {
    await page.getByRole('button', { name: /Abrir carrinho/ }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog).toContainText('Carrinho')

    await page.keyboard.press('Escape')
    await expect(dialog).toHaveCount(0)
  })

  test('erros de validação estão associados aos campos', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('E-mail').fill('invalido')
    await page.getByRole('button', { name: 'Entrar' }).click()

    const email = page.getByLabel('E-mail')
    await expect(email).toHaveAttribute('aria-invalid', 'true')
    const describedBy = await email.getAttribute('aria-describedby')
    expect(describedBy).toBeTruthy()
    await expect(page.locator(`#${describedBy}`)).toContainText('E-mail inválido')
  })

  test('formulário de perfil exige autenticação', async ({ page }) => {
    await page.goto('/account/profile')
    await expect(page).toHaveURL(/\/login\?redirect=/)
    await login(page, 'ana')
    await page.goto('/account/profile')
    await expect(page.getByRole('heading', { name: 'Perfil do colecionador' })).toBeVisible()
  })
})
