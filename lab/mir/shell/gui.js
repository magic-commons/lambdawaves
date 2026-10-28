/* MIR · shell/gui.js — the GUI windows: MIR OPTIONS (every group on one packed grid, no tabs) and MIR ABOUT (its own window,
 * opened by the circled (i) in MIR OPTIONS' head).
 *
 * WHAT IT IS.  The menubar's GUI entry opens a floating kit window (mir/window/window.js).  MIR OPTIONS holds every LOOK
 * option an app on the kit has, on one page; MIR ABOUT says what MIR is.  The look is a browser preference
 * (core/prefs.js, one key, never in a project), so an app's own Settings keeps only its engine's options (ruling 7 of
 * the 1.5 plan).  A VANILLA THEME (shell/themes.js) is a named set of these options and nothing else: the SKIN stepper
 * steps through them and TONE, under it, through the theme's colours.
 *
 * THE LAWS IT KEEPS
 *   · EVERY CONTROL IS A KIT CONTROL wearing the current look (knob, seg, sw, trig, readout from mir/kit.js), so the
 *     window is its own demonstration, the `‹ NAME ›` stepper (mir/controls/stepper.js, once built here) included.
 *   · NO DEAD CONTROLS.  Each option drives a hook a kit sheet or kit module already reads (the table is LOOK_SCHEMA
 *     below and docs/GUI.md).  A control that is inert in the current combination says so (it is disabled).
 *   · HARVESTED FROM BASINS.  Where BASINS' Settings has the control (CONTROL FACES and BLEND, TEXT, SHADOW as an
 *     amount, BRIGHT · HUE · TINT, the ABOUT material) the kind, range, help text and formula are BASINS'
 *     (app/settings-window.js, app/skin.js; the formulas in core/look.js).
 *   · THE HEAD NEVER MOVES (1.5.0 wave 19, the hand law).  Both windows have a title bar and a plain × (chrome: 'close');
 *     the window is sized to its grid (a small screen scrolls the body), and a re-fit keeps its top-left.  A value never
 *     inserts a row above another (HELP's prose keeps its seat, invisible, when HELP is off).
 *   · THE COST IS SHOWN.  QUALITY carries a reading of what the look costs (the panes that blur, the shadows and shine
 *     layers drawn, the frame time over 30 frames), taken only while the window is open on OPTIONS and only after a
 *     change; and each theme shows the reading taken when it was applied, beside its name.
 *   · The pointer glow and the parallax (mir/fx/) are installed here, because their two switches live here; and so is
 *     the live input layer (core/kbm.js), whose override is MOTION › POINTER · AUTO / TOUCH / PRECISION (a device
 *     setting kept by core/kbm.js under its own key, never in the look store or a project).
 *
 * createGui({ host, prefs, app: { name, version }, about, accent, defaults, storageKey, inkSampler, tierBench, sampling,
 *             projectAccent, rack, forget }) →
 *   { root, window, about, prefs, open(page?), close(), toggle(page?), get page, moving(bool), dropGuides(), census(),
 *     applyTheme(id), applyTone(id), themeCost(id?), tier(), measureTier(force?), sampling(), destroy() }
 *   host       where the window goes (a fixed layer above the stage)
 *   prefs      a store from core/prefs.js made with LOOK_SCHEMA (default: one is made, key `storageKey` = 'mir.gui')
 *   defaults   { key: value } — the app's own home look, over the kit's (e.g. { theme: 'light' })
 *   accent     a shell/accent.js engine (default: one is made); ACCENT A/B/VIVID drive it
 *   about      { github, credits: [line…], fonts: href-prefix } — extras for the ABOUT page (shell/about.js richText lines)
 *   moving(b)  the app says the picture is moving: under FROST · STILL the frost is held (body.frost-hold) while it moves
 *   dropGuides() the DROP GUIDES switch, for createWindow({ dock: { guide: gui.dropGuides } })
 *   inkSampler a sampler from core/ink.js (createInkSampler): TEXT · AUTO samples the picture under each label (BASINS'
 *              AUTO), LIGHT · DARK stop it.  `true` (1.5.0-alpha.7): the app runs a sampler of its own; TEXT offers
 *              SAMPLED, which writes no data-text and leaves the ink to it
 *   tierBench  async ({ win, doc, budgetMs }) → { periodMs, passMs }: QUALITY · AUTO's benchmark (default: the UI's own
 *              cost, uiBench).  An app with a GPU engine passes its own pass (BASINS: its present pass at its own size)
 *   sampling   { automation(grid), frameMs() } — the SAMPLING rows' two reaches: the automation grid's setter (default:
 *              modulation/bind.js setAutomationGrid, loaded only when the row moves) and the last frame time for the
 *              SCRUB · LIVE warning (default: the window's own FRAME reading)
 *   projectAccent  default true: ACCENT A, B, VIVID and BRIGHTNESS ride the project (registerProjectPart('accent'))
 *   rack       the app's rack (shell/rack.js): THEME shows RESET LAYOUT (rack.resetLayout()) only when it is handed in
 *   forget     [storage key…] what FORGET wipes besides the look's own key (1.5.0-alpha.14; BASINS' FORGET wiped its whole
 *              settings blob: the window arrangement, the ☆ layouts, the keyboard seat).  Default []: the look's own key only
 *
 * 1.5.0-alpha.12 (BASINS' missing rows): STATUS TAGS, FORGET, TRANSPORT BAR, ACCENT BRIGHTNESS, SAMPLING (SCRUB ·
 * AUTOMATION), QUALITY · AUTO with the device tier, the first-run blur by device, body.touch-tablet. */
import { el, knob, seg, sw, trig, readout, label, ariaLabel, hint } from '../kit.js';
import { glyphEl } from '../glyph.js';
import { phrase, t } from '../core/i18n.js';
import { stepper } from '../controls/stepper.js';
import { arcKnob } from '../controls/arc.js';
import { createWindow } from '../window/window.js';
import { createPrefs, forgetPrefs } from '../core/prefs.js';
import { setMotionPolicy } from '../core/motion.js';
import { frame } from '../core/frame.js';
import { setText, setAttr } from '../core/perf.js';
import { registerProjectPart } from '../core/project.js';
import { glassTint as lookTint, glassVeil, autoInk, solidRelief, spacingPx, DEVICE_BLUR, TIER_LAW, classifyTier, qualityOfTier, isIPad, TOUCH_TABLET_MQ } from '../core/look.js';
import { createAccent, accentPart } from './accent.js';
import { notice } from './notice.js';
import { richText, safeHref } from './about.js';
import { THEMES } from './themes.js';
import { createPointerLight } from '../fx/pointer-light.js';
import { createParallax } from '../fx/parallax.js';
import { installKbm, kbm, hoverable } from '../core/kbm.js';

/** the kit's version, as package.json says it (the release step keeps the two in step) */
import { MIR_VERSION } from '../version.js'; export { MIR_VERSION };   // one constant: mir/version.js
export { THEMES };
/** the words MIR says about itself — quoted from magic-commons.com/joshs-library/lambdawaves/about (2026-10-01) */
export const MIR_WORDS = phrase('MIR is the shared Magic Commons interface kit behind its controls, window system, gestures, and modulation. MIR is an open source platform and will continuously be updated, allowing for ‘LLM Mods’ support and customizable skins.');
const ZERO_SHADOW = '0 0 0 0 transparent';                       // the off shadow: never `none` (a list with none drops)
const HOME = Object.freeze({ veil: 10, saturation: 1, corners: 14 });   // where nothing is written: the dark frost veil · no saturate · skin.css --card-r
/** glassTint(bright, hue, tint, theme, saturation = 1) — BASINS skin.js applyGlass (core/look.js): the `H S% L%` triple
 *  the kit reads as --glass-tint, or null at home (BRIGHT 0, TINT 0, SATURATION 100 %) */
export function glassTint(bright, hue, tint, theme, saturation = 1) { return lookTint({ bright, hue, tint, saturation }, theme); }

/* ── THE LOOK, as one schema: what each option is, and the hook it drives ───────────────────────────────────────────
   Rows are applied in this order inside one frame job, so THEME is on <body> before the accent reads it, and the tier
   and the motion policy are written before the pointer effects re-ask their off rules (the last row).  The defaults are
   FROST with its CLEAR tone (shell/themes.js): a new user starts there. */
/** the automation grid's levels, in beats (BASINS settings-window.js AUTOMATION_GRID_BY_ID): FRAME samples every frame */
export const AUTOMATION_GRID = Object.freeze({ frame: 0, 32: 1 / 32, 16: 1 / 16, 8: 1 / 8 });
/** effectiveQuality(quality, tier) — what QUALITY stands for now: AUTO is the device tier's (core/look.js qualityOfTier) */
export const effectiveQuality = (q, tier) => (q === 'auto' ? qualityOfTier(tier) : q);

