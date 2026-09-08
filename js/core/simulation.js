import { LEVELS, BARRAGE_COOLDOWN, LIMITS, MAX_SQUAD, LANE_THRESHOLD, SUPPLY_EXIT } from '../../data/waves.js?v=0.7.0';
import { clamp, randomSource, formation } from './math.js?v=0.7.0';
import { BOSS_TYPES } from '../../data/campaign.js?v=0.7.0';
import { updateChoices, updatePowers, openChoice, phoenixRescue, fling } from './encounters.js?v=0.7.0';
import { nextSupply, collectSupply, fireVolley, ammoImpact } from './munitions.js?v=0.7.0';
import { SUPPLIES } from '../../data/munitions.js?v=0.7.0';

export class Simulation {
  constructor(seed = 731) { this.seed = seed; this.reset(); this.preview(); }
  get levelData() { return LEVELS[this.level]; }
  get weapons() { return this.levelData.weapons; }
  get weapon() { return this.weapons[this.player.weaponLevel-1]; }
  reset(level = 0) {
    this.level = clamp(Math.floor(Number(level) || 0), 0, LEVELS.length - 1);
    this.random = randomSource(this.seed);
    this.rewardRandom=randomSource((this.seed^0x71ac32)+(this.level+1)*911);this.powerBag=[];this.lastOfferedPower=null;
    this.supplyRandom=randomSource((this.seed^0x294fa1)+(this.level+1)*577);this.supplyBag=[];this.ammo=null;
    this.state = 'menu'; this.time = 0; this.waveTime = 0; this.wave = 0; this.kills = 0;
    this.player = { x: 0, z: 11, vx: 0, vz: 0, health: 100, squad: 9, weaponLevel: 1 };
    this.enemies = []; this.corpses = []; this.fallen = []; this.bullets = []; this.zones = [];
    this.recruits = []; this.armory = null; this.events = [];
    this.shootTimers = Array.from({ length: MAX_SQUAD }, (_, i) => i * .037);
    this.recoil = Array(MAX_SQUAD).fill(0); this.aim = Array(MAX_SQUAD).fill(0);
    this.nextId = 1; this.barrageCooldown = 0; this.clearTimer = -1;
    this.hurtCooldown = 0; this.bossTimer = 5; this.recruitTimer = 0;
    this.recruitHitCooldown = 0; this.focus = 'enemies'; this.steerX = null;
    this.recruited = 0; this.breaches = 0; this.shots = { recruits: 0, enemies: 0, weapons: 0 };
    this.weaponTimer = 0; this.missedWeapons = 0; this.casualties = 0; this.casualtyDamage = 0;
    this.pods=[];this.podTimer=12;this.podsOpened=0;this.cartsDestroyed=0;
    this.buffs={overdrive:0,rally:0,starfall:0,tesla:0,prism:0,gravity:0,phoenix:0,quack:0,stampede:0};this.shield=0;
    this.choice=null;this.choiceTimer=8;this.choiceCount=0;this.choicesTaken=0;this.powersTaken=0;this.lastChoice=null;
    this.powerTimers={starfall:0,tesla:0,prism:0,gravity:0,phoenix:0,quack:0,stampede:0};this.launchedSoldiers=0;this.knockups=[];
    this.toyTanks=[];this.cheer=0;
    this.gravityWell=null;this.phoenixFlight=null;this.phoenixSaves=0;
    this.meleeHits=0;this.bossSwipes=0;
    this.bossMaxHp=0;
  }
  preview() {
    for (let i = 0; i < 96; i++) this.spawnEnemy(i, { hp: 80, speed: 2 }, i === 88 ? 'boss' : 'soldier');
    this.createTargets();
  }
  createTargets() {
    this.recruits = [];
    this.recruitBurst(-3);
    this.createArmory();
  }
  recruitBurst(z = -24) {
    if (this.player.squad >= MAX_SQUAD) return;
    const count = Math.min(this.levelData.recruitBatch, MAX_SQUAD - this.player.squad);
    for (let i = 0; i < count; i++) this.addRecruit(z - i * 2.4);
    this.recruitTimer = this.levelData.recruitInterval;
  }
  addRecruit(z = -24, amount=1) {
    this.recruits.push({ id: this.nextId++, type: 'recruit', amount, x: -5.55, y: 1, z, hp: 1, maxHp: 1, reserved: 0, scale: 1, hit: 0 });
  }
  createArmory() {
    const next = this.weapons[this.player.weaponLevel];
    this.armory = next ? { id: this.nextId++, type: 'weapon', x: 5.55, y: 2.5, z: -14,
      hp: next.cost, maxHp: next.cost, reserved: 0, scale: 1.6, hit: 0, level: this.player.weaponLevel + 1 } : null;
  }
  start(level = this.level) {
    this.reset(level);this.state='active';this.createTargets();this.beginWave(0);
    const opening=this.levelData.opening.id;
    if(opening==='convoy'){this.clearRecruits();for(let i=0;i<3;i++)this.addRecruit(-3-i*3.4,3);}
    if(opening==='rift'||opening==='duel')openChoice(this,opening==='duel');
    if(opening==='armory'){this.clearRecruits();this.recruitTimer=2.2;this.armory.hp=this.armory.maxHp*=.7;this.armory.z=-7;}
    if(opening==='supply'){
      this.clearRecruits();this.recruitTimer=1.8;
      this.pods.push({id:this.nextId++,type:'pod',kind:'overdrive',x:0,y:1.4,z:-5,hp:75,maxHp:75,reserved:0,scale:1,hit:0});
    }
    if(['rift','duel','supply'].includes(opening))for(const e of this.enemies)e.z-=6;
  }
  beginWave(index) {
    this.wave = index; this.waveTime = 0; this.clearTimer = -1;
    this.enemies = []; this.zones = []; this.state = 'active'; this.bossTimer = 5;
    const wave = this.levelData.waves[index];
    for (let i = 0; i < wave.count; i++) {
      const type = i >= wave.count - wave.grenadiers ? 'grenadier' : i < wave.brutes ? 'brute' : this.level>=2&&i%47===24?'cart':'soldier';
      this.spawnEnemy(i, wave, type);
    }
    if (wave.boss) for(let i=0;i<(wave.bossCount||1);i++) {
      this.spawnEnemy(wave.count, {...wave,bossType:i?wave.partnerType:wave.bossType}, 'boss');
      const boss=this.enemies.at(-1);boss.x=wave.bossCount>1?(i?2.8:-2.8):0;
      boss.z=this.level>=2?(wave.mini?-36-i*7:-29):-38;boss.meleeCooldown=i*.8;
    }
    this.bossMaxHp=this.enemies.filter(e=>e.type==='boss').reduce((sum,e)=>sum+e.maxHp,0);
    this.events.push({ type: 'wave', index, name: wave.name, description: wave.description });
  }
  spawnEnemy(index, wave, type = 'soldier') {
    const boss = type === 'boss', brute = type === 'brute', hp = boss ? this.levelData.bossHp*(wave.bossHpScale??(wave.mini?.32:1)) : wave.hp * (brute ? 2.3 : type==='cart'?.6:1);
    this.enemies.push({
      id: this.nextId++, type, x: boss ? 0 : (index % 9 - 4) * .94 + (this.random() - .5) * .14,
      z: boss ? -38 : -26 - Math.floor(index / 9) * 1.62,
      y: 0, hp, maxHp: hp, reserved: 0, speed: boss && this.level>=2 ? (wave.mini?3+this.level*.08:3.5+this.level*.13) : wave.speed * (boss ? .55 : brute ? .91 : .96 + this.random() * .08),
      scale: boss ? (wave.mini?2.6:3.7) : brute ? 1.25 : .84 + this.random() * .09,
      bossType:wave.bossType||this.levelData.world.boss,mini:!!wave.mini,slow:0,burn:0,burnDamage:0,
      phase: this.random() * Math.PI * 2, yaw: Math.PI, attackTimer: this.random() * 3 + 5,
      hit: 0, vx: 0, vz: 0, knockback: 0,
      meleeCooldown:0,swing:0,recovery:0,
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
    if(this.choice&&this.focus!=='enemies'){
      return this.choice.age>=1.2?this.choice.options.find(o=>o.side===this.focus&&o.hp>0):null;
    }
    if (this.focus === 'recruits') {
      if (this.recruitHitCooldown > 0 || this.player.squad >= MAX_SQUAD) return null;
      return this.recruits.find(t => t.hp > 0 && t.reserved === 0 && Math.abs(this.player.z - t.z) < 45) || null;
    }
    if (this.focus === 'weapons') return this.armory?.hp > this.armory?.reserved ? this.armory : null;
    let selected = null, best = Infinity;
    for (const collection of [this.pods,this.enemies]) for (const enemy of collection) {
      if (enemy.hp <= 0 || enemy.z > z + 3 || z - enemy.z > 57) continue;
      const score = Math.hypot(enemy.x - x, enemy.z - z) + Math.abs(enemy.x - x) * .6 + (enemy.reserved >= enemy.hp ? 1000 : 0) - (enemy.type==='pod'?12:0);
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
    for(const key of Object.keys(this.buffs))this.buffs[key]=Math.max(0,this.buffs[key]-dt);
    if(this.ammo){this.ammo.remaining-=dt;if(this.ammo.remaining<=0)this.ammo=null;}
    this.cheer=Math.max(0,this.cheer-dt);
    let ix = input.x || 0, iz = input.z || 0;
    if (ix) this.steerX = null;
    if (this.steerX !== null) ix = clamp((this.steerX - p.x) * 3, -1, 1);
    const magnitude = Math.max(1, Math.hypot(ix, iz)); ix /= magnitude; iz /= magnitude;
    p.vx += (ix * 9 - p.vx) * Math.min(1, dt * 14); p.vz += (iz * 7 - p.vz) * Math.min(1, dt * 14);
    p.x = clamp(p.x + p.vx * dt, LIMITS.minX, LIMITS.maxX); p.z = clamp(p.z + p.vz * dt, LIMITS.minZ, LIMITS.maxZ);
    this.focus = p.x < -LANE_THRESHOLD ? 'recruits' : p.x > LANE_THRESHOLD ? 'weapons' : 'enemies';
    if (input.barrage) this.barrage();

    updateChoices(this,dt);this.updateSupplies(dt);updatePowers(this,dt);
    const weapon = this.weapon;
    for (let i = 0; i < p.squad; i++) {
      if(this.knockups.some(unit=>unit.index===i))continue;
      this.shootTimers[i] -= dt; this.recoil[i] = Math.max(0, this.recoil[i] - dt * 6);
      // Target acquisition dominates big waves: scan only when this soldier can fire.
      if(this.shootTimers[i]>0)continue;
      const f = formation(i, p.squad), sx = p.x + f.x, sz = p.z + f.z, target = this.target(sx, sz);
      if (target) {
        this.aim[i] = Math.atan2(-(target.x - sx), -(target.z - sz));
        if (this.shootTimers[i] <= 0 && this.bullets.length < 360) {
          const x = sx - Math.sin(this.aim[i]) * 1.35, z = sz - Math.cos(this.aim[i]) * 1.35;
          const interval=fireVolley(this,i,target,x,z);
          if (target.type === 'recruit') this.recruitHitCooldown = .38;
          this.shootTimers[i] = interval * (.94 + this.random() * .12); this.recoil[i] = 1;
        }
      } else this.aim[i] *= 1 - dt * 3;
    }

    for (const enemy of this.enemies) {
      if (enemy.hp <= 0) continue;
      enemy.hit = Math.max(0, enemy.hit - dt * 4); enemy.attackTimer -= dt;
      enemy.zap=Math.max(0,(enemy.zap||0)-dt);
      if(enemy.burn>0){enemy.burn-=dt;this.damage(enemy,enemy.burnDamage*dt,false,true);}
      if(enemy.hp<=0)continue;
      enemy.slow=Math.max(0,enemy.slow-dt);
      const dx = p.x - enemy.x, dz = p.z - enemy.z, near = dz < 9;
      const boss=enemy.type==='boss';
      enemy.meleeCooldown=Math.max(0,enemy.meleeCooldown-dt);enemy.swing=Math.max(0,enemy.swing-dt);enemy.recovery=Math.max(0,enemy.recovery-dt);
      const speed = enemy.speed * (enemy.knockback > 0 ? -.5 : 1)*(enemy.slow>0?(boss?.82:.52):1);
      enemy.knockback = Math.max(0, enemy.knockback - dt);
      enemy.vx = clamp(dx * (near ? .48 : .009), -1.5, 1.5); enemy.vz = speed;
      if (boss) {
        enemy.vx=clamp(dx*.65,-2.1,2.1);
        enemy.vz=this.level<2?(enemy.z>-9?0:speed):Math.min(speed,Math.max(-2,(dz-3.4)*2));
        if(enemy.swing>0||enemy.recovery>0)enemy.vx=enemy.vz=0;
      }
      enemy.x = clamp(enemy.x + enemy.vx * dt, -5.4, 5.4); enemy.z += enemy.vz * dt;
      enemy.yaw = Math.PI + Math.atan2(enemy.vx, Math.max(.5, Math.abs(enemy.vz)));
      if(boss)enemy.yaw=Math.PI-Math.atan2(dx,dz);
      enemy.phase += dt * Math.abs(speed) * 3.2;
      if (enemy.type === 'boss') {
        if(this.level>=2&&Math.abs(dz)<6&&Math.abs(dx)<5&&enemy.meleeCooldown<=0){
          const fuse=1.05, radius=enemy.mini?3.8:4.6;
          enemy.swing=fuse;enemy.recovery=fuse+.45;enemy.meleeCooldown=3.8;
          this.bossSwipes++;
          this.zones.push({id:this.nextId++,x:p.x,z:p.z,radius,remaining:fuse,total:fuse,friendly:false,damage:enemy.mini?10+this.level:15+this.level,melee:true,owner:enemy});
          this.events.push({type:'warning',text:enemy.mini?'CHAMPION SWIPE · FALL BACK':'GUARDIAN SWIPE · MOVE!'});
        }
        if(enemy.attackTimer<=0&&enemy.swing<=0){enemy.attackTimer=this.waveTime>65?3.2:enemy.hp<enemy.maxHp*.45?4.8:7;this.bossAttack(enemy);}
      } else if (enemy.type === 'grenadier' && dz < 37 && enemy.attackTimer <= 0) {
        enemy.attackTimer = 10 + this.random() * 3;
        this.zones.push({ id: this.nextId++, x: p.x, z: p.z, radius: 1.8, remaining: 2, total: 2, friendly: false, damage: 9 });
      }
      if (Math.hypot(dx, dz) < 1.8 * enemy.scale && enemy.type !== 'boss' && enemy.attackTimer <= 0) {
        if(this.hurt(enemy.type === 'brute' ? 9 : 4))this.meleeHits++;enemy.attackTimer = 1.25; enemy.knockback = .2;
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
          const special=this.weapons.find(w=>w.id===bullet.weaponId)||weapon;
          if(!['recruit','weapon','pod','choice'].includes(bullet.target.type))this.weaponImpact(bullet,special);
          if (bullet.splash && !['recruit', 'weapon','pod','choice'].includes(bullet.target.type)) {
            for (const other of this.enemies) if (other !== bullet.target && other.hp > 0 && Math.hypot(other.x - bullet.tx, other.z - bullet.tz) < bullet.splash) this.damage(other, bullet.damage * .55, true);
            this.events.push({ type: 'cannon', x: bullet.tx, y: .6, z: bullet.tz, color:bullet.color });
          }
        }
      } else { bullet.x += dx / distance * travel; bullet.y += dy / distance * travel; bullet.z += dz / distance * travel; }
      if (!bullet.done && bullet.life > 2) { bullet.done = true; bullet.target.reserved = Math.max(0, bullet.target.reserved - bullet.damage); }
    }
    this.bullets = this.bullets.filter(b => !b.done);
    for (const zone of this.zones) {
      if(zone.melee&&zone.owner.hp<=0){zone.done=true;continue;}
      zone.remaining -= dt; if (zone.remaining > 0 || zone.done) continue; zone.done = true;
      this.events.push({ type: 'explosion', x: zone.x, y: .2, z: zone.z, friendly: zone.friendly, radius: zone.radius, power:zone.power });
      if(zone.melee)this.events.push({type:'bossSwing',x:zone.x,z:zone.z,radius:zone.radius,yaw:zone.owner.yaw});
      if (zone.friendly) {
        for (const enemy of this.enemies) if (Math.hypot(enemy.x - zone.x, enemy.z - zone.z) < zone.radius + enemy.scale * .3) {this.damage(enemy, zone.damage, true);if(zone.power&&enemy.hp<=0&&enemy.type!=='boss'){fling(enemy,zone.x,zone.z,1.3);if(zone.power==='quack')enemy.defeatStyle='pancake';}}
      } else if (Math.hypot(p.x - zone.x, p.z - zone.z) < zone.radius + (zone.melee?1.1:.35)) {
        if(this.hurt(zone.damage,false,zone.melee?zone.owner:null)&&zone.melee)this.meleeHits++;
      }
    }
    this.zones = this.zones.filter(z => !z.done);
    for (const enemy of this.enemies) {
      if (enemy.hp > 0 || enemy.escaped) continue;
      this.kills++; this.corpses.push({ ...enemy, age: 0, spin: (this.random() - .5) * 3, lift: enemy.blast ? 3.3 : 1.2 });
      this.events.push({ type: 'death', id:enemy.id,x: enemy.x, y: enemy.scale, z: enemy.z, scale: enemy.scale, boss: enemy.type === 'boss',bossType:enemy.bossType,mini:enemy.mini,style:enemy.defeatStyle||(enemy.blast?'tumble':'trip') });
    }
    this.enemies = this.enemies.filter(e => e.hp > 0);
    this.updateRemains(dt);
    if (p.health <= 0&&!phoenixRescue(this)) { this.finish(false); return; }
    if (!this.enemies.length) {
      this.zones = [];
      if (this.clearTimer < 0) { this.cheer=1.4;this.clearTimer = this.level>=10?Math.max(5,this.wave===0?25-this.waveTime:0):3; this.events.push({ type: 'regroup', text: 'WAVE CLEARED · REGROUP · NEXT ASSAULT IN '+Math.ceil(this.clearTimer)+'s' }); }
      this.clearTimer -= dt;
      if (this.clearTimer <= 0) {
        if (this.wave === this.levelData.waves.length - 1) this.finish(true);
        else { p.health = Math.min(100, p.health + 10); this.beginWave(this.wave + 1); }
      }
    }
  }
  updateRemains(dt){
    for(const corpse of this.corpses)corpse.age+=dt;
    this.corpses=this.corpses.filter(c=>c.age<4.5).slice(-72);
    for(const soldier of this.fallen)soldier.age+=dt;
    this.fallen=this.fallen.filter(c=>c.age<4.5).slice(-MAX_SQUAD);
    for(const unit of this.knockups)unit.age+=dt;
    this.knockups=this.knockups.filter(unit=>unit.age<2.2&&unit.index<this.player.squad);
  }
  clearRecruits() {
    // Invalidate targets already being chased by bullets as well as visible boards.
    for (const target of this.recruits) target.hp = 0;
    this.recruits = [];
  }
  updateSupplies(dt) {
    if(this.level>=2){
      this.podTimer-=dt;
      if(this.podTimer<=0&&this.pods.length<2){
        const kind=nextSupply(this);
        this.pods.push({id:this.nextId++,type:'pod',kind,x:this.random()>.5?1.5:-1.5,y:1.4,z:-20,hp:180+this.wave*80,maxHp:180+this.wave*80,reserved:0,scale:1,hit:0});this.podTimer=22;
        this.events.push({type:'supply',text:(SUPPLIES[kind].rare?'JACKPOT POD! · ':'SUPPLY INBOUND · ')+SUPPLIES[kind].name});
      }
      for(const pod of this.pods){pod.z+=dt*2.6;pod.hit=Math.max(0,pod.hit-dt*5);if(pod.z>=SUPPLY_EXIT)pod.hp=0;}
      this.pods=this.pods.filter(p=>p.hp>0);
    }
    if(this.choice)return;
    if (this.player.squad >= MAX_SQUAD) this.clearRecruits();
    else {
      this.recruitTimer = Math.max(0, this.recruitTimer - dt);
      for (const target of this.recruits) {
        target.z += dt * this.levelData.recruitSpeed;
        target.hit = Math.max(0, target.hit - dt * 5);
        if (target.z >= SUPPLY_EXIT) target.hp = 0;
      }
      this.recruits = this.recruits.filter(t => t.hp > 0);
      if (this.recruitTimer <= 0 && this.recruits.length <= 6) this.recruitBurst();
    }
    if (this.armory) {
      this.armory.z += dt * this.levelData.weaponSpeed;
      this.armory.hit = Math.max(0, this.armory.hit - dt * 5);
      if (this.armory.z >= SUPPLY_EXIT) {
        this.armory.hp = 0; this.armory = null; this.missedWeapons++;
        this.weaponTimer = this.levelData.weaponInterval;
        this.events.push({ type: 'supplyMissed', text: 'WEAPON PASSED — ANOTHER CHANCE IS ON THE WAY' });
      }
    } else if (this.player.weaponLevel < this.weapons.length) {
      this.weaponTimer = Math.max(0, this.weaponTimer - dt);
      if (this.weaponTimer <= 0) this.createArmory();
    }
  }
  damage(target, amount, blast, quiet=false) {
    if (target.hp <= 0) return;
    if(target.type==='choice'){
      if(this.choice?.options.includes(target)&&this.choice.age>=1.2){target.lastHit=this.time;target.hit=1;}
      return;
    }
    target.hp -= amount; target.hit = 1; target.blast = blast;
    if(!quiet)this.events.push({ type: 'hit', x: target.x, y: target.y || target.scale * 1.2, z: target.z, blast, scale: target.scale, friendly: ['recruit', 'weapon','pod'].includes(target.type) });
    if (target.type === 'recruit') {
      if (target.hp <= 0 && this.player.squad < MAX_SQUAD) {
        const amount=Math.min((target.amount||1)*(this.buffs.rally>0?2:1),MAX_SQUAD-this.player.squad);
        this.player.squad+=amount; this.recruited+=amount;
        this.events.push({ type: 'recruit', x: target.x, z: target.z, amount });
        if (this.player.squad === MAX_SQUAD) this.clearRecruits();
      }
    } else if (target.type === 'weapon') {
      if (target.hp <= 0 && target === this.armory) {
        this.player.weaponLevel++; this.events.push({ type: 'weapon', level: this.player.weaponLevel, name: this.weapon.name, x: target.x, z: target.z });
        this.cheer=.85;
        this.armory = null; this.weaponTimer = this.levelData.weaponInterval;
      }
    } else if(target.type==='pod'&&target.hp<=0){
      this.podsOpened++;
      collectSupply(this,target.kind,target.x,target.z);
    } else if(target.type==='cart'&&target.hp<=0&&!target.detonated){
      target.detonated=true;this.cartsDestroyed++;
      this.events.push({type:'explosion',x:target.x,z:target.z,radius:4.5,friendly:true});
      for(const e of this.enemies)if(e!==target&&e.hp>0&&Math.hypot(e.x-target.x,e.z-target.z)<4.5)this.damage(e,target.maxHp*3.5,true);
    } else if (blast && target.type !== 'boss') target.knockback = .35;
  }
  weaponImpact(bullet,weapon){
    const target=bullet.target;
    ammoImpact(this,bullet);
    if(weapon.slow)target.defeatStyle='ice';
    if(weapon.chain){target.defeatStyle='zap';target.zap=.24;}
    if(bullet.pattern==='pulse'&&target.hp<=0&&target.type!=='boss')fling(target,this.player.x,this.player.z,1.1);
    if(bullet.prism){
      if(target.hp<=0&&target.type!=='boss')fling(target,this.player.x,this.player.z,.8);
      const nearby=this.enemies.filter(e=>e!==target&&e.hp>0&&Math.hypot(e.x-target.x,e.z-target.z)<7).sort((a,b)=>Math.abs(a.z-target.z)-Math.abs(b.z-target.z)).slice(0,3);
      for(const e of nearby){this.damage(e,bullet.damage*.65,false);if(e.hp<=0&&e.type!=='boss')fling(e,target.x,target.z,.7);this.events.push({type:'powerBeam',x:target.x,y:target.scale,z:target.z,tx:e.x,ty:e.scale,tz:e.z,color:0xeb9dff});}
    }
    if(weapon.slow)target.slow=2.4;
    if(weapon.burn){target.burn=2.5;target.burnDamage=weapon.burn;}
    if(weapon.chain||weapon.pierce){
      let count=0;
      for(const other of this.enemies){
        if(other===target||other.hp<=0)continue;
        const hit=weapon.chain?Math.hypot(other.x-target.x,other.z-target.z)<4.4:Math.abs(other.x-target.x)<.85&&other.z<target.z&&other.z>target.z-12;
        if(!hit)continue;
        this.damage(other,weapon.damage*.65,false);
        this.events.push({type:'beam',x:target.x,y:target.scale,z:target.z,tx:other.x,ty:other.scale,tz:other.z,color:weapon.color});
        if(++count>=(weapon.chain||weapon.pierce))break;
      }
    }
  }
  bossAttack(enemy){
    const pattern=BOSS_TYPES[enemy.bossType].attack,p=this.player,fuse=this.levelData.impactFuse;
    let enragedNow=false;
    if(this.waveTime>65&&this.enemies.length<320){
      for(let i=0;i<6;i++){
        this.spawnEnemy(i,{hp:this.levelData.waves[this.wave].hp*1.1,speed:3.6},'brute');
        const guard=this.enemies.at(-1);guard.x=-3.5+i*1.4;guard.z=enemy.z-4-i*.4;
      }
      if(!enemy.enraged){enemy.enraged=true;enragedNow=true;}
    }
    const zone=(x,z,radius,delay=0)=>this.zones.push({id:this.nextId++,x:clamp(x,-5.4,5.4),z,radius,remaining:fuse+delay,total:fuse+delay,friendly:false,damage:this.levelData.impactDamage});
    if(pattern==='sweep')for(let i=0;i<3;i++)zone(-3.8+i*3.8,p.z,2.1,i*.55);
    else if(pattern==='cross'){zone(p.x,p.z,2);zone(-p.x,p.z-4,1.8,.3);zone(p.x,p.z+4,1.8,.6);}
    else {
      for(let i=0;i<this.levelData.impactCount;i++)zone(p.x+(i-(this.levelData.impactCount-1)/2)*2.2,p.z+i*.6,2,i*.2);
      if(pattern==='summon'&&this.enemies.length<330){
        for(let i=0;i<5;i++){this.spawnEnemy(i,{hp:this.levelData.waves[this.wave].hp*.7,speed:3},'soldier');const e=this.enemies.at(-1);e.x=-3.2+i*1.6;e.z=enemy.z-4;}
      }
    }
    this.events.push({type:'warning',text:enragedNow?'GUARDIAN ENRAGED · ELITE REINFORCEMENTS':pattern==='sweep'?'SWEEPING STRIKE · KEEP MOVING':pattern==='summon'?'REINFORCEMENTS · WATCH THE IMPACT ZONES':'INCOMING IMPACT · MOVE OUT OF THE RED ZONES'});
  }
  hurt(amount, breach = false, impact=null) {
    if (this.state !== 'active' || (!breach && this.hurtCooldown > 0)) return false;
    const initialDamage=amount,absorbed=Math.min(amount,this.shield);this.shield-=absorbed;amount-=absorbed;
    if(amount<=0){this.hurtCooldown=.22;if(impact)this.events.push({type:'shieldBlock',x:this.player.x,z:this.player.z});return true;}
    this.player.health = Math.max(0, this.player.health - amount);
    this.casualtyDamage += amount;
    const launchCount=impact?Math.ceil(this.player.squad*(impact.mini?.10:.16)*amount/initialDamage):0;
    const losses = Math.min(this.player.squad - 1, Math.floor(this.casualtyDamage / 8));
    this.casualtyDamage %= 8;
    if (losses > 0) {
      const p = this.player;
      for (let i = 0; i < losses; i++) {
        const f = formation(p.squad - 1 - i, p.squad);
        const spread=losses>1?(i/(losses-1)-.5)*2:Math.sin(this.time*9),side=Math.sign(spread)||1;
        const flight=impact?{vx:spread*7+(p.x-impact.x)*.35,vy:9.5+(i%3)*1.3,vz:3.5+(i%3)*.8,spin:side*(3+i*.3)}:null;
        this.fallen.push({ x: p.x + f.x, z: p.z + f.z, scale: 1.08, age: 0, yaw: 0,
          spin: (this.random() - .5) * 3, lift: 1.6, flight,weaponLevel: p.weaponLevel,weaponId:this.weapon.id });
      }
      p.squad -= losses; this.casualties += losses;
      this.recruitTimer = Math.min(this.recruitTimer, 1.5);
      this.events.push({ type: 'casualty', amount: losses });
    }
    if(impact){
      const p=this.player,total=Math.max(losses,Math.min(p.squad+losses-1,launchCount)),survivors=Math.min(p.squad-1,total-losses);
      for(let i=0;i<survivors;i++){
        const index=p.squad-1-i,f=formation(index,p.squad),x=p.x+f.x,z=p.z+f.z,side=i%2?1:-1;
        this.knockups=this.knockups.filter(unit=>unit.index!==index);
        this.knockups.push({index,x,z,age:0,yaw:0,flight:{vx:clamp(side*(2.5+i*.4),(-5.9-x)/1.2,(5.9-x)/1.2),vy:8.5,vz:2,spin:side*3}});
      }
      this.launchedSoldiers+=total;
      this.events.push({type:'bossImpact',x:p.x,z:p.z,amount:total,lost:losses});
    }
    // Give the squad a brief recovery window after a heavy hit so overlapping
    // shells cannot erase the formation while its soldiers are still in flight.
    if (!breach) this.hurtCooldown = impact ? .85 : .22;
    this.events.push({ type: 'hurt', amount });
    return true;
  }
  finish(won) { this.state = won ? 'victory' : 'defeat'; this.bullets = []; this.zones = []; this.events.push({ type: this.state }); }
  drainEvents() { const events = this.events; this.events = []; return events; }
  snapshot() {
    return { state: this.state, level: this.level + 1, levelName: this.levelData.name, wave: this.wave + 1, time: this.time, kills: this.kills, health: this.player.health,
      squad: this.player.squad, weaponLevel: this.player.weaponLevel, weaponName: this.weapon.name,weaponId:this.weapon.id,weaponDps:this.weapon.damage/this.weapon.interval,
      shield:this.shield,buffs:{...this.buffs},ammo:this.ammo?{...this.ammo}:null,pods:this.pods.map(p=>({kind:p.kind,x:p.x,z:p.z,hp:p.hp})),podsOpened:this.podsOpened,cartsDestroyed:this.cartsDestroyed,
      choicesTaken:this.choicesTaken,powersTaken:this.powersTaken,lastChoice:this.lastChoice,launchedSoldiers:this.launchedSoldiers,knockedDown:this.knockups.length,
      opening:this.levelData.opening.id,phoenixSaves:this.phoenixSaves,gravityWell:this.gravityWell?{...this.gravityWell}:null,phoenixFlight:this.phoenixFlight?{...this.phoenixFlight}:null,
      choice:this.choice?{id:this.choice.id,age:this.choice.age,z:this.choice.z,remaining:(SUPPLY_EXIT-this.choice.z)/this.choice.speed,options:this.choice.options.map(o=>({kind:o.kind,side:o.side,hp:o.hp}))}:null,
      focus: this.focus, recruited: this.recruited, breaches: this.breaches, shots: { ...this.shots },
      casualties: this.casualties, meleeHits:this.meleeHits, bossSwipes:this.bossSwipes, fallen: this.fallen.length, missedWeapons: this.missedWeapons,
      nextRecruits: this.recruitTimer, nextWeapon: this.weaponTimer,
      x: this.player.x, z: this.player.z, enemies: this.enemies.length,
      nearestEnemy: this.enemies.length ? Math.max(...this.enemies.map(e => e.z)) : -100,
      bullets: this.bullets.length, corpses: this.corpses.length, cooldown: this.barrageCooldown,
      armory: this.armory ? { hp: this.armory.hp, maxHp: this.armory.maxHp, z: this.armory.z, remaining: (SUPPLY_EXIT - this.armory.z) / this.levelData.weaponSpeed, level: this.armory.level, name: this.weapons[this.armory.level - 1].name } : null,
      recruits: this.recruits.filter(t => t.hp > 0).length,
      zones: this.zones.map(z => ({ x: z.x, z: z.z, radius: z.radius, friendly: z.friendly, remaining: z.remaining, melee:!!z.melee })),
      bossHealth: this.enemies.find(e => e.type === 'boss')?.hp || 0 };
  }
}
