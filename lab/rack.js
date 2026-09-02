/* rack.js — the instrument: the windows, the work-tier router, the four clocks, the transport.
 *
 *   STATE → EVOLUTION → OBSERVABLE FIELD → OBSERVER → RENDER        (§52)
 *
 * Tiers (§13):  PRESENT < RECONSTRUCT < EVOLVE < REBUILD.  Every cause asks for a tier; one
 * animation frame coalesces to the strongest and does exactly that much.  Idle is ZERO work:
 * when nothing plays, nothing spins and nothing is pending, no frame is scheduled (§45).
 * Four clocks (§12): the physics clock is the Clock (exact logical time); the field clock is the
 * reconstruction cadence (cappable, never alters c); the camera clock is observer motion; the
 * presentation clock is the display rate.  Observer controls never touch the register (§14).
 */
import { BASIS, domainFor, psiAt } from './hydrogen.js';
import { Register, PRESETS, PRESET_BY_ID, RENDER_CAP } from './state.js';
import { Clock } from './clock.js';
import { createField, tableFor, VIEW, VIEW_NAMES } from './field.js';
import { el, knob, sw, seg, trig, fader, readout, device, group } from './kit.js';
import { createSpectrum } from './spectrum.js';
import { createMeters } from './meters.js';
import { createShadowView } from './shadowview.js';

export const TIER = { NONE: 0, PRESENT: 1, RECONSTRUCT: 2, EVOLVE: 3, REBUILD: 4 };
const TIER_NAME = ['NONE', 'PRESENT', 'RECONSTRUCT', 'EVOLVE', 'REBUILD'];
const LS_EXP = 'lambdawaves.q0.experiment', LS_PRES = 'lambdawaves.q0.presentation';

