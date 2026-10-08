/* core/perf.js — the UI's meter: `window.__MIR.perf`.
 *
 * THE LAW IT KEEPS: a meter is only free to leave on if it counts nothing it has to look for.  So it never
 * observes the DOM, never samples and never runs a timer; it is a handful of integers that the kit's own write
 * and read helpers bump as they go.  What goes through `setText`, `setVar` and `rect` is counted; what an app
 * writes by hand is not, which is the reason to route hot paths through them.
 *
 * And the helpers SKIP IDENTICAL WRITES (survey F2 §1.3: the kit's knob rewrote its text node every tick, the
 * modulation window wrote meters and playheads unconditionally).  A skipped write is counted apart, so a gate can
 * see both "how much did the UI change" and "how much did it try to".
 */

const C = { writes: 0, skipped: 0, reads: 0, frames: 0, timers: 0, longTasks: 0, longestMs: 0 };
const now = () => (globalThis.performance ? performance.now() : Date.now());
let since = now();

/** count(name, n) — bump a counter; frame.js feeds `frames` and `timers` here */
export function count(name, n = 1) { C[name] = (C[name] || 0) + n; }

/** setText(el, s) — write text only when it changed */
export function setText(el, s) {
  const v = s === undefined || s === null ? '' : String(s);
  if (el.textContent === v) { C.skipped++; return false; }
  el.textContent = v; C.writes++; return true;
}

/** setVar(el, name, v) — write one style property (custom or not) only when it changed; null removes it */
export function setVar(el, name, v) {
  const st = el.style, old = st.getPropertyValue(name);
  if (v === null || v === undefined) {
    if (old === '') { C.skipped++; return false; }
    st.removeProperty(name); C.writes++; return true;
  }
  const s = String(v);
  if (old === s) { C.skipped++; return false; }
  st.setProperty(name, s); C.writes++; return true;
}

/** setAttr(el, name, v) — the same for an attribute; null removes it */
export function setAttr(el, name, v) {
  const old = el.getAttribute(name);
  if (v === null || v === undefined) {
    if (old === null) { C.skipped++; return false; }
    el.removeAttribute(name); C.writes++; return true;
  }
  const s = String(v);
  if (old === s) { C.skipped++; return false; }
  el.setAttribute(name, s); C.writes++; return true;
}

/** rect(el) — the counted layout read */
export function rect(el) { C.reads++; return el.getBoundingClientRect(); }

/** snapshot() — the counters and the milliseconds they cover */
export function snapshot() { return { ...C, ms: Math.round(now() - since) }; }

/** reset() — zero every counter and restart the window */
export function reset() { for (const k of Object.keys(C)) C[k] = 0; since = now(); return snapshot(); }

export const perf = { count, setText, setVar, setAttr, rect, snapshot, reset };

/* long tasks: the browser reports them, so counting them costs nothing (Chromium; elsewhere the count stays 0) */
try {
  const PO = globalThis.PerformanceObserver;
  if (PO && globalThis.document && (PO.supportedEntryTypes || []).includes('longtask')) {
    new PO((list) => { for (const e of list.getEntries()) { C.longTasks++; if (e.duration > C.longestMs) C.longestMs = Math.round(e.duration); } })
      .observe({ type: 'longtask' });
  }
} catch { /* an engine without the entry type */ }

/* the one global a gate reads */
if (globalThis.window) { const M = (globalThis.__MIR = globalThis.__MIR || {}); M.perf = perf; }
