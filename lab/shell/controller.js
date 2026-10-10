/* lab/shell/controller.js — ONE CONTROLLER, FIELD, THE MATHS WORKERS and ONE ROAD (0.5.2 R1 "Rack Dissolution"; moved verbatim out of
 * lab/rack.js boot() §2–§4 and §7).  createController(app) runs at §2's seat — boot() awaits it, because it awaits createField — and
 * hands back every name another part of boot() reads; boot() destructures them there, so the frame loop (§5–§6, which STAYS in boot())
 * reads them as closure slots exactly as before.  What it reads of boot(): §0's consts and §1's lookSync / quality, handed over at the top
 * (backward); the loop's schedule and refModes (by value in app.loop); and, lazily inside callbacks, the names boot() makes after the
 * seat — app.loop.page / windowActivity / paceRate, app.w.wMet / wSpec / spectrum / shadowView / normalizeNow (boot fills each slot right
 * after its declaration).  Its 29 shared lets are app.state's, read and written live (R0).  saveMod stays a function declaration: the
 * mod port is handed it before its line (U1).  TIER is rack.js' own export; the cycle is safe — it is read only inside createController,
 * long after both modules have run. */
import { TIER } from '../rack.js';
import { BASIS } from '../hydrogen.js';
import { PRESET_BY_ID } from '../state.js';
import { createFrameBudget } from '../frame-budget.js';
import { createOcclusion } from '../occlusion.js';   // 0.5.0 A7: the occlusion providers (KIT BRIEF 8's twin)
import { createField, VIEW } from '../field.js';
import { PRESET_BY_ID as PALETTE_BY_ID, rgbToHex } from '../mir/palette.js';
import { warmStep as kickWarm, tablesReady as kickReady } from '../kick.js';
import { getHamiltonian } from '../hamiltonian.js';
import { mdText } from '../latex-state.js';
import { localStore } from '../mir/modulation/bind.js';          // 0.5.0 C4: the kit's modulation record (the power and the cadence)
import { jsonStore } from '../mir/core/prefs.js';                // 0.5.1 D10-24: and its record, `lambdawaves.q0.curves` (PREFERENCE)
import { createModPort } from '../mod-port.js';       // 0.5.0 A5: the port that window takes, and the edges behind it
import { createBusyMark } from '../busy-mark.js';        // N7 seam 2: the busy mark, out of boot()
import { createWorkerPool } from '../worker-pool.js';    // N7 seam 3: the maths workers, out of boot()
import { createLook } from '../look.js';    // 0.5.0 C2: the look is the kit's — mir.gui (createPrefs over LOOK_SCHEMA rows) and createAccent (once N7 seam 4, accent-wheel.js)

