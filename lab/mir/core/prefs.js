/* core/prefs.js — one store for the LOOK: what this browser's user chose, applied through the hooks the kit reads.
 *
 * THE LAW IT KEEPS: A LOOK OPTION IS A PREFERENCE.  It lives in this browser (one localStorage key), never in a project,
 * a link or the history (λWAVES' three-scope law; BASINS' prefs/project split).  Each option is a row of a SCHEMA that
 * says its type, its range, its default and HOW IT IS APPLIED — an attribute or a class on <html>/<body> that a kit
 * sheet already reads, a custom property, or a call — so nothing about the look is decided in two places.
 *
 * And four rules:
 *   1. NOTHING IS THROWN AT THE USER.  A stored value that is unknown, of the wrong type or out of range is repaired to
 *      the row's default; a key the schema does not know is dropped; a storage that throws (a private window) is a store
 *      that keeps nothing.
 *   2. APPLYING IS ONE WRITE.  `resolve(state)` turns the whole state into a list of writes (pure, node-tested); `apply()`
 *      performs them in one coalesced job of the one frame (core/frame.js), through core/perf.js so an identical write
 *      is skipped.  `apply({ now: true })` performs them at once, for the first paint before anything is drawn.
 *   3. A ROW THAT IS AT ITS HOME WRITES NOTHING.  A `map` that returns null removes the property or attribute, so the
 *      kit's own 1.4 value stands, and an app that never changes an option never sees a write from it.
 *   4. PRESETS ARE NAMED OPTION SETS.  `preset()` names the preset whose every option matches the state, or 'custom'.
 *
 * createPrefs({ key, schema, presets, storage, doc, context, version?, migrate?, projectKeys?, project? }) →
 *   { get, set, reset, forget, all, subscribe, apply, preset, applyPreset, resolve, migration, settings, download, load, destroy }
 *   THE SPLIT (Josh 2026-10-01, BASINS app/prefs.js): preferences are the device's, the work is the project's.  With
 *   `version`, a versioned migration runs once per version (migratePrefs): the `projectKeys` the blob still holds are handed
 *   to `project(moved)` (core/session.js adoptInto) and removed; `set` refuses a project key ever after.
 *   schema   [{ key, type: 'enum' | 'bool' | 'number', values?, min?, max?, step?, wrap?, default, apply: [spec…] }]
 *            spec = { on: 'html' | 'body', attr, map? }      an attribute; map(v, state, env) → string | null
 *                 | { on, cls, when? }                       a class, present while when(v, state, env) (default: !!v)
 *                 | { on, prop, map? }                      a custom (or any style) property; null removes it
 *                 | { run(v, state, env, context) }         a call, for an engine the kit already has (the accent,
 *                                                           the motion policy); it runs inside the same frame job
 *   presets  { id: { key: value, … } }
 *   storage  { getItem, setItem, removeItem } (default localStorage);  doc (default document);  context: passed to run()
 *   env      what a map is told: { theme: 'dark' | 'light' } — the resolved theme (SYSTEM asks the OS)
 * Pure exports for tests: repair(raw, schema), defaults(schema), resolve(state, schema, env), matchPreset(state, presets). */
import { frame } from './frame.js';
import { setVar, setAttr } from './perf.js';
import { wrap, stringify, check } from './envelope.js';
import { saveBlob } from '../folders/save-blob.js';   // the kit's one hand-a-file-over (a leaf: no imports)

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

/** jsonStore(key, from = globalThis) → { get(), set(v), remove() } — ONE JSON value under one key: the kit's one
 *  localStorage helper (the rack's layout, the transport's seat, the key table, the modulation / pattern / timeline
 *  records, FOLDERS' and HISTORY's window shapes).  `from` is a Storage, or a window whose localStorage is read at each
 *  call.  Every access is guarded: a private window, blocked storage, a missing, empty or damaged value reads null, and a
 *  refused write is lost, never thrown.  Each caller keeps its own shape on top (merge, replace, remove when empty). */
export function jsonStore(key, from = globalThis) {
  const S = () => (from && typeof from.getItem === 'function' ? from : from.localStorage);
  return {
    get() { try { const raw = S().getItem(key); return raw ? JSON.parse(raw) : null; } catch (_) { return null; } },
    set(v) { try { S().setItem(key, JSON.stringify(v)); } catch (_) { /* quota or private mode: lost, nothing breaks */ } },
    remove() { try { S().removeItem(key); } catch (_) { /* nothing */ } },
  };
}

