import test from 'node:test';
import assert from 'node:assert/strict';
import { Simulation } from '../js/core/simulation.js';
import { LIMITS, MAX_SQUAD, WAVES, WEAPONS, LEVELS, SUPPLY_EXIT } from '../data/waves.js';
import { strategy } from './strategy.mjs';
function advance(sim,seconds,input={}){for(let i=0;i<seconds*60;i++){sim.tick(1/60,input);sim.drainEvents();}}
function fresh(){const sim=new Simulation();sim.start();return sim;}
test('movement is bounded, normalized, and manual movement overrides lane steering',()=>{
  const a=fresh(),b=fresh();advance(a,.4,{x:1});advance(b,.4,{x:1,z:1});
  assert.ok(Math.hypot(b.player.x,b.player.z-11)<Math.hypot(a.player.x,a.player.z-11)*1.05);
  advance(a,4,{x:1,z:1});assert.equal(a.player.x,LIMITS.maxX);assert.equal(a.player.z,LIMITS.maxZ);
  a.selectLane('recruits');advance(a,1);assert.equal(a.focus,'recruits');
  advance(a,1,{x:1});assert.equal(a.focus,'weapons');assert.equal(a.steerX,null);
});
test('each side lane directs shots exclusively at its own targets',()=>{
  for(const lane of ['recruits','weapons']){
    const sim=fresh();sim.player.x=lane==='recruits'?-3.8:3.8;
    advance(sim,2);assert.ok(sim.shots[lane]>0);assert.equal(sim.shots.enemies,0);
    assert.equal(sim.kills,0);assert.ok(sim.enemies.every(e=>e.hp===e.maxHp));
  }
  const sim=fresh();advance(sim,4);assert.ok(sim.shots.enemies>0);assert.equal(sim.recruited,0);assert.equal(sim.armory.hp,sim.armory.maxHp);
});
test('a shot +1 target grants exactly one soldier; touching or missing a board grants none',()=>{
  const sim=fresh(),target=sim.recruits[0];
  sim.damage(target,20,false);sim.damage(target,20,false);
  assert.equal(sim.player.squad,10);assert.equal(sim.recruited,1);
  sim.recruits[1].z=21;const count=sim.player.squad;advance(sim,.1);
  assert.equal(sim.player.squad,count);
  const contact=fresh();contact.recruits[0].x=contact.player.x;contact.recruits[0].z=contact.player.z;advance(contact,.1);
  assert.equal(contact.player.squad,9);
});
test('recruiting stops at the squad cap without spilling fire onto enemies',()=>{
  const sim=fresh(),pending=sim.recruits[1];sim.player.squad=MAX_SQUAD-1;sim.damage(sim.recruits[0],5,false);sim.damage(pending,5,false);
  assert.equal(sim.player.squad,MAX_SQUAD);assert.equal(pending.hp,0);assert.equal(sim.recruits.length,0);
  sim.player.x=-3.8;advance(sim,12);assert.equal(sim.shots.enemies,0);assert.equal(sim.recruits.length,0);
  sim.hurt(8);assert.equal(sim.player.squad,41);assert.equal(sim.fallen.length,1);
  advance(sim,1.6);assert.ok(sim.recruits.length>0,'casualties reopen recruitment');
  advance(sim,1);assert.equal(sim.player.squad,42);assert.equal(sim.recruits.length,0);
});
test('recruits arrive in small bursts separated by a real empty interval',()=>{
  const sim=fresh();sim.player.x=-3.8;advance(sim,3.5);
  assert.equal(sim.recruited,6);assert.equal(sim.recruits.length,0);
  sim.player.x=0;advance(sim,5);assert.equal(sim.recruits.length,0);
  advance(sim,1.6);assert.equal(sim.recruits.length,6);
});
test('moving weapon goals expire, invalidate in-flight hits, then return with full health',()=>{
  for(const level of [0,1]){
    const sim=fresh();sim.start(level);const old=sim.armory,z=old.z;
    advance(sim,1);assert.ok(old.z>z);
    sim.damage(old,old.maxHp-1,false);old.z=SUPPLY_EXIT-.001;
    // This bullet would unlock the weapon this frame if expired targets remained valid.
    sim.bullets.push({target:old,damage:9,x:old.x,y:old.y,z:old.z,tx:old.x,ty:old.y,tz:old.z,speed:65,life:0});
    advance(sim,1/60);assert.equal(sim.armory,null);assert.equal(sim.player.weaponLevel,1);assert.equal(sim.missedWeapons,1);
    sim.damage(old,100,false);assert.equal(sim.player.weaponLevel,1);
    advance(sim,sim.levelData.weaponInterval+.1);assert.notEqual(sim.armory.id,old.id);assert.equal(sim.armory.hp,WEAPONS[1].cost);
  }
});
test('partial armory damage persists across switching lanes and waves',()=>{
  const sim=fresh();sim.player.x=3.8;advance(sim,1);
  sim.player.x=0;sim.player.vx=0;advance(sim,1.5);
  const hp=sim.armory.hp,id=sim.armory.id;assert.ok(hp<WEAPONS[1].cost&&hp>0);
  advance(sim,1);assert.equal(sim.armory.hp,hp);sim.beginWave(1);assert.equal(sim.armory.hp,hp);assert.equal(sim.armory.id,id);
});
test('each weapon unlock is atomic, gives a real new gun, and has an increasing next goal',()=>{
  const sim=fresh();
  for(let level=2;level<=4;level++){
    const old=sim.armory;sim.damage(old,old.hp+100,false);sim.damage(old,999999,false);
    assert.equal(sim.player.weaponLevel,level);
    assert.equal(sim.armory,null);
    advance(sim,sim.levelData.weaponInterval+.1);
    if(level<4)assert.ok(sim.armory.maxHp>old.maxHp);else assert.equal(sim.armory,null);
  }
  assert.ok(WEAPONS[3].splash>0);assert.ok(WEAPONS[2].interval<WEAPONS[0].interval);
});
test('artillery affects enemies only, respects cooldown, and freezes during pause',()=>{
  const sim=fresh();assert.equal(sim.barrage(),true);assert.equal(sim.barrage(),false);
  const hp=sim.armory.hp,boards=sim.recruits.length,time=sim.time,cd=sim.barrageCooldown,z=sim.armory.z;
  sim.pause();advance(sim,4);assert.equal(sim.time,time);assert.equal(sim.barrageCooldown,cd);assert.equal(sim.armory.z,z);sim.pause();
  advance(sim,1.5);assert.ok(sim.kills>0);assert.equal(sim.armory.hp,hp);assert.equal(sim.recruited,0);assert.ok(sim.recruits.length>=boards);
});
test('every breach damages the defense even when multiple enemies cross in one frame',()=>{
  const sim=fresh();sim.enemies.slice(0,5).forEach(e=>{e.z=22.1;});
  advance(sim,1/60);assert.equal(sim.breaches,5);assert.equal(sim.player.health,80);
});
test('four larger waves transition automatically without free power upgrades',()=>{
  const sim=fresh();for(let wave=0;wave<4;wave++){
    assert.equal(sim.wave,wave);for(const e of sim.enemies)sim.damage(e,e.hp+1,false);advance(sim,3.05);
  }
  assert.equal(sim.state,'victory');assert.equal(sim.kills,WAVES.reduce((n,w)=>n+w.count+(w.boss?1:0),0));
  assert.equal(sim.player.squad,9);assert.equal(sim.player.weaponLevel,1);
});
test('defeat and restart reset target progress, recruits, waves, and pending fire',()=>{
  const sim=fresh();sim.damage(sim.armory,100,false);sim.damage(sim.recruits[0],1,false);
  sim.hurt(100);advance(sim,.1);assert.equal(sim.state,'defeat');sim.start();
  assert.equal(sim.player.health,100);assert.equal(sim.player.squad,9);assert.equal(sim.recruited,0);
  assert.equal(sim.player.weaponLevel,1);assert.equal(sim.armory.hp,WEAPONS[1].cost);assert.equal(sim.wave,0);assert.equal(sim.bullets.length,0);
});
test('levels start fresh, remain independently replayable, and Level 2 increases pressure',()=>{
  const sim=fresh();sim.player.squad=42;sim.player.weaponLevel=4;sim.start(1);
  assert.equal(sim.snapshot().level,2);assert.equal(sim.player.squad,9);assert.equal(sim.player.weaponLevel,1);
  assert.equal(sim.player.health,100);assert.equal(sim.casualties,0);assert.equal(sim.enemies.length,104);
  for(let i=0;i<4;i++){
    const easy=LEVELS[0].waves[i],hard=LEVELS[1].waves[i];
    assert.ok(hard.count>easy.count&&hard.hp>easy.hp&&hard.speed>easy.speed);
  }
  sim.start();assert.equal(sim.level,1);sim.start(0);assert.equal(sim.level,0);
});
test('unupgraded play loses even with artillery; blended play can win across seeds',()=>{
  for(const level of [0,1])for(const seed of [731,19,2048])for(const mode of ['none','balanced','balanced-no-art']){
    const sim=new Simulation(seed);sim.start(level);let input={},steps=0;
    while(sim.state==='active'&&sim.time<180){
      if(steps++%12===0)input=strategy(sim.snapshot(),mode);
      sim.tick(1/60,input);sim.drainEvents();
      assert.ok(sim.bullets.length<=360&&sim.corpses.length<=72&&sim.recruits.length<=12&&sim.fallen.length<=42);
    }
    assert.equal(sim.state,mode==='none'?'defeat':'victory','level '+(level+1)+' '+mode+' seed '+seed);
    if(mode!=='none'){assert.ok(sim.recruited>=20);assert.equal(sim.player.weaponLevel,4);}
  }
});
