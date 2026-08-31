// 안무 검증 — 내비·푸터·CTA 노출 시각 + 홀드 중 실제로 가려져 있는지
import { chromium } from "/opt/node22/lib/node_modules/playwright/index.mjs"
const b=await chromium.launch({executablePath:"/opt/pw-browsers/chromium",args:["--no-sandbox"]})
const p=await b.newPage({viewport:{width:390,height:844},reducedMotion:"no-preference"})
await p.addInitScript(()=>{window.__c=[];const f=()=>{const r=document.querySelector('[data-intro]')
  if(r){const h=document.querySelector('[data-intro] > header'), m=document.querySelector('[data-lz-mask]')
    const c=document.querySelector('[data-lz-chrome]')
    window.__c.push([Math.round(performance.now()), r.getAttribute('data-intro'), r.getAttribute('data-cta'),
      h?+getComputedStyle(h).opacity:null, m?+getComputedStyle(m).opacity:null, c?+getComputedStyle(c).opacity:null])}
  requestAnimationFrame(f)};requestAnimationFrame(f)})
await p.goto("http://localhost:3000/lazyday/preview/hero-check",{waitUntil:"load",timeout:60000})
await p.waitForTimeout(11000)
const r=await p.evaluate(()=>{
  const L=window.__c; if(!L.length) return {오류:'셸 없음'}
  const t0=L[0][0], ev=[]
  let pi=null,pc=null
  for(const [t,i,c,ho,mo,co] of L){
    if(i!==pi||c!==pc){ ev.push(`${((t-t0)/1000).toFixed(2)}초  intro=${i} cta=${c} · 헤더opacity=${ho} 덮개=${mo} CTA=${co}`); pi=i; pc=c }
  }
  const last=L[L.length-1]
  return {이벤트:ev, 마지막:`헤더 ${last[3]} · 덮개 ${last[4]} · CTA ${last[5]}`}
})
console.log(r['오류']||[...r['이벤트'],'끝: '+r['마지막']].join("\n"))
await b.close()
