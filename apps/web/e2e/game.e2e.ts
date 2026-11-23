import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

test.use({ locale: 'pt-BR' })

/** Abre o lobby e começa uma partida com 1 pessoa (Ana) e 2 bots, sem espera dos bots. */
async function startGame(page: Page, seed = 42, difficulty: 'Tranquilo' | 'Normal' = 'Normal') {
  await page.goto(`/?botDelay=0&seed=${seed}&scenario=0&mirror=0`)
  await page.getByRole('button', { name: 'Jogar neste aparelho' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Montar a equipe' })).toBeVisible()
  await page.getByRole('radio', { name: new RegExp(`^${difficulty}`) }).check()
  await page.getByRole('button', { name: 'Começar a partida' }).click()
  await expect(page.getByText('Turno 1 · Sua vez, Ana')).toBeVisible()
}

/** axe-core nos temas escuro e claro. */
async function axe(page: Page) {
  for (const colorScheme of ['dark', 'light'] as const) {
    await page.emulateMedia({ colorScheme })
    const results = await new AxeBuilder({ page }).analyze()
    expect(results.violations, colorScheme).toEqual([])
  }
}

test('joga um turno: anda, desfaz, anda de novo, encerra e os bots jogam', async ({ page }) => {
  await startGame(page)
  const c3 = page.locator('[data-tile="C3"]').first()
  await expect(c3).toHaveAttribute('aria-label', /alcançável por 1 ação/)
  await c3.click()
  await page.getByRole('button', { name: 'Andar até C3 (1 ação)' }).click()
  await expect(page.locator('[data-tile="C3"]')).toHaveAttribute('aria-label', /voluntários: Ana/)

  await page.getByRole('button', { name: 'Desfazer' }).click()
  await expect(page.locator('[data-tile="B3"]')).toHaveAttribute(
    'aria-label',
    /voluntários: Ana, Bruno, Carla/,
  )
  await expect(page.getByRole('button', { name: 'Desfazer' })).toBeDisabled()

  await page.locator('[data-tile="C3"]').click()
  await page.getByRole('button', { name: 'Andar até C3 (1 ação)' }).click()
  await page.getByRole('button', { name: 'Encerrar turno' }).click()
  // Os dois bots jogam e a vez volta para a Ana no turno 4.
  await expect(page.getByText('Turno 4 · Sua vez, Ana')).toBeVisible()
})

test('mostra a dica e destaca a quadra sugerida (só no Tranquilo)', async ({ page }) => {
  await startGame(page, 42, 'Tranquilo')
  await page.getByRole('button', { name: 'Dica', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Fazer a jogada sugerida' })).toBeVisible()
  await expect(page.locator('[data-tile][aria-label*="sugestão da dica"]')).toHaveCount(1)
})

test('no Normal não há botão de dica', async ({ page }) => {
  await startGame(page)
  await expect(page.getByRole('button', { name: 'Encerrar turno' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Dica', exact: true })).toHaveCount(0)
})

test('abre e fecha a legenda completa, devolvendo o foco', async ({ page }) => {
  await startGame(page)
  const open = page.getByRole('button', { name: 'Legenda', exact: true })
  await open.click()
  const dialog = page.getByRole('dialog', { name: 'Legenda' })
  await expect(dialog).toBeVisible()
  await expect(
    dialog.getByText('Como ler o mapa: o número no canto de cada quadra é a altura dela.'),
  ).toBeVisible()
  await axe(page)
  await dialog.getByRole('button', { name: 'Voltar ao jogo' }).click()
  await expect(dialog).toBeHidden()
  await expect(open).toBeFocused()
})

test('as setas do teclado andam pelo tabuleiro', async ({ page }) => {
  await startGame(page)
  await page.locator('[data-tile="A1"]').focus()
  await page.keyboard.press('ArrowRight')
  await expect(page.locator('[data-tile="B1"]')).toBeFocused()
  await page.keyboard.press('ArrowDown')
  await expect(page.locator('[data-tile="B2"]')).toBeFocused()
})

test('uma partida completa, do lobby à tela final', async ({ page }) => {
  test.setTimeout(180_000)
  await startGame(page, 7, 'Tranquilo')
  const end = page.getByRole('button', { name: 'Jogar de novo' })
  for (let i = 0; i < 400; i++) {
    if (await end.isVisible()) break
    const hint = page.getByRole('button', { name: 'Dica', exact: true })
    if (await hint.isEnabled()) {
      await hint.click()
      await page.getByRole('button', { name: 'Fazer a jogada sugerida' }).click()
    } else {
      await page.waitForTimeout(20)
    }
  }
  await expect(end).toBeVisible()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    /A vila foi salva!|ilhados|topo|água/,
  )
  await axe(page)

  // resumo para o roteiro das partidas de teste, sem nomes
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.getByRole('button', { name: 'Copiar resumo' }).click()
  await expect(page.getByText('Resumo copiado.', { exact: false })).toBeVisible()
  const copied = await page.evaluate(() => navigator.clipboard.readText())
  expect(copied).toContain('Modo: neste aparelho · Dificuldade: Tranquilo')
  expect(copied).toMatch(/\| \| neste aparelho \| Tranquilo \| 1 \+ 2 \|/)
  expect(copied).not.toContain('Ana')

  await page.getByRole('button', { name: 'Voltar ao início' }).click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Enchente na Vila')
})

for (const colorScheme of ['dark', 'light'] as const) {
  test(`lobby e jogo sem violações de acessibilidade (tema ${colorScheme})`, async ({ page }) => {
    await page.emulateMedia({ colorScheme })
    await page.goto('/?botDelay=0&seed=42&scenario=0&mirror=0')
    await page.getByRole('button', { name: 'Jogar neste aparelho' }).click()
    await axe(page)
    await page.getByRole('button', { name: 'Começar a partida' }).click()
    await page.locator('[data-tile="C3"]').click()
    await axe(page)
  })
}
