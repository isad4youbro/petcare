import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import { chromium } from 'playwright-core'
const output = new URL('../test-results/welcome/', import.meta.url)
await mkdir(output, { recursive: true })
const server = spawn(process.execPath, [new URL('../node_modules/vite/bin/vite.js', import.meta.url).pathname, 'preview', '--host', '127.0.0.1', '--port', '4173', '--strictPort'], { cwd: new URL('../', import.meta.url), stdio: 'inherit' })
let browser
try {
  let ready = false
  for (let attempt = 0; attempt < 100; attempt++) {
    try { ready = (await fetch('http://127.0.0.1:4173/')).ok } catch {}
    if (ready) break
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  assert.ok(ready, 'Vite preview starts')
  browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox', '--disable-dev-shm-usage'] })
  for (const width of [320, 390, 768, 1440]) for (const scheme of ['light', 'dark']) {
    const context = await browser.newContext({ viewport: { width, height: 960 }, colorScheme: scheme, reducedMotion: 'reduce' })
    const page = await context.newPage(), errors = []
    page.on('pageerror', error => errors.push(error.message))
    await page.route('**/api/**', route => route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ error: 'Войдите в аккаунт' }) }))
    await page.goto('http://127.0.0.1:4173/', { waitUntil: 'networkidle' })
    await page.getByRole('heading', { name: 'Создать аккаунт', exact: true }).waitFor()
    const themeIs = async value => page.waitForFunction(theme => document.documentElement.dataset.theme === theme, value)
    await themeIs(scheme)
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'No horizontal overflow at ' + width)
    const fields = await page.locator('.auth-page input').evaluateAll(elements => elements.map(element => ({ radius: getComputedStyle(element).borderRadius, edge: getComputedStyle(element).borderImageSource, left: element.getBoundingClientRect().left, right: element.getBoundingClientRect().right })))
    for (const field of fields) { assert.equal(field.radius, '0px'); assert.notEqual(field.edge, 'none'); assert.ok(field.left >= 0 && field.right <= width) }
    await page.screenshot({ path: new URL(width + '-' + scheme + '.png', output).pathname, fullPage: true })
    const opposite = scheme === 'dark' ? 'light' : 'dark'
    await page.emulateMedia({ colorScheme: opposite }); await themeIs(opposite)
    await page.getByRole('button', { name: /Выбрать тему/ }).click()
    await page.getByRole('radio', { name: 'Светлая', exact: true }).click()
    await themeIs('light')
    await page.emulateMedia({ colorScheme: 'dark' }); await themeIs('light')
    await page.reload({ waitUntil: 'networkidle' }); await themeIs('light')
    await page.getByRole('button', { name: /Выбрать тему/ }).click()
    assert.ok(await page.locator('.theme-menu').evaluate(element => { const rect = element.getBoundingClientRect(); return rect.left >= 0 && rect.right <= innerWidth }), 'Theme menu stays inside viewport')
    await page.getByRole('radio', { name: 'Как в системе', exact: true }).click()
    await themeIs('dark')
    await page.emulateMedia({ colorScheme: 'light' }); await themeIs('light')
    await page.getByRole('button', { name: /Выбрать тему/ }).click()
    await page.getByRole('radio', { name: 'Тёмная', exact: true }).click()
    await themeIs('dark')
    for (const [path, heading] of [['404', 'Страница потерялась'], ['403', 'Сюда пока нельзя']]) {
      await page.goto(`http://127.0.0.1:4173/${path}`, { waitUntil: 'networkidle' })
      await page.getByRole('heading', { name: heading, exact: true }).waitFor()
      await page.getByRole('button', { name: 'Вернуться в PetCare' }).waitFor()
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `No ${path} horizontal overflow at ${width}`)
      await page.screenshot({ path: new URL(`${path}-${width}-${scheme}.png`, output).pathname, fullPage: true })
    }
    assert.deepEqual(errors, [], 'No client errors')
    console.log('PASS welcome ' + width + 'px / ' + scheme + ': pixel fields, overflow, system updates, manual override, reload, return to system')
    await context.close()
  }
} finally { await browser?.close(); server.kill('SIGTERM') }
