/* ===== Spiders, insects, scorpions ===== */
RIG_POSES.spider   = {stand:{frames:12,fps:5}, walk:{frames:8,fps:10}, sit:{frames:12,fps:4}, sleep:{frames:8,fps:2}, jump:{frames:8,fps:10}};
RIG_POSES.insect   = {stand:{frames:12,fps:5}, walk:{frames:8,fps:10}, sit:{frames:12,fps:4}, sleep:{frames:8,fps:2}, jump:{frames:8,fps:10}};
RIG_POSES.scorpion = {stand:{frames:12,fps:5}, walk:{frames:8,fps:9}, sit:{frames:12,fps:4}, sleep:{frames:8,fps:2}, jump:{frames:8,fps:9}};

/* two-segment leg: hip -> knee (raised) -> foot on ground */
function bugLeg(S,hip,knee,foot,id,far,w){
  const fn=(x,y,t)=>{ S.fur(x,y,'leg',id,Math.round(t*7),far?-1:0); if(w>1) S.fur(x,y+1,'leg',id,Math.round(t*7),far?-1:0); };
  S.line(Math.round(hip[0]),Math.round(hip[1]),Math.round(knee[0]),Math.round(knee[1]),fn);
  S.line(Math.round(knee[0]),Math.round(knee[1]),Math.round(foot[0]),Math.round(foot[1]),fn);
}

RIGS.spider = function(S,P0,cfg,pose,f){
  const st={eyes:'open',ph:0,bob:0,wave:0};
  const k=f%8, k12=f%12;
  if(pose==='walk'){ st.ph=k%2; st.bob=(k%4===1)?1:0; }
  else if(pose==='jump'){ st.eyes='happy'; st.wave=k%2; st.bob=[0,-1,-3,-4,-4,-3,-1,0][k]; }
  else if(pose==='sleep'){ st.eyes='sleep'; st.bob=1; }
  else { st.wave=(k12>=4&&k12<=6)?1:0; if(k12===10) st.eyes='closed'; }
  const ax=10.5, ay=19.5+st.bob, tx=18, ty=21.5+st.bob;
  const fuzz=(part,cx,cy)=>(x,y,nx,ny)=>S.fur(x,y,part,Math.round(nx*5),Math.round(ny*4),ny>0.5?-1:(hash(x,y)<0.2?-1:(ny<-0.5?1:0)));
  const legs=[[-4,0],[-1.5,1],[1,0],[3.4,1]];
  // far legs
  legs.forEach(([dx,ph],i)=>{ const lift=(st.ph===ph)?1:0; bugLeg(S,[tx+dx*0.6,ty],[tx+dx*1.6-1,ty-5+lift],[tx+dx*2.2-1.5,28-lift],i+4,true,1); });
  S.ellipse(ax,ay,6.2,5.4,fuzz('body'));
  S.ellipse(tx,ty,4.4,3.6,fuzz('head'));
  // near legs (front pair waves when happy / idle)
  legs.forEach(([dx,ph],i)=>{ const lift=(st.ph!==ph)?1:0; const up=(i===3&&st.wave)?4:0;
    bugLeg(S,[tx+dx*0.6+0.5,ty+1],[tx+dx*1.6+1,ty-4+lift-up],[tx+dx*2.4+1,28-lift-up*1.5],i,false,1); });
  const HX=Math.floor(tx), HY=Math.floor(ty);
  S.eye(HX+1,HY-1,st.eyes,'s'); S.eye(HX-2,HY-1,st.eyes,'s');
  S.put(HX+3,HY-2,SL.PUP,null);
  S.put(HX-1,HY+1,SL.BLUSH,null); S.put(HX+2,HY+1,SL.BLUSH,null);
  S.put(HX+1,HY+2,SL.MOUTH,null);
  accessoriesSmall(S,cfg,HX,HY,3.6,st);
};

