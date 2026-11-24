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

test.describe('como jogar', () => {
  test.use({ locale: 'pt-BR' })

  test('"Como jogar" abre na tela inicial, rola por dentro e fecha', async ({ page }) => {
    await page.goto('/')
    const open = page.getByRole('button', { name: 'Como jogar' })
    await open.click()
    const dialog = page.getByRole('dialog', { name: 'Como jogar' })
    await expect(dialog).toBeVisible()
    await expect(dialog.getByRole('heading', { name: 'Vitória e derrota' })).toBeVisible()

    // a janela cabe na tela; o texto rola dentro dela, com o cabeçalho fixo
    const viewport = page.viewportSize()
    const box = await dialog.boundingBox()
    expect(box && viewport && box.height <= viewport.height).toBe(true)
    const region = dialog.getByRole('region', { name: 'Regras resumidas' })
    const scrolls = await region.evaluate((el) => el.scrollHeight > el.clientHeight)
    if (scrolls) {
      await region.evaluate((el) => el.scrollTo(0, el.scrollHeight))
      await expect(dialog.getByRole('button', { name: 'Fechar' })).toBeInViewport()
    }

    for (const colorScheme of ['dark', 'light'] as const) {
      await page.emulateMedia({ colorScheme })
      const results = await new AxeBuilder({ page }).analyze()
      expect(results.violations, colorScheme).toEqual([])
    }

    // Esc fecha e devolve o foco ao botão que abriu; o botão final também fecha
    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    await expect(open).toBeFocused()
    await open.click()
    await dialog.getByRole('button', { name: 'Entendi, vamos jogar' }).click()
    await expect(dialog).toBeHidden()
  })

  test('botão no topo: "?" no celular, nome a partir do tablet, sempre com contorno dourado', async ({
    browser,
  }, info) => {
    test.skip(info.project.name !== 'desktop', 'testa vários aparelhos de uma vez')
    const cases = [
      { name: 'celular', options: devices['Pixel 7'], text: '?' },
      { name: 'tablet', options: devices['iPad Mini'], text: 'Como jogar' },
      { name: 'desktop', options: { viewport: { width: 1366, height: 768 } }, text: 'Como jogar' },
    ]
    for (const { name, options, text } of cases) {
      const context = await browser.newContext({ ...options, locale: 'pt-BR' })
      const page = await context.newPage()
      await page.goto('/?botDelay=0&seed=42&scenario=0&mirror=0')
      const button = page.locator('.topbar').getByRole('button', { name: 'Como jogar' })
      await expect(button, name).toBeVisible()
      const icon = button.locator('.howto-icon')
      const label = await button.locator('.howto-label').boundingBox()
      if (text === '?') {
        await expect(icon, name).toBeVisible()
        expect(Math.round((await button.boundingBox())?.width ?? 0), name).toBe(44)
        expect(label?.width ?? 0, name).toBeLessThanOrEqual(1)
      } else {
        await expect(icon, name).toBeHidden()
        expect(label?.width ?? 0, name).toBeGreaterThan(40)
      }
      const border = await button.evaluate((el) => getComputedStyle(el).borderTopColor)
      // dourado do tema escuro ou o dourado mais escuro do tema claro (contraste ≥ 3:1)
      expect(['rgb(242, 184, 75)', 'rgb(168, 112, 10)'], name).toContain(border)
      // fica no topo também durante a partida
      await page.getByRole('button', { name: 'Jogar neste aparelho' }).click()
      await page.getByRole('button', { name: 'Começar a partida' }).click()
      await button.click()
      await expect(page.getByRole('dialog', { name: 'Como jogar' }), name).toBeVisible()
      await context.close()
    }
  })
})
