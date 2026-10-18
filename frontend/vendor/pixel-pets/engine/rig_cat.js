/* ===== Cat rig: the soft side-view kitten (previous approved look), wrapped into the v3 rig system ===== */
(function(GSL){
const SL={E:0,OUT:1,B:2,BD:3,W:4,WD:5,P:6,PD:7,EYE:8,PUP:9,PINK:10,ACC:11,ACCD:12,GLINT:13,GOLD:14,BLUSH:15,MOUTH:16,BL:17,WL:18};
const m=mod;
const BUILD = {
  normal:{rx:7.4,ry:4.8,hx:6.4,hy:5.8},
  chunky:{rx:7.9,ry:5.4,hx:6.7,hy:6.0},
  slim:  {rx:7.3,ry:4.3,hx:6.0,hy:5.5},
  big:   {rx:8.4,ry:5.4,hx:6.8,hy:6.1}
};
const EARS = {
  up:   {b:[[-5.4,-2.4],[-1.6,-5.2],[-4.6,-9.6]], f:[[-0.8,-5.5],[3.8,-4.0],[1.5,-9.9]]},
  small:{b:[[-5.0,-2.9],[-1.9,-5.2],[-4.1,-8.2]], f:[[-0.4,-5.6],[3.4,-4.3],[1.4,-8.5]]},
  big:  {b:[[-5.8,-2.0],[-1.2,-5.2],[-5.0,-11.0]], f:[[-1.2,-5.4],[4.3,-3.6],[1.7,-11.4]]},
  tuft: {b:[[-5.4,-2.4],[-1.6,-5.2],[-4.9,-11.0]], f:[[-0.8,-5.5],[3.8,-4.0],[1.3,-11.4]], tuft:true},
  fold: {b:[[-5.2,-3.4],[-1.6,-5.6],[-1.8,-7.4]], f:[[-0.4,-5.8],[3.6,-4.4],[3.9,-6.9]], fold:true}
};


const CPOSES = {
  stand:{frames:8, fps:5}, walk:{frames:4, fps:6}, sit:{frames:8, fps:5},
  sleep:{frames:4, fps:2}, jump:{frames:6, fps:9}
};


function sceneFor(poseName, f, parts){
  const B = BUILD[parts.build]||BUILD.normal;
  const long = parts.coat==='long';
  const sc = {bodies:[], legs:[], paws:[], tail:null, tailFront:false, eyes:'open', fringe:false, ruff:long};
  if(poseName==='sit'){
    const sw=[0,0,0,1,2,1,0,0][f%8];
    const cx=12, cy=22.6, rx=B.rx*0.84+(long?0.4:0), ry=B.ry*1.2;
    sc.main={cx,cy,rx,ry};
    sc.bodies.push(sc.main,{cx:16.4,cy:21.4,rx:4.1,ry:5.2});
    sc.head={x:19.5,y:12.5,rx:B.hx,ry:B.hy};
    sc.legs.push({id:2,x0:14,w:2,top:23,bot:28,far:true},{id:0,x0:17,w:3,top:23,bot:28,far:false});
    sc.paws.push({id:1,cx:9.6,cy:27.7,rx:3.1,ry:1.25});
    sc.tail=tailShape(parts,{x:cx-rx+1.5,y:26.2},'wrap',sw); sc.tailFront=true;
    if((f%8)===6) sc.eyes='closed';
  } else if(poseName==='sleep'){
    const br=[0,0.25,0.45,0.25][f%4];
    const cx=13, cy=24.6, rx=B.rx+2.6+(long?0.4:0), ry=B.ry-0.4+br;
    sc.main={cx,cy,rx,ry}; sc.bodies.push(sc.main);
    sc.head={x:21.5,y:22.5-br*0.5,rx:B.hx*0.95,ry:B.hy*0.92};
    sc.paws.push({id:0,cx:26.4,cy:27.9,rx:2.3,ry:1.1});
    sc.tail=tailShape(parts,{x:cx-rx+1.6,y:26.2},'wrapLow',0); sc.tailFront=true;
    sc.eyes='sleep'; sc.ruff=false;
  } else {
    let bob=0, sw=0, lift=[0,0,0,0], shift=[0,0,0,0], air=false;
    if(poseName==='walk'){
      const k=f%4; bob=[0,1,0,1][k]; sw=[0,1,0,-1][k];
      // pair A = near front (0) + far back (3); pair B = far front (2) + near back (1)
      if(k===0){ lift=[1,0,0,1]; shift=[1,0,0,1]; }
      if(k===2){ lift=[0,1,1,0]; shift=[0,1,1,0]; }
    } else if(poseName==='jump'){
      const k=f%6; bob=(k===0||k===5)?1:0; air=k>=1&&k<=4; sc.eyes='happy'; sw=air?-1:0;
    } else { sw=[0,0,1,1,2,2,1,1][f%8]; if((f%8)===7) sc.eyes='closed'; }
    const la=Math.round((parts.leg||3)-3);
    const cx=12.5, cy=21.4+bob-la, rx=B.rx+(long?0.4:0), ry=B.ry+(long?0.3:0);
    sc.main={cx,cy,rx,ry};
    sc.bodies.push(sc.main,{cx:17.6,cy:20.6+bob,rx:4.0,ry:4.3});
    sc.head={x:21.5,y:13.5+bob-la,rx:B.hx,ry:B.hy};
    sc.fringe=long;
    const legs=[{id:3,x0:10,w:2,far:true},{id:2,x0:15,w:2,far:true},{id:1,x0:6,w:3,far:false},{id:0,x0:17,w:3,far:false}];
    for(const L of legs){
      let bot=28-lift[L.id], x0=L.x0+shift[L.id];
      if(air){ const front=L.id===0||L.id===2; x0+=front?1:-1; bot=26; }
      sc.legs.push({id:L.id,x0,w:L.w,top:Math.min(23+bob-la,26),bot,far:L.far});
    }
    sc.tail=tailShape(parts,{x:cx-rx+1.4,y:cy-1.4},'up',sw);
  }
  return sc;
}

function tailShape(parts, p0, mode, sw){
  const t=parts.tail;
  if(t==='none') return null;
  let p1,p2;
  if(mode==='up'){
    if(t==='bob'){ p1={x:p0.x-1.6,y:p0.y}; p2={x:p0.x-2.2+sw*0.3,y:p0.y-2.4}; }
    else { p1={x:p0.x-5.2,y:p0.y+0.8+sw*0.3}; p2={x:p0.x-3.6+sw,y:p0.y-8.2}; }
  } else if(mode==='wrap'){
    if(t==='bob'){ p1={x:p0.x-1.5,y:p0.y+1.5}; p2={x:p0.x-1,y:p0.y+2.2}; }
    else { p1={x:p0.x-4.2,y:p0.y+3.6}; p2={x:p0.x+5,y:p0.y+2.5-sw*0.7}; }
  } else {
    if(t==='bob'){ p1={x:p0.x-1,y:p0.y+1.3}; p2={x:p0.x,y:p0.y+2}; }
    else { p1={x:p0.x-0.8,y:p0.y+3.6}; p2={x:p0.x+10,y:p0.y+2.6}; }
  }
  let rad;
  if(t==='fluffy') rad=u=>1.7+0.9*Math.sin(Math.PI*Math.min(1,u*1.05));
  else if(t==='thin') rad=u=>1.1-0.3*u;
  else if(t==='bob') rad=()=>1.9;
  else rad=u=>1.6-0.2*u;
  return {p0,p1,p2,rad};
}

function inTriC(px,py,t){
  const [a,b,c]=t;
  const d1=(px-b[0])*(a[1]-b[1])-(a[0]-b[0])*(py-b[1]);
  const d2=(px-c[0])*(b[1]-c[1])-(b[0]-c[0])*(py-c[1]);
  const d3=(px-a[0])*(c[1]-a[1])-(c[0]-a[0])*(py-a[1]);
  return !((d1<0||d2<0||d3<0)&&(d1>0||d2>0||d3>0));
}

/* ---------- rasterizer ---------- */
function buildCat(cfg, poseName, f){
  const parts=cfg.parts, pat=PATTERNS[cfg.pattern]||PATTERNS.solid;
  const slots=new Uint8Array(N*N), keys=new Array(N*N).fill(null);
  const put=(x,y,s,k)=>{ if(x<0||y<0||x>=N||y>=N) return; slots[y*N+x]=s; keys[y*N+x]=k; };
  const filled=(x,y)=>x>=0&&y>=0&&x<N&&y<N&&slots[y*N+x]>1;
  const sc=sceneFor(poseName,f,parts), M=sc.main;
  const shadeIt=c=>c==='B'?SL.BD:c==='W'?SL.WD:c==='P'?SL.PD:SL.BD;
  const slotOf=c=>c==='B'?SL.B:c==='W'?SL.W:c==='P'?SL.P:SL.BD;
  const lightIt=c=>c==='B'?SL.BL:c==='W'?SL.WL:slotOf(c);
  const ellipse=(e,fn)=>{
    for(let y=Math.floor(e.cy-e.ry-1);y<=Math.ceil(e.cy+e.ry+1);y++)
      for(let x=Math.floor(e.cx-e.rx-1);x<=Math.ceil(e.cx+e.rx+1);x++){
        const dx=(x+0.5-e.cx)/e.rx, dy=(y+0.5-e.cy)/e.ry; if(dx*dx+dy*dy<=1) fn(x,y);
      }
  };
  const bodyPix=(x,y)=>{
    const a=Math.max(-10,Math.min(10,Math.round((x+0.5-M.cx)/M.rx*8)));
    const b=Math.max(-6,Math.min(6,Math.round((y+0.5-M.cy)/M.ry*5)));
    const c=pat('body',a,b);
    const s = b>=4?shadeIt(c) : (b<=-4&&a>=-5&&a<=1)?lightIt(c) : slotOf(c);
    put(x,y,s,`b:${a}:${b}`);
  };
  const drawLeg=L=>{
    for(let y=L.top;y<=L.bot;y++){
      const tn=Math.round((y-L.top)/Math.max(1,L.bot-L.top)*7);
      for(let c=0;c<L.w;c++){
        if(y===L.bot && L.w===3 && c===0) { /* rounded heel */ }
        const cl=pat('leg',c,tn); put(L.x0+c,y,L.far?shadeIt(cl):slotOf(cl),`l${L.id}:${c}:${tn}`);
      }
    }
  };
  const drawPaw=P=>ellipse(P,(x,y)=>{
    const c=Math.max(0,Math.round((x+0.5-P.cx)/P.rx*1.5)+1), tn=Math.max(5,Math.round(7-(P.cy+P.ry-(y+0.5))));
    const cl=pat('leg',c,tn); put(x,y,slotOf(cl),`l${P.id}:${c}:${tn}`);
  });
  const drawTail=()=>{
    const T=sc.tail; if(!T) return;
    for(let s=0;s<=14;s++){
      const u=s/14, iu=1-u;
      const px=iu*iu*T.p0.x+2*iu*u*T.p1.x+u*u*T.p2.x, py=iu*iu*T.p0.y+2*iu*u*T.p1.y+u*u*T.p2.y, r=T.rad(u);
      for(let y=Math.floor(py-r-1);y<=Math.ceil(py+r);y++) for(let x=Math.floor(px-r-1);x<=Math.ceil(px+r);x++){
        const dx=x+0.5-px, dy=y+0.5-py;
        if(dx*dx+dy*dy<=r*r){ const side=Math.max(-2,Math.min(2,Math.round(dy))); const cl=pat('tail',s,side);
          put(x,y,side>=1?shadeIt(cl):slotOf(cl),`t:${s}:${side}`); }
      }
    }
  };
  const H=sc.head, hx=Math.floor(H.x), hy=Math.floor(H.y), hs=H.rx/6.4;
  const E=EARS[parts.ears]||EARS.up, face=parts.face||'normal';
  const drawEar=(tri,back)=>{
    const T=tri.map(p=>[H.x+p[0]*hs,H.y+p[1]*hs]);
    const cx=(T[0][0]+T[1][0]+T[2][0])/3, cy=(T[0][1]+T[1][1]+T[2][1])/3;
    const inner=T.map(p=>[cx+(p[0]-cx)*0.45,cy+0.7+(p[1]-cy)*0.45]);
    for(let y=Math.floor(H.y-13);y<=Math.ceil(H.y);y++) for(let x=Math.floor(H.x-8);x<=Math.ceil(H.x+8);x++){
      if(!inTriC(x+0.5,y+0.5,T)) continue;
      const dx=x-hx, dy=y-hy;
      if(!E.fold && !back && inTriC(x+0.5,y+0.5,inner)){ put(x,y,SL.PINK,`h:${dx}:${dy}`); continue; }
      const cl=pat('ear',dx,dy); put(x,y,back?shadeIt(cl):slotOf(cl),`h:${dx}:${dy}`);
    }
    if(E.tuft){ const tx=Math.floor(T[2][0]+0.3), ty=Math.floor(T[2][1]+0.6); if(filled(tx,ty)) put(tx,ty,SL.PD,null); if(filled(tx,ty+1)) put(tx,ty+1,SL.PD,null); }
  };
  const headPix=(x,y)=>{ const dx=x-hx, dy=y-hy; const cl=pat('head',dx,dy);
    let s = (dy>=4&&dx<=-2)?shadeIt(cl) : (dy<=-4&&dx>=-3&&dx<=0)?lightIt(cl) : slotOf(cl);
    if(parts.coat==='none' && dy===-3 && dx>=-2 && dx<=0 && cl==='B') s=SL.BD;
    put(x,y,s,`h:${dx}:${dy}`); };
  const drawHead=()=>{
    drawEar(E.b,true);
    ellipse({cx:H.x,cy:H.y,rx:H.rx+(parts.coat==='long'?0.3:0),ry:H.ry},headPix);
    const mz = face==='flat'?{cx:H.x+4.6*hs,cy:H.y+1.9,rx:1.6,ry:1.6}: face==='long'?{cx:H.x+5.0*hs,cy:H.y+2.2,rx:2.8,ry:1.7}:{cx:H.x+4.4*hs,cy:H.y+2.3,rx:2.3,ry:1.8};
    ellipse(mz,headPix);
    if(parts.coat==='long') for(const [dx,dy] of [[-7,1],[-7,2],[-6,4],[-4,6]]) if(!filled(hx+dx,hy+dy)) headPix(hx+dx,hy+dy);
    drawEar(E.f,false);
    // big glossy eye
    const ex=hx+1, ey=hy;
    if(sc.eyes==='open'){
      put(ex,ey-1,SL.PUP,'e:0:-1'); put(ex+1,ey-1,SL.PUP,'e:1:-1'); put(ex+2,ey-1,SL.PUP,'e:2:-1');
      put(ex,ey,SL.GLINT,'e:0:0'); put(ex+1,ey,SL.PUP,'e:1:0'); put(ex+2,ey,SL.PUP,'e:2:0');
      put(ex,ey+1,SL.EYE,'e:0:1'); put(ex+1,ey+1,SL.EYE,'e:1:1'); put(ex+2,ey+1,SL.GLINT,'e:2:1');
      put(ex+1,ey-2,SL.PUP,null);
    } else if(sc.eyes==='happy'){
      put(ex,ey-1,SL.PUP,null); put(ex+1,ey-1,SL.PUP,null); put(ex-1,ey,SL.PUP,null); put(ex+2,ey,SL.PUP,null);
    } else {
      put(ex-1,ey,SL.PUP,null); put(ex,ey+1,SL.PUP,null); put(ex+1,ey+1,SL.PUP,null); put(ex+2,ey,SL.PUP,null);
    }
    // blush, nose, little mouth
    put(ex-1,ey+3,SL.BLUSH,null); put(ex,ey+3,SL.BLUSH,null);
    const nx = face==='flat'?hx+5:face==='long'?hx+7:hx+6, ny=hy+2;
    put(nx,ny,SL.PINK,null);
    put(nx-1,ny+1,SL.MOUTH,null);
    if(sc.eyes==='happy') put(nx-1,ny+2,SL.PINK,null);
  };
  const drawAccessories=()=>{
    if(cfg.neck==='collar'||cfg.neck==='bell'){
      for(let dx=-4;dx<=3;dx++){ const x=hx+dx, y=hy+5+(dx<-1?0:1); if(filled(x,y)) put(x,y,cfg.neck==='bell'?SL.ACCD:SL.ACC,null); }
      if(cfg.neck==='bell'){ put(hx+1,hy+7,SL.GOLD,null); put(hx+2,hy+7,SL.GOLD,null); put(hx+1,hy+8,SL.GOLD,null); put(hx+2,hy+8,SL.GOLD,null); }
      else put(hx+1,hy+7,SL.GOLD,null);
    } else if(cfg.neck==='bandana'){
      const rows=[[5,-3,4],[6,-1,3],[7,0,2],[8,1,1]];
      for(const [dy,a,b] of rows) for(let dx=a;dx<=b;dx++) put(hx+dx,hy+dy,dy===6?SL.ACCD:SL.ACC,null);
    }
    if(cfg.head==='bow'){
      for(const [dx,dy] of [[-5,-7],[-5,-6],[-5,-5],[-4,-6],[-1,-7],[-1,-6],[-1,-5],[-2,-6]]) put(hx+dx,hy+dy,SL.ACC,null);
      put(hx-3,hy-6,SL.ACCD,null);
    } else if(cfg.head==='glasses' && sc.eyes==='open'){
      for(let dx=1;dx<=4;dx++){ put(hx+dx,hy-1,SL.PUP,null); put(hx+dx,hy,SL.PUP,null); }
      for(let dx=-3;dx<=0;dx++) put(hx+dx,hy-1,SL.PUP,null);
      put(hx+2,hy-1,SL.GLINT,null);
    } else if(cfg.head==='hat'){
      const rows=[[-6,-2,2],[-7,-1,1],[-8,-1,1],[-9,0,0],[-10,0,0]];
      for(const [dy,a,b] of rows) for(let dx=a;dx<=b;dx++) put(hx+dx,hy+dy,dy===-7?SL.ACCD:SL.ACC,null);
      put(hx,hy-11,SL.GOLD,null);
    } else if(cfg.head==='flower'){
      const cx=hx+4, cy=hy-5;
      for(const [dx,dy] of [[-1,0],[1,0],[0,-1],[0,1]]) put(cx+dx,cy+dy,SL.ACC,null);
      put(cx,cy,SL.GOLD,null);
    }
  };

  for(const L of sc.legs) if(L.far) drawLeg(L);
  if(!sc.tailFront) drawTail();
  for(const e of sc.bodies) ellipse(e,bodyPix);
  if(sc.ruff) ellipse({cx:H.x-0.5,cy:H.y+H.ry-0.2,rx:3.4,ry:2.4},bodyPix);
  if(sc.fringe){
    for(let x=0;x<N;x++){ let bot=-1; for(let y=N-1;y>=0;y--) if(slots[y*N+x]>1&&(keys[y*N+x]||'').startsWith('b:')){bot=y;break;}
      if(bot>0&&m(x,2)===0&&!filled(x,bot+1)) bodyPix(x,bot+1); }
  }
  for(const L of sc.legs) if(!L.far) drawLeg(L);
  for(const P of sc.paws) drawPaw(P);
  if(sc.tailFront && poseName==='sleep') drawTail();
  drawHead();
  if(sc.tailFront && poseName!=='sleep') drawTail();
  drawAccessories();
  const out=[];
  for(let y=0;y<N;y++) for(let x=0;x<N;x++){
    if(slots[y*N+x]!==0) continue;
    if(filled(x-1,y)||filled(x+1,y)||filled(x,y-1)||filled(x,y+1)) out.push(y*N+x);
  }
  for(const i of out) slots[i]=SL.OUT;
  return {slots,keys};
}


RIG_POSES.cat=CPOSES;
const MAP=[0,1,GSL.B,GSL.BD,GSL.W,GSL.WD,GSL.P,GSL.PD,GSL.EYE,GSL.PUP,GSL.PINK,GSL.ACC,GSL.ACCD,GSL.GLINT,GSL.GOLD,GSL.BLUSH,GSL.MOUTH,GSL.BL,GSL.WL];
const EAR_MAP={cat:'up',catSmall:'small',catBig:'big',tuft:'tuft',fold:'fold',up:'up',small:'small',big:'big'};
RIGS.cat=function(S,P,cfg,pose,f){
  const parts={ears:EAR_MAP[P.ears]||'up', tail:P.tail==='cat'||!P.tail?'long':P.tail, coat:P.coat==='curly'?'short':(P.coat||'short'), face:P.face||'normal', build:P.build||'normal', leg:P.leg||3};
  const sp=buildCat({parts,pattern:cfg.pattern,neck:cfg.neck,head:cfg.head},pose,f);
  for(let i=0;i<N*N;i++) if(sp.slots[i]){ S.slots[i]=MAP[sp.slots[i]]; S.keys[i]=sp.keys[i]; }
};
})(SL);
