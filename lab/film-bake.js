/* lab/film-bake.js — THE FILM IS THE SCREEN (025 B; research/iteration-025/PLAN.md B1–B3).  render-exact.js' `frame(i, ctx)` reads the FIELD off
 * the GPU; this is what the screen lays over it, laid over the film's frame in the screen's order, at the film's size, a function of the frame alone:
 *   1 THE GRAPH (B1, NODES ON): the chain compiled at the film's scale (nodes.js compileAt: a PRIMITIVE's px × k) as the same SVG filter markup,
 *     run by a 2-D canvas (`ctx.filter = url(#…)`); the LAYERS in graph order (node-layers.js paintLayer: the grain's jump hashed from the frame
 *     index); a SHADER node baked by its host from the film's own tap (node-shader.js bake), its canvas under the chain's filter as on the stage.
 *   2 THE OVERLAYS (B2): what is a pure function of (t, camera, seed) — PARTICLES (a film's own ensemble, reseeded at its first frame from seed 13
 *     and integrated by the stage's RK4 from frame to frame, so each step is exactly 1/fps × RATE of the schedule), THE SKELETON with THE BEAD (its
 *     own instance, the loop's args at t: rack.js skeletonArgs), VORTEX's nodal points and KEPLER's orbits (their owners, at t, at the film's size).
 *     OUT by name, never faked: FLOW's tracers (respawned by Math.random as they age), KEPLER's impulse vector (a held gesture), THE BEAD's trail
 *     before frame 0 (it starts with the film).
 *   3 THE WORDS (B3, CHROME LABELS): the ATOM LABELS (stage-words.js labelsAt — the stage's own placement law at the film's box, white under
 *     difference) and the ESP BAR (its stage box, ramp and numbers, mapped onto the frame); the STAGE FORMULA, NAME and SUBTITLE are KaTeX DOM: OUT.
 * The scale k is film px per stage CSS px (the stage's canvas box), so a CSS-px look — a blur radius, a grain tile, a scanline pitch, a label — holds.
 * A frame with nothing to lay over it is handed back untouched: the bytes and the digest are 024's.
 *   createBake(app) → { readings(o) → [{ id, state: 'IN' | 'OUT', why }], async apply(J, rgba, w, h, i, t) → rgba } */
import { pictureFilter } from './mir/panels/picture-filter.js';
import { paintLayer, hash32 } from './node-layers.js';
import { createParticles } from './particles.js';
import { createSkeleton } from './skeleton.js';

/** a seeded generator (the stage seeds PARTICLES from Math.random; a film from this, seed 13) */
export const seeded = (seed) => { let s = seed >>> 0; return () => (s = hash32(s + 0x9e3779b9)) / 4294967296; };
const live = (cv) => !!(cv && cv.width > 1 && cv.height > 1);   // an owner releases its canvas to 1 × 1 while it draws nothing

