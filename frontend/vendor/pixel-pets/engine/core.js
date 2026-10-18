/* ===== PetCare pixel engine v3 — core =====
   Every sprite is a 32x32 grid of palette SLOTS plus a part-local key per pixel.
   Rigs (quadruped, bird, reptile, fish, bug…) draw into this grid; colors are applied
   at render time, so presets, constructor, photo colors and hand painting all reuse
   the same animation frames. */

const PAL = ['be4a2f','d77643','ead4aa','e4a672','b86f50','733e39','3e2731','a22633',
  'e43b44','f77622','feae34','fee761','63c74d','3e8948','265c42','193c3e',
  '124e89','0099db','2ce8f5','ffffff','c0cbdc','8b9bb4','5a6988','3a4466',
  '262b44','181425','ff0044','68386c','b55088','f6757a','e8b796','c28569'];
const SL = {E:0,OUT:1,B:2,BD:3,BL:4,W:5,WD:6,WL:7,P:8,PD:9,EYE:10,PUP:11,GLINT:12,PINK:13,BLUSH:14,MOUTH:15,
  ACC:16,ACCD:17,GOLD:18,X:19,XD:20,XL:21,NOSE:22,TONGUE:23,WHISK:24,FEET:25,PL:26};
const N = 32;

function hexRgb(h){return [parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)];}
const PAL_RGB = PAL.map(hexRgb);
function cdist(a,b){const r=a[0]-b[0],g=a[1]-b[1],bl=a[2]-b[2];return 2*r*r+4*g*g+3*bl*bl;}
function lum(c){return 0.3*c[0]+0.59*c[1]+0.11*c[2];}
function nearestPal(rgb, exclude){
  let best=0,bd=1e12;
  for(let i=0;i<PAL.length;i++){ if(PAL[i]===exclude) continue; const d=cdist(rgb,PAL_RGB[i]); if(d<bd){bd=d;best=i;} }
  return PAL[best];
}
/* Shading stays inside the same color family: darken/lighten in HSL with a small hue shift
   (classic pixel-art hue shifting), instead of snapping to a possibly unrelated palette color. */
function toHsl(h){ const [r,g,b]=hexRgb(h).map(v=>v/255), mx=Math.max(r,g,b), mn=Math.min(r,g,b), l=(mx+mn)/2, d=mx-mn;
  if(!d) return [0,0,l]; const s=d/(1-Math.abs(2*l-1)); let H;
  if(mx===r) H=((g-b)/d)%6; else if(mx===g) H=(b-r)/d+2; else H=(r-g)/d+4; H*=60; if(H<0) H+=360; return [H,s,l]; }
function fromHsl(H,s,l){ const C=(1-Math.abs(2*l-1))*s, X=C*(1-Math.abs((H/60)%2-1)), m=l-C/2; let r=0,g=0,b=0;
  if(H<60){r=C;g=X;} else if(H<120){r=X;g=C;} else if(H<180){g=C;b=X;} else if(H<240){g=X;b=C;} else if(H<300){r=X;b=C;} else {r=C;b=X;}
  return [r,g,b].map(v=>Math.round(clamp((v+m)*255,0,255)).toString(16).padStart(2,'0')).join(''); }
const towards=(H,target,amt)=>{ let d=((target-H+540)%360)-180; return (H+Math.sign(d)*Math.min(Math.abs(d),amt)+360)%360; };
const SHADE_CACHE={}, LIGHT_CACHE={};
function shadeOf(h){ if(SHADE_CACHE[h]) return SHADE_CACHE[h];
  const [H,s,l]=toHsl(h); const out = s<0.08 ? fromHsl(235,Math.min(0.18,s+0.08),l*0.74) : fromHsl(towards(H,250,10),Math.min(1,s*1.05+0.03),l*0.72);
  return SHADE_CACHE[h]=out; }
function lightOf(h){ if(LIGHT_CACHE[h]) return LIGHT_CACHE[h];
  const [H,s,l]=toHsl(h); const out = s<0.08 ? fromHsl(H,s,l+(1-l)*0.4) : fromHsl(towards(H,55,8),s*0.92,l+(1-l)*0.32);
  return LIGHT_CACHE[h]=out; }