/** valid(row, v) — does v belong to this row? */
export function valid(row, v) {
  if (row.type === 'bool') return typeof v === 'boolean';
  if (row.type === 'enum') return (row.values || []).includes(v);
  if (row.type === 'number') return typeof v === 'number' && Number.isFinite(v) && v >= row.min && v <= row.max;
  return false;
}
/** defaults(schema) — every row at its default */
export function defaults(schema) { const o = {}; for (const r of schema) o[r.key] = r.default; return o; }
/** repair(raw, schema) — a stored blob to a whole, valid state: bad or missing values take the default, unknown keys go */
export function repair(raw, schema) {
  const src = isObj(raw) ? raw : {}, o = {};
  for (const r of schema) o[r.key] = valid(r, src[r.key]) ? src[r.key] : r.default;
  return o;
}
/** coerce(row, v) — a value a control hands in: a number is rounded to the row's `step`, then clamped (or wrapped) into range; anything else must be valid */
export function coerce(row, v) {
  if (row.type === 'number' && typeof v === 'number' && Number.isFinite(v)) {
    if (row.step) v = Math.round(v / row.step) * row.step, v = +v.toFixed(6);       // a dial's drag lands on the row's grid
    if (row.wrap) { const span = row.max - row.min; return row.min + ((((v - row.min) % span) + span) % span); }
    return Math.min(row.max, Math.max(row.min, v));
  }
  return valid(row, v) ? v : undefined;
}

/** resolve(state, schema, env) → [{ kind: 'attr' | 'class' | 'prop' | 'run', on, name, value, row, spec }] — every
 *  write the state asks for, in schema order.  A null value means "remove". */
export function resolve(state, schema, env = {}) {
  const out = [];
  for (const r of schema) {
    const v = state[r.key];
    for (const s of r.apply || []) {
      if (s.run) out.push({ kind: 'run', row: r.key, spec: s, value: v });
      else if (s.attr) out.push({ kind: 'attr', on: s.on || 'body', name: s.attr, row: r.key, value: s.map ? s.map(v, state, env) : (v === null || v === undefined ? null : String(v)) });
      else if (s.cls) out.push({ kind: 'class', on: s.on || 'body', name: s.cls, row: r.key, value: !!(s.when ? s.when(v, state, env) : v) });
      else if (s.prop) out.push({ kind: 'prop', on: s.on || 'body', name: s.prop, row: r.key, value: s.map ? s.map(v, state, env) : (v === null || v === undefined ? null : String(v)) });
    }
  }
  return out;
}
/** matchPreset(state, presets) → the id of the first preset whose every option equals the state, or 'custom' */
export function matchPreset(state, presets = {}) {
  for (const [id, p] of Object.entries(presets)) if (Object.entries(p).every(([k, v]) => state[k] === v)) return id;
  return 'custom';
}

/** migratePrefs(storage, key, { version, migrate, projectKeys, project }) → { ok, migrated, moved? } — BASINS'
 *  migratePrefs, any version: when the stored blob's `prefsV` (absent = 1) is below `version`, the project keys it holds
 *  go to the project FIRST (`project(moved)` → false keeps them here and tries again next load; with no `project` they
 *  are dropped), then `migrate(blob, from, version)` may reshape the rest, and the blob is marked `prefsV: version`.
 *  It runs once per version.  A browser with no blob has nothing to move. */
export function migratePrefs(storage, key, { version, migrate, projectKeys = [], project } = {}) {
  let blob;
  try { const raw = storage && storage.getItem(key); if (!raw) return { ok: true, migrated: false }; blob = JSON.parse(raw); } catch (_) { return { ok: false }; }
  if (!isObj(blob)) return { ok: false };
  const from = Number.isFinite(blob.prefsV) ? blob.prefsV : 1;
  if (!version || from >= version) return { ok: true, migrated: false };
  const moved = {};
  for (const k of projectKeys) if (Object.hasOwn(blob, k)) moved[k] = blob[k];
  if (Object.keys(moved).length && typeof project === 'function') {
    let took = false; try { took = project(moved) !== false; } catch (_) {}
    if (!took) return { ok: false, moved };
  }
  for (const k of projectKeys) delete blob[k];
  if (typeof migrate === 'function') { try { const b = migrate(blob, from, version); if (isObj(b)) blob = b; } catch (_) { return { ok: false, moved }; } }
  blob.prefsV = version;
  try { storage.setItem(key, JSON.stringify(blob)); } catch (_) { return { ok: false, moved }; }
  return { ok: true, migrated: true, moved };
}

/** forgetPrefs(key, storage?) — FORGET: this browser's preferences for that key are wiped (BASINS: then reload) */
export function forgetPrefs(key = 'mir.gui', storage) {
  const S = storage !== undefined ? storage : (() => { try { return globalThis.localStorage || null; } catch (_) { return null; } })();
  try { if (S) S.removeItem(key); } catch (_) {}
}

/** settingsFileName(app, date?) — BASINS' DOWNLOAD SETTINGS name: '<app>-settings-YYYY-MM-DD.json' */
export const settingsFileName = (app = 'mir', date = new Date()) => String(app || 'mir').toLowerCase().replace(/[^a-z0-9._-]+/g, '-') + '-settings-' + date.toISOString().slice(0, 10) + '.json';

