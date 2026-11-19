import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

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
