import test from 'node:test';
import assert from 'node:assert/strict';
import { Simulation } from '../js/core/simulation.js';
import { openChoice, resolveChoice, activatePower, nextPower } from '../js/core/encounters.js';
import { POWER_DECK } from '../data/powers.js';
import { LEVELS } from '../data/waves.js';
import { flightPose } from '../js/core/flight.js';

function fresh(){const s=new Simulation();s.start(0);s.choiceTimer=Infinity;return s;}
function step(s,seconds,input={}){for(let i=0;i<Math.round(seconds*60);i++){s.tick(1/60,input);s.drainEvents();}}

test('a rift awards exactly one reward and invalidates both targets atomically',()=>{
  for(const side of [0,1]){
    const s=fresh();openChoice(s);const [left,right]=s.choice.options,target=s.choice.options[side];
    const squad=s.player.squad;assert.ok(resolveChoice(s,target));
    assert.equal(s.choice,null);assert.equal(left.hp,0);assert.equal(right.hp,0);
    assert.equal(resolveChoice(s,side?left:right),false);s.damage(left,1000);s.damage(right,1000);
    assert.equal(s.choicesTaken,1);assert.equal(s.player.squad,side?squad:squad+6);assert.equal(s.powersTaken,side?1:0);
  }
});
test('rift choices require a sustained volley, pause with the game, and temporarily hold normal supplies',()=>{
  const s=fresh();s.player.x=3.8;s.player.weaponLevel=3;s.player.squad=42;s.createArmory();const z=s.armory.z,hp=s.armory.hp;
  openChoice(s);const right=s.choice.options[1];s.damage(right,1e6);assert.equal(right.hp,100);
  step(s,1.3);assert.ok(s.choice);assert.equal(s.armory.z,z);assert.equal(s.armory.hp,hp);
  const age=s.choice.age,charge=right.hp;s.pause();step(s,2);assert.equal(s.choice.age,age);assert.equal(right.hp,charge);
  s.pause();step(s,2);assert.equal(s.choice,null);assert.equal(s.choicesTaken,1);assert.ok(s.armory.z>z);
});
test('a full squad gets a useful shield alternative; expired rifts grant neither reward',()=>{
  const s=fresh();s.player.squad=42;openChoice(s);assert.equal(s.choice.options[0].kind,'aegis');
  resolveChoice(s,s.choice.options[0]);assert.equal(s.shield,35);assert.equal(s.player.squad,42);
  openChoice(s);resolveChoice(s,s.choice.options[0]);assert.equal(s.shield,60);
  s.damage({type:'pod',kind:'shield',hp:1,scale:1,x:0,z:0},100);assert.equal(s.shield,60,'a normal pod cannot reduce a stronger rift shield');
  openChoice(s);const options=s.choice.options;s.choice.z=19.99;step(s,.1);assert.equal(s.choice,null);assert.ok(options.every(o=>o.hp===0));assert.equal(s.choicesTaken,2);
});
test('boss launches scale with squad size, partial shields soften them, and complete shields block them',()=>{
  for(const size of [10,25,42]){
    const s=fresh();s.player.squad=size;s.hurt(10,false,{x:0,z:5,mini:false});
    assert.equal(s.launchedSoldiers,Math.ceil(size*.16));assert.equal(s.player.squad,size-1);
    assert.equal(s.fallen.length+s.knockups.length,s.launchedSoldiers);assert.ok([...s.fallen,...s.knockups].every(u=>u.flight));
    const pose=flightPose(s.fallen[0],.65);assert.ok(pose.y>3);assert.notEqual(pose.z,s.fallen[0].z);
  }
  const s=fresh();s.player.squad=42;s.shield=24;s.hurt(24,false,{x:0,z:5,mini:false});
  assert.equal(s.player.health,100);assert.equal(s.launchedSoldiers,0);assert.equal(s.player.squad,42);assert.ok(s.drainEvents().some(e=>e.type==='shieldBlock'));
  s.hurtCooldown=0;s.shield=12;s.hurt(24,false,{x:0,z:5,mini:false});assert.equal(s.launchedSoldiers,4);assert.equal(s.player.health,88);assert.equal(s.knockups.length,3);assert.equal(s.casualties,1);
});
test('surviving launched soldiers stop shooting, pause in flight, and recover without being recruited again',()=>{
  const s=fresh();s.player.squad=42;s.shootTimers.fill(0);s.hurt(10,false,{x:0,z:5,mini:false});
  const squad=s.player.squad,recruited=s.recruited,indices=s.knockups.map(u=>u.index);
  assert.equal(indices.length,6);step(s,.5);assert.ok(indices.every(i=>s.shootTimers[i]===0));
  s.pause();const age=s.knockups[0].age;step(s,1);assert.equal(s.knockups[0].age,age);
  s.pause();step(s,1.9);assert.equal(s.knockups.length,0);assert.equal(s.player.squad,squad);assert.equal(s.recruited,recruited);
  assert.ok(indices.some(i=>s.shootTimers[i]>0));
  s.hurtCooldown=0;s.hurt(10,false,{x:0,z:5,mini:true});assert.ok(s.knockups.length);s.start(0);assert.equal(s.knockups.length,0);
});
test('a heavy hit has a brief recovery window against overlapping attacks, but enemies can still breach',()=>{
  const s=fresh();s.hurt(10,false,{x:0,z:5,mini:false});assert.equal(s.hurt(15),false);assert.equal(s.player.health,90);
  step(s,.5);assert.equal(s.hurt(15),false);step(s,.4);assert.equal(s.hurt(15),true);assert.equal(s.player.health,75);
  assert.equal(s.hurt(4,true),true);assert.equal(s.player.health,71);
});
test('new powers deal earned damage, pause, and clear completely on restart',()=>{
  for(const kind of POWER_DECK){
    const s=fresh();s.choiceTimer=Infinity;
    for(const e of s.enemies){e.z+=20;e.hp=e.maxHp=100000;}
    activatePower(s,kind);s.player.x=kind==='prism'?0:-3.8;const hp=s.enemies.reduce((n,e)=>n+e.hp,0);
    step(s,2);assert.ok(s.enemies.reduce((n,e)=>n+e.hp,0)<hp,kind+' damages enemies');
    s.pause();const remaining=s.buffs[kind];step(s,2);assert.equal(s.buffs[kind],remaining);
    s.start(0);assert.equal(s.buffs[kind],0);assert.equal(s.powersTaken,0);assert.equal(s.choice,null);assert.equal(s.fallen.length,0);
  }
});
test('rift powers expire on the battle clock without persisting into later encounters',()=>{
  const s=fresh();for(const e of s.enemies){e.z-=30;e.hp=e.maxHp=100000;}
  for(const kind of POWER_DECK)activatePower(s,kind);
  step(s,10.2);assert.equal(s.state,'active');for(const kind of POWER_DECK)assert.equal(s.buffs[kind],0);
});

