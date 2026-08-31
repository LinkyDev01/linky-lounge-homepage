import pickle, json, numpy as np, itertools, math
GL=pickle.load(open('/tmp/pdfglyphs.pkl','rb'))
LJ=json.load(open('/tmp/lines.json')); LINES=LJ['lines']
lc=[sum(1 for c in L if c!=' ') for L in LINES]
forms={}
for g in GL:
    if 16<=g['form']<=27: continue
    forms.setdefault(g['form'],[]).append(g)
for k in forms: forms[k].sort(key=lambda g:g['idx'])
fids=sorted(forms, key=lambda f: forms[f][0]['idx'])
fc={f:len(forms[f]) for f in fids}
cand=[[f for f in fids if fc[f]==lc[i]] for i in range(17)]
print("줄별 후보 폼:", [(i+1,c) for i,c in enumerate(cand)])
best=None
def gap(a,b):  # 폼 a 끝 → 폼 b 시작 거리
    p=forms[a][-1]; q=forms[b][0]
    return math.hypot(p['x']-q['x'], p['y']-q['y'])
import itertools
groups={}
for i,c in enumerate(cand):
    if len(c)>1: groups.setdefault(tuple(c),[]).append(i)
opts=[]
for c,idxs in groups.items(): opts.append((idxs,list(itertools.permutations(c))))
fixed={i:c[0] for i,c in enumerate(cand) if len(c)==1}
for combo in itertools.product(*[o[1] for o in opts]):
    m=dict(fixed)
    for (idxs,_),perm in zip(opts,combo):
        for i,f in zip(idxs,perm): m[i]=f
    tot=sum(gap(m[i], m[(i+1)%17]) for i in range(17))
    if best is None or tot<best[0]: best=(tot, dict(m))
tot,M=best
print(f"\n최적 배정 (줄 이음 총합 {tot:.1f}u)")
for i in range(17):
    f=M[i]; p=forms[f][0]; q=forms[f][-1]
    print(f"  줄{i+1:>2} ← G{f:<3} {lc[i]:>3}자  시작({p['x']:6.1f},{p['y']:6.1f}) 끝({q['x']:6.1f},{q['y']:6.1f})  다음까지 {gap(f,M[(i+1)%17]):5.1f}u  {LINES[i][:14]}")
pickle.dump({"map":M,"forms":forms}, open('/tmp/assign.pkl','wb'))
