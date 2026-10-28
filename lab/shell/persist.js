/* lab/shell/persist.js — §24 PERSISTENCE (0.5.2 R3a; moved verbatim out of lab/rack.js boot()): the edit scope, serialize() — ONE interleaving
 * literal — and restore() — ONE ordered program — whole, never split by card.  createPersist(app) runs at §24's seat: the cards' handles come
 * from app (boot() fills each slot after its declaration), the controller's and SPECTRUM's are read live at use (app.ctl.x, app.w.spectrum).
 * serialize / restore / save / copyJSON are registered on app.sh for the modules that read them (the links, the history, STATE). */
import { TIER } from '../tier.js';
import { VIEW, VIEW_NAMES, STYLE, STYLE_NAMES, quatFromYawPitch, waveView, drawStyle } from '../field.js';
import { deviceQuality } from '../first-run.js';
import { getHamiltonian, setHamiltonian, HAMILTONIANS, setZ, getZ, setMu, getMu } from '../hamiltonian.js';
import { clampShift } from '../camera-law.js'; import { clampLambda } from '../sturmianreg.js'; import { BASIS, N6, narrow, widen } from '../hydrogen.js'; import { LAT } from '../lattice.js'; import { BL } from '../bloch.js'; import { save as centralSave, configure as centralConfigure } from '../central.js'; import { save as sepSave, load as sepLoad } from '../separable.js'; import { OMORPH } from '../orbitalsview.js';
const LS_EXP = 'lambdawaves.q0.experiment', LS_PRES = 'lambdawaves.q0.presentation';
export function createPersist(app) {
  const { ui, reg, clock, obs, mat, FIELD_CHROME, rates, energyOf, sturm, PAL_DEF } = app; const { schedule, paceRate } = app.loop; const { quality, layout, phone, tablet } = app.sh;
  const { camera, camLevel, syncFreeAngles, syncCamUI } = app.host;
  const { wState, switchHamiltonian, applySturmian, setElement, fillValence, shadowView, shadowFoot, kepler, vortex, particles, slice, wChem, ladder, wignerView, kepShell,
    keplerRowSync, gas, stageTextTick } = app.w;
  /* ── persistence (§46): experiment and presentation, separately ───────── */
  /* 0.3.1 · S3 THE EDIT SCOPE (PLAN §4.1, D6; docs/STATE-SCOPES.md) — what the history reads, keys and writes back: the PROJECT keys
     minus the view, quality, the notebook and the WORKSPACE (no DOM read), and minus what a clock or a modulator moves (experiment.t,
     a bound macro's value, a modulated target's output — its seat keeps the base —, mat.steps, domain.half under AUTO). */
  const EDIT_SKIP = ['obs', 'quality', 'layout', 'modwin', 'camera', 'notebook'];
  const shellSeat = (R, n) => R && { get v() { return R[BASIS.findIndex((s) => s.n === n)] ?? 1; },   // 0.6.0 B3a: a shell route's seat writes only a shell that shares one rate — a hand's per-label rates are never flattened
    set v(x) { const sh = BASIS.filter((s) => s.n === n);
      /* iteration 009 DEMOS: a 91-wide record's n = 7 is at 1 by absence (the getter reads it so, X6) — its base seat writes 1 into nothing, so
         an n ≤ 6 file stays 91 wide (A7's law); any other rate there widens the record to the 140, the rest of n = 7 at 1 */
      if (sh[0].index >= R.length) { if (x === 1) return; for (let i = R.length; i < BASIS.length; i++) R[i] = 1; }
      if (sh.every((s) => R[s.index] === R[sh[0].index])) for (const s of sh) R[s.index] = x; } };
  /** where each modulation target's hand value sits in a serialize() record, [object, key, f, back]: a saved project and a history
   *  row keep the registry BASE there.  A STATES lane slot (f: its amplitude / wrapped phase) is seated by the edit scope only. */
  function modSeats(data) {
    const pr = data.presentation, I = pr.instruments || {}, st = I.states, T = 2 * Math.PI;
    return { 'observer.yaw': [pr.obs, 'yaw'], 'observer.pitch': [pr.obs, 'pitch'], 'observer.dist': [pr.obs, 'dist'], 'observer.fov': [pr.obs, 'fov'],
      'observer.panx': [pr.obs && pr.obs.shift, 0], 'observer.pany': [pr.obs && pr.obs.shift, 1],
      'material.stage': [pr.ui.stage, 'mix'], 'material.gamma': [pr.mat, 'gamma'], 'material.exposure': [pr.mat, 'exposure'], 'material.softness': [pr.mat, 'softness'],
      'material.hue': [pr.mat, 'hueShift'], 'material.iso': [pr.mat, 'iso'], 'material.grain': [pr.mat, 'grain'], 'material.knee': [pr.mat, 'knee'],
      'material.slice.pos': [pr.mat.slice, 'pos'], 'material.slice.thick': [pr.mat.slice, 'thick'], 'transport.rate': [data.experiment, 'rate'],
      'state.rot.z': [pr.rotationRates, 'z'], 'state.stark.kz': [pr.rotationRates, 'kz'], 'state.defect.l2': [pr.rotationRates, 'def'], 'state.rabi': [pr.ab, 'omega'],
      ...Object.fromEntries([1, 2, 3, 4, 5, 6, 7].map((n) => ['shell.rate.n' + n, [shellSeat(pr.rates, n), 'v']])),
      'chem.kick': [I.chem, 'kappa'], 'chem.speed': [I.chem, 'speed'], 'chem.orbital': [I.chem && Number.isFinite(I.chem.orbital) ? I.chem : null, 'orbital'],   // iteration 007 O: an orbital not yet chosen (null, HOMO by default) is never seated
      'reg.morph': [st, 'morph'], [OMORPH]: [I.orbitals, 'morph'], 'reg.e0': [st && st.drive, 'e0'], 'reg.w': [st && st.drive, 'omega'],
      ...Object.fromEntries(((st && st.lanes) || []).slice(0, 8).flatMap((L, i) => [['reg.amp' + (i + 1), [L, 'amp', Math.sqrt, (a) => a * a]], ['reg.ph' + (i + 1), [L, 'phase', (v) => ((v % T) + T) % T]]])) };
  }
  /* 0.5.0 D9 · QCD's window is deleted; its record `instruments.qcd` stays as QUARKONIUM's parameters (the key and shape it had) */
  const quarkonium = () => { const s = HAMILTONIANS.cornell.system; return { kind: s.kind, potential: s.pot, params: { alphaS: s.params.alphaS, sigma: s.params.sigma, C: s.params.C } }; };
  app.state.restoreNotice = '';   // D9: what the last restore could not bring back (a retired legacy window), in one line; '' when nothing
  function serialize(opt) {
    const edit = !!(opt && opt.scope === 'edit');
    const m = JSON.parse(JSON.stringify(mat)); for (const k of ['bg', 'lightUI', 'stageCustom', ...FIELD_CHROME]) delete m[k];   // the stage colour travels under presentation.ui.stage; GAMMA remains an artist-owned material value; the chrome is the reader's (S1)
    const H = getHamiltonian();
    /* WAVE 56 · THE TWO KEYS A LINK NEEDED.  `damping` (DRAG γ) lived only in the undo ring's own record and
       `paletteId` only in this browser's settings, so a state serialised for a LINK arrived at the reader with
       neither.  Both are additive: restore() reads neither, so a project written today opens on a build from
       yesterday and a project written yesterday opens here, unchanged in either direction — the link-open path
       below is what applies them, because a link is the one road on which they are somebody else's. */
    const S = { experiment: Object.assign(reg.serialize(clock.t), { rate: clock.rate, window: clock.window, damping: reg.damping }),
      presentation: { obs: { ...obs, shift: [...obs.shift] }, mat: m, quality: { ...quality }, domain: { ...app.ctl.domain }, shadow: shadowView.mode,
        paletteId: app.state.palette ? app.state.palette.id : PAL_DEF,
        space: app.state.space, palette: app.state.palette ? { on: app.state.palette.on, selected: app.state.palette.selected, stops: app.state.palette.stops.map((s) => ({ at: s.at, rgb: Array.from(s.rgb) })) } : null,
        hamiltonian: { id: H.id, Z: getZ(), ...(getMu() !== 1 && { mu: getMu() }), atomZ: HAMILTONIANS.atom.Z, well: HAMILTONIANS.well.radius, gasBasis: app.state.gasAxial ? 'axial' : 'reg' },
        wigner: { zmax: wignerView.zmax, pmax: wignerView.pmax },
        readers: { spectrum: { selected: app.w.spectrum.selected, dials: app.w.spectrum.dials }, slice: slice.save(), kepler: { shell: kepShell() } },
        /* Static instrument controls belong to the composition. Solver caches, traces, collisions,
           particles and pulse runs do not: every project still opens paused on its first frame. */
        instruments: { chem: app.state.chem.save(), orbitals: app.state.orbitals.save(), states: app.state.states.save(), register: { mode: app.state.register.mode }, qcd: quarkonium(),
          ladder: { ...ladder.params }, lattice: LAT ? LAT.save() : undefined, bloch: BL ? BL.save() : undefined, central: centralSave(), separable: sepSave(),   // 0.7.2 L1, 0.8.1 T1, 0.8.0 G1, 0.9.4 S1: absent at the defaults
          particles: { count: Math.round(ui.pN.get()), trail: particles.trailLen } },
        rates: Array.from(narrow(rates, 1)), rotationRates:   /* iteration 008 A7: 91 wide while n = 7's rates are all 1, so an older file's bytes never move */ { ...app.ctl.rotRate }, sturmian: { on: sturm.on, lambda: sturm.lambda },
        modulation: app.state.modHost ? modRackStamped() : null,
        /* 2026-09-10 (Josh): A PROJECT IS A DAW PROJECT — the stage, the window arrangement (every window as it stands,
           floats included), the modulation window's placement, auto-rotate, the overlays, SPECTRUM's DIALS fold, the A/B
           transition, the notebook's size when it was resized. Every key is additive: a file without it opens as before.
           0.3.1 · S1 THE SCOPE LAW (docs/STATE-SCOPES.md): the theme, card style, frost, disconnected cards, accents and
           the camera's feel are PREFERENCE — the reader's furniture — and are never written here again. */
        ui: { stage: { mix: app.state.stageMix, custom: mat.stageCustom.slice(0, 3), follow: app.state.stageFollow } },
        layout: !edit && layout.captureLayout ? layout.captureLayout() : null,
        modwin: !edit && app.state.modView ? app.state.modView.presentation() : null,
        camera: { autoRotate: !!camera.autoRotate },
        overlays: { vortex: { on: !!vortex.on, overlay: !!vortex.overlay }, kepler: !!kepler.on, particles: { on: !!particles.on, count: particles.points.length }, dials: !!app.w.spectrum.dials },
        ab: ui.ab ? ui.ab.get() : null,
        notebook: !edit && layout.notebookSize ? (() => { const n = layout.notebookSize(); return n.custom ? { w: n.w, h: n.h } : null; })() : null } };
    const T = !edit && app.state.tl ? app.state.tl.model.serialize() : null;
    if (!edit) refuseNodes(S.presentation.modulation, T);
    if (T && (T.clips.length || T.active)) S.presentation.timeline = T;   // 0.5.0 C7b: the arrangement, only when there is one (NEW and the demos stay byte-exact); never an undo row's
    { const E = app.state.eq.serialize(); if (E) S.presentation.eq = E; }   // 0.6.0 B2: the BEAT EQUALIZER, PROJECT and default-absent (FLAT writes nothing)
    if (!edit) return S;
    const pr = S.presentation, R = app.state.modHost && app.state.modHost.registry;
    delete S.experiment.t; delete pr.mat.steps; if (pr.domain.auto) delete pr.domain.half;
    for (const mc of (pr.modulation && pr.modulation.macros) || []) if (mc.sourceId) delete mc.value;
    if (R) for (const [id, [o, k, f]] of Object.entries(modSeats(S))) if (o && R.has(id) && R.isModulated(id)) o[k] = f ? f(R.baseOf(id)) : R.baseOf(id);
    for (const k of EDIT_SKIP) delete pr[k];
    return S;
  }
  /** 021 R2 · CALL 3: A PROJECT NEVER NAMES THE READER'S GRAPH.  NODES is PREFERENCE (per device), so a `nodes.*` route or TIMELINE curve
   *  (and its clips) is refused on the way into a file, the session, a link or FOLDERS — one console line when the count changes.  The
   *  edit scope keeps them (an undo row is this tab's, not a file). */
  let refusedSaid = 0;
  function refuseNodes(M, T) {
    const isN = (id) => typeof id === 'string' && id.startsWith('nodes.');
    let n = 0;
    if (M && Array.isArray(M.routes)) { const keep = M.routes.filter((r) => !isN(r && r.targetId)); n += M.routes.length - keep.length; M.routes = keep; }
    if (T && Array.isArray(T.curves)) { const gone = new Set(T.curves.filter((c) => isN(c && c.targetId)).map((c) => c.id));
      if (gone.size) { n += gone.size; T.curves = T.curves.filter((c) => !gone.has(c.id)); T.clips = (T.clips || []).filter((c) => !gone.has(c.curveId)); } }
    if (n !== refusedSaid) { refusedSaid = n; if (n) console.info('NODES: ' + n + ' route/lane target' + (n === 1 ? '' : 's') + ' on nodes.* left out of the project (the graph is PREFERENCE)'); }
  }
  /** WAVE 63 · THE RACK CARRIES ITS MODEL VERSION, because nothing else on this road did.
   *  `mod.js` stamps `modV` on a PRESET record and `presetApply` refuses a stamp it cannot read —
   *  that machinery is why bumping MOD_STATE_V to 104 protects the preset store.  But the model's
   *  own `serialize()` emits NO version at all and `deserialize()` checks none, so a project file
   *  and this browser's localStorage — the road the lab actually uses every session — were
   *  version-blind: a rack with a bipolar route, opened by a build that took an upstream `mod.js`
   *  and lost markers 2/8 and 6/8, would drop the flag and move the base by 30 % of scale with no
   *  warning at all.  `v` is additive (the model ignores an unknown key, so this is byte-compatible
   *  in both directions) and `restoreModulation` below is the loader that refuses what it cannot
   *  honour.  `rack.js` is OURS, so the guard survives an upstream re-take of the vendored file —
   *  which is the whole scenario PORT-NOTES.md warns about. */
  function modRackStamped() {
    const o = app.state.modHost.model.serialize();
    o.v = app.state.modHost.model.MOD_STATE_V;
    return o;
  }
  /** LOAD A MODULATION RACK.  The model's own law: a load is STOPPED and starts at bar 1 with phase 0,
   *  so the transport is put down first, every held parameter is handed back to its base, and the
   *  dormancy law is re-run — a route saved against a target this build does not have keeps its
   *  settings and sits inert rather than being thrown away. */
  function restoreModulation(o, savedBases, opening) {
    if (!app.state.modHost) return false;
    /* REFUSE WHAT THIS BUILD CANNOT HONOUR, and say so.  An ABSENT `v` is not a refusal — every
       rack written before wave 63 has none and means "predates the stamp", which is the same
       reading `mod.js` prescribes for an absent preset stamp.  A stamp we do not know is a rack
       whose routes may mean something this model does not implement, and loading it half-read is
       the silent 30 % the version exists to prevent: leave the rack exactly as it was and put the
       two numbers on the card. */
    const V = o && typeof o === 'object' ? o.v : undefined;
    if (V !== undefined && !app.state.modHost.model.modStateReadable(V)) {
      wState.setStatus('modulation rack refused — model ' + V + ', this build reads ' +
                       app.state.modHost.model.MOD_STATE_READS.join(' · '), 'warn');
      return false;
    }
    app.state.modHost.clock.pause();
    /* Capture the project values before restoreAll hands the previous rack's live targets back.
       Old projects have no explicit base table; for those, the fully restored controls are the
       migration source. New projects use savedBases, which remains stable through modulation. */
    const incoming = Object.fromEntries(app.state.modHost.registry.list().map((id) => [id, app.ctl.modGets[id] ? Number(app.ctl.modGets[id]()) : NaN]));
    app.state.modHost.registry.restoreAll();
    const ok = app.state.modHost.model.deserialize(o || null);
    app.state.modHost.targets.sync();
    for (const id of app.state.modHost.registry.list()) {
      const v = savedBases && !id.startsWith('nodes.') && Number.isFinite(savedBases[id]) ? savedBases[id] : incoming[id];   // 021 R2: a file's nodes.* bases are not the reader's graph
      if (Number.isFinite(v)) app.state.modHost.registry.setBase(id, v);
    }
    app.state.modHost.clock.applyAll(true);
    if (app.state.modView && !opening) app.state.modView.rebuild();                    // wave 127: a window the file opens is rebuilt by its open() (the kit's window.js restore → open → rebuild)
    schedule(TIER.PRESENT);
    return ok;
  }
  function save() { try { const s = serialize(); localStorage.setItem(LS_EXP, JSON.stringify(s.experiment)); localStorage.setItem(LS_PRES, JSON.stringify(s.presentation)); wState.setStatus('saved', 'live'); } catch (e) { wState.setStatus('save failed', 'warn'); } }
  /** the whole session as JSON on the clipboard — STATE's COPY JSON and the FILE menu's row are this one road (N1) */
  async function copyJSON() { try { await navigator.clipboard.writeText(JSON.stringify(serialize(), null, 1)); } catch (_) {} }
  /** opt.history (UNDO / REDO, S3): an edit-scope record; the transport stays where it is (the anchor c(0) travels, so the picture
   *  only moves if the coefficients did) and the ring, notebook, view and arrangement are left alone.  opt.project: a file opens at
   *  t = 0.  Neither clears the history: the road that opened the file does, naming it (boot, link, open · …). */
  function restore(obj, opt) {
    const hist = !!(opt && opt.history), gone = [], cut = []; let said = '';   // cut: iteration 008 W's views that left WAVE (Re+Im, Δρ), named once below                  // D9: the retired legacy windows this file used, named once below
    if (!hist) app.state.restoreNotice = '';
    app.ctl.markBatchBegin();                                                // M7: released in the finally below
    try {
      if (opt && opt.project && app.state.modHost) { app.state.modHost.clock.pause(); app.state.modHost.registry.restoreAll(); }   // S2 · a project open puts the running modulation down FIRST (wave 127's law): a route still holding the stage wrote its old base back over the file's mix
      const ex = obj ? obj.experiment : JSON.parse(localStorage.getItem(LS_EXP) || 'null');
      let pr = obj ? obj.presentation : JSON.parse(localStorage.getItem(LS_PRES) || 'null');
      /* S3 · an UNDO re-applies a heavy section only when it moved (probes/S3/undo-while-playing.js: reloading an unchanged rack
         stopped a playing transport and reset every LFO; the palette, instruments and overlays re-upload, re-own or re-seed) */
      if (hist && pr) { const now = serialize({ scope: 'edit' }).presentation; pr = { ...pr };
        for (const k of ['modulation', 'palette', 'instruments', 'overlays']) if (JSON.stringify(pr[k]) === JSON.stringify(now[k])) delete pr[k]; }
      if (ex) {
        if (reg.transition && app.hooks.ab) app.hooks.ab.set(false);   // wave 127 · every road stands a running A/B transition down FIRST (UNDO's law): clearing it later froze its mix over the register written here
        const t = reg.restore(ex);
        if (!hist) {
          clock.pause(); clock.seek(opt && opt.project ? 0 : t, { schedule: false });   // 021 R3: THE ONE SEEK (the playhead and the trail)
          shadowFoot.clear(); particles.resetClock(clock.t);
        }
        if (Number.isFinite(ex.rate) && ex.rate > 0) clock.setRate(paceRate(ex.rate));
        if (ex.window) clock.window = ex.window;
        if (Number.isFinite(ex.damping)) { reg.setDamping(ex.damping); if (ui.dragKnob) ui.dragKnob.set(reg.damping); }
        ui.rateKnob.set(clock.rate); ui.presetSel.value = reg.preset || ''; app.state.lastNmax = -1; app.ctl.setReference();
      }
      if (pr) { if (!hist) { camLevel.from = null; Object.assign(obs, pr.obs || {}); if (pr.obs) obs.shift = clampShift(!camera.lock && pr.obs.shift);   /* 0.5.3 M6: under the LOCK a file's shift opens centred (the record is not written) */ obs.mode = obs.mode === 'free' ? 'free' : 'turntable';   /* S2: a pose without a shift (an older file or link) opens at 0 */ if (!Array.isArray(obs.quat) || obs.quat.length !== 4) obs.quat = quatFromYawPitch(obs.yaw, obs.pitch); if (obs.mode === 'free') { /* WAVE 106 · THE ANGLES ARE A READOUT IN FREE, AND A READOUT MUST NOT MOVE THE RECORD.
      A link rounds the quaternion to f32; re-deriving the angles from THAT quaternion lands them an ulp off the
      ones the link carried, so mint(open(link)) stopped being byte-identical the moment the camera began booting
      FREE — B98's fixed point, and the codec's own node suite cannot see it because the asymmetry is here and not
      in statelink.js.  A record whose angles already agree with its pose far closer than any dial can show KEEPS
      the ones it carried; anything that genuinely disagrees is still re-derived, which is what an old favourite
      carrying no quaternion needs. */
      const y0 = obs.yaw, p0 = obs.pitch; syncFreeAngles();
      if (Math.abs(obs.yaw - y0) < 1e-4 && Math.abs(obs.pitch - p0) < 1e-4) { obs.yaw = y0; obs.pitch = p0; } } camera.stop(); syncCamUI(); } const pm = { ...(pr.mat || {}) }; for (const k of ['bg', 'lightUI', ...FIELD_CHROME]) delete pm[k]; if (pm.view !== undefined) { const wv = VIEW[waveView(pm.view) || 'density']; if (wv !== pm.view && !hist) cut.push(pm.view === 5 ? 'Re+Im left WAVE: opened as PHASE' : 'Δρ left WAVE: opened as DENSITY'); pm.view = wv; }   /* iteration 008 W: a saved Re+Im opens as PHASE, a saved Δρ as DENSITY */ if (pm.style !== undefined) { const ds = STYLE[drawStyle(pm.style)]; if (ds !== pm.style && !hist && pm.style === STYLE.grain) cut.push('GRAIN joined DUST: opened as DUST'); pm.style = ds; }   /* iteration 008 G: a saved GRAIN opens as DUST */ Object.assign(mat, pm);   /* S1: an older file's chrome is the sender's preference — ignored, so the reader's frame, axes and invert stand */ if (Number.isFinite(pm.gamma) && ui.gammaK) ui.gammaK.set(pm.gamma); mat.finish=pm.finish||'lit'; mat.bow={gain:1,curve:1,limit:3,...pm.bow}; if(ui.finishSeg)ui.finishSeg.set(mat.finish||'lit'); if(ui.bowKnobs)for(const k in ui.bowKnobs)ui.bowKnobs[k].set(mat.bow?.[k]??({gain:1,curve:1,limit:3}[k])); if (ui.styleSeg && STYLE_NAMES[mat.style]) ui.styleSeg.set(STYLE_NAMES[mat.style]); Object.assign(quality, deviceQuality(pr.quality, phone.on ? 'phone' : tablet.on ? 'tablet' : 'desktop'));   /* PACE P2: within the device's grid ceiling, and never AUTO SCALE (the device's switch) */ Object.assign(app.ctl.domain, pr.domain || {}); ui.viewSeg.set(VIEW_NAMES[mat.view]); if (pr.shadow) { shadowView.setMode(pr.shadow); ui.shadowSeg.set(pr.shadow); } ui.domainAuto.set(app.ctl.domain.auto); ui.domainKnob.setDisabled(app.ctl.domain.auto); }
      /* A restored number and the control that owns it are one state. Keep every Wave, Clip,
         field and quality control on the value that was just loaded before modulation reads it. */
      if (pr) {
        for (const [k, v] of [[ui.expK, mat.exposure], [ui.softK, mat.softness], [ui.hueK, mat.hueShift],
          [ui.isoK, mat.iso], [ui.grainK, mat.grain], [ui.kneeK, mat.knee], [ui.slicePosK, mat.slice && mat.slice.pos],
          [ui.sliceThickK, mat.slice && mat.slice.thick]]) if (k && Number.isFinite(v)) k.set(v);
        if (ui.sliceModeSeg && mat.slice) ui.sliceModeSeg.set(['off', 'clip', 'slab'][mat.slice.mode] || 'off');
        if (ui.styleSync) ui.styleSync(pr.mat || {});   // iteration 014 B: THE THREE VIEWS' keys (absent: the defaults); iteration 015 W1: every WAVE control the style reads
        if (ui.sliceAxisSeg && mat.slice) ui.sliceAxisSeg.set(['x', 'y', 'z'][mat.slice.axis] || 'z');
        if (ui.gridSeg && [64, 96, 128].includes(quality.res)) ui.gridSeg.set(String(quality.res));
        if (ui.autoSw) ui.autoSw.set(!!quality.auto);
        if (ui.domainKnob && Number.isFinite(app.ctl.domain.half)) ui.domainKnob.set(app.ctl.domain.half);
        if (ui.bz) ui.bz.set(reg.field.Bz); if (ui.fz) ui.fz.set(reg.field.Fz);
        app.ctl.applyAccent();
      }
      if (pr) {
        /* WAVE 63 · A LINK'S MATERIAL WAS DISCARDED 16 ms AFTER IT OPENED.  `Object.assign` above has
           just put the sender's camera and material into `obs`/`mat`; for a target THIS browser has
           routed, nothing then read them: `modSyncBases()` skips modulated ids on every frame by
           design, and the only unconditional re-base lives inside `restoreModulation`, which runs
           only `if (pr.modulation !== undefined)` — a key a LINK never sets and an UNDO record
           deliberately never sets.  So the receiver's own base won one frame later, the visitor never
           saw the sender's exposure 6.5, and pulling the route off afterwards handed back 1.  The
           re-base is unconditional now, and it is FIRST, because restoreModulation's own
           restoreAll() writes the registry's bases back into `mat` and would otherwise clobber the
           file's numbers for exactly the parameters that were modulated when it opened. */
        if (!hist) app.ctl.modSyncBases(true);   // an UNDO's come from its record, below
        if (sturm.P) { sturm.on = false; sturm.P = null; sturm.rec = null; reg.setPropagator(null); reg.setEnergies(energyOf); }   // W-STURMIAN: stand the scale down silently (no re-anchoring) while the file's operator, Z and rates land; its own scale is applied below
        if (pr.instruments) { centralConfigure(pr.instruments.central); sepLoad(pr.instruments.separable); }   // 0.8.0 G1 · 0.9.4 S1: CENTRAL's { preset, params } and SEPARABLE's { form, wx, wy, wz } (absent = the defaults) before their operator is switched to
        if (pr.hamiltonian) { const h = pr.hamiltonian; if (h.atomZ) setElement(h.atomZ); if (h.Z && h.Z !== getZ()) { setZ(h.Z); if (ui.zKnob) ui.zKnob.set(h.Z); } setMu(h.mu || 1); if (h.well && h.well !== HAMILTONIANS.well.radius) { HAMILTONIANS.well.setRadius(h.well); gas.setRadius(h.well); if (ui.wellKnob) ui.wellKnob.set(h.well); } if (h.id && HAMILTONIANS[h.id]) { setHamiltonian(h.id); switchHamiltonian(h.id); if (ui.hamSeg) ui.hamSeg.set(h.id); } app.state.gasAxial = h.gasBasis === 'axial'; if (ui.gasBasis) ui.gasBasis.set(app.state.gasAxial ? 'axial' : 'reg'); if (!app.state.gasAxial) gas.off(); }
        if (pr.wigner) { const G = pr.wigner; wignerView.setRange(G.zmax, G.pmax); }
        if (pr.instruments) {
          const I = pr.instruments;
          if (I.qcd && typeof I.qcd === 'object') {                    // D9: QUARKONIUM's parameters, as the deleted QCD window applied them
            const q = I.qcd, p = {}; for (const k of ['alphaS', 'sigma', 'C']) if (q.params && Number.isFinite(q.params[k])) p[k] = q.params[k];
            if (HAMILTONIANS.cornell.configure(q.kind, p, q.potential) && getHamiltonian().id === 'cornell') switchHamiltonian('cornell');
          }
          /* Set all field-owning instruments down before selecting the saved one. Their public
             switches enforce mutual exclusion and also own the window-visibility policy. */
          /* D9 · THE H₂⁺ SHIM: a file whose field the retired H₂⁺ card owned opens as MOLECULES · H₂ (STO-3G) on σg or σu — in a
             minimal basis of two 1s functions both orbitals are fixed by symmetry, the combinations the card drew (its R, ON A and the
             pulse have no twin; RHF refuses H₂⁺'s one electron).  Its old `mo` / `pulse` records are read by nothing. */
          const h2plus = !!(I.molecule && I.molecule.on) && !(I.chem && I.chem.on) && !(I.h2 && I.h2.on) && !(I.helium && I.helium.on);
          /* D9 · THE HELIUM SHIM: a file whose field the retired HELIUM card owned opens as SPECTRUM's ATOM at Z = 2 with the 1s
             filled (fillValence) — the central-field He; Hylleraas's correlation, its basis and electron 1 have no twin. */
          const he = !!(I.helium && I.helium.on) && !(I.chem && I.chem.on) && !(I.h2 && I.h2.on);
          /* D9b · THE H₂ SHIM: a file whose field the retired H₂ card (Heitler–London) owned opens as MOLECULES · H₂ (STO-3G) on
             its DENSITY — the card drew the one-electron density, and this is the same molecule's (its R scan, CI curves and the
             collision have no twin).  The old `h2` record and seat are read by nothing else. */
          const hl = !!(I.h2 && I.h2.on) && !(I.chem && I.chem.on);
          /* iteration 008 U · MOLECULES ON IS REGISTRY ON: a file that saved them apart opens with the molecule on when either was (its
             register's ON below is MOLECULES ON with VIEW REGISTRY and that pane) */
          const regOn = !!((I.orbitals && I.orbitals.on) || (I.states && I.states.on));
          const fieldOwner = (I.chem && I.chem.on) || h2plus || hl || (regOn && I.chem) ? 'chem' : null;
          if (I.chem) app.state.chem.load({ ...I.chem, on: false });
          if (h2plus) { const u = I.molecule.kind === 'sigma_u'; app.state.chem.load({ preset: 'H2', basis: 'sto-3g', view: 'orbital', orbital: u ? 2 : 1, on: false }); gone.push('H₂⁺ (opened as MOLECULES · H₂ ' + (u ? 'σu' : 'σg') + ')'); }
          if (hl) { app.state.chem.load({ preset: 'H2', basis: 'sto-3g', view: 'density', orbital: null, on: false }); gone.push('H₂ (opened as MOLECULES · H₂)'); }
          /* the ORBITALS register lands OFF first, like every field-touching card, and is switched on only after
             CHEMISTRY holds the volume — its own load() parks the selection until a ladder exists to hang it on */
          if (I.orbitals) app.state.orbitals.load({ ...I.orbitals, on: false });
          if (I.states) app.state.states.load({ ...I.states, on: false });
          if (I.register) app.state.register.setMode(I.register.mode);
          if (he) { setElement(2); fillValence(); gone.push('HELIUM (opened as ATOM · He 1s)'); }
          else if (fieldOwner === 'chem') app.state.chem.setOn(true);
          if (I.orbitals && I.orbitals.on && fieldOwner === 'chem') app.state.orbitals.setOn(true);
          if (I.states && I.states.on && fieldOwner === 'chem') app.state.states.setOn(true);   // parks itself until the ladder lands (statesview `wanted`)
          if (I.ladder) ladder.load(I.ladder);
          if (LAT) LAT.load(I.lattice); if (BL) BL.load(I.bloch);                                 // 0.7.2 L1: an absent record is the defaults                         // M2 (2026-09-24): lands the params, defers the scan (ladder.js load)
          if (I.particles) {
            if (Number.isFinite(I.particles.count)) ui.pN.set(I.particles.count);
            if (Number.isFinite(I.particles.trail)) { particles.setTrail(I.particles.trail); ui.pTrail.set(I.particles.trail); }
          }
        }
        /* D9b · THE ELECTROSTATICS SHIM: a file whose overlay the retired window drew opens without it and says so; nothing is drawn */
        if (pr.field && pr.field.overlay && pr.field.overlay !== 'off') gone.push('ELECTROSTATICS');
        if (Array.isArray(pr.rates) && (pr.rates.length === N6 || pr.rates.length === rates.length)) { rates.set(widen(pr.rates, 1)); reg.setEnergies(energyOf); }   // a 91-wide record: n = 7 at 1
        /* 2026-09-10 · THE DAW KEYS, each only when the file carries it (see serialize).  0.3.1 · S1: of `ui` only the STAGE
           is read; an older file's theme / card / frost / disc / accent, and its camera feel, are the sender's preferences
           and are ignored — opening a project never changes this browser's settings (docs/STATE-SCOPES.md). */
        if (pr.ui) { const U = pr.ui;
          if (U.stage) {
            if (Number.isFinite(U.stage.mix)) { app.state.stageMix = Math.max(0, Math.min(1, U.stage.mix)); if (ui.stageK) ui.stageK.set(app.state.stageMix); }
            const custom = Array.isArray(U.stage.custom) ? U.stage.custom : (Array.isArray(U.stage.b) ? U.stage.b : (Array.isArray(U.stage.a) ? U.stage.a : null));
            if (app.hooks.setStageColour) app.hooks.setStageColour(custom);
            if (app.hooks.setStageFollow) app.hooks.setStageFollow(typeof U.stage.follow === 'boolean' ? U.stage.follow : !custom);
          } }
        if (pr.camera) camera.setAutoRotate(!!pr.camera.autoRotate);
        if (pr.overlays) { const O = pr.overlays;
          if (O.vortex) { vortex.setOn(!!O.vortex.on); vortex.setOverlay(!!O.vortex.overlay); }
          if (O.kepler !== undefined) { kepler.setOn(!!O.kepler); if (ui.keplerSw) ui.keplerSw.set(!!O.kepler); }
          if (O.particles) { const count = pr.instruments && pr.instruments.particles && Number.isFinite(pr.instruments.particles.count) ? pr.instruments.particles.count : O.particles.count; if (O.particles.on) { particles.setOn(true); particles.seed(count || 160, reg, clock.t, app.ctl.domain.half); } else particles.setOn(false); ui.pOn.set(!!O.particles.on); }
          if (O.dials !== undefined && app.w.spectrum.setDials && !(pr.readers && pr.readers.spectrum)) app.w.spectrum.setDials(!!O.dials); }
        if (pr.readers) {
          if (pr.readers.spectrum) { const S = pr.readers.spectrum; if (Number.isFinite(S.selected)) app.w.spectrum.select(S.selected); if (S.dials !== undefined) app.w.spectrum.setDials(!!S.dials); }
          if (pr.readers.slice) slice.load(pr.readers.slice);
          if (pr.readers.kepler && Number.isFinite(pr.readers.kepler.shell) && ui.kepShell) { ui.kepShell.set(String(pr.readers.kepler.shell)); keplerRowSync(true); }
        }
        if (pr.ab && ui.ab) ui.ab.set(pr.ab);
        if (pr.notebook && layout.notebookResize && Number.isFinite(pr.notebook.w) && !(pr.layout && pr.layout.nb)) layout.notebookResize(pr.notebook.w, pr.notebook.h);   // wave 127: a layout carrying nb sizes it next (applyLayout), last
        if (pr.layout && layout.applyLayout) layout.applyLayout(pr.layout);
        if (pr.instruments && app.state.chem.on && !hist) wChem.root.classList.remove('closed');   // W129 · the same law for MOLECULES (a first visit leaves it off the rack): a file it owns brings it back — its register with it (iteration 008 U: one card)
        /* D9 · A FILE THAT USED A RETIRED WINDOW OPENS WITHOUT IT, AND SAYS SO IN ONE LINE (the PROJECTS status and STATE's): an old
           layout seat is skipped by applyLayout (no such card), nothing throws.  QCD counts as used when its seat was open. */
        if (!hist && pr.layout && Array.isArray(pr.layout.cards) && pr.layout.cards.some((c) => c && c.id === 'qcd' && !c.closed)) gone.push('QCD (QUARKONIUM keeps its parameters)');
        said = [gone.length ? 'retired in 0.5.0: ' + gone.join(' · ') : '', ...cut].filter(Boolean).join(' · '); if (said) app.state.restoreNotice = said;
        stageTextTick();                                              // the STAGE TEXT follows whatever MOLECULES the file left
        if (pr.sturmian) { sturm.on = !!pr.sturmian.on; sturm.lambda = clampLambda(pr.sturmian.lambda); } else sturm.on = false;   // a file without it means HYDROGEN
        applySturmian(true);                                          // the file's anchor is c(0) under the file's own law: keep it
        app.state.eq.restore(pr.eq);                                  // 0.6.0 B2: absent is FLAT; the loop's syncEq repaints the card and hands the field its table
        /* 017 X2 · AN EFFECT SHOWS ITS WINDOW (0.4.0 S0's ATOM law, made one): a record whose operator, static field, equalizer table or EMISSION's
           transition is in force brings that window back, powered — a project, a link, RESUME and an undo alike; under MOLECULES the atomic windows stay hidden */
        if (!app.state.chem.on) { const H = getHamiltonian().id, f = reg.field;
          for (const [id, on] of [['separable', H === 'separable'], ['central', H === 'central' || H === 'cornell'], ['atoms', H === 'atom'], ['staticfield', !!(f.Fz || f.Bz || f.inter)],
            ['equalizer', !app.state.eq.birth()], ['emission', !!reg.transition && /^emission:/.test(reg.preset || '')]]) {
            if (!on || !layout.reopen(id)) continue; const d = document.querySelector('.dev[data-id="' + id + '"]'); if (d.classList.contains('off')) d.querySelector('.dev-power').click(); } }
        /* S3 · an UNDO's bases are its record's seats, never read back off a control the modulator is moving (an unseated target keeps
           its base; an unmodulated one is the control just written) */
        const histBases = {};
        if (hist) { const R = app.state.modHost.registry, seats = modSeats(obj);
          for (const id of R.list()) if (R.isModulated(id)) { const s = seats[id]; R.setBase(id, histBases[id] = s && s[0] ? (s[3] || Number)(s[0][s[1]]) : R.baseOf(id)); } }
        // Restore operator rates AFTER the destination scale is installed. The old project's
        // Sturmian guard must not erase a Coulomb project's rates on the way in.
        const rr = pr.rotationRates;
        for (const key of Object.keys(app.ctl.rotRate)) {
          const v = app.ctl.setRotationRate(key, rr && Number.isFinite(rr[key]) ? rr[key] : 0);
          const id = key === 'z' ? 'state.rot.z' : key === 'kz' ? 'state.stark.kz' : 'state.defect.l2';
          app.state.modHost.registry.setBase(id, v);
        }
        if (pr.modulation === undefined) app.state.modHost.clock.applyAll(true);
        { const sp = pr.space === 'r' ? 'x' : pr.space;   // iteration 007 (MIR check, files B1): projects saved after an old link carry 'r' for position space
          if (sp && sp !== app.state.space && !getHamiltonian().noMomentum && !sturm.P) { app.state.space = sp; if (ui.spaceSeg) ui.spaceSeg.set(app.state.space); } }
        if (pr.palette && app.state.palette) {
          if (Array.isArray(pr.palette.stops)) app.state.palette.load(pr.palette.stops, pr.palette.selected, pr.paletteId); else if (pr.paletteId) app.state.palette.select(pr.paletteId);   // wave 127: the file's own stops under its name — one push, not a catalogue read then a load
          app.state.palette.setOn(!!pr.palette.on, true); if (mat.view !== undefined) ui.viewSeg.set(VIEW_NAMES[mat.view]);   // iteration 016 P6: the file's VIEW stands under PALETTE ON too (setOn's keepView)
        }
        /* Restore modulation last. Its base setters now see the final camera, Stage, transport,
           palette and state controls, so no later project step can overwrite a routed hand value. */
        const modWas = hist && pr.modulation !== undefined && app.state.modHost && app.state.modHost.clock.isPlaying();
        if (pr.modulation !== undefined) restoreModulation(pr.modulation, hist ? histBases : pr.modulationBases, !!(pr.modwin && pr.modwin.open));
        if (modWas) app.state.modHost.clock.play(performance.now() / 1000);       // S4 · restoreModulation put the clock down: an undo under THE play puts it back to playing (its demand is still held)
        if (pr.modwin && app.state.modView) app.state.modView.restore(pr.modwin);
        if (!hist && app.state.tl) app.state.tl.model.restore(pr.timeline || null);           // 0.5.0 C7b: an open replaces the arrangement (NEW clears it); an undo leaves it — it keeps its own
      }
      schedule(TIER.REBUILD); wState.setStatus(said || 'restored', said ? 'warn' : 'live');
      return true;
    } catch (e) { console.warn('restore failed', e); wState.setStatus('restore failed', 'warn'); return false; }   // say WHY in the console too: a silent catch hid a scope error for an afternoon
    /* OPTIMIZATION 2026-09-24 · M5: a restore that throws half-way has still moved state, and an early throw left it
       never rebuilt — so the rebuild is asked for on EVERY exit (on success it is the same coalesced request as above). */
    finally { schedule(TIER.REBUILD); app.ctl.markBatchEnd(); }
  }
  app.sh.serialize = serialize; app.sh.restore = restore; app.sh.save = save; app.sh.copyJSON = copyJSON; app.sh.restoreModulation = restoreModulation;
  return { modSeats, serialize, restoreModulation, save, copyJSON, restore };
}
