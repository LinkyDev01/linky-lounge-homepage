// 검수 ①②③ — 폰트 지연(콜드 로드) 상태에서 진입 재시작 / 전문 누락 / 크기 보정
import { chromium } from "/opt/node22/lib/node_modules/playwright/index.mjs"
const DELAY = Number(process.argv[2] ?? 1600)
const URL = "http://localhost:3000/lazyday/preview/hero-check"
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium", args: ["--no-sandbox"] })
const p = await b.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: "no-preference" })
if (DELAY > 0) await p.route(/pretendard|\.woff2?$/i, async (r) => { await new Promise((x) => setTimeout(x, DELAY)); await r.continue() })
await p.addInitScript(() => {
  window.__log = []
  const tick = () => {
    const s = document.querySelector("svg[data-lz-poster]")
    if (s) {
      const tp = s.querySelector("textPath")
      if (tp) {
        const sp = tp.querySelectorAll("tspan")
        let vis = 0
        for (const e of sp) if (parseFloat(getComputedStyle(e).opacity) > 0.5) vis++
        const t = tp.closest("text")
        window.__log.push({ t: Math.round(performance.now()), n: sp.length, vis, fs: getComputedStyle(t).fontSize })
      }
    }
    requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
})
await p.goto(URL, { waitUntil: "load", timeout: 60000 })
await p.waitForTimeout(9000)

const r = await p.evaluate(() => {
  const L = window.__log
  // ① 재시작 = 보이는 글자 수가 떨어지는 순간 (정지는 떨어지지 않는다)
  let drops = [], maxDrop = 0, jumps = []
  for (let i = 1; i < L.length; i++) {
    const d = L[i].vis - L[i - 1].vis
    if (L[i].n === L[i - 1].n) {
      if (d < -2) { drops.push({ t: L[i].t, from: L[i - 1].vis, to: L[i].vis }); maxDrop = Math.max(maxDrop, -d) }
      if (d > 20) jumps.push({ t: L[i].t, from: L[i - 1].vis, to: L[i].vis, d })
    }
  }
  const s = document.querySelector("svg[data-lz-poster]")
  const path = s.querySelector("#heroSayuThread")
  const tp = s.querySelector("textPath")
  const textEl = tp.closest("text")
  const Ltot = path.getTotalLength()
  const anims = [...tp.querySelectorAll("animate")].map((a) => ({ values: a.getAttribute("values"), dur: a.getAttribute("dur") }))
  // 흐름 단계면 통짜 — K벌. 피치 P 는 SMIL values 에서 역산
  const total = textEl.getComputedTextLength()
  const fs = getComputedStyle(textEl).fontSize
  // 첫 벌 한 바퀴 커버율: SMIL 2번째 애니의 이동량이 피치
  let P = null
  if (anims[1]) { const v = anims[1].values.split(";").map(Number); P = Math.abs(v[1] - v[0]) }
  // 실제로 몇 글자가 경로 위에 그려지나 (마지막 벌 제외한 1벌 기준)
  const nChars = tp.textContent.length
  let drawn = 0
  for (let i = 0; i < nChars; i++) { try { if (tp.getExtentOfChar(i).width > 0) drawn++ } catch (e) { } }
  return { frames: L.length, drops, maxDrop, jumps: jumps.slice(0, 6), Ltot: +Ltot.toFixed(2), fs, total: +total.toFixed(1), P: P && +P.toFixed(2), nChars, drawn, anims }
})
console.log(JSON.stringify(r, null, 1))
await b.close()
