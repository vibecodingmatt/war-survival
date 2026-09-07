// Art direction and equipment routes are shared by the menu, simulation and world.
export const WEAPON_LIBRARY = {
  rifle: { name:'VOLLEY RIFLE', model:1, damage:9, interval:.64, speed:65, splash:0, cost:0, color:0xffdf94 },
  repeater: { name:'REPEATER', model:2, damage:12, interval:.44, speed:78, splash:0, cost:650, color:0xffbd58 },
  gatling: { name:'GATLING', model:3, damage:16, interval:.29, speed:92, splash:0, cost:2800, color:0x77e8ff },
  cannon: { name:'SIEGE CANNON', model:4, damage:35, interval:.45, speed:72, splash:2.1, cost:8500, color:0xff8f43 },
  frost: { name:'FROST LANCE', model:5, damage:13, interval:.42, speed:86, slow:.48, splash:.7, cost:650, color:0x8eeeff },
  arc: { name:'ARC COIL', model:6, damage:19, interval:.4, speed:100, chain:3, cost:2800, color:0xa7a1ff },
  flame: { name:'DRAGON BREATH', model:7, damage:18, interval:.32, speed:62, splash:1.5, burn:18, cost:2800, color:0xff692f },
  rail: { name:'RAIL DRIVER', model:8, damage:62, interval:.48, speed:150, pierce:5, cost:8500, color:0x68ffcd },
  rockets: { name:'HAILSTORM', model:9, damage:48, interval:.5, speed:65, splash:3.3, cost:8500, color:0xffb478 },
  sun: { name:'SUNFORGE', model:10, damage:48, interval:.42, speed:108, splash:2.6, burn:26, cost:8500, color:0xfff199 },
};
for(const [id,weapon] of Object.entries(WEAPON_LIBRARY))weapon.id=id;

export const BOSS_TYPES = {
  warden:{name:'CRIMSON WARDEN',color:0xb83241,accent:0xf2b760,shape:'knight',attack:'salvo'},
  marshal:{name:'EMBER MARSHAL',color:0x4f3940,accent:0xff8040,shape:'tank',attack:'sweep'},
  oracle:{name:'TIDAL ORACLE',color:0x258d92,accent:0x8af7e7,shape:'oracle',attack:'cross'},
  frost:{name:'GLACIER KING',color:0x466c9a,accent:0xa6efff,shape:'crystal',attack:'sweep'},
  scarab:{name:'BRASS SCARAB',color:0xa97e3d,accent:0xffe8a0,shape:'crawler',attack:'salvo'},
  storm:{name:'STORM HERALD',color:0x4c407d,accent:0xbdb1ff,shape:'oracle',attack:'cross'},
  ronin:{name:'AUTUMN RONIN',color:0x743332,accent:0xffc877,shape:'knight',attack:'sweep'},
  furnace:{name:'FURNACE COLOSSUS',color:0x382b31,accent:0xff5d26,shape:'tank',attack:'salvo'},
  mycelium:{name:'SPORE EMPRESS',color:0x526178,accent:0xdca3ff,shape:'crawler',attack:'summon'},
  sovereign:{name:'ECLIPSE SOVEREIGN',color:0x4c3e69,accent:0xffebb0,shape:'oracle',attack:'summon'},
};

