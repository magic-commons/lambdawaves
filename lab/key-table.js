/* key-table.js — λWAVES' ACTIONS on MIR's ONE KEY TABLE (lab/mir/shell/keys.js createKeys), 0.5.0 C3; keys.js and shortcuts.js left.
 * The table is the kit's: the one keydown listener, the chord spelling (`Mod` is Ctrl or ⌘, `Ctrl` the Control key alone), the
 * field and control laws, recording and saving the difference.  What stays λWAVES' is here:
 *   · the rows are rack.js ACTIONS (A9): `ctrl: true` → Mod, `ctrl: 'Ctrl'` → Ctrl (⌘⇧Q never runs the dolly zoom); a row with no
 *     `shift` answers its chord AND Shift+chord, and every run reads Shift as the fine step (⅛: `fineOf`, 044 A4), but the pan, Alt(+Shift)+Drag (stage-gestures.js, not a row), is 1:1, no fine step (0.5.3 R8); held keys repeat; a `stage`
 *     row runs only while the stage has the focus (THE TAB RULE); 039 W1 THE KEY PRESSES THE FOCUSED CONTROL: a control the KEYBOARD
 *     brought the focus to keeps the keys it operates by (the kit's ownsKey: a button its Enter and Space, a slider its arrows) and
 *     acts; one the POINTER focused (a click leaves the focus on its button) hands them to the rows, so Space still plays after a
 *     click and over a focused <select> (wave 88), and a control that will not act yields its key (wave 68);
 *   · THE BINDING LAW (CLAUDE.md): an overlap is refused unless the steal is explicit, a saved chord another row holds by
 *     default is dropped on read, Tab (any chord on it) / Escape / a modifier alone are refused, and a stage row binds on Tab alone;
 *   · the save, `lambdawaves.q0.keys` (PREFERENCE): a 0.4.0 record { id: { key, ctrl, alt, shift } }, or one saved under an old
 *     id (`was`), is read into the kit's { id: [chords] }; what is written is the kit's difference, and nothing when there is none;
 *   · the rows' key / ctrl / alt / shift follow the table, so the menus, the history's names and the tests read the live chord. */
import { createKeys, parseChord, normalize, chordFromEvent, RESERVED_BY_BROWSER, isField, ownsKey } from './mir/shell/keys.js';
import { jsonStore } from './mir/core/prefs.js';

/** the keyboard window's groups, in λWAVES' order (021 I1: CONTROL SURFACE was missing — indexOf −1 sorted csb.search first — and the registry's groups follow) */
export const ORDER = ['TRANSPORT', 'CAMERA', 'STATE', 'WINDOWS & DISPLAY', 'CONTROL SURFACE', 'PROJECT', 'VIEW', 'SETTINGS', 'CARDS', 'NODES', 'WINDOWS', 'TIMELINE'];
const LS_KEYS = 'lambdawaves.q0.keys';
/* 021 R4 · the kit's jsonStore, versioned: `{ v: 1, keys: { id: [chords] } }`; an older unversioned record is read once and written back upgraded */
const keyStore = jsonStore(LS_KEYS);
const local = { get() { const r = keyStore.get(); if (!r || typeof r !== 'object') return null; if (r.v === 1) return r.keys || null; keyStore.set({ v: 1, keys: r }); return r; },
  set(o) { if (o && Object.keys(o).length) keyStore.set({ v: 1, keys: o }); else keyStore.remove(); } };

/** THE KEY ROWS' FINE STEP, written once (044 A4, L36): Shift is the kit's ⅛ (setKnobLaw's keyFine; it was a quarter here and in shell/keys.js) */
export const fineOf = (e) => (e && e.shiftKey ? 1 / 8 : 1);
/** chordsOf({ key, ctrl, alt, shift }) → the kit's chords; no `shift` is both the chord and its Shift (the fine step) */
export function chordsOf(b) {
  if (!b || !b.key) return [];
  const c = [b.ctrl === 'Ctrl' ? 'Ctrl' : b.ctrl ? 'Mod' : '', b.alt ? 'Alt' : '', b.shift ? 'Shift' : '', b.key].filter(Boolean).join('+');
  return b.shift === undefined ? [c, 'Shift+' + c] : [c];
}
/** keysOf(row) — a registry row's chords (lab/actions.js `keys`), each with its Shift twin (the fine step) unless it holds Shift or the row is `exact`;
 *  a 0.4.0-shaped row ({ key, ctrl, alt, shift }) through chordsOf */
