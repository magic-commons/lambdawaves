/* settings-store.js — THE SETTINGS ADAPTER (0.5.0 A1): the one door to `lambdawaves.q0.settings`, this browser's settings blob
 * (docs/STATE-SCOPES.md).  rack.js reads and writes the blob only through createSettingsStore(): `read()` is the object ({} when
 * the key is absent or unreadable), `write(obj)` stores JSON.stringify(obj), the same bytes its seven writers built by hand
 * (saveSettings' whole object; six `{ ...S, x }` merges, each in its own order), and `remove()` is FORGET.  Storage is resolved
 * lazily inside the try, because touching localStorage can throw (a blocked or private profile); a refused write answers false.
 * THE SPLIT the kit will read: WORKSPACE is the arrangement inside this blob (MIR 1.5 `createRack({ store })` takes it at C3);
 * every other key of the blob is PREFERENCE.  0.5.0 C2: the LOOK left it for the kit's `mir.gui` (lab/look.js lifts an older blob's
 * look keys, and HELP's own `lw-window-info`, once).  A project open may move only WORKSPACE keys here (tools/settings-probe.mjs).
 * `nativeLayout` is PREFERENCE, as STATE-SCOPES and the byte-identical gates have it.
 * THE FAMILIES THAT STAY where they are: their own localStorage keys, never inside this blob, each with its owner and scope. */
export const SETTINGS_KEY = 'lambdawaves.q0.settings';
export const WORKSPACE = Object.freeze(['closed', 'layouts', 'nbW', 'nbH', 'abW', 'abH', 'modwin', 'phoneTr', 'phoneRack',
  'tlwin']);   // 0.5.0 C7b: the TIMELINE window's shape and work lane (the kit's createTimeline store)
