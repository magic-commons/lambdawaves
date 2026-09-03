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
import { createField, tableFor, VIEW, VIEW_NAMES, STYLE, STYLE_NAMES } from './field.js';
import { el, knob, sw, seg, trig, fader, readout, device, group } from './kit.js';
import { createSpectrum } from './spectrum.js';
import { createMeters } from './meters.js';
import { createShadowView } from './shadowview.js';
import { createLadder } from './ladder.js';
import { createOrbit } from './orbit.js';
import { createVortex } from './vortex.js';
import { createParticles } from './particles.js';
import { createDynamics } from './dynamicsview.js';
import { createPaletteEditor } from './paletteview.js';
import { createSliceView } from './sliceview.js';
import { createQCD } from './qcdview.js';
import { toLUT } from './palette.js';
import { domainForP, momentumTableFor } from './momentum.js';
import { momentumZ, AXIS_TO_Z } from './kick.js';
import { applyRotor as rotorOnCopy } from './frontier.js';

export const TIER = { NONE: 0, PRESENT: 1, RECONSTRUCT: 2, EVOLVE: 3, REBUILD: 4 };
const TIER_NAME = ['NONE', 'PRESENT', 'RECONSTRUCT', 'EVOLVE', 'REBUILD'];
const LS_EXP = 'lambdawaves.q0.experiment', LS_PRES = 'lambdawaves.q0.presentation';

