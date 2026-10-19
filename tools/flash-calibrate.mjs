#!/usr/bin/env node
/* 0.5.1 D10-19 · U8 — THE FLASH GUARD's calibration.  The limiter counts swings of `delta × span` in a route's own units
 * (lab/mir/shell/flash-guard.js).  This derives, from lab/field.js' own tone formulas and lab/rack.js' defaults, the parameter
 * step that moves the picture's relative luminance by 10 % at the route's default — in the map's own space (ln for a log
 * route) — so lab/flash-routes.js can set ranges[route] = [0, step / delta].  `node tools/flash-calibrate.mjs` prints them
 * with the checks; tests/flash-routes.test.mjs holds the lab's numbers to `steps()`.
 *
 * THE RULE (the brief's, one for all four): the step that changes a pixel's relative luminance L by 10 % of itself, taken where
 * that is also ≈ the WCAG delta (0.1 of the maximum) — at the pixel/state where L is highest for that route.  The shader's
 * output `o` is the proxy for L (the canvas encoding's sRGB curve is not modelled; the field judge, which reads pixels, is the
 * exact one — a 0.5.x row).
 *
 *   exposure   field.js: sigma = 24·exposure; a = 1 − exp(−wEff·sigma·stepN·4) per step.  Optical depth τ ∝ exposure, so a thin
 *              cloud's radiance is LINEAR in exposure (and every thicker one is sub-linear): ×1.1 is the most a 10 % step can
 *              give.  Step = ln 1.1 (log route).
 *   gamma      field.js: o = pow(col + bg·bgBlend, 1/gamma).  At mid-grey 0.5 and gamma 1 (the default): o = 0.5 → 0.45 is the
 *              darker, smaller step (0.55 is the larger); Δgamma = ln 0.5 / ln 0.45 − 1 (linear route).
 *   stage      rack.js setStageMix: mat.bg = ground + (custom − ground)·mix (when FOLLOW THEME is off; it is a bypass otherwise).
 *              field.js paints bg·(0.82..1.25) and the same factor scales both L and dL, so the relative step is independent of
 *              it.  dL/dmix = Y(custom) − Y(ground); the LIGHT ground (L ≈ 0.92) is where a stage swing is a flash — the dark
 *              ground's whole range is ΔL = 0.10, so 10 % of its own L is 0.004 and can never be one.  Linear route.
 *   knee       iteration 008 G — THE KNEE is on the ACCUMULATED opacity (field.js kneeT): a ray's transmittance is the q-exponential
 *              T_q(τ) = (1 + qτ)^(−1/q), q = ln(knee/0.6), so a step in ln(knee) is the same step in q; 0.6 (q = 0) is exp(−τ), and the
 *              default (008 Q: KNEE 3, q0 = ln 5, the soft shoulder) is the operating point the step is taken at.  L = 1 − T_q(τ) for a
 *              unit-colour cloud over a black ground; the step is the smallest |Δq| from q0 that moves L by 10 % of itself on SOME
 *              ray (the worst τ, searched), the smaller of the soft (+) and hard (−) side.  The old per-step knee w/(1 + knee·w) is
 *              fixed at 0.6 (STEP_KNEE, the formula) and moves nothing.  Log route.
 */
import { pathToFileURL } from 'node:url';

