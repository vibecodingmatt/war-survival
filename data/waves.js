export const WAVES = [
  { name: 'THE VANGUARD', description: 'Left: +1 soldiers. Center: enemies. Right: stronger guns.', count: 80, hp: 62, speed: 1.8, brutes: 0, grenadiers: 0 },
  { name: 'RED TIDE', description: 'The ranks are growing. Your squad must grow faster.', count: 136, hp: 120, speed: 1.95, brutes: 3, grenadiers: 1 },
  { name: 'IRON COMPANY', description: 'Heavy armor. Bring more riflemen and a bigger gun.', count: 184, hp: 230, speed: 2.1, brutes: 6, grenadiers: 2 },
  { name: 'THE CRIMSON WARDEN', description: 'Break the Legion. A starting rifle will not save you.', count: 216, hp: 320, speed: 2.2, brutes: 8, grenadiers: 2, boss: true },
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
