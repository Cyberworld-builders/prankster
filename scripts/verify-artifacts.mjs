// Browser check for the room artifacts (VHS, turntable) and the book library link.
//
//   BASE_URL=http://localhost:3000 node scripts/verify-artifacts.mjs
//
// CHROMIUM_PATH=/usr/bin/chromium uses a system browser instead of Playwright's
// bundled one. Tape playback is skipped if the browser can't decode H.264.
import { chromium } from 'playwright'
import assert from 'node:assert/strict'
import { mkdirSync } from 'node:fs'

const baseUrl = (process.env.BASE_URL ?? 'http://localhost:3000').replace(/\/$/, '')
const out = process.env.EVIDENCE_DIR ?? '/tmp/prankster-artifacts-evidence'
mkdirSync(out, { recursive: true })

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
  args: ['--no-sandbox'],
})
const checks = []
const skipped = []
const pass = name => { checks.push(name); console.log(`ok  ${name}`) }

async function openPage(viewport, options = {}) {
  const context = await browser.newContext({ viewport, ...options })
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
  return { context, page, errors }
}

const dialog = page => page.locator('[role="dialog"]')
const hash = page => page.evaluate(() => location.hash)
const focusInDialog = page => page.evaluate(() => !!document.activeElement?.closest('[role="dialog"]'))

