/* ===== Quadruped rig: cats, dogs, rodents, rabbits, ferrets, hedgehogs, foxes, hoofed pets ===== */
const QDEF = {bodyL:7.4,bodyH:4.8,leg:3,legW:3,farW:2,headR:6.4,headRy:5.8,headDX:0,headDY:0,
  snout:2.3,snoutH:1.8,snoutDy:2.3,nose:'pink',ears:'cat',tail:'cat',coat:'short',whiskers:true,
  eye:'l',sit:'cat',build:'normal',face:'normal',mane:false,horns:false,hooves:false,cheeks:false,tongue:false,earScale:1};
const BUILD_MUL = {normal:[1,1,1],chunky:[1.06,1.12,1.04],slim:[0.98,0.88,0.94],big:[1.12,1.12,1.05]};
const EAR_H = {cat:4.6,catSmall:3.4,catBig:6,tuft:6,fold:2.5,dogUp:4.3,fox:5.6,horse:3.6,flop:0.5,flopLong:0.5,semi:3,round:2.8,mouse:3.6,tiny:1.2,bunny:9.5,lop:1,pig:1.5,none:0};
// walk cycle: stance 0-4, swing 5-7
const STEP_X=[1.5,0.8,0,-0.8,-1.5,-0.9,0.3,1.2], STEP_LIFT=[0,0,0,0,0,1,2,1];

