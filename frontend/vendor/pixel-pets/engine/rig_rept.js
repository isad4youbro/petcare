/* ===== Reptiles & amphibians: lizards, crocodiles, chameleons, turtles, snakes, frogs, axolotls ===== */
RIG_POSES.lizard = {stand:{frames:12,fps:5}, walk:{frames:8,fps:9}, sit:{frames:12,fps:5}, sleep:{frames:8,fps:3}, jump:{frames:8,fps:10}};
RIG_POSES.turtle = {stand:{frames:12,fps:4}, walk:{frames:8,fps:5}, sit:{frames:12,fps:4}, sleep:{frames:8,fps:2}, jump:{frames:8,fps:8}};
RIG_POSES.snake  = {stand:{frames:12,fps:6}, walk:{frames:8,fps:8}, sit:{frames:12,fps:5}, sleep:{frames:8,fps:2}, jump:{frames:8,fps:9}};
RIG_POSES.frog   = {stand:{frames:12,fps:5}, walk:{frames:8,fps:9}, sit:{frames:12,fps:5}, sleep:{frames:8,fps:2}, jump:{frames:8,fps:10}};
RIG_POSES.axolotl= {stand:{frames:12,fps:6}, walk:{frames:8,fps:8}, sit:{frames:12,fps:5}, sleep:{frames:8,fps:2}, jump:{frames:8,fps:9}};
RIG_POSES.chameleon={stand:{frames:12,fps:4}, walk:{frames:8,fps:6}, sit:{frames:12,fps:4}, sleep:{frames:8,fps:2}, jump:{frames:8,fps:8}};

/* --- lizard / gecko / agama / iguana / varan / skink / crocodile --- */
RIGS.lizard = function(S,P0,cfg,pose,f){
  const p=Object.assign({bodyL:6.4,bodyH:3.7,headL:5,headH:4.2,snout:0,tailR:2.3,leg:2.4,eye:'m',spikes:false,beard:false,croc:false,toes:true},P0);
  const st={eyes:'open',sw:0,lift:[0,0,0,0],tongue:false,happy:false};
  if(pose==='walk'){ const k=f%8; st.sw=Math.sin(TAU*k/8)*1.6; st.lift=k<4?[1,0,0,1]:[0,1,1,0]; if(k===2||k===6) st.lift=[0,0,0,0]; }
  else if(pose==='jump'){ const k=f%8; st.happy=true; st.eyes='happy'; st.sw=k%2?1:-1; st.lift=[k%2,0,0,k%2]; }
  else if(pose==='sleep'){ st.eyes='sleep'; }
  else { const k=f%12; st.sw=Math.sin(TAU*k/12); if(k===10) st.eyes='closed'; st.tongue=(k===4||k===5)&&!p.croc; }
  const low=pose==='sleep'||pose==='sit';
  const cx=15, cy=28-(low?0.6:p.leg)-p.bodyH+0.6, rx=p.bodyL, ry=p.bodyH;
  const bodyPix=(x,y)=>{ const a=clamp(Math.round((x+0.5-cx)/rx*8),-10,10), b=clamp(Math.round((y+0.5-cy)/ry*5),-6,6); S.fur(x,y,'body',a,b,b>=3?-1:0); };
  // legs (far first)
  const legAt=(lx,far,id)=>{ if(low) return; const lift=st.lift[id], fy=28-lift, top=Math.round(cy+ry*0.3);
    const dir=id%2?-1:1;
    for(let y=top;y<=fy;y++){ const t=(y-top)/Math.max(1,fy-top), x=Math.round(lx+dir*t*1.2); S.fur(x,y,'leg',0,Math.round(t*7),far?-1:0); S.fur(x+1,y,'leg',1,Math.round(t*7),far?-1:0); }
    if(p.toes){ S.fur(Math.round(lx+dir*1.2)-1,fy,'leg',2,7,far?-1:0); S.fur(Math.round(lx+dir*1.2)+2,fy,'leg',3,7,far?-1:0); } };
  legAt(cx+rx*0.5-2,true,2); legAt(cx-rx*0.5+1.5,true,3);
  // tail curls down to the ground behind
  S.tube([cx-rx+1.2,cy+0.2],[2+st.sw*0.6,cy+0.5],[2.5-st.sw*0.4,27.4],u=>p.tailR*(1-0.75*u)+0.4,(x,y,s,side)=>S.fur(x,y,'tail',s,side,side>0?-1:0));
  S.ellipse(cx,cy,rx,ry,bodyPix);
  if(p.spikes) for(let i=-3;i<=3;i++){ const x=cx+i*1.9, y=cy-ry*Math.sqrt(Math.max(0,1-(i*1.9/rx)**2)); S.tri([[x-0.9,y+0.6],[x+0.9,y+0.6],[x+0.4,y-1.6]],(px,py)=>S.fur(px,py,'spike',i,0,0,'X')); }
  if(p.croc) for(let i=-3;i<=3;i++){ const x=Math.round(cx+i*2), y=Math.round(cy-ry*Math.sqrt(Math.max(0,1-(i*2/rx)**2))-0.6); S.fur(x,y,'body',i,-6,-1); }
  legAt(cx+rx*0.5,false,0); legAt(cx-rx*0.5,false,1);
  // head
  const hx=Math.min(cx+rx+p.headL*0.35-1.4, 30.5-p.headL-(p.snout?p.snout+0.6:0)), hy=cy-1.6-(pose==='jump'?1:0);
  const HX=Math.floor(hx), HY=Math.floor(hy);
  const headPix=(x,y)=>{ const dx=x-HX, dy=y-HY; S.fur(x,y,'head',dx,dy,dy>=2?-1:(dy<=-2&&dx<=0?1:0)); };
  S.ellipse(hx,hy,p.headL,p.headH,headPix);
  if(p.snout) S.ellipse(hx+p.headL*0.5+p.snout*0.5,hy+0.9,p.snout+0.6,p.headH*0.62,headPix);
  if(p.beard) for(let i=0;i<4;i++) S.tri([[hx-2+i*1.3,hy+p.headH-0.6],[hx-0.8+i*1.3,hy+p.headH-0.6],[hx-1.6+i*1.3,hy+p.headH+1.6]],(x,y)=>S.fur(x,y,'head',x-HX,y-HY,-1));
  const tipX=Math.floor(hx+p.headL+(p.snout?p.snout+0.4:0)-0.6);
  // mouth: friendly smile line
  const my=HY+(p.snout?2:1);
  S.line(HX+1,my,tipX-1,my-(p.croc?0:0),(x,y)=>S.put(x,y,SL.MOUTH,null));
  S.put(HX,my-1,SL.MOUTH,null);
  if(p.croc){ for(let x=HX+3;x<tipX-1;x+=2) S.put(x,my,SL.GLINT,null); S.put(tipX-1,HY,SL.NOSE,null); }
  if(st.tongue){ S.put(tipX+1,my,SL.TONGUE,null); S.put(tipX+2,my-1,SL.TONGUE,null); S.put(tipX+2,my+1,SL.TONGUE,null); }
  const ex=HX-(p.croc?1:0), ey=HY-(p.croc?2:1);
  if(p.croc) S.ellipse(ex+1,ey+0.4,2,1.8,headPix);
  S.eye(ex,ey,st.eyes,p.eye);
  S.put(ex-1,ey+2+(p.eye==='l'?1:0),SL.BLUSH,null); S.put(ex,ey+2+(p.eye==='l'?1:0),SL.BLUSH,null);
  accessoriesSmall(S,cfg,HX,HY,p.headH,st);
};

