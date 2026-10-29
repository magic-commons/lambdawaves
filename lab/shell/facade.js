/* lab/shell/facade.js — §26 THE DIAGNOSTICS SURFACE (0.5.2 R5; moved whole out of lab/rack.js boot()): createFacade(app) returns the one `__LW` literal,
 * key for key and getter for getter; boot() keeps the window.__LW / app.sh.LW line and the members it adds later (curves, bootView … ready, report) at their seats. */
import { availability } from './settings.js';   // 022 E1 · AVAILABILITY IS ONE LAW (setSpace)
import { TIER } from '../tier.js'; import { BUILD_LINE } from '../build-line.js'; import { PRESETS, RENDER_CAP } from '../state.js'; import { psiAt, orbitalFromTable } from '../hydrogen.js'; import { waitForPaint } from '../frame-settle.js';
import { VIEW, STYLE, cameraBasis, quatFromYawPitch, waveView, drawStyle } from '../field.js'; import { parseCssColor, cssRGB, accentRGB } from '../mir/kit.js'; import { rgbToHex, contrastRatio } from '../mir/palette.js';
import { getHamiltonian, setHamiltonian, HAMILTONIANS, setZ, getZ } from '../hamiltonian.js'; import { wellCentroid } from '../well.js'; import { CARD_GROUND } from '../look.js';
import { readLink, LINK_CHAR_CEILING } from '../statelink.js'; import { CATALOGUE } from '../catalogue.js';
export function createFacade(app) {
  const { dom, ui, reg, hNote, clock, appPlay, obs, mat, rates, energyOf, sturm, labelExpect } = app, { schedule, page, loopRing, ringMedian, windowActivity, modesAt, meterSnapshot,
    MOTION } = app.loop, { camera, orbitBy, camLevel, setCamMode, hydroReader, swClient } = app.host, { spectrum, switchHamiltonian, setSturmian, sturmEigen, selectEigen, setElement, fillValence,
    shadowView, orbit, kepler, vortex, particles, flowTracers, slice, head, calculus, ladder, atomsView, wignerView, radiationView, emissionView, bowStart, bowMove, bowRelease, orbitOfShell, kepShell, keplerTurn,
    keplerDragToPoint, keplerRowSync, gas, gasTableOn, launchPacket, enterBox, coherentBounce, bowCancel, slapAlong } = app.w, { autoQ, gov, effectiveRes, READER_LAW, keep, domain, fieldRate, perf,
    setGovernor, setKeepFrames, setPerfMode, stats, mod, MOD, modHand, modGets, modKnobs, modHeld, ROT_LIMIT, rotRate, rotDriving, setRotationRate, look, paintMarks, wheelColor, accent, inkCtx,
    markInk, stageGround, busyWrap, busyFlash, busy, busySync, busyHost, field, maths, scan, cards, touchState, loadPreset, setReference, api } = app.ctl, { readSettings, saveSettings, setCardStyle,
    setFrost, setDisconnected, applySettings, quality, togglePlay, setModArm, barLock, layout, stageHasFocus, serialize, restoreModulation, restore, notCarriedWords, mintLink, copyLink, openLink,
    historyApi, verbs } = app.sh;
  let batching = 0, rebuildDue = false;   // 021 R2: LW.mod.batch — one window rebuild per graph change
  const viewRebuild = () => { if (batching) rebuildDue = true; else if (app.state.modView) app.state.modView.rebuild(); };
  const modEdited = () => { if (app.state.modView) app.state.modView.rebuild(); hNote(); if (app.ctl.mod) app.ctl.mod.dotsSoon(); };   // LW.mod's model edits: shown, maybe a row (S3), the route dots (017 R3)
  return {
    ready: false, reg, clock, obs, mat, quality, domain, camera, fieldRate, stats, field, presets: PRESETS, catalogue: CATALOGUE, TIER, shadowView, spectrum, orbitView: orbit, vortex, ladder, particles, get particleUI() { return { on: ui.pOn, n: ui.pN, trail: ui.pTrail }; }, slice, kepler, chem: app.state.chem, head, calculus, layout, setTheme(t) { if (app.hooks.setTheme) app.hooks.setTheme(t); }, setCardStyle(c) { return setCardStyle(c); }, get cardStyle() { return document.body.dataset.card || 'refractive'; }, setFrost(m) { return setFrost(m); }, get frostLive() { return document.body.classList.contains('frost') && !document.body.classList.contains('frost-hold'); }, setDisconnected(v) { return setDisconnected(v); }, get disconnected() { return document.body.classList.contains('disconnected'); }, applySettings, get settings() { return readSettings(); }, get build() { return BUILD_LINE; }, get ab() { return app.hooks.ab; }, get notebook() { return layout.notebook; }, get period() { return app.hooks.period ? app.hooks.period() : null; }, get gas() { return gas; }, /** optimization K7 / W125: the gas table, ON by default — gasTable(true|false) switches it, gasTable() reads 'off' | 'building' (wanted: armed until the first AXIAL launch, then sliced in idle time) | 'on' */ gasTable(on) { if (on !== undefined) gasTableOn(!!on); return gas.table; }, setGasBasis(v) { if (ui.gasBasis) ui.gasBasis.set(v); app.state.gasAxial = v === 'axial'; if (!app.state.gasAxial) gas.off(); hNote(); schedule(TIER.RECONSTRUCT); }, get gasBasis() { return app.state.gasAxial ? 'axial' : 'reg'; }, keplerDrag(n, w) { return keplerDragToPoint(n, w); }, keplerTurn(kind, dth, n) { return keplerTurn(kind, dth, n); }, get keplerShell() { return kepShell(); }, setKeplerShell(n) { if (ui.kepShell) { ui.kepShell.set(String(n)); keplerRowSync(true); } return kepShell(); }, keplerOrbitOf(n) { return orbitOfShell(n === undefined ? kepShell() : n); }, get rotRate() { return { ...rotRate }; }, setRotRate(which, v) { const k = which === 'z' ? 'z' : which === 'kz' ? 'kz' : which === 'def' ? 'def' : null; if (!k) return null; if (!Number.isFinite(v)) return null; const w = (k !== 'z' && sturm.P) ? 0 : Math.max(-ROT_LIMIT[k], Math.min(ROT_LIMIT[k], v)); if (modHand('state.' + (k === 'z' ? 'rot.z' : k === 'kz' ? 'stark.kz' : 'defect.l2'), w)) return w; return setRotationRate(k, w); }, get rotDriving() { return rotDriving(); }, get projects() { return layout.projects; }, rateOf(a) { return rates[a]; }, setRate(a, r) { return api.setRate(a, r); }, saveSettings, setStage(v) { return app.hooks.setStage ? app.hooks.setStage(v) : null; }, setStyle(name) { if (STYLE[name] === undefined) return false; const s = drawStyle(name); mat.style = STYLE[s]; if (ui.styleSeg) ui.styleSeg.set(s); schedule(TIER.PRESENT); return true; }, accent: { set(a, b) { look.set({ ...(a !== undefined && { accentA: a }), ...(b !== undefined && { accentB: b }) }); }, get a() { return look.get('accentA'); }, get b() { return look.get('accentB'); }, colorAt(deg) { return rgbToHex(wheelColor(deg)); } }, get theme() { return document.body.dataset.theme || 'dark'; }, get themeChoice() { return look.get('theme'); }, launchPacket, get lastLaunch() { return app.state.lastLaunch; }, enterBox() { if (getHamiltonian().id !== 'well') { setHamiltonian('well'); switchHamiltonian('well'); if (ui.hamSeg) ui.hamSeg.set('well'); } enterBox(); }, coherentBounce() { coherentBounce(); }, get autoQ() { return autoQ; }, governor: { get on() { return gov.on; }, set on(v) { setGovernor(v); }, get drop() { return gov.drop; }, get median() { return gov.median; }, get changes() { return gov.changes; }, get parked() { return [...gov.parked.keys()]; }, get probes() { return gov.probes; }, get probeMs() { return READER_LAW.probeMs; }, get state() { return !gov.on ? 'off' : gov.drop ? 'stepped-' + gov.drop : 'nominal'; }, get resolution() { return effectiveRes(); }, get work() { return perf.work; } }, maths: { get ok() { return maths.ok && scan.ok; }, get bow() { return maths.ok; }, get scan() { return scan.ok; }, get started() { return { bow: maths.started, scan: scan.started, cards: cards.started }; }, call: (m) => maths.call(m) }, get keepFrames() { return keep.frames; }, setKeepFrames, packetCentroid(G = 24) { const c = reg.at(clock.t); return wellCentroid(c.re, c.im, reg.populated(), { G }); }, setIonZ(z) { setZ(z); switchHamiltonian('hydrogen'); if (ui.zKnob) ui.zKnob.set(z); }, get Z() { return getZ(); }, perf: { get mode() { return perf.mode; }, setMode: setPerfMode, get profile() { return perf.profile; }, get counts() { return perf.counts; }, /** the median of the loop's OWN main-thread ms over the last 60 frames — the budget-independent read of "is hidden cheaper?" */ get median() { return ringMedian(perf.ring); }, /** LA1: the same median over the WHOLE loop, timed from its entry */ get loopMedian() { return ringMedian(loopRing); }, resetRing() { perf.ring.fill(0); loopRing.fill(0); } }, get keys() { return app.hooks.keys; }, /** 021 I1: THE ACTION REGISTRY (lab/actions.js) and its run — every act by id */ get actions() { return app.sh.ACTIONS; }, run(id, args) { return app.sh.ACTIONS.run(id, args); }, bow: { start: (x, y) => bowStart({ clientX: x, clientY: y }), move: (x, y) => bowMove({ clientX: x, clientY: y }), release: () => bowRelease(), cancel: () => bowCancel(), get active() { return !!app.state.bow; }, get k() { return app.state.bow ? app.state.bow.k : 0; }, get dir() { return app.state.bow ? app.state.bow.dir : null; }, get landed() { return app.state.bowChain; }, get inFlight() { return app.state.bowInFlight > 0; } }, kickAlong(k, d) { slapAlong(k, d); }, setDamping(g) { reg.setDamping(g); touchState(); }, get hamiltonian() { return getHamiltonian().id; }, setHamiltonian(id) { switchHamiltonian(id); if (ui.hamSeg) ui.hamSeg.set(id); }, kick(k, axis = 'z') { if (app.hooks.slap) app.hooks.slap(k, axis); }, get space() { return app.state.space; }, setSpace(s) { if (s === 'p' && !availability('wave.space.p', app).on) return false; app.state.space = s; if (ui.spaceSeg) ui.spaceSeg.set(s); schedule(TIER.REBUILD); }, get palette() { return app.state.palette; },
    /* ── WAVE 54 ─────────────────────────────────────────────────────────────────────────────────────────────── */
    /** THE BACKGROUNDED TAB.  Read-only counters plus the two levers a gate needs: the workers' own busy ledger,
     *  and a speculative job it can issue to prove the park is real in both directions. */
    background: { get hidden() { return page.hidden; }, get parks() { return page.parks; }, get resumes() { return page.resumes; },
      get via() { return page.via; }, get hiddenMs() { return page.hiddenMs; }, get mark() { return page.mark; },
      get firstDt() { return page.firstDt; }, get firstWall() { return page.firstWall; }, get jumped() { return page.jumped; }, get back() { return page.back; },
      get visibility() { return document.visibilityState; },
      async workerStat() { return { bow: maths.ok ? await maths.stat() : null, scan: scan.ok ? await scan.stat() : null }; },
      /** a SPECULATIVE job (the SLAP warm): it waits while the page is hidden and runs on resume — the falsifiable half */
      probe() { return maths.ok ? maths.raw({ op: 'warm', ham: 'hydrogen', Z: 1 }) : Promise.resolve(null); },
      /** a BOUNDED job the user asked for: it runs whether the page is hidden or not, by the stated rule */
      scanNow() { return scan.ok ? scan.raw({ op: 'period', energies: reg.populated().map((a) => energyOf(a)), horizon: 400 }) : Promise.resolve(null); } },
    /** THE CAMERA'S SECOND MODE.  setCamMode('turntable', true) levels instantly; without it the roll slerps 150 ms. */
    get camMode() { return obs.mode; }, get camQuat() { return obs.mode === 'free' ? obs.quat.slice() : quatFromYawPitch(obs.yaw, obs.pitch); }, get camLevelling() { return !!camLevel.from; },
    setCamMode(m, now) { return setCamMode(m, now ? { now: true } : undefined); },
    cameraBasis() { return cameraBasis(obs); }, orbitBy(dy, dp) { orbitBy(dy, dp); schedule(TIER.PRESENT); return { yaw: obs.yaw, pitch: obs.pitch }; },
    /** THE DITHER.  setDither(0) is OFF and OFF adds exactly zero to the colour. */
    get dither() { return mat.dither || 0; },
    setDither(k) { mat.dither = Math.max(0, +k || 0); if (ui.ditherSeg) ui.ditherSeg.set(mat.dither ? 'ordered' : 'off'); if (ui.ditherK) { ui.ditherK.setDisabled(!mat.dither); if (mat.dither) ui.ditherK.set(Math.max(0.25, Math.min(2, mat.dither))); } schedule(TIER.PRESENT); return mat.dither; },
    /** THE GAMUT, and the LAW: `state()` reports both sides, and they are never allowed to differ. */
    gamut: { get support() { return field.ok ? field.gamutSupport : { canvas: false, css: false, display: false, reason: 'no WebGPU device' }; },
      get canvas() { return field.ok ? field.gamut : 'srgb'; }, get dom() { return document.body.dataset.gamut || 'srgb'; },
      get available() { const g = field.ok ? field.gamutSupport : null; return !!(g && g.canvas && g.css); },
      get disabled() { const b = ui.gamutSeg && ui.gamutSeg.button('p3'); return !!(b && b.disabled); },
      get reason() { const b = ui.gamutSeg && ui.gamutSeg.button('p3'); return b ? b.title : ''; },
      state() { const c = field.ok ? field.gamut : 'srgb'; const d = document.body.dataset.gamut || 'srgb'; return { canvas: c === 'srgb' ? 'srgb' : 'p3', dom: d, agree: (c === 'srgb') === (d === 'srgb') }; },
      set(id) { return app.hooks.setGamut ? app.hooks.setGamut(id) : 'srgb'; } },
    /** THE PALETTE by NAME, and the menu's grouping by stop count */
    setPalette(id) { return app.state.palette ? app.state.palette.select(id) : false; },
    get paletteId() { return app.state.palette ? app.state.palette.id : null; }, get paletteGroups() { return app.state.palette ? app.state.palette.groups : []; },
    loadPreset, schedule, togglePlay, setReference, serialize, restore, api,
    /* ── ORBITALS · the MOLECULAR REGISTER, one road (MATH-H2O Proposition 1) ─────────────────────
     * ψ(r, t) = Σ_k c_k e^{−iε_k t} φ_k over CHEMISTRY's canonical orbitals.  `ladder()` is the
     * solved ε_k with their ground-state occupancies; `state()` carries the selection, Σ|c|² and the
     * beat period 2π/Δε of the two strongest levels — the FROZEN-ORBITAL gap, never ω_RPA. */
    orbitals: {
      select(k, amp = 1, phase = 0) { return app.state.orbitals.select(k, amp, phase); },
      deselect(k) { return app.state.orbitals.deselect(k); },
      toggle(k) { return app.state.orbitals.toggle(k); },
      clear() { return app.state.orbitals.clear(); },
      norm() { return app.state.orbitals.norm(); },
      setAmp(k, v) { return app.state.orbitals.setAmp(k, v); }, setPhase(k, v) { return app.state.orbitals.setPhase(k, v); },
      setOn(v) { return app.state.orbitals.setOn(v); }, get on() { return app.state.orbitals.on; },
      setFlow(v) { return app.state.orbitals.setFlow(v); }, get flowOn() { return app.state.orbitals.flowOn; },
      preset(name) { return app.state.orbitals.preset(name); }, store(w) { return app.state.orbitals.store(w); }, setMorph(on, sv) { return app.state.orbitals.setMorph(on, sv); },
      get dials() { return app.state.orbitals.dials; }, setDials(v) { return app.state.orbitals.setDials(v); },
      ladder() { return app.state.orbitals.ladder(); }, state() { return app.state.orbitals.state(); },
      solution() { return app.state.orbitals.solution(); },
      save() { return app.state.orbitals.save(); }, load(r) { return app.state.orbitals.load(r); },
    },
    /* the REGISTER window's switch and its STATES mode: the many-electron register over S₀ and the TDA states */
    register: { get mode() { return app.state.register.mode; }, setMode(v) { return app.state.register.setMode(v); }, save() { return app.state.register.save(); }, load(r) { return app.state.register.load(r); } },
    states: {
      select(k, amp, phase) { return app.state.states.select(k, amp, phase); }, deselect(k) { return app.state.states.deselect(k); }, toggle(k) { return app.state.states.toggle(k); },
      clear() { return app.state.states.clear(); }, norm() { return app.state.states.norm(); }, setAmp(k, v) { return app.state.states.setAmp(k, v); }, setPhase(k, v) { return app.state.states.setPhase(k, v); },
      preset(name) { return app.state.states.preset(name); }, play(k) { return app.state.states.play(k); }, store(w) { return app.state.states.store(w); },
      setMorph(on, s) { return app.state.states.setMorph(on, s); }, setView(v) { return app.state.states.setView(v); }, setRef(v) { return app.state.states.setRef(v); },
      setFlow(v) { return app.state.states.setFlow(v); }, get flowOn() { return app.state.states.flowOn; }, flowState() { return flowTracers ? { on: flowTracers.on, ...flowTracers.state } : null; },
      setDrive(v) { return app.state.states.setDrive(v); }, setDriveParam(k, v) { return app.state.states.setDriveParam(k, v); }, tune() { return app.state.states.tune(); }, get drive() { return app.state.states.drive; },
      setOn(v) { return app.state.states.setOn(v); }, get on() { return app.state.states.on; },
      ladder() { return app.state.states.ladder(); }, state() { return app.state.states.state(); }, save() { return app.state.states.save(); }, load(r) { return app.state.states.load(r); },
    },
    /* the molecular funnel, readable: which model is playing, why, and what the session has dropped */
    molsession: {
      state() { return app.state.molSession.state(); },
      get selected() { return app.state.molSession.selected; }, get reason() { return app.state.molSession.reason; },
      get molecule() { return app.state.molSession.molecule; }, get solution() { return app.state.molSession.solution; },
      get counters() { return { ...app.state.molSession.counters }; },
      claimed(id) { return app.state.molSession.claimed(id); }, why(id) { return app.state.molSession.why(id); },
    },
    /* ── WAVE 52 · THE MODULATION RACK.  One road to the model, the four edges, the window and the
     * three numbers the strip is showing — `read(id)` hands back exactly what is on the screen. ── */
    mod: {
      get host() { return app.state.modHost; }, get model() { return app.state.modHost && app.state.modHost.model; },
      get registry() { return app.state.modHost && app.state.modHost.registry; }, get clock() { return app.state.modHost && app.state.modHost.clock; },
      get view() { return app.state.modView && app.state.modView.api; },
      get running() { return !!(app.state.modHost && app.state.modHost.clock.isRunning()); },
      get playing() { return !!(app.state.modHost && app.state.modHost.clock.isPlaying()); },
      get cadence() { return MOD.hz; },
      setCadence(hz) { mod.setCadence(hz); if (app.state.modView) app.state.modView.sync(); return MOD.hz; },
      /* ── WAVE 65 · THE ARM, THE ONE KEY AND THE RESUME LAW, all readable from outside ────────── */
      get armed() { return app.state.modArm; },
      arm(on) { return setModArm(!!on); },
      /** which law the rack's own chips put on the next resume, and what the last one actually did */
      resume() { return app.state.modHost ? app.state.modHost.clock.resumePlan() : null; },
      /** the loop clock locked to the density's exact recurrence: one bar = one repeat (g) */
      barLock,
      get expanded() { return layout.modulation.open; },
      expand() { return layout.modulation.expand(); }, collapse() { return layout.modulation.collapse(); },
      /** PACE P3 · the window's remembered presentation, and the road that puts one back (the device report's put-back: its
       *  first open prunes remembered rows for sources that no longer exist, which is the report's doing, not the hand's) */
      presentation() { return app.state.modView ? app.state.modView.presentation() : null; }, restorePresentation(o) { if (app.state.modView && o) app.state.modView.restore(o); return !!(app.state.modView && o); },
      /* 0.5.0 C4 (R-B1): the modulation has no play of its own — these are THE play and THE pause (the edge follows) */
      play() { appPlay.play(); schedule(TIER.EVOLVE); return { ok: true, playing: app.state.modHost.clock.isPlaying() }; },
      stop() { appPlay.pause(); schedule(TIER.PRESENT); return { ok: true, playing: app.state.modHost.clock.isPlaying() }; },
      /** a deterministic step — no realtime anywhere near it, which is what a proof wants */
      step(dt) { const d = app.state.modHost.clock.step(dt); if (app.state.modView) app.state.modView.paint(true); return d; },
      targets() { return app.state.modHost.registry.describe(); },
      state(id) { return app.state.modHost.registry.state(id); },
      read(id) { return app.state.modView ? app.state.modView.api.read(id) : null; },
      picker() { return app.state.modView ? app.state.modView.api.picker() : []; },
      addSource(kind) { const s2 = app.state.modHost.model.addSource(kind); modEdited(); return s2.id; },
      addMacro() { const m = app.state.modHost.model.addMacro(null); modEdited(); return m.id; },
      /** BIND: unbind first, always — setMacro REFUSES a change on a macro already bound to a live
       *  source, and a caller that just calls setMacro reads that refusal as a control doing nothing. */
      bind(macroId, sourceId) { app.state.modHost.model.setMacro(macroId, { sourceId: null });
        if (sourceId) app.state.modHost.model.setMacro(macroId, { sourceId }); app.state.modHost.clock.recomputeRunning();
        modEdited(); return app.state.modHost.model.macroOf(macroId).sourceId; },
      route(macroId, targetId, min, max) { const r = app.state.modHost.model.addRoute(macroId, targetId, min === undefined ? 0 : min, max === undefined ? 1 : max);
        app.state.modHost.clock.recomputeRunning(); modEdited(); return r && r.route ? r.route.id : null; },
      /* iteration 007 (the MIR check, B3): when the last route leaves a target the modulator has let go, so the dial returns to its
         base — the kit's own remove() does the same (modulation/bind.js) */
      unroute(id) { const M = app.state.modHost.model, r = M.routeOfId ? M.routeOfId(id) : null, tid = r ? r.targetId : null; const ok = M.removeRoute(id);
        if (ok && tid && app.state.modHost.registry.has(tid) && !M.routeCountOfTarget(tid)) app.state.modHost.registry.restoreBase(tid);
        modEdited(); return ok; },
      /** the runtime door: a control registered NOW is in the picker NOW, with no edit to modview.js */
      /* WAVE 61: a control registered at RUNTIME with a `knob` accessor is a drop target at runtime,
         with no edit anywhere — installOne still strips nothing it did not want, the accessor is kept
         here beside modGets, and the dial is stamped the moment it exists. That is the runtime door's
         whole promise, and without the stamp the new control would be in the picker and not on the glass. */
      /* 021 R2: a spec with `flash` (its 10 % step) joins the one flash limiter (mod-port.js routeGuard); the window rebuilds once a batch */
      register(id, spec) { const g = mod.guard(id, spec), d = app.state.modHost.targets.installOne(id, g); modGets[id] = spec.get;
        if (spec.knob) { modKnobs[id] = spec.knob; const k = spec.knob(); if (k && k.root) k.root.dataset.param = id; }
        viewRebuild(); return d; },
      /** unregister(id) — the target lets go (its base back) and its routes go DORMANT (the target host's dormancy law); an id is never
       *  given to another control, so a dormant route wakes only on its own target (NODES' ids are monotonic, 021 R2) */
      unregister(id) { const n = app.state.modHost.targets.uninstall(id); delete modGets[id]; delete modKnobs[id]; viewRebuild(); return n; },
      /** batch(fn) — register / unregister inside fn rebuild the window once, at the end (a NODES graph change) */
      batch(fn) { batching++; try { return fn(); } finally { if (--batching === 0 && rebuildDue) { rebuildDue = false; viewRebuild(); } } },
      reset() { app.state.modHost.clock.pause(); app.state.modHost.registry.restoreAll(); app.state.modHost.model.modReset();
        app.state.modHost.targets.sync(); app.state.modHost.clock.applyAll(true); modEdited(); schedule(TIER.PRESENT); return true; },
      serialize() { return app.state.modHost.model.serialize(); }, restore(o) { const ok = restoreModulation(o); hNote(); return ok; },
      diagnostics() { return app.state.modHost.diagnostics(); },
      paint() { return app.state.modView ? app.state.modView.paint(true) : false; },
      get held() { return [...modHeld]; },
      get knobs() { return Object.keys(modKnobs); },
    },
    /* UNDO / REDO over the edit scope (S3): the whole PROJECT but the view, quality and the notebook — never the layout or a preference */
    get history() { return historyApi; },
    /** W-CAPTURE (wave 58): lab/capture.js itself, built on first use — picture · planLoop · save · limits · grab, and `laws` for the
     *  pure schedule functions (0.5.0 C7: the film is captureUI.exact, render-exact.js createFilm over the kit's recorder). */
    get capture() { return app.state.capApi ? app.state.capApi.capture : null; }, get capturePlan() { return app.state.capApi ? app.state.capApi.plan(true) : null; },
    get captureUI() { return app.state.capApi; },
    /* W-EXPORT (wave 134): FILE › EXPORT SHAPE / GRID's own module instance — run(fmt), busy, last (the proof's hook;
     *  the five rows call run(fmt) themselves and need nothing here) */
    get shapeExport() { return app.state.exporter3d; },
    /* W-WIGNER: the (z, p_z) slice — the last map computed (recomputed if the state has moved), its two ranges, its numbers */
    wigner: { slice() { return hydroReader().on ? wignerView.slice(reg, clock.t) : null; }, setRange(z, p) { return wignerView.setRange(z, p); },
      get stats() { return wignerView.stats; }, get zmax() { return wignerView.zmax; }, get pmax() { return wignerView.pmax; },
      get canvas() { return wignerView.canvas; }, table() { return wignerView.table(); } },
    /* W-RADIATION: the pair in force and what it radiates */
    radiation: { pair() { return hydroReader(true).on ? radiationView.pair(reg, clock.t, app.hooks.ab) : null; },
      get A() { const s = radiationView.stats; return s ? s.A : 0; }, get tau() { const s = radiationView.stats; return s ? s.tau : Infinity; },
      get power() { const s = radiationView.stats; return s ? s.P : 0; }, get stats() { return radiationView.stats; },
      get canvas() { return radiationView.canvas; }, table() { return radiationView.table(); } },
    /* iteration 016 E1 · EMISSION SPECTRA: the catalogue in force, a press by id or name ({ decay, pair }: one history row, THE FADE), the last pair pressed, the lit lines */
    emission: { lines() { return emissionView.lines(); }, pick(id, opt) { return emissionView.pick(id, opt); }, pair() { return emissionView.pair(); }, lit() { return emissionView.lit(); }, get canvas() { return emissionView.canvas; } },
    atoms: atomsView, setElement, fillValence, get atomZ() { return HAMILTONIANS.atom.Z; }, get element() { return HAMILTONIANS.atom.element; },
    /* W-STURMIAN: the scale — on/off, λ, the eigen-decomposition {E, pop, l, m, n} (of c(t) when t is given, else the anchor), load eigenstate k, the S-norm ⟨c|S|c⟩ */
    sturmian: { set(on) { setSturmian({ on: !!on }); return sturm.on; }, setLambda(l) { setSturmian({ lambda: l }); return sturm.lambda; }, get on() { return sturm.on; }, get lambda() { return sturm.lambda; }, get active() { return !!sturm.P; },
      get buildMs() { return sturm.buildMs; }, get P() { return sturm.P; }, eigen(t) { return sturmEigen(t); }, select(k) { return selectEigen(k); },
      norm(t) { return sturm.P ? sturm.P.norm(t === undefined ? { re: reg.re0, im: reg.im0 } : reg.at(t)) : reg.norm2(); }, expect(a) { return sturm.P ? labelExpect(a) : reg.Ediag(a); }, get records() { return sturm.rec; } },
    rotateK(th) { reg.rotateK(th); touchState(); }, defectWait(a) { reg.defectWait(a); touchState(); },
    rotor(spec) { reg.rotor(spec); touchState(); },
    seedParticles(n = 160) { particles.setOn(true); const k = particles.seed(n, reg, clock.t, domain.half); schedule(TIER.PRESENT); return k; },
    play() { clock.play(performance.now() / 1000); schedule(TIER.EVOLVE); }, pause() { clock.pause(); schedule(TIER.PRESENT); },
    scrub(t) { appPlay.seek(t); }, seek: (t, o) => appPlay.seek(t, o), step(dt) { clock.step(dt); schedule(TIER.EVOLVE); },
    setMute(a, on) { reg.setMute(a, on); touchState(); }, setView(v) { const w = waveView(v) || 'density'; mat.view = VIEW[w]; ui.viewSeg.set(w); schedule(TIER.PRESENT); return w; },   // iteration 008 W: 'reim' → phase, 'diff' → density
    orbit(dy, dp) { orbitBy(dy, dp); schedule(TIER.PRESENT); },
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
    get warning() { return app.hooks.warning; },
    get uiHidden() { return app.state.uiHidden; },
    /** the nine wheel samples every copy of the mark is painted from — the ABOUT face reads the same ones */
    paintMarks,
    /** WAVE 53 · the two chrome objects, each with its own switch and its own seat in the settings key */
    setFrame(v) { mat.frame = !!v; if (ui.frameSw) ui.frameSw.set(mat.frame); saveSettings(); schedule(TIER.PRESENT); return mat.frame; },
    setAxis(v) { mat.axis = !!v; if (ui.axisSw) ui.axisSw.set(mat.axis); saveSettings(); schedule(TIER.PRESENT); return mat.axis; },
    /** ⚠ the AXES' COLOUR, the user's now and not the theme's: 'theme' (the shipped binding), 'cmy' or 'rgb'.
     *  Anything else is 'theme' rather than a refusal — the same forgiveness applySettings and the link decoder give it. */
    setAxisInk(v) { mat.axisInk = (v === 'cmy' || v === 'rgb') ? v : 'theme'; if (ui.axisInkSeg) ui.axisInkSeg.set(mat.axisInk); saveSettings(); schedule(TIER.PRESENT); return mat.axisInk; },
    /** ⚠ INVERT, which this browser remembers now that it lives in PALETTE beside the palette's own switch */
    setInvert(v) { mat.invert = !!v; if (ui.invertSw) ui.invertSw.set(mat.invert); saveSettings(); schedule(TIER.PRESENT); return mat.invert; },
    /** WAVE 53 · THE LOGO.  Nothing here rotates: `colours(φ)` is the nine squares at palette phase φ, `stops` is
     *  what the generated keyframes actually animate through, and `turn()` runs the boot's one turn again. */
    logo: {
      colours(phi = 0) { return Array.from({ length: 9 }, (_, i) => rgbToHex(wheelColor(i * 40 + phi))); },
      get stops() { return look.turnStops(); },
      get css() { const sheet = document.getElementById('mirTurn'); return sheet ? sheet.textContent : ''; },   // the kit accent's turn sheet
      get steps() { return 36; }, get step() { return 40; },
      turn() { return accent.turn(); },
      get turning() { const m = document.querySelector('#title .mark'); return !!m && (m.classList.contains('turn') || m.classList.contains('busy')); },
      get menu() { return layout.menu; },
    },
    /* WAVE 106 · THE FROST POLICY IS READABLE, not only writable.  setFrost has been on this surface since
       wave 67 and the matching read never was, so a caller that wanted to borrow the policy for one
       measurement and hand it back had nothing to hand back — it read undefined and setFrost(undefined)
       resolves to 'off', which is not the same as the policy it borrowed.  B62 is exactly that caller: it
       has to take FROST off to see the CARD STYLE pane at all, because the frost rule is a later rule of
       equal specificity that replaces the pane with its own veil. */
    get frost() { return look.get('frost'); },
    /** WAVE 53 · the '?' sheet: open / close / what it is showing (read back out of the DOM) */
    get keysheet() { return layout.keysheet; },
    get windowActivity() { return windowActivity; },   // the gate presents below-the-fold windows through presentOffscreen()
    /** WAVE 106 · the drawn keyboard: open / close / is it up */
    get keymap() { return layout.keymap; },
    cpuPsi(x, y, z) { const c = reg.at(clock.t); if (sturm.P) { let R = 0, I = 0; for (const a of reg.renderSet(RENDER_CAP).ids) { const v = orbitalFromTable(sturm.rec[a], x, y, z); R += c.re[a] * v.re - c.im[a] * v.im; I += c.re[a] * v.im + c.im[a] * v.re; } return { re: R, im: I }; } return psiAt(c.re, c.im, x, y, z, reg.renderSet(RENDER_CAP).ids); },   // W-STURMIAN: the kernel's CPU twin on the scaled records
    readPixels: () => field.ok ? field.readPixels(obs, mat) : null,
    /** the GPU chrome as the screen gets it: the box and the three axes rendered alone over the stage's ground */
    linePixels: (w, h) => field.ok ? field.linePixels(obs, mat, w, h) : null,
    lineColors: () => field.ok ? field.lineColors(mat) : null,
    fieldDigest: () => field.ok ? field.fieldDigest() : null,
    sampleVoxel: (i, j, k) => field.ok ? field.sampleVoxel(i, j, k) : null,
    /** resolves after the next frame has run (so a scheduled tier has been applied) */
    settle() { schedule(TIER.PRESENT); return waitForPaint(() => ({ frames: stats.frames, error: field.error, hidden: page.hidden })); },
    /* ── WAVE 56 ──────────────────────────────────────────────────────────────────────────────────────── */
    /** SHAREABLE LINKS.  mint() builds without copying; copy() is the trig; open() is the boot/hashchange road. */
    link: { mint: () => mintLink(), copy: () => copyLink(), open: (href) => openLink(href),
      read: (href) => readLink(href === undefined ? location.href : href),
      get last() { return app.state.linkLast; }, get ceiling() { return LINK_CHAR_CEILING; },
      names: (keys) => notCarriedWords(keys || []) },
    /** THE INSTALL LAYER's interface half — the offer, the press, and what a controllerchange means here. */
    sw: swClient,
    /** the name tests/pwa.test.mjs's closing comment gives the offer; main.js calls it through LW.sw */
    buildReady: (take) => swClient.buildReady(take),
    /* ── WAVE 57 ──────────────────────────────────────────────────────────────────────────────────────── */
    /** THE MOTION PREFERENCE as this page resolved it, and what it refused because of it */
    get motion() { return { reduced: MOTION.reduced, source: MOTION.source, divisor: MOTION.divisor, autoplay: MOTION.autoplay, rate: clock.rate }; },
    /** THE COLOUR ROAD the canvas views take: one reader that knows all four CSS forms, and the two
     *  accents the WHEEL published (never the DOM string re-parsed through a gamut), plus the λ's ink. */
    ink: { parse: (t) => parseCssColor(t), css: (name, fallback) => cssRGB(inkCtx(), name, fallback),
      accent: (n) => accentRGB(inkCtx(), n),
      mark: (deg) => markInk(deg || 0).map((v) => Math.round(v * 255)),
      /* wave 59: the header λ and the notebook's are corrected against DIFFERENT grounds, so a gate that can
         only ask about one of them cannot see the difference.  `mark`/`ground` are the CARD (the notebook's);
         `stageMark`/`stageGround` are the live canvas clear colour the header λ actually sits on. */
      stageMark: (deg) => markInk(deg || 0, stageGround()).map((v) => Math.round(v * 255)),
      get stageGround() { return stageGround().map((v) => Math.round(Math.max(0, Math.min(1, v)) * 255)); },
      get floor() { return 3; },
      get ground() { return CARD_GROUND[document.body.dataset.theme === 'light' ? 'light' : 'dark'].map((v) => Math.round(v * 255)); },
      /** the WCAG ratio between two 0…255 triples — the gate's own arithmetic, from the shipping code */
      ratio: (a, b) => contrastRatio(a.map((v) => v / 255), b.map((v) => v / 255)) },
    /** the ONE input to the TAB rule: are the hands on the world, or in the rack? */
    get stageFocus() { return stageHasFocus(); },
    version: 'QWAVE-0.1 hydrogen shadow lab · FRONTIER · 2026-09-03',
    /** 0.5.0 C9 · R14 · FOLDERS' thumbnail() for C6's project adapter, whose toThumb() drawImage()s what it gets (a WebGPU canvas can
     *  answer that BLANK): the GPU readback's PNG, always (C7 took capture's readability probe away; C7b drops its dead branch). */
    async thumbnail() { const r = await app.state.capApi.capture.picture({ width: 320 }); return r.ok ? r.blob : null; },
    look: look.prefs,   // 0.5.0 C2: the look store (`mir.gui`), for probes (`__LW.look.get('theme')`)
    session: dom.start ? dom.start.session : null,   // 0.5.0 C6b: THE SESSION (main.js createSession over the one part): read(), armed(), flush()
    get timeline() { return app.state.tl; },   // 0.5.0 C7b: the kit's TIMELINE (installTimeline's result: model, editor, controller, open/close), for the timeline suite
    get render() { return app.state.filmCard; },   // 0.5.0 C7b: the RENDER card ({ card, view, recorder, plan, place }; view.state() is the kit's harness read)
    conduct: { apply: (score) => import('../../tools/conduct-score.js').then((m) => m.apply(app.sh.LW, score)) },   // 026 A2: THE CONDUCTOR — a SCORE through the live doors (on demand, never precached)
    verbs,   // 0.6.6 G1: THE VERB TABLE + THE INVENTORY (lab/verbs.js): run(list, { who }), inventory(), table
  };
}