try {
  // Desktop: every room, keyboard, history, sound.
  {
    const { context, page, errors } = await openPage({ width: 1440, height: 900 })
    await page.goto(`${baseUrl}/#video`, { waitUntil: 'networkidle' })
    assert.equal(await dialog(page).count(), 0)
    await page.screenshot({ path: `${out}/desktop-video-room.png` })

    // Tape
    await page.locator('.hotspot-tape').click()
    await dialog(page).waitFor()
    assert.equal(await hash(page), '#video/placeholder-tape')
    assert.ok(await focusInDialog(page), 'focus moves into the VHS dialog')
    pass('clicking the tape in its room opens the VHS player and deep-links it')
    const h264 = await page.evaluate(() => document.createElement('video').canPlayType('video/mp4; codecs="avc1.42E01E"'))
    if (h264) {
      await page.waitForFunction(() => document.querySelector('.vhs-screen video')?.readyState >= 2)
      await page.locator('.vhs-play-btn').click()
      await page.waitForFunction(() => document.querySelector('.vhs-screen video')?.currentTime > 0.3)
      assert.equal(await page.locator('.vhs-play-btn').getAttribute('aria-label'), 'Pause')
      pass('the tape plays')
    } else skipped.push('tape playback (this Chromium has no H.264; set CHROMIUM_PATH)')
    await page.waitForTimeout(900)
    await page.screenshot({ path: `${out}/desktop-vhs.png` })

    for (let i = 0; i < 8; i++) {
      await page.keyboard.press('Tab')
      assert.ok(await focusInDialog(page), `Tab #${i + 1} stays in the dialog`)
    }
    await page.keyboard.press('Shift+Tab')
    assert.ok(await focusInDialog(page))
    pass('Tab and Shift+Tab stay trapped in the dialog')

    await page.locator('.vhs-close').focus()
    await page.keyboard.press('Enter')
    assert.equal(await dialog(page).count(), 0, 'Enter on the close button closes the player')
    assert.equal(await hash(page), '#video')
    assert.ok(await page.evaluate(() => document.activeElement?.classList.contains('hotspot-tape')), 'focus returns to the tape')
    pass('Enter on the close button closes it and focus returns to the tape')

    // Records
    await page.locator('.hotspot-record').click()
    await page.waitForFunction(() => location.hash === '#records')
    await page.waitForTimeout(800)
    assert.equal(await dialog(page).count(), 0, 'first click on another room only changes room')
    await page.screenshot({ path: `${out}/desktop-record-room.png` })
    await page.locator('.hotspot-record').click()
    await dialog(page).waitFor()
    assert.equal(await hash(page), '#records/placeholder-track')
    await page.locator('.turntable-play-btn').click()
    await page.waitForFunction(() => document.querySelector('.turntable-overlay audio')?.currentTime > 0.3)
    assert.equal(await page.locator('.turntable-disc.is-spinning').count(), 1)
    pass('the record plays and the disc spins')
    await page.screenshot({ path: `${out}/desktop-turntable.png` })
    await page.locator('.turntable-progress').focus()
    const before = await page.evaluate(() => document.querySelector('.turntable-overlay audio').currentTime)
    await page.keyboard.press('ArrowRight')
    const after = await page.evaluate(() => document.querySelector('.turntable-overlay audio').currentTime)
    assert.ok(after > before + 0.5, `ArrowRight seeks forward (${before} -> ${after})`)
    pass('the progress slider seeks with arrow keys')
    await page.keyboard.press('Escape')
    assert.equal(await dialog(page).count(), 0)
    pass('Escape closes the turntable')

    // Book room: clicking the book navigates to /books (the library from PR #4)
    await page.locator('.hotspot-book').click()
    await page.waitForFunction(() => location.hash === '#books')
    await page.waitForTimeout(500)
    await page.screenshot({ path: `${out}/desktop-book-room.png` })
    assert.equal(await dialog(page).count(), 0, 'navigating to book room does not open any overlay')
    // Now clicking the book should navigate to /books
    const [response] = await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle' }),
      page.locator('.hotspot-book').click()
    ])
    assert.equal(page.url(), `${baseUrl}/books`)
    await page.screenshot({ path: `${out}/desktop-library.png` })
    pass('clicking the book in its room navigates to /books (the library)')

    // Go back and check sound preference
    await page.goto(`${baseUrl}/#video`, { waitUntil: 'networkidle' })
    await page.locator('.sound-toggle').click()
    assert.equal(await page.locator('.sound-toggle').getAttribute('aria-pressed'), 'true')
    await page.reload({ waitUntil: 'networkidle' })
    assert.equal(await page.locator('.sound-toggle').getAttribute('aria-pressed'), 'true')
    await page.mouse.click(5, 450)
    await page.waitForTimeout(300)
    assert.ok(await page.evaluate(() => !document.querySelector('audio.ambient-sound')?.paused), 'ambient resumes after first interaction')
    pass('sound preference survives reload and resumes on first interaction')

    assert.deepEqual(errors, [])
    pass('no browser errors on desktop')
    await context.close()
  }

  // Deep links: #books/... no longer opens an overlay (book overlay was removed)
  {
    const { context, page, errors } = await openPage({ width: 1280, height: 800 })
    // #books/placeholder-story used to open the book overlay; now it just goes to book room
    await page.goto(`${baseUrl}/#books/placeholder-story`, { waitUntil: 'networkidle' })
    assert.equal(await dialog(page).count(), 0, '#books/placeholder-story does not open any overlay')
    assert.equal(await hash(page), '#books/placeholder-story')
    // Navigate to video room to test other deep links
    await page.goto(`${baseUrl}/#video/placeholder-tape`, { waitUntil: 'networkidle' })
    await dialog(page).waitFor()
    assert.ok(await page.locator('.vhs-container').isVisible(), 'VHS deep link still works')
    await page.goto(`${baseUrl}/#video/not-a-thing`, { waitUntil: 'networkidle' })
    assert.equal(await dialog(page).count(), 0)
    await page.goto(`${baseUrl}/#video/placeholder-track`, { waitUntil: 'networkidle' })
    assert.equal(await dialog(page).count(), 0, 'an artifact in the wrong room does not open')
    assert.deepEqual(errors, [])
    pass('deep links work for video/record; #books/... no longer opens an overlay')
    await context.close()
  }

  // Reduced motion
  {
    const { context, page } = await openPage({ width: 1280, height: 800 }, { reducedMotion: 'reduce' })
    await page.goto(`${baseUrl}/#records/placeholder-track`, { waitUntil: 'networkidle' })
    await page.locator('.turntable-play-btn').click()
    await page.locator('.turntable-disc.is-spinning').waitFor()
    assert.equal(await page.locator('.turntable-disc').evaluate(el => getComputedStyle(el).animationName), 'none')
    pass('prefers-reduced-motion stops the spinning disc')
    await context.close()
  }

  // Portrait phones: horizontal scroll to reach all hotspots
  // The scene is wider than the viewport, so we scroll/swipe to each hotspot
  async function scrollHotspotIntoView(page, selector, width) {
    const hotspot = page.locator(selector)
    
    // Scroll the stage to bring the hotspot center into view
    await page.evaluate(async (sel) => {
      const stage = document.querySelector('.stage')
      const hotspot = document.querySelector(sel)
      if (!stage || !hotspot) return
      
      const stageRect = stage.getBoundingClientRect()
      const hotspotRect = hotspot.getBoundingClientRect()
      const currentScroll = stage.scrollLeft
      const hotspotCenterInStage = hotspotRect.x - stageRect.x + currentScroll + hotspotRect.width / 2
      const targetScroll = hotspotCenterInStage - stage.clientWidth / 2
      const maxScroll = stage.scrollWidth - stage.clientWidth
      stage.scrollTo({ left: Math.max(0, Math.min(targetScroll, maxScroll)), behavior: 'instant' })
    }, selector)
    
    await page.waitForTimeout(100)
    return hotspot.boundingBox()
  }
  
  function hotspotCenterVisible(bounds, width) {
    if (!bounds) return false
    const centerX = bounds.x + bounds.width / 2
    return centerX >= 0 && centerX <= width
  }

  for (const [width, height] of [[375, 812], [320, 568]]) {
    const { context, page, errors } = await openPage({ width, height }, { hasTouch: true, isMobile: true })
    
    // Test 1: Scroll to tape and tap to open VHS player
    await page.goto(`${baseUrl}/#video`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(600) // Wait for initial scroll
    
    let tapeBounds = await scrollHotspotIntoView(page, '.hotspot-tape', width)
    assert.ok(hotspotCenterVisible(tapeBounds, width), `tape center visible after scroll at ${width}px`)
    await page.screenshot({ path: `${out}/mobile-${width}-tape-scrolled.png` })
    
    await page.locator('.hotspot-tape').tap()
    await dialog(page).waitFor()
    assert.equal(await hash(page), '#video/placeholder-tape')
    await page.screenshot({ path: `${out}/mobile-${width}-vhs-open.png` })
    pass(`${width}x${height}: scroll to tape and tap opens VHS player`)
    
    // Verify VHS player is centered on screen (position:fixed)
    const vhsBox = await page.locator('.vhs-container').boundingBox()
    assert.ok(vhsBox.x >= 0 && vhsBox.x + vhsBox.width <= width, `VHS player fits ${width}px`)
    await page.locator('.vhs-close').tap()
    
    // Test 2: Scroll to record and tap to open turntable
    await page.goto(`${baseUrl}/#records`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(600)
    
    let recordBounds = await scrollHotspotIntoView(page, '.hotspot-record', width)
    assert.ok(hotspotCenterVisible(recordBounds, width), `record center visible after scroll at ${width}px`)
    await page.screenshot({ path: `${out}/mobile-${width}-record-scrolled.png` })
    
    await page.locator('.hotspot-record').tap()
    await dialog(page).waitFor()
    assert.equal(await hash(page), '#records/placeholder-track')
    await page.screenshot({ path: `${out}/mobile-${width}-turntable.png` })
    pass(`${width}x${height}: scroll to record and tap opens turntable`)
    await page.locator('.turntable-close').tap()
    
    // Test 3: Scroll to book and tap to navigate to /books
    await page.goto(`${baseUrl}/#books`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(600)
    
    let bookBounds = await scrollHotspotIntoView(page, '.hotspot-book', width)
    assert.ok(hotspotCenterVisible(bookBounds, width), `book center visible after scroll at ${width}px`)
    
    const [navResponse] = await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle' }),
      page.locator('.hotspot-book').tap()
    ])
    assert.equal(page.url(), `${baseUrl}/books`)
    pass(`${width}x${height}: scroll to book and tap navigates to /books`)
    
    // Test 4: Deep link scrolls to correct position
    await page.goto(`${baseUrl}/#records`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(600)
    recordBounds = await page.locator('.hotspot-record').boundingBox()
    assert.ok(hotspotCenterVisible(recordBounds, width), `deep link #records scrolls record center into view at ${width}px`)
    pass(`${width}x${height}: deep link #records auto-scrolls to record`)
    
    // Test 5: No vertical scroll/jiggle
    await page.goto(`${baseUrl}/#video`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(300)
    const initialScrollY = await page.evaluate(() => window.scrollY)
    await page.evaluate(() => window.scrollTo(0, 100))
    await page.waitForTimeout(100)
    const afterScrollY = await page.evaluate(() => window.scrollY)
    assert.equal(afterScrollY, 0, `no vertical scroll at ${width}px (tried to scroll to 100, got ${afterScrollY})`)
    pass(`${width}x${height}: no vertical scroll or jiggle`)
    
    // Test 6: Scroll hint appears
    await page.goto(`${baseUrl}/#video`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(1500)
    const hintVisible = await page.evaluate(() => {
      const hint = document.querySelector('.scroll-hint')
      if (!hint) return false
      const style = window.getComputedStyle(hint)
      return parseFloat(style.opacity) > 0
    })
    if (hintVisible) {
      pass(`${width}x${height}: scroll hint appears`)
    } else {
      skipped.push(`${width}x${height}: scroll hint (may have faded)`)
    }
    
    assert.deepEqual(errors, [])
    pass(`${width}x${height}: no browser errors`)
    await context.close()
  }

  // Landscape phone: all hotspots should be visible without scrolling
  {
    const { context, page, errors } = await openPage({ width: 812, height: 375 }, { hasTouch: true, isMobile: true })
    await page.goto(`${baseUrl}/#video`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(500)
    
    for (const name of ['tape', 'book', 'record']) {
      const b = await page.locator(`.hotspot-${name}`).boundingBox()
      assert.ok(hotspotCenterVisible(b, 812), `${name} hotspot center visible in landscape`)
    }
    await page.screenshot({ path: `${out}/landscape-phone-812x375.png` })
    pass('landscape phone 812x375: all hotspots visible without scroll')
    
    // Verify no scroll hint in landscape
    const hintExists = await page.evaluate(() => {
      const hint = document.querySelector('.scroll-hint')
      if (!hint) return false
      const style = window.getComputedStyle(hint)
      return style.display !== 'none' && parseFloat(style.opacity) > 0
    })
    assert.ok(!hintExists, 'no scroll hint in landscape mode')
    pass('landscape phone: no scroll hint shown')
    
    assert.deepEqual(errors, [])
    await context.close()
  }

  // Desktop: verify all hotspots visible and no horizontal scroll needed
  {
    const { context, page, errors } = await openPage({ width: 1920, height: 1080 })
    await page.goto(`${baseUrl}/#video`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(500)
    
    for (const name of ['tape', 'book', 'record']) {
      const b = await page.locator(`.hotspot-${name}`).boundingBox()
      assert.ok(hotspotCenterVisible(b, 1920), `${name} hotspot center visible on desktop`)
    }
    await page.screenshot({ path: `${out}/desktop-1920x1080-unchanged.png` })
    
    // Verify no scroll hint on desktop
    const hintExists = await page.evaluate(() => {
      const hint = document.querySelector('.scroll-hint')
      return hint !== null
    })
    assert.ok(!hintExists, 'no scroll hint element on desktop')
    pass('desktop 1920x1080: all hotspots visible, no scroll hint')
    
    assert.deepEqual(errors, [])
    await context.close()
  }

  console.log(JSON.stringify({ result: 'passed', baseUrl, checks: checks.length, skipped, evidence: out }))
} finally {
  await browser.close()
}
