// Ordinary player decisions: choose a lane, move out of impact zones, use artillery.
// No direct damage, free upgrades, health changes, or hidden difficulty adjustments.
export function strategy(s, mode = 'balanced') {
  const soldierGoal = (s.level===2?[21,30,38,42]:[15,25,34,42])[s.wave - 1];
  const weaponGoal = [2, 3, 4, 4][s.wave - 1];
  let lane = 'enemies';
  if (s.nearestEnemy < s.z - 9) {
    if (mode !== 'weapons' && mode !== 'none' && s.squad < soldierGoal && s.recruits > 0) lane = 'recruits';
    else if (mode !== 'recruits' && mode !== 'none' && s.weaponLevel < weaponGoal && s.armory) lane = 'weapons';
    const damagePerSecond=s.squad*[9/.64,12/.44,16/.29,35/.45][s.weaponLevel-1];
    if(mode!=='recruits'&&mode!=='none'&&s.weaponLevel<weaponGoal&&s.armory&&s.armory.remaining<s.armory.hp/damagePerSecond+4)lane='weapons';
  }
  const x = lane === 'recruits' ? -3.8 : lane === 'weapons' ? 3.8 : 0;
  let targetZ = 11, best = Infinity;
  for (const z of [5, 11, 16]) {
    let score = Math.abs(z - 11) * .15;
    for (const zone of s.zones) if (!zone.friendly && Math.hypot(x-zone.x, z-zone.z) < zone.radius + .9) score += 30;
    if (score < best) { best = score; targetZ = z; }
  }
  return { x: Math.max(-1, Math.min(1, (x-s.x)*3)), z: Math.max(-1, Math.min(1, (targetZ-s.z)*3)), barrage: mode !== 'balanced-no-art' };
}
