import { chromium } from "/opt/node22/lib/node_modules/playwright/index.mjs"
const b=await chromium.launch({executablePath:"/opt/pw-browsers/chromium",args:["--no-sandbox"]})
const p=await b.newPage({viewport:{width:390,height:844},reducedMotion:"no-preference"})
await p.goto("http://localhost:3000/lazyday",{waitUntil:"load",timeout:60000})
await p.waitForTimeout(4200)
const r=await p.evaluate(async ()=>{
  const s=document.querySelector('svg[data-lz-poster]')
  const tp=s.querySelector('textPath'), path=s.querySelector('#heroSayuThread')
  const L=path.getTotalLength()
  const txt=tp.textContent
  const idx=[]; for(let i=0;i<txt.length;i++) if(txt[i]!==' ') idx.push(i)
  const hist=[]; const t0=performance.now()
  for(let f=0;f<600;f++){
    await new Promise(r=>requestAnimationFrame(r))
    let n=0
    for(const i of idx){ try{ if(tp.getExtentOfChar(i).width>0.01) n++ }catch(e){} }
    hist.push(n)
  }
  const dt=(performance.now()-t0)/hist.length
  const mode=hist.slice().sort((a,b)=>a-b)[Math.floor(hist.length/2)]
  const drops=hist.map((v,i)=>({i,v})).filter(x=>x.v<mode)
  return {L:+L.toFixed(3), 총자수:txt.length, 비공백:idx.length, 프레임간격:+dt.toFixed(1),
    중앙값:mode, 최소:Math.min(...hist), 최대:Math.max(...hist),
    누락프레임수:drops.length, 표본:hist.slice(0,40), 누락예:drops.slice(0,10)}
})
console.log(r)
await b.close()
