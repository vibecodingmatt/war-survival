// Rendering-only populations. No simulation random source or gameplay rewards.
export const WILDLIFE = {
  jungle: { residents:[['morpho',6],['dragonfly',3]], visitor:'macaw', description:'iridescent morphos, dragonflies and passing macaws', bloom:true },
  ember: { residents:[['firefly',7],['scarab',3]], visitor:'swallow', description:'lantern fireflies, bronze beetles and dusk swallows' },
  jade: { residents:[['dragonfly',5],['koi',3]], visitor:'kingfisher', description:'jade dragonflies, koi and diving kingfishers' },
  ice: { residents:[['snowfinch',4]], visitor:'goose', description:'snow finches and migrating white geese' },
  desert: { residents:[['scarab',5],['dragonfly',2]], visitor:'hawk', description:'copper scarabs, oasis dragonflies and soaring hawks' },
  storm: { residents:[['swallow',4]], visitor:'raven', description:'wind-riding swallows and storm ravens' },
  autumn: { residents:[['monarch',3],['songbird',3]], visitor:'crane', description:'monarch butterflies, songbirds and migrating cranes' },
  volcano: { residents:[['emberbeetle',5]], visitor:'raven', description:'ember beetles and ravens above the caldera' },
  luminous: { residents:[['lunamoth',3],['firefly',7]], visitor:'bat', description:'velvet moon moths, fireflies and nocturnal bats' },
  celestial: { residents:[['swallow',3],['starray',2]], visitor:'crane', description:'high-altitude swallows, cloud rays and migrating cranes' },
  coral: { residents:[['reeffish',6],['ray',2]], visitor:'manta', description:'striped reef fish and gliding manta rays' },
  clockwork: { residents:[['clockbeetle',4],['clockdragonfly',3]], visitor:'brassbird', description:'clockwork beetles, glass-wing dragonflies and brass birds' },
  lotus: { residents:[['firefly',7],['dragonfly',3]], visitor:'heron', description:'marsh fireflies, dragonflies and white herons' },
  prismatic: { residents:[['prismray',4]], visitor:'prismbird', description:'translucent prism rays and crystal-wing birds' },
  astral: { residents:[['starray',3],['firefly',4]], visitor:'skywhale', description:'star rays and rare celestial whale migrations' },
};

const noise = (seed, salt) => {
  let x = Math.imul(seed ^ salt, 0x45d9f3b); x = Math.imul(x ^ x >>> 16, 0x45d9f3b);
  return ((x ^ x >>> 16) >>> 0) / 4294967296;
};

// Analytical schedules make large time steps, pause and screenshots deterministic.
// Long quiet gaps between short visits; each visit changes timing and formation.
export function wildlifeVisit(seconds, seed, bloom = false) {
  const period = bloom ? 67 : 47;
  const cycle = Math.floor(Math.max(0, seconds) / period), local = Math.max(0, seconds) % period;
  const key = seed + cycle * 7919;
  const start = (bloom ? 17 : 5) + noise(key, 31) * 8;
  const duration = (bloom ? 14 : 11) + noise(key, 79) * 4;
  const progress = (local - start) / duration;
  return { active:progress >= 0 && progress < 1, progress, start:cycle * period + start, duration,
    side:noise(key, 151) > .5 ? 1 : -1, count:bloom ? 8 : 2 + Math.floor(noise(key, 239) * 3),
    variation:noise(key, 347), cycle };
}

export function residentCount(count, balanced, density = 1) {
  return Math.max(1, Math.round(count * (balanced ? .72 : 1) * Math.max(.5, Math.min(1, density))));
}
