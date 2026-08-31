import pickle, json, numpy as np, math
A=pickle.load(open('/tmp/assign.pkl','rb')); M=A['map']; forms=A['forms']
LJ=json.load(open('/tmp/lines.json')); LINES=LJ['lines']
# 읽기 순서대로 글리프 (좌표·회전) + 공백 자리 표시
seq=[]   # (x,y,ang,isglyph)
for i in range(17):
    gl=forms[M[i]]; k=0
    for ch in LINES[i]:
        if ch==' ': seq.append((None,None,None,False))
        else:
            g=gl[k]; k+=1; seq.append((g['x'],g['y'],g['ang'],True))
    if i<16: seq.append((None,None,None,False))     # 줄 사이 공백
seq.append((None,None,None,False))                  # 루프 이음 공백
print(f"시퀀스 {len(seq)} (본문 473자 + 루프 공백 1)")
G=[(j,s) for j,s in enumerate(seq) if s[3]]
print(f"실좌표 글리프 {len(G)}개")
# 글자 advance 실측
P=np.array([[s[0],s[1]] for _,s in G])
d=np.hypot(*np.diff(P,axis=0).T)
step=[]
for a in range(len(G)-1):
    n=G[a+1][0]-G[a][0]        # 사이에 낀 공백 수 +1
    step.append((n,d[a]))
g1=[v for n,v in step if n==1]; g2=[v for n,v in step if n==2]
print(f"연속 글자 간격 중앙 {np.median(g1):.3f}u ({len(g1)}쌍) · 공백 1개 낀 간격 중앙 {np.median(g2):.3f}u ({len(g2)}쌍)")
AG=np.median(g1); AS=np.median(g2)-AG
print(f"→ 글자 advance {AG:.3f}u · 공백 advance {AS:.3f}u")
# 공백 자리 좌표를 선형 보간으로 채움 (advance 비례)
full=[]
for a in range(len(G)):
    j0,s0=G[a]; j1,s1=G[(a+1)%len(G)]
    full.append((s0[0],s0[1],s0[2]))
    n=(j1-j0-1) if a<len(G)-1 else (len(seq)-j0-1)
    if n>0:
        x0,y0=s0[0],s0[1]; x1,y1=s1[0],s1[1]
        for t in range(1,n+1):
            u=t/(n+1); full.append((x0+(x1-x0)*u, y0+(y1-y0)*u, None))
full=np.array([[f[0],f[1]] for f in full])
print(f"보간 포함 {len(full)}점 (473 + 루프공백? = {len(seq)})")
tot=np.hypot(*np.diff(np.vstack([full,full[:1]]),axis=0).T).sum()
print(f"글자 중심 폴리라인 총 길이 {tot:.1f}u  (현행 경로 2704.9u)")
np.save('/tmp/pdfpts.npy', full)
ang=np.array([g[1][2] for g in G])
np.save('/tmp/pdfang.npy', np.array([[G[a][0], ang[a]] for a in range(len(G))]))
