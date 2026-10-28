/* lab/shell/settings.js — §1 SETTINGS, what this browser remembers (0.5.2 R3a "Rack Dissolution"; moved verbatim out of lab/rack.js boot()).
 * createSettings(app) runs at §1's seat, BEFORE the controller's, so a controller name is read as app.ctl.x inside a callback, never at
 * creation — as are app.host.camera, app.sh.setModArm and app.sh.quality, which boot() fills later.  readSettings stays in rack.js' head
 * (§0 calls it first, U1) and comes by value; lookSync is registered for the controller; boot() destructures the rest. */
import { infoKnown } from './stage-words.js'; import { readSession } from '../mir/core/session.js';
import { ASK_ENABLED } from '../ask.js';   // iteration 011 Q6: the one flag (ASK hidden: the stored askOk / askUrl carried, never written)
import { RETIRED } from '../settings-store.js';   // 021 R4: the keys the blob drops (the carry list is gone)
import { getHamiltonian } from '../hamiltonian.js';   // 022 E1: availability reads the operator in force
const SESSION_KEY = 'lambdawaves.q0.session';   // main.js createSession's key (settings-store.js FAMILIES)
/* 021 R5 · ONE MODE: every window's mode, one seat beside KIND — 'hydrogen' (hidden under MOLECULES), 'molecules' (hidden under HYDROGEN),
   absent = 'both' (shown in either).  windows/molecules.js `moleculeMode` iterates it; the FINDER greys by it.  The atomic readers and
   operators are HYDROGEN's (they read or replace the hydrogenic register the molecule does not drive); LATTICE and BLOCH keep their own
   registers and touch neither, so they stand in both (LATTICE's benzene Hückel preset is a molecule's picture) */
export const MODE = Object.freeze({ spectrum: 'hydrogen', equalizer: 'hydrogen', staticfield: 'hydrogen', emission: 'hydrogen', shadow: 'hydrogen', orbit: 'hydrogen',
  vortex: 'hydrogen', slice: 'hydrogen', ladder: 'hydrogen', calculus: 'hydrogen', central: 'hydrogen', separable: 'hydrogen', atoms: 'hydrogen',
  wigner: 'hydrogen', radiation: 'hydrogen', chem: 'molecules', lattice: 'both', bloch: 'both' });
/* 022 E1 · AVAILABILITY IS ONE LAW: availability(control, app) → { on, why, hide } — whether a control stands, and why not, read in ONE place
   from the mode (a molecule holds the field), the operator in force (`noMomentum`), the scale (STURMIAN) and the molecule-only rows.  `on`
   false greys the control in its seat with `why` before its hint (016 V1: greyed, never moved); `hide` takes a molecule's row out under
   hydrogen (018 B1).  WAVE's styleSync applies it (windows/material.js `ui.availSync`); the operator, the scale, the mode, a restore and the
   facade ask it, never a rule of their own */
const MOLECULE_ROWS = new Set(['wave.style.balls', 'wave.style.sticks', 'wave.style.esp', 'wave.esp', 'info.espBar']);
const ON = Object.freeze({ on: true, why: '', hide: false });
export function availability(control, app) {
  const mol = !!(app.state.chem && app.state.chem.on);
  if (MOLECULE_ROWS.has(control)) return mol ? ON : { on: false, why: 'MOLECULES only', hide: true };
  if (control === 'wave.space.p') {
    const H = getHamiltonian(), why = mol ? 'off under MOLECULES' : app.sturm && app.sturm.P ? 'off under STURMIAN' : H.noMomentum ? 'off under ' + H.label.split('  ')[0] : '';
    return why ? { on: false, why, hide: false } : ON;
  }
  if (control === 'wave.view.imag') return mol && !(app.ctl.field && app.ctl.field.moleculeComplex) ? { on: false, why: 'a real volume: Im ψ is 0', hide: false } : ON;
  return ON;
}

