/* ===== Horse / pony / donkey: barrel body, arched neck, long face, jointed legs with hooves, flowing mane & tail ===== */
RIG_POSES.horse = {stand:{frames:12,fps:5}, walk:{frames:8,fps:8}, sit:{frames:12,fps:4}, sleep:{frames:8,fps:2}, jump:{frames:8,fps:9}};
RIGS.horse = function(S,P0,cfg,pose,f){
  const p=Object.assign({legScale:1,earLong:false,chunky:false},P0);
  const k8=f%8, k12=f%12;
  const st={eyes:'open',tail:0,ear:0,head:0,bob:0,lying:false,graze:0};
  // leg cycle (walk): per leg hoof dx, lift, knee bend
  const HX=[1.2,0.6,0,-0.6,-1.2,-0.6,0.4,1.2], HL=[0,0,0,0,0,1,2,1];
  let legState=id=>({dx:0,lift:0});
  if(pose==='walk'){ st.bob=[0,0,1,1,0,0,1,1][k8]; st.head=[0,1,1,0,0,1,1,0][k8]; st.tail=[0,1,1,0,0,-1,-1,0][k8];
    const ph={1:0,0:2,3:4,2:6}; legState=id=>{ const q=(k8+ph[id])%8; return {dx:HX[q],lift:HL[q]}; }; }
  else if(pose==='jump'){ st.eyes='happy'; const k=k8; st.bob=[1,0,-1,-2,-2,-1,0,1][k];
    legState=id=>{ const front=id===0||id===2; if(k>=2&&k<=5) return {dx:front?1.5:-1.5,lift:front?4:2}; return {dx:0,lift:0}; }; st.tail=k%2?1:-1; }
  else if(pose==='sit'||pose==='sleep'){ st.lying=true; if(pose==='sleep') st.eyes='sleep'; else if(k12===10) st.eyes='closed'; st.head=pose==='sleep'?3:0; }
  else { st.tail=[0,0,1,1,0,0,-1,-1,0,0,0,0][k12]; st.ear=(k12===5||k12===6)?1:0; if(k12===9) st.eyes='closed'; st.graze=0; }
  const ls=p.legScale, legLen=Math.round(8*ls), lie=st.lying;
  const ground=28, bodyBot = lie? 26 : ground-legLen;
  const cx=13, cy=bodyBot-3.4+st.bob, rx=7.6+(p.chunky?0.4:0), ry=3.8+(p.chunky?0.5:0);
  const bodyPix=(x,y)=>{ const a=clamp(Math.round((x+0.5-cx)/rx*8),-10,10), b=clamp(Math.round((y+0.5-cy)/ry*5),-6,6); S.fur(x,y,'body',a,b,b>=3?-1:(b<=-4&&a<=2?1:0)); };
  const maneFn=(x,y,s)=>S.fur(x,y,'mane',s,0,mod(s,3)===0?-1:0,'P');
  // ---- legs ----
  const drawLeg=(id,hipX,far)=>{
    if(lie) return;
    const ls2=legState(id), front=id===0||id===2, top=Math.round(cy+ry*0.4), hoofY=ground-ls2.lift;
    const kneeY=Math.round((top+hoofY)/2)+(front?0:-1), kneeX=hipX+(front?ls2.dx*0.5+ (ls2.lift?0.8:0):ls2.dx*0.5-(ls2.lift?0.8:0)+ (front?0:-0.6));
    const tone=far?-1:0;
    S.line(Math.round(hipX),top,Math.round(kneeX),kneeY,(x,y,t)=>{ S.fur(x,y,'leg',0,Math.round(t*3),tone); S.fur(x+1,y,'leg',1,Math.round(t*3),tone); if(!far&&t<0.5) S.fur(x+2,y,'leg',2,0,tone); });
    const hx=Math.round(hipX+ls2.dx);
    S.line(Math.round(kneeX),kneeY,hx,hoofY-1,(x,y,t)=>{ S.fur(x,y,'leg',0,4+Math.round(t*3),tone); S.fur(x+1,y,'leg',1,4+Math.round(t*3),tone); });
    for(let dx=0;dx<=2;dx++) S.fur(hx+dx-(front?0:1),hoofY,'hoof',dx,0,far?-1:0,'X');
  };
  drawLeg(2,cx+rx*0.5-2,true); drawLeg(3,cx-rx*0.55+1.5,true);
  // ---- tail ----
  const tx=cx-rx+0.8, tyy=cy-ry*0.55;
  const tailEnd=lie?[tx-2.5,27]:[tx-2+st.tail,tyy+9.5];
  S.tube([tx,tyy],[tx-3,tyy+1],tailEnd,u=>1.2+1.1*u,(x,y,s,side)=>S.fur(x,y,'tail',s,side,side>0?-1:(mod(s,4)===0?1:0),'P'));
  // ---- body ----
  S.ellipse(cx,cy,rx,ry,bodyPix);
  S.ellipse(cx+rx*0.72,cy-0.4,3.2,ry*0.95,bodyPix);
  S.ellipse(cx-rx*0.62,cy-0.3,3.4,ry*0.98,bodyPix);
  if(lie){ // folded legs under the belly
    for(const lx of [cx-4,cx+3.5]){ S.ellipse(lx,27,2.6,1.3,(x,y)=>S.fur(x,y,'leg',Math.max(0,Math.min(2,Math.round((x-lx+2.6)/2.2))),y<27?6:7,0)); S.fur(Math.round(lx+2),27,'hoof',0,0,0,'X'); }
  }
  // ---- neck + head ----
  const nb=[cx+rx*0.7,cy-ry*0.6], down=st.head*0.8+(lie?1.5:0);
  const hc=[nb[0]+4.2,Math.max(6.2,nb[1]-6.2)+down];
  S.tube(nb,[nb[0]+2,nb[1]-3.5+down*0.5],[hc[0]-0.5,hc[1]+0.8],u=>2.9-0.7*u,(x,y)=>S.fur(x,y,'body',9,-3,0));
  // mane along the neck crest
  S.tube([hc[0]-1.4,hc[1]-2.6],[nb[0]+0.6,nb[1]-4+down*0.4],[nb[0]-1.6,nb[1]-0.4],u=>1.3+0.4*Math.sin(Math.PI*u),maneFn);
  const HXp=Math.floor(hc[0]), HYp=Math.floor(hc[1]);
  const headPix=(x,y)=>{ const dx=x-HXp, dy=y-HYp; S.fur(x,y,'head',dx,dy,dy>=2&&dx<=0?-1:(dy<=-2&&dx<=0?1:0)); };
  // ears
  const eh=p.earLong?6:3.4;
  S.tri([[hc[0]-1.8,hc[1]-2],[hc[0]-0.4,hc[1]-2.4],[hc[0]-1.6-st.ear*0.6,hc[1]-2-eh]],(x,y)=>S.fur(x,y,'ear',x-HXp,y-HYp,-1));
  S.tri([[hc[0]-0.2,hc[1]-2.4],[hc[0]+1.4,hc[1]-2],[hc[0]+0.4+st.ear*0.4,hc[1]-2.2-eh]],(x,y)=>S.fur(x,y,'ear',x-HXp,y-HYp,0));
  if(!p.earLong) S.put(Math.floor(hc[0]+0.4),Math.floor(hc[1]-3.6),SL.PINK,null);
  // skull + long face sloping down to the muzzle
  S.ellipse(hc[0],hc[1],3.1,2.8,headPix);
  const mz=[Math.min(29.4,hc[0]+4.2),hc[1]+2.4];
  S.tube([hc[0]+0.8,hc[1]+0.2],[hc[0]+2.6,hc[1]+1],mz,u=>2.4-0.3*u,(x,y)=>headPix(x,y));
  S.ellipse(mz[0]+0.4,mz[1]+0.2,1.9,1.8,(x,y)=>S.fur(x,y,'head',x-HXp,y-HYp,0));
  // forelock
  S.tube([hc[0]-1,hc[1]-2.8],[hc[0]+0.6,hc[1]-2.2],[hc[0]+1.4,hc[1]-0.6],u=>0.9,maneFn);
  // face
  S.eye(HXp,HYp-1,st.eyes,'m');
  S.put(HXp,HYp+2,SL.BLUSH,null); S.put(HXp+1,HYp+2,SL.BLUSH,null);
  S.put(Math.round(mz[0]+1),Math.round(mz[1]-0.6),SL.NOSE,null);
  S.put(Math.round(mz[0]),Math.round(mz[1]+1.4),SL.MOUTH,null); S.put(Math.round(mz[0]-1),Math.round(mz[1]+1.4),SL.MOUTH,null);
  // near legs on top
  drawLeg(0,cx+rx*0.5,false); drawLeg(1,cx-rx*0.55-0.5,false);
  // accessories
  if(cfg.neck==='collar'||cfg.neck==='bell'||cfg.neck==='bandana'){
    S.line(Math.round(nb[0]+1),Math.round(nb[1]-3+down*0.5),Math.round(nb[0]+3.4),Math.round(nb[1]-1+down*0.5),(x,y)=>{ if(S.filled(x,y)) S.put(x,y,cfg.neck==='bandana'?SL.ACC:SL.ACCD,null); });
    if(cfg.neck==='bell') S.put(Math.round(nb[0]+3),Math.round(nb[1]+down*0.5),SL.GOLD,null);
  }
  accessoriesSmall(S,cfg,HXp,HYp-1,2.8,st);
};
