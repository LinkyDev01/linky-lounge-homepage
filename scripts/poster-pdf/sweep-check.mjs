// 마스크 스윕 연속성 — 프레임별 dashoffset (선형·무정지·역행 없음이어야)
import { chromium } from "/opt/node22/lib/node_modules/playwright/index.mjs"
const D=Number(process.argv[2]??400)
const b=await chromium.launch({executablePath:"/opt/pw-browsers/chromium",args:["--no-sandbox"]})
const p=await b.newPage({viewport:{width:390,height:844},reducedMotion:"no-preference"})
if(D>0) await p.route(/pretendard|\.woff2?$/i, async r=>{await new Promise(x=>setTimeout(x,D)); await r.continue()})
await p.addInitScript(()=>{window.__o=[];const f=()=>{
  const u=document.querySelector('svg[data-lz-poster] [data-draw]')
  if(u){ const off=parseFloat(getComputedStyle(u).strokeDashoffset)
    window.__o.push([Math.round(performance.now()), off]) }
  requestAnimationFrame(f)};requestAnimationFrame(f)})
await p.goto("http://localhost:3000/lazyday/preview/hero-check",{waitUntil:"load",timeout:60000})
await p.waitForTimeout(8000)
const r=await p.evaluate(()=>{
  const O=window.__o
  const mv=O.filter((x,i)=>i>0 && x[1]<O[i-1][1])       // 움직인 프레임
  const start=O.find(x=>x[1]<2800), end=O.find(x=>x[1]<=0.5)
  if(!start||!end) return {오류:'스윕 미완', 마지막:O[O.length-1]}
  const dur=end[0]-start[0]
  // 100ms 구간별 이동량 (등속이면 일정: 2800/2.2s = 127.3/100ms)
  const t0=start[0], buckets={}
  for(const [t,off] of O){ const k=Math.floor((t-t0)/100); if(!(k in buckets)||off<buckets[k]) buckets[k]=off }
  const ks=Object.keys(buckets).map(Number).sort((a,b)=>a-b)
  const rates=[]; let prev=2800; const stalls=[]
  for(const k of ks){ if(k<0) continue; const d=prev-buckets[k]; if(buckets[k]>0.5&&d===0) stalls.push(k*100); rates.push(Math.round(d)); prev=buckets[k] }
  // 프레임 간 최대 점프 (툭 끊김 = 큰 점프)
  let mx=0; for(let i=1;i<O.length;i++){ const d=O[i-1][1]-O[i][1]; if(d>mx&&O[i][1]>0.5) mx=d }
  return {스윕시간ms:dur, 구간별이동:rates.slice(0,25).join(','), 정지:stalls.join(',')||'없음',
    프레임최대점프u:+mx.toFixed(1), 이론상한u:+(2800/2200*17).toFixed(1)}
})
console.log(`[폰트지연 ${D}ms]`, JSON.stringify(r))
await b.close()
