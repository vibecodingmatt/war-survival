import { POWERS, POWER_DECK } from '../../data/powers.js?v=0.8.1';
import { MAX_SQUAD, SUPPLY_EXIT } from '../../data/waves.js?v=0.8.1';

export function nextPower(sim) {
  if(!sim.powerBag.length){
    sim.powerBag=[...POWER_DECK];
    for(let i=sim.powerBag.length-1;i>0;i--){const j=Math.floor(sim.rewardRandom()*(i+1));[sim.powerBag[i],sim.powerBag[j]]=[sim.powerBag[j],sim.powerBag[i]];}
    if(sim.powerBag.at(-1)===sim.lastOfferedPower)[sim.powerBag[0],sim.powerBag[sim.powerBag.length-1]]=[sim.powerBag.at(-1),sim.powerBag[0]];
  }
  return sim.lastOfferedPower=sim.powerBag.pop();
}

export function openChoice(sim,duel=false) {
  const right=nextPower(sim);
  const kinds=[duel?nextPower(sim):sim.player.squad<MAX_SQUAD?'reinforce':'aegis',right];
  sim.choiceCount++;
  sim.choice={id:sim.nextId++,age:0,z:-8,speed:2.4,options:kinds.map((kind,i)=>({
    id:sim.nextId++,type:'choice',kind,side:i?'weapons':'recruits',x:i?5.55:-5.55,y:2.4,z:-8,
    scale:1.6,hp:100,maxHp:100,reserved:0,hit:0,lastHit:-Infinity,
  }))};
  sim.events.push({type:'choiceOpen',text:'CHOOSE ONE · '+POWERS[kinds[0]].name+' OR '+POWERS[right].name});
}

export function updateChoices(sim,dt) {
  const choice=sim.choice;
  if(!choice){
    sim.choiceTimer-=dt;
    if(sim.choiceTimer<=0&&sim.enemies.length)openChoice(sim,sim.choiceCount%3===2);
    return;
  }
  choice.age+=dt;choice.z+=dt*choice.speed;
  for(const option of choice.options){
    option.z=choice.z;option.hit=Math.max(0,option.hit-dt*5);
    if(option.kind==='reinforce'&&sim.player.squad>=MAX_SQUAD)option.kind='aegis';
    // A short sustained volley commits the choice, even with a fully upgraded army.
    // Stray bullets or crossing a lane briefly cannot instantly spend the encounter.
    if(choice.age>=1.2&&option.lastHit>sim.time-.2&&sim.focus===option.side){
      option.hp=Math.max(0,option.hp-dt*100/1.05);
      if(option.hp<=0){resolveChoice(sim,option);return;}
    }
  }
  if(choice.z>=SUPPLY_EXIT){closeChoice(sim);sim.events.push({type:'choiceMissed',text:'RIFT PASSED · NEXT CHANCE IS COMING'});}
}

function closeChoice(sim) {
  if(sim.choice)for(const option of sim.choice.options)option.hp=0;
  sim.choice=null;sim.choiceTimer=18;
}

export function resolveChoice(sim,option) {
  if(!sim.choice||!sim.choice.options.includes(option))return false;
  const group=sim.choice,other=group.options.find(o=>o!==option);
  closeChoice(sim);sim.choicesTaken++;sim.lastChoice=option.kind;
  // Invalidate both targets before applying the reward: in-flight bullets cannot claim its partner.
  sim.events.push({type:'choiceTaken',kind:option.kind,x:option.x,z:option.z,rejectedX:other.x,text:POWERS[option.kind].name+' · OTHER RIFT CLOSED'});
  if(option.kind==='reinforce'){
    const amount=Math.min(6,MAX_SQUAD-sim.player.squad);sim.player.squad+=amount;sim.recruited+=amount;
    if(sim.player.squad===MAX_SQUAD)sim.clearRecruits();
    sim.events.push({type:'recruit',x:option.x,z:option.z,amount});
  }else if(option.kind==='aegis'){
    sim.shield=Math.min(60,sim.shield+35);
    sim.events.push({type:'powerup',kind:'aegis',x:sim.player.x,z:sim.player.z,text:'AEGIS · BOSS HIT PROTECTION'});
  }else activatePower(sim,option.kind);
  return true;
}

