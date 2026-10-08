/* pattern/model.js — THE PATTERN: one step row per ENV, keyed by the ENV's id (harvested from BASINS app/pattern-model.js,
 * branch basins-ui-fixes-2026-10-01, 2026-10-02).
 *
 * Steps are a Uint8 each (0 off, 1–127 velocity), 16 to a bar as FL's step sequencer has them (each step a 16th note).
 * The rows are the PROJECT's: the window and the sequencer read them, the project carries them through
 * patternProjectPart(model) (the app registers it: pattern/window.js installPattern does).
 *
 *   createPatternModel() → { row, rowsLive, rowOf, steps, lengthOf, isLive, lit, setStep, setSteps, fill, clear, setLength,
 *                            setLive, capture, signature, restore, subscribe, rackChanged, bindRack, rackVersion }
 *   patternProjectPart(model) → { capture, restore, signature, subscribe }   the project seam (core/project.js)
 *
 * THE LAWS IT KEEPS (BASINS', unchanged)
 *   1. AN UNTOUCHED ROW IS NOT PROJECT CONTENT, and a row whose ENV left the rack is not saved (bindRack) — nor lost.
 *   2. A RESTORE IS WHOLE OR NOTHING: one invalid row refuses the snapshot.
 *   3. UNDO IS THE APP'S ONE STACK (history/history.js): the model is a snapshot domain there, never a second stack here.
 *   4. A RACK MOVE IS NOT AN EDIT: rackChanged() tells the window, and the project part does not hear it. */
export const PATTERN_LENGTHS = Object.freeze([16, 32, 64]);
export const PATTERN_MAX = 64;
export const STEP_BEATS = 0.25;                    // FL: "Each button (step) in the grid represents a 16th note"
export const VEL_MAX = 127;
const clampVel = (v) => Math.max(0, Math.min(VEL_MAX, Math.round(Number(v) || 0)));
const blank = () => ({ length: 16, live: false, steps: new Uint8Array(PATTERN_MAX) });

export function createPatternModel() {
  let rows = new Map(), rack = 0, onRack = null;
  const listeners = new Set();
  const emit = (why) => { for (const fn of listeners) { try { fn(why); } catch (_) { /* a listener's own fault */ } } };
  const own = (envId) => { const k = String(envId); let r = rows.get(k); if (!r) { r = blank(); rows.set(k, r); } return r; };
  const text = () => JSON.stringify(capture());
  function capture(alive = onRack) {   // a row whose ENV left the rack is not saved
    const out = [];
    for (const [env, r] of rows) {
      if (alive && !alive(env)) continue;
      let n = PATTERN_MAX; while (n > 0 && !r.steps[n - 1]) n--;
      if (!n && !r.live && r.length === 16) continue;               // an untouched row is not project content
      out.push({ env, length: r.length, live: r.live, steps: Array.from(r.steps.subarray(0, n)) });
    }
    return { v: 1, rows: out };
  }
  function parse(o) {
    if (o == null) return new Map();
    if (o.v !== 1 || !Array.isArray(o.rows) || o.rows.length > 256) return null;
    const next = new Map();
    for (const q of o.rows) {
      if (!q || typeof q.env !== 'string' || !q.env || next.has(q.env) || !PATTERN_LENGTHS.includes(q.length) ||
          !Array.isArray(q.steps) || q.steps.length > PATTERN_MAX || q.steps.some((v) => !Number.isInteger(v) || v < 0 || v > VEL_MAX)) return null;
      const r = blank(); r.length = q.length; r.live = !!q.live; r.steps.set(q.steps); next.set(q.env, r);
    }
    return next;
  }
  function edit(fn) { if (fn() === false) return false; emit('edit'); return true; }
  return {
    row(envId) { return rows.get(String(envId)) || null; },
    *rowsLive() { for (const entry of rows) if (entry[1].live) yield entry; },
    rowOf: (envId) => own(envId),
    steps(envId) { const r = rows.get(String(envId)); return r ? Array.from(r.steps.subarray(0, r.length)) : new Array(16).fill(0); },
    lengthOf: (envId) => (rows.get(String(envId)) || { length: 16 }).length,
    isLive: (envId) => !!(rows.get(String(envId)) || {}).live,
    lit(envId) { const r = rows.get(String(envId)); if (!r) return 0; let n = 0; for (let i = 0; i < r.length; i++) if (r.steps[i]) n++; return n; },
    setStep(envId, i, vel) { return edit(() => { const r = own(envId); i |= 0; if (i < 0 || i >= r.length) return false; const v = clampVel(vel); if (r.steps[i] === v) return false; r.steps[i] = v; }); },
    setSteps(envId, from, to, vel) { return edit(() => { const r = own(envId), v = clampVel(vel); const a = Math.max(0, Math.min(from, to) | 0), b = Math.min(r.length - 1, Math.max(from, to) | 0); let n = 0;
      for (let i = a; i <= b; i++) if (r.steps[i] !== v) { r.steps[i] = v; n++; } return n > 0; }); },
    fill(envId, every, vel = VEL_MAX) { return edit(() => { const r = own(envId), e = Math.max(1, every | 0); for (let i = 0; i < r.length; i++) r.steps[i] = i % e === 0 ? clampVel(vel) : 0; }); },
    clear(envId) { return edit(() => { const r = own(envId); r.steps.fill(0, 0, r.length); }); },
    setLength(envId, n) { return edit(() => { if (!PATTERN_LENGTHS.includes(n)) return false; const r = own(envId); if (r.length === n) return false; r.length = n; }); },
    setLive(envId, on) { return edit(() => { const r = own(envId); if (r.live === !!on) return false; r.live = !!on; }); },
    capture, signature: () => text(),
    restore(o) { const next = parse(o); if (!next) return false; rows = next; emit('restore'); return true; },
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    /** the modulation window's rebuild tells the rows a device came or went */
    rackChanged() { rack++; emit('rack'); },
    bindRack(alive) { onRack = typeof alive === 'function' ? alive : null; },
    rackVersion: () => rack
  };
}

/** the project seam (core/project.js registerProjectPart): capture → JSON, restore(JSON | null) → bool, signature, and
 *  subscribe for project edits only (a rack move is not one).  restore(null) — a project that never had rows — clears. */
export function patternProjectPart(model) {
  return {
    capture: () => model.capture(),
    restore: (o) => model.restore(o),
    signature: () => model.signature(),
    subscribe: (fn) => model.subscribe((why) => { if (why !== 'rack') fn(why); })
  };
}