/* --- chameleon: grips a branch, swivelling turret eyes, rocking slow walk, curling tail, tongue shot --- */
RIGS.chameleon = function(S,P0,cfg,pose,f){
  const st={eyes:'open',look:[1,0],rock:0,step:-1,coil:1,tongue:0,pale:false,mouth:false};
  const k8=f%8, k12=f%12;
  if(pose==='walk'){ // deliberate rocking gait: lift a leg, rock, place it
    st.rock=[0,1,1,0,0,-1,-1,0][k8]; st.step=[0,0,1,1,2,2,3,3][k8]%4; st.look=[1,0]; st.coil=1+0.1*Math.sin(TAU*k8/8);
  } else if(pose==='jump'){ // tongue shot
    st.tongue=[0,1,3,5,5,3,1,0][k8]; st.mouth=st.tongue>0; st.look=[1,0]; st.coil=0.9;
  } else if(pose==='sleep'){ st.eyes='sleep'; st.pale=true; st.coil=1.15; }
  else if(pose==='sit'){ st.coil=1.15; st.look=[[1,0],[1,-1],[0,-1],[-1,-1],[-1,0],[-1,0],[0,0],[1,1],[1,0],[1,0],[0,0],[1,0]][k12]; if(k12===10) st.eyes='closed'; }
  else { st.look=[[1,0],[1,0],[1,-1],[0,-1],[0,-1],[-1,0],[-1,0],[-1,1],[0,1],[1,0],[1,0],[1,0]][k12]; st.coil=1+0.08*Math.sin(TAU*k12/12); if(k12===6) st.eyes='closed'; }
  const tone=st.pale?1:0;
  // branch with a leaf
  for(let x=0;x<N;x++){ S.fur(x,27,'branch',x,0,0,'X'); S.fur(x,28,'branch',x,1,-1,'X'); }
  const cx=13.6+st.rock*0.5, cy=19.8;
  const bodyPix=(x,y)=>{ const a=clamp(Math.round((x+0.5-cx)/6.8*8),-10,10), b=clamp(Math.round((y+0.5-cy)/4.6*5),-6,6); S.fur(x,y,'body',a,b,b>=3?-1:(st.pale?1:0)); };
  // tail spiral
  const tc=[cx-8.6,cy+3.4], pts=[[cx-5.8,cy+0.4]];
  for(let i=0;i<=30;i++){ const t=i/30, ang=Math.PI*0.15+t*TAU*1.05*st.coil, r=4.6*(1-t*0.62); pts.push([tc[0]+Math.cos(ang)*r,tc[1]-Math.sin(ang)*r]); }
  S.path(pts,u=>1.5-0.8*u,(x,y,s,side)=>S.fur(x,y,'tail',s,side,side>0?-1:tone));
  // far legs
  const leg=(sx,fx,id,far)=>{ const lift=(st.step===id)?2:0;
    const kx=sx+(fx>sx?1.6:-1.6), ky=cy+4.5-lift*0.5;
    S.line(Math.round(sx),Math.round(cy+2),Math.round(kx),Math.round(ky),(x,y)=>{ S.fur(x,y,'leg',id,1,far?-1:tone); S.fur(x+1,y,'leg',id,2,far?-1:tone); });
    S.line(Math.round(kx),Math.round(ky),Math.round(fx),26-lift,(x,y)=>{ S.fur(x,y,'leg',id,5,far?-1:tone); S.fur(x+1,y,'leg',id,6,far?-1:tone); });
    S.fur(Math.round(fx)-1,26-lift,'leg',id,7,far?-1:tone); S.fur(Math.round(fx)+2,26-lift,'leg',id,7,far?-1:tone);
  };
  leg(cx-3,cx-5.2,2,true); leg(cx+3.4,cx+5,3,true);
  S.ellipse(cx,cy,6.8,4.6,bodyPix);
  // dorsal sawtooth crest
  for(let i=-5;i<=4;i++){ const x=Math.round(cx+i*1.2), top=Math.round(cy-4.6*Math.sqrt(Math.max(0,1-((i*1.2)/6.8)**2))); if(i%2===0) S.fur(x,top-1,'body',i,-7,-1); }
  leg(cx-2,cx-3.4,0,false); leg(cx+4.4,cx+6.8,1,false);
  // head: casque, pointed snout, long smile
  const hx=cx+7.6, hy=cy-1.4, HX=Math.floor(hx), HY=Math.floor(hy);
  const headPix=(x,y)=>S.fur(x,y,'head',x-HX,y-HY,(y-HY)>=2?-1:(st.pale?1:0));
  S.tri([[hx-4.2,hy-0.6],[hx+0.6,hy-3.2],[hx-4.6,hy-6.6]],headPix);
  S.ellipse(hx,hy,4.2,3.4,headPix);
  S.tri([[hx+2.5,hy-1.6],[hx+2.5,hy+2.6],[hx+5.6,hy+0.8]],headPix);
  const my=HY+2;
  if(st.mouth){ S.line(HX+1,my,HX+5,my-1,(x,y)=>S.put(x,y,SL.PINK,null)); S.line(HX+1,my+1,HX+4,my+1,(x,y)=>S.put(x,y,SL.MOUTH,null)); }
  else S.line(HX-1,my,HX+5,my-1,(x,y)=>S.put(x,y,SL.MOUTH,null));
  // turret eye with a swivelling pupil
  S.ellipse(hx+0.2,hy-1,2.9,2.9,(x,y,nx,ny)=>S.fur(x,y,'head',x-HX,y-HY,(nx*nx+ny*ny>0.6)?-1:0));
  const ex=HX, ey=HY-1;
  if(st.eyes==='open'){ const px=ex+st.look[0], py=ey+st.look[1]; S.put(px,py,SL.PUP,'e:0:0'); S.put(px+1,py,SL.PUP,'e:1:0'); S.put(px,py+1,SL.PUP,'e:0:1'); S.put(px+1,py+1,SL.PUP,'e:1:1'); S.put(px,py,SL.GLINT,'e:g'); }
  else { S.put(ex-1,ey,SL.PUP,null); S.put(ex,ey+1,SL.PUP,null); S.put(ex+1,ey+1,SL.PUP,null); S.put(ex+2,ey,SL.PUP,null); }
  S.put(HX-1,HY+2,SL.BLUSH,null); S.put(HX,HY+2,SL.BLUSH,null);
  if(st.tongue){ const len=st.tongue*2.2; S.post.push(()=>{ for(let i=1;i<=len;i++){ const x=HX+5+i, y=my-1; if(x<N) S.put(x,y,SL.TONGUE,null); }
    const tx=Math.min(N-2,Math.round(HX+5+len)); S.ellipse(tx+0.5,my-0.5,1.3,1.3,(x,y)=>S.put(x,y,SL.PINK,null)); }); }
  accessoriesSmall(S,cfg,HX,HY,3.4,st);
};

