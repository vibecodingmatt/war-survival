import { Simulation } from '../js/core/simulation.js';
import { strategy } from './strategy.mjs';
import { LEVELS } from '../data/waves.js';
import assert from 'node:assert/strict';
for (const level of LEVELS.map((_,i)=>i).filter(i=>(!process.env.LEVEL||i+1===Number(process.env.LEVEL))&&i+1>=Number(process.env.MIN_LEVEL||1))) for (const mode of (process.env.MODE?[process.env.MODE]:['none', 'recruits', 'weapons', 'balanced'])) {
  let victories=0,runs=0;
  for (const seed of (process.env.SEED?[Number(process.env.SEED)]:[731, 19, 2048])) {
    const sim = new Simulation(seed); sim.start(level); const progression = [];
    let previousWave = 0, input = {}, steps = 0;
    while (sim.state === 'active' && sim.time < 300) {
      if (steps++ % 12 === 0) input = strategy(sim.snapshot(), mode);
      if (sim.wave !== previousWave) { progression.push({ wave: previousWave+1, health: Math.ceil(sim.player.health), squad: sim.player.squad, gun: sim.player.weaponLevel, time: Math.round(sim.time) }); previousWave=sim.wave; }
      sim.tick(1/60,input); sim.drainEvents();
    }
    const s=sim.snapshot();
    runs++;if(s.state==='victory')victories++;
    console.log(JSON.stringify({level:level+1,mode,seed,result:s.state,wave:s.wave,time:Math.round(s.time),health:s.health,squad:s.squad,gun:s.weaponLevel,kills:s.kills,breaches:s.breaches,casualties:s.casualties,meleeHits:s.meleeHits,bossSwipes:s.bossSwipes,missed:s.missedWeapons,choices:s.choicesTaken,powers:s.powersTaken,launched:s.launchedSoldiers,progression}));
    // The introductory sector can be carried by a well-timed power and upgraded
    // gun; from sector two onward neglecting recruitment must still fail.
    if(!process.env.TUNE&&!(level===0&&mode==='weapons')&&!(level>=10&&mode==='balanced'))assert.equal(s.state,mode==='balanced'?'victory':'defeat','level '+(level+1)+' '+mode+' seed '+seed);
    if(!process.env.TUNE&&mode==='balanced'&&level>=7){assert.ok(s.choicesTaken>0&&s.powersTaken>0,'late-sector tactics include earning and choosing rift powers');}
  }
  // The expansion is deliberately challenging across random reward draws. Each
  // stage must remain winnable on at least two of the three reproducible draws.
  if(!process.env.TUNE&&mode==='balanced'&&level>=10&&!process.env.SEED)assert.ok(victories>=Math.ceil(runs*2/3),'level '+(level+1)+' requires at least two tactical victories across three reward draws');
}
