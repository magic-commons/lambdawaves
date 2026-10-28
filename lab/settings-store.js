/* settings-store.js — THE SETTINGS ADAPTER (0.5.0 A1): the one door to `lambdawaves.q0.settings`, this browser's settings blob
 * (docs/STATE-SCOPES.md).  rack.js reads and writes the blob only through createSettingsStore(): `read()` is the object ({} when
 * the key is absent or unreadable), `write(obj)` stores JSON.stringify(obj), the same bytes its seven writers built by hand
 * (saveSettings' whole object; six `{ ...S, x }` merges, each in its own order), and `remove()` is FORGET.  Storage is resolved
 * lazily inside the try, because touching localStorage can throw (a blocked or private profile); a refused write answers false.
 * THE SPLIT the kit will read: WORKSPACE is the arrangement inside this blob (MIR 1.5 `createRack({ store })` takes it at C3);
 * every other key of the blob is PREFERENCE.  0.5.0 C2: the LOOK left it for the kit's `mir.gui` (lab/look.js lifts an older blob's
 * look keys, and HELP's own `lw-window-info`, once).  A project open may move only WORKSPACE keys here (tools/settings-probe.mjs).
 * `nativeLayout` is PREFERENCE, as STATE-SCOPES and the byte-identical gates have it.
 * 021 R4 · ONE STORE: RECORDS is the registry of every key λWAVES keeps on this device — `{ key, scope, version, forget, owner }`, a `prefix`
 * row for a family of keys, the kit's own rows marked `owner: 'kit · …'`.  docs/STATE-SCOPES.md's "The records" table is GENERATED from it
 * (`node tools/state-scopes.mjs`; `--check` runs in ./test.sh node).  FORGET (mir-gui.js) wipes every row whose `forget` is true, after the
 * owners' pending writes are cancelled (`onForget`).  FAMILIES is the same rows by key. */
export const SETTINGS_KEY = 'lambdawaves.q0.settings';
export const WORKSPACE = Object.freeze(['closed', 'layouts', 'nbW', 'nbH', 'abW', 'abH', 'modwin', 'phoneTr', 'phoneRack',
  'tlwin']);   // 0.5.0 C7b: the TIMELINE window's shape and work lane (the kit's createTimeline store)
/** the blob's keys an older build wrote and nothing reads: saveSettings drops them ({ ...S0, ...owned } minus these; the carry list is gone).
 *  The look's (lab/look.js BLOB_LOOK) and INFORMATIONAL's (BLOB_INFO) are lifted out by their owners first; the rest are read by nothing. */
export const RETIRED = Object.freeze(['palette', 'camMode', 'clockLink', 'spin', 'speed', 'modArm', 'modCadence', 'look', 'cam',
  'theme', 'card', 'cardSet', 'frost', 'disc', 'blur', 'accent', 'badges', 'controlHints', 'hint',
  'molFormula', 'molFormulaSize', 'atomLabels', 'atomLabelsSize', 'infoPos', 'infoPad', 'skeleton', 'skeletonSize', 'bead', 'ellipsoid']);