/* --- turtle / tortoise: domed shell with scutes, chunky legs, big friendly head --- */
RIGS.turtle = function(S,P0,cfg,pose,f){
  const p=Object.assign({shellH:7.4,water:false},P0);
  const st={eyes:'open',lift:[0,0,0,0],headOut:1,bob:0,rock:0,legsIn:false,headUp:0};
  const k8=f%8, k12=f%12;
  if(pose==='walk'){ st.lift=[[1,0,0,1],[1,0,0,1],[0,0,0,0],[0,0,0,0],[0,1,1,0],[0,1,1,0],[0,0,0,0],[0,0,0,0]][k8]; st.bob=(k8===1||k8===5)?1:0; st.rock=(k8<4)?0:1; }
  else if(pose==='sleep'){ st.headOut=0; st.eyes='sleep'; st.legsIn=true; }
  else if(pose==='jump'){ st.eyes='happy'; st.lift=k8%2?[1,1,1,1]:[0,0,0,0]; st.headUp=1; st.bob=k8%2; }
  else if(pose==='sit'){ st.headUp=[0,0,1,1,1,1,0,0,0,0,0,0][k12]; if(k12===10) st.eyes='closed'; }
  else { st.bob=(k12===3||k12===4)?1:0; if(k12===9) st.eyes='closed'; }
  const water=p.water, sh=water?5.6:p.shellH, rx=water?10:9.6, cx=13+st.rock*0.4, base=water?24:23.6;
  // legs
  const leg=(lx,id,far)=>{ if(st.legsIn) return; const l=st.lift[id], w=water?2.6:2.1;
    S.ellipse(lx,26.4-l,w,2.4,(x,y,nx,ny)=>S.fur(x,y,'leg',id,Math.round(ny*3),far?-1:0));
    if(!far) for(const dx of [-1,1]) S.put(Math.round(lx+dx),28-l,SL.BL,null); };
  leg(cx-5.6,3,true); leg(cx+3.4,2,true);
  S.tri([[cx-rx+1,base-0.5],[cx-rx+1,base+1.5],[cx-rx-2,base+1]],(x,y)=>S.fur(x,y,'tail',0,0,0));
  // neck + head
  let HX=0,HY=0;
  if(st.headOut){
    const hx=cx+rx+2.6, hy=base-2.6-st.bob-st.headUp*1.5;
    S.tube([cx+rx-2,base],[cx+rx+0.5,base-0.5],[hx-1.8,hy+0.8],()=>2,(x,y)=>S.fur(x,y,'head',0,4,0));
    HX=Math.floor(hx); HY=Math.floor(hy);
    S.ellipse(hx,hy,4.2,3.8,(x,y)=>{ const dx=x-HX,dy=y-HY; S.fur(x,y,'head',dx,dy,dy>=2?-1:(dy<=-2&&dx<=0?1:0)); });
    S.eye(HX-1,HY-1,st.eyes,'l');
    S.line(HX+1,HY+2,HX+3,HY+1,(x,y)=>S.put(x,y,SL.BD,null));
  } else { S.ellipse(cx+rx-0.6,base-0.6,1.4,1.2,(x,y)=>S.put(x,y,SL.BD,null)); }
  // shell dome with scutes
  const pat=PATTERNS[cfg.pattern]||PATTERNS.solid;
  S.ellipse(cx,base,rx,sh,(x,y,nx,ny)=>{ if(y+0.5>base+0.6) return;
    const r=Math.hypot(nx,ny), ang=Math.atan2(ny,nx);
    const marg = r>0.84, margSeam = marg && Math.abs(mod(ang*4/Math.PI,1)-0.5)>0.42;
    const ring = Math.abs(r-0.84)<0.07;
    const vert = !marg && ny<-0.42 && (Math.abs(nx+0.34)<0.06||Math.abs(nx-0.34)<0.06);
    const horiz = !marg && Math.abs(ny+0.46)<0.08;
    const seam = ring||margSeam||vert||horiz;
    const cell = marg?Math.round(ang*4):(ny<-0.46?(nx<-0.34?1:nx>0.34?3:2):(nx<0?4:5));
    const plateCx = {1:-0.66,2:0,3:0.66,4:-0.45,5:0.45}[cell]; const star = !marg && plateCx!==undefined && pat('shell',cell,0)==='P' && (Math.abs(Math.atan2(ny+0.7*(cell<=3?1:0.3),nx-plateCx)*3/Math.PI%1)<0.18);
    const light = !seam && !marg && ny<-0.72 && nx<-0.1 && nx>-0.5;
    const c = seam?'X':(star?'P':(pat('shell',cell,Math.round(ny*4))==='P'&&cfg.pattern!=='redear'?'P':'X'));
    S.fur(x,y,'shell',cell,Math.round(r*4),seam?-1:(light?1:0),c); });
  for(let x=Math.round(cx-rx+1);x<=Math.round(cx+rx-1);x++) S.fur(x,Math.round(base+0.6),'belly',x,0,-1,'X');
  leg(cx-3.6,1,false); leg(cx+5.6,0,false);
  if(st.headOut) accessoriesSmall(S,cfg,HX,HY,3.8,st);
};