test('five-power shuffle bags vary by seed and have no adjacent repeated offers',()=>{
  const sequences=[];
  for(const seed of [731,19,2048]){
    const s=new Simulation(seed);s.start();const offers=Array.from({length:20},()=>nextPower(s));sequences.push(offers.join(','));
    for(let i=0;i<20;i+=5)assert.equal(new Set(offers.slice(i,i+5)).size,5);
    assert.ok(offers.every((kind,i)=>!i||kind!==offers[i-1]));
    const twin=new Simulation(seed);twin.start();assert.deepEqual(Array.from({length:20},()=>nextPower(twin)),offers);
  }
  assert.equal(new Set(sequences).size,3);
});
test('six opening patterns provide real convoys, supply drops, discounts and exclusive duels',()=>{
  assert.equal(new Set(LEVELS.map(l=>l.opening.id)).size,6);
  for(let i=0;i<LEVELS.length;i++){
    const s=new Simulation();s.start(i);const kind=s.levelData.opening.id;
    if(kind==='convoy'){assert.equal(s.recruits.length,3);const target=s.recruits[0];s.damage(target,10);s.damage(target,10);assert.equal(s.player.squad,12);}
    if(kind==='armory'){assert.equal(s.recruits.length,0);assert.ok(s.armory.hp<s.weapons[1].cost);}
    if(kind==='supply'){assert.equal(s.pods[0].kind,'overdrive');assert.equal(s.buffs.overdrive,0);assert.equal(s.recruits.length,0);}
    if(kind==='rift'||kind==='duel'){assert.ok(s.choice);if(kind==='duel'){const [a,b]=s.choice.options;assert.notEqual(a.kind,b.kind);assert.ok(POWER_DECK.includes(a.kind));resolveChoice(s,a);assert.equal(resolveChoice(s,b),false);assert.equal(s.powersTaken,1);}}
  }
});
test('gravity gathers infantry, releases a damaging nova, and clears on restart',()=>{
  const s=fresh();s.player.x=-3.8;const e=s.enemies[0];e.x=4;e.z=-5;e.hp=e.maxHp=100000;s.enemies=[e];
  activatePower(s,'gravity');const initial=Math.abs(e.x);step(s,.6);assert.ok(Math.abs(e.x)<initial*.5);
  const hp=e.hp;step(s,7.5);assert.equal(s.gravityWell,null);assert.ok(e.hp<hp-700);
  activatePower(s,'gravity');s.start();assert.equal(s.gravityWell,null);
});
test('phoenix repairs the squad and consumes its pact once to prevent defeat',()=>{
  const s=fresh();s.player.health=60;activatePower(s,'phoenix');assert.equal(s.player.health,72);
  s.hurt(200);step(s,1/60);assert.equal(s.state,'active');assert.equal(s.player.health,35);assert.equal(s.phoenixSaves,1);assert.equal(s.buffs.phoenix,0);
  s.hurtCooldown=0;s.hurt(100);step(s,1/60);assert.equal(s.state,'defeat');assert.equal(s.phoenixSaves,1);
  s.start();assert.equal(s.phoenixSaves,0);
});
test('bosses resist the gravity pull and continue their own approach',()=>{
  const s=fresh();s.start(14);s.beginWave(3);const boss=s.enemies.find(e=>e.type==='boss');s.enemies=[boss];boss.x=4;boss.z=-5;boss.attackTimer=999;
  activatePower(s,'gravity');step(s,1/60);assert.ok(Math.abs(boss.x-4)<.06);assert.ok(Math.abs(boss.z+5)<.2);
});
