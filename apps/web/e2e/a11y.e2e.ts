// Revisão de acessibilidade (Etapa 6): alvos de toque de pelo menos 44 px em todas as telas,
// partida jogável só com o teclado e animações desligadas com "reduzir movimento".
// O axe-core roda nos outros arquivos, tela por tela, nos temas claro e escuro.
import { expect, test, type Page } from '@playwright/test'

test.use({ locale: 'pt-BR' })

/** Controles visíveis menores que 44 × 44 px (rádio e caixa contam pelo rótulo clicável). */
async function smallTargets(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const selector =
      'button, a[href], select, input:not([type="radio"]):not([type="checkbox"]), label:has(> input[type="radio"]), label:has(> input[type="checkbox"])'
    const problems: string[] = []
    for (const el of document.querySelectorAll<HTMLElement>(selector)) {
      if (el.closest('dialog:not([open])')) continue
      const rect = el.getBoundingClientRect()
      const style = getComputedStyle(el)
      if (rect.width === 0 || style.visibility === 'hidden') continue
      if (rect.width < 43.5 || rect.height < 43.5) {
        const name = (el.getAttribute('aria-label') ?? el.textContent ?? el.tagName).trim()
        problems.push(`${name.slice(0, 40)} (${Math.round(rect.width)}×${Math.round(rect.height)})`)
      }
    }
    return problems
  })
}

async function expectTargets(page: Page) {
  expect(await smallTargets(page)).toEqual([])
}

test('alvos de toque de pelo menos 44 px nas telas do modo local', async ({ page }) => {
  await page.goto('/?botDelay=0&seed=42&scenario=0&mirror=0')
  await expectTargets(page)
  await page.getByRole('button', { name: 'Jogar neste aparelho' }).click()
  await expectTargets(page)
  await page.getByRole('button', { name: 'Começar a partida' }).click()
  await expect(page.getByText('Turno 1 · Sua vez, Ana')).toBeVisible()
  await page.locator('[data-tile="C3"]').click()
  await expectTargets(page)
  await page.getByRole('button', { name: 'Legenda', exact: true }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await expectTargets(page)
})

test('alvos de toque de pelo menos 44 px nas telas online', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Criar sala online' }).click()
  await expectTargets(page)
  await page.getByLabel('Seu apelido').fill('Ana')
  await page.getByRole('button', { name: 'Criar sala', exact: true }).click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Sala online')
  await page.getByRole('button', { name: 'Adicionar bot' }).click()
  await expect(page.locator('.seat')).toHaveCount(2)
  await expectTargets(page)
  await page.getByRole('button', { name: 'Começar a partida' }).click()
  await expect(page.locator('.turn')).toHaveText(/Sua vez, Ana/)
  await expectTargets(page)
})

test('uma jogada inteira só com o teclado', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'teclado físico: desktop')
  await page.goto('/?botDelay=0&seed=42&scenario=0&mirror=0')
  await page.getByRole('button', { name: 'Jogar neste aparelho' }).focus()
  await page.keyboard.press('Enter')
  await page.getByRole('button', { name: 'Começar a partida' }).focus()
  await page.keyboard.press('Enter')
  await expect(page.getByText('Turno 1 · Sua vez, Ana')).toBeVisible()

  // o tabuleiro entra na ordem do Tab por uma quadra só; as setas andam até C3
  await page.locator('.tile[tabindex="0"]').focus()
  await expect(page.locator('[data-tile="A1"]')).toBeFocused()
  for (const key of ['ArrowRight', 'ArrowRight', 'ArrowDown', 'ArrowDown']) {
    await page.keyboard.press(key)
  }
  await expect(page.locator('[data-tile="C3"]')).toBeFocused()
  await page.keyboard.press('Enter')
  // o próximo Tab vai direto para a ação principal da quadra escolhida
  await page.keyboard.press('Tab')
  await expect(page.getByRole('button', { name: 'Andar até C3 (1 ação)' })).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.locator('[data-tile="C3"]')).toHaveAttribute('aria-label', /voluntários: Ana/)
  // o foco continua visível (contorno de foco desenhado)
  await page.locator('[data-tile="C3"]').focus()
  const outline = await page
    .locator('[data-tile="C3"]')
    .evaluate((el) => getComputedStyle(el).outlineStyle)
  expect(outline).not.toBe('none')
})

test.describe('reduzir movimento', () => {
  test.use({ reducedMotion: 'reduce' })

  test('as animações ficam desligadas', async ({ page }) => {
    await page.goto('/?botDelay=0&seed=42&scenario=0&mirror=0')
    await page.getByRole('button', { name: 'Jogar neste aparelho' }).click()
    await page.getByRole('button', { name: 'Começar a partida' }).click()
    const duration = await page
      .locator('.pawn.active')
      .first()
      .evaluate((el) => getComputedStyle(el).animationDuration)
    for (const part of duration.split(',')) expect(parseFloat(part)).toBeLessThan(0.01)
  })
})

test.describe('tela estreita (320 px, zoom de 400%)', () => {
  test.use({ viewport: { width: 320, height: 640 } })

  test('as telas de menu cabem sem rolagem lateral', async ({ page }) => {
    const noSideScroll = async () =>
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        320,
      )
    await page.goto('/')
    await noSideScroll()
    await page.getByRole('button', { name: 'Jogar neste aparelho' }).click()
    await noSideScroll()
    await page.getByRole('button', { name: 'Voltar' }).click()
    await page.getByRole('button', { name: 'Criar sala online' }).click()
    await noSideScroll()
    await page.getByRole('button', { name: 'Voltar' }).click()
    await page.getByRole('button', { name: 'Entrar com código' }).click()
    await noSideScroll()
  })
})
