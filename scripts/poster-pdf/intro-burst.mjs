import { chromium } from "/opt/node22/lib/node_modules/playwright/index.mjs"
const D=Number(process.argv[2]??1600)
const b=await chromium.launch({executablePath:"/opt/pw-browsers/chromium",args:["--no-sandbox"]})
const p=await b.newPage({viewport:{width:390,height:844},reducedMotion:"no-preference"})
if(D>0) await p.route(/pretendard|\.woff2?$/i, async r=>{await new Promise(x=>setTimeout(x,D)); await r.continue()})
await p.addInitScript(()=>{window.__t=[];const f=()=>{const s=document.querySelector('svg[data-lz-poster]')
  if(s){const tp=s.querySelector('textPath');const sp=tp?tp.querySelectorAll('tspan'):[]
    let v=0;for(const e of sp) if(parseFloat(getComputedStyle(e).opacity)>0.5) v++
    window.__t.push([Math.round(performance.now()),sp.length,v])}
  requestAnimationFrame(f)};requestAnimationFrame(f)})
await p.goto("http://localhost:3000/lazyday/preview/hero-check",{waitUntil:"load",timeout:60000})
await p.waitForTimeout(9000)
const o=await p.evaluate(()=>{
  const L=window.__t.filter(x=>x[1]>0), out=[]
  for(let i=1;i<L.length;i++){const dv=L[i][2]-L[i-1][2], dt=L[i][0]-L[i-1][0]
    if(dv>20) out.push({t:L[i][0], dv, dt, 초당:Math.round(dv/dt*1000)})}
  return out
})
console.log("프레임당 20자 초과 구간 (dt=프레임 간격ms, 초당=글자/초):")
console.log(o.map(x=>`t=${x.t} +${x.dv}자 dt=${x.dt}ms → ${x['초당']}자/s`).join("\n")||"없음")
await b.close()
