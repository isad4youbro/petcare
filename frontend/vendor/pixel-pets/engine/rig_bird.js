/* ===== Bird rig: songbirds, parrots, chickens, ducks, owls, peacocks ===== */
const BDEF={bodyRx:6.4,bodyRy:5.1,headR:4.5,beak:'cone',beakLen:2.0,crest:'none',tail:'short',leg:2.6,eye:'m',owl:false};
RIG_POSES.bird = {stand:{frames:12,fps:6}, walk:{frames:8,fps:10}, sit:{frames:12,fps:6}, sleep:{frames:8,fps:3}, jump:{frames:8,fps:12}};

RIGS.bird = function(S,P0,cfg,pose,f){
  const p=Object.assign({},BDEF,P0);
  const st={eyes:'open',lift:0,wing:'rest',headDX:0,headDY:0,tail:0,tucked:false,fluff:0};
  if(pose==='walk'){ const k=f%8; st.lift=[0,1,2,1,0,1,2,1][k]; st.tail=[0,1,0,-1,0,1,0,-1][k]; }
  else if(pose==='jump'){ const k=f%8; st.lift=[0,2,3,4,4,3,2,0][k]; st.wing=k%2?'up':'down'; st.eyes='happy'; }
  else if(pose==='sit'){ const k=f%12; st.fluff=0.6; if(k===10) st.eyes='closed'; st.headDX=(k>=3&&k<=5)?1:0; }
  else if(pose==='sleep'){ const k=f%8; st.fluff=0.6+[0,.15,.3,.3,.15,0,0,0][k]; st.eyes='sleep'; st.tucked=true; }
  else { const k=f%12; st.headDX=(k>=3&&k<=5)?1:0; st.headDY=(k===4)?1:0; st.tail=(k===8||k===9)?1:0; if(k===10) st.eyes='closed'; }
  const sitting = pose==='sit'||pose==='sleep';
  const rx=p.bodyRx+st.fluff*0.5, ry=p.bodyRy+st.fluff;
  const legLen = sitting?0:(st.lift>0?Math.max(1,p.leg-1):p.leg);
  const cx=13.5, cy=28-legLen-ry+0.6-st.lift;
  const hx=cx+rx*0.62+st.headDX-(st.tucked?2.2:0), hy=Math.max(p.headR+(p.crest==='none'?0.6:4.6), cy-ry*0.82+st.headDY+(st.tucked?2.6:0));
  const bodyPix=(x,y)=>{ const a=clamp(Math.round((x+0.5-cx)/rx*8),-10,10), b=clamp(Math.round((y+0.5-cy)/ry*5),-6,6);
    S.fur(x,y,'body',a,b,b>=4?-1:(b<=-4&&a<=1)?1:0); };
  // tail
  const tx=cx-rx+1.2, ty=cy-0.6;
  const tailPix=(x,y,s,side)=>S.fur(x,y,'tail',s,side,side>0?-1:0);
  if(p.tail==='peacock'){
    S.ellipse(cx-3,cy-5,9.5,8.5,(x,y,nx,ny)=>{ const r=Math.hypot(nx,ny), ang=Math.atan2(ny,nx);
      const spot=mod(Math.round(ang*6),2)===0 && r>0.62&&r<0.86; S.fur(x,y,'tail',Math.round(ang*6),Math.round(r*5),r>0.9?-1:0,spot?'X':'P'); });
  } else if(p.tail==='long'){
    S.tube([tx,ty],[tx-4,ty+3],[tx-8+st.tail,ty+7],u=>1.7-0.9*u,tailPix);
  } else if(p.tail==='fan'){
    S.tri([[tx+1,ty+1],[tx-4,ty-6+st.tail],[tx-1,ty-8]],(x,y)=>S.fur(x,y,'tail',x-Math.round(tx),y-Math.round(ty),0));
    S.tri([[tx+1,ty+1],[tx-5,ty-3+st.tail],[tx-4,ty-6]],(x,y)=>S.fur(x,y,'tail',x-Math.round(tx),y-Math.round(ty),-1));
  } else if(p.tail==='duck'){
    S.tri([[tx+1.5,ty-1],[tx+1.5,ty+2],[tx-3,ty-2.5+st.tail]],(x,y)=>S.fur(x,y,'tail',x-Math.round(tx),y-Math.round(ty),0));
  } else {
    S.tri([[tx+1.5,ty-1.6],[tx+1.5,ty+1.4],[tx-4,ty+1.8+st.tail]],(x,y)=>S.fur(x,y,'tail',x-Math.round(tx),y-Math.round(ty),0));
  }
  // legs
  if(legLen>0){
    for(const lx of [Math.round(cx+0.3),Math.round(cx+2.6)]){
      const top=Math.round(cy+ry-1);
      for(let y=top;y<=28-st.lift;y++) S.put(lx,y,SL.FEET,null);
      S.put(lx-1,28-st.lift,SL.FEET,null); S.put(lx+1,28-st.lift,SL.FEET,null);
    }
  }
  // body
  S.ellipse(cx,cy,rx,ry,bodyPix);
  S.ellipse(cx+rx*0.42,cy-ry*0.22,rx*0.62,ry*0.85,bodyPix);
  // wing
  const wingPix=(x,y,a,b,tone)=>S.fur(x,y,'wing',a,b,tone);
  if(st.wing==='up') S.tube([cx+1.5,cy-1.5],[cx-1,cy-6],[cx-5.5,cy-8.5],u=>2.8-1.6*u,(x,y,s,side)=>wingPix(x,y,s,side,side<0?0:-1));
  else if(st.wing==='down') S.tube([cx+1.5,cy-1],[cx-1.5,cy+2],[cx-5.5,cy+4.5],u=>2.8-1.6*u,(x,y,s,side)=>wingPix(x,y,s,side,side>0?-1:0));
  else S.ellipse(cx-1,cy-0.2,rx*0.68,ry*0.62,(x,y,nx,ny)=>wingPix(x,y,Math.round(nx*4),Math.round(ny*3),(nx*nx+ny*ny>0.6&&ny>0)?-1:0));
  // head
  const HX=Math.floor(hx), HY=Math.floor(hy), r=p.headR;
  const headPix=(x,y)=>{ const dx=x-HX, dy=y-HY; S.fur(x,y,'head',dx,dy,(dy<=-3&&dx<=0)?1:(dy>=3&&dx<=-2)?-1:0); };
  if(p.crest==='tiel'){ S.tube([hx-0.4,hy-r+1],[hx-0.2,hy-r-3],[hx+1.8+st.tail*0.3,hy-r-4.6],u=>1.1-0.4*u,(x,y)=>S.fur(x,y,'crest',0,0,0,'W')); }
  if(p.crest==='too'){ for(const [ex,ey] of [[-2.5,-4.5],[-0.5,-5.5],[1.5,-5]]) S.tube([hx-0.6,hy-r+1.2],[hx+ex*0.6,hy-r+ey*0.6],[hx+ex,hy-r+ey],u=>1.2-0.4*u,(x,y)=>S.fur(x,y,'crest',0,0,0,'W')); }
  if(p.crest==='tuft'){ S.tri([[hx-3.2,hy-r+1.6],[hx-1.4,hy-r+0.8],[hx-3.6,hy-r-2.4]],(x,y)=>S.fur(x,y,'head',x-HX,y-HY,-1)); S.tri([[hx+1.2,hy-r+0.8],[hx+3.2,hy-r+1.6],[hx+3.4,hy-r-2.4]],(x,y)=>S.fur(x,y,'head',x-HX,y-HY,0)); }
  S.ellipse(hx,hy,r,r*(p.owl?1:0.96),headPix);
  if(p.crest==='comb'){ for(const dx of [-1.6,0.2,2]) S.ellipse(hx+dx,hy-r+0.3,1.15,1.6,(x,y)=>S.put(x,y,SL.TONGUE,null)); }
  if(p.owl){
    // front face disc, two big eyes
    S.ellipse(hx+0.3,hy+0.3,r*0.82,r*0.7,(x,y)=>S.fur(x,y,'face',x-HX,y-HY,0,'W'));
    S.eye(HX-3,HY,st.eyes,'m'); S.eye(HX+2,HY,st.eyes,'m');
    S.tri([[hx-0.3,hy+1],[hx+1.4,hy+1],[hx+0.5,hy+3]],(x,y)=>S.fur(x,y,'beak',0,0,0,'X'));
    S.put(HX-4,HY+3,SL.BLUSH,null); S.put(HX+4,HY+3,SL.BLUSH,null);
    return;
  }
  // beak
  const bx=hx+r-0.8, by=hy+0.6;
  const beakPix=(x,y)=>S.fur(x,y,'beak',x-HX,y-HY,y>by+0.5?-1:0,'X');
  if(p.beak==='hook'){ S.ellipse(bx+0.9,by+0.2,1.9,1.9,beakPix); S.put(Math.floor(bx+1.6),Math.floor(by+2.1),SL.XD,null); }
  else if(p.beak==='duck'){ S.ellipse(bx+1.6,by+0.9,p.beakLen+0.6,1.15,beakPix); }
  else S.tri([[bx,by-1.3],[bx,by+1.1],[bx+p.beakLen+0.4,by]],beakPix);
  if(p.crest==='comb'){ S.ellipse(bx+0.4,by+2.6,0.9,1.3,(x,y)=>S.put(x,y,SL.TONGUE,null)); }
  // face
  const ex=HX+1, ey=HY-1;
  S.eye(ex,ey,st.eyes,p.eye);
  S.put(ex-1,ey+2,SL.BLUSH,null); S.put(ex,ey+2,SL.BLUSH,null);
  if(cfg.neck==='bandana'||cfg.neck==='collar'||cfg.neck==='bell'){
    for(let dx=-3;dx<=2;dx++){ const x=HX+dx, y=HY+Math.round(r)-1+(dx>0?1:0); if(S.filled(x,y)) S.put(x,y,SL.ACC,null); }
    if(cfg.neck==='bell') S.put(HX,HY+Math.round(r)+1,SL.GOLD,null);
  }
  if(cfg.head==='bow'){ for(const [dx,dy] of [[-3,-1],[-3,0],[-1,-1],[-1,0]]) S.put(HX+dx,HY-Math.round(r)+dy,SL.ACC,null); S.put(HX-2,HY-Math.round(r),SL.ACCD,null); }
  if(cfg.head==='hat'){ for(const [dy,a,b] of [[0,-2,2],[-1,-1,1],[-2,-1,1],[-3,0,0]]) for(let dx=a;dx<=b;dx++) S.put(HX+dx,HY-Math.round(r)+dy,dy===-1?SL.ACCD:SL.ACC,null); S.put(HX,HY-Math.round(r)-4,SL.GOLD,null); }
  if(cfg.head==='flower'){ const fx=HX-2, fy=HY-Math.round(r); for(const [dx,dy] of [[-1,0],[1,0],[0,-1],[0,1]]) S.put(fx+dx,fy+dy,SL.ACC,null); S.put(fx,fy,SL.GOLD,null); }
  if(cfg.head==='glasses'&&st.eyes==='open'){ for(let dx=-1;dx<=2;dx++){ S.put(ex+dx,ey-1,SL.PUP,null); S.put(ex+dx,ey,SL.PUP,null); } S.put(ex,ey-1,SL.GLINT,null); }
};
