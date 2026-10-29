import { test, expect } from '@playwright/test'
import { addToCart, login, resetApp, USERS } from './helpers'

test.describe('3. Conta e sessão', () => {
  test.beforeEach(async ({ page }) => {
    await resetApp(page)
  })

  test('login, sessão após refresh e logout', async ({ page }) => {
    await login(page, 'ana')
    await page.reload()
    await expect(page.getByRole('button', { name: 'Menu da conta' })).toBeVisible()

    await page.getByRole('button', { name: 'Menu da conta' }).click()
    await page.getByRole('menuitem', { name: 'Sair' }).click()
    await expect(page.getByRole('link', { name: 'Entrar' })).toBeVisible()
  })

  test('expiração de sessão durante navegação preserva o retorno', async ({ page }) => {
    await login(page, 'ana')
    await page.evaluate(() => localStorage.setItem('jg.mock.scenario', 'session-expired'))
    await page.goto('/checkout')

    await expect(page).toHaveURL(/\/login\?redirect=/)
  })

  test('troca de usuário não vaza carrinho do anterior', async ({ page }) => {
    await login(page, 'ana')
    await addToCart(page, 'nft-06')
    await page.goto('/cart')
    await expect(page.getByText('Itens do carrinho')).toBeVisible()
    await expect(page.getByText('Seu carrinho está vazio')).toHaveCount(0)

    await page.getByRole('button', { name: 'Menu da conta' }).click()
    await page.getByRole('menuitem', { name: 'Sair' }).click()
    await expect(page.getByRole('link', { name: 'Entrar' })).toBeVisible()

    await login(page, 'bruno')
    await page.goto('/cart')
    await expect(page.getByText('Seu carrinho está vazio')).toBeVisible()
    await expect(page.getByText(USERS.ana.email)).toHaveCount(0)
  })

  test('cadastro com e-mail existente mostra conflito', async ({ page }) => {
    await page.goto('/register')
    await page.getByLabel('Nome').fill('Ana Duplicada')
    await page.getByLabel('E-mail').fill(USERS.ana.email)
    await page.getByLabel('Senha', { exact: true }).fill('jungle123')
    await page.getByLabel('Confirmar senha').fill('jungle123')
    await page.getByRole('button', { name: 'Criar conta' }).click()

    await expect(page.getByRole('alert')).toContainText('já está em uso')
  })
})