export function createPrefs({ key = 'mir.gui', schema = [], presets = {}, storage, doc, context, version, migrate, projectKeys = [], project } = {}) {
  const D = doc || globalThis.document || null;
  const S = storage !== undefined ? storage : (() => { try { return globalThis.localStorage || null; } catch (_) { return null; } })();
  const projectSide = new Set(projectKeys);
  const rows = new Map(schema.filter((r) => !projectSide.has(r.key)).map((r) => [r.key, r]));   // a project key is never written here
  const migration = version ? migratePrefs(S, key, { version, migrate, projectKeys, project }) : null;
  const read = () => { try { const t = S && S.getItem(key); return t ? JSON.parse(t) : null; } catch (_) { return null; } };
  const write = () => { try { if (S) S.setItem(key, JSON.stringify(version ? { ...state, prefsV: version } : state)); } catch (_) {} };
  let state = repair(read(), schema);
  const subs = new Set();

  /* SYSTEM asks the OS, and follows it while it is chosen */
  const MQ = D && D.defaultView && D.defaultView.matchMedia ? D.defaultView.matchMedia('(prefers-color-scheme: light)') : null;
  const env = () => ({ theme: state.theme === 'system' ? (MQ && MQ.matches ? 'light' : 'dark') : (state.theme === 'light' ? 'light' : 'dark') });
  const onScheme = () => { if (state.theme === 'system') apply(); };
  if (MQ && MQ.addEventListener) MQ.addEventListener('change', onScheme);

  function perform() {
    if (!D) return;
    const target = { html: D.documentElement, body: D.body };
    const e = env();
    for (const w of resolve(state, schema, e)) {
      if (w.kind === 'run') { w.spec.run(w.value, state, e, context); continue; }
      const t = target[w.on]; if (!t) continue;
      if (w.kind === 'attr') setAttr(t, w.name, w.value);
      else if (w.kind === 'prop') setVar(t, w.name, w.value);
      else if (w.kind === 'class') { if (t.classList.contains(w.name) !== w.value) t.classList.toggle(w.name, w.value); }
    }
  }
  /** apply({ now }) — the whole state onto the page: one coalesced frame job, or at once */
  function apply({ now = false } = {}) {
    if (now) { frame.cancel('mir.prefs'); perform(); return; }
    frame.coalesce('mir.prefs', perform);
  }
  const notify = (changed) => { for (const f of subs) { try { f(state, changed); } catch (_) {} } };

  /** set(key, value) or set({ key: value, … }) — values a control hands in are clamped into range; an unknown key or
   *  an invalid value is ignored.  → the keys that changed */
  function set(k, v) {
    const patch = isObj(k) ? k : { [k]: v }, changed = [];
    for (const [name, raw] of Object.entries(patch)) {
      const r = rows.get(name); if (!r) continue;
      const c = coerce(r, raw); if (c === undefined || c === state[name]) continue;
      state = { ...state, [name]: c }; changed.push(name);
    }
    if (changed.length) { write(); apply(); notify(changed); }
    return changed;
  }
  function reset() { const was = state; state = defaults(schema); try { if (S) S.removeItem(key); } catch (_) {} apply(); notify(Object.keys(state).filter((k) => was[k] !== state[k])); return { ...state }; }
  return {
    get: (k) => state[k],
    all: () => ({ ...state }),
    set,
    /** reset() — every option home; the stored key is removed */
    reset,
    /** subscribe(fn(state, changedKeys)) → unsubscribe */
    subscribe(fn) { subs.add(fn); return () => subs.delete(fn); },
    apply,
    /** preset() — the preset the options match now, or 'custom' */
    preset: () => matchPreset(state, presets),
    /** applyPreset(id) — set that preset's options (an unknown id changes nothing) */
    applyPreset: (id) => (presets[id] ? set(presets[id]) : []),
    presets,
    resolve: () => resolve(state, schema, env()),
    env,
    /** forget() — FORGET (BASINS' settings window): the stored key is wiped and every option goes home; the app reloads */
    forget: reset,
    /** migration — what the versioned migration did at creation ({ ok, migrated, moved? }), or null without `version` */
    migration,
    /** settings({ app, name }) → a 'settings' envelope (core/envelope.js) of this browser's options */
    settings: ({ app, name } = {}) => wrap('settings', { ...state }, { app, name }),
    /** download({ app }) — DOWNLOAD SETTINGS: this browser's options as a file, '<app>-settings-<date>.json' */
    download({ app = 'mir', name } = {}) {
      if (!D || !D.body || typeof Blob === 'undefined') return false;
      saveBlob(new Blob([stringify(wrap('settings', { ...state }, { app, name }))], { type: 'application/json' }), settingsFileName(app));
      return true;
    },
    /** load(text | envelope) → { ok, changed, errors, warnings } — a settings file read against this schema and set */
    load(input) {
      const r = check(input, { settings: schema.filter((row) => !projectSide.has(row.key)) });
      if (r.ok && r.envelope.kind !== 'settings') return { ok: false, changed: [], errors: [{ path: 'kind', why: 'not a settings file' }], warnings: r.warnings };
      return r.ok ? { ok: true, changed: set(r.envelope.data), errors: [], warnings: r.warnings } : { ok: false, changed: [], errors: r.errors, warnings: r.warnings };
    },
    destroy() { subs.clear(); frame.cancel('mir.prefs'); if (MQ && MQ.removeEventListener) MQ.removeEventListener('change', onScheme); },
  };
}
