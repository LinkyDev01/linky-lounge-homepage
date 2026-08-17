// 다른 엔진 흉내 — 자간을 바꿔 피치 P 를 어긋나게 한 뒤 자동 보정이 따라오나
import { chromium } from "/opt/node22/lib/node_modules/playwright/index.mjs"
const LS = process.argv[2] || "0.003em"
const b=await chromium.launch({executablePath:"/opt/pw-browsers/chromium",args:["--no-sandbox"]})
const p=await b.newPage({viewport:{width:390,height:844},reducedMotion:"no-preference"})
await p.addInitScript((ls)=>{ const st=document.createElement('style')
  st.textContent=`svg[data-lz-poster] text{letter-spacing:${ls} !important}`
  document.addEventListener('DOMContentLoaded',()=>document.head.appendChild(st))
  if(document.head) document.head.appendChild(st) }, LS)
await p.goto("http://localhost:3000/lazyday/preview/hero-check",{waitUntil:"load",timeout:60000})
await p.waitForTimeout(9000)
const r=await p.evaluate(()=>{
  const s=document.querySelector('svg[data-lz-poster]')
  const path=s.querySelector('#heroSayuThread')
  const seam=s.querySelector('text[data-seam]'), stp=seam.querySelector('textPath')
  const L=path.getTotalLength(), P=seam.getComputedTextLength()/2
  const n=stp.textContent.length, per=n/2
  const vis=(i,off)=>{stp.setAttribute('startOffset',String(off));try{return stp.getExtentOfChar(i).width>0.01}catch(e){return false}}
  let j=per+10; while(stp.textContent[j]===' ') j++
  const bis=(i,lo,hi)=>{for(let k=0;k<40;k++){const m=(lo+hi)/2; if(vis(i,m))lo=m;else hi=m} return (lo+hi)/2}
  const delta=bis(j,-P,0)-bis(j-per,0,-P)
  const idx=[];for(let i=0;i<n;i++) if(stp.textContent[i]!==' ') idx.push(i)
  let mn=1e9,mx=0
  for(let k=0;k<300;k++){stp.setAttribute('startOffset',String(-(P*k/300)))
    let c=0;for(const i of idx){try{if(stp.getExtentOfChar(i).width>0.01)c++}catch(e){}}
    if(c<mn)mn=c; if(c>mx)mx=c}
  stp.setAttribute('startOffset','0')
  return {L:+L.toFixed(3), P:+P.toFixed(3), delta:+delta.toFixed(3), min:mn, max:mx, scale:path.dataset.lzScale||'1'}
})
console.log(`[자간 ${LS}]`, JSON.stringify(r))
await b.close()
