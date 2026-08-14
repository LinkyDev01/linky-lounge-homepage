// 그어짐 속도 프로파일 — 100ms 구간별 새로 나타난 글자 수 (등속이면 일정해야)
import { chromium } from "/opt/node22/lib/node_modules/playwright/index.mjs"
const D=Number(process.argv[2]??400)
const b=await chromium.launch({executablePath:"/opt/pw-browsers/chromium",args:["--no-sandbox"]})
const p=await b.newPage({viewport:{width:390,height:844},reducedMotion:"no-preference"})
if(D>0) await p.route(/pretendard|\.woff2?$/i, async r=>{await new Promise(x=>setTimeout(x,D)); await r.continue()})
await p.addInitScript(()=>{window.__v=[];const f=()=>{const tp=document.querySelector('svg[data-lz-poster] textPath[data-stream]')
  if(tp){const sp=tp.querySelectorAll('tspan'); let v=0
    for(const e of sp) if(parseFloat(getComputedStyle(e).opacity)>0.5) v++
    window.__v.push([Math.round(performance.now()), sp.length?v:-1])}
  requestAnimationFrame(f)};requestAnimationFrame(f)})
await p.goto("http://localhost:3100/lazyday/preview/hero-check",{waitUntil:"load",timeout:60000})
await p.waitForTimeout(8000)
const r=await p.evaluate(()=>{
  const V=window.__v.filter(x=>x[1]>=0)
  const first=V.find(x=>x[1]>0), last=V.find(x=>x[1]>=470)
  if(!first||!last) return {오류:'미완'}
  const t0=first[0], t1=last[0]
  const buckets={}
  for(const [t,v] of V){ const k=Math.floor((t-t0)/100); if(!(k in buckets)||v>buckets[k]) buckets[k]=v }
  const ks=Object.keys(buckets).map(Number).sort((a,b)=>a-b).filter(k=>k>=0&&k*100<=t1-t0)
  const rates=[], stalls=[]
  let prev=0
  for(const k of ks){ const d=buckets[k]-prev; rates.push(d); if(d===0&&buckets[k]<470) stalls.push(k*100); prev=buckets[k] }
  return {총시간ms:t1-t0, 구간수:rates.length, 구간별증가:rates.join(','), 정지구간ms:stalls.join(',')||'없음'}
})
console.log(`[폰트지연 ${D}ms]`, JSON.stringify(r))
await b.close()
