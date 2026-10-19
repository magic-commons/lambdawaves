/* lab/windows/settings-card.js — the SETTINGS card (0.5.2 R2c; moved verbatim out of lab/rack.js boot()) at TWO seats: INTERFACE · THEME · SURFACE and the
 * stage hooks (app.hooks, read live) under THEME and SURFACE's header; boot() calls createFieldQuality() where FIELD QUALITY stood. */
import { TIER } from '../rack.js';
import { el, knob, sw, seg, trig, readout, group } from '../mir/kit.js'; import { rgbToHex, hexToRgb } from '../mir/palette.js'; import { createInformational } from '../informational.js'; import { askUrlOf } from '../ask.js';
export function createSettingsCard(app) {
  const { ui, device, mat } = app, { schedule } = app.loop, { quality, saveSettings } = app.sh,
    { domain, fieldRate, setGovernor, setKeepFrames, setPerfMode, modHand, look, applyAccent, paintMarks, field } = app.ctl;
    ui.set = device({ id: 'settings', eyebrow: 'SETTINGS', status: '' });
    const gi = group(ui.set.body, 'INTERFACE');
    const ri = el('div', 'row tight', gi);
    /* iteration 003 · THE LOOK LEFT SETTINGS FOR MIR OPTIONS (lab/mir-gui.js, the kit's createGui; BASINS' split, app/settings-window.js):
       STATUS TAGS, CONTROL HINTS (HINTS) and HELP are TEXT › SHOW there; THEME, CARD STYLE (PANE), FROST, GLASS BLUR (BLUR), DISCONNECTED,
       ACCENT A / B, VIVID, RESET LAYOUT and FORGET too.  SETTINGS keeps λWAVES' own: the stage, its chrome, sound, Gemma, the gamut, quality. */
    ui.setWindowInfo = (v) => look.set({ help: v });   // the WINDOW menu's `notes` action calls it by this name
    ui.capSw = sw({ label: 'STAGE CAPTIONS', value: false, title: 'the KEPLER / VORTEX lines at the foot of the stage', onChange: (v) => { document.body.classList.toggle('no-captions', !v); saveSettings(); schedule(TIER.PRESENT); } }); ri.appendChild(ui.capSw.root);
    ui.audioSw = sw({ label: 'AUDIO', value: false, title: 'sound from this page: the populated levels as tones, off by default (SPECTRUM › BEAT EQUALIZER › SOUND)', onChange: (v) => { ui.setAudio(v); saveSettings(); } }); ri.appendChild(ui.audioSw.root);   // 0.6.4 S2: a PREFERENCE (`audio`), the consent
    const au = ui.askUrlIn = el('input', 'ask-line', ri); au.type = 'url'; au.spellcheck = false; au.placeholder = askUrlOf({}); au.setAttribute('aria-label', 'Gemma’s address');
    au.title = 'GEMMA — where ASK sends your words (tools/gemma/broker.py); empty is this host at 9443'; au.addEventListener('change', saveSettings); ui.askUrl = { root: au };   // 0.6.6 G2: a PREFERENCE (`askUrl`)
    createInformational(app);   // 0.5.3 M9: STAGE FORMULA and ATOM LABELS, each with its SIZE, left DISPLAY for their own window (lab/informational.js)
    const rc = el('div', 'row tight', gi);
    ui.frameSw = sw({ label: 'FRAME', value: true, title: 'Show the field boundary', onChange: () => { const modes=['box','lattice','dots','off']; const current=mat.frame===false?'off':mat.frameMode||'box'; const next=modes[(modes.indexOf(current)+1)%modes.length]; mat.frame=next!=='off'; mat.frameMode=next==='off'?'box':next; ui.frameSw.set(mat.frame); ui.frameSw.root.title='FRAME · '+next.toUpperCase(); saveSettings(); schedule(TIER.PRESENT); } });
    rc.appendChild(ui.frameSw.root);
    ui.axisSw = sw({ label: 'AXIS', value: true, title: 'Show or hide the x, y, and z axes', onChange: () => { const modes=['box','corner','off']; const current=mat.axis===false?'off':mat.axisMode||'box'; const next=modes[(modes.indexOf(current)+1)%modes.length]; mat.axis=next!=='off'; mat.axisMode=next==='off'?'box':next; ui.axisSw.set(mat.axis); ui.axisSw.root.title='AXIS · '+next.toUpperCase(); saveSettings(); schedule(TIER.PRESENT); } });
    rc.appendChild(ui.axisSw.root);
    ui.axisInkSeg = seg({ label: 'AXIS COLOUR', value: 'theme', options: [
      { id: 'theme', label: 'THEME', title: 'Choose axis colours from the current theme' },
      { id: 'cmy', label: 'CMY', title: 'Use cyan, magenta, and yellow axes' },
      { id: 'rgb', label: 'RGB', title: 'Use red, green, and blue axes' }],
      onChange: (v) => { mat.axisInk = v; saveSettings(); schedule(TIER.PRESENT); } });
    rc.appendChild(ui.axisInkSeg.root);
    ri.appendChild(trig({ label: 'SHOW THE WARNING AGAIN', title: 'Show the photosensitivity notice now and on the next load', onFire: () => { if (app.hooks.warning) { app.hooks.warning.reset(); app.hooks.warning.show(); } } }).root);
    el('div', 'note', gi).innerHTML = '<b>Settings.</b> Appearance and performance choices are stored in this browser. Window power stops its reader; collapse changes layout; close removes the window until reopened from + or WINDOW.';
    const gt = group(ui.set.body, 'THEME  ·  SURFACE');
    const rt = el('div', 'row tight', gt);
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
      paintMarks(); schedule(TIER.PRESENT);
    }
    app.hooks.restage = () => setStageMix(app.state.stageMix);
    function setStageColour(colour) {
      if (Array.isArray(colour) && colour.length >= 3) mat.stageCustom = colour.slice(0, 3).map((v) => Math.max(0, Math.min(1, +v || 0)));
      if (ui.stageColour) ui.stageColour.value = rgbToHex(mat.stageCustom);
      setStageMix(app.state.stageMix);
    }
    function setStageFollow(on) {
      app.state.stageFollow = !!on;
      if (ui.stageFollow) { ui.stageFollow.classList.toggle('on', app.state.stageFollow); ui.stageFollow.setAttribute('aria-pressed', String(app.state.stageFollow)); }
      setStageMix(app.state.stageMix);
    }
    app.hooks.setStageColour = setStageColour;
    app.hooks.setStageFollow = setStageFollow;
    ui.stageK = knob({ label: 'STAGE', min: 0, max: 1, value: 0.04, fmt: (v) => (v * 100).toFixed(0) + '%', onInput: (v) => { if (!modHand('material.stage', v)) setStageMix(v); } });
    app.hooks.setStage = (v) => { const x = Math.max(0, Math.min(1, +v || 0)); ui.stageK.set(x); setStageMix(x); return x; };
    { const seat = el('div', 'stage-seat', rt); ui.stageSeat = { root: seat };
      ui.stageColour = el('input', 'pal-color stage-colour', seat); ui.stageColour.type = 'color'; ui.stageColour.title = 'Stage colour at 100%'; ui.stageColour.setAttribute('aria-label', 'stage colour');
      ui.stageColour.addEventListener('input', () => { setStageColour(hexToRgb(ui.stageColour.value)); setStageFollow(false); });
      ui.stageFollow = el('button', 'trig stage-follow', seat, 'FOLLOW THEME'); ui.stageFollow.type = 'button'; ui.stageFollow.title = 'Ignore the chosen stage colour';
      ui.stageFollow.addEventListener('click', () => setStageFollow(!app.state.stageFollow));
      rt.appendChild(ui.stageK.root); setStageColour(mat.stageCustom); setStageFollow(true); }
    ui.gammaK = knob({ label: 'GAMMA', min: 0.5, max: 2.4, value: 1, fmt: (v) => v.toFixed(2), onInput: (v) => { if (modHand('material.gamma', v)) return; mat.gamma = v; schedule(TIER.PRESENT); } }); rt.appendChild(ui.gammaK.root);
    const gamutSup = field.ok && field.gamutSupport ? field.gamutSupport : { canvas: false, css: false, display: false, reason: 'no WebGPU device: the canvas has no colour space to set' };
    const gamutOK = !!(gamutSup.canvas && gamutSup.css);
    const rg = el('div', 'row tight', gt);
    ui.gamutSeg = seg({ label: 'GAMUT', value: 'srgb', options: [
      { id: 'srgb', label: 'sRGB', title: 'Use the sRGB colour space' },
      { id: 'p3', label: 'DISPLAY-P3', title: gamutOK ? 'the wider space, on BOTH sides at once — the canvas is re-configured and every accent is re-expressed in it' : gamutSup.reason }],
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
  function createFieldQuality() {   // the second seat: FIELD QUALITY
    const gq = group(ui.set.body, 'FIELD QUALITY');
    const r5 = el('div', 'row', gq);
    ui.gridSeg = seg({ label: 'GRID', value: String(quality.res),   /* wave 101: the CONTROL reads the shipped grid rather than restating it — a hardcoded '96' here would have disagreed with quality.res the moment the default moved */ options: [{ id: '64', label: '64³' }, { id: '96', label: '96³' }, { id: '128', label: '128³' }],
      onChange: (v) => { quality.res = +v; quality.steps = { 64: 110, 96: 160, 128: 240 }[+v]; quality.scale = { 64: 0.75, 96: 1, 128: 1 }[+v]; schedule(TIER.REBUILD); } });
    r5.appendChild(ui.gridSeg.root);
    r5.appendChild(seg({ label: 'FIELD CLOCK cap', value: '0', options: [{ id: '0', label: 'MAX' }, { id: '33', label: '30 Hz' }, { id: '66', label: '15 Hz' }, { id: '200', label: '5 Hz' }],
      onChange: (v) => { fieldRate.capMs = +v; } }).root);
    const r5b = el('div', 'row tight', gq);
    ui.autoSw = sw({ label: 'AUTO SCALE', value: true, title: 'Adjust canvas resolution to the frame budget', onChange: (v) => { quality.auto = v; if (!v) quality.autoScale = 1; saveSettings(); } }); r5b.appendChild(ui.autoSw.root);
    ui.govSw = sw({ label: 'GOVERNOR', value: true, title: 'Protect the frame rate automatically', onChange: (v) => { setGovernor(v); saveSettings(); } }); r5b.appendChild(ui.govSw.root);
    ui.perfSeg = seg({ label: 'PERFORMANCE', value: '120', options: [   // 0.4.0 S3: out of METERS, beside the GOVERNOR it works with
      { id: 'full', label: 'FULL', title: 'Update visible readers every frame' },
      { id: '120', label: '120 Hz', title: 'Update visible CPU readers every fourth frame' }],
      onChange: (v) => { setPerfMode(v); saveSettings(); } });
    r5b.appendChild(ui.perfSeg.root);
    ui.scaleRo = readout({ label: 'RENDER SCALE', value: '100%', sub: 'canvas pixels per CSS pixel × DPR' });
    r5b.appendChild(ui.scaleRo.root);
    /* iteration 008 W (Josh: "Remove dithering row from wave and move it to quality in settings"): DITHER is this display's, a PREFERENCE
       (`dither` in the settings blob, the amplitude in LSB, 0 = OFF), no longer a project's (FIELD_CHROME: serialize strips it, restore ignores it) */
    const r5c = el('div', 'row tight lw-dither', gq);
    const setDither = (v) => { mat.dither = v; ui.ditherK.setDisabled(!v); schedule(TIER.PRESENT); saveSettings(); };
    ui.ditherSeg = seg({ label: 'DITHER', value: 'off', options: [
      { id: 'off', label: 'OFF', title: 'the colour goes to the 8-bit swapchain as it is' },
      { id: 'ordered', label: 'ORDERED 8×8', title: 'Apply ordered dithering to reduce 8-bit colour bands' }],
      onChange: (v) => setDither(v === 'off' ? 0 : ui.ditherK.get()) });
    r5c.appendChild(ui.ditherSeg.root);
    ui.ditherK = knob({ label: 'STRENGTH', min: 0.25, max: 2, value: 1, fmt: (v) => '±' + (v / 2).toFixed(2) + ' LSB', onInput: (v) => { if (ui.ditherSeg.get() !== 'off') setDither(v); } });
    ui.ditherK.root.title = 'Dither strength in 8-bit output levels; 1 is ±½ level';
    ui.ditherK.setDisabled(true);
    r5c.appendChild(ui.ditherK.root);
    ui.showDither = (k) => { ui.ditherSeg.set(k ? 'ordered' : 'off'); ui.ditherK.setDisabled(!k); if (k) ui.ditherK.set(Math.max(0.25, Math.min(2, k))); };   // the controls repainted from mat.dither (the settings, a lift, LW)
    const r6 = el('div', 'row', gq);
    ui.domainAuto = sw({ label: 'DOMAIN AUTO', value: true, onChange: (v) => { domain.auto = v; ui.domainKnob.setDisabled(v); schedule(TIER.REBUILD); } });
    r6.appendChild(ui.domainAuto.root);
    ui.domainKnob = knob({ label: 'HALF-WIDTH', min: 3, max: 140, value: 7, log: true, fmt: (v) => '±' + v.toFixed(0) + ' a₀', onChange: (v) => { domain.half = v; schedule(TIER.REBUILD); } });
    ui.domainKnob.setDisabled(true);
    r6.appendChild(ui.domainKnob.root);
    const r7 = el('div', 'row tight', gq);
    ui.keepSw = sw({ label: 'KEEP FRAMES', value: false, title: 'Update the playhead every frame', onChange: (v) => { setKeepFrames(v); saveSettings(); } }); r7.appendChild(ui.keepSw.root);
    el('div', 'note', gq).innerHTML = '<b>Performance.</b> AUTO SCALE lowers canvas resolution when frames exceed the budget. GOVERNOR can also pause expensive readers and retries them periodically. PERFORMANCE 120 Hz updates the visible CPU readers every fourth frame while the field presents every frame; FULL updates them every frame. DITHER (ordered 8×8) breaks up 8-bit colour bands on this display; STRENGTH 1 is ±½ output level. KEEP FRAMES updates the playhead every frame and may cost performance.';
  }
  return { createFieldQuality };
}
