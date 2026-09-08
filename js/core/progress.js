import { WORLDS } from '../../data/campaign.js?v=0.7.1';
export const PROGRESS_COOKIE = 'war_survival_campaign_v1';
export const LEVEL_COUNT = WORLDS.length;
export const COMPLETE_MASK = (1 << LEVEL_COUNT) - 1;

export function decodeProgress(value) {
  return /^[0-9a-f]{1,4}$/i.test(value || '') && parseInt(value, 16) <= COMPLETE_MASK ? parseInt(value, 16) : 0;
}
export function frontier(mask) {
  for (let i = 0; i < LEVEL_COUNT; i++) if (!(mask & (1 << i))) return i;
  return LEVEL_COUNT - 1;
}
export function canPlay(mask, index) {
  return Number.isInteger(index) && index >= 0 && index < LEVEL_COUNT && (!!(mask & (1 << index)) || index === frontier(mask));
}
export function createProgress(doc = document, storage) {
  if (storage === undefined) { try { storage = globalThis.localStorage; } catch {} }
  const saved = doc.cookie.split(';').map(c => c.trim()).find(c => c.startsWith(PROGRESS_COOKIE + '='));
  let mask = decodeProgress(saved?.slice(PROGRESS_COOKIE.length + 1));
  // Preserve victories earned before cookie-based progression was introduced.
  if (!saved) {
    for (let i = 0; i < LEVEL_COUNT; i++) {
      try { if (storage?.getItem('war-survival-level-' + (i + 1)) === 'complete') mask |= 1 << i; } catch {}
    }
  }
  const path = new URL('../../', import.meta.url).pathname;
  function persist() {
    try { doc.cookie = PROGRESS_COOKIE + '=' + mask.toString(16) + '; Max-Age=31536000; Path=' + path + '; SameSite=Lax' + (globalThis.location?.protocol === 'https:' ? '; Secure' : ''); } catch {}
  }
  if (!saved && mask) persist();
  return {
    get mask() { return mask; }, get next() { return frontier(mask); },
    completed: i => !!(mask & (1 << i)), allowed: i => canPlay(mask, i),
    beat(i) { if (!canPlay(mask, i)) return false; mask |= 1 << i; persist(); return true; },
  };
}
