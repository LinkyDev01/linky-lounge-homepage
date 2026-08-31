// 진입 중 font-size 변화 추적 — 몇 번, 언제, 얼마나 바뀌나 (운영자 "폰트 바뀌는 것")
import { chromium } from "/opt/node22/lib/node_modules/playwright/index.mjs"
const D=Number(process.argv[2]??600)
const LS=process.argv[3]||""
const b=await chromium.launch({executablePath:"/opt/pw-browsers/chromium",args:["--no-sandbox"]})
const p=await b.newPage({viewport:{width:390,height:844},reducedMotion:"no-preference"})
if(D>0) await p.route(/pretendard|\.woff2?$/i, async r=>{await new Promise(x=>setTimeout(x,D)); await r.continue()})
if(LS) await p.addInitScript((ls)=>{ const add=()=>{ const st=document.createElement('style')
  st.textContent=`svg[data-lz-poster] text{letter-spacing:${ls} !important}`; document.head.appendChild(st) }
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',add):add() }, LS)
await p.addInitScript(()=>{window.__s=[];const f=()=>{
  const tp=document.querySelector('svg[data-lz-poster] textPath[data-stream]')
  if(tp){const t=tp.closest('text'); const fs=getComputedStyle(t).fontSize
    const sp=tp.querySelectorAll('tspan'); let v=0
    for(const e of sp) if(parseFloat(getComputedStyle(e).opacity)>0.5) v++
    const L=window.__s[window.__s.length-1]
    if(!L||L[1]!==fs) window.__s.push([Math.round(performance.now()), fs, v, sp.length])}
  requestAnimationFrame(f)};requestAnimationFrame(f)})
await p.goto("http://localhost:3000/lazyday/preview/hero-check",{waitUntil:"load",timeout:60000})
await p.waitForTimeout(9000)
const r=await p.evaluate(()=>window.__s)
console.log(`[폰트지연 ${D}ms ls=${LS||"기본"}] 크기 변경 ${r.length-1}회`)
for(const [t,fs,v,n] of r) console.log(`  ${String(t).padStart(6)}ms  ${fs.padStart(9)}  보임 ${v}/${n}`)
await b.close()
