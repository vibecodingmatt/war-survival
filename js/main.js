import * as T from '../vendor/three.module.min.js';
import { Simulation } from './core/simulation.js';
import { createEnvironment } from './world/environment.js';
import { createArmies } from './entities/army.js';
import { createTargets } from './world/targets.js';
import { createEffects } from './systems/effects.js';
import { BattlefieldAudio } from './systems/audio.js';
import { BARRAGE_COOLDOWN, WEAPONS, LIMITS, MAX_SQUAD } from '../data/waves.js';
import { clamp } from './core/math.js';

const $=id=>document.getElementById(id);
const show=(id,visible=true)=>$(id).classList.toggle('hidden',!visible);
const audio=new BattlefieldAudio(),sim=new Simulation();
let renderer,scene,camera,environment,armies,effects,targets;
let previousTime=0,accumulator=0,worldTime=0,shake=0,flash=0,bannerTime=0,calloutTime=0,quality='high';
let frames=0,frameTotal=0,metrics={fps:0,calls:0,triangles:0},modal=null;
const keys=new Set(),pointer={active:false,id:null,x:0,y:0,dx:0,dz:0};
const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isTouch=()=>matchMedia('(pointer: coarse)').matches;

function error(message) {
  show('loading',false);show('menu',false);$('error-message').textContent=message;show('error-panel');
}
function updateSound(){ $('sound-button').classList.toggle('muted',!audio.enabled);$('sound-button').setAttribute('aria-label',audio.enabled?'Mute sound':'Enable sound'); }
function clearInput(){keys.clear();pointer.active=false;pointer.dx=pointer.dz=0;show('joystick',false);}
function openModal(id){modal=id;show(id);clearInput();$(id).querySelector('button:not(:disabled)')?.focus();}
function closeModal(id){show(id,false);if(modal===id)modal=null;}
function callout(text,duration=3.5){$('callout').textContent=text;calloutTime=duration;$('callout').classList.add('visible');}
function start(){
  audio.start().then(updateSound);sim.start();effects.reset();clearInput();
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
      $('banner-kicker').textContent='WAVE '+String(e.index+1).padStart(2,'0')+' / 04';
      $('banner-title').textContent=e.name;$('banner-description').textContent=e.description;
      $('banner').classList.add('visible');bannerTime=3.2;
    }
    if(e.type==='barrage')callout('ARTILLERY INBOUND',2);
    if(e.type==='warning'||e.type==='regroup')callout(e.text);
    if(e.type==='recruit')callout('+1 SOLDIER · '+sim.player.squad+' IN YOUR SQUAD',1.1);
    if(e.type==='weapon'){callout(e.name+' UNLOCKED — NEW WEAPONS EQUIPPED',3.3);shake=Math.max(shake,.12);}
    if(e.type==='hurt'){flash=.6;shake=Math.max(shake,.12);}
    if(e.type==='explosion')shake=Math.max(shake,e.friendly?.18:.28);
    if(e.type==='death'&&e.boss)shake=.65;
    if(e.type==='victory'||e.type==='defeat'){
      const won=e.type==='victory';
      $('result-kicker').textContent=won?'MISSION COMPLETE':'SQUAD OVERRUN';
      $('result-title').textContent=won?'The crossing holds.':'A stand worth remembering.';
      $('result-description').textContent=won?'The Crimson Warden has fallen. You recruited '+sim.recruited+' soldiers and reached '+WEAPONS[sim.player.weaponLevel-1].name+'.':'The Legion broke through. Shoot +1 targets on the left, unlock stronger guns on the right, and return to the center before enemies get close.';
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
  $('weapon-name').textContent='MK '+['I','II','III','IV'][p.weaponLevel-1]+' · '+WEAPONS[p.weaponLevel-1].name;
  document.querySelectorAll('[data-lane]').forEach(button=>{
    button.classList.toggle('active',button.dataset.lane===sim.focus);
    button.setAttribute('aria-pressed',String(button.dataset.lane===sim.focus));
  });
  document.querySelector('[data-lane="recruits"] small').textContent=p.squad>=MAX_SQUAD?'SQUAD FULL · '+MAX_SQUAD:'SHOOT LEFT';
  document.querySelector('[data-lane="weapons"] small').textContent=sim.armory?'SHOOT RIGHT':'FULLY UPGRADED';
  const target=sim.armory;
  $('next-weapon').textContent=target?WEAPONS[target.level-1].name:'MAX FIREPOWER';
  $('weapon-remaining').textContent=target?Math.ceil(target.hp).toLocaleString()+' damage to unlock':'ALL WEAPONS EQUIPPED';
  $('weapon-progress').style.width=(target?(1-target.hp/target.maxHp)*100:100)+'%';
  $('kill-count').textContent=sim.kills;
  $('enemies-left').textContent=sim.enemies.length?sim.enemies.length+' enemies incoming':'Crossing secured';
  $('wave-label').innerHTML='WAVE '+String(sim.wave+1).padStart(2,'0')+' <span>/ 04</span>';
  [...$('wave-pips').children].forEach((pip,i)=>{pip.classList.toggle('complete',i<sim.wave);pip.classList.toggle('current',i===sim.wave);});
  const ready=sim.barrageCooldown<=0;
  $('barrage-button').disabled=!ready||sim.state!=='active'||!sim.enemies.length;
  $('barrage-status').textContent=ready?'BARRAGE READY':'RELOADING · '+Math.ceil(sim.barrageCooldown)+'s';
  $('barrage-fill').style.width=(1-sim.barrageCooldown/BARRAGE_COOLDOWN)*100+'%';
  const boss=sim.enemies.find(e=>e.type==='boss');show('boss-hud',!!boss&&sim.state!=='menu');
  if(boss)$('boss-fill').style.width=(boss.hp/boss.maxHp)*100+'%';
}
function resize(){
  const portrait=innerWidth/innerHeight<.8;
  camera.aspect=innerWidth/innerHeight;camera.fov=portrait?54:49;camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(devicePixelRatio,quality==='high'?1.6:1));renderer.setSize(innerWidth,innerHeight);
  if(isTouch())$('control-hint').textContent='DRAG TO MOVE · TAP A LANE TO FOCUS FIRE';
}
function inputState(){
  return {x:(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0)+pointer.dx,
    z:(keys.has('KeyS')||keys.has('ArrowDown')?1:0)-(keys.has('KeyW')||keys.has('ArrowUp')?1:0)+pointer.dz,
    barrage:keys.has('Space')};
}
function frame(timestamp){
  requestAnimationFrame(frame);
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
  camera.lookAt(menu&&!portrait?-8:sim.player.x*.08,1,(portrait?0:-3)+(sim.player.z-11)*.25);
  if(!reducedMotion&&shake>0){camera.position.x+=Math.sin(worldTime*97)*shake*.22;camera.position.y+=Math.cos(worldTime*79)*shake*.22;}
  if(frames%5===0)updateHud();
  renderer.render(scene,camera);
  frames++;frameTotal+=dt;
  if(frameTotal>=1){metrics={fps:Math.round(frames/frameTotal),calls:renderer.info.render.calls,triangles:renderer.info.render.triangles};frames=0;frameTotal=0;}
}
async function boot(){
  try{
    renderer=new T.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
    renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.18;
    renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
    renderer.domElement.tabIndex=-1;renderer.domElement.setAttribute('aria-label','Battlefield. Use WASD or arrow keys to move; Space for artillery.');
    $('viewport').append(renderer.domElement);
    renderer.domElement.addEventListener('webglcontextlost',event=>{event.preventDefault();if(sim.state==='active')sim.pause();error('The graphics connection was interrupted. Reload to return to Ashen Crossing.');});
    scene=new T.Scene();camera=new T.PerspectiveCamera(49,innerWidth/innerHeight,.3,450);camera.position.set(-9,25,38);
    environment=await createEnvironment(scene,renderer);armies=createArmies(scene);effects=createEffects(scene);targets=createTargets(scene);resize();updateSound();
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
        clear:()=>{for(const e of sim.enemies)sim.damage(e,e.hp+1,false);},
        renderer:()=>({...metrics,geometries:renderer.info.memory.geometries,textures:renderer.info.memory.textures}),
      };
    }
  }catch(e){console.error(e);error('The 3D battlefield could not load. Use a current browser with hardware acceleration and WebGL 2 enabled. Local play requires the included web server.');}
}
$('start-button').addEventListener('click',start);$('replay-button').addEventListener('click',start);$('restart-button').addEventListener('click',start);
$('sound-button').addEventListener('click',()=>{audio.toggle();audio.start().then(updateSound);updateSound();});
$('pause-button').addEventListener('click',togglePause);$('resume-button').addEventListener('click',togglePause);
$('barrage-button').addEventListener('click',()=>{sim.barrage();renderer.domElement.focus();});
$('quality-button').addEventListener('click',()=>{
  quality=quality==='high'?'balanced':'high';$('quality-button').textContent='Graphics: '+(quality==='high'?'High':'Balanced');
  environment.sun.shadow.mapSize.setScalar(quality==='high'?2048:1024);
  environment.sun.shadow.map?.dispose();environment.sun.shadow.map=null;resize();
});
document.querySelectorAll('[data-lane]').forEach(button=>button.addEventListener('click',()=>{sim.selectLane(button.dataset.lane);renderer.domElement.focus();}));
addEventListener('resize',()=>{if(renderer)resize();});
addEventListener('keydown',event=>{
  if(event.code==='Escape'&&!event.repeat){if(sim.state==='active'||sim.state==='paused')togglePause();return;}
  if(modal&&event.code==='Tab'){
    const buttons=[...$(modal).querySelectorAll('button:not(:disabled)')],first=buttons[0],last=buttons.at(-1);
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
  pointer.active=true;pointer.id=event.pointerId;pointer.x=event.clientX;pointer.y=event.clientY;
  $('viewport').setPointerCapture(event.pointerId);$('joystick').style.left=event.clientX-47+'px';$('joystick').style.top=event.clientY-47+'px';show('joystick');
});
$('viewport').addEventListener('pointermove',event=>{
  if(!pointer.active||pointer.id!==event.pointerId)return;
  pointer.dx=clamp((event.clientX-pointer.x)/48,-1,1);pointer.dz=clamp((event.clientY-pointer.y)/48,-1,1);
  $('joystick').firstElementChild.style.transform='translate('+pointer.dx*27+'px,'+pointer.dz*27+'px)';
});
for(const name of ['pointerup','pointercancel','lostpointercapture'])$('viewport').addEventListener(name,event=>{if(event.pointerId===pointer.id)clearInput();});
boot();
