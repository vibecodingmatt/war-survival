// Temporary ammunition replaces the previous ammo modifier, never the permanent gun.
export const AMMO = {
  fanfire: {name:'FANFARE',detail:'TRIPLE FAN VOLLEYS',duration:9,color:0x91f4b9,symbol:'Y',pellets:3,damage:.46,rate:1},
  helix: {name:'DOUBLE HELIX',detail:'TWIN CORKSCREW ROUNDS',duration:9,color:0x88e9ff,symbol:'∞',pellets:2,damage:.7,rate:.95},
  pinball: {name:'PINBALL',detail:'FOUR WILD RICOCHETS',duration:9,color:0xffa7e2,symbol:'↗',pellets:1,damage:1,rate:1},
  pulse: {name:'BOOM BOX',detail:'SLOW, HUGE SONIC SHELLS',duration:9,color:0xb6a3ff,symbol:'◎',pellets:1,damage:2.4,rate:1.55},
  jackpot: {name:'RAINBOW RUSH',detail:'JACKPOT! 3× FIRE RATE',duration:7,color:0xffdc7a,symbol:'★',pellets:1,damage:.82,rate:.34,rare:true},
};
export const SUPPLIES = {
  overdrive:{name:'OVERDRIVE',detail:'9s · RAPID FIRE',color:0xffd677,symbol:'»'},
  shield:{name:'AEGIS',detail:'+30 SHIELD',color:0x89e7ff,symbol:'◇'},
  rally:{name:'RALLY',detail:'12s · DOUBLE RECRUITS',color:0xd4a0ff,symbol:'×2'},
  repair:{name:'FIELD REPAIR',detail:'+20 INTEGRITY',color:0x89f5b1,symbol:'+'},
  ...AMMO,
};
// The gold jackpot occurs once per shuffled 13-pod bag; support drops occur twice.
export const SUPPLY_DECK=['overdrive','shield','rally','repair','overdrive','shield','rally','repair',...Object.keys(AMMO)];
export const SHOT_STYLES = {
  rifle:{shape:'tracer',width:1,length:1.1},repeater:{shape:'tracer',width:1.2,length:1.65},
  gatling:{shape:'tracer',width:1.25,length:2.4},cannon:{shape:'orb',width:2.8,length:1.2},
  frost:{shape:'shard',width:2,length:1.8},arc:{shape:'orb',width:1.5,length:1},
  flame:{shape:'flame',width:3.3,length:1.9},rail:{shape:'tracer',width:1.35,length:4.2},
  rockets:{shape:'rocket',width:2.4,length:1.7},sun:{shape:'orb',width:3,length:1.45},
};
