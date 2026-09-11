import { planeModel } from './native-ui.js';
/* sliceview.js — the SLICE window: a rotatable complex plane through ψ, painted with the phase palette.
 *
 * Drag the picture to turn the plane.  Plain drag moves the MINUS rotor, which is a HOLOMORPHIC (U(2)) motion —
 * n₊ stands still — and shift-drag moves the PLUS rotor, which is not.  That is the 4D engine's two-trackball
 * control surface, and it is the right one here for the reason their notes give: dim SO(4) = 6 = 4 (the plane
 * itself) + 1 visible roll + 1 angle that changes nothing you can see, so a control designed on S² × S² wastes
 * none of the user's motion.  TOUR runs the two-slerp geodesic between the named planes.
 *
 * ── WAVE 49 · THE CHUNK LAW ──────────────────────────────────────────────────────────────────────────────────
 * The resample is a 128² grid with `psiAndGrad` at every point over every populated mode: 20–100 ms in ONE call.
 * Wave 45 answered that with a throttle (~8 Hz) and the rack's READER LAW then PARKED the whole window while the
 * transport played — the picture froze, which is the wrong answer for a window whose whole job is to show ψ move.
 * So the sample is now a JOB that is spent a few milliseconds at a time, and the three laws it runs under are:
 *
 *   BUDGET      one `update()` samples ROWS until `BUDGET_MS` of wall clock has gone — measured with performance.now()
 *               inside the loop, never a hardcoded row count, so a slow machine does fewer rows rather than a longer
 *               frame — and ALWAYS at least one row, so a job finishes in at most N updates on any machine.  The
 *               budget does not open up when the transport is paused, and the browser gate is why: a 30 ms paused
 *               pass left an 18 ms cost EMA behind, the READER LAW parked the window on the first played frame, and
 *               a parked reader is never re-measured — so it stayed parked for ever and the picture froze exactly as
 *               before.  One small budget on every update, and the law never has anything to park.
 *
 *   GENERATION  a job carries the key it was started for — `reg.version | t | mode | half | res` AND the rotor.
 *               Anything that moves any of those bumps `gen`, drops the partial and starts a new job; a chunk
 *               that finishes under a stale `gen` is never painted and never becomes `sample`.  A restarted job
 *               RESUMES THE SCAN where the killed one stopped (rows are visited cyclically from `job.start`), so
 *               a plane that is changing every frame — a TOUR, a drag, the played clock — still refreshes its
 *               whole area instead of forever redrawing the same top rows.
 *
 *   absMax      `paintSlice` normalises by a GLOBAL max over the grid, which a partial job does not yet know — and
 *               while the clock PLAYS no job ever completes, because t moves every frame.  So the normalisation is
 *               the max over the last N rows SAMPLED (one full sweep of the plane, across however many generations
 *               it took), adopted at each sweep boundary — the previous sweep's absMax, never the running max:
 *               ψ's peak modulus moves continuously in t, so the previous max is right to a per cent, while the
 *               running max starts at the first row's value and falls off a cliff — every partial paint would
 *               re-scale the brightness of the rows already on screen and the picture would pulse.  (Before the
 *               first completed job there is no previous max, and only then does the running max stand in.)  On
 *               completion the TRUE absMax is known and the whole image is repainted through `paintSlice` itself,
 *               so a settled slice is bit-identical to what the unchunked code drew.
 */
import { sampleSlice, paintSlice, planeReport, ksMap } from './slice.js';
import { psiAndGrad } from './dynamics.js';
import { IDENTITY, expPure, qmul, qnormalize, canonicaliseRotors, classifyManeuver, tourSegmentAt, projectToU2, isHolomorphic, visibleFrame, adjoint } from './rotor4.js';
import { el, seg, sw, knob, trig, readout, themeInk, graphHover } from './mir/kit.js';