const Y = (c) => 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
const DARK = [0.028, 0.038, 0.058], LIGHT = [0.93, 0.95, 0.975], CUSTOM = [0.12, 0.14, 0.18];   // rack.js THEMES.bg, mat.stageCustom
const STAGE0 = 0.04, KNEE0 = 3, GAMMA0 = 1, MID = 0.5, REL = 0.1;                                // rack.js: stageMix, mat.knee (field.js KNEE_DEFAULT, 008 Q), mat.gamma
const Q0 = Math.log(KNEE0 / 0.6), STEP_KNEE = 0.6;                                            // the default's q; the shader's fixed per-step bound
/** field.js kneeT, in f64 */
export function kneeT(tau, q) { const x = q * tau; if (Math.abs(x) < 1e-9) return Math.exp(-tau); if (x <= -1) return 0; return Math.exp(-Math.log1p(x) / q); }
const TAUS = Array.from({ length: 400 }, (_, i) => 1e-4 * Math.pow(6e5, i / 399));             // 1e-4 … 60, the optical depths a ray can hold
/** the largest relative move of L = 1 − T over every τ when q goes q0 → q0 + dq */
const kneeMove = (dq) => Math.max(...TAUS.map((t) => Math.abs((1 - kneeT(t, Q0 + dq)) / (1 - kneeT(t, Q0)) - 1)));
/** the |dq| on one side (sign ±1) where that move first reaches REL: bisection */
function kneeSide(sign) { let lo = 0, hi = 3; for (let i = 0; i < 80; i++) { const m = (lo + hi) / 2; if (kneeMove(sign * m) < REL) lo = m; else hi = m; } return (lo + hi) / 2; }

export function steps() {
  const dY = Y(CUSTOM) - Y(LIGHT), L0 = Y(LIGHT) + dY * STAGE0;                                  // the light ground, mix 0.04
  const gammaDown = GAMMA0 * Math.log(MID) / Math.log(MID * (1 - REL)) - GAMMA0;                  // 1/γ' = ln0.45/ln0.5 → γ' < 1
  return {
    'material.exposure': Math.log(1 + REL),
    'material.gamma': Math.abs(gammaDown),
    'material.stage': Math.abs(REL * L0 / dY),
    'material.knee': Math.min(kneeSide(1), kneeSide(-1)),                                       // Δq = Δln(knee)
  };
}

/** the checks: the exposure step never moves a pixel more than 10 %, and neither does the knee step on a real ray */
export function checks() {
  const L = (tau, yb = 0) => (1 - Math.exp(-tau)) + Math.exp(-tau) * yb;                          // a unit-colour cloud over a ground yb
  let expMax = 0; for (let tau = 1e-6; tau < 40; tau *= 1.25) expMax = Math.max(expMax, L(tau * 1.1) / L(tau) - 1);
  const S = steps(), kd = S['material.knee'];
  /* a Gaussian ray through the box: w = pow(rho, soft) along 160 steps, tau = 96·exposure·Σ wEff·stepN (the per-step bound fixed at 0.6);
     the knee moved by ±kd from the default bends the ray's transmittance T_q0(τ) → T_(q0±kd)(τ) */
  const tau = (e, soft, peak) => { let s = 0; for (let i = 0; i < 160; i++) { const x = (i + 0.5) / 160 * 6 - 3, w = Math.pow(peak * Math.exp(-x * x), soft); s += w / (1 + STEP_KNEE * w) / 160; } return 96 * e * s; };
  let kneeMax = 0;
  for (const e of [0.08, 0.3, 1, 3, 12]) for (const soft of [0.5, 0.7, 1.5]) for (const peak of [1, 0.3, 0.05]) for (const sgn of [1, -1]) {
    const t = tau(e, soft, peak), a = 1 - kneeT(t, Q0), b = 1 - kneeT(t, Q0 + sgn * kd);
    kneeMax = Math.max(kneeMax, Math.abs(b / a - 1));
  }
  const gamma = (g) => Math.pow(MID, 1 / g);
  return { exposureMax: expMax, kneeMax, gammaUp: gamma(GAMMA0 + steps()['material.gamma']) / MID - 1, gammaDown: 1 - gamma(GAMMA0 - steps()['material.gamma']) / MID,
    stageLight: steps()['material.stage'] * Math.abs(Y(CUSTOM) - Y(LIGHT)), stageDark: steps()['material.stage'] * Math.abs(Y(CUSTOM) - Y(DARK)) };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const S = steps(), C = checks();
  for (const [id, v] of Object.entries(S)) console.log(id.padEnd(20), v.toFixed(4), '→ ranges = [0, ' + (v / 0.1).toFixed(3) + ']');
  console.log(JSON.stringify(C, (k, v) => (typeof v === 'number' ? +v.toFixed(4) : v)));
}
