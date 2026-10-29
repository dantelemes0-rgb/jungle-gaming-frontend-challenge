import { test, expect } from '@playwright/test'
import { login, resetApp } from './helpers'

test.describe('8. Perfil, avatar, senha e carteiras', () => {
  test.beforeEach(async ({ page }) => {
    await resetApp(page)
    await login(page, 'ana')
  })

  test('edita o perfil e persiste após refresh', async ({ page }) => {
    await page.goto('/account/profile')
    await page.getByLabel('Nome').fill('Ana GreenMint')
    await page.getByRole('button', { name: 'Salvar alterações' }).click()

    await expect(page.getByText('Perfil atualizado.')).toBeVisible()
    await page.reload()
    await expect(page.getByLabel('Nome')).toHaveValue('Ana GreenMint')
  })

  test('valida endereço de carteira e impede duplicidade', async ({ page }) => {
    await page.goto('/account/wallets')
    await page.getByRole('button', { name: 'Nova carteira' }).click()

    await page.getByLabel('Rótulo').fill('Teste')
    await page.getByLabel('Endereço').fill('0x123')
    await page.getByRole('button', { name: 'Cadastrar' }).click()
    await expect(page.getByText(/Endereço deve ter 0x/i)).toBeVisible()

    await page.getByLabel('Endereço').fill('0x1234567890abcdef1234567890abcdef12345678')
    await page.getByRole('button', { name: 'Cadastrar' }).click()
    await expect(page.getByText('Teste')).toBeVisible()
  })

  test('senha atual incorreta retorna erro do servidor', async ({ page }) => {
    await page.goto('/account/profile')
    await page.getByLabel('Senha atual').fill('errada123')
    await page.getByLabel('Nova senha', { exact: true }).fill('novasenha1')
    await page.getByLabel('Confirmar nova senha').fill('novasenha1')
    await page.getByRole('button', { name: 'Alterar senha' }).click()

    await expect(page.getByText('Senha atual incorreta.')).toBeVisible()
  })
})
