// Publicação: o site servido pelo Worker (wrangler dev, como na Cloudflare) traz os cabeçalhos de
// segurança, e o jogo roda inteiro sob a política de conteúdo (CSP), sem nada bloqueado.
import { expect, test } from '@playwright/test'

const WORKER = 'http://127.0.0.1:8787'
test.use({ baseURL: WORKER, locale: 'pt-BR' })

test('cabeçalhos de segurança e de cache', async ({ request }) => {
  const page = await request.get('/')
  const headers = page.headers()
  expect(headers['content-security-policy']).toContain("default-src 'self'")
  expect(headers['content-security-policy']).toContain("frame-ancestors 'none'")
  expect(headers['x-content-type-options']).toBe('nosniff')
  expect(headers['referrer-policy']).toBe('no-referrer')
  expect((await request.get('/sw.js')).headers()['cache-control']).toBe('no-cache')
  // o arquivo de configuração não é servido como arquivo
  expect(await (await request.get('/_headers')).text()).not.toContain('Content-Security-Policy')
})

test('o jogo roda sob a CSP: local, sala online e service worker', async ({ page }) => {
  const problems: string[] = []
  page.on('console', (m) => {
    if (m.type() === 'error') problems.push(m.text())
  })
  page.on('pageerror', (e) => problems.push(String(e)))

  await page.goto('/?botDelay=0&seed=42&scenario=0&mirror=0')
  await page.getByRole('button', { name: 'Jogar neste aparelho' }).click()
  await page.getByRole('button', { name: 'Começar a partida' }).click()
  await page.locator('[data-tile="C3"]').click()
  await page.getByRole('button', { name: 'Andar até C3 (1 ação)' }).click()
  await expect(page.locator('[data-tile="C3"]')).toHaveAttribute('aria-label', /voluntários: Ana/)

  await page.goto('/')
  await page.getByRole('button', { name: 'Criar sala online' }).click()
  await page.getByLabel('Seu apelido').fill('Ana')
  await page.getByRole('button', { name: 'Criar sala', exact: true }).click()
  await expect(page.getByRole('img', { name: /QR code/ })).toBeVisible()
  await page.getByRole('button', { name: 'Adicionar bot' }).click()
  await page.getByRole('button', { name: 'Começar a partida' }).click()
  await expect(page.locator('.turn')).toHaveText(/Sua vez, Ana/)
  await page.evaluate(() => navigator.serviceWorker.ready)

  expect(problems).toEqual([])
})
