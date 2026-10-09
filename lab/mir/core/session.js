/* core/session.js — THE LIVE PROJECT: the work kept beside the app's view, so a reopened tab looks the same.
 *
 * LIFTED FROM BASINS (app/project-session.js + save-window.js saveCurrentSession / restoreCurrentSession, 2026-10-01).
 * The project's parts (core/project.js) are the work; this module keeps their capture in ONE storage key the app names,
 * writes it again when the work changes, and hands it back on the next load.  It never learns what a part is.
 *
 * THE LAWS IT KEEPS
 *   · A CHANGE SAVES SOON, NOT NOW.  A part that says it changed (subscribe), or the app calling `changed()`, books ONE
 *     save `delay` ms later (BASINS: 300 ms); a second change inside that time moves the booking.  A one-shot timer, never
 *     a poller: with nothing changing, nothing runs.  A save whose signature equals the last one written writes nothing.
 *   · LEAVING SAVES NOW.  `pagehide` and a page going hidden (`visibilitychange`) flush at once (BASINS' two events).
 *   · NOTHING IS WRITTEN BEFORE THE APP CHOSE.  Autosave is armed by `resume()` or `discard()` (the opener's RESUME or
 *     NEW), or by `arm()` for an app with no opener — so the boot's own writes can never overwrite the work a cold start
 *     is about to offer back.
 *   · `hold()` → true keeps the session from writing (BASINS: while a film renders the view is the film's, not the work).
 *   · NOTHING IS THROWN.  A storage that throws (a private window) is a session that keeps nothing; a part that throws is
 *     isolated by core/project.js.
 *   · THE SEED.  What a one-time preference migration handed the project before there was a project (core/prefs.js
 *     `project`) waits in the record as `seed`; `resume()` gives it to `onSeed(seed, { live })` — with a live project
 *     (live true) or without one (live false) — and the next save, which writes only the parts, absorbs it.
 *
 * THE RECORD   { v: 1, parts: { name: json }, seed? }   in storage[key]
 *
 * createSession({ key, storage?, parts?, also?, delay?, hold?, lift?, onSeed?, win?, doc? }) →
 *   { hasResume(), resume(ctx?) → { ok, failed, seeded }, discard(), arm(), armed(), changed(), save() → bool,
 *     flush() → bool, read() → { parts, seed? } | null, adopt(moved) → bool, destroy() }
 *   key       the app's storage key (required: two apps on one origin never share a session)
 *   storage   { getItem, setItem, removeItem } (default localStorage) · parts  a registry with { capture, restore,
 *             signature, subscribe } (default: the app's shared one, core/project.js)
 *   also      other keys whose presence also means "there is work to resume" (BASINS: its view key, `mandel.view`)
 *   lift(raw) → { parts, seed? } | null    reads a record the app wrote before it adopted the kit (BASINS' v1/v2)
 * Pure exports: readSession(storage, key, lift?), adoptInto(storage, key, moved), openerSwitches(search, opts). */
import { captureProject, restoreProject, projectSignature, subscribeProject } from './project.js';

export const SESSION_V = 1;
const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const defaultStorage = () => { try { return globalThis.localStorage || null; } catch (_) { return null; } };
const rawOf = (S, key) => { try { const t = S && S.getItem(key); return t ? JSON.parse(t) : null; } catch (_) { return null; } };
const put = (S, key, rec) => { try { if (!S) return false; S.setItem(key, JSON.stringify(rec)); return true; } catch (_) { return false; } };

/** readSession(storage, key, lift?) → { parts, seed? } | null — the kit's record, or what `lift` reads of an older one */
export function readSession(storage, key, lift) {
  const raw = rawOf(storage, key);
  if (!isObj(raw)) return null;
  let rec = null;
  if (raw.v === SESSION_V) rec = { parts: isObj(raw.parts) ? raw.parts : null, seed: raw.seed };
  else if (typeof lift === 'function') { try { const l = lift(raw); if (isObj(l)) rec = { parts: isObj(l.parts) ? l.parts : null, seed: l.seed !== undefined ? l.seed : raw.seed }; } catch (_) {} }
  if (!rec) return null;
  const out = { parts: rec.parts };
  if (isObj(rec.seed) && Object.keys(rec.seed).length) out.seed = rec.seed;
  return out.parts || out.seed ? out : null;
}

/** adoptInto(storage, key, moved) → bool — the receiving half of a preference migration (BASINS adoptIntoProject):
 *  the moved values join the record's seed; nothing already there is removed or overwritten.  false = the write failed
 *  (the caller then keeps the values where they were and tries again next load). */
export function adoptInto(storage, key, moved) {
  if (!isObj(moved) || !Object.keys(moved).length) return true;
  const raw = rawOf(storage, key);
  const next = isObj(raw) ? { ...raw } : { v: SESSION_V };
  next.seed = { ...moved, ...(isObj(raw && raw.seed) ? raw.seed : {}) };
  return put(storage, key, next);
}

