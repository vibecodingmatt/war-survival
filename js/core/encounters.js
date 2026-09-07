import { POWERS, POWER_DECK } from '../../data/powers.js?v=0.5.0';
import { MAX_SQUAD, SUPPLY_EXIT } from '../../data/waves.js?v=0.5.0';

export function openChoice(sim) {
  const right=POWER_DECK[(sim.choiceCount+sim.level)%POWER_DECK.length];
  const kinds=[sim.player.squad<MAX_SQUAD?'reinforce':'aegis',right];
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
    if(sim.choiceTimer<=0&&sim.enemies.length)openChoice(sim);
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
  sim.powersTaken++;
  sim.events.push({type:'powerup',kind,x:sim.player.x,z:sim.player.z,text:spec.name+' · '+spec.detail});
}

export function fling(enemy,x,z,strength=1) {
  const angle=Math.atan2(enemy.x-x,enemy.z-z),variation=Math.sin(enemy.id*17.1);
  enemy.flight={vx:Math.sin(angle)*4*strength+variation*2,vy:7+strength*3,vz:Math.cos(angle)*5*strength,spin:variation*3+2};
}

export function updatePowers(sim,dt) {
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