const NAMED = [
  { key: 'xy', label: 'x–y', qL: [1, 0, 0, 0], qR: [1, 0, 0, 0] },
  { key: 'xz', label: 'x–z', qL: qnormalize([Math.SQRT1_2, Math.SQRT1_2, 0, 0]), qR: [1, 0, 0, 0] },
  { key: 'yz', label: 'y–z', qL: qnormalize([Math.SQRT1_2, 0, 0, Math.SQRT1_2]), qR: [1, 0, 0, 0] },
  { key: 'iso', label: 'isoclinic', qL: qnormalize([1, 1, 1, 1]), qR: qnormalize([1, -1, 1, -1]) },
];
const BUDGET_MS = 2.2;      // ms of sampling per update — the ONE number, and it is set by the READER LAW, not by taste:
                            // rack.js measures what `slice.update()` costs and parks the window over `parkDrop` = 8 ms,
                            // slows it over `slowDrop` = 3 ms.  2.2 ms of rows plus the blit measures ~2.6 ms, under BOTH,
                            // so the window runs on every CPU tick even with the governor stepped down.  The budget is
                            // the same PAUSED: a big paused pass would leave an 18 ms EMA behind, the law would park the
                            // window on the first played frame, and — parked, never re-measured — it would stay parked
                            // for ever.  That deadlock is exactly what the browser gate caught, and one budget kills it.
const NBASIS = 91;          // the register's width (state.js): the job's own coefficient buffers, allocated once

