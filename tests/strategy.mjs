// Ordinary player decisions: choose a lane, move out of impact zones, use artillery.
// No direct damage, free upgrades, health changes, or hidden difficulty adjustments.
export function strategy(s, mode = 'balanced') {
  const soldierGoal = (s.level>=2?[21,30,38,42]:[15,25,34,42])[s.wave - 1];
  // Later sectors offer the second upgrade during wave one; waiting wastes its window.
  const weaponGoal = s.enemies<18&&s.wave>=2 ? 4 : [s.level>=3?3:2, 3, 4, 4][s.wave - 1];
  let lane = 'enemies';
  if (s.nearestEnemy < s.z - 9) {
    if (mode !== 'weapons' && mode !== 'none' && s.squad < soldierGoal && s.recruits > 0) lane = 'recruits';
    else if (mode !== 'recruits' && mode !== 'none' && s.weaponLevel < weaponGoal && s.armory) lane = 'weapons';
    const damagePerSecond=s.squad*s.weaponDps;
    if(mode!=='recruits'&&mode!=='none'&&s.weaponLevel<weaponGoal&&s.armory&&s.armory.remaining<s.armory.hp/damagePerSecond+4)lane='weapons';
  }
  if(s.choice&&mode.startsWith('balanced')&&s.nearestEnemy<s.z-6){
    const [left,right]=s.choice.options;
    // Avoid spending an entire rift on one or two recruits; compare both powers in a duel.
    const needSoldiers=s.squad<=soldierGoal-3;
    const powerValue=kind=>({starfall:9,quack:8,gravity:7,stampede:6,prism:s.weaponLevel>=3?8:4,tesla:5,phoenix:s.health<80?12:7}[kind]||0)-(s.buffs?.[kind]>3?5:0);
    lane=left.kind==='reinforce'?(needSoldiers?'recruits':'weapons'):left.kind==='aegis'?(s.health<55&&s.shield<15?'recruits':'weapons'):powerValue(left.kind)>powerValue(right.kind)?'recruits':'weapons';
  }
  const x = lane === 'recruits' ? -3.8 : lane === 'weapons' ? 3.8 : 0;
  const lateral=mode.startsWith('balanced')?[-1.8,1.8,-3.8,3.8]:[-1.8,1.8];
  let targetZ = 11, targetX=x, best = Infinity;
  for (const candidateX of [x,...(x===0?lateral:[])]) for (const z of [5, 8, 11, 14, 16]) {
    let score = Math.abs(z - 11) * .15+Math.abs(candidateX-x)*.3+Math.hypot(candidateX-s.x,z-s.z)*.05;
    score+=Math.max(0,s.nearestEnemy+3.5-z)*8;
    // A telegraphed guardian swing is more dangerous than briefly approaching infantry.
    for (const zone of s.zones) if (!zone.friendly && Math.hypot(candidateX-zone.x, z-zone.z) < zone.radius + (zone.melee?1.2:.9)) score += zone.melee&&mode.startsWith('balanced')?100:30;
    if (score < best) { best = score; targetZ = z;targetX=candidateX; }
  }
  return { x: Math.max(-1, Math.min(1, (targetX-s.x)*3)), z: Math.max(-1, Math.min(1, (targetZ-s.z)*3)), barrage: mode !== 'balanced-no-art' };
}