function hash(a,b){const s=Math.sin(a*127.1+b*311.7)*43758.5453;return s-Math.floor(s);}
const mod=(x,n)=>((x%n)+n)%n;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const TAU=Math.PI*2;

/* ---------- patterns: (part,a,b) -> 'B' base | 'W' light | 'P' pattern | 'D' darker | 'X' extra ---------- */
const PATTERNS = {
  solid: ()=>'B',
  tabby(part,a,b){
    if(part==='body'){ if(b<=-4) return 'P'; if(b<=2 && mod(a+Math.floor((b+6)/2),4)===0) return 'P'; return 'B'; }
    if(part==='head'){ if(b<=-3&&b>=-5&&mod(a,2)===1&&a>=-3&&a<=1) return 'P'; if((b===1||b===3)&&a<=-4) return 'P'; return 'B'; }
    if(part==='leg') return (b===2||b===4)&&a<2?'P':'B';
    if(part==='tail') return (mod(a,3)===1||a>=13)?'P':'B';
    if(part==='wing') return mod(a+b,3)===0?'P':'B';
    return 'B';
  },
  spots(part,a,b){
    if(part==='body'){ if(b>=4) return 'B'; const cx=Math.floor((a+12)/3),cy=Math.floor((b+12)/3),lx=mod(a+12,3),ly=mod(b+12,3);
      return (hash(cx,cy)<0.6&&lx<2&&ly===1)?'P':'B'; }
    if(part==='head') return (b<=-2&&a<=0&&hash(a,b)<0.2)?'P':'B';
    if(part==='leg') return (b===3&&a===0)?'P':'B';
    if(part==='tail') return mod(a,4)===2?'P':'B';
    if(part==='wing'||part==='shell') return hash(a,b)<0.25?'P':'B';
    return 'B';
  },
  rosette(part,a,b){
    if(part==='body'){ if(b>=4) return 'B'; const cx=Math.floor((a+12)/4),cy=Math.floor((b+12)/3),lx=mod(a+12,4),ly=mod(b+12,3);
      if(hash(cx,cy)>=0.55) return 'B';
      if((ly===0&&lx===1)||(ly===1&&(lx===0||lx===2))) return 'P';
      if(ly===1&&lx===1) return 'D'; return 'B'; }
    if(part==='head') return (b<=-2&&a<=0&&hash(a,b)<0.22)?'P':'B';
    if(part==='leg') return (b===3&&a===0)?'P':'B';
    if(part==='tail') return mod(a,3)===0?'P':'B';
    return 'B';
  },
  bicolor(part,a,b){
    if(part==='body') return (b>=1||a>=6)?'W':'B';
    if(part==='head') return ((b>=1&&a>=0)||(a>=4&&b>=-1))?'W':'B';
    if(part==='leg') return 'W';
    if(part==='tail') return a>=12?'W':'B';
    return 'B';
  },
  tuxedo(part,a,b){
    if(part==='body') return ((a>=6&&b>=-2)||(b>=4&&a>=0))?'W':'B';
    if(part==='head') return ((a>=4&&b>=1)||(b>=4&&a>=0))?'W':'B';
    if(part==='leg') return b>=5?'W':'B';
    return 'B';
  },
  socks(part,a,b){
    if(part==='leg') return b>=5?'W':'B';
    if(part==='head') return (a>=5&&b>=2)?'W':'B';
    return 'B';
  },
  colorpoint(part,a,b){
    if(part==='head'){ const dx=a-4.5, dy=b-1.5; return (dx*dx/14+dy*dy/8)<=1?'P':'B'; }
    if(part==='ear'||part==='tail') return 'P';
    if(part==='leg') return b>=3?'P':'B';
    return 'B';
  },
  calico(part,a,b){
    const w=PATTERNS.bicolor(part,a,b); if(w==='W') return 'W';
    if(part==='body') return hash(Math.floor((a+12)/4),Math.floor((b+12)/3))<0.45?'P':'B';
    if(part==='head') return hash(Math.floor((a+12)/3),Math.floor((b+12)/3)+7)<0.45?'P':'B';
    if(part==='tail') return Math.floor(a/5)%2?'P':'B';
    if(part==='ear') return a<0?'P':'B';
    return 'B';
  },
  tortie(part,a,b){
    if(part==='body') return hash(Math.floor((a+12)/2),Math.floor((b+12)/2))<0.5?'P':'B';
    if(part==='head') return hash(Math.floor((a+12)/2)+3,Math.floor((b+12)/2))<0.5?'P':'B';
    if(part==='tail') return Math.floor(a/3)%2?'P':'B';
    if(part==='leg') return hash(a+5,b)<0.5?'P':'B';
    if(part==='ear') return a<0?'P':'B';
    return 'B';
  },
  mask(part,a,b){
    if(part==='head') return (a>=-1&&b>=-2&&b<=0)?'P':'B';
    if(part==='ear') return 'P';
    if(part==='tail') return (a>=10||mod(a,3)===0)?'P':'B';
    return 'B';
  },
  ticked(part,a,b){
    if(part==='body') return mod(a*3+b*5,4)===0?'D':'B';
    if(part==='head') return (b<-1&&mod(a+b*2,3)===0)?'D':'B';
    if(part==='tail') return mod(a,2)?'D':'B';
    return 'B';
  },
  saddle(part,a,b){ // dark back like a beagle / german shepherd
    if(part==='body') return b<=0&&a<=4&&a>=-7?'P':(b>=3?'W':'B');
    if(part==='head') return (b<=-3&&a<=-1)?'P':((a>=3&&b>=1)?'W':'B');
    if(part==='ear') return 'P';
    if(part==='tail') return a<10?'P':'W';
    if(part==='leg') return b>=5?'W':'B';
    return 'B';
  },
  tanpoints(part,a,b){ // dark dog with tan muzzle, brows and legs (doberman, rottweiler)
    if(part==='body') return (a>=7&&b>=0)?'W':'B';
    if(part==='head') return ((a>=3&&b>=1)||(a===1&&b===-3)||(a===2&&b===-3))?'W':'B';
    if(part==='leg') return b>=3?'W':'B';
    return 'B';
  },
  merle(part,a,b){ return hash(Math.floor((a+20)/2)*3,Math.floor((b+20)/2))<0.3?'P':(hash(a,b)<0.15?'D':'B'); },
  brindle(part,a,b){ if(part==='body'||part==='leg'||part==='tail') return mod(a+Math.floor(b/2),3)===0?'D':'B'; return 'B'; },
  harlequin(part,a,b){ // great dane: white coat with torn black patches, dark ears
    if(part==='ear') return 'P';
    if(part==='leg') return (b===2&&a===0)?'P':'B';
    if(part==='head') return (b<=-2&&a<=0)||(a<=-3&&b<=1)?'P':'B';
    const h=hash(Math.floor((a+20)/3),Math.floor((b+20)/2)+11);
    return h<0.34?'P':'B';
  },
  bernard(part,a,b){ // saint bernard: red-brown back and ears, white blaze, muzzle, chest, legs and tail tip
    if(part==='ear') return 'P';
    if(part==='head'){ if(Math.abs(a-1)<=0&&b<=0) return 'B'; return (b<=1&&a<=2)?'P':'B'; }
    if(part==='body') return (b<=1&&a>=-7&&a<=5)?'P':'B';
    if(part==='tail') return a<10?'P':'B';
    return 'B';
  },
  piebald(part,a,b){ return hash(Math.floor((a+20)/5),Math.floor((b+20)/4)+3)<0.45?'W':'B'; },
  dutch(part,a,b){ // rabbit / guinea pig: white front half and face blaze
    if(part==='body') return a>=1?'W':'B';
    if(part==='head') return (Math.abs(a-1)<=1||b>=2)?'W':'B';
    if(part==='leg') return 'W';
    return 'B';
  },
  hooded(part,a,b){ // rat: colored head and back stripe, white body
    if(part==='head'||part==='ear') return 'B';
    if(part==='body') return (b<=-3)?'B':'W';
    if(part==='tail') return 'B';
    return 'W';
  },
  blaze(part,a,b){ // horse: white face stripe and socks
    if(part==='head') return (Math.abs(a-3)<=1&&b<=1)||(a>=5)?'W':'B';
    if(part==='leg') return b>=5?'W':'B';
    return 'B';
  },
  dapple(part,a,b){ if(part==='body') return (mod(a,3)===1&&mod(b,2)===0&&b<3)?'W':'B'; return 'B'; },
  barred(part,a,b){ // budgie: wavy bars on head and wings
    if(part==='head') return (b<=-1&&mod(b,2)===0)?'P':'B';
    if(part==='wing') return mod(b+(mod(a,4)<2?0:1),2)===0?'P':'W';
    return 'B';
  },
  cheek(part,a,b){ // cockatiel: orange cheek patch
    if(part==='head') return (a>=0&&a<=2&&b>=1&&b<=2)?'P':'B';
    if(part==='wing') return a>=3?'W':'B';
    return 'B';
  },
  wingbar(part,a,b){ if(part==='wing') return (b===0||b===2)?'W':'P'; return 'B'; },
  bands(part,a,b){ // clownfish / king snake bands
    if(part==='body'||part==='tail') return mod(a+12,6)<=1?'W':'B';
    if(part==='head') return (a<=-2&&a>=-3)?'W':'B';
    return 'B';
  },
  stripe(part,a,b){ if(part==='body'||part==='tail') return b===0||b===-1?'P':(b>=2?'W':'B'); return 'B'; },
  blotch(part,a,b){ // corn snake / leopard gecko saddles
    if(part==='body'||part==='tail') return mod(a+12,5)<=2&&b<=1?'P':(b>=3?'W':'B');
    if(part==='head') return hash(a,b)<0.25?'P':'B';
    return 'B';
  },
  leopard(part,a,b){ if(part==='head'||part==='body'||part==='tail'||part==='leg') return hash(a*1.7+3,b*2.3)<0.17&&b<3?'P':'B'; return 'B'; },
  redear(part,a,b){ if(part==='head') return (a>=-2&&a<=0&&b>=-1&&b<=0)?'P':(mod(b,2)===0?'D':'B'); if(part==='leg'||part==='tail') return mod(a+b,3)===0?'D':'B'; return 'B'; }
};
const PATTERN_LABELS = {solid:'Однотонный',tabby:'Полоски',spots:'Пятнышки',rosette:'Розетки',bicolor:'Биколор',tuxedo:'Смокинг',socks:'Носочки',
  colorpoint:'Колор-пойнт',calico:'Трёхцветный',tortie:'Черепаховый',mask:'Маска',ticked:'Тиккинг',saddle:'Чепрак',tanpoints:'Подпалины',
  merle:'Мраморный',brindle:'Тигровый',piebald:'Пегий',dutch:'Голландский',hooded:'Капюшон',blaze:'Проточина',dapple:'В яблоках',
  barred:'Волнистый',harlequin:'Арлекин',bernard:'Сенбернарский',cheek:'Щёчки',wingbar:'Полоски на крыльях',bands:'Кольца',stripe:'Полоса',blotch:'Сёдла',leopard:'Леопардовый',redear:'Красные ушки'};