/** lookSchema({ tier }) — tier() → 'A' | 'B' | 'C' | null, the device's measured tier that QUALITY · AUTO reads */
export function lookSchema({ tier = () => null } = {}) {
  const q = (s) => effectiveQuality(s.quality, tier());
  const full = (s) => q(s) === 'full';
  const offShadow = (s) => s.shadow === 0 || !s.dropShadow;           // SHADOW at 0 %, or DROP SHADOW off: no pane shadow at all
  return [
    { key: 'skin', type: 'enum', values: ['frost'], default: 'frost', apply: [{ on: 'html', attr: 'data-skin' }] },
    { key: 'theme', type: 'enum', values: ['dark', 'light', 'system'], default: 'dark', apply: [{ on: 'body', attr: 'data-theme', map: (v, s, e) => e.theme }] },
    { key: 'accentA', type: 'number', step: 1, min: 0, max: 360, wrap: true, default: 30 },
    { key: 'accentB', type: 'number', step: 1, min: 0, max: 360, wrap: true, default: 300 },
    /* BRIGHTNESS (BASINS, 2026-10-01): both accents toward white in OKLCH, 0 … 100 % (shell/accent.js) */
    { key: 'accentBright', type: 'number', step: 0.01, min: 0, max: 1, default: 0 },
    { key: 'vivid', type: 'number', step: 0.01, min: 0, max: 1, default: 0.1, apply: [{ run(v, s, e, c) {     // ACCENT A, B, VIVID and BRIGHTNESS are one call
      if (!c || !c.accent) return;
      const k = [s.accentA, s.accentB, v, s.accentBright, e.theme].join();
      if (c.lastAccent === k) return;
      c.lastAccent = k; c.accent.set({ a: s.accentA, b: s.accentB, vivid: v, bright: s.accentBright });
    } }] },
    { key: 'card', type: 'enum', values: ['tinted', 'refractive', 'solid'], default: 'refractive', apply: [{ on: 'body', attr: 'data-card' }] },
    { key: 'frost', type: 'enum', values: ['off', 'still', 'always'], default: 'always', apply: [
      { on: 'body', cls: 'frost', when: (v) => v !== 'off' },
      { run(v, s, e, c) { const b = c && c.doc && c.doc.body; if (b) b.classList.toggle('frost-hold', v === 'still' && !!c.moving); } }] },
    /* BLUR is always written: 0–24 px.  BASINS' range stops at 20, the WebKit ceiling; it reaches 22 only so CLASSIC can
       be 1.4's own blur exactly (WebKit draws anything over 20 as 20).  A new user's is the device's (alpha.12): 11 px on
       a desktop, 20 on a touch device (core/look.js DEVICE_BLUR, read once) */
    { key: 'blur', type: 'number', step: 1, min: 0, max: 24, default: DEVICE_BLUR, apply: [{ on: 'html', prop: '--glass-blur', map: (v) => v + 'px' }] },
    /* VEIL — BASINS' veil (core/look.js glassVeil): the theme's signed whiteness, plus ½·BRIGHT, toward HUE by TINT */
    { key: 'veil', type: 'number', step: 1, min: 0, max: 60, default: 0, apply: [{ on: 'body', prop: '--surface-veil',
      map: (v, s, e) => (!full(s) ? null : glassVeil(s, e.theme, HOME.veil)) }] },
    { key: 'saturation', type: 'number', step: 0.01, min: 0, max: 2, default: 1.3, apply: [{ on: 'body', prop: '--surface-filter',
      map: (v, s) => (!full(s) ? null : s.blur === 0 ? 'none' : v === HOME.saturation ? null : `blur(${s.blur}px) saturate(${v.toFixed(2)})`) },
      /* … and the 1.4 name, so a sheet (an app's, or the plugin's) that reads --frost-filter gets SATURATION too (BASINS: its
         --frost-filter is blur and saturate) */
      { on: 'html', prop: '--frost-filter', map: (v, s) => (!full(s) ? null : s.blur === 0 ? 'none' : v === HOME.saturation ? null : `blur(${s.blur}px) saturate(${v.toFixed(2)})`) }] },
    /* BLUR 0 is no blur: both names are the whole value `none`, never `blur(0px)` (INTENT rule 4).  BASINS writes
       `blur(0px) saturate(1.3)` there, which still saturates what is behind; the kit's pane stays at its FROST fill */
    { key: 'corners', type: 'number', step: 1, min: 0, max: 24, default: 24, apply: [{ on: 'body', prop: '--surface-radius', map: (v) => (v === HOME.corners ? null : Math.round(v) + 'px') }] },
    /* BRIGHT, HUE, TINT — BASINS' glass knobs, onto the kit's --glass-tint on <body> (the tinted and solid pane, every
       solid face); SATURATION multiplies the tint's chroma, as BASINS' does */
    { key: 'bright', type: 'number', step: 0.01, min: -1, max: 1, default: 0 },
    { key: 'hue', type: 'number', step: 1, min: 0, max: 360, wrap: true, default: 0 },
    { key: 'tint', type: 'number', step: 0.01, min: 0, max: 1, default: 0, apply: [{ on: 'body', prop: '--glass-tint', map: (v, s, e) => lookTint(s, e.theme) },
      /* SOLID's relief mixes and the shine's gain follow the pane's lightness (core/look.js solidRelief) */
      { on: 'body', prop: '--solid-lift', map: (v, s, e) => (s.card === 'solid' ? solidRelief(s, e.theme).lift + '%' : null) },
      { on: 'body', prop: '--solid-sink', map: (v, s, e) => (s.card === 'solid' ? solidRelief(s, e.theme).sink + '%' : null) },
      { on: 'body', prop: '--shine-gain', map: (v, s, e) => (s.shine > 0 ? String(solidRelief(s, e.theme).gain) : null) }] },
    /* CONTROL FACES — GLASS · SOLID, and BLEND (0 % solid … 100 % glass) while SOLID (BASINS skin.js setFaces / setFaceBlend) */
    { key: 'faces', type: 'enum', values: ['solid', 'glass'], default: 'glass', apply: [{ on: 'body', attr: 'data-faces',
      map: (v, s) => (v === 'glass' || s.faceBlend >= 1 ? 'glass' : s.faceBlend > 0 ? 'blend' : null) }] },
    { key: 'faceBlend', type: 'number', step: 0.01, min: 0, max: 1, default: 0, apply: [
      { on: 'body', prop: '--faces-solid-pct', map: (v, s) => (s.faces === 'solid' && v > 0 && v < 1 ? ((1 - v) * 100).toFixed(2) + '%' : null) },
      { on: 'body', prop: '--faces-transition-alpha', map: (v, s) => (s.faces === 'solid' && v > 0 && v < 1 ? (Math.sin(Math.PI * v) * 0.22).toFixed(3) : null) }] },
    /* TEXT — AUTO · LIGHT · DARK (BASINS skin.js setText): white or black ink everywhere, or AUTO (core/look.js autoInk):
       under glass BASINS' unsampled seat, the pure ladder in the mode's polarity (white in dark, black in light); on a
       SOLID pane the pane's lightness; on a TINTED pane the house ladder.  No sampling: BASINS' sampler is the app's.
       SAMPLED leaves the ink to the app: no data-text at all, so an app's own sampler (BASINS' adaptive-ink.js, which
       writes its own w | k ink on each label) decides; the GUI window offers it only to an app that says it has one.  Home: AUTO since
       1.5.6-alpha.8 (FROST's TEXT, the home look's: white in dark as before, black in light) */
    { key: 'text', type: 'enum', values: ['theme', 'light', 'dark', 'sampled'], default: 'theme', apply: [{ on: 'body', attr: 'data-text',
      map: (v, s, e) => (v === 'sampled' ? null : v !== 'theme' ? v : autoInk(s, e.theme)) }] },
    { key: 'relief', type: 'enum', values: ['default', 'flat'], default: 'default', apply: [
      { on: 'html', prop: '--relief-raise', map: (v) => (v === 'flat' ? ZERO_SHADOW : null) },
      { on: 'html', prop: '--relief-well', map: (v) => (v === 'flat' ? ZERO_SHADOW : null) }] },
    /* EDGE — a window pane's hairline rim (BASINS' glass draws none on its windows; its menus and popovers keep theirs) */
    { key: 'edge', type: 'bool', default: false, apply: [{ on: 'body', prop: '--pane-edge', map: (v) => (v ? null : 'transparent') }] },
    /* THE ONE LIGHT — LIGHT ANGLE, SHADOW 0–200 % (BASINS' range), DISTANCE, SOFTNESS, SHINE, its SOFTNESS.  Each writes
       its number on <html> off home; html[data-cast] lets the sheets draw the cast, html[data-shine] the shine layer */
    { key: 'lightAngle', type: 'number', step: 1, min: 0, max: 360, wrap: true, default: 0, apply: [{ on: 'html', prop: '--light-angle', map: (v) => (v ? v + 'deg' : null) }] },
    /* RELIEF ANGLE — the controls' light (INTENT O2: two lights, as BASINS has them); LINK makes it LIGHT ANGLE.  At its
       home, 315° (upper left), the kit's own relief stands: the 1.4 drawing, BASINS' */
    { key: 'reliefAngle', type: 'number', step: 1, min: 0, max: 360, wrap: true, default: 315 },
    { key: 'reliefLink', type: 'bool', default: false, apply: [{ on: 'html', prop: '--relief-angle',
      map: (v, s) => { const a = v ? s.lightAngle : s.reliefAngle; return a === 315 ? null : a + 'deg'; } }] },
    { key: 'shadow', type: 'number', step: 0.01, min: 0, max: 2, default: 2, apply: [{ on: 'html', prop: '--shadow-amount', map: (v) => (v === 1 ? null : String(v)) }] },
    { key: 'shadowDist', type: 'number', step: 1, min: 0, max: 24, default: 2, apply: [{ on: 'html', prop: '--shadow-dist', map: (v) => (v === 2 ? null : v + 'px') }] },
    { key: 'shadowSoft', type: 'number', step: 1, min: 0, max: 48, default: 8, apply: [{ on: 'html', prop: '--shadow-soft', map: (v) => (v === 8 ? null : v + 'px') }] },
    { key: 'shine', type: 'number', step: 0.01, min: 0, max: 1, default: 0, apply: [{ on: 'html', prop: '--shine-amount', map: (v) => (v ? String(v) : null) }] },
    /* 1.5.6-alpha.5 · SHINE SOFT 0–6 (was 0–48), drawn ÷ 3: the shine is a hairline (skin.css); a stored value above 6 clamps on read */
    { key: 'shineSoft', type: 'number', step: 1, min: 0, max: 6, default: 6, apply: [{ on: 'html', prop: '--shine-soft', map: (v) => (v === 6 ? null : v + 'px') }] },
    /* DROP SHADOW — Display's switch (BASINS: "Display can switch it off"); off, or SHADOW at 0, is no pane shadow at all */
    { key: 'dropShadow', type: 'bool', default: true, apply: [
      { on: 'html', attr: 'data-cast', map: (v, s) => (offShadow(s) ? null : '') },   // the engine always draws BASINS' material shadow (at 100 % too)
      { on: 'html', attr: 'data-shine', map: (v, s) => (s.shine > 0 ? '' : null) },
      ...['--surface-shadow', '--surface-shadow-float', '--surface-shadow-menu'].map((prop) => ({ on: 'body', prop, map: (v, s) => (offShadow(s) ? ZERO_SHADOW : null) }))] },
    { key: 'disconnected', type: 'bool', default: false, apply: [{ on: 'body', cls: 'disconnected' }] },
    /* SCROLL PILL (1.5.0-alpha.25, from λWAVES): the window's name beside its title bar while a rack scrolls (rack.css); A, the scrollbar's accent, writes nothing (014 A10) */
    { key: 'rackPill', type: 'enum', values: ['off', 'a', 'b'], default: 'a', apply: [{ on: 'body', attr: 'data-rack-pill', map: (v) => (v === 'a' ? null : v) }] },
    /* SPACING — the rack's air (Josh, 2026-10-01: "the dock margins are too large … an option for 0 padding/margins"):
       BASINS' levels 0 · TIGHT · DEFAULT (and AIRY, this kit's) to --rack-gap, --rack-inset, --pane-pad and --rail-gap
       (core/look.js SPACING); 0 is flush (html[data-flush]) */
    { key: 'spacing', type: 'enum', values: ['0', 'tight', 'default', 'airy'], default: 'default', apply: [
      { on: 'html', prop: '--rack-gap', map: (v) => spacingPx(v).gap + 'px' },
      { on: 'html', prop: '--rack-inset', map: (v) => spacingPx(v).inset + 'px' },
      /* DEFAULT leaves the pane's padding as the sheets have it (7 · 7 · 10, BASINS' numbers: BASINS wrote nothing there),
         so choosing DEFAULT changes nothing inside a window (1.5.0-alpha.12) */
      { on: 'html', prop: '--pane-pad', map: (v) => (v === 'default' ? null : spacingPx(v).pad + 'px') },
      { on: 'html', prop: '--rail-gap', map: (v) => spacingPx(v).rail + 'px' },
      { on: 'html', attr: 'data-flush', map: (v) => (v === '0' ? '' : null) }] },
    { key: 'motion', type: 'enum', values: ['auto', 'full', 'reduced', 'off'], default: 'auto', apply: [{ run: (v) => setMotionPolicy(v) }] },
    { key: 'glow', type: 'bool', default: true },                    // fx/pointer-light.js — off on touch by its own law (ruling 13)
    { key: 'parallax', type: 'bool', default: true },                // fx/parallax.js
    { key: 'dropGuides', type: 'bool', default: true },              // read by createWindow({ dock: { guide } }) → gui.dropGuides()
    { key: 'hints', type: 'bool', default: true, apply: [{ on: 'body', cls: 'control-hints-off', when: (v) => !v }] },
    { key: 'help', type: 'bool', default: false, apply: [{ on: 'body', cls: 'window-info-off', when: (v) => !v }] },
    /* STATUS TAGS (BASINS Settings › DISPLAY, skin.js setBadges): off is body.no-badges; a new user starts with them off
       (BASINS NEW_USER: "Status Tags, Help: OFF") */
    { key: 'badges', type: 'bool', default: false, apply: [{ on: 'body', cls: 'no-badges', when: (v) => !v }] },
    /* TRANSPORT BAR (BASINS skin.js setTransportBar): off is body.no-transport-bar, which the transport's sheet reads */
    { key: 'transportBar', type: 'bool', default: true, apply: [{ on: 'body', cls: 'no-transport-bar', when: (v) => !v }] },
    { key: 'menuBar', type: 'enum', values: ['hover', 'always'], default: 'hover', apply: [{ on: 'html', attr: 'data-menu-bar', map: (v) => v === 'always' ? v : null }] },
    { key: 'logo', type: 'bool', default: true, apply: [{ on: 'html', attr: 'data-logo', map: (v) => v ? null : 'hidden' }] },
    /* SAMPLING (BASINS docs/TIMELINE-SAMPLING-2026-10-01.md): SCRUB is read by the timeline's transport controller at each
       scrub's start (createTransportController({ scrubLevel })); AUTOMATION is pushed to the modulation host when it moves */
    { key: 'scrub', type: 'enum', values: ['live', 'light', 'release'], default: 'live' },
    { key: 'automation', type: 'enum', values: ['frame', '32', '16', '8'], default: 'frame' },
    /* QUALITY — AUTO (alpha.12) is the device's tier, measured once (BASINS settings.js §2): A and B are FULL, C is
       BALANCED.  A choice of FULL, BALANCED or LIGHT is the user's override and always wins. */
    { key: 'quality', type: 'enum', values: ['auto', 'full', 'balanced', 'light'], default: 'auto', apply: [
      { on: 'html', attr: 'data-ui-tier', map: (v, s) => { const e = q(s); return e === 'balanced' ? 'lite' : e === 'light' ? 'flat' : null; } },
      { run(v, s, e, c) { if (c && c.fx) c.fx(); } }] },
  ];
}
/** the presets the store matches: each vanilla theme's options (its colours are its tones'; shell/themes.js).
 *  Breaking in 1.5.0-alpha.5: LOOK_PRESETS.light is gone (SWIFT replaces it); every theme is here. */