/* --- crocodile / caiman: chibi head, eye bumps, toothy smile, scutes, yawns --- */
RIG_POSES.croc = {stand:{frames:12,fps:5}, walk:{frames:8,fps:8}, sit:{frames:12,fps:5}, sleep:{frames:8,fps:2}, jump:{frames:8,fps:9}};
RIGS.croc = function(S,P0,cfg,pose,f){
  const p=Object.assign({snout:3.6},P0);
  const st={eyes:'open',sw:0,lift:[0,0,0,0],jaw:0,bob:0,headDown:0};
  const k8=f%8, k12=f%12;
  if(pose==='walk'){ st.sw=Math.sin(TAU*k8/8)*1.6; st.lift=k8<4?[1,0,0,1]:[0,1,1,0]; if(k8===3||k8===7) st.lift=[0,0,0,0]; st.bob=(k8%4===1)?1:0; }
  else if(pose==='jump'){ st.eyes='happy'; st.jaw=[0,1,2,2,2,1,0,0][k8]; st.sw=k8%2?1.5:-1.5; }
  else if(pose==='sleep'){ st.eyes='sleep'; st.headDown=1; st.sw=0; }
  else if(pose==='sit'){ st.jaw=[0,0,0,1,2,2,2,1,0,0,0,0][k12]; if(st.jaw===2) st.eyes='closed'; st.sw=Math.sin(TAU*k12/12)*0.6; }
  else { st.sw=Math.sin(TAU*k12/12)*0.8; if(k12===10) st.eyes='closed'; }
  const low=pose==='sleep'||pose==='sit';
  const cx=13, cy=(low?24.8:23.4)+st.bob, rx=7, ry=3.6;
  const bodyPix=(x,y)=>{ const a=clamp(Math.round((x+0.5-cx)/rx*8),-10,10), b=clamp(Math.round((y+0.5-cy)/ry*5),-6,6); S.fur(x,y,'body',a,b,b>=3?-1:0, b>=3?'W':null); };
  // tail along the ground, curling up at the tip
  const tailFn=(x,y,s,side)=>S.fur(x,y,'tail',s,side,side>0?-1:0,side>0&&s<10?'W':null);
  S.tube([cx-rx+1.5,cy+0.4],[2.5,cy+1.8+st.sw*0.5],[1.6+st.sw*0.3,cy-2.2-st.sw*0.6],u=>2.6*(1-0.72*u)+0.3,tailFn,18);
  for(let i=0;i<5;i++){ const t=i/5, x=Math.round((1-t)*(1-t)*(cx-rx+1.5)+2*(1-t)*t*2.5+t*t*1.6), y=Math.round((1-t)*(1-t)*(cy+0.4)+2*(1-t)*t*(cy+1.8)+t*t*(cy-2.2))-Math.round(2.6*(1-0.72*t)); S.fur(x,y-1,'body',i,-7,-1); }
  // legs
  const leg=(lx,id,far)=>{ if(low) return; const l=st.lift[id], top=Math.round(cy+1);
    for(let y=top;y<=28-l;y++){ S.fur(Math.round(lx),y,'leg',0,y-top,far?-1:0); S.fur(Math.round(lx)+1,y,'leg',1,y-top,far?-1:0); }
    for(const dx of [-1,2]) S.fur(Math.round(lx)+dx,28-l,'leg',2,7,far?-1:0); };
  leg(cx-4,3,true); leg(cx+3,2,true);
  S.ellipse(cx,cy,rx,ry,bodyPix);
  // back scutes
  for(let i=-5;i<=5;i++){ const x=Math.round(cx+i*1.2), top=Math.round(cy-ry*Math.sqrt(Math.max(0,1-((i*1.2)/rx)**2))); if(mod(i,2)===0) S.fur(x,top-1,'body',i,-7,-1); }
  leg(cx-5.2,1,false); leg(cx+4.6,0,false);
  // head
  const hx=cx+rx+1.6, hy=cy-1.6+st.headDown*1.2, HX=Math.floor(hx), HY=Math.floor(hy);
  const headPix=(x,y)=>{ const dx=x-HX, dy=y-HY; S.fur(x,y,'head',dx,dy,dy>=2?-1:(dy<=-2&&dx<=0?1:0), dy>=2&&dx>=2?'W':null); };
  S.ellipse(hx,hy,4.4,3.4,headPix);
  const sx=hx+3.6, sy=hy+1.2-st.jaw*0.6;
  S.ellipse(sx+1.4,sy,p.snout,1.9,headPix);
  if(st.jaw){ // open mouth: pink inside, lower jaw drops
    S.ellipse(sx+1,hy+2.6+st.jaw*0.4,p.snout-0.4,1.2,(x,y)=>S.fur(x,y,'head',x-HX,y-HY,-1,'W'));
    S.line(Math.round(sx-1),Math.round(sy+1.6),Math.round(sx+p.snout+1.6),Math.round(sy+1.6),(x,y)=>S.put(x,y,SL.PINK,null));
    if(st.jaw>1) S.line(Math.round(sx-1),Math.round(sy+2.6),Math.round(sx+p.snout),Math.round(sy+2.6),(x,y)=>S.put(x,y,SL.TONGUE,null));
  }
  const tipX=Math.floor(sx+1.4+p.snout-0.5), my=Math.round(sy+1.6+(st.jaw?0:0));
  if(!st.jaw){ S.line(HX-1,my-1,tipX-1,my,(x,y)=>S.put(x,y,SL.MOUTH,null)); }
  for(const tx of [HX+3,tipX-3]) S.put(tx,st.jaw?my:my+1,SL.GLINT,null);
  S.put(tipX-1,Math.round(sy-1.4),SL.NOSE,null); S.put(tipX-2,Math.round(sy-1.4),SL.NOSE,null);
  // eye bump on top
  S.ellipse(hx-0.6,hy-3,2.6,2.3,headPix);
  S.eye(HX-2,HY-3,st.eyes,'l');
  S.put(HX-2,HY+1,SL.BLUSH,null); S.put(HX-1,HY+1,SL.BLUSH,null);
  accessoriesSmall(S,cfg,HX-1,HY-2,3.4,st);
};