RIGS.quad = function(S, P0, cfg, pose, f){
  const p = Object.assign({}, QDEF, P0);
  const bm = BUILD_MUL[p.build]||BUILD_MUL.normal;
  const bodyL=p.bodyL*bm[0], bodyH=p.bodyH*bm[1], hR=p.headR*bm[2], hRy=p.headRy*bm[2];
  const long=p.coat==='long', curly=p.coat==='curly'||p.coat==='wool';
  const face=p.face;
  const snout = face==='flat'?Math.min(1.5,p.snout):face==='long'?p.snout+0.7:p.snout;
  const earH=(EAR_H[p.ears]??4)*p.earScale;
  const st = {eyes:'open', earT:0, tailSw:0, mouth:'closed'};
  let legs=[], paws=[], bodies=[], main, head, tail=null, tailFront=false, tailMode='up', extras={};
  const cx0 = 12.8 - Math.max(0,bodyL-7.4)*0.35;

  const placeHead=(hx,hy)=>{ hy=Math.max(hy, hRy+earH+0.6); hx=Math.min(hx, 30.6-hR*0.55-snout); return {x:hx,y:hy,rx:hR,ry:hRy}; };

  if(pose==='sit' && p.sit==='lie') pose='lie';
  if(pose==='sit' && p.sit==='beg'){
    const k=f%12, br=[0,0,.2,.3,.3,.2,0,0,0,0,0,0][k];
    const cx=14, ry=Math.min(7.2,bodyL*0.85+0.6), rx=bodyH*1.05+br*0.3, cy=28-ry+0.4;
    main={cx,cy,rx,ry}; bodies.push(main);
    head=placeHead(cx+2.3+p.headDX*0.3, cy-ry*0.72);
    paws.push({id:1,cx:cx+1.5,cy:27.8,rx:2.6,ry:1.1},{id:0,cx:cx+rx*0.85,cy:cy-0.6,rx:1.5,ry:1.1,front:true});
    tail={p0:[cx-rx+0.8,26.5],mode:'rest'};
    if(k===10) st.eyes='closed';
    st.tailSw=Math.sin(TAU*k/12);
  } else if(pose==='sit'){
    const k=f%12, br=[0,0,.15,.3,.4,.4,.3,.15,0,0,0,0][k];
    const sh=Math.min(7.4,bodyH*1.25+br*0.4), cx=12, cy=28-sh+0.3;
    main={cx,cy,rx:bodyL*0.8,ry:sh}; bodies.push(main);
    const ch={cx:16.2+(bodyL-7.4)*0.25,cy:cy-1.4,rx:4.1,ry:Math.min(6.4,bodyH*1.08+p.leg*0.25)}; bodies.push(ch);
    head=placeHead(ch.cx+3.2+p.headDX*0.6, ch.cy-ch.ry-hRy*0.2);
    legs.push({id:2,x:Math.round(ch.cx-2.8),top:Math.round(ch.cy),foot:28,dx:0,far:true,w:p.farW},
              {id:0,x:Math.round(ch.cx+0.4),top:Math.round(ch.cy),foot:28,dx:0,far:false,w:p.legW});
    paws.push({id:1,cx:cx-2.2,cy:27.7,rx:3.1,ry:1.25});
    tail={p0:[cx-main.rx+1.5,26.4],mode:'wrap'}; tailFront=true;
    if(k===10) st.eyes='closed'; if(k===5||k===6) st.earT=0.9;
    st.tailSw=[0,0,0,1,2,1,0,0,0,0,0,0][k];
  } else if(pose==='sleep' || pose==='lie'){
    const k=f%8, br=pose==='sleep'?[0,.15,.3,.45,.45,.3,.15,0][k]:0;
    const rx=bodyL+2.4, ry=Math.max(3.6,bodyH-0.4)+br, cx=13, cy=28-ry+0.4;
    main={cx,cy,rx,ry}; bodies.push(main);
    head=placeHead(Math.min(cx+rx*0.72,24), cy-ry*0.35-(pose==='lie'?2.5:0));
    head.rx*=0.95; head.ry*=0.93;
    if(pose==='lie') head.y=Math.max(head.y,hRy+earH+0.6);
    paws.push({id:0,cx:Math.min(head.x+4.8,28),cy:27.9,rx:2.3,ry:1.1});
    tail={p0:[cx-rx+1.6,26.2],mode:'wrapLow'}; tailFront=true;
    st.eyes=pose==='sleep'?'sleep':((k===6)?'closed':'open');
  } else {
    // stand / walk / jump
    let bob=0, hb=0, legPose=null, k=f;
    if(pose==='walk'){
      k=f%8; bob=[0,1,1,0,0,1,1,0][k]; hb=[0,0,1,1,0,0,1,1][k];
      st.tailSw=Math.sin(TAU*k/8)*(p.tail==='dog'?2:1.2);
      const ph={1:0,0:2,3:4,2:6}; const lf=p.leg<2?0.5:1;
      legPose=id=>{ const q=(k+ph[id])%8; return {dx:STEP_X[q]*(p.leg<2?0.6:1), lift:Math.round(STEP_LIFT[q]*lf)}; };
      if(p.tongue) st.mouth='tongue';
    } else if(pose==='jump'){
      k=f%8; st.eyes='happy'; st.mouth=p.tongue?'tongue':'open';
      bob=[1,2,0,0,0,0,1,0][k];
      const air=k>=2&&k<=5;
      legPose=id=>{ const front=id===0||id===2;
        if(k===1) return {dx:0,lift:-1};
        if(k===2) return {dx:front?1:-2.5,lift:0};
        if(air) return p.glide?{dx:front?5:-5,lift:Math.round(p.leg+2.4)}:{dx:front?2.5:-2.5,lift:2};
        if(k===6) return {dx:front?1:-1,lift:0};
        return {dx:0,lift:0}; };
      st.tailSw=air?2:0; if(p.glide&&air) extras.glide=true;
    } else {
      k=f%12; const br=[0,0,.15,.3,.4,.4,.3,.15,0,0,0,0][k];
      extras.breath=br; st.tailSw=Math.sin(TAU*k/12)*1.4;
      if(k===10) st.eyes='closed'; if(k===5||k===6) st.earT=0.9;
    }
    const cx=cx0, ry=bodyH+(long?0.3:0)+(extras.breath||0)*0.5, rx=bodyL+(long?0.3:0);
    const cy=28-p.leg-ry+0.3+bob;
    main={cx,cy,rx,ry}; bodies.push(main);
    const chest={cx:cx+rx*0.68,cy:cy-0.7,rx:Math.min(4.2,rx*0.55),ry:ry*0.9}; bodies.push(chest);
    head=placeHead(cx+rx*0.6+3.4+p.headDX, cy-ry*0.78-hRy*0.22+p.headDY+hb-bob*0.5);
    if(p.neck){ // long neck (horse, alpaca, goose)
      extras.neck=[[chest.cx,chest.cy-1],[head.x-2,head.y+2]];
    }
    const top=Math.round(cy+ry*0.2);
    const fx=Math.round(cx+rx*0.5-p.legW/2), bx=Math.round(cx-rx*0.66);
    const defs=[{id:3,x:bx+3,far:true,w:p.farW},{id:2,x:fx-2,far:true,w:p.farW},{id:1,x:bx,far:false,w:p.legW},{id:0,x:fx,far:false,w:p.legW}];
    for(const d of defs){ const lp=legPose?legPose(d.id):{dx:0,lift:0};
      legs.push({id:d.id,x:d.x,top,foot:28-Math.max(0,lp.lift),dx:lp.dx,far:d.far,w:d.w,shorten:lp.lift<0}); }
    tail={p0:[cx-rx+1.3,cy-ry*0.3],mode:'up'};
  }
  st.bob=0;

  /* ---- draw helpers ---- */
  const M=main;
  const bodyPix=(x,y)=>{
    const a=clamp(Math.round((x+0.5-M.cx)/M.rx*8),-10,10), b=clamp(Math.round((y+0.5-M.cy)/M.ry*5),-6,6);
    const tone = b>=4?-1 : (b<=-4&&a>=-5&&a<=1)?1 : 0;
    S.fur(x,y,'body',a,b,tone);
  };
  const drawLeg=L=>{
    if(extras.glide) return;
    const foot=L.foot, len=Math.max(1,foot-L.top);
    for(let y=L.top;y<=foot;y++){
      const t=(y-L.top)/len, x=Math.round(L.x+L.dx*Math.pow(t,1.4)), tn=Math.round(t*7);
      for(let c=0;c<L.w;c++){
        const hoof=p.hooves&&y===foot;
        S.fur(x+c,y,'leg',c,tn,L.far?-1:0,hoof?'X':null);
      }
      if(y===foot && L.w>=2 && !p.hooves) S.fur(x+L.w,y,'leg',L.w,7,L.far?-1:0);
    }
  };
  const drawPaw=P=>S.ellipse(P.cx,P.cy,P.rx,P.ry,(x,y)=>{
    const c=Math.max(0,Math.round((x+0.5-P.cx)/P.rx*1.5)+1), tn=P.front?6:Math.max(5,Math.round(7-(P.cy+P.ry-(y+0.5))));
    S.fur(x,y,'leg',c,tn,0,p.hooves&&!P.front?'X':null);
  });
  const drawTail=()=>{
    if(!tail||p.tail==='none') return;
    const [x,y]=tail.p0, sw=st.tailSw, t=p.tail, mode=tail.mode;
    const T=(a,b,c,rad,force,tipW)=>S.tube(a,b,c,rad,(px,py,s,side)=>S.fur(px,py,'tail',s,side,side>=1?-1:0,(tipW&&s>=12)?'W':force));
    if(t==='pom'){ S.ellipse(x-0.4,y+0.4,2.2,2.1,(px,py)=>S.fur(px,py,'tail',0,0,0,'W')); return; }
    if(t==='stub'){ S.ellipse(x-0.6,y,1.3,1.2,(px,py)=>S.fur(px,py,'tail',0,0,0)); return; }
    if(mode==='rest'){ // beg pose: tail lies on the ground behind
      if(t==='rat') T([x,y],[x-4,y+2],[x-8,y+1.5],u=>0.9-0.4*u,'X');
      else if(t==='squirrel'||t==='bushy') T([x,y],[x-6,y-2],[x-4+sw*0.5,y-11],u=>1.8+1.3*Math.sin(Math.PI*Math.min(1,u*1.1)));
      else if(t!=='bob') T([x,y],[x-3,y+1],[x-4,y-1],u=>1.2);
      return;
    }
    if(mode==='wrap'||mode==='wrapLow'){
      if(t==='bob'){ T([x,y],[x-1.5,y+1.5],[x-1,y+2.2],()=>1.8); return; }
      if(t==='rat'){ T([x,y],[x-3,y+2],[x+8,y+2],u=>0.9-0.4*u,'X'); return; }
      if(t==='horse'){ T([x,y],[x-2,y+1],[x-2.5,y+3],u=>1.3+0.6*u,'P'); return; }
      if(t==='curl'||t==='pig'){ T([x,y],[x-2.5,y-3],[x+0.5,y-3.5],()=>1.6); return; }
      const r = t==='fluffy'||t==='bushy'?(u=>1.7+0.9*Math.sin(Math.PI*Math.min(1,u*1.05))):t==='thin'?(u=>1.1-0.3*u):(u=>1.55-0.2*u);
      if(mode==='wrap') T([x,y],[x-4.2,y+3.6],[x+5,y+2.5-sw*0.7],r,null,t==='bushy');
      else T([x,y],[x-0.8,y+3.6],[x+10,y+2.6],r,null,t==='bushy');
      return;
    }
    switch(t){
      case 'cat': T([x,y],[x-5.2,y+0.8+sw*0.3],[x-3.6+sw,y-8.2],u=>1.6-0.2*u); break;
      case 'fluffy': T([x,y],[x-5.2,y+0.8+sw*0.3],[x-3.6+sw,y-8.2],u=>1.7+0.9*Math.sin(Math.PI*Math.min(1,u*1.05))); break;
      case 'thin': T([x,y],[x-5.2,y+0.8+sw*0.3],[x-3.6+sw,y-8.2],u=>1.1-0.3*u); break;
      case 'bob': T([x,y],[x-1.6,y],[x-2.2+sw*0.3,y-2.4],()=>1.9); break;
      case 'dog': T([x,y],[x-3.2,y-1.5],[x-5+sw,y-6.5],u=>1.5-0.5*u); break;
      case 'curl': T([x+0.5,y],[x-3.5,y-6],[x+1.6+sw*0.3,y-5.2],u=>(p.coat==='long'||p.curlFluffy)?2.3:1.6); break;
      case 'bushy': T([x,y],[x-6,y+1],[x-6.5+sw,y-6],u=>1.6+1.4*Math.sin(Math.PI*Math.min(1,u*1.05)),null,p.tipWhite); break;
      case 'squirrel': T([x,y],[x-5,y-1],[x-1.5+sw*0.5,y-12],u=>2+1.3*Math.sin(Math.PI*Math.min(1,u*1.1))); break;
      case 'rat': T([x,y],[x-5,y+4],[x-10,y+7.5+sw*0.3],u=>0.9-0.4*u,'X'); break;
      case 'horse': T([x,y],[x-2.2,y+1.5],[x-2.8+sw*0.4,y+8.5],u=>1.3+0.7*u,'P'); break;
      case 'pig': T([x,y],[x-2,y-2.5],[x-0.4+sw*0.2,y-1.4],()=>0.8); break;
      case 'otter': T([x,y],[x-5,y+2],[x-9,y+3+sw*0.5],u=>1.6-0.6*u); break;
      default: T([x,y],[x-5.2,y+0.8],[x-3.6+sw,y-8.2],u=>1.5);
    }
  };
  /* ears relative to head center (scaled), facing right */
  const H=head, hx=Math.floor(H.x), hy=Math.floor(H.y), hs=H.rx/6.4*p.earScale;
  const earTri=(tri,back,inner=true)=>{
    const T=tri.map(q=>[H.x+q[0]*hs+(back?0:st.earT*(q===tri[2]?1:0)),H.y+q[1]*hs]);
    const ccx=(T[0][0]+T[1][0]+T[2][0])/3, ccy=(T[0][1]+T[1][1]+T[2][1])/3;
    const inn=T.map(q=>[ccx+(q[0]-ccx)*0.45,ccy+0.7+(q[1]-ccy)*0.45]);
    S.tri(T,(x,y)=>{ const dx=x-hx, dy=y-hy;
      let isIn=false; if(inner&&!back){ const [a,b,c]=inn, px=x+0.5, py=y+0.5;
        const d1=(px-b[0])*(a[1]-b[1])-(a[0]-b[0])*(py-b[1]), d2=(px-c[0])*(b[1]-c[1])-(b[0]-c[0])*(py-c[1]), d3=(px-a[0])*(c[1]-a[1])-(c[0]-a[0])*(py-a[1]);
        isIn=!((d1<0||d2<0||d3<0)&&(d1>0||d2>0||d3>0)); }
      if(isIn) S.put(x,y,SL.PINK,`ear:${dx}:${dy}`); else S.fur(x,y,'ear',dx,dy,back?-1:0); });
    return T;
  };
  const earCircle=(ex,ey,r,back,inner=true)=>{
    S.ellipse(H.x+ex*hs,H.y+ey*hs,r*hs,r*hs,(x,y,nx,ny)=>{ const dx=x-hx, dy=y-hy;
      if(inner&&!back&&nx*nx+ny*ny<0.3) S.put(x,y,SL.PINK,`ear:${dx}:${dy}`); else S.fur(x,y,'ear',dx,dy,back?-1:0); });
  };
  const earEll=(ex,ey,rx,ry,back,inner=true)=>{
    S.ellipse(H.x+ex*hs,H.y+ey*hs,rx*hs,ry*hs,(x,y,nx,ny)=>{ const dx=x-hx, dy=y-hy;
      if(inner&&!back&&Math.abs(nx)<0.45&&ny>-0.75&&ny<0.6) S.put(x,y,SL.PINK,`ear:${dx}:${dy}`); else S.fur(x,y,'ear',dx,dy,back?-1:0); });
  };
  const EARS_BACK = {
    cat:()=>earTri([[-5.4,-2.4],[-1.6,-5.2],[-4.6,-9.6]],true),
    catSmall:()=>earTri([[-5.0,-2.9],[-1.9,-5.2],[-4.1,-8.2]],true),
    catBig:()=>earTri([[-5.8,-2.0],[-1.2,-5.2],[-5.0,-11.0]],true),
    tuft:()=>earTri([[-5.4,-2.4],[-1.6,-5.2],[-4.9,-11.0]],true),
    fold:()=>earTri([[-5.2,-3.4],[-1.6,-5.6],[-1.8,-7.4]],true),
    dogUp:()=>earTri([[-5.4,-2.0],[-1.4,-5.2],[-4.2,-9.4]],true),
    fox:()=>earTri([[-5.6,-1.8],[-1.2,-5.2],[-4.6,-10.6]],true),
    horse:()=>earTri([[-3.6,-4.4],[-1.4,-5.6],[-3.4,-8.6]],true),
    semi:()=>earTri([[-5.2,-2.4],[-1.6,-5.2],[-4.4,-8.2]],true),
    round:()=>earCircle(-3.8,-5.2,2.3,true),
    mouse:()=>earCircle(-3.6,-5.6,3.1,true),
    tiny:()=>earCircle(-3.6,-5.0,1.5,true),
    bunny:()=>earEll(-2.6,-9.2,1.6,4.8,true),
    pig:()=>earTri([[-4.6,-3.8],[-1.2,-5.5],[-4.6,-7.1]],true), flop:()=>{}, flopLong:()=>{}, lop:()=>{}, none:()=>{}
  };
  const EARS_FRONT = {
    cat:()=>earTri([[-0.8,-5.5],[3.8,-4.0],[1.5,-9.9]],false),
    catSmall:()=>earTri([[-0.4,-5.6],[3.4,-4.3],[1.4,-8.5]],false),
    catBig:()=>earTri([[-1.2,-5.4],[4.3,-3.6],[1.7,-11.4]],false),
    tuft:()=>{ const T=earTri([[-0.8,-5.5],[3.8,-4.0],[1.3,-11.4]],false); S.put(Math.floor(T[2][0]+0.3),Math.floor(T[2][1]+0.7),SL.PD,null); S.put(Math.floor(T[2][0]+0.3),Math.floor(T[2][1]+1.7),SL.PD,null); },
    fold:()=>earTri([[-0.4,-5.8],[3.6,-4.4],[3.9,-6.9]],false,false),
    dogUp:()=>earTri([[-1.0,-5.4],[3.6,-3.6],[1.0,-9.6]],false),
    fox:()=>earTri([[-1.4,-5.3],[4.2,-3.4],[1.2,-10.9]],false),
    horse:()=>earTri([[-0.6,-5.6],[2.0,-5.0],[0.4,-9.0]],false),
    semi:()=>{ earTri([[-0.8,-5.5],[3.6,-4.0],[1.4,-8.0]],false); earTri([[0.4,-8.4],[2.6,-8.2],[3.6,-6.4]],false,false); },
    round:()=>earCircle(0.6,-5.8,2.5,false),
    mouse:()=>earCircle(0.8,-6.2,3.3,false),
    tiny:()=>earCircle(0.4,-5.4,1.6,false,false),
    bunny:()=>earEll(0.8+st.earT*0.4,-9.8,1.8,5.3,false),
    pig:()=>earTri([[-0.6,-5.6],[3.4,-5.2],[3.8,-2.2]],false,false),
    flop:()=>S.tube([H.x-1.4*hs,H.y-4.8*hs],[H.x-3.2*hs,H.y-1*hs],[H.x-2.4*hs,H.y+2.6*hs],u=>1.7+0.6*u,(x,y)=>S.fur(x,y,'ear',x-hx,y-hy,-1)),
    flopLong:()=>S.tube([H.x-1.4*hs,H.y-4.8*hs],[H.x-3.4*hs,H.y],[H.x-2.6*hs,H.y+4.2*hs],u=>1.8+0.6*u,(x,y)=>S.fur(x,y,'ear',x-hx,y-hy,-1)),
    lop:()=>S.tube([H.x-1.2*hs,H.y-4.8*hs],[H.x-3.6*hs,H.y-1*hs],[H.x-2.8*hs,H.y+6*hs],u=>1.7+0.5*u,(x,y)=>S.fur(x,y,'ear',x-hx,y-hy,-1)),
    none:()=>{}
  };
  const drawHead=()=>{
    (EARS_BACK[p.ears]||EARS_BACK.cat)();
    const hrx=H.rx+(long?0.3:0);
    const headPix=(x,y)=>{ const dx=x-hx, dy=y-hy; const tone=(dy>=4&&dx<=-2)?-1:(dy<=-4&&dx>=-3&&dx<=0)?1:0;
      S.fur(x,y,'head',dx,dy,tone);
      if(p.coat==='none'&&dy===-3&&dx>=-2&&dx<=0) S.put(x,y,SL.BD,`head:${dx}:${dy}`); };
    S.ellipse(H.x,H.y,hrx,H.ry+(p.cheeks?0.4:0),headPix);
    if(p.cheeks) S.ellipse(H.x-0.6,H.y+2.6,hrx*0.72,2.6,headPix);
    // muzzle
    const mzx=H.x+H.rx*0.68+snout*0.45, mzy=H.y+p.snoutDy*(H.ry/5.8);
    S.ellipse(mzx,mzy,snout,p.snoutH,headPix);
    if(p.coat==='long') for(const [dx,dy] of [[-7,1],[-7,2],[-6,4],[-4,6]]) if(!S.filled(hx+dx,hy+dy)) headPix(hx+dx,hy+dy);
    if(curly){ for(const [dx,dy] of [[-4,-6],[-1,-7],[2,-6],[-6,-3]]) S.ellipse(H.x+dx,H.y+dy+0.5,1.6,1.4,(x,y)=>S.fur(x,y,'head',x-hx,y-hy,1)); }
    if(p.horns){ S.tube([H.x-0.6,H.y-4.6],[H.x-1.2,H.y-8.5],[H.x-3.6,H.y-8.6],u=>1-0.3*u,(x,y)=>S.fur(x,y,'horn',0,0,0,'X')); }
    if(p.mane){ S.tube([H.x-3.5,H.y-4.2],[H.x-6.5,H.y-1],[H.x-8,H.y+4.5],u=>1.6,(x,y,s)=>S.fur(x,y,'mane',s,0,mod(s,3)===0?-1:0,'P')); }
    (EARS_FRONT[p.ears]||EARS_FRONT.cat)();
    // face
    const ex=hx+Math.round(H.rx*0.15), ey=hy+(p.eyeDy||0);
    S.eye(ex,ey,st.eyes,p.eye);
    S.put(ex-1,ey+3,SL.BLUSH,null); S.put(ex,ey+3,SL.BLUSH,null);
    const tip=Math.floor(mzx+snout-0.4), ny=Math.floor(mzy-0.6);
    if(p.nose==='dark'){ S.put(tip,ny,SL.NOSE,null); S.put(tip-1,ny,SL.NOSE,null); S.put(tip,ny+1,SL.NOSE,null); }
    else if(p.nose==='pig'){
      // A broad, stepped snout plate with two vertical nostrils reads at 32px.
      const sx=Math.min(25,tip-4), sy=ny-1;
      for(let dy=0;dy<6;dy++) for(let dx=0;dx<7;dx++){
        if((dy===0||dy===5)&&(dx===0||dx===6)) continue;
        const edge=dx===0||dx===6||dy===5;
        S.put(sx+dx,sy+dy,edge?SL.BLUSH:SL.PINK,null);
      }
      for(const dx of [2,5]) for(let dy=2;dy<=3;dy++) S.put(sx+dx,sy+dy,SL.MOUTH,null);
    }
    else S.put(tip,ny,SL.PINK,null);
    const my=ny+Math.max(1,Math.round(p.snoutH*0.9));
    if(p.nose!=='pig') S.put(tip-1,my,SL.MOUTH,null);
    if(st.mouth==='tongue'){ S.put(tip-2,my+1,SL.TONGUE,null); S.put(tip-1,my+1,SL.TONGUE,null); }
    else if(st.mouth==='open') S.put(tip-1,my+1,SL.PINK,null);
    if(p.whiskers) S.post.push(()=>{ for(const [dx,dy] of [[2,0],[3,-1],[2,2],[3,3]]){ const X=tip+dx, Y=ny+dy; if(X>=0&&Y>=0&&X<N&&Y<N&&S.slots[Y*N+X]===0) S.put(X,Y,SL.WHISK,null); } });
  };
  const drawAccessories=()=>{
    const acc=cfg.neck, hd=cfg.head;
    const ny=hy+Math.round(H.ry)-1;
    if(acc==='collar'||acc==='bell'){
      for(let dx=-4;dx<=3;dx++){ const x=hx+dx, y=ny+(dx<-1?0:1); if(S.filled(x,y)) S.put(x,y,acc==='bell'?SL.ACCD:SL.ACC,null); }
      if(acc==='bell'){ S.put(hx+1,ny+2,SL.GOLD,null); S.put(hx+2,ny+2,SL.GOLD,null); S.put(hx+1,ny+3,SL.GOLD,null); S.put(hx+2,ny+3,SL.GOLD,null); }
      else S.put(hx+1,ny+2,SL.GOLD,null);
    } else if(acc==='bandana'){
      for(const [dy,a,b] of [[0,-3,4],[1,-1,3],[2,0,2],[3,1,1]]) for(let dx=a;dx<=b;dx++) S.put(hx+dx,ny+dy,dy===1?SL.ACCD:SL.ACC,null);
    }
    const topY=hy-Math.round(H.ry);
    if(hd==='bow'){
      for(const [dx,dy] of [[-5,-1],[-5,0],[-5,1],[-4,0],[-1,-1],[-1,0],[-1,1],[-2,0]]) S.put(hx+dx,topY+dy,SL.ACC,null);
      S.put(hx-3,topY,SL.ACCD,null);
    } else if(hd==='glasses' && st.eyes==='open'){
      const ex=hx+Math.round(H.rx*0.15);
      for(let dx=0;dx<=3;dx++){ S.put(ex+dx,hy-1,SL.PUP,null); S.put(ex+dx,hy,SL.PUP,null); }
      for(let dx=-4;dx<=-1;dx++) S.put(ex+dx,hy-1,SL.PUP,null);
      S.put(ex+1,hy-1,SL.GLINT,null);
    } else if(hd==='hat'){
      for(const [dy,a,b] of [[0,-2,2],[-1,-1,1],[-2,-1,1],[-3,0,0],[-4,0,0]]) for(let dx=a;dx<=b;dx++) S.put(hx+dx,topY+dy,dy===-1?SL.ACCD:SL.ACC,null);
      S.put(hx,topY-5,SL.GOLD,null);
    } else if(hd==='flower'){
      const fx=hx+3, fy=topY+1;
      for(const [dx,dy] of [[-1,0],[1,0],[0,-1],[0,1]]) S.put(fx+dx,fy+dy,SL.ACC,null);
      S.put(fx,fy,SL.GOLD,null);
    }
  };
  const spikes=()=>{ // hedgehog spines on the upper back
    const M2=main;
    for(let i=0;i<14;i++){
      const ang=Math.PI*(0.95+i*0.075), bx=M2.cx+Math.cos(ang)*M2.rx*0.95, by=M2.cy+Math.sin(ang)*M2.ry*0.95;
      if(by>M2.cy+1) continue;
      const ox=Math.cos(ang-0.5), oy=Math.sin(ang-0.5);
      S.tri([[bx-ox*1.3,by-oy*1.3],[bx+ox*1.3,by+oy*1.3],[bx+Math.cos(ang-0.35)*2.6,by+Math.sin(ang-0.35)*2.6]],(x,y)=>S.fur(x,y,'spine',i,0,i%2?-1:0,'P'));
    }
    S.ellipse(M2.cx-1,M2.cy-1,M2.rx*0.9,M2.ry*0.75,(x,y,nx,ny)=>{ if(ny<0.3) S.fur(x,y,'spine',Math.round(nx*4),Math.round(ny*3),mod(x+y,3)===0?-1:0,'P'); });
  };

  /* ---- paint order ---- */
  for(const L of legs) if(L.far) drawLeg(L);
  if(!tailFront) drawTail();
  for(const e of bodies) S.ellipse(e.cx,e.cy,e.rx,e.ry,bodyPix);
  if(extras.neck){ const [[x0,y0],[x1,y1]]=extras.neck; S.tube([x0,y0],[(x0+x1)/2+1,(y0+y1)/2],[x1,y1],()=>2.6,(x,y)=>bodyPix(x,y)); }
  if(p.coat==='spiky') spikes();
  if(curly){ for(let i=0;i<7;i++){ const ang=Math.PI*(1.05+i*0.13); S.ellipse(M.cx+Math.cos(ang)*M.rx*0.9,M.cy+Math.sin(ang)*M.ry*0.9,1.7,1.5,(x,y)=>bodyPix(x,y)); } }
  if(long && pose!=='sleep' && pose!=='lie'){
    S.ellipse(H.x-0.5,H.y+H.ry-0.2,3.4,2.4,bodyPix);
    for(let x=0;x<N;x++){ let bot=-1; for(let y=N-1;y>=0;y--) if(S.slots[y*N+x]>1&&(S.keys[y*N+x]||'').startsWith('body:')){bot=y;break;}
      if(bot>0&&mod(x,2)===0&&!S.filled(x,bot+1)&&bot<27) bodyPix(x,bot+1); }
  }
  if(extras.glide){ // patagium: a wide sheet spread from front to back paws, drawn over the body like a cape
    const my=M.cy+0.8, mrx=M.rx+4.6, mry=Math.max(2.4,M.ry*0.62), mcx=M.cx+0.6;
    S.ellipse(mcx,my,mrx,mry,(x,y,nx,ny)=>{ const edge=nx*nx+ny*ny>0.62; S.fur(x,y,'wing',Math.round(nx*5),Math.round(ny*3),edge?-1:(ny<-0.2?0:1)); });
    for(const sx of [-1,1]) for(const dy of [-1.3,1.3]) S.ellipse(mcx+sx*(mrx-0.6),my+dy,1.1,1,(x,y)=>S.fur(x,y,'leg',0,7,0));
  }
  for(const L of legs) if(!L.far) drawLeg(L);
  for(const P of paws) if(!P.front) drawPaw(P);
  if(tailFront && (pose==='sleep'||pose==='lie')) drawTail();
  drawHead();
  for(const P of paws) if(P.front) drawPaw(P);
  if(tailFront && pose!=='sleep' && pose!=='lie') drawTail();
  drawAccessories();
};
