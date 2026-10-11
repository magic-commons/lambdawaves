/* key-table.js — λWAVES' ACTIONS on MIR's ONE KEY TABLE (lab/mir/shell/keys.js createKeys), 0.5.0 C3; keys.js and shortcuts.js left.
 * The table is the kit's: the one keydown listener, the chord spelling (`Mod` is Ctrl or ⌘, `Ctrl` the Control key alone), the
 * field and control laws, recording and saving the difference.  What stays λWAVES' is here:
 *   · the rows are rack.js ACTIONS (A9): `ctrl: true` → Mod, `ctrl: 'Ctrl'` → Ctrl (⌘⇧Q never runs the dolly zoom); a row with no
 *     `shift` answers its chord AND Shift+chord, and every run reads Shift as the fine step (0.25), but the pan, Alt(+Shift)+Drag (stage-gestures.js, not a row), is 1:1, no fine step (0.5.3 R8); held keys repeat; a `stage`
 *     row runs only while the stage has the focus (THE TAB RULE); every row is `overControls`, so a focused control keeps a key only
 *     by acting on it (it prevents the default: a knob's arrows, a seg's arrows) and a control that will not act yields it (wave
 *     68), and Space is the transport's over any control and a focused <select> (wave 88);
 *   · THE BINDING LAW (CLAUDE.md): an overlap is refused unless the steal is explicit, a saved chord another row holds by
 *     default is dropped on read, Tab (any chord on it) / Escape / a modifier alone are refused, and a stage row binds on Tab alone;
 *   · the save, `lambdawaves.q0.keys` (PREFERENCE): a 0.4.0 record { id: { key, ctrl, alt, shift } }, or one saved under an old
 *     id (`was`), is read into the kit's { id: [chords] }; what is written is the kit's difference, and nothing when there is none;
 *   · the rows' key / ctrl / alt / shift follow the table, so the menus, the history's names and the tests read the live chord. */
import { createKeys, parseChord, normalize, chordFromEvent } from './mir/shell/keys.js';

const ORDER = ['TRANSPORT', 'CAMERA', 'STATE', 'WINDOWS & DISPLAY', 'PROJECT'];   // the keyboard window's groups, in λWAVES' order
const LS_KEYS = 'lambdawaves.q0.keys';
const local = { get() { try { return JSON.parse(localStorage.getItem(LS_KEYS)); } catch (_) { return null; } },
  set(o) { try { if (o && Object.keys(o).length) localStorage.setItem(LS_KEYS, JSON.stringify(o)); else localStorage.removeItem(LS_KEYS); } catch (_) {} } };

/** chordsOf({ key, ctrl, alt, shift }) → the kit's chords; no `shift` is both the chord and its Shift (the fine step) */
export function chordsOf(b) {
  if (!b || !b.key) return [];
  const c = [b.ctrl === 'Ctrl' ? 'Ctrl' : b.ctrl ? 'Mod' : '', b.alt ? 'Alt' : '', b.shift ? 'Shift' : '', b.key].filter(Boolean).join('+');
  return b.shift === undefined ? [c, 'Shift+' + c] : [c];
}
/** liftSaved(record, rows) — a 0.4.0 record (or an old id's, through `was`) as { id: [chords] }; the kit's own shape passes */
export function liftSaved(o, rows) {
  if (!o || typeof o !== 'object') return null;
  const out = Object.fromEntries(Object.entries(o).filter(([, v]) => Array.isArray(v)));   // C7b: a row another module added (timeline.*) keeps its saved chords
  for (const a of rows) { const v = o[a.id] ?? (a.was ? o[a.was] : undefined); if (v !== undefined) out[a.id] = Array.isArray(v) || typeof v === 'string' ? v : chordsOf({ ...a, ...v }); }
  return out;
}