export const LOOK_PRESETS = Object.freeze(Object.fromEntries(THEMES.map((t) => [t.id, t.values])));

/** migrateShadow(key, win) — alpha.4 stored SHADOW as a switch: `false` becomes 0 %; `true` becomes the amount of the
 *  theme the rest of the stored look matches (FROST: 200 %), or 100 % (the kit's own shadows) when it matches none */
export function migrateShadow(key = 'mir.gui', win = globalThis) {
  try {
    const S = win.localStorage, raw = S && S.getItem(key), o = raw && JSON.parse(raw);
    if (!o || typeof o.shadow !== 'boolean') return null;
    const t = o.shadow && THEMES.find((x) => Object.entries(x.values).every(([k, v]) => k === 'shadow' || !(k in o) || o[k] === v));
    o.shadow = !o.shadow ? 0 : t ? t.values.shadow : 1;
    S.setItem(key, JSON.stringify(o));
    return o.shadow;
  } catch (_) { return null; }
}

/* ── THE STEPPER: `‹ NAME ›`, and the page turner — the kit's one stepper (mir/controls/stepper.js; this file used to carry its own) ───── */
export { stepper };

/* ── THE COST READING ────────────────────────────────────────────────────────────────────────────────────────────── */
const OFF_SHADOW = /^(none|rgba\(0, 0, 0, 0\) 0px 0px 0px 0px)$/;
/** census(doc) → { blur, shadow, shine } — how many visible surfaces (elements and their drawn ::before/::after) carry a
 *  backdrop filter, a drawn box shadow, and a shine layer of their own (an additive pseudo-element).  One style read per
 *  surface: it runs once after a change, never per frame. */
export function census(doc = document) {
  let blur = 0, shadow = 0, shine = 0;
  for (const n of doc.body.querySelectorAll('*')) {
    if (n.checkVisibility ? !n.checkVisibility() : !n.getClientRects().length) continue;
    for (const pseudo of [null, '::before', '::after']) {
      const cs = getComputedStyle(n, pseudo);
      if (pseudo && (cs.content === 'none' || cs.content === 'normal')) continue;
      const bf = cs.backdropFilter || cs.webkitBackdropFilter;
      if (bf && bf !== 'none') blur++;
      const drawn = cs.boxShadow && !OFF_SHADOW.test(cs.boxShadow) && !cs.boxShadow.split(/,(?![^(]*\))/).every((l) => OFF_SHADOW.test(l.trim()));
      if (drawn) { if (pseudo && cs.mixBlendMode === 'plus-lighter') shine++; else shadow++; }
    }
  }
  return { blur, shadow, shine };
}

/* ── THE DEVICE TIER (BASINS settings.js §2): a ≤ 3 s benchmark, once per device, that sorts it A / B / C ──────────── */
export const TIER_KEY = 'mir.tier';
const lsGet = (S, k) => { try { const t = S && S.getItem(k); const o = t && JSON.parse(t); return o && typeof o === 'object' ? o : null; } catch (_) { return null; } };
/** storedTier(storage, key) → the reading this device kept, if it was taken under the current law; else null */
export function storedTier(storage = globalThis.localStorage, key = TIER_KEY) {
  const o = lsGet(storage, key);
  return o && o.version === TIER_LAW.VERSION && ['A', 'B', 'C'].includes(o.tier) ? o : null;
}
/** uiBench({ win, doc, budgetMs }) → { periodMs, passMs } — the kit's own benchmark: the display's period (the median of
 *  20 animation-frame gaps) and the UI's own pass (the best of three whole-page style and layout passes, forced by a
 *  custom property on <html> that every element inherits).  An app with a GPU engine hands its own instead. */
