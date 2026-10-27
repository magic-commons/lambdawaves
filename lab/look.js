/* look.js — THE LOOK IS THE KIT'S (0.5.0 C2, R5-S1; this seam was accent-wheel.js, N7 seam 4).  The look's STORE and its
 * APPLICATION are the kit's: one localStorage key, `mir.gui` (core/prefs.js createPrefs), whose rows are the kit's own
 * LOOK_SCHEMA rows (shell/gui.js lookSchema), so every hook is the kit's spec.  Iteration 003 (Josh: "Port and adopt the entire
 * MIR 1.5 MIR Options loadout"): the store holds EVERY row now and is the `prefs` of the kit's MIR OPTIONS window (lab/mir-gui.js,
 * createGui, as BASINS app/skin.js builds it).  λWAVES' home look is the `defaults` (createGui's word), the device's first-run
 * material (first-run.js: the phone law) among them, over LOOK_HOME: each row the store gained is homed where it WRITES
 * NOTHING (prefs.js rule 3), and four rows whose kit map writes even at home (TEXT · AUTO, SATURATION at blur 0, the CAST under
 * DROP SHADOW, SPACING · DEFAULT) write nothing at λWAVES' home either (HOME_MAPS) — so no first-run or stored look moves.
 * THE ACCENTS are the kit's engine (shell/accent.js createAccent, the port of what this file was); λWAVES feeds it what it
 * holds apart — the HUE knob and the palette switch (applyAccent), the palette's stops, the live stage ground, the gamut,
 * the modulation window — and keeps its own the stage text's ink and M7's one paint per batch.
 * THE LIFT (once, forward only): an older settings blob's look keys (and HELP's own key) are set into `mir.gui` by the laws
 * rack.js read them by, and leave the blob.  A fresh profile never runs it.  Node-testable: liftLook (tests/first-run.test.mjs). */
import { createPrefs, defaults as homeOf } from './mir/core/prefs.js';
import { lookSchema } from './mir/shell/gui.js';
import { THEMES, THEME_KEYS, COLOUR_KEYS } from './mir/shell/themes.js';
import { lightIsHome } from './mir/core/look.js';
import { createAccent } from './mir/shell/accent.js';
import { rgbToHex } from './mir/palette.js';
export { CARD_GROUND } from './mir/shell/accent.js';   // the card the notebook's λ is corrected against (__LW.ink.ground)

export const LOOK_KEY = 'mir.gui';
/** the LOOK_SCHEMA rows the store holds: every one (MIR OPTIONS reaches them all; iteration 003) */
export const LOOK_ROWS = Object.freeze(lookSchema().map((r) => r.key));
/** λWAVES' home for the rows SETTINGS never had: the value at which each writes nothing, so the page looks as it did before
 *  MIR OPTIONS (FULL tier, no benchmark; the kit's own faces, shadows, corners, veil and ink; no pointer glow or parallax) */
export const LOOK_HOME = Object.freeze({ veil: 10, saturation: 1, corners: 14, faces: 'solid', text: 'theme', edge: true, shadow: 1,
  glow: false, parallax: false, quality: 'full' });
/** the kit maps that write at λWAVES' home, homed: AUTO ink is the theme's own ladder (a SOLID pane keeps the kit's), SATURATION
 *  at 100 % is no filter at any blur, the CAST is drawn only off LIGHT_HOME (the kit sheet's own words), DEFAULT spacing is the
 *  sheets' own air */
const HOME_MAPS = {
  text: (sp) => (v, s, e) => (v === 'theme' && s.card !== 'solid' ? null : sp.map(v, s, e)),
  saturation: (sp) => (v, s, e) => (v === 1 ? null : sp.map(v, s, e)),
  dropShadow: (sp) => (sp.attr === 'data-cast' ? (v, s, e) => (lightIsHome(s) ? null : sp.map(v, s, e)) : sp.map),
  spacing: (sp) => (v, s, e) => (v === 'default' ? null : sp.map(v, s, e)),
};
/** what the look left the settings blob with; HELP had its own key */
export const BLOB_LOOK = Object.freeze(['theme', 'card', 'cardSet', 'frost', 'disc', 'blur', 'accent', 'badges', 'controlHints', 'hint']);
export const HELP_KEY = 'lw-window-info';

/** liftLook(blob, help) → the `mir.gui` patch an older blob (and HELP's 'on' | 'off') becomes, by the laws rack.js read them by:
 *  an unknown theme was DARK; a card counts only when this browser SAID it (cardSet, wave 51); a legacy frost `true` is ALWAYS
 *  (wave 67) and an unknown one OFF; an absent or false key is not lifted, so the device's first-run default stands. */
export function liftLook(s = {}, help = null) {
  const p = {}, a = Array.isArray(s.accent) ? s.accent : null;
  if (s.theme) p.theme = ['light', 'dark', 'system'].includes(s.theme) ? s.theme : 'dark';
  if (s.cardSet === true && (s.card === 'tinted' || s.card === 'refractive')) p.card = s.card;
  if (s.frost) p.frost = s.frost === true ? 'always' : s.frost === 'still' || s.frost === 'always' ? s.frost : 'off';
  if (typeof s.disc === 'boolean') p.disconnected = s.disc;
  if (Number.isFinite(s.blur)) p.blur = s.blur;
  if (a) Object.assign(p, { accentA: +a[0] || 0, accentB: +a[1] || 0, vivid: +a[2] || 0 });
  if ('badges' in s) p.badges = s.badges === true;
  if ('controlHints' in s || 'hint' in s) p.hints = s.controlHints === undefined ? s.hint !== false : s.controlHints !== false;
  if (help === 'on' || help === 'off') p.help = help === 'on';
  return p;
}

