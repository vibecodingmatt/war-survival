export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
export const lerp = (a, b, t) => a + (b - a) * t;
export function randomSource(seed = 731) {
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
export function formation(index) {
  const row = Math.floor(index / 3);
  return { x: (index % 3 - 1) * 0.83 + (row % 2 ? 0.18 : 0), z: row * 0.84 - 0.7 };
}
