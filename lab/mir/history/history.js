/* history/history.js — THE ONE STACK, lifted from BASINS (app/history.js, 2026-10-01) into the kit.
 *
 * THE LAW IT KEEPS (λWAVES's lab/history.js, kept): one app-level list of named rows, any row one hop away, an edit
 * truncates the future, a gesture is one row, a travel is never an edit, a gesture that moved nothing leaves no row.
 * BASINS's shape: rows are COMMANDS {label, domain, undo, redo} across DOMAINS — a snapshot domain (colour, camera,
 * modulation) is read and written whole; a delegated domain keeps its own undo and the row only calls it.
 *
 * PURE: no DOM, no storage, no globals but the timer pair (injectable).  history-list.js draws it and wires the keys.
 * Lifted as it was; what changed is only what tied it to the app: the header, and adoptTimeline / timelineLabel, which
 * read BASINS's timeline model and stay with the app (they use only register({ delegated }) and push, both here). */
export const HISTORY_LIMIT = 256;
export const HISTORY_BYTES = 32 * 1024 * 1024;
const QUIET_MS = 400;     // an input/change note settles after this much quiet
const STUCK_MS = 5000;    // a pointerdown whose pointerup never came stops holding the settle off after this
const BOTTOM = 'START';

export function createHistory({ limit = HISTORY_LIMIT, bytes = HISTORY_BYTES, quiet = QUIET_MS, now = () => Date.now(),
  timers = globalThis } = {}) {
  const rows = [];                       // oldest first; rows[cursor - 1] is the state you stand on
  const domains = new Map();             // name → { read, write, key, base } (snapshot) | { delegated: true }
  const listeners = new Set();
  let cursor = 0, total = 0, bottom = BOTTOM, applying = false;
  let held = 0, heldAt = 0, pending = null, timer = 0;
  const changed = () => { for (const fn of listeners) { try { fn(); } catch (_) {} } };
  const keyOf = (d, snap) => (d.key ? d.key(snap) : JSON.stringify(snap));
  const snapshotDomains = () => [...domains.entries()].filter(([, d]) => !d.delegated);
  const disarm = () => { if (timer) { timers.clearTimeout(timer); timer = 0; } };
  /* only an ANNOUNCED edit (a released gesture or a note still inside its quiet window) lands before what comes next; a
     change nobody announced (boot, a programmatic write, a fling's drift) is not the hand's and is never a row */
  const flushAnnounced = () => (timer ? settle(true) : false);

  /** the live state of one snapshot domain becomes its baseline (after a write, a travel, or a non-edit) */
  function rebase(name) {
    const d = domains.get(name); if (!d || d.delegated) return;
    try { const snap = d.read(); d.base = { snap, key: keyOf(d, snap) }; } catch (_) { d.base = null; }
  }
  const rebaseAll = () => { for (const [name] of snapshotDomains()) rebase(name); };

  /** register(name, {read, write, key?}) — a snapshot domain; register(name, {delegated: true}) — rows pushed by its owner */
  function register(name, port) {
    const d = port && port.delegated ? { delegated: true } : { read: port.read, write: port.write, key: port.key || null, base: null };
    domains.set(name, d);
    if (!d.delegated) rebase(name);
    return () => domains.delete(name);
  }

  function drop(i) {
    const [gone] = rows.splice(i, 1);
    if (gone) total -= gone.size;
    if (i < cursor) cursor--;
  }
  /** a new row: the future it contradicts goes, then the oldest fall off the front until the count and the bytes fit */
  function push(cmd) {
    if (applying || !cmd || typeof cmd.undo !== 'function' || typeof cmd.redo !== 'function') return false;
    if (!held) flushAnnounced();                    // an earlier quiet edit lands first, so the rows keep the hand's order
    while (rows.length > cursor) drop(rows.length - 1);
    const row = { label: String(cmd.label || 'EDIT').slice(0, 80), domain: String(cmd.domain || ''), undo: cmd.undo, redo: cmd.redo,
      size: Math.max(0, Number(cmd.size) || 0), at: now(), domains: cmd.domains || [] };
    rows.push(row); total += row.size; cursor = rows.length;
    while (rows.length > 1 && (rows.length > limit || total > bytes)) drop(0);
    changed();
    return true;
  }
  /** record(name, label, before, after) — one row over a snapshot domain; record([names], label, {name: before}, {name: after})
   *  — one row over several (one gesture that moved two domains is ONE row); bytes counted as UTF-16, both sides */
  function record(names, label, before, after) {
    const list = [].concat(names), pick = (m, n) => (Array.isArray(names) ? m[n] : m);
    const size = list.reduce((n, name) => n + 2 * ((JSON.stringify(pick(before, name)) || '').length + (JSON.stringify(pick(after, name)) || '').length), 0);
    const write = (m) => () => { for (const name of list) { const d = domains.get(name); if (d && !d.delegated) d.write(pick(m, name)); } };
    return push({ label, domain: list.join(' · '), domains: list, size, undo: write(before), redo: write(after) });
  }
  /** settle: every snapshot domain whose live key left its baseline becomes ONE row, named for the gesture that did it */
  function settle(force) {
    disarm();
    if (applying) return false;
    if (!force && held > 0 && now() - heldAt < STUCK_MS) return false;
    const names = [], before = {}, after = {};
    for (const [name, d] of snapshotDomains()) {
      let snap; try { snap = d.read(); } catch (_) { continue; }
      const key = keyOf(d, snap);
      if (!d.base) { d.base = { snap, key }; continue; }
      if (key === d.base.key) continue;
      names.push(name); before[name] = d.base.snap; after[name] = snap; d.base = { snap, key };
    }
    if (!names.length) { if (!held) pending = null; return false; }
    const label = pending || 'EDIT';
    pending = null;
    record(names, label, before, after);
    return true;
  }
  /** run one row's undo or redo with notes suppressed, then re-baseline what it wrote — a travel is not an edit */
  function run(row, way) {
    applying = true;
    let out;
    try { out = row[way](); } finally { applying = false; for (const name of row.domains) rebase(name); }
    return out;
  }
  function stepBack() {
    if (cursor === 0) return false;
    const i = cursor - 1;
    if (run(rows[i], 'undo') === false) { drop(i); return stepBack(); }   // a delegated row its owner no longer holds: gone, the next one answers
    cursor = i;
    return true;
  }
  function stepForward() {
    if (cursor >= rows.length) return false;
    if (run(rows[cursor], 'redo') === false) { while (rows.length > cursor) drop(rows.length - 1); return false; }
    cursor++;
    return true;
  }
  /* settle first and read the cursor AFTER it: an edit still inside its quiet window becomes the top row, and one step back
     from there is the state the hand started from */
  function undo() { flushAnnounced(); const ok = stepBack(); if (ok) changed(); return ok; }
  function redo() { flushAnnounced(); const ok = stepForward(); if (ok) changed(); return ok; }
  /** goto(i) — stand on row i (−1 is START): the FL move, any row, one hop, either direction */
  function goto(i) {
    flushAnnounced();
    const want = Math.max(0, Math.min(rows.length, Math.trunc(Number(i)) + 1));
    if (!Number.isFinite(want) || want === cursor) return false;
    let moved = false;
    while (cursor > want && stepBack()) moved = true;
    while (cursor < want && stepForward()) moved = true;
    if (moved) changed();
    return moved;
  }
  /** a gesture opens (pointerdown): the edit ending lands, everything that moved since by itself is not this gesture's */
  function hold(label) {
    if (held === 0) { flushAnnounced(); rebaseAll(); }
    if (label) pending = String(label);
    held++; heldAt = now();
  }
  /** the gesture ends: settle on the next task, so the control's own change lands first; absorb = it was not an edit */
  function release(opts) {
    held = Math.max(0, held - 1);
    if (held > 0) return;
    if (opts && opts.absorb) { disarm(); rebaseAll(); pending = null; return; }
    disarm(); timer = timers.setTimeout(() => { timer = 0; settle(false); }, 0);
  }
  /** an edit may have happened without a pointer (a select, a typed number): settle after the quiet window */
  function note(label) {
    if (applying) return;
    if (label && !held) pending = String(label);
    disarm(); timer = timers.setTimeout(() => { timer = 0; settle(false); }, quiet);
  }
  /** change(domain, label, fn) — a programmatic edit as one row */
  function change(name, label, fn) {
    flushAnnounced();
    const d = domains.get(name);
    if (!d || d.delegated) { fn(); return false; }
    rebase(name);
    const before = d.base ? d.base.snap : d.read();
    fn();
    const after = d.read(), key = keyOf(d, after);
    if (d.base && key === d.base.key) return false;
    d.base = { snap: after, key };
    return record(name, label, before, after);
  }
  /** forget(domain) — its rows can no longer be applied (the timeline's model was replaced): they go, the rest keep order */
  function forget(name) {
    let n = 0;
    for (let i = rows.length - 1; i >= 0; i--) if (rows[i].domains.includes(name) || rows[i].domain === name) { drop(i); n++; }
    if (n) changed();
    return n;
  }
  /** a fresh stack on the live state, its bottom row named for its origin (OPEN · NAME, NEW, SESSION) */
  function clear(label) {
    disarm(); rows.length = 0; cursor = 0; total = 0; held = 0; pending = null;
    bottom = label ? String(label).slice(0, 80) : BOTTOM;
    rebaseAll(); changed();
  }
  /** the list a window paints, oldest first: the bottom row (i −1), then one per command, each past · current · future */
  function entries() {
    const out = [{ i: -1, label: bottom, domain: '', at: 0, state: cursor === 0 ? 'current' : 'past' }];
    rows.forEach((r, i) => out.push({ i, label: r.label, domain: r.domain, at: r.at, state: i < cursor - 1 ? 'past' : i === cursor - 1 ? 'current' : 'future' }));
    return out;
  }
  return {
    register, push, record, settle: () => settle(true), flush: () => settle(true), undo, redo, goto, hold, release, note, change, forget, clear, entries,
    absorb: () => { disarm(); rebaseAll(); }, label: (name) => { pending = name ? String(name) : null; },
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    get canUndo() { return cursor > 0; }, get canRedo() { return cursor < rows.length; },
    get cursor() { return cursor; }, get length() { return rows.length; }, get bytes() { return total; },
    get limit() { return limit; }, get maxBytes() { return bytes; }, get applying() { return applying; },
    get holding() { return held > 0; }, get pendingLabel() { return pending; }
  };
}
