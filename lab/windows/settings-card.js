/* lab/windows/settings-card.js — the SETTINGS card (0.5.2 R2c; moved verbatim out of lab/rack.js boot()) at TWO seats: INTERFACE · THEME · SURFACE and the
 * stage hooks (app.hooks, read live) under THEME and SURFACE's header; boot() calls createFieldQuality() where FIELD QUALITY stood. */
import { TIER } from '../tier.js';
import { el, knob, sw, seg, trig, readout, group, label, hint } from '../mir/kit.js'; import { glyphEl } from '../mir/glyph.js'; import { fold } from '../fold.js'; import { rgbToHex, hexToRgb, srgbToLinear } from '../mir/palette.js'; import { createInformational } from '../informational.js'; import { createStageWindow } from '../stage-window.js'; import { summon } from '../summon.js';import { askUrlOf, ASK_ENABLED } from '../ask.js';
export function createSettingsCard(app) {
  const { ui, device, mat } = app, { schedule } = app.loop, { quality, saveSettings } = app.sh,
    { domain, fieldRate, setGovernor, setKeepFrames, setPerfMode, perf, modHand, look, applyAccent, field, mod, MOD } = app.ctl;
    ui.set = device({ id: 'settings', eyebrow: 'SETTINGS', status: '' });
    const gi = group(ui.set.body, 'INTERFACE');
    const ri = el('div', 'row tight', gi);
    /* iteration 003 · THE LOOK LEFT SETTINGS FOR MIR OPTIONS (lab/mir-gui.js, the kit's createGui; BASINS' split, app/settings-window.js):
       STATUS TAGS, CONTROL HINTS (HINTS) and HELP are TEXT › SHOW there; THEME, CARD STYLE (PANE), FROST, GLASS BLUR (BLUR), DISCONNECTED,
       ACCENT A / B, VIVID, RESET LAYOUT and FORGET too.  SETTINGS keeps λWAVES' own: the stage, its chrome, sound, Gemma, the gamut, quality. */
    ui.setWindowInfo = (v) => look.set({ help: v });   // the WINDOW menu's `notes` action calls it by this name
    ui.capSw = sw({ label: 'STAGE CAPTIONS', value: false, title: 'the KEPLER / VORTEX lines at the foot of the stage', onChange: (v) => { document.body.classList.toggle('no-captions', !v); saveSettings(); schedule(TIER.PRESENT); } }); ri.appendChild(ui.capSw.root);
    ui.audioSw = sw({ label: 'AUDIO', value: false, title: 'Levels as tones (SPECTRUM › EQUALIZER › SOUND)', onChange: (v) => { ui.setAudio(v); saveSettings(); } }); ri.appendChild(ui.audioSw.root);   // 0.6.4 S2: a PREFERENCE (`audio`), the consent
    if (ASK_ENABLED) {   // iteration 011 Q6: Gemma's address is built only under ASK_ENABLED (lab/ask.js); off, a stored `askUrl` is carried by the save, never shown
      const au = ui.askUrlIn = el('input', 'ask-line', ri); au.type = 'url'; au.spellcheck = false; au.placeholder = askUrlOf({}); au.setAttribute('aria-label', 'Gemma’s address');
      au.title = 'GEMMA: where ASK sends your words'; au.addEventListener('change', saveSettings); ui.askUrl = { root: au };   // 0.6.6 G2: a PREFERENCE (`askUrl`)
    }
    createInformational(app);   // 0.5.3 M9: STAGE FORMULA and ATOM LABELS, each with its SIZE, left DISPLAY for their own window (lab/informational.js)
    /* 037 T1: FRAME · AXIS · AXIS COLOUR are made here as before (their keys FIELD_CHROME, their roads unchanged) and seated in STAGE (lab/stage-window.js) */
    ui.frameSw = sw({ label: 'FRAME', value: true, title: 'Show the field boundary', onChange: () => { const modes=['box','lattice','dots','off']; const current=mat.frame===false?'off':mat.frameMode||'box'; const next=modes[(modes.indexOf(current)+1)%modes.length]; mat.frame=next!=='off'; mat.frameMode=next==='off'?'box':next; ui.frameSw.set(mat.frame); ui.frameSw.root.title='FRAME · '+next.toUpperCase(); saveSettings(); schedule(TIER.PRESENT); } });
    ui.axisSw = sw({ label: 'AXIS', value: true, title: 'Show or hide the x, y, and z axes', onChange: () => { const modes=['box','corner','off']; const current=mat.axis===false?'off':mat.axisMode||'box'; const next=modes[(modes.indexOf(current)+1)%modes.length]; mat.axis=next!=='off'; mat.axisMode=next==='off'?'box':next; ui.axisSw.set(mat.axis); ui.axisSw.root.title='AXIS · '+next.toUpperCase(); saveSettings(); schedule(TIER.PRESENT); } });
    ui.axisInkSeg = seg({ label: 'AXIS COLOUR', value: 'theme', options: [
      { id: 'theme', label: 'THEME', title: 'Choose axis colours from the current theme' },
      { id: 'cmy', label: 'CMY', title: 'Use cyan, magenta, and yellow axes' },
      { id: 'rgb', label: 'RGB', title: 'Use red, green, and blue axes' }],
      onChange: (v) => { mat.axisInk = v; saveSettings(); schedule(TIER.PRESENT); } });
    /* iteration 012 M1 (Josh 10-20: "In settings window, 'WARNING' should be in the 'ABOUT' menu dropdown"): SHOW THE WARNING AGAIN is ABOUT › PHOTOSENSITIVITY WARNING… (notebook.js MENUS) */
    el('div', 'note', gi).innerHTML = '<b>Settings.</b> Appearance and performance choices are stored in this browser. Window power stops its reader; collapse changes layout; close removes the window until reopened from + or WINDOW.';
    const gt = group(ui.set.body, 'THEME  ·  SURFACE');
    const THEMES = { dark: { bg: [0.028, 0.038, 0.058], invert: false }, light: { bg: [0.93, 0.95, 0.975], invert: true } };
    /* THE THEME'S ENGINE SIDE (0.5.0 C2): the kit's theme row writes body[data-theme] (SYSTEM follows the OS by itself) and its
       `run` calls this once per resolved change.  WAVE 56: the browser's own chrome follows the theme — <meta name="theme-color">
       overrides the manifest wherever it is honoured; #eef1f6 is skin.css's `body[data-theme="light"] #stage`, #070a0f lab.css's
       unconditional ground.  Wave 48: the GPU chrome (the cube frame, the three axes) cannot read a CSS token — it reads lightUI. */
    app.hooks.theme = (theme) => {
      const tc = document.getElementById('themeColor');
      if (tc) tc.setAttribute('content', theme === 'light' ? '#eef1f6' : '#070a0f');
      mat.bg = THEMES[theme].bg.slice();
      if (app.hooks.restage) app.hooks.restage();
      mat.lightUI = theme === 'light';
      schedule(TIER.PRESENT);
    };
    /* THE STAGE KNOB IS THE HEADER λ's GROUND (wave 59), which is why moving it repaints the mark: `#title`
       is `background: none` over `#field`, so `mat.bg` — this value — is the surface the λ is drawn on, and a
       correction against a ground the hand can drag is not a correction.  One named function, so the knob,
       LW.setStage and the gate all take the same road. */
    /* STAGE has one plain law: 0% is the active theme ground and 100% is the retained custom colour.
       FOLLOW THEME bypasses the blend without changing the knob or swatch, so it is reversible. */
    const themeGround = () => THEMES[document.body.dataset.theme === 'light' ? 'light' : 'dark'].bg;
    mat.stageCustom = [0.12, 0.14, 0.18];
    function setStageMix(v) {
      app.state.stageMix = Math.max(0, Math.min(1, Number.isFinite(+v) ? +v : 0));
      const a = themeGround(), b = mat.stageCustom;
      mat.bg = app.state.stageFollow ? a.slice() : [0, 1, 2].map((i) => a[i] + (b[i] - a[i]) * app.state.stageMix);
      /* 039 X4 · THE STAGE WORDS WEAR THE STAGE'S INK (WALK-A #11): the words on the stage (the caption, INFORMATIONAL's, WIDGETS, the ESP key) read
         against this ground, not the theme's — dark ink over a ground whose relative luminance passes 0.195 (about where the two inks' contrasts cross), else light (lab.css) */
      const L = 0.2126 * srgbToLinear(mat.bg[0]) + 0.7152 * srgbToLinear(mat.bg[1]) + 0.0722 * srgbToLinear(mat.bg[2]); document.body.dataset.stageInk = L > 0.195 ? 'dark' : 'light';
      look.paintInk(); schedule(TIER.PRESENT);
    }
    app.hooks.restage = () => setStageMix(app.state.stageMix);
    function setStageColour(colour) {
      if (Array.isArray(colour) && colour.length >= 3) mat.stageCustom = colour.slice(0, 3).map((v) => Math.max(0, Math.min(1, +v || 0)));
      if (ui.stageColour) ui.stageColour.value = rgbToHex(mat.stageCustom);
      setStageMix(app.state.stageMix);
    }
    function setStageFollow(on) {
      app.state.stageFollow = !!on;
      if (ui.stageFollow) { ui.stageFollow.classList.toggle('on', app.state.stageFollow); ui.stageFollow.setAttribute('aria-pressed', String(app.state.stageFollow));
        hint(ui.stageFollow, app.state.stageFollow ? 'On: the stage takes the theme’s colour · press: your colour' : 'Off: the stage wears your colour · press: the theme’s'); }   // 039 X4: it said "Ignore the chosen stage colour", backwards
      setStageMix(app.state.stageMix);
    }
    app.hooks.setStageColour = setStageColour;
    app.hooks.setStageFollow = setStageFollow;
    ui.stageK = knob({ label: 'STAGE', title: 'How much of your colour the stage wears; 0 % is the theme', min: 0, max: 1, value: 0.04, fmt: (v) => (v * 100).toFixed(0) + '%', onInput: (v) => { if (!modHand('material.stage', v)) setStageMix(v); } });
    app.hooks.setStage = (v) => { const x = Math.max(0, Math.min(1, +v || 0)); if (x === app.state.stageMix) return x; ui.stageK.set(x); setStageMix(x); return x; };   // 029 M1: the value in force writes nothing
    { const seat = el('div', 'stage-seat'); ui.stageSeat = { root: seat };   // 037 T1: the seat, STAGE and GAMMA are seated in STAGE (lab/stage-window.js)
      ui.stageColour = el('input', 'pal-color stage-colour', seat); ui.stageColour.type = 'color'; ui.stageColour.title = 'Stage colour at 100%'; ui.stageColour.setAttribute('aria-label', 'stage colour');
      /* iteration 016 P7 (Josh: "if a user chooses a background color, let that automatically" turn it on): a pick leaves FOLLOW THEME and, when the
         STAGE knob sits at its near-theme rest (≤ 5 %, the first run's 4 %), takes it to 100 %, so the colour chosen IS the ground; a knob the hand set
         higher keeps its blend */
      ui.stageColour.addEventListener('input', () => { setStageColour(hexToRgb(ui.stageColour.value)); setStageFollow(false); if (app.state.stageMix <= 0.05 && !modHand('material.stage', 1)) app.hooks.setStage(1); });
      ui.stageFollow = el('button', 'trig stage-follow', seat, 'FOLLOW THEME'); ui.stageFollow.type = 'button';
      /* 039 X4 (WALK-A #10: FOLLOW THEME off showed nothing until the STAGE knob was raised): a HAND turning it off lifts a resting knob (≤ 5 %) to 100 %,
         P7's road, so the colour chosen shows at once; a knob the hand set higher keeps its blend */
      ui.stageFollow.addEventListener('click', () => { const on = !app.state.stageFollow; setStageFollow(on); if (!on && app.state.stageMix <= 0.05 && !modHand('material.stage', 1)) app.hooks.setStage(1); });
      setStageColour(mat.stageCustom); setStageFollow(true); }
    ui.gammaK = knob({ label: 'GAMMA', title: 'The picture’s gamma: above 1 brightens the mid-tones', min: 0.5, max: 2.4, value: 1, fmt: (v) => v.toFixed(2), onInput: (v) => { if (modHand('material.gamma', v)) return; mat.gamma = v; schedule(TIER.PRESENT); } });
    /* 037 T1 · THE STAGE WINDOW: the rows above leave DISPLAY for `stage` (the controls move, the roads do not); DISPLAY keeps EDIT STAGE (native-ui.js seats it) */
    createStageWindow(app);
    ui.editStage = trig({ label: 'EDIT STAGE', glyph: 'stage', title: 'Open STAGE below SETTINGS', onFire: () => summon(app.sh.rk, 'settings', 'stage') });   // 037 T2 · THE SUMMONS (lab/summon.js)
    const gamutSup = field.ok && field.gamutSupport ? field.gamutSupport : { canvas: false, css: false, display: false, reason: 'no WebGPU device: the canvas has no colour space to set' };
    const gamutOK = !!(gamutSup.canvas && gamutSup.css);
    const rg = el('div', 'row tight', gt);
    ui.gamutSeg = seg({ label: 'GAMUT', value: 'srgb', options: [
      { id: 'srgb', label: 'sRGB', title: 'Use the sRGB colour space' },
      { id: 'p3', label: 'P3', title: gamutOK ? 'The wider space, for the canvas and every accent' : gamutSup.reason }],
      onChange: (v) => setGamut(v) });
    rg.appendChild(ui.gamutSeg.root);
    ui.p3Seg = seg({ label: 'IN P3', value: 'convert', options: [
      { id: 'convert', label: 'CONVERT', title: 'Preserve authored colours in Display P3' },
      { id: 'vivid', label: 'VIVID', title: 'Increase chroma in Display P3' }],
      onChange: () => { if (field.ok && field.gamut !== 'srgb') setGamut('p3'); } });
    rg.appendChild(ui.p3Seg.root);
    /** the ONE road into the gamut: it asks the canvas, believes the answer, and puts the DOM wherever the canvas ended up */
    function setGamut(id) {
      const got = field.ok ? field.setGamut(id === 'p3' ? (ui.p3Seg && ui.p3Seg.get() === 'vivid' ? 'p3-vivid' : 'p3') : 'srgb') : 'srgb';
      const on = got !== 'srgb';
      document.body.dataset.gamut = on ? 'p3' : 'srgb';
      ui.gamutSeg.set(on ? 'p3' : 'srgb');
      applyAccent();                                   // the DOM's accents go through the SAME map the LUT went through
      if (ui.gamutRo) ui.gamutRo.set(on ? (got === 'p3-vivid' ? 'DISPLAY-P3 · vivid' : 'DISPLAY-P3') : 'sRGB', on ? 'ok' : '');
      if (ui.gamutRo) ui.gamutRo.setSub(gamutOK ? 'the interface and the field are both ' + (on ? 'DISPLAY-P3' : 'sRGB') : gamutSup.reason);
      saveSettings(); schedule(TIER.PRESENT);
      return got;
    }
    app.hooks.setGamut = setGamut;
    ui.gamutRo = readout({ label: 'IN FORCE', value: 'sRGB', sub: '' });
    rg.appendChild(ui.gamutRo.root);
    if (!gamutOK) {
      for (const id of ['p3']) { const b = ui.gamutSeg.button(id); if (b) { b.disabled = true; b.classList.add('disabled'); } }
      for (const id of ['convert', 'vivid']) { const b = ui.p3Seg.button(id); if (b) { b.disabled = true; b.classList.add('disabled'); b.title = gamutSup.reason; } }
    }
    ui.gamutRo.set('sRGB'); ui.gamutRo.setSub(gamutOK ? 'the interface and the field are both sRGB' : gamutSup.reason);
    el('div', 'note', gt).innerHTML = '<b>Gamut.</b> Display P3 is available only when both CSS and the WebGPU canvas support it. CONVERT preserves authored colours; VIVID increases chroma. DITHER reduces visible 8-bit banding.';
    el('div', 'note', gt).innerHTML = '<b>Appearance.</b> Stage, gamma, hue, exposure, and invert affect presentation without changing ψ. The theme, the accents, the glass and the frost are the interface’s look: GUI › MIR OPTIONS.';
    app.hooks.setTheme = (t) => look.set({ theme: t });
    app.hooks.menuSheet = createMenuSheet;   // 035 G3: the main menu's ⚙ builds its sheet through this (picker.js never imports this module)
  function createFieldQuality() {   // the second seat: FIELD QUALITY
    const swS = (o) => ({ ...sw(o), spec: o });   // 035 G3: a switch that keeps its options, as seg and knob do (the sheet's second face is made from them)
    const gq = group(ui.set.body, 'FIELD QUALITY');
    const r5 = el('div', 'row', gq);
    ui.gridSeg = seg({ label: '', aria: 'GRID', value: String(quality.res),   /* wave 101: the CONTROL reads the shipped grid rather than restating it — a hardcoded '96' here would have disagreed with quality.res the moment the default moved */ options: [{ id: '64', label: '64³', title: 'Coarse grid: the fastest, softest picture' }, { id: '96', label: '96³', title: 'Middle grid: the usual balance' }, { id: '128', label: '128³', title: 'Fine grid: the sharpest, and the heaviest' }],
      onChange: (v) => { quality.res = +v; quality.steps = { 64: 110, 96: 160, 128: 240 }[+v]; quality.scale = { 64: 0.75, 96: 1, 128: 1 }[+v]; schedule(TIER.REBUILD); } });
    r5.appendChild(ui.gridSeg.root);   // iteration 013 S1 (Josh: "Remove text that says 'grid' in quality"): no word over 64³ · 96³ · 128³; the radiogroup is still named GRID
    const capSeg = seg({ label: 'FIELD CLOCK cap', value: '0', options: [{ id: '0', label: 'MAX' }, { id: '33', label: '30 Hz' }, { id: '66', label: '15 Hz' }, { id: '200', label: '5 Hz' }],
      onChange: (v) => { fieldRate.capMs = +v; } });
    capSeg.root.title = 'Caps how often ψ is reconstructed; every frame presents';   // 029 M9: the cap skips the CPU reconstruct only (rack.js `due`), never the march or the present
    r5.appendChild(capSeg.root); ui.capSeg = capSeg;   // 035 G3: the menu sheet's second face reads it
    const r5b = el('div', 'row tight', gq);
    ui.autoSw = swS({ label: 'AUTO SCALE', value: true, title: 'Adjust canvas resolution to the frame budget', onChange: (v) => { quality.auto = v; if (!v) quality.autoScale = 1; saveSettings(); } }); r5b.appendChild(ui.autoSw.root);
    ui.govSw = swS({ label: 'GOVERNOR', value: true, title: 'Protect the frame rate automatically', onChange: (v) => { setGovernor(v); saveSettings(); } }); r5b.appendChild(ui.govSw.root);
    ui.perfSeg = seg({ label: 'READERS', value: '120', options: [   // 0.4.0 S3: out of METERS, beside the GOVERNOR it works with (029 M7: the label READERS; key `perfMode`, ids unchanged)
      { id: 'full', label: 'FULL', title: 'Update visible readers every frame' },
      { id: '120', label: '120 Hz', title: 'Update visible CPU readers every fourth frame' }],
      onChange: (v) => { setPerfMode(v); saveSettings(); } });
    r5b.appendChild(ui.perfSeg.root);
    /* 029 M7/M8/M10 · PERFORMANCE (M6-SYNTHESIS §2, M10-BUILD): a PREFERENCE `perfTier` (absent = SMOOTH; M7's `quality` reads FULL), never a look key.
       SMOOTH keeps the live glass and draws the canvas at 85 % while playing; BALANCED holds the frost while the picture moves (look.js hold); LIGHT
       also caps the canvas at half while playing (rack.js loop).  ui.setTier is the one road (applySettings too) */
    ui.setTier = (t) => { perf.tier = t === 'quality' ? 'full' : ['full', 'balanced', 'light'].includes(t) ? t : 'smooth'; look.hold(perf.tier === 'balanced' || perf.tier === 'light'); ui.tierSeg.set(perf.tier); schedule(TIER.PRESENT); };
    ui.tierSeg = seg({ label: 'PERFORMANCE', value: 'smooth', options: [
      { id: 'full', label: 'FULL', title: 'The sharpest picture and the windows’ blur, always' },   // 039 X16 (WALK-D #7): the reader's words, not the builders'
      { id: 'smooth', label: 'SMOOTH', title: 'Blur stays on; a slightly softer picture while playing' },
      { id: 'balanced', label: 'BALANCED', title: 'The windows’ blur rests while the picture moves' },
      { id: 'light', label: 'LEAN', title: 'Lightest: blur rests, a half-sharp picture while playing' }],   // 039 X16: LEAN (THEME's LIGHT keeps the word; FOR-JOSH), the id `light` kept
      onChange: (v) => { ui.setTier(v); saveSettings(); } });
    r5b.appendChild(ui.tierSeg.root);
    /* iteration 016 W4 (Josh, call 7: "60 | 120 HZ probably moves into SETTINGS"): the modulation's update rate, beside the GOVERNOR — off the modulation
       window's work bar (mod-port.js `cadenceKey: false`) and the control surface's expander; the kit's record keeps it (controller.js saveMod) */
    ui.cadSeg = seg({ label: 'MODULATION', value: String(MOD.hz), options: [
      { id: '60', label: '60 Hz', title: 'Update the modulation 60 times a second' },
      { id: '120', label: '120 Hz', title: 'Update the modulation 120 times a second' }],
      onChange: (v) => { mod.setCadence(+v); } });
    ui.cadSeg.root.title = 'Limit modulation updates per second'; r5b.appendChild(ui.cadSeg.root);
    /* PLAYBACK (020 L2, Josh's EXPERIMENTAL pair after ASIO4ALL's latency pane): CLOCK WALL | LOCKED, the CADENCE a locked play steps at (its ms
       is the pane's Buffer Offset) and the LATENCY from a knob to the picture (ASIO's In).  A PREFERENCE (shell/settings.js `playLock`/`playHz`). */
    const rpb = el('div', 'row tight lw-playback', gq);
    const lockMs = () => fieldRate.hz ? 1000 / fieldRate.hz : fieldRate.refreshMs();
    const paintLock = () => { const ms = lockMs(), hz = 1000 / ms, kl = ui.cadenceSeg.root.querySelector('.k-lbl');
      if (kl) label(kl, 'CADENCE · {ms} ms', { ms: ms.toFixed(1) });   // the step's ms on the seg's own line (ASIO's Buffer Offset), shown under LEAN too
      ui.latencyRo.set(fieldRate.lock ? ms.toFixed(1) + ' ms' : 'display', fieldRate.lock ? 'live' : '');
      ui.latencyRo.setSub(fieldRate.lock ? (fieldRate.hz ? '' : 'DISPLAY · ') + hz.toFixed(0) + ' Hz · ' + ms.toFixed(1) + ' ms a step' : 'each present takes the time that passed'); };
    ui.clockSeg = seg({ label: 'CLOCK', value: fieldRate.lock ? 'locked' : 'wall', options: [
      { id: 'wall', label: 'WALL', title: 'Time follows the wall clock' },
      { id: 'locked', label: 'LOCKED', title: 'One cadence step per frame: for recordings' }],
      onChange: (v) => { fieldRate.lock = v === 'locked'; paintLock(); saveSettings(); } });
    rpb.appendChild(ui.clockSeg.root);
    ui.cadenceSeg = seg({ label: 'CADENCE', value: String(fieldRate.hz || 'display'), options: [
      { id: '30', label: '30 Hz', title: '33.3 ms a step' }, { id: '60', label: '60 Hz', title: '16.7 ms a step' },
      { id: '120', label: '120 Hz', title: '8.3 ms a step' }, { id: 'display', label: 'DISPLAY', title: 'One step a display refresh' }],
      onChange: (v) => { fieldRate.hz = v === 'display' ? 0 : +v; paintLock(); saveSettings(); } });
    ui.cadenceSeg.root.title = 'How often a LOCKED play presents a frame'; rpb.appendChild(ui.cadenceSeg.root);
    ui.latencyRo = readout({ label: 'LATENCY', value: 'display', sub: '' }); rpb.appendChild(ui.latencyRo.root);
    ui.latencyRo.root.title = 'From a knob to the picture';
    ui.showPlayback = () => { ui.clockSeg.set(fieldRate.lock ? 'locked' : 'wall'); ui.cadenceSeg.set(String(fieldRate.hz || 'display')); paintLock(); };
    paintLock();
    ui.scaleRo = readout({ label: 'RENDER SCALE', value: '100%', sub: 'canvas pixels per CSS pixel × DPR' });
    r5b.appendChild(ui.scaleRo.root);
    /* iteration 008 W (Josh: "Remove dithering row from wave and move it to quality in settings"): DITHER is this display's, a PREFERENCE
       (`dither` in the settings blob, the amplitude in LSB, 0 = OFF), no longer a project's (FIELD_CHROME: serialize strips it, restore ignores it) */
    const r5c = el('div', 'row tight fit lw-dither', gq);   // 022 F2: A ROW FITS
    const setDither = (v) => { mat.dither = v; ui.ditherK.setDisabled(!v); schedule(TIER.PRESENT); saveSettings(); };
    ui.ditherSeg = seg({ label: 'DITHER', value: 'off', options: [
      { id: 'off', label: 'OFF', title: 'No dithering: smooth gradients may show bands' },
      { id: 'ordered', label: 'ORDERED 8×8', title: 'A fine pattern that hides bands in smooth gradients' }],
      onChange: (v) => setDither(v === 'off' ? 0 : ui.ditherK.get()) });
    r5c.appendChild(ui.ditherSeg.root);
    ui.ditherK = knob({ label: 'STRENGTH', title: 'How strong the pattern is: ±0.50 is half a colour step', min: 0.25, max: 2, value: 1, fmt: (v) => '±' + (v / 2).toFixed(2) + ' step', onInput: (v) => { if (ui.ditherSeg.get() !== 'off') setDither(v); } });   // 039 X16: the hint in the spec, so the sheet's face wears it; a colour step, not an LSB
    ui.ditherK.setDisabled(true);
    r5c.appendChild(ui.ditherK.root);
    ui.showDither = (k) => { ui.ditherSeg.set(k ? 'ordered' : 'off'); ui.ditherK.setDisabled(!k); if (k) ui.ditherK.set(Math.max(0.25, Math.min(2, k))); };   // the controls repainted from mat.dither (the settings, a lift, LW)
    const r6 = el('div', 'row fit lw-domain', gq);
    ui.domainAuto = swS({ label: 'DOMAIN AUTO', value: true, title: 'Fit the wave’s box to the state; off, WIDTH sets it', onChange: (v) => { domain.auto = v; ui.domainKnob.setDisabled(v); schedule(TIER.REBUILD); } });
    r6.appendChild(ui.domainAuto.root);
    ui.domainKnob = knob({ label: 'WIDTH', title: 'The domain’s half-width, ± a₀', min: 3, max: 140, value: 7, log: true, fmt: (v) => '±' + v.toFixed(0) + ' a₀', onChange: (v) => { domain.half = v; schedule(TIER.REBUILD); } });
    ui.domainKnob.setDisabled(true);
    r6.appendChild(ui.domainKnob.root);
    const r7 = el('div', 'row tight', gq);
    ui.keepSw = swS({ label: 'KEEP FRAMES', value: false, title: 'Update the playhead every frame', onChange: (v) => { setKeepFrames(v); saveSettings(); } }); r7.appendChild(ui.keepSw.root);
    el('div', 'note', gq).innerHTML = '<b>Performance.</b> FIELD CLOCK cap limits how often ψ is reconstructed from the register; the picture still presents every frame, so it saves CPU time, not GPU time. AUTO SCALE lowers canvas resolution when frames exceed the budget. GOVERNOR can also pause expensive readers and retries them periodically. PERFORMANCE: FULL keeps everything as the look says; SMOOTH, the default, keeps the windows’ blur and every motion and draws the canvas at 85 % while playing (full size at rest, in films and in pictures); BALANCED rests the windows’ blur while the picture moves (it returns at rest); LEAN also draws the canvas at half size while playing (films and pictures keep their own size). READERS 120 Hz updates the visible CPU readers every fourth frame while the field presents every frame; FULL updates them every frame. DITHER (ordered 8×8) breaks up 8-bit colour bands on this display; STRENGTH ±0.50 is half a colour step. KEEP FRAMES updates the playhead every frame and may cost performance.';
    el('div', 'note', gq).innerHTML = '<b>Playback.</b> WALL follows the wall clock. LOCKED steps time by exactly one CADENCE step per frame and holds the render scale, so a recording never sees a skipped or doubled step; a slow frame slows time instead. LATENCY is the time from a knob to the picture.';
  }
  /* 035 G3 · THE MENU SHEET's rows (Josh 11-03: "a little slide-over which is a minimalist-CSS version of Settings rack window > Quality, among
     other things from MIR Options"), built at the main menu's first ⚙ into the sheet's body: a MIR section — THEME · MOTION · PANE · HINTS, the
     look store's own keys (MIR OPTIONS' rows, gui.js), read back from it — over QUALITY whole as SECOND FACES of SETTINGS › QUALITY's rows (the
     csb-favs.js road): each kit control made again from the row's own options (`spec`), a change sets the rack's row and runs that row's own
     handler, then saveSettings; paint() reads every value back from the rack's rows (at each open and after each change), so the two are ONE
     VALUE WITH TWO FACES and no setter is forked.  A readout's face copies its text.  The switches carry their options as seg and knob do. */
  function createMenuSheet(host) {
    const paints = [], paint = () => { for (const p of paints) p(); };
    const group = (word) => { const g = el('div', 'mm-sh-group', host); if (word) el('div', 'mm-sh-h', g, word); return g; };
    const row = (g, ...cs) => { const r = el('div', 'mm-sh-row' + (cs.length > 1 ? ' two' : ''), g); for (const c of cs) r.appendChild(c.root); return r; };
    const lookSeg = (key, word, opts, set = (v) => look.set({ [key]: v })) => {
      const s = seg({ label: word, value: look.get(key), options: opts.map(([id, l, t]) => ({ id, label: l, title: t })), onChange: set });
      paints.push(() => s.set(look.get(key))); return s; };
    /** face(orig, over) — a second face of a rack row: the kit's own control from the row's options (`over` a word the sheet's row wants), one value between them */
    const face = (orig, over) => {
      if (!orig.spec) {   // a readout: its text, copied
        const v = (r) => r.querySelector('.ro-val').textContent, f = readout({ label: orig.root.querySelector('.ro-lbl').textContent, value: v(orig.root) });
        paints.push(() => f.set(v(orig.root))); return f; }
      const o = orig.spec, make = orig.root.classList.contains('segw') ? seg : orig.root.classList.contains('k') ? knob : sw;
      const f = make({ ...o, ...over, value: orig.get(), onInput: o.onInput && ((v) => { orig.set(v); o.onInput(v); }),
        onChange: (v) => { orig.set(v); if (o.onChange) o.onChange(v); saveSettings(); paint(); } });
      paints.push(() => { if (f.get() !== orig.get()) f.set(orig.get()); if (f.setDisabled) { const d = orig.root.classList.contains('disabled'); if (f.root.classList.contains('disabled') !== d) f.setDisabled(d); } });
      return f;
    };
    /* 036 G5 (Josh 11-03: "THIS will be the first taste of how MIR Focus is going to be like … borderless floating knobs and features on that
       blurring background"; the rows "I'll defer to your judgement" — the critic's order): PERFORMANCE first, MOTION, COLLAGE (037), FROST, FULLSCREEN, THEME,
       HINTS; then a MORE fold (closed; lab/fold.js) holding the rest of QUALITY.  PANE is out (a pane the menu does not show); the FIELD CLOCK
       cap and READERS stay in the rack's SETTINGS › QUALITY.  `more` takes a row as any group does (a later door's knob joins it there). */
    const gm = group('');
    row(gm, face(ui.tierSeg));
    row(gm, lookSeg('motion', 'MOTION', [['auto', 'AUTO', 'Follow the system'], ['full', 'FULL', 'Every motion plays'], ['reduced', 'REDUCED', 'Fades only: nothing travels'], ['off', 'OFF', 'Nothing animates']]));
    /* 037 M1 · THE COLLAGE SWITCH (Josh: "an option in the main menu settings to enable or disable collage animation … a video icon and the
       switches to the icon with a line crossing it out"): the word, and the film camera or the camera struck through (both glyphs in the
       switch, the CSS shows the state's); the value is the main menu's own PREFERENCE (app.state.picker — this module never imports it) */
    { const P = () => app.state.picker, on = () => !P() || P().collage();
      const f = sw({ label: 'COLLAGE', value: on(), lamp: false, cls: 'mm-sh-glyph', title: 'The main menu’s wall of clips, or a still ground', onChange: (v) => { if (P()) P().setCollage(v); } });
      for (const g of ['videoOn', 'videoOff']) f.root.append(glyphEl(g, 'gly gly-' + g, 20));
      paints.push(() => f.set(on())); row(gm, f); }
    row(gm, lookSeg('frost', 'FROST', [['off', 'OFF', 'No backdrop blur'], ['still', 'STILL', 'Blur while the picture is still'], ['always', 'ALWAYS', 'Blur always: it can cost frames']]));
    { const on = () => !!document.fullscreenElement, f = sw({ label: 'FULLSCREEN', value: on(), title: 'Fill the screen (F)', onChange: () => { app.sh.ACTIONS.run('fullscreen'); setTimeout(paint, 400); } });
      paints.push(() => f.set(on())); document.addEventListener('fullscreenchange', () => f.set(on())); row(gm, f); }   // the `fullscreen` action's road; the switch mirrors the document
    row(gm, lookSeg('theme', 'THEME', [['light', 'LIGHT', 'Light windows and stage'], ['dark', 'DARK', 'Dark windows and stage'], ['system', 'SYSTEM', 'Follow the system']], (v) => app.hooks.setTheme(v)));
    { const h = sw({ label: 'HINTS', value: !!look.get('hints'), title: 'Hover hints on controls', onChange: (v) => look.set({ hints: v }) }); paints.push(() => h.set(!!look.get('hints'))); row(gm, h); }
    const moreRow = el('div', 'mm-sh-more', host), more = group('');
    { const f = fold(moreRow, more, { what: 'more settings', key: 'menuMore' }); f.button.prepend(el('span', 'mm-sh-morew', null, 'MORE')); hint(f.button, 'More: the grid, the clock and the fine-tuning'); }
    /* 036 G5b (chain K's FOR-SOS): STROKE — the kit's look key `stroke` (0–1 by .05; MIR OPTIONS › CONTROLS' 0–100 % knob; λWAVES' home 0), a
       second face of the look store as the rows above; shown only where the kit carries the key (MIR 1.5.7-alpha's door) */
    if (look.get('stroke') !== undefined) {
      const k = knob({ label: 'STROKE', title: 'The controls’ outline: 0 % none', min: 0, max: 100, step: 5, value: Math.round((look.get('stroke') || 0) * 100), fmt: (v) => Math.round(v) + ' %',
        onChange: (v) => look.set({ stroke: Math.round(v / 5) * 5 / 100 }) });
      paints.push(() => { const v = Math.round((look.get('stroke') || 0) * 100); if (k.get() !== v) k.set(v); }); row(more, k); }
    const Q = (...ks) => row(more, ...ks.map((k) => face(ui[k])));
    row(more, face(ui.gridSeg, { label: 'GRID' }));   // the rack's grid seg is wordless (013 S1: its group head names it); the sheet's row says GRID
    Q('autoSw', 'govSw'); Q('cadSeg'); Q('clockSeg'); Q('cadenceSeg'); Q('latencyRo'); Q('scaleRo');
    Q('ditherSeg'); Q('ditherK'); Q('domainAuto', 'domainKnob'); Q('keepSw');
    paint();
    return { paint };
  }
  return { createFieldQuality };
}