/** openerSwitches(search, { ids, direct, webdriver }) → { warning, choice } — BASINS' start switches (startup.js):
 *  ?warn=1 always shows the warning; ?warn=0 (or a driven browser) skips it and resumes; any `direct` switch resumes;
 *  ?starter=<id> opens that start when it is one of `ids` ('home' = NEW, 'resume' = RESUME, or the app's starters).
 *  choice null = ask the person (show the opener). */
export function openerSwitches(search = '', { ids = ['home', 'resume'], direct = [], webdriver = false } = {}) {
  const q = search instanceof URLSearchParams ? search : new URLSearchParams(String(search || ''));
  const forced = q.get('warn') === '1';
  const automatic = !forced && (q.get('warn') === '0' || webdriver === true);
  const isDirect = direct.some((d) => q.has(d));
  const requested = q.get('starter');
  return { warning: !automatic, choice: requested != null && ids.includes(requested) ? requested : automatic || isDirect ? 'resume' : null };
}

export function createSession({ key, storage, parts, also = [], delay = 300, hold, lift, onSeed, win, doc } = {}) {
  if (!key) throw new Error('a session needs the app\'s storage key');
  const S = storage !== undefined ? storage : defaultStorage();
  const P = parts || { capture: captureProject, restore: restoreProject, signature: projectSignature, subscribe: subscribeProject };
  const W = win !== undefined ? win : (globalThis.window || null);
  const D = doc !== undefined ? doc : (globalThis.document || null);
  const life = new AbortController(), on = { signal: life.signal };
  let armed = false, timer = null, last = null;

  const sig = () => { try { return String(P.signature()); } catch (_) { return null; } };
  const held = () => { try { return !!(hold && hold()); } catch (_) { return false; } };
  const cancel = () => { if (timer !== null) { clearTimeout(timer); timer = null; } };

  /** save() — write the parts now (when armed, not held, and the work changed since the last write) → wrote? */
  function save() {
    cancel();
    if (!armed || held()) return false;
    const s = sig();
    if (s !== null && s === last) { try { if (S && S.getItem(key) != null) return false; } catch (_) {} }
    let data; try { data = P.capture(); } catch (_) { return false; }
    if (!put(S, key, { v: SESSION_V, parts: isObj(data) ? data : {} })) return false;
    last = s;
    return true;
  }
  /** changed() — the work changed: save once, `delay` ms from now */
  function changed() { if (!armed) return; cancel(); timer = setTimeout(save, delay); }

  const off = typeof P.subscribe === 'function' ? P.subscribe(changed) : null;
  if (W && W.addEventListener) W.addEventListener('pagehide', save, on);
  if (D && D.addEventListener) D.addEventListener('visibilitychange', () => { if (D.visibilityState === 'hidden') save(); }, on);

  return {
    /** hasResume() — is there work to offer back (the record, or one of the `also` keys)? BASINS: presence. */
    hasResume() {
      try { return !!S && (S.getItem(key) != null || also.some((k) => S.getItem(k) != null)); } catch (_) { return false; }
    },
    /** resume(ctx) — put the saved work back (every part restored, ctx = { session: true, …ctx }), hand the seed over,
     *  and arm autosave.  → { ok, failed, seeded } (ok false: no saved parts to restore) */
    resume(ctx = {}) {
      const rec = readSession(S, key, lift);
      let ok = false, failed = [];
      if (rec && rec.parts) {
        try { const r = P.restore(rec.parts, { session: true, ...ctx }); failed = r && Array.isArray(r.failed) ? r.failed : []; ok = true; } catch (_) { ok = false; }
      }
      const seeded = !!(rec && rec.seed && typeof onSeed === 'function');
      if (seeded) { try { onSeed(rec.seed, { live: ok }); } catch (_) {} }
      armed = true; last = ok && !seeded ? sig() : null;
      return { ok, failed, seeded };
    },
    /** discard() — NEW: the saved work is forgotten and autosave arms for the new work */
    discard() { cancel(); try { if (S) S.removeItem(key); } catch (_) {} armed = true; last = null; },
    /** arm() — autosave on, for an app with no opener (nothing is restored) */
    arm() { armed = true; },
    armed: () => armed,
    changed, save,
    /** flush() — a booked save, now (what pagehide does) */
    flush: () => save(),
    read: () => readSession(S, key, lift),
    /** adopt(moved) — adoptInto this session's key (core/prefs.js `project` can be `(m) => session.adopt(m)`) */
    adopt: (moved) => adoptInto(S, key, moved),
    destroy() { cancel(); life.abort(); if (off) { try { off(); } catch (_) {} } armed = false; }
  };
}
