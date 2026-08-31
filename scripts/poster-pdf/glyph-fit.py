import sys, numpy as np
from PIL import Image
from scipy.ndimage import binary_erosion, binary_dilation, generate_binary_structure, iterate_structure
GL=[("레",123.3,128.1),("이",183.2,96.1),("지",272.8,111.3),("데",233.2,209.0),
    ("이",306.8,203.5),("북",106.4,312.9),("클",229.2,302.0),("럽",312.8,336.7),
    ("4",77.4,412.5),("기",152.8,405.4),("모",243.1,395.6),("집",328.1,414.4)]
ren=Image.open(sys.argv[1]).convert("L"); W,H=ren.size
orig=Image.open("/home/user/linky-lounge-homepage/public/linky-lounge/book-club/4th-poster-typo.webp").convert("L").resize((W,H),Image.LANCZOS)
R=np.asarray(ren,float); O=np.asarray(orig,float); sx,sy=W/400.0,H/500.0
st=iterate_structure(generate_binary_structure(2,1),4)
def mask(A):
    b=A<150; return binary_dilation(binary_erosion(b,st),st)
MR,MO=mask(R),mask(O)
def cen(M,cx,cy,h=17):
    x0,x1=int((cx-h)*sx),int((cx+h)*sx); y0,y1=int((cy-h)*sy),int((cy+h)*sy)
    w=M[y0:y1,x0:x1]
    if w.sum()<50: return None
    ys,xs=np.nonzero(w); return ((xs.mean()+x0)/sx,(ys.mean()+y0)/sy)
out=[]
for ch,gx,gy in GL:
    a=cen(MR,gx,gy); b=cen(MO,gx,gy)
    out.append((ch, round(a[0]-b[0],3), round(a[1]-b[1],3)) if a and b else (ch,None,None))
import json; print(json.dumps(out, ensure_ascii=False))
