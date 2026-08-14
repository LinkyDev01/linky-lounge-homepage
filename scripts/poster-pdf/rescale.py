import numpy as np, re, sys
p="/home/user/linky-lounge-homepage/app/(main)/lazyday/poster-thread.ts"
target=float(sys.argv[1]); cur=float(sys.argv[2])
src=open(p).read()
d=re.search(r'export const POSTER_THREAD_D =\s*\n\s*"([^"]+)"',src).group(1)
tk=d.replace("M"," M ").replace("C"," C ").replace("Z"," Z ").split()
nums=[float(t) for t in tk if t not in ("M","C","Z")]
A=np.array(nums).reshape(-1,2); c=A.mean(0)
k=target/cur
B=(A-c)*k+c
print(f"스케일 {k:.8f} · 중심 ({c[0]:.2f},{c[1]:.2f}) · 최대 이동 {np.hypot(*(B-A).T).max():.4f}u")
out=[]; i=0; j=0
while i<len(tk):
    if tk[i]=="M": out.append(f"M {B[j][0]:.3f} {B[j][1]:.3f}"); j+=1; i+=3
    elif tk[i]=="C":
        out.append(f"C {B[j][0]:.3f} {B[j][1]:.3f} {B[j+1][0]:.3f} {B[j+1][1]:.3f} {B[j+2][0]:.3f} {B[j+2][1]:.3f}"); j+=3; i+=7
    else: out.append("Z"); i+=1
S=" ".join(out)
src2=re.sub(r'(export const POSTER_THREAD_D =\s*\n\s*")[^"]+(")', lambda m:m.group(1)+S+m.group(2), src, count=1)
open(p,"w").write(src2)
print("적용 길이", len(S))