/* --- snake --- */
RIGS.snake = function(S,P0,cfg,pose,f){
  const p=Object.assign({thick:2.3},P0);
  const st={eyes:'open',tongue:false};
  const k=f%8, k12=f%12;
  let pts=[], headAt, coil=false;
  if(pose==='sit'||pose==='sleep'){
    coil=true; if(pose==='sleep') st.eyes='sleep'; else if(k12===10) st.eyes='closed';
    st.tongue=pose==='sit'&&(k12===3||k12===4);
  } else {
    const ph=pose==='walk'?k/8*TAU:(pose==='jump'?k/8*TAU*2:0);
    const amp=pose==='walk'?2:1.2;
    for(let i=0;i<=12;i++){ const x=2+i*1.75; pts.push([x,26-amp*Math.sin(i*0.75-ph)*(i/12+0.25)]); }
    const last=pts[pts.length-1];
    const lift=pose==='jump'?[0,2,4,5,5,4,2,0][k]:0;
    pts.push([last[0]+1.5,last[1]-2.5-lift*0.5],[last[0]+2.6,last[1]-5-lift]);
    headAt=[last[0]+4.2,last[1]-6-lift];
    if(pose==='jump') st.eyes='happy';
    if(pose==='stand'){ st.tongue=(k12===3||k12===4||k12===8); if(k12===10) st.eyes='closed'; }
  }
  const bodyFn=(x,y,s,side)=>S.fur(x,y,s>=13?'body':'tail',s*2-14,side,side>=1?-1:(side<=-1?1:0));
  if(coil){
    S.tube([5,27],[2,21],[13,20.5],u=>p.thick*(0.4+0.6*u),bodyFn,16);
    S.tube([13,20.5],[25,21],[20,27],u=>p.thick,bodyFn,16);
    S.tube([20,27],[13,29],[8,26],u=>p.thick,bodyFn,16);
    S.tube([8,26],[9,19],[16,16],u=>p.thick,bodyFn,16);
    headAt=[19.5,14.5];
  } else S.path(pts,u=>p.thick*(0.35+0.65*Math.min(1,u*1.6)),bodyFn);
  const [hx,hy]=headAt, HX=Math.floor(hx), HY=Math.floor(hy);
  S.ellipse(hx,hy,3.8,2.9,(x,y)=>S.fur(x,y,'head',x-HX,y-HY,(y-HY)>=2?-1:((y-HY)<=-2?1:0)));
  S.eye(HX,HY-1,st.eyes,'m');
  S.put(HX-1,HY+1,SL.BLUSH,null);
  S.line(HX+1,HY+1,HX+3,HY+1,(x,y)=>S.put(x,y,SL.MOUTH,null));
  if(st.tongue){ S.put(HX+4,HY+1,SL.TONGUE,null); S.put(HX+5,HY+1,SL.TONGUE,null); S.put(HX+6,HY,SL.TONGUE,null); S.put(HX+6,HY+2,SL.TONGUE,null); }
  accessoriesSmall(S,cfg,HX,HY,2.9,st);
};

