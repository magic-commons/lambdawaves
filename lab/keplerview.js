/* keplerview.js — the KEPLER overlay: the classical orbit each populated shell carries, drawn over the quantum cloud.
 *
 * The ellipse comes from the exact expectation values (kepler.js); the drawing uses the FIELD's camera so it sits
 * in the same space as the cloud.  Marked on it: the perihelion (toward ⟨K⟩) and the classical time-averaged
 * position, which is exactly the quantum ⟨x⟩ of the shell (Pauli).  Position space only.
 */
import { toScreen } from './field.js';
import { keplerOrbits, orbitPoints } from './kepler.js';
import { vividInk, showGraphTip, hideGraphTip, fitText } from './mir/kit.js';
import { HELP_CLASSES, HELP_HOVER_DELAY } from './mir/control-help.js';

const N_RGB = { 2: [255, 190, 90], 3: [120, 225, 240], 4: [200, 140, 255], 5: [140, 240, 160], 6: [255, 120, 150] };

export function createKepler(canvas) {
  const cv = canvas, g = cv.getContext('2d');
  let on = false, orbits = [], lastKey = '';
  let handles = [], hover = null;                       // the perihelion handles of the last draw (canvas pixels), and the hovered one
  let lastPointer = null;                               // where the rack last asked hit(): the tip goes there
  /* WAVE 46 — the caption used to carry every orbit's numbers in one line ("n2 a=4 e=0.833 L_orbit=1.73 vs
     ⟨L⟩=1.73 T=2π·8 · n3 …"), which ran off the stage as soon as two shells were lit.  The caption keeps the
     LAW and the legend; each orbit's numbers are on its own perihelion handle, through the shared tip.  This
     canvas is pointer-events: none, so the rack's own hit()/setHover() route drives it — no rack.js change. */
  function recompute(reg, t) {
    const key = `${reg.version}|${reg.field.Fz !== 0 ? t.toFixed(3) : 0}`;
    if (key === lastKey) return;
    lastKey = key;
    const c = reg.field.Fz !== 0 ? reg.at(t) : { re: reg.re0, im: reg.im0 };
    orbits = keplerOrbits(c.re, c.im, 0.01);
  }
  function draw(obs, half) {
    const W = cv.clientWidth, H = cv.clientHeight, dpr = Math.min(2, window.devicePixelRatio || 1);
    if (W < 32 || H < 32) return;
    if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
    g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
    handles = [];
    if (!on || !orbits.length) return;
    const S = toScreen(obs, half, W, H), proj = (p) => S.at(p[0], p[1], p[2]);
    let label = [];
    for (const { share, orbit: o } of orbits) {
      if (o.isotropic) { label.push(`n${o.n} isotropic`); continue; }
      if (o.coherence < 0.5) { label.push(`n${o.n}: no classical orbit (coherence ${o.coherence.toFixed(2)} < ½)`); continue; }   // the mean vectors of an incoherent shell are not an orbit (Round 11 A5)
      const rgb = vividInk(N_RGB[o.n] || [255, 255, 255]), alpha = 0.35 + 0.6 * Math.min(1, share);
      const pts = orbitPoints(o, 160);
      g.strokeStyle = `rgba(${rgb.join(',')},${alpha})`; g.lineWidth = 1.6; g.setLineDash(o.coherence > 0.98 ? [] : [5, 4]);
      g.beginPath(); let started = false;
      for (const pt of pts) { const q = proj(pt); if (!q) { started = false; continue; } if (!started) { g.moveTo(q[0], q[1]); started = true; } else g.lineTo(q[0], q[1]); }
      if (o.e < 1 - 1e-9) g.closePath();
      g.stroke(); g.setLineDash([]);
      const per = proj(o.perihelion), mean = proj(o.meanPosition);
      if (per) { g.fillStyle = `rgba(${rgb.join(',')},${alpha})`; g.beginPath(); g.arc(per[0], per[1], 3.2, 0, 2 * Math.PI); g.fill();
        handles.push({ n: o.n, x: per[0], y: per[1], orbit: o, share,
          info: `n${o.n}  ·  a = ${o.a} a₀  ·  e = ${o.e.toFixed(3)}  ·  L_orbit = ${o.Lorbit.toFixed(2)} vs ⟨L⟩ = ${o.absL.toFixed(2)}  ·  T = 2π·${o.n ** 3}${o.coherence > 0.98 ? '' : `  ·  dashed: not coherent (${o.coherence.toFixed(2)})`}` });
        if (hover && hover.n === o.n) { g.strokeStyle = 'rgba(255,255,255,0.9)'; g.lineWidth = 1.2; g.beginPath(); g.arc(per[0], per[1], 9, 0, 2 * Math.PI); g.stroke(); } }
      if (mean) { g.strokeStyle = 'rgba(255,255,255,0.9)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(mean[0] - 5, mean[1]); g.lineTo(mean[0] + 5, mean[1]); g.moveTo(mean[0], mean[1] - 5); g.lineTo(mean[0], mean[1] + 5); g.stroke(); }
    }
    g.fillStyle = document.body.dataset.theme === 'light' ? 'rgba(20,30,50,0.62)' : 'rgba(255,255,255,0.45)'; g.font = '9px ui-monospace, monospace'; g.textAlign = 'left';
    const cx = document.body.classList.contains('rack-l') ? 12 + (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--rack-w')) || 300) + 8 : 12;
    /* the caption is the LAW and the legend, measured into the stage it has: the numbers are on the handles */
    if (!document.body.classList.contains('no-captions'))
      fitText(g, `KEPLER${label.length ? ' · ' + label.join(' · ') : ''} · dot = perihelion (⟨K⟩) — drag it: around = D(R) about L̂, in/out = e^{−iθK} (exact rotors on the state) · cross = ⟨x⟩ (exact)`,
        cx, H - 128, { x0: cx, y0: 0, x1: W - 12, y1: H }, 'left', true);
  }
  /** Clear the transparent overlay without collapsing it.  Outside hydrogen's overlay domain
   *  there is no Kepler scene to redraw beneath an active impulse, but the impulse still needs a
   *  clean frame; otherwise every arrow and text raster remains and the gesture turns into a trail. */
  function clear() {
    const W = cv.clientWidth, H = cv.clientHeight, dpr = Math.min(2, window.devicePixelRatio || 1);
    if (W < 32 || H < 32) return;
    if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, W, H);
    handles = [];
  }
  /* ── THE IMPULSE VECTOR (wave 53; `bow` is still its name in the code), redrawn at iteration 008 K (Josh: "remove the verbosity
     and obvious controls and instead show k = and λ = in a math font, improve the dotted line and arrow look").
     It is NOT drawn on this canvas any more: a picture composites #kepler (capture.js `overlays`), and a held gesture must never
     reach a picture or a film.  It is its own DOM layer beside the canvas, built at the first hold and written only while one is
     held: the GUIDE (the pull, origin → pointer) an even dash in the ink's weight, fitted to its own length so it starts and ends
     on a dash; the HUB at the origin; both in the ink, white under `mix-blend-mode: difference` as the ATOM LABELS are, so they
     invert whatever is beneath them.  The ARROW (origin → away from the pull, its length k's as before) is the kit's accent, a
     solid shaft and a swept filled head, no glow.  THE WORDS are two short lines in the math face at the arrow's head —
     `k = 0.123 a.u.` and `λ = 51.2 a₀` — anchored on the side the arrow points to, so they sit across the origin from the
     pointer, clamped into the stage and moved off the pointer if the clamp put them under it.  The instructions left the stage:
     the window's HELP text says Ctrl-drag (STATE's Impulse note), and the hover hint — the kit's tip, after the hand rests
     HELP_HOVER_DELAY ms during a hold, never with CONTROL HINTS off — says how to apply and how to cancel. */
  let bow = null, imp = null, impKey = '', restTimer = 0, restAt = '';
  const SVG = 'http://www.w3.org/2000/svg', svgEl = (tag, cls, parent) => { const n = document.createElementNS(SVG, tag); n.setAttribute('class', cls); parent.appendChild(n); return n; };
  const DASH = 5, GAP = 4, HUB = 3, HEAD_L = 11, HEAD_W = 5;       // the ink's dash, the hub's radius, the head's length and half-width (px)
  const HINT = 'release to apply · release Ctrl first to cancel';
  function impLayer() {
    if (imp && imp.root.isConnected) return imp;
    const root = document.createElement('div'); root.id = 'impulse'; root.className = 'lw-impulse'; root.setAttribute('aria-hidden', 'true'); root.hidden = true;
    const ink = svgEl('svg', 'imp-ink', root), acc = svgEl('svg', 'imp-acc', root);
    const guide = svgEl('line', 'imp-guide', ink), hub = svgEl('circle', 'imp-hub', ink); hub.setAttribute('r', HUB);
    const shaft = svgEl('line', 'imp-shaft', acc), head = svgEl('path', 'imp-head', acc);
    const words = document.createElement('div'); words.className = 'imp-words'; root.appendChild(words);
    const kLine = document.createElement('div'), lLine = document.createElement('div'); kLine.className = lLine.className = 'imp-line'; words.append(kLine, lLine);
    cv.after(root);
    return (imp = { root, guide, hub, shaft, head, words, kLine, lLine, text: '', ww: 0, wh: 0 });
  }
  const lambdaOf = (k) => { if (!(k > 0.001)) return '∞'; const l = 2 * Math.PI / k; return l >= 1000 ? l.toFixed(0) : l.toPrecision(3); };
  function restHint(on) {
    clearTimeout(restTimer); restTimer = 0;
    if (!imp) return;
    hideGraphTip(imp.root);
    if (!on || document.body.classList.contains(HELP_CLASSES.hintsOff)) return;
    restTimer = setTimeout(() => { restTimer = 0; if (!bow || !imp) return; const r = cv.getBoundingClientRect(); showGraphTip(imp.root, HINT, r.left + bow.x1, r.top + bow.y1); }, HELP_HOVER_DELAY);
  }
  function setBow(b) {
    bow = b;
    if (!b) { impKey = ''; restAt = ''; restHint(false); if (imp && !imp.root.hidden) imp.root.hidden = true; return; }
    impLayer();
    const at = `${b.x1}|${b.y1}`; if (at !== restAt) { restAt = at; restHint(true); }   // the hand moved: the hint steps aside and waits for it to rest
  }
  function bowFrame() {
    if (!bow) { if (imp && !imp.root.hidden) imp.root.hidden = true; return; }
    const W = cv.clientWidth, H = cv.clientHeight;
    if (W < 32 || H < 32) return;
    const I = impLayer(), { x0, y0, x1, y1, k } = bow;
    const key = `${x0}|${y0}|${x1}|${y1}|${k}|${W}|${H}`;
    if (key === impKey && !I.root.hidden) return;                     // written only when the hold moved: the loop calls this every frame
    impKey = key; I.root.hidden = false;
    const f = (v) => v.toFixed(1);
    /* the GUIDE: origin → pointer, clear of the hub, an integer number of dash periods (a dash at each end) */
    const gx = x1 - x0, gy = y1 - y0, gl = Math.hypot(gx, gy), gs = HUB + 3;
    if (gl > gs + 2) {
      const ex = gx / gl, ey = gy / gl, L = gl - gs, n = Math.max(1, Math.round((L + GAP) / (DASH + GAP))), sc = (L + GAP) / (n * (DASH + GAP));
      I.guide.setAttribute('x1', f(x0 + ex * gs)); I.guide.setAttribute('y1', f(y0 + ey * gs)); I.guide.setAttribute('x2', f(x1)); I.guide.setAttribute('y2', f(y1));
      I.guide.setAttribute('stroke-dasharray', L < DASH * 1.5 ? 'none' : `${(DASH * sc).toFixed(2)} ${(GAP * sc).toFixed(2)}`);
      I.guide.removeAttribute('visibility');
    } else I.guide.setAttribute('visibility', 'hidden');
    I.hub.setAttribute('cx', f(x0)); I.hub.setAttribute('cy', f(y0));
    /* the ARROW: away from the pull, its length k's (as before: 30 px + 70 px per a.u., at most 160); straight up before any pull */
    const ux = gl > 0.5 ? -gx / gl : 0, uy = gl > 0.5 ? -gy / gl : -1, len = Math.min(160, 30 + 70 * k);
    const ax = x0 + ux * len, ay = y0 + uy * len, bx = ax - ux * HEAD_L, by = ay - uy * HEAD_L, nx = ax - ux * HEAD_L * 0.72, ny = ay - uy * HEAD_L * 0.72;
    I.shaft.setAttribute('x1', f(x0 + ux * (HUB + 2))); I.shaft.setAttribute('y1', f(y0 + uy * (HUB + 2))); I.shaft.setAttribute('x2', f(nx)); I.shaft.setAttribute('y2', f(ny));
    I.head.setAttribute('d', `M${f(ax)} ${f(ay)}L${f(bx - uy * HEAD_W)} ${f(by + ux * HEAD_W)}L${f(nx)} ${f(ny)}L${f(bx + uy * HEAD_W)} ${f(by - ux * HEAD_W)}Z`);
    /* THE WORDS: the numbers only, in the math face; measured when the string changes */
    const kt = `k = ${k.toFixed(3)} a.u.`, lt = `λ = ${lambdaOf(k)} a₀`;
    if (kt + lt !== I.text) { I.text = kt + lt; I.kLine.textContent = kt; I.lLine.textContent = lt; I.ww = I.words.offsetWidth; I.wh = I.words.offsetHeight; }
    const ww = I.ww, wh = I.wh, gap = 10, px = ax + ux * gap, py = ay + uy * gap;
    /* the anchor follows the arrow's compass: start / centre / end across, top / middle / bottom down */
    let lx = Math.abs(ux) < 0.38 ? px - ww / 2 : ux > 0 ? px : px - ww, ly = Math.abs(uy) < 0.38 ? py - wh / 2 : uy > 0 ? py : py - wh;
    const M = 8, clampX = (v) => Math.max(M, Math.min(W - M - ww, v)), clampY = (v) => Math.max(M, Math.min(H - M - wh, v));
    lx = clampX(lx); ly = clampY(ly);
    const under = (x, y) => x1 > x - 12 && x1 < x + ww + 12 && y1 > y - 12 && y1 < y + wh + 12;
    if (under(lx, ly)) {                                               // the clamp pushed them under the hand: beside the shaft instead
      const mx = (x0 + ax) / 2, my = (y0 + ay) / 2, off = Math.max(ww, wh) / 2 + gap + 6;
      for (const s of [1, -1]) { const cx = clampX(mx - uy * s * off - ww / 2), cy = clampY(my + ux * s * off - wh / 2); if (!under(cx, cy)) { lx = cx; ly = cy; break; } }
    }
    I.words.style.transform = `translate(${f(lx)}px, ${f(ly)}px)`;
  }
  function update(reg, t, obs, half) { recompute(reg, t); draw(obs, half); }
  function suspend() {
    handles = []; hover = null;
    hideGraphTip(cv);
    if (cv.width !== 1 || cv.height !== 1) { cv.width = 1; cv.height = 1; }
  }
  /** the perihelion handle under a canvas point (within 14 px), or null */
  function hit(x, y) { lastPointer = [x, y]; let best = null, bd = 14; for (const h of handles) { const d = Math.hypot(h.x - x, h.y - y); if (d < bd) { bd = d; best = h; } } return best; }
  /** the rack hands the hovered handle back here: that is where the orbit's own numbers are shown */
  function setHover(h) {
    hover = h;
    if (h && h.info && lastPointer) { const r = cv.getBoundingClientRect(); showGraphTip(cv, h.info, r.left + lastPointer[0], r.top + lastPointer[1]); }
    else hideGraphTip(cv);
  }
  return { update, clear, suspend, setBow, bowFrame, get on() { return on; }, setOn(v) { on = !!v; }, get orbits() { return orbits; }, hit, setHover, get handles() { return handles; } };
}