export function activatePower(sim,kind) {
  const spec=POWERS[kind];if(!spec?.duration)return;
  sim.buffs[kind]=spec.duration;sim.powerTimers[kind]=.15;
  if(kind==='gravity'){
    const front=sim.enemies.filter(e=>e.hp>0).sort((a,b)=>b.z-a.z)[0];
    sim.gravityWell={x:0,z:Math.min(sim.player.z-6,(front?.z??sim.player.z-15)-1),age:0,pulse:0};
  }
  if(kind==='phoenix'){sim.player.health=Math.min(100,sim.player.health+12);sim.phoenixFlight=null;}
  sim.powersTaken++;
  sim.events.push({type:'powerup',kind,x:sim.player.x,z:sim.player.z,text:spec.name+' · '+spec.detail});
}

export function fling(enemy,x,z,strength=1) {
  const angle=Math.atan2(enemy.x-x,enemy.z-z),variation=Math.sin(enemy.id*17.1);
  enemy.flight={vx:Math.sin(angle)*4*strength+variation*2,vy:7+strength*3,vz:Math.cos(angle)*5*strength,spin:variation*3+2};
}

export function updatePowers(sim,dt) {
  updateMythicPowers(sim,dt);
  updateToyPowers(sim,dt);
  for(const kind of ['starfall','tesla']){
    if(sim.buffs[kind]<=0)continue;
    sim.powerTimers[kind]-=dt;if(sim.powerTimers[kind]>0)continue;
    const enemies=sim.enemies.filter(e=>e.hp>0&&e.z<sim.player.z+5).sort((a,b)=>b.z-a.z);
    if(!enemies.length)continue;
    sim.powerTimers[kind]=kind==='starfall'?1.35:.8;
    if(kind==='starfall'){
      for(let i=0;i<3;i++){
        const target=enemies[Math.min(i*9,enemies.length-1)],fuse=.8+i*.13;
        sim.zones.push({id:sim.nextId++,x:target.x,z:target.z+1.3,radius:3.3,remaining:fuse,total:fuse,friendly:true,damage:330+sim.level*24,power:'starfall',fromX:target.x+(i-1)*9,fromZ:target.z-14});
      }
    }else{
      const candidates=enemies.filter(e=>Math.hypot(e.x-sim.player.x,e.z-sim.player.z)<28);
      for(let i=0;i<3&&candidates.length;i++){
        const target=candidates[i%candidates.length],angle=sim.time*2+i*Math.PI*2/3;
        const x=sim.player.x+Math.cos(angle)*3.1,z=sim.player.z+Math.sin(angle)*2;
        sim.damage(target,95+sim.level*5,false);if(target.hp<=0&&target.type!=='boss')fling(target,x,z,.6);
        sim.events.push({type:'powerBeam',x,y:3.2,z,tx:target.x,ty:target.scale,tz:target.z,color:POWERS.tesla.color});
        const chain=candidates.find(e=>e!==target&&e.hp>0&&Math.hypot(e.x-target.x,e.z-target.z)<5);
        if(chain){sim.damage(chain,65,false);sim.events.push({type:'powerBeam',x:target.x,y:target.scale,z:target.z,tx:chain.x,ty:chain.scale,tz:chain.z,color:POWERS.tesla.color});}
      }
    }
  }
}

