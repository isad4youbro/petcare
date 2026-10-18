/* ===== Crocodile / caiman — blocky two-tone style (after the team's reference): no black outline,
   dark-green edges, orange belly, yellow side stripe, cream teeth ===== */
RIG_POSES.croc = {stand:{frames:12,fps:5}, walk:{frames:8,fps:8}, sit:{frames:12,fps:5}, sleep:{frames:8,fps:2}, jump:{frames:8,fps:9}};
RIGS.croc = function(S,P0,cfg,pose,f){
  S.noOutline=true;
  const p=Object.assign({snout:6},P0);
  const k8=f%8, k12=f%12;
  let low=0, eyes='open', jaw=0, tail=0, lift=[0,0,0,0], shift=[0,0,0,0];
  if(pose==='walk'){ const ph=k8%4; tail=[0,1,0,-1][ph];
    if(k8<2){ lift=[1,0,0,1]; shift=[1,0,0,1]; } else if(k8>=4&&k8<6){ lift=[0,1,1,0]; shift=[0,1,1,0]; } }
  else if(pose==='jump'){ jaw=[0,1,2,2,2,2,1,0][k8]; tail=k8%2?1:-1; eyes=jaw===2?'happy':'open'; }
  else if(pose==='sit'){ low=1; jaw=[0,0,0,0,1,2,2,1,0,0,0,0][k12]; if(jaw===2) eyes='closed'; }
  else if(pose==='sleep'){ low=1; eyes='closed'; }
  else { tail=[0,0,0,1,1,0,0,0,-1,-1,0,0][k12]; if(k12===10) eyes='closed'; }
  const G='G', D='D';
  const put=(x,y,c,part)=>{ y+=low; if(x<0||x>31||y<0||y>28) return;
    const key=`${part||'body'}:${x}:${y-low}`;
    if(c==='G') S.fur(x,y,part||'body',x,y-low,0,'B');
    else if(c==='D') S.put(x,y,SL.BD,key);
    else if(c==='L') S.put(x,y,SL.BL,key);
    else if(c==='O') S.put(x,y,SL.W,key);
    else if(c==='o') S.put(x,y,SL.WD,key);
    else if(c==='Y') S.put(x,y,SL.P,key);
    else S.put(x,y,c,key); };
  const row=(y,x0,x1,c,part)=>{ for(let x=x0;x<=x1;x++) put(x,y,c,part); };
  // ---- legs (far, darker) ----
  const leg=(x,id,far)=>{ const l=lift[id], s=shift[id], c=far?D:G, top=low?27:25;
    for(let y=top;y<=27-l;y++){ put(x+s,y,c,'leg'); put(x+1+s,y,c,'leg'); put(x+2+s,y,far?D:D,'leg'); }
    const fy=28-l; put(x-1+s,fy,c,'leg'); put(x+s,fy,D,'leg'); put(x+1+s,fy,c,'leg'); put(x+2+s,fy,D,'leg'); put(x+3+s,fy,c,'leg'); };
  if(!low){ leg(12,3,true); leg(17,2,true); }
  // ---- tail: tapering wedge to the left, tip sways ----
  const ty=(x)=>Math.round(21+(10-x)*0.45), by=(x)=>Math.round(26-(10-x)*0.18);
  for(let x=0;x<=10;x++){
    const t=x<=3?tail:(x<=6?Math.round(tail*0.5):0);
    const top=ty(x)+t, bot=Math.max(top+1,by(x)+t);
    for(let y=top;y<=bot;y++) put(x,y,y===top?D:(y===bot?D:(y===bot-1&&x>=4?'O':G)),'tail');
    if(x%2===0&&x>=2) put(x,top-1,D,'tail');
  }
  // ---- body ----
  for(let y=19;y<=26;y++) for(let x=9;x<=21;x++){
    if((y===19&&(x===9||x===21))||(y===26&&(x===9||x===21))) continue;
    let c=G;
    if(y===19||x===9) c=D;
    else if(y===26) c='o';
    else if(y>=24) c='O';
    else if(y===23) c='Y';
    else if(y===20&&(x%3===0)) c=D;
    put(x,y,c,'body');
  }
  for(let x=10;x<=20;x+=3){ put(x,18,D,'body'); put(x+1,18,D,'body'); } // scutes
  // ---- head ----
  const jy=jaw; // upper jaw lifts when the mouth opens
  for(let y=19;y<=24;y++) for(let x=20;x<=25;x++){ if(y===19&&x===20) continue;
    put(x,y-(y<=22?jy:0),y>=24?'O':(y===19?D:G),'head'); }
  // eye bump + eye
  row(16-jy,22,24,D,'head'); row(17-jy,21,25,G,'head'); row(18-jy,21,25,G,'head');
  if(eyes==='open'){ put(23,17-jy,SL.EYE); put(24,17-jy,SL.PUP); put(23,18-jy,SL.EYE); put(24,18-jy,SL.EYE); }
  else if(eyes==='happy'){ put(22,18-jy,D); put(23,17-jy,D); put(24,17-jy,D); put(25,18-jy,D); }
  else { put(22,18-jy,D); put(23,18-jy,D); put(24,18-jy,D); }
  // snout: two green rows, nostril bumps, dark mouth line with teeth, dark lower jaw
  const sx1=Math.min(31,25+p.snout);
  row(21-jy,26,sx1,G,'head'); row(22-jy,26,sx1,G,'head');
  put(sx1-1,20-jy,G,'head'); put(sx1,20-jy,D,'head'); put(sx1-3,20-jy,D,'head');
  if(jaw){ for(let j=1;j<=jaw;j++) row(23-j,22,sx1-1,SL.PINK); }
  row(23,21,sx1,D,'head');
  put(sx1-1,23,SL.FEET); put(sx1-5,23,SL.FEET); if(jaw) { put(sx1-3,22,SL.FEET); }
  row(24,22,sx1-1,D,'head');
  put(21,23-jy+ (jy?0:0),D,'head');
  // ---- near legs ----
  if(!low){ leg(10,1,false); leg(19,0,false); }
  else { row(28,9,12,G,'leg'); put(10,28,D,'leg'); row(28,19,22,G,'leg'); put(21,28,D,'leg'); }
  // accessories: simple collar / bow on the head
  if(cfg.neck==='collar'||cfg.neck==='bell'||cfg.neck==='bandana'){ for(let y=19;y<=24;y++) put(20,y,SL.ACC); if(cfg.neck==='bell') put(20,25,SL.GOLD); }
  if(cfg.head==='bow'){ put(21,15-jy,SL.ACC); put(23,15-jy,SL.ACC); put(22,15-jy,SL.ACCD); put(21,14-jy,SL.ACC); put(23,14-jy,SL.ACC); }
  if(cfg.head==='hat'){ row(15-jy,22,24,SL.ACC); row(14-jy,22,24,SL.ACCD); put(23,13-jy,SL.ACC); put(23,12-jy,SL.GOLD); }
  if(cfg.head==='flower'){ put(25,15-jy,SL.GOLD); put(24,15-jy,SL.ACC); put(26,15-jy,SL.ACC); put(25,14-jy,SL.ACC); }
};
