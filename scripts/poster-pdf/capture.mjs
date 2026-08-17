// 캡처 — 겹쳐 보기 기본 OFF 이므로: 먼저 렌더만, 그다음 체크박스 켜서 겹침
import { chromium } from "/opt/node22/lib/node_modules/playwright/index.mjs"
const b=await chromium.launch({executablePath:"/opt/pw-browsers/chromium",args:["--no-sandbox"]})
const p=await b.newPage({viewport:{width:430,height:900},deviceScaleFactor:3,reducedMotion:"no-preference"})
await p.goto("http://localhost:3000/lazyday/preview/hero-check",{waitUntil:"load",timeout:60000})
await p.waitForTimeout(5000)
const stage=await p.$("[class*='stage']")
const state=await p.evaluate(()=>document.querySelector("input[type=checkbox]").checked)
if(state) throw new Error("겹쳐 보기가 기본 켜짐 — 캡처 순서 재확인 필요")
await stage.screenshot({path:"/tmp/cap-render.png"})       // 렌더만
await p.evaluate(()=>document.querySelector("input[type=checkbox]").click())
await p.waitForTimeout(400)
const on=await p.evaluate(()=>document.querySelector("input[type=checkbox]").checked)
if(!on) throw new Error("겹쳐 보기 토글 실패")
await stage.screenshot({path:"/tmp/cap-overlay.png"})      // 원본 겹침
console.log("saved (검증: 겹쳐보기 기본 OFF 확인, 토글 ON 확인)")
await b.close()