/** createLook({ settings, defaults, mat, wheelStops, getModView, onTheme }) — the store applied at once (the first
 *  paint wears it), after the lift.  onTheme(theme, choice) runs once per resolved change (SYSTEM following the OS included). */
export function createLook({ settings, defaults, mat, wheelStops, getModView, onTheme }) {
  let gamutCss = (rgb) => rgbToHex(rgb), seen = '';
  const stageGround = () => mat.bg;                                  // the header λ sits on the CANVAS: the live STAGE colour
  const accent = createAccent({ model: 'palette', vivid: defaults.vivid, wheelStops, stageGround, gamut: (rgb) => gamutCss(rgb),
    onAccent: (A, B) => { const v = getModView(); if (v) v.setAccent(A, B); } });
  const ctx = { doc: document, accent, moving: false, lastAccent: null };
  const home = { ...LOOK_HOME, ...defaults };
  const schema = lookSchema().map((r) => ({ ...r, ...(r.key in home ? { default: home[r.key] } : {}),
    ...(HOME_MAPS[r.key] ? { apply: r.apply.map((sp) => (sp.map ? { ...sp, map: HOME_MAPS[r.key](sp) } : sp)) } : {}),
    ...(r.key === 'blur' ? { max: 30 } : r.key.startsWith('accent') ? { wrap: false } : {}),   // GLASS BLUR's travel (the kit's row stops at 24): no stored value moves; an ACCENT keeps END's 360° (wave 68: it renders as 0°, a fold left the eye at 0° and HOME dead)
    ...(r.key === 'theme' ? { apply: [...r.apply, { run: (v, s, e) => { if (seen !== v + e.theme) { seen = v + e.theme; onTheme(e.theme, v); } } }] } : {}) }));
  /* 018 F2 · THE λWAVES SKIN: the first-run look itself (every row's home above, the device's material included), first in MIR OPTIONS' SKIN
     stepper, so a first run reads λWAVES and RESET LOOK returns to it; the kit's THEMES follow.  A skin states the kit's THEME_KEYS and its
     one tone the COLOUR_KEYS; LIGHT · DARK · SYSTEM, the hints and HELP stay the reader's own (shell/themes.js). */
  const first = homeOf(schema), pick = (keys) => Object.fromEntries(keys.map((k) => [k, first[k]]));
  const LAMBDAWAVES = { id: 'lambdawaves', name: 'λWAVES', values: pick(THEME_KEYS), tones: [{ id: 'lambdawaves', name: 'λWAVES', values: pick(COLOUR_KEYS) }] };
  const prefs = createPrefs({ key: LOOK_KEY, schema, presets: [LAMBDAWAVES, ...THEMES], context: ctx });
  const blob = settings.read(), held = BLOB_LOOK.filter((k) => k in blob);
  let help = null; try { help = localStorage.getItem(HELP_KEY); localStorage.removeItem(HELP_KEY); } catch (_) {}
  if (held.length || help) prefs.set(liftLook(blob, help));
  if (held.length) { for (const k of held) delete blob[k]; settings.write(blob); }
  prefs.apply({ now: true });
  /* the help rows' own moment (control-help.js): a hints change closes an open hint; HELP off closes an open ⓘ panel */
  prefs.subscribe((s, keys) => {
    if (keys.includes('hints')) document.dispatchEvent(new Event('controlhintschange'));
    if (keys.includes('help') && !s.help) { for (const p of document.querySelectorAll('.native-info-content:popover-open')) p.hidePopover();
      for (const b of document.querySelectorAll('.native-info-button')) b.setAttribute('aria-expanded', 'false'); }
  });

  /** the accents again, with what the engine holds apart brought up to date (and `extra`: the palette's new stops) */
  function applyAccent(extra) { accent.set({ hueShift: mat.hueShift || 0, paletteOn: !!mat.paletteOn, ...extra }); }
  /* M7 · ONE PAINT PER BATCH (the boot's build, restore()): inside one, a paint only marks the marks dirty; the end paints once */
  let batch = 0, dirty = false;
  function paintMarks() {
    if (batch) { dirty = true; return; }
    if (accent.hueShift !== (mat.hueShift || 0) || accent.paletteOn !== !!mat.paletteOn) return applyAccent();   // the wheel moved under the mark
    accent.paintMarks();
  }
  let inkCv = null;
  return { prefs, accent, ctx, get: prefs.get, applyAccent, paintMarks, stageGround,
    /** set(patch) — the store, then the page at once (a flip is on the page in the same task, as setTheme's always was) */
    set(patch) { prefs.set(patch); prefs.apply({ now: true }); },
    /** every row again, now that the engine's hooks exist (the boot's applySettings) */
    rerun() { seen = ''; ctx.lastAccent = null; prefs.apply({ now: true }); },
    /** FROST · STILL holds the frost while the picture moves: the kit's run writes frost-hold on the edge */
    moving(b) { if (ctx.moving !== b) { ctx.moving = b; prefs.apply({ now: true }); } },
    setGamut(fn) { gamutCss = fn; },
    markBatchBegin() { batch++; },
    markBatchEnd() { if (batch > 0 && --batch === 0 && dirty) { dirty = false; paintMarks(); } },
    /** one scratch context: the CSS colour parser the views use, reachable by a gate (__LW.ink) */
    inkCtx: () => (inkCv || (inkCv = document.createElement('canvas'))).getContext('2d'),
    /** the nine × 37 colours the mark's turn animates through (__LW.mark.stops) */
    turnStops: () => Array.from({ length: 9 }, (_, i) => Array.from({ length: 37 }, (_, k) => rgbToHex(accent.wheelColor(i * 40 + k * 10)))) };
}