export function createKeyTable({ rows, edit = (a, run) => run(), stageHasFocus = () => false, storage = local, platform, target } = {}) {
  const byId = new Map(rows.map((a) => [a.id, a])), declared = new Map(rows.map((a) => [a.id, { key: a.key, ctrl: a.ctrl, alt: a.alt, shift: a.shift }]));
  const group = (a) => a.group || ORDER[3];
  const table = createKeys({ platform, target, storage: { get: () => liftSaved(storage.get(), rows), set: (o) => storage.set(o) },
    actions: [...rows].sort((x, y) => ORDER.indexOf(group(x)) - ORDER.indexOf(group(y))).map((a) => ({ id: a.id, label: a.label, group: group(a), short: a.short,
      keys: chordsOf(a), inFields: !!a.inFields, repeat: true, overControls: true, when: a.stage ? stageHasFocus : undefined,
      run: (e) => edit(a, () => a.run(e && e.shiftKey ? 0.25 : 1)), up: a.up && (() => a.up()) })) });   // `up`: a HELD row (the kit's: its release, or leaving the page, runs it)
  const P = table.platform, row = (id) => table.list().find((x) => x.id === id);
  const view = target || (typeof window !== 'undefined' ? window : null);   // wave 88: a focused <select> yields Space (the kit counts it a field)
  if (view) view.addEventListener('keydown', (e) => { const t = e.target; if (e.code !== 'Space' || e.defaultPrevented || !t || t.tagName !== 'SELECT') return;
    const id = table.holders(chordFromEvent(e, P))[0]; if (id) { e.preventDefault(); table.run(id, e); } });
  /* THE FOCUS LAW (0.5.0 C7b): a row another module added with a `when` (the TIMELINE's: its surface has the focus) wins its chord
     over λWAVES' row while that holds; table order alone handed Home, E, C, P, Y and the Shift-arrows to the stage */
  if (view) view.addEventListener('keydown', (e) => { if (e.defaultPrevented || e.isComposing || table.recording()) return;
    const id = table.holders(chordFromEvent(e, P)).find((x) => { const a = !byId.has(x) && table.get(x); try { return !!(a && a.when && a.when()); } catch (_) { return false; } });
    if (id) { e.preventDefault(); e.stopImmediatePropagation(); if (!e.repeat) table.run(id, e); } }, true);
  for (const { chord, ids } of table.conflicts()) for (const id of ids) if (!row(id).defaults.includes(chord)) table.reset(id);   // the law on read
  function sync() {
    for (const x of table.list()) {
      const a = byId.get(x.id); if (!a) continue;   // a row another module added (timeline.*) has no λWAVES spec to follow the table
      if (x.keys.length === x.defaults.length && x.keys.every((c) => x.defaults.includes(c))) { Object.assign(a, declared.get(x.id)); continue; }
      const p = x.keys.length ? parseChord(x.keys[0], P) : null, fine = x.keys.length === 2 && normalize('Shift+' + x.keys[0], P) === x.keys[1];
      Object.assign(a, p ? { key: p.code, ctrl: p.mods.includes('Mod') ? true : p.mods.includes('Ctrl') ? 'Ctrl' : false, alt: p.mods.includes('Alt'),
        shift: fine ? undefined : p.mods.includes('Shift') } : { key: null });
    }
  }
  table.onChange(sync); sync();
  const check = (id, c) => (byId.get(id) && byId.get(id).stage ? 'Window cycling is only available on Tab from the stage.' : /(^|\+)Tab$/.test(c || '') ? 'Tab is reserved for focus navigation.' : table.check(id, c));
  const holders = (id, spec) => [...new Set(chordsOf({ ...byId.get(id), ...spec }).flatMap((c) => table.holders(c)))].filter((x) => x !== id);
  /* the fine step's Shift twin is a property of the row, not a second binding: the window shows the chord alone (as 0.4.0 drew it) */
  const shown = (keys) => keys.filter((c) => !(c.includes('Shift+') && keys.includes(normalize(c.replace('Shift+', ''), P))));
  return {
    table,
    /** the table as the KEYBOARD window reads it: the twins out of sight, λWAVES' stage rule in its check (its steal is the second
     *  press: explicit); a chord recorded there is the chord alone, as 0.4.0's recorder wrote it */
    window: { ...table, check, chords: (id) => shown(table.chords(id)), list: () => table.list().map((x) => ({ ...x, keys: shown(x.keys), defaults: shown(x.defaults) })) },
    /** bind(id, { key, ctrl, alt, shift }, { steal }) → { ok, conflicts: [ids], reason? } — λWAVES' road (keys.bind, the gates) */
    bind(id, spec = {}, { steal = false } = {}) {
      const a = byId.get(id); if (!a) return { ok: false, reason: 'Unknown action.' };
      const cs = chordsOf({ ...a, ...spec });
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
