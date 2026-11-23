import AxeBuilder from '@axe-core/playwright'
import { devices, expect, test } from '@playwright/test'

for (const colorScheme of ['dark', 'light'] as const) {
  test.describe(`tema ${colorScheme}`, () => {
    test.use({ colorScheme, locale: 'pt-BR' })

    test('a tela inicial abre e não tem violações de acessibilidade', async ({ page }) => {
      await page.goto('/')
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Enchente na Vila')
      const results = await new AxeBuilder({ page }).analyze()
      expect(results.violations).toEqual([])
    })
  })
}

test.describe('idioma', () => {
  test.use({ locale: 'pt-BR' })

  test('troca o idioma para inglês', async ({ page }) => {
    await page.goto('/')
    await page.getByLabel('Idioma').selectOption('en')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Village Flood')
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  })

  test('abre em inglês quando o navegador prefere inglês', async ({ browser }) => {
    const context = await browser.newContext({ locale: 'en-US' })
    const page = await context.newPage()
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Village Flood')
    await context.close()
  })
})

test('modo mesa só aparece em tablet e telas maiores', async ({ browser }, info) => {
  test.skip(info.project.name !== 'desktop', 'testa vários aparelhos de uma vez')
  const cases = [
    { name: 'celular em pé', options: devices['Pixel 7'], visible: false },
    { name: 'celular deitado', options: devices['Pixel 7 landscape'], visible: false },
    { name: 'tablet em pé', options: devices['iPad Mini'], visible: true },
    { name: 'tablet deitado', options: devices['iPad Mini landscape'], visible: true },
    { name: 'desktop', options: { viewport: { width: 1366, height: 768 } }, visible: true },
  ]
  for (const { name, options, visible } of cases) {
    const context = await browser.newContext({ ...options, locale: 'pt-BR' })
    const page = await context.newPage()
    await page.goto('/')
    await expect(page.getByRole('button', { name: 'Criar sala online' }), name).toBeVisible()
    const table = page.getByRole('button', { name: 'Abrir mesa (TV ou notebook)' })
    if (visible) await expect(table, name).toBeVisible()
    else await expect(table, name).toBeHidden()
    await context.close()
  }
})
