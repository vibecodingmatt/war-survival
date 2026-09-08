import test from 'node:test';
import assert from 'node:assert/strict';
import { Simulation } from '../js/core/simulation.js';
import { AMMO, SUPPLY_DECK } from '../data/munitions.js';
import { nextSupply, collectSupply, fireVolley } from '../js/core/munitions.js';
import { activatePower, openChoice, resolveChoice, updateChoices } from '../js/core/encounters.js';
import { createQualityGovernor, nextRenderTime } from '../js/core/quality.js';

function battle(){
  const s=new Simulation(731);s.start();s.choiceTimer=s.podTimer=999;s.player.squad=20;s.player.weaponLevel=2;
  s.enemies=s.enemies.slice(0,27);s.enemies.forEach((e,i)=>{e.x=(i%9-4)*.8;e.z=-4-Math.floor(i/9)*1.2;e.hp=e.maxHp=1e8;e.speed=0;e.attackTimer=999;});
  return s;
}
function step(s,seconds){for(let i=0;i<Math.round(seconds*60);i++){s.tick(1/60);s.drainEvents();}}
const damage=s=>s.enemies.reduce((total,e)=>total+e.maxHp-e.hp,0);

test('random supply bags contain every modifier and one jackpot; their RNG cannot alter enemies or rifts',()=>{
  const sequences=[];
  for(const seed of [731,19,2048]){
    const s=new Simulation(seed),twin=new Simulation(seed);s.start();twin.start();
    const offers=Array.from({length:SUPPLY_DECK.length*2},()=>nextSupply(s));sequences.push(offers.join(','));
    for(let i=0;i<offers.length;i+=SUPPLY_DECK.length){const bag=offers.slice(i,i+SUPPLY_DECK.length);assert.deepEqual([...bag].sort(),[...SUPPLY_DECK].sort());assert.equal(bag.filter(x=>x==='jackpot').length,1);}
    assert.equal(s.random(),twin.random());assert.equal(s.rewardRandom(),twin.rewardRandom());
    assert.deepEqual(offers,Array.from({length:offers.length},()=>nextSupply(twin)));
  }
  assert.equal(new Set(sequences).size,3);
});

test('ammunition changes actual cadence, volley counts and damage while preserving permanent upgrades',()=>{
  const normal=battle();step(normal,4);const baseline=normal.shots.enemies,baseDamage=damage(normal);
  for(const kind of Object.keys(AMMO)){
    const s=battle(),weapon=s.weapon;collectSupply(s,kind);step(s,4);
    assert.equal(s.weapon,weapon);assert.ok(damage(s)>baseDamage,kind+' improves damage');
    if(kind==='pulse')assert.ok(s.shots.enemies<baseline*.8,'sonic shells fire more slowly');
    if(kind==='fanfire')assert.ok(s.shots.enemies>baseline*2.7,'fan volleys contain three rounds');
    if(kind==='helix')assert.ok(s.shots.enemies>baseline*1.8,'corkscrews contain two rounds');
    if(kind==='jackpot')assert.ok(s.shots.enemies>baseline*2.5,'jackpot accelerates fire');
    assert.ok(s.bullets.length<=360);
  }
});

test('modifier swaps, support stacking, pause, expiry and restart cannot retain temporary fire modes',()=>{
  const s=battle();collectSupply(s,'fanfire');step(s,1);const remaining=s.ammo.remaining;
  s.pause();step(s,2);assert.equal(s.ammo.remaining,remaining);s.pause();collectSupply(s,'pinball');
  assert.equal(s.ammo.kind,'pinball');collectSupply(s,'shield');assert.equal(s.ammo.kind,'pinball');assert.equal(s.shield,30);
  collectSupply(s,'overdrive');assert.ok(s.buffs.overdrive>0);step(s,9.1);assert.equal(s.ammo,null);
  collectSupply(s,'jackpot');s.start(5);assert.equal(s.ammo,null);assert.ok(Object.values(s.buffs).every(v=>v===0));
});

test('multi-shot and ricochet ammo never multiplies a side-lane or pod reward',()=>{
  for(const kind of Object.keys(AMMO))for(const type of ['recruit','weapon','choice','pod']){
    const s=battle();collectSupply(s,kind);s.focus=type==='recruit'?'recruits':type==='pod'?'enemies':'weapons';
    const target={type,id:900,hp:100,maxHp:100,x:3,y:1,z:-2,scale:1,reserved:0};
    fireVolley(s,0,target,0,10);assert.equal(s.bullets.length,1);assert.equal(s.bullets[0].pattern,null);
  }
});

test('quack and toy tank choices are exclusive and both earn kills through their attacks',()=>{
  for(const kind of ['quack','stampede']){
    const s=battle();s.enemies.forEach(e=>e.hp=e.maxHp=120);s.player.x=-3.8;
    openChoice(s,true);const [left,right]=s.choice.options;left.kind=kind;right.kind=kind==='quack'?'stampede':'quack';
    assert.ok(resolveChoice(s,left));assert.equal(resolveChoice(s,right),false);assert.equal(s.buffs[right.kind],0);
    step(s,2);assert.ok(s.kills>0,kind+' hits infantry');assert.ok(s.corpses.some(e=>e.flight));
    s.start();assert.equal(s.toyTanks.length,0);assert.equal(s.buffs[kind],0);
  }
});

test('toy tank damage applies once per tank and target; it pauses and expires on the combat clock',()=>{
  const s=battle();s.player.x=0;s.shootTimers.fill(999);const e=s.enemies[4];e.x=0;e.z=5;s.enemies=[e];activatePower(s,'stampede');
  step(s,.7);const dealt=damage(s);assert.ok(dealt>0&&dealt<=250,'one tank crossed this target once');
  s.pause();const z=s.toyTanks[0].z;step(s,1);assert.equal(s.toyTanks[0].z,z);s.pause();step(s,.25);assert.equal(damage(s),dealt);
  step(s,9.2);assert.equal(s.toyTanks.length,0);assert.equal(s.buffs.stampede,0);
});

test('every third recurring rift offers a real two-power duel',()=>{
  const s=battle();s.choiceCount=2;s.choiceTimer=0;updateChoices(s,1/60);
  assert.ok(s.choice.options.every(o=>!['reinforce','aegis'].includes(o.kind)));assert.notEqual(s.choice.options[0].kind,s.choice.options[1].kind);
});

test('adaptive quality requires sustained slow frames, stays bounded and recovers without oscillating',()=>{
  const q=createQualityGovernor();for(let i=0;i<55;i++)q.sample(33,true);assert.equal(q.scale,1);
  for(let i=0;i<250;i++)q.sample(33,true);assert.equal(q.scale,.8);
  for(let i=0;i<600;i++)q.sample(16.67,true);assert.equal(q.scale,.8);
  for(let i=0;i<900;i++)q.sample(16.67,true);assert.equal(q.scale,1);
  for(let i=0;i<1000;i++)q.sample(33,false);assert.equal(q.scale,1);
  q.reset();assert.equal(q.scale,1);
});

test('touch render pacing cannot spend one 60Hz slot twice at tolerance edges or high refresh rates',()=>{
  const early=nextRenderTime(0,16.4);assert.equal(early,16.4);assert.equal(nextRenderTime(early,22),null);
  for(const hz of [60,90,120,144,165,180,240]){
    let last=0,count=0;
    for(let i=1;i<=hz*10;i++){const next=nextRenderTime(last,i*1000/hz);if(next!==null){last=next;count++;}}
    assert.ok(count>=595&&count<=605,hz+'Hz stays near 600 renders over ten seconds; got '+count);
  }
});
