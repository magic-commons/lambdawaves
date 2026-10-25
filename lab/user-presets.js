/* lab/user-presets.js — THE READER'S PRESETS (iteration 015 S4; Josh: "add a save orbital (so that it just saves which orbitals were selected and
 * that's it). Do the same 'User' section appears when a custom preset is saved").  One PREFERENCE record per list — `{ v: 1, items: [{ name, data }] }`
 * under its own localStorage key (settings-store.js FAMILIES) — never a project, a link or a history row.  SPECTRUM keeps its labels here
 * (`lambdawaves.q0.presets`); PALETTE's stops will (P3, `lambdawaves.q0.palettes`).  A plain module: no `app`.
 *   createUserPresets(storeKey) → { add(name, data) → the name kept, remove(name), list(), watch(fn) → unwatch }
 * `add` appends; a name already taken is kept as `name 2`, `name 3` … (iteration 016 W9, Josh call 16: "a re-save under a taken name becomes
 * name 2, name 3 … by the count of copies"; `uniqueName`), so a save never overwrites one; `list()` is a copy in the saved order; `watch(fn)` hears
 * every change made in this tab (fn(list)). */
/** uniqueName(name, taken) → name, or the first `name k` (k = 2, 3 …) no row holds — pure, for both lists (SPECTRUM's presets, PALETTE's) */
export function uniqueName(name, taken) {
  const has = new Set(taken); if (!has.has(name)) return name;
  for (let k = 2; ; k++) if (!has.has(name + ' ' + k)) return name + ' ' + k;
}
import { jsonStore } from './mir/core/prefs.js';

export function createUserPresets(storeKey) {
  const store = jsonStore(storeKey), fans = new Set();
  const read = () => { const s = store.get(); return s && s.v === 1 && Array.isArray(s.items) ? s.items.filter((x) => x && typeof x.name === 'string' && x.name) : []; };
  const write = (items) => { if (items.length) store.set({ v: 1, items }); else store.remove(); const l = list(); for (const fn of fans) fn(l); };
  const list = () => read().map((x) => ({ name: x.name, data: x.data }));
  return {
    add(name, data) {
      name = String(name || '').trim(); if (!name) return false;
      const items = read(); name = uniqueName(name, items.map((x) => x.name));
      items.push({ name, data }); write(items); return name;
    },
    remove(name) { const items = read(), next = items.filter((x) => x.name !== name); if (next.length === items.length) return false; write(next); return true; },
    list,
    watch(fn) { fans.add(fn); return () => fans.delete(fn); },
  };
}
