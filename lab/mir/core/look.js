/* MIR · core/look.js — the look's arithmetic: BASINS' glass formulas, the one light, the SOLID pane's ink.  Pure.
 *
 * WHAT IT IS.  The GUI window's store (shell/gui.js, core/prefs.js) turns options into writes; the numbers those writes
 * carry are computed here, so they are node-tested and decided in one place.  Nothing here touches the DOM.
 *
 * THE LAWS IT KEEPS
 *   · HARVESTED, NOT RESTYLED.  glassTint and glassVeil are BASINS' `applyGlass` (app/skin.js, 2026-10-01) to the
 *     digit: the tint's lightness moves 40 points per BRIGHT, its hue goes to HUE and its saturation to 70 % by TINT,
 *     times SATURATION; the veil is the theme's signed whiteness plus ½·BRIGHT, coloured toward HUE by TINT.
 *     paneShadow is BASINS' ABOUT material shadow (surface-material.js projectMaterial) at SHADOW's amount.
 *   · HOME WRITES NOTHING.  Each function returns null where the kit's own value should stand.
 *   · ONE LIGHT.  LIGHT ANGLE is where the light is, in degrees clockwise from straight up (0 = above, 315 = upper
 *     left).  A shadow falls away from it, the shine sits toward it.  The sheets draw both with CSS sin()/cos() from
 *     `--light-angle`; lightOffset() is the same arithmetic for a test or a script.
 *
 * Exports: THEME_GLASS, hslRgb, glassTint, glassVeil, paneShadow, lightOffset, lightIsHome, paneLightness, solidInk, SPACING, spacingPx,
 *          LIGHT_HOME, autoInk; the device (alpha.12): isMobile, isIPad, TOUCH_TABLET_MQ, BLUR_DESKTOP, BLUR_TOUCH,
 *          firstRunBlur, DEVICE_BLUR, TIER_LAW, classifyTier, qualityOfTier.  The device tests read `navigator` and
 *          `matchMedia` only when they are not handed them. */
import { hslToRgb01 } from '../palette.js';

/** the theme's own glass, as the kit ships it (skin.css :root and body[data-theme="light"]): the tinted pane's H S L
 *  and the refractive frost's veil as a signed whiteness (+ white, − black) — BASINS skin.js THEME_GLASS, verbatim */
export const THEME_GLASS = Object.freeze({ light: { h: 214, s: 22, l: 93, veil: 0.10 }, dark: { h: 214, s: 16, l: 13, veil: -0.10 } });
/** where the light settings write nothing (the kit's own shadows stand) */
export const LIGHT_HOME = Object.freeze({ lightAngle: 0, shadow: 1, shadowDist: 2, shadowSoft: 8, shine: 0, shineSoft: 12 });

const T = (theme) => THEME_GLASS[theme] || THEME_GLASS.dark;
const num = (v, d) => (Number.isFinite(+v) ? +v : d);

/** hslRgb(h°, s 0…1, l 0…1) → [r, g, b] 0…255 (BASINS skin.js hslRgb) */
export function hslRgb(h, s, l) { return hslToRgb01(h, s, l).map((v) => 255 * v); }

/** glassTint({ bright, hue, tint, saturation }, theme) → the `H S% L%` triple the kit reads as --glass-tint, or null at
 *  home (BRIGHT 0, TINT 0, SATURATION 100 %).  BASINS applyGlass: h = TINT > 0 ? HUE : the theme's;
 *  s = min(100, (theme s + TINT·(70 − theme s))·SATURATION); l = clamp(theme l + 40·BRIGHT, 2, 98). */
export function glassTint(o, theme) {
  const bright = num(o.bright, 0), tint = num(o.tint, 0), sat = num(o.saturation, 1), t = T(theme);
  if (!bright && !tint && sat === 1) return null;
  const h = tint > 0 ? Math.round(num(o.hue, 0)) : t.h;
  const s = +Math.min(100, (t.s + tint * (70 - t.s)) * sat).toFixed(1);
  const l = +Math.max(2, Math.min(98, t.l + 40 * bright)).toFixed(1);
  return `${h} ${s}% ${l}%`;
}

/** glassVeil({ veil, bright, hue, tint, saturation }, theme, homeVeil) → the REFRACTIVE pane's veil as `rgb(r g b / a)`,
 *  or null at home (VEIL at the kit's house value, BRIGHT 0, TINT 0: the house veils stand).  VEIL is 0…60 (%).
 *  BASINS applyGlass: v = clamp(VEIL·(light ? +1 : −1) + ½·BRIGHT, ±.6); the colour is white (v ≥ 0) or black, mixed
 *  toward hsl(HUE, min(1, .8·SATURATION), .55) by .85·TINT; the alpha is max(|v|, .3·TINT). */