export async function boot(dom) {
  const reg = new Register();
  const clock = new Clock();
  const obs = { yaw: 0.65, pitch: 0.38, dist: 3.3, fov: 0.6 };
  const mat = { view: VIEW.density, exposure: 1, softness: 0.7, steps: 160, slice: { mode: 0, axis: 2, pos: 0, thick: 0.03 }, hueShift: 0, invert: false, frame: true };
  const quality = { res: 96, steps: 160, scale: 1 };
  const domain = { auto: true, half: 7 };
  const camera = { autoRotate: false, speed: 0.25 };
  const fieldRate = { capMs: 0 };
  const stats = { frames: 0, presents: 0, reconstructs: 0, evolves: 0, rebuilds: 0, tiers: { PRESENT: 0, RECONSTRUCT: 0, EVOLVE: 0, REBUILD: 0 }, lastTier: 'NONE', scheduled: false, fps: 0, reconPerSec: 0, stepsPerSec: 0, lastEncodeMs: 0, fieldT: 0 };
  const cRe = new Float64Array(91), cIm = new Float64Array(91);
  let applyVisuals = true;
  let refSnapshot = null;        // { re, im, ids } — the DIFF reference state
  let pendingRef = null;

  /* ── FIELD ────────────────────────────────────────────────────────────── */
  const field = await createField(dom.canvas, { resolution: quality.res, onError: (m) => showBanner('GPU error', m) });
  if (!field.ok) showBanner('WebGPU unavailable', field.error + '. The FIELD needs WebGPU; SPECTRUM, SHADOW and METERS still run on the CPU.');
  function showBanner(title, text) { dom.banner.hidden = false; dom.banner.querySelector('h3').textContent = title; dom.banner.querySelector('p').textContent = text; }

  /* ── the router ───────────────────────────────────────────────────────── */
  let pending = TIER.NONE, rafId = 0, lastWall = 0, lastReconMs = -1e9, dragging = false;
  let winStart = 0, winFrames = 0, winRecon = 0, winSteps = 0;
  function schedule(tier) {
    if (tier > pending) pending = tier;
    if (!rafId) { rafId = requestAnimationFrame(loop); stats.scheduled = true; }
  }
  function modesAt(t) {
    const c = reg.at(t, cRe, cIm);
    return reg.renderSet(RENDER_CAP).ids.map((a) => ({ table: tableFor(BASIS[a]), re: c.re[a], im: c.im[a] }));
  }
  function refModes() {
    if (!refSnapshot) return null;
    return refSnapshot.ids.map((a) => ({ table: tableFor(BASIS[a]), re: refSnapshot.re[a], im: refSnapshot.im[a] }));
  }
  function applyRebuild() {
    if (domain.auto) domain.half = domainFor(reg.nmax());
    if (field.ok) {
      field.setDomain(domain.half);
      if (field.resolution !== quality.res) field.setResolution(quality.res);
    }
    mat.steps = quality.steps;
    if (refSnapshot) pendingRef = refModes();      // the reference lives on the grid: rebuild it with the grid
    stats.rebuilds++;
    ui.domainKnob.set(domain.half);
  }
  function loop(nowMs) {
    rafId = 0;
    const now = nowMs / 1000;
    let tier = pending; pending = TIER.NONE;
    const dt = clock.advance(now);                                   // PHYSICS clock (exact)
    if (dt !== 0) { tier = Math.max(tier, TIER.EVOLVE); stats.evolves++; winSteps++; }
    if (camera.autoRotate && !dragging) {                            // CAMERA clock: observer only
      obs.yaw += camera.speed * Math.min(0.1, Math.max(0, now - lastWall));
      tier = Math.max(tier, TIER.PRESENT);
    }
    lastWall = now;
    if (tier >= TIER.REBUILD) applyRebuild();
    let modes = null;
    if (tier >= TIER.RECONSTRUCT) {
      const due = (nowMs - lastReconMs) >= fieldRate.capMs;          // FIELD clock: cadence, never c
      if (tier !== TIER.EVOLVE || due) { modes = modesAt(clock.t); lastReconMs = nowMs; stats.fieldT = clock.t; winRecon++; }
    }
    if (tier >= TIER.PRESENT && field.ok) {                          // PRESENTATION
      field.resize(quality.scale);
      field.frame({ modes, refModes: pendingRef, obs, mat });
      pendingRef = null;
      stats.presents++; stats.lastEncodeMs = field.stats.lastEncodeMs;
    }
    if (modes) stats.reconstructs++;
    if (tier > 0) { stats.tiers[TIER_NAME[tier]]++; stats.lastTier = TIER_NAME[tier]; }
    stats.frames++; winFrames++;
    const c = reg.at(clock.t, cRe, cIm);
    spectrum.update(c, clock.t);
    shadowView.update(c, clock.t, reg.populated(), spectrum.selected);
    ui.hc.set(reg.energy().toFixed(5));
    transport.update();
    if (now - winStart >= 1) {
      const w = now - winStart; stats.fps = winFrames / w; stats.reconPerSec = winRecon / w; stats.stepsPerSec = winSteps / w;
      winStart = now; winFrames = winRecon = winSteps = 0;
    }
    if (clock.playing || camera.autoRotate || pending) { rafId = requestAnimationFrame(loop); stats.scheduled = true; }
    else { stats.scheduled = false; stats.fps = 0; stats.reconPerSec = 0; stats.stepsPerSec = 0; }
    meters.update(meterSnapshot());
    badges.update();
  }
  function meterSnapshot() {
    const rs = reg.renderSet(RENDER_CAP);
    return { norm: reg.norm(), energy: reg.energy(), autocorr: reg.autocorrelation(clock.t).abs, t: clock.t, playing: clock.playing,
      rendered: rs.rendered, populated: rs.populated, masked: rs.masked, truncated: rs.truncated, covered: rs.coveredFraction,
      res: field.ok ? field.resolution : 0, half: domain.half, steps: mat.steps, encodeMs: stats.lastEncodeMs,
      fps: stats.fps, reconPerSec: stats.reconPerSec, stepsPerSec: stats.stepsPerSec, scheduled: stats.scheduled, lastTier: stats.lastTier, tiers: stats.tiers,
      status: statusLine() };
  }
  function statusLine() {
    const rs = reg.renderSet(RENDER_CAP);
    let s = 'EXACT ANALYTIC state + evolution · EXACT REAL shadow · NUMERICAL field';
    if (!field.ok) s += ' (no GPU)';
    if (rs.masked) s += ` · MASKED ${rs.masked}`;
    if (rs.truncated) s += ` · TRUNCATED ${rs.truncated}`;
    return s;
  }

  /* ── state mutations: ONE road (finger, key, test, restore all come here) ─ */
  let lastNmax = 1;
  function touchState() {
    const nm = reg.nmax();
    if (domain.auto && nm !== lastNmax) { lastNmax = nm; schedule(TIER.REBUILD); }
    else schedule(TIER.RECONSTRUCT);
  }
  function loadPreset(id) {
    const p = PRESET_BY_ID.get(id); if (!p) return false;
    reg.load(p); clock.reset(); lastNmax = -1;
    clock.window = p.visual.window;
    if (applyVisuals) { clock.setRate(p.visual.rate); mat.view = VIEW[p.visual.view]; ui.viewSeg.set(p.visual.view); ui.rateKnob.set(clock.rate); }
    ui.presetSel.value = id; ui.presetNote.textContent = p.note;
    setReference();
    spectrum.select(-1);
    shadowView.clearTrail();
    ui.scrub.set(0);
    schedule(TIER.REBUILD);
    return true;
  }
  function setReference() {
    const c = reg.at(clock.t);
    refSnapshot = { re: Float64Array.from(c.re), im: Float64Array.from(c.im), ids: reg.populated(), t: clock.t, digest: reg.digest() };
    pendingRef = refModes(); schedule(TIER.PRESENT);
  }
  const api = {
    reg,
    select(a) { spectrum.select(a); schedule(TIER.PRESENT); },
    toggleMode(a) {
      if (reg.population(a) > 0) { reg.set(a, 0, 0, clock.t); }
      else { const pop = reg.populated(); let amp = 1; if (pop.length) { amp = 0; for (const b of pop) amp += Math.sqrt(reg.population(b)); amp /= pop.length; } reg.set(a, amp, 0, clock.t); }
      touchState();
    },
    setPopulation(a, v) {
      const n = reg.norm() || 1; const c = reg.coeffAt(a, clock.t); const ph = Math.atan2(c.im, c.re);
      reg.setPolar(a, Math.sqrt(Math.max(0, v)) * n, ph, clock.t); touchState();
    },
    addPhase(a, d) { const c = reg.coeffAt(a, clock.t); reg.setPolar(a, Math.hypot(c.re, c.im), Math.atan2(c.im, c.re) + d, clock.t); touchState(); },
    setPhase(a, ph) { const c = reg.coeffAt(a, clock.t); reg.setPolar(a, Math.hypot(c.re, c.im), ph, clock.t); touchState(); },
    toggleMute(a) { reg.setMute(a, !reg.muted[a]); touchState(); },
    toggleSolo(a) { reg.setSolo(a, !reg.solo[a]); touchState(); },
    remove(a) { reg.set(a, 0, 0, clock.t); reg.setMute(a, false); reg.setSolo(a, false); touchState(); }
  };

  /* ── windows ──────────────────────────────────────────────────────────── */
  const ui = {};
  const rack = dom.rack;

  // OBSERVER — camera, slice, view, material, cache quality. Never touches the register.
  const wObs = device({ id: 'observer', eyebrow: 'OBSERVER', title: 'VIEW · CAMERA · SLICE', status: 'never mutates ψ' });
  {
    const r1 = wObs.row();
    ui.viewSeg = seg({ label: 'OBSERVABLE (colour is semantic)', value: 'density', options: [
      { id: 'density', label: 'ρ=|ψ|²', title: 'probability density' }, { id: 'phase', label: 'arg ψ', title: 'phase as hue, density as opacity' },
      { id: 'real', label: 'Re ψ', title: 'signed, diverging: orange +, blue −' }, { id: 'imag', label: 'Im ψ' }, { id: 'diff', label: 'Δρ', title: 'ρ(t) − ρ_ref: yellow gain, blue loss' }],
      onChange: (v) => { mat.view = VIEW[v]; schedule(TIER.PRESENT); } });
    r1.appendChild(ui.viewSeg.root);
    const r2 = wObs.row('tight');
    r2.appendChild(knob({ label: 'EXPOSURE', min: 0.08, max: 12, value: 1, log: true, fmt: (v) => v.toFixed(2), onInput: (v) => { mat.exposure = v; schedule(TIER.PRESENT); } }).root);
    r2.appendChild(knob({ label: 'SOFT', min: 0.3, max: 2.2, value: 0.7, fmt: (v) => 'γ' + v.toFixed(2), onInput: (v) => { mat.softness = v; schedule(TIER.PRESENT); } }).root);
    r2.appendChild(knob({ label: 'HUE', min: 0, max: 1, value: 0, wrap: true, fmt: (v) => (v * 360).toFixed(0) + '°', onInput: (v) => { mat.hueShift = v; schedule(TIER.PRESENT); } }).root);
    r2.appendChild(sw({ label: 'INVERT', value: false, onChange: (v) => { mat.invert = v; schedule(TIER.PRESENT); } }).root);
    r2.appendChild(sw({ label: 'FRAME', value: true, onChange: (v) => { mat.frame = v; schedule(TIER.PRESENT); } }).root);
    const gs = group(wObs.body, 'SLICE / CLIP  (observer only)');
    const r3 = el('div', 'row', gs);
    r3.appendChild(seg({ value: 'off', options: [{ id: 'off', label: 'VOLUME' }, { id: 'clip', label: 'CLIP' }, { id: 'slab', label: 'SLAB' }], onChange: (v) => { mat.slice.mode = { off: 0, clip: 1, slab: 2 }[v]; schedule(TIER.PRESENT); } }).root);
    r3.appendChild(seg({ value: 'z', options: [{ id: 'x', label: 'X' }, { id: 'y', label: 'Y' }, { id: 'z', label: 'Z' }], onChange: (v) => { mat.slice.axis = { x: 0, y: 1, z: 2 }[v]; schedule(TIER.PRESENT); } }).root);
    r3.appendChild(knob({ label: 'POS', min: -1, max: 1, value: 0, fmt: (v) => v.toFixed(2), onInput: (v) => { mat.slice.pos = v; schedule(TIER.PRESENT); } }).root);
    r3.appendChild(knob({ label: 'THICK', min: 0.01, max: 0.4, value: 0.03, log: true, fmt: (v) => v.toFixed(3), onInput: (v) => { mat.slice.thick = v; schedule(TIER.PRESENT); } }).root);
    const gc = group(wObs.body, 'CAMERA');
    const r4 = el('div', 'row', gc);
    ui.spinSw = sw({ label: 'AUTO-ROTATE', value: false, onChange: (v) => { camera.autoRotate = v; schedule(TIER.PRESENT); } });
    r4.appendChild(ui.spinSw.root);
    r4.appendChild(knob({ label: 'SPIN', min: 0.02, max: 2, value: 0.25, log: true, fmt: (v) => v.toFixed(2) + ' rad/s', onInput: (v) => { camera.speed = v; } }).root);
    r4.appendChild(trig({ label: 'RESET VIEW', onFire: () => { Object.assign(obs, { yaw: 0.65, pitch: 0.38, dist: 3.3 }); schedule(TIER.PRESENT); } }).root);
    r4.appendChild(trig({ label: 'SET Δρ REF', title: 'capture ρ(now) as the DIFFERENCE reference (a field reference, not a state edit)', onFire: () => { setReference(); ui.viewSeg.set('diff'); mat.view = VIEW.diff; } }).root);
    const gq = group(wObs.body, 'FIELD CACHE  (quality changes the estimate, never the state)');
    const r5 = el('div', 'row', gq);
    r5.appendChild(seg({ label: 'GRID', value: '96', options: [{ id: '64', label: '64³' }, { id: '96', label: '96³' }, { id: '128', label: '128³' }],
      onChange: (v) => { quality.res = +v; quality.steps = { 64: 110, 96: 160, 128: 240 }[+v]; quality.scale = { 64: 0.75, 96: 1, 128: 1 }[+v]; schedule(TIER.REBUILD); } }).root);
    r5.appendChild(seg({ label: 'FIELD CLOCK cap', value: '0', options: [{ id: '0', label: 'MAX' }, { id: '33', label: '30 Hz' }, { id: '66', label: '15 Hz' }, { id: '200', label: '5 Hz' }],
      onChange: (v) => { fieldRate.capMs = +v; } }).root);
    const r6 = el('div', 'row', gq);
    ui.domainAuto = sw({ label: 'DOMAIN AUTO', value: true, onChange: (v) => { domain.auto = v; ui.domainKnob.setDisabled(v); schedule(TIER.REBUILD); } });
    r6.appendChild(ui.domainAuto.root);
    ui.domainKnob = knob({ label: 'HALF-WIDTH', min: 3, max: 140, value: 7, log: true, fmt: (v) => '±' + v.toFixed(0) + ' a₀', onChange: (v) => { domain.half = v; schedule(TIER.REBUILD); } });
    ui.domainKnob.setDisabled(true);
    r6.appendChild(ui.domainKnob.root);
  }

  // STATE — preparation. Everything here changes c.
  const wState = device({ id: 'state', eyebrow: 'STATE', title: 'PREPARE · |ψ⟩ = Σ c_nlm |nlm⟩', status: 'changes c' });
  rack.appendChild(wState.root);
  {
    const r1 = wState.row();
    ui.presetSel = el('select', 'sel', r1);
    for (const p of PRESETS) { const o = el('option', '', ui.presetSel, p.label); o.value = p.id; }
    ui.presetSel.addEventListener('change', () => loadPreset(ui.presetSel.value));
    ui.presetSel.style.flex = '1 1 160px';
    r1.appendChild(sw({ label: 'PRESET VISUALS', value: true, onChange: (v) => { applyVisuals = v; } }).root);
    ui.presetNote = el('div', 'note', wState.body, '');
    const r2 = wState.row();
    r2.appendChild(trig({ label: 'NORMALIZE', title: 'c ↦ c / √(c†c) — explicit, never silent', onFire: () => { reg.normalize(); touchState(); } }).root);
    r2.appendChild(trig({ label: 'CLEAR', onFire: () => { reg.clear(); refSnapshot = null; touchState(); } }).root);
    r2.appendChild(knob({ label: 'STATE ROTATE z', min: 0, max: 2 * Math.PI, value: 0, wrap: true, cls: 'rot', fmt: () => 'D(R_z)', onDelta: (d) => { reg.rotateZ(d); touchState(); } }).root);
    el('div', 'note', wState.body).innerHTML = '<b>STATE ROTATE</b> applies D(R_z(α)) to the coefficients (c<sub>nlm</sub> → e<sup>−imα</sup>c<sub>nlm</sub>): a physical operation. <b>Camera</b> orbit is in OBSERVER and never touches c. Edits happen at the current logical time; nothing is silently renormalized.';
    const r3 = wState.row();
    r3.appendChild(trig({ label: 'SAVE', title: 'experiment (state, time, rate) and presentation (camera, material) saved separately', onFire: () => { save(); } }).root);
    r3.appendChild(trig({ label: 'LOAD', onFire: () => { restore(); } }).root);
    r3.appendChild(trig({ label: 'COPY JSON', onFire: async () => { try { await navigator.clipboard.writeText(JSON.stringify(serialize(), null, 1)); } catch (_) {} } }).root);
  }

  // SPECTRUM
  const wSpec = device({ id: 'spectrum', eyebrow: 'SPECTRUM', title: 'EIGENVALUE · POPULATION · PHASE', status: '' });
  rack.appendChild(wSpec.root);
  const spectrum = createSpectrum(wSpec.body, api);

  rack.appendChild(wObs.root);

  // SHADOW
  const wSh = device({ id: 'shadow', eyebrow: 'SHADOW', title: 'CLASSICAL SHADOW  c = (q + ip)/√2', status: 'same c(t), same time' });
  rack.appendChild(wSh.root);
  const shCanvas = el('canvas', 'shadow-c', wSh.body);
  const shadowView = createShadowView(shCanvas, api);
  {
    const r = wSh.row();
    ui.shadowSeg = seg({ value: 'phasors', options: [{ id: 'phasors', label: 'PHASORS' }, { id: 'oscillators', label: 'OSCILLATORS' }, { id: 'lissajous', label: 'LISSAJOUS' }], onChange: (v) => { shadowView.setMode(v); schedule(TIER.PRESENT); } });
    r.appendChild(ui.shadowSeg.root);
    ui.hc = readout({ label: 'H_C = ½qᵀAq + ½pᵀAp = ⟨H⟩', value: '—' });
    r.appendChild(ui.hc.root);
    el('div', 'epi', wSh.body, 'EXACT REAL REPRESENTATION OF FINITE UNITARY AMPLITUDE DYNAMICS');
    el('div', 'note', wSh.body).innerHTML = 'For diagonal H each amplitude is an uncoupled harmonic oscillator: q̇<sub>a</sub> = E<sub>a</sub>p<sub>a</sub>, ṗ<sub>a</sub> = −E<sub>a</sub>q<sub>a</sub>, angular velocity −E<sub>a</sub>. Exact at the equation level; it is not a claim that the atom is classical.';
  }

  // METERS
  const wMet = device({ id: 'meters', eyebrow: 'METERS', title: 'INVARIANTS · CLOCKS · STATUS', status: '' });
  rack.appendChild(wMet.root);
  const meters = createMeters(wMet.body);

  /* ── transport strip (§25) ─────────────────────────────────────────────── */
  const transport = (() => {
    const T = dom.transport;
    const play = el('button', 'tbtn play', T, '▶'); play.type = 'button'; play.title = 'play / pause  (space)';
    const rst = el('button', 'tbtn', T, '⏮'); rst.type = 'button'; rst.title = 't → 0  (home)';
    const sm = el('button', 'tbtn', T, '‹'); sm.type = 'button'; sm.title = 'step back  (←)';
    const sp = el('button', 'tbtn', T, '›'); sp.type = 'button'; sp.title = 'step forward  (→)';
    ui.scrub = fader({ label: 'SCRUB  t / window', min: 0, max: 1, value: 0, fmt: (v) => (v * clock.window).toFixed(2) + ' a.u.',
      onInput: (v) => { clock.scrub(v * clock.window + laps() * clock.window); schedule(TIER.EVOLVE); } });
    T.appendChild(ui.scrub.root);
    ui.rateKnob = knob({ label: 'RATE a.u./s', min: 0.1, max: 3000, value: 4, log: true, fmt: (v) => v >= 100 ? v.toFixed(0) : v.toFixed(1), onInput: (v) => clock.setRate(v) });
    T.appendChild(ui.rateKnob.root);
    const tro = readout({ label: 't  a.u.  (lap)', value: '0.00' });
    T.appendChild(tro.root);
    const laps = () => Math.floor(clock.t / clock.window);
    const stepDt = () => clock.window / 48;
    play.addEventListener('click', () => togglePlay());
    rst.addEventListener('click', () => { clock.reset(); shadowView.clearTrail(); schedule(TIER.EVOLVE); });
    sm.addEventListener('click', () => { clock.step(-stepDt()); schedule(TIER.EVOLVE); });
    sp.addEventListener('click', () => { clock.step(stepDt()); schedule(TIER.EVOLVE); });
    function update() {
      const on = clock.playing;
      play.textContent = on ? '❚❚' : '▶'; play.classList.toggle('on', on);
      if (!ui.scrub.dragging()) ui.scrub.set(((clock.t % clock.window) + clock.window) % clock.window / clock.window);
      tro.set(clock.t.toFixed(2) + (laps() ? '  (' + laps() + ')' : ''), on ? 'live' : '');
    }
    return { update, stepDt };
  })();
  function togglePlay() { clock.toggle(performance.now() / 1000); schedule(TIER.EVOLVE); hideHint(); }

  /* ── badges (§41) ─────────────────────────────────────────────────────── */
  const badges = (() => {
    const B = dom.badges; B.innerHTML = '';
    const mk = (cls, text) => { const b = el('button', 'badge ' + cls, B); b.type = 'button'; el('i', '', b); el('span', '', b, text); b.addEventListener('click', () => { dom.sheet.hidden = !dom.sheet.hidden; }); return b; };
    const b1 = mk('exact', 'EXACT ANALYTIC · state · evolution · shadow');
    const b2 = mk('numerical', 'NUMERICAL · FIELD');
    const b3 = mk('warn', ''); b3.hidden = true;
    let last = '';
    function update() {
      const rs = reg.renderSet(RENDER_CAP);
      const t2 = field.ok ? `NUMERICAL · FIELD ${field.resolution}³ · ±${domain.half} a₀ · f16` : 'NO FIELD · WebGPU unavailable';
      if (b2.lastChild.textContent !== t2) b2.lastChild.textContent = t2;
      b2.className = 'badge ' + (field.ok ? 'numerical' : 'bad');
      const warn = rs.masked ? `RENDERED ${rs.rendered}/${rs.populated} · ${(rs.coveredFraction * 100).toFixed(0)}% OF NORM · ${rs.masked} MUTED` : rs.truncated ? `TRUNCATED ${rs.rendered}/${rs.populated} · ${(rs.coveredFraction * 100).toFixed(0)}% OF NORM` : '';
      if (warn !== last) { last = warn; b3.hidden = !warn; b3.lastChild.textContent = warn; }
    }
    return { update };
  })();

  /* ── canvas gestures: the observer ─────────────────────────────────────── */
  {
    const cv = dom.canvas, pts = new Map(); let pinch0 = 0, dist0 = 0;
    cv.addEventListener('pointerdown', (e) => { cv.setPointerCapture(e.pointerId); pts.set(e.pointerId, { x: e.clientX, y: e.clientY }); dragging = true; cv.classList.add('drag'); hideHint();
      if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch0 = Math.hypot(a.x - b.x, a.y - b.y); dist0 = obs.dist; } });
    cv.addEventListener('pointermove', (e) => {
      const p = pts.get(e.pointerId); if (!p) return;
      if (pts.size === 1) { obs.yaw -= (e.clientX - p.x) * 0.0065; obs.pitch = Math.max(-1.52, Math.min(1.52, obs.pitch + (e.clientY - p.y) * 0.0065)); }
      p.x = e.clientX; p.y = e.clientY;
      if (pts.size === 2) { const [a, b] = [...pts.values()]; const d = Math.hypot(a.x - b.x, a.y - b.y); if (pinch0 > 0) obs.dist = Math.max(1.2, Math.min(8, dist0 * pinch0 / Math.max(1, d))); }
      schedule(TIER.PRESENT);
    });
    const up = (e) => { pts.delete(e.pointerId); if (!pts.size) { dragging = false; cv.classList.remove('drag'); } };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    cv.addEventListener('wheel', (e) => { e.preventDefault(); obs.dist = Math.max(1.2, Math.min(8, obs.dist * Math.pow(1.1, e.deltaY / 100))); schedule(TIER.PRESENT); }, { passive: false });
    cv.addEventListener('dblclick', () => { Object.assign(obs, { yaw: 0.65, pitch: 0.38, dist: 3.3 }); schedule(TIER.PRESENT); });
    new ResizeObserver(() => schedule(TIER.PRESENT)).observe(cv);
  }
  function hideHint() { if (dom.hint) dom.hint.classList.add('gone'); }
  setTimeout(hideHint, 9000);
  window.addEventListener('keydown', (e) => {
    const tag = (e.target && e.target.tagName) || '';
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    if (e.code === 'Space') { e.preventDefault(); togglePlay(); }
    else if (e.code === 'Home') { clock.reset(); schedule(TIER.EVOLVE); }
    else if (e.code === 'ArrowLeft') { clock.step(-transport.stepDt()); schedule(TIER.EVOLVE); }
    else if (e.code === 'ArrowRight') { clock.step(transport.stepDt()); schedule(TIER.EVOLVE); }
  });

  /* ── persistence (§46): experiment and presentation, separately ───────── */
  function serialize() {
    return { experiment: Object.assign(reg.serialize(clock.t), { rate: clock.rate, window: clock.window }),
      presentation: { obs: { ...obs }, mat: JSON.parse(JSON.stringify(mat)), quality: { ...quality }, domain: { ...domain }, shadow: shadowView.mode } };
  }
  function save() { try { const s = serialize(); localStorage.setItem(LS_EXP, JSON.stringify(s.experiment)); localStorage.setItem(LS_PRES, JSON.stringify(s.presentation)); wState.setStatus('saved', 'live'); } catch (e) { wState.setStatus('save failed', 'warn'); } }
  function restore(obj) {
    try {
      const ex = obj ? obj.experiment : JSON.parse(localStorage.getItem(LS_EXP) || 'null');
      const pr = obj ? obj.presentation : JSON.parse(localStorage.getItem(LS_PRES) || 'null');
      if (ex) { const t = reg.restore(ex); clock.pause(); clock.scrub(t); if (ex.rate) clock.setRate(ex.rate); if (ex.window) clock.window = ex.window; ui.rateKnob.set(clock.rate); ui.presetSel.value = reg.preset || ''; lastNmax = -1; setReference(); }
      if (pr) { Object.assign(obs, pr.obs || {}); Object.assign(mat, pr.mat || {}); Object.assign(quality, pr.quality || {}); Object.assign(domain, pr.domain || {}); ui.viewSeg.set(VIEW_NAMES[mat.view]); if (pr.shadow) { shadowView.setMode(pr.shadow); ui.shadowSeg.set(pr.shadow); } ui.domainAuto.set(domain.auto); ui.domainKnob.setDisabled(domain.auto); }
      schedule(TIER.REBUILD); wState.setStatus('restored', 'live');
      return true;
    } catch (e) { wState.setStatus('restore failed', 'warn'); return false; }
  }

  /* ── the diagnostics surface (tests and curiosity; one road) ──────────── */
  const LW = {
    ready: false, reg, clock, obs, mat, quality, domain, camera, fieldRate, stats, field, presets: PRESETS, TIER, shadowView, spectrum,
    loadPreset, schedule, togglePlay, setReference, serialize, restore, api,
    play() { clock.play(performance.now() / 1000); schedule(TIER.EVOLVE); }, pause() { clock.pause(); schedule(TIER.PRESENT); },
    scrub(t) { clock.scrub(t); schedule(TIER.EVOLVE); }, step(dt) { clock.step(dt); schedule(TIER.EVOLVE); },
    setMute(a, on) { reg.setMute(a, on); touchState(); }, setView(v) { mat.view = VIEW[v]; ui.viewSeg.set(v); schedule(TIER.PRESENT); },
    orbit(dy, dp) { obs.yaw += dy; obs.pitch += dp; schedule(TIER.PRESENT); },
    setShadowMode(m) { shadowView.setMode(m); ui.shadowSeg.set(m); schedule(TIER.PRESENT); },
    /** GPU throughput at the current settings: ms per frame for reconstruct+present, reconstruct, present (n back-to-back frames) */
    async gpuFrameMs(n = 60) { if (!field.ok) return null; field.resize(quality.scale); const r = await field.throughput({ modes: modesAt(clock.t), obs, mat, n }); r.half = domain.half; return r; },
    stateDigest: () => reg.digest(), meters: meterSnapshot, modesAt,
    cpuPsi(x, y, z) { const c = reg.at(clock.t); return psiAt(c.re, c.im, x, y, z, reg.renderSet(RENDER_CAP).ids); },
    readPixels: () => field.ok ? field.readPixels(obs, mat) : null,
    fieldDigest: () => field.ok ? field.fieldDigest() : null,
    sampleVoxel: (i, j, k) => field.ok ? field.sampleVoxel(i, j, k) : null,
    /** resolves after the next frame has run (so a scheduled tier has been applied) */
    settle() { return new Promise((res) => { schedule(TIER.PRESENT); requestAnimationFrame(() => requestAnimationFrame(() => res(stats.frames))); }); },
    version: 'QWAVE-0 hydrogen shadow lab · 2026-09-02'
  };
  window.__LW = LW;

  /* ── go ───────────────────────────────────────────────────────────────── */
  const q = new URLSearchParams(location.search);
  loadPreset(q.get('preset') && PRESET_BY_ID.has(q.get('preset')) ? q.get('preset') : '1s+2pz');
  if (q.get('view') && VIEW[q.get('view')] !== undefined) { mat.view = VIEW[q.get('view')]; ui.viewSeg.set(q.get('view')); }
  if (q.get('play') === '1') LW.play();
  LW.ready = true;
  return LW;
}
