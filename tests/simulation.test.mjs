import test from 'node:test';
import assert from 'node:assert/strict';
import { Simulation } from '../js/core/simulation.js';
import { LIMITS, MAX_SQUAD } from '../data/waves.js';
function advance(sim, seconds, input={}) {
  for(let i=0;i<seconds*60;i++){sim.tick(1/60,input);sim.drainEvents();}
}
test('movement is bounded and diagonal input is normalized',()=>{
  const a=new Simulation(),b=new Simulation();a.start();b.start();
  advance(a,.4,{x:1});advance(b,.4,{x:1,z:1});
  assert.ok(Math.hypot(b.player.x,b.player.z-11)<Math.hypot(a.player.x,a.player.z-11)*1.05);
  advance(a,4,{x:1,z:1});assert.equal(a.player.x,LIMITS.maxX);assert.equal(a.player.z,LIMITS.maxZ);
});
test('automatic rifle fire damages enemies and produces bounded death states',()=>{
  const sim=new Simulation();sim.start();advance(sim,12);
  assert.ok(sim.kills>0);assert.ok(sim.bullets.length<=220);assert.ok(sim.corpses.length<=64);
  assert.ok(sim.enemies.every(e=>e.hp>0&&Number.isFinite(e.reserved)));
});
test('barrage has a cooldown and paused combat does not advance',()=>{
  const sim=new Simulation();sim.start();assert.equal(sim.barrage(),true);assert.equal(sim.barrage(),false);
  const before=JSON.stringify(sim.snapshot());sim.pause();advance(sim,4);sim.pause();
  assert.equal(JSON.stringify(sim.snapshot()),before);
  advance(sim,1.5);assert.ok(sim.kills>0);assert.ok(sim.barrageCooldown>10);
});
test('recruit supply is collected once and the squad cap is enforced',()=>{
  const sim=new Simulation();sim.start();sim.player.squad=MAX_SQUAD-1;
  sim.pickups.push({id:999,x:0,z:11,age:0});advance(sim,.1);
  assert.equal(sim.player.squad,MAX_SQUAD);assert.equal(sim.pickups.length,0);
  advance(sim,.1);assert.equal(sim.player.squad,MAX_SQUAD);
});
test('each cleared wave offers exactly one upgrade and final wave wins',()=>{
  const sim=new Simulation();sim.start();
  for(let wave=0;wave<4;wave++){
    assert.equal(sim.wave,wave);
    for(const e of sim.enemies)sim.damage(e,e.hp+1,false);
    advance(sim,2.2);
    if(wave<3){assert.equal(sim.state,'upgrade');assert.equal(sim.upgrade('damage'),true);assert.equal(sim.upgrade('damage'),false);}
    else assert.equal(sim.state,'victory');
  }
  assert.equal(sim.kills,157);assert.ok(sim.player.damage>26);
});
test('zero health loses and restart clears all previous combat state',()=>{
  const sim=new Simulation();sim.start();sim.hurt(100);advance(sim,.1);assert.equal(sim.state,'defeat');
  sim.start();assert.equal(sim.state,'active');assert.equal(sim.player.health,100);assert.equal(sim.kills,0);
  assert.equal(sim.wave,0);assert.equal(sim.corpses.length,0);assert.equal(sim.barrageCooldown,0);
});
test('a marked hostile impact damages only a squad inside its radius',()=>{
  const sim=new Simulation();sim.start();sim.zones.push({id:123,x:0,z:11,radius:2,remaining:.02,total:1,friendly:false,damage:19});
  advance(sim,.05);assert.equal(sim.player.health,81);
  sim.player.x=4;advance(sim,.3);sim.zones.push({id:124,x:0,z:11,radius:2,remaining:.02,total:1,friendly:false,damage:19});
  advance(sim,.05);assert.equal(sim.player.health,81);
});