RIGS.insect = function(S,P0,cfg,pose,f){
  const p=Object.assign({kind:'mantis'},P0);
  const st={eyes:'open',ph:0,bob:0,arm:0,ant:0};
  const k=f%8, k12=f%12;
  if(pose==='walk'){ st.ph=k%2; st.bob=(k%4===1)?1:0; st.ant=k%2; }
  else if(pose==='jump'){ st.eyes='happy'; st.arm=k%2; st.bob=[0,-1,-3,-4,-4,-3,-1,0][k]; }
  else if(pose==='sleep'){ st.eyes='sleep'; }
  else { st.arm=(k12>=4&&k12<=6)?1:0; st.ant=(k12%6<3)?1:0; if(k12===10) st.eyes='closed'; }
  const segPix=(part)=>(x,y,nx,ny)=>S.fur(x,y,part,Math.round((nx||0)*6),Math.round((ny||0)*3),(ny>0.4)?-1:((ny||0)<-0.5?1:0));
  const antenna=(x0,y0,x1,y1)=>S.post.push(()=>S.line(x0,y0,x1,y1,(x,y)=>{ if(x>=0&&y>=0&&x<N&&y<N&&S.slots[y*N+x]===0) S.put(x,y,SL.BD,null); }));
  const kind=p.kind, b=st.bob;
  if(kind==='mantis'){
    for(let i=0;i<2;i++){ const lx=8+i*5; bugLeg(S,[lx,22+b],[lx-2+(st.ph===i%2?1:0),18+b],[lx-3,28],i,true,1); }
    S.tube([4,22+b],[9,24+b],[15,21+b],u=>1.6+1.2*Math.sin(Math.PI*u),(x,y,s,side)=>S.fur(x,y,'body',s,side,side>0?-1:0));
    S.tube([6,20.5+b],[10,20+b],[15,20+b],u=>1.4,(x,y,s)=>S.fur(x,y,'wing',s,0,1,'W'));
    S.tube([14,21+b],[17,17+b],[19,13+b],u=>1.2,(x,y,s,side)=>S.fur(x,y,'body',s+14,side,0));
    for(let i=0;i<2;i++){ const lx=14+i*3; bugLeg(S,[lx,21+b],[lx+1+(st.ph!==i%2?1:0),24+b],[lx+2.5,28],i+2,false,1); }
    const hx=20.5, hy=11.5+b, HX=Math.floor(hx), HY=Math.floor(hy);
    S.tri([[hx-3.4,hy-2],[hx+3.4,hy-2],[hx+0.6,hy+3.4]],(x,y)=>S.fur(x,y,'head',x-HX,y-HY,0));
    S.ellipse(hx-2.6,hy-1.8,1.6,1.6,(x,y)=>S.fur(x,y,'head',x-HX,y-HY,0)); S.ellipse(hx+2.6,hy-1.8,1.6,1.6,(x,y)=>S.fur(x,y,'head',x-HX,y-HY,0));
    S.eye(HX-3,HY-1,st.eyes,'s'); S.eye(HX+2,HY-1,st.eyes,'s');
    S.put(HX,HY+1,SL.MOUTH,null); S.put(HX-2,HY+1,SL.BLUSH,null); S.put(HX+2,HY+1,SL.BLUSH,null);
    // raptorial arms
    const ay=st.arm?-3:0;
    S.tube([18,15+b],[22,18+b+ay*0.5],[22.5,13+b+ay],u=>1,(x,y,s)=>S.fur(x,y,'leg',9,s,0));
    antenna(HX-1,HY-3,HX-4,HY-8+st.ant); antenna(HX+1,HY-3,HX+4,HY-8+st.ant);
    accessoriesSmall(S,cfg,HX,HY,2,st);
    return;
  }
  if(kind==='stick'){
    for(let i=0;i<3;i++){ const lx=8+i*6; bugLeg(S,[lx,21+b],[lx+2,16+b+(st.ph===i%2?1:0)],[lx+4,28],i,true,1); }
    S.tube([2,21.5+b],[13,21+b],[24,20.5+b],u=>u<0.1?1.2:0.9,(x,y,s,side)=>S.fur(x,y,'body',s,side,side>0?-1:0));
    for(let i=0;i<3;i++){ const lx=9+i*6; bugLeg(S,[lx,21+b],[lx-1,17+b+(st.ph!==i%2?1:0)],[lx-3,28],i+3,false,1); }
    const hx=25.5, hy=20+b, HX=Math.floor(hx), HY=Math.floor(hy);
    S.ellipse(hx,hy,2.4,2,(x,y)=>S.fur(x,y,'head',x-HX,y-HY,0));
    S.eye(HX,HY-1,st.eyes,'s'); S.put(HX-1,HY+1,SL.BLUSH,null);
    antenna(HX+2,HY-1,HX+6,HY-6+st.ant); antenna(HX+1,HY-2,HX+3,HY-8);
    accessoriesSmall(S,cfg,HX,HY,2,st);
    return;
  }
  if(kind==='ant'){
    for(let i=0;i<3;i++){ const lx=12+i*2.2; bugLeg(S,[lx,23+b],[lx-1.5+(st.ph===i%2?1:0),20.5+b],[lx-3,28],i,true,1); }
    S.ellipse(8.5,22.5+b,4.4,3.8,segPix('body'));
    S.ellipse(14,23+b,2.6,2,segPix('body'));
    for(let i=0;i<3;i++){ const lx=13+i*2.2; bugLeg(S,[lx,24+b],[lx+1.5+(st.ph!==i%2?1:0),21.5+b],[lx+3,28],i+3,false,1); }
    const hx=20, hy=20.5+b, HX=Math.floor(hx), HY=Math.floor(hy);
    S.ellipse(hx,hy,4,3.6,segPix('head'));
    S.eye(HX,HY-1,st.eyes,'m'); S.put(HX-1,HY+2,SL.BLUSH,null); S.put(HX+3,HY+2,SL.MOUTH,null);
    antenna(HX,HY-3,HX+2,HY-7+st.ant); antenna(HX+2,HY-7+st.ant,HX+5,HY-6+st.ant);
    accessoriesSmall(S,cfg,HX,HY,3.6,st);
    return;
  }
  // roach / beetle
  for(let i=0;i<3;i++){ const lx=9+i*4.5; bugLeg(S,[lx,24+b],[lx-1+(st.ph===i%2?1:0),25+b],[lx-2,28],i,true,1); }
  S.ellipse(13.5,22+b,8.4,4.4,(x,y,nx,ny)=>S.fur(x,y,'body',Math.round(nx*6),Math.round(ny*3),ny>0.5?-1:(ny<-0.55&&nx<0.3?1:0)));
  S.line(14,18+b,6,22+b,(x,y)=>S.fur(x,y,'body',0,-9,-1));
  for(let i=0;i<3;i++){ const lx=10+i*4.5; bugLeg(S,[lx,25+b],[lx+1+(st.ph!==i%2?1:0),26+b],[lx+2.5,28],i+3,false,1); }
  const hx=22.5, hy=22+b, HX=Math.floor(hx), HY=Math.floor(hy);
  S.ellipse(hx,hy,3.2,3,(x,y)=>S.fur(x,y,'head',x-HX,y-HY,(y-HY)>=2?-1:0));
  S.eye(HX,HY-1,st.eyes,'m'); S.put(HX-1,HY+2,SL.BLUSH,null); S.put(HX+2,HY+2,SL.MOUTH,null);
  antenna(HX+2,HY-2,HX+8,HY-9+st.ant); antenna(HX+1,HY-3,HX+4,HY-10);
  accessoriesSmall(S,cfg,HX,HY,3,st);
};