/* --- frog / toad --- */
RIGS.frog = function(S,P0,cfg,pose,f){
  const p=Object.assign({warts:false},P0);
  const st={eyes:'open',hop:0,stretch:0,throat:0};
  const k=f%8, k12=f%12;
  if(pose==='walk'||pose==='jump'){ const big=pose==='jump'; st.hop=(big?[0,2,5,7,7,5,2,0]:[0,1,3,4,3,1,0,0])[k]; st.stretch=(k>=1&&k<=5)?1:0; if(big) st.eyes='happy'; }
  else if(pose==='sleep') st.eyes='sleep';
  else { st.throat=(k12%4<2)?0.6:0; if(k12===10) st.eyes='closed'; }
  const cx=14, cy=23.6-st.hop;
  const pix=(part)=>(x,y)=>{ const a=x-Math.round(cx), b=y-Math.round(cy); S.fur(x,y,part,a,b,b>=3?-1:(b<=-3&&a<=2?1:0)); };
  // back leg
  if(st.stretch){ S.tube([cx-4,cy+1],[cx-8,cy+3],[cx-11,cy+5],u=>1.8-0.6*u,pix('leg')); S.line(Math.round(cx-13),Math.round(cy+5),Math.round(cx-10),Math.round(cy+6),(x,y)=>S.fur(x,y,'leg',0,7,-1)); }
  else { S.ellipse(cx-4.4,cy+1.2,4,3.4,pix('leg')); S.line(Math.round(cx-7),28,Math.round(cx-1),28,(x,y)=>S.fur(x,y,'leg',0,7,-1)); }
  S.ellipse(cx,cy,7.2,4.6,pix('body'));
  if(st.throat) S.ellipse(cx+4.2,cy+2.6,2.4,1.6+st.throat,(x,y)=>S.fur(x,y,'body',4,4,1,'W'));
  // head + eye bumps
  S.ellipse(cx+4.6,cy-2.4,5.2,3.8,pix('head'));
  const eyes=[[cx+2.6,cy-5.6],[cx+6.8,cy-5.4]];
  for(const [ex,ey] of eyes) S.ellipse(ex,ey,2.3,2.2,pix('head'));
  S.eye(Math.floor(eyes[0][0])-1,Math.floor(eyes[0][1]),st.eyes,'s');
  S.eye(Math.floor(eyes[1][0])-1,Math.floor(eyes[1][1]),st.eyes,'s');
  // big smile
  const my=Math.round(cy-1);
  S.line(Math.round(cx+2),my,Math.round(cx+8.6),my-1,(x,y)=>S.put(x,y,SL.MOUTH,null));
  S.put(Math.round(cx+1.5),my-1,SL.MOUTH,null);
  S.put(Math.round(cx+2),my-2,SL.BLUSH,null); S.put(Math.round(cx+7.5),my-3,SL.BLUSH,null);
  // front leg
  S.line(Math.round(cx+4),Math.round(cy+3),Math.round(cx+5),28-Math.min(st.hop,3),(x,y,t)=>{ S.fur(x,y,'leg',0,Math.round(t*7),0); S.fur(x+1,y,'leg',1,Math.round(t*7),0); });
  if(p.warts) for(let i=0;i<9;i++){ const x=Math.round(cx-6+hash(i,3)*11), y=Math.round(cy-3+hash(i,7)*4); if(S.filled(x,y)) S.fur(x,y,'body',i,9,-1); }
  accessoriesSmall(S,cfg,Math.floor(cx+4.6),Math.floor(cy-2.4),3.8,st);
};