export const keysOf = (a) => (Array.isArray(a.keys) ? a.keys.flatMap((c) => (a.exact || /(^|\+)Shift\+/.test(c) ? [c] : [c, 'Shift+' + c])) : chordsOf(a));
const wasOf = (a) => [].concat(a.was || []);
/** liftSaved(record, rows) — a 0.4.0 record (or an old id's, through `was`) as { id: [chords] }; the kit's own shape passes */
export function liftSaved(o, rows) {
  if (!o || typeof o !== 'object') return null;
  const out = Object.fromEntries(Object.entries(o).filter(([, v]) => Array.isArray(v)));   // C7b: a row another module added (timeline.*) keeps its saved chords
  for (const a of rows) { const v = o[a.id] ?? wasOf(a).map((w) => o[w]).find((x) => x !== undefined); if (v !== undefined) out[a.id] = Array.isArray(v) || typeof v === 'string' ? v : chordsOf({ ...a, ...v }); }
  return out;
}

export function createKeyTable({ rows, edit = (a, run) => run(), stageHasFocus = () => false, storage = local, platform, target, reserved = RESERVED_BY_BROWSER } = {}) {
  const byId = new Map(rows.map((a) => [a.id, a])), declared = new Map(rows.map((a) => [a.id, { key: a.key, ctrl: a.ctrl, alt: a.alt, shift: a.shift }]));
  const group = (a) => a.group || ORDER[3];
  const table = createKeys({ platform, target, reserved, storage:   /* 021 I2: the browser's own chords refused by the binder (kit 1.5.6-alpha.2) */ { get: () => liftSaved(storage.get(), rows), set: (o) => storage.set(o) },
    actions: [...rows].sort((x, y) => ORDER.indexOf(group(x)) - ORDER.indexOf(group(y))).map((a) => ({ id: a.id, label: a.label, group: group(a), short: a.short,
      keys: keysOf(a), inFields: !!a.inFields, repeat: true, when: a.when || (a.stage ? stageHasFocus : undefined),
      run: (e) => edit(a, () => a.run(fineOf(e))), up: a.up && (() => a.up()) })) });   // `up`: a HELD row (the kit's: its release, or leaving the page, runs it)
  const P = table.platform, row = (id) => table.list().find((x) => x.id === id);
  const view = target || (typeof window !== 'undefined' ? window : null);   // wave 88: a focused <select> yields Space (the kit counts it a field)
  if (view) view.addEventListener('keydown', (e) => { const t = e.target; if (e.code !== 'Space' || e.defaultPrevented || !t || t.tagName !== 'SELECT') return;
    const id = table.holders(chordFromEvent(e, P))[0]; if (id) { e.preventDefault(); table.run(id, e); } });
  /* 039 W1 · the pointer's focus hands the keys back: a control focused by a press (not by Tab, an arrow or a key's act) keeps no key from a
     row — the row runs, its keyup is swallowed (a button clicks on Space's release) — and nor does an element the browser never presses (the
     logo, a role=button div); after a key moved the focus there, the kit's table has already let the control have it */
  if (view) {
    let byKey = false, keyFocus = null; const taken = new Set();
    /* a tapped knob takes the focus (the kit's dial prevents the press's default, so it never did): its arrows turn it, never the camera */
    view.addEventListener('pointerdown', (e) => { byKey = false; keyFocus = null; const d = e.target.closest && e.target.closest('.k-dial'), k = d && d.closest('.k');
      if (k && k.tabIndex >= 0 && k !== document.activeElement) k.focus({ preventScroll: true }); }, true);
    view.addEventListener('keydown', () => { byKey = true; }, true);
    view.addEventListener('focusin', (e) => { keyFocus = byKey ? e.target : null; }, true);
    const pressable = (n) => /^(BUTTON|SUMMARY|INPUT)$/.test(n.tagName) || (n.tagName === 'A' && n.hasAttribute('href'));
    view.addEventListener('keydown', (e) => { if (e.defaultPrevented || e.isComposing || table.recording()) return;
      const t = e.target, c = chordFromEvent(e, P); if (!c || !t || isField(t) || !ownsKey(t, c)) return;
      if (t === keyFocus && (pressable(t) || !/^(Space|Enter)$/.test(c))) return;   // the control acts
      const id = table.holders(c).find((x) => { const a = table.get(x); try { return !!a && (!a.when || !!a.when()); } catch (_) { return false; } });
      if (id) { e.preventDefault(); taken.add(e.code); table.run(id, e); } });
    view.addEventListener('keyup', (e) => { if (taken.delete(e.code)) e.preventDefault(); }, true);
  }
  /* THE FOCUS LAW (0.5.0 C7b): a row with a `when` of its own (the TIMELINE's: its surface has the focus; 021 I1: NODES' ground) wins its chord
     over λWAVES' other rows while that holds; table order alone handed Home, E, C, P, Y and the Shift-arrows to the stage */
  if (view) view.addEventListener('keydown', (e) => { if (e.defaultPrevented || e.isComposing || table.recording()) return;
    const id = table.holders(chordFromEvent(e, P)).find((x) => { const a = !(byId.get(x) && byId.get(x).stage) && table.get(x); try { return !!(a && a.when && a.when()); } catch (_) { return false; } });
    if (id) { e.preventDefault(); e.stopImmediatePropagation(); if (!e.repeat) table.run(id, e); } }, true);
  for (const { chord, ids } of table.conflicts()) for (const id of ids) if (!row(id).defaults.includes(chord)) table.reset(id);   // the law on read
  function sync() {
    for (const x of table.list()) {
      const a = byId.get(x.id); if (!a || Array.isArray(a.keys)) continue;   // a row another module added (timeline.*), or a registry row (its chords ARE the table's), has no 0.4.0 spec to follow
      if (x.keys.length === x.defaults.length && x.keys.every((c) => x.defaults.includes(c))) { Object.assign(a, declared.get(x.id)); continue; }
      const p = x.keys.length ? parseChord(x.keys[0], P) : null, fine = x.keys.length === 2 && normalize('Shift+' + x.keys[0], P) === x.keys[1];
      Object.assign(a, p ? { key: p.code, ctrl: p.mods.includes('Mod') ? true : p.mods.includes('Ctrl') ? 'Ctrl' : false, alt: p.mods.includes('Alt'),
        shift: fine ? undefined : p.mods.includes('Shift') } : { key: null });
    }
  }
  table.onChange(sync); sync();
  const check = (id, c) => (byId.get(id) && byId.get(id).stage ? 'Window cycling is only available on Tab from the stage.' : /(^|\+)Tab$/.test(c || '') ? 'Tab is reserved for focus navigation.' : table.check(id, c));
  const holders = (id, spec) => { const a = byId.get(id); return [...new Set(chordsOf(Array.isArray(a.keys) ? spec : { ...a, ...spec }).flatMap((c) => table.holders(c)))].filter((x) => x !== id); };
  /* the fine step's Shift twin is a property of the row, not a second binding: the window shows the chord alone (as 0.4.0 drew it) */
  /* 021 I1: a row added late (a window registered after boot) is listed under its own group, never a second heading of it (a stable sort by ORDER) */
  const rank = (g) => { const i = ORDER.indexOf(g); return i < 0 ? ORDER.length : i; }, byGroup = (l) => l.map((x, i) => [x, i]).sort((p, q) => rank(p[0].group) - rank(q[0].group) || p[1] - q[1]).map((p) => p[0]);
  const shown = (keys) => keys.filter((c) => !(c.includes('Shift+') && keys.includes(normalize(c.replace('Shift+', ''), P))));
  return {
    table,
    /** the table as the KEYBOARD window reads it: the twins out of sight, λWAVES' stage rule in its check (its steal is the second
     *  press: explicit); a chord recorded there is the chord alone, as 0.4.0's recorder wrote it */
    window: { ...table, check, chords: (id) => shown(table.chords(id)), list: () => byGroup(table.list()).map((x) => ({ ...x, keys: shown(x.keys), defaults: shown(x.defaults) })) },
    /** bind(id, { key, ctrl, alt, shift }, { steal }) → { ok, conflicts: [ids], reason? } — λWAVES' road (keys.bind, the gates) */
    bind(id, spec = {}, { steal = false } = {}) {
      const a = byId.get(id); if (!a) return { ok: false, reason: 'Unknown action.' };
      const cs = chordsOf(Array.isArray(a.keys) ? spec : { ...a, ...spec });
      if (!cs.length) { table.unbind(id); return { ok: true, conflicts: [] }; }
      const why = cs.map((c) => check(id, c)).find(Boolean); if (why) return { ok: false, reason: why };
      const others = holders(id, spec);
      if (others.length && !steal) return { ok: false, conflicts: others, reason: 'Shortcut already assigned.' };
      cs.forEach((c, i) => table.bind(id, c, { add: i > 0 }));
      return { ok: true, conflicts: others };
    },
    conflicts: (id, spec = {}) => (byId.has(id) ? holders(id, spec).map((x) => byId.get(x)) : []),
    reset: () => table.resetAll(),
    /** a row's key as a menu shows it: the kit's display, '?' for Shift+/ as λWAVES always wrote it, '—' unbound */
    keyText(id) { const k = table.menuKey(id); return !k ? '—' : k === 'Shift+/' || k === '⇧/' ? '?' : k; },
  };
}