export function createSettings(app) {
  const { ui, mat, settingsStore, useCompactDefaults, FIRST_RUN, appleDevice } = app; const { readSettings } = app.sh;
  /* ── SETTINGS: what this browser remembers (theme, chrome, accents, quality, closed windows) ── */
  let settingsLoaded = false;
  function saveSettings() {
    if (!settingsLoaded) return;
    try {
      /* 021 R4 · ONE STORE: THE BLOB IS { ...S0, ...owned } MINUS RETIRED.  This writer used to rebuild the object from an allowlist of
         carried keys, and every key another writer put here (the notebook's nbW/nbH and ABOUT's abW/abH, `warned`, `audioDevice`,
         `layouts`, `tlwin`) was erased by the next theme flip until it joined the list — waves 54, 59, 105 and M4 found that one hole
         four times.  Now what this function owns is written over what is there, and only the keys an older build wrote and nothing reads
         (RETIRED, settings-store.js) leave.  An owned value of undefined still drops its key (JSON), as before. */
      const S0 = readSettings(), owned = {
        nativeLayout: useCompactDefaults ? 1 : S0.nativeLayout, captions: !document.body.classList.contains('no-captions'),   // iteration 007: INFORMATIONAL's six keys left for their own record, lambdawaves.q0.info (shell/stage-words.js)
        auto: app.sh.quality.auto, governor: app.ctl.gov.on, keepFrames: app.ctl.keep.frames, perfMode: app.ctl.perf.mode, playLock: app.ctl.fieldRate.lock || undefined, playHz: app.ctl.fieldRate.hz || undefined,   // 020 L2: PLAYBACK LOCK, written only when not WALL · DISPLAY
        /* WAVE 51 · THE CAMERA'S FEEL IS A PREFERENCE, not a project's.  AUTO-ROTATE is deliberately NOT here: a lab that starts turning
           by itself when you open it is a surprise, not a setting. */
        friction: app.host.camera.friction, dragGain: app.host.camera.dragGain, fling: app.host.camera.flingGain, camLock: app.host.camera.lock, audio: !!(ui.audioSw && ui.audioSw.get()),
        ...(ASK_ENABLED ? { askOk: ui.askOk || undefined, askUrl: (ui.askUrlIn && ui.askUrlIn.value.trim()) || undefined } : {}),   // iteration 011 Q6: ASK hidden → the stored pair stays as it was
        /* WAVE 64 · THE PORTED WINDOW'S PRESENTATION STATE (host-contract.md's sixth debt): where the window sits, the lanes, each device's
           F/C/M mode, the ribbon, open or not.  The RACK itself rides in the project file. */
        ...(app.state.modView ? { modwin: app.state.modView.presentation() } : {}),
        frame: mat.frame !== false, axis: mat.axis !== false, frameMode: mat.frameMode, axisMode: mat.axisMode, cornerSide: mat.cornerSide,
        /* WAVE 106 · INVERT and AXIS COLOUR are this browser's, like FRAME and AXIS (0.3.1 S1, D1: the whole field chrome; serialize() strips it) */
        invert: !!mat.invert, axisInk: mat.axisInk || 'theme', dither: +mat.dither || 0,   // iteration 008 W: DITHER is this display's (SETTINGS › QUALITY), always written, so a profile older than it is known by its absence (the lift below)
        phoneTr: !!document.querySelector('.dev[data-id="transport"].folded'),
        /* WAVE 59 · WHICH WAY THE PHONE'S RACK WAS LEFT (phone-only; the DEFAULT, nothing said, is HIDDEN — see enterPhone()) */
        ...(document.body.classList.contains('phone') ? { phoneRack: !document.body.classList.contains('rack-hidden') } : {}),
        /* WAVE 54: which colour space this BROWSER asked for.  0.3.1 · S1: the camera MODE and the palette left this key (PROJECT, D2/D4) */
        gamut: document.body.dataset.gamut === 'p3' ? 'p3' : 'srgb', p3Mode: ui.p3Seg ? ui.p3Seg.get() : 'convert',
        closed: [...document.querySelectorAll('.dev.closed')].map((d) => d.dataset.id), gen: 16 };   // iteration 016 E1: the generation, read by applySettings' `older` table
      const blob = { ...S0, ...owned }; for (const k of RETIRED) delete blob[k];
      settingsStore.write(blob);
    } catch (e) {}
  }


  /* 0.5.0 C2 · THE LOOK'S SETTERS are the store's (lab/look.js): one `set`, on the page in the same task, and SETTINGS repainted
     from the store (lookSync).  An unnamed card is the device's and an unknown frost is OFF, as they always were. */
  function setCardStyle(id) { app.ctl.look.set({ card: id === 'tinted' || id === 'refractive' ? id : FIRST_RUN.card }); return document.body.dataset.card; }
  function setFrost(mode) { app.ctl.look.set({ frost: mode === 'still' || mode === 'always' ? mode : 'off' }); return app.ctl.look.get('frost'); }
  function setDisconnected(v) { app.ctl.look.set({ disconnected: !!v }); return !!v; }
  /** the SETTINGS controls the look store drives, repainted from it — none since iteration 003: every look control is MIR OPTIONS'
   *  (lab/mir-gui.js), and the kit's window follows the store itself (createGui sync).  Kept as the controller's subscriber seat. */
  function lookSync() {}
  app.sh.lookSync = lookSync; app.sh.saveSettings = saveSettings; app.sh.setCardStyle = setCardStyle; app.sh.setFrost = setFrost; app.sh.setDisconnected = setDisconnected; app.sh.applySettings = applySettings;
  function applySettings() {
    const s = readSettings();
    app.ctl.look.rerun();   // 0.5.0 C2: the look again, now that the theme's engine hooks exist (MIR OPTIONS follows the store itself, iteration 003)
    const captions = s.captions === true;
    document.body.classList.toggle('no-captions', !captions); if (ui.capSw) ui.capSw.set(captions);
    /* THE STAGE FORMULA, the ATOM LABELS, their SIZEs, POSITION and PAD left this blob at iteration 007 for INFORMATIONAL's own record
       (`lambdawaves.q0.info`, shell/stage-words.js infoPrefs: the lift reads the six keys once by the laws this block read them by, and
       initStageText applies the record) */
    if (s.auto === false) { app.sh.quality.auto = false; if (ui.autoSw) ui.autoSw.set(false); }
    if (s.governor === false) app.ctl.setGovernor(false);                 // wave 45: the governor held off
    if (s.keepFrames === true) app.ctl.setKeepFrames(true);              // wave 45: the playhead follows every frame (off by default)
    app.ctl.setPerfMode(s.perfMode === 'full' ? 'full' : '120');
    app.ctl.fieldRate.lock = s.playLock === true; app.ctl.fieldRate.hz = [30, 60, 120].includes(s.playHz) ? s.playHz : 0; if (ui.showPlayback) ui.showPlayback();   // 020 L2: absent = WALL · DISPLAY         // an absent key takes the official 120 Hz profile; an explicit FULL choice survives
    if (typeof s.friction === 'number') app.host.camera.setFriction(s.friction);   // wave 51: the camera's feel comes back … but AUTO-ROTATE never does (see saveSettings); 018 B4: SPIN left, an old `spin` is read by nothing
    if (typeof s.dragGain === 'number') app.host.camera.setDragGain(s.dragGain);   // wave 58: DRAG GAIN and FLING ride beside them
    if (typeof s.fling === 'number') app.host.camera.setFling(s.fling);
    if (typeof s.camLock === 'boolean') app.host.camera.setLock(s.camLock);       // 0.5.3 M6: the classic camera (pan held at the centre), off when nothing was said
    if (s.audio === true && ui.audioSw) { ui.audioSw.set(true); ui.setAudio(true); }   // 0.6.4 S2: the AUDIO consent (SOUND itself is a hand press each session)
    /* SKELETON · BEAD · UNCERTAINTY left this blob for INFORMATIONAL's record in the fix round (C6: shell/stage-words.js lifts them once) */
    if (s.askOk === true) ui.askOk = true; if (typeof s.askUrl === 'string' && ui.askUrlIn) ui.askUrlIn.value = s.askUrl;   // 0.6.6 G2: ASK's consent and Gemma's address (absent: this host at 9443)
    /* 0.5.0 C4 · THE POWER AND THE CADENCE are this browser's (PREFERENCE) and live in the kit's modulation record, the one
       MIR's installModulation reads; an older blob's pair is read ONCE into it, and the blob drops it on its next save. */
    const mr = { modArm: s.modArm, modCadence: s.modCadence, ...app.ctl.modStore.read() };
    app.ctl.MOD.hz = mr.modCadence === 120 ? 120 : 60; if (app.state.modView) app.state.modView.sync();   // wave 52: the modulation's cadence cap is the PANEL's, not the project's
    if (mr.modArm === false) app.sh.setModArm(false, { quiet: true });   // wave 65: ARMED is the default a fresh visit gets
    if (s.modArm !== undefined || s.modCadence !== undefined) app.ctl.saveMod();
    if (s.frame === false) { mat.frame = false; if (ui.frameSw) ui.frameSw.set(false); }     // wave 53: FRAME and AXIS, independently
    if (['box','lattice','dots'].includes(s.frameMode)) mat.frameMode=s.frameMode;
    if (['box','corner'].includes(s.axisMode)) mat.axisMode=s.axisMode;
    mat.cornerSide=s.cornerSide==='left'?'left':'right';
    if (s.axis === false) { mat.axis = false; if (ui.axisSw) ui.axisSw.set(false); }
    /* ⚠ and the two that left the WAVE window with them.  Both read the NON-DEFAULT ONLY, on exactly
       the law of the two lines above: NOTHING SAID MEANS THE SHIPPED VALUE, so a profile written
       before this wave opens as it always did instead of inheriting a default nobody chose. */
    if (s.invert === true) { mat.invert = true; if (ui.invertSw) ui.invertSw.set(true); }
    if (+s.dither > 0) { mat.dither = Math.max(0.25, Math.min(2, +s.dither)); if (ui.showDither) ui.showDither(mat.dither); }   // iteration 008 W: nothing said means OFF
    if (s.axisInk === 'cmy' || s.axisInk === 'rgb') { mat.axisInk = s.axisInk; if (ui.axisInkSeg) ui.axisInkSeg.set(s.axisInk); }
    /* the remembered set, exactly — and a card the profile is older than stays closed, as a first run has it (0.5.3 M9: INFORMATIONAL, no record and no
       atomLabels in the blob; iteration 008 Q: FIELD, no `dither` here — saveSettings has written `dither` on every save since 008 W, which merged after
       FIELD (S), so its absence is a blob no FIELD build ever saved, exactly as `atomLabels`' absence once said older than INFORMATIONAL) */
    const older = { informational: !infoKnown(), staticfield: !('dither' in s), emission: !(s.gen >= 16) };   // iteration 016 E1: `gen` (the iteration that wrote the blob) is written on every save from 016, so a blob without it never met EMISSION SPECTRA
    if (Array.isArray(s.closed)) for (const d of document.querySelectorAll('.dev')) d.classList.toggle('closed', s.closed.includes(d.dataset.id) || older[d.dataset.id] === true);
    /* 0.3.1 · S1 (D4's escape hatch): the camera MODE is the project's, like the pose it is needed to read, so a `camMode`
       an older build left here is not read — the boot is FREE (the shipped seed) and a project brings its own. */
    if (s.p3Mode === 'vivid' && ui.p3Seg) ui.p3Seg.set('vivid');


    const wantP3 = s.gamut ? s.gamut === 'p3' : appleDevice();
    if (wantP3 && ui.gamutSeg) ui.gamutSeg.set(app.ctl.field.ok && app.ctl.field.setGamut ? (app.ctl.field.setGamut(s.p3Mode === 'vivid' ? 'p3-vivid' : 'p3') === 'srgb' ? 'srgb' : 'p3') : 'srgb');   // it can only come back if the canvas can honour it
    document.body.dataset.gamut = app.ctl.field.ok && app.ctl.field.gamut !== 'srgb' ? 'p3' : 'srgb';
    settingsLoaded = true;
    /* iteration 008 W · DITHER WAS A PROJECT KEY, and a profile older than the move (no `dither` here) takes the one its live session carried — read
       ONCE, here at the boot's settings read, never at a project open (STATE-SCOPES: an open leaves this blob byte-identical outside WORKSPACE) */
    if (!('dither' in s)) { let d = 0; try { const r = readSession(globalThis.localStorage, SESSION_KEY), L = r && r.parts && r.parts.lambdawaves; d = +(L && L.data && L.data.presentation && L.data.presentation.mat && L.data.presentation.mat.dither) || 0; } catch (_) {}
      if (d > 0) { mat.dither = Math.max(0.25, Math.min(2, d)); if (ui.showDither) ui.showDither(mat.dither); saveSettings(); } }
  }


  const KIND = { staticfield: 'core', spectrum: 'core', observer: 'core', palette: 'core', camera: 'core', clip: 'core', transport: 'core', settings: 'other', shadow: 'info', equalizer: 'info', vortex: 'info', slice: 'info', calculus: 'info', meters: 'info', ladder: 'info', lattice: 'info', bloch: 'info', orbit: 'control', atoms: 'info', chem: 'other', wigner: 'info', radiation: 'info', emission: 'info' };
  /* WAVE 56 · WINDOWS THAT NO LONGER EXIST, and the window that absorbed each of them.  A saved LAYOUT is
     a list of window ids and nothing else, so retiring an id would silently drop a seat out of every layout
     ever saved unless the id has somewhere to go.  `style` (DRAW STYLE) was merged into `observer` (WAVE) by
     board #59, which kept the heir's id precisely so that three CSS selectors and the gate did not have to
     move.  Read by layout.applyLayout(); the settings key's `closed[]` needs nothing, because it names each
     window independently and the heir already names itself. */
  /* 0.4.0 S3 (R-W1): DYNAMICS is retired into SHADOW (L, T, V, S and the plot), CALCULUS (the moments), RADIATION (the
     lines) and VORTEX (PARTICLES); a saved layout's DYNAMICS seat lands on SHADOW. */
  /* iteration 008 U: MO-REGISTRY is merged INTO MOLECULES (its panes under the ON row); a saved layout's `orbitals` seat lands on `chem` */
  /* 018 D3: the CURVES card is retired into NODES (lab/nodes.js); a saved layout's `curves` seat opens `nodes` */
  const RETIRED_WINDOWS = { style: 'observer', dynamics: 'shadow', orbitals: 'chem', curves: 'nodes' };
  /* POWER is persistent device state. Presentation eligibility is a separate, transient visibility law below:
     leaving the viewport must save work without rewriting the user's project or switches. */
  const powered = (w) => !(w && w.root && w.root.classList.contains('off'));
  const DIGESTS = {}; app.sh.KIND = KIND; app.sh.RETIRED_WINDOWS = RETIRED_WINDOWS; app.sh.DIGESTS = DIGESTS;
  app.state.space = 'x';                 // 'x' position ψ(x) · 'p' momentum φ(p): the same state, two exact pictures
  return { saveSettings, setCardStyle, setFrost, setDisconnected, applySettings, KIND, RETIRED_WINDOWS, powered, DIGESTS };
}
