import { WAVES, WEAPONS, BARRAGE_COOLDOWN, LIMITS, MAX_SQUAD, LANE_THRESHOLD } from '../../data/waves.js';
import { clamp, randomSource, formation } from './math.js';

export class Simulation {
  constructor(seed = 731) { this.seed = seed; this.reset(); this.preview(); }
  reset() {
    this.random = randomSource(this.seed);
    this.state = 'menu'; this.time = 0; this.waveTime = 0; this.wave = 0; this.kills = 0;
    this.player = { x: 0, z: 11, vx: 0, vz: 0, health: 100, squad: 9, weaponLevel: 1 };
    this.enemies = []; this.corpses = []; this.bullets = []; this.zones = [];
    this.recruits = []; this.armory = null; this.events = [];
    this.shootTimers = Array.from({ length: MAX_SQUAD }, (_, i) => i * .037);
    this.recoil = Array(MAX_SQUAD).fill(0); this.aim = Array(MAX_SQUAD).fill(0);
    this.nextId = 1; this.barrageCooldown = 0; this.clearTimer = -1;
    this.hurtCooldown = 0; this.bossTimer = 5; this.recruitTimer = 0;
    this.recruitHitCooldown = 0; this.focus = 'enemies'; this.steerX = null;
    this.recruited = 0; this.breaches = 0; this.shots = { recruits: 0, enemies: 0, weapons: 0 };
  }
  preview() {
    for (let i = 0; i < 96; i++) this.spawnEnemy(i, { hp: 80, speed: 2 }, i === 88 ? 'boss' : 'soldier');
    this.createTargets();
  }
  createTargets() {
    this.recruits = [];
    for (let i = 0; i < 8; i++) this.addRecruit(-1 - i * 5);
    this.createArmory();
  }
  addRecruit(z = -43) {
    this.recruits.push({ id: this.nextId++, type: 'recruit', x: -5.55, y: 1, z, hp: 1, maxHp: 1, reserved: 0, scale: 1, hit: 0 });
  }
  createArmory() {
    const next = WEAPONS[this.player.weaponLevel];
    this.armory = next ? { id: this.nextId++, type: 'weapon', x: 5.55, y: 2, z: -4,
      hp: next.cost, maxHp: next.cost, reserved: 0, scale: 1.6, hit: 0, level: this.player.weaponLevel + 1 } : null;
  }
  start() { this.reset(); this.state = 'active'; this.createTargets(); this.beginWave(0); }
  beginWave(index) {
    this.wave = index; this.waveTime = 0; this.clearTimer = -1;
    this.enemies = []; this.zones = []; this.state = 'active'; this.bossTimer = 5;
    const wave = WAVES[index];
    for (let i = 0; i < wave.count; i++) {
      const type = i >= wave.count - wave.grenadiers ? 'grenadier' : i < wave.brutes ? 'brute' : 'soldier';
      this.spawnEnemy(i, wave, type);
    }
    if (wave.boss) this.spawnEnemy(wave.count, wave, 'boss');
    this.events.push({ type: 'wave', index, name: wave.name, description: wave.description });
  }
  spawnEnemy(index, wave, type = 'soldier') {
    const boss = type === 'boss', brute = type === 'brute', hp = boss ? 11500 : wave.hp * (brute ? 2.3 : 1);
    this.enemies.push({
      id: this.nextId++, type, x: boss ? 0 : (index % 9 - 4) * .94 + (this.random() - .5) * .14,
      z: boss ? -55 : -26 - Math.floor(index / 9) * 1.62,
      y: 0, hp, maxHp: hp, reserved: 0, speed: wave.speed * (boss ? .55 : brute ? .91 : .96 + this.random() * .08),
      scale: boss ? 3.7 : brute ? 1.25 : .84 + this.random() * .09,
      phase: this.random() * Math.PI * 2, yaw: Math.PI, attackTimer: this.random() * 3 + 5,
      hit: 0, vx: 0, vz: 0, knockback: 0,
    });
  }
  pause() {
    if (this.state === 'paused') { this.state = 'active'; return; }
    if (this.state !== 'active') return;
    this.state = 'paused'; this.player.vx = this.player.vz = 0;
  }
  selectLane(lane) {
    if (this.state !== 'active' || !['recruits', 'enemies', 'weapons'].includes(lane)) return false;
    this.steerX = lane === 'recruits' ? -3.8 : lane === 'weapons' ? 3.8 : 0;
    return true;
  }
  barrage() {
    if (this.state !== 'active' || this.barrageCooldown > 0 || !this.enemies.length) return false;
    this.barrageCooldown = BARRAGE_COOLDOWN;
    const near = [...this.enemies].sort((a, b) => b.z - a.z);
    const center = near[Math.min(12, near.length - 1)];
    for (let i = 0; i < 5; i++) this.zones.push({
      id: this.nextId++, x: clamp(center.x + (this.random() - .5) * 7, -4.5, 4.5),
      z: center.z - this.random() * 7 + 2, radius: 3.8, remaining: .55 + i * .13, total: 1.35,
      friendly: true, damage: 100,
    });
    this.events.push({ type: 'barrage' }); return true;
  }
  target(x, z) {
    if (this.focus === 'recruits') {
      if (this.recruitHitCooldown > 0 || this.player.squad >= MAX_SQUAD) return null;
      // One active +1 target at a time: the rest remain visible as an approaching stream.
      return this.recruits.find(t => t.hp > 0 && t.reserved === 0 && t.z < this.player.z - 2 && this.player.z - t.z < 45) || null;
    }
    if (this.focus === 'weapons') return this.armory?.hp > this.armory?.reserved ? this.armory : null;
    let selected = null, best = Infinity;
    for (const enemy of this.enemies) {
      if (enemy.hp <= 0 || enemy.z > z + 3 || z - enemy.z > 57) continue;
      const score = Math.hypot(enemy.x - x, enemy.z - z) + Math.abs(enemy.x - x) * .6 + (enemy.reserved >= enemy.hp ? 1000 : 0);
      if (score < best) { best = score; selected = enemy; }
    }
    return selected;
  }
  tick(dt, input = {}) {
    if (this.state !== 'active') return;
    dt = clamp(dt, 0, 1 / 30); this.time += dt; this.waveTime += dt;
    this.barrageCooldown = Math.max(0, this.barrageCooldown - dt);
    this.hurtCooldown = Math.max(0, this.hurtCooldown - dt);
    this.recruitHitCooldown = Math.max(0, this.recruitHitCooldown - dt);
    const p = this.player;
    let ix = input.x || 0, iz = input.z || 0;
    if (ix) this.steerX = null;
    if (this.steerX !== null) ix = clamp((this.steerX - p.x) * 3, -1, 1);
    const magnitude = Math.max(1, Math.hypot(ix, iz)); ix /= magnitude; iz /= magnitude;
    p.vx += (ix * 9 - p.vx) * Math.min(1, dt * 14); p.vz += (iz * 7 - p.vz) * Math.min(1, dt * 14);
    p.x = clamp(p.x + p.vx * dt, LIMITS.minX, LIMITS.maxX); p.z = clamp(p.z + p.vz * dt, LIMITS.minZ, LIMITS.maxZ);
    this.focus = p.x < -LANE_THRESHOLD ? 'recruits' : p.x > LANE_THRESHOLD ? 'weapons' : 'enemies';
    if (input.barrage) this.barrage();

    this.recruitTimer -= dt;
    for (const target of this.recruits) { target.z += dt * 2.4; target.hit = Math.max(0, target.hit - dt * 5); }
    this.recruits = this.recruits.filter(t => t.hp > 0 && t.z < 20);
    if (this.recruitTimer <= 0 && this.recruits.length < 12) { this.addRecruit(); this.recruitTimer = .8; }
    if (this.armory) this.armory.hit = Math.max(0, this.armory.hit - dt * 5);
    const weapon = WEAPONS[p.weaponLevel - 1];
    for (let i = 0; i < p.squad; i++) {
      this.shootTimers[i] -= dt; this.recoil[i] = Math.max(0, this.recoil[i] - dt * 6);
      const f = formation(i, p.squad), sx = p.x + f.x, sz = p.z + f.z, target = this.target(sx, sz);
      if (target) {
        this.aim[i] = Math.atan2(-(target.x - sx), -(target.z - sz));
        if (this.shootTimers[i] <= 0 && this.bullets.length < 360) {
          const x = sx - Math.sin(this.aim[i]) * 1.35, z = sz - Math.cos(this.aim[i]) * 1.35;
          this.bullets.push({ id: this.nextId++, x, y: 1.56, z, target, damage: weapon.damage, life: 0, speed: weapon.speed,
            tx: target.x, ty: target.y || target.scale * 1.15, tz: target.z, weaponLevel: p.weaponLevel, splash: weapon.splash, color: weapon.color });
          target.reserved += weapon.damage; this.shots[this.focus]++;
          if (target.type === 'recruit') this.recruitHitCooldown = .38;
          this.events.push({ type: 'shot', x, y: 1.56, z, yaw: this.aim[i], weaponLevel: p.weaponLevel, color: weapon.color });
          this.shootTimers[i] = weapon.interval * (.94 + this.random() * .12); this.recoil[i] = 1;
        }
      } else this.aim[i] *= 1 - dt * 3;
    }

    for (const enemy of this.enemies) {
      if (enemy.hp <= 0) continue;
      enemy.hit = Math.max(0, enemy.hit - dt * 4); enemy.attackTimer -= dt;
      const dx = p.x - enemy.x, dz = p.z - enemy.z, near = dz < 9;
      const speed = enemy.speed * (enemy.knockback > 0 ? -.5 : 1);
      enemy.knockback = Math.max(0, enemy.knockback - dt);
      enemy.vx = clamp(dx * (near ? .48 : .009), -1.5, 1.5); enemy.vz = speed;
      if (enemy.type === 'boss' && enemy.z > -9) enemy.vz = 0;
      enemy.x = clamp(enemy.x + enemy.vx * dt, -5.4, 5.4); enemy.z += enemy.vz * dt;
      enemy.yaw = Math.PI + Math.atan2(enemy.vx, Math.max(.5, Math.abs(enemy.vz)));
      enemy.phase += dt * Math.abs(speed) * 3.2;
      if (enemy.type === 'boss') {
        this.bossTimer -= dt;
        if (this.bossTimer <= 0) {
          this.bossTimer = enemy.hp < enemy.maxHp * .45 ? 4 : 5.5;
          for (let n = 0; n < 2; n++) this.zones.push({ id: this.nextId++, x: clamp(p.x + (n - .5) * 2.2, -5.4, 5.4),
            z: p.z + n * .6, radius: 2, remaining: 2 + n * .2, total: 2 + n * .2, friendly: false, damage: 13 });
          this.events.push({ type: 'warning', text: 'INCOMING IMPACT — MOVE OUT OF THE RED ZONES' });
        }
      } else if (enemy.type === 'grenadier' && dz < 37 && enemy.attackTimer <= 0) {
        enemy.attackTimer = 10 + this.random() * 3;
        this.zones.push({ id: this.nextId++, x: p.x, z: p.z, radius: 1.8, remaining: 2, total: 2, friendly: false, damage: 9 });
      }
      if (Math.hypot(dx, dz) < 1.8 * enemy.scale && enemy.type !== 'boss' && enemy.attackTimer <= 0) {
        this.hurt(enemy.type === 'brute' ? 9 : 4); enemy.attackTimer = 1.25; enemy.knockback = .2;
      }
      if (enemy.z > 22) { enemy.hp = 0; enemy.escaped = true; this.breaches++; this.hurt(enemy.type === 'brute' ? 8 : 4, true); }
    }

    for (const bullet of this.bullets) {
      bullet.life += dt;
      if (bullet.target.hp > 0) { bullet.tx = bullet.target.x; bullet.ty = bullet.target.y || bullet.target.scale * 1.15; bullet.tz = bullet.target.z; }
      const dx = bullet.tx - bullet.x, dy = bullet.ty - bullet.y, dz = bullet.tz - bullet.z;
      const distance = Math.hypot(dx, dy, dz), travel = bullet.speed * dt;
      if (distance <= travel + .3) {
        bullet.done = true; bullet.target.reserved = Math.max(0, bullet.target.reserved - bullet.damage);
        if (bullet.target.hp > 0) {
          this.damage(bullet.target, bullet.damage, false);
          if (bullet.splash && !['recruit', 'weapon'].includes(bullet.target.type)) {
            for (const other of this.enemies) if (other !== bullet.target && other.hp > 0 && Math.hypot(other.x - bullet.tx, other.z - bullet.tz) < bullet.splash) this.damage(other, bullet.damage * .55, true);
            this.events.push({ type: 'cannon', x: bullet.tx, y: .6, z: bullet.tz });
          }
        }
      } else { bullet.x += dx / distance * travel; bullet.y += dy / distance * travel; bullet.z += dz / distance * travel; }
      if (!bullet.done && bullet.life > 2) { bullet.done = true; bullet.target.reserved = Math.max(0, bullet.target.reserved - bullet.damage); }
    }
    this.bullets = this.bullets.filter(b => !b.done);
    for (const zone of this.zones) {
      zone.remaining -= dt; if (zone.remaining > 0 || zone.done) continue; zone.done = true;
      this.events.push({ type: 'explosion', x: zone.x, y: .2, z: zone.z, friendly: zone.friendly, radius: zone.radius });
      if (zone.friendly) {
        for (const enemy of this.enemies) if (Math.hypot(enemy.x - zone.x, enemy.z - zone.z) < zone.radius + enemy.scale * .3) this.damage(enemy, zone.damage, true);
      } else if (Math.hypot(p.x - zone.x, p.z - zone.z) < zone.radius + .35) this.hurt(zone.damage);
    }
    this.zones = this.zones.filter(z => !z.done);
    for (const enemy of this.enemies) {
      if (enemy.hp > 0 || enemy.escaped) continue;
      this.kills++; this.corpses.push({ ...enemy, age: 0, spin: (this.random() - .5) * 3, lift: enemy.blast ? 3.3 : 1.2 });
      this.events.push({ type: 'death', x: enemy.x, y: enemy.scale, z: enemy.z, scale: enemy.scale, boss: enemy.type === 'boss' });
    }
    this.enemies = this.enemies.filter(e => e.hp > 0);
    for (const corpse of this.corpses) corpse.age += dt;
    this.corpses = this.corpses.filter(c => c.age < 4.5).slice(-72);
    if (p.health <= 0) { this.finish(false); return; }
    if (!this.enemies.length) {
      this.zones = [];
      if (this.clearTimer < 0) { this.clearTimer = 3; this.events.push({ type: 'regroup', text: 'WAVE CLEARED — KEEP FIRING. NEXT ASSAULT IN 3s' }); }
      this.clearTimer -= dt;
      if (this.clearTimer <= 0) {
        if (this.wave === WAVES.length - 1) this.finish(true);
        else { p.health = Math.min(100, p.health + 10); this.beginWave(this.wave + 1); }
      }
    }
  }
  damage(target, amount, blast) {
    if (target.hp <= 0) return;
    target.hp -= amount; target.hit = 1; target.blast = blast;
    this.events.push({ type: 'hit', x: target.x, y: target.y || target.scale * 1.2, z: target.z, blast, scale: target.scale, friendly: ['recruit', 'weapon'].includes(target.type) });
    if (target.type === 'recruit') {
      if (target.hp <= 0 && this.player.squad < MAX_SQUAD) { this.player.squad++; this.recruited++; this.events.push({ type: 'recruit', x: target.x, z: target.z, amount: 1 }); }
    } else if (target.type === 'weapon') {
      if (target.hp <= 0 && target === this.armory) {
        this.player.weaponLevel++; this.events.push({ type: 'weapon', level: this.player.weaponLevel, name: WEAPONS[this.player.weaponLevel - 1].name, x: target.x, z: target.z });
        this.createArmory();
      }
    } else if (blast && target.type !== 'boss') target.knockback = .35;
  }
  hurt(amount, breach = false) {
    if (this.state !== 'active' || (!breach && this.hurtCooldown > 0)) return;
    this.player.health = Math.max(0, this.player.health - amount);
    if (!breach) this.hurtCooldown = .22;
    this.events.push({ type: 'hurt', amount });
  }
  finish(won) { this.state = won ? 'victory' : 'defeat'; this.bullets = []; this.zones = []; this.events.push({ type: this.state }); }
  drainEvents() { const events = this.events; this.events = []; return events; }
  snapshot() {
    return { state: this.state, wave: this.wave + 1, time: this.time, kills: this.kills, health: this.player.health,
      squad: this.player.squad, weaponLevel: this.player.weaponLevel, weaponName: WEAPONS[this.player.weaponLevel - 1].name,
      focus: this.focus, recruited: this.recruited, breaches: this.breaches, shots: { ...this.shots },
      x: this.player.x, z: this.player.z, enemies: this.enemies.length,
      nearestEnemy: this.enemies.length ? Math.max(...this.enemies.map(e => e.z)) : -100,
      bullets: this.bullets.length, corpses: this.corpses.length, cooldown: this.barrageCooldown,
      armory: this.armory ? { hp: this.armory.hp, maxHp: this.armory.maxHp, level: this.armory.level, name: WEAPONS[this.armory.level - 1].name } : null,
      recruits: this.recruits.filter(t => t.hp > 0).length,
      zones: this.zones.map(z => ({ x: z.x, z: z.z, radius: z.radius, friendly: z.friendly, remaining: z.remaining })),
      bossHealth: this.enemies.find(e => e.type === 'boss')?.hp || 0 };
  }
}