export async function uiBench({ win = globalThis.window, doc = win.document, budgetMs = TIER_LAW.BUDGET_MS } = {}) {
  const t0 = win.performance.now();
  const periodMs = await new Promise((done) => {
    const gaps = []; let last = 0, over = false;
    const stop = win.setTimeout(() => { over = true; done(gaps.length ? median(gaps) : 0); }, Math.max(200, budgetMs / 2));
    const tick = (now) => { if (over) return; if (last) gaps.push(now - last); last = now;
      if (gaps.length < 20) win.requestAnimationFrame(tick); else { win.clearTimeout(stop); done(median(gaps)); } };
    win.requestAnimationFrame(tick);
  });
  const de = doc.documentElement; let passMs = Infinity;
  for (let i = 0; i < 3 && win.performance.now() - t0 < budgetMs; i++) {
    const a = win.performance.now();
    de.style.setProperty('--mir-bench', String(i + 1)); void doc.body.offsetHeight; void win.getComputedStyle(doc.body).color;
    passMs = Math.min(passMs, win.performance.now() - a);
  }
  de.style.removeProperty('--mir-bench');
  return { periodMs, passMs: Number.isFinite(passMs) ? passMs : 0 };
}
const median = (a) => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
/** measureTier({ bench, storage, key, force, win }) → { tier, hz, periodMs, passMs, headroom, ms, at, version, why } —
 *  BASINS measureTier: a stored reading under the current law is trusted (one storage read); otherwise the bench runs
 *  (≤ 3 s), the device is judged against itself (core/look.js classifyTier) and the reading is kept for this device. */
export async function measureTier({ bench = uiBench, storage = globalThis.localStorage, key = TIER_KEY, force = false, win = globalThis.window } = {}) {
  const kept = !force && storedTier(storage, key);
  if (kept) return kept;
  const t0 = win.performance.now();
  let r = null, why = '';
  try { r = await bench({ win, doc: win.document, budgetMs: TIER_LAW.BUDGET_MS }); } catch (e) { why = 'the bench threw: ' + String((e && e.message) || e); }
  const periodMs = +(r && r.periodMs) || 0, passMs = +(r && r.passMs) || 0;
  const hz = periodMs > 0 ? 1000 / periodMs : 60, headroom = periodMs > 0 && passMs > 0 ? periodMs / passMs : 0;
  const tier = classifyTier(hz, headroom);
  const out = { tier, hz: +hz.toFixed(1), periodMs: +periodMs.toFixed(3), passMs: +passMs.toFixed(4), headroom: +headroom.toFixed(2),
    ms: +(win.performance.now() - t0).toFixed(1), at: Date.now(), version: TIER_LAW.VERSION,
    why: headroom > 0 ? `${tier}: a ${passMs.toFixed(2)} ms pass in a ${periodMs.toFixed(2)} ms panel = headroom ×${headroom.toFixed(1)} at ${hz.toFixed(0)} Hz (A ≥ ×${TIER_LAW.HEAD_A} at ≥ ${TIER_LAW.HZ_A} Hz, B ≥ ×${TIER_LAW.HEAD_B})`
      : (why || 'B: the pass could not be measured, so the middle rung') };
  try { if (storage) storage.setItem(key, JSON.stringify(out)); } catch (_) {}
  return out;
}

/** touchTablet(doc, signal) — body.touch-tablet on an iPad (one that says it is a Mac included) or a coarse pointer on a
 *  screen wider than a phone, followed live (BASINS skin.js syncTablet).  The GUI window installs it.
 *  GEOMETRY ONLY (1.5.0 wave 21): it means "a tablet-class screen" — 44 px heads, the rack takes the touch, the float
 *  clamp.  Every BEHAVIOUR (hover, the menubar's hover, the cursor effects, the hold before a card lifts) follows the
 *  live pointer instead (core/kbm.js: html.kbm-precision / html.kbm-touch), so a trackpad on an iPad is a desktop. */
export function touchTablet(doc = globalThis.document, signal) {
  const win = doc.defaultView, mq = win.matchMedia ? win.matchMedia(TOUCH_TABLET_MQ) : null;
  const sync = () => doc.body.classList.toggle('touch-tablet', isIPad(win.navigator) || !!(mq && mq.matches));
  sync();
  if (mq && mq.addEventListener) mq.addEventListener('change', sync, signal ? { signal } : undefined);
  return sync;
}

/* NO TABS (1.5.0-alpha.32, λWAVES 018 F1; Josh 2026-10-27: "try to not use tabs … remove as much empty space and pack
   everything into that window").  Every group on one packed grid of up to four columns (gui.css), in this order: theme ·
   accent · material · text · controls · quality · motion · menus · light · windows · sampling.  A phone is one column, the
   body scrolling. */
const NARROW = '(max-width: 720px)';
const ACCENT_KEYS = ['accentA', 'accentB', 'vivid', 'accentBright'];

/** forgetLook(prefs, keys, storage?) — FORGET: the look store's own key is wiped (every option home), then each key the app listed */
export function forgetLook(prefs, keys = [], storage) {
  if (prefs.forget) prefs.forget(); else prefs.reset();
  for (const k of keys) if (typeof k === 'string' && k) forgetPrefs(k, storage);
}

