import re, numpy as np
src=open("/home/user/linky-lounge-homepage/app/(main)/lazyday/poster-thread.ts").read()
d=re.search(r'export const POSTER_THREAD_D =\s*\n\s*"([^"]+)"',src).group(1)
tk=d.replace("M"," M ").replace("C"," C ").replace("Z"," Z ").split()
A=np.array([float(t) for t in tk if t not in ("M","C","Z")]).reshape(-1,2)
pts=[A[0]]; j=1
while j+2 < len(A):
    p0=pts[-1]; p1,p2,p3=A[j],A[j+1],A[j+2]
    for t in np.linspace(0,1,9)[1:]:
        pts.append(((1-t)**3)*p0+3*((1-t)**2)*t*p1+3*(1-t)*t*t*p2+(t**3)*p3)
    j+=3
Q=np.array(pts); N=len(Q)-1
p=Q[:-1]; r=np.diff(Q,axis=0)
found=[]
for a in range(N):
    b0=a+4
    if b0>=N: continue
    q=p[b0:]; s=r[b0:]
    rxs=r[a,0]*s[:,1]-r[a,1]*s[:,0]
    ok=np.abs(rxs)>1e-12
    qp=q-p[a]
    t=np.where(ok,(qp[:,0]*s[:,1]-qp[:,1]*s[:,0])/np.where(ok,rxs,1),-1)
    u=np.where(ok,(qp[:,0]*r[a,1]-qp[:,1]*r[a,0])/np.where(ok,rxs,1),-1)
    m=ok&(t>=0)&(t<=1)&(u>=0)&(u<=1)
    for idx in np.nonzero(m)[0]:
        z=p[a]+t[idx]*r[a]
        found.append((z, a, b0+idx))
cl=[]
for z,a,b in found:
    for c in cl:
        if np.hypot(*(z-c["p"]))<8: c["n"]+=1; break
    else: cl.append({"p":z,"n":1})
# 시작=끝 폐합점은 교차가 아니라 이음 — 제외
cl=[c for c in cl if not (np.hypot(*(c["p"]-Q[0]))<8)]
print(f"검증② 자기교차 {len(cl)}곳:")
for c in sorted(cl,key=lambda c:(-c['p'][1])):
    print(f"    ({c['p'][0]:6.1f},{c['p'][1]:6.1f})  통과쌍 {c['n']}")
