/* ===== Fish, crustaceans, snails ===== */
RIG_POSES.fish  = {stand:{frames:12,fps:6}, walk:{frames:8,fps:9}, sit:{frames:12,fps:5}, sleep:{frames:8,fps:2}, jump:{frames:8,fps:10}};
RIG_POSES.crust = {stand:{frames:12,fps:5}, walk:{frames:8,fps:9}, sit:{frames:12,fps:5}, sleep:{frames:8,fps:2}, jump:{frames:8,fps:9}};
RIG_POSES.snail = {stand:{frames:12,fps:4}, walk:{frames:8,fps:5}, sit:{frames:12,fps:4}, sleep:{frames:8,fps:2}, jump:{frames:8,fps:8}};

RIGS.fish = function(S,P0,cfg,pose,f){
  const p=Object.assign({shape:'oval'},P0);
  const st={eyes:'open',wag:0,bob:0,flap:0,bubble:-1};
  const k=f%8, k12=f%12;
  if(pose==='walk'){ st.wag=Math.sin(TAU*k/8)*2.2; st.flap=k%2; st.bob=Math.round(Math.sin(TAU*k/8)*0.6); }
  else if(pose==='jump'){ st.eyes='happy'; st.wag=Math.sin(TAU*k/4)*2.5; st.bob=[0,-1,-2,-3,-3,-2,-1,0][k]; st.bubble=k; }
  else if(pose==='sleep'){ st.eyes='sleep'; st.bob=1; st.wag=0.4*Math.sin(TAU*k/8); }
  else { st.wag=Math.sin(TAU*k12/12)*1.1; st.flap=(k12%4<2)?1:0; st.bob=Math.round(Math.sin(TAU*k12/12)*0.7); if(k12===10) st.eyes='closed'; st.bubble=k12<8?k12:-1; }
  const shape=p.shape;
  const dims={oval:[7.4,5,15,18],veil:[6.6,4.4,16,17],tall:[5.6,6.4,16,16],bottom:[9.2,3.4,15,24],long:[8.4,3.3,15,18],clown:[7.2,4.8,15,18]}[shape]||[7.4,5,15,18];
  const [rx,ry,cx,cy0]=dims, cy=cy0+st.bob;
  const finPix=(part)=>(x,y,s,side)=>S.fur(x,y,part,s||0,side||0,(s>10)?1:0,'X');
  const bodyPix=(x,y)=>{ const a=clamp(Math.round((x+0.5-cx)/rx*8),-10,10), b=clamp(Math.round((y+0.5-cy)/ry*5),-6,6); S.fur(x,y,'body',a,b,b>=3?-1:(b<=-3&&a>=-2?1:0)); };
  // tail fin
  const bx=cx-rx+0.8;
  if(shape==='veil'){
    S.tube([bx,cy],[bx-5,cy-5+st.wag],[bx-9,cy+1+st.wag],u=>2+2.2*Math.sin(Math.PI*u),finPix('fin'));
    S.tube([cx-1,cy-ry+0.5],[cx-5,cy-ry-4],[cx-9,cy-ry-2+st.wag*0.5],u=>1.6-0.6*u,finPix('fin'));
    S.tube([cx-1,cy+ry-0.5],[cx-4,cy+ry+4],[cx-7,cy+ry+5+st.wag*0.5],u=>1.8-0.5*u,finPix('fin'));
  } else if(shape==='tall'){
    S.tri([[bx+1,cy],[bx-5,cy-4+st.wag],[bx-5,cy+4+st.wag]],finPix('fin'));
    S.tri([[cx-2,cy-ry+1],[cx+2,cy-ry+1],[cx-5,cy-ry-6]],finPix('fin'));
    S.tri([[cx-2,cy+ry-1],[cx+2,cy+ry-1],[cx-5,cy+ry+6]],finPix('fin'));
  } else {
    const t=shape==='bottom'?3.2:4.4;
    S.tri([[bx+1.2,cy],[bx-t,cy-t+st.wag],[bx-t+1.6,cy+st.wag*0.6]],finPix('fin'));
    S.tri([[bx+1.2,cy],[bx-t,cy+t+st.wag],[bx-t+1.6,cy+st.wag*0.6]],finPix('fin'));
    if(shape!=='bottom') S.tri([[cx-3,cy-ry+0.8],[cx+2,cy-ry+0.6],[cx-2.5,cy-ry-3]],finPix('fin'));
    else S.tri([[cx-4,cy-ry+0.8],[cx+1,cy-ry+0.6],[cx-3.5,cy-ry-2.4]],finPix('fin'));
  }
  S.ellipse(cx,cy,rx,ry,bodyPix);
  // pectoral fin
  S.ellipse(cx+1,cy+1.2+st.flap*0.6,2,1.3-st.flap*0.3,finPix('fin'));
  // face
  const ex=Math.floor(cx+rx*0.42), ey=Math.floor(cy-ry*0.25);
  S.eye(ex,ey,st.eyes,shape==='bottom'||shape==='long'?'m':'l');
  S.put(ex,ey+3,SL.BLUSH,null); S.put(ex+1,ey+3,SL.BLUSH,null);
  const mx=Math.floor(cx+rx-0.6), my=Math.floor(cy+ry*0.25);
  S.put(mx,my,SL.MOUTH,null);
  if(shape==='bottom'){ S.post.push(()=>{ for(const [dx,dy] of [[1,0],[2,1],[1,1],[2,2]]) if(S.slots[(my+dy)*N+mx+dx]===0) S.put(mx+dx,my+dy,SL.WHISK,null); }); }
  if(st.bubble>=0){ const by=Math.round(cy-ry-1-st.bubble*0.8), bxp=mx+1+(st.bubble%2);
    if(by>0) S.post.push(()=>{ S.put(bxp,by,SL.WHISK,null); S.put(bxp+1,by-2,SL.WHISK,null); }); }
  accessoriesSmall(S,cfg,ex,ey+1,ry,st);
};

