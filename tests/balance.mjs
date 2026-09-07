import { Simulation } from '../js/core/simulation.js';
import { strategy } from './strategy.mjs';
for (const mode of ['none', 'recruits', 'weapons', 'balanced', 'balanced-no-art']) {
  for (const seed of [731, 19, 2048]) {
    const sim = new Simulation(seed); sim.start(); const progression = [];
    let previousWave = 0, input = {}, steps = 0;
    while (sim.state === 'active' && sim.time < 300) {
      if (steps++ % 12 === 0) input = strategy(sim.snapshot(), mode);
      if (sim.wave !== previousWave) { progression.push({ wave: previousWave+1, health: Math.ceil(sim.player.health), squad: sim.player.squad, gun: sim.player.weaponLevel, time: Math.round(sim.time) }); previousWave=sim.wave; }
      sim.tick(1/60,input); sim.drainEvents();
    }
    const s=sim.snapshot();
    console.log(JSON.stringify({mode,seed,result:s.state,wave:s.wave,time:Math.round(s.time),health:s.health,squad:s.squad,gun:s.weaponLevel,kills:s.kills,breaches:s.breaches,progression}));
  }
}
