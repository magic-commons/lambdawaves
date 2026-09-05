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
import { BASIS, domainFor, psiAt, stateOf, orbitalFromTable } from './hydrogen.js';
import { Register, PRESETS, PRESET_BY_ID, RENDER_CAP } from './state.js';
import { Clock } from './clock.js';
import { createField, tableFor, VIEW, VIEW_NAMES, STYLE, STYLE_NAMES, cameraBasis } from './field.js';
import { el, knob, sw, seg, trig, fader, readout, device, group } from './kit.js';
import { createSpectrum } from './spectrum.js';
import { createMeters } from './meters.js';
import { createShadowView } from './shadowview.js';
import { createLadder } from './ladder.js';
import { createOrbit } from './orbit.js';
import { createVortex } from './vortex.js';
import { createParticles } from './particles.js';
import { createKepler } from './keplerview.js';
import { keplerOrbits } from './kepler.js';
import { createGas } from './gas.js';
import { densityPeriod, fmtPeriod } from './period.js';
import { createMolecule } from './moleculeview.js';
import { createMOPanel } from './moview.js';
import { createHelium } from './heliumview.js';
import { createH2 } from './h2view.js';
import { createCalculus } from './calculusview.js';
import { createDynamics } from './dynamicsview.js';
import { createPaletteEditor } from './paletteview.js';
import { createSliceView } from './sliceview.js';
import { createQCD } from './qcdview.js';
import { createAtoms } from './atomsview.js';
import { createFieldLines } from './fieldview.js';
import { createWigner } from './wignerview.js';
import { createRadiation } from './radiationview.js';
import { ATOMS, configOf } from './atoms.js';
import { toLUT, PRESET_BY_ID as PALETTE_BY_ID, rgbToOklab, oklabToRgb, rgbToHex } from './palette.js';
import { domainForP, momentumTableFor } from './momentum.js';
import { momentumZ, AXIS_TO_Z, rotorsToZ, warmStep as kickWarm, tablesReady as kickReady } from './kick.js';
import { getHamiltonian, setHamiltonian, HAMILTONIANS, setZ, getZ } from './hamiltonian.js';
import { createRegisterSturmian } from './sturmianreg.js';
import { wellPacket, wellCentroid } from './well.js';
import { applyRotor as rotorOnCopy } from './frontier.js';
import { createHistory } from './history.js';

/* THE BUILD STAMP — one constant, and every wave updates it.  The ABOUT face and its copy dump both read it here;
   nothing else in the app hand-writes a version, so a stale line can only come from forgetting THIS line. */
const BUILD_LINE = 'PRE-ALPHA · waves 5–48 · 2026-09-05';

export const TIER = { NONE: 0, PRESENT: 1, RECONSTRUCT: 2, EVOLVE: 3, REBUILD: 4 };
const TIER_NAME = ['NONE', 'PRESENT', 'RECONSTRUCT', 'EVOLVE', 'REBUILD'];
const LS_EXP = 'lambdawaves.q0.experiment', LS_PRES = 'lambdawaves.q0.presentation';

