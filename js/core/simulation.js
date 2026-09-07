import { WAVES, BARRAGE_COOLDOWN, LIMITS, MAX_SQUAD } from '../../data/waves.js';
import { clamp, randomSource, formation } from './math.js';

// Rendering-independent fixed-step combat. All transient collections are bounded.
export class Simulation {
  constructor(seed = 731) { this.seed = seed; this.reset(); this.preview(); }
  reset() {
    this.random = randomSource(this.seed);
    this.state = 'menu'; this.previousState = 'active';
    this.time = 0; this.waveTime = 0; this.wave = 0; this.kills = 0;
    this.player = { x: 0, z: 11, vx: 0, vz: 0, health: 100, squad: 9, damage: 12, weaponLevel: 1 };
    this.enemies = []; this.corpses = []; this.bullets = []; this.zones = []; this.pickups = [];
    this.events = []; this.shootTimers = Array.from({ length: MAX_SQUAD }, (_, i) => i * 0.062);
    this.recoil = Array(MAX_SQUAD).fill(0); this.aim = Array(MAX_SQUAD).fill(0);
    this.nextId = 1; this.barrageCooldown = 0; this.clearTimer = -1; this.spawnedPickup = false;
    this.hurtCooldown = 0; this.bossTimer = 4; this.paused = false;
  }
  preview() {
    for (let i = 0; i < 56; i++) this.spawnEnemy(i, { hp: 80, speed: 2.4 }, i === 52 ? 'boss' : 'soldier', true);
  }
  start() { this.reset(); this.state = 'active'; this.beginWave(0); }
  beginWave(index) {
    this.wave = index; this.waveTime = 0; this.clearTimer = -1; this.spawnedPickup = false;
    this.enemies = []; this.bullets = []; this.zones = []; this.pickups = [];
    this.state = 'active'; this.bossTimer = 4;
    const wave = WAVES[index];
    for (let i = 0; i < wave.count; i++) {
      const type = i >= wave.count - wave.grenadiers ? 'grenadier' : i < wave.brutes ? 'brute' : 'soldier';
      this.spawnEnemy(i, wave, type);
    }
    if (wave.boss) this.spawnEnemy(wave.count + 4, wave, 'boss');
    this.events.push({ type: 'wave', index, name: wave.name, description: wave.description });
  }
  spawnEnemy(index, wave, type = 'soldier', preview = false) {
    const boss = type === 'boss', brute = type === 'brute';
    const hp = boss ? 5200 : wave.hp * (brute ? 3.5 : 1.25);
    this.enemies.push({
      id: this.nextId++, type, x: boss ? 0 : (index % 7 - 3) * 1.6 + (this.random() - 0.5) * 0.3,
      z: boss ? (preview ? -45 : -45) : -27 - Math.floor(index / 7) * 2.4 - (preview ? 1 : 0),
      y: 0, hp, maxHp: hp, reserved: 0, speed: wave.speed * (boss ? 0.62 : brute ? 0.8 : 0.95 + this.random() * 0.16),
      scale: boss ? 3.7 : brute ? 1.45 : 0.92 + this.random() * 0.13,
      phase: this.random() * Math.PI * 2, yaw: Math.PI, attackTimer: this.random() * 2 + 3,
      hit: 0, vx: 0, vz: 0, knockback: 0,
    });
  }
  pause() {
    if (this.state === 'paused') { this.state = this.previousState; this.paused = false; return; }
    if (this.state !== 'active') return;
    this.previousState = this.state; this.state = 'paused'; this.paused = true;
    this.player.vx = this.player.vz = 0;
  }
  upgrade(kind) {
    if (this.state !== 'upgrade' || !['recruits', 'damage', 'repair'].includes(kind)) return false;
    if (kind === 'recruits') this.player.squad = Math.min(MAX_SQUAD, this.player.squad + 3);
    if (kind === 'damage') { this.player.damage *= 1.3; this.player.weaponLevel++; }
    if (kind === 'repair') { this.player.health = Math.min(100, this.player.health + 45); this.barrageCooldown = 0; }
    this.beginWave(this.wave + 1);
    return true;
  }
  barrage() {
    if (this.state !== 'active' || this.barrageCooldown > 0 || !this.enemies.length) return false;
    this.barrageCooldown = BARRAGE_COOLDOWN;
    const near = [...this.enemies].sort((a, b) => b.z - a.z);
    const center = near[Math.min(6, near.length - 1)];
    for (let i = 0; i < 5; i++) {
      this.zones.push({ id: this.nextId++, x: clamp(center.x + (this.random() - 0.5) * 10, -5.5, 5.5),
        z: center.z - this.random() * 8 + 3, radius: 3.8, remaining: 0.55 + i * 0.13, total: 1.35,
        friendly: true, damage: 105 });
    }
    this.events.push({ type: 'barrage' });
    return true;
  }
  target(x, z, reserve = true) {
    let selected = null, best = Infinity;
    for (const enemy of this.enemies) {
      if (enemy.hp <= 0 || enemy.z > z + 3 || z - enemy.z > 52) continue;
      const score = Math.hypot(enemy.x - x, enemy.z - z) + Math.abs(enemy.x - x) * 0.7 +
        (reserve && enemy.reserved >= enemy.hp ? 1000 : 0);
      if (score < best) { best = score; selected = enemy; }
    }
    return selected;
  }
  tick(dt, input = {}) {
    if (this.state !== 'active') return;
    dt = clamp(dt, 0, 1 / 30);
    this.time += dt; this.waveTime += dt;
    this.barrageCooldown = Math.max(0, this.barrageCooldown - dt);
    this.hurtCooldown = Math.max(0, this.hurtCooldown - dt);
    const p = this.player;
    let ix = input.x || 0, iz = input.z || 0;
    const magnitude = Math.max(1, Math.hypot(ix, iz)); ix /= magnitude; iz /= magnitude;
    p.vx += (ix * 8.6 - p.vx) * Math.min(1, dt * 14);
    p.vz += (iz * 7 - p.vz) * Math.min(1, dt * 14);
    p.x = clamp(p.x + p.vx * dt, LIMITS.minX, LIMITS.maxX);
    p.z = clamp(p.z + p.vz * dt, LIMITS.minZ, LIMITS.maxZ);
    if (input.barrage) this.barrage();

    for (let i = 0; i < p.squad; i++) {
      this.shootTimers[i] -= dt; this.recoil[i] = Math.max(0, this.recoil[i] - dt * 6);
      const f = formation(i), sx = p.x + f.x, sz = p.z + f.z;
      const target = this.target(sx, sz);
      if (target) {
        this.aim[i] = Math.atan2(-(target.x - sx), -(target.z - sz));
        if (this.shootTimers[i] <= 0) {
          const damage = p.damage;
          const x = sx + Math.sin(this.aim[i]) * -1.05, z = sz + Math.cos(this.aim[i]) * -1.05;
          const bullet = { id: this.nextId++, x, y: 1.4, z, target, damage, life: 0, speed: 65,
            startX: x, startY: 1.4, startZ: z, tx: target.x, ty: target.scale * 1.1, tz: target.z };
          this.bullets.push(bullet); target.reserved += damage;
          this.events.push({ type: 'shot', x, y: 1.4, z, yaw: this.aim[i] });
          this.shootTimers[i] = 0.52 + this.random() * 0.13; this.recoil[i] = 1;
        }
      } else this.aim[i] *= 1 - dt * 3;
    }

    for (const enemy of this.enemies) {
      if (enemy.hp <= 0) continue;
      enemy.hit = Math.max(0, enemy.hit - dt * 4);
      enemy.attackTimer -= dt;
      const dx = p.x - enemy.x, dz = p.z - enemy.z;
      const near = dz < 12;
      const speed = enemy.speed * (enemy.knockback > 0 ? -0.7 : 1);
      enemy.knockback = Math.max(0, enemy.knockback - dt);
      enemy.vx = clamp(dx * (near ? 0.6 : 0.028), -1.4, 1.4);
      enemy.vz = speed;
      if (enemy.type === 'boss' && enemy.z > -8) enemy.vz = 0;
      enemy.x = clamp(enemy.x + enemy.vx * dt, -5.65, 5.65);
      enemy.z += enemy.vz * dt;
      enemy.yaw = Math.PI + Math.atan2(enemy.vx, Math.max(0.5, Math.abs(enemy.vz)));
      enemy.phase += dt * Math.abs(speed) * 3.2;
      if (enemy.type === 'boss') {
        this.bossTimer -= dt;
        if (this.bossTimer <= 0) {
          this.bossTimer = enemy.hp < enemy.maxHp * 0.45 ? 2.8 : 4.2;
          for (let n = 0; n < 3; n++) {
            this.zones.push({ id: this.nextId++, x: clamp(p.x + (n - 1) * 2.9, -5.4, 5.4),
              z: p.z + n * 0.5, radius: 2.5, remaining: 1.7 + n * 0.16, total: 1.7 + n * 0.16,
              friendly: false, damage: 19 });
          }
          this.events.push({ type: 'warning', text: 'INCOMING IMPACT — MOVE OUT OF THE RED ZONES' });
        }
      } else if (enemy.type === 'grenadier' && dz < 42 && enemy.attackTimer <= 0) {
        enemy.attackTimer = 7 + this.random() * 2;
        this.zones.push({ id: this.nextId++, x: p.x, z: p.z, radius: 2.1, remaining: 1.65, total: 1.65, friendly: false, damage: 12 });
      }
      if (Math.hypot(dx, dz) < 2.4 * enemy.scale && enemy.type !== 'boss' && enemy.attackTimer <= 0) {
        this.hurt(enemy.type === 'brute' ? 11 : 5); enemy.attackTimer = 1.25;
        enemy.knockback = 0.25;
      }
      if (enemy.z > 22) { enemy.hp = 0; this.hurt(enemy.type === 'brute' ? 9 : 4); enemy.escaped = true; }
    }

    for (const bullet of this.bullets) {
      bullet.life += dt;
      if (bullet.target.hp > 0) { bullet.tx = bullet.target.x; bullet.ty = bullet.target.scale * 1.2; bullet.tz = bullet.target.z; }
      const dx = bullet.tx - bullet.x, dy = bullet.ty - bullet.y, dz = bullet.tz - bullet.z;
      const distance = Math.hypot(dx, dy, dz), travel = bullet.speed * dt;
      if (distance <= travel + 0.3) {
        bullet.done = true;
        bullet.target.reserved = Math.max(0, bullet.target.reserved - bullet.damage);
        if (bullet.target.hp > 0) this.damage(bullet.target, bullet.damage, false);
      } else { bullet.x += dx / distance * travel; bullet.y += dy / distance * travel; bullet.z += dz / distance * travel; }
      if (!bullet.done && bullet.life > 1.7) { bullet.done = true; bullet.target.reserved = Math.max(0, bullet.target.reserved - bullet.damage); }
    }
    this.bullets = this.bullets.filter(b => !b.done).slice(-220);
    for (const zone of this.zones) {
      zone.remaining -= dt;
      if (zone.remaining > 0 || zone.done) continue;
      zone.done = true;
      this.events.push({ type: 'explosion', x: zone.x, y: 0.2, z: zone.z, friendly: zone.friendly, radius: zone.radius });
      if (zone.friendly) {
        for (const enemy of this.enemies) if (Math.hypot(enemy.x - zone.x, enemy.z - zone.z) < zone.radius + enemy.scale * 0.3) this.damage(enemy, zone.damage, true);
      } else if (Math.hypot(p.x - zone.x, p.z - zone.z) < zone.radius + 0.5) this.hurt(zone.damage);
    }
    this.zones = this.zones.filter(z => !z.done);
    for (const enemy of this.enemies) {
      if (enemy.hp > 0) continue;
      if (!enemy.escaped) {
        this.kills++; this.corpses.push({ ...enemy, age: 0, spin: (this.random() - 0.5) * 3, lift: enemy.blast ? 3.3 : 1.2 });
        this.events.push({ type: 'death', x: enemy.x, y: enemy.scale, z: enemy.z, scale: enemy.scale, boss: enemy.type === 'boss' });
      }
    }
    this.enemies = this.enemies.filter(e => e.hp > 0);
    for (const corpse of this.corpses) corpse.age += dt;
    this.corpses = this.corpses.filter(c => c.age < 5).slice(-64);

    if (!this.spawnedPickup && this.waveTime > 8) {
      this.spawnedPickup = true;
      this.pickups.push({ id: this.nextId++, x: this.wave % 2 ? 3.8 : -3.8, z: 8, age: 0 });
      this.events.push({ type: 'supply', text: 'REINFORCEMENTS ARRIVED — COLLECT THE BLUE CRATE' });
    }
    for (const pickup of this.pickups) {
      pickup.age += dt;
      if (Math.hypot(p.x - pickup.x, p.z - pickup.z) < 1.8) {
        pickup.done = true;
        const amount = Math.min(2, MAX_SQUAD - p.squad); p.squad += amount;
        p.health = Math.min(100, p.health + 6);
        this.events.push({ type: 'recruit', x: pickup.x, z: pickup.z, amount });
      }
    }
    this.pickups = this.pickups.filter(pickup => !pickup.done);
    if (p.health <= 0) { this.finish(false); return; }
    if (!this.enemies.length) {
      this.zones = [];
      if (this.clearTimer < 0) this.clearTimer = 2;
      this.clearTimer -= dt;
      if (this.clearTimer <= 0) {
        if (this.wave === WAVES.length - 1) this.finish(true);
        else { this.state = 'upgrade'; this.events.push({ type: 'upgrade' }); }
      }
    }
  }
  damage(enemy, amount, blast) {
    if (enemy.hp <= 0) return;
    enemy.hp -= amount; enemy.hit = 1; enemy.blast = blast;
    if (blast && enemy.type !== 'boss') enemy.knockback = 0.45;
    this.events.push({ type: 'hit', x: enemy.x, y: enemy.scale * 1.2, z: enemy.z, blast, scale: enemy.scale });
  }
  hurt(amount) {
    if (this.state !== 'active' || this.hurtCooldown > 0) return;
    this.player.health = Math.max(0, this.player.health - amount);
    this.hurtCooldown = 0.22;
    this.events.push({ type: 'hurt', amount });
  }
  finish(won) {
    this.state = won ? 'victory' : 'defeat';
    this.bullets = []; this.zones = [];
    this.events.push({ type: this.state });
  }
  drainEvents() { const events = this.events; this.events = []; return events; }
  snapshot() {
    return { state: this.state, wave: this.wave + 1, time: this.time, kills: this.kills, health: this.player.health,
      squad: this.player.squad, x: this.player.x, z: this.player.z, enemies: this.enemies.length,
      bullets: this.bullets.length, corpses: this.corpses.length, cooldown: this.barrageCooldown,
      zones: this.zones.map(z => ({ x: z.x, z: z.z, radius: z.radius, friendly: z.friendly, remaining: z.remaining })),
      pickups: this.pickups.map(p => ({ x: p.x, z: p.z })), bossHealth: this.enemies.find(e => e.type === 'boss')?.hp || 0 };
  }
}