export async function boot(dom) {
  const reg = new Register();
  const __LW_hooks = {};
  const clock = new Clock();
  const obs = { yaw: 0.65, pitch: 0.38, dist: 3.3, fov: 0.6 };
  const mat = { view: VIEW.density, exposure: 1, softness: 0.7, steps: 160, slice: { mode: 0, axis: 2, pos: 0, thick: 0.03 }, hueShift: 0, invert: false, frame: true, paletteOn: false, style: STYLE.cloud, iso: 0.06, grain: 0.35, knee: 0.6 };
  let palette = null;
  let space = 'x';                 // 'x' position ψ(x) · 'p' momentum φ(p): the same state, two exact pictures
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
    return reg.renderSet(RENDER_CAP).ids.map((a) => ({ table: space === 'p' ? momentumTableFor(BASIS[a]) : tableFor(BASIS[a]), re: c.re[a], im: c.im[a] }));
  }
  function refModes() {
    if (!refSnapshot) return null;
    return refSnapshot.ids.map((a) => ({ table: space === 'p' ? momentumTableFor(BASIS[a]) : tableFor(BASIS[a]), re: refSnapshot.re[a], im: refSnapshot.im[a] }));
  }
  function applyRebuild() {
    if (domain.auto) domain.half = space === 'p' ? domainForP(reg.nmin()) : domainFor(reg.nmax(1e-3));   // ignore a slap's 1e-4 tails
    if (field.ok) field.setSpace(space === 'p' ? 1 : 0);
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
    orbit.update(obs);
    if (space === 'x') {                                             // the overlays are position-space objects
      vortex.update(reg, clock.t, obs, domain.half, clock.playing);
      if (particles.on) { particles.advance(reg, clock.t, domain.half); particles.draw(obs, domain.half); }
    } else { for (const c of [dom.vortex, dom.particles]) if (c) c.getContext('2d').clearRect(0, 0, c.width, c.height); }
    dynamics.update(reg, clock.t, clock.playing);
    slice.update(reg, clock.t, clock.playing);
    qcd.update();
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
    let s = reg.field.Fz !== 0 ? 'EXACT WITHIN EACH SHELL (Stark) · EXACT REAL shadow · NUMERICAL field'
      : reg.field.Bz !== 0 ? 'EXACT ANALYTIC state + evolution (Zeeman) · EXACT REAL shadow · NUMERICAL field'
      : 'EXACT ANALYTIC state + evolution · EXACT REAL shadow · NUMERICAL field';
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
    {
      const r0 = wObs.row();
      ui.spaceSeg = seg({ label: 'SPACE  ·  the same state, two exact pictures', value: 'x', options: [
        { id: 'x', label: 'POSITION ψ(x)', title: 'the wavefunction in space' },
        { id: 'p', label: 'MOMENTUM φ(p)', title: 'its Fourier transform in closed form (Podolsky–Pauling 1929) — under Fock\'s map every shell is rigid on S³, so the rotors merely TURN this picture' }],
        onChange: (v) => { space = v; schedule(TIER.REBUILD); } });
      r0.appendChild(ui.spaceSeg.root);
    }
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
    const gd = group(wObs.body, 'DRAW STYLE  ·  how the same observable is rendered  ·  the transfer has a bounded ceiling');
    const rd = el('div', 'row tight', gd);
    ui.styleSeg = seg({ label: 'STYLE', value: 'cloud', options: [
      { id: 'cloud', label: 'CLOUD', title: 'the emission/absorption integral' },
      { id: 'solid', label: 'SOLID', title: 'a bounded plateau: a lit isosurface whose level EXPOSURE moves — it cannot fill the box' },
      { id: 'grain', label: 'GRAIN', title: 'the same field as noisy particles: a per-voxel hash keeps a fraction of the samples' }],
      onChange: (v) => { mat.style = STYLE[v]; schedule(TIER.PRESENT); } });
    rd.appendChild(ui.styleSeg.root);
    rd.appendChild(knob({ label: 'ISO', min: 0.002, max: 0.9, value: 0.06, log: true, fmt: (v) => v.toFixed(3), onInput: (v) => { mat.iso = v; schedule(TIER.PRESENT); } }).root);
    rd.appendChild(knob({ label: 'GRAIN', min: 0.02, max: 1, value: 0.35, log: true, fmt: (v) => v.toFixed(2), onInput: (v) => { mat.grain = v; schedule(TIER.PRESENT); } }).root);
    rd.appendChild(knob({ label: 'KNEE', min: 0.02, max: 8, value: 0.6, log: true, fmt: (v) => v.toFixed(2), onInput: (v) => { mat.knee = v; schedule(TIER.PRESENT); } }).root);
    el('div', 'note', gd).innerHTML = 'Every style passes its weight through a <b>saturation knee</b> w ↦ w/(1+kw), so the opacity of a step tends to a finite ceiling as EXPOSURE grows: cranking the knob deepens the blob instead of glowing the whole field. <b>SOLID</b> draws the plateau ρ ≈ ISO as a lit surface (shaded by the density gradient), so EXPOSURE moves the surface rather than flooding the volume; <b>GRAIN</b> stipples the same field into particles. All three are DESIGN CHOICES — the observable itself is chosen above.';

    const gs = group(wObs.body, 'SLICE / CLIP  (observer only)');
    const r3 = el('div', 'row', gs);
    r3.appendChild(seg({ value: 'off', options: [{ id: 'off', label: 'VOLUME' }, { id: 'clip', label: 'CLIP' }, { id: 'slab', label: 'SLAB' }], onChange: (v) => { mat.slice.mode = { off: 0, clip: 1, slab: 2 }[v]; schedule(TIER.PRESENT); } }).root);
    r3.appendChild(seg({ value: 'z', options: [{ id: 'x', label: 'X' }, { id: 'y', label: 'Y' }, { id: 'z', label: 'Z' }], onChange: (v) => { mat.slice.axis = { x: 0, y: 1, z: 2 }[v]; schedule(TIER.PRESENT); } }).root);
    r3.appendChild(knob({ label: 'POS', min: -1, max: 1, value: 0, fmt: (v) => v.toFixed(2), onInput: (v) => { mat.slice.pos = v; schedule(TIER.PRESENT); } }).root);
    r3.appendChild(knob({ label: 'THICK', min: 0.01, max: 0.4, value: 0.03, log: true, fmt: (v) => v.toFixed(3), onInput: (v) => { mat.slice.thick = v; schedule(TIER.PRESENT); } }).root);
    const gp = group(wObs.body, 'PHASE PALETTE  ·  the colouring of the complex plane  (a DESIGN CHOICE; ψ untouched)');
    palette = createPaletteEditor(gp, {
      setLUT(lut) { if (field.ok) field.setPalette(lut); },
      setEnabled(v) { mat.paletteOn = v; if (v) { mat.view = VIEW.phase; ui.viewSeg.set('phase'); } },
      repaint() { schedule(TIER.PRESENT); }
    });
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
    r2.appendChild(knob({ label: 'ROTATE z', min: 0, max: 2 * Math.PI, value: 0, wrap: true, cls: 'rot', fmt: () => 'D(R_z)', onDelta: (d) => { reg.rotateZ(d); touchState(); } }).root);
    r2.appendChild(knob({ label: 'STARK K_z', min: 0, max: 2 * Math.PI, value: 0, wrap: true, cls: 'rot', fmt: () => 'e^{−iθK_z}', onDelta: (d) => { reg.rotateK(d); touchState(); } }).root);
    r2.appendChild(knob({ label: 'DEFECT L²', min: 0, max: 2 * Math.PI, value: 0, wrap: true, cls: 'rot', fmt: () => 'e^{iαL²}', onDelta: (d) => { reg.defectWait(d); touchState(); } }).root);
    el('div', 'note', wState.body).innerHTML = '<b>STATE ROTATE</b> applies D(R_z(α)) to the coefficients (c<sub>nlm</sub> → e<sup>−imα</sup>c<sub>nlm</sub>). <b>STARK ROTATE</b> applies e<sup>−iθK<sub>z</sub></sup>, K the Runge–Lenz vector: an SO(4) rotation mixing l at fixed (n, m) — the ORBIT invariants do not move. <b>DEFECT WAIT</b> applies e<sup>iαL²</sup> (a wait under an l-dependent phase, a quantum defect): unitary, in-shell, not an SO(4) element — the invariants move, and with the rotors it is a universal gate set. All three change c; <b>camera</b> orbit is in OBSERVER and never touches c. Edits happen at the current logical time; nothing is silently renormalized.';
    /* ── SLAP: a sudden momentum impulse — exact operator, the register's image of it, the loss reported ── */
    const gK = group(wState.body, 'SLAP  ·  a sudden impulse  ψ ↦ e^{ik·x}ψ  (the impulsive Stark limit, Δp = −∫E dt)');
    const rk = el('div', 'row tight', gK);
    let kickK = 0.2, kickAxis = 'z';
    rk.appendChild(knob({ label: 'IMPULSE k', min: 0.01, max: 1.5, value: 0.2, log: true, fmt: (v) => v.toFixed(3) + ' a.u.', onInput: (v) => { kickK = v; } }).root);
    ui.kickAxis = seg({ label: 'ALONG', value: 'z', options: [{ id: 'x', label: 'x' }, { id: 'y', label: 'y' }, { id: 'z', label: 'z' }], onChange: (v) => { kickAxis = v; } });
    rk.appendChild(ui.kickAxis.root);
    rk.appendChild(trig({ label: 'SLAP', title: 'kick the electron: ψ ↦ e^{ik·x}ψ at the current logical time (also: the K key, along the X/Y/Z axis)', onFire: () => slap(kickK, kickAxis) }).root);
    ui.kickRo = readout({ label: 'LAST SLAP  escaped · ⟨p⟩ gained', value: '—', cls: 'two', sub: 'nothing slapped yet' });
    rk.appendChild(ui.kickRo.root);
    el('div', 'note', gK).innerHTML = 'A sudden impulse multiplies ψ by a plane wave: exact, unitary on the full space, and the same thing a delta-pulse electric field does. The register keeps only its n ≤ 6 image, so the norm DROPS by the probability the electron was knocked out of the first six shells or ionised — <b>ESCAPED</b> is that number, never renormalised away. The momentum the register gains is Ehrenfest\'s k times the bound share of the Thomas–Reiche–Kuhn sum rule (0.546 for 1s): the missing part is the continuum. Then it <b>jiggles</b>: the state is a superposition and rings at its beats — watch DYNAMICS\' dipole. A magnetic slap is a rotation of the state, which the rotor knobs already are.';
    function pAlong(axis) {
      const c = reg.at(clock.t);                                  // sum over the WHOLE register: a rotation moves amplitude between m
      if (axis === 'z') return momentumZ(c.re, c.im);
      const R = AXIS_TO_Z[axis], re = Float64Array.from(c.re), im = Float64Array.from(c.im);
      rotorOnCopy(re, im, { which: 'both', axis: R.axis, angle: R.angle });
      return momentumZ(re, im);
    }
    function slap(k, axis) {
      const n0 = reg.norm2(), p0 = pAlong(axis);
      reg.kick(k, axis, clock.t);
      const n1 = reg.norm2(), p1 = pAlong(axis);
      const esc = n0 > 0 ? 1 - n1 / n0 : 0;
      ui.kickRo.set(`${(100 * esc).toFixed(2)}% · ${(p1 - p0).toFixed(4)}`, esc > 0.2 ? 'warn' : 'ok');
      ui.kickRo.setSub(`k = ${k.toFixed(3)} along ${axis} · Ehrenfest would give ${k.toFixed(3)}; the deficit is the continuum · norm now ${Math.sqrt(n1).toFixed(4)}`);
      touchState();
    }
    __LW_hooks.slap = slap;

    const gF = group(wState.body, 'STATIC FIELD  (changes H, not ψ — the evolution law itself)');
    const rf = el('div', 'row tight', gF);
    ui.bz = knob({ label: 'ZEEMAN B', min: 0, max: 0.05, value: 0, fmt: (v) => v === 0 ? 'off' : v.toFixed(4), onInput: (v) => { reg.setField({ Bz: v }); touchState(); } });
    ui.fz = knob({ label: 'STARK F', min: 0, max: 0.01, value: 0, fmt: (v) => v === 0 ? 'off' : v.toExponential(1), onInput: (v) => { reg.setField({ Fz: v }); touchState(); } });
    rf.appendChild(ui.bz.root); rf.appendChild(ui.fz.root);
    rf.appendChild(trig({ label: 'NO FIELD', onFire: () => { reg.setField({ Bz: 0, Fz: 0 }); ui.bz.set(0); ui.fz.set(0); touchState(); } }).root);
    ui.fieldRo = readout({ label: 'H IN FORCE', value: 'H₀ (bare Coulomb)', cls: 'two', sub: '' });
    rf.appendChild(ui.fieldRo.root);
    el('div', 'note', gF).innerHTML = '<b>ZEEMAN</b> H = H₀ + (B/2)L<sub>z</sub> stays diagonal, so it is exact with no caveat (orbital only: this register has no spin). <b>STARK</b> H = H₀ + F·z is exact <i>within each shell</i> — on a shell z = −(3n/2)K<sub>z</sub>, whose eigenvectors are the parabolic states and are field-independent — but coupling between shells is neglected, which needs F ≪ 1/(3n⁵). Turn the field on and the Stark state stops moving: it has become an eigenstate.';

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

  // ORBIT — the two rotors (print, Thread B)
  const wOrb = device({ id: 'orbit', eyebrow: 'ORBIT', title: 'THE TWO ROTORS · SO(4) INVARIANTS', status: 'exact · per shell' });
  rack.appendChild(wOrb.root);
  const orbit = createOrbit(wOrb.body, { reg, setStatus: (t, c) => wOrb.setStatus(t, c), rotor(spec) { reg.rotor(spec); touchState(); } });

  // VORTEX — the nodal lines (print, Thread C)
  const wVor = device({ id: 'vortex', eyebrow: 'VORTEX', title: 'NODAL LINES · UNIMODULAR ROOTS OF P(w)', status: 'exact on sampled circles' });
  rack.appendChild(wVor.root);
  const vortex = createVortex(wVor.body, dom.vortex, { reg, clock, scrubTo: (t) => { clock.scrub(t); schedule(TIER.EVOLVE); } });

  // DYNAMICS — the Lagrangian picture, the action–angle chart, the dipole, and the particle view
  const particles = createParticles(dom.particles, {});
  const wDyn = device({ id: 'dynamics', eyebrow: 'DYNAMICS', title: 'LAGRANGIAN · ACTION · DIPOLE · PARTICLES', status: 'exact · reads c(t)' });
  rack.appendChild(wDyn.root);
  const dynamics = createDynamics(wDyn.body, {
    particles,
    seedParticles(n) { particles.seed(n, reg, clock.t, domain.half); },
    repaint() { schedule(TIER.PRESENT); }
  });

  // SLICE — a rotatable complex plane through ψ (the 4D engine's rotor pair, carrying hydrogen's own 4-space)
  const wSlice = device({ id: 'slice', eyebrow: 'SLICE', title: 'COMPLEX PLANE · ROTOR · KS ℝ⁴', status: 'observer · domain colouring' });
  rack.appendChild(wSlice.root);
  const slice = createSliceView(wSlice.body, {
    lut: () => (palette && palette.on ? toLUT(palette.stops) : null),
    repaint() { schedule(TIER.PRESENT); }
  });

  // QCD — the confining side: quarkonium under a chosen potential, the flavour-independence verdict, the string
  const wQCD = device({ id: 'qcd', eyebrow: 'QCD', title: 'QUARKONIUM · CORNELL · THE STRING', status: 'numerical · Numerov' });
  rack.appendChild(wQCD.root);
  const qcd = createQCD(wQCD.body, { repaint() { schedule(TIER.PRESENT); } });

  // METERS
  const wMet = device({ id: 'meters', eyebrow: 'METERS', title: 'INVARIANTS · CLOCKS · STATUS', status: '' });
  rack.appendChild(wMet.root);
  const meters = createMeters(wMet.body);

  // LADDER — the Rydberg revival as a spectral instrument (print, Thread A); its own register, no field
  const wLad = device({ id: 'ladder', eyebrow: 'LADDER', title: 'RYDBERG REVIVAL · SPECTRAL', status: 'own register · no field' });
  rack.appendChild(wLad.root);
  const ladder = createLadder(wLad.body);

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
    const b4 = mk('warn', ''); b4.hidden = true;
    let last = '', lastF = '';
    function update() {
      const f = reg.field.Fz !== 0 ? `STARK F = ${reg.field.Fz.toExponential(1)} · EXACT WITHIN EACH SHELL (F ≪ ${reg.fieldValidUpTo().toExponential(1)})`
        : reg.field.Bz !== 0 ? `ZEEMAN B = ${reg.field.Bz.toFixed(4)} · exact` : '';
      if (f !== lastF) { lastF = f; b4.hidden = !f; b4.lastChild.textContent = f; b4.className = 'badge ' + (reg.field.Fz !== 0 ? 'warn' : 'exact'); }
      b1.lastChild.textContent = reg.field.Fz !== 0 ? 'EXACT ANALYTIC · state · shadow (evolution: per shell)' : 'EXACT ANALYTIC · state · evolution · shadow';
      if (ui.fieldRo) {
        ui.fieldRo.set(reg.field.Fz !== 0 ? 'H₀ + F z' : reg.field.Bz !== 0 ? 'H₀ + (B/2)L_z' : 'H₀ (bare Coulomb)', reg.field.Fz !== 0 ? 'warn' : reg.field.Bz !== 0 ? 'live' : '');
        ui.fieldRo.setSub(reg.field.Fz !== 0 ? `within-shell exact · needs F ≪ ${reg.fieldValidUpTo().toExponential(1)}` : reg.field.Bz !== 0 ? 'diagonal: exact, no caveat' : 'the register\'s own Hamiltonian');
      }
      const rs = reg.renderSet(RENDER_CAP);
      const t2 = field.ok ? `NUMERICAL · FIELD ${field.resolution}³ · ±${space === 'p' ? domain.half.toFixed(2) + ' a₀⁻¹ · MOMENTUM' : domain.half + ' a₀'} · f16` : 'NO FIELD · WebGPU unavailable';
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
  /**
   * KEYS.  Transport on the arrows and space; the camera on WASD/QE with shift for a fine step; the ROTATION AXIS
   * on X/Y/Z, so [ and ] turn the STATE about the chosen axis (and with shift, the Runge–Lenz rotation about it).
   * The axis keys never move the camera and the camera keys never touch ψ — the badge on each window says which.
   */
  const keyState = { axis: 'z', which: 'both' };
  function keyHelp() { return `axis ${keyState.axis.toUpperCase()} · rotor ${keyState.which}`; }
  window.addEventListener('keydown', (e) => {
    const tag = (e.target && e.target.tagName) || '';
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    const fine = e.shiftKey ? 0.25 : 1, step = 0.12 * fine;
    switch (e.code) {
      case 'Space': e.preventDefault(); togglePlay(); return;
      case 'Home': clock.reset(); schedule(TIER.EVOLVE); return;
      case 'ArrowLeft': clock.step(-transport.stepDt() * fine); schedule(TIER.EVOLVE); return;
      case 'ArrowRight': clock.step(transport.stepDt() * fine); schedule(TIER.EVOLVE); return;
      case 'ArrowUp': obs.dist = Math.max(1.2, obs.dist / (1 + 0.12 * fine)); schedule(TIER.PRESENT); return;
      case 'ArrowDown': obs.dist = Math.min(8, obs.dist * (1 + 0.12 * fine)); schedule(TIER.PRESENT); return;
      /* camera (OBSERVER: never touches ψ) */
      case 'KeyA': obs.yaw -= step; schedule(TIER.PRESENT); return;
      case 'KeyD': obs.yaw += step; schedule(TIER.PRESENT); return;
      case 'KeyW': obs.pitch = Math.min(1.52, obs.pitch + step); schedule(TIER.PRESENT); return;
      case 'KeyS': obs.pitch = Math.max(-1.52, obs.pitch - step); schedule(TIER.PRESENT); return;
      case 'KeyQ': obs.dist = Math.max(1.2, obs.dist / (1 + 0.1 * fine)); schedule(TIER.PRESENT); return;
      case 'KeyE': obs.dist = Math.min(8, obs.dist * (1 + 0.1 * fine)); schedule(TIER.PRESENT); return;
      case 'KeyR': Object.assign(obs, { yaw: 0.65, pitch: 0.38, dist: 3.3 }); schedule(TIER.PRESENT); return;
      /* the rotation axis, and the rotor the brackets drive (STATE: changes ψ) */
      case 'KeyX': case 'KeyY': case 'KeyZ': keyState.axis = e.code.slice(3).toLowerCase(); wState.setStatus(keyHelp(), 'live'); return;
      case 'Digit1': keyState.which = 'both'; wState.setStatus(keyHelp(), 'live'); return;
      case 'Digit2': keyState.which = '+'; wState.setStatus(keyHelp(), 'live'); return;
      case 'Digit3': keyState.which = '−'; wState.setStatus(keyHelp(), 'live'); return;
      case 'Digit4': keyState.which = 'K'; wState.setStatus(keyHelp(), 'live'); return;
      case 'BracketLeft': reg.rotor({ which: keyState.which, axis: keyState.axis, angle: -step, t: clock.t }); touchState(); return;
      case 'BracketRight': reg.rotor({ which: keyState.which, axis: keyState.axis, angle: step, t: clock.t }); touchState(); return;
      /* the slap along the chosen axis */
      case 'KeyK': if (__LW_hooks.slap) __LW_hooks.slap(0.2 * fine, keyState.axis); return;
      /* draw style */
      case 'KeyC': { const order = ['cloud', 'solid', 'grain']; const nx = order[(order.indexOf(STYLE_NAMES[mat.style]) + 1) % 3]; mat.style = STYLE[nx]; ui.styleSeg.set(nx); schedule(TIER.PRESENT); return; }
      case 'KeyV': { const order = ['density', 'phase', 'real', 'imag', 'diff']; const nx = order[(order.indexOf(VIEW_NAMES[mat.view]) + 1) % 5]; mat.view = VIEW[nx]; ui.viewSeg.set(nx); schedule(TIER.PRESENT); return; }
      case 'KeyP': if (palette) palette.setOn(!palette.on); return;
      default: return;
    }
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
    ready: false, reg, clock, obs, mat, quality, domain, camera, fieldRate, stats, field, presets: PRESETS, TIER, shadowView, spectrum, orbitView: orbit, vortex, ladder, particles, dynamics, slice, qcd, kick(k, axis = 'z') { if (__LW_hooks.slap) __LW_hooks.slap(k, axis); }, get space() { return space; }, setSpace(s) { space = s; if (ui.spaceSeg) ui.spaceSeg.set(s); schedule(TIER.REBUILD); }, get palette() { return palette; },
    loadPreset, schedule, togglePlay, setReference, serialize, restore, api,
    rotateK(th) { reg.rotateK(th); touchState(); }, defectWait(a) { reg.defectWait(a); touchState(); },
    rotor(spec) { reg.rotor(spec); touchState(); },
    seedParticles(n = 160) { particles.setOn(true); const k = particles.seed(n, reg, clock.t, domain.half); schedule(TIER.PRESENT); return k; },
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
    version: 'QWAVE-0.1 hydrogen shadow lab · FRONTIER · 2026-09-03'
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
