import numpy as np, math
from scipy.interpolate import splprep, splev
from scipy import ndimage as ndi
from PIL import Image
from skimage.morphology import opening, dilation, disk
P=np.load('/tmp/pdfpts.npy'); Pc=np.vstack([P,P[:1]])
S=np.concatenate([[0],np.cumsum(np.hypot(*np.diff(Pc,axis=0).T))]); L=S[-1]
u=np.arange(0,L,0.5); X=np.interp(u,S,Pc[:,0]); Y=np.interp(u,S,Pc[:,1])
tck,_=splprep([X,Y],s=0.12*len(u),k=3,per=True)
sl=np.linspace(0,1,60000); ax,ay=splev(sl,tck); ax=np.array(ax); ay=np.array(ay)
arc=np.concatenate([[0],np.cumsum(np.hypot(np.diff(ax),np.diff(ay)))]); LL=arc[-1]
bounds=list(np.arange(0,LL,6.5))+[LL]
tk=np.interp(bounds,arc,sl)
Px,Py=splev(tk,tck); Dx,Dy=splev(tk,tck,der=1)
Px,Py,Dx,Dy=map(np.array,(Px,Py,Dx,Dy))
Px[-1],Py[-1]=Px[0],Py[0]; Dx[-1],Dy[-1]=Dx[0],Dy[0]
d=[f"M {Px[0]:.2f} {Py[0]:.2f}"]
for k in range(len(bounds)-1):
    h=tk[k+1]-tk[k]
    d.append(f"C {Px[k]+Dx[k]*h/3:.2f} {Py[k]+Dy[k]*h/3:.2f} {Px[k+1]-Dx[k+1]*h/3:.2f} {Py[k+1]-Dy[k+1]*h/3:.2f} {Px[k+1]:.2f} {Py[k+1]:.2f}")
d.append("Z"); Sd=" ".join(d); open('/tmp/pdfpath.txt','w').write(Sd)
print(f"세그 {len(bounds)-1} · 문자열 {len(Sd)}자")
def parse(dd):
    tkn=dd.replace("M"," M ").replace("C"," C ").replace("Z"," Z ").split(); R=[]; i=0; cur=None
    while i<len(tkn):
        if tkn[i]=="M": cur=(float(tkn[i+1]),float(tkn[i+2])); R.append(cur); i+=3
        elif tkn[i]=="C":
            p1=(float(tkn[i+1]),float(tkn[i+2])); p2=(float(tkn[i+3]),float(tkn[i+4])); p3=(float(tkn[i+5]),float(tkn[i+6]))
            for t in np.linspace(0,1,30)[1:]:
                v=1-t; R.append((v**3*cur[0]+3*v*v*t*p1[0]+3*v*t*t*p2[0]+t**3*p3[0], v**3*cur[1]+3*v*v*t*p1[1]+3*v*t*t*p2[1]+t**3*p3[1]))
            cur=p3; i+=7
        else: i+=1
    return np.array(R)
Q=parse(Sd)
g=np.asarray(Image.open("/home/user/linky-lounge-homepage/public/linky-lounge/book-club/4th-poster-typo.webp").convert("L")).astype(np.float32)
dark=g<140; big=dilation(opening(dark,disk(7)),disk(6)); small=dark&~big
dink=ndi.distance_transform_edt(~small)/4.0
dq=dink[np.clip((Q[:,1]*4).astype(int),0,1999),np.clip((Q[:,0]*4).astype(int),0,1599)]
ss=np.concatenate([[0],np.cumsum(np.hypot(*np.diff(Q,axis=0).T))])
u2=np.arange(0,ss[-1],1.5); x2=np.interp(u2,ss,Q[:,0]); y2=np.interp(u2,ss,Q[:,1])
a=np.arctan2(np.diff(y2),np.diff(x2))
print(f"검증: 길이 {ss[-1]:.2f}u · 잉크 {dq.mean():.2f}/{dq.max():.2f}u · 총회전 {np.degrees(np.abs(np.diff(np.unwrap(a))).sum()):.0f}° · 폐합 {np.hypot(*(Q[0]-Q[-1])):.4f}u · 시작 ({Q[0][0]:.2f},{Q[0][1]:.2f})")
# 자기교차
N=len(u2); PP=np.stack([x2,y2],1)
def inter(A,B,C,Dd):
    r=B-A; q=Dd-C; den=r[0]*q[1]-r[1]*q[0]
    if abs(den)<1e-12: return None
    w=C-A; uu=(w[0]*q[1]-w[1]*q[0])/den; vv=(w[0]*r[1]-w[1]*r[0])/den
    return A+r*uu if (0<=uu<=1 and 0<=vv<=1) else None
hits=[]
for i in range(N):
    for j in range(i+25,N):
        if min(abs(i-j),N-abs(i-j))<25: continue
        if abs(PP[i][0]-PP[j%N][0])>3 or abs(PP[i][1]-PP[j%N][1])>3: continue
        p=inter(PP[i],PP[(i+1)%N],PP[j%N],PP[(j+1)%N])
        if p is not None: hits.append((i,j%N,p))
ded=[]
for i,j,p in hits:
    if any(min(abs(i-a2),N-abs(i-a2))<10 and min(abs(j-b),N-abs(j-b))<10 for a2,b,_ in ded): continue
    ded.append((i,j,p))
def tg(k,h=7):
    v=PP[(k+h)%N]-PP[(k-h)%N]; return v/np.linalg.norm(v)
print(f"자기교차 {len(ded)}곳:")
for k,(i,j,p) in enumerate(ded):
    print(f"  X{k}: s={i*1.5:6.0f}↔{j*1.5:6.0f} ({p[0]:6.2f},{p[1]:6.2f}) 사잇각 {np.degrees(np.arccos(np.clip(abs(np.dot(tg(i),tg(j))),-1,1))):5.1f}°")
