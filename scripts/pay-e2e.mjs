/**
 * 결제 경로 회귀 검증 — 주문번호를 서버가 발급하도록 바꾼 뒤 토스 실경로가 그대로 도는지.
 *
 * ⚠ 이 환경의 함정 두 가지 (해결책 포함):
 *  1. Playwright 브라우저는 HTTPS_PROXY 를 자동으로 타지 않는다 → 외부 SDK 가 안 뜬다.
 *  2. 그렇다고 chromium.launch({proxy}) 로 붙이면 **localhost 까지 프록시로 나가** dev 서버에
 *     못 붙는다 (bypass 옵션도 안 먹었다). 프로덕션(HTTPS)에 직접 붙는 것도 Chromium 이
 *     MITM CA 를 안 믿어 ERR_CONNECTION_RESET.
 *  → 그래서 브라우저에는 프록시를 걸지 않고, **외부 호스트 요청만 route 로 가로채
 *    Node fetch(NODE_USE_ENV_PROXY=1 이라 프록시를 탄다)로 중계**한다.
 *    TLS 검증을 끄지 않고 localhost 와 외부 SDK 를 동시에 쓰는 유일한 조합.
 *
 * 실행: NODE_USE_ENV_PROXY=1 node pay-e2e.mjs <url> <out.png>
 */
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs'

const URL_ = process.argv[2]
const OUT = process.argv[3] || '/tmp/pay-e2e.png'
const isLocal = (u) => /^https?:\/\/(localhost|127\.0\.0\.1)(:|\/)/.test(u)

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] })
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } })

let relayed = 0
let relayFail = 0
await ctx.route('**', async (route) => {
  const req = route.request()
  const u = req.url()
  if (isLocal(u) || u.startsWith('data:') || u.startsWith('blob:')) return route.continue()
  try {
    const res = await fetch(u, {
      method: req.method(),
      headers: { ...req.headers(), 'accept-encoding': 'identity' },
      body: ['GET', 'HEAD'].includes(req.method()) ? undefined : req.postDataBuffer(),
      redirect: 'follow',
    })
    const buf = Buffer.from(await res.arrayBuffer())
    const headers = {}
    res.headers.forEach((v, k) => {
      if (!['content-encoding', 'content-length', 'transfer-encoding'].includes(k.toLowerCase())) headers[k] = v
    })
    relayed++
    if (/portone|inicis|kginicis/i.test(u)) console.log(`  [relay ${res.status}] ${u.slice(0, 110)}`)
    return route.fulfill({ status: res.status, headers, body: buf })
  } catch (e) {
    relayFail++
    return route.abort()
  }
})

// 결제창은 **팝업 창**으로 뜬다 (이니시스) — 새 페이지를 잡아 따로 캡처한다
const popups = []
ctx.on('page', async (pg) => {
  popups.push(pg)
  try { await pg.waitForLoadState('domcontentloaded', { timeout: 20000 }) } catch {}
})

const page = await ctx.newPage()
const prepared = []
const payNav = []
const errors = []

page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 130)) })
page.on('response', async (r) => {
  if (r.url().includes('/api/payment/prepare')) prepared.push({ status: r.status(), body: await r.json().catch(() => null) })
})
page.on('framenavigated', (f) => { if (/tosspayments/.test(f.url())) payNav.push(f.url().slice(0, 130)) })

await page.goto(URL_, { waitUntil: 'domcontentloaded', timeout: 60000 })
await page.waitForTimeout(9000)

const widgetFrames = page.frames().filter((f) => /tosspayments/.test(f.url())).length
console.log('중계 성공/실패:', relayed, '/', relayFail)
console.log('토스 위젯 iframe 수:', widgetFrames)

await page.getByPlaceholder('이름').fill('테스트결제')
await page.getByPlaceholder(/연락처/).fill('01012345678')
// 이니시스 V2 는 이메일이 없으면 결제창이 안 열린다
const email = page.getByPlaceholder('이메일')
if (await email.count()) await email.fill('test@example.com')
await page.waitForTimeout(800)

const btn = page.locator('button', { hasText: '결제하기' }).first()
console.log('결제 버튼 활성:', await btn.isEnabled().catch(() => null))
console.log('--- 결제하기 클릭 ---')
await btn.click().catch((e) => console.log('클릭 실패:', String(e).slice(0, 80)))
await page.waitForTimeout(22000)

console.log('prepare 호출:', JSON.stringify(prepared))
console.log('토스 결제창 이동:', payNav.length, payNav.slice(0, 2))
console.log('최종 URL:', page.url().slice(0, 130))
if (errors.length) console.log('콘솔 오류:', errors.slice(0, 6))

await page.screenshot({ path: OUT })

console.log('팝업(결제창) 수:', popups.length - 1)
for (const [i, pg] of popups.slice(1).entries()) {
  try {
    await pg.waitForTimeout(3000)
    const u = pg.url()
    const t = await pg.title().catch(() => '')
    console.log(`  팝업${i + 1}: ${t} | ${u.slice(0, 120)}`)
    await pg.screenshot({ path: OUT.replace(/\.png$/, `-popup${i + 1}.png`) })
  } catch (e) {
    console.log(`  팝업${i + 1} 캡처 실패:`, String(e).slice(0, 80))
  }
}
await browser.close()
