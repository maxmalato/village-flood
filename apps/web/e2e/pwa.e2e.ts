// PWA: instalável (manifesto e ícones) e o modo local funcionando sem internet depois do
// primeiro acesso.
import { expect, test } from '@playwright/test'

test.use({ locale: 'pt-BR', serviceWorkers: 'allow' })

test('tem manifesto com ícones', async ({ request }) => {
  const response = await request.get('/manifest.webmanifest')
  expect(response.ok()).toBe(true)
  const manifest = (await response.json()) as {
    name: string
    display: string
    icons: { src: string; sizes: string; purpose?: string }[]
  }
  expect(manifest.name).toBe('Enchente na Vila')
  expect(manifest.display).toBe('standalone')
  expect(manifest.icons.map((i) => i.sizes)).toEqual(['192x192', '512x512', '512x512'])
  expect(manifest.icons.some((i) => i.purpose === 'maskable')).toBe(true)
  for (const icon of manifest.icons) expect((await request.get(`/${icon.src}`)).ok()).toBe(true)
})

test('o modo local funciona offline depois do primeiro acesso', async ({ page, context }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Enchente na Vila')
  // espera o service worker assumir a página (cache pronto)
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready
    if (!navigator.serviceWorker.controller) {
      await new Promise((resolve) =>
        navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true }),
      )
    }
  })

  await context.setOffline(true)
  await page.reload()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Enchente na Vila')
  await expect(page.getByText('Sem internet', { exact: false })).toBeVisible()
  await page.getByRole('button', { name: 'Jogar neste aparelho' }).click()
  await page.getByRole('button', { name: 'Começar a partida' }).click()
  await expect(page.getByRole('group', { name: 'Tabuleiro da vila' })).toBeVisible()
  await context.setOffline(false)
})
