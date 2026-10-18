import { renderPNG } from '../vendor/pixel-pets/src/node.js'
import { avatarConfig } from '../src/avatar.js'
import assert from 'node:assert/strict'
import { mkdir, mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawn } from 'node:child_process'
import { chromium } from 'playwright-core'

const output = new URL('../test-results/product/', import.meta.url)
await mkdir(output, { recursive: true })
const data = await mkdtemp(join(tmpdir(), 'petcare-ui-'))
const base = 'http://127.0.0.1:4187'
const server = spawn('python3', ['backend/server.py'], { cwd: new URL('../../', import.meta.url), env: { ...process.env, PORT: '4187', PETCARE_HOST: '127.0.0.1', PETCARE_DATA: data, PETCARE_DISABLE_EXTERNALS: '1', PETCARE_ENABLE_WEB_PUSH: '0' }, stdio: 'inherit' })
let browser
const shot = (page, name) => page.screenshot({ path: new URL(name + '.png', output).pathname, fullPage: false })
try {
  let ready = false
  for (let i = 0; i < 100; i++) { try { ready = (await fetch(base)).ok } catch {} if (ready) break; await new Promise(resolve => setTimeout(resolve, 100)) }
  assert.ok(ready, 'The real Python backend starts')
  browser = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox', '--disable-dev-shm-usage'] })
  for (const width of [320, 360, 390, 768, 1440]) for (const theme of ['light', 'dark']) {
    const context = await browser.newContext({ viewport: { width, height: 960 }, colorScheme: theme, hasTouch: width < 760, isMobile: width < 760 })
    const page = await context.newPage(), errors = []
    page.on('pageerror', error => errors.push(error.message))
    const prefix = width + '-' + theme
    try {
      await page.goto(base)
      const demo = page.waitForResponse(response => response.url().endsWith('/api/demo') && response.status() === 200)
      await page.getByRole('button', { name: 'Попробовать без регистрации', exact: true }).click()
      const { demoToken } = await (await demo).json()
      await page.getByRole('heading', { name: 'Питомцы', exact: true }).waitFor()
      await page.evaluate(() => document.fonts.ready)
      if (width < 760) {
        const labels = await page.locator('.mobile-nav').evaluate(nav => [...nav.querySelectorAll('button')].map(button => {
          const label = button.querySelector('span'), range = document.createRange()
          range.selectNodeContents(label)
          const text = range.getBoundingClientRect(), target = button.getBoundingClientRect()
          return { name: label.textContent, left: text.left, right: text.right, targetLeft: target.left, targetRight: target.right }
        }))
        assert.equal(labels.length, 5)
        for (let index = 0; index < labels.length; index++) {
          const label = labels[index]
          assert.ok(label.left >= label.targetLeft - 1 && label.right <= label.targetRight + 1, label.name + ': text fits its navigation target')
          if (index) assert.ok(labels[index - 1].right + 2 <= label.left, 'Navigation labels do not overlap')
        }
      }
      const headers = { 'X-PetCare-Demo': demoToken }
      const state = await (await context.request.get(base + '/api/state', { headers })).json()
      assert.equal(state.pets.length, 6)
      for (const pet of state.pets) for (const kind of ['health', 'food', 'reminder']) assert.ok(pet.records.filter(record => record.kind === kind).length >= (kind === 'reminder' ? 2 : 4), pet.name + ': populated ' + kind)
      const pig = state.pets.find(pet => pet.name === 'Торпедка')
      assert.equal(pig.species, 'minipig')
      if (width < 760) await page.getByRole('button', { name: /^(Открыть|Показать) меню$/ }).click()
      const picker = page.getByRole('combobox', { name: 'Текущий питомец', exact: true }).filter({ visible: true })
      await picker.click()
      const menu = page.locator('.pixel-select-menu')
      await menu.waitFor()
      assert.equal(await page.locator('select[data-slot="native-select"]').count(), 0, 'No platform select popup')
      assert.ok(await menu.evaluate(element => { const style = getComputedStyle(element), box = element.getBoundingClientRect(); return style.borderImageSource !== 'none' && style.borderRadius === '0px' && box.left >= 0 && box.right <= innerWidth }), 'Pixel menu is framed and stays in viewport')
      await shot(page, prefix + '-pet-menu')
      await page.getByRole('option', { name: 'Торпедка', exact: true }).click()
      if (width < 760) await page.keyboard.press('Escape')
      const companion = page.getByRole('button', { name: 'Поднять питомца Торпедка', exact: true })
      await companion.waitFor()
      const box = await companion.boundingBox(), from = { x: box.x + 36, y: box.y + 36 }, to = { x: Math.min(width - 40, from.x + 80), y: 540 }
      let touch
      if (width < 760) {
        touch = await context.newCDPSession(page)
        await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ ...from, id: 1 }] })
        await touch.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ ...to, id: 1 }] })
} else { await page.mouse.move(from.x, from.y); await page.mouse.down(); await page.mouse.move(to.x, to.y, { steps: 12 }) }
      await page.waitForFunction(() => document.querySelector('.pet-companion')?.dataset.state.startsWith('held'))
      assert.ok((await companion.boundingBox()).y < 650, 'Pet follows the pointer above the floor')
      await shot(page, prefix + '-pet-held')
      if (touch) await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); else await page.mouse.up()
      const samples = await companion.evaluate(element => new Promise(resolve => { const values = [], start = performance.now(); function sample() { values.push({ y: element.getBoundingClientRect().y, state: element.dataset.state }); if (performance.now() - start < 1700) requestAnimationFrame(sample); else resolve(values) } sample() }))
      assert.ok(samples.some(item => item.state === 'falling'), 'Release enters falling state')
      assert.ok(samples.some((item, i) => i && item.y < samples[i - 1].y - .2), 'Pet bounces upward after landing')
      assert.equal(await companion.getAttribute('data-state'), 'walk', 'Pet resumes walking')
      await shot(page, prefix + '-pet-landed')
      assert.equal(await page.locator('.pet-companion-layer').evaluate(element => element.parentElement === document.body), true, 'Companion is outside scrolling content')
      if (width < 760) {
        for (const height of [820, 960]) {
          await page.setViewportSize({ width, height })
          await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
          await page.waitForFunction(() => { const pet = document.querySelector('.pet-companion').getBoundingClientRect(), nav = document.querySelector('.mobile-nav').getBoundingClientRect(); return Math.abs(nav.top - pet.bottom - 8) < 2 })
        }
        await page.evaluate(() => window.scrollTo(0, 0))
      }
      await page.locator(width < 760 ? '[data-guide-mobile="search"]' : '[data-guide="search"]').click()
      await page.getByRole('heading', { name: 'Поиск по записям', exact: true }).waitFor()
      const layout = await page.locator('.search-page').evaluate(element => { const image = element.querySelector('.search-emblem').getBoundingClientRect(), button = element.querySelector('button').getBoundingClientRect(), hint = element.querySelector('.search-placeholder').getBoundingClientRect(); return { imageY: image.y + image.height / 2, buttonY: button.y + button.height / 2, gap: hint.top - Math.max(image.bottom, button.bottom), height: element.getBoundingClientRect().height } })
      assert.ok(Math.abs(layout.imageY - layout.buttonY) < 3, 'Diary illustration stays beside Find')
      assert.ok(layout.gap >= 0 && layout.gap <= 24, 'No empty stage before the search hint')
      if (width < 760) assert.ok(layout.height < 280, 'Mobile search panel fits its contents')
      await shot(page, prefix + '-search')
      await page.getByRole('button', { name: 'Питомцы', exact: true }).filter({ visible: true }).first().click()
      await page.getByRole('button', { name: 'Добавить питомца', exact: true }).first().click()
      const dialog = page.locator('[data-slot="dialog-content"]')
      await dialog.waitFor()
      assert.ok(await dialog.evaluate(element => getComputedStyle(element).borderImageSource !== 'none'), 'Dialog uses a pixel frame')
      const animal = page.locator('.animal-selection')
      await animal.click()
      assert.equal(await animal.getAttribute('aria-expanded'), 'true')
      assert.ok(await page.getByRole('button', { name: 'По фото', exact: true }).isVisible(), 'Photo controls stay discoverable')
      await animal.click()
      assert.equal(await animal.getAttribute('aria-expanded'), 'false')
      await page.getByRole('button', { name: 'Радуется', exact: true }).click()
      assert.ok(await page.locator('.editor-pet-emotion.is-happy').isVisible())
      await shot(page, prefix + '-constructor')
      await page.keyboard.press('Escape')
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'No horizontal overflow')
      const tag = await (await context.request.get(base + '/api/tags/manage/' + pig.id, { headers })).json()
      await page.goto(base + '/tag/' + tag.token)
      await page.getByRole('heading', { name: 'Торпедка', exact: true }).waitFor()
      assert.ok(await page.getByText('Я потерялся', { exact: false }).isVisible())
      await shot(page, prefix + '-torpedka-tag')
      await page.getByRole('button', { name: 'Сообщить, где питомец', exact: true }).click()
      await page.locator('input[type="file"]').setInputFiles({ name: 'iphone-photo.png', mimeType: 'image/png', buffer: Buffer.from(renderPNG(avatarConfig(pig), { scale: 2 })) })
      const addedPhoto = page.getByRole('img', { name: 'Добавленное фото', exact: true })
      await addedPhoto.waitFor()
      assert.ok((await addedPhoto.getAttribute('src')).startsWith('data:image/jpeg;base64,'), 'Photo is decoded under production CSP and converted to JPEG')
      await page.getByRole('textbox', { name: 'Адрес или ориентир', exact: true }).fill('Тестовый парк')
      const photoMarker = 'CI photo ' + prefix
      await page.getByRole('textbox', { name: 'Комментарий', exact: true }).fill(photoMarker)
      await page.getByRole('button', { name: 'Проверить и отправить', exact: true }).click()
      await page.getByRole('img', { name: 'Фото, которое получит владелец', exact: true }).waitFor()
      // Four deliveries stay below the public six-per-minute abuse limit.
      if (width === 390 || width === 1440) {
      const [delivery] = await Promise.all([
        page.waitForResponse(response => response.url().endsWith('/report') && response.request().method() === 'POST'),
        page.getByRole('button', { name: 'Отправить владельцу', exact: true }).click(),
      ])
      assert.equal(delivery.status(), 200, await delivery.text())
      await page.getByText('Сообщение сохранено в пробной карточке.', { exact: true }).waitFor()
      const reportedTag = await (await context.request.get(base + '/api/tags/manage/' + pig.id, { headers })).json()
      const report = reportedTag.reports.find(item => item.kind === 'report' && item.data.comment === photoMarker)
      assert.ok(report?.data.photo.startsWith('data:image/jpeg;base64,'), 'Owner receives the persisted report and converted photo')
      }
      assert.deepEqual(errors, [], 'No client errors')
      console.log('PASS product ' + prefix + ': six histories, custom menu, pointer/touch drag, bounce, constructor and lost tag')
    } catch (error) { await shot(page, prefix + '-failure'); throw error } finally { await context.close() }
  }
} finally { await browser?.close(); server.kill('SIGTERM') }