/* ---------- drawing context ---------- */
class Spr {
  constructor(cfg){
    this.cfg=cfg; this.pat=PATTERNS[cfg.pattern]||PATTERNS.solid;
    this.slots=new Uint8Array(N*N); this.keys=new Array(N*N).fill(null); this.post=[];
  }
  put(x,y,s,k){ x=Math.round(x); y=Math.round(y); if(x<0||y<0||x>=N||y>=N) return; this.slots[y*N+x]=s; this.keys[y*N+x]=k||null; }
  filled(x,y){ return x>=0&&y>=0&&x<N&&y<N&&this.slots[y*N+x]>1; }
  /* tone: -1 shade, 0 normal, 1 light; force: fixed class ignoring the pattern */
  fur(x,y,part,a,b,tone,force){
    const c=force||this.pat(part,a,b)||'B';
    let s;
    if(c==='X') s=tone<0?SL.XD:tone>0?SL.XL:SL.X;
    else if(c==='W') s=tone<0?SL.WD:tone>0?SL.WL:SL.W;
    else if(c==='P') s=tone<0?SL.PD:tone>0?SL.PL:SL.P;
    else if(c==='D') s=SL.BD;
    else s=tone<0?SL.BD:tone>0?SL.BL:SL.B;
    this.put(x,y,s,`${part}:${a}:${b}`);
  }
  ellipse(cx,cy,rx,ry,fn){
    for(let y=Math.floor(cy-ry-1);y<=Math.ceil(cy+ry+1);y++)
      for(let x=Math.floor(cx-rx-1);x<=Math.ceil(cx+rx+1);x++){
        const nx=(x+0.5-cx)/rx, ny=(y+0.5-cy)/ry; if(nx*nx+ny*ny<=1) fn(x,y,nx,ny);
      }
  }
  tri(pts,fn){
    const [a,b,c]=pts, xs=pts.map(p=>p[0]), ys=pts.map(p=>p[1]);
    for(let y=Math.floor(Math.min(...ys));y<=Math.ceil(Math.max(...ys));y++)
      for(let x=Math.floor(Math.min(...xs));x<=Math.ceil(Math.max(...xs));x++){
        const px=x+0.5, py=y+0.5;
        const d1=(px-b[0])*(a[1]-b[1])-(a[0]-b[0])*(py-b[1]);
        const d2=(px-c[0])*(b[1]-c[1])-(b[0]-c[0])*(py-c[1]);
        const d3=(px-a[0])*(c[1]-a[1])-(c[0]-a[0])*(py-a[1]);
        if(!((d1<0||d2<0||d3<0)&&(d1>0||d2>0||d3>0))) fn(x,y);
      }
  }
  /* tube along a quadratic bezier; fn(x,y,step,side) */
  tube(p0,p1,p2,rad,fn,steps=14){
    for(let s=0;s<=steps;s++){
      const u=s/steps, iu=1-u;
      const px=iu*iu*p0[0]+2*iu*u*p1[0]+u*u*p2[0], py=iu*iu*p0[1]+2*iu*u*p1[1]+u*u*p2[1], r=rad(u);
      for(let y=Math.floor(py-r-1);y<=Math.ceil(py+r);y++) for(let x=Math.floor(px-r-1);x<=Math.ceil(px+r);x++){
        const dx=x+0.5-px, dy=y+0.5-py; if(dx*dx+dy*dy<=r*r) fn(x,y,s,clamp(Math.round(dy),-2,2));
      }
    }
  }
  /* tube along a polyline */
  path(pts,rad,fn){
    const segs=[]; let total=0;
    for(let i=1;i<pts.length;i++){ const l=Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]); segs.push(l); total+=l; }
    const steps=Math.max(8,Math.ceil(total*2)); let acc=0, si=0;
    for(let s=0;s<=steps;s++){
      const d=s/steps*total; while(si<segs.length-1 && acc+segs[si]<d){acc+=segs[si];si++;}
      const t=segs[si]?(d-acc)/segs[si]:0, A=pts[si], B=pts[si+1]||pts[si];
      const px=A[0]+(B[0]-A[0])*t, py=A[1]+(B[1]-A[1])*t, u=s/steps, r=rad(u);
      for(let y=Math.floor(py-r-1);y<=Math.ceil(py+r);y++) for(let x=Math.floor(px-r-1);x<=Math.ceil(px+r);x++){
        const dx=x+0.5-px, dy=y+0.5-py; if(dx*dx+dy*dy<=r*r) fn(x,y,Math.round(u*14),clamp(Math.round(dy),-2,2));
      }
    }
  }
  line(x0,y0,x1,y1,fn){
    const n=Math.max(Math.abs(x1-x0),Math.abs(y1-y0),1);
    for(let i=0;i<=n;i++) fn(Math.round(x0+(x1-x0)*i/n),Math.round(y0+(y1-y0)*i/n),i/n);
  }
  outline(){
    if(this.noOutline){ for(const f of this.post) f(); return; }
    const out=[];
    for(let y=0;y<N;y++) for(let x=0;x<N;x++){
      if(this.slots[y*N+x]!==0) continue;
      if(this.filled(x-1,y)||this.filled(x+1,y)||this.filled(x,y-1)||this.filled(x,y+1)) out.push(y*N+x);
    }
    for(const i of out) this.slots[i]=SL.OUT;
    for(const f of this.post) f();
  }
  /* big sparkly eye; state: open | closed | happy | sleep */
  eye(x,y,state,size){
    x=Math.round(x); y=Math.round(y);
    if(state==='open'){
      if(size==='s'){ this.put(x,y,SL.PUP,'e:0:0'); this.put(x+1,y,SL.PUP,'e:1:0'); this.put(x,y-1,SL.GLINT,'e:0:-1'); this.put(x+1,y-1,SL.PUP,'e:1:-1'); return; }
      if(size==='xs'){ this.put(x,y,SL.PUP,'e:0:0'); return; }
      if(size==='m'){
        this.put(x,y-1,SL.GLINT,'e:0:-1'); this.put(x+1,y-1,SL.PUP,'e:1:-1');
        this.put(x,y,SL.PUP,'e:0:0'); this.put(x+1,y,SL.PUP,'e:1:0');
        this.put(x,y+1,SL.EYE,'e:0:1'); this.put(x+1,y+1,SL.EYE,'e:1:1'); return;
      }
      this.put(x,y-1,SL.PUP,'e:0:-1'); this.put(x+1,y-1,SL.PUP,'e:1:-1'); this.put(x+2,y-1,SL.PUP,'e:2:-1');
      this.put(x,y,SL.GLINT,'e:0:0'); this.put(x+1,y,SL.PUP,'e:1:0'); this.put(x+2,y,SL.PUP,'e:2:0');
      this.put(x,y+1,SL.EYE,'e:0:1'); this.put(x+1,y+1,SL.EYE,'e:1:1'); this.put(x+2,y+1,SL.GLINT,'e:2:1');
      this.put(x+1,y-2,SL.PUP,null);
    } else if(state==='happy'){
      this.put(x,y-1,SL.PUP,null); this.put(x+1,y-1,SL.PUP,null); this.put(x-1,y,SL.PUP,null); this.put(x+2,y,SL.PUP,null);
    } else {
      this.put(x-1,y,SL.PUP,null); this.put(x,y+1,SL.PUP,null); this.put(x+1,y+1,SL.PUP,null); this.put(x+2,y,SL.PUP,null);
    }
  }
}

