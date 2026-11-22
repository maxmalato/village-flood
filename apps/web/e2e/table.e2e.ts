// Modo mesa: a TV abre a sala e só mostra; as pessoas entram pelo celular. A legenda completa
// abre na TV pelo celular e fecha pelo teclado/controle da própria TV.
import AxeBuilder from '@axe-core/playwright'
import { devices, expect, test, type Page } from '@playwright/test'

test.use({ locale: 'pt-BR' })

async function axe(page: Page) {
  for (const colorScheme of ['dark', 'light'] as const) {
    await page.emulateMedia({ colorScheme })
    const results = await new AxeBuilder({ page }).analyze()
    expect(results.violations, colorScheme).toEqual([])
  }
}

test('a TV abre a mesa, o celular organiza e joga, e a legenda abre na TV', async ({ browser }) => {
  test.setTimeout(60_000)
  const tvContext = await browser.newContext({
    locale: 'pt-BR',
    viewport: { width: 1920, height: 1080 },
  })
  const tv = await tvContext.newPage()
  await tv.goto('/')
  await tv.getByRole('button', { name: 'Abrir mesa (TV ou notebook)' }).click()
  await expect(tv.getByRole('heading', { name: 'Entre pelo celular' })).toBeVisible()
  await expect(tv.getByRole('img', { name: /QR code para entrar na sala/ })).toBeVisible()
  await expect(tv.getByText('Quem entrar primeiro organiza a sala', { exact: false })).toBeVisible()
  const code = (await tv.locator('.code').innerText()).replace('·', '')
  await axe(tv)

  // Ana entra pelo celular (link do QR) e passa a organizar a sala
  const phoneContext = await browser.newContext({ ...devices['Pixel 7'], locale: 'pt-BR' })
  const ana = await phoneContext.newPage()
  await ana.goto(`/?sala=${code}`)
  await ana.getByLabel('Seu apelido').fill('Ana')
  await ana.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(ana.getByText('Mesa conectada', { exact: false })).toBeVisible()
  await expect(tv.getByText('Aguardando Ana começar a partida.')).toBeVisible()
  await ana.getByRole('button', { name: 'Adicionar bot' }).click()
  await ana.getByRole('button', { name: 'Começar a partida' }).click()

  // a TV mostra o tabuleiro e a vez; não tem botões de jogada
  await expect(tv.locator('.turn')).toHaveText('Turno 1 · Vez de Ana')
  await expect(tv.locator('[data-tile]')).toHaveCount(36)
  await expect(tv.getByRole('button', { name: 'Encerrar turno' })).toHaveCount(0)
  await expect(tv.getByRole('heading', { name: 'Sugestões da equipe' })).toBeVisible()
  await axe(tv)

  // a legenda abre na TV pelo celular...
  await ana.getByRole('button', { name: 'Mostrar legenda na TV' }).click()
  const legend = tv.getByRole('dialog', { name: 'Legenda' })
  await expect(legend).toBeVisible()
  await expect(ana.getByRole('button', { name: 'Fechar legenda na TV' })).toBeVisible()
  // ...e fecha pelo teclado/controle remoto da própria TV
  await tv.keyboard.press('Escape')
  await expect(legend).toBeHidden()
  await expect(ana.getByRole('button', { name: 'Mostrar legenda na TV' })).toBeVisible()
  // o botão "Legenda" da TV também funciona pelo teclado
  await tv.getByRole('button', { name: 'Legenda', exact: true }).focus()
  await tv.keyboard.press('Enter')
  await expect(legend).toBeVisible()
  await tv.keyboard.press('Escape')
  await expect(legend).toBeHidden()

  // a TV recarrega e volta sozinha como mesa da mesma sala
  await tv.reload()
  await expect(tv.locator('.turn')).toHaveText('Turno 1 · Vez de Ana')

  await phoneContext.close()
  await tvContext.close()
})
