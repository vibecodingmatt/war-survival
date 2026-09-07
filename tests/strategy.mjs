// Ordinary player decisions: choose a lane, move out of impact zones, use artillery.
// No direct damage, free upgrades, health changes, or hidden difficulty adjustments.
export function strategy(s, mode = 'balanced') {
  const soldierGoal = [16, 24, 32, 38][s.wave - 1];
  const weaponGoal = [2, 3, 4, 4][s.wave - 1];
  let lane = 'enemies';
  if (s.nearestEnemy < s.z - 9) {
    if (mode !== 'weapons' && mode !== 'none' && s.squad < soldierGoal) lane = 'recruits';
    else if (mode !== 'recruits' && mode !== 'none' && s.weaponLevel < weaponGoal) lane = 'weapons';
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
