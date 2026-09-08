import { AMMO, SUPPLIES, SUPPLY_DECK } from '../../data/munitions.js?v=0.7.0';

export function nextSupply(sim){
  if(!sim.supplyBag.length){
    sim.supplyBag=[...SUPPLY_DECK];
    for(let i=sim.supplyBag.length-1;i>0;i--){const j=Math.floor(sim.supplyRandom()*(i+1));[sim.supplyBag[i],sim.supplyBag[j]]=[sim.supplyBag[j],sim.supplyBag[i]];}
  }
  return sim.supplyBag.pop();
}

export function collectSupply(sim,kind,x=sim.player.x,z=sim.player.z){
  const spec=SUPPLIES[kind];if(!spec)return false;
  if(AMMO[kind])sim.ammo={kind,remaining:spec.duration};
  else if(kind==='shield')sim.shield=Math.max(sim.shield,Math.min(50,sim.shield+30));
  else if(kind==='repair')sim.player.health=Math.min(100,sim.player.health+20);
  else sim.buffs[kind]=kind==='rally'?12:9;
  sim.events.push({type:'powerup',kind,x,z,text:spec.name+' · '+spec.detail});return true;
}

export function fireVolley(sim,index,target,x,z){
  const weapon=sim.weapon,p=sim.player,combat=sim.focus==='enemies'&&target.type!=='pod';
  // Supply/choice shots retain their original targeting and reward rules.
  const ammo=combat&&sim.ammo?AMMO[sim.ammo.kind]:null,pattern=ammo?sim.ammo.kind:null;
  const prism=sim.buffs.prism>0&&combat,pellets=ammo?.pellets||1;
  let rainbow=0xffdf94;
  if(pattern==='jackpot')rainbow=[0xff7cac,0xffd576,0x9cffb8,0x83e5ff,0xc6a1ff][sim.shots.enemies%5];
  const shotColor=pattern==='jackpot'?rainbow:ammo?.color||(prism?0xeb9dff:weapon.color);
  for(let pellet=0;pellet<pellets&&sim.bullets.length<360;pellet++){
    let hit=target;
    if(pattern==='fanfire'&&pellet>0){
      let best=Infinity;
      for(const e of sim.enemies){
        if(e.hp<=0||e===target||e.z>p.z+3||p.z-e.z>57||Math.abs(e.z-target.z)>7)continue;
        const side=pellet===1?-1:1;if((e.x-target.x)*side<.15)continue;
        const score=(e.x-target.x)**2+(e.z-target.z)**2+(e.reserved>=e.hp?1000:0);
        if(score<best){best=score;hit=e;}
      }
    }
    const damage=target.type==='choice'?1:weapon.damage*(prism?1.5:1)*(ammo?.damage||1),offset=(pellet-(pellets-1)/2)*.25;
    sim.bullets.push({id:sim.nextId++,x:x+offset,y:1.56,z,target:hit,damage,life:0,speed:weapon.speed*(pattern==='pulse'?.72:1),
      tx:hit.x,ty:hit.y||hit.scale*1.15,tz:hit.z,weaponLevel:p.weaponLevel,weaponId:weapon.id,
      splash:pattern==='pulse'?Math.max(3,weapon.splash||0):weapon.splash,color:shotColor,prism,pattern,pellet});
    hit.reserved+=damage;sim.shots[sim.focus]++;
  }
  sim.events.push({type:'shot',x,y:1.56,z,yaw:sim.aim[index],weaponLevel:p.weaponLevel,weaponId:weapon.id,color:shotColor,pattern,prism,index});
  // Stack with Overdrive, but cap the combined cadence so a jackpot cannot flood the simulation.
  return Math.max(.075,weapon.interval*(ammo?.rate||1)*(sim.buffs.overdrive>0?.62:1));
}

export function ammoImpact(sim,bullet){
  const target=bullet.target;
  if(bullet.pattern==='pinball'){
    let from=target;const visited=new Set([target.id]);
    for(let hop=0;hop<4;hop++){
      let next=null,best=7*7;
      for(const e of sim.enemies){if(e.hp<=0||visited.has(e.id))continue;const d=(e.x-from.x)**2+(e.z-from.z)**2;if(d<best){best=d;next=e;}}
      if(!next)break;
      sim.damage(next,bullet.damage*.48,false);visited.add(next.id);
      sim.events.push({type:'powerBeam',x:from.x,y:1.4,z:from.z,tx:next.x,ty:1.4,tz:next.z,color:bullet.color});from=next;
    }
  }
  if(bullet.pattern==='pulse')sim.events.push({type:'sonicBoom',x:bullet.tx,z:bullet.tz,color:bullet.color});
}
