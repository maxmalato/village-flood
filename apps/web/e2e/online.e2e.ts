// Salas online de ponta a ponta: dois navegadores (contextos separados) falando com o servidor
// local (wrangler dev, prazos curtos). Cobre criar e entrar pelo link, lobby, jogar e desfazer,
// sugestão (ping), queda com o bot assumindo e a volta pelo token guardado no aparelho.
import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Browser, type Page } from '@playwright/test'

test.use({ locale: 'pt-BR' })
/** axe-core nos temas escuro e claro. */
async function axe(page: Page) {
  for (const colorScheme of ['dark', 'light'] as const) {
    await page.emulateMedia({ colorScheme })
    const results = await new AxeBuilder({ page }).analyze()
    expect(results.violations, colorScheme).toEqual([])
  }
}

async function createRoom(browser: Browser, name: string) {
  const context = await browser.newContext({ locale: 'pt-BR' })
  const page = await context.newPage()
  await page.goto('/')
  await page.getByRole('button', { name: 'Criar sala online' }).click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Criar sala online')
  await page.getByLabel('Seu apelido').fill(name)
  await page.getByRole('radio', { name: /^Tranquilo/ }).check()
  await page.getByRole('button', { name: 'Criar sala', exact: true }).click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Sala online')
  const code = (await page.locator('.code').innerText()).replace('·', '')
  expect(code).toMatch(/^[A-HJ-NP-Z2-9]{6}$/)
  return { context, page, code }
}

async function joinByLink(browser: Browser, code: string, name: string) {
  const context = await browser.newContext({ locale: 'pt-BR' })
  const page = await context.newPage()
  await page.goto(`/?sala=${code}`)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Entrar numa sala')
  await expect(page.getByLabel('Código da sala')).toHaveValue(code)
  await page.getByLabel('Seu apelido').fill(name)
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Sala online')
  return { context, page }
}

const turnLine = (page: Page) => page.locator('.turn')

test('entrada: código inexistente e apelido repetido são recusados', async ({ browser }) => {
  const ana = await createRoom(browser, 'Ana')
  await axe(ana.page)

  const context = await browser.newContext({ locale: 'pt-BR' })
  const page = await context.newPage()
  await page.goto('/')
  await page.getByRole('button', { name: 'Entrar com código' }).click()
  await page.getByLabel('Código da sala').fill('AAAAAA')
  await page.getByLabel('Seu apelido').fill('Bruno')
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page.getByRole('alert')).toHaveText('Não há sala com esse código.')
  await axe(page)

  await page.getByLabel('Código da sala').fill(ana.code)
  await page.getByLabel('Seu apelido').fill('ana')
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page.getByRole('alert')).toHaveText('Já tem alguém com esse apelido na sala.')

  await context.close()
  await ana.context.close()
})

test('lobby, partida, sugestão, queda com bot e volta', async ({ browser }) => {
  test.setTimeout(90_000)
  const ana = await createRoom(browser, 'Ana')
  const bruno = await joinByLink(browser, ana.code, 'Bruno')

  // lobby: os dois se veem; só a Ana (quem criou) começa
  await expect(ana.page.locator('.seat')).toHaveCount(2)
  await expect(bruno.page.getByText('Aguardando Ana começar a partida.')).toBeVisible()
  await expect(bruno.page.getByRole('button', { name: 'Começar a partida' })).toHaveCount(0)
  await axe(bruno.page)
  await ana.page.getByRole('button', { name: 'Começar a partida' }).click()

  await expect(turnLine(ana.page)).toHaveText('Turno 1 · Sua vez, Ana')
  await expect(turnLine(bruno.page)).toHaveText('Turno 1 · Vez de Ana')
  await expect(bruno.page.getByRole('button', { name: 'Encerrar turno' })).toBeHidden()

  // Bruno sugere uma quadra; a Ana vê a sugestão no rótulo da quadra
  await bruno.page.locator('[data-tile="C3"]').click()
  await bruno.page.getByRole('button', { name: 'Ir para cá' }).click()
  await expect(
    bruno.page.locator('.actions-desktop').getByText('Suas sugestões neste turno: 1 de 3'),
  ).toBeVisible()
  await expect(ana.page.locator('[data-tile="C3"]')).toHaveAttribute(
    'aria-label',
    /Bruno sugere: Ir para cá/,
  )
  await axe(bruno.page)

  // Ana anda, desfaz e encerra; a vez passa ao Bruno e a sugestão some
  await ana.page.locator('.tile.reachable').first().click()
  await ana.page.locator('.actions-desktop .btn-primary.main').click()
  const undo = ana.page.locator('.actions-desktop').getByRole('button', { name: 'Desfazer' })
  await expect(undo).toBeEnabled()
  await undo.click()
  await expect(undo).toBeDisabled()
  await axe(ana.page)
  await ana.page.locator('.actions-desktop').getByRole('button', { name: 'Encerrar turno' }).click()
  await expect(turnLine(bruno.page)).toHaveText(/Sua vez, Bruno/)
  await expect(turnLine(ana.page)).toHaveText(/Vez de Bruno/)
  await expect(ana.page.locator('[data-tile="C3"]')).not.toHaveAttribute('aria-label', /sugere/)

  // Bruno cai na própria vez: aviso, e depois do prazo o bot joga até a vez voltar à Ana
  await bruno.page.close()
  await expect(ana.page.getByText('Bruno perdeu a conexão.', { exact: false })).toBeVisible()
  // contagem regressiva até o bot assumir a vez de quem caiu
  await expect(
    ana.page.getByText('Bruno está sem conexão. O bot assume a vez em', { exact: false }),
  ).toBeVisible()
  await expect(ana.page.locator('.clock')).toHaveText(/^0:0[0-3]$/)
  await expect(ana.page.getByText('Um bot está jogando no lugar de Bruno.')).toBeVisible()
  await expect(turnLine(ana.page)).toHaveText(/Sua vez, Ana/, { timeout: 30_000 })

  // Bruno volta no mesmo aparelho (token guardado): retoma no início do próprio turno
  const back = await bruno.context.newPage()
  await back.goto('/')
  await expect(
    back.getByText('Você voltou. Assume no início do seu próximo turno', { exact: false }),
  ).toBeVisible()
  // resumo do que aconteceu enquanto o Bruno estava fora
  const away = back.getByRole('status').filter({ hasText: 'Enquanto você estava fora' })
  await expect(away).toContainText('Do turno 2 ao turno 3.')
  await away.getByRole('button', { name: 'Entendi' }).click()
  await expect(away).toBeHidden()
  await expect(
    ana.page.getByText('Bruno voltou e assume no início do próximo turno.'),
  ).toBeVisible()
  await ana.page.locator('.actions-desktop').getByRole('button', { name: 'Encerrar turno' }).click()
  await expect(back.getByText('Você voltou ao jogo.')).toBeVisible()
  await expect(turnLine(back)).toHaveText(/Sua vez, Bruno/)
  await expect(ana.page.getByText('Bruno voltou ao jogo.')).toBeVisible()

  await bruno.context.close()
  await ana.context.close()
})