/* --- axolotl / newt --- */
RIGS.axolotl = function(S,P0,cfg,pose,f){
  const p=Object.assign({gills:true},P0);
  const st={eyes:'open',sw:0,g:0,lift:[0,0,0,0]};
  const k=f%8, k12=f%12;
  if(pose==='walk'){ st.sw=Math.sin(TAU*k/8)*1.6; st.g=k%2; st.lift=k<4?[1,0,0,1]:[0,1,1,0]; }
  else if(pose==='jump'){ st.eyes='happy'; st.g=k%2; st.sw=Math.sin(TAU*k/8)*2; }
  else if(pose==='sleep'){ st.eyes='sleep'; }
  else { st.g=(k12%6<3)?1:0; st.sw=Math.sin(TAU*k12/12)*0.8; if(k12===10) st.eyes='closed'; }
  const cx=13.5, cy=24;
  const bp=(part)=>(x,y)=>{ const a=clamp(Math.round((x+0.5-cx)/7*8),-10,10), b=y-Math.round(cy); S.fur(x,y,part,a,b,b>=2?-1:(b<=-2?1:0)); };
  // tail with fin
  S.tube([cx-6,cy],[cx-10,cy-1+st.sw],[2,cy+1-st.sw],u=>2.4-1.4*u,(x,y,s,side)=>S.fur(x,y,'tail',s,side,side<=-2?1:(side>=1?-1:0)));
  // legs
  for(const [lx,id,far] of [[cx-4,3,true],[cx+3,2,true],[cx-3,1,false],[cx+4,0,false]]){
    const l=st.lift[id]; S.line(lx,cy+2,lx+0.5,28-l,(x,y,t)=>S.fur(x,y,'leg',0,Math.round(t*7),far?-1:0)); S.fur(Math.round(lx+1.5),28-l,'leg',1,7,far?-1:0);
  }
  S.ellipse(cx,cy,7,3.4,bp('body'));
  const hx=cx+8, hy=cy-2.6, HX=Math.floor(hx), HY=Math.floor(hy);
  S.ellipse(hx,hy,5.4,4.4,(x,y)=>S.fur(x,y,'head',x-HX,y-HY,(y-HY)>=3?-1:((y-HY)<=-2&&(x-HX)<=0?1:0)));
  if(p.gills) for(const [i,ang] of [[0,-2.2],[1,-2.75],[2,2.95]]){
    const bx=hx-4.3+Math.abs(i-1)*0.6, by=hy-3.3+i*1.9;
    const ex=bx+Math.cos(ang)*4, ey=by+Math.sin(ang)*4-st.g*0.7;
    S.tube([bx,by],[(bx+ex)/2,(by+ey)/2-0.4],[ex,ey],u=>0.95-0.35*u,(x,y,s)=>S.fur(x,y,'gill',i,s,s>9?1:0,'X'));
    S.put(Math.round(ex),Math.round(ey),SL.XL,null);
  }
  S.eye(HX+1,HY-1,st.eyes,'s');
  S.put(HX,HY+1,SL.BLUSH,null); S.put(HX+1,HY+1,SL.BLUSH,null);
  // wide smile
  S.line(HX+2,HY+2,HX+4,HY+2,(x,y)=>S.put(x,y,SL.MOUTH,null)); S.put(HX+5,HY+1,SL.MOUTH,null); S.put(HX+1,HY+1,SL.MOUTH,null);
  accessoriesSmall(S,cfg,HX,HY,4.4,st);
};