export const FAMILIES = Object.freeze({
  'lambdawaves.q0.notebook': ['rack.js NB_KEY', 'PROJECT'], 'lambdawaves.q0.notebook.title': ['rack.js NB_TITLE', 'PROJECT'],
  'lambdawaves.q0.notebook.subtitle': ['rack.js NB_SUBTITLE', 'PROJECT'], 'lambdawaves.q0.projects': ['project-store.js PJ_KEY (FOLDERS\' store, in λWAVES\' form)', 'PROJECT'],
  'lambdawaves.q0.experiment': ['rack.js LS_EXP', 'PROJECT'], 'lambdawaves.q0.presentation': ['rack.js LS_PRES', 'PROJECT'],
  'lambdawaves.q0.keys': ['key-table.js (MIR createKeys)', 'PREFERENCE'], 'lw.keyboard.position.v1': ['the kit keyboard window (mir/keyboard)', 'PREFERENCE'], 'lw.lean.v1': ['window-chrome.js', 'PREFERENCE'],
  'lambdawaves.q0.library': ['library.js', 'LIBRARY'], 'lambdawaves.q0.modpresets': ['mir/modulation/mod.js PRESET_LS', 'PREFERENCE'],
  'lambdawaves.q0.modulation': ['rack.js modStore (mir/modulation/bind.js localStore): modArm, modCadence', 'PREFERENCE'],   // 0.5.0 C4
  'mir.gui': ['look.js createLook (mir/core/prefs.js createPrefs over LOOK_SCHEMA rows; MIR OPTIONS writes it, mir-gui.js)', 'PREFERENCE'],   // 0.5.0 C2 · iteration 003
  'mir.gui.tab': ['the kit\'s MIR OPTIONS: the tab this device last showed (no longer written since MIR OPTIONS lost its tabs, 018 F1; an older browser may still hold it)', 'PREFERENCE'],   // iteration 003
  'mir.pointer': ['the kit\'s input layer (mir/core/kbm.js): MIR OPTIONS › MOTION › POINTER, written only when picked', 'PREFERENCE'],   // iteration 003
  'mir.tier': ['the kit\'s MIR OPTIONS (mir/shell/gui.js TIER_KEY): QUALITY · AUTO\'s device reading', 'PREFERENCE'],   // iteration 003
  'lambdawaves.q0.projects.window': ['projects.js FOLDERS (mir/folders/folders.js localPrefs): place, size, open, rail side, sort', 'WORKSPACE'],   // 0.5.0 C6
  'lambdawaves.q0.projects.seeded': ['projects.js FOLDERS (mir/folders/seed.js): the starters added once', 'PROJECT'],   // 0.5.0 C6
  'lambdawaves.q0.session': ['main.js createSession (mir/core/session.js): the live project, the one part as it stands', 'PROJECT'],   // 0.5.0 C6b
  'lambdawaves.q0.render': ['film-card.js (MIR createRenderView, its prefix): the RENDER card\'s choices and the picture scale', 'PREFERENCE'],   // 0.5.0 C7b
  'lambdawaves.q0.curves': ['rack.js curvesStore (mir/panels/curves.js model.serialize): the CURVES card\'s screen grade, the points per channel and AMOUNT', 'PREFERENCE'],   // 0.5.1 D10-24
  'lambdawaves.q0.info': ['shell/stage-words.js infoPrefs (mir/core/prefs.js createPrefs over INFO_ROWS; INFORMATIONAL writes it): the STAGE FORMULA, NAME, ATOM LABELS, their SIZEs, POSITION · PAD, one switch per announcement kind, the pop-ups\' SIZE, the CURSOR rows', 'PREFERENCE'],   // iteration 007 I (ADR-0003): the blob\'s six keys lifted once
  'lambdawaves.q0.picker': ['picker.js PREF_KEY: the Picker\'s SHOW LABELS (atoms, molecules) and THE HUE ring (hue, degrees)', 'PREFERENCE'],   // iteration 012 L1 · L2
  'lambdawaves.q0.csb': ['csb-favs.js CSB_KEY: the CONTROL SURFACE\'s favourite controls (ids, in order)', 'PREFERENCE'],   // iteration 014 A3
  'lambdawaves.q0.palettes': ['user-presets.js createUserPresets (PALETTE\'s save glyph, windows/material.js): the reader\'s own palettes, { name, data: { stops } } rows in order', 'PREFERENCE'],   // iteration 015 P3
  'lambdawaves.q0.curvePresets': ['user-presets.js createUserPresets (CURVES\' save glyph): the reader\'s own curves, { name, data: { points } } rows in order', 'PREFERENCE'],   // 018 D2
  'lambdawaves.q0.nodes': ['nodes.js createNodes (NODES, the window and the rack card): the node places, each view\'s pan, the window\'s shape, CURVES in or out', 'PREFERENCE'],   // 018 D3
  'lambdawaves.q0.presets': ['user-presets.js createUserPresets (SPECTRUM\'s save glyph, lab/spectrum.js USER_PRESETS_KEY): the reader\'s own PRESETs, { name, data: { labels } } rows in order', 'PREFERENCE'],   // iteration 015 S4
  'mir.transport': ['the kit\'s transport (mir/shell/transport.js localSeatStore): the bar\'s seat, place (STAGE | FREE) and orientation', 'PREFERENCE'],   // iteration 014 A4
  'mir.transport.free': ['the kit\'s transport FREE window (mir/window/window.js persist): its rect', 'PREFERENCE'],   // iteration 014 A4
  'mir.render.calib':['the kit recorder (mir/render/recorder.js CALIB_KEY): this device\'s measured ms a frame', 'PREFERENCE'],   // 0.5.0 C7b
});
export function createSettingsStore(storage) {
  const ls = () => storage || globalThis.localStorage;
  return { key: SETTINGS_KEY,
    read() { try { return JSON.parse(ls().getItem(SETTINGS_KEY) || '{}'); } catch (e) { return {}; } },
    write(obj) { try { ls().setItem(SETTINGS_KEY, JSON.stringify(obj)); return true; } catch (e) { return false; } },
    remove() { try { ls().removeItem(SETTINGS_KEY); return true; } catch (e) { return false; } } };
}