export function createSliceView(host, api) {
  let rotor = { ...IDENTITY }, mode = 'space', half = 8, gain = 1.6, res = 128, dirty = true, tour = null;
  /* ── the chunked job ───────────────────────────────────────────────────────────────────────────────────────── */
  let gen = 0, job = null, key = '', regain = false;
  let lastAbsMax = 0, nextStart = 0;                            // the normalising |ψ|max, and where the cyclic scan resumes
  let sweepMax = 0, sweepRows = 0;                              // while PLAYING the clock moves every frame, so no job ever COMPLETES:
                                                                // the max is then taken over a rolling window of the last N rows sampled
                                                                // — one full sweep of the plane, whichever generations it was made of
  const cRe = [new Float64Array(NBASIS), new Float64Array(NBASIS)], cIm = [new Float64Array(NBASIS), new Float64Array(NBASIS)];
  const bufRe = [null, null], bufIm = [null, null];             // ping-pong: a completed `sample` keeps its arrays while the next job fills the other pair
  let slot = 0;

  const rotorKey = () => rotor.qL.map((v) => v.toFixed(6)).join(',') + '/' + rotor.qR.map((v) => v.toFixed(6)).join(',');
  const sampleKey = (reg, t) => `${reg.version}|${t.toFixed(4)}|${mode}|${half}|${res}|${rotorKey()}`;
  const cv = el('canvas', 'slice-c', host);
  const g = cv.getContext('2d');
  let img = null, sample = null;
  const off = document.createElement('canvas');                 // one offscreen canvas for the whole life of the window (was one per paint)
  const seedC = document.createElement('canvas');               // the res change (drag → 64, release → 128): rescale the old picture in, so nothing flashes

  const r1 = el('div', 'row tight', host);
  const modeSeg = seg({ label: 'PLANE', value: 'space', options: [
    { id: 'space', label: 'ℝ³', title: 'a 2-plane through ordinary space' },
    { id: 'ks', label: 'KS ℝ⁴', title: 'Map a rotating four-dimensional plane into three dimensions' }],
    onChange: (v) => { mode = v; dirty = true; api.repaint(); } });
  r1.appendChild(modeSeg.root);
  const extentK = knob({ label: 'EXTENT a₀', min: 1, max: 60, value: 8, log: true, fmt: (v) => '±' + v.toFixed(1), onInput: (v) => { half = v; dirty = true; api.repaint(); } });
  const gainK = knob({ label: 'GAIN', min: 0.1, max: 20, value: 1.6, log: true, fmt: (v) => v.toFixed(2), onInput: (v) => { gain = v; regain = true; api.repaint(); } });
  r1.appendChild(extentK.root);
  r1.appendChild(gainK.root);
  const holo = sw({ label: 'HOLO U(2)', value: false, title: 'Keep n₊ fixed on the holomorphic sheet', onChange: (v) => { if (v) { rotor = canonicaliseRotors(projectToU2(rotor.qL), rotor.qR); dirty = true; api.repaint(); } } });
  r1.appendChild(holo.root);

  const mini = planeModel(host, {
    getNormal:()=>adjoint(rotor.qL,[0,0,1]),
    onTurn:n=>{if(mode!=='space')return;const axis=[-n[1],n[0],0], len=Math.hypot(...axis),angle=Math.acos(Math.max(-1,Math.min(1,n[2])));
      rotor={qL:len<1e-8?(n[2]<0?[0,1,0,0]:[1,0,0,0]):[Math.cos(angle/2),...axis.map(v=>v/len*Math.sin(angle/2))],qR:[1,0,0,0]};
      tour=null;mode='space';modeSeg.set('space');dirty=true;api.repaint();}
  });
  const r2 = el('div', 'row tight', host);
  for (const p of NAMED.filter(p=>p.key==='iso')) r2.appendChild(trig({ label: p.label, onFire: () => { startTour(p); api.repaint(); } }).root);
  r2.appendChild(trig({ label: 'RESET', onFire: () => { rotor = { ...IDENTITY }; tour = null; res = 128; dirty = true; api.repaint(); } }).root);
  const ro = readout({ label: 'PLANE  n₊ · n₋', value: '—', cls: 'wide', sub: '' });
  el('div', 'row tight', host).appendChild(ro.root);
  el('div', 'note', host).innerHTML = '<b>Slice.</b> Hue shows arg ψ, brightness shows |ψ|, and faint bands trace |ψ| contours. Drag rotates the plane; Shift-drag rotates the other SO(4) factor. KS maps a plane in four dimensions into a cone-like surface in three dimensions.';


  /** the ImageData for a resolution, seeded by rescaling whatever is on screen so a res change never flashes empty */
  function reseed(N) {
    const next = g.createImageData(N, N);
    if (img && off.width === img.width && off.height === img.height && off.width > 0) {
      seedC.width = N; seedC.height = N;
      const sg = seedC.getContext('2d'); sg.imageSmoothingEnabled = true;
      sg.drawImage(off, 0, 0, N, N);
      next.data.set(sg.getImageData(0, 0, N, N).data);
    }
    img = next;
  }
  /** start a fresh generation: capture EVERYTHING the sample depends on, so the chunks never re-read a moving world */
  function startJob(reg, t, k) {
    const N = res;
    gen++;
    slot ^= 1;
    if (!bufRe[slot] || bufRe[slot].length !== N * N) { bufRe[slot] = new Float64Array(N * N); bufIm[slot] = new Float64Array(N * N); }
    if (!img || img.width !== N) reseed(N);
    const c = reg.at(t, cRe[slot], cIm[slot]);                  // the coefficients are frozen for the life of the job
    const { f1, f2 } = visibleFrame(rotor.qL, rotor.qR);
    job = { gen, key: k, N, re: bufRe[slot], im: bufIm[slot], cRe: c.re, cIm: c.im, list: reg.renderSet().ids,
      f1, f2, e1: adjoint(rotor.qL, [1, 0, 0]), e2: adjoint(rotor.qL, [0, 1, 0]),
      mode, half, scale: mode === 'ks' ? Math.sqrt(half) : half,  // KS is quadratic: |x| = |u|², so sample √half
      start: nextStart % N, done: 0, mx: 0, norm: lastAbsMax };
    key = k; dirty = false; regain = false;
  }
  /** ONE row of the grid, exactly slice.js's inner loop for that j (a null sample — the origin — writes 0, not stale data) */
  function sampleRow(J, j) {
    const { N, re, im, cRe: cr, cIm: ci, list, f1, f2, e1, e2, scale } = J;
    const b = (2 * (j + 0.5) / N - 1) * scale, ks = J.mode === 'ks';
    let mx = 0;
    for (let i = 0; i < N; i++) {
      const a = (2 * (i + 0.5) / N - 1) * scale;
      let x, y, z;
      if (ks) {
        const X = ksMap([a * f1[0] + b * f2[0], a * f1[1] + b * f2[1], a * f1[2] + b * f2[2], a * f1[3] + b * f2[3]]);
        x = X[0]; y = X[1]; z = X[2];
      } else { x = a * e1[0] + b * e2[0]; y = a * e1[1] + b * e2[1]; z = a * e1[2] + b * e2[2]; }
      const s = psiAndGrad(cr, ci, list, x, y, z);
      const k = j * N + i;
      if (s) { re[k] = s.re; im[k] = s.im; const m = Math.hypot(s.re, s.im); if (m > mx) mx = m; } else { re[k] = 0; im[k] = 0; }
    }
    return mx;                                                  // this ROW's max: the job's max and the sweep's max are both fed from it
  }
  /** colour rows [j0, j1) of the job into `img` — paintSlice's per-pixel maths, restricted to a band and to `mx` */
  function colourRows(J, j0, j1, mx, lut) {
    const { N, re, im } = J, d = img.data, knee = 0.6, m0 = mx || 1;
    for (let k = j0 * N; k < j1 * N; k++) {
      const x = re[k], y = im[k], m = Math.hypot(x, y) / m0;
      const w = gain * m, v = w / (1 + knee * w);
      let R, G, B;
      const h = (Math.atan2(y, x) / (2 * Math.PI) + 0.5) % 1;
      if (lut) { const u = h * 256, i0 = Math.floor(u) % 256, i1 = (i0 + 1) % 256, f = u - Math.floor(u);
        R = lut[i0 * 4] * (1 - f) + lut[i1 * 4] * f; G = lut[i0 * 4 + 1] * (1 - f) + lut[i1 * 4 + 1] * f; B = lut[i0 * 4 + 2] * (1 - f) + lut[i1 * 4 + 2] * f;
      } else { const q = h * 6, c1 = Math.abs((q % 6) - 3) - 1, c2 = Math.abs(((q + 4) % 6) - 3) - 1, c3 = Math.abs(((q + 2) % 6) - 3) - 1;
        const cl = (u) => Math.min(1, Math.max(0, u)); R = 0.15 + 0.85 * cl(c1); G = 0.15 + 0.85 * cl(c2); B = 0.15 + 0.85 * cl(c3); }
      let s = v / (1 / (1 + knee));
      if (m > 1e-9) { const l = Math.log2(m * m0 + 1e-30); s *= 0.82 + 0.18 * Math.abs(2 * (l - Math.floor(l)) - 1); }
      d[k * 4] = Math.round(255 * Math.min(1, R * s)); d[k * 4 + 1] = Math.round(255 * Math.min(1, G * s));
      d[k * 4 + 2] = Math.round(255 * Math.min(1, B * s)); d[k * 4 + 3] = 255;
    }
  }
  /** spend the budget: rows until the clock runs out, always at least one, then paint the band that was just made */
  function stepJob() {
    const J = job, N = J.N, t0 = performance.now();
    const first = J.done;
    /* ALWAYS at least one row — progress is guaranteed on any machine — then rows until the measured budget is gone */
    do { const m = sampleRow(J, (J.start + J.done) % N); if (m > J.mx) J.mx = m; if (m > sweepMax) sweepMax = m; J.done++; sweepRows++; }
    while (J.done < N && performance.now() - t0 < BUDGET_MS);
    if (sweepRows >= N) { lastAbsMax = sweepMax; sweepMax = 0; sweepRows = 0; }   // a whole plane's worth of rows: adopt their max
    if (J.done >= N) {                                          // FINISHED: the true global max is known, so repaint the WHOLE
      sample = { re: J.re, im: J.im, N, absMax: J.mx, mode: J.mode, half: J.half };   // image through paintSlice itself — a settled
      lastAbsMax = J.mx; sweepMax = 0; sweepRows = 0; nextStart = 0; job = null;      // slice is then bit-identical to the unchunked one
      paintSlice(sample, img, { lut: api.lut(), gain, knee: 0.6 });                    // (and the last band is not coloured twice)
      return;
    }
    const norm = J.norm || J.mx;                                // the previous sweep's absMax; only the very first rows ever drawn fall back to the running one
    const lut = api.lut();
    for (let k = first; k < J.done; k++) { const j = (J.start + k) % N; colourRows(J, j, j + 1, norm, lut); }
    nextStart = (J.start + J.done) % N;                         // dropped early → the next generation picks the scan up here
  }
  /* the crosshair answers for the frame: extent, sampling and the U(2) sheet */
  const hover = graphHover(cv, { repaint: () => paint() });
  function paint() {
    const W = cv.clientWidth, H = cv.clientHeight, dpr = Math.min(2, window.devicePixelRatio || 1);
    if (W < 32 || H < 32 || !img) return;
    if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
    g.setTransform(1, 0, 0, 1, 0, 0);
    if (off.width !== img.width || off.height !== img.height) { off.width = img.width; off.height = img.height; }
    off.getContext('2d').putImageData(img, 0, 0);
    g.imageSmoothingEnabled = true;
    g.clearRect(0, 0, cv.width, cv.height);
    g.drawImage(off, 0, 0, cv.width, cv.height);
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    /* WAVE 46 — the picture IS the picture.  "ℝ³ · ±3.0 a₀ · 128²" sat in the top-left corner and a cyan
       "HOLOMORPHIC U(2)" in the bottom-left, both ON the domain colouring; the PLANE readout under the canvas
       already says the U(2) sheet, and the extent is one hover over the crosshair away. */
    const T = themeInk(g);
    g.strokeStyle = T.ink(0.28); g.lineWidth = 1;
    g.beginPath(); g.moveTo(W / 2, 0); g.lineTo(W / 2, H); g.moveTo(0, H / 2); g.lineTo(W, H / 2); g.stroke();
    const frame = `${mode === 'ks' ? 'KS ℝ⁴' : 'ℝ³'}  ·  ±${half.toFixed(1)} a₀  ·  ${res}² samples${isHolomorphic(rotor.qL) ? '  ·  HOLOMORPHIC U(2): n₊ is fixed' : ''}`;
    hover.set([
      { kind: 'line', key: 'ax-v', points: [W / 2, 0, W / 2, H], lw: 1, colour: T.ink(0.9), info: `the plane's vertical axis  ·  ${frame}` },
      { kind: 'line', key: 'ax-h', points: [0, H / 2, W, H / 2], lw: 1, colour: T.ink(0.9), info: `the plane's horizontal axis  ·  ${frame}` },
      { kind: 'dot', key: 'origin', x: W / 2, y: H / 2, r: 5, colour: T.fg(1), info: `the origin  ·  ${frame}` },
    ], { x0: 0, y0: 0, x1: W, y1: H });
  }
  /* a TOUR turns the plane every frame, so every frame is a new generation: it runs at the drag resolution and
     lets the cyclic scan refresh the picture, exactly as a drag does — the old code recomputed 128² per tour step */
  function startTour(p) {
    tour = { from: { qL: rotor.qL.slice(), qR: rotor.qR.slice() }, to: { qL: p.qL.slice(), qR: p.qR.slice() }, t: 0 };
    res = 64; dirty = true;
  }
  /* WAVE 49 FIX — A CHUNKED JOB MUST NOT SCHEDULE A RACK FRAME.  `api.repaint()` raises the rack's pending tier to
     PRESENT, and update() is called from INSIDE the rack's frame loop, so a job in flight added a PRESENT frame after
     every RECONSTRUCT one and `stats.lastTier` read 'PRESENT' when settle() returned — the browser proof's B8 and B14
     are exactly that assertion, and they went RED.  (rack.js:294 says the same thing about in-loop scheduling for its
     own reasons: it made METERS read 300 fps on a 58 Hz display.)  The job does not need the rack: it samples into its
     own buffers and draws on its own canvas.  So it keeps ITSELF alive on a PRIVATE requestAnimationFrame that steps,
     paints, and touches no part of the tier machinery — and it is the ONLY stepper, so the 2.2 ms budget is spent once
     per animation frame whether the transport is playing, paused, or not scheduling frames at all. */
  let pumpId = 0, active = true;
  function armPump() { if (active && !pumpId && job) pumpId = requestAnimationFrame(pump); }
  function pump() {
    pumpId = 0;
    if (!job || !active) return;
    if (cv.clientWidth < 32) { job = null; return; }             // folded mid-job: drop it, exactly as update() would
    stepJob(); paint();
    armPump();                                                   // stepJob() nulls `job` when it finishes, and the pump stops
  }
  function setActive(v) { active = !!v; if (active) armPump(); return active; }
  function update(reg, t, playing) {
    mini.root.setAttribute('aria-disabled',String(mode!=='space'));mini.root.tabIndex=mode==='space'?0:-1;
    mini.root.title=mode==='space'?'Drag to orient the plane · arrows rotate · Home resets':'Switch to ℝ³ for the sphere control; drag the slice image to rotate in KS ℝ⁴';
    mini.paint();
    if (tour) {
      tour.t = Math.min(1, tour.t + 0.04);
      rotor = tourSegmentAt({ from: tour.from, to: tour.to }, tour.t);
      if (tour.t >= 1) { tour = null; res = 128; }
      dirty = true;
      api.repaint();
    }
    const visible = cv.clientWidth >= 32;
    if (visible) {
      const k = sampleKey(reg, t);
      if (job && (dirty || k !== job.key)) job = null;           // the generation counter: the partial is dropped, not finished
      if (!job && (dirty || k !== key)) startJob(reg, t, k);
      else if (!job && regain) { regain = false; if (sample) { paintSlice(sample, img, { lut: api.lut(), gain, knee: 0.6 }); paint(); } }   // GAIN is a colouring, not a sampling
      if (job) armPump();                                        // the private pump does the work; nothing here schedules a rack frame
    } else if (job) job = null;
    const rep = planeReport(rotor);
    ro.set(rep.text, rep.holomorphic ? 'ok' : '');
    const nmz = Math.abs(rep.nM[2]), cone = Math.acos(Math.min(1, nmz)) * 180 / Math.PI;
    const shape = mode === 'ks' ? (nmz > 0.999 ? 'KS: COLLAPSED to a ray (n₋ at a pole)' : nmz < 0.02 ? 'KS: FLAT — a whole plane (n₋ on the equator)' : `KS: cone, half-angle ${cone.toFixed(1)}° = arccos|n₋z|`) : 'ℝ³ plane';
    ro.setSub(`${shape} · ${classifyManeuver(Math.acos(Math.min(1, Math.abs(rotor.qL[0]))) * 2, Math.acos(Math.min(1, Math.abs(rotor.qR[0]))) * 2)} · ${rep.holomorphic ? 'n₊ fixed (U(2) sheet)' : 'general SO(4)'}`);
  }
  /* drag the picture to turn the plane: plain = minus rotor (holomorphic), shift = plus rotor */
  {
    let down = false, px = 0, py = 0, shift = false;
    cv.addEventListener('pointerdown', (e) => { e.preventDefault(); cv.setPointerCapture(e.pointerId); down = true; px = e.clientX; py = e.clientY; shift = e.shiftKey; res = 64; tour = null; });
    cv.addEventListener('pointermove', (e) => {
      if (!down) return;
      const dx = (e.clientX - px) * 0.008, dy = (e.clientY - py) * 0.008; px = e.clientX; py = e.clientY;
      const d = expPure([dy * 0.5, dx * 0.5, 0]);
      if (shift && !holo.get()) rotor = canonicaliseRotors(qnormalize(qmul(d, rotor.qL)), rotor.qR);
      else rotor = canonicaliseRotors(rotor.qL, qnormalize(qmul(d, rotor.qR)));
      dirty = true; api.repaint();
    });
    const up = () => { if (down) { down = false; res = 128; dirty = true; api.repaint(); } };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
  }
  window.addEventListener('resize', () => { if (active) paint(); });
  /* `sampleAt` is the one-shot route kept for anything that wants a slice OUTSIDE the frame loop (a proof, a test):
     it is slice.js's own sampleSlice, unchunked, and it is what the chunked job reproduces row by row. */
  return { update, setActive, get rotor() { return rotor; }, setRotor(r) { rotor = canonicaliseRotors(r.qL, r.qR); tour = null; dirty = true; },
    get sample() { return sample; }, get mode() { return mode; }, setMode(m) { mode = m === 'ks' ? 'ks' : 'space'; modeSeg.set(mode); dirty = true; },
    get half() { return half; }, get gain() { return gain; },
    save() { return { mode, half, gain, rotor: { qL: rotor.qL.slice(), qR: rotor.qR.slice() } }; },
    load(o) {
      if (!o || typeof o !== 'object') return false;
      mode = o.mode === 'ks' ? 'ks' : 'space'; modeSeg.set(mode);
      if (Number.isFinite(o.half)) half = Math.max(1, Math.min(60, o.half));
      if (Number.isFinite(o.gain)) gain = Math.max(0.1, Math.min(20, o.gain));
      extentK.set(half); gainK.set(gain);
      if (o.rotor && Array.isArray(o.rotor.qL) && o.rotor.qL.length === 4 && Array.isArray(o.rotor.qR) && o.rotor.qR.length === 4 &&
          o.rotor.qL.every(Number.isFinite) && o.rotor.qR.every(Number.isFinite)) rotor = canonicaliseRotors(o.rotor.qL, o.rotor.qR);
      tour = null; res = 128; job = null; key = ''; dirty = true; regain = true; api.repaint();
      return true;
    },
    sampleAt(reg, t, N = res) { return sampleSlice(reg, t, rotor, { mode, half, N }); },
    tourTo(name) { const p = NAMED.find((x) => x.key === name); if (p) startTour(p); } };
}
