import { Simulation } from '../js/core/simulation.js';
import { strategy } from './strategy.mjs';
import { LEVELS } from '../data/waves.js';
import assert from 'node:assert/strict';
for (const level of LEVELS.map((_,i)=>i).filter(i=>!process.env.LEVEL||i+1===Number(process.env.LEVEL))) for (const mode of (process.env.MODE?[process.env.MODE]:['none', 'recruits', 'weapons', 'balanced'])) {
  for (const seed of (process.env.SEED?[Number(process.env.SEED)]:[731, 19, 2048])) {
    const sim = new Simulation(seed); sim.start(level); const progression = [];
    let previousWave = 0, input = {}, steps = 0;
    while (sim.state === 'active' && sim.time < 300) {
      if (steps++ % 12 === 0) input = strategy(sim.snapshot(), mode);
      if (sim.wave !== previousWave) { progression.push({ wave: previousWave+1, health: Math.ceil(sim.player.health), squad: sim.player.squad, gun: sim.player.weaponLevel, time: Math.round(sim.time) }); previousWave=sim.wave; }
      sim.tick(1/60,input); sim.drainEvents();
    }
    const s=sim.snapshot();
    console.log(JSON.stringify({level:level+1,mode,seed,result:s.state,wave:s.wave,time:Math.round(s.time),health:s.health,squad:s.squad,gun:s.weaponLevel,kills:s.kills,breaches:s.breaches,casualties:s.casualties,meleeHits:s.meleeHits,bossSwipes:s.bossSwipes,missed:s.missedWeapons,progression}));
    if(!process.env.TUNE)assert.equal(s.state,mode==='balanced'?'victory':'defeat','level '+(level+1)+' '+mode+' seed '+seed);
    if(!process.env.TUNE&&mode==='balanced'&&level>=7){assert.ok(s.casualties>0&&s.meleeHits>0&&s.bossSwipes>0,'late guardians reach the squad, inflict casualties, and remain beatable');}
  }
}
