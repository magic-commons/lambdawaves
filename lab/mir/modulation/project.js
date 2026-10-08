/* modulation/project.js — THE MODULATION RACK AND THE TEMPO AS PROJECT PARTS (core/project.js), so FOLDERS, the live
 * session and any save window carry them without knowing they exist.
 *
 * Josh's call 23 (2026-10-07): "The rack's layout and the tempo are saved as device settings, not as parts of a project.
 * Should a project carry them? (Y)".  Until wave 22 the rack (the sources, the macros, the routes) and the tempo lived
 * only in the modulation's device record (bind.js `modulationState`, law 5), so a project opened elsewhere came without
 * its modulation, and BASINS kept a second registry for the two (save-window.js own.register('rack' | 'bpm')).
 *
 *   rackPart(mod, { save, load, present }) → part      'rack': the authored rack, mod.js serializeRack()
 *     capture()        the rack (save(rack) → what the file keeps, when an app adds to it: BASINS' palette ids)
 *     restore(saved)   load(saved) → the rack, written THE WAY A PRESET LOADS, through the history domain's door
 *                      (history/domains.js modulationDomain: bases restored, rack deserialised, dormant routes marked,
 *                      targets synced, the clock re-asked, the window rebuilt, mod.persist() — the device record's own
 *                      writer, so the device setting follows the project); null leaves the rack as it is
 *     signature()      the authored rack (rackKey: no id counters, no driven macro value, no folding), hashed
 *   tempoPart(mod) → part                               'bpm': the tempo, a number
 *     restore(saved)   the clock's setBpm (re-anchored: the beat is continuous), then mod.persist(); null leaves it
 *   registerModulationParts(mod, { rack?, bpm?, save?, load?, present? }, register = registerProjectPart) → unregister
 *     rack: false / bpm: false leave one out
 *
 * THE FALLBACK.  A project without these parts (every file saved before wave 22) and NEW (every part restored with
 * null) leave the rack and the tempo as they are: the device record, read at install, stays what a fresh page and an
 * older project show.  `mod` is installModulation's result, or any { M?, host: { model, registry, targets, clock },
 * view?, persist? } (BASINS' own seam).  PURE but for the registry it is handed. */
import { registerProjectPart } from '../core/project.js';
import { modulationDomain, rackKey } from '../history/domains.js';

/* a cheap, stable fingerprint (FNV-1a, 32 bit), as shell/pages.js: the signature must not grow with the rack */
const hash = (s) => { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); } return (h >>> 0).toString(36); };
const modelOf = (mod) => mod.M || mod.host.model;

export function rackPart(mod, { save = null, load = null, present } = {}) {
  const M = modelOf(mod), door = modulationDomain(mod, { present });
  return {
    capture: () => { const rack = M.serializeRack(); return typeof save === 'function' ? save(rack) : rack; },
    restore(saved) {
      if (saved == null) return;                                       // an older project, or NEW: the rack stays
      const rack = typeof load === 'function' ? load(saved) : saved;
      if (!rack || typeof rack !== 'object' || Array.isArray(rack)) throw new Error('the modulation rack is unreadable');
      door.write(rack);
    },
    signature: () => hash(rackKey(M.serializeRack())),
  };
}

export function tempoPart(mod) {
  const M = modelOf(mod);
  const bpm = () => (M.transport && Number.isFinite(M.transport.bpm) ? M.transport.bpm : null);
  return {
    capture: bpm,
    restore(saved) {
      if (saved == null) return;                                       // an older project, or NEW: the tempo stays
      const b = Number(saved);
      if (!Number.isFinite(b) || b <= 0) throw new Error('the tempo is unreadable');
      mod.host.clock.setBpm(b);
      if (typeof mod.persist === 'function') mod.persist();
    },
    signature: () => String(bpm()),
  };
}

export function registerModulationParts(mod, o = {}, register = registerProjectPart) {
  const offs = [];
  if (o.rack !== false) offs.push(register('rack', rackPart(mod, o)));
  if (o.bpm !== false) offs.push(register('bpm', tempoPart(mod)));
  return () => { for (const off of offs) off(); };
}