export function createBake(app) {
  const { dom } = app, LW = () => app.sh.LW, $ = (id) => document.getElementById(id);
  let pf = null;
  const canvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  const cssW = () => Math.max(1, dom.canvas.clientWidth || dom.canvas.width), cssH = () => Math.max(1, dom.canvas.clientHeight || dom.canvas.height);
  /** an owner's draw at a size of the film's: its canvas' CSS box and the screen's ratio read as the film's, for one synchronous call */
  function atSize(cv, W, H, dpr, fn) {
    const own = (k, v) => Object.defineProperty(cv, k, { value: v, configurable: true });
    own('clientWidth', W); own('clientHeight', H);
    const was = Object.getOwnPropertyDescriptor(window, 'devicePixelRatio');   // Firefox: the window's own; Chromium: its prototype's
    let ratio = false; try { Object.defineProperty(window, 'devicePixelRatio', { value: dpr, configurable: true, writable: true }); ratio = true; } catch (_) { /* the screen's ratio stands: drawImage scales */ }
    try { fn(); } finally { delete cv.clientWidth; delete cv.clientHeight; if (ratio) { if (was) Object.defineProperty(window, 'devicePixelRatio', was); else delete window.devicePixelRatio; } }
  }
  /** what lies over the field on this stage now, each IN or OUT with why (HAZARD `overlays`' witness) */
  function readings(o = {}) {
    const W = app.w, out = [], add = (id, on, inn, why) => { if (on) out.push({ id, state: inn ? 'IN' : 'OUT', why }); };
    const N = LW().nodes, c = N ? N.compile() : { runs: [], layers: [] };
    add('nodes', c.runs.length || c.layers.length, o.nodes !== false, o.nodes !== false ? 'NODES ON: ' + c.runs.length + ' filter run(s) and ' + c.layers.length + ' layer(s) baked at the film\'s scale' : 'NODES OFF: the field alone (024\'s film)');
    add('particles', W.particles && W.particles.on && live($('particles')), true, 'reseeded at frame 0 from seed 13 and integrated by RK4 from frame to frame (1/fps × RATE a step)');
    add('vortex', live($('vortex')), true, 'exact nodal points of ψ(t), drawn by VORTEX at the frame\'s t');
    add('kepler', W.kepler && W.kepler.on && live($('kepler')), true, 'the orbits from the exact expectation values at t, drawn by KEPLER');
    add('skeleton', !!(LW().skeletonArgs && LW().skeletonArgs(LW().clock.t)), true, 'the loop\'s args at t; THE BEAD\'s trail starts at frame 0');
    add('flow', !!(W.flowTracers && W.flowTracers.on), false, 'FLOW\'s tracers are respawned by Math.random as they age: path-dependent, never faked');
    add('impulse', !!app.state.bow, false, 'KEPLER\'s impulse vector is a held gesture, not a function of t');
    const words = o.chrome === 'off' ? 'CHROME OFF' : null;
    add('atomLabels', $('atomLabels') && !$('atomLabels').hidden, !words, words || 'by the stage\'s placement law at the film\'s box, white under difference');
    add('espBar', document.querySelector('.lw-espbar:not([hidden])'), !words, words || 'its stage box, ramp and numbers mapped onto the frame');
    add('formula', app.state.stageText && app.state.stageText.md, false, 'the STAGE FORMULA, NAME and SUBTITLE are KaTeX DOM (call 4)');
    return out;
  }

  async function apply(J, rgba, w, h, i, t) {
    const lw = LW(), k = w / cssW(), Hs = h / k, N = J.nodes !== false && lw.nodes ? lw.nodes : null;
    const c = N ? N.compileAt(k) : { runs: [], layers: [] };
    const B = J.bake || (J.bake = { reads: readings({ nodes: J.nodes, chrome: J.chrome }) });
    const want = (id) => B.reads.some((r) => r.id === id && r.state === 'IN');
    const over = ['particles', 'vortex', 'kepler', 'skeleton'].filter(want), words = J.chrome !== 'off' && (want('atomLabels') || want('espBar'));
    if (!c.runs.length && !c.layers.length && !over.length && !words) return rgba;
    const out = canvas(w, h), g = out.getContext('2d', { willReadFrequently: true }), src = canvas(w, h);
    src.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(rgba.buffer, rgba.byteOffset, rgba.length), w, h), 0, 0);
    let url = 'none';
    if (c.runs.length) { if (!pf) pf = pictureFilter(document.createElement('div')); pf.setChain(c.runs).flush(); url = 'url(#' + pf.id + ')'; }
    g.filter = url; g.drawImage(src, 0, 0); g.filter = 'none';
    /* 2 · THE OVERLAYS, under the node layers as on the stage (#nodeLayers sits after #skeleton) */
    const obs = lw.obs, half = lw.domain ? lw.domain.half : app.ctl.domain.half, reg = app.reg, at = { W: cssW(), H: Hs, dpr: k };
    if (want('particles')) {
      const L = app.w.particles;
      if (!B.particles) { const P = B.particles = createParticles(B.pcv = canvas(1, 1), {}); P.setOn(true); P.setTrail(L.trailLen); P.setCap(L.cap); P.seed(Math.max(1, L.state.count), reg, t, half, seeded(13)); }
      B.particles.advance(reg, t, half); B.particles.draw(obs, half, at);
      g.drawImage(B.pcv, 0, 0, w, h);
    }
    for (const id of ['vortex', 'kepler']) if (want(id)) {
      const cv = $(id), W = app.w[id], dpr = Math.min(2, k);
      const draw = () => (id === 'vortex' ? W.update(reg, t, obs, half, false) : W.update(reg, t, obs, half));
      atSize(cv, w / dpr, h / dpr, dpr, draw); g.drawImage(cv, 0, 0, w, h); draw();   // the stage's own canvas, drawn again at the stage's size
    }
    if (want('skeleton')) {
      const a = lw.skeletonArgs(t);
      if (a) { if (!B.sk) { B.skc = canvas(1, 1); B.sk = createSkeleton(B.skc); } a[9] = at; B.sk.draw(...a); g.drawImage(B.skc, 0, 0, w, h); }
    }
    /* 1b · THE LAYERS, in graph order, over the stage canvases */
    for (const l of c.layers) {
      if (!l.gpu) { paintLayer(g, l, w, h, k, i); continue; }
      const s = N.shaders && await N.shaders.bake(l.values, i, l);   // 027 N4: a STATEFUL node steps once a frame, from black at frame 0
      if (!s || s.w !== w || s.h !== h) continue;
      const d = s.rgba; for (let p = 0; p < d.length; p += 4) { const a = d[p + 3]; if (a && a < 255) { d[p] = d[p] * 255 / a; d[p + 1] = d[p + 1] * 255 / a; d[p + 2] = d[p + 2] * 255 / a; } }
      const tmp = canvas(w, h); tmp.getContext('2d').putImageData(new ImageData(d, w, h), 0, 0);
      g.filter = url; g.drawImage(tmp, 0, 0); g.filter = 'none';        // the chain's filter, mirrored onto the SHADER canvas as on the stage
    }
    /* 3 · THE WORDS */
    if (words) paintWords(g, w, h, k);
    const img = g.getImageData(0, 0, w, h).data;
    return new Uint8Array(img.buffer, img.byteOffset, img.length);
  }

  function paintWords(g, w, h, k) {
    const sb = dom.stage.getBoundingClientRect(), kx = w / sb.width, ky = h / sb.height, X = (x) => (x - sb.left) * kx, Y = (y) => (y - sb.top) * ky;
    const bar = document.querySelector('.lw-espbar:not([hidden])');
    if (bar) {
      const ramp = bar.querySelector('.lw-espbar-ramp'), r = ramp.getBoundingClientRect(), side = bar.dataset.side, horiz = side === 'top' || side === 'bottom';
      const stops = [...(ramp.style.background || '').matchAll(/(#[0-9a-f]{6}|rgb\([^)]*\))\s+([\d.]+)%/gi)];
      const x0 = X(r.left), y0 = Y(r.top), x1 = x0 + r.width * k, y1 = y0 + r.height * k;
      const grad = horiz ? g.createLinearGradient(x0, 0, x1, 0) : g.createLinearGradient(0, y1, 0, y0);
      for (const m of stops) grad.addColorStop(Math.min(1, +m[2] / 100), m[1]);
      g.save(); g.fillStyle = stops.length ? grad : '#888'; g.beginPath(); g.roundRect(x0, y0, x1 - x0, y1 - y0, 3 * k); g.fill();
      g.strokeStyle = 'hsl(0 0% 50% / .35)'; g.lineWidth = k; g.stroke();
      for (const n of bar.querySelectorAll('.lw-espbar-n')) {
        const q = n.getBoundingClientRect(), cs = getComputedStyle(n);
        g.font = cs.fontWeight + ' ' + parseFloat(cs.fontSize) * k + 'px ' + cs.fontFamily; g.fillStyle = cs.color; g.textBaseline = 'middle'; g.textAlign = 'left';
        const sh = /^(rgba?\([^)]*\)|hsla?\([^)]*\)|#\w+)/.exec(cs.textShadow || ''); if (sh) { g.shadowColor = sh[1]; g.shadowBlur = 6 * k; }
        g.fillText(n.textContent, X(q.left), Y(q.top + q.height / 2));
      }
      g.restore();
    }
    const st = app.state.stageText, chem = app.state.chem, lw = LW();
    const L = st && st.labelsAt && chem && chem.on ? st.labelsAt(chem.preset(), cssW(), h / k, lw.obs, lw.domain ? lw.domain.half : app.ctl.domain.half) : null;
    if (L && L.items.length) {
      g.save(); g.globalCompositeOperation = 'difference'; g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.font = '600 ' + L.px * k + 'px ' + L.family;
      for (const it of L.items) g.fillText(it.text, it.x * k, it.y * k);
      g.restore();
    }
  }
  return { readings, apply };
}