// Ten palettes plus structural landmarks. Values are deliberately data, not level checks.
export const WORLDS = [
  {name:'ASHEN CROSSING',biome:'jungle',sky:'#608e9c',horizon:'#f5ddb1',fog:'#b9c6b6',sun:'#ffd6a0',stone:'#c0bca8',leaf:'#93ac69',water:'#367b78',accent:'#e9c883',weather:'pollen',landmark:'falls',description:'Sunlit gorge · Waterfalls and circling swifts',boss:'warden'},
  {name:'EMBER GATE',biome:'ember',sky:'#384b6b',horizon:'#e8a878',fog:'#837983',sun:'#ffa05b',stone:'#b5a59b',leaf:'#8b8e62',water:'#435776',accent:'#ff9555',weather:'embers',landmark:'beacons',description:'Smoldering ruins · Lanterns at dusk',boss:'marshal'},
  {name:'JADE CASCADES',biome:'jade',sky:'#3e9b9b',horizon:'#d1efda',fog:'#89bdb0',sun:'#e5ffda',stone:'#96b7a6',leaf:'#46b18d',water:'#34b7ae',accent:'#8dffe4',weather:'rain',landmark:'falls',description:'Bamboo sanctuary · Twin cataracts and drifting spray',boss:'oracle'},
  {name:'FROSTGLASS PASS',biome:'ice',sky:'#253a68',horizon:'#98cde0',fog:'#91b6d2',sun:'#c6e9ff',stone:'#cadde1',leaf:'#a4d8dc',water:'#376d9b',accent:'#8aeaff',weather:'snow',landmark:'crystals',description:'Glacial night · Ice spires beneath an aurora',boss:'frost'},
  {name:'SUNSCAR OASIS',biome:'desert',sky:'#698eae',horizon:'#ffe3b0',fog:'#dac3a0',sun:'#ffdda1',stone:'#ddbb85',leaf:'#baa56d',water:'#278e95',accent:'#ffd383',weather:'sand',landmark:'arches',description:'Golden canyon · Monumental arches and an oasis',boss:'scarab'},
  {name:'TEMPEST REACH',biome:'storm',sky:'#192c45',horizon:'#7286a1',fog:'#718797',sun:'#adcce8',stone:'#859ba4',leaf:'#527e7b',water:'#294f6a',accent:'#aaadff',weather:'storm',landmark:'monoliths',description:'Rain-soaked highlands · Lightning above the falls',boss:'storm'},
  {name:'AMBER SANCTUARY',biome:'autumn',sky:'#697e9b',horizon:'#ffdca7',fog:'#b5a991',sun:'#ffd7a0',stone:'#baa891',leaf:'#efaa60',water:'#4d8c88',accent:'#ffd38b',weather:'petals',landmark:'pagoda',description:'Autumn gardens · Golden leaves and floating lanterns',boss:'ronin'},
  {name:'CINDER CALDERA',biome:'volcano',sky:'#352e44',horizon:'#e38354',fog:'#916d68',sun:'#ff9c68',stone:'#827779',leaf:'#716864',water:'#c94d22',accent:'#ff762f',weather:'embers',landmark:'volcano',description:'Basalt causeway · Lava rivers and a living volcano',boss:'furnace'},
  {name:'LUMEN WILDS',biome:'luminous',sky:'#152448',horizon:'#59739a',fog:'#597a91',sun:'#b8d9f0',stone:'#99b7bf',leaf:'#64c1c3',water:'#367d91',accent:'#d1a7ff',weather:'fireflies',landmark:'mushrooms',description:'Moonlit forest · Giant glowing mushrooms and fireflies',boss:'mycelium'},
  {name:'THE SKY CITADEL',biome:'celestial',sky:'#324b86',horizon:'#f5d6bd',fog:'#b4bacd',sun:'#ffe8c6',stone:'#e0d5c5',leaf:'#a1b7d2',water:'#7b9cc1',accent:'#ffe9b0',weather:'stars',landmark:'islands',description:'Above the clouds · Floating islands and an eclipse gate',boss:'sovereign'},
];

export const ROUTES = [
  ['rifle','repeater','gatling','cannon'],['rifle','repeater','gatling','cannon'],
  ['rifle','frost','arc','rail'],['rifle','frost','arc','rockets'],
  ['rifle','repeater','flame','sun'],['rifle','frost','arc','rail'],
  ['rifle','repeater','flame','rockets'],['rifle','frost','arc','sun'],
  ['rifle','frost','flame','rail'],['rifle','repeater','arc','sun'],
];