/* ---------- colorizer ---------- */
const SHADED=new Set([SL.BD,SL.WD,SL.ACCD,SL.PD,SL.XD]), LIT=new Set([SL.BL,SL.WL,SL.XL,SL.PL]);
function rawColorFor(slot,cfg,white){
  const c=cfg.colors;
  switch(slot){
    case SL.PUP: return '181425';
    case SL.B: case SL.BD: case SL.BL: return white?'ffffff':c.base;
    case SL.W: case SL.WD: case SL.WL: return white?'ffffff':c.sec;
    case SL.P: case SL.PD: case SL.PL: return white?'ffffff':c.pat;
    case SL.X: case SL.XD: case SL.XL: return white?'ffffff':(c.ext||c.pat);
    case SL.EYE: return white?'c0cbdc':c.eye;
    case SL.PINK: case SL.BLUSH: return white?'ffffff':'f6757a';
    case SL.MOUTH: return '3e2731';
    case SL.NOSE: return white?'5a6988':'3e2731';
    case SL.TONGUE: return white?'ffffff':'e43b44';
    case SL.ACC: case SL.ACCD: return white?'ffffff':c.acc;
    case SL.GLINT: return 'ffffff';
    case SL.GOLD: return white?'ffffff':'fee761';
    case SL.WHISK: return 'ffffff';
    case SL.FEET: return white?'ffffff':(c.feet||'e4a672');
  }
  return null;
}
/* Hand painting is done on the standing frame. Pixels that only appear in other poses (a folded leg, the far
   side of the tail, the belly while sleeping) get the paint of the nearest pixel of the same body part that IS
   on the standing frame, so a painted pet looks the same in every pose instead of showing unpainted holes. */