/* shared tiny accessories for non-mammals */
function accessoriesSmall(S,cfg,HX,HY,r,st){
  const top=HY-Math.round(r);
  if(cfg.head==='bow'){ for(const [dx,dy] of [[-3,-1],[-3,0],[-1,-1],[-1,0]]) S.put(HX+dx,top+dy,SL.ACC,null); S.put(HX-2,top,SL.ACCD,null); }
  else if(cfg.head==='hat'){ for(const [dy,a,b] of [[0,-2,2],[-1,-1,1],[-2,-1,1],[-3,0,0]]) for(let dx=a;dx<=b;dx++) S.put(HX+dx,top+dy,dy===-1?SL.ACCD:SL.ACC,null); S.put(HX,top-4,SL.GOLD,null); }
  else if(cfg.head==='flower'){ const fx=HX-2, fy=top; for(const [dx,dy] of [[-1,0],[1,0],[0,-1],[0,1]]) S.put(fx+dx,fy+dy,SL.ACC,null); S.put(fx,fy,SL.GOLD,null); }
  if(cfg.neck==='collar'||cfg.neck==='bell'||cfg.neck==='bandana'){
    for(let dx=-3;dx<=-1;dx++){ const x=HX+dx; for(let y=HY;y<=HY+Math.round(r)+1;y++) if(S.filled(x,y)&&!S.filled(x,y+1)){ } }
    const x=HX-Math.round(r*0.7); for(let y=HY-1;y<=HY+Math.round(r);y++) if(S.filled(x,y)) S.put(x,y,SL.ACC,null);
    if(cfg.neck==='bell') S.put(x,HY+Math.round(r)+1,SL.GOLD,null);
  }
}