export function createGui({ host, prefs, app = {}, about = {}, accent, defaults = {}, storageKey = 'mir.gui', inkSampler = false, tierBench, sampling = {}, projectAccent = true, rack = null, forget = [] } = {}) {
  const doc = host.ownerDocument, win = doc.defaultView;
  const life = new AbortController(), on = { signal: life.signal };
  const appName = app.name || 'This app';
  const sampler = inkSampler && typeof inkSampler === 'object' && typeof inkSampler.mode === 'function' ? inkSampler : null;

  /* ── the store, the accent, the pointer effects, the device ── */
  let tierReading = (() => { try { return storedTier(win.localStorage); } catch (_) { return null; } })();   // read before the first paint, so AUTO paints the known tier
  const ctx = { doc, accent: accent === false ? null : accent || createAccent(), moving: false, lastAccent: null, fx: null };
  const schema = lookSchema({ tier: () => (tierReading ? tierReading.tier : null) }).map((r) => (r.key in defaults ? { ...r, default: defaults[r.key] } : r));
  if (!prefs) migrateShadow(storageKey, win);
  const P = prefs || createPrefs({ key: storageKey, schema, presets: THEMES, context: ctx });
  /* THE SKINS are the store's list (1.5.0-alpha.32): an app may put its own first (λWAVES: its first-run look, λWAVES); the kit's THEMES
     otherwise.  The first is the home look RESET LOOK returns to. */
  const themes = P.presetList || THEMES;
  const themeOf = (id) => themes.find((x) => x.id === id) || null;
  const same = (state, values) => Object.entries(values).every(([k, v]) => state[k] === v);
  const toneOf = (state, id) => { const th = themeOf(id), o = th && th.tones.find((x) => same(state, x.values)); return o ? o.id : 'custom'; };
  installKbm({ doc });                                               // the live pointer (touch vs precision), before the pointer effects ask it; once per page
  const light =createPointerLight({ doc, enabled: () => P.get('glow') });
  const plx = createParallax({ doc, enabled: () => P.get('parallax') });
  ctx.fx = () => { light.refresh(); plx.refresh(); };
  touchTablet(doc, life.signal);
  P.apply({ now: true });                                            // the first paint wears the stored look

  /* QUALITY · AUTO: the benchmark runs once per device, after the first paint and out of the boot's way (BASINS kicks it
     off 200 ms after the picture is up), and only while AUTO is chosen; a reading this device kept costs one storage read */
  let tierRun = null, tierTimer = 0;
  const runTier = (force) => {
    if (tierRun) return tierRun;
    tierRun = measureTier({ bench: tierBench, storage: win.localStorage, force, win }).then((t) => { tierReading = t; tierRun = null; P.apply(); paintTier(); return t; }, () => { tierRun = null; return null; });
    return tierRun;
  };
  const wantTier = () => { if (P.get('quality') === 'auto' && !tierReading && !tierTimer && !tierRun) tierTimer = win.setTimeout(() => { tierTimer = 0; runTier(false); }, 200); };

  /* THE ACCENTS RIDE THE PROJECT (BASINS skin.js accentProject): the one look setting a project carries */
  const unpart = projectAccent ? registerProjectPart('accent', accentPart({
    get: () => ({ a: P.get('accentA'), b: P.get('accentB'), vivid: P.get('vivid'), bright: P.get('accentBright') }),
    set: (v) => P.set({ accentA: v.a, accentB: v.b, vivid: v.vivid, accentBright: v.bright }),
    subscribe: (fn) => P.subscribe((s, changed) => { if (changed.some((k) => ACCENT_KEYS.includes(k))) fn(); }) })) : null;

  /** applyTheme(id) — the theme's options and its own tone, in one set; its cost is measured once it has painted */
  let costFor = null;
  const applyTheme = (id) => { const th = themeOf(id), v = th && { ...th.values, ...(th.tones[0] || {}).values }; if (!v) return []; costFor = id; const changed = P.set(v); if (!changed.length) measureCost(true); return changed; };
  const applyTone = (id) => { const th = themeOf(P.preset()), o = th && th.tones.find((x) => x.id === id); return o ? P.set(o.values) : []; };
  const costs = {};                                                  // theme id → { blur, shadow, shine, ms }

  /* ── OPTIONS: one packed grid of groups ── */
  const controls = new Map();                                        // option key → { set(v) } so the window follows the store
  const bind = (key, c, toUi = (v) => v) => { controls.set(key, { c, set: (v) => c.set(toUi(v)) }); return c; };
  const opts = el('div', 'gui-page gui-options');
  const grid = el('div', 'gui-grid', opts);
  const groupEl = (id, title) => { const g = el('section', 'gui-grp', grid); g.dataset.group = id; g.dataset.light = ''; label(el('h3', 'gui-grp-lbl', g), title); return g; };
  const line = (g, cls = '') => el('div', 'gui-line' + (cls ? ' ' + cls : ''), g);
  const segOf = (key, label, options) => bind(key, seg({ label, options: options.map(([id, l, title]) => ({ id, label: l, title })), value: P.get(key), onChange: (v) => P.set(key, v) }));
  const swOf = (key, label, title) => bind(key, sw({ label, title, value: P.get(key), onChange: (v) => P.set(key, v) }));
  const knobOf = (key, label, o) => bind(key, (o.arc ? arcKnob : knob)({ label, title: o.title, aria: o.aria, value: o.toUi ? o.toUi(P.get(key)) : P.get(key), min: o.min, max: o.max, fmt: o.fmt, wrap: o.wrap, cls: o.cls, ink: o.ink,
    onInput: (v) => { P.set(key, o.fromUi ? o.fromUi(v) : v); if (o.input) o.input(v); } }), o.toUi);
  const pct = (v) => Math.round(v) + '%', px = (v) => Math.round(v) + 'px', deg = (v) => Math.round(v) + '°';
  const hundred = { min: 0, max: 100, fmt: pct, toUi: (v) => v * 100, fromUi: (v) => v / 100 };
  const seat = () => { const h = el('div', 'k'); h.setAttribute('aria-hidden', 'true'); return h; };   // an empty dial seat, so dial rows share columns

  /* THEME — the vanilla themes (SKIN), their tones (TONE), the theme (LIGHT · DARK · SYSTEM), and what the theme costs */
  let g = groupEl('theme', phrase('THEME'));
  /* a theme's and a tone's name is a NAME (shell/themes.js): shown as it is in every language */
  const themeItems = () => [...themes.map((t) => ({ id: t.id, label: phrase(t.name, 'name') })), { id: 'custom', label: 'CUSTOM', coming: true }];
  const skinStep = stepper({ label: 'SKIN', items: themeItems(), value: P.preset(), onChange: (id) => applyTheme(id) });   // tr[SKIN]: the look the kit wears: one of the built-in THEMES (FROST, MORPH …, whose names stay as written)
  const toneItems = (t) => { const th = themeOf(t); return th ? [...th.tones.map((o) => ({ id: o.id, label: phrase(o.name, 'name') })), { id: 'custom', label: 'CUSTOM', coming: true }] : []; };
  const toneStep = stepper({ label: 'TONE', items: toneItems(P.preset()), value: toneOf(P.all(), P.preset()), onChange: (id) => applyTone(id) });   // tr[TONE]: a colour variant of the chosen theme (its tones have names, kept as written)
  skinStep.root.classList.add('gui-skin'); toneStep.root.classList.add('gui-tone');
  line(g, 'gui-pair').append(skinStep.root, toneStep.root);
  const costNote = el('div', 'gui-note gui-theme-cost', g); costNote.title = 'What this theme cost when it was applied: surfaces that blur, shadows drawn, shine layers, the mean frame time';
  line(g).append(segOf('theme', phrase('THEME'), [['light', phrase('LIGHT', 'theme mode')], ['dark', phrase('DARK', 'theme mode')], ['system', phrase('SYSTEM'), phrase('Follow the system')]]).root);   // tr[THEME]: THEME: LIGHT, DARK or SYSTEM, the light or dark mode (not the SKIN)
  const resetB = trig({ label: 'RESET LOOK', onFire: () => { costFor = themes[0].id; P.reset(); } }).root;
  hint(resetB, 'Every look option back home: the {skin} skin', { skin: themes[0].name });
  line(g, 'gui-trigs').append(resetB,
    /* RESET LAYOUT (BASINS settings-window.js:130, before FORGET): the rack's windows back to their default places */
    ...(rack && typeof rack.resetLayout === 'function' ? [trig({ label: 'RESET LAYOUT', title: 'Restore the default window layout', onFire: () => rack.resetLayout() }).root] : []),
    /* FORGET (BASINS Settings › LOOK): this browser's saved look is wiped and the page reloads at the new user's look */
    trig({ label: 'FORGET', title: 'Clear saved interface settings and reload', onFire: () => { forgetLook(P, forget, win.localStorage); win.location.reload(); } }).root);

  /* ACCENT — a hue is cyclic, so it is an arc (INTENT rule 2): the kit's accent dial */
  g = groupEl('accent', phrase('ACCENT'));
  const kA = knobOf('accentA', phrase('A'), { min: 0, max: 360, wrap: true, fmt: deg, arc: true, ink: 'var(--acc)' });
  const kB = knobOf('accentB', phrase('B'), { min: 0, max: 360, wrap: true, fmt: deg, arc: true, ink: 'var(--acc2)' });
  const kV = knobOf('vivid', phrase('VIVID'), hundred);
  /* BRIGHTNESS (BASINS, Josh 2026-10-01): both accents toward white; it rides the project with them */
  const kBr = knobOf('accentBright', phrase('BRIGHTNESS'), { ...hundred, aria: 'ACCENT BRIGHTNESS', title: 'BRIGHTNESS — shifts both accents toward white. Saved with the project, like the accents.' });   // tr[BRIGHTNESS]: how far both accent colours are mixed toward white (not the glass's BRIGHT)
  line(g, 'gui-knobs').append(kA.root, kB.root, kV.root, kBr.root);

  /* MATERIAL */
  g = groupEl('material', phrase('MATERIAL'));
  line(g).append(segOf('card', phrase('PANE'), [['tinted', phrase('TINTED'), phrase('Add the theme tint behind window content: no blur, no compositor cost')], ['refractive', phrase('REFRACTIVE'), phrase('Use transparent window surfaces: the blur, with a veil')],
    ['solid', phrase('SOLID'), phrase('An opaque pane in the tint’s colour: {:HUE} picks it, {:TINT} is its strength, {:BRIGHT} its lightness')]]).root,
  segOf('frost', phrase('FROST', 'frost setting'), [['off', phrase('OFF'), phrase('Disable backdrop filtering')], ['still', phrase('STILL'), phrase('Apply frost while the picture is still')], ['always', phrase('ALWAYS'), phrase('Apply frost continuously. This can reduce frame rate.')]]).root);
  const kBlur = knobOf('blur', phrase('BLUR'), { min: 0, max: 24, fmt: (v) => Math.round(v) + ' px', title: '{:BLUR} — the blur radius of {:frost setting::FROST}' });
  const kVeil = knobOf('veil', phrase('VEIL'), { min: 0, max: 60, fmt: pct, title: 'Theme-coloured glass fill. Zero is clear.' });
  const kSat = knobOf('saturation', phrase('SATURATION'), { min: 0, max: 2, fmt: (v) => Math.round(v * 100) + '%', title: 'Colour intensity across glass surfaces: 0% neutral · 100% original · 200% vivid.' });
  const kCorner = knobOf('corners', phrase('CORNERS'), { min: 0, max: 24, fmt: (v) => Math.round(v) + ' px', title: 'Corner radius across window panes.' });
  line(g, 'gui-knobs').append(kBlur.root, kVeil.root, kSat.root, kCorner.root);
  const signed = (v) => (v > 0.005 ? '+' : v < -0.005 ? '−' : '') + Math.abs(v * 100).toFixed(0);
  const kBright = knobOf('bright', phrase('BRIGHT'), { min: -1, max: 1, fmt: signed, title: '{:BRIGHT} — how light or dark the glass is' });
  /* HUE is cyclic, so an arc (INTENT rule 2), drawn in the hue it names */
  const kHue = knobOf('hue', phrase('HUE'), { min: 0, max: 360, wrap: true, fmt: deg, arc: true, ink: (v) => `hsl(${Math.round(v)} 70% 55%)`, title: '{:HUE} — the colour {:TINT} gives the glass' });
  const kTint = knobOf('tint', phrase('TINT'), { ...hundred, title: '{:TINT} — how much of {:HUE} the glass carries' });
  line(g, 'gui-knobs').append(kBright.root, kHue.root, kTint.root, seat());

  /* TEXT — BASINS' TEXT seg.  AUTO with an ink sampler (core/ink.js) is BASINS' AUTO: each label from the picture under
     it; with none it follows the theme.  Then what shows */
  g = groupEl('text', phrase('TEXT'));
  line(g).append(segOf('text', phrase('INK'), [['theme', phrase('AUTO'), sampler ? phrase('Each label turns white or black from the picture beneath it') : phrase('Follow the theme (on a {:SOLID} pane, its lightness)')], ['light', phrase('LIGHT', 'text ink'), phrase('White text on every label')], ['dark', phrase('DARK', 'text ink'), phrase('Black text on every label')],
    ...(inkSampler === true ? [['sampled', phrase('SAMPLED', 'text ink'), phrase('Each label’s ink from the picture under it (this app’s sampler)')]] : [])]).root);   // tr[SAMPLED]: TEXT (the label ink) set by the app itself, from the picture under each label: "measured", not "a sample" // tr[Each label’s ink from the picture under it (this app’s sampler)]: the app's own sampler reads the picture behind each word and picks white or black ink
  const shows = el('div', 'segw gui-show', line(g)); label(el('div', 'k-lbl', shows), 'SHOW');
  el('div', 'gui-line gui-sws gui-col', shows).append(swOf('hints', phrase('HINTS'), phrase('Hover hints on controls')).root, swOf('help', phrase('HELP'), phrase('The ⓘ panels on windows')).root,
    swOf('badges', phrase('STATUS TAGS'), phrase('Show status tags at the top')).root);   // tr[STATUS TAGS]: the small status labels over the picture (BASINS' badges and stats bar)

  /* CONTROLS — the relief, the faces (BASINS' CONTROL FACES) and BLEND */
  g = groupEl('controls', phrase('CONTROLS'));
  line(g).append(segOf('relief', phrase('RELIEF'), [['default', phrase('DEFAULT'), phrase('Raised controls and wells, lit by {:LIGHT ANGLE}')], ['flat', phrase('FLAT'), phrase('Flat control faces: hairlines and accents only')]]).root,
    segOf('faces', phrase('FACES'), [['glass', phrase('GLASS'), phrase('Under refractive or frost the knobs, buttons and fields are clear glass')], ['solid', phrase('SOLID'), phrase('The kit’s filled knobs, buttons and fields')]]).root);
  const kBlend = knobOf('faceBlend', phrase('BLEND'), { ...hundred, aria: 'Solid to glass control faces', title: '0% solid · 100% glass. The transition uses color burn in dark mode and color dodge in light mode.' });
  line(g, 'gui-knobs').append(kBlend.root, seat(), seat());

  /* QUALITY — AUTO (the device's tier), the three tiers by hand, and what it costs */
  g = groupEl('quality', phrase('QUALITY'));
  line(g).append(segOf('quality', phrase('TIER'), [['full', phrase('FULL', 'quality tier'), phrase('Everything')], ['balanced', phrase('BALANCED'), phrase('No blur anywhere, one shadow layer')], ['light', phrase('LIGHT', 'quality tier'), phrase('No blur, no relief, no shadows, no motion')],
    ['auto', phrase('AUTO', 'quality tier'), phrase('This device’s tier, measured once: A and B are {:FULL}, C is {:BALANCED}')]]).root);   // tr[This device’s tier, measured once: A and B are {:FULL}, C is {:BALANCED}]: a short benchmark sorts this device into tier A, B or C
  const tierNote = el('div', 'gui-note gui-tier', g);
  const paintTier = () => {
    const t = tierReading;
    if (!t) label(tierNote, P.get('quality') === 'auto' ? 'AUTO: measuring this device' : 'AUTO: not measured');
    else label(tierNote, 'AUTO: tier {tier} → {quality}', { tier: t.tier, quality: { t: effectiveQuality('auto', t.tier).toUpperCase() } });
    tierNote.title = t ? t.why : '';
  };
  paintTier();
  const roBlur = readout({ label: 'BLUR', value: '—' }), roShadow = readout({ label: 'SHADOW', value: '—' }), roFrame = readout({ label: 'FRAME', value: '—' });   // tr[FRAME]: the time to draw one frame of the screen, in milliseconds (not a picture frame)
  for (const r of [roBlur, roShadow, roFrame]) { r.root.classList.add('gui-ro'); r.root.title = 'What the look costs, measured after the last change'; }
  roBlur.root.title = 'Surfaces that blur what is behind them: one compositor pass each';
  roShadow.root.title = 'Surfaces that draw a shadow, and shine layers';
  roFrame.root.title = 'The mean frame time over 30 frames after the last change';
  line(g, 'gui-cost').append(roBlur.root, roShadow.root, roFrame.root);

  /* MOTION */
  g = groupEl('motion', phrase('MOTION'));
  line(g).append(segOf('motion', phrase('MOTION'), [['auto', phrase('AUTO'), phrase('Follow the system')], ['full', phrase('FULL', 'motion')], ['reduced', phrase('REDUCED'), phrase('Fades only: nothing travels')], ['off', phrase('OFF'), phrase('Nothing animates')]]).root);
  /* POINTER (1.5.0 wave 21, BASINS' "Input" row): AUTO follows the pointer in use — a trackpad on an iPad hovers like a
     desktop, a finger does not; the two pins are for judging it on the device.  A device setting core/kbm.js keeps. */
  const ptrSeg = seg({ label: phrase('POINTER'), value: kbm.pref(), onChange: (v) => kbm.setPref(v),
    options: [{ id: 'auto', label: phrase('AUTO'), title: phrase('Follow the pointer in use: a mouse or trackpad hovers, a finger does not') },
      { id: 'touch', label: phrase('TOUCH', 'pointer'), title: phrase('Always behave as under a finger: no hover') },
      { id: 'precision', label: phrase('PRECISION', 'pointer'), title: phrase('Always behave as under a mouse: hover, menus on hover, the cursor effects') }] });
  line(g).append(ptrSeg.root);
  const offKbm = kbm.onChange((s, why) => { if (why === 'pref') ptrSeg.set(s.pref); });
  life.signal.addEventListener('abort', offKbm);
  line(g, 'gui-sws').append(swOf('glow', phrase('POINTER GLOW'), phrase('A soft light follows the pointer over lit surfaces (never on touch)')).root,
    swOf('parallax', phrase('PARALLAX'), phrase('Marked layers drift against the pointer (never on touch)')).root);
  line(g, 'gui-sws').append(swOf('dropGuides', phrase('DROP GUIDES'), phrase('The dotted guide where a dragged window will land')).root,
    Object.assign(el('div', 'sw'), { ariaHidden: 'true' }));         // an empty, invisible seat, so DROP GUIDES is as wide as the two above
  g.lastElementChild.lastElementChild.style.visibility = 'hidden';

  g = groupEl('menus', phrase('MENUS'));
  line(g).append(segOf('menuBar', phrase('MENU BAR'), [['hover', phrase('HOVER'), phrase('Show the menu bar when the pointer is over the logo')],
    ['always', phrase('ALWAYS'), phrase('Keep the menu bar visible')]]).root,
    swOf('logo', phrase('SHOW LOGO'), phrase('Show the app logo; hiding it keeps the menu bar visible')).root);

  /* LIGHT — one light: where it is, the shadow it casts, the shine across from it */
  g = groupEl('light', phrase('LIGHT', 'light source'));
  const kAngle = knobOf('lightAngle', phrase('ANGLE'), { min: 0, max: 360, wrap: true, fmt: deg, arc: true, aria: 'LIGHT ANGLE', title: '{:LIGHT ANGLE} — where the light is, clockwise from above: shadows fall away from it, the shine sits toward it, the controls’ relief turns with it' });
  const kShadow = knobOf('shadow', phrase('SHADOW'), { min: 0, max: 2, fmt: (v) => Math.round(v * 100) + '%', title: 'Strength of the pane shadow. {:DROP SHADOW} can switch it off.' });
  const kDist = knobOf('shadowDist', phrase('DISTANCE'), { min: 0, max: 24, fmt: px, title: 'How far the shadow falls from its pane (and the shine across from it)' });
  const kSoft = knobOf('shadowSoft', phrase('SOFTNESS'), { min: 0, max: 48, fmt: px, title: 'The shadow’s blur' });
  line(g, 'gui-knobs').append(kAngle.root, kShadow.root, kDist.root, kSoft.root);
  const kShine = knobOf('shine', phrase('SHINE'), { ...hundred, title: '{:SHINE} — the shadow’s opposite: a light across the pane’s edge toward the light, added to what is behind' });
  const kShineSoft = knobOf('shineSoft', phrase('SHINE SOFT'), { min: 0, max: 48, fmt: px, aria: 'SHINE SOFTNESS', title: 'The shine’s blur' });
  const kRelief = knobOf('reliefAngle', phrase('RELIEF'), { min: 0, max: 360, wrap: true, fmt: deg, arc: true, aria: 'RELIEF ANGLE', title: 'RELIEF ANGLE — where the controls’ light is: their raise and wells turn with it (the panes follow {:ANGLE})' });   // tr[RELIEF]: the controls' relief (their raised and sunken look), here the angle of its light // tr[RELIEF ANGLE]: the direction the controls' light comes from, in degrees // tr[RELIEF ANGLE — where the controls’ light is: their raise and wells turn with it (the panes follow {:ANGLE})]: raise = a control standing out; wells = sunken tracks and fields; ANGLE is the panes' light angle
  const swLink = swOf('reliefLink', phrase('LINK'), phrase('The controls take the panes’ light: one {:ANGLE} for everything'));   // tr[LINK]: a switch that joins the controls' light to the panes' light (link = tie together, not a web link) // tr[The controls take the panes’ light: one {:ANGLE} for everything]: the relief follows the pane light's ANGLE: one light for the whole interface
  swLink.root.classList.add('gui-link');
  line(g, 'gui-knobs').append(kShine.root, kShineSoft.root, kRelief.root, swLink.root);

  /* WINDOWS — the pane's rim, its drop shadow, its header apart */
  g = groupEl('windows', phrase('WINDOWS'));
  line(g, 'gui-sws').append(swOf('dropShadow', phrase('DROP SHADOW'), phrase('Pane shadows ({:SHADOW} sets their strength)')).root, swOf('edge', phrase('EDGE'), phrase('The pane’s hairline rim')).root);
  line(g, 'gui-sws').append(swOf('disconnected', phrase('DISCONNECTED'), phrase('Separate window headers from their bodies')).root,
    /* TRANSPORT BAR (BASINS Settings › DISPLAY): the main transport bar in every seat; the transport's sheet reads the class */
    swOf('transportBar', phrase('TRANSPORT BAR'), phrase('Show the main transport bar, floating or docked')).root);
  line(g).append(segOf('spacing', phrase('SPACING'), [['0', '0', phrase('Rack windows flush to each other and to the screen’s edge')], ['tight', phrase('TIGHT'), phrase('3 px between rack windows and from the edge')],
    ['default', phrase('DEFAULT'), phrase('6 px between rack windows and from the edge')], ['airy', phrase('AIRY'), phrase('16 px between rack windows and from the edge')]]).root);   // BASINS' row (settings-window.js), and AIRY
  line(g).append(segOf('rackPill', phrase('SCROLL PILL'), [['off', phrase('OFF'), phrase('No name pill while a rack scrolls')],   // tr[SCROLL PILL]: the small coloured label with a window's name shown beside it while the column of windows scrolls
    ['a', phrase('A'), phrase('While a rack scrolls, each window’s name in a pill of {:ACCENT} A beside its title bar')],
    ['b', phrase('B'), phrase('While a rack scrolls, each window’s name in a pill of {:ACCENT} B beside its title bar')]]).root);   // tr[SCROLL PILL]: the small coloured label with a window's name shown beside it while the column of windows scrolls

  /* SAMPLING (BASINS Settings › QUALITY › SAMPLING, docs/TIMELINE-SAMPLING-2026-10-01.md): how a scrub and the automation
     read the engine.  BASINS' words, its cost toasts and its note (prose: it hides with HELP) */
  g = groupEl('sampling', phrase('SAMPLING'));
  const frameMs = () => { const v = sampling.frameMs ? +sampling.frameMs() : +roFrame.root.dataset.ms; return Number.isFinite(v) ? v : 0; };
  const toAutomation = sampling.automation || ((grid) => import('../modulation/bind.js').then((m) => m.setAutomationGrid && m.setAutomationGrid(grid)).catch(() => null));
  const segAfter = (key, lbl, options, after) => bind(key, seg({ label: lbl, options: options.map(([id, l, title]) => ({ id, label: l, title })), value: P.get(key), onChange: (v) => { P.set(key, v); after(v); } }));
  line(g).append(segAfter('scrub', phrase('SCRUB'), [['live', phrase('LIVE', 'scrub'), phrase('Seek the picture on every scrub move. Smoothest when a frame is fast; can lag at a deep place.')],
    ['light', phrase('LIGHT', 'scrub'), phrase('Seek about once every three moves. The hand always stays smooth.')], ['release', phrase('RELEASE'), phrase('The picture waits until you let go. The playhead and readers move at once.')]],
  (v) => { const ms = frameMs(); if (v === 'live' && ms > 16) notice(t('the last frame took {ms} ms — scrubbing will lag; LIGHT keeps the hand smooth', { ms: Math.round(ms) })); }).root);
  line(g).append(segAfter('automation', phrase('AUTOMATION'), [['frame', phrase('FRAME', 'automation'), phrase('Sample the arrangement every rendered frame. The CLOCK tile sets how often modulation ticks at all.')],
    ['32', '1/32', phrase('Sample on a 1/32-beat grid. Values step on the grid.')], ['16', '1/16', phrase('Sample on a 1/16-beat grid. Values step on the grid.')], ['8', '1/8', phrase('Sample on a 1/8-beat grid. Values step on the grid.')]],
  (v) => { const grid = AUTOMATION_GRID[v] || 0; toAutomation(grid); if (grid) notice(t('values step on the grid')); }).root);
  label(el('div', 'gui-note gui-help', g), 'SCRUB is how the picture follows a ruler drag. AUTOMATION is how playback reads the Timeline into the engine; never during a recorded render.');

  /* ── ABOUT ── */
  const ab = el('div', 'gui-page gui-about');
  const logo = el('div', 'gui-logo', ab); logo.dataset.light = ''; logo.setAttribute('role', 'img'); ariaLabel(logo, 'MIR', null, 'name');
  const logoArt = el('div', 'gui-logo-art', logo); logoArt.dataset.parallax = '5';
  const abVer = el('div', 'gui-ab-ver', ab);
  const paintVer = () => { const th = themeOf(P.preset()); label(abVer, 'MIR {version} · SKIN {theme}', { version: MIR_VERSION, theme: th ? th.name : { t: 'CUSTOM' } }); };
  paintVer();
  label(el('div', 'gui-ab-std', ab), '{app} is an MIR Standard app', { app: appName });
  label(el('p', 'gui-ab-words', ab), MIR_WORDS);
  const fine = (parts) => richText(el('p', 'gui-ab-fine', ab), parts);
  if (about.github && safeHref(about.github)) fine([{ t: 'Source: {link}', vars: { link: [about.github.replace(/^https?:\/\//, ''), about.github] } }]);
  fine([{ t: 'MIR is free software under the GNU GPL v3.0 only (GPL-3.0-only) — no warranty.' }]);
  const F = about.fonts || '../fonts/';
  fine([{ t: 'Type: {roboto} · {title} (a renamed subset of Spinwerad by gluk) · {stix} · the notebook’s {spectral}, {playfair} and {alegreya} — all SIL OFL 1.1.',
    vars: { roboto: ['Roboto', F + 'Roboto-OFL.txt'], title: ['LW Title', F + 'Spinwerad-OFL.txt'], stix: ['STIX Two Math', F + 'STIXTwoMath-OFL.txt'], spectral: ['Spectral', F + 'info/Spectral-OFL.txt'],
      playfair: ['Playfair Display', F + 'info/PlayfairDisplay-OFL.txt'], alegreya: ['Alegreya SC', F + 'info/AlegreyaSC-OFL.txt'] } }]);
  fine([{ t: 'The MIR logo is outlined from Butler Free Extra Bold by {who}.', vars: { who: ['Fabian De Smet', 'https://www.fabiandesmet.com/'] } }]);
  for (const c of about.credits || [[{ t: '© 2026 Joshua Hosain · Magic Commons. Built by AI coding agents — Claude (Anthropic) · Gemini (Google) · GPT (OpenAI).' }]]) fine(c);

  /* the logo: the theme's file, inlined so its nine tiles can turn; ids stripped (the SVG's <title id="title"> would
     collide with the wordmark's #title) */
  const logos = {};
  const loadLogo = (theme) => {
    if (logos[theme]) return Promise.resolve(logos[theme]);
    return fetch(new URL(`./assets/mir-${theme}.svg`, import.meta.url)).then((r) => (r.ok ? r.text() : '')).then((t) => {
      const svg = t && new DOMParser().parseFromString(t, 'image/svg+xml').documentElement;
      if (!svg || svg.nodeName !== 'svg') return null;
      for (const n of [svg, ...svg.querySelectorAll('[id]')]) n.removeAttribute('id');
      svg.removeAttribute('aria-labelledby'); svg.setAttribute('aria-hidden', 'true'); svg.removeAttribute('width'); svg.removeAttribute('height');
      for (const n of svg.querySelectorAll('title, desc, metadata')) n.remove();
      return (logos[theme] = doc.importNode(svg, true));
    }).catch(() => null);
  };
  const showLogo = () => { const t = P.env().theme; loadLogo(t).then((svg) => { if (svg && P.env().theme === t && logoArt.firstChild !== svg) logoArt.replaceChildren(svg); }); };
  /* the nine tiles cycle the palette while the pointer is on the logo (BASINS brand-motion, 240 ms a step): each tile
     walks the logo's own nine colours from its own place, as a stepped animation — no timer, and none at rest */
  let turning = [];
  const STEP_MS = 240;
  logo.addEventListener('pointerenter', (e) => {
    if (!hoverable(e) || doc.documentElement.dataset.motion !== 'full') return;
    const tiles = [...logoArt.querySelectorAll('rect')]; if (tiles.length !== 9) return;
    const cols = tiles.map((t) => t.getAttribute('fill'));
    turning = tiles.map((t, i) => t.animate(cols.map((_, k) => ({ fill: cols[(i + k) % 9] })).concat([{ fill: cols[i] }]),
      { duration: STEP_MS * 9, iterations: Infinity, easing: 'steps(9, jump-none)' }));
  }, on);
  logo.addEventListener('pointerleave', () => { for (const a of turning) a.cancel(); turning = []; }, on);

  /* ── THE TWO WINDOWS (1.5.0 wave 19): MIR OPTIONS, a circled (i) in its head; MIR ABOUT, a window of its own.  Both carry
     a title bar and a plain × (createWindow chrome: 'close'), no chip rail: the whole bar drags, Escape closes.  THE HAND
     LAW: after its first placement a re-fit keeps the window's top-left where the hand left it; a screen too small for it
     scrolls the body. ── */
  let narrow = !!(win.matchMedia && win.matchMedia(NARROW).matches);
  const W = createWindow({ id: 'gui', title: 'MIR OPTIONS', host, chrome: 'close', size: { w: 1180, h: 660 }, min: { w: 280, h: 200 }, emptyDrag: '.gui-options', body: opts }); // controls own this surface, including disabled ones
  W.root.classList.add('mir-gui');
  const aboutBtn = el('button', 'mir-win-btn gui-about-btn'); aboutBtn.type = 'button'; aboutBtn.dataset.glyph = 'info';
  const ig = glyphEl('info', 'gly gly-info'); if (ig) aboutBtn.append(ig);
  ariaLabel(aboutBtn, 'MIR ABOUT'); hint(aboutBtn, 'MIR ABOUT');
  W.tools.prepend(aboutBtn);                                        // the circled (i), beside the ×

  const A = createWindow({ id: 'gui-about', title: 'MIR ABOUT', host, chrome: 'close', size: { w: 480, h: 560 }, min: { w: 280, h: 200 }, emptyDrag: true, body: ab });
  A.root.classList.add('mir-gui', 'mir-gui-about');
  const abHome = ab.parentElement;                                   // the MIR ABOUT window's body: aboutPage() lends the page out, openAbout takes it back
  const openAbout = () => { if (abHome && ab.parentElement !== abHome) abHome.appendChild(ab); if (!A.isOpen()) A.open(); A.raise(); showLogo(); fitTo(A, ab); };
  aboutBtn.addEventListener('click', openAbout, on);

  /** fitTo(w, content) — the window to its content's natural size (one layout read), capped by the screen; centred the
   *  first time, and after that its top-left stays where it is (kept on the screen).  On a phone the options window is
   *  the screen's height. */
  const placed = new WeakSet();
  function fitTo(w, content) {
    if (!w.isOpen()) return;
    const cs = getComputedStyle(w.body), edge = 2;
    const padX = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight), padY = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
    const over = w.head ? w.head.offsetHeight : 0;
    const vw = win.innerWidth, vh = win.innerHeight, r = w.rect();
    /* on a phone the menubar is always shown (menubar.js publishes its foot as --menubar-bottom): the windows start under it */
    const floor = 8 + (parseFloat(getComputedStyle(doc.documentElement).getPropertyValue('--menubar-bottom')) || 0);
    const full = Math.ceil(over + content.scrollHeight + padY + edge), tall = full > vh - floor - 8;   // too tall: the body scrolls, so its bar is added
    const cw = Math.min(Math.ceil(content.offsetWidth + padX + edge + (tall ? w.body.offsetWidth - w.body.clientWidth : 0)), vw - 16);
    const ch = w === W && narrow ? vh - floor - 8 : Math.min(full, vh - floor - 8);
    const keep = r && placed.has(w);
    const left = keep ? r.left : (vw - cw) / 2, top = keep ? r.top : (vh - ch) / 2;
    w.place({ left: Math.round(Math.max(8, Math.min(vw - cw - 8, left))), top: Math.round(Math.max(floor, Math.min(vh - ch - 8, top))), width: cw, height: ch });
    placed.add(w);
  }
  const fit = () => { fitTo(W, opts); fitTo(A, ab); };
  /** shown() — the theme in use is costed the first time OPTIONS shows */
  function shown() { const t = P.preset(); if (t !== 'custom' && !costs[t] && costFor === null) costFor = t; measureCost(); }
  const onNarrow = (e) => { narrow = e.matches; fit(); };
  const mqNarrow = win.matchMedia ? win.matchMedia(NARROW) : null;
  if (mqNarrow && mqNarrow.addEventListener) mqNarrow.addEventListener('change', onNarrow, on);

  /* ── the cost: once after a change, while OPTIONS is showing (and once after a theme is applied, window open or not) ── */
  let costRun = 0;
  /* the cost line: one sentence each way, its counts as vars and its words the readouts' own labels */
  const paintCost = () => {
    const th = P.preset(), c = costs[th];
    if (th === 'custom') label(costNote, 'CUSTOM: no theme to cost');
    else if (!c) label(costNote, 'measured when applied');
    else if (c.ms) label(costNote, '{blur} {:BLUR} · {shadow} {:SHADOW} · {shine} {:SHINE} · {ms} ms', { blur: c.blur, shadow: c.shadow, shine: c.shine, ms: c.ms.toFixed(1) });
    else label(costNote, '{blur} {:BLUR} · {shadow} {:SHADOW} · {shine} {:SHINE}', { blur: c.blur, shadow: c.shadow, shine: c.shine });
  };
  function measureCost(force) {
    if (!force && !W.isOpen()) return;
    const run = ++costRun, theme = costFor; costFor = null;
    frame.coalesce('gui:cost', () => {
      requestAnimationFrame(() => {                                 // after the change has been styled and painted
        if (run !== costRun) return;
        const c = census(doc);
        setText(roBlur.root.querySelector('.ro-val'), String(c.blur)); setText(roShadow.root.querySelector('.ro-val'), String(c.shadow + c.shine));
        roBlur.root.dataset.count = c.blur; roShadow.root.dataset.count = c.shadow + c.shine;
        const t = []; let last = 0;
        const tick = (now) => { if (run !== costRun) return; if (last) t.push(now - last); last = now; if (t.length < 30) requestAnimationFrame(tick); else {
          const ms = t.reduce((a, b) => a + b, 0) / t.length;
          setText(roFrame.root.querySelector('.ro-val'), ms.toFixed(1) + ' ms'); roFrame.root.dataset.ms = ms.toFixed(2);
          if (theme && P.preset() === theme) { costs[theme] = { ...c, ms }; paintCost(); }
        } };
        requestAnimationFrame(tick);
      });
    });
  }

  /* ── the window follows the store ── */
  function sync(state, changed) {
    for (const k of changed) { const c = controls.get(k); if (c) c.set(state[k]); }
    kRelief.setDisabled(state.reliefLink || state.relief === 'flat');
    const theme = P.preset();
    skinStep.set(theme); toneStep.setItems(toneItems(theme), theme === 'custom' ? undefined : toneOf(state, theme));
    paintVer(); paintCost();
    if (changed.includes('quality')) { paintTier(); wantTier(); }
    if (sampler && (!changed.length || changed.includes('text'))) sampler.mode(state.text === 'light' || state.text === 'dark' ? 'off' : 'auto');   // LIGHT · DARK: the ink is chosen, nothing is sampled
    const full = effectiveQuality(state.quality, tierReading && tierReading.tier) === 'full', lit = state.shadow > 0 && state.dropShadow;
    kBlur.setDisabled(!full || state.card === 'solid'); kSat.setDisabled(!full || state.card === 'solid'); kVeil.setDisabled(!full || state.card !== 'refractive');
    kHue.setDisabled(!state.tint);                                    // HUE shows only through TINT
    kBlend.setDisabled(state.faces !== 'solid');                      // BLEND moves SOLID faces toward glass (BASINS)
    kShine.setDisabled(state.quality === 'light'); kShineSoft.setDisabled(!state.shine || state.quality === 'light');
    kDist.setDisabled(!lit && !state.shine); kSoft.setDisabled(!lit);
    if (changed.includes('theme') && A.isOpen()) showLogo();
    if (changed.length) { fit(); measureCost(costFor !== null); }
  }
  const unsub = P.subscribe(sync);
  sync(P.all(), []);
  wantTier();

  return {
    root: W.root, window: W, about: A, prefs: P,
    /** open(p) — 'about' is the MIR ABOUT window; anything else (the old tab and page names too) MIR OPTIONS */
    open(p) {
      if (p === 'about') { openAbout(); return; }
      if (!W.isOpen()) { W.open(); fitTo(W, opts); }
      W.raise(); shown();
    },
    /** aboutPage(host) — MIR ABOUT's page as a page of the app's own ABOUT (λWAVES iteration 014 A1: "MIR about should be a second
     *  page to the About page"): the one node moves into `host` with its logo; MIR ABOUT's window takes it back when it opens */
    aboutPage(host) { if (A.isOpen()) A.close(); host.appendChild(ab); showLogo(); return ab; },
    /** close() — both windows */
    close() { W.close(); A.close(); },
    toggle(p) { const w = p === 'about' ? A : W; if (w.isOpen()) w.close(); else this.open(p); },
    /** page — 'about' while only MIR ABOUT is open, else 'options' */
    get page() { return A.isOpen() && !W.isOpen() ? 'about' : 'options'; },
    /** moving(b) — the app's picture is moving (FROST · STILL holds the frost while it does) */
    moving(b) { ctx.moving = !!b; P.apply(); },
    dropGuides: () => P.get('dropGuides'),
    census: () => census(doc),
    /** applyTheme(id) — a vanilla theme and its own tone; applyTone(id) — one of the current theme's tones */
    applyTheme, applyTone,
    /** themeCost(id?) — what a theme cost when it was last applied: { blur, shadow, shine, ms }, or all of them */
    themeCost: (id) => (id ? costs[id] || null : { ...costs }),
    light, parallax: plx,
    /** tier() — this device's reading ({ tier, hz, periodMs, passMs, headroom, why, … }) or null; measureTier(force) runs
     *  the benchmark (force: again, ignoring the kept reading) → a Promise of the reading */
    tier: () => (tierReading ? { ...tierReading } : null),
    measureTier: (force = false) => runTier(force),
    /** sampling() → { scrub, grid }: the SCRUB level (for createTransportController({ scrubLevel })) and the automation
     *  grid in beats (0 = every frame) for the modulation host at install */
    sampling: () => ({ scrub: P.get('scrub'), grid: AUTOMATION_GRID[P.get('automation')] || 0 }),
    destroy() { unsub(); life.abort(); costRun++; frame.cancel('gui:cost'); if (tierTimer) win.clearTimeout(tierTimer); if (unpart) unpart(); light.destroy(); plx.destroy(); W.destroy(); A.destroy(); if (!prefs) P.destroy(); },
  };
}
