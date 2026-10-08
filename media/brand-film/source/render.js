/* X-lab AI / 指数点亮 / Potential, amplified.
   Deterministic vector-based film renderer. 45 s, 30 fps, landscape + portrait.
   Uses only the supplied formal logo artwork. No generative redraws.
*/
const fs=require('fs');
const path=require('path');
const cp=require('child_process');
const {once}=require('events');
const moduleRoot=process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES;
function dep(name){try{return require(name)}catch(e){return require(path.join(moduleRoot,name))}}
const {createCanvas,loadImage,GlobalFonts}=dep('@napi-rs/canvas');
const sharp=dep('sharp');
const ROOT=path.resolve(__dirname,'..');
const mode=process.argv[2]||'landscape';
const preview=process.argv.includes('--preview');
const P=mode==='portrait';
const W=P?1080:1920,H=P?1920:1080,FPS=30,DURATION=45;
const C={dark:'#171A1F',green:'#9AD744',blue:'#07A1D7',light:'#F5F6F2',ink:'#242A2F',muted:'#727C82',line:'#E2E7DF'};
GlobalFonts.registerFromPath(path.join(ROOT,'fonts/SourceHanSansSC-Regular.otf'),'Han');
GlobalFonts.registerFromPath(path.join(ROOT,'fonts/NotoSans-Variable.ttf'),'Latin');
const imgs={},boxes={};
let ctx;
const clamp=(x,a=0,b=1)=>Math.min(b,Math.max(a,x));
const smooth=x=>{x=clamp(x);return x*x*(3-2*x)};
const ease=x=>1-Math.pow(1-clamp(x),3);
const lerp=(a,b,x)=>a+(b-a)*x;
const rgba=(c,a)=>{let n=parseInt(c.replace('#',''),16);return 'rgba('+((n>>16)&255)+','+((n>>8)&255)+','+(n&255)+','+clamp(a)+')'};
function alpha(a,fn){ctx.save();ctx.globalAlpha*=clamp(a);fn();ctx.restore()}
function txt(s,x,y,size,color,opts={}){
  ctx.save();ctx.font=(opts.en&&opts.bold?'700 ':'400 ')+size+'px '+(opts.en?'Latin':'Han');
  let width=ctx.measureText(s).width;
  if(opts.max&&width>opts.max){size*=opts.max/width;ctx.font=(opts.en&&opts.bold?'700 ':'400 ')+size+'px '+(opts.en?'Latin':'Han')}
  ctx.fillStyle=color;ctx.textAlign=opts.align||'left';ctx.textBaseline='alphabetic';ctx.fillText(s,x,y);ctx.restore();
}
function line(x1,y1,x2,y2,color,width=1){ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.lineWidth=width;ctx.strokeStyle=color;ctx.stroke()}
function round(x,y,w,h,r,fill,stroke=null){
 ctx.beginPath();ctx.roundRect(x,y,w,h,r);
 if(fill){ctx.fillStyle=fill;ctx.fill()}
 if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1.5;ctx.stroke()}
}
function fit(name,x,y,w,h,opacity=1){
 const im=imgs[name];if(!im)throw Error('Missing image '+name);
 const scale=Math.min(w/im.width,h/im.height),iw=im.width*scale,ih=im.height*scale;
 const box={x:x+(w-iw)/2,y:y+(h-ih)/2,w:iw,h:ih};
 alpha(opacity,()=>ctx.drawImage(im,box.x,box.y,box.w,box.h));
 return box;
}
const logo=(variant,tone='ColorDark')=>'XlabAI_'+variant+'_'+tone;
const bg={};
function createBackground(light){
 const c=createCanvas(W,H),b=c.getContext('2d');
 b.fillStyle=light?C.light:C.dark;b.fillRect(0,0,W,H);
 let g=b.createRadialGradient(W*.86,H*.1,0,W*.86,H*.1,Math.max(W,H)*.82);
 g.addColorStop(0,light?'rgba(154,215,68,.085)':'rgba(154,215,68,.035)');g.addColorStop(1,'rgba(154,215,68,0)');
 b.fillStyle=g;b.fillRect(0,0,W,H);
 g=b.createRadialGradient(W*.08,H*.97,0,W*.08,H*.97,Math.max(W,H)*.75);
 g.addColorStop(0,light?'rgba(7,161,215,.025)':'rgba(7,161,215,.035)');g.addColorStop(1,'rgba(7,161,215,0)');
 b.fillStyle=g;b.fillRect(0,0,W,H);
 return c;
}
function background(light=false){ctx.drawImage(light?bg.light:bg.dark,0,0)}
function corners(index,cn,en,light=false){
 const M=P?80:120,color=light?C.muted:'#9AA3A7';
 txt('X-lab AI',M,P?135:93,25,light?C.ink:'#DDE1E2',{en:true,bold:true});
 line(M,P?162:120,M+36,P?162:120,C.green,4);
 line(M+44,P?162:120,M+64,P?162:120,C.blue,4);
 txt(String(index).padStart(2,'0')+' / '+cn+'  '+en,W-M,P?135:93,P?22:21,color,{align:'right',max:W*.62});
}
function orbit(cx,cy,r,t,a=.2){
 for(let j=0;j<3;j++){
  ctx.beginPath();ctx.ellipse(cx,cy,r+j*36,(r+j*36)*.78,0,0,Math.PI*2);ctx.strokeStyle=rgba('#84929A',a*(.34-j*.08));ctx.lineWidth=1;ctx.stroke();
 }
 let an=t*.23-.9;
 const x=cx+Math.cos(an)*r,y=cy+Math.sin(an)*r*.78;
 ctx.beginPath();ctx.arc(x,y,4,0,Math.PI*2);ctx.fillStyle=rgba(C.green,a);ctx.fill();
}
function chapterTitle(cn,en,local,light=true){
 const M=P?80:120,a=ease((local-.25)/.8),off=(1-a)*24;
 alpha(a,()=>{
   txt(cn,M,(P?300:226)+off,P?56:58,light?C.ink:'#F4F5F1',{max:W-2*M});
   txt(en,M,(P?365:283)+off,P?32:32,light?C.muted:'#AEB7BC',{en:true,max:W-2*M});
 });
}
function sceneIgnition(t){
 background();corners(1,'点亮','IGNITE');
 const cx=P?W/2:480,cy=P?755:526,sw=P?460:440,sh=sw*636/536;
 orbit(cx,cy,P?338:325,t,.45);
 const b={x:cx-sw/2,y:cy-sh/2,w:sw,h:sh};
 const im=imgs[logo('Symbol')];
 // Reveal the existing artwork through soft, staggered horizontal bands.
 for(let j=0;j<12;j++){
   const reveal=ease((t-.15-j*.12)/.84),row=sh/12;
   if(!reveal)continue;
   ctx.save();ctx.beginPath();ctx.rect(b.x,b.y+j*row,b.w*reveal,row+.3);ctx.clip();
   ctx.globalAlpha=reveal;ctx.drawImage(im,b.x,b.y,b.w,b.h);ctx.restore();
 }
 const a=ease((t-.75)/1.05);
 alpha(a,()=>{
  if(P){
   txt('指数点亮',W/2,1195+(1-a)*26,88,'#F5F7F0',{align:'center'});
   txt('Potential, amplified.',W/2,1276+(1-a)*26,42,'#B0B9BB',{en:true,align:'center'});
   line(W/2-54,1346,W/2+54,1346,C.green,3);
  }else{
   txt('指数点亮',910,500+(1-a)*22,100,'#F5F7F0');
   txt('Potential, amplified.',914,587+(1-a)*22,45,'#B0B9BB',{en:true});
   line(918,650,1040,650,C.green,3);
  }
 });
 alpha(ease((t-2.3)/.8),()=>txt('品牌短片 / BRAND FILM',P?W/2:918,P?1455:767,P?25:23,'#78878C',{align:P?'center':'left',en:false}));
}
function sceneExponent(t){
 background();corners(2,'指数','EXPONENT');
 const v=P?'Vertical':'Horizontal';
 const area=P?{x:145,y:320,w:790,h:900}:{x:245,y:175,w:1430,h:620};
 const zoom=lerp(.965,1.018,smooth(t/7.5));
 area.x+=area.w*(1-zoom)/2;area.y+=area.h*(1-zoom)/2;area.w*=zoom;area.h*=zoom;
 const a=ease((t-.18)/.75);
 const dy=(1-a)*26;
 const b=fit(v+'_base',area.x,area.y+dy,area.w,area.h,a);
 const ai=ease((t-1.2)/1.0);
 fit(v+'_ai',area.x,area.y+dy,area.w,area.h,ai);
 const r=boxes[v+'_ai'];
 if(r&&t>1.25&&t<4.5){
   let intensity=Math.sin(clamp((t-1.25)/3.25)*Math.PI)*.65;
   const im=imgs[v+'_ai'],sx=b.w/im.width,sy=b.h/im.height;
   const x=b.x+r.left*sx,y=b.y+r.top*sy,w=r.width*sx,h=r.height*sy,k=18+(1-intensity)*18;
   let col=rgba(C.green,intensity);
   line(x-k,y-k,x+20,y-k,col,2);line(x-k,y-k,x-k,y+15,col,2);
   line(x+w+k,y+h+k,x+w-15,y+h+k,col,2);line(x+w+k,y+h+k,x+w+k,y+h-15,col,2);
 }
 alpha(ease((t-1.7)/.9),()=>{
   txt('一个新的指数',W/2,P?1450:864,P?67:62,'#F4F6F0',{align:'center'});
   txt('A new exponent.',W/2,P?1530:930,P?39:34,'#AEB8BB',{en:true,align:'center'});
 });
}
function sceneIdea(t){
 background(true);corners(3,'理念','IDEA',true);
 const a=ease((t-.25)/.85);
 alpha(a,()=>{
  if(P){
   txt('让 AI 成为',W/2,630+(1-a)*30,83,C.ink,{align:'center'});
   txt('认知升级的',W/2,754+(1-a)*30,83,C.ink,{align:'center'});
   txt('「指数」',W/2,916+(1-a)*30,118,'#5B8624',{align:'center'});
   txt('AI, the exponent',W/2,1100,44,C.muted,{align:'center',en:true});
   txt('of cognitive growth.',W/2,1162,44,C.muted,{align:'center',en:true});
  }else{
   txt('让 AI 成为',W/2,368+(1-a)*25,72,C.ink,{align:'center'});
   txt('认知升级的「指数」',W/2,514+(1-a)*25,102,C.ink,{align:'center'});
   line(W/2-475,552,W/2-475+950*ease((t-.9)/1.3),552,rgba(C.green,.65),6);
   txt('AI, the exponent of cognitive growth.',W/2,640,45,C.muted,{align:'center',en:true});
  }
 });
 const words=[['开放','OPENNESS'],['协同','COLLABORATION'],['探索','EXPLORATION']];
 for(let i=0;i<3;i++){
  const p=ease((t-1.65-i*.65)/.8);
  const x=P?180+i*360:510+i*450,y=P?1470:832;
  alpha(p,()=>{
   ctx.beginPath();ctx.arc(x,y-68+(1-p)*18,5,0,Math.PI*2);ctx.fillStyle=i===1?C.blue:'#759F36';ctx.fill();
   txt(words[i][0],x,y+(1-p)*18,P?41:39,C.ink,{align:'center'});
   txt(words[i][1],x,y+50+(1-p)*18,P?21:22,C.muted,{align:'center',en:true,max:P?300:400});
  });
 }
}
const variants=[
 ['Horizontal','横版组合','HORIZONTAL'],
 ['Vertical','竖版组合','VERTICAL'],
 ['WordmarkBilingual','双语字标','BILINGUAL WORDMARK'],
 ['WordmarkCompact','紧凑字标','COMPACT WORDMARK'],
 ['Symbol','独立图标','SYMBOL']
];
function structureCard(v,x,y,w,h,a){
 alpha(a,()=>{
  y+=(1-a)*35;
  round(x,y,w,h,18,'#FFFFFF','#E1E6DE');
  fit(logo(v[0],'ColorLight'),x+12,y+16,w-24,h-98);
  txt(v[1],x+w/2,y+h-53,P?27:27,C.ink,{align:'center'});
  txt(v[2],x+w/2,y+h-22,P?18:17,C.muted,{en:true,align:'center',max:w-28});
 });
}
function sceneSystem(t){
 background(true);corners(4,'系统','SYSTEM',true);
 if(t<5){
  chapterTitle('一套系统，多种表达','One identity. Many expressions.',t);
  if(P){
   for(let i=0;i<5;i++){
    let x=i<4?(80+(i%2)*470):315,y=i<4?(500+Math.floor(i/2)*400):1300;
    structureCard(variants[i],x,y,450,350,ease((t-.55-i*.18)/.7));
   }
  }else{
   for(let i=0;i<5;i++)structureCard(variants[i],120+i*342,400+5*Math.sin(t*.8+i*.7),312,430,ease((t-.5-i*.18)/.7));
  }
 }else{
  const u=t-5;
  chapterTitle('五种结构 · 四种配色','5 layouts. 4 colorways.',u+.3);
  const colors=[
   ['ColorLight','浅底彩色','LIGHT', '#FFFFFF', C.ink],
   ['ColorDark','深底彩色','DARK',C.dark,'#F2F4F0'],
   ['MonoBlack','纯黑单色','BLACK','#FFFFFF',C.ink],
   ['MonoWhite','纯白反白','WHITE',C.dark,'#F2F4F0']
  ];
  colors.forEach((v,i)=>{
   const x=P?80+(i%2)*470:120+(i%2)*870;
   const y=P?525+Math.floor(i/2)*480:375+Math.floor(i/2)*284;
   const w=P?450:810,h=P?410:248;
   const a=ease((u-.08-i*.12)/.6);
   alpha(a,()=>{
    round(x,y+(1-a)*20,w,h,16,v[3],v[3]==='#FFFFFF'?'#E1E6DE':null);
    fit(logo('Horizontal',v[0]),x+20,y+15+(1-a)*20,w-40,h-93);
    txt(v[1]+' / '+v[2],x+w/2,y+h-35+(1-a)*20,P?25:25,v[4],{align:'center',max:w-25});
   });
  });
  alpha(ease((u-.6)/.7),()=>txt('20 个正式配置 / 20 FORMAL VARIANTS',W/2,P?1620:1010,P?27:24,C.muted,{align:'center'}));
 }
}
function phone(x,y,w,h,a=1){
 alpha(a,()=>{
  round(x-5,y+8,w+10,h+10,48,'rgba(28,35,40,.06)');
  round(x,y,w,h,45,'#FFFFFF','#CFD7D8');
  round(x+13,y+13,w-26,h-26,35,'#F4F6F2');
  round(x+w*.37,y+24,w*.26,9,5,'#C7CED0');
  const s=w*.40;
  ctx.save();ctx.beginPath();ctx.arc(x+w/2,y+h*.29,s/2,0,Math.PI*2);ctx.clip();
  ctx.drawImage(imgs['XlabAI_Avatar_ColorLight_1024'],x+w/2-s/2,y+h*.29-s/2,s,s);ctx.restore();
  txt('X-lab AI',x+w/2,y+h*.48,w*.108,C.ink,{align:'center',en:true,bold:true});
  txt('开放实验室',x+w/2,y+h*.55,w*.079,C.ink,{align:'center'});
  txt('OPEN LAB',x+w/2,y+h*.602,w*.055,C.muted,{align:'center',en:true});
  for(let i=0;i<4;i++)round(x+w*.17,y+h*.71+i*h*.045,w*(i===3?.40:.66),5,2,'#DCE2DA');
  round(x+w*.33,y+h-28,w*.34,6,3,'#B7C2C4');
 });
}
function browser(x,y,w,h,a=1){
 alpha(a,()=>{
  round(x,y+10,w,h,15,'rgba(28,35,40,.06)');
  round(x,y,w,h,15,'#FFFFFF','#D6DEDD');
  round(x,y,w,43,15,'#E8ECE7');
  ctx.fillStyle='#E8ECE7';ctx.fillRect(x,y+22,w,21);
  for(let i=0;i<3;i++){ctx.beginPath();ctx.arc(x+25+i*18,y+22,4,0,Math.PI*2);ctx.fillStyle='#B5C0BE';ctx.fill()}
  round(x+w*.21,y+11,w*.58,23,7,'#F7F9F5');
  txt('X-lab AI',x+w/2,y+28,14,'#7B8789',{align:'center',en:true});
  fit(logo('Horizontal','ColorLight'),x+w*.07,y+h*.15,w*.55,h*.36);
  txt('开放 · 协同 · 探索',x+w*.105,y+h*.63,w*.045,C.ink,{max:w*.82});
  txt('Open. Collaborate. Explore.',x+w*.105,y+h*.74,w*.03,C.muted,{en:true});
  for(let i=0;i<3;i++)round(x+w*(.105+i*.276),y+h*.84,w*.22,h*.055,5,i===0?'#DFEACD':'#E9EEEA');
 });
}
function slide(x,y,w,h,a=1){
 alpha(a,()=>{
  round(x,y+10,w,h,14,'rgba(28,35,40,.08)');
  round(x,y,w,h,14,C.dark);
  fit(logo('Horizontal'),x+w*.06,y+h*.03,w*.52,h*.36);
  txt('认知升级',x+w*.085,y+h*.66,w*.095,'#F1F5ED',{max:w*.8});
  txt('EXPAND UNDERSTANDING',x+w*.09,y+h*.82,w*.041,'#A9B5B8',{en:true,max:w*.83});
  line(x+w*.80,y+h*.14,x+w*.88,y+h*.14,C.green,4);
 });
}
function sceneApplications(t){
 background(true);corners(5,'应用','APPLICATIONS',true);
 chapterTitle('在每个场景，保持一致','Consistent, wherever you are.',t);
 if(!P){
  const a=ease((t-.5)/.8);
  phone(145,380+(1-a)*35,305,470,a);
  browser(550,375+(1-a)*45,720,452,ease((t-.8)/.9));
  slide(1360,425+(1-a)*55,420,294,ease((t-1.1)/.9));
  alpha(a,()=>{
   txt('头像 / PROFILE',297,930,27,C.muted,{align:'center'});
   txt('网页 / WEB',910,930,27,C.muted,{align:'center'});
   txt('演示 / PRESENTATIONS',1570,930,27,C.muted,{align:'center'});
  });
 }else{
  const idx=Math.min(2,Math.floor(t/2.5)),u=t-idx*2.5,a=ease((u-.08)/.55),dy=(1-a)*45;
  if(idx===1&&a<1)phone(280,590-a*45,520,810,1-a);
  if(idx===2&&a<1)browser(80,760-a*45,920,610,1-a);
  if(idx===0)phone(280,590+dy,520,810,a);
  if(idx===1)browser(80,760+dy,920,610,a);
  if(idx===2)slide(80,770+dy,920,610,a);
  const labs=[['头像','PROFILE'],['网页','WEB'],['演示','PRESENTATIONS']];
  labs.forEach((v,i)=>{
   const xx=190+i*350;
   txt(v[0],xx,1580,34,i===idx?C.ink:'#A0AAA8',{align:'center'});
   txt(v[1],xx,1625,23,i===idx?C.muted:'#ADB6B2',{align:'center',en:true,max:320});
   if(i===idx)line(xx-40,1660,xx+40,1660,C.green,4);
  });
 }
 alpha(ease((t-1)/.8),()=>txt('应用示意 / APPLICATION CONCEPTS',W/2,P?1785:1010,P?23:20,'#89938F',{align:'center'}));
}
function drawQr(x,y,size,a){
 alpha(a,()=>{
  round(x-8,y-8,size+16,size+16,12,'#FFFFFF');
  ctx.save();ctx.imageSmoothingEnabled=false;ctx.drawImage(imgs.repository_qr,x,y,size,size);ctx.restore();
 });
}
function sceneInvitation(t){
 background();corners(6,'共创','TOGETHER');
 const a=ease((t-.2)/.75),qa=ease((t-.85)/.55);
 if(P){
  fit(logo('Vertical'),170,235+(1-a)*22,740,765,a);
  alpha(a,()=>{
   txt('以开放连接智慧',W/2,1120,49,'#F0F3EE',{align:'center'});
   txt('以 AI 拓展认知',W/2,1190,49,'#F0F3EE',{align:'center'});
   txt('Connect minds through openness.',W/2,1260,29,'#A6B2B6',{align:'center',en:true});
   txt('Expand horizons with AI.',W/2,1306,29,'#A6B2B6',{align:'center',en:true});
  });
  drawQr(410,1412,260,qa);
  alpha(qa,()=>{
   txt('获取品牌资源 · 欢迎反馈',W/2,1733,32,'#DCE4DD',{align:'center'});
   txt('Get the assets. Share your feedback.',W/2,1781,27,'#A7B3B5',{align:'center',en:true});
  });
 }else{
  fit(logo('Horizontal'),120,215+(1-a)*20,1130,520,a);
  alpha(a,()=>{
   txt('以开放连接智慧，以 AI 拓展认知。',710,800,43,'#F0F3EE',{align:'center'});
   txt('Connect minds through openness. Expand horizons with AI.',710,861,29,'#A7B3B5',{align:'center',en:true,max:1210});
  });
  drawQr(1443,350,270,qa);
  alpha(qa,()=>{
   txt('获取品牌资源',1578,698,36,'#E1E8E0',{align:'center'});
   txt('Get the brand assets',1578,749,26,'#A7B3B5',{align:'center',en:true});
   txt('欢迎通过 Issue 反馈',1578,814,29,'#D3DCD3',{align:'center'});
   txt('Share feedback via Issues',1578,858,23,'#A7B3B5',{align:'center',en:true});
  });
 }
 alpha(qa,()=>txt('github.com/X-lab2017/xlab-ai-brand',W/2,P?1858:1005,P?21:24,'#8E9D9F',{align:'center',en:true}));
}
const STARTS=[0,5,12.5,20,30,37.5];
const SCENES=[sceneIgnition,sceneExponent,sceneIdea,sceneSystem,sceneApplications,sceneInvitation];
const frames=[createCanvas(W,H),createCanvas(W,H)];
const finalCanvas=createCanvas(W,H),final=finalCanvas.getContext('2d');
function renderScene(index,t,canvas){
 ctx=canvas.getContext('2d');ctx.globalAlpha=1;ctx.clearRect(0,0,W,H);SCENES[index](Math.max(0,t));
}
function render(t){
 let i=STARTS.length-1;while(i>0&&t<STARTS[i])i--;
 const local=t-STARTS[i];
 renderScene(i,local,frames[0]);
 final.globalAlpha=1;
 if(i>0&&local<.45){
  renderScene(i-1,STARTS[i]-STARTS[i-1]-.01,frames[1]);
  final.drawImage(frames[1],0,0);final.globalAlpha=smooth(local/.45);final.drawImage(frames[0],0,0);final.globalAlpha=1;
 }else final.drawImage(frames[0],0,0);
 return finalCanvas;
}
async function load(){
 const folder=path.join(ROOT,'assets');
 for(const file of fs.readdirSync(folder).filter(f=>/\.(svg|png)$/.test(f))){
  const key=path.parse(file).name;
  let buffer;
  if(file.endsWith('.svg')){
   buffer=await sharp(path.join(folder,file),{density:160}).resize({width:2200,height:2200,fit:'inside'}).png().toBuffer();
  }else buffer=fs.readFileSync(path.join(folder,file));
  imgs[key]=await loadImage(buffer);
  if(key.endsWith('_ai')){
   const {data,info}=await sharp(buffer).ensureAlpha().raw().toBuffer({resolveWithObject:true});
   let left=info.width,top=info.height,right=0,bottom=0;
   for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++){
    if(data[(y*info.width+x)*4+3]>8){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y)}
   }
   boxes[key]={left,top,width:right-left+1,height:bottom-top+1};
  }
 }
 bg.dark=createBackground(false);bg.light=createBackground(true);
}
async function main(){
 await load();
 const output=path.join(ROOT,'output');
 fs.mkdirSync(output,{recursive:true});
 fs.mkdirSync(path.join(ROOT,'previews'),{recursive:true});
 if(preview){
  const times=[3.2,9,16.2,22.8,27.8,34.1,41.5];
  for(const t of times){
   fs.writeFileSync(path.join(ROOT,'previews',mode+'_'+t.toFixed(1)+'.png'),render(t).toBuffer('image/png'));
  }
  console.log(JSON.stringify({mode,preview_frames:times,width:W,height:H}));return;
 }
 const filename=P?'Xlab_AI_指数点亮_竖版_1080x1920.mp4':'Xlab_AI_指数点亮_横版_1920x1080.mp4';
 const outfile=path.join(output,filename);
 const ff=cp.spawn('ffmpeg',['-hide_banner','-loglevel','warning','-y','-f','rawvideo','-pixel_format','rgba','-video_size',W+'x'+H,'-framerate',String(FPS),'-i','pipe:0','-i',path.join(ROOT,'assets/music_master.wav'),'-map','0:v:0','-map','1:a:0','-c:v','libx264','-preset','fast','-crf','18','-pix_fmt','yuv420p','-r',String(FPS),'-c:a','aac','-b:a','192k','-ar','48000','-t',String(DURATION),'-movflags','+faststart','-metadata','title=指数点亮 | X-lab AI','-metadata','comment=45-second bilingual brand film. Original instrumental cue. No voice-over.',outfile],{stdio:['pipe','ignore','pipe']});
 ff.stderr.on('data',d=>process.stderr.write(d));
 let failure=null;ff.stdin.on('error',e=>failure=e);
 const started=Date.now();
 for(let n=0;n<DURATION*FPS;n++){
  if(failure)throw failure;
  const buffer=render(n/FPS).data();
  if(!ff.stdin.write(buffer))await once(ff.stdin,'drain');
  if(n%150===0)console.log(JSON.stringify({mode,seconds:n/FPS,total:DURATION,elapsed:Math.round((Date.now()-started)/1000)}));
 }
 ff.stdin.end();
 const [code]=await once(ff,'close');
 if(code!==0)throw Error('ffmpeg failed: '+code);
 console.log(JSON.stringify({completed:outfile,bytes:fs.statSync(outfile).size,elapsed_seconds:(Date.now()-started)/1000}));
}
main().catch(e=>{console.error(e);process.exit(1)});

