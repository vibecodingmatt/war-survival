import * as T from '../vendor/three.module.min.js';
import { Simulation } from './core/simulation.js';
import { createEnvironment } from './world/environment.js';
import { createArmies } from './entities/army.js';
import { createTargets } from './world/targets.js';
import { createEffects } from './systems/effects.js';
import { BattlefieldAudio } from './systems/audio.js';
import { BARRAGE_COOLDOWN, WEAPONS, LIMITS, MAX_SQUAD, LEVELS, SUPPLY_EXIT } from '../data/waves.js';
import { clamp } from './core/math.js';

const $=id=>document.getElementById(id);
const show=(id,visible=true)=>$(id).classList.toggle('hidden',!visible);
const audio=new BattlefieldAudio(),sim=new Simulation();
let renderer,scene,camera,environment,armies,effects,targets;
const coarsePointer=matchMedia('(pointer: coarse)');
let touchMode=coarsePointer.matches,quality=touchMode?'balanced':'high',qualityManual=false;
let previousTime=0,lastRenderTime=0,hudTime=0,accumulator=0,worldTime=0,shake=0,flash=0,bannerTime=0,calloutTime=0;
let frames=0,frameTotal=0,metrics={fps:0,calls:0,triangles:0},modal=null;
const keys=new Set(),pointer={active:false,id:null,x:0,y:0,dx:0,dz:0};
const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isTouch=()=>touchMode;
function updateControls(touch=coarsePointer.matches){
  const changed=touchMode!==touch;touchMode=touch;
  document.documentElement.dataset.input=touch?'touch':'keyboard';
  document.documentElement.classList.toggle('touch-layout',touch||coarsePointer.matches);
  $('control-hint').textContent=touch?'DRAG TO MOVE · TAP A LANE TO AIM':'WASD / ARROWS · MOVE     1 / 2 / 3 · AIM     SPACE · ARTILLERY     ESC · PAUSE';
  $('pause-button').title=touch?'Pause game':'Pause (Esc)';
  const weaponButton=document.querySelector('[data-lane="weapons"]');
  weaponButton.setAttribute('aria-label',touch?'Right lane: shoot for weapon upgrades':'Shoot right for weapon upgrades (3)');
  weaponButton.setAttribute('aria-describedby',touch?'weapon-lane-name weapon-lane-status':'next-weapon weapon-remaining weapon-deadline');
  $('barrage-button').setAttribute('aria-label',touch?'Fire artillery barrage':'Fire artillery barrage (Space)');
  renderer?.domElement.setAttribute('aria-label',touch?'Battlefield. Drag to move. Tap a lane to aim. Tap Artillery to strike.':'Battlefield. Use WASD or arrow keys to move; Space for artillery.');
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
let selectedLevel=0;
function selectLevel(index){
  selectedLevel=index;
  const level=LEVELS[index];
  document.querySelectorAll('[data-level]').forEach(button=>button.setAttribute('aria-pressed',String(Number(button.dataset.level)===index)));
  $('level-description').textContent=level.subtitle+' · Fresh squad';
  $('start-button').firstChild.textContent='DEPLOY LEVEL '+(index+1)+' ';
  document.querySelector('.brand small').textContent='LEVEL '+(index+1)+' · '+level.name;
  document.querySelector('.location-stamp small').textContent=level.name+' · '+(index?'DUSK':'DAWN');
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
    if(e.type==='warning'||e.type==='regroup'||e.type==='supplyMissed')callout(e.text);
    if(e.type==='recruit')callout('+1 SOLDIER · '+sim.player.squad+' IN YOUR SQUAD',1.1);
    if(e.type==='weapon'){callout(e.name+' UNLOCKED — NEW WEAPONS EQUIPPED',3.3);shake=Math.max(shake,.12);}
    if(e.type==='hurt'){flash=.6;shake=Math.max(shake,.12);}
    if(e.type==='casualty')callout('−'+e.amount+' SOLDIER'+(e.amount>1?'S':'')+' · RECRUIT REINFORCEMENTS',2);
    if(e.type==='explosion')shake=Math.max(shake,e.friendly?.18:.28);
    if(e.type==='death'&&e.boss)shake=.65;
    if(e.type==='victory'||e.type==='defeat'){
      const won=e.type==='victory';
      $('result-kicker').textContent=won?'LEVEL '+(sim.level+1)+' COMPLETE':'SQUAD OVERRUN';
      $('result-title').textContent=won?(sim.level?'The gate is yours.':'The crossing holds.'):'A stand worth remembering.';
      $('result-description').textContent=won?sim.levelData.bossName+' has fallen. '+sim.recruited+' recruited · '+sim.casualties+' lost · '+WEAPONS[sim.player.weaponLevel-1].name+'.':'The Legion broke through. Catch +1 bursts on the left and finish moving weapon goals before they pass. Return to the center before enemies get close.';
      show('next-level-button',won&&sim.level<LEVELS.length-1);
      if(won){try{localStorage.setItem('war-survival-level-'+(sim.level+1),'complete');}catch{}updateCompletions();}
      $('result-kills').textContent=sim.kills;
      $('result-time').textContent=Math.floor(sim.time/60)+':'+String(Math.floor(sim.time%60)).padStart(2,'0');
      $('result-health').textContent=Math.ceil(sim.player.health);
      openModal('result-panel');show('pause-button',false);
    }
  }
}
function updateHud(){
  const p=sim.player,compactTouch=isTouch()&&innerWidth>innerHeight&&innerWidth<=700;
  $('squad-count').textContent=p.squad;$('health-number').textContent=Math.ceil(p.health);
  $('health-fill').style.width=p.health+'%';$('health-fill').classList.toggle('low',p.health<35);
  $('weapon-name').textContent='MK '+['I','II','III','IV'][p.weaponLevel-1]+' · '+WEAPONS[p.weaponLevel-1].name;
  document.querySelectorAll('[data-lane]').forEach(button=>{
    button.classList.toggle('active',button.dataset.lane===sim.focus);
    button.setAttribute('aria-pressed',String(button.dataset.lane===sim.focus));
  });
  document.querySelector('[data-lane="recruits"] small').textContent=p.squad>=MAX_SQUAD?(compactTouch?'FULL · ':'SQUAD FULL · ')+MAX_SQUAD:sim.recruits.length?(compactTouch?'LEFT':'SHOOT LEFT'):(compactTouch?'IN ':'NEXT BURST · ')+Math.ceil(sim.recruitTimer)+'s';
  document.querySelector('[data-lane="enemies"] small').textContent=compactTouch?'CENTER':'SHOOT CENTER';
  document.querySelector('[data-lane="weapons"] small').textContent=sim.armory?(compactTouch?'RIGHT':'SHOOT RIGHT'):p.weaponLevel===WEAPONS.length?(compactTouch?'MAXED':'FULLY UPGRADED'):(compactTouch?'IN ':'INBOUND · ')+Math.ceil(sim.weaponTimer)+'s';
  const target=sim.armory;
  $('next-weapon').textContent=WEAPONS[p.weaponLevel]?.name||'MAX FIREPOWER';
  $('weapon-remaining').textContent=target?Math.ceil(target.hp).toLocaleString()+' damage to unlock':p.weaponLevel===WEAPONS.length?'ALL WEAPONS EQUIPPED':'Next goal approaching';
  const remaining=target?(SUPPLY_EXIT-target.z)/sim.levelData.weaponSpeed:0;
  $('weapon-deadline').textContent=target?'PASSES IN '+Math.ceil(remaining)+'s':p.weaponLevel===WEAPONS.length?'': 'ARRIVES IN '+Math.ceil(sim.weaponTimer)+'s';
  $('weapon-deadline').classList.toggle('urgent',!!target&&remaining<=5);
  const progress=(target?(1-target.hp/target.maxHp)*100:p.weaponLevel===WEAPONS.length?100:0)+'%';
  $('weapon-progress').style.width=progress;
  $('weapon-lane-name').textContent=p.weaponLevel===3?'CANNON':WEAPONS[p.weaponLevel]?.name||'MAXED';
  $('weapon-lane-status').textContent=target?Math.ceil(target.hp).toLocaleString()+(compactTouch?' · ':' HP · ')+Math.ceil(remaining)+'s':p.weaponLevel===WEAPONS.length?'EQUIPPED':'IN '+Math.ceil(sim.weaponTimer)+'s';
  $('weapon-lane-status').classList.toggle('urgent',!!target&&remaining<=5);
  $('weapon-lane-progress').style.width=progress;
  $('kill-count').textContent=sim.kills;
  $('enemies-left').textContent=sim.enemies.length?sim.enemies.length+' enemies incoming':'Crossing secured';
  $('wave-label').innerHTML='WAVE '+String(sim.wave+1).padStart(2,'0')+' <span>/ 04</span>';
  [...$('wave-pips').children].forEach((pip,i)=>{pip.classList.toggle('complete',i<sim.wave);pip.classList.toggle('current',i===sim.wave);});
  const ready=sim.barrageCooldown<=0;
  $('barrage-button').disabled=!ready||sim.state!=='active'||!sim.enemies.length;
  $('barrage-status').textContent=ready?'BARRAGE READY':'RELOADING · '+Math.ceil(sim.barrageCooldown)+'s';
  $('barrage-fill').style.width=(1-sim.barrageCooldown/BARRAGE_COOLDOWN)*100+'%';
  const boss=sim.enemies.find(e=>e.type==='boss');show('boss-hud',!!boss&&sim.state!=='menu');
  if(boss){$('boss-fill').style.width=(boss.hp/boss.maxHp)*100+'%';document.querySelector('#boss-hud>span').textContent=sim.levelData.bossName;}
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
  const animating=sim.state==='active'||sim.state==='menu'||sim.state==='victory';
  if(animating)worldTime+=dt;
  if(sim.state==='active'){
    accumulator+=dt;
    const input=inputState();
    while(accumulator>=1/60){sim.tick(1/60,input);accumulator-=1/60;}
  }else accumulator=0;
  processEvents();
  const visualDt=animating?dt:0;
  environment.update(worldTime);armies.update(sim,worldTime);effects.update(sim,visualDt,worldTime,camera);targets.update(sim,worldTime);
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
        step:(seconds,input={})=>{for(let t=0;t<seconds;t+=1/60){sim.tick(1/60,input);processEvents();}updateHud();return sim.snapshot();},
        place:(x,z)=>{sim.player.x=clamp(x,LIMITS.minX,LIMITS.maxX);sim.player.z=clamp(z,LIMITS.minZ,LIMITS.maxZ);},
        wave:index=>{sim.beginWave(clamp(index,0,3));processEvents();},
        damage:amount=>{sim.hurt(amount);},
        targets:()=>targets.snapshot(),
        clear:()=>{for(const e of sim.enemies)sim.damage(e,e.hp+1,false);},
        renderer:()=>({...metrics,geometries:renderer.info.memory.geometries,textures:renderer.info.memory.textures,quality,pixelRatio:renderer.getPixelRatio(),shadowSize:environment.sun.shadow.mapSize.x}),
        controls:()=>({touch:touchMode,dragging:pointer.active,dx:pointer.dx,dz:pointer.dz,steerX:sim.steerX}),
        screenPoint:(x,y,z)=>{const p=new T.Vector3(x,y,z).project(camera);return {x:(p.x+1)*innerWidth/2,y:(1-p.y)*innerHeight/2};},
      };
    }
  }catch(e){console.error(e);error('The 3D battlefield could not load. Use a current browser with hardware acceleration and WebGL 2 enabled. Local play requires the included web server.');}
}
$('start-button').addEventListener('click',()=>start());$('replay-button').addEventListener('click',()=>start());$('restart-button').addEventListener('click',()=>start());
$('next-level-button').addEventListener('click',()=>start(sim.level+1));
function updateCompletions(){
  for(const button of document.querySelectorAll('[data-level]')){
    let complete=false;try{complete=localStorage.getItem('war-survival-level-'+(Number(button.dataset.level)+1))==='complete';}catch{}
    button.querySelector('small').textContent=complete?'COMPLETED ✓':LEVELS[Number(button.dataset.level)].difficulty;
  }
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
document.querySelectorAll('[data-lane]').forEach(button=>combatButton(button,()=>{sim.selectLane(button.dataset.lane);renderer.domElement.focus();}));
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
