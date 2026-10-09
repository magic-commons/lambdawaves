/* look.js — THE LOOK IS THE KIT'S (0.5.0 C2, R5-S1; this seam was accent-wheel.js, N7 seam 4).  MIR OPTIONS stays hidden and
 * SETTINGS stays the surface, but the look's STORE and its APPLICATION are the kit's: one localStorage key, `mir.gui`
 * (core/prefs.js createPrefs), whose rows are the kit's own LOOK_SCHEMA rows (shell/gui.js lookSchema) taken by key, so every
 * hook is the kit's spec and no other row is ever written.  λWAVES' home look is the `defaults` (createGui's word), the
 * device's first-run material (first-run.js: the phone law) among them.  createGui itself is not built (C2-DESIGN §1).
 * THE ACCENTS are the kit's engine (shell/accent.js createAccent, the port of what this file was); λWAVES feeds it what it
 * holds apart — the HUE knob and the palette switch (applyAccent), the palette's stops, the live stage ground, the gamut,
 * the modulation window — and keeps its own the stage text's ink and M7's one paint per batch.
 * THE LIFT (once, forward only): an older settings blob's look keys (and HELP's own key) are set into `mir.gui` by the laws
 * rack.js read them by, and leave the blob.  A fresh profile never runs it.  Node-testable: liftLook (tests/first-run.test.mjs). */
import { createPrefs } from './mir/core/prefs.js';
import { lookSchema } from './mir/shell/gui.js';
import { createAccent } from './mir/shell/accent.js';
import { rgbToHex } from './mir/palette.js';
export { CARD_GROUND } from './mir/shell/accent.js';   // the card the notebook's λ is corrected against (__LW.ink.ground)

export const LOOK_KEY = 'mir.gui';
/** the LOOK_SCHEMA rows SETTINGS reaches: the store holds these and nothing else */
export const LOOK_ROWS = Object.freeze(['theme', 'accentA', 'accentB', 'vivid', 'card', 'frost', 'blur', 'disconnected', 'hints', 'help', 'badges']);
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
  const stageGround = () => mat.bg;                                  // the header λ and the stage text sit on the CANVAS: the live STAGE colour
  const accent = createAccent({ model: 'palette', vivid: defaults.vivid, wheelStops, stageGround, gamut: (rgb) => gamutCss(rgb),
    onAccent: (A, B) => { const v = getModView(); if (v) v.setAccent(A, B); } });
  const ctx = { doc: document, accent, moving: false, lastAccent: null };
  const schema = lookSchema().filter((r) => LOOK_ROWS.includes(r.key)).map((r) => ({ ...r, ...(r.key in defaults ? { default: defaults[r.key] } : {}),
    ...(r.key === 'blur' ? { max: 30 } : r.key.startsWith('accent') ? { wrap: false } : {}),   // GLASS BLUR's travel (the kit's row stops at 24): no stored value moves; an ACCENT keeps END's 360° (wave 68: it renders as 0°, a fold left the eye at 0° and HOME dead)
    ...(r.key === 'theme' ? { apply: [...r.apply, { run: (v, s, e) => { if (seen !== v + e.theme) { seen = v + e.theme; onTheme(e.theme, v); } } }] } : {}) }));
  const prefs = createPrefs({ key: LOOK_KEY, schema, context: ctx });
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

  /* THE STAGE TEXT (stage-text.js) is on the CANVAS too: plain ink, light or dark by the live STAGE, haloed in it */
  function paintInk() {
    const mf = document.getElementById('molFormula'); if (!mf) return;
    const g = stageGround(), L = 0.2126 * g[0] + 0.7152 * g[1] + 0.0722 * g[2];
    mf.style.color = gamutCss(L > 0.35 ? [0.07, 0.08, 0.1] : [0.95, 0.96, 0.98]); mf.style.setProperty('--mf-halo', gamutCss(g));
  }
  /** the accents again, with what the engine holds apart brought up to date (and `extra`: the palette's new stops) */
  function applyAccent(extra) { accent.set({ hueShift: mat.hueShift || 0, paletteOn: !!mat.paletteOn, ...extra }); paintInk(); }
  /* M7 · ONE PAINT PER BATCH (the boot's build, restore()): inside one, a paint only marks the marks dirty; the end paints once */
  let batch = 0, dirty = false;
  function paintMarks() {
    if (batch) { dirty = true; return; }
    if (accent.hueShift !== (mat.hueShift || 0) || accent.paletteOn !== !!mat.paletteOn) return applyAccent();   // the wheel moved under the mark
    accent.paintMarks(); paintInk();
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
