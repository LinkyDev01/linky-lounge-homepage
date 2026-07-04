#!/usr/bin/env node
/**
 * shot.mjs — 레이지데이 시각 검증용 스크린샷 CLI (Playwright)
 *
 * UI 변경 후 "됐다"고 선언하기 전에 반드시 이 도구로 렌더 증거를 남긴다.
 * (매번 Playwright 보일러플레이트를 새로 쓰지 말 것 — 이 파일 하나로 통일)
 *
 * 사용:
 *   node scripts/shot.mjs --url http://localhost:3000/lazyday --out /tmp/a.png
 *   node scripts/shot.mjs --url ... --selector "#faq" --out faq.png          # 특정 섹션만
 *   node scripts/shot.mjs --url ... --click "인터뷰는 왜 하나요?" --out b.png  # 클릭 후 캡처
 *   node scripts/shot.mjs --url ... --full --out full.png                    # 전체 페이지
 *   node scripts/shot.mjs --url ... --eval "getComputedStyle(document.querySelector('nav')).backgroundColor"
 *
 * 옵션: --width(기본 390 = 모바일 기준 뷰포트) --height(844) --wait(ms, 기본 900)
 *       --click 는 여러 번 지정 가능 (순서대로 클릭, 각 클릭 후 500ms 대기)
 * 주의: 이 원격 환경의 Playwright는 외부 HTTPS에 못 나간다(프록시 미설정).
 *       배포 URL 검증은 curl 쿠키자(-c/-b)로 할 것. 이 도구는 localhost 전용.
 */

const args = process.argv.slice(2)
function opt(name, def) {
  const i = args.indexOf(`--${name}`)
  return i === -1 ? def : args[i + 1]
}
function optAll(name) {
  const out = []
  args.forEach((a, i) => { if (a === `--${name}`) out.push(args[i + 1]) })
  return out
}
const has = (name) => args.includes(`--${name}`)

const url = opt('url')
const out = opt('out')
const sel = opt('selector')
const evalExpr = opt('eval')
if (!url || (!out && !evalExpr)) {
  console.error('필수: --url <주소> 와 --out <파일.png> (또는 --eval <표현식>)')
  process.exit(1)
}

// 원격 실행환경: 전역 Playwright + 사전 설치 Chromium. 로컬이면 프로젝트 것 사용.
let chromium
try { ({ chromium } = await import('playwright')) }
catch { ({ chromium } = await import('/opt/node22/lib/node_modules/playwright/index.mjs')) }
const { existsSync } = await import('node:fs')
const exe = process.env.PW_CHROMIUM
  || (existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined)

const browser = await chromium.launch({ executablePath: exe, args: ['--no-sandbox'] })
try {
  const page = await browser.newPage({
    viewport: { width: Number(opt('width', 390)), height: Number(opt('height', 844)) },
  })
  await page.goto(url, { waitUntil: 'networkidle' })
  await page.waitForTimeout(Number(opt('wait', 900)))

  for (const text of optAll('click')) {
    await page.locator(`button:has-text("${text}"), [role=tab]:has-text("${text}"), a:has-text("${text}")`).first().click()
    await page.waitForTimeout(500)
  }

  if (evalExpr) {
    const result = await page.evaluate(evalExpr)
    console.log(JSON.stringify(result))
  }

  if (out) {
    if (sel) {
      const target = page.locator(sel).first()
      await target.scrollIntoViewIfNeeded()
      await page.waitForTimeout(500)
      await target.screenshot({ path: out })
    } else {
      await page.screenshot({ path: out, fullPage: has('full') })
    }
    console.log(`saved: ${out}`)
  }
} finally {
  await browser.close()
}