export async function createController(app) {
  const { dom, ui, reg, clock, appPlay, mat, rates, energyOf, sturm, settingsStore, PAL_DEF, LOOK_DEFAULTS } = app;   // §0, by value
  const { lookSync, quality } = app.sh;   // §1's, filled at their declarations
  const { schedule, refModes } = app.loop;   // the loop's hoisted functions, by value in the literal
  /* ── ONE CONTROLLER (wave 128; AUTO SCALE's one rule AS 2026-09-25 + the GOVERNOR of wave 45, merged) ─────────────────────
     ONE measurement: the MEDIAN of the presented-frame intervals in a window of one running loop (the loop is paced, so rAF
     is honest on every browser).  ONE decision, once ≥ 250 ms and ≥ 6 presented frames have passed, against the frame budget
     (60 Hz in FULL, the observed cadence up to 120 Hz in 120 mode); the window restarts after every decision.  Its levers:
     SCALE (the AUTO SCALE switch): outside [budget·1.08, budget·4/3] jump ONCE to the scale that meets the target (the present
       costs ∝ scale²: scale·√(target/median), ×0.5…×1.15) on the 0.05 grid, rounded toward the current scale, then HOLD — each
       step reallocates the canvas (a stall on WebKit), and at vsync the interval cannot show headroom, so it never probes up.
     GRID (the GOVERNOR switch, while playing, above 64³, and only from the scale's own probe — with AUTO SCALE off it never
       steps): one rung down (128 → 96 → 64, the rebuild road) when the DESCENT the scale made did not lower the median as scale²
       predicts (median > m0·(s/s0)² + budget: a vsync-quantised present-bound frame misses its prediction by less than one
       refresh ≤ one budget, so only a reconstruct-bound frame fails it), or reached the floor still over.  The scale then
       returns to what the present measured on that descent can afford.  No rung comes back while playing.
     READERS (the GOVERNOR switch): the reader law below, by measured cost.
     THE PAUSE EDGE (W125-2, one place, in the loop): the user's grid and a scale of 1 come back at once with one frame, and the
     window restarts — the play's intervals are not the still picture's.  quality.res stays the USER's (and the project's);
     gov.drop is this browser's, never serialised.  (The step rung ×0.7/×0.5 of 2026-09-10 is gone: it only ever helped a
     present-bound frame, which the scale mends for less, and on a compute-bound one it stacked on the scale — AUDIT-A FA4.) */
  const autoQ = { presented: 0, sinceMs: 0, k: 0, iv: new Float64Array(32), lastMs: 0, changes: 0, m0: 0, s0: 1 };   // m0/s0: the median and scale where the current descent began
  function controlStep(w, nowMs, scale, minScale, budgetMs, auto, gridFree) {   // null until due, else { median, scale, rung }
    if (w.presented < 6 || nowMs - w.sinceMs < 250) return null;
    const n = Math.min(w.k, w.iv.length), ms = n > 2 ? w.iv.subarray(0, n).sort()[n >> 1] : 0;   // sorts the window in place: it restarts after every decision
    const over = ms > budgetMs * 4 / 3, failed = w.m0 > 0 && ms > w.m0 * (scale / w.s0) ** 2 + budgetMs;   // failed: the descent did not buy what scale² promised
    if (auto && gridFree && (failed || (over && scale <= minScale))) {
      const P = w.m0 > ms ? (w.m0 - ms) / (w.s0 * w.s0 - scale * scale) : 0;   // the present's cost at scale 1, as the descent measured it
      return { median: ms, rung: true, scale: w.m0 > 0 ? Math.max(scale, P > 0 ? Math.min(1, Math.floor(20 * Math.sqrt(budgetMs / P) + 1e-9) / 20) : 1) : scale };
    }
    if (!auto || (!over && !(ms > 0 && ms <= budgetMs * 1.08))) return { median: ms, rung: false, scale };
    const x = 20 * scale * Math.min(1.15, Math.max(0.5, Math.sqrt((over ? budgetMs : budgetMs * 1.08) / ms)));
    return { median: ms, rung: false, scale: Math.min(1, Math.max(minScale, (over ? Math.ceil(x - 1e-9) : Math.floor(x + 1e-9)) / 20)) };
  }
  app.state.playedLast = false;          // W125: was the transport playing on the last frame the loop ran?  The pause EDGE is playedLast && !playing
  const RES_LADDER = [64, 96, 128];
  const gov = { on: true, drop: 0, median: 0, changes: 0, scroll: 0, parked: new Map(), probes: 0, probeFrame: -1 };


  const effectiveRes = () => { if (!gov.drop) return quality.res; let i = RES_LADDER.findIndex((r) => r >= quality.res); if (i < 0) i = RES_LADDER.length - 1; return RES_LADDER[Math.max(0, i - gov.drop)]; };
  const READER_LAW = { park: 16, slow: 6, parkDrop: 8, slowDrop: 3, probeMs: 3000 };   // ms per update: parked while playing / slowed to every 6 × cost — and the tighter pair once stepped down


  const keep = { frames: false };
  const domain = { auto: true, half: 7 };
  const fieldRate = { capMs: 0 };
  /* PERFORMANCE: 'full' updates every CPU window every frame; '120' updates them every 4th frame (≈30 Hz at 120 Hz)
     while the FIELD still presents every frame — the picture never waits for a readout.  The profile is an EMA of
     the milliseconds each stage costs per frame, so the mode is chosen on numbers, not on faith. */
  const perf = { mode: '120', cpuEvery: 4, profile: { total: 0, field: 0, spectrum: 0, shadow: 0, orbit: 0, vortex: 0, particles: 0, kepler: 0, slice: 0, calculus: 0, meters: 0, badges: 0, atoms: 0, wigner: 0, radiation: 0 }, counts: { frames: 0, cpu: 0 }, ring: new Float64Array(60), work: {}, wall: {} };   // work: an EMA of the cost of the updates that DID work (≥ 1 ms), wall: when the last one ran
  const frameBudget = createFrameBudget();
  const perfBudgetMs = () => frameBudget.milliseconds(perf.mode);
  const tick = (name, fn) => { const a = performance.now(); fn(); const d = performance.now() - a; perf.profile[name] = perf.profile[name] * 0.9 + d * 0.1; if (d >= 1) { perf.work[name] = perf.work[name] ? perf.work[name] * 0.7 + d * 0.3 : d; perf.wall[name] = a; } };
  /** THE READER LAW (wave 45).  While the transport PLAYS and the governor is on, a window whose update was measured over
      a frame's budget is PARKED — it runs on pause or edit, and its status says so — one over half a frame runs at most
      every 6 × its cost, and the rack's own scroll makes every reader yield for 150 ms.  Paused, every reader runs on
      every frame exactly as before, so nothing a proof reads after settle() has changed.  The SLICE was the case: a 128²
      resample of every populated mode, 20–100 ms each at 8 Hz — every hitch of the idle histogram, and 134 ms per call
      after a bow (wave 45's measurements). */
  app.state.uiHidden = false;
  const READERS = {};
  function may(name, w) {
    if (w && !app.loop.windowActivity.canPresent(w)) return false;
    if (!clock.playing || !gov.on) { if (gov.parked.has(name)) unpark(name, w); return true; }
    const now = performance.now();
    if (now - gov.scroll < 150) return false;
    const cost = perf.work[name] || 0, park = gov.drop ? READER_LAW.parkDrop : READER_LAW.park, slow = gov.drop ? READER_LAW.slowDrop : READER_LAW.slow;
    /* THE RE-PROBE (wave 50).  A parked reader never runs, so its cost is never measured again, so it stays parked
       for the whole session even after the thing that made it dear has gone (a one-off hitch during its measurement,
       a smaller state, a window that got cheaper, a governor notch that made every reader cheaper).  Once every
       PROBE_MS it is let through ONCE: perf.work is cleared first, so tick() writes a FRESH measurement rather than
       nudging a stale EMA (and a probe under 1 ms writes nothing at all, which reads as free).  The next may() then
       unparks it on the new number, or parks it again on the old one.  PROBE_MS = 3 s was the old governor's recovery
       cadence (3 s under budget lifted a grid notch): one probe of an over-budget reader costs at most its own frame,
       so the price of asking is under 1 % of the wall even for a 30 ms reader, and a window that came back under
       budget is live again within one cadence of the edit that freed it. */
    if (gov.parked.has(name)) { const p = gov.parked.get(name); if (now - p.probe >= READER_LAW.probeMs && gov.probeFrame !== perf.counts.frames) { gov.probeFrame = perf.counts.frames; p.probe = now; p.probes++; gov.probes++; perf.work[name] = 0; return true; } }   // ONE probe per frame: the law exists so that no frame carries two readers over budget, and a probe is a reader over budget
    if (cost > park) { if (!gov.parked.has(name)) parkReader(name, w, cost); return false; }
    if (gov.parked.has(name)) unpark(name, w);
    if (cost > slow && now - (perf.wall[name] || 0) < Math.max(250, 6 * cost)) return false;
    return true;
  }
  function parkReader(name, w, cost) {
    const st = w && w.root ? w.root.querySelector('.dev-stat') : null, prev = st ? st.textContent : '', cls = st ? st.className : 'dev-stat';
    const note = (prev ? prev + ' · ' : '') + 'PARKED by the GOVERNOR: ' + cost.toFixed(0) + ' ms per update — runs on pause or edit';
    gov.parked.set(name, { prev, cls, note, cost, pop: reg.populated().length, probe: performance.now(), probes: 0 }); if (w && w.setStatus) w.setStatus(note, 'warn');
  }
  function unpark(name, w) {
    const p = gov.parked.get(name); gov.parked.delete(name); perf.work[name] = 0;      // re-measured on its next update
    if (p && w && w.root) { const st = w.root.querySelector('.dev-stat'); if (st && st.textContent === p.note) { w.setStatus(p.prev); st.className = p.cls; } }
  }
  function setGovernor(v) {
    gov.on = !!v; if (ui.govSw) ui.govSw.set(gov.on);
    if (!gov.on) { gov.drop = 0; for (const name of [...gov.parked.keys()]) unpark(name, READERS[name]); schedule(TIER.REBUILD); }
  }
  function setKeepFrames(v) {
    keep.frames = !!v; if (ui.keepSw) ui.keepSw.set(keep.frames);
    if (!ui.scrub) return;
    const r = ui.scrub.root; r.classList.toggle('disabled', !keep.frames); r.style.opacity = keep.frames ? '' : '.35'; r.style.pointerEvents = keep.frames ? '' : 'none';
    r.tabIndex = keep.frames ? 0 : -1; r.setAttribute('aria-disabled', String(!keep.frames));   // wave 62: a control the pointer cannot reach must not be reachable by Tab either
    r.title = keep.frames ? '' : 'Enable KEEP FRAMES to animate the playhead';
    if (!keep.frames) ui.scrub.set(0);
    schedule(TIER.PRESENT);
  }
  function setPerfMode(m) {
    perf.mode = m === '120' ? '120' : 'full';
    perf.cpuEvery = perf.mode === '120' ? 4 : 1;
    autoQ.presented = autoQ.lastMs = 0;
    frameBudget.breakSequence();
    if (ui.perfSeg) ui.perfSeg.set(perf.mode);
  }
  const stats = { frames: 0, presents: 0, skipped: 0, reconstructs: 0, evolves: 0, rebuilds: 0, tiers: { PRESENT: 0, RECONSTRUCT: 0, EVOLVE: 0, REBUILD: 0 }, lastTier: 'NONE', scheduled: false, fps: 0, reconPerSec: 0, stepsPerSec: 0, lastEncodeMs: 0, fieldT: 0 };
  const cRe = new Float64Array(91), cIm = new Float64Array(91);
  app.state.pointerHeld = false;       // a gesture is in flight: the expensive per-frame readouts wait it out (see periodNow)
  app.state.keplerDirty = true; app.state.govVersion = -1; app.state.metersWall = 0; app.state.badgesWall = 0;   // wave 45: the KEPLER canvas is drawn only while on (one clearing draw after), the parked readers re-run on an edit, METERS repaints at 10 Hz while playing
  app.state.applyVisuals = true;
  /* WAVE 52 · W-MODWINDOW.  The modulation host (lab/mir) and its face.  Declared HERE, beside the
     scheduler's own state, because the frame loop drives the modulation clock and must be able to
     guard on it before the window that shows it has been built.  0.5.0 A5: the port is lab/mod-port.js. */
  app.state.modHost = null; app.state.modView = null; app.state.modWall = 0; app.state.modExpOn = null; app.state.dodge = null; app.state.tl = null; app.state.filmCard = null;   // C7b: the pill's dodge (both kit windows) · the TIMELINE · the RENDER card
  const mod = createModPort({ available: () => field.ok, present: () => schedule(TIER.PRESENT), view: () => app.state.modView, onCapture: (c) => { app.state.audioCap = c; }, save: saveMod, say: (t) => app.w.wMet.setStatus(t, t ? 'warn' : '') });   // 0.5.1 D10-19: the flash guard's one line, METERS' status
  const { setKnob, hand: modHand, syncBases: modSyncBases, feedAudio, cadence: MOD, knobs: modKnobs, gets: modGets, held: modHeld } = mod;   // the hand / base / modulated law, the feed, the cadence, the maps
  appPlay.onChange((on) => mod.follow(on));   // 0.5.0 C4 (R-B1): ONE clock — every play edge, the power on or off, holding the app-play demand while it plays
  app.state.feedMs = 0;                      // wave 105: the SMOOTHED feed interval, ms — see the pump


  const ROT_LIMIT = { z: 2 * Math.PI, kz: 2 * Math.PI, def: Math.PI };
  const rotRate = { z: 0, kz: 0, def: 0 };            // rad/s.  THE ANGLE IS NOT STORED AND NEVER WILL BE.
  const rotDriving = () => rotRate.z !== 0 || rotRate.kz !== 0 || rotRate.def !== 0;
  /* S4 · THE RING'S `driven` IS "THE DRIVE MOVED THE REGISTER ON ITS LAST TICK", not "a rate is set": ROTATE z on an m = 0 state
     turns nothing, and a set rate froze the ring over every edit (probes/S3-verify/rotdrive.mjs).  NOT "and the clock plays": the
     drive integrates on the modulation tick's wall clock, and a paused 2p_x keeps turning (probes/S4/rot-paused.js).  The drive's
     own version bumps note nothing (rotTicking): its stop notes 'rotation drive', once. */
  app.state.rotMoved = false; app.state.rotTicking = false;
  function setRotationRate(key, value) {
    if (!(key in ROT_LIMIT) || !Number.isFinite(value)) return false;
    const v = key !== 'z' && sturm.P ? 0 : Math.max(-ROT_LIMIT[key], Math.min(ROT_LIMIT[key], value));
    if (rotRate[key] === v) return v;
    rotRate[key] = v;
    const k = key === 'z' ? ui.rotZRate : key === 'kz' ? ui.kzRate : ui.defRate;
    setKnob(k, v);
    if (!rotDriving()) { app.state.rotMoved = false; if (app.state.history) app.state.history.note('rotation drive'); }
    schedule(TIER.PRESENT);
    return v;
  }
  /** One tick applies each exact operator in z, K_z, L² order. Simultaneous noncommuting
   * drives use this ordered splitting; no claim of a joint closed-form exponential is made. */
  function rotStep(dt) {
    if (dt <= 0 || !rotDriving()) return false;       // the whole cost of a still instrument
    /* W-STURMIAN: K_z and L² are moves inside a COULOMB shell.  Under the Sturmian propagator
       state.js's _op takes its non-commuting branch and would apply them at time t under a scale
       whose shells are not n²-fold degenerate — which is why the two jog wheels already stand down
       (applySturmian).  Their RATES stand down on the same line, in the SETTER as well as here, so
       a modulated rate cannot creep past a disabled dial.  ROTATE z survives: m is still m. */
    const az = rotRate.z * dt, ak = sturm.P ? 0 : rotRate.kz * dt, ad = sturm.P ? 0 : rotRate.def * dt;
    if (az === 0 && ak === 0 && ad === 0) return false;
    const d0 = reg.digest(); app.state.rotTicking = true;
    if (az !== 0) reg.rotateZ(az);
    if (ak !== 0) reg.rotateK(ak);                    // ≤ 35 blocks of ≤ 6×6 symEig, unpopulated ones skipped
    if (ad !== 0) reg.defectWait(ad);
    app.state.rotTicking = false; app.state.rotMoved = reg.digest() !== d0;
    touchState();                                     // ONE schedule for all three, not three
    return true;
  }
  app.state.audioCap = null;   // wave 102: THE ONE MICROPHONE, built lazily by the port on a MIC press (never by adding a device); read by the loop and setPageHidden


  app.state.modArm = true;
  const modStore = localStore('lambdawaves.q0.modulation');   // 0.5.0 C4: { modArm, modCadence }, PREFERENCE (docs/STATE-SCOPES.md)
  function saveMod() { modStore.write({ modArm: app.state.modArm, modCadence: MOD.hz }); }
  const curvesStore = jsonStore('lambdawaves.q0.curves');   // 0.5.1 D10-24: the CURVES card's screen grade (the model's serialize()), PREFERENCE (docs/STATE-SCOPES.md); FORGET removes it
  app.state.occludeDirty = true; app.state.occludeAt = 0;    // INK UNDER GLASS: the window rectangles the line pass skips; refreshed at the top of a frame, before any DOM write
  const occlusion = createOcclusion(() => { app.state.occludeDirty = true; schedule(TIER.PRESENT); });   // 0.5.0 A7: dirty() is the one producer (a PRESENT even while paused)
  app.state.stageMix = 0.04; app.state.stageFollow = true;   // STAGE: 0 = theme, 1 = chosen colour; FOLLOW THEME bypasses the mix without erasing either setting
  app.state.refSnapshot = null;        // { re, im, ids } — the DIFF reference state
  app.state.pendingRef = null;


  /* 0.5.0 C2 · THE LOOK (lab/look.js): the kit's store `mir.gui` over LOOK_SCHEMA rows and its accent engine, applied at once —
     before a single window is built, so the FIRST paint is already this browser's glass.  The theme's engine side (the stage
     ground, the GPU chrome, the browser's bar) is __LW_hooks.theme, which the SETTINGS block registers. */
  const look = createLook({ settings: settingsStore, defaults: LOOK_DEFAULTS, mat, wheelStops: PALETTE_BY_ID.get(PAL_DEF).stops,
    getModView: () => app.state.modView, onTheme: (t, choice) => { if (app.hooks.theme) app.hooks.theme(t, choice); } });
  const { accent, applyAccent, paintMarks, markBatchBegin, markBatchEnd, stageGround, inkCtx } = look, { wheelColor, markInk } = accent;
  look.prefs.subscribe(lookSync);
  const { busy, busyHost, busySync, busyFlash, busyWrap, cardLoading } = createBusyMark({ paintMarks, markBusy: accent.busy });   // N7 seam 2: lab/busy-mark.js

  /* ── FIELD ────────────────────────────────────────────────────────────── */
  /* WAVE 59 · `onLost` WAS NEVER PASSED, and field.js has offered it since it was written: `device.lost`
     flips `field.ok` to false and, with no handler, TELLS NOBODY.  A driver reset, a backgrounded mobile tab
     whose GPU is reclaimed, a laptop switching cards — the rack goes on working, the readouts go on updating,
     and the picture is frozen with no explanation.  That is the most likely failure on a phone and it is the
     one this app was silent about.  0.5.0 C9 · R14: this is λWAVES' GPU RECOVERY, `gpuRecovery` (gate: tests/gpu-recovery).
     0.5.0 C6b: the banner is the kit's (main.js installBanner, dom.banner: its pane, its ×, its ink on both themes). */
  const field = await createField(dom.canvas, { resolution: quality.res,
    onError: (m) => dom.banner.fail('GPU error', m),
    onLost: function gpuRecovery(i) { dom.banner.fail('the GPU device was lost', ((i && i.message) || 'the browser took the WebGPU device back') + ' — the FIELD is frozen where it stands. RELOAD to bring it back; SPECTRUM, SHADOW and METERS are still live and the state is untouched.'); } });
  if (field.ok) look.setGamut((rgb) => (field.gamut === 'srgb' ? rgbToHex(rgb) : 'color(display-p3 ' + field.gamutInk(rgb).map((v) => v.toFixed(4)).join(' ') + ')'));   // wave 54: one map, both sides
  /* M1 (2026-09-24): a device lost before createField finished has already put up onLost's own banner (the GPU device
     was lost … RELOAD); "WebGPU unavailable" over it would be the wrong sentence, so that one road keeps its banner. */
  if (!field.ok && !/^device lost/.test(field.error || '')) dom.banner.warn('WebGPU unavailable', field.error + '. The FIELD needs WebGPU; SPECTRUM, SHADOW and METERS still run on the CPU.');
  markBatchBegin();                   // M7: the boot's build is one synchronous task from here to busyHost() at its tail — one mark paint, there
  /* ── THE MATHS WORKERS (wave 45): lab/worker-pool.js (N7 seam 3) — bow · period · cards · chem, and the two card roads.
     The constructor is the one literal worker road in the lab, so it stays here. ── */
  const { maths, scan, cards, solveCard, solveChem } = createWorkerPool({ busyWrap,
    spawn: () => new Worker(new URL('../mathworker.js', import.meta.url), { type: 'module' }) });
  /* …and on this thread too (the K key and the IMPULSE trigger are synchronous). This used to spend 8 ms every
     40 ms beginning 1.5 s after boot: a deliberate 20% main-thread tax during the exact interval an iPad was
     trying to settle its first field. Warm in short idle slices instead, after the first-use path is stable. */
  app.state.warmTimer = 0; app.state.warmIdle = 0; let workerWarmStarted = false;
  const cancelWarm = () => {
    if (app.state.warmTimer) { clearTimeout(app.state.warmTimer); app.state.warmTimer = 0; }
    if (app.state.warmIdle && globalThis.cancelIdleCallback) { cancelIdleCallback(app.state.warmIdle); app.state.warmIdle = 0; }
  };
  const warmKick = (deadline) => {
    app.state.warmTimer = app.state.warmIdle = 0; if (app.loop.page.hidden) return;
    const room = deadline && deadline.timeRemaining ? deadline.timeRemaining() : 3;
    /* The worker graph used to load during boot. Its speculative table now starts only in real idle time and does
       not raise the cursor busy mark; the first user-requested bow still starts the same worker immediately. */
    if (!workerWarmStarted && maths.ok && !clock.playing && room >= 1) { workerWarmStarted = true; maths.raw({ op: 'warm', ham: 'hydrogen', Z: 1 }); }
    if (!kickReady() && !clock.playing && room >= 1) kickWarm(Math.min(4, Math.max(1, room - 1)));
    /* LA5 · NOTHING LEFT TO WARM, SO NOTHING IS ARMED.  This used to re-arm every 2 s forever — a timer and an idle
       callback per tick on a paused, untouched instrument (AUDIT-B FB9, AUDIT-F F15).  The tables are keyed on the
       Hamiltonian in force (kick.js tablesReady), so switchHamiltonian — the one funnel of every OPERATOR, Z, ELEMENT,
       LAUNCH, restore and undo change — re-arms the chain; the resume road re-arms it too (warmArm(60)). */
    if (kickReady() && (workerWarmStarted || !maths.ok)) return;
    warmArm(kickReady() ? 2000 : clock.playing ? 750 : 120);
  };
  const warmArm = (ms) => {
    cancelWarm();
    app.state.warmTimer = setTimeout(() => {
      app.state.warmTimer = 0;
      if (globalThis.requestIdleCallback) app.state.warmIdle = requestIdleCallback(warmKick, { timeout: 1500 });
      else warmKick(null);
    }, ms);
  };
  warmArm(3000);

  /* ── state mutations: ONE road (finger, key, test, restore all come here) ─ */
  app.state.lastNmax = 1;
  function touchState() {
    const nm = reg.nmax();
    if (domain.auto && nm !== app.state.lastNmax) { app.state.lastNmax = nm; schedule(TIER.REBUILD); }
    else schedule(TIER.RECONSTRUCT);
  }
  /** a preset into the atom register.  `opt.hand` is the PRESS (the STATE select and RELOAD): only a hand's preset is
   *  announced on the stage (0.4.0 S3 · F2) — the boot, a URL preset, a test, a restore or an undo say nothing */
  function loadPreset(id, opt) {
    const p = PRESET_BY_ID.get(id); if (!p) return false;
    if (opt && opt.hand && app.state.stageText) app.state.stageText.announce(mdText(p.label));   // the label as text: markdown's specials escaped
    for (const key of Object.keys(rotRate)) setRotationRate(key, 0);
    reg.load(p); clock.reset(); app.state.lastNmax = -1;
    clock.window = p.visual.window;
    if (app.state.applyVisuals) { clock.setRate(app.loop.paceRate(p.visual.rate)); mat.view = VIEW[p.visual.view]; ui.viewSeg.set(p.visual.view); ui.rateKnob.set(clock.rate); }   // wave 57: a rate NOBODY CHOSE is paced by the motion preference
    ui.presetSel.value = id; ui.presetNote.textContent = p.note;
    setReference();
    app.w.spectrum.select(-1);
    app.w.shadowView.clearTrail();
    ui.scrub.set(0);
    schedule(TIER.REBUILD);
    return true;
  }
  function setReference() {
    const c = reg.at(clock.t);
    app.state.refSnapshot = { re: Float64Array.from(c.re), im: Float64Array.from(c.im), ids: reg.populated(), t: clock.t, digest: reg.digest() };
    app.state.pendingRef = refModes(); schedule(TIER.PRESENT);
  }
  const api = {
    reg,
    select(a) { app.w.spectrum.select(a); schedule(TIER.PRESENT); },
    toggleMode(a) {
      if (reg.population(a) > 0) { reg.set(a, 0, 0, clock.t); }
      else { const pop = reg.populated(); let amp = 1; if (pop.length) { amp = 0; for (const b of pop) amp += Math.sqrt(reg.population(b)); amp /= pop.length; } reg.set(a, amp, 0, clock.t); }
      touchState();
    },
    /** 2026-10 · the PAINT stroke's batch (lab/paint-stroke.js on SPECTRUM's grid): add ⇒ every listed state not populated
     *  joins at the mean |c| of those that were (toggleMode's rule, read ONCE before the stroke adds), phase 0; remove ⇒
     *  each populated one goes to c = 0.  One touchState() however many states it covers. */
    paintModes(list, add) {
      let n = 0, amp = 1;
      if (add) { const pop = reg.populated(); if (pop.length) { amp = 0; for (const b of pop) amp += Math.sqrt(reg.population(b)); amp /= pop.length; } }
      for (const a of list) {
        if (!(a >= 0) || a >= BASIS.length) continue;
        const on = reg.population(a) > 0;
        if (add && !on) { reg.set(a, amp, 0, clock.t); n++; } else if (!add && on) { reg.set(a, 0, 0, clock.t); n++; }
      }
      if (n) touchState();
      return n;
    },
    setPopulation(a, v) {
      const n = reg.norm() || 1; const c = reg.coeffAt(a, clock.t); const ph = Math.atan2(c.im, c.re);
      reg.setPolar(a, Math.sqrt(Math.max(0, v)) * n, ph, clock.t); touchState();
    },
    clear() { reg.clear(); app.state.refSnapshot = null; touchState(); },
    normalize() { app.w.normalizeNow(); },
    rateOf(a) { return rates[a]; },
    setRate(a, r) {
      if (sturm.P) return false;                                     // W-STURMIAN: RATE is a diagonal-phase feature — off under the scale
      const c = reg.coeffAt(a, clock.t); rates[a] = r; reg.setEnergies(energyOf); reg.set(a, c.re, c.im, clock.t); touchState();   // re-anchored: c(t) is continuous, only its speed changes
      const toy = rates.some((v) => Math.abs(v - 1) > 1e-9);
      app.w.wSpec.setStatus(toy ? 'CUSTOM RATES · H RESCALED' : getHamiltonian().label, toy ? 'warn' : (getHamiltonian().id === 'hydrogen' ? '' : 'live'));
    },
    addPhase(a, d) { const c = reg.coeffAt(a, clock.t); reg.setPolar(a, Math.hypot(c.re, c.im), Math.atan2(c.im, c.re) + d, clock.t); touchState(); },
    setPhase(a, ph) { const c = reg.coeffAt(a, clock.t); reg.setPolar(a, Math.hypot(c.re, c.im), ph, clock.t); touchState(); },
    toggleMute(a) { reg.setMute(a, !reg.muted[a]); touchState(); },
    toggleSolo(a) { reg.setSolo(a, !reg.solo[a]); touchState(); },
    remove(a) { reg.set(a, 0, 0, clock.t); reg.setMute(a, false); reg.setSolo(a, false); touchState(); }
  };
  return { autoQ, controlStep, RES_LADDER, gov, effectiveRes, READER_LAW, keep, domain, fieldRate, perf, frameBudget, perfBudgetMs, tick, READERS, may, unpark, setGovernor, setKeepFrames,
    setPerfMode, stats, cRe, cIm, mod, MOD, modSyncBases, feedAudio, modHand, setKnob, modGets, modKnobs, modHeld, ROT_LIMIT, rotRate, rotDriving, setRotationRate, rotStep, modStore, saveMod,
    curvesStore, occlusion, look, applyAccent, paintMarks, markBatchBegin, markBatchEnd, wheelColor, accent, inkCtx, markInk, stageGround, busyWrap, busyFlash, busy, busySync, cardLoading,
    busyHost, field, maths, scan, cards, solveChem, solveCard, cancelWarm, warmArm, touchState, loadPreset, setReference, api };
}
