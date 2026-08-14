import { chromium } from "/opt/node22/lib/node_modules/playwright/index.mjs"
import { readFileSync } from "node:fs"
const ts=readFileSync("/home/user/linky-lounge-homepage/app/(main)/lazyday/poster-thread.ts","utf8")
const pick=(n)=>ts.match(new RegExp(`export const ${n} =\\s*\\n\\s*"([^"]+)"`))[1]
const FULL=`${pick("SAYU_P1")} ${pick("SAYU_P2")} ${pick("SAYU_P3")}`
const d=ts.match(/export const POSTER_THREAD_D =\s*\n\s*"([^"]+)"/)[1]
const DY=parseFloat(ts.match(/export const POSTER_GLYPH_DY = (-?[\d.]+)/)[1])
const GL=[...ts.matchAll(/\{ ch: "(.)", x: ([\d.]+), y: ([\d.]+), s: (\d+) \}/g)]
  .map(m=>`<text x="${m[2]}" y="${(+m[3]+DY).toFixed(2)}" font-size="${m[4]}" text-anchor="middle" dominant-baseline="central" font-family="Pretendard Variable,Pretendard,sans-serif" font-weight="900" fill="#000">${m[1]}</text>`).join("")
const b=await chromium.launch({executablePath:"/opt/pw-browsers/chromium",args:["--no-sandbox"]})
const p=await b.newPage({viewport:{width:1600,height:2000}})
await p.setContent(`<html><head><link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css">
<style>html,body{margin:0;background:#fff}
.tt{font-family:"Pretendard Variable",Pretendard,sans-serif;font-weight:400;font-size:7.2px;letter-spacing:0.003em;fill:#000}</style></head>
<body><svg width="1600" height="2000" viewBox="0 0 400 500"><defs><path id="p" d="${d}"/></defs>
<text class="tt" xml:space="preserve"><textPath href="#p" dominant-baseline="central" startOffset="0">${FULL} </textPath></text>
${GL}</svg></body></html>`)
await p.waitForTimeout(3000)
await p.screenshot({path:"/tmp/render_full.png"})
console.log("ok")
await b.close()
