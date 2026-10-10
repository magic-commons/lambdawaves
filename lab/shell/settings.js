/* lab/shell/settings.js — §1 SETTINGS, what this browser remembers (0.5.2 R3a "Rack Dissolution"; moved verbatim out of lab/rack.js boot()).
 * createSettings(app) runs at §1's seat, BEFORE the controller's, so a controller name is read as app.ctl.x inside a callback, never at
 * creation — as are app.host.camera, app.sh.setModArm and app.sh.quality, which boot() fills later.  readSettings stays in rack.js' head
 * (§0 calls it first, U1) and comes by value; lookSync is registered for the controller; boot() destructures the rest. */
export function createSettings(app) {
  const { ui, mat, settingsStore, useCompactDefaults, FIRST_RUN, appleDevice } = app; const { readSettings } = app.sh;
  /* ── SETTINGS: what this browser remembers (theme, chrome, accents, quality, closed windows) ── */
  let settingsLoaded = false;
  app.state.molFormulaScale = 1;                         // the STAGE TEXT's SIZE knob (Settings › Display): × the notebook's sizes (lab.css .lw-stage), a PREFERENCE
  function saveSettings() {
    if (!settingsLoaded) return;
    try {
      /* WAVE 54 · FOUND HERE: this writer built the object FROM SCRATCH, so every key written by anyone else was
         silently dropped on the next call — the notebook's remembered size (nbW / nbH, written by nbSaveSize's own
         merge) did not survive so much as a fold. The three keys this function does not own are carried through. */
      /* WAVE 59 · AND `warned` IS THE FOURTH, and it is not bookkeeping.  Wave 48 added the photosensitivity
         acceptance to this key AFTER wave 54 fixed the three above, so it fell into the same hole: accept the
         notice, then change the theme / close a window / load a layout / open a link that names a palette, and
         the acceptance was ERASED — in the same session, before `warning.needed()` reads it.  A safety notice a
         visitor has answered must stay answered, so it is carried like the other three. `remember()` writes the
         value; this function's only job is not to throw it away. */
      const S0 = readSettings();
      /* WAVE 105 · `audioDevice` IS THE FIFTH CARRIED KEY.  This writer rebuilds the object from
         scratch, so a key it does not name is destroyed on the next call — the exact hole waves 54 and
         59 each fixed once, and wave 102 reopened by writing the chosen microphone from somewhere
         else.  Pick an input, move any window, reload: back to the system default. */
      /* OPTIMIZATION 2026-09-24 · M4 · `abW` / `abH` ARE THE SIXTH AND SEVENTH, and the fourth time this one hole has been
         found (waves 54, 59, 105): nbSaveSize writes the ABOUT face's remembered size into this key, and the next
         preference change (a theme flip, a window closed) rebuilt the object without them, so ABOUT reopened at
         470 × 670.  Carried like the others; an absent value stays absent (JSON drops undefined). */
      settingsStore.write({ nativeLayout:useCompactDefaults?1:S0.nativeLayout, nbW: S0.nbW, nbH: S0.nbH, abW: S0.abW, abH: S0.abH, layouts: S0.layouts, warned: S0.warned, audioDevice: S0.audioDevice, captions: !document.body.classList.contains('no-captions'), molFormula: !document.body.classList.contains('no-mol-formula'), molFormulaSize: app.state.molFormulaScale,
        auto: app.sh.quality.auto, governor: app.ctl.gov.on, keepFrames: app.ctl.keep.frames, perfMode: app.ctl.perf.mode,
        /* WAVE 51 · THE CAMERA'S FEEL IS A PREFERENCE, not a project's (wave 50 built FRICTION / SPIN / AUTO-ROTATE and
           none of the three survived a reload).  FRICTION and SPIN are how the instrument FEELS in the hand and they
           belong beside FROST and GOVERNOR.  AUTO-ROTATE is deliberately NOT here: a lab that starts turning by itself
           when you open it is a surprise, not a setting. */
        friction: app.host.camera.friction, spin: app.host.camera.speed, dragGain: app.host.camera.dragGain, fling: app.host.camera.flingGain,   // wave 58: the two View-window dials are the same kind of preference as FRICTION and SPIN (0.5.0 C4: the MOD power and cadence are the kit's record, saveMod)
        /* WAVE 64 · THE PORTED WINDOW'S PRESENTATION STATE, and it is the sixth of the six things
           host-contract.md says a host owes it: where the window sits, which lane the work bars are
           in, each device's F/C/M mode, the ribbon, and whether it was left open.  The RACK itself
           is not here — that rides in the project file, exactly as it did before. */
        modwin: app.state.modView ? app.state.modView.presentation() : S0.modwin,
        tlwin: S0.tlwin,   // 0.5.0 C7b: the TIMELINE window's shape and work lane (WORKSPACE), written by its own store and carried here
        frame: mat.frame !== false, axis: mat.axis !== false, frameMode: mat.frameMode, axisMode:mat.axisMode, cornerSide:mat.cornerSide,
        /* ⚠ WAVE 106 · TWO MORE OF THE FIELD'S CHROME, AND ONE CLOSES AN ASYMMETRY NEVER DECIDED.
           `invert` IS NEW HERE: it sat in the same row as FRAME and AXIS from wave 56 and was the only
           one of the three this browser did not remember — two kept over a reload and one silently
           thrown away.  Moving it to PALETTE is the moment to end that.
           `axisInk` is a BROWSER PREFERENCE like frame and axis, and NOT like `mat.lightUI`, which
           serialize() strips out of every project: lightUI is not a choice at all, it is the RESOLVED
           theme, and a file carrying it would impose the sender's theme on its reader.  AXIS COLOUR
           *is* a choice, and it is remembered here.  0.3.1 · S1 (D1): the whole field chrome — frame, axis,
           their modes, the corner, invert, axis colour — is this browser's alone; serialize() strips it and
           restore() ignores it in an older file, so no project or link can change a reader's axes. */
        invert: !!mat.invert, axisInk: mat.axisInk || 'theme',        // wave 53: the two chrome objects are this browser's, like FROST and the tags
        phoneTr: !!document.querySelector('.dev[data-id="transport"].folded'),
        /* WAVE 59 · WHICH WAY THE PHONE'S RACK WAS LEFT, on exactly phoneTr's pattern — a phone-only chrome
           preference, derived from the DOM rather than tracked in a second place.  The DEFAULT (nothing said)
           is HIDDEN, and that default is the whole point: see enterPhone(). */
        phoneRack: document.body.classList.contains('phone') ? !document.body.classList.contains('rack-hidden') : S0.phoneRack,
        /* WAVE 54: which colour space this BROWSER asked for.  0.3.1 · S1: the camera MODE and the palette left this key —
           the palette is PROJECT state (D2), and so is the mode, because a pose cannot be read back without it (D4: a
           TURNTABLE record's rotor is stale, a FREE one carries roll; docs/STATE-SCOPES.md). */
        gamut: document.body.dataset.gamut === 'p3' ? 'p3' : 'srgb', p3Mode: ui.p3Seg ? ui.p3Seg.get() : 'convert',
        closed: [...document.querySelectorAll('.dev.closed')].map((d) => d.dataset.id) });
    } catch (e) {}
  }


  /* 0.5.0 C2 · THE LOOK'S SETTERS are the store's (lab/look.js): one `set`, on the page in the same task, and SETTINGS repainted
     from the store (lookSync).  An unnamed card is the device's and an unknown frost is OFF, as they always were. */
  function setCardStyle(id) { app.ctl.look.set({ card: id === 'tinted' || id === 'refractive' ? id : FIRST_RUN.card }); return document.body.dataset.card; }
  function setFrost(mode) { app.ctl.look.set({ frost: mode === 'still' || mode === 'always' ? mode : 'off' }); return app.ctl.look.get('frost'); }
  function setDisconnected(v) { app.ctl.look.set({ disconnected: !!v }); return !!v; }
  /** the SETTINGS controls the look store drives, repainted from it */
  function lookSync(s, keys) {
    const c = { theme: ui.themeSeg, card: ui.cardSeg, frost: ui.frostSeg, disconnected: ui.discSw, blur: ui.blurK, accentA: ui.accA, accentB: ui.accB, vivid: ui.vivid,
      badges: ui.badgesSw, hints: ui.controlHintsSw, help: ui.windowInfoSw };
    for (const k of keys) if (c[k]) c[k].set(s[k]);
  }
  app.sh.lookSync = lookSync;
  function applySettings() {
    const s = readSettings();
    app.ctl.look.rerun(); lookSync(app.ctl.look.prefs.all(), Object.keys(app.ctl.look.prefs.all()));   // 0.5.0 C2: the look again, now that the theme's engine hooks exist
    const captions = s.captions === true;
    document.body.classList.toggle('no-captions', !captions); if (ui.capSw) ui.capSw.set(captions);
    /* THE STAGE TEXT (0.4.0 S3): one switch for the formula, the fade and the atom labels; nothing said means ON.  The ATOM
       LABELS' own key is read ONCE — only where the formula's was never written (an older profile) — and is dropped by the
       next save with its SIZE: a stored molFormula decides, because the row is one switch and that is the key it keeps. */
    const molFormula = s.molFormula !== undefined ? s.molFormula !== false : s.atomLabels !== false;
    document.body.classList.toggle('no-mol-formula', !molFormula); if (ui.molFormulaSw) ui.molFormulaSw.set(molFormula);
    app.state.molFormulaScale = Number.isFinite(+s.molFormulaSize) ? Math.max(0.5, Math.min(3, +s.molFormulaSize)) : 1; if (ui.molFormulaK) ui.molFormulaK.set(app.state.molFormulaScale);
    if (app.state.stageText) { app.state.stageText.setScale(app.state.molFormulaScale); app.state.stageText.setOn(molFormula); }
    if (s.auto === false) { app.sh.quality.auto = false; if (ui.autoSw) ui.autoSw.set(false); }
    if (s.governor === false) app.ctl.setGovernor(false);                 // wave 45: the governor held off
    if (s.keepFrames === true) app.ctl.setKeepFrames(true);              // wave 45: the playhead follows every frame (off by default)
    app.ctl.setPerfMode(s.perfMode === 'full' ? 'full' : '120');         // an absent key takes the official 120 Hz profile; an explicit FULL choice survives
    if (typeof s.friction === 'number') app.host.camera.setFriction(s.friction);   // wave 51: the camera's feel comes back …
    if (typeof s.spin === 'number') app.host.camera.setSpeed(s.spin);              // … but AUTO-ROTATE never does (see saveSettings)
    if (typeof s.dragGain === 'number') app.host.camera.setDragGain(s.dragGain);   // wave 58: DRAG GAIN and FLING ride beside them
    if (typeof s.fling === 'number') app.host.camera.setFling(s.fling);
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
    if (s.axisInk === 'cmy' || s.axisInk === 'rgb') { mat.axisInk = s.axisInk; if (ui.axisInkSeg) ui.axisInkSeg.set(s.axisInk); }
    if (Array.isArray(s.closed)) for (const d of document.querySelectorAll('.dev')) d.classList.toggle('closed', s.closed.includes(d.dataset.id));   // the remembered set, exactly
    /* 0.3.1 · S1 (D4's escape hatch): the camera MODE is the project's, like the pose it is needed to read, so a `camMode`
       an older build left here is not read — the boot is FREE (the shipped seed) and a project brings its own. */
    if (s.p3Mode === 'vivid' && ui.p3Seg) ui.p3Seg.set('vivid');


    const wantP3 = s.gamut ? s.gamut === 'p3' : appleDevice();
    if (wantP3 && ui.gamutSeg) ui.gamutSeg.set(app.ctl.field.ok && app.ctl.field.setGamut ? (app.ctl.field.setGamut(s.p3Mode === 'vivid' ? 'p3-vivid' : 'p3') === 'srgb' ? 'srgb' : 'p3') : 'srgb');   // it can only come back if the canvas can honour it
    document.body.dataset.gamut = app.ctl.field.ok && app.ctl.field.gamut !== 'srgb' ? 'p3' : 'srgb';
    settingsLoaded = true;
  }


  const KIND = { state: 'core', spectrum: 'core', observer: 'core', palette: 'core', camera: 'core', clip: 'core', transport: 'core', settings: 'other', shadow: 'info', vortex: 'info', slice: 'info', calculus: 'info', meters: 'info', ladder: 'info', orbit: 'control', atoms: 'info', chem: 'other', wigner: 'info', radiation: 'info' };
  /* WAVE 56 · WINDOWS THAT NO LONGER EXIST, and the window that absorbed each of them.  A saved LAYOUT is
     a list of window ids and nothing else, so retiring an id would silently drop a seat out of every layout
     ever saved unless the id has somewhere to go.  `style` (DRAW STYLE) was merged into `observer` (WAVE) by
     board #59, which kept the heir's id precisely so that three CSS selectors and the gate did not have to
     move.  Read by layout.applyLayout(); the settings key's `closed[]` needs nothing, because it names each
     window independently and the heir already names itself. */
  /* 0.4.0 S3 (R-W1): DYNAMICS is retired into SHADOW (L, T, V, S and the plot), CALCULUS (the moments), RADIATION (the
     lines) and VORTEX (PARTICLES); a saved layout's DYNAMICS seat lands on SHADOW. */
  const RETIRED_WINDOWS = { style: 'observer', dynamics: 'shadow' };
  /* POWER is persistent device state. Presentation eligibility is a separate, transient visibility law below:
     leaving the viewport must save work without rewriting the user's project or switches. */
  const powered = (w) => !(w && w.root && w.root.classList.contains('off'));
  const DIGESTS = {};
  app.state.space = 'x';                 // 'x' position ψ(x) · 'p' momentum φ(p): the same state, two exact pictures
  return { saveSettings, setCardStyle, setFrost, setDisconnected, applySettings, KIND, RETIRED_WINDOWS, powered, DIGESTS };
}
