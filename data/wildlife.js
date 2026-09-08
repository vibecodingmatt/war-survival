// Rendering-only populations. No simulation random source or gameplay rewards.
export const WILDLIFE = {
  jungle: { residents:[['morpho',5]], signature:'mossback', description:'an ancient mossback tortoise watches the butterfly falls', bloom:true },
  ember: { residents:[], signature:'phoenix', description:'a fire-tailed phoenix unfurls on a ruined roost' },
  jade: { residents:[], signature:'qilin', description:'a jade-scaled qilin guards the bamboo cascades' },
  ice: { residents:[], signature:'mammoth', description:'a six-tusk frost mammoth stands beneath the aurora' },
  desert: { residents:[], signature:'sphinx', description:'a golden sphinx rests beside the oasis' },
  storm: { residents:[], signature:'roc', description:'a thunder roc surveys the storm from its crag' },
  autumn: { residents:[], signature:'kitsune', description:'a nine-tailed fox watches from the autumn garden' },
  volcano: { residents:[], signature:'dragon', description:'two obsidian dragons circle above the caldera' },
  luminous: { residents:[], signature:'spiritstag', description:'a moon-antler spirit stag stands among glowing mushrooms' },
  celestial: { residents:[], signature:'griffin', description:'a griffin sentinel watches from a floating battlement' },
  coral: { residents:[['reeffish',4]], signature:'nautilus', description:'an ancient spiral-shelled nautilus drifts through the reef' },
  clockwork: { residents:[], signature:'owl', description:'a brass owl automaton turns its jeweled gaze' },
  lotus: { residents:[], signature:'frogking', description:'a lotus-crowned frog king rests on a giant lily pad' },
  prismatic: { residents:[], signature:'basilisk', description:'a six-legged crystal basilisk guards the rift' },
  astral: { residents:[], signature:'moonhare', description:'a cosmic hare listens beneath the celestial orrery' },
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