const _paintGeo={};
function paintKeyFor(cfg,k){
  const gk=JSON.stringify([cfg.spec,cfg.neck,cfg.head]); let g=_paintGeo[gk];
  if(!g){ const keys=buildSprite(Object.assign({},cfg,{paint:{}}),'stand',0).keys, vis=new Set(keys.filter(Boolean)), byPart={};
    for(const v of vis){ const seg=v.split(':'), part=seg[0]+'/'+seg.length; (byPart[part]=byPart[part]||[]).push([seg.slice(1).map(Number),v]); }
    g=_paintGeo[gk]={vis,byPart,near:{}}; const ks=Object.keys(_paintGeo); if(ks.length>40) delete _paintGeo[ks[0]]; }
  if(g.vis.has(k)) return k;
  if(k in g.near) return g.near[k];
  const seg=k.split(':'), nums=seg.slice(1).map(Number), list=g.byPart[seg[0]+'/'+seg.length]||[]; let best=null, bd=4;
  for(const [n,v] of list){ let d=0; for(let i=0;i<n.length;i++) d+=Math.abs(n[i]-nums[i]); if(d<bd){ bd=d; best=v; } }
  return g.near[k]=best;
}
// a part far from anything on the standing frame (a spread wing, the glider's membrane) takes the color that
// covers most of that part — or of the body, if the part is not on the standing frame at all
function dominantPaint(cfg,paint,part,memo){
  if(part in memo) return memo[part];
  const g=_paintGeo[JSON.stringify([cfg.spec,cfg.neck,cfg.head])]; if(!g) return memo[part]=null;
  const pick=pt=>{ const keys=[...g.vis].filter(v=>v.split(':')[0]===pt); if(!keys.length) return undefined; const n={};
    for(const v of keys) if(paint[v]) n[paint[v]]=(n[paint[v]]||0)+1;
    let best=null,bn=0; for(const c in n) if(n[c]>bn){bn=n[c];best=c;} return bn>=keys.length*0.5?best:null; };
  let d=pick(part); if(d===undefined) d=pick('body')||null;
  return memo[part]=d;
}
function colorize(sprite,cfg){
  const white=cfg.paintBase==='white', paint=cfg.paint||{}, anyPaint=Object.keys(paint).length>0, dom={};
  const rgba=new Uint8ClampedArray(N*N*4), raw=new Array(N*N).fill(null), shown=new Array(N*N).fill(null);
  const set=(i,h,a=255)=>{ shown[i]=h; const c=hexRgb(h); rgba[i*4]=c[0]; rgba[i*4+1]=c[1]; rgba[i*4+2]=c[2]; rgba[i*4+3]=a; };
  for(let i=0;i<N*N;i++){
    const s=sprite.slots[i]; if(!s||s===SL.OUT) continue;
    let r=rawColorFor(s,cfg,white); const k=sprite.keys[i];
    if(k&&anyPaint){ const nk=paintKeyFor(cfg,k); // stale keys from another animal are ignored
      if(nk){ if(paint[nk]) r=paint[nk]; }
      else { const d=dominantPaint(cfg,paint,k.split(':')[0],dom); if(d) r=d; } }
    raw[i]=r;
    set(i, SHADED.has(s)?shadeOf(r) : LIT.has(s)?lightOf(r) : r, s===SL.WHISK?150:255);
  }
  for(let i=0;i<N*N;i++){
    if(sprite.slots[i]!==SL.OUT) continue;
    const x=i%N, y=(i/N)|0; let best=null, bl=1e9;
    for(const [ax,ay] of [[x-1,y],[x+1,y],[x,y-1],[x,y+1]]){
      if(ax<0||ay<0||ax>=N||ay>=N) continue; const j=ay*N+ax, h=shown[j];
      if(!h||sprite.slots[j]===SL.OUT||sprite.slots[j]===SL.WHISK) continue; const l=lum(hexRgb(h)); if(l<bl){bl=l;best=h;}
    }
    let o=shadeOf(shadeOf(best||'5a6988'));
    for(let k=0;k<3&&lum(hexRgb(o))>70;k++) o=shadeOf(o);
    set(i,o);
  }
  return {rgba,raw,shown};
}

/* ---------- rig registry ---------- */
const RIGS = {};
const RIG_POSES = {}; // per rig: pose -> {frames,fps}
const DEFAULT_POSES = {stand:{frames:12,fps:6}, walk:{frames:8,fps:9}, sit:{frames:12,fps:6}, sleep:{frames:8,fps:3}, jump:{frames:8,fps:10}};
const JUMP_HOP = [0,1,-3,-7,-9,-7,-3,0];
function posesOf(spec){ return RIG_POSES[spec.rig]||DEFAULT_POSES; }
function buildSprite(cfg, pose, f){
  const spec=cfg.spec; const S=new Spr(cfg);
  (RIGS[spec.rig]||RIGS.quad)(S, spec.p||{}, cfg, pose, f);
  S.outline();
  return S;
}