export function glassVeil(o, theme, homeVeil = 10) {
  const veil = num(o.veil, homeVeil), bright = num(o.bright, 0), tint = num(o.tint, 0), sat = num(o.saturation, 1);
  if (veil === homeVeil && !bright && !tint) return null;
  const v = Math.max(-0.6, Math.min(0.6, (veil / 100) * (theme === 'light' ? 1 : -1) + 0.5 * bright));
  const base = v >= 0 ? 255 : 0, hue = hslRgb(num(o.hue, 0), Math.min(1, 0.8 * sat), 0.55), k = 0.85 * tint;
  const rgb = hue.map((c) => Math.round(base * (1 - k) + c * k));
  return `rgb(${rgb.join(' ')} / ${Math.max(Math.abs(v), 0.3 * tint).toFixed(3)})`;
}

/** lightOffset(angle°, distance) → { x, y } of the shadow (away from the light); the shine is { −x, −y } */
export function lightOffset(angle, d = 1) {
  const r = (num(angle, 0) * Math.PI) / 180;
  const z = (v) => (Math.abs(v) < 1e-9 ? 0 : +v.toFixed(4));
  return { x: z(-Math.sin(r) * d), y: z(Math.cos(r) * d) };
}

/** paneShadow({ shadow, lightAngle, shadowDist, shadowSoft }, theme) → BASINS' ABOUT material shadow at the pane
 *  height, as the sheets draw it under html[data-cast] (for tests and docs: the sheet is the drawing).  BASINS:
 *  inset 0 1px 0 white .12 (dark) / .55 (light), 0 2px 8px black .20·s / .10·s, 0 1px 2px black .12·s / .06·s. */
export function paneShadow(o, theme) {
  const s = num(o.shadow, 1), d = num(o.shadowDist, 2), soft = num(o.shadowSoft, 8), dark = theme !== 'light';
  if (s === 0) return '0 0 0 0 transparent';
  const px = (v) => +v.toFixed(4) + 'px', a = lightOffset(o.lightAngle, d), c = lightOffset(o.lightAngle, d / 2), i = lightOffset(o.lightAngle, 1);
  return `inset ${px(i.x)} ${px(i.y)} 0 rgb(255 255 255 / ${dark ? 0.12 : 0.55}), ${px(a.x)} ${px(a.y)} ${px(soft)} rgb(0 0 0 / ${+((dark ? 0.20 : 0.10) * s).toFixed(3)}), `
    + `${px(c.x)} ${px(c.y)} ${px(soft / 4)} rgb(0 0 0 / ${+((dark ? 0.12 : 0.06) * s).toFixed(3)})`;
}

/** lightIsHome(state) — every light setting at home: the store writes nothing and the kit's own shadows stand */
export function lightIsHome(s) { return Object.entries(LIGHT_HOME).every(([k, v]) => num(s[k], v) === v); }

/** paneLightness(state, theme) → the SOLID pane's lightness, 0…100 (BRIGHT moves the theme's own) */
export function paneLightness(o, theme) { return Math.max(2, Math.min(98, T(theme).l + 40 * num(o.bright, 0))); }
/** solidInk(state, theme) → 'light' (white ink) on a dark pane, 'dark' (black ink) on a light one: no sampling */
export function solidInk(o, theme) { return paneLightness(o, theme) > 55 ? 'dark' : 'light'; }

/** SPACING, BASINS' three levels (app/skin.js SPACING, Josh 2026-10-01) and one more: px for [the gap between rack
 *  windows, the rack's inset from the screen's edge, the padding inside a pane, the gap in a docked chip rail].  A pane's
 *  padding never goes under 6 px, so no control touches its edge.  0 is flush (square panes, no shadow inside the slab).
 *  AIRY is this kit's invention, after DEFAULT.  The kit before SPACING was 10 · 10 · 7–10. */
export const SPACING = Object.freeze({ 0: [0, 0, 6, 0], tight: [3, 3, 6, 2], default: [6, 6, 8, 4], airy: [16, 16, 9, 6] });
/** spacingPx(level) → { gap, inset, pad, rail } in px (an unknown level is DEFAULT) */
export function spacingPx(level) {
  const [gap, inset, pad, rail] = SPACING[level] || SPACING.default;
  return { gap, inset, pad, rail };
}

/** solidRelief(state, theme) → { lift, sink, gain } — the SOLID relief's mixes as functions of the pane's lightness L
 *  (0…100), so a dark pane lifts as clearly as a light one.  The highlight is the pane mixed toward white enough to rise
 *  ΔL = 8 + 20·(1 − L/100) (more on a dark pane), the shade toward black enough to fall ΔL = 6 + 14·L/100 (more on a
 *  light one): lift = ΔL/(100 − L), sink = ΔL/L, as percentages.  gain multiplies the shine: 1 + 1.2·(1 − L/100). */
