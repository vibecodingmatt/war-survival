import { WORLDS, ROUTES, WEAPON_LIBRARY, BOSS_TYPES, OPENINGS } from './campaign.js?v=0.6.0';
export const WAVES = [
  { name: 'THE VANGUARD', description: 'Left: +1 soldiers. Center: enemies. Right: stronger guns.', count: 80, hp: 62, speed: 1.8, brutes: 0, grenadiers: 0 },
  { name: 'RED TIDE', description: 'The ranks are growing. Your squad must grow faster.', count: 136, hp: 120, speed: 1.95, brutes: 3, grenadiers: 1 },
  { name: 'IRON COMPANY', description: 'Heavy armor. Bring more riflemen and a bigger gun.', count: 184, hp: 230, speed: 2.1, brutes: 6, grenadiers: 2 },
  { name: 'THE CRIMSON WARDEN', description: 'Break the Legion. A starting rifle will not save you.', count: 216, hp: 320, speed: 2.2, brutes: 8, grenadiers: 2, boss: true },
];
export const LEVELS = [
  {
    name: 'ASHEN CROSSING', subtitle: 'Dawn · Learn the three lanes', difficulty: 'FIRST STAND',
    waves: WAVES, bossName: 'THE CRIMSON WARDEN', bossHp: 11500,
    recruitInterval: 10, recruitSpeed: 2.4, recruitBatch: 6,
    weaponSpeed: 1.65, weaponInterval: 4, impactFuse: 2, impactCount: 2, impactDamage: 13,
  },
  {
    name: 'EMBER GATE', subtitle: 'Dusk · Faster ranks, heavier armor', difficulty: 'HARDER ASSAULT',
    waves: [
      { name: 'THE SECOND FRONT', description: 'Supplies pass faster here. Catch them between volleys.', count: 104, hp: 76, speed: 2.1, brutes: 3, grenadiers: 1 },
      { name: 'STEEL MARCH', description: 'Armored ranks and incoming shells. Keep your squad moving.', count: 160, hp: 170, speed: 2.3, brutes: 6, grenadiers: 2 },
      { name: 'THE FURNACE', description: 'The gate is opening. Build your squad before the final push.', count: 216, hp: 310, speed: 2.5, brutes: 10, grenadiers: 3 },
      { name: 'THE EMBER MARSHAL', description: 'Three impacts. Heavy armor. Bring everything you have.', count: 260, hp: 450, speed: 2.65, brutes: 12, grenadiers: 4, boss: true },
    ],
    bossName: 'THE EMBER MARSHAL', bossHp: 17500,
    recruitInterval: 11, recruitSpeed: 2.9, recruitBatch: 6,
    weaponSpeed: 2.15, weaponInterval: 5, impactFuse: 1.7, impactCount: 3, impactDamage: 16,
  },
];
export const WEAPONS = [
  { name: 'VOLLEY RIFLE', damage: 9, interval: .64, speed: 65, splash: 0, cost: 0, color: 0xffdf94 },
  { name: 'REPEATER', damage: 12, interval: .44, speed: 78, splash: 0, cost: 650, color: 0xffbd58 },
  { name: 'GATLING', damage: 16, interval: .29, speed: 92, splash: 0, cost: 2800, color: 0x77e8ff },
  { name: 'SIEGE CANNON', damage: 35, interval: .45, speed: 72, splash: 2.1, cost: 8500, color: 0xff8f43 },
];
export const BARRAGE_COOLDOWN = 14;
export const MAX_SQUAD = 42;
export const LIMITS = { minX: -4.2, maxX: 4.2, minZ: 3, maxZ: 16 };
export const LANE_THRESHOLD = 2.05;
export const SUPPLY_EXIT = 20;

for(let i=2;i<WORLDS.length;i++){
  const world=WORLDS[i],boss=BOSS_TYPES[world.boss];
  LEVELS.push({name:world.name,subtitle:world.description,difficulty:['','','RISING TIDE','COLD FRONT','BURNING SANDS','EYE OF THE STORM','FALLING LEAVES','INFERNO','AFTER DARK','SKYWARD','DEEP TIDE','AGAINST TIME','MOONRISE','SHATTERED SKY','LAST HORIZON'][i],
    bossName:boss.name,bossHp:23500+i*4000,recruitInterval:10,recruitSpeed:2.9+i*.06,recruitBatch:6,
    weaponSpeed:2.1+i*.045,weaponInterval:4,impactFuse:Math.max(1.4,1.85-i*.045),impactCount:3,impactDamage:Math.round(16+i*.35),
    waves:[
      {name:'THE APPROACH',description:'Catch the '+WEAPON_LIBRARY[ROUTES[i][1]].name.toLowerCase()+'. Build your squad before the ranks close.',count:104+i*8,hp:78+i*6,speed:2.1+i*.025,brutes:3+i,grenadiers:1},
      {name:'UNWELCOME COMPANY',description:'Two champions advance together. Break one before they close in.',count:160+i*9,hp:172+i*20,speed:2.3+i*.045,brutes:6+i,grenadiers:2,boss:true,bossCount:2,bossHpScale:.09,mini:true,bossType:WORLDS[(i+7)%10].boss,partnerType:WORLDS[(i+3)%10].boss},
      {name:'BREAKING POINT',description:'Armored champions are closing. Save artillery for the crush.',count:214+i*10,hp:305+i*34,speed:2.48+i*.055,brutes:10+i*2,grenadiers:3,boss:true,bossCount:i>=4?2:1,bossHpScale:.20,mini:true,bossType:WORLDS[(i+3)%10].boss,partnerType:WORLDS[(i+7)%10].boss},
      {name:boss.name,description:'The guardian will reach your line. Watch its wind-up and keep firing.',count:258+i*6,hp:450+i*42,speed:2.62+i*.055,brutes:12+i*2,grenadiers:4,boss:true,bossType:world.boss},
    ]});
}
for(let i=0;i<LEVELS.length;i++){
  LEVELS[i].world=WORLDS[i];LEVELS[i].weapons=ROUTES[i].map(id=>WEAPON_LIBRARY[id]);
  LEVELS[i].opening=OPENINGS[i===0?0:1+(i-1)%5];
  // Beyond the original finale, grow durability more gently: army size and
  // permanent weapon strength have already reached their caps.
  if(i>=10){
    LEVELS[i].bossHp=LEVELS[9].bossHp+(i-9)*2500;
    LEVELS[i].waves.forEach((wave,w)=>{const base=LEVELS[9].waves[w];wave.hp=Math.round(base.hp+(wave.hp-base.hp)*.55);});
  }
  LEVELS[i].waves.forEach(w=>{if(w.boss&&!w.bossType)w.bossType=WORLDS[i].boss;});
}
