import * as T from '../vendor/three.module.min.js';
import { Simulation } from './core/simulation.js';
import { createEnvironment } from './world/environment.js';
import { createArmies } from './entities/army.js';
import { createEffects } from './systems/effects.js';
import { BattlefieldAudio } from './systems/audio.js';
import { BARRAGE_COOLDOWN, MAX_SQUAD } from '../data/waves.js';
import { clamp } from './core/math.js';

const $=id=>document.getElementById(id);
const show=(id,visible=true)=>$(id).classList.toggle('hidden',!visible);
const audio=new BattlefieldAudio(),sim=new Simulation();
let renderer,scene,camera,environment,armies,effects;
let previousTime=0,accumulator=0,worldTime=0,shake=0,flash=0,bannerTime=0,calloutTime=0,quality='high';
let frames=0,frameTotal=0,metrics={fps:0,calls:0,triangles:0},modal=null;
const keys=new Set(),pointer={active:false,id:null,x:0,y:0,dx:0,dz:0};
const projected=new T.Vector3(),labels=new Map();
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
  for(const id of ['menu','pause-panel','result-panel','upgrade-panel'])closeModal(id);
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
      $('banner').classList.add('visible');bannerTime=4.3;
    }
    if(e.type==='barrage')callout('ARTILLERY INBOUND',2);
    if(e.type==='warning'||e.type==='supply')callout(e.text);
    if(e.type==='recruit')callout(e.amount>0?'+'+e.amount+' RIFLEMEN — SQUAD REINFORCED':'SUPPLIES COLLECTED — +6 INTEGRITY',2.5);
    if(e.type==='hurt'){flash=.6;shake=Math.max(shake,.12);}
    if(e.type==='explosion')shake=Math.max(shake,e.friendly?.18:.28);
    if(e.type==='death'&&e.boss)shake=.65;
    if(e.type==='upgrade'){
      $('upgrade-panel').querySelector('[data-upgrade="recruits"]').disabled=sim.player.squad>=MAX_SQUAD;
      openModal('upgrade-panel');
    }
    if(e.type==='victory'||e.type==='defeat'){
      const won=e.type==='victory';
      $('result-kicker').textContent=won?'MISSION COMPLETE':'SQUAD OVERRUN';
      $('result-title').textContent=won?'The crossing holds.':'A stand worth remembering.';
      $('result-description').textContent=won?'The Crimson Warden has fallen. Your squad held the last bridge through the Borderlands.':'The Legion broke through. Recruit more riflemen, use your artillery, and keep moving out of incoming strikes.';
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
  $('weapon-name').textContent='MK '+['I','II','III','IV'][Math.min(3,p.weaponLevel-1)]+' · VOLLEY RIFLES';
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
function updateLabels(){
  const ids=new Set(sim.pickups.map(p=>p.id));
  for(const [id,el] of labels)if(!ids.has(id)){el.remove();labels.delete(id);}
  for(const pickup of sim.pickups){
    let label=labels.get(pickup.id);
    if(!label){label=document.createElement('div');label.className='world-label';label.textContent='+2 RECRUITS';$('world-labels').append(label);labels.set(pickup.id,label);}
    projected.set(pickup.x,2,pickup.z).project(camera);
    label.style.left=(projected.x*.5+.5)*innerWidth+'px';label.style.top=(-projected.y*.5+.5)*innerHeight+'px';
    label.style.display=projected.z>1?'none':'block';
  }
}
function resize(){
  const portrait=innerWidth/innerHeight<.8;
  camera.aspect=innerWidth/innerHeight;camera.fov=portrait?54:49;camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(devicePixelRatio,quality==='high'?1.6:1));renderer.setSize(innerWidth,innerHeight);
  if(isTouch())$('control-hint').textContent='DRAG TO MOVE · AUTO-FIRE · TAP ARTILLERY';
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
  environment.update(worldTime);armies.update(sim,worldTime);effects.update(sim,visualDt,worldTime,camera);
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
  updateLabels();
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
    environment=await createEnvironment(scene,renderer);armies=createArmies(scene);effects=createEffects(scene);resize();updateSound();
    armies.update(sim,0);effects.update(sim,0,0);environment.update(0);
    await renderer.compileAsync(scene,camera);
    show('loading',false);show('menu');requestAnimationFrame(t=>{previousTime=t;frame(t);});
    if(new URLSearchParams(location.search).has('test')){
      window.__warTest={
        ready:true,snapshot:()=>({...sim.snapshot(),metrics}),
        step:(seconds,input={})=>{for(let t=0;t<seconds;t+=1/60){sim.tick(1/60,input);processEvents();}updateHud();return sim.snapshot();},
        place:(x,z)=>{sim.player.x=clamp(x,-4.6,4.6);sim.player.z=clamp(z,3,16);},
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
document.querySelectorAll('[data-upgrade]').forEach(button=>button.addEventListener('click',()=>{if(sim.upgrade(button.dataset.upgrade)){closeModal('upgrade-panel');renderer.domElement.focus();processEvents();}}));
addEventListener('resize',()=>{if(renderer)resize();});
addEventListener('keydown',event=>{
  if(event.code==='Escape'&&!event.repeat){if(sim.state==='active'||sim.state==='paused')togglePause();return;}
  if(modal&&event.code==='Tab'){
    const buttons=[...$(modal).querySelectorAll('button:not(:disabled)')],first=buttons[0],last=buttons.at(-1);
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
  }
  if(sim.state!=='active')return;
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
