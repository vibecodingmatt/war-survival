import * as T from '../vendor/three.module.min.js';
import { Simulation } from './core/simulation.js?v=0.5.0';
import { createEnvironment } from './world/environment.js?v=0.5.0';
import { createArmies } from './entities/army.js?v=0.5.0';
import { createTargets } from './world/targets.js?v=0.5.0';
import { createEffects } from './systems/effects.js?v=0.5.0';
import { BattlefieldAudio } from './systems/audio.js?v=0.5.0';
import { BARRAGE_COOLDOWN, LIMITS, LEVELS } from '../data/waves.js?v=0.5.0';
import { clamp } from './core/math.js?v=0.5.0';
import { BOSS_TYPES } from '../data/campaign.js?v=0.5.0';
import { createProgress } from './core/progress.js?v=0.5.0';
import { POWERS } from '../data/powers.js?v=0.5.0';

const $=id=>document.getElementById(id);
const show=(id,visible=true)=>$(id).classList.toggle('hidden',!visible);
const audio=new BattlefieldAudio(),sim=new Simulation();
let renderer,scene,camera,environment,armies,effects,targets;
const coarsePointer=matchMedia('(pointer: coarse)');
let touchMode=coarsePointer.matches,quality=touchMode?'balanced':'high',qualityManual=false;
let previousTime=0,lastRenderTime=0,hudTime=0,accumulator=0,worldTime=0,shake=0,flash=0,bannerTime=0,calloutTime=0;
let frames=0,frameTotal=0,metrics={fps:0,calls:0,triangles:0},modal=null;
let manualTestClock=false;
const keys=new Set(),pointer={active:false,id:null,x:0,y:0,dx:0,dz:0};
const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isTouch=()=>touchMode;
function updateControls(touch=coarsePointer.matches){
  const changed=touchMode!==touch;touchMode=touch;
  document.documentElement.dataset.input=touch?'touch':'keyboard';
  document.documentElement.classList.toggle('touch-layout',touch||coarsePointer.matches);
  $('pause-button').title=touch?'Pause game':'Pause (Esc)';
  $('barrage-button').setAttribute('aria-label',touch?'Fire artillery barrage':'Fire artillery barrage (Space)');
  renderer?.domElement.setAttribute('aria-label',touch?'Battlefield. Drag to move and aim. Tap Artillery to strike.':'Battlefield. Use WASD or arrow keys to move; Space for artillery.');
  if(changed&&!qualityManual)applyQuality(touch||coarsePointer.matches?'balanced':'high');
}
function applyQuality(value){
  quality=value;$('quality-button').textContent='Graphics: '+(quality==='high'?'High':'Balanced');
  if(environment){
    environment.sun.shadow.mapSize.setScalar(quality==='high'?2048:1024);
    environment.sun.shadow.map?.dispose();environment.sun.shadow.map=null;
  }
  if(camera)resize();
}
const progress=createProgress();
let selectedLevel=progress.next;
const levelSelect=document.querySelector('.level-select');
levelSelect.replaceChildren();
for(let i=0;i<LEVELS.length;i++){
  const level=LEVELS[i],button=document.createElement('button');button.dataset.level=i;button.style.setProperty('--sector-color',level.world.accent);
  button.innerHTML='<span>'+String(i+1).padStart(2,'0')+'</span><strong>'+level.name+'</strong><small>'+level.difficulty+'</small>';
  button.setAttribute('aria-pressed',String(i===0));levelSelect.append(button);
}
function selectLevel(index){
  if(!progress.allowed(index))return false;
  selectedLevel=index;
  const level=LEVELS[index];
  document.querySelectorAll('[data-level]').forEach(button=>button.setAttribute('aria-pressed',String(Number(button.dataset.level)===index)));
  $('level-description').textContent=level.world.description+' · '+level.weapons.slice(1).map(w=>w.name).join(' → ');
  $('start-button').firstChild.textContent='DEPLOY LEVEL '+(index+1)+' ';
  document.querySelector('.brand small').textContent='LEVEL '+(index+1)+' · '+level.name;
  document.querySelector('.location-stamp small').textContent=level.world.description;
  if(sim.state==='menu'&&sim.level!==index){sim.reset(index);sim.preview();}
  environment?.setLevel(index);
}