export async function boot(dom) {
  const reg = new Register();
  const __LW_hooks = {};
  /* UNDO / REDO: the ring is built at the foot of boot(), once every path it writes through exists; hNote() is
     the "an edit may have happened" ping for the few register-side setters that do not bump reg.version */
  let history = null;
  const hNote = () => { if (history) history.note(); };
  const clock = new Clock();
  const obs = { yaw: 0.65, pitch: 0.38, dist: 3.3, fov: 0.6 };
  const mat = { view: VIEW.phase, exposure: 1, softness: 0.7, steps: 160, slice: { mode: 0, axis: 2, pos: 0, thick: 0.03 }, hueShift: 0, invert: false, frame: true, paletteOn: false, style: STYLE.cloud, iso: 0.06, grain: 0.35, knee: 0.6, boost: { k: [0, 0, 0], on: false }, bg: [0.028, 0.038, 0.058], gamma: 1, lightUI: false };
  let palette = null;
  /* per-label RATE (Josh): a multiplier on each label's own E — 1 everywhere is the Hamiltonian in force; anything else is a TOY */
  const rates = new Float64Array(91).fill(1);
  const energyOf = (a) => getHamiltonian().energy(a) * rates[a];
  /* W-STURMIAN (Josh: a SWITCH — HYDROGEN is today's code path, untouched; STURMIAN adds).  The SCALE λ gives all 91 radials one
     exponent; sturm.P is the propagator in force (null = the diagonal law) and sturm.rec the records the FIELD draws (n_rec = 1/λ) */
  const sturm = { on: false, lambda: 1, P: null, rec: null, buildMs: 0, roVersion: -1 };
  const labelExpect = (a) => sturm.P.H[a * 91 + a] / sturm.P.S[a * 91 + a];          // a label's ⟨a|H|a⟩/⟨a|S|a⟩ under the scale — NOT an eigenvalue
  /* ── THE WHEEL AS THE UI's ACCENT ──────────────────────────────────────────
   * Two angles on the CURRENT palette (the editor's stops, whether or not the phase view uses them, shifted by the
   * HUE knob) colour every accent in the interface — --acc and --acc2 on the body — so rotating the wheel recolours
   * the whole UI.  The logo is the same wheel: λ is the colour at 0° and the nine squares are the wheel at 0°, 40°,
   * … 320° in reading order.  For legibility the two UI accents have their OKLab lightness held to the theme's
   * range (≥ 0.62 on DARK, ≤ 0.62 on LIGHT); the logo takes the wheel's colours verbatim. */
  let wheelLUT = toLUT(PALETTE_BY_ID.get('lambda').stops);
  const accent = { a: 0, b: 162, vivid: 0 };
  function wheelColor(deg) { const u = ((deg / 360 + (mat.hueShift || 0)) % 1 + 1) % 1; const i = Math.min(255, Math.floor(u * 256)) * 4; return [wheelLUT[i], wheelLUT[i + 1], wheelLUT[i + 2]]; }
  function legible(rgb) { const lab = rgbToOklab(rgb), light = document.body.dataset.theme === 'light'; const L = light ? Math.min(lab[0], 0.62) : Math.max(lab[0], 0.62); return L === lab[0] ? rgb : oklabToRgb([L, lab[1], lab[2]]); }
  function applyAccent() {
    const boost = (rgb) => { if (!accent.vivid) return rgb; const lab = rgbToOklab(rgb), k = 1 + 2.2 * accent.vivid; return oklabToRgb([lab[0], lab[1] * k, lab[2] * k]); };   // VIVID: more chroma toward neon
    const A = boost(legible(wheelColor(accent.a))), B = boost(legible(wheelColor(accent.b))), st = document.body.style;
    st.setProperty('--acc-glow', '0 0 ' + (8 + 18 * accent.vivid).toFixed(0) + 'px color-mix(in srgb, var(--acc) ' + Math.round(55 + 40 * accent.vivid) + '%, transparent)');
    st.setProperty('--acc', rgbToHex(A)); st.setProperty('--acc2', rgbToHex(B)); st.setProperty('--acc-ink', rgbToOklab(A)[0] > 0.6 ? '#071114' : '#f2f5f7');
    paintMarks();
  }
  /* THE MARK IS PAINTED IN ONE PLACE (wave 48, Josh: "Continue letting the about page logo match the dynamic logo
     up top").  There are three copies of the wheel now — the header's, the ABOUT face's clone and the BUSY mark's —
     and before this they diverged the moment the clone was taken, because only '#title .mark rect' was ever repainted.
     One selector, nine samples, `i % 9` so every copy gets the SAME nine: λ at 0°, the squares at 0°, 40°, … 320°. */
  function paintMarks() {
    for (const lam of document.querySelectorAll('#title .lam, .nb-logo .lam')) lam.style.color = rgbToHex(wheelColor(0));
    document.querySelectorAll('#title .mark rect, .nb-logo .mark rect, #busyMark .mark rect').forEach((r, i) => r.setAttribute('fill', rgbToHex(wheelColor((i % 9) * 40))));
  }
  /* ── SETTINGS: what this browser remembers (theme, chrome, accents, quality, closed windows) ── */
  const SETTINGS_KEY = 'lambdawaves.q0.settings';
  let settingsLoaded = false;
  function readSettings() { try { return JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}'); } catch (e) { return {}; } }
  document.body.dataset.card = readSettings().card === 'tinted' ? 'tinted' : 'refractive';   // before a single window is built, so the FIRST paint is already this browser's glass
  function saveSettings() {
    if (!settingsLoaded) return;
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify({ theme: document.body.dataset.themeChoice || document.body.dataset.theme || 'light', badges: !document.body.classList.contains('no-badges'), hint: !document.body.classList.contains('no-hint'), captions: !document.body.classList.contains('no-captions'),
        frost: gov.frostHeld || document.body.classList.contains('frost'), blur: ui.blurK ? ui.blurK.get() : 18, card: document.body.dataset.card || 'refractive', accent: [accent.a, accent.b, accent.vivid], auto: quality.auto, governor: gov.on, keepFrames: keep.frames, closed: [...document.querySelectorAll('.dev.closed')].map((d) => d.dataset.id) }));
    } catch (e) {}
  }
  /* CARD STYLE (wave 47, Josh): the glass every card and chrome pane is made of.  REFRACTIVE is the blur alone — the
     pane is transparent and what you read through it is the field; TINTED puts the theme's tinted pane back under the
     blur.  The rules are skin.css §14c; this only says which of the two the body wears, and remembers it per browser. */
  function setCardStyle(id) {
    const c = id === 'tinted' ? 'tinted' : 'refractive';
    document.body.dataset.card = c;
    if (ui.cardSeg) ui.cardSeg.set(c);
    saveSettings();
    return c;
  }
  function applySettings() {
    const s = readSettings();
    if (__LW_hooks.setTheme) __LW_hooks.setTheme(s.theme || 'light');
    if (s.badges === false) { document.body.classList.add('no-badges'); if (ui.badgesSw) ui.badgesSw.set(false); }
    if (s.hint === false) { document.body.classList.add('no-hint'); if (ui.hintSw) ui.hintSw.set(false); }
    if (s.captions === false) { document.body.classList.add('no-captions'); if (ui.capSw) ui.capSw.set(false); }
    if (s.frost) { document.body.classList.add('frost'); if (ui.frostSw) ui.frostSw.set(true); }
    setCardStyle(s.card);                                                     // wave 47: the glass of the cards — REFRACTIVE unless this browser said otherwise
    if (typeof s.blur === 'number') { document.documentElement.style.setProperty('--glass-blur', s.blur.toFixed(1) + 'px'); if (ui.blurK) ui.blurK.set(s.blur); }
    if (Array.isArray(s.accent)) { accent.a = +s.accent[0] || 0; accent.b = +s.accent[1] || 0; if (ui.accA) ui.accA.set(accent.a); if (ui.accB) ui.accB.set(accent.b); accent.vivid = +s.accent[2] || 0; if (ui.vivid) ui.vivid.set(accent.vivid); applyAccent(); }
    if (s.auto === false) { quality.auto = false; if (ui.autoSw) ui.autoSw.set(false); }
    if (s.governor === false) setGovernor(false);                 // wave 45: the governor held off
    if (s.keepFrames === true) setKeepFrames(true);              // wave 45: the playhead follows every frame (off by default)
    if (Array.isArray(s.closed)) for (const d of document.querySelectorAll('.dev')) d.classList.toggle('closed', s.closed.includes(d.dataset.id));   // the remembered set, exactly
    settingsLoaded = true;
  }
  /* the window taxonomy (Josh, 2026-09-04): CORE is the instrument; INFO panels read and report — they keep their
     captions visible and carry a COPY digest for the notebook; CONTROL surfaces and OTHER models are niche and start folded */
  const KIND = { state: 'core', spectrum: 'core', observer: 'core', palette: 'core', style: 'core', camera: 'core', clip: 'core', transport: 'core', settings: 'other', about: 'other', shadow: 'info', vortex: 'info', slice: 'info', calculus: 'info', meters: 'info', ladder: 'info', orbit: 'control', dynamics: 'control', qcd: 'info', atoms: 'info', field: 'control', molecule: 'other', helium: 'other', h2: 'other', wigner: 'info', radiation: 'info' };
  const live = (w) => !(w && w.root && w.root.classList.contains('off'));
  const DIGESTS = {};
  let space = 'x';                 // 'x' position ψ(x) · 'p' momentum φ(p): the same state, two exact pictures
  const quality = { res: 96, steps: 160, scale: 1, auto: true, autoScale: 1, minScale: 0.35 };
  /* AUTO render scale: the canvas backing resolution follows the measured frame interval (rAF cadence, which is what a GPU-bound
     device shows), stepping down while presented frames run slower than 45 fps and back up while they run faster than 80 fps */
  const autoQ = { n: 0, presented: 0, ema: 0, lastMs: 0, changes: 0 };
  /* ── THE GOVERNOR (wave 45): AUTO SCALE extended.  The last 60 presented frames' median against a 28 ms budget: over
     it, the field grid steps one notch down (128 → 96 → 64) and the READER LAW tightens; 3 s under 22 ms steps back up;
     paused, nothing is governed and the user's grid comes back at once.  quality.res stays the USER's choice (and the
     project's); gov.drop is this browser's, never serialised. ── */
  const RES_LADDER = [64, 96, 128];
  const gov = { on: true, drop: 0, frostHeld: false, median: 0, ring: new Float32Array(60), n: 0, okSince: 0, since: 0, changes: 0, scroll: 0, parked: new Map() };
  /* FROST under load (wave 45, measured on Josh's own settings — 128³, FROST 21 px): the backdrop blur of both racks is
     recomposited on every frame because the field beneath changes on every frame, and it took the frame from 17 ms to
     82 ms (13 fps) while the loop's own work stayed at 3 ms — no grid notch can touch that.  So when the frame is far
     longer than the maths in it and FROST is on, the governor SUSPENDS the blur while the transport plays and brings it
     back on pause; the switch stays on, the setting is kept, and the governor's own switch holds all of this off. */
  function holdFrost(on) {
    if (on && !gov.frostHeld && document.body.classList.contains('frost')) { gov.frostHeld = true; document.body.classList.remove('frost'); gov.changes++; return true; }
    if (!on && gov.frostHeld) { gov.frostHeld = false; document.body.classList.add('frost'); gov.changes++; return true; }
    return false;
  }
  const effectiveRes = () => { if (!gov.drop) return quality.res; let i = RES_LADDER.findIndex((r) => r >= quality.res); if (i < 0) i = RES_LADDER.length - 1; return RES_LADDER[Math.max(0, i - gov.drop)]; };
  const READER_LAW = { park: 16, slow: 6, parkDrop: 8, slowDrop: 3 };   // ms per update: parked while playing / slowed to every 6 × cost — and the tighter pair once stepped down
  /* KEEP FRAMES (wave 45, Josh): off by default — the playhead does not follow the clock, the scrub bar is disabled
     and never repainted (each repaint was a style write on the transport's glass at the display rate); RATE and
     play / pause work as before.  A SETTINGS switch; this browser's, never a project's. */
  const keep = { frames: false };
  const domain = { auto: true, half: 7 };
  const camera = { autoRotate: false, speed: 0.25 };
  const fieldRate = { capMs: 0 };
  /* PERFORMANCE: 'full' updates every CPU window every frame; '120' updates them every 4th frame (≈30 Hz at 120 Hz)
     while the FIELD still presents every frame — the picture never waits for a readout.  The profile is an EMA of
     the milliseconds each stage costs per frame, so the mode is chosen on numbers, not on faith. */
  const perf = { mode: 'full', cpuEvery: 1, profile: { total: 0, field: 0, spectrum: 0, shadow: 0, orbit: 0, overlays: 0, dynamics: 0, slice: 0, qcd: 0, molecule: 0, calculus: 0, meters: 0, atoms: 0, wigner: 0, radiation: 0 }, counts: { frames: 0, cpu: 0 }, ring: new Float64Array(60), work: {}, wall: {} };   // work: an EMA of the cost of the updates that DID work (≥ 1 ms), wall: when the last one ran
  const tick = (name, fn) => { const a = performance.now(); fn(); const d = performance.now() - a; perf.profile[name] = perf.profile[name] * 0.9 + d * 0.1; if (d >= 1) { perf.work[name] = perf.work[name] ? perf.work[name] * 0.7 + d * 0.3 : d; perf.wall[name] = a; } };
  /** THE READER LAW (wave 45).  While the transport PLAYS and the governor is on, a window whose update was measured over
      a frame's budget is PARKED — it runs on pause or edit, and its status says so — one over half a frame runs at most
      every 6 × its cost, and the rack's own scroll makes every reader yield for 150 ms.  Paused, every reader runs on
      every frame exactly as before, so nothing a proof reads after settle() has changed.  The SLICE was the case: a 128²
      resample of every populated mode, 20–100 ms each at 8 Hz — every hitch of the idle histogram, and 134 ms per call
      after a bow (wave 45's measurements). */
  const READERS = {};
  function may(name, w) {
    if (!clock.playing || !gov.on) { if (gov.parked.has(name)) unpark(name, w); return true; }
    const now = performance.now();
    if (now - gov.scroll < 150) return false;
    const cost = perf.work[name] || 0, park = gov.drop ? READER_LAW.parkDrop : READER_LAW.park, slow = gov.drop ? READER_LAW.slowDrop : READER_LAW.slow;
    if (cost > park) { if (!gov.parked.has(name)) parkReader(name, w, cost); return false; }
    if (gov.parked.has(name)) unpark(name, w);
    if (cost > slow && now - (perf.wall[name] || 0) < Math.max(250, 6 * cost)) return false;
    return true;
  }
  function parkReader(name, w, cost) {
    const st = w && w.root ? w.root.querySelector('.dev-stat') : null, prev = st ? st.textContent : '', cls = st ? st.className : 'dev-stat';
    const note = (prev ? prev + ' · ' : '') + 'PARKED by the GOVERNOR: ' + cost.toFixed(0) + ' ms per update — runs on pause or edit';
    gov.parked.set(name, { prev, cls, note, cost, pop: reg.populated().length }); if (w && w.setStatus) w.setStatus(note, 'warn');
  }
  function unpark(name, w) {
    const p = gov.parked.get(name); gov.parked.delete(name); perf.work[name] = 0;      // re-measured on its next update
    if (p && w && w.root) { const st = w.root.querySelector('.dev-stat'); if (st && st.textContent === p.note) { w.setStatus(p.prev); st.className = p.cls; } }
  }
  function setGovernor(v) {
    gov.on = !!v; if (ui.govSw) ui.govSw.set(gov.on);
    if (!gov.on) { gov.drop = 0; gov.okSince = 0; holdFrost(false); for (const name of [...gov.parked.keys()]) unpark(name, READERS[name]); schedule(TIER.REBUILD); }
  }
  function setKeepFrames(v) {
    keep.frames = !!v; if (ui.keepSw) ui.keepSw.set(keep.frames);
    if (!ui.scrub) return;
    const r = ui.scrub.root; r.classList.toggle('disabled', !keep.frames); r.style.opacity = keep.frames ? '' : '.35'; r.style.pointerEvents = keep.frames ? '' : 'none';
    r.title = keep.frames ? '' : 'KEEP FRAMES is off (SETTINGS): the playhead does not follow the clock — RATE and play / pause still work';
    if (!keep.frames) ui.scrub.set(0);
    schedule(TIER.PRESENT);
  }
  function setPerfMode(m) { perf.mode = m; perf.cpuEvery = m === '120' ? 4 : 1; if (ui.perfSeg) ui.perfSeg.set(m); }
  const stats = { frames: 0, presents: 0, reconstructs: 0, evolves: 0, rebuilds: 0, tiers: { PRESENT: 0, RECONSTRUCT: 0, EVOLVE: 0, REBUILD: 0 }, lastTier: 'NONE', scheduled: false, fps: 0, reconPerSec: 0, stepsPerSec: 0, lastEncodeMs: 0, fieldT: 0 };
  const cRe = new Float64Array(91), cIm = new Float64Array(91);
  let pointerHeld = false;       // a gesture is in flight: the expensive per-frame readouts wait it out (see periodNow)
  let keplerDirty = true, govVersion = -1, metersWall = 0;   // wave 45: the KEPLER canvas is drawn only while on (one clearing draw after), the parked readers re-run on an edit, METERS repaints at 10 Hz while playing
  let applyVisuals = true;
  let refSnapshot = null;        // { re, im, ids } — the DIFF reference state
  let pendingRef = null;

  /* ── THE BUSY MARK (wave 48, Josh) ─────────────────────────────────────────
   * "When things are loading/frozen in the app, show the little square logo next to the 'WAVES' text right next to
   * the cursor where loading would be and let it hue cycle around the current palette; no shadow."
   *
   * A COUNTER, not a flag: begin() / end() nest, so a bow inside a rebuild inside a project load is one mark, and it
   * goes when the LAST of them lands.  Three kinds of work raise it — every Worker call (the bow's slap, the BOX
   * packet, the period scan), every atom solve and project load, and every field rebuild — plus one rule that needs
   * no instrumentation at all: a frame gap over 250 ms means the main thread WAS blocked by something nobody wrapped,
   * so the mark shows for 600 ms after it.  That last rule is why the mark is honest about freezes it was never told
   * about.  Its motion is CSS (lab.css §48d): a thread that is stuck cannot animate anything from JS, so it doesn't try.
   * The position is written as two custom properties on a pointermove — a WRITE, never a read, and only while the
   * mark is up, so a moving pointer over an idle lab costs one assignment and no style work at all. */
  const busy = { n: 0, until: 0, shown: false, x: -200, y: -200, host: null, moves: 0, timer: 0 };
  function busyHost() {
    if (busy.host) return busy.host;
    const h = document.getElementById('busyMark'); if (!h) return null;
    const src = document.querySelector('#title .mark');
    if (src && !h.children.length) { h.appendChild(src.cloneNode(true)); paintMarks(); }
    busy.host = h; return h;
  }
  function busySync() {
    const want = busy.n > 0 || performance.now() < busy.until;
    if (want === busy.shown) return;
    busy.shown = want;
    const h = busyHost(); if (h) { h.hidden = !want; if (want) busyWrite(); }
    const m = document.querySelector('#title .mark'); if (m) m.classList.toggle('busy', want);
  }
  function busyWrite() { const h = busy.host; if (!h) return; h.style.setProperty('--cx', busy.x + 'px'); h.style.setProperty('--cy', busy.y + 'px'); }
  /** raise the mark for `ms` from now — the frame-gap rule and any caller that cannot bracket its own work */
  function busyFlash(ms) { const t = performance.now() + ms; if (t > busy.until) busy.until = t; busySync();
    clearTimeout(busy.timer); busy.timer = setTimeout(() => { busy.timer = 0; busySync(); }, Math.max(0, busy.until - performance.now()) + 30); }   // the window has to close itself: nothing else would ask again
  /** bracket a promise (or a synchronous function) with the mark */
  function busyWrap(p) { busy.n++; busySync(); const done = () => { busy.n = Math.max(0, busy.n - 1); busySync(); }; if (p && typeof p.then === 'function') { p.then(done, done); return p; } done(); return p; }
  window.addEventListener('pointermove', (e) => {                       // the position: two writes, no read, and only while it is up
    busy.x = e.clientX; busy.y = e.clientY;
    if (busy.shown) { busy.moves++; busyWrite(); }
  }, { passive: true });

  /* ── FIELD ────────────────────────────────────────────────────────────── */
  const field = await createField(dom.canvas, { resolution: quality.res, onError: (m) => showBanner('GPU error', m) });
  if (!field.ok) showBanner('WebGPU unavailable', field.error + '. The FIELD needs WebGPU; SPECTRUM, SHADOW and METERS still run on the CPU.');
  function showBanner(title, text) { dom.banner.hidden = false; dom.banner.querySelector('h3').textContent = title; dom.banner.querySelector('p').textContent = text; }
  /* ── THE MATHS WORKER (wave 45): the bow's slap, the BOX packet and the transport's period scan run off the frame.
     Every op is the same pure function this thread would call (mathworker.js imports the same modules), so an answer
     is bit-identical to the synchronous road; a worker that fails to load, errors or times out (8 s) hands the call
     back to that road.  The SLAP trigger, the K key, LAUNCH and every forced period reader stay synchronous. ── */
  const makeWorker = (label) => {
    let w = null, seq = 0; const waiting = new Map();
    const fail = (why) => { for (const p of waiting.values()) { clearTimeout(p.timer); p.res({ error: why }); } waiting.clear(); if (w) { try { w.terminate(); } catch (_) {} } w = null; console.warn('λWAVES ' + label + ' worker: ' + why + ' — that maths runs on the frame thread'); };
    try {
      w = new Worker(new URL('./mathworker.js', import.meta.url), { type: 'module' });
      w.onmessage = (e) => { const p = waiting.get(e.data.id); if (p) { waiting.delete(e.data.id); clearTimeout(p.timer); p.res(e.data); } };
      w.onerror = (e) => fail('worker error: ' + (e && e.message || e));
    } catch (e) { w = null; }
    const call = (msg, transfer) => { if (!w) return Promise.resolve(null); return busyWrap(new Promise((res) => { const id = ++seq; const timer = setTimeout(() => { if (waiting.has(id)) { waiting.delete(id); res({ error: 'timeout' }); } }, 8000); waiting.set(id, { res, timer }); try { w.postMessage(Object.assign({ id }, msg), transfer || []); } catch (err) { clearTimeout(timer); waiting.delete(id); res({ error: String(err && err.message || err) }); } })); };   // wave 48: every worker job is a BUSY job
    return { get ok() { return !!w; }, call };
  };
  const maths = makeWorker('bow'), scan = makeWorker('period');   // TWO: a 1.2 s period scan (a BOX state) must never queue a bow behind it (measured: the packet landed at 1185 ms behind one)
  if (maths.ok) maths.call({ op: 'warm', ham: 'hydrogen', Z: 1 });                    // the SLAP tables, built once off the thread
  /* …and on this thread too (the K key and the SLAP trigger are synchronous): 8 ms at a time while the transport is idle */
  const warmKick = () => { if (!kickReady() && !clock.playing) kickWarm(8); setTimeout(warmKick, kickReady() ? 2000 : clock.playing ? 500 : 40); };
  setTimeout(warmKick, 1500);

  /* ── the router ───────────────────────────────────────────────────────── */
  let pending = TIER.NONE, rafId = 0, lastWall = 0, lastReconMs = -1e9, dragging = false, inLoop = false;
  let winStart = 0, winFrames = 0, winRecon = 0, winSteps = 0;
  /* a schedule() from INSIDE the loop only raises `pending` — the loop's own tail registers the next frame.  Before wave
     45 it registered a second callback (rafId is 0 while the loop runs), and every in-loop schedule — H₂ running, a
     governor step — added one more loop call per frame for good: METERS read 300 "fps" at a 58 Hz display. */
  function schedule(tier) {
    if (tier > pending) pending = tier;
    if (!rafId && !inLoop) { rafId = requestAnimationFrame(loop); stats.scheduled = true; }
  }
  const tableOf = (a) => sturm.P ? sturm.rec[a] : (space === 'p' ? getHamiltonian().momentumTableFor(BASIS[a]) : getHamiltonian().tableFor(BASIS[a]));   // W-STURMIAN: the scaled record, else the operator's
  const sturmHalf = () => { const nm = reg.nmax(1e-3); return domainFor(nm) / (nm * sturm.lambda); };   // a Sturmian's extent is hydrogen's for n over nλ (ρ = 2λr against 2r/n)
  function modesAt(t) {
    if (molecule && molecule.on) return molecule.fieldModes(t);           // the molecule holds the field
    if (helium && helium.on) return helium.fieldModes();                   // helium: the conditional cloud of electron 2
    if (h2 && h2.on) return h2.fieldModes();                               // H₂: the Heitler–London one-electron density
    if (gas && gas.on) return gas.fieldModes(t);                           // the AXIAL GAS: the box's second register
    const c = reg.at(t, cRe, cIm), ids = reg.renderSet(RENDER_CAP).ids;
    modeList.length = ids.length;                                        // wave 45: the same 91 records, rewritten in place (was 1–91 fresh objects per reconstruct)
    for (let i = 0; i < ids.length; i++) { const a = ids[i], m = modeRecs[i]; m.table = tableOf(a); m.re = c.re[a]; m.im = c.im[a]; modeList[i] = m; }
    return modeList;
  }
  const modeRecs = Array.from({ length: 91 }, () => ({ table: null, re: 0, im: 0 })), modeList = [];
  function refModes() {
    if (!refSnapshot) return null;
    return refSnapshot.ids.map((a) => ({ table: tableOf(a), re: refSnapshot.re[a], im: refSnapshot.im[a] }));
  }
  function applyRebuild() {
    busyWrap(null);                                                    // wave 48: a rebuild is BUSY work — synchronous, so it only shows when the frame-gap rule catches it running long
    const HH = getHamiltonian();
    if (domain.auto) domain.half = (h2 && h2.on) ? h2.half : (helium && helium.on) ? helium.half : (molecule && molecule.on) ? molecule.half : (space === 'p' ? HH.domainForP(reg.nmin()) : sturm.P ? sturmHalf() : HH.domainFor(reg.nmax(1e-3)));   // ignore a slap's 1e-4 tails
    if (field.ok) field.setSpace((h2 && h2.on) ? 5 : (helium && helium.on) ? 4 : (space === 'p' ? HH.kernelSpace.p : HH.kernelSpace.x));
    if (field.ok && HH.radialTable) field.setRadialTable(HH.radialTable());   // QUARKONIUM: the tabulated radial rows the kernel reads
    if (field.ok) {
      field.setDomain(domain.half);
      const want = effectiveRes(); if (field.resolution !== want) field.setResolution(want);   // the governor's notch, if it stepped
    }
    mat.steps = quality.steps;
    if (refSnapshot) pendingRef = refModes();      // the reference lives on the grid: rebuild it with the grid
    stats.rebuilds++;
    ui.domainKnob.set(domain.half);
  }
  function loop(nowMs) {
    rafId = 0; inLoop = true;
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
    const tFrame0 = performance.now();
    if (tier >= TIER.PRESENT && field.ok) {                          // PRESENTATION
      tick('field', () => { field.resize(quality.scale * (quality.auto ? quality.autoScale : 1)); field.frame({ modes, refModes: pendingRef, obs, mat }); });
      pendingRef = null;
      stats.presents++; stats.lastEncodeMs = field.stats.lastEncodeMs;
    }
    if (modes) stats.reconstructs++;
    if (tier > 0) { stats.tiers[TIER_NAME[tier]]++; stats.lastTier = TIER_NAME[tier]; }
    stats.frames++; winFrames++;
    autoQ.n++; if (tier >= TIER.PRESENT) autoQ.presented++;
    if (autoQ.lastMs && tier >= TIER.PRESENT) { const iv = nowMs - autoQ.lastMs; autoQ.ema = autoQ.ema ? autoQ.ema * 0.85 + iv * 0.15 : iv; gov.ring[gov.n % 60] = iv; gov.n++; } 
    if (autoQ.lastMs && nowMs - autoQ.lastMs > 250) busyFlash(600);    // wave 48: a gap that long means the thread WAS blocked by work nobody wrapped — say so for 600 ms
    autoQ.lastMs = nowMs;
    perf.ring[perf.counts.frames % 60] = 0;                            // filled at the tail with this frame's own main-thread cost
    if (autoQ.n >= 24) {
      if (quality.auto && autoQ.presented >= 18 && autoQ.ema) {
        if (autoQ.ema > 1000 / 45 && quality.autoScale > quality.minScale) { quality.autoScale = Math.max(quality.minScale, +(quality.autoScale - 0.1).toFixed(2)); autoQ.changes++; }
        else if (autoQ.ema < 1000 / 80 && quality.autoScale < 1) { quality.autoScale = Math.min(1, +(quality.autoScale + 0.05).toFixed(2)); autoQ.changes++; }
      }
      autoQ.n = 0; autoQ.presented = 0;
      if (ui.scaleRo) ui.scaleRo.set((100 * quality.scale * (quality.auto ? quality.autoScale : 1)).toFixed(0) + '%', quality.auto && quality.autoScale < 1 ? 'warn' : '');
    }
    /* THE GOVERNOR: the median of the last 60 presented frames, judged every 30 frames while playing */
    if (gov.n >= 30 && (gov.n % 30) === 0) {
      const m = Math.min(60, gov.n), s = Array.from(gov.ring.subarray(0, m)).sort((x, y) => x - y); gov.median = s[m >> 1];
      if (gov.on && clock.playing) {
        if (gov.median > 28) {
          gov.okSince = 0;
          /* the diagnosis: the loop's own work against the frame — a frame far longer than the maths in it is the compositor's
             or the GPU's; with FROST on, its blur is the lever this thread holds (82 ms of an 85 ms frame measured) */
          if (document.body.classList.contains('frost') && !gov.frostHeld && perf.profile.total < 0.4 * gov.median) { holdFrost(true); gov.n = 0; }
          else if (gov.drop < 2) { gov.drop++; gov.changes++; gov.since = nowMs; gov.n = 0; schedule(TIER.REBUILD); }   // the ring restarts: the next judgment measures the new state, not the old frames
        } else if (gov.median < 22) { if (!gov.okSince) gov.okSince = nowMs; else if (nowMs - gov.okSince >= 3000 && gov.drop > 0) { gov.drop--; gov.changes++; gov.okSince = nowMs; gov.since = nowMs; gov.n = 0; schedule(TIER.REBUILD); } }
        else gov.okSince = 0;
      }
    }
    if (!clock.playing && (gov.drop || gov.frostHeld)) { gov.drop = 0; gov.okSince = 0; gov.changes++; holdFrost(false); schedule(TIER.REBUILD); }   // paused: nothing to govern — the user's grid and FROST come back at once
    const c = reg.at(clock.t, cRe, cIm);
    perf.counts.frames++;
    const cpuTick = !clock.playing || (perf.counts.frames % perf.cpuEvery) === 0;   // the CPU windows' cadence
    if (cpuTick) {
      perf.counts.cpu++;
      if (reg.version !== govVersion) { govVersion = reg.version; if (gov.parked.size) { const np = reg.populated().length; for (const [name, p] of [...gov.parked.entries()]) if (np < p.pop) unpark(name, READERS[name]); } }   // an edit that SHRANK the state: a parked reader may have got cheap — re-measured (one that grew stays parked: the landing frame measured 449 ms with the SLICE re-measuring on 91 labels)
      if (!uiHidden && live(wSpec) && may('spectrum', wSpec)) tick('spectrum', () => spectrum.update(c, clock.t));
      if (!uiHidden && live(wSh) && may('shadow', wSh)) tick('shadow', () => shadowView.update(c, clock.t, reg.populated(), spectrum.selected));
      if (!uiHidden && live(wOrb) && may('orbit', wOrb)) tick('orbit', () => orbit.update(obs));
    }
    tick('overlays', () => {
      if (space === 'x' && getHamiltonian().hydrogenTheorems && !sturm.P && !(molecule && molecule.on) && !(helium && helium.on) && !(h2 && h2.on)) {       // the overlays are position-space objects, and theorems about hydrogen
        if (live(wVor)) vortex.update(reg, clock.t, obs, domain.half, clock.playing); else if (dom.vortex) dom.vortex.getContext('2d').clearRect(0, 0, dom.vortex.width, dom.vortex.height);
        if (particles.on) { if (perf.cpuEvery === 1 || (perf.counts.frames % 2) === 0) particles.advance(reg, clock.t, domain.half); particles.draw(obs, domain.half); }   // 120 Hz: step every other frame (the integrator uses the logical dt, so nothing is skipped)
        if (kepler.on || kdrag || keplerDirty) { kepler.update(reg, clock.t, obs, domain.half); keplerDirty = !!kepler.on; if (!kepler.on && !bow && dom.kepler.width > 1) { dom.kepler.width = 1; dom.kepler.height = 1; } }   // wave 45: drawn while on, cleared once after, and its full-stage bitmap released (4.4 MB here, 22 MB at the iPad's DPR)
      } else { for (const c of [dom.vortex, dom.particles, dom.kepler]) if (c) c.getContext('2d').clearRect(0, 0, c.width, c.height); }
      fieldlines.update(reg, clock.t, obs, domain.half, clock.playing, getZ(), fieldOn());   // the classical field of ρ: its own guard, its own throttle
      kepler.bowFrame();
    });
    /* the MOLECULE and H₂ integrators feed the FIELD, so they run whether or not their card can be seen;
       only moPanel's repaint is chrome, and that is the one thing the hidden interface drops (wave 48) */
    if (cpuTick && live(wMol)) tick('molecule', () => { if (molecule) molecule.update(clock.t); if (moPanel && !uiHidden) moPanel.update(clock.t, clock.playing); if (h2 && h2.on) { h2.update(clock.t); if (h2.run && clock.playing) schedule(TIER.RECONSTRUCT); } });
    if (cpuTick && !uiHidden) {
      if (live(wDyn) && may('dynamics', wDyn)) tick('dynamics', () => dynamics.update(reg, clock.t, clock.playing));
      if (live(wSlice) && may('slice', wSlice)) tick('slice', () => slice.update(reg, clock.t, clock.playing));
      if (live(wQCD) && may('qcd', wQCD)) tick('qcd', () => qcd.update());
      if (live(wAtoms) && may('atoms', wAtoms)) tick('atoms', () => atomsView.update());
      if (live(wWig) && !wWig.root.classList.contains('closed') && may('wigner', wWig)) tick('wigner', () => {          // the SLICE: its own throttle (2 Hz while playing), its own guard
        const G = hydroReader(); wWig.setStatus(G.status === null ? WIG_OK : G.status, G.status === null ? '' : 'warn');
        wignerView.update(reg, clock.t, clock.playing, G.on, G.why, domain.half);
      });
      if (live(wRad) && !wRad.root.classList.contains('closed') && may('radiation', wRad)) tick('radiation', () => {        // the DIPOLE: cheap, so every CPU tick
        const G = hydroReader(); radiationView.update(reg, clock.t, clock.playing, G.on, G.why);
        const st = G.status !== null ? G.status : radiationView.cache ? RAD_OK : 'no dipole in this state';
        wRad.setStatus(st, st === RAD_OK ? '' : 'warn');
      });
      if (live(wCalc) && may('calculus', wCalc)) tick('calculus', () => { if (calculus && !sturm.P && !(molecule && molecule.on) && !(helium && helium.on) && !(h2 && h2.on)) calculus.update(reg, clock.t); });
      ui.hc.set(reg.energy().toFixed(5));
      if (sturm.P && ui.sturmRo && sturm.roVersion !== reg.version) paintSturmRo();   // W-STURMIAN: the scale's readout follows the state
      if (gas && gas.on && ui.gasRo && (perf.counts.cpu % 6) === 0) { const s = gas.stats(clock.t); ui.gasRo.set(`${(100 * gas.captured).toFixed(1)}% held · ⟨z⟩ ${s.z.toFixed(2)} · σ_z ${s.sz.toFixed(2)}`, gas.captured > 0.85 ? 'ok' : 'warn'); }
    }
    if (!uiHidden) transport.update();
    if (now - winStart >= 1) {
      const w = now - winStart; stats.fps = winFrames / w; stats.reconPerSec = winRecon / w; stats.stepsPerSec = winSteps / w;
      winStart = now; winFrames = winRecon = winSteps = 0;
    }
    inLoop = false;
    if (clock.playing || camera.autoRotate || pending) { rafId = requestAnimationFrame(loop); stats.scheduled = true; }
    else { stats.scheduled = false; stats.fps = 0; stats.reconPerSec = 0; stats.stepsPerSec = 0; }
    if (cpuTick && !uiHidden && live(wMet) && (!clock.playing || nowMs - metersWall >= 100)) { metersWall = nowMs; tick('meters', () => { meters.update(meterSnapshot()); badges.update(); paintGovernor(); }); }   // wave 45: 10 Hz while playing (fifteen strings and a snapshot per call), every frame when paused
    const spent = performance.now() - tFrame0;
    perf.profile.total = perf.profile.total * 0.9 + spent * 0.1;
    perf.ring[perf.counts.frames % 60] = spent;                        // wave 48: the loop's OWN main-thread ms, 60 deep — LW.perf.median reads it
  }
  function meterSnapshot() {
    const rs = reg.renderSet(RENDER_CAP);
    return { norm: reg.norm(), energy: reg.energy(), autocorr: reg.autocorrelation(clock.t).abs, t: clock.t, playing: clock.playing,
      rendered: rs.rendered, populated: rs.populated, masked: rs.masked, truncated: rs.truncated, covered: rs.coveredFraction,
      res: field.ok ? field.resolution : 0, half: domain.half, steps: mat.steps, encodeMs: stats.lastEncodeMs,
      fps: stats.fps, reconPerSec: stats.reconPerSec, stepsPerSec: stats.stepsPerSec, scheduled: stats.scheduled, lastTier: stats.lastTier, tiers: stats.tiers,
      status: statusLine(), profile: perf.profile, perfMode: perf.mode, unit: getHamiltonian().unit };
  }
  /** the METERS line for the governor: its state, the median it judged, the grid it runs, and what it parked */
  function paintGovernor() {
    if (!ui.govRo) return;
    const st = !gov.on ? 'OFF' : (gov.drop || gov.frostHeld) ? 'STEPPED' + (gov.drop ? ' −' + gov.drop : '') + (gov.frostHeld ? ' · FROST held while playing' : '') : 'nominal';
    ui.govRo.set(`${st} · ${gov.median ? gov.median.toFixed(1) : '—'} ms · ${field.ok ? field.resolution : 0}³`, !gov.on ? '' : (gov.drop || gov.frostHeld) ? 'warn' : 'ok');
    const parked = [...gov.parked.entries()].map(([n, p]) => n + ' ' + p.cost.toFixed(0) + ' ms');
    ui.govRo.setSub((parked.length ? 'parked: ' + parked.join(' · ') : 'nothing parked') + ' · budget 28 ms over the last 60 frames · scale ' + (100 * quality.scale * (quality.auto ? quality.autoScale : 1)).toFixed(0) + '%' + (maths.ok && scan.ok ? ' · bow, packet and period scan off the frame' : ' · no worker: the maths runs on the frame'));
  }
  function statusLine() {
    const rs = reg.renderSet(RENDER_CAP);
    let s = reg.field.Fz !== 0 ? 'EXACT WITHIN EACH SHELL (Stark) · EXACT REAL shadow · NUMERICAL field'
      : reg.field.Bz !== 0 ? 'EXACT ANALYTIC state + evolution (Zeeman) · EXACT REAL shadow · NUMERICAL field'
      : 'EXACT ANALYTIC state + evolution · EXACT REAL shadow · NUMERICAL field';
    if (sturm.P) s = 'EXACT EVOLUTION IN THE STURMIAN BASIS λ = ' + sturm.lambda.toFixed(3) + ' (S⁻¹H, VARIATIONAL eigenvalues, S-norm' + (reg.field.Bz !== 0 ? ', Zeeman' : '') + ') · EXACT REAL shadow · NUMERICAL field';
    if (h2 && h2.on) return 'H₂ · Heitler–London · EXACT integrals · VARIATIONAL curves · CLASSICAL nuclei (Born–Oppenheimer) · one-electron DENSITY · NUMERICAL field';
    if (helium && helium.on) return 'HELIUM · Hylleraas · EXACT integrals · VARIATIONAL energy · the conditional density of electron 2 given electron 1 · NUMERICAL field';
    if (molecule && molecule.on) return 'H₂⁺ · EXACT integrals · VARIATIONAL energies · EXACT evolution in the LCAO space · NUMERICAL field';
    if (reg.damping > 0) s = 'TOY DRAG γ = ' + reg.damping.toFixed(3) + ' · NON-UNITARY · ' + s;
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
    clear() { reg.clear(); refSnapshot = null; touchState(); },
    normalize() { normalizeNow(); },
    rateOf(a) { return rates[a]; },
    setRate(a, r) {
      if (sturm.P) return false;                                     // W-STURMIAN: RATE is a diagonal-phase feature — off under the scale
      const c = reg.coeffAt(a, clock.t); rates[a] = r; reg.setEnergies(energyOf); reg.set(a, c.re, c.im, clock.t); touchState();   // re-anchored: c(t) is continuous, only its speed changes
      const toy = rates.some((v) => Math.abs(v - 1) > 1e-9);
      wSpec.setStatus(toy ? 'RATES ≠ 1 · TOY: H rescaled per label' : getHamiltonian().label, toy ? 'warn' : (getHamiltonian().id === 'hydrogen' ? '' : 'live'));
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
  const wObs = device({ id: 'observer', eyebrow: 'SPACE', title: 'POSITION · MOMENTUM · THE OBSERVABLE', status: 'never mutates ψ' });
  const wPal = device({ id: 'palette', eyebrow: 'PALETTE', title: 'THE COLOURING OF THE COMPLEX PLANE', status: 'design choice · ψ untouched' });
  const wStyle = device({ id: 'style', eyebrow: 'DRAW STYLE', title: 'HOW THE SAME OBSERVABLE IS RENDERED', status: 'bounded ceiling' });
  const wCam = device({ id: 'camera', eyebrow: 'CAMERA', title: 'ORBIT · SPIN · THE Δρ REFERENCE', status: 'observer only' });
  const wClip = device({ id: 'clip', eyebrow: 'SLICE / CLIP', title: 'VOLUME · CLIP · SLAB', status: 'observer only' });
  {
    {
      const r0 = wObs.row();
      ui.spaceSeg = seg({ label: 'SPACE  ·  the same state, two exact pictures', value: 'x', options: [
        { id: 'x', label: 'POSITION ψ(x)', title: 'the wavefunction in space' },
        { id: 'p', label: 'MOMENTUM φ(p)', title: 'its Fourier transform in closed form (Podolsky–Pauling 1929) — under Fock\'s map every shell is rigid on S³, so the rotors merely TURN this picture' }],
        onChange: (v) => { space = v; schedule(TIER.REBUILD); } });
      r0.appendChild(ui.spaceSeg.root);
      ui.spaceNote = el('div', 'sturm-note', wObs.body); ui.spaceNote.hidden = true;          // its own class: the ⓘ sweep folds every .note away, and this one must be seen
      ui.spaceNote.innerHTML = '<b>STURMIAN:</b> momentum space is not built for the scaled radials (the Podolsky–Pauling transform would need its own table) — position space only until SCALE is back on HYDROGEN.';
    }
    const r1 = wObs.row();
    ui.viewSeg = seg({ label: 'OBSERVABLE (colour is semantic)', value: 'phase', options: [
      { id: 'density', label: 'ρ=|ψ|²', title: 'probability density' }, { id: 'phase', label: 'arg ψ', title: 'phase as hue, density as opacity' },
      { id: 'real', label: 'Re ψ', title: 'signed, diverging: orange +, blue −' }, { id: 'imag', label: 'Im ψ' }, { id: 'diff', label: 'Δρ', title: 'ρ(t) − ρ_ref: yellow gain, blue loss' }, { id: 'reim', label: 'Re+Im', title: 'both parts superposed — a heuristic placement, two pictures in one volume: orange/blue for Re, green/violet for Im' }],
      onChange: (v) => { mat.view = VIEW[v]; schedule(TIER.PRESENT); } });
    r1.appendChild(ui.viewSeg.root);
    const r2 = wObs.row('tight');
    r2.appendChild(knob({ label: 'EXPOSURE', min: 0.08, max: 12, value: 1, log: true, fmt: (v) => v.toFixed(2), onInput: (v) => { mat.exposure = v; schedule(TIER.PRESENT); } }).root);
    r2.appendChild(knob({ label: 'SOFT', min: 0.3, max: 2.2, value: 0.7, fmt: (v) => 'γ' + v.toFixed(2), onInput: (v) => { mat.softness = v; schedule(TIER.PRESENT); } }).root);
    r2.appendChild(knob({ label: 'HUE', min: 0, max: 1, value: 0, wrap: true, fmt: (v) => (v * 360).toFixed(0) + '°', onInput: (v) => { mat.hueShift = v; applyAccent(); schedule(TIER.PRESENT); } }).root);
    ui.invertSw = sw({ label: 'INVERT', value: false, onChange: (v) => { mat.invert = v; schedule(TIER.PRESENT); } }); r2.appendChild(ui.invertSw.root);
    r2.appendChild(sw({ label: 'FRAME', value: true, onChange: (v) => { mat.frame = v; schedule(TIER.PRESENT); } }).root);
    /* ── THEME and SURFACE: the interface's skin, and the stage underneath it ── */
    ui.set = device({ id: 'settings', eyebrow: 'SETTINGS', title: 'INTERFACE · THEME · KEYS · QUALITY', status: 'saved in this browser' });
    const gi = group(ui.set.body, 'INTERFACE');
    const ri = el('div', 'row tight', gi);
    ui.badgesSw = sw({ label: 'STATUS TAGS', value: true, title: 'the EXACT ANALYTIC / NUMERICAL tags at the top', onChange: (v) => { document.body.classList.toggle('no-badges', !v); saveSettings(); } }); ri.appendChild(ui.badgesSw.root);
    ui.hintSw = sw({ label: 'HINT BAR', value: true, title: 'the one-line gesture hint above the transport', onChange: (v) => { document.body.classList.toggle('no-hint', !v); saveSettings(); } }); ri.appendChild(ui.hintSw.root);
    ui.capSw = sw({ label: 'STAGE CAPTIONS', value: true, title: 'the KEPLER / VORTEX lines at the foot of the stage', onChange: (v) => { document.body.classList.toggle('no-captions', !v); saveSettings(); schedule(TIER.PRESENT); } }); ri.appendChild(ui.capSw.root);
    ri.appendChild(trig({ label: 'RESET LAYOUT', title: 'reopen and unfold every window, undock the transport, both racks as shipped', onFire: () => layout.resetLayout() }).root);
    ri.appendChild(trig({ label: 'FORGET', title: 'clear what this browser remembers (theme, accents, tags, closed windows) and reload', onFire: () => { try { localStorage.removeItem(SETTINGS_KEY); } catch (e) {} location.reload(); } }).root);
    ri.appendChild(trig({ label: 'SHOW THE WARNING AGAIN', title: 'bring back the photosensitivity notice — the same pane this browser saw on its first load, and it is forgotten again so the NEXT load shows it too', onFire: () => { if (__LW_hooks.warning) { __LW_hooks.warning.reset(); __LW_hooks.warning.show(); } } }).root);
    el('div', 'note', gi).innerHTML = '<b>SETTINGS</b> is the interface\'s own window: the theme and surface, the accent wheel, every key binding, the field\'s quality and the chrome switches. What you set here is remembered by this browser (FORGET clears it). Windows are of four kinds — the <b>core</b> instrument (PREPARE, EIGENVALUE, VIEW), <b>information panels</b> that read and report (captions always visible, a ⧉ COPY digest in the header), <b>control surfaces</b> and <b>other models</b> that start folded. Every window has ⏻ to stop its reader, ▾ to fold, × to close; the + at the top of a rack reopens.';
    const gt = group(ui.set.body, 'THEME  ·  SURFACE');
    const rt = el('div', 'row tight', gt);
    const THEMES = { dark: { bg: [0.028, 0.038, 0.058], invert: false }, light: { bg: [0.93, 0.95, 0.975], invert: true } };
    /* THE THEME HAS THREE SEATS AND TWO VALUES (wave 48, Josh).  `themeChoice` is what the user picked — light,
       dark or SYSTEM — and is what the settings key remembers; `theme` is the RESOLVED one, always light or dark,
       and is what body[data-theme], mat.bg, mat.lightUI, the accents and the warning pane all read.  SYSTEM follows
       prefers-color-scheme live: the matchMedia listener re-resolves without touching the choice, so a user who
       chose SYSTEM keeps SYSTEM when the OS flips.  The shipped default is LIGHT (applySettings' `|| 'light'`). */
    const sysMQ = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
    const systemTheme = () => (sysMQ && sysMQ.matches ? 'dark' : 'light');
    let themeChoice = 'dark', theme = 'dark';
    function setTheme(id) {
      themeChoice = (id === 'system' || THEMES[id]) ? id : 'dark';
      theme = themeChoice === 'system' ? systemTheme() : themeChoice;
      document.body.dataset.theme = theme;
      document.body.dataset.themeChoice = themeChoice;
      mat.bg = THEMES[theme].bg.slice();                                   // INVERT is the user's: a theme never flips it (Josh)
      mat.lightUI = theme === 'light';                                     // wave 48: the GPU chrome (the cube frame, the three axes) cannot read a CSS token — it reads this
      if (ui.themeSeg) ui.themeSeg.set(themeChoice);
      if (__LW_hooks.themeChanged) __LW_hooks.themeChanged(theme);
      applyAccent(); saveSettings();
      schedule(TIER.PRESENT);
    }
    if (sysMQ) { const onSys = () => { if (themeChoice === 'system') setTheme('system'); };
      if (sysMQ.addEventListener) sysMQ.addEventListener('change', onSys); else if (sysMQ.addListener) sysMQ.addListener(onSys); }
    ui.themeSeg = seg({ label: 'THEME', value: 'light', options: [
      { id: 'light', label: 'LIGHT', title: 'light cards, dark ink — and the stage underneath goes light with the density drawn as ink (INVERT on); the domain cube is drawn in near-black' },
      { id: 'dark', label: 'DARK', title: 'dark cards, light ink, a near-black stage — and the three axes in vivid CMY (x cyan, y magenta, z yellow)' },
      { id: 'system', label: 'SYSTEM', title: 'follow the operating system’s light / dark setting, live — prefers-color-scheme decides, and a change out there changes the lab here without touching this choice' }],
      onChange: (v) => setTheme(v) });
    rt.appendChild(ui.themeSeg.root);
    ui.frostSw = sw({ label: 'FROST 20px', value: false, title: 'a frosted blur behind every card (GLASS BLUR sets the radius) — a look to try. MEASURED (wave 45): at 21 px over the live field the frame went from 17 ms to 82 ms (52 → 13 fps) in Firefox with software compositing, about 25 fps on a GPU-composited desktop — the blur of both racks is recomposited on every frame the field changes. The GOVERNOR suspends it while the transport plays under load and brings it back on pause', onChange: (v) => { gov.frostHeld = false; document.body.classList.toggle('frost', v); saveSettings(); } });
    rt.appendChild(ui.frostSw.root);
    ui.blurK = knob({ label: 'GLASS BLUR', min: 0, max: 30, value: 18, fmt: (v) => v.toFixed(0) + ' px', title: 'the blur radius of the NOTEBOOK glass and of FROST', onInput: (v) => { document.documentElement.style.setProperty('--glass-blur', v.toFixed(1) + 'px'); }, onChange: () => saveSettings() }); rt.appendChild(ui.blurK.root);
    rt.appendChild(knob({ label: 'STAGE', min: 0, max: 1, value: 0.04, fmt: (v) => (v * 100).toFixed(0) + '%', onInput: (v) => { const d = THEMES.dark.bg, l = THEMES.light.bg; mat.bg = [0, 1, 2].map((i) => d[i] + (l[i] - d[i]) * v); schedule(TIER.PRESENT); } }).root);
    rt.appendChild(knob({ label: 'GAMMA', min: 0.5, max: 2.4, value: 1, fmt: (v) => v.toFixed(2), onInput: (v) => { mat.gamma = v; schedule(TIER.PRESENT); } }).root);
    ui.cardSeg = seg({ label: 'CARD STYLE', value: 'refractive', options: [
      { id: 'refractive', label: 'REFRACTIVE', title: 'the pane is not there: every card, popover and chrome panel is transparent and you read the instrument through the blur behind it (with FROST off, through the field itself). This is the look the lab has shipped since wave 23 — for its first 24 waves by accident, and on purpose since wave 47' },
      { id: 'tinted', label: 'TINTED', title: 'the theme\'s tinted pane comes back under the blur: the dark card at hsl(214 16% 13% / .84), the light card at 245,247,249 — more contrast for the ink, less of the field' },
    ], onChange: (v) => setCardStyle(v) });
    rt.appendChild(ui.cardSeg.root);
    el('div', 'note', gt, 'refractive: the blur alone · tinted: the blur under a tinted pane');
    const ra = el('div', 'row tight', gt);
    ui.accA = knob({ label: 'ACCENT A', min: 0, max: 360, value: 0, wrap: true, fmt: (v) => v.toFixed(0) + '°', title: 'the first UI accent: an angle on the current palette wheel', onInput: (v) => { accent.a = v; applyAccent(); }, onChange: () => saveSettings() }); ra.appendChild(ui.accA.root);
    ui.accB = knob({ label: 'ACCENT B', min: 0, max: 360, value: 162, wrap: true, fmt: (v) => v.toFixed(0) + '°', title: 'the second UI accent (solo, the warm marks): an angle on the same wheel', onInput: (v) => { accent.b = v; applyAccent(); }, onChange: () => saveSettings() }); ra.appendChild(ui.accB.root);
    ui.vivid = knob({ label: 'VIVID', min: 0, max: 1, value: 0, fmt: (v) => (v * 100).toFixed(0) + '%', title: 'push both accents toward neon: more chroma and a wider glow (also for visibility)', onInput: (v) => { accent.vivid = v; applyAccent(); }, onChange: () => saveSettings() }); ra.appendChild(ui.vivid.root);
    el('div', 'note', gt).innerHTML = '<b>THEME</b> swaps the skin\'s tokens and adapts the layer underneath: LIGHT sets a light stage (INVERT is yours — turn it on if you want the cloud drawn as ink). <b>SURFACE</b> is the render of the object itself — STAGE is the background lightness, GAMMA the output curve, and with EXPOSURE (gain), HUE and INVERT above they are all presentation: none of them touches ψ. <b>FROST</b> is a trial of a pale-blue blur behind the cards, off by default: measured at 21 px over the live field it took the frame from 17 ms to 82 ms (13 fps) under software compositing and about 25 fps on a GPU desktop, because the blur of both racks is recomposited on every frame the field changes — the GOVERNOR suspends it while the transport plays under load and brings it back on pause. <b>ACCENT A · B</b> are two angles on the current palette wheel (the PHASE PALETTE editor\'s stops, shifted by HUE): every accent in the interface takes its colour from them, held to a legible lightness for the theme, so turning the wheel recolours the whole UI. The logo is the same wheel verbatim — λ at 0°, the nine squares at 0°, 40°, … 320°.';
    __LW_hooks.setTheme = setTheme;

    const gd = group(wStyle.body, 'the transfer has a bounded ceiling');
    const rd = el('div', 'row tight', gd);
    ui.styleSeg = seg({ label: 'STYLE', value: 'cloud', options: [
      { id: 'cloud', label: 'CLOUD', title: 'the emission/absorption integral' },
      { id: 'solid', label: 'SOLID', title: 'a bounded plateau: a lit isosurface whose level EXPOSURE moves — it cannot fill the box' },
      { id: 'grain', label: 'GRAIN', title: 'the same field as noisy particles: a per-voxel hash keeps a fraction of the samples' },
      { id: 'signed', label: 'SIGNED', title: 'the wave as flat ±1 lobes meeting at a hard nodal surface — best in the REAL and IMAG views' },
      { id: 'bands', label: 'BANDS', title: 'the wave\'s own level lines: a cosine comb on the amplitude (GRAIN sets 2–16 bands) — an interference-fringe reading' }],
      onChange: (v) => { mat.style = STYLE[v]; schedule(TIER.PRESENT); } });
    rd.appendChild(ui.styleSeg.root);
    rd.appendChild(knob({ label: 'ISO', min: 0.002, max: 0.9, value: 0.06, log: true, fmt: (v) => v.toFixed(3), onInput: (v) => { mat.iso = v; schedule(TIER.PRESENT); } }).root);
    rd.appendChild(knob({ label: 'GRAIN', min: 0.02, max: 1, value: 0.35, log: true, fmt: (v) => v.toFixed(2), onInput: (v) => { mat.grain = v; schedule(TIER.PRESENT); } }).root);
    rd.appendChild(knob({ label: 'KNEE', min: 0.02, max: 8, value: 0.6, log: true, fmt: (v) => v.toFixed(2), onInput: (v) => { mat.knee = v; schedule(TIER.PRESENT); } }).root);
    el('div', 'note', gd).innerHTML = 'Every style passes its weight through a <b>saturation knee</b> w ↦ w/(1+kw), so the opacity of a step tends to a finite ceiling as EXPOSURE grows: cranking the knob deepens the blob instead of glowing the whole field. <b>SOLID</b> draws the plateau ρ ≈ ISO as a lit surface (shaded by the density gradient), so EXPOSURE moves the surface rather than flooding the volume; <b>GRAIN</b> stipples the same field into particles. All three are DESIGN CHOICES — the observable itself is chosen above.';

    {
      const gk = group(ui.set.body, 'KEYS  ·  every shortcut, rebindable (saved in this browser)');
      const list = el('div', 'keys-list', gk);
      ui.keysRefresh = () => {
        list.innerHTML = '';
        for (const a of __LW_hooks.keys.actions) {
          const row = el('div', 'keys-row', list);
          el('span', 'keys-label', row, a.label);
          const chip = el('button', 'keys-chip' + (__LW_hooks.keys.capturing === a.id ? ' hot' : ''), row, __LW_hooks.keys.capturing === a.id ? 'press a key…' : __LW_hooks.keys.name(a));
          chip.type = 'button'; chip.title = 'click, then press the new key (Esc cancels)';
          chip.addEventListener('click', () => __LW_hooks.keys.capture(a.id));
        }
      };
      const rr = el('div', 'row tight', gk);
      rr.appendChild(trig({ label: 'RESET KEYS', onFire: () => __LW_hooks.keys.reset() }).root);
      el('div', 'note', gk).innerHTML = 'Click a key chip and press the new key. <b>H</b> hides the interface and the frame (press again to bring them back), <b>TAB</b> brings the next window to the top of the rack and unfolds it (Shift+TAB the previous), <b>Ctrl+R</b> reseeds the particles. Shift is the fine step for the stepping keys. <b>Ctrl/⌘+Z</b> undoes the last edit to ψ or its law and <b>Ctrl/⌘+Shift+Z</b> (or Ctrl+Y) redoes it — one whole knob drag is one step, and the camera, the palette, the layout and the theme are never on that stack. Keys never fire while you are typing in the notebook or any field.';
      setTimeout(() => ui.keysRefresh && ui.keysRefresh(), 0);
    }

    const gs = group(wClip.body, 'observer only');
    const r3 = el('div', 'row', gs);
    r3.appendChild(seg({ value: 'off', options: [{ id: 'off', label: 'VOLUME' }, { id: 'clip', label: 'CLIP' }, { id: 'slab', label: 'SLAB' }], onChange: (v) => { mat.slice.mode = { off: 0, clip: 1, slab: 2 }[v]; schedule(TIER.PRESENT); } }).root);
    r3.appendChild(seg({ value: 'z', options: [{ id: 'x', label: 'X' }, { id: 'y', label: 'Y' }, { id: 'z', label: 'Z' }], onChange: (v) => { mat.slice.axis = { x: 0, y: 1, z: 2 }[v]; schedule(TIER.PRESENT); } }).root);
    r3.appendChild(knob({ label: 'POS', min: -1, max: 1, value: 0, fmt: (v) => v.toFixed(2), onInput: (v) => { mat.slice.pos = v; schedule(TIER.PRESENT); } }).root);
    r3.appendChild(knob({ label: 'THICK', min: 0.01, max: 0.4, value: 0.03, log: true, fmt: (v) => v.toFixed(3), onInput: (v) => { mat.slice.thick = v; schedule(TIER.PRESENT); } }).root);
    const gp = group(wPal.body, 'a DESIGN CHOICE; ψ untouched');
    palette = createPaletteEditor(gp, {
      setLUT(lut) { wheelLUT = lut; if (field.ok) field.setPalette(lut); applyAccent(); },
      setEnabled(v) { mat.paletteOn = v; if (v) { mat.view = VIEW.phase; ui.viewSeg.set('phase'); } },
      repaint() { schedule(TIER.PRESENT); }
    });
    const gc = group(wCam.body, '');
    const r4 = el('div', 'row', gc);
    ui.spinSw = sw({ label: 'AUTO-ROTATE', value: false, onChange: (v) => { camera.autoRotate = v; schedule(TIER.PRESENT); } });
    r4.appendChild(ui.spinSw.root);
    r4.appendChild(knob({ label: 'SPIN', min: 0.02, max: 2, value: 0.25, log: true, fmt: (v) => v.toFixed(2) + ' rad/s', onInput: (v) => { camera.speed = v; } }).root);
    r4.appendChild(trig({ label: 'RESET VIEW', onFire: () => { Object.assign(obs, { yaw: 0.65, pitch: 0.38, dist: 3.3 }); schedule(TIER.PRESENT); } }).root);
    r4.appendChild(trig({ label: 'SET Δρ REF', title: 'capture ρ(now) as the DIFFERENCE reference (a field reference, not a state edit)', onFire: () => { setReference(); ui.viewSeg.set('diff'); mat.view = VIEW.diff; } }).root);
    const gq = group(ui.set.body, 'FIELD CACHE  ·  QUALITY  (changes the estimate, never the state)');
    const r5 = el('div', 'row', gq);
    r5.appendChild(seg({ label: 'GRID', value: '96', options: [{ id: '64', label: '64³' }, { id: '96', label: '96³' }, { id: '128', label: '128³' }],
      onChange: (v) => { quality.res = +v; quality.steps = { 64: 110, 96: 160, 128: 240 }[+v]; quality.scale = { 64: 0.75, 96: 1, 128: 1 }[+v]; schedule(TIER.REBUILD); } }).root);
    r5.appendChild(seg({ label: 'FIELD CLOCK cap', value: '0', options: [{ id: '0', label: 'MAX' }, { id: '33', label: '30 Hz' }, { id: '66', label: '15 Hz' }, { id: '200', label: '5 Hz' }],
      onChange: (v) => { fieldRate.capMs = +v; } }).root);
    const r5b = el('div', 'row tight', gq);
    ui.autoSw = sw({ label: 'AUTO SCALE', value: true, title: 'lower the canvas resolution while frames run slower than 45 fps, raise it back above 80 fps — the estimate on screen, never the state', onChange: (v) => { quality.auto = v; if (!v) quality.autoScale = 1; saveSettings(); } }); r5b.appendChild(ui.autoSw.root);
    ui.govSw = sw({ label: 'GOVERNOR', value: true, title: 'when the last 60 frames\' median passes 28 ms the field grid steps one notch down and a window costing more than a frame is parked while the transport plays (its status says so); 3 s under budget steps back up — off, nothing is governed', onChange: (v) => { setGovernor(v); saveSettings(); } }); r5b.appendChild(ui.govSw.root);
    ui.scaleRo = readout({ label: 'RENDER SCALE', value: '100%', sub: 'canvas pixels per CSS pixel × DPR' });
    r5b.appendChild(ui.scaleRo.root);
    const r6 = el('div', 'row', gq);
    ui.domainAuto = sw({ label: 'DOMAIN AUTO', value: true, onChange: (v) => { domain.auto = v; ui.domainKnob.setDisabled(v); schedule(TIER.REBUILD); } });
    r6.appendChild(ui.domainAuto.root);
    ui.domainKnob = knob({ label: 'HALF-WIDTH', min: 3, max: 140, value: 7, log: true, fmt: (v) => '±' + v.toFixed(0) + ' a₀', onChange: (v) => { domain.half = v; schedule(TIER.REBUILD); } });
    ui.domainKnob.setDisabled(true);
    r6.appendChild(ui.domainKnob.root);
    const r7 = el('div', 'row tight', gq);
    ui.keepSw = sw({ label: 'KEEP FRAMES', value: false, title: 'the transport\'s playhead follows every frame (the scrub bar repaints on the glass at the display rate); off — the default — the bar is disabled while RATE and play / pause work as before', onChange: (v) => { setKeepFrames(v); saveSettings(); } }); r7.appendChild(ui.keepSw.root);
    el('div', 'note', gq).innerHTML = '<b>GOVERNOR.</b> The median of the last 60 presented frames is judged against a 28 ms budget while the transport plays: over it, the FIELD grid steps one notch down (128 → 96 → 64) and any window whose update was measured to cost more than a frame is <b>parked</b> — it runs on pause or edit and its status says so — while one over half a frame runs at most every six times its cost; 3 s under 22 ms steps back up, and pausing restores your grid at once. METERS shows its state. <b>KEEP FRAMES</b> is the playhead: on, the scrub bar follows every frame as it always did (a repaint on the transport\'s glass at the display rate); off, the default, the bar is disabled and the t readout runs at 5 Hz — RATE and play / pause are untouched. Both are this browser\'s settings, never a project\'s. The bow\'s slap, the BOX packet and the REPEATS scan run in a worker off the frame, so the pointer is free the moment the finger lifts.';
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
    r2.appendChild(trig({ label: 'NORMALIZE', title: 'c ↦ c / √(c†c) — explicit, never silent; the status says what ‖c‖ was', onFire: () => normalizeNow() }).root);
    r2.appendChild(trig({ label: 'CLEAR', onFire: () => { reg.clear(); refSnapshot = null; touchState(); } }).root);
    r2.appendChild(knob({ label: 'ROTATE z', min: 0, max: 2 * Math.PI, value: 0, wrap: true, cls: 'rot', fmt: () => 'D(R_z)', onDelta: (d) => { reg.rotateZ(d); touchState(); } }).root);
    {
      const gab = group(wState.body, 'A / B  ·  TRANSITION  (Rabi)');
      const rab = el('div', 'row tight', gab);
      let abA = null, abB = null, abOmega = 0.05;
      const snap = () => ({ re: Float64Array.from(reg.re0), im: Float64Array.from(reg.im0) });
      const recall = (S) => { if (!S) return; if (reg.transition) { reg.clearTransition(clock.t); ui.abSw.set(false); } reg.re0.set(S.re); reg.im0.set(S.im); reg.version++; touchState(); abStatus(); };
      ui.abRo = readout({ label: 'A / B', value: '—  /  —', sub: 'store two states, then TRANSITION plays A → B → A at Ω' });
      rab.appendChild(trig({ label: 'STORE A', title: 'keep the register as it is now as state A', onFire: () => { abA = snap(); abStatus(); hNote(); } }).root);
      rab.appendChild(trig({ label: 'STORE B', title: 'keep the register as it is now as state B', onFire: () => { abB = snap(); abStatus(); hNote(); } }).root);
      rab.appendChild(trig({ label: 'A', title: 'recall state A', onFire: () => recall(abA) }).root);
      rab.appendChild(trig({ label: 'B', title: 'recall state B', onFire: () => recall(abB) }).root);
      const rab2 = el('div', 'row tight', gab);
      ui.abSw = sw({ label: 'TRANSITION', value: false, title: 'play the Rabi mix cos(Ω(t−t₀)/2)·A(t) + sin(Ω(t−t₀)/2)·B(t)', onChange: (v) => {
        if (v && sturm.P) { ui.abSw.set(false); ui.abRo.set('off under STURMIAN', 'warn'); ui.abRo.setSub('A / B TRANSITION is a diagonal-phase feature (two exact diagonal evolutions mixed): switch SCALE back to HYDROGEN'); return; }
        if (v) { if (!abA || !abB) { ui.abSw.set(false); ui.abRo.set('store A and B first', 'warn'); return; } reg.setTransition(abA, abB, abOmega, clock.t); if (!clock.playing) { clock.play(performance.now() / 1000); schedule(TIER.EVOLVE); } }
        else if (reg.transition) reg.clearTransition(clock.t);
        touchState(); abStatus();
      } });
      rab2.appendChild(ui.abSw.root);
      ui.abOmega = knob({ label: 'Ω  RABI', min: 0.005, max: 1, value: 0.05, log: true, fmt: (v) => v.toFixed(3), onInput: (v) => { if (reg.transition) { const th = reg.mixAngle(clock.t); reg.transition.omega = v; reg.transition.t0 = clock.t - 2 * th / v; } abOmega = v; } });
      rab2.appendChild(ui.abOmega.root);
      rab2.appendChild(ui.abRo.root);
      function abStatus() {
        const count = (S) => S ? S.re.reduce((k, v, i) => k + ((v || S.im[i]) ? 1 : 0), 0) : 0, nA = count(abA), nB = count(abB);
        let ov = 0; if (abA && abB) { let r = 0, im = 0; for (let a = 0; a < 91; a++) { r += abA.re[a] * abB.re[a] + abA.im[a] * abB.im[a]; im += abA.re[a] * abB.im[a] - abA.im[a] * abB.re[a]; } ov = Math.hypot(r, im); }
        const exact = nA === 1 && nB === 1 && ov < 1e-9;
        ui.abRo.set((abA ? nA + (nA === 1 ? ' mode' : ' modes') : '—') + '  /  ' + (abB ? nB + (nB === 1 ? ' mode' : ' modes') : '—'), reg.transition ? (exact ? 'ok' : 'warn') : '');
        ui.abRo.setSub(reg.transition ? (exact ? 'EXACT · two-level Rabi, resonant drive, RWA · |⟨A|B⟩| = ' + ov.toFixed(3) : 'TOY · the Rabi envelope on composite states · |⟨A|B⟩| = ' + ov.toFixed(3)) : 'store two states, then TRANSITION plays A → B → A at Ω');
      }
      __LW_hooks.ab = { get A() { return abA; }, get B() { return abB; }, storeA() { abA = snap(); abStatus(); hNote(); }, storeB() { abB = snap(); abStatus(); hNote(); }, setStores(A, B) { abA = A ? { re: Float64Array.from(A.re), im: Float64Array.from(A.im) } : null; abB = B ? { re: Float64Array.from(B.re), im: Float64Array.from(B.im) } : null; abStatus(); }, recallA() { recall(abA); }, recallB() { recall(abB); }, set(v) { if (v && sturm.P) return false; ui.abSw.set(v); if (v) { if (!abA || !abB) return false; reg.setTransition(abA, abB, abOmega, clock.t); } else if (reg.transition) reg.clearTransition(clock.t); touchState(); abStatus(); return true; }, get on() { return !!reg.transition; }, get status() { return ui.abRo.root.textContent; } };
      el('div', 'note', gab).innerHTML = '<b>A / B.</b> STORE keeps the register as it is now (its t = 0 anchor); A and B recall it. <b>TRANSITION</b> plays c(t) = cos(Ω(t−t₀)/2)·A(t) + sin(Ω(t−t₀)/2)·B(t), with A(t), B(t) the exact evolutions. For two eigenstates under a resonant drive this is the <b>exact two-level Rabi solution</b> in the rotating-wave approximation, and the density breathes at E_B − E_A — the radiating dipole of the Falstad "atom radiative transitions" applet, here as an exact superposition you can watch in every window. With composite A or B the same envelope is a <b>TOY</b>, and the readout says so. While a transition plays, edits act on the stored anchors; turning it off freezes the mix as the new state.';
    }
    ui.kzKnob = knob({ label: 'STARK K_z', min: 0, max: 2 * Math.PI, value: 0, wrap: true, cls: 'rot', fmt: () => 'e^{−iθK_z}', onDelta: (d) => { reg.rotateK(d); touchState(); } });
    r2.appendChild(ui.kzKnob.root);
    ui.defKnob = knob({ label: 'DEFECT L²', min: 0, max: 2 * Math.PI, value: 0, wrap: true, cls: 'rot', fmt: () => 'e^{iαL²}', onDelta: (d) => { reg.defectWait(d); touchState(); } });
    r2.appendChild(ui.defKnob.root);
    el('div', 'note', wState.body).innerHTML = '<b>STATE ROTATE</b> applies D(R_z(α)) to the coefficients (c<sub>nlm</sub> → e<sup>−imα</sup>c<sub>nlm</sub>). <b>STARK ROTATE</b> applies e<sup>−iθK<sub>z</sub></sup>, K the Runge–Lenz vector: an SO(4) rotation mixing l at fixed (n, m) — the ORBIT invariants do not move. <b>DEFECT WAIT</b> applies e<sup>iαL²</sup> (a wait under an l-dependent phase, a quantum defect): unitary, in-shell, not an SO(4) element — the invariants move, and with the rotors it is a universal gate set. All three change c; <b>camera</b> orbit is in OBSERVER and never touches c. Edits happen at the current logical time; nothing is silently renormalized.';
    /* ── SLAP: a sudden momentum impulse — exact operator, the register's image of it, the loss reported ── */
    const gK = group(wState.body, 'SLAP  ·  a sudden impulse  ψ ↦ e^{ik·x}ψ  (the impulsive Stark limit, Δp = −∫E dt)');
    const rk = el('div', 'row tight', gK);
    let kickK = 0.2, kickAxis = 'z';
    rk.appendChild(knob({ label: 'IMPULSE k', min: 0.01, max: 1.5, value: 0.2, log: true, fmt: (v) => v.toFixed(3) + ' a.u.', onInput: (v) => { kickK = v; } }).root);
    ui.kickAxis = seg({ label: 'ALONG', value: 'z', options: [{ id: 'x', label: 'x' }, { id: 'y', label: 'y' }, { id: 'z', label: 'z' }], onChange: (v) => { kickAxis = v; } });
    rk.appendChild(ui.kickAxis.root);
    rk.appendChild(trig({ label: 'SLAP', title: 'kick the electron: ψ ↦ e^{ik·x}ψ at the current logical time (also: the K key, along the X/Y/Z axis)', onFire: () => slap(kickK, kickAxis) }).root);
    ui.dragKnob = knob({ label: 'DRAG γ (TOY)', min: 0, max: 0.5, value: 0, fmt: (v) => v === 0 ? 'off' : v.toFixed(3), onInput: (v) => { reg.setDamping(v); touchState(); } });
    rk.appendChild(ui.dragKnob.root);
    ui.kickRo = readout({ label: 'LAST SLAP  escaped · ⟨p⟩ gained', value: '—', cls: 'two', sub: 'nothing slapped yet' });
    rk.appendChild(ui.kickRo.root);
    el('div', 'note', gK).innerHTML = 'A sudden impulse multiplies ψ by a plane wave: exact, unitary on the full space, and the same thing a delta-pulse electric field does. The register keeps only its n ≤ 6 image, so the norm DROPS by the probability the electron was knocked out of the first six shells or ionised — <b>ESCAPED</b> is that number, never renormalised away. The momentum the register gains is Ehrenfest\'s k times the bound share of the Thomas–Reiche–Kuhn sum rule (0.546 for 1s): the missing part is the continuum. Then it <b>jiggles</b>: the state is a superposition and rings at its beats — watch DYNAMICS\' dipole. A magnetic slap is a rotation of the state, which the rotor knobs already are. <b>THE BOW:</b> hold CTRL, press on the field and pull away like drawing a bow — the picture switches to phase and shows the <i>exact</i> boosted state e^{ik·x}ψ, its fringes tightening as k grows (λ = 2π/k); release to slap in the direction the arrow points (opposite the pull, in the screen plane), release CTRL first to cancel. <b>DRAG γ is a TOY</b>, not physics: excited amplitudes decay as e^{−γ(E_a−E_0)t}, non-unitary, forward in time only, so the wave settles to the ground state. It is the <b>no-jump branch</b> of H − iγ(H−E₀), Γ_a = 2γ(E_a−E₀): the ground-state population is invariant and nothing is emitted anywhere — not Lindblad, not the Einstein rates — the norm it loses is simply discarded (Round 11 B4). The status line says TOY DRAG while it is on.';
    function pAlong(axis) {
      const c = reg.at(clock.t);                                  // sum over the WHOLE register: a rotation moves amplitude between m
      if (axis === 'z') return momentumZ(c.re, c.im);
      const R = AXIS_TO_Z[axis], re = Float64Array.from(c.re), im = Float64Array.from(c.im);
      rotorOnCopy(re, im, { which: 'both', axis: R.axis, angle: R.angle });
      return momentumZ(re, im);
    }
    function slap(k, axis) {
      const n0 = reg.norm2(), p0 = pAlong(axis);
      if (!reg.populated().length && getHamiltonian().id !== 'well') reg.set(0, 1, 0, clock.t);   // an empty box: SLAP conjures the ground state first (Josh)
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
    ui.fz = knob({ label: 'STARK F', min: 0, max: 0.01, value: 0, fmt: (v) => v === 0 ? 'off' : v.toExponential(1), onInput: (v) => { if (!getHamiltonian().stark || sturm.P) { ui.fz.set(0); return; } reg.setField({ Fz: v }); touchState(); } });
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
  {
    const rh = wSpec.row('tight');
    ui.hamSeg = seg({ label: 'HAMILTONIAN  ·  the eigenproblem the 91 labels refer to', value: 'hydrogen', options: [
      { id: 'hydrogen', label: 'HYDROGEN  −1/r', title: 'E = −1/(2n²); every window is a theorem about it' },
      { id: 'qho', label: 'OSCILLATOR  ½r²', title: 'E = ħω(N + 3/2), N = 2n_r + l; the same 91 labels via n_r = n − l − 1; a slap makes an exact coherent state' },
      { id: 'well', label: 'BOX  r < a', title: 'the infinite spherical well: ψ = j_l(kr)Y, E = z²/(2a²), a hard wall — a slapped packet bounces and disperses' },
      { id: 'atom', label: 'ATOM  Z = 1…36', title: 'a real neutral atom (H … Kr) as ONE self-consistent central field: Xα(2/3) + the Latter tail, solved live on a log mesh and Richardson-extrapolated; the 91 labels become its shells, and a shell the ground configuration does not occupy is VIRTUAL (marked °) — it keeps the frozen field\'s eigenvalue and has no radial. The ATOMS window carries the model, the Δ-SCF ionisation and the quantum defect' },
      { id: 'cornell', label: 'QUARKONIUM  Cornell', title: 'a heavy quark pair in −4α_s/3r + σr: the 91 labels re-read as the 36 (n_r, l) levels of charmonium or bottomonium, NUMERICAL (Numerov); masses in GeV, lengths in GeV⁻¹; the QCD panel\'s knobs drive it' }],
      onChange: (v) => { switchHamiltonian(v); if (v === 'well') enterBox(); } });
    rh.appendChild(ui.hamSeg.root);
    ui.wellKnob = knob({ label: 'WELL RADIUS a', min: 3, max: 30, value: 10, fmt: (v) => v.toFixed(1) + ' a₀', onInput: (v) => { HAMILTONIANS.well.setRadius(v); gas.setRadius(v); hNote(); if (getHamiltonian().id === 'well') { reg.setEnergies(energyOf); wSpec.body.querySelectorAll('.sp-e[data-a]').forEach((e) => { e.textContent = `${getHamiltonian().energy(+e.dataset.a).toFixed(4)} Eh`; }); schedule(TIER.REBUILD); } } });
    rh.appendChild(ui.wellKnob.root);
    {
      const rg = wSpec.row('tight');
      rg.appendChild(knob({ label: 'GAS  σ', min: 0.5, max: 3, value: 1.8, fmt: (v) => v.toFixed(2) + ' a₀', onInput: (v) => { gasWidth = v; } }).root);
      ui.gasBasis = seg({ label: 'GAS BASIS', value: 'reg', options: [{ id: 'reg', label: '91', title: 'the register\'s 91 labels (l ≤ 5): a packet no smaller than about a/6, launched on any axis' }, { id: 'axial', label: 'AXIAL 256', title: 'the box\'s second register: m = 0 about z, n_r ≤ 15, l ≤ 15 — packets down to σ ≈ 0.6 a₀, launched along z; the channels do not list it (it is not the 91-label register)' }], onChange: (v) => { gasAxial = v === 'axial'; if (!gasAxial) gas.off(); hNote(); schedule(TIER.RECONSTRUCT); } });
      rg.appendChild(ui.gasBasis.root);
      ui.gasSpeed = knob({ label: 'GAS  |k|', min: 0.1, max: 2.5, value: 0.8, log: true, fmt: (v) => v.toFixed(2), onInput: () => {} });
      rg.appendChild(ui.gasSpeed.root);
      rg.appendChild(trig({ label: 'LAUNCH', title: 'in the BOX: put a packet of width σ at −a/2 on the chosen axis, moving along it at |k| — then watch it bounce', onFire: () => {
        if (getHamiltonian().id !== 'well') { setHamiltonian('well'); switchHamiltonian('well'); if (ui.hamSeg) ui.hamSeg.set('well'); }
        const ax = keyState.axis, a = HAMILTONIANS.well.radius, d = { x: [1, 0, 0], y: [0, 1, 0], z: [0, 0, 1] }[ax], k = ui.gasSpeed.get ? ui.gasSpeed.get() : 0.8;
        launchPacket(d.map((v) => -v * a / 2), d.map((v) => v * k), gasSigma(k));
      } }).root);
      ui.gasRo = readout({ label: 'GAS  packet held by the box', value: '—', sub: 'nothing launched' });
      rg.appendChild(ui.gasRo.root);
      rg.appendChild(trig({ label: 'COHERENT BOUNCE', title: 'in the OSCILLATOR: the ground state slapped with |k| is an exact Glauber coherent state — it swings through the centre for ever without spreading (period 2π)', onFire: () => coherentBounce() }).root);
      el('div', 'note', wSpec.body).innerHTML = '<b>COHERENT BOUNCE (EXACT).</b> In the oscillator a slapped ground state e<sup>ikz</sup>ψ<sub>0</sub> is the coherent state |α⟩ with α = ik/√2: its centre follows the classical orbit ⟨z⟩ = k sin t, ⟨p⟩ = k cos t, and its width never changes — the packet Josh asked for, rigid and bouncing, with nothing approximate (truncation at N ≤ 10 holds e<sup>−k²/2</sup>Σ(k²/2)<sup>N</sup>/N! of the norm: 99.99% at k = 2). In the BOX the same slap disperses, because a hard wall has no equally spaced ladder — that is physics, not a defect. The BOX\'s basis (six radial zeros, l ≤ 5) also bounds how compact a held packet can be: σ/a ≳ 1/6 for 95% capture, so the gas packet is always about a sixth of the box.';
      el('div', 'note', wSpec.body).innerHTML = '<b>THE GAS.</b> In the BOX a packet is a Gaussian of width σ with momentum k, <b>projected onto the well\'s 91 eigenstates</b> and normalised as a new state; it then moves and bounces by the exact evolution. The register resolves nothing sharper than ≈ a/6, so the readout says how much of the packet it holds. The BOW launches a packet where you pressed, flying along the arrow; a harder pull launches a slightly tighter packet — a <b>DESIGN CHOICE</b> at launch (a boost by itself never changes a width).';
    }
    ui.zKnob = knob({ label: 'Z  (ion)', min: 1, max: 6, value: 1, fmt: (v) => 'Z = ' + Math.round(v), onInput: (v) => { setZ(Math.round(v)); if (getHamiltonian().id === 'hydrogen') switchHamiltonian('hydrogen'); } });
    rh.appendChild(ui.zKnob.root);
    ui.elemKnob = knob({ label: 'ELEMENT  Z', min: 1, max: 36, value: 10, step: 1, fmt: (v) => 'Z = ' + Math.round(v) + '  ' + ATOMS[Math.max(0, Math.min(35, Math.round(v) - 1))].symbol, onChange: (v) => setElement(Math.round(v)) });
    rh.appendChild(ui.elemKnob.root);
    {   /* W-STURMIAN: THE SCALE — a switch (Josh); hydrogen is today's code path, untouched */
      const rs = wSpec.row('tight');
      ui.scaleSeg = seg({ label: 'SCALE  ·  the exponent of the 91 radials  (hydrogen operator only)', value: 'hydrogen', options: [
        { id: 'hydrogen', label: 'HYDROGEN  1/n', title: 'the shipped radials: each label n carries its own exponent 1/n — hydrogen\'s bound states, the diagonal law, every window' },
        { id: 'sturmian', label: 'STURMIAN  λ', title: 'one common exponent λ for all 91 labels: the Coulomb Sturmians (Rotenberg 1962), a complete discrete set. The labels stop being eigenstates: the register evolves by C e^{−iEt} CᵀS with the VARIATIONAL eigenvalues of S⁻¹H, the ladder shows them with the state\'s population in each, and the kernel draws the same tables at n = 1/λ' }],
        onChange: (v) => setSturmian({ on: v === 'sturmian' }) });
      rs.appendChild(ui.scaleSeg.root);
      ui.lambdaKnob = knob({ label: 'λ  SCALE', min: 0.25, max: 3, value: 1, fmt: (v) => 'λ = ' + v.toFixed(3), onInput: (v) => { if (sturm.on) setSturmian({ lambda: v }); else sturm.lambda = Math.max(0.25, Math.min(3, v)); } });
      ui.lambdaKnob.root.title = 'λ, the common exponent (a₀⁻¹): λ = 1/n makes label n exact again (its eigenvalue −Z²/2n²); λ = Z makes the 1s Sturmian the exact ion ground state (He⁺ at λ = 2: −2 Eh). Shift = fine, double-tap = 1';
      ui.lambdaKnob.setDisabled(true);
      rs.appendChild(ui.lambdaKnob.root);
      ui.sturmRo = readout({ label: 'SCALE', value: 'HYDROGEN 1/n', cls: 'two', sub: 'the shipped radials · λ acts once STURMIAN is on' });
      rs.appendChild(ui.sturmRo.root);
      el('div', 'note', wSpec.body).innerHTML = '<b>SCALE (a switch).</b> <b>HYDROGEN</b> is today\'s instrument, untouched. <b>STURMIAN</b> gives every one of the 91 radials the same exponent λ — the Coulomb Sturmians S<sub>nlm</sub>(λ), the same Laguerre and Legendre tables drawn at n = 1/λ, a <b>complete</b> discrete set (the shipped n ≤ 6 hydrogen set is not: 23 % of He⁺ 1s lives in the continuum it lacks). The labels stop being eigenstates: the register evolves by the exact law in the basis, c(t) = C e<sup>−iEt</sup> CᵀS c(0), with the eigenvalues of S⁻¹H — <b>variational</b> upper bounds (Hylleraas–Undheim–MacDonald), exact where a label happens to be one: λ = 1/n reproduces −Z²/2n², λ = Z the ion\'s 1s at −Z²/2. The ladder shows those eigenvalues with the state\'s population in each (S-metric projections — what "population" means in a non-orthogonal basis; they are constants of the motion); click one to load its eigenvector. The lanes keep the labels\' coefficients; a lane\'s energy is the label\'s ⟨H⟩, not an eigenvalue; the norm is ⟨c|S|c⟩ and NORMALIZE normalises in it. RATE, A / B TRANSITION and the Stark field are diagonal-phase features and stand down, as do momentum space (no table built), ELECTROSTATICS and the hydrogen-theorem windows; the Zeeman field stays (exact). Everything comes back on HYDROGEN. Z is honoured: H = −½∇² − Z/r.';
    }
    el('div', 'note', wSpec.body).innerHTML = '<b>Z</b> makes the hydrogen-like ion (He⁺, Li²⁺, …) by <b>exact scaling</b>: lengths /Z, energies ×Z², momenta ×Z — nothing approximate anywhere; the hydrogen-theorem windows are written in hydrogen\'s own units and stand down for Z ≠ 1 (ORBIT\'s invariants are dimensionless and stay). The register holds coefficients on 91 labels (n, l, m); this chooses the operator they are eigenstates OF. <b>HYDROGEN</b>: E = −1/(2n²), the Coulomb closed forms. <b>OSCILLATOR</b>: E = ħω(N + 3/2) with N = 2n_r + l, the Gaussian closed forms — exact, its own momentum picture up to a phase (−i)^N, and a <b>slap on its ground state is an exact coherent state</b> that sloshes forever without dispersing (Ehrenfest exact), where hydrogen\'s disperses and revives. Windows that are theorems about hydrogen (ORBIT, LADDER, VORTEX, DYNAMICS, SLICE, KEPLER) stand down when the operator is not hydrogen; the Stark field, exact within a Coulomb shell, is off there.';
  }
    el('div', 'note', wSpec.body).innerHTML = '<b>ATOM</b> is the one operator here that is <b>not</b> a closed form: a real neutral atom, H … Kr, as a single self-consistent central field — −Z/r + V<sub>H</sub> + V<sub>x</sub> with <b>Xα, α = 2/3</b> and the <b>Latter tail</b> — solved live on a logarithmic mesh (twice, Richardson-extrapolated in dx²) and handed to the kernel as a tabulated radial, exactly as QUARKONIUM is. The 91 labels become that atom\'s shells: ε<sub>nl</sub> where the ground configuration occupies the shell, the same frozen field\'s eigenvalue where it does not — a <b>virtual</b> shell, marked <b>°</b>, which carries an energy and draws nothing, because atoms.js refuses to invent a radial for a shell the atom does not have. Momentum space is not built for it. <b>ε is not an ionisation energy</b>: the ATOMS window prints the Δ-SCF beside Koopmans\' −ε and never confuses them.';
  api.hamiltonian = () => sturm.P ? sturmSpectrum() : getHamiltonian().spectrum;          // W-STURMIAN: the eigen ladder under the scale
  api.energyOf = (a) => sturm.P ? labelExpect(a) : getHamiltonian().energy(a);
  api.rateDisabled = () => !!sturm.P;
  api.rateNote = () => 'RATE is a diagonal-phase feature (a multiplier on one label\'s own E): off under STURMIAN, where the labels are not eigenstates — switch SCALE back to HYDROGEN';
  api.selectEigen = (k) => selectEigen(k);
  api.unit = () => (getHamiltonian().unit === 'hartree' ? 'Eh' : getHamiltonian().unit);
  api.labelOf = (s) => getHamiltonian().labelOf(s);
  const spectrum = createSpectrum(wSpec.body, api);
  { const kids = [...wSpec.body.children], i = kids.findIndex((k) => k.classList.contains('ladder')); for (const k of kids.slice(0, Math.max(0, i))) wSpec.body.appendChild(k); }   // the Hamiltonian, the gas and the bounce sit BELOW the channels (Josh)
  /** NORMALIZE, and say what it did — a unit-norm state looks the same afterwards, which is why it seemed to do nothing */
  function toggleFullscreen() { const d = document; if (d.fullscreenElement) { if (d.exitFullscreen) d.exitFullscreen(); } else { const e = d.documentElement; const f = e.requestFullscreen || e.webkitRequestFullscreen; if (f) try { f.call(e); } catch (err) {} } }
  function normalizeNow() {
    const n = reg.normalize(); touchState();
    const nm = sturm.P ? '⟨c|S|c⟩^½' : '‖c‖';                                     // W-STURMIAN: the S-norm is the norm
    const msg = Math.abs(n - 1) < 5e-4 ? nm + ' was 1 already · nothing to do' : nm + ' ' + n.toFixed(4) + ' → 1';
    wState.setStatus(msg, 'live'); wSpec.setStatus(msg, 'live');
    setTimeout(() => { wState.setStatus('changes c'); wSpec.setStatus(...specStatus()); }, 1800);
  }
  function switchHamiltonian(id) {
    const H = setHamiltonian(id);
    if (id !== 'well' && gas.on) { gas.off(); schedule(TIER.RECONSTRUCT); }
    reg.setEnergies(energyOf);
    if (!H.stark && reg.field.Fz !== 0) { reg.setField({ Fz: 0 }); if (ui.fz) ui.fz.set(0); }
    if (H.noMomentum && space === 'p') { space = 'x'; if (ui.spaceSeg) ui.spaceSeg.set('x'); }
    for (const w of [wOrb, wVor, wDyn, wSlice, wLad]) if (w) w.root.hidden = !H.hydrogenTheorems;
    if (ui.fldWin) { const hy = H.id === 'hydrogen'; ui.fldWin.setStatus(hy ? 'exact · closed form · reads c(t)' : 'hydrogenic register only', hy ? '' : 'warn'); if (!hy) { for (const r of [ui.fldQ, ui.fldPhi, ui.fldE, ui.fldB]) if (r) r.set('—', 'warn'); } }
    wSpec.setStatus(hamLabel(), H.id === 'hydrogen' ? '' : 'live');
    wSpec.body.querySelectorAll('.sp-e[data-a]').forEach((e) => { e.textContent = `${H.energy(+e.dataset.a).toFixed(4)} ${H.unit === 'hartree' ? 'Eh' : H.unit}`; });
    wSpec.body.querySelectorAll('.sp-nm[data-a]').forEach((e) => { e.textContent = H.labelOf(BASIS[+e.dataset.a]); });
    if (sturm.on) { applySturmian(); return; }                        // W-STURMIAN: re-arm (or stand down) the scale under the operator now in force
    refSnapshot = null; pendingRef = null;
    schedule(TIER.REBUILD);
  }

  /* ── W-STURMIAN: THE SCALE (Josh: a switch — HYDROGEN is today's code path, untouched; STURMIAN adds) ─────────────────
   * On: the 91 records become sturmianRecord(n, l, m, λ) for the kernel (n_rec = 1/λ; rebuilt on every λ or Z change,
   * ≈ 1 ms + the GPU upload through TIER.REBUILD), the register evolves through the block-pure propagator C e^{−iEt} CᵀS
   * (sturmianreg.js), the state c(t) is CONTINUOUS across the change (re-anchored at the current time, as a RATE change
   * is), the norm is ⟨c|S|c⟩, the SPECTRUM ladder is the eigen-decomposition and its lanes the labels' coefficients, the
   * clock reads the OCCUPIED eigenvalues, and the diagonal-phase features (RATE, A/B TRANSITION, Stark, momentum space)
   * and the hydrogen-theorem windows stand down with a note.  Hydrogen operator only (Z honoured: H = −½∇² − Z/r). */
  const sturmLabel = () => `STURMIAN  λ = ${sturm.lambda.toFixed(3)} · Z = ${getZ()} · S⁻¹H on the 91 labels · VARIATIONAL`;
  /* the SAME sentence switchHamiltonian writes (wave 44): it used to drop the element, so an UNDO of an ELEMENT
     change or of FILL THE VALENCE left the status reading "ATOM  Xα(2/3) + Latter tail" with no atom named */
  const hamLabel = () => { const H = getHamiltonian(); return H.id === 'atom' ? H.label + '  ·  ' + H.short : H.label; };
  const specStatus = () => sturm.P ? [sturmLabel(), 'live'] : [hamLabel(), getHamiltonian().id === 'hydrogen' ? '' : 'live'];
  function setSturmian(o = {}) {
    if (o.on !== undefined) sturm.on = !!o.on;
    if (o.lambda !== undefined) sturm.lambda = Math.max(0.25, Math.min(3, +o.lambda || 1));
    applySturmian();
    return { on: sturm.on, lambda: sturm.lambda, active: !!sturm.P };
  }
  function applySturmian(keepAnchor = false) {
    const H = getHamiltonian(), want = sturm.on && H.id === 'hydrogen';
    if (want && reg.transition) { reg.clearTransition(clock.t); if (ui.abSw) ui.abSw.set(false); }   // the mix is a diagonal-phase feature: frozen as the state
    const c = keepAnchor ? null : reg.at(clock.t);                                                     // the state NOW, continuous across the change
    if (want) {
      const t0 = performance.now();
      sturm.P = createRegisterSturmian(sturm.lambda, { Z: getZ() }); sturm.rec = sturm.P.records(); sturm.buildMs = performance.now() - t0;
      if (space === 'p') { space = 'x'; if (ui.spaceSeg) ui.spaceSeg.set('x'); }                      // momentum space is not built for the scaled radials
      reg.setPropagator(sturm.P);
    } else { sturm.P = null; sturm.rec = null; reg.setPropagator(null); reg.setEnergies(energyOf); }
    if (c) reg.anchorFrom(c.re, c.im, clock.t);
    const on = !!sturm.P;
    if (ui.scaleSeg) ui.scaleSeg.set(sturm.on ? 'sturmian' : 'hydrogen');
    if (ui.lambdaKnob) { ui.lambdaKnob.set(sturm.lambda); ui.lambdaKnob.setDisabled(!on); }
    const keep = (elm, title) => { if (elm.dataset.title0 === undefined) elm.dataset.title0 = elm.title || ''; elm.title = on ? title : elm.dataset.title0; };
    if (ui.abSw) { ui.abSw.root.disabled = on; ui.abSw.root.classList.toggle('disabled', on); keep(ui.abSw.root, 'A / B TRANSITION is a diagonal-phase feature (two exact diagonal evolutions mixed): off under STURMIAN — switch SCALE back to HYDROGEN'); }
    if (ui.abOmega) ui.abOmega.setDisabled(on);
    if (ui.abRo && !on && /STURMIAN/.test(ui.abRo.root.textContent)) { ui.abRo.set('—  /  —', ''); ui.abRo.setSub('store two states, then TRANSITION plays A → B → A at Ω'); }
    if (ui.fz) { ui.fz.setDisabled(on); if (on) ui.fz.set(0); }
    /* wave 40: e^{−iθK_z} and e^{iαL²} are moves inside a COULOMB SHELL — written in a degeneracy the Sturmian
       scale does not have (its eigenvalues are variational, its shells are not n²-fold), so they stand down too */
    if (ui.kzKnob) { ui.kzKnob.setDisabled(on); keep(ui.kzKnob.root, 'STARK K_z is an SO(4) rotation inside a Coulomb shell: off under STURMIAN — switch SCALE back to HYDROGEN'); }
    if (ui.defKnob) { ui.defKnob.setDisabled(on); keep(ui.defKnob.root, 'DEFECT L² is a wait under the shell\'s l-dependent phase: off under STURMIAN — switch SCALE back to HYDROGEN'); }
    if (ui.spaceSeg) { const b = ui.spaceSeg.button('p'); if (b) { b.disabled = on; keep(b, 'not built for the Sturmians: position space only under STURMIAN'); } }
    if (ui.spaceNote) ui.spaceNote.hidden = !on;
    if (!(helium && helium.on)) { for (const w of [wOrb, wVor, wDyn, wSlice, wLad]) if (w) w.root.hidden = on || !H.hydrogenTheorems; if (wCalc) wCalc.root.hidden = on; }   // theorems about hydrogen's eigenfunctions stand down
    if (ui.fldWin) { const hy = H.id === 'hydrogen' && !on; ui.fldWin.setStatus(hy ? 'exact · closed form · reads c(t)' : on ? 'hydrogen only: no closed-form field for the scaled radials' : 'hydrogenic register only', hy ? '' : 'warn'); if (!hy) { for (const r of [ui.fldQ, ui.fldPhi, ui.fldE, ui.fldB]) if (r) r.set('—', 'warn'); } }
    wSpec.setStatus(...specStatus());
    wSpec.body.querySelectorAll('.sp-e[data-a]').forEach((e) => { e.textContent = `${api.energyOf(+e.dataset.a).toFixed(4)} ${api.unit()}`; });
    if (ui.sturmRo) paintSturmRo();
    refSnapshot = null; pendingRef = null; lastNmax = -1;
    touchState(); schedule(TIER.REBUILD);
  }
  /** the scale's readout: the ground eigenvalue, the occupied count, the S-norm and ⟨H⟩ of the state */
  function paintSturmRo() {
    sturm.roVersion = reg.version;
    if (!sturm.P) { ui.sturmRo.set(sturm.on ? 'STURMIAN · hydrogen operator only' : 'HYDROGEN 1/n', sturm.on ? 'warn' : ''); ui.sturmRo.setSub(sturm.on ? 'the scale acts under the HYDROGEN operator; switch the Hamiltonian back' : 'the shipped radials · λ acts once STURMIAN is on'); return; }
    const e = sturmEigen(); let occ = 0; for (const p of e.pop) if (p > 1e-6) occ++;
    ui.sturmRo.set(`λ = ${sturm.lambda.toFixed(3)} · E₀ = ${e.E[0].toFixed(5)} Eh · ${occ} occupied`, 'live');
    ui.sturmRo.setSub(`⟨c|S|c⟩ = ${e.norm.toFixed(4)} · ⟨H⟩ = ${e.energy.toFixed(5)} Eh · rank ${e.rank} · built in ${sturm.buildMs < 1 ? '< 1' : sturm.buildMs.toFixed(1)} ms · every E_k is an UPPER BOUND on level k of its (l, m)`);
  }
  /** the eigen-decomposition of the state: E_k, its population (the S-metric projection of c(t) — a constant of the motion), (l, m), the dominant n */
  function sturmEigen(t) {
    const P = sturm.P; if (!P) return null;
    const c = t === undefined ? { re: reg.re0, im: reg.im0 } : reg.at(t);
    return { E: Array.from(P.E), pop: Array.from(P.populations(c)), l: Array.from(P.lK), m: Array.from(P.mK), n: Array.from(P.nK), rank: P.rank, lambda: sturm.lambda, Z: getZ(), norm: P.norm(c), energy: P.energyOf(c) };
  }
  /** the energies THE CLOCK reads under the scale: the occupied eigenvalues (populations > 1e-6), Zeeman-shifted */
  const occupiedEigen = () => { const e = sturmEigen(), out = []; for (let k = 0; k < e.rank; k++) if (e.pop[k] > 1e-6) out.push(e.E[k] + reg.field.Bz * e.m[k] / 2); return out; };
  /** the ladder's descriptor under the scale (spectrum.js paints `eigen`) */
  function sturmSpectrum() {
    const e = sturmEigen(), Z = getZ();
    const eigen = e.E.map((E, k) => ({ k, E, pop: e.pop[k], n: e.n[k], label: `${'spdfgh'[e.l[k]]}${e.m[k] >= 0 ? '₊' : '₋'}${Math.abs(e.m[k])}` }));
    return { eigen, Emin: Math.min(e.E[0], -0.5 * Z * Z) * 1.02, Etop: 0, Emax: e.E[e.rank - 1], levels: [], levelKey: () => 0,
      footer: `EIGENVALUE  S⁻¹H at λ = ${sturm.lambda.toFixed(3)} · rank ${e.rank} · VARIATIONAL upper bounds · E > 0 pseudo-continuum`,
      caption: 'non-orthogonal basis: populations are projections ⟨C_k|S|c⟩ (the ladder) · a lane\'s energy is the label\'s ⟨H⟩, not an eigenvalue' };
  }
  /** load the k-th eigenvector (S-normalised, real) into the labels AT the current time: a stationary state of the scale */
  function selectEigen(k) {
    const P = sturm.P; if (!P || !(k >= 0 && k < P.rank)) return false;
    const e = P.eigenstate(k);
    reg.clear(); reg.anchorFrom(e.re, e.im, clock.t); lastNmax = -1;
    spectrum.select(-1); setReference(); shadowView.clearTrail(); touchState(); schedule(TIER.REBUILD);
    wSpec.setStatus(`eigenstate ${k} · E = ${P.E[k].toFixed(6)} Eh · ${'spdfgh'[P.lK[k]]}${P.mK[k] >= 0 ? '₊' : '₋'}${Math.abs(P.mK[k])} · stationary`, 'live');
    return true;
  }

  /** the ELEMENT knob: which atom the ATOM Hamiltonian solves (Z = 1 … 36); the register is re-read in it */
  function setElement(Z) {
    Z = Math.max(1, Math.min(36, Math.round(Z) || 1));
    busy.n++; busySync();                                              // wave 48: the atom is re-solved on a log mesh, twice, and Richardson-extrapolated — the mark says so
    let changed; try { changed = HAMILTONIANS.atom.configure(Z); } finally { busy.n = Math.max(0, busy.n - 1); busySync(); }
    if (ui.elemKnob) ui.elemKnob.set(Z);
    if (changed) { if (atomsView) atomsView.invalidate(); hNote(); if (getHamiltonian().id === 'atom') switchHamiltonian('atom'); else schedule(TIER.PRESENT); }
    return Z;
  }
  /** FILL THE VALENCE: the outermost occupied shell of the atom in force, every m of it equally and in phase */
  function fillValence() {
    if (getHamiltonian().id !== 'atom') { switchHamiltonian('atom'); if (ui.hamSeg) ui.hamSeg.set('atom'); }
    const cfg = configOf(HAMILTONIANS.atom.Z), sh = cfg[cfg.length - 1], amp = 1 / Math.sqrt(2 * sh.l + 1);
    reg.clear();
    for (let m = -sh.l; m <= sh.l; m++) reg.set(stateOf(sh.n, sh.l, m).index, amp, 0, clock.t);
    touchState(); schedule(TIER.REBUILD);
    const msg = `${HAMILTONIANS.atom.short} ${sh.n}${'spdfgh'[sh.l]} · ${2 * sh.l + 1} label${sh.l ? 's' : ''}, equal and in phase`;
    wState.setStatus(msg, 'live'); if (wAtoms) wAtoms.setStatus(msg, 'live');
    return { n: sh.n, l: sh.l, labels: 2 * sh.l + 1 };
  }

  rack.appendChild(wPal.root); rack.appendChild(wObs.root); rack.appendChild(wStyle.root); rack.appendChild(wCam.root); rack.appendChild(wClip.root);   // Josh's order
  rack.appendChild(ui.set.root);
  /* the ABOUT face lives in the NOTEBOOK glass now (wave 30) */
  /*  ui.about.body.innerHTML = '<div class="about">'
    + '<p><b>λWAVES</b> is a hydrogen shadow lab. The <b>register</b> holds the 91 labels |nlm⟩ with n ≤ 6 and evolves them <b>exactly</b>: c(t) = e<sup>−iEt</sup> c(0), with the same 91 labels re-read as an oscillator, a spherical box or an ion by exact scaling. Everything that reads the register — the classical shadow, the two rotors, the nodal census, the Kepler orbit, the calculus, the spectrum — is a theorem about that state. The <b>field</b> on the stage is the register\'s <b>numerical shadow</b>: ψ sampled on a 96³ grid and ray-marched, an estimate whose quality never touches the state.</p>'
    + '<p><b>Labels.</b> EXACT · NUMERICAL · VARIATIONAL · DESIGN CHOICE · TOY — every window says which it is. The mathematics behind the frontier windows is in the print <i>Beyond the Frontier</i> and its grammar rounds; the build log is <a href="/REPORT.md" target="_blank" rel="noopener">REPORT.md</a>.</p>'
    + '<p><b>Version.</b> pre-alpha-1 and the waves after it (5–27), uncommitted until the next freeze.</p>'
    + '<p><b>Made by</b> Josh Hosain with Claude Fable 5.1 (the builder), Claude Opus 5 (the audits) and Sol (the rival rounds), September 2026.</p>'
    + '<p><b>Type.</b> Spinwerad by gluk (SIL OFL 1.1) for the mark; Roboto (SIL OFL 1.1) for the interface. Licences ship in <code>lab/fonts/</code>.</p>'
    + '<p><b>Keys.</b> Space play · H hide · B rack · T transport · N notes · TAB next window · C style · V observable · P palette · ctrl+R reseed — all rebindable in SETTINGS.</p>'
    + '</div>';
  */

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
  const kepler = createKepler(dom.kepler);
  {
    const rk = wOrb.row('tight');
    rk.appendChild(sw({ label: 'KEPLER ORBIT', value: false, title: 'draw the classical orbit each shell carries — from the exact ⟨L⟩ and ⟨K⟩ — over the cloud', onChange: (v) => { kepler.setOn(v); schedule(TIER.PRESENT); } }).root);
    el('div', 'note', wOrb.body).innerHTML = '<b>KEPLER ORBIT.</b> The two sphere points ARE a classical orbit: the shell sets a = n², the angle between n₊ and n₋ is the eccentricity, their sum is the angular momentum, and ⟨K⟩ points to the perihelion. It is drawn over the cloud with the perihelion dotted and the classical <b>time-averaged position</b> crossed — which equals the quantum ⟨x⟩ = −(3n/2)⟨K⟩ (Pauli\'s replacement, exact for every shell state) — an identity by construction once a = n² and e = |⟨K⟩|/n are read off the state. The ellipse carries the state\'s energy and eccentricity but NOT its angular momentum: its own L = n√(1−e²) exceeds |⟨L⟩| always (K² + L² ≤ n²−1), and the label prints both. A dashed orbit means the shell is not coherent; below coherence ½ none is drawn (Round 11 §3).';
  }

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
  const qcd = createQCD(wQCD.body, { repaint() { schedule(TIER.PRESENT); }, onParams(kind, pot, p) { if (HAMILTONIANS.cornell.configure(kind, p, pot) && getHamiltonian().id === 'cornell') switchHamiltonian('cornell'); } });

  // MOLECULE — H₂⁺ in the 1s LCAO basis: the field is handed to two protons and one electron
  const wMol = device({ id: 'molecule', eyebrow: 'MOLECULE', title: 'H₂⁺ · LCAO · TUNNELLING', status: 'exact integrals · variational · classical nuclei · Pulay bound' });
  rack.appendChild(wMol.root);
  let moPanel = null;                                                  // W-MO: the general basis block, built just below
  const molecule = createMolecule(wMol.body, { repaint(rebuild) { schedule(rebuild ? TIER.REBUILD : TIER.PRESENT); }, setOn(v) { moleculeMode(v); },
    onR(v, sync) { if (moPanel) moPanel.setR(v, sync); } });           // one R for both blocks: the knob and the API move the force line too
  moPanel = createMOPanel(wMol.body, { repaint(rebuild) { schedule(rebuild ? TIER.REBUILD : TIER.PRESENT); } });
  function moleculeMode(v) {
    for (const w of [wState, wSpec, wSh, wOrb, wVor, wDyn, wSlice, wLad, wCalc]) if (w) w.root.hidden = !!v;   // CALCULUS reads the atomic register: it stands down too (Round 11 §10b)
    if (v && space === 'p') { space = 'x'; if (ui.spaceSeg) ui.spaceSeg.set('x'); }
    if (!v) switchHamiltonian(getHamiltonian().id);                  // restore the atom's own hiding rules
    refSnapshot = null; pendingRef = null;
    schedule(TIER.REBUILD);
  }

  // HELIUM — two electrons, Hylleraas: the field becomes the conditional cloud of electron 2
  const wHe = device({ id: 'helium', eyebrow: 'HELIUM', title: 'TWO ELECTRONS · HYLLERAAS · CORRELATION', status: 'exact integrals · variational' });
  rack.appendChild(wHe.root);
  const helium = createHelium(wHe.body, { repaint(rebuild) { schedule(rebuild ? TIER.REBUILD : TIER.PRESENT); }, setOn(v) { if (v && molecule.on) molecule.setOn(false); moleculeMode(v); } });

  // H₂ — two atoms, Heitler–London: the curves, the collision, the one-electron density
  const wH2 = device({ id: 'h2', eyebrow: 'H₂', title: 'HEITLER–LONDON · THE BOND · THE COLLISION', status: 'exact integrals · variational · classical nuclei' });
  rack.appendChild(wH2.root);
  const h2 = createH2(wH2.body, { repaint(rebuild) { schedule(rebuild ? TIER.REBUILD : TIER.PRESENT); }, setOn(v) { if (v) { if (molecule.on) molecule.setOn(false); if (helium.on) helium.setOn(false); } moleculeMode(v); }, now: () => clock.t });

  // CALCULUS — the stats, derived live, with their laws and residuals
  const wCalc = device({ id: 'calculus', eyebrow: 'CALCULUS', title: 'THE STATS · DERIVED · EHRENFEST LIVE', status: 'exact within the register' });
  rack.appendChild(wCalc.root);
  const calculus = createCalculus(wCalc.body, {});

  // METERS
  const wMet = device({ id: 'meters', eyebrow: 'METERS', title: 'INVARIANTS · CLOCKS · STATUS', status: '' });
  rack.appendChild(wMet.root);
  const meters = createMeters(wMet.body);

  {
    const rp = wMet.row('tight');
    ui.perfSeg = seg({ label: 'PERFORMANCE', value: 'full', options: [
      { id: 'full', label: 'FULL', title: 'every window updates every frame' },
      { id: '120', label: '120 Hz', title: 'the CPU windows (spectrum, shadow, orbit, dynamics, slice, meters) update every 4th frame; the FIELD and the overlays still present every frame' }],
      onChange: (v) => setPerfMode(v) });
    rp.appendChild(ui.perfSeg.root);
    ui.govRo = readout({ label: 'GOVERNOR  state · median · grid', value: 'nominal', cls: 'wide', sub: 'budget 28 ms over the last 60 frames' }); rp.appendChild(ui.govRo.root);
    el('div', 'note', wMet.body).innerHTML = '<b>FRAME PROFILE</b> is an exponential average of what each stage costs per frame, in milliseconds, measured on this machine and this browser. The display refresh rate caps what the browser will deliver (Firefox follows the compositor; a 60 Hz monitor gives 60 Hz whatever the code does). <b>120 Hz</b> mode moves the CPU windows to every 4th frame so the field can present at the full rate; the physics clock and the field cadence are untouched (§12: four clocks).';
  }
  // LADDER — the Rydberg revival as a spectral instrument (print, Thread A); its own register, no field
  const wLad = device({ id: 'ladder', eyebrow: 'LADDER', title: 'RYDBERG REVIVAL · SPECTRAL', status: 'own register · no field' });
  rack.appendChild(wLad.root);
  const ladder = createLadder(wLad.body);

  // ATOMS — the periodic table as one central field (Xα(2/3) + the Latter tail, solved live); a niche window: it ships CLOSED
  const wAtoms = device({ id: 'atoms', eyebrow: 'ATOMS', title: 'THE PERIODIC TABLE · Xα · CENTRAL FIELD', status: 'numerical · SCF + Richardson' });
  rack.appendChild(wAtoms.root); wAtoms.root.classList.add('closed');            // reopened from the + at the top of the rack
  const atomsView = createAtoms(wAtoms.body, {
    Z: () => HAMILTONIANS.atom.Z,
    step: (d) => setElement(HAMILTONIANS.atom.Z + d),
    fill: () => fillValence(),
    active: () => getHamiltonian().id === 'atom',
  });

  // ELECTROSTATICS — the classical field of the register's own charge, in closed form; a niche window: it ships CLOSED
  const wFld = device({ id: 'field', eyebrow: 'ELECTROSTATICS', title: 'POTENTIAL · FIELD · CURRENT · THE CLASSICAL FIELD OF ρ', status: 'exact · closed form · reads c(t)' });
  rack.appendChild(wFld.root); wFld.root.classList.add('closed');                // reopened from the + at the top of the rack
  ui.fldWin = wFld;
  const fieldlines = createFieldLines(document.getElementById('fieldlines'), {
    onStats: (s) => paintField(s),
    onControls: (c) => { if (ui.fldOv) ui.fldOv.set(c.overlay); if (ui.fldLines) ui.fldLines.set(c.lines); if (ui.fldSrc) ui.fldSrc.set(c.source); },
  });
  {
    const rf = wFld.row('tight');
    ui.fldOv = seg({ label: 'OVERLAY  ·  facing the camera', value: 'off', options: [
      { id: 'off', label: 'OFF', title: 'no lines on the stage — the readouts stay live' },
      { id: 'phi', label: 'Φ', title: 'equipotentials of the total potential, log-spaced between Φ(0.9·half) and Φ(0.25 a₀)' },
      { id: 'E', label: 'E', title: 'field lines of E = −∇Φ, seeded on a small circle round the nucleus (they end on the electron density: the atom is neutral)' },
      { id: 'j', label: 'j', title: 'streamlines of the probability current j = Im(ψ*∇ψ) — zero for every real orbital' }],
      onChange: (v) => { fieldlines.setOverlay(v); schedule(TIER.PRESENT); } });
    rf.appendChild(ui.fldOv.root);
    ui.fldLines = knob({ label: 'LINES', min: 4, max: 24, value: 10, step: 1, fmt: (v) => Math.round(v) + (fieldlines.overlay === 'phi' ? ' levels' : ' seeds'),
      onInput: (v) => { fieldlines.setLines(v); schedule(TIER.PRESENT); } });
    rf.appendChild(ui.fldLines.root);
    ui.fldSrc = seg({ label: 'SOURCE', value: 'total', options: [
      { id: 'total', label: 'ρ + nucleus', title: 'Φ = Z/r + Φ_e and E = −∇Φ: the whole atom, monopole cancelled' },
      { id: 'rho', label: 'ρ only', title: 'the electron cloud alone — Φ_e, and E with the nucleus’s exact Z r̂/r² removed (j is the electron’s either way)' }],
      onChange: (v) => { fieldlines.setSource(v); schedule(TIER.PRESENT); } });
    rf.appendChild(ui.fldSrc.root);
    const rr = wFld.row('tight');
    ui.fldQ = readout({ label: 'MONOPOLE  ∫ρ  ·  ‖c‖²', value: '—', sub: 'the L = 0 slot in closed form, against the norm it must equal' });
    ui.fldPhi = readout({ label: 'Φ_e(0)  at the nucleus', value: '—', sub: 'a.u. · volts (27.211386 V per a.u.)' });
    ui.fldE = readout({ label: '|E|  at (0, 0, 1) a₀', value: '—', sub: 'a.u. · V/m (5.1422e11 V/m per a.u.)' });
    ui.fldB = readout({ label: 'B  nucleus  ·  1 a₀ on the axis', value: '—', cls: 'wide', sub: 'tesla — a quadrature, and off the axis it is not certified: never drawn' });
    for (const r of [ui.fldQ, ui.fldPhi, ui.fldE, ui.fldB]) rr.appendChild(r.root);
    el('div', 'note', wFld.body).innerHTML = '<b>EXACT ANALYTIC.</b> ρ = |ψ|² is expanded on Y<sub>LM</sub> by exact Gaunt coefficients and <b>Poisson is solved in closed form</b>, slot by slot (finite polynomials × e<sup>−βr</sup> through the incomplete Γ functions), so Φ = Z/r + Φ<sub>e</sub>, <b>E = −∇Φ</b> and the probability current <b>j = Im(ψ*∇ψ)</b> are analytic — this window only samples them. <b>NUMERICAL:</b> the equipotentials are marching squares with a secant polish, the field lines RK4 on the unit tangent of the in-plane projection, and <b>B</b> is a quadrature. <b>B off the axis is NOT certified, so it is never drawn</b> — only the two axis numbers are printed (2p₊1: −0.521534 T at the nucleus, −0.429533 T at 1 a₀). The plane is cut through the nucleus facing the camera when the slice is built and then only re-projected, so orbiting shows you that same slice from a new angle. The closed form is <b>hydrogenic</b>: under any other Hamiltonian this window stands down.';
  }
  /** the ELECTROSTATICS readouts, from the view's own stats block (fired after every rebuild) */
  function paintField(s) {
    if (!ui.fldQ) return;
    if (!s.ok) { for (const r of [ui.fldQ, ui.fldPhi, ui.fldE, ui.fldB]) r.set('—', 'warn'); ui.fldQ.setSub(s.note || 'the L = 0 slot in closed form, against the norm it must equal'); return; }
    ui.fldQ.set(`${s.Q.toFixed(6)}  ·  ${s.norm2.toFixed(6)}`, Math.abs(s.Q - s.norm2) < 1e-6 ? 'ok' : 'warn');
    ui.fldQ.setSub(`${s.slots} multipole slots, L ≤ ${s.Lmax}${s.note ? ' · ' + s.note : ''} · built in ${s.buildMs.toFixed(1)} ms`);
    ui.fldPhi.set(`${s.phiE0.toFixed(6)} a.u.  ·  ${s.phiE0V.toFixed(3)} V`);
    ui.fldE.set(`${s.Emag.toFixed(6)} a.u.  ·  ${s.EmagV.toExponential(3)} V/m`);
    ui.fldB.set(`${s.Bz.toFixed(6)} T at the nucleus  ·  ${s.Bz1.toFixed(6)} T`, Math.abs(s.Bz) > 1e-9 ? 'ok' : '');
    ui.fldB.setSub(`|B| ${s.Bmag.toExponential(3)} T · ${Math.abs(s.Bmag) < 1e-9 ? 'a real orbital carries no current' : 'the orbital hyperfine field'}${s.Bstale ? ' · at an earlier t (B is a quadrature: it runs at 1 Hz while playing)' : ''}`);
  }
  /** is the window entitled to draw?  live, open, hydrogenic, position space, and no molecule holding the field */
  function fieldOn() {
    return live(wFld) && !wFld.root.classList.contains('closed') && space === 'x' && getHamiltonian().id === 'hydrogen' && !sturm.P
      && !(molecule && molecule.on) && !(helium && helium.on) && !(h2 && h2.on);
  }

  // WIGNER — the one joint object of position and momentum, cut through the axis; a niche window: it ships CLOSED
  const wWig = device({ id: 'wigner', eyebrow: 'WIGNER', title: 'PHASE SPACE · THE (z, p_z) SLICE', status: 'numerical · a slice, not a marginal' });
  rack.appendChild(wWig.root); wWig.root.classList.add('closed');                // reopened from the + at the top of the rack
  const wignerView = createWigner(wWig.body, { repaint() { schedule(TIER.PRESENT); } });

  // RADIATION — what the prepared pair would radiate, and the shape of its far field; also CLOSED
  const wRad = device({ id: 'radiation', eyebrow: 'RADIATION', title: 'THE DIPOLE · SPONTANEOUS EMISSION · THE FAR FIELD', status: 'exact matrix elements · classical far field' });
  rack.appendChild(wRad.root); wRad.root.classList.add('closed');
  const radiationView = createRadiation(wRad.body, { repaint() { schedule(TIER.PRESENT); }, ab: () => __LW_hooks.ab });
  const WIG_OK = 'numerical · a slice, not a marginal', RAD_OK = 'exact matrix elements · classical far field';
  Object.assign(READERS, { spectrum: wSpec, shadow: wSh, orbit: wOrb, dynamics: wDyn, slice: wSlice, qcd: wQCD, atoms: wAtoms, wigner: wWig, radiation: wRad, calculus: wCalc });   // the windows the READER LAW may park (never MOLECULE — it steps nuclei — nor METERS, which shows the governor)
  /** the guard the two hydrogenic readers share: hydrogen at Z = 1, no Sturmian scale, no other model holding the
      field.  Both windows integrate the SHIPPED closed-form radials, so anything else would be two operators in one
      number; they say which one stood them down, in the wave-39 voice. */
  function hydroReader() {
    const H = getHamiltonian();
    if (sturm.P) return { on: false, status: 'hydrogen only: no closed form for the scaled radials',
      why: 'the STURMIAN scale is on: the scaled radials are not the ones this window integrates — switch SCALE back to HYDROGEN' };
    if (H.id !== 'hydrogen') return { on: false, status: 'hydrogenic register only', why: 'hydrogenic register only — the operator in force is ' + H.label };
    if (getZ() !== 1) return { on: false, status: 'hydrogenic register only (Z = 1)', why: 'the ion at Z = ' + getZ() + ' scales every radial: this window reads the Z = 1 closed forms' };
    if ((molecule && molecule.on) || (helium && helium.on) || (h2 && h2.on)) return { on: false, status: 'hydrogenic register only', why: 'another model holds the field — this window reads the hydrogenic register' };
    return { on: true, status: null, why: '' };
  }

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
    /* ── THE CLOCK's law: when does this density repeat?  T = 2π / gcd{|E_a − E_b|} over the populated labels (EXACT where the
       differences are commensurate: hydrogen and its ions, the oscillator; a near-recurrence with its error otherwise) ── */
    ui.periodRo = readout({ label: 'REPEATS every', value: '—', cls: 'period', sub: 'exact period of the density, from the energies in force' });
    T.appendChild(ui.periodRo.root);
    const jmp = el('button', 'tbtn jump', T, '⟳'); jmp.type = 'button'; jmp.title = 'jump to the next exact repeat of the density';
    jmp.addEventListener('click', () => { const P = periodNow(true); if (P && P.T > 0) { const t = clock.t, next = t + P.T - (((t % P.T) + P.T) % P.T); clock.scrub(next); shadowView.clearTrail(); schedule(TIER.EVOLVE); } });
    let periodVersion = -1, lastPeriod = null, periodCostMs = 0, periodSettling = false, periodPending = null;
    /* the scan's key, as numbers compared in place (wave 45: it was a string built on every frame) */
    const pk = { v: -2, fz: 0, bz: 0, h: '', mix: false, s: -1 };
    const keyNow = () => ({ v: reg.version, fz: reg.field.Fz, bz: reg.field.Bz, h: getHamiltonian().id, mix: !!reg.transition, s: sturm.P ? sturm.lambda : -1 });
    const sameKey = (a, b) => a.v === b.v && a.fz === b.fz && a.bz === b.bz && a.h === b.h && a.mix === b.mix && a.s === b.s;
    const periodFresh = () => pk.v === reg.version && pk.fz === reg.field.Fz && pk.bz === reg.field.Bz && pk.h === getHamiltonian().id && pk.mix === !!reg.transition && pk.s === (sturm.P ? sturm.lambda : -1);
    /**
     * THE SCAN IS NOT FREE (wave 44).  densityPeriod's near-recurrence scan is O(pairs × 2·10⁶) and it is reached on
     * every NEW register version — which the comment below the readout used to call "cheap, cached on the register's
     * version", true only while a state has one or two beats.  Under STURMIAN a generic λ occupies eleven eigenvalues,
     * fifty-five pairs, and one scan measured 594 ms; the λ knob calls setSturmian on every pointermove, so a drag was
     * a train of 0.6 s stalls (34 frames of 74 over 100 ms, the worst 650).  So a scan that has ALREADY proved
     * expensive is held off while a pointer is down — the same law history.js applies to its commits — and runs once
     * when the gesture ends.  `force` is the road every non-frame reader takes (LW.period, the ⟳ jump, the digest), so
     * no proof and no button ever sees a stale answer: only the per-frame readout waits, and it says that it is.
     */
    function periodNow(force = false) {
      if (periodFresh()) { periodSettling = false; return lastPeriod; }
      if (!force && lastPeriod && periodCostMs > 8 && pointerHeld) { periodSettling = true; return lastPeriod; }
      const key = keyNow();
      if (reg.field.Fz !== 0) { Object.assign(pk, key); periodVersion = reg.version; periodCostMs = 0; periodSettling = false; lastPeriod = { exact: false, stark: true, T: 0 }; return lastPeriod; }
      if (reg.transition) { Object.assign(pk, key); periodVersion = reg.version; periodCostMs = 0; periodSettling = false; lastPeriod = { exact: false, mix: true, T: 0 }; return lastPeriod; }
      const Es = sturm.P ? occupiedEigen() : reg.populated().map((a) => reg.Ediag(a));   // W-STURMIAN: the OCCUPIED eigenvalues (populations > 1e-6), never the labels' ⟨H⟩
      if (!force && scan.ok) {
        /* THE FRAME PATH (wave 45): the scan runs in the maths worker and the readout says it is settling until the
           answer lands — a BOX bow populates 56 incommensurate well energies and the scan measured 1.2 s on the first
           frame after the pointer lifted.  Forced readers (LW.period, ⟳, the digest) still scan here, synchronously. */
        if (!periodPending || !sameKey(periodPending, key)) {
          periodPending = key;
          scan.call({ op: 'period', energies: Array.from(Es), horizon: 2e4 }).then((r) => {
            if (!r || r.error) { periodPending = null; return; }
            if (periodPending !== key) return;                              // a later state: this answer is stale
            const P = Object.assign({}, r); delete P.id; delete P.op;
            lastPeriod = P; Object.assign(pk, key); periodVersion = key.v; periodCostMs = 0; periodSettling = false; periodPending = null;
            paintPeriod(); schedule(TIER.PRESENT);                           // paused, no frame would repaint the readout
          });
        }
        periodSettling = true; return lastPeriod;
      }
      const wasSettling = periodSettling;
      Object.assign(pk, key); periodVersion = reg.version; periodSettling = false; periodPending = null;
      const t0 = performance.now();
      lastPeriod = densityPeriod(Es, { horizon: 2e4 });
      periodCostMs = performance.now() - t0;
      if (force && wasSettling) paintPeriod();                                 // the readout said "settling": it has the answer now
      return lastPeriod;
    }
    function periodText() {
      const P = periodNow(); if (!P) return ['—', '', ''];
      if (periodSettling) return ['…', 'settling — the recurrence scan runs off the frame, or when the gesture ends', ''];
      const src = sturm.P ? ' · from the occupied eigenvalues of S⁻¹H' : '';
      if (sturm.P && !P.exact && P.T > 0) {                          // W-STURMIAN: a "recurrence" shorter than one turn of the fastest beat is no recurrence (every phase is still small)
        const Es = occupiedEigen(); let dmax = 0; for (let i = 0; i < Es.length; i++) for (let j = i + 1; j < Es.length; j++) dmax = Math.max(dmax, Math.abs(Es[i] - Es[j]));
        if (dmax > 0 && P.T < 2 * Math.PI / dmax) return ['—', 'NO EXACT PERIOD (' + P.count + ' incommensurate eigenvalues of S⁻¹H) · no near-recurrence within the horizon: the best found is shorter than one turn of the fastest beat', 'warn'];
      }
      if (P.stark) return ['— (Stark)', 'no exact period under a static field: the Stark energies are not commensurate', 'warn'];
      if (P.mix) return ['— (transition)', 'the A ↔ B mix has its own clock: the Rabi period', 'warn'];
      if (P.stationary) return ['stationary', 'one energy: the density never changes', ''];
      if (P.exact) { const lap = Math.floor(clock.t / P.T), ph = clock.t - lap * P.T; return [fmtPeriod(P.T), 'EXACT · ' + P.count + ' energies, gcd ' + P.g.toPrecision(4) + ' Eh · lap ' + lap + ' · ' + (100 * ph / P.T).toFixed(0) + '% through' + src, 'ok']; }
      return ['≈ ' + fmtPeriod(P.T), 'NO EXACT PERIOD (incommensurate energies) · nearest recurrence within ' + (100 * P.err).toFixed(1) + '% of a beat' + src, 'warn'];
    }
    /** paint the REPEATS readout now — a forced scan (LW.period, ⟳, the digest) and the worker's answer both call it, so a paused
        instrument shows the answer the moment it exists rather than on a frame it will not run (wave 45) */
    function paintPeriod() { if (!ui.periodRo) return; const [v, sub, cls] = periodText(); ui.periodRo.set(v, cls); ui.periodRo.setSub(sub); }
    __LW_hooks.period = () => periodNow(true);          // every reader outside the frame loop forces the scan: no proof and no digest ever sees a settling answer
    const laps = () => Math.floor(clock.t / clock.window);
    const stepDt = () => clock.window / 48;
    play.addEventListener('click', () => togglePlay());
    rst.addEventListener('click', () => { clock.reset(); shadowView.clearTrail(); schedule(TIER.EVOLVE); });
    sm.addEventListener('click', () => { clock.step(-stepDt()); schedule(TIER.EVOLVE); });
    sp.addEventListener('click', () => { clock.step(stepDt()); schedule(TIER.EVOLVE); });
    let troWall = 0, periodWall = 0, playShown = null;
    function update() {
      const on = clock.playing, now = performance.now();
      if (playShown !== on) { playShown = on; play.textContent = on ? '❚❚' : '▶'; play.classList.toggle('on', on); }
      /* KEEP FRAMES (wave 45): on, the playhead follows every frame as it always did; off — the default — the bar is
         disabled and never repainted, and the t readout runs at 5 Hz while playing (every paused frame, as before) */
      if (keep.frames) {
        if (!ui.scrub.dragging()) ui.scrub.set(((clock.t % clock.window) + clock.window) % clock.window / clock.window);
        tro.set(clock.t.toFixed(2) + (laps() ? '  (' + laps() + ')' : ''), on ? 'live' : '');
      } else if (!on || now - troWall >= 200) { troWall = now; tro.set(clock.t.toFixed(2) + (laps() ? '  (' + laps() + ')' : ''), on ? 'live' : ''); }
      if (ui.periodRo && (!on || keep.frames || now - periodWall >= 200)) { periodWall = now; const [v, sub, cls] = periodText(); ui.periodRo.set(v, cls); ui.periodRo.setSub(sub); }   // periodNow() is cached on the register's version; the scan itself runs off the frame (wave 45) or waits out a live gesture (wave 44)
    }
    setKeepFrames(keep.frames);                                // the shipped default: the bar disabled
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
      const t2 = field.ok ? `NUMERICAL · FIELD ${field.resolution}³ · ±${Number.isInteger(domain.half) ? domain.half : domain.half.toFixed(2)} ${getHamiltonian().lengthUnit}${space === 'p' ? '⁻¹ · MOMENTUM' : ''} · f16` : 'NO FIELD · WebGPU unavailable';
      if (b2.lastChild.textContent !== t2) b2.lastChild.textContent = t2;
      b2.className = 'badge ' + (field.ok ? 'numerical' : 'bad');
      const warn = rs.masked ? `RENDERED ${rs.rendered}/${rs.populated} · ${(rs.coveredFraction * 100).toFixed(0)}% OF NORM · ${rs.masked} MUTED` : rs.truncated ? `TRUNCATED ${rs.rendered}/${rs.populated} · ${(rs.coveredFraction * 100).toFixed(0)}% OF NORM` : '';
      if (warn !== last) { last = warn; b3.hidden = !warn; b3.lastChild.textContent = warn; }
    }
    return { update };
  })();

  /* ── THE BOW: ctrl+drag draws it, release fires, releasing CTRL first cancels ── */
  let bow = null, bowPrevView = null;
  function bowStart(e) {
    const r = dom.canvas.getBoundingClientRect();
    bow = { x0: e.clientX - r.left, y0: e.clientY - r.top, x1: e.clientX - r.left, y1: e.clientY - r.top, k: 0, dir: [0, 0, 1] };
    bowPrevView = mat.view; mat.view = VIEW.phase; if (ui.viewSeg) ui.viewSeg.set('phase');
    try { if (e.pointerId !== undefined) dom.canvas.setPointerCapture(e.pointerId); } catch (_) {}
    hideHint(); kepler.setBow(bow); schedule(TIER.PRESENT);
  }
  function bowMove(e) {
    if (!bow) return;
    const r = dom.canvas.getBoundingClientRect();
    bow.x1 = e.clientX - r.left; bow.y1 = e.clientY - r.top;
    const dx = bow.x1 - bow.x0, dy = bow.y1 - bow.y0;
    bow.k = Math.min(3, Math.hypot(dx, dy) / 120);                    // 120 px of pull = 1 a.u. of momentum, capped at 3
    const B = cameraBasis(obs);
    const d = [-(dx * B.right[0] - dy * B.up[0]), -(dx * B.right[1] - dy * B.up[1]), -(dx * B.right[2] - dy * B.up[2])];   // a bow: the arrow flies opposite to the pull; screen y points down
    const n = Math.hypot(d[0], d[1], d[2]);
    bow.dir = n > 0 ? [d[0] / n, d[1] / n, d[2] / n] : [0, 0, 1];
    mat.boost.k = [bow.dir[0] * bow.k, bow.dir[1] * bow.k, bow.dir[2] * bow.k]; mat.boost.on = bow.k > 0;
    kepler.setBow(bow); schedule(TIER.PRESENT);
  }
  /* THE BOW LANDS ASYNCHRONOUSLY (wave 45).  The slap (kick.js) or the packet (well.js) is computed in the maths
     worker and lands when it answers — the pointer is free the moment the finger lifts (measured before: 127 ms on
     the first hydrogen bow, 191 ms + a 1.2 s frame on a BOX bow).  bowChain is the queue: two bows in flight land in
     order, on the state the first one left; LW.bow.landed resolves when the queue is empty.  The SLAP trigger, the K
     key and LAUNCH keep the synchronous road. */
  let bowChain = Promise.resolve(), bowInFlight = 0;
  function bowRelease() {
    if (!bow) return;
    const k = bow.k, dir = bow.dir, x0 = bow.x0, y0 = bow.y0; bowCancel();
    if (k <= 0.005) return;
    const job = getHamiltonian().id === 'well' ? () => launchPacketAsync(unproject(x0, y0), dir.map((v) => v * k), gasSigma(k)) : () => slapAlongAsync(k, dir);   // the GAS: a new packet where you pressed
    bowInFlight++; wState.setStatus('the bow is in flight…', 'live');
    bowChain = bowChain.then(job).catch((e) => { __e.push('BOW ' + (e && e.message || e)); }).then(() => { if (--bowInFlight === 0) wState.setStatus('changes c'); });
  }
  /** the BOX bow: wellPacket in the worker, the same numbers as launchPacket, landed on the clock's time when it answers */
  async function launchPacketAsync(x0, kvec, sigma) {
    if (gasAxial || !maths.ok) { launchPacket(x0, kvec, sigma); return; }
    const r = await maths.call({ op: 'packet', x0, k: kvec, sigma, radius: HAMILTONIANS.well.radius });
    if (!r || r.error) { launchPacket(x0, kvec, sigma); return; }
    if (getHamiltonian().id !== 'well' || gasAxial) return;                             // the box was left while the packet was in flight
    reg.clear(); for (let a = 0; a < 91; a++) if (r.re[a] || r.im[a]) reg.set(a, r.re[a], r.im[a], clock.t);
    lastLaunch = { x0, k: kvec, sigma, captured: r.captured };
    if (ui.gasRo) { ui.gasRo.set(`${(100 * r.captured).toFixed(1)}% held`, r.captured > 0.85 ? 'ok' : 'warn'); ui.gasRo.setSub(`σ = ${sigma.toFixed(2)} a₀ at (${x0.map((v) => v.toFixed(1)).join(', ')}) · |k| = ${Math.hypot(...kvec).toFixed(2)} · the box resolves ≈ a/6 = ${(HAMILTONIANS.well.radius / 6).toFixed(1)} a₀`); }
    touchState();
  }
  /** the hydrogen / oscillator bow: the slap on a snapshot of c(t) in the worker, set back at that time on landing —
      exact, the law being time-translation invariant; ATOM and QUARKONIUM (tabulated radials) keep the synchronous road */
  async function slapAlongAsync(k, dir) {
    const H = getHamiltonian();
    if (!maths.ok || !(H.id === 'hydrogen' || H.id === 'qho')) { slapAlong(k, dir); return; }
    if (!reg.populated().length) reg.set(0, 1, 0, clock.t);                              // an empty register: the bow conjures the ground state, then slaps it (Josh)
    const t0 = clock.t, v0 = reg.version, c = reg.at(t0), n0 = reg.norm2();
    const r = await maths.call({ op: 'kick', re: c.re, im: c.im, k, d: dir, ham: H.id, Z: getZ() }, [c.re.buffer, c.im.buffer]);
    if (!r || r.error) { slapAlong(k, dir); return; }
    if (reg.version !== v0 || getHamiltonian() !== H) { slapAlong(k, dir); return; }     // the state moved under the bow: slap what is there now, synchronously
    reg.setAnchorAt(r.re, r.im, t0);
    const n1 = reg.norm2(), esc = n0 > 0 ? 1 - n1 / n0 : 0;
    if (ui.kickRo) {
      ui.kickRo.set(`${(100 * esc).toFixed(2)}% · ${(r.p1 - r.p0).toFixed(4)}`, esc > 0.2 ? 'warn' : 'ok');
      ui.kickRo.setSub(`bow: k = ${k.toFixed(3)} along (${dir.map((v) => v.toFixed(2)).join(', ')}) · Ehrenfest would give ${k.toFixed(3)} · norm now ${Math.sqrt(n1).toFixed(4)}`);
    }
    touchState();
  }
  /* the point on the plane through the origin ⟂ the view direction that sits under a screen position */
  /* ── KEPLER AS A CONTROL SURFACE: the perihelion handle drives exact rotors on the state ── */
  function pointerRay(px, py) {
    const W = dom.canvas.clientWidth, H = dom.canvas.clientHeight, B = cameraBasis(obs), D = obs.dist * domain.half;
    const tanH = Math.tan((obs.fov || 0.6) / 2), aspect = W / H, u = 2 * px / W - 1, v = 1 - 2 * py / H;
    const cam = [B.dir[0] * D, B.dir[1] * D, B.dir[2] * D];
    const d = [B.fwd[0] + u * tanH * aspect * B.right[0] + v * tanH * B.up[0], B.fwd[1] + u * tanH * aspect * B.right[1] + v * tanH * B.up[1], B.fwd[2] + u * tanH * aspect * B.right[2] + v * tanH * B.up[2]];
    return { cam, d };
  }
  function orbitOfShell(n, re, im) {
    const c = re ? { re, im } : (reg.field.Fz !== 0 ? reg.at(clock.t) : { re: reg.re0, im: reg.im0 });
    const o = keplerOrbits(c.re, c.im, 0.01).find((x) => x.orbit.n === n); return o ? o.orbit : null;
  }
  /** a rotor about an arbitrary axis: carry the axis to z with spatial rotors, turn about z, carry it back */
  function rotorSeq(which, axisVec, angle) {
    const seq = rotorsToZ(axisVec), out = [];
    for (const r of seq) out.push({ which: 'both', axis: r.axis, angle: r.angle });
    out.push({ which, axis: 'z', angle });
    for (const r of [...seq].reverse()) out.push({ which: 'both', axis: r.axis, angle: -r.angle });
    return out;
  }
  const applySeq = (seq) => { for (const s of seq) reg.rotor({ ...s, t: clock.t }); };
  /** bring shell n's perihelion to the world point w (in its orbit plane): around by D(R) about L̂, in/out by e^{−iθ â·K} */
  function keplerDragToPoint(n, w) {
    const o = orbitOfShell(n); if (!o || o.isotropic) return false;
    const N = o.normal, wl = Math.hypot(w[0], w[1], w[2]); if (wl < 1e-6) return false;
    const uT = [w[0] / wl, w[1] / wl, w[2] / wl];
    const cr = [o.u[1] * uT[2] - o.u[2] * uT[1], o.u[2] * uT[0] - o.u[0] * uT[2], o.u[0] * uT[1] - o.u[1] * uT[0]];
    const phi = Math.atan2(cr[0] * N[0] + cr[1] * N[1] + cr[2] * N[2], o.u[0] * uT[0] + o.u[1] * uT[1] + o.u[2] * uT[2]);
    if (Math.abs(phi) > 1e-6) {
      applySeq(rotorSeq('both', N, phi));
      const chk = orbitOfShell(n);                                       // the rotor convention is checked, not assumed: if it turned the wrong way, turn back twice as far
      if (chk && !chk.isotropic && (chk.u[0] * uT[0] + chk.u[1] * uT[1] + chk.u[2] * uT[2]) < Math.cos(Math.abs(phi)) - 1e-3) applySeq(rotorSeq('both', N, -2 * phi));
    }
    const eT = Math.max(0, Math.min(0.96, 1 - wl / o.a));
    const o2 = orbitOfShell(n); if (!o2 || o2.isotropic) { touchState(); return true; }
    const ax = [N[1] * o2.u[2] - N[2] * o2.u[1], N[2] * o2.u[0] - N[0] * o2.u[2], N[0] * o2.u[1] - N[1] * o2.u[0]];   // N × û: in the plane, ⟂ the perihelion
    const c0 = reg.field.Fz !== 0 ? reg.at(clock.t) : { re: Float64Array.from(reg.re0), im: Float64Array.from(reg.im0) };
    const eAt = (th) => { const re = Float64Array.from(c0.re), im = Float64Array.from(c0.im); for (const s of rotorSeq('K', ax, th)) rotorOnCopy(re, im, s); const q = orbitOfShell(n, re, im); return q && !q.isotropic ? q.e : 0; };
    /* the angle: e(θ) is periodic and bounded (|L|² + |K|² is a shell invariant, so e ≤ √(L²+K²)/n) — scan the whole
       turn for the θ whose e is closest to the target, then refine; an out-of-reach target lands on the shell's maximum */
    let th = 0, best = Math.abs(o2.e - eT);
    for (let i = 1; i <= 64; i++) { const t = -Math.PI + 2 * Math.PI * i / 64, d = Math.abs(eAt(t) - eT); if (d < best - 1e-12) { best = d; th = t; } }
    let step = Math.PI / 64; for (let it = 0; it < 24; it++) { step *= 0.5; for (const t of [th - step, th + step]) { const d = Math.abs(eAt(t) - eT); if (d < best - 1e-12) { best = d; th = t; } } }
    if (Math.abs(th) > 1e-7) applySeq(rotorSeq('K', ax, th));
    const o3 = orbitOfShell(n);                                          // the rotor may have set K along −û: half a turn about L̂ (spatial, exact) puts the perihelion where the pointer is
    if (o3 && !o3.isotropic && o3.e > 1e-3 && (o3.u[0] * uT[0] + o3.u[1] * uT[1] + o3.u[2] * uT[2]) < 0) applySeq(rotorSeq('both', N, Math.PI));
    touchState(); return true;
  }
  function keplerDragTo(n, px, py) {
    const o = orbitOfShell(n); if (!o || o.isotropic) return false;
    const { cam, d } = pointerRay(px, py), N = o.normal;
    const dn = d[0] * N[0] + d[1] * N[1] + d[2] * N[2]; if (Math.abs(dn) < 1e-6) return false;
    const lam = -(cam[0] * N[0] + cam[1] * N[1] + cam[2] * N[2]) / dn; if (lam <= 0) return false;
    return keplerDragToPoint(n, [cam[0] + lam * d[0], cam[1] + lam * d[1], cam[2] + lam * d[2]]);
  }
  let kdrag = null;
  function unproject(px, py) {
    const W = dom.canvas.clientWidth, H = dom.canvas.clientHeight, B = cameraBasis(obs), D = obs.dist * domain.half;
    const tanH = Math.tan((obs.fov || 0.6) / 2), aspect = W / H, u = 2 * px / W - 1, v = 1 - 2 * py / H;
    const cam = [B.dir[0] * D, B.dir[1] * D, B.dir[2] * D];
    const d = [B.fwd[0] + u * tanH * aspect * B.right[0] + v * tanH * B.up[0], B.fwd[1] + u * tanH * aspect * B.right[1] + v * tanH * B.up[1], B.fwd[2] + u * tanH * aspect * B.right[2] + v * tanH * B.up[2]];
    const lam = -(cam[0] * B.fwd[0] + cam[1] * B.fwd[1] + cam[2] * B.fwd[2]) / (d[0] * B.fwd[0] + d[1] * B.fwd[1] + d[2] * B.fwd[2]);
    const p = [cam[0] + lam * d[0], cam[1] + lam * d[1], cam[2] + lam * d[2]];
    const a = HAMILTONIANS.well.radius, r = Math.hypot(...p), cap = 0.75 * a;
    return r > cap ? p.map((c) => c * cap / r) : p;                 // keep the launch point well inside the wall
  }
  /* a DESIGN CHOICE, labelled: a harder pull launches a tighter packet (a boost alone never changes a width) */
  let gasWidth = 1.8, gasAxial = false;
  const gas = createGas(HAMILTONIANS.well.radius);
  const gasSigma = (k) => Math.max(0.5, Math.min(3, gasWidth * (1 - 0.18 * Math.min(k, 3))));
  function launchPacket(x0, kvec, sigma) {
    if (gasAxial) {                                                      // the AXIAL register: along z, on the axis
      const A = HAMILTONIANS.well.radius, z0 = Math.max(-0.8 * A, Math.min(0.8 * A, x0[2] || -A / 2)), kz = kvec[2] !== 0 ? kvec[2] : Math.hypot(...kvec);
      const G = gas.launch(z0, kz, sigma, clock.t);
      reg.clear(); refSnapshot = null;
      lastLaunch = { x0: [0, 0, z0], k: [0, 0, kz], sigma, captured: G.captured, axial: true };
      if (ui.gasRo) { ui.gasRo.set(`${(100 * G.captured).toFixed(1)}% held · axial`, G.captured > 0.85 ? 'ok' : 'warn'); ui.gasRo.setSub(`σ = ${sigma.toFixed(2)} a₀ at z = ${z0.toFixed(1)} · k = ${kz.toFixed(2)} along z · ${G.modes} modes (m = 0, l ≤ 15)`); }
      touchState(); return;
    }
    const P = wellPacket(x0, kvec, sigma);
    reg.clear(); for (let a = 0; a < 91; a++) if (P.re[a] || P.im[a]) reg.set(a, P.re[a], P.im[a], clock.t);
    lastLaunch = { x0, k: kvec, sigma, captured: P.captured };
    if (ui.gasRo) { ui.gasRo.set(`${(100 * P.captured).toFixed(1)}% held`, P.captured > 0.85 ? 'ok' : 'warn'); ui.gasRo.setSub(`σ = ${sigma.toFixed(2)} a₀ at (${x0.map((v) => v.toFixed(1)).join(', ')}) · |k| = ${Math.hypot(...kvec).toFixed(2)} · the box resolves ≈ a/6 = ${(HAMILTONIANS.well.radius / 6).toFixed(1)} a₀`); }
    touchState();
  }
  let lastLaunch = null;
  /** entering the BOX launches the gas at once (Josh: "let that thang bounce") */
  function enterBox() {
    const ax = keyState.axis, a = HAMILTONIANS.well.radius, d = { x: [1, 0, 0], y: [0, 1, 0], z: [0, 0, 1] }[ax], k = ui.gasSpeed && ui.gasSpeed.get ? ui.gasSpeed.get() : 0.8;
    launchPacket(d.map((v) => -v * a / 2), d.map((v) => v * k), gasSigma(k));
    if (!clock.playing) { clock.play(performance.now() / 1000); schedule(TIER.EVOLVE); }
  }
  /** the oscillator's exact rigid packet: ground state, slapped */
  function coherentBounce() {
    if (getHamiltonian().id !== 'qho') { setHamiltonian('qho'); switchHamiltonian('qho'); if (ui.hamSeg) ui.hamSeg.set('qho'); }
    const ax = keyState.axis, d = { x: [1, 0, 0], y: [0, 1, 0], z: [0, 0, 1] }[ax], k = ui.gasSpeed && ui.gasSpeed.get ? ui.gasSpeed.get() : 0.8;
    reg.clear(); reg.set(0, 1, 0, clock.t);            // label 0 = 1s = the oscillator's ground state
    reg.kickAlong(k, d, clock.t);
    lastLaunch = { x0: [0, 0, 0], k: d.map((v) => v * k), sigma: 1 / Math.SQRT2, captured: reg.norm2(), coherent: true };
    if (ui.gasRo) { ui.gasRo.set(`coherent · |α|² = ${(k * k / 2).toFixed(2)}`, 'ok'); ui.gasRo.setSub(`⟨z⟩ = ${k.toFixed(2)} sin t · rigid · period 2π · ${(100 * reg.norm2()).toFixed(2)}% in N ≤ 10`); }
    touchState();
    if (!clock.playing) { clock.play(performance.now() / 1000); schedule(TIER.EVOLVE); }
  }
  function bowCancel() {
    bow = null; mat.boost.on = false; kepler.setBow(null); keplerDirty = true;   // one clearing draw of the KEPLER canvas after the arrow
    if (bowPrevView !== null) { mat.view = bowPrevView; if (ui.viewSeg) ui.viewSeg.set(VIEW_NAMES[bowPrevView]); bowPrevView = null; }
    schedule(TIER.PRESENT);
  }
  function pAlongDir(dir) {
    const c = reg.at(clock.t), re = Float64Array.from(c.re), im = Float64Array.from(c.im);
    for (const r of rotorsToZ(dir)) rotorOnCopy(re, im, { which: 'both', axis: r.axis, angle: r.angle });
    return momentumZ(re, im);
  }
  function slapAlong(k, dir) {
    if (!reg.populated().length && getHamiltonian().id !== 'well') { reg.set(0, 1, 0, clock.t); }   // an empty box: the bow (or SLAP) conjures the ground state, then slaps it (Josh)
    const n0 = reg.norm2(), p0 = pAlongDir(dir);
    reg.kickAlong(k, dir, clock.t);
    const n1 = reg.norm2(), p1 = pAlongDir(dir), esc = n0 > 0 ? 1 - n1 / n0 : 0;
    if (ui.kickRo) {
      ui.kickRo.set(`${(100 * esc).toFixed(2)}% · ${(p1 - p0).toFixed(4)}`, esc > 0.2 ? 'warn' : 'ok');
      ui.kickRo.setSub(`bow: k = ${k.toFixed(3)} along (${dir.map((v) => v.toFixed(2)).join(', ')}) · Ehrenfest would give ${k.toFixed(3)} · norm now ${Math.sqrt(n1).toFixed(4)}`);
    }
    touchState();
  }
  window.addEventListener('keyup', (e) => { if (e.key === 'Control' && bow) bowCancel(); });

  /* ── THE FLOATING RACK: hide button, hover-reveal, draggable cards, hint icons, the transport's dock ── */
  const rackL = document.getElementById('rackL');
  for (const rk of [rack, rackL]) if (rk) rk.addEventListener('scroll', () => { gov.scroll = performance.now(); }, { passive: true });   // wave 45: a scrolling rack makes every reader yield for 150 ms
  /* body.rack-l says the mirror rack holds cards: the stage captions step right of it */
  if (rackL) { const syncL = () => document.body.classList.toggle('rack-l', rackL.children.length > 0); new MutationObserver(syncL).observe(rackL, { childList: true }); syncL(); }
  const layout = {
    toggleRack() { document.body.classList.toggle('rack-hidden'); document.body.classList.remove('rack-peek', 'transport-peek'); },
    /** move a card to the other rack (or to a named side) — the MIRROR: same windows, either side */
    moveToRack(id, side) {
      const card = document.querySelector('.dev[data-id="' + id + '"]'); if (!card || !rackL) return false;
      const target = side === 'L' ? rackL : side === 'R' ? rack : (card.parentElement === rack ? rackL : rack);
      target.appendChild(card); return true;
    },
    side(id) { const card = document.querySelector('.dev[data-id="' + id + '"]'); return card && card.parentElement === rackL ? 'L' : 'R'; },
    moveCard(id, index) { const list = [...rack.querySelectorAll('.dev')]; const card = list.find((d) => d.dataset.id === id); if (!card) return false; const rest = list.filter((d) => d !== card); const ref = rest[Math.max(0, Math.min(index, rest.length))] || null; rack.insertBefore(card, ref); return true; },
    order() { return [...rack.querySelectorAll('.dev')].map((d) => d.dataset.id); },
    orderAll() { return [...document.querySelectorAll('#rackL .dev, #rack .dev')].map((d) => d.dataset.id); },
    docked: false,
    dockIndex: 0,                                                    // the transport's remembered slot in the left rack (0 = the very top)
    dockTransport() {
      const tr = document.getElementById('transport'); if (!tr) return;
      layout.docked = !layout.docked;
      const host = rackL || rack;
      if (layout.docked) {
        wTr.root.hidden = false; wTr.body.appendChild(tr); tr.classList.add('docked'); tr.classList.remove('mini');
        const cards = [...host.querySelectorAll('.dev')].filter((d) => d !== wTr.root);
        host.insertBefore(wTr.root, cards[Math.min(layout.dockIndex, cards.length)] || null);
      } else {
        const cards = [...wTr.root.parentElement.querySelectorAll('.dev')]; layout.dockIndex = Math.max(0, cards.indexOf(wTr.root));
        dom.stage.appendChild(tr); tr.classList.remove('docked'); tr.classList.add('mini'); wTr.root.hidden = true;
      }
      schedule(TIER.PRESENT);
    },
    /** bring a window to the top of its rack, unfolded, with the rack shown */
    raise(id) {
      const dev = document.querySelector('.dev[data-id="' + id + '"]'); if (!dev) return false;
      (dev.parentElement || rack).prepend(dev); dev.hidden = false; dev.classList.remove('closed'); saveSettings();
      if (dev.classList.contains('folded')) { const f = dev.querySelector('.dev-fold'); if (f) f.click(); }
      document.body.classList.remove('rack-hidden'); (dev.parentElement || rack).scrollTop = 0; return true;
    },
    /** reopen a closed window into a rack (default: the one it was in) */
    reopen(id, side) {
      const dev = document.querySelector('.dev[data-id="' + id + '"]'); if (!dev) return false;
      dev.classList.remove('closed'); const host = side === 'L' ? rackL : side === 'R' ? rack : dev.parentElement || rack;
      const first = host.querySelector('.dev'); if (first) host.insertBefore(dev, first); else host.appendChild(dev);
      saveSettings(); return true;
    },
    closed() { return [...document.querySelectorAll('.dev.closed')].map((d) => d.dataset.id); },
    resetLayout() {
      for (const d of document.querySelectorAll('.dev')) { d.classList.remove('closed', 'off'); if (d.classList.contains('folded')) { const f = d.querySelector('.dev-fold'); if (f) f.click(); } }
      if (layout.docked) layout.dockTransport();
      for (const d of [...document.querySelectorAll('#rackL .dev')]) if (d.dataset.id !== 'transport') rack.appendChild(d);
      document.body.classList.remove('rack-hidden'); saveSettings();
    },
    /** an INFO panel's digest: every readout, the status, and the module's own table — as text for the notebook */
    digest(id) {
      const dev = document.querySelector('.dev[data-id="' + id + '"]'); if (!dev) return '';
      const lines = ['λWAVES · ' + dev.querySelector('.dev-title').textContent + ' · t = ' + clock.t.toFixed(4) + ' · ' + new Date().toISOString()];
      const st = dev.querySelector('.dev-stat'); if (st && st.textContent.trim()) lines.push('status\t' + st.textContent.trim());
      for (const ro of dev.querySelectorAll('.ro')) { const l = ro.querySelector('.ro-lbl'), v = ro.querySelector('.ro-val'), s = ro.querySelector('.ro-sub'); lines.push([l ? l.textContent.trim() : '', v ? v.textContent.trim() : '', s ? s.textContent.trim() : ''].join('\t')); }
      const extra = DIGESTS[id] ? DIGESTS[id]() : ''; if (extra) lines.push('', extra);
      return lines.join('\n');
    },
    async copyDigest(id) { const t = layout.digest(id); try { await navigator.clipboard.writeText(t); } catch (e) {} const dev = document.querySelector('.dev[data-id="' + id + '"]'); if (dev) { dev.classList.add('copied'); setTimeout(() => dev.classList.remove('copied'), 900); } return t; },
  };
  /** a window's hover hint in the + list and the WINDOW menu: its long title, and its status when it says something (wave 44) */
  const winHint = (d) => { const t = (d.querySelector('.dev-title') || {}).textContent || '', st = ((d.querySelector('.dev-stat') || {}).textContent || '').trim(); return st ? t + '  ·  ' + st : t; };
  const wTr = device({ id: 'transport', eyebrow: 'TRANSPORT', title: 'PLAY · SCRUB · RATE', status: 'docked' });
  wTr.root.hidden = true; (rackL || rack).appendChild(wTr.root);
  {
    const tb = document.getElementById('rackToggle'); if (tb) tb.addEventListener('click', () => layout.toggleRack());
    const peek = document.getElementById('rackPeek');
    if (peek) { peek.addEventListener('pointerenter', () => document.body.classList.add('rack-peek')); }
    /* (the rack's own pointerleave no longer dismisses a peek: Firefox synthesises one when the rack slides, and the window handler above owns peeking now) */
    /* a dock button on the transport itself */
    const tr = document.getElementById('transport');
    if (tr) { const b = el('button', 'dock-btn', tr, '⇱'); b.type = 'button'; b.title = 'dock the transport into the rack (T)'; b.addEventListener('click', () => layout.dockTransport()); }
    /* every card's notes fold behind ONE ⓘ in its header; the panel opens OUTSIDE the rack on the stage side; clicks cycle */
    const infoPop = el('div', 'info-pop glass', document.getElementById('lab')); infoPop.id = 'infoPop'; infoPop.hidden = true;
    let infoTimer = 0, infoCard = null, infoIdx = 0;
    function showInfo(card, idx) {
      const notes = [...card.querySelectorAll('.note.hint-src')].filter((n) => n.textContent.trim()); if (!notes.length) return;   // a note with nothing in it is not a page (ATOMS' α-warning is empty until two shells are close)
      infoCard = card; infoIdx = ((idx % notes.length) + notes.length) % notes.length;
      infoPop.innerHTML = '';
      el('div', 'info-title', infoPop, card.querySelector('.dev-title').textContent);
      el('div', 'info-body', infoPop).innerHTML = notes[infoIdx].innerHTML;
      el('div', 'info-foot', infoPop, notes.length > 1 ? (infoIdx + 1) + ' / ' + notes.length + '  ·  ⓘ again for the next' : 'ⓘ');
      infoPop.hidden = false;
      const r = card.getBoundingClientRect(), left = card.parentElement === rackL, h = (card.parentElement || rack).getBoundingClientRect();   // the panel clears the RACK's edge, scrollbar included
      infoPop.style.top = Math.max(8, Math.min(window.innerHeight - infoPop.offsetHeight - 8, r.top)) + 'px';
      if (left) { infoPop.style.left = (h.right + 10) + 'px'; infoPop.style.right = 'auto'; } else { infoPop.style.right = (window.innerWidth - h.left + 10) + 'px'; infoPop.style.left = 'auto'; }
    }
    function hideInfo() { infoPop.hidden = true; infoCard = null; }
    infoPop.addEventListener('pointerenter', () => clearTimeout(infoTimer));
    infoPop.addEventListener('pointerleave', () => { infoTimer = setTimeout(hideInfo, 250); });
    for (const d of document.querySelectorAll('.dev')) {
      const notes = [...d.querySelectorAll('.note')]; if (!notes.length) continue;
      for (const n of notes) n.classList.add('hint-src');
      const util = d.querySelector('.dev-util'); if (!util) continue;
      const b = el('button', 'info-i', util, 'i'); b.type = 'button'; b.title = notes.length > 1 ? 'about this window (' + notes.length + ' notes — click to cycle)' : 'about this window';
      util.insertBefore(b, util.firstChild);
      b.addEventListener('click', (e) => { e.stopPropagation(); if (infoCard === d) showInfo(d, infoIdx + 1); else showInfo(d, 0); });
      b.addEventListener('pointerenter', (e) => { if (e.pointerType === 'touch') return; clearTimeout(infoTimer); if (infoCard !== d) showInfo(d, 0); });
      b.addEventListener('pointerleave', () => { infoTimer = setTimeout(hideInfo, 350); });
    }
    layout.showInfo = (id, idx = 0) => { const d = document.querySelector('.dev[data-id="' + id + '"]'); if (d) showInfo(d, idx); };
    layout.hideInfo = hideInfo;
    /* the logo opens FILE · EDIT · WINDOW */
    const title = document.getElementById('title');
    if (title) {
      const bar = el('nav', 'menubar', document.getElementById('lab')); bar.id = 'menubar'; bar.hidden = true;
      const clickTrig = (label) => { const b = [...document.querySelectorAll('.trig')].find((t) => t.textContent.trim() === label); if (b) b.click(); };
      const runKey = (code) => { const a = ACTIONS.find((x) => x.key === code && !x.ctrl); if (a) a.run(); };
      const MENUS = {
        FILE: () => [['NEW project', () => layout.projects.fresh()], ['SAVE project' + (layout.projects.current ? '  ' + layout.projects.current : '…'), () => { if (layout.projects.current) layout.projects.save(); else { layout.notebook.open('projects'); } }], ['SAVE project AS…', () => layout.notebook.open('projects')], ['OPEN a project…', () => layout.notebook.open('projects')],
          ...layout.projects.recent().slice(0, 5).map((p) => ['↺  ' + p, () => layout.projects.open(p)]),
          ['EXPORT project (.json)', () => document.querySelector('.pj-export').click()], ['IMPORT project (.json)…', () => document.querySelector('.pj-import input').click()],
          ['SAVE the experiment (quick)', () => clickTrig('SAVE')], ['LOAD the last quick save', () => clickTrig('LOAD')], ['COPY as JSON', () => clickTrig('COPY JSON')]],
        EDIT: () => [['UNDO\t' + keyName(ACTIONS.find((x) => x.id === 'undo')), () => historyApi.undo(), () => !historyApi.canUndo], ['REDO\t' + keyName(ACTIONS.find((x) => x.id === 'redo')), () => historyApi.redo(), () => !historyApi.canRedo], ['PLAY / PAUSE\tSpace', () => runKey('Space')], ['NORMALIZE', () => clickTrig('NORMALIZE')], ['CLEAR the register', () => clickTrig('CLEAR')], ['RESET the view', () => clickTrig('RESET VIEW')], ['RESEED the particles\tctrl+R', () => runKey('KeyR')], ['RESET the key bindings', () => clickTrig('RESET KEYS')], ['SETTINGS…', () => layout.raise('settings')]],
        VIEW: () => [['ρ = |ψ|²  density', () => LW.setView('density')], ['arg ψ  phase\tV cycles', () => LW.setView('phase')], ['Re ψ', () => LW.setView('real')], ['Im ψ', () => LW.setView('imag')], ['Δρ  difference', () => LW.setView('diff')], ['Re + Im  superposed (heuristic)', () => LW.setView('reim')],
          ['— style: CLOUD\tC cycles', () => LW.setStyle('cloud')], ['— style: SOLID', () => LW.setStyle('solid')], ['— style: GRAIN', () => LW.setStyle('grain')], ['— style: SIGNED', () => LW.setStyle('signed')], ['— style: BANDS', () => LW.setStyle('bands')],
          ['STAGE CAPTIONS  on / off', () => ui.capSw && ui.capSw.root.click()], ['STATUS TAGS  on / off', () => ui.badgesSw && ui.badgesSw.root.click()], ['HINT BAR  on / off', () => ui.hintSw && ui.hintSw.root.click()], ['HIDE the interface\tH', () => runKey('KeyH')], ['FULL SCREEN / back\tF', () => toggleFullscreen()]],
        WINDOW: () => [['NOTEBOOK\tJ', () => layout.notebook.toggle()], ['HIDE / SHOW the rack\tB', () => layout.toggleRack()], ['DOCK / UNDOCK the transport\tT', () => layout.dockTransport()], ['HIDE the interface\tH', () => runKey('KeyH')], ['SHOW / HIDE every note\tN', () => runKey('KeyN')], ['THEME · LIGHT', () => __LW_hooks.setTheme && __LW_hooks.setTheme('light')], ['THEME · DARK', () => __LW_hooks.setTheme && __LW_hooks.setTheme('dark')], ['THEME · SYSTEM', () => __LW_hooks.setTheme && __LW_hooks.setTheme('system')],
          ...[...document.querySelectorAll('.dev')].map((d) => [(d.classList.contains('closed') ? '⊕  ' : '↑  ') + d.querySelector('.dev-eyebrow').textContent + '  ·  ' + d.querySelector('.dev-title').textContent, () => layout.raise(d.dataset.id), null, winHint(d)])],
        ABOUT: () => [['ABOUT λWAVES', () => layout.notebook.open('about')], ['NOTEBOOK\tJ', () => layout.notebook.open('notes')], ['REPORT.md  (the build log)', () => window.open('/REPORT.md', '_blank', 'noopener')], ['LICENCES  Spinwerad · Roboto (SIL OFL)', () => layout.notebook.open('about')], ['SETTINGS…', () => layout.raise('settings')]],
      };
      let openList = null;
      const closeLists = () => { for (const l of bar.querySelectorAll('.mb-list')) l.hidden = true; openList = null; };
      for (const name of Object.keys(MENUS)) {
        const grp = el('div', 'mb-group', bar);
        const btn = el('button', 'mb-btn', grp, name); btn.type = 'button';
        const list = el('div', 'mb-list', grp); list.hidden = true;
        const fill = () => { list.innerHTML = ''; for (const [label, run, dis, hint] of MENUS[name]()) { const it = el('button', 'mb-item', list); const kk = label.split('\t'); el('span', 'mb-lbl', it, kk[0]); if (kk[1]) el('span', 'mb-key', it, kk[1]); it.type = 'button'; if (hint) it.title = hint; if (dis && dis()) it.disabled = true; it.addEventListener('click', (e) => { e.stopPropagation(); run(); closeLists(); bar.hidden = true; }); } };
        btn.addEventListener('click', (e) => { e.stopPropagation(); const was = openList === list; closeLists(); if (!was) { fill(); list.hidden = false; openList = list; } });
        btn.addEventListener('pointerenter', (e) => { if (e.pointerType === 'touch' || !openList || openList === list) return; closeLists(); fill(); list.hidden = false; openList = list; });
      }
      let barTimer = 0;
      const showBar = () => { clearTimeout(barTimer); bar.hidden = false; const r = title.getBoundingClientRect(); bar.style.left = (r.right + 6) + 'px'; bar.style.top = (r.top + (r.height - bar.offsetHeight) / 2) + 'px'; };
      const hideBarSoon = () => { clearTimeout(barTimer); barTimer = setTimeout(() => { if (!openList) bar.hidden = true; }, 400); };
      title.addEventListener('pointerenter', (e) => { if (e.pointerType !== 'touch') showBar(); });
      title.addEventListener('click', () => { if (bar.hidden) showBar(); else { closeLists(); bar.hidden = true; } });
      title.addEventListener('pointerleave', hideBarSoon);
      bar.addEventListener('pointerenter', () => clearTimeout(barTimer));
      bar.addEventListener('pointerleave', hideBarSoon);
      document.addEventListener('pointerdown', (e) => { if (!bar.hidden && !bar.contains(e.target) && !title.contains(e.target)) { closeLists(); bar.hidden = true; } });
      layout.menu = { open: showBar, close: () => { closeLists(); bar.hidden = true; }, get isOpen() { return !bar.hidden; } };
    }
    /* the taxonomy on every card: INFO panels get ⧉ COPY; CONTROL and OTHER start folded */
    for (const d of document.querySelectorAll('.dev')) {
      const kind = KIND[d.dataset.id] || 'other'; d.dataset.kind = kind;
      if (kind === 'info' || d.dataset.id === 'field') { const util = d.querySelector('.dev-util'); const b = el('button', 'dev-copy', util, '⧉'); b.type = 'button'; b.title = 'copy this panel\'s digest (every readout and the module\'s table) as text'; util.insertBefore(b, util.querySelector('.dev-fold')); b.addEventListener('click', (e) => { e.stopPropagation(); layout.copyDigest(d.dataset.id); }); }
      if ((kind === 'control' || kind === 'other') && !d.classList.contains('folded')) { const f = d.querySelector('.dev-fold'); if (f) f.click(); }
    }
    document.addEventListener('devclose', () => saveSettings());
    /* the + under the hide button: a list of closed windows to reopen (into the rack they came from) */
    {
      const add = document.getElementById('rackAdd'), list = document.getElementById('rackAddList');
      if (add && list) {
        add.addEventListener('click', (e) => {
          e.stopPropagation(); if (!list.hidden) { list.hidden = true; return; }
          list.innerHTML = ''; const closed = [...document.querySelectorAll('.dev.closed')];
          if (!closed.length) el('div', 'rack-add-none', list, 'nothing is closed — × on a window closes it');
          for (const d of closed) { const it = el('button', 'mb-item', list, '⊕  ' + d.querySelector('.dev-eyebrow').textContent + '  ·  ' + d.querySelector('.dev-title').textContent); it.type = 'button'; it.title = winHint(d); it.addEventListener('click', (ev) => { ev.stopPropagation(); layout.reopen(d.dataset.id, 'R'); list.hidden = true; }); }
          list.hidden = false;
        });
        document.addEventListener('pointerdown', (ev) => { if (!list.hidden && !list.contains(ev.target) && ev.target !== add) list.hidden = true; });
      }
    }
    /* ── THE NOTEBOOK: a free glass over the stage; its ⓘ flips it into the ABOUT face ── */
    const nb = document.getElementById('notebook');
    if (nb) {
      const NB_KEY = 'lambdawaves.q0.notebook', NB_TITLE = 'lambdawaves.q0.notebook.title', PJ_KEY = 'lambdawaves.q0.projects';
      const ta = nb.querySelector('.nb-text'), view = nb.querySelector('.nb-view'), titleIn = nb.querySelector('.nb-title'), faces = { notes: nb.querySelector('.nb-notes'), about: nb.querySelector('.nb-aboutface'), projects: nb.querySelector('.nb-projectsface') };
      /* the ABOUT face's version line is BUILD_LINE, never hand-written markup: the copy dump reads this same text back out of the face */
      const abV = nb.querySelector('.ab-version');
      if (abV) { const i = BUILD_LINE.indexOf(' · '); abV.textContent = ''; el('span', 'ab-tag', abV, i < 0 ? BUILD_LINE : BUILD_LINE.slice(0, i)); if (i >= 0) abV.appendChild(document.createTextNode(BUILD_LINE.slice(i))); }
      try { ta.value = localStorage.getItem(NB_KEY) || ''; const t = localStorage.getItem(NB_TITLE); if (t) titleIn.value = t; } catch (e) {}
      titleIn.addEventListener('input', () => { try { localStorage.setItem(NB_TITLE, titleIn.value); } catch (e) {} });
      titleIn.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); titleIn.blur(); } e.stopPropagation(); });
      /* ── markdown + LaTeX: $…$ and $$…$$ are lifted out before marked runs and set by KaTeX after ── */
      function renderMarkdown(src) {
        const M = window.marked, K = window.katex; if (!M) return src.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
        const math = []; const keep = (tex, display) => { math.push({ tex, display }); return '\u0000MATH' + (math.length - 1) + '\u0000'; };
        let s = src.replace(/\$\$([\s\S]+?)\$\$/g, (m, t) => keep(t, true)).replace(/(^|[^\\$])\$([^$\n]+?)\$/g, (m, pre, t) => pre + keep(t, false));
        let html = M.parse(s, { breaks: true, gfm: true });
        html = html.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/ on[a-z]+="[^"]*"/gi, '');
        html = html.replace(/\u0000MATH(\d+)\u0000/g, (m, i) => { const q = math[+i]; try { return K ? K.renderToString(q.tex, { displayMode: q.display, throwOnError: false, output: 'html' }) : '<code>' + q.tex + '</code>'; } catch (e) { return '<code>' + q.tex + '</code>'; } });
        return html;
      }
      const CAP = { lines: 14, words: 140 };
      function capText(t) { const lines = t.split('\n'); let out = [], words = 0, cut = false; for (const ln of lines) { if (out.length >= CAP.lines) { cut = true; break; } const w = ln.trim() ? ln.trim().split(/\s+/).length : 0; if (words + w > CAP.words) { cut = true; break; } words += w; out.push(ln); } return { text: out.join('\n'), cut }; }
      function render(capped) { const src = capped ? capText(ta.value) : { text: ta.value, cut: false }; view.innerHTML = renderMarkdown(src.text || '*empty — press ◐ to write*') + (src.cut ? '<div class="nb-more">… the landing shows the first ' + CAP.lines + ' lines / ' + CAP.words + ' words · ◐ opens the whole notebook</div>' : ''); }
      const setMode = (m) => { nb.dataset.mode = m; if (m === 'view') render(false); else ta.focus(); };
      nb.dataset.mode = 'edit';
      nb.querySelector('.nb-mode').addEventListener('click', () => setMode(nb.dataset.mode === 'view' ? 'edit' : 'view'));
      ta.addEventListener('keydown', (e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); setMode('view'); } e.stopPropagation(); });
      /* ── PROJECTS: sessions in folders, a recent list, the notebook as each one's landing page ── */
      const pjRead = () => { try { return JSON.parse(localStorage.getItem(PJ_KEY) || '{"items":{},"recent":[]}'); } catch (e) { return { items: {}, recent: [] }; } };
      const pjWrite = (P) => { try { localStorage.setItem(PJ_KEY, JSON.stringify(P)); } catch (e) {} };
      let pjCurrent = null;
      const pjStatus = (t) => { const s = nb.querySelector('.pj-status'); if (s) s.textContent = t; };
      const pjTouch = (P, path, key) => { P.recent = [path, ...(P.recent || []).filter((p) => p !== path)].slice(0, 8); };
      const projects = {
        list() { const P = pjRead(); return Object.values(P.items).sort((a, b) => (b.saved || '').localeCompare(a.saved || '')); },
        recent() { const P = pjRead(); return (P.recent || []).filter((p) => P.items[p]); },
        get current() { return pjCurrent; },
        save(path) {
          path = String(path || pjCurrent || '').trim().replace(/^\/+|\/+$/g, ''); if (!path) return false;
          const i = path.lastIndexOf('/'), folder = i < 0 ? '' : path.slice(0, i), name = i < 0 ? path : path.slice(i + 1);
          const P = pjRead(); const now = new Date().toISOString();
          P.items[path] = { path, folder, name, saved: now, opened: P.items[path] ? P.items[path].opened : now, data: serialize(), notebook: { title: titleIn.value === 'NOTEBOOK' ? name : titleIn.value, text: ta.value } };
          pjTouch(P, path); pjWrite(P); pjCurrent = path; pjStatus('saved ' + path); if (titleIn.value === 'NOTEBOOK') { titleIn.value = name; } renderProjects(); return true;
        },
        open(path) {
          const P = pjRead(), it = P.items[path]; if (!it) return false;
          /* wave 48: a project load rebuilds the register, the operator and the field — BUSY work */
          busy.n++; busySync(); try { restore(it.data); } finally { busy.n = Math.max(0, busy.n - 1); busySync(); }
          ta.value = it.notebook.text || ''; titleIn.value = it.notebook.title || it.name; try { localStorage.setItem(NB_KEY, ta.value); localStorage.setItem(NB_TITLE, titleIn.value); } catch (e) {}
          it.opened = new Date().toISOString(); pjTouch(P, path); pjWrite(P); pjCurrent = path; pjStatus('opened ' + path);
          show('notes'); nb.dataset.mode = 'view'; render(true);                      // the landing page: the notebook, capped
          return true;
        },
        remove(path) { const P = pjRead(); if (!P.items[path]) return false; delete P.items[path]; P.recent = (P.recent || []).filter((p) => p !== path); pjWrite(P); if (pjCurrent === path) pjCurrent = null; renderProjects(); return true; },
        fresh() { reg.clear(); refSnapshot = null; touchState(); ta.value = ''; titleIn.value = 'NOTEBOOK'; try { localStorage.setItem(NB_KEY, ''); localStorage.setItem(NB_TITLE, 'NOTEBOOK'); } catch (e) {} pjCurrent = null; pjStatus('new'); show('notes'); setMode('edit'); },
        exportText(path) { const P = pjRead(), it = P.items[path || pjCurrent]; return it ? JSON.stringify({ lambdawaves: 'project', version: 1, ...it }, null, 1) : null; },
        importText(text) { const o = JSON.parse(text); if (!o || o.lambdawaves !== 'project' || !o.path || !o.data) throw new Error('not a λWAVES project'); const P = pjRead(); P.items[o.path] = { path: o.path, folder: o.folder || '', name: o.name || o.path, saved: o.saved || new Date().toISOString(), opened: o.opened || '', data: o.data, notebook: o.notebook || { title: o.name, text: '' } }; pjTouch(P, o.path); pjWrite(P); renderProjects(); return o.path; },
      };
      function renderProjects() {
        const list = nb.querySelector('.pj-list'); if (!list) return; list.innerHTML = '';
        const items = projects.list(); if (!items.length) { el('div', 'pj-none', list, 'no projects yet — name one above and SAVE AS'); return; }
        const byFolder = new Map(); for (const it of items) { const f = it.folder || '(root)'; if (!byFolder.has(f)) byFolder.set(f, []); byFolder.get(f).push(it); }
        for (const [f, arr] of [...byFolder.entries()].sort()) { el('div', 'pj-folder', list, f); for (const it of arr) { const row = el('div', 'pj-item', list); const nm = el('span', 'pj-name', row, it.name + (it.path === pjCurrent ? '  ·  current' : '')); nm.addEventListener('click', () => projects.open(it.path)); el('span', 'pj-when', row, (it.saved || '').slice(0, 16).replace('T', ' ')); const x = el('button', '', row, '×'); x.title = 'delete this project'; x.addEventListener('click', (e) => { e.stopPropagation(); projects.remove(it.path); }); } }
      }
      nb.querySelector('.pj-save').addEventListener('click', () => { const p = nb.querySelector('.pj-path').value.trim() || pjCurrent; if (p) projects.save(p); else pjStatus('give it a name: folder/name'); });
      nb.querySelector('.pj-path').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); nb.querySelector('.pj-save').click(); } e.stopPropagation(); });
      nb.querySelector('.pj-export').addEventListener('click', () => { const t = projects.exportText(); if (!t) { pjStatus('nothing to export — save first'); return; } const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([t], { type: 'application/json' })); a.download = (pjCurrent || 'project').replace(/\//g, '__') + '.lambdawaves.json'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); });
      nb.querySelector('.pj-import input').addEventListener('change', async (e) => { const f = e.target.files && e.target.files[0]; if (!f) return; try { const p = projects.importText(await f.text()); pjStatus('imported ' + p); } catch (err) { pjStatus('import failed: ' + err.message); } e.target.value = ''; });
      nb.querySelector('.nb-projects-btn').addEventListener('click', () => { if (nb.dataset.face === 'projects') show('notes'); else { renderProjects(); const pp = nb.querySelector('.pj-path'); if (pp && pjCurrent) pp.value = pjCurrent; show('projects'); } });
      layout.projects = projects;
      const count = () => { const c = nb.querySelector('.nb-count'); if (c) c.textContent = ta.value.trim() ? ta.value.trim().split(/\s+/).length + ' words · kept in this browser' : 'empty · kept in this browser'; };
      ta.addEventListener('input', () => { try { localStorage.setItem(NB_KEY, ta.value); } catch (e) {} count(); });
      const show = (face) => {
        nb.hidden = false; faces.notes.hidden = face !== 'notes'; faces.about.hidden = face !== 'about'; faces.projects.hidden = face !== 'projects'; nb.dataset.face = face;
        if (face === 'about') { const logo = nb.querySelector('.nb-logo'); if (logo && !logo.children.length) { for (const c of document.getElementById('title').children) if (!c.classList.contains('ms')) logo.appendChild(c.cloneNode(true)); paintMarks(); } }   // wave 48: the clone is painted from the SAME nine samples, then and on every wheel turn
        if (face === 'notes') ta.focus();
      };
      nb.querySelector('.nb-about').addEventListener('click', () => show(nb.dataset.face === 'about' ? 'notes' : 'about'));
      nb.querySelector('.nb-close').addEventListener('click', () => { nb.hidden = true; });
      nb.querySelector('.nb-copy').addEventListener('click', async () => { try { await navigator.clipboard.writeText(ta.value); } catch (e) {} });
      const dump = nb.querySelector('.nb-dump');
      const dumpText = () => faces.about.innerText.replace(/\n{3,}/g, '\n\n') + '\n\nsettings ' + JSON.stringify(readSettings()) + '\nfield ' + JSON.stringify({ resolution: field.resolution, half: field.half, adapter: field.adapterInfo || null }) + '\n' + navigator.userAgent;
      if (dump) dump.addEventListener('click', async () => { try { await navigator.clipboard.writeText(dumpText()); } catch (e) {} });
      /* THE RESIZE GRIP (wave 48, Josh: "Window in notebook/about currently not resizable on ipad").  CSS `resize`
         is a mouse-only affordance — WebKit and Gecko both ignore a touch pointer on that corner — so the corner gets
         an element of its own with real pointer events (pointerdown / move / up, so touch, pen and mouse all reach it).
         `resize: both` stays in lab.css for the desktop; both roads end in the same inline width/height, the same
         320 × 240 floor, and the same two numbers in the settings key.  The faces go on filling the glass by flex,
         which is the wave-24 law and is why sizing the SHELL is the whole job. */
      const NB_MIN_W = 320, NB_MIN_H = 240;
      const nbClamp = (w, h) => [Math.max(NB_MIN_W, Math.min(w, window.innerWidth - 16)), Math.max(NB_MIN_H, Math.min(h, window.innerHeight - 16))];
      function nbResize(w, h) { const [cw, ch] = nbClamp(w, h); nb.style.width = cw + 'px'; nb.style.height = ch + 'px'; return [cw, ch]; }
      function nbSaveSize() { const w = Math.round(nb.offsetWidth), h = Math.round(nb.offsetHeight); const S = readSettings(); if (S.nbW === w && S.nbH === h) return; try { localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...S, nbW: w, nbH: h })); } catch (e) {} }
      { const grip = nb.querySelector('.nb-grip');
        if (grip) { let gd = null;
          grip.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); const r = nb.getBoundingClientRect(); gd = { x: e.clientX, y: e.clientY, w: r.width, h: r.height };
            try { grip.setPointerCapture(e.pointerId); } catch (_) {} });   // a capture that cannot be taken (a synthesised pointer, a stale id) must not throw into the page — the drag works without it
          grip.addEventListener('pointermove', (e) => { if (!gd) return; e.preventDefault(); nbResize(gd.w + (e.clientX - gd.x), gd.h + (e.clientY - gd.y)); });
          const gend = (e) => { if (!gd) return; gd = null; if (e && e.pointerId !== undefined && grip.hasPointerCapture && grip.hasPointerCapture(e.pointerId)) grip.releasePointerCapture(e.pointerId); nbSaveSize(); };
          grip.addEventListener('pointerup', gend); grip.addEventListener('pointercancel', gend);
        }
        /* the desktop's own CSS resize ends in a pointerup over the notebook — the same two numbers, the same key */
        nb.addEventListener('pointerup', () => nbSaveSize());
        const S0 = readSettings(); if (typeof S0.nbW === 'number' && typeof S0.nbH === 'number') nbResize(S0.nbW, S0.nbH);
        layout.notebookResize = (w, h) => { const r = nbResize(w, h); nbSaveSize(); return r; };
      }
      let nd = null; const nhead = nb.querySelector('.nb-head');
      nhead.addEventListener('pointerdown', (e) => { if (e.target.closest('button')) return; const r = nb.getBoundingClientRect(); nd = { dx: e.clientX - r.left, dy: e.clientY - r.top }; nhead.setPointerCapture(e.pointerId); });
      nhead.addEventListener('pointermove', (e) => { if (!nd) return; nb.style.left = Math.max(0, Math.min(window.innerWidth - 80, e.clientX - nd.dx)) + 'px'; nb.style.top = Math.max(0, Math.min(window.innerHeight - 40, e.clientY - nd.dy)) + 'px'; });
      const nend = () => { nd = null; }; nhead.addEventListener('pointerup', nend); nhead.addEventListener('pointercancel', nend);
      count();
      layout.notebook = { open: (face = 'notes') => show(face), close: () => { nb.hidden = true; }, toggle: () => { if (nb.hidden) show('notes'); else nb.hidden = true; }, get isOpen() { return !nb.hidden; }, get face() { return nb.dataset.face; }, moveTo(x, y) { nb.style.left = x + 'px'; nb.style.top = y + 'px'; }, dump: dumpText, get text() { return ta.value; }, set text(v) { ta.value = v; ta.dispatchEvent(new Event('input')); }, get title() { return titleIn.value; }, set title(v) { titleIn.value = v; titleIn.dispatchEvent(new Event('input')); }, get mode() { return nb.dataset.mode; }, setMode, render: renderMarkdown, get html() { return view.innerHTML; } };
    }
    /* a hidden rack peeks when the pointer nears its column and goes when it leaves; the playhead the same, at the foot of the stage */
    /* wave 48: this handler ran getComputedStyle(documentElement) on EVERY pointer move — a style resolution of the
       root, on the pointer's thread, sixty times a second, to read a constant.  --rack-w changes with the viewport
       and with nothing else, so it is read once and on resize.  And a hidden INTERFACE peeks at nothing: the racks
       are display:none under H, so the handler leaves before it touches anything. */
    const peekLast = { x: -1, y: -1, armed: false, bar: false };
    let rackW = 300;
    const readRackW = () => { rackW = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--rack-w')) || 300; };
    readRackW(); window.addEventListener('resize', readRackW, { passive: true });
    window.addEventListener('pointermove', (e) => {
      if (e.pointerType === 'touch' || uiHidden || !document.body.classList.contains('rack-hidden')) return;
      if (Math.abs(e.clientX - peekLast.x) < 2 && Math.abs(e.clientY - peekLast.y) < 2) return;   // a synthesised move after a layout change is not the pointer leaving
      peekLast.x = e.clientX; peekLast.y = e.clientY;
      const W = window.innerWidth, H = window.innerHeight, rw = rackW;
      const hasL = rackL && rackL.children.length > 0;
      const near = e.clientX > W - 60 || (hasL && e.clientX < 60);
      const inside = e.clientX > W - rw - 24 || (hasL && e.clientX < rw + 24);
      if (near) { document.body.classList.add('rack-peek'); peekLast.armed = true; } else if (!inside && peekLast.armed) { document.body.classList.remove('rack-peek'); peekLast.armed = false; }   // only a peek this handler armed is its to dismiss
      const nearBar = e.clientY > H - 120 && Math.abs(e.clientX - W / 2) < 360;
      if (nearBar) { document.body.classList.add('transport-peek'); peekLast.bar = true; } else if (e.clientY < H - 200 && peekLast.bar) { document.body.classList.remove('transport-peek'); peekLast.bar = false; }
    });
    /* every card gets a ⇄ in its header: send it to the other rack */
    for (const d of document.querySelectorAll('.dev')) {
      const util = d.querySelector('.dev-util'); if (!util || util.querySelector('.dev-swap')) continue;
      const b = el('button', 'dev-swap', util, '⇄'); b.type = 'button'; b.title = 'send this window to the other rack';
      util.insertBefore(b, util.firstChild);
      b.addEventListener('click', (e) => { e.stopPropagation(); layout.moveToRack(d.dataset.id); });
    }
    /* drag a card by its header to reorder the rack — or across to the other rack */
    let drag = null;
    const racks = [rack, rackL].filter(Boolean);
    for (const rk of racks) rk.addEventListener('pointerdown', (e) => {
      const head = e.target.closest('.dev-head'); if (!head || e.target.closest('button')) return;
      const card = head.closest('.dev'); drag = { card, y0: e.clientY, moved: false }; head.setPointerCapture && head.setPointerCapture(e.pointerId);
    });
    window.addEventListener('pointermove', (e) => {
      if (!drag) return;
      if (!drag.moved && Math.abs(e.clientY - drag.y0) < 6) return;
      if (!drag.moved) { drag.moved = true; drag.card.classList.add('dragging'); }
      /* which rack is under the pointer: the left half of the window is the mirror rack */
      const want = (rackL && e.clientX < window.innerWidth / 2) ? rackL : rack;
      const cards = [...want.querySelectorAll('.dev')].filter((d) => d !== drag.card && !d.hidden);
      let ref = null; for (const c of cards) { const r = c.getBoundingClientRect(); if (e.clientY < r.top + r.height / 2) { ref = c; break; } }
      if (drag.card.parentElement !== want || ref !== drag.card.nextSibling) want.insertBefore(drag.card, ref);
    });
    const endDrag = () => { if (!drag) return; drag.card.classList.remove('dragging'); drag = null; };
    window.addEventListener('pointerup', endDrag); window.addEventListener('pointercancel', endDrag);
  }

  /* ── canvas gestures: the observer ─────────────────────────────────────── */
  {
    const cv = dom.canvas, pts = new Map(); let pinch0 = 0, dist0 = 0;
    cv.addEventListener('pointerdown', (e) => { if (e.ctrlKey && pts.size === 0) { e.preventDefault(); bowStart(e); return; }
      if (!e.shiftKey && pts.size === 0 && kepler.on) { const r = cv.getBoundingClientRect(); const h = kepler.hit(e.clientX - r.left, e.clientY - r.top); if (h) { e.preventDefault(); cv.setPointerCapture(e.pointerId); kdrag = { n: h.n, id: e.pointerId }; cv.classList.add('kdrag'); hideHint(); return; } }   // the KEPLER handle
      if (e.shiftKey && helium && helium.on && pts.size === 0) { e.preventDefault(); const r = cv.getBoundingClientRect(); helium.placeAt(unproject(e.clientX - r.left, e.clientY - r.top)); schedule(TIER.RECONSTRUCT); return; }   // helium: put electron 1 where you click
      cv.setPointerCapture(e.pointerId); pts.set(e.pointerId, { x: e.clientX, y: e.clientY }); dragging = true; cv.classList.add('drag'); hideHint();
      if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch0 = Math.hypot(a.x - b.x, a.y - b.y); dist0 = obs.dist; } });
    cv.addEventListener('pointermove', (e) => {
      if (kdrag) { const r = cv.getBoundingClientRect(); keplerDragTo(kdrag.n, e.clientX - r.left, e.clientY - r.top); schedule(TIER.RECONSTRUCT); return; }
      if (!pts.size && !bow && kepler.on) { const r = cv.getBoundingClientRect(); const h = kepler.hit(e.clientX - r.left, e.clientY - r.top); kepler.setHover(h); cv.classList.toggle('khover', !!h); }
      if (bow) { bowMove(e); return; }
      const p = pts.get(e.pointerId); if (!p) return;
      if (pts.size === 1) { obs.yaw -= (e.clientX - p.x) * 0.0065; obs.pitch = Math.max(-1.52, Math.min(1.52, obs.pitch + (e.clientY - p.y) * 0.0065)); }
      p.x = e.clientX; p.y = e.clientY;
      if (pts.size === 2) { const [a, b] = [...pts.values()]; const d = Math.hypot(a.x - b.x, a.y - b.y); if (pinch0 > 0) obs.dist = Math.max(1.2, Math.min(8, dist0 * pinch0 / Math.max(1, d))); }
      schedule(TIER.PRESENT);
    });
    const up = (e) => { if (kdrag) { kdrag = null; cv.classList.remove('kdrag'); return; } if (bow) { bowRelease(); return; } pts.delete(e.pointerId); if (!pts.size) { dragging = false; cv.classList.remove('drag'); } };
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
  /* ── KEYS: a rebindable action table.  `fine` is shift for the stepping actions; actions that declare `shift`
     require it (so TAB and Shift+TAB are two actions).  Overrides live in localStorage. ── */
  const LS_KEYS = 'lambdawaves.q0.keys';
  const setAxis = (a) => { keyState.axis = a; wState.setStatus(keyHelp(), 'live'); };
  const setWhich = (w) => { keyState.which = w; wState.setStatus(keyHelp(), 'live'); };
  const ACTIONS = [
    { id: 'play', label: 'play / pause', key: 'Space', run: () => togglePlay() },
    { id: 'fullscreen', label: 'full screen (the browser) / back', key: 'KeyF', run: () => toggleFullscreen() },
    { id: 'notebook', label: 'notebook (and its ABOUT face)', key: 'KeyJ', run: () => layout.notebook.toggle() },
    { id: 'home', label: 'time to zero', key: 'Home', run: () => { clock.reset(); schedule(TIER.EVOLVE); } },
    { id: 'stepBack', label: 'step time back (shift: fine)', key: 'ArrowLeft', run: (f) => { clock.step(-transport.stepDt() * f); schedule(TIER.EVOLVE); } },
    { id: 'stepFwd', label: 'step time forward (shift: fine)', key: 'ArrowRight', run: (f) => { clock.step(transport.stepDt() * f); schedule(TIER.EVOLVE); } },
    { id: 'zoomIn', label: 'camera closer', key: 'ArrowUp', run: (f) => { obs.dist = Math.max(1.2, obs.dist / (1 + 0.12 * f)); schedule(TIER.PRESENT); } },
    { id: 'zoomOut', label: 'camera farther', key: 'ArrowDown', run: (f) => { obs.dist = Math.min(8, obs.dist * (1 + 0.12 * f)); schedule(TIER.PRESENT); } },
    { id: 'yawL', label: 'camera yaw left', key: 'KeyA', run: (f) => { obs.yaw -= 0.12 * f; schedule(TIER.PRESENT); } },
    { id: 'yawR', label: 'camera yaw right', key: 'KeyD', run: (f) => { obs.yaw += 0.12 * f; schedule(TIER.PRESENT); } },
    { id: 'pitchUp', label: 'camera pitch up', key: 'KeyW', run: (f) => { obs.pitch = Math.min(1.52, obs.pitch + 0.12 * f); schedule(TIER.PRESENT); } },
    { id: 'pitchDn', label: 'camera pitch down', key: 'KeyS', run: (f) => { obs.pitch = Math.max(-1.52, obs.pitch - 0.12 * f); schedule(TIER.PRESENT); } },
    { id: 'dollyIn', label: 'dolly in', key: 'KeyQ', run: (f) => { obs.dist = Math.max(1.2, obs.dist / (1 + 0.1 * f)); schedule(TIER.PRESENT); } },
    { id: 'dollyOut', label: 'dolly out', key: 'KeyE', run: (f) => { obs.dist = Math.min(8, obs.dist * (1 + 0.1 * f)); schedule(TIER.PRESENT); } },
    { id: 'camReset', label: 'reset the camera', key: 'KeyR', run: () => { Object.assign(obs, { yaw: 0.65, pitch: 0.38, dist: 3.3 }); schedule(TIER.PRESENT); } },
    { id: 'axisX', label: 'rotation axis x', key: 'KeyX', run: () => setAxis('x') },
    { id: 'axisY', label: 'rotation axis y', key: 'KeyY', run: () => setAxis('y') },
    { id: 'axisZ', label: 'rotation axis z', key: 'KeyZ', run: () => setAxis('z') },
    { id: 'rotorBoth', label: 'rotor: both (spatial rotation)', key: 'Digit1', run: () => setWhich('both') },
    { id: 'rotorPlus', label: 'rotor: plus alone', key: 'Digit2', run: () => setWhich('+') },
    { id: 'rotorMinus', label: 'rotor: minus alone', key: 'Digit3', run: () => setWhich('−') },
    { id: 'rotorK', label: 'rotor: Runge–Lenz K', key: 'Digit4', run: () => setWhich('K') },
    { id: 'turnNeg', label: 'turn ψ about the axis, −', key: 'BracketLeft', run: (f) => { reg.rotor({ which: keyState.which, axis: keyState.axis, angle: -0.12 * f, t: clock.t }); touchState(); } },
    { id: 'turnPos', label: 'turn ψ about the axis, +', key: 'BracketRight', run: (f) => { reg.rotor({ which: keyState.which, axis: keyState.axis, angle: 0.12 * f, t: clock.t }); touchState(); } },
    { id: 'slap', label: 'slap along the axis (k = 0.2)', key: 'KeyK', run: (f) => { if (__LW_hooks.slap) __LW_hooks.slap(0.2 * f, keyState.axis); } },
    { id: 'style', label: 'cycle the draw style', key: 'KeyC', run: () => { const order = ['cloud', 'solid', 'grain', 'signed', 'bands']; const nx = order[(order.indexOf(STYLE_NAMES[mat.style]) + 1) % 5]; mat.style = STYLE[nx]; ui.styleSeg.set(nx); schedule(TIER.PRESENT); } },
    { id: 'view', label: 'cycle the observable', key: 'KeyV', run: () => { const order = ['density', 'phase', 'real', 'imag', 'diff', 'reim']; const nx = order[(order.indexOf(VIEW_NAMES[mat.view]) + 1) % 6]; mat.view = VIEW[nx]; ui.viewSeg.set(nx); schedule(TIER.PRESENT); } },
    { id: 'palette', label: 'toggle the phase palette', key: 'KeyP', run: () => { if (palette) palette.setOn(!palette.on); } },
    { id: 'hideUI', label: 'hide / show the interface (and the frame)', key: 'KeyH', run: () => toggleUI() },
    { id: 'nextWindow', label: 'next window to the top of the rack', key: 'Tab', shift: false, run: () => cycleWindow(1) },
    { id: 'prevWindow', label: 'previous window to the top of the rack', key: 'Tab', shift: true, run: () => cycleWindow(-1) },
    { id: 'reseed', label: 'reset the particles', key: 'KeyR', ctrl: true, run: () => { particles.setOn(true); particles.seed(160, reg, clock.t, domain.half); if (ui.partOn) ui.partOn.set(true); schedule(TIER.PRESENT); } },
    { id: 'notes', label: 'show / hide every note', key: 'KeyN', run: () => document.body.classList.toggle('notes-open') },
    { id: 'rack', label: 'hide / show the rack', key: 'KeyB', run: () => layout.toggleRack() },
    { id: 'dock', label: 'dock / undock the transport', key: 'KeyT', run: () => layout.dockTransport() },
    { id: 'undo', label: 'undo the last edit to ψ or its law', key: 'KeyZ', ctrl: true, shift: false, run: () => historyApi.undo() },
    { id: 'redo', label: 'redo it (Ctrl+Y too)', key: 'KeyZ', ctrl: true, shift: true, run: () => historyApi.redo() },
  ];
  const DEFAULT_KEYS = Object.fromEntries(ACTIONS.map((a) => [a.id, { key: a.key, ctrl: !!a.ctrl, alt: !!a.alt, shift: a.shift }]));
  try { const ov = JSON.parse(localStorage.getItem(LS_KEYS) || '{}'); for (const a of ACTIONS) if (ov[a.id]) Object.assign(a, ov[a.id]); } catch (_) {}
  function saveKeys() { try { const ov = {}; for (const a of ACTIONS) { const d = DEFAULT_KEYS[a.id]; if (a.key !== d.key || !!a.ctrl !== d.ctrl || !!a.alt !== d.alt || a.shift !== d.shift) ov[a.id] = { key: a.key, ctrl: !!a.ctrl, alt: !!a.alt, shift: a.shift }; } localStorage.setItem(LS_KEYS, JSON.stringify(ov)); } catch (_) {} }
  const MAC = /Mac|iPhone|iPad/.test((navigator.platform || '') + ' ' + (navigator.userAgent || ''));
  function keyName(a) { const k = a.key.replace(/^Key/, '').replace(/^Digit/, '').replace('Arrow', '').replace('BracketLeft', '[').replace('BracketRight', ']'); return (a.ctrl ? (MAC ? '⌘+' : 'Ctrl+') : '') + (a.alt ? 'Alt+' : '') + (a.shift ? 'Shift+' : '') + k; }
  /* ⌘ IS ctrl here (Josh's Ctrl/⌘+Z), and an action with no ctrl now refuses BOTH modifiers rather than only one */
  function matches(a, e) { return a.key === e.code && (a.ctrl ? (e.ctrlKey || e.metaKey) : !(e.ctrlKey || e.metaKey)) && !!a.alt === e.altKey && (a.shift === undefined || !!a.shift === e.shiftKey); }
  let capturing = null;
  /* H (wave 48, Josh: "hide UI should be able to achieve the best framerate possible").  Hiding the interface used
     to hide it only from the EYE: every reader still ran, every readout still wrote its string, and the notebook's
     backdrop-filter was still recomposited on every frame the field changed.  `uiHidden` is now a real state — the
     loop skips the readers whose only product is a display:none card, and lab.css §48a/§48b take the panes out of
     paint.  What it does NOT skip is anything the STAGE shows (the field, the vortex, the particles, the Kepler
     handle, the field lines) or anything with physics behind it (the molecule and H₂ integrators), because those are
     the picture, not the chrome.  Coming back forces one full pass so nothing shows a stale number. */
  let uiHidden = false;
  function toggleUI() {
    const on = document.body.classList.toggle('ui-hidden');
    uiHidden = on;
    if (on) { ui.frameWas = mat.frame; mat.frame = false; } else { if (ui.frameWas !== undefined) mat.frame = ui.frameWas; metersWall = 0; govVersion = -1; }
    schedule(TIER.REBUILD);
  }
  let tabIdx = 0, tabOrder = null;                                 // the cycle runs over the windows' ORIGINAL order
  function cycleWindow(dir) {
    if (!tabOrder) tabOrder = [...document.querySelectorAll('#rackL .dev, #rack .dev')];
    const n = tabOrder.length; if (!n) return;
    const isTop = (d) => d === (d.parentElement || rack).querySelector('.dev:not([hidden])');
    let i = tabIdx, guard = 0;
    do { i = (i + dir + n) % n; guard++; } while ((tabOrder[i].hidden || tabOrder[i].classList.contains('closed') || isTop(tabOrder[i])) && guard < 2 * n);
    tabIdx = i;
    const dev = tabOrder[i];
    (dev.parentElement || rack).prepend(dev);
    if (dev.classList.contains('folded')) { const f = dev.querySelector('.dev-fold'); if (f) f.click(); }
    (dev.parentElement || rack).scrollTop = 0;
    dev.classList.add('tab-hot'); setTimeout(() => dev.classList.remove('tab-hot'), 600);
  }
  window.addEventListener('keydown', (e) => {
    const tag = (e.target && e.target.tagName) || '';
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    if (capturing) {                                               // the KEYS panel is listening for a new binding
      e.preventDefault();
      if (e.code === 'Escape') { capturing = null; if (ui.keysRefresh) ui.keysRefresh(); return; }
      if (['ControlLeft', 'ControlRight', 'ShiftLeft', 'ShiftRight', 'AltLeft', 'AltRight', 'MetaLeft', 'MetaRight'].includes(e.code)) return;
      capturing.key = e.code; capturing.ctrl = e.ctrlKey; capturing.alt = e.altKey; if (capturing.shift !== undefined) capturing.shift = e.shiftKey;
      capturing = null; saveKeys(); if (ui.keysRefresh) ui.keysRefresh();
      return;
    }
    if (e.code === 'KeyY' && (e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey && history) { e.preventDefault(); historyApi.redo(); return; }   // the alias; the rebindable REDO is in the table
    const fine = e.shiftKey ? 0.25 : 1;
    for (const a of ACTIONS) {
      if (!matches(a, e)) continue;
      e.preventDefault();
      a.run(fine);
      return;
    }
  });
  __LW_hooks.keys = {
    actions: ACTIONS,
    bind(id, b) { const a = ACTIONS.find((x) => x.id === id); if (!a) return false; Object.assign(a, b); saveKeys(); if (ui.keysRefresh) ui.keysRefresh(); return true; },
    reset() { for (const a of ACTIONS) Object.assign(a, DEFAULT_KEYS[a.id]); try { localStorage.removeItem(LS_KEYS); } catch (_) {} if (ui.keysRefresh) ui.keysRefresh(); },
    name: keyName, capture(id) { capturing = ACTIONS.find((x) => x.id === id) || null; if (ui.keysRefresh) ui.keysRefresh(); }, get capturing() { return capturing ? capturing.id : null },
    toggleUI, cycleWindow,
  };

  /* ── persistence (§46): experiment and presentation, separately ───────── */
  function serialize() {
    const m = JSON.parse(JSON.stringify(mat)); delete m.bg; delete m.gamma; delete m.lightUI;   // the THEME is the browser's, never the project's (Josh)
    const H = getHamiltonian();
    return { experiment: Object.assign(reg.serialize(clock.t), { rate: clock.rate, window: clock.window }),
      presentation: { obs: { ...obs }, mat: m, quality: { ...quality }, domain: { ...domain }, shadow: shadowView.mode,
        space, palette: palette ? { on: palette.on, stops: palette.stops.map((s) => ({ at: s.at, rgb: Array.from(s.rgb) })) } : null,
        hamiltonian: { id: H.id, Z: getZ(), atomZ: HAMILTONIANS.atom.Z, well: HAMILTONIANS.well.radius, gasBasis: gasAxial ? 'axial' : 'reg' },
        field: { overlay: fieldlines.overlay, lines: fieldlines.lines, source: fieldlines.source },
        wigner: { zmax: wignerView.zmax, pmax: wignerView.pmax },
        mo: moPanel ? moPanel.save() : null,
        rates: Array.from(rates), sturmian: { on: sturm.on, lambda: sturm.lambda } } };
  }
  function save() { try { const s = serialize(); localStorage.setItem(LS_EXP, JSON.stringify(s.experiment)); localStorage.setItem(LS_PRES, JSON.stringify(s.presentation)); wState.setStatus('saved', 'live'); } catch (e) { wState.setStatus('save failed', 'warn'); } }
  /** opt.keepTime: leave the transport exactly where it is (UNDO / REDO) — the anchor c(0) is what travels, so the
   *  picture is continuous the way a RATE change is and only moves if the coefficients themselves did */
  function restore(obj, opt) {
    try {
      const ex = obj ? obj.experiment : JSON.parse(localStorage.getItem(LS_EXP) || 'null');
      const pr = obj ? obj.presentation : JSON.parse(localStorage.getItem(LS_PRES) || 'null');
      if (ex) { const t = reg.restore(ex); if (!(opt && opt.keepTime)) { clock.pause(); clock.scrub(t); } if (ex.rate) clock.setRate(ex.rate); if (ex.window) clock.window = ex.window; ui.rateKnob.set(clock.rate); ui.presetSel.value = reg.preset || ''; lastNmax = -1; setReference(); }
      if (pr) { Object.assign(obs, pr.obs || {}); const pm = { ...(pr.mat || {}) }; delete pm.bg; delete pm.gamma; delete pm.lightUI; Object.assign(mat, pm); if (ui.styleSeg && STYLE_NAMES[mat.style]) ui.styleSeg.set(STYLE_NAMES[mat.style]); if (ui.invertSw) ui.invertSw.set(!!mat.invert); Object.assign(quality, pr.quality || {}); Object.assign(domain, pr.domain || {}); ui.viewSeg.set(VIEW_NAMES[mat.view]); if (pr.shadow) { shadowView.setMode(pr.shadow); ui.shadowSeg.set(pr.shadow); } ui.domainAuto.set(domain.auto); ui.domainKnob.setDisabled(domain.auto); }
      if (pr) {
        if (sturm.P) { sturm.on = false; sturm.P = null; sturm.rec = null; reg.setPropagator(null); reg.setEnergies(energyOf); }   // W-STURMIAN: stand the scale down silently (no re-anchoring) while the file's operator, Z and rates land; its own scale is applied below
        if (pr.hamiltonian) { const h = pr.hamiltonian; if (h.atomZ) setElement(h.atomZ); if (h.Z && h.Z !== getZ()) { setZ(h.Z); if (ui.zKnob) ui.zKnob.set(h.Z); } if (h.well && h.well !== HAMILTONIANS.well.radius) { HAMILTONIANS.well.setRadius(h.well); gas.setRadius(h.well); if (ui.wellKnob) ui.wellKnob.set(h.well); } if (h.id && HAMILTONIANS[h.id]) { setHamiltonian(h.id); switchHamiltonian(h.id); if (ui.hamSeg) ui.hamSeg.set(h.id); } gasAxial = h.gasBasis === 'axial'; if (ui.gasBasis) ui.gasBasis.set(gasAxial ? 'axial' : 'reg'); if (!gasAxial) gas.off(); }
        if (pr.wigner) { const G = pr.wigner; wignerView.setRange(G.zmax, G.pmax); }
        if (pr.mo && moPanel) moPanel.load(pr.mo);                     // W-MO: the basis, λ, R and the two dynamics choices (never the theme)
        if (pr.field) { const F = pr.field; if (F.overlay !== undefined) fieldlines.setOverlay(F.overlay); if (F.lines !== undefined) fieldlines.setLines(F.lines); if (F.source !== undefined) fieldlines.setSource(F.source); }
        if (Array.isArray(pr.rates) && pr.rates.length === 91) { rates.set(pr.rates); reg.setEnergies(energyOf); }
        if (pr.sturmian) { sturm.on = !!pr.sturmian.on; sturm.lambda = Math.max(0.25, Math.min(3, +pr.sturmian.lambda || 1)); } else sturm.on = false;   // a file without it means HYDROGEN
        applySturmian(true);                                          // the file's anchor is c(0) under the file's own law: keep it
        if (pr.space && pr.space !== space && !getHamiltonian().noMomentum && !sturm.P) { space = pr.space; if (ui.spaceSeg) ui.spaceSeg.set(space); }
        if (pr.palette && palette) { if (Array.isArray(pr.palette.stops)) palette.load(pr.palette.stops); palette.setOn(!!pr.palette.on); if (!pr.palette.on && mat.view !== undefined) ui.viewSeg.set(VIEW_NAMES[mat.view]); }
      }
      schedule(TIER.REBUILD); wState.setStatus('restored', 'live');
      return true;
    } catch (e) { wState.setStatus('restore failed', 'warn'); return false; }
  }

  /* ── UNDO / REDO (the last of the agreed order) ─────────────────────────────────────────────────
   * The ring is lab/history.js; this is the port it works through.  READ takes the register side —
   * the anchor c(0) with its mask and static field, the DRAG γ, the Hamiltonian selection, the SCALE,
   * the 91 RATEs and the two A / B stores — and nothing of the observer's: no camera, no palette, no
   * draw style, no layout, no theme, no play state.  WRITE goes through restore() itself with
   * keepTime, so an undo travels the same road a project LOAD does (the kernel, the spectrum lanes,
   * the knobs, the Sturmian ladder and the ATOMS card all follow) while the transport is left exactly
   * where it is: the anchor is what travels, so the picture is continuous the way a RATE change is
   * and only moves if the coefficients themselves did.  LIVEKEY is the cheap string that says whether
   * any of that has changed.  The trigger is reg.version — every register mutation bumps it — plus
   * hNote() at the few register-side setters that do not (the A / B stores, ELEMENT, GAS BASIS, WELL
   * RADIUS).  Capture is BEFORE the mutation: that is what history.js's baseline is for. */
  const hAbCopy = (S) => S ? { re: Array.from(S.re), im: Array.from(S.im) } : null;
  function hLiveKey() {
    const H = getHamiltonian(), ab = __LW_hooks.ab;
    let rk = 0; for (let a = 0; a < 91; a++) if (rates[a] !== 1) rk = (Math.imul(rk, 131) + a * 7 + Math.round(rates[a] * 1e6)) >>> 0;
    const abk = (S) => { if (!S) return '-'; let h = 0; for (let a = 0; a < 91; a++) if (S.re[a] || S.im[a]) h = (Math.imul(h, 131) + a + Math.round((S.re[a] + 3 * S.im[a]) * 1e9)) >>> 0; return h.toString(36); };
    return [reg.digest(), reg.maskDigest(), reg.field.Bz, reg.field.Fz, reg.damping, H.id, getZ(), HAMILTONIANS.atom.Z,
      HAMILTONIANS.well.radius, gasAxial ? 'a' : 'r', rk.toString(36), sturm.on ? 1 : 0, sturm.lambda,
      reg.transition ? 1 : 0, abk(ab && ab.A), abk(ab && ab.B)].join('|');
  }
  function hRead() {
    const H = getHamiltonian(), ab = __LW_hooks.ab;
    return { exp: reg.serialize(clock.t), damping: reg.damping,
      ham: { id: H.id, Z: getZ(), atomZ: HAMILTONIANS.atom.Z, well: HAMILTONIANS.well.radius, gasBasis: gasAxial ? 'axial' : 'reg' },
      rates: Array.from(rates), sturmian: { on: sturm.on, lambda: sturm.lambda },
      ab: { A: hAbCopy(ab && ab.A), B: hAbCopy(ab && ab.B), on: !!reg.transition }, key: hLiveKey() };
  }
  function hWrite(S) {
    const ab = __LW_hooks.ab;
    if (reg.transition && ab) ab.set(false);                       // freeze the mix first: the anchor restored below is the truth
    restore({ experiment: S.exp, presentation: { hamiltonian: S.ham, rates: S.rates, sturmian: S.sturmian } }, { keepTime: true });
    if (reg.damping !== S.damping) { reg.setDamping(S.damping); if (ui.dragKnob) ui.dragKnob.set(S.damping); }
    if (ab && ab.setStores) ab.setStores(S.ab.A, S.ab.B);
    if (S.ab.on && ab && !reg.transition) ab.set(true);             // best effort: the mix restarts at t₀ = now
    touchState();
  }
  let __hver = reg.version;
  Object.defineProperty(reg, 'version', { configurable: true, get() { return __hver; }, set(v) { __hver = v; hNote(); } });
  history = createHistory({ read: hRead, write: hWrite, liveKey: hLiveKey, depth: 60, quiet: 400 });
  document.addEventListener('pointerdown', () => { pointerHeld = true; history.hold(); }, true);   // one drag is ONE step: the window opens on the way down …
  document.addEventListener('pointerup', () => { pointerHeld = false; history.release(); });       // … and closes after the control's own onChange has run
  document.addEventListener('pointercancel', () => { pointerHeld = false; history.release(); });
  const historyApi = {
    undo() { const ok = history.undo(); if (ok) wState.setStatus('undone · ' + history.depth + ' back, ' + history.redoDepth + ' forward', 'live'); return ok; },
    redo() { const ok = history.redo(); if (ok) wState.setStatus('redone · ' + history.depth + ' back, ' + history.redoDepth + ' forward', 'live'); return ok; },
    get canUndo() { return history.canUndo; }, get canRedo() { return history.canRedo; },
    get depth() { return history.depth; }, get redoDepth() { return history.redoDepth; }, get limit() { return history.limit; },
    clear() { history.clear(); }, flush() { return history.flush(); }, note() { history.note(); },
  };

  /* ── the diagnostics surface (tests and curiosity; one road) ──────────── */
  const LW = {
    ready: false, reg, clock, obs, mat, quality, domain, camera, fieldRate, stats, field, presets: PRESETS, TIER, shadowView, spectrum, orbitView: orbit, vortex, ladder, particles, dynamics, slice, qcd, kepler, molecule, helium, h2, calculus, layout, fieldlines, get electrostatics() { return fieldlines.field; }, setTheme(t) { if (__LW_hooks.setTheme) __LW_hooks.setTheme(t); }, setCardStyle(c) { return setCardStyle(c); }, get cardStyle() { return document.body.dataset.card || 'refractive'; }, applySettings, get settings() { return readSettings(); }, get ab() { return __LW_hooks.ab; }, get notebook() { return layout.notebook; }, get period() { return __LW_hooks.period ? __LW_hooks.period() : null; }, get gas() { return gas; }, setGasBasis(v) { if (ui.gasBasis) ui.gasBasis.set(v); gasAxial = v === 'axial'; if (!gasAxial) gas.off(); hNote(); schedule(TIER.RECONSTRUCT); }, get gasBasis() { return gasAxial ? 'axial' : 'reg'; }, keplerDrag(n, w) { return keplerDragToPoint(n, w); }, get projects() { return layout.projects; }, rateOf(a) { return rates[a]; }, setRate(a, r) { return api.setRate(a, r); }, saveSettings, setStyle(name) { if (STYLE[name] === undefined) return false; mat.style = STYLE[name]; if (ui.styleSeg) ui.styleSeg.set(name); schedule(TIER.PRESENT); return true; }, accent: { set(a, b) { if (a !== undefined) accent.a = a; if (b !== undefined) accent.b = b; applyAccent(); }, get a() { return accent.a; }, get b() { return accent.b; }, colorAt(deg) { return rgbToHex(wheelColor(deg)); } }, get theme() { return document.body.dataset.theme || 'dark'; }, get themeChoice() { return document.body.dataset.themeChoice || document.body.dataset.theme || 'dark'; }, placeElectron(px, py) { if (helium && helium.on) { helium.placeAt(unproject(px, py)); schedule(TIER.RECONSTRUCT); } }, launchPacket, get lastLaunch() { return lastLaunch; }, enterBox() { if (getHamiltonian().id !== 'well') { setHamiltonian('well'); switchHamiltonian('well'); if (ui.hamSeg) ui.hamSeg.set('well'); } enterBox(); }, coherentBounce() { coherentBounce(); }, get autoQ() { return autoQ; }, governor: { get on() { return gov.on; }, set on(v) { setGovernor(v); }, get drop() { return gov.drop; }, get median() { return gov.median; }, get changes() { return gov.changes; }, get parked() { return [...gov.parked.keys()]; }, get state() { return !gov.on ? 'off' : (gov.drop || gov.frostHeld) ? 'stepped-' + gov.drop + (gov.frostHeld ? '+frost' : '') : 'nominal'; }, get frostHeld() { return gov.frostHeld; }, get resolution() { return effectiveRes(); }, get work() { return perf.work; } }, maths: { get ok() { return maths.ok && scan.ok; }, get bow() { return maths.ok; }, get scan() { return scan.ok; }, call: (m) => maths.call(m) }, get keepFrames() { return keep.frames; }, setKeepFrames, packetCentroid(G = 24) { const c = reg.at(clock.t); return wellCentroid(c.re, c.im, reg.populated(), { G }); }, setIonZ(z) { setZ(z); switchHamiltonian('hydrogen'); if (ui.zKnob) ui.zKnob.set(z); }, get Z() { return getZ(); }, perf: { get mode() { return perf.mode; }, setMode: setPerfMode, get profile() { return perf.profile; }, get counts() { return perf.counts; }, /** the median of the loop's OWN main-thread ms over the last 60 frames — the budget-independent read of "is hidden cheaper?" */ get median() { const a = Array.from(perf.ring).filter((v) => v > 0).sort((x, y) => x - y); return a.length ? a[a.length >> 1] : 0; }, resetRing() { perf.ring.fill(0); } }, get keys() { return __LW_hooks.keys; }, bow: { start: (x, y) => bowStart({ clientX: x, clientY: y }), move: (x, y) => bowMove({ clientX: x, clientY: y }), release: () => bowRelease(), cancel: () => bowCancel(), get active() { return !!bow; }, get k() { return bow ? bow.k : 0; }, get dir() { return bow ? bow.dir : null; }, get landed() { return bowChain; }, get inFlight() { return bowInFlight > 0; } }, kickAlong(k, d) { slapAlong(k, d); }, setDamping(g) { reg.setDamping(g); touchState(); }, get hamiltonian() { return getHamiltonian().id; }, setHamiltonian(id) { switchHamiltonian(id); if (ui.hamSeg) ui.hamSeg.set(id); }, kick(k, axis = 'z') { if (__LW_hooks.slap) __LW_hooks.slap(k, axis); }, get space() { return space; }, setSpace(s) { if (s === 'p' && sturm.P) return false; space = s; if (ui.spaceSeg) ui.spaceSeg.set(s); schedule(TIER.REBUILD); }, get palette() { return palette; },
    loadPreset, schedule, togglePlay, setReference, serialize, restore, api,
    /* UNDO / REDO over the register side only — never the camera, the palette, the layout or the theme */
    get history() { return historyApi; },
    get mo() { return moPanel ? moPanel.api : null; },      /* W-MO: the general basis, the force line and the nuclei */
    /* W-WIGNER: the (z, p_z) slice — the last map computed (recomputed if the state has moved), its two ranges, its numbers */
    wigner: { slice() { return hydroReader().on ? wignerView.slice(reg, clock.t) : null; }, setRange(z, p) { return wignerView.setRange(z, p); },
      get stats() { return wignerView.stats; }, get zmax() { return wignerView.zmax; }, get pmax() { return wignerView.pmax; },
      get canvas() { return wignerView.canvas; }, table() { return wignerView.table(); } },
    /* W-RADIATION: the pair in force and what it radiates */
    radiation: { pair() { return hydroReader().on ? radiationView.pair(reg, clock.t, __LW_hooks.ab) : null; },
      get A() { const s = radiationView.stats; return s ? s.A : 0; }, get tau() { const s = radiationView.stats; return s ? s.tau : Infinity; },
      get power() { const s = radiationView.stats; return s ? s.P : 0; }, get stats() { return radiationView.stats; },
      get canvas() { return radiationView.canvas; }, table() { return radiationView.table(); } },
    atoms: atomsView, setElement, fillValence, get atomZ() { return HAMILTONIANS.atom.Z; }, get element() { return HAMILTONIANS.atom.element; },
    /* W-STURMIAN: the scale — on/off, λ, the eigen-decomposition {E, pop, l, m, n} (of c(t) when t is given, else the anchor), load eigenstate k, the S-norm ⟨c|S|c⟩ */
    sturmian: { set(on) { setSturmian({ on: !!on }); return sturm.on; }, setLambda(l) { setSturmian({ lambda: l }); return sturm.lambda; }, get on() { return sturm.on; }, get lambda() { return sturm.lambda; }, get active() { return !!sturm.P; },
      get buildMs() { return sturm.buildMs; }, get P() { return sturm.P; }, eigen(t) { return sturmEigen(t); }, select(k) { return selectEigen(k); },
      norm(t) { return sturm.P ? sturm.P.norm(t === undefined ? { re: reg.re0, im: reg.im0 } : reg.at(t)) : reg.norm2(); }, expect(a) { return sturm.P ? labelExpect(a) : reg.Ediag(a); }, get records() { return sturm.rec; } },
    rotateK(th) { reg.rotateK(th); touchState(); }, defectWait(a) { reg.defectWait(a); touchState(); },
    rotor(spec) { reg.rotor(spec); touchState(); },
    seedParticles(n = 160) { particles.setOn(true); const k = particles.seed(n, reg, clock.t, domain.half); schedule(TIER.PRESENT); return k; },
    play() { clock.play(performance.now() / 1000); schedule(TIER.EVOLVE); }, pause() { clock.pause(); schedule(TIER.PRESENT); },
    scrub(t) { clock.scrub(t); schedule(TIER.EVOLVE); }, step(dt) { clock.step(dt); schedule(TIER.EVOLVE); },
    setMute(a, on) { reg.setMute(a, on); touchState(); }, setView(v) { mat.view = VIEW[v]; ui.viewSeg.set(v); schedule(TIER.PRESENT); },
    orbit(dy, dp) { obs.yaw += dy; obs.pitch += dp; schedule(TIER.PRESENT); },
    setShadowMode(m) { shadowView.setMode(m); ui.shadowSeg.set(m); schedule(TIER.PRESENT); },
    /** GPU throughput at the current settings: ms per frame for reconstruct+present, reconstruct, present (n back-to-back frames) */
    async gpuFrameMs(n = 60) { if (!field.ok) return null; field.resize(quality.scale * (quality.auto ? quality.autoScale : 1)); const r = await field.throughput({ modes: modesAt(clock.t), obs, mat, n }); r.half = domain.half; return r; },
    stateDigest: () => reg.digest(), meters: meterSnapshot, modesAt,
    /** THE BUSY MARK (wave 48): a nesting counter.  begin()/end() bracket any work that can make the lab wait. */
    busy: { begin() { busy.n++; busySync(); return busy.n; }, end() { busy.n = Math.max(0, busy.n - 1); busySync(); return busy.n; },
      flash: busyFlash, wrap: busyWrap, get count() { return busy.n; }, get visible() { return busy.shown; },
      get moves() { return busy.moves; }, get host() { return busyHost(); },
      get at() { const h = busy.host; return h ? [h.style.getPropertyValue('--cx'), h.style.getPropertyValue('--cy')] : [null, null]; } },
    /** the photosensitivity notice: shown once per browser, remembered in the settings key, SETTINGS brings it back */
    get warning() { return warning; },
    get uiHidden() { return uiHidden; },
    /** the nine wheel samples every copy of the mark is painted from — the ABOUT face reads the same ones */
    paintMarks,
    cpuPsi(x, y, z) { const c = reg.at(clock.t); if (sturm.P) { let R = 0, I = 0; for (const a of reg.renderSet(RENDER_CAP).ids) { const v = orbitalFromTable(sturm.rec[a], x, y, z); R += c.re[a] * v.re - c.im[a] * v.im; I += c.re[a] * v.im + c.im[a] * v.re; } return { re: R, im: I }; } return psiAt(c.re, c.im, x, y, z, reg.renderSet(RENDER_CAP).ids); },   // W-STURMIAN: the kernel's CPU twin on the scaled records
    readPixels: () => field.ok ? field.readPixels(obs, mat) : null,
    /** the GPU chrome as the screen gets it: the box and the three axes rendered alone over the stage's ground */
    linePixels: (w, h) => field.ok ? field.linePixels(obs, mat, w, h) : null,
    lineColors: () => field.ok ? field.lineColors(mat) : null,
    fieldDigest: () => field.ok ? field.fieldDigest() : null,
    sampleVoxel: (i, j, k) => field.ok ? field.sampleVoxel(i, j, k) : null,
    /** resolves after the next frame has run (so a scheduled tier has been applied) */
    settle() { return new Promise((res) => { schedule(TIER.PRESENT); requestAnimationFrame(() => requestAnimationFrame(() => res(stats.frames))); }); },
    version: 'QWAVE-0.1 hydrogen shadow lab · FRONTIER · 2026-09-03'
  };
  window.__LW = LW;

  /* ── go ───────────────────────────────────────────────────────────────── */
  LW.bootView = VIEW_NAMES[mat.view]; LW.bootVortex = vortex.on; LW.bootOrder = layout.orderAll(); LW.bootClosed = layout.closed();   // the shipped defaults, recorded before a URL preset's visuals apply
  const q = new URLSearchParams(location.search);
  loadPreset(q.get('preset') && PRESET_BY_ID.has(q.get('preset')) ? q.get('preset') : '1s+2pz');
  mat.view = VIEW.phase; if (ui.viewSeg) ui.viewSeg.set('phase'); schedule(TIER.PRESENT);   // the shipped observable is arg ψ (Josh); a preset picked later still brings its own visuals
  if (q.get('view') && VIEW[q.get('view')] !== undefined) { mat.view = VIEW[q.get('view')]; ui.viewSeg.set(q.get('view')); }
  if (q.get('play') === '1') LW.play();
  Object.assign(DIGESTS, {
    meters: () => 'density period\t' + (() => { const P = __LW_hooks.period ? __LW_hooks.period() : null; return P && P.exact && P.T ? P.T.toFixed(6) + ' a.u. (exact)' : P && P.T ? '≈ ' + P.T.toFixed(3) + ' a.u. (no exact period)' : '—'; })() + '\nframe profile (ms, EMA)\n' + Object.entries(perf.profile).map(([k, v]) => k + '\t' + (+v).toFixed(3)).join('\n') + '\nframes\t' + stats.frames + '\nreconstructs\t' + stats.reconstructs + '\npresents\t' + stats.presents,
    calculus: () => calculus && calculus.stats ? JSON.stringify(calculus.stats, null, 1) : '',
    vortex: () => vortex.last && vortex.last.points ? 'nodal points (x, y, z)\n' + vortex.last.points.map((p) => [p.x, p.y, p.z].map((v) => (+v).toFixed(5)).join('\t')).join('\n') : '',
    spectrum: () => { const c = reg.at(clock.t), H = getHamiltonian(); return 'label\tE\t|c|²\targ c\n' + reg.populated().map((a) => H.labelOf(BASIS[a]) + '\t' + H.energy(a).toFixed(6) + '\t' + (c.re[a] ** 2 + c.im[a] ** 2).toFixed(6) + '\t' + Math.atan2(c.im[a], c.re[a]).toFixed(5)).join('\n')
      + (sturm.P ? (() => { const e = sturmEigen(); return '\n\nSTURMIAN λ = ' + sturm.lambda.toFixed(4) + ' · Z = ' + getZ() + ' · ⟨c|S|c⟩ = ' + e.norm.toFixed(6) + ' · ⟨H⟩ = ' + e.energy.toFixed(6) + '\neigenvalue\tpopulation\t(l, m)\n' + e.E.map((E, k) => E.toFixed(6) + '\t' + e.pop[k].toFixed(6) + '\t' + 'spdfgh'[e.l[k]] + (e.m[k] >= 0 ? '+' : '-') + Math.abs(e.m[k])).join('\n'); })() : ''); },
    atoms: () => atomsView.digest(),
    wigner: () => wignerView.table(),
    radiation: () => radiationView.table(),
    field: () => fieldlines.table(),
    molecule: () => (moPanel ? moPanel.table() : ''),
    shadow: () => { const c = reg.at(clock.t); return 'label\tq\tp\n' + reg.populated().map((a) => getHamiltonian().labelOf(BASIS[a]) + '\t' + (c.re[a] * Math.SQRT2).toFixed(6) + '\t' + (c.im[a] * Math.SQRT2).toFixed(6)).join('\n'); },
  });
  layout.moveToRack('spectrum', 'L'); spectrum.openPicker(true);                    // the official layout (Josh): SPECTRUM on the left, MODE open
  applySettings(); rack.appendChild(ui.set.root);

  /* ── THE PHOTOSENSITIVITY WARNING (wave 48, Josh) ─────────────────────────
   * "Copy the text, design, layout, symbol, function from 'Mandelbrot' into this app… Let this be an entire frost
   * glass transparent background to the current app when it loads (since Lambdawaves doesn't have a main menu) and
   * let the text color (black or white) be whatever the user's last Light/Dark/Default setting is."
   *
   * The text, the caution triangle, the 34em card, the focus trap and the CONTINUE button are MANDELBROT's warn.js,
   * carried over unchanged.  Three things are ours, and each is Josh's instruction:
   *   GROUND   — MANDELBROT paints solid #000 because its pane stands in front of a MENU.  λWAVES has no menu, so
   *              the lab is already running underneath and the pane is frost glass over it (lab.css §48f).
   *   INK      — black or white by the RESOLVED theme, so LIGHT, DARK and SYSTEM all reach it, live.
   *   MEMORY   — MANDELBROT deliberately shows on every cold start.  Ours is remembered in the settings key and
   *              brought back by SETTINGS · SHOW THE WARNING AGAIN, which is why that row exists.
   * The automation bypass is MANDELBROT's too (navigator.webdriver, ?warn=0, ?warn=1): a modal over the lab would
   * otherwise stand in front of every screenshot the gate takes.  A driver can still force it with ?warn=1. */
  const warning = (() => {
    const pane = document.getElementById('warnPane');
    const seen = () => readSettings().warned === true;
    const remember = (v) => { const S = readSettings(); try { localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...S, warned: v })); } catch (e) {} };
    let open = false, prevFocus = null, offKey = null;
    function dismiss() {
      if (!pane || !open) return false;
      open = false; remember(true);
      if (offKey) { document.removeEventListener('keydown', offKey, true); offKey = null; }
      pane.classList.add('warn-out');
      let done = false;
      const gone = () => { if (done) return; done = true; pane.hidden = true; pane.classList.remove('warn-out'); if (prevFocus && prevFocus.focus) { try { prevFocus.focus(); } catch (e) {} } prevFocus = null; };
      pane.addEventListener('transitionend', gone, { once: true }); setTimeout(gone, 380);
      return true;
    }
    function show() {
      if (!pane || open) return false;
      open = true; prevFocus = document.activeElement;
      pane.hidden = false; pane.classList.remove('warn-out');
      const btn = pane.querySelector('.warn-btn');
      /* the trap is MANDELBROT's: Tab cannot leave, Enter and Space fire, and there is no Escape and no
         click-outside — the only way past a photosensitivity notice is to read it and press the button */
      offKey = (e) => { if (!open) return; if (e.key === 'Tab') { e.preventDefault(); btn && btn.focus(); } else if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') { if (document.activeElement === btn || document.activeElement === pane) { e.preventDefault(); dismiss(); } } e.stopPropagation(); };
      document.addEventListener('keydown', offKey, true);
      if (btn) { btn.focus(); requestAnimationFrame(() => { if (open) btn.focus(); }); }
      return true;
    }
    if (pane) { const b = pane.querySelector('.warn-btn'); if (b) b.addEventListener('click', dismiss); }
    /* the gate, with its three inputs nameable so a test can ask the question without a reload:
       ?warn=1 forces, ?warn=0 skips, an automation driver skips (a modal would stand in front of every
       screenshot the gate takes), and otherwise it is exactly "has this browser been told yet". */
    function needed(o) {
      const q = new URLSearchParams((o && o.query !== undefined) ? o.query : location.search);
      const driver = (o && o.driver !== undefined) ? o.driver : navigator.webdriver === true;
      if (q.get('warn') === '1') return true;
      if (q.get('warn') === '0') return false;
      if (driver === true) return false;
      return !seen();
    }
    return { show, dismiss, needed, reset() { remember(false); return true; }, get seen() { return seen(); },
      get remembered() { return seen(); }, get open() { return open; } };
  })();
  __LW_hooks.warning = warning;
  if (warning.needed()) warning.show();
  if (palette && palette.repaint) requestAnimationFrame(() => palette.repaint());   // the strip sat in a zero-size card when first painted
  history.clear();                    // the shipped boot (and a ?preset= in the URL) is the BOTTOM of the stack, not a step in it
  /* ONE FULL TURN ON BOOT (Josh: "Also have the logo rotate 360").  It rests at 45° — that angle lives in the <g>
     inside the SVG, so the element's own transform rests at none and the class can be taken off again cleanly. */
  { const m = document.querySelector('#title .mark');
    if (m) { m.classList.add('spin'); const off = () => m.classList.remove('spin'); m.addEventListener('animationend', off, { once: true }); setTimeout(off, 1600); } }
  busyHost();                         // the mark is cloned and painted before anything can need it
  LW.ready = true;
  return LW;
}
