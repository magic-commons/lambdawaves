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
export const WORKSPACE = Object.freeze(['closed', 'layouts', 'nbW', 'nbH', 'abW', 'abH', 'modwin', 'phoneTr', 'phoneRack']);
export const FAMILIES = Object.freeze({
  'lambdawaves.q0.notebook': ['rack.js NB_KEY', 'PROJECT'], 'lambdawaves.q0.notebook.title': ['rack.js NB_TITLE', 'PROJECT'],
  'lambdawaves.q0.notebook.subtitle': ['rack.js NB_SUBTITLE', 'PROJECT'], 'lambdawaves.q0.projects': ['rack.js PJ_KEY', 'PROJECT'],
  'lambdawaves.q0.experiment': ['rack.js LS_EXP', 'PROJECT'], 'lambdawaves.q0.presentation': ['rack.js LS_PRES', 'PROJECT'],
  'lambdawaves.q0.keys': ['keys.js', 'PREFERENCE'], 'lw.keyboard.position.v1': ['keymap.js', 'PREFERENCE'], 'lw.lean.v1': ['window-chrome.js', 'PREFERENCE'],
  'lambdawaves.q0.library': ['library.js', 'LIBRARY'], 'lambdawaves.q0.modpresets': ['mir/modulation/mod.js PRESET_LS', 'PREFERENCE'],
  'lambdawaves.q0.modulation': ['rack.js modStore (mir/modulation/bind.js localStore): modArm, modCadence', 'PREFERENCE'],   // 0.5.0 C4
  'mir.gui': ['look.js createLook (mir/core/prefs.js createPrefs over LOOK_SCHEMA rows)', 'PREFERENCE'],                     // 0.5.0 C2
});
export function createSettingsStore(storage) {
  const ls = () => storage || globalThis.localStorage;
  return { key: SETTINGS_KEY,
    read() { try { return JSON.parse(ls().getItem(SETTINGS_KEY) || '{}'); } catch (e) { return {}; } },
    write(obj) { try { ls().setItem(SETTINGS_KEY, JSON.stringify(obj)); return true; } catch (e) { return false; } },
    remove() { try { ls().removeItem(SETTINGS_KEY); return true; } catch (e) { return false; } } };
}