RIGS.scorpion = function(S,P0,cfg,pose,f){
  const st={eyes:'open',ph:0,bob:0,tail:0,claw:0};
  const k=f%8, k12=f%12;
  if(pose==='walk'){ st.ph=k%2; st.tail=Math.sin(TAU*k/8)*0.8; }
  else if(pose==='jump'){ st.eyes='happy'; st.claw=k%2; st.tail=k%2?1:-1; }
  else if(pose==='sleep'){ st.eyes='sleep'; st.tail=2; }
  else { st.claw=(k12>=4&&k12<=6)?1:0; st.tail=Math.sin(TAU*k12/12)*0.6; if(k12===10) st.eyes='closed'; }
  const cx=14, cy=24.5;
  for(let i=0;i<4;i++){ const lx=10+i*2.6; bugLeg(S,[lx,cy+1],[lx-1+(st.ph===i%2?1:0),cy-1],[lx-2.5,28],i,true,1); }
  // tail arc over the back
  S.path([[cx-5,cy],[cx-8,cy-4],[cx-7,cy-9+st.tail],[cx-3,cy-12+st.tail],[cx+0.5,cy-11+st.tail]],u=>1.9-0.6*u,(x,y,s,side)=>S.fur(x,y,'tail',s,side,side>0?-1:(side<0?1:0)));
  S.ellipse(cx+1.4,cy-10+st.tail,1.3,1.3,(x,y)=>S.fur(x,y,'tail',15,0,0,'X'));
  S.ellipse(cx,cy,6.6,2.8,(x,y,nx,ny)=>S.fur(x,y,'body',Math.round(nx*6),Math.round(ny*3),ny>0.4?-1:(ny<-0.5?1:0)));
  for(let i=0;i<4;i++){ const lx=11+i*2.6; bugLeg(S,[lx,cy+1.5],[lx+1+(st.ph!==i%2?1:0),cy],[lx+2.5,28],i+4,false,1); }
  // claws
  S.tube([cx+5,cy],[cx+7,cy-2],[cx+9,cy-1],()=>1,(x,y)=>S.fur(x,y,'claw',0,0,0));
  S.ellipse(cx+10.6,cy-1.6-st.claw,2.6,1.9,(x,y)=>S.fur(x,y,'claw',x,y,0));
  S.put(Math.round(cx+12.8),Math.round(cy-1.6-st.claw),SL.OUT,null);
  const HX=Math.floor(cx+4.5), HY=Math.floor(cy-1);
  S.eye(HX,HY-1,st.eyes,'s'); S.put(HX-1,HY+1,SL.BLUSH,null); S.put(HX+2,HY+1,SL.MOUTH,null);
  accessoriesSmall(S,cfg,HX,HY,2.4,st);
};