RIGS.crust = function(S,P0,cfg,pose,f){
  const p=Object.assign({kind:'shrimp'},P0);
  const st={eyes:'open',leg:0,claw:0,bob:0};
  const k=f%8, k12=f%12;
  if(pose==='walk'){ st.leg=k%2; st.bob=(k%4===1)?1:0; }
  else if(pose==='jump'){ st.eyes='happy'; st.claw=k%2; st.bob=[0,-1,-2,-2,-1,0,0,0][k]; }
  else if(pose==='sleep'){ st.eyes='sleep'; }
  else { st.claw=(k12>=4&&k12<=6)?1:0; if(k12===10) st.eyes='closed'; }
  const segPix=(part,i)=>(x,y,nx,ny)=>S.fur(x,y,part,i,Math.round((ny||0)*3),(ny>0.45)?-1:((ny||0)<-0.5?1:0));
  if(p.kind==='hermit'){
    const cx=12, cy=21+st.bob;
    // claws & legs peeking out
    for(let i=0;i<3;i++) S.line(cx+5+i*1.6,cy+4,cx+6+i*1.6+(st.leg&&i===1?1:0),28,(x,y)=>S.fur(x,y,'leg',i,0,i===1?0:-1));
    S.ellipse(cx+8,cy+1,3.2,3,segPix('body',0));
    S.ellipse(cx+10.6,cy+3.6-st.claw,2.6,2,segPix('claw',0));
    S.put(Math.round(cx+12.6),Math.round(cy+3-st.claw),SL.OUT,null);
    for(const dx of [0,2]){ S.line(cx+8+dx,cy-1,cx+9+dx,cy-4,(x,y)=>S.fur(x,y,'body',9,0,0)); }
    S.eye(Math.round(cx+8.5),Math.round(cy-5),st.eyes,'s'); S.eye(Math.round(cx+10.8),Math.round(cy-5),st.eyes,'s');
    // spiral shell
    S.ellipse(cx,cy,7.4,6.6,(x,y,nx,ny)=>{ const r=Math.hypot(nx,ny), a=Math.atan2(ny,nx); const spiral=Math.abs(mod(r*3.2-a/TAU*1.0,1)-0.5)<0.14;
      S.fur(x,y,'shell',Math.round(a*3),Math.round(r*4),r>0.9?-1:(ny<-0.5&&nx<0.2?1:0),spiral?'P':'X'); });
    accessoriesSmall(S,cfg,Math.round(cx+9.5),Math.round(cy-4),2,st);
    return;
  }
  const cray=p.kind==='cray';
  // tail to the left, head to the right; segments
  const segs=cray?[[7,22,2.6,2.6],[10.5,22,3,3],[14.5,21.6,3.4,3.3],[19,21.2,4.6,3.6]]:[[6.5,24,1.8,1.8],[8.5,21.6,2.2,2.2],[11.3,20.2,2.6,2.6],[14.8,19.8,3,3],[19.4,20.2,4.6,3.6]];
  // legs
  for(let i=0;i<4;i++){ const lx=12+i*2.2, top=cray?24:22.6; S.line(lx,top+st.bob,lx+(st.leg&&i%2?1:-0.5),28,(x,y)=>S.fur(x,y,'leg',i,0,i%2?-1:0)); }
  // tail fan
  const t0=segs[0]; S.tri([[t0[0]+0.5,t0[1]+st.bob],[t0[0]-4,t0[1]-3+st.bob],[t0[0]-4,t0[1]+3+st.bob]],(x,y)=>S.fur(x,y,'tail',0,0,0,'X'));
  segs.forEach(([x,y,rx,ry],i)=>S.ellipse(x,y+st.bob,rx,ry,segPix(i===segs.length-1?'head':'body',i)));
  for(let i=1;i<segs.length-1;i++){ const [x,y,rx,ry]=segs[i]; S.put(Math.round(x+rx*0.3),Math.round(y-ry*0.4+st.bob),SL.BL,null); }
  const [hx,hy0]=segs[segs.length-1], hy=hy0+st.bob, HX=Math.floor(hx), HY=Math.floor(hy);
  // antennae (drawn after outline so they stay thin)
  S.post.push(()=>{ S.line(HX+3,HY-2,HX+7,HY-8,(x,y)=>{ if(S.slots[y*N+x]===0) S.put(x,y,SL.XD,null); }); S.line(HX+2,HY-3,HX-3,HY-10,(x,y)=>{ if(S.slots[y*N+x]===0) S.put(x,y,SL.XD,null); }); });
  if(cray){ // big claws
    S.ellipse(hx+5.4,hy+2.4-st.claw,2.8,1.9,segPix('claw',0)); S.ellipse(hx+7.4,hy+0.6-st.claw*1.5,1.4,1.2,segPix('claw',1));
  }
  S.eye(HX+1,HY-1,st.eyes,'m');
  S.put(HX,HY+2,SL.BLUSH,null); S.put(HX+3,HY+1,SL.MOUTH,null);
  accessoriesSmall(S,cfg,HX,HY,3.6,st);
};

