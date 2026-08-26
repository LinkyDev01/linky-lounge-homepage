import { chromium } from "/opt/node22/lib/node_modules/playwright/index.mjs"
const b=await chromium.launch({executablePath:"/opt/pw-browsers/chromium",args:["--no-sandbox"]})
const p=await b.newPage({viewport:{width:390,height:844},reducedMotion:"no-preference"})
await p.goto("http://localhost:3000/lazyday/preview/hero-check",{waitUntil:"load",timeout:60000})
await p.waitForTimeout(6000)
const r=await p.evaluate(()=>{
  const s=document.querySelector('svg[data-lz-poster]')
  const tp=s.querySelector('textPath'), path=s.querySelector('#heroSayuThread')
  const textEl=tp.closest('text')
  ;[...tp.querySelectorAll('animate')].forEach(a=>a.remove())
  const K=4, L=path.getTotalLength(), P=textEl.getComputedTextLength()/K
  const n=tp.textContent.length, per=n/K
  const vis=(i,off)=>{tp.setAttribute('startOffset',String(off));try{return tp.getExtentOfChar(i).width>0.01}catch(e){return false}}
  let j=per+10; while(tp.textContent[j]===' ') j++
  const bis=(i,lo,hi)=>{for(let k=0;k<44;k++){const m=(lo+hi)/2; if(vis(i,m))lo=m;else hi=m} return (lo+hi)/2}
  const outOff=bis(j,-P,0), inOff=bis(j-per,0,-P)
  // 한 주기 전체 글자 수 min/max
  const idx=[];for(let i=0;i<n;i++) if(tp.textContent[i]!==' ') idx.push(i)
  let mn=1e9,mx=0
  for(let k=0;k<400;k++){tp.setAttribute('startOffset',String(-(P*k/400)))
    let cnt=0;for(const i of idx){try{if(tp.getExtentOfChar(i).width>0.01)cnt++}catch(e){}}
    if(cnt<mn)mn=cnt; if(cnt>mx)mx=cnt}
  tp.setAttribute('startOffset','0')
  return {L:+L.toFixed(3), P:+P.toFixed(3), 여유:+(L-P).toFixed(3), 델타:+(outOff-inOff).toFixed(3), 최소:mn, 최대:mx,
    fs:getComputedStyle(textEl).fontSize}
})
console.log(JSON.stringify(r))
await b.close()
