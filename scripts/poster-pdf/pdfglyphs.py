import zlib, re, json, math, numpy as np, pickle
D=open('poster-source.pdf'  # ← 미리캔버스에서 내려받은 원본 PDF 경로,'rb').read()
def obj_start(n):
    m=re.search(rb'(?<![0-9])'+str(n).encode()+rb'\s+0\s+obj', D); return m.end()
def obj_body(n):
    i=obj_start(n); j=D.find(b'stream',i); k=D.find(b'endobj',i)
    return D[i:(j if 0<=j<k else k)]
def stream_of(n):
    i=obj_start(n); hdr=obj_body(n)
    ln=int(re.search(rb'/Length\s+(\d+)',hdr).group(1))
    j=D.find(b'stream',i)+6
    while D[j] in (13,10): j+=1
    return zlib.decompress(D[j:j+ln]).decode('latin-1')
xo={a:int(b) for a,b in re.findall(r'/(G\d+)\s+(\d+)\s+0\s+R', obj_body(6).decode('latin-1'))}
def mul(A,B):  # A∘B  (행렬 [a b c d e f])
    a,b,c,d,e,f=A; a2,b2,c2,d2,e2,f2=B
    return [a2*a+b2*c, a2*b+b2*d, c2*a+d2*c, c2*b+d2*d, e2*a+f2*c+e, e2*b+f2*d+f]
def apply(M,x,y): return (M[0]*x+M[2]*y+M[4], M[1]*x+M[3]*y+M[5])
NUM=r'[-+]?\d*\.?\d+(?:[eE][-+]?\d+)?'
TOK=re.compile(NUM+r'|/[A-Za-z0-9]+|[A-Za-z\*\'\"]+')
def walk(content, ctm0):
    """경로(서브패스 묶음)를 (변환행렬, 점배열) 목록으로 반환"""
    st=[]; ctm=ctm0[:]; ops=[]; out=[]; cur=[]; sub=[]; startM=None
    for t in TOK.findall(content):
        if re.fullmatch(NUM,t): ops.append(float(t)); continue
        if t.startswith('/'): ops=[]; continue
        if t=='q': st.append(ctm[:])
        elif t=='Q': ctm=st.pop() if st else ctm
        elif t=='cm' and len(ops)>=6: ctm=mul(ctm, ops[-6:])
        elif t=='m' and len(ops)>=2:
            if sub: cur.append(sub)
            sub=[apply(ctm,ops[-2],ops[-1])]; startM=ctm[:]
        elif t=='l' and len(ops)>=2: sub.append(apply(ctm,ops[-2],ops[-1]))
        elif t=='c' and len(ops)>=6:
            p0=sub[-1] if sub else apply(ctm,ops[-6],ops[-5])
            p1=apply(ctm,ops[-6],ops[-5]); p2=apply(ctm,ops[-4],ops[-3]); p3=apply(ctm,ops[-2],ops[-1])
            for u in np.linspace(0,1,6)[1:]:
                v=1-u
                sub.append((v**3*p0[0]+3*v*v*u*p1[0]+3*v*u*u*p2[0]+u**3*p3[0],
                            v**3*p0[1]+3*v*v*u*p1[1]+3*v*u*u*p2[1]+u**3*p3[1]))
        elif t=='re' and len(ops)>=4:
            x,y,w,h=ops[-4:]
            if sub: cur.append(sub)
            sub=[apply(ctm,x,y),apply(ctm,x+w,y),apply(ctm,x+w,y+h),apply(ctm,x,y+h)]; startM=ctm[:]
        elif t in ('h',):
            pass
        elif t in ('f','F','f*','b','b*','B','B*','n','s','S'):
            if sub: cur.append(sub); sub=[]
            if cur: out.append((startM, cur)); cur=[]
        ops=[]
    if sub: cur.append(sub)
    if cur: out.append((startM,cur))
    return out
base=[1,0,0,-1,0,1012.5]
base=mul(base,[0.75,0,0,0.75,0,0])
base=mul(base,[1,0,0,1,14.419115,91.895749])
K=400.0/810.0
GL=[]
for gi in range(1,30):
    body=obj_body(xo[f'G{gi}']).decode('latin-1')
    res=re.search(r'/Resources\s*<<(.*?)>>\s*(?:/Length|stream)', body, re.S)
    c=stream_of(xo[f'G{gi}'])
    paths=walk(c, base)
    for M,subs in paths:
        pts=np.array([p for s in subs for p in s])
        if len(pts)<3: continue
        cx=(pts[:,0].min()+pts[:,0].max())/2; cy=(pts[:,1].min()+pts[:,1].max())/2
        ang=math.degrees(math.atan2(M[1],M[0]))
        GL.append(dict(form=gi, idx=len(GL), x=cx*K, y=500-cy*K, ang=-ang,
                       w=(pts[:,0].max()-pts[:,0].min())*K, h=(pts[:,1].max()-pts[:,1].min())*K,
                       n=len(pts)))
print(f"글리프 후보 {len(GL)}개 · 폼 {len(set(g['form'] for g in GL))}개")
from collections import Counter
print("폼별 글리프 수:", sorted(Counter(g['form'] for g in GL).items()))
pickle.dump(GL, open('/tmp/pdfglyphs.pkl','wb'))
