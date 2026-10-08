/* core/project.js — THE PROJECT'S PARTS: the one seam through which any window persists itself into the project.
 *
 * THE LAW IT KEEPS (lifted from BASINS app/project-session.js, 2026-10-01): a window whose state IS the work (the pattern
 * rows, the accents, an asset list) registers { capture, restore, signature, subscribe? } once; the save window then
 * captures, restores and fingerprints every part with the rest of the project and never learns that the part exists.
 *
 *   capture() → JSON | null     null (or undefined) means "nothing to save": the part is left out of the file
 *   restore(saved | null, ctx)  saved is what capture() gave, or null when the project never had this part — the part
 *                               decides (clear its rows, or leave the UI alone); ctx is whatever the caller passes
 *   signature() → string        a cheap fingerprint for "has the project changed"; absent, JSON.stringify(capture())
 *   subscribe(fn) → off         optional: the part calls fn when it changed, so a live project stays fresh between saves
 *
 * ORDER AND ERRORS.  Parts run in REGISTRATION order (a part registered again keeps its place).  A part that throws is
 * isolated, never fatal: on capture it is left out of the data, on restore the others still restore and its name comes
 * back in `failed`, in its signature it reads `name:?`.  Nothing is thrown at the caller and nothing is logged here;
 * the caller decides what a failure means.  PURE: no DOM, no storage, no globals — `createProjectParts()` makes an
 * isolated registry (tests, a second project), and the named exports below are the app's one shared instance.
 */

export function createProjectParts() {
  const parts = new Map(), watchers = new Set(), unwatch = new Map();
  const stop = (key) => { if (unwatch.has(key)) { try { unwatch.get(key)(); } catch (_) {} unwatch.delete(key); } };

  /** register(name, part) → unregister.  Registering a name again replaces the part (and its subscription), keeping its slot. */
  function register(name, part) {
    if (!name || !part || typeof part.capture !== 'function' || typeof part.restore !== 'function') throw new Error('a project part needs capture and restore');
    const key = String(name);
    stop(key);
    parts.set(key, part);
    if (typeof part.subscribe === 'function') { try { unwatch.set(key, part.subscribe(() => { for (const fn of watchers) { try { fn(key); } catch (_) {} } })); } catch (_) {} }
    return () => { if (parts.get(key) === part) { parts.delete(key); stop(key); } };
  }
  /** capture() → { name: json } for every part that has something to say */
  function capture() {
    const out = {};
    for (const [name, part] of parts) { try { const v = part.capture(); if (v != null) out[name] = v; } catch (_) {} }
    return out;
  }
  /** restore(saved, ctx) → { failed: [names] }.  Every registered part is called, a missing entry as null. */
  function restore(saved, ctx) {
    const got = saved && typeof saved === 'object' ? saved : {}, failed = [];
    for (const [name, part] of parts) { try { part.restore(Object.hasOwn(got, name) ? got[name] : null, ctx); } catch (_) { failed.push(name); } }
    return { failed };
  }
  const signature = () => [...parts].map(([name, part]) => { try { return name + ':' + (part.signature ? part.signature() : JSON.stringify(part.capture())); } catch (_) { return name + ':?'; } }).join('|');
  return {
    register, capture, restore, signature,
    /** subscribe(fn(name)) → off: any subscribing part saying it changed */
    subscribe(fn) { watchers.add(fn); return () => watchers.delete(fn); },
    names: () => [...parts.keys()]
  };
}

const shared = createProjectParts();
export const registerProjectPart = shared.register;
export const captureProject = shared.capture;
export const restoreProject = shared.restore;
export const projectSignature = shared.signature;
export const subscribeProject = shared.subscribe;
export const projectPartNames = shared.names;