const P = 'PREFERENCE', W = 'WORKSPACE', J = 'PROJECT', L = 'LIBRARY';
const row = (key, scope, version, forget, owner, o = {}) => Object.freeze({ key, scope, version, forget, owner, ...o });
export const RECORDS = Object.freeze([
  row(SETTINGS_KEY, P + ' + ' + W, 'gen 16', true, 'shell/settings.js saveSettings ({ ...S0, ...owned } − RETIRED); the WORKSPACE keys above'),
  row('mir.gui', P, 'kit prefs', true, 'look.js createLook (kit createPrefs over LOOK_SCHEMA; MIR OPTIONS writes it)'),
  row('lambdawaves.q0.info', P, 'kit prefs', true, 'shell/stage-words.js infoPrefs (INFORMATIONAL)'),
  row('lambdawaves.q0.modulation', P, '—', true, 'shell/controller.js modStore (kit localStore): modArm, modCadence'),
  row('lambdawaves.q0.curves', P, 'model', true, 'nodes.js curvesStore: the CURVES grade (250 ms)'),
  row('lambdawaves.q0.nodes', P, 'v 1', true, 'nodes.js: the graph { seq, list, at, pan, zoom, win, off } (250 ms)'),
  row('lambdawaves.q0.nodePresets', P, 'v 1', false, 'user-presets.js: NODES’ SAVE THIS GRAPH'),
  row('lambdawaves.q0.curvePresets', P, 'v 1', false, 'user-presets.js: CURVES’ save glyph'),
  row('lambdawaves.q0.palettes', P, 'v 1', false, 'user-presets.js: PALETTE’s save glyph'),
  row('lambdawaves.q0.presets', P, 'v 1', false, 'user-presets.js: SPECTRUM’s save glyph'),
  row('lambdawaves.q0.csb', P, 'v 1', true, 'csb-favs.js: the CONTROL SURFACE’s favourites'),
  row('lambdawaves.q0.picker', P, 'v 1', true, 'picker.js: SHOW LABELS, THE HUE, the decks’ looks'),
  row('lambdawaves.q0.keys', P, 'v 1', true, 'key-table.js: the rebound chords (the kit’s difference)'),
  row('lambdawaves.q0.midi', P, 'v 1', true, 'mapping.js (kit shell/midi.js): the learned notes and CCs { v, map }'),
  row('lambdawaves.q0.render.', P, '—', true, 'film-card.js: the RENDER card’s choices', { prefix: true }),
  row('lw.lean.v1', P, 'v 1 (name)', true, 'window-chrome.js: LEAN (window notes)'),
  row('lambdawaves.q0.modpresets', P, 'modV', false, 'kit mod.js PRESET_LS; a project SAVE also writes its rack here'),
  row('lambdawaves.q0.session', J, 'v 1', false, 'main.js createSession: the live project (the one part, notebook included)'),
  row('lambdawaves.q0.session.failed', J, 'v 1', false, 'kit 1.5.6: a resume that did not take, kept beside the session'),
  row('lambdawaves.q0.experiment', J, '—', false, 'shell/persist.js quick SAVE (with .presentation)'),
  row('lambdawaves.q0.presentation', J, '—', false, 'shell/persist.js quick SAVE (with .experiment)'),
  row('lambdawaves.q0.projects', J, 'project-store', false, 'project-store.js: FOLDERS’ library in λWAVES’ form'),
  row('lambdawaves.q0.projects.seeded', J, '—', false, 'projects.js: the starters added once'),
  row('lambdawaves.q0.projects.window', W, 'kit', false, 'projects.js FOLDERS (kit localPrefs): place, size, rail, sort'),
  row('lambdawaves.q0.notebook', J, 'RETIRED', false, 'read once into the session part (021 R4; with .title, .subtitle)'),
  row('lambdawaves.q0.library', L, '—', false, 'library.js: persist() asked'),
  row('mir.transport', P, 'v 2', false, 'kit · transport seat store (bar seat and place)'),
  row('mir.transport.free', W, 'kit', false, 'kit · the transport’s FREE window rect'),
  row('mir.tier', P, 'kit', false, 'kit · MIR OPTIONS QUALITY · AUTO reading'),
  row('mir.pointer', P, 'kit', false, 'kit · MIR OPTIONS › MOTION › POINTER'),
  row('mir.render.calib', P, 'kit', false, 'kit · recorder: this device’s ms a frame'),
  row('lw.keyboard.position.v1', W, 'v 1 (name)', false, 'kit · the KEYBOARD window’s place'),
]);
export const FAMILIES = Object.freeze(Object.fromEntries(RECORDS.map((r) => [r.key, r])));
/** the retired notebook keys (021 R4): read once at boot into the session part, then removed */
export const NOTEBOOK_KEYS = Object.freeze(['lambdawaves.q0.notebook', 'lambdawaves.q0.notebook.title', 'lambdawaves.q0.notebook.subtitle']);
const cancels = new Set();
/** onForget(fn) — an owner's pending (debounced) write, cancelled before FORGET wipes its record (nodes.js' 250 ms) */
export function onForget(fn) { cancels.add(fn); return () => cancels.delete(fn); }
/** forgetRecords(storage?) — FORGET: the owners' pending writes cancelled, then every `forget` row removed (a prefix row: each key under it) */
export function forgetRecords(storage) {
  for (const fn of cancels) { try { fn(); } catch (_) {} }
  let ls = null; try { ls = storage || globalThis.localStorage; } catch (_) { return 0; }
  let n = 0;
  try {
    const all = Array.from({ length: ls.length }, (_, i) => ls.key(i));
    for (const r of RECORDS) if (r.forget === true) for (const k of r.prefix ? all.filter((x) => x && x.startsWith(r.key)) : [r.key]) { if (ls.getItem(k) !== null) n++; ls.removeItem(k); }
  } catch (_) {}
  return n;
}
export function createSettingsStore(storage) {
  const ls = () => storage || globalThis.localStorage;
  return { key: SETTINGS_KEY,
    read() { try { return JSON.parse(ls().getItem(SETTINGS_KEY) || '{}'); } catch (e) { return {}; } },
    write(obj) { try { ls().setItem(SETTINGS_KEY, JSON.stringify(obj)); return true; } catch (e) { return false; } },
    remove() { try { ls().removeItem(SETTINGS_KEY); return true; } catch (e) { return false; } } };
}