export function solidRelief(o, theme) {
  const L = paneLightness(o, theme), pct = (v) => Math.round(Math.max(0, Math.min(1, v)) * 1000) / 10;
  return { lift: pct((8 + 20 * (1 - L / 100)) / Math.max(1, 100 - L)), sink: pct((6 + 14 * L / 100) / Math.max(1, L)), gain: +(1 + 1.2 * (1 - L / 100)).toFixed(3) };
}

/* ── THE DEVICE (1.5.0-alpha.12, BASINS skin.js isMobile / newUserBlur / syncTablet, settings.js §2) ─────────────────── */
/** isMobile(nav, matchMedia) — BASINS' test, verbatim: a touch-first phone or tablet (an iPad that says it is a Mac
 *  included), or a page with no hover and a coarse pointer.  Desktops, Safari on a Mac included, are not. */
export function isMobile(nav = globalThis.navigator, mm = globalThis.matchMedia ? (q) => globalThis.matchMedia(q) : null) {
  try {
    if (!nav) return false;
    const ua = nav.userAgent || '';
    if (nav.userAgentData && nav.userAgentData.mobile) return true;
    if (/Android|iPhone|iPad|iPod|Mobile/i.test(ua) || (nav.platform === 'MacIntel' && nav.maxTouchPoints > 1)) return true;
    return !!(mm && mm('(hover: none) and (pointer: coarse)').matches);
  } catch (_) { return false; }
}
/** isIPad(nav) — an iPad, even one that says it is a Mac (BASINS syncTablet) */
export function isIPad(nav = globalThis.navigator) { return !!nav && (/iPad/i.test(nav.userAgent || '') || (nav.platform === 'MacIntel' && nav.maxTouchPoints > 1)); }
/** TOUCH_TABLET_MQ — the other half of body.touch-tablet: a coarse pointer anywhere and a screen wider than a phone */
export const TOUCH_TABLET_MQ = '(any-pointer: coarse) and (min-width: 701px)';
/** the first-run blur, px: Josh (2026-09-26): "New users get 4px blur on desktop and 20px blur on Apple devices (because
 *  for some reason the blur is less intense there)"; ruled 2026-10-02: a desktop starts at FROST's 11 px, a touch device
 *  at 20 px (BASINS' newUserBlur ceiling, the WebKit maximum) */
export const BLUR_DESKTOP = 11, BLUR_TOUCH = 20;
export const firstRunBlur = (mobile = isMobile()) => (mobile ? BLUR_TOUCH : BLUR_DESKTOP);
/** DEVICE_BLUR — read once, when the kit loads (BASINS reads its FRESH test once, at import) */
export const DEVICE_BLUR = firstRunBlur();

/** THE DEVICE TIER — BASINS settings.js §2, "the device-relative law": a device is judged AGAINST ITSELF.  headroom = its
 *  own panel period ÷ the cost of its own pass; A needs headroom ≥ 3 on a ≥ 90 Hz panel, B ≥ 1.5, C is the rest.  The
 *  whole benchmark fits in 3 s and runs once per device. */
export const TIER_LAW = Object.freeze({ HEAD_A: 3, HEAD_B: 1.5, HZ_A: 90, BUDGET_MS: 3000, VERSION: 1 });
/** classifyTier(hz, headroom) → 'A' | 'B' | 'C' (BASINS `classify`); nothing measured is B, the honest middle */
export function classifyTier(hz, headroom, law = TIER_LAW) {
  if (!(headroom > 0)) return 'B';
  if (headroom >= law.HEAD_A && hz >= law.HZ_A) return 'A';
  if (headroom >= law.HEAD_B) return 'B';
  return 'C';
}
/** qualityOfTier(tier) → the QUALITY that AUTO stands for: BASINS seeds its glass FULL on A and B and OFF on C, so A and B
 *  are FULL and C is BALANCED (the kit's tier with no blur anywhere: BASINS' "a flat panel") */
export const qualityOfTier = (t) => (t === 'C' ? 'balanced' : 'full');

/** autoInk(state, theme) → what TEXT · AUTO writes on <body data-text>: on a SOLID pane the pane's lightness decides
 *  (solidInk); under glass (REFRACTIVE, or FROST on a tinted pane) BASINS' unsampled seat, the pure ladder in the mode's
 *  polarity ('light' ink in dark, 'dark' in light); on a TINTED pane with no frost nothing (the house ladder). */
export function autoInk(o, theme) {
  if (o.card === 'solid') return solidInk(o, theme);
  if (o.card === 'refractive' || (o.frost && o.frost !== 'off')) return theme === 'light' ? 'dark' : 'light';
  return null;
}