function error(message) {
  show('loading',false);show('menu',false);$('error-message').textContent=message;show('error-panel');
}
function updateSound(){ $('sound-button').classList.toggle('muted',!audio.enabled);$('sound-button').setAttribute('aria-label',audio.enabled?'Mute sound':'Enable sound'); }
function clearInput(){
  keys.clear();const id=pointer.id;pointer.active=false;pointer.id=null;pointer.dx=pointer.dz=0;
  if(id!==null&&$('viewport').hasPointerCapture(id))$('viewport').releasePointerCapture(id);
  $('joystick').firstElementChild.style.transform='translate(0,0)';show('joystick',false);
}
function modalButtons(id){return [...$(id).querySelectorAll('button:not(:disabled)')].filter(button=>button.getClientRects().length);}
function openModal(id){modal=id;show(id);clearInput();modalButtons(id)[0]?.focus();}
function closeModal(id){show(id,false);if(modal===id)modal=null;}
function callout(text,duration=3.5){$('callout').textContent=text;calloutTime=duration;$('callout').classList.add('visible');}
function start(level=selectedLevel){
  if(!progress.allowed(level))return;
  selectLevel(level);audio.start().then(updateSound);sim.start(level);effects.reset();clearInput();
  for(const id of ['menu','pause-panel','result-panel'])closeModal(id);
  show('hud');show('wave-hud');show('pause-button');bannerTime=0;calloutTime=0;shake=0;flash=0;
  $('banner').classList.remove('visible');$('callout').classList.remove('visible');
  renderer.domElement.focus();accumulator=0;processEvents();updateHud();
}
function togglePause(){
  sim.pause();clearInput();
  if(sim.state==='paused')openModal('pause-panel');else{closeModal('pause-panel');renderer.domElement.focus();}
  updateHud();
}
function processEvents(){
  for(const e of sim.drainEvents()){
    effects.handle(e);audio.handle(e);
    if(e.type==='wave'){
      $('banner-kicker').textContent='LEVEL '+(sim.level+1)+' · WAVE '+String(e.index+1).padStart(2,'0')+' / 04';
      $('banner-title').textContent=e.name;$('banner-description').textContent=e.description;
      $('banner').classList.add('visible');bannerTime=3.2;
    }
    if(e.type==='barrage')callout('ARTILLERY INBOUND',2);
    if(['warning','regroup','supplyMissed','supply','powerup'].includes(e.type))callout(e.text,e.type==='powerup'?2.8:2);
    if(e.type==='recruit')callout('+'+e.amount+' SOLDIER'+(e.amount>1?'S':'')+' · '+sim.player.squad+' IN YOUR SQUAD',.8);
    if(e.type==='weapon'){callout(e.name+' UNLOCKED — NEW WEAPONS EQUIPPED',3.3);shake=Math.max(shake,.12);}
    if(e.type==='hurt'){flash=.6;shake=Math.max(shake,.12);}
    if(e.type==='bossImpact'){shake=Math.max(shake,.7);callout(e.amount+' SOLDIERS LAUNCHED · '+e.lost+' LOST',2.5);}
    if(e.type==='shieldBlock'){shake=Math.max(shake,.2);callout('AEGIS HELD · SQUAD PROTECTED',2);}
    if(e.type==='choiceTaken'||e.type==='choiceMissed')callout(e.text,2.6);
    if(e.type==='casualty')callout('−'+e.amount+' SOLDIER'+(e.amount>1?'S':'')+' · RECRUIT REINFORCEMENTS',2);
    if(e.type==='explosion')shake=Math.max(shake,e.friendly?.18:.28);
    if(e.type==='death'&&e.boss)shake=.65;
    if(e.type==='victory'||e.type==='defeat'){
      const won=e.type==='victory';
      if(won){progress.beat(sim.level);updateCompletions();}
      $('result-kicker').textContent=won?'LEVEL '+(sim.level+1)+' COMPLETE':'SQUAD OVERRUN';
      $('result-title').textContent=won?(sim.level===9&&progress.mask===1023?'The Borderlands are yours.':sim.level?'Sector secured.':'The crossing holds.'):'A stand worth remembering.';
      $('result-description').textContent=won?sim.levelData.bossName+' has fallen. '+sim.recruited+' recruited · '+sim.casualties+' lost · '+sim.powersTaken+' rift powers unleashed.':'The Legion broke through. Grow your squad, catch stronger guns, and choose rift powers between assaults. Keep the whole squad clear of a guardian’s swing.';
      const next=progress.allowed(sim.level+1)?sim.level+1:progress.next;
      $('next-level-button').dataset.next=next;
      $('next-level-button').firstChild.textContent='NEXT · '+LEVELS[next].name+' ';
      show('next-level-button',won&&(sim.level<LEVELS.length-1||progress.mask!==1023));
      $('result-kills').textContent=sim.kills;
      $('result-time').textContent=Math.floor(sim.time/60)+':'+String(Math.floor(sim.time%60)).padStart(2,'0');
      $('result-health').textContent=Math.ceil(sim.player.health);
      openModal('result-panel');show('pause-button',false);
    }
  }
}
function updateHud(){
  const p=sim.player;
  $('squad-count').textContent=p.squad;$('health-number').textContent=Math.ceil(p.health);
  $('health-fill').style.width=p.health+'%';$('health-fill').classList.toggle('low',p.health<35);
  $('weapon-name').textContent='MK '+['I','II','III','IV'][p.weaponLevel-1]+' · '+sim.weapon.name;
  const buffs=[];if(sim.shield>0)buffs.push('SHIELD '+Math.ceil(sim.shield));for(const [kind,seconds] of Object.entries(sim.buffs))if(seconds>0)buffs.push((POWERS[kind]?.name||kind.toUpperCase())+' '+Math.ceil(seconds)+'s');
  $('buff-status').textContent=buffs.join(' · ');show('buff-status',buffs.length>0);
  const choosing=!!sim.choice&&sim.state==='active';show('rift-banner',choosing);document.body.classList.toggle('rift-active',choosing);
  if(choosing){const options=sim.choice.options.map(o=>POWERS[o.kind]);$('rift-kicker').textContent='CHOOSE ONE · '+Math.ceil((20-sim.choice.z)/sim.choice.speed)+'s';$('rift-options').textContent=options[0].name+'  OR  '+options[1].name;$('rift-detail').textContent=options[1].detail+' · The other reward closes.';}
  $('kill-count').textContent=sim.kills;
  $('enemies-left').textContent=sim.enemies.length?sim.enemies.length+' enemies incoming':'Crossing secured';
  $('wave-label').innerHTML='WAVE '+String(sim.wave+1).padStart(2,'0')+' <span>/ 04</span>';
  [...$('wave-pips').children].forEach((pip,i)=>{pip.classList.toggle('complete',i<sim.wave);pip.classList.toggle('current',i===sim.wave);});
  const ready=sim.barrageCooldown<=0;
  $('barrage-button').disabled=!ready||sim.state!=='active'||!sim.enemies.length;
  $('barrage-status').textContent=ready?'BARRAGE READY':'RELOADING · '+Math.ceil(sim.barrageCooldown)+'s';
  $('barrage-fill').style.width=(1-sim.barrageCooldown/BARRAGE_COOLDOWN)*100+'%';
  const bosses=sim.enemies.filter(e=>e.type==='boss'),boss=bosses[0];show('boss-hud',!!boss&&sim.state!=='menu');
  if(boss){$('boss-fill').style.width=(bosses.reduce((n,e)=>n+e.hp,0)/(sim.bossMaxHp||boss.maxHp))*100+'%';document.querySelector('#boss-hud>span').textContent=bosses.length>1?bosses.length+' CHAMPIONS · '+bosses.map(e=>BOSS_TYPES[e.bossType].name).join(' + '):(boss.mini?'CHAMPION · ':'')+BOSS_TYPES[boss.bossType].name;}
}
function resize(){
  const portrait=innerWidth/innerHeight<.8;
  camera.aspect=innerWidth/innerHeight;
  camera.fov=(portrait?54:49)+(coarsePointer.matches?clamp((740-innerHeight)/180,0,1)*(portrait?12:18):0);
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(devicePixelRatio,quality==='high'?(coarsePointer.matches?1.4:1.6):1));renderer.setSize(innerWidth,innerHeight);
}
function inputState(){
  return {x:(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0)+pointer.dx,
    z:(keys.has('KeyS')||keys.has('ArrowDown')?1:0)-(keys.has('KeyW')||keys.has('ArrowUp')?1:0)+pointer.dz,
    barrage:keys.has('Space')};
}
function frame(timestamp){
  requestAnimationFrame(frame);
  // Keep high-refresh phones near 60 renders/sec; simulation still advances in fixed steps.
  const renderInterval=1000/60;
  if(coarsePointer.matches&&timestamp-lastRenderTime<renderInterval-.5)return;
  lastRenderTime=timestamp-((timestamp-lastRenderTime)%renderInterval);
  const dt=Math.min(.1,Math.max(0,(timestamp-previousTime)/1000));previousTime=timestamp;
  const animating=sim.state==='active'||sim.state==='menu'||sim.state==='victory'||sim.state==='defeat';
  if(animating)worldTime+=dt;
  if(sim.state==='active'&&!manualTestClock){
    accumulator+=dt;
    const input=inputState();
    while(accumulator>=1/60){sim.tick(1/60,input);accumulator-=1/60;}
  }else accumulator=0;
  if(sim.state==='victory'||sim.state==='defeat')sim.updateRemains(dt);
  processEvents();
  const visualDt=animating?dt:0;
  environment.update(worldTime,reducedMotion);armies.update(sim,worldTime);effects.update(sim,visualDt,worldTime,camera,reducedMotion);targets.update(sim,worldTime);
  if(bannerTime>0){bannerTime-=visualDt;if(bannerTime<=0)$('banner').classList.remove('visible');}
  if(calloutTime>0){calloutTime-=visualDt;if(calloutTime<=0)$('callout').classList.remove('visible');}
  shake=Math.max(0,shake-dt*.8);flash=Math.max(0,flash-dt*2);$('damage-flash').style.opacity=flash;
  const portrait=innerWidth/innerHeight<.8,menu=sim.state==='menu';
  const targetX=menu&&!portrait?-9:sim.player.x*.16;
  const targetY=portrait?29:25,targetZ=(portrait?44:38)+(sim.player.z-11)*.55;
  const smooth=1-Math.exp(-dt*3);
  camera.position.x+=(targetX-camera.position.x)*smooth;
  camera.position.y+=(targetY-camera.position.y)*smooth;camera.position.z+=(targetZ-camera.position.z)*smooth;
  const phoneFraming=coarsePointer.matches&&!menu?clamp(2+(820-innerHeight)*.029,2,portrait?10:14):0;
  camera.lookAt(menu&&!portrait?-8:sim.player.x*.08,1,(portrait?0:-3)+phoneFraming+(sim.player.z-11)*.25);
  if(!reducedMotion&&shake>0){camera.position.x+=Math.sin(worldTime*97)*shake*.22;camera.position.y+=Math.cos(worldTime*79)*shake*.22;}
  hudTime+=dt;if(hudTime>=.1){hudTime%=.1;updateHud();}
  renderer.render(scene,camera);
  frames++;frameTotal+=dt;
  if(frameTotal>=1){metrics={fps:Math.round(frames/frameTotal),calls:renderer.info.render.calls,triangles:renderer.info.render.triangles};frames=0;frameTotal=0;}
}
async function boot(){
  try{
    renderer=new T.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
    renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.18;
    renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
    renderer.domElement.tabIndex=-1;updateControls();
    $('viewport').append(renderer.domElement);
    renderer.domElement.addEventListener('webglcontextlost',event=>{event.preventDefault();if(sim.state==='active')sim.pause();error('The graphics connection was interrupted. Reload to return to Ashen Crossing.');});
    scene=new T.Scene();camera=new T.PerspectiveCamera(49,innerWidth/innerHeight,.3,450);camera.position.set(-9,25,38);
    environment=await createEnvironment(scene,renderer);armies=createArmies(scene);effects=createEffects(scene);targets=createTargets(scene);applyQuality(quality);updateSound();selectLevel(selectedLevel);updateCompletions();
    armies.update(sim,0);effects.update(sim,0,0);environment.update(0);targets.update(sim,0);
    await renderer.compileAsync(scene,camera);
    show('loading',false);show('menu');requestAnimationFrame(t=>{previousTime=t;frame(t);});
    if(new URLSearchParams(location.search).has('test')){
      window.__warTest={
        ready:true,snapshot:()=>({...sim.snapshot(),metrics}),
        useManualClock:()=>{manualTestClock=true;accumulator=0;},
        step:(seconds,input={})=>{for(let i=0;i<Math.round(seconds*60);i++){sim.tick(1/60,input);processEvents();}updateHud();return sim.snapshot();},
        place:(x,z)=>{sim.player.x=clamp(x,LIMITS.minX,LIMITS.maxX);sim.player.z=clamp(z,LIMITS.minZ,LIMITS.maxZ);},
        wave:index=>{sim.beginWave(clamp(index,0,3));processEvents();},
        damage:amount=>{sim.hurt(amount);},
        targets:()=>targets.snapshot(),
        world:()=>environment.snapshot(),
        spectacle:()=>effects.snapshot(),
        clear:()=>{for(const e of sim.enemies)sim.damage(e,e.hp+1,false);},
        renderer:()=>({...metrics,geometries:renderer.info.memory.geometries,textures:renderer.info.memory.textures,quality,pixelRatio:renderer.getPixelRatio(),shadowSize:environment.sun.shadow.mapSize.x}),
        controls:()=>({touch:touchMode,dragging:pointer.active,dx:pointer.dx,dz:pointer.dz,steerX:sim.steerX}),
        screenPoint:(x,y,z)=>{const p=new T.Vector3(x,y,z).project(camera);return {x:(p.x+1)*innerWidth/2,y:(1-p.y)*innerHeight/2};},
      };
    }
  }catch(e){console.error(e);error('The 3D battlefield could not load. Use a current browser with hardware acceleration and WebGL 2 enabled. Local play requires the included web server.');}
}
$('start-button').addEventListener('click',()=>start());$('replay-button').addEventListener('click',()=>start());$('restart-button').addEventListener('click',()=>start());
$('next-level-button').addEventListener('click',()=>start(Number($('next-level-button').dataset.next)));
function updateCompletions(){
  let cleared=0;
  for(const button of document.querySelectorAll('[data-level]')){
    const index=Number(button.dataset.level),complete=progress.completed(index),allowed=progress.allowed(index);
    button.disabled=!allowed;
    button.querySelector('small').textContent=complete?'COMPLETED ✓':allowed?'NEXT MISSION':'LOCKED · BEAT LEVEL '+(index);
    button.setAttribute('aria-label','Level '+(index+1)+': '+LEVELS[index].name+'. '+button.querySelector('small').textContent);
    if(complete)cleared++;
  }
  $('campaign-progress').textContent=cleared+' / '+LEVELS.length+' CLEARED';
}
document.querySelectorAll('[data-level]').forEach(button=>button.addEventListener('click',()=>selectLevel(Number(button.dataset.level))));
document.querySelectorAll('[data-menu]').forEach(button=>button.addEventListener('click',()=>{
  sim.reset(selectedLevel);sim.preview();effects.reset();clearInput();
  closeModal('pause-panel');closeModal('result-panel');show('hud',false);show('wave-hud',false);show('pause-button',false);show('menu');
  $('start-button').focus();
}));
$('sound-button').addEventListener('click',()=>{audio.toggle();audio.start().then(updateSound);updateSound();});
$('pause-button').addEventListener('click',togglePause);$('resume-button').addEventListener('click',togglePause);
function combatButton(button,action){
  let lastTouch=-Infinity;
  button.addEventListener('pointerdown',event=>{
    if(event.pointerType!=='touch'||button.disabled)return;
    lastTouch=performance.now();event.preventDefault();action();
  });
  for(const name of ['pointerup','pointercancel'])button.addEventListener(name,event=>{if(event.pointerType==='touch')lastTouch=performance.now();});
  button.addEventListener('click',event=>{
    // Secondary fingers do not reliably produce clicks; suppress the primary finger's follow-up click.
    if(event.pointerType==='touch'||(event.detail>0&&performance.now()-lastTouch<800))return;
    action();
  });
}
combatButton($('barrage-button'),()=>{sim.barrage();renderer.domElement.focus();});
$('quality-button').addEventListener('click',()=>{
  qualityManual=true;applyQuality(quality==='high'?'balanced':'high');
});
let layoutWidth=innerWidth,layoutHeight=innerHeight;
addEventListener('resize',()=>{
  const rotated=(layoutWidth>layoutHeight)!==(innerWidth>innerHeight);
  layoutWidth=innerWidth;layoutHeight=innerHeight;
  if(rotated){clearInput();sim.steerX=null;if(sim.state==='active')togglePause();}
  if(camera)resize();
});
coarsePointer.addEventListener('change',()=>{updateControls();if(camera)resize();});
document.addEventListener('pointerdown',event=>{if(event.pointerType==='touch')updateControls(true);else if(event.pointerType==='mouse'&&!coarsePointer.matches)updateControls(false);},{passive:true});
addEventListener('keydown',event=>{
  if(['Escape','Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','KeyW','KeyA','KeyS','KeyD','Digit1','Digit2','Digit3'].includes(event.code))updateControls(false);
  if(event.code==='Escape'&&!event.repeat){if(sim.state==='active'||sim.state==='paused')togglePause();return;}
  if(modal&&event.code==='Tab'){
    const buttons=modalButtons(modal),first=buttons[0],last=buttons.at(-1);
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
  }
  if(sim.state!=='active')return;
  if(event.code==='Space'&&!event.repeat)sim.barrage();
  if(['Digit1','Digit2','Digit3'].includes(event.code)){event.preventDefault();sim.selectLane(['recruits','enemies','weapons'][Number(event.code.slice(-1))-1]);return;}
  if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','KeyW','KeyA','KeyS','KeyD'].includes(event.code)){event.preventDefault();keys.add(event.code);}
});
addEventListener('keyup',event=>keys.delete(event.code));
addEventListener('blur',()=>{clearInput();if(sim.state==='active')togglePause();});
document.addEventListener('visibilitychange',()=>{if(document.hidden){clearInput();if(sim.state==='active')togglePause();}});
$('viewport').addEventListener('pointerdown',event=>{
  if(sim.state!=='active'||pointer.active||event.button>0)return;
  sim.steerX=null;keys.clear();
  pointer.active=true;pointer.id=event.pointerId;pointer.x=event.clientX;pointer.y=event.clientY;
  $('joystick').firstElementChild.style.transform='translate(0,0)';
  $('viewport').setPointerCapture(event.pointerId);$('joystick').style.left=event.clientX-47+'px';$('joystick').style.top=event.clientY-47+'px';show('joystick');
});
$('viewport').addEventListener('pointermove',event=>{
  if(!pointer.active||pointer.id!==event.pointerId)return;
  const x=event.clientX-pointer.x,z=event.clientY-pointer.y,distance=Math.hypot(x,z),deadZone=isTouch()?5:0,radius=isTouch()?54:48;
  const strength=distance>deadZone?Math.min(1,(distance-deadZone)/(radius-deadZone))/distance:0;
  pointer.dx=x*strength;pointer.dz=z*strength;
  $('joystick').firstElementChild.style.transform='translate('+pointer.dx*27+'px,'+pointer.dz*27+'px)';
});
for(const name of ['pointerup','pointercancel','lostpointercapture'])$('viewport').addEventListener(name,event=>{if(event.pointerId===pointer.id)clearInput();});
boot();