RIGS.snail = function(S,P0,cfg,pose,f){
  const st={eyes:'open',stretch:0,stalk:0,hide:false};
  const k=f%8, k12=f%12;
  if(pose==='walk'){ st.stretch=[0,0.5,1,1.5,1,0.5,0,0][k]; st.stalk=k%4<2?0:1; }
  else if(pose==='jump'){ st.eyes='happy'; st.stalk=k%2; }
  else if(pose==='sleep'){ st.hide=true; }
  else { st.stalk=(k12>=3&&k12<=5)?1:0; if(k12===10) st.eyes='closed'; }
  const cx=12.5, cy=19.5;
  if(!st.hide){
    // foot
    S.ellipse(17+st.stretch*0.5,26.4,9.5+st.stretch,2.2,(x,y,nx,ny)=>S.fur(x,y,'body',Math.round(nx*8),Math.round(ny*2),ny>0.3?-1:0));
    // head + stalks
    const hx=24.5+st.stretch, hy=22.4; const HX=Math.floor(hx), HY=Math.floor(hy);
    for(const [dx,lean] of [[-1.2,-1],[1,0.6+st.stalk*0.6]]){
      S.line(Math.round(hx+dx),HY-2,Math.round(hx+dx+lean),HY-7,(x,y)=>S.fur(x,y,'head',0,-6,0));
    }
    S.ellipse(hx,hy,3.2,3.6,(x,y)=>S.fur(x,y,'head',x-HX,y-HY,(y-HY)>=2?-1:0));
    S.put(Math.round(hx-1.2-1),HY-8,SL.PUP,null); S.put(Math.round(hx+1+0.6+st.stalk*0.6),HY-8,SL.PUP,null);
    S.eye(HX,HY-1,st.eyes,'s');
    S.put(HX-1,HY+1,SL.BLUSH,null); S.line(HX+1,HY+2,HX+2,HY+2,(x,y)=>S.put(x,y,SL.MOUTH,null));
    accessoriesSmall(S,cfg,HX,HY-3,3,st);
  } else S.ellipse(17,26.6,7,1.6,(x,y)=>S.fur(x,y,'body',x,0,-1));
  // shell with spiral
  const sy=cy+(st.hide?3.5:0)-(st.stretch?0.3:0);
  S.ellipse(cx,sy,7,6.6,(x,y,nx,ny)=>{ const r=Math.hypot(nx,ny), a=Math.atan2(ny,nx);
    const spiral=Math.abs(mod(r*2.6-a/TAU,1)-0.5)<0.16 && r>0.15;
    S.fur(x,y,'shell',Math.round(a*3),Math.round(r*4),r>0.88?-1:(ny<-0.4&&nx<0.1?1:0),spiral?'P':'X'); });
  if(st.hide){ S.put(Math.round(cx+3),Math.round(sy-7.5),SL.WHISK,null); }
};