function updateToyPowers(sim,dt){
  for(const kind of ['quack','stampede']){
    if(sim.buffs[kind]<=0)continue;
    sim.powerTimers[kind]-=dt;if(sim.powerTimers[kind]>0)continue;
    let front=null;
    for(const e of sim.enemies)if(e.hp>0&&e.z<sim.player.z+4&&(!front||e.z>front.z))front=e;
    if(!front)continue;
    sim.powerTimers[kind]=kind==='quack'?2.2:2.65;
    if(kind==='quack'){
      const fuse=.95;sim.zones.push({id:sim.nextId++,x:front.x*.55,z:front.z+1,radius:5.2,remaining:fuse,total:fuse,friendly:true,damage:760+sim.level*32,power:'quack'});
      sim.events.push({type:'duckDrop',x:front.x*.55,z:front.z});
    }else{
      for(let i=0;i<3;i++)sim.toyTanks.push({id:sim.nextId++,x:(i-1)*3.4,z:sim.player.z+5+i*.7,age:0,hits:new Set()});
      sim.events.push({type:'tankRun',x:sim.player.x,z:sim.player.z});
    }
  }
  if(sim.buffs.stampede<=0){sim.toyTanks.length=0;return;}
  for(const tank of sim.toyTanks){
    const oldZ=tank.z;tank.z-=dt*26;tank.age+=dt;
    for(const e of sim.enemies){
      if(e.hp<=0||tank.hits.has(e.id)||Math.abs(e.x-tank.x)>2.5+(e.type==='boss'?e.scale*.5:0)||e.z<tank.z-1.5||e.z>oldZ+1.5)continue;
      tank.hits.add(e.id);sim.damage(e,(250+sim.level*18)*(e.type==='boss'?.8:1),true);
      if(e.type!=='boss'){e.defeatStyle='pancake';if(e.hp<=0)fling(e,tank.x,tank.z,.8);}
      sim.events.push({type:'toyImpact',x:e.x,z:e.z});
    }
  }
  sim.toyTanks=sim.toyTanks.filter(tank=>tank.age<2.8&&tank.z>-64);
}

function updateMythicPowers(sim,dt){
  const well=sim.gravityWell;
  if(well){
    well.age+=dt;well.pulse-=dt;
    if(sim.buffs.gravity<=0){
      sim.zones.push({id:sim.nextId++,x:well.x,z:well.z,radius:8,remaining:.01,total:.01,friendly:true,damage:700+sim.level*25,power:'gravity'});
      sim.gravityWell=null;
    }else{
      for(const enemy of sim.enemies){
        if(enemy.hp<=0)continue;const dx=well.x-enemy.x,dz=well.z-enemy.z,d=Math.hypot(dx,dz);
        if(d>11)continue;
        if(enemy.type!=='boss'){const pull=Math.min(1,dt*2.8);enemy.x+=dx*pull;enemy.z+=dz*pull;}
        if(well.pulse<=0)sim.damage(enemy,enemy.type==='boss'?130:105,false,true);
      }
      if(well.pulse<=0){well.pulse=.45;sim.events.push({type:'gravityPulse',x:well.x,z:well.z});}
    }
  }
  if(sim.phoenixFlight){sim.phoenixFlight.age+=dt;if(sim.phoenixFlight.age>1.7)sim.phoenixFlight=null;}
  if(sim.buffs.phoenix>0){
    sim.powerTimers.phoenix-=dt;
    if(sim.powerTimers.phoenix<=0){
      const targets=sim.enemies.filter(e=>e.hp>0&&e.z<sim.player.z+4).sort((a,b)=>b.z-a.z);
      if(targets.length){
        sim.powerTimers.phoenix=2.3;const z=targets[0].z;
        sim.phoenixFlight={x:0,z,fromZ:sim.player.z+2,toZ:Math.max(sim.player.z-30,z-12),age:0};
        for(let i=0;i<4;i++)sim.zones.push({id:sim.nextId++,x:0,z:z-i*4,radius:4.8,remaining:.35+i*.25,total:.35+i*.25,friendly:true,damage:260+sim.level*16,power:'phoenix'});
        sim.events.push({type:'phoenixDive',x:0,z});
      }
    }
  }
}

export function phoenixRescue(sim){
  if(sim.buffs.phoenix<=0)return false;
  sim.buffs.phoenix=0;sim.phoenixSaves++;sim.player.health=35;sim.hurtCooldown=1.5;
  const amount=Math.min(6,MAX_SQUAD-sim.player.squad);sim.player.squad+=amount;sim.recruited+=amount;sim.knockups=[];
  sim.events.push({type:'rebirth',x:sim.player.x,z:sim.player.z,text:'PHOENIX REBIRTH · YOUR SQUAD RISES AGAIN'});
  sim.zones.push({id:sim.nextId++,x:sim.player.x,z:sim.player.z-3,radius:9,remaining:.01,total:.01,friendly:true,damage:850,power:'phoenix'});
  return true;
}
