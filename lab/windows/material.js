/* lab/windows/material.js — WAVE (SPACE, OBSERVABLE, DRAW), CLIP, PALETTE · INVERT and CAMERA (0.5.2 R2c; moved verbatim out of lab/rack.js boot()) at TWO
 * seats around SETTINGS: createMaterial(app) makes the four cards and WAVE's head; boot() calls createDrawClipPaletteCamera() where DRAW stood. */
import { TIER } from '../tier.js';
import { el, knob, sw, seg, group, readout, chip, hint, trig, label } from '../mir/kit.js'; import { fold } from '../fold.js'; import { VIEW, STYLE, drawStyle, KNEE_DEFAULT, PROBE_R, ESP_RANGE, atomSizeOf, stickROf, liftAtomStyle, cameraBasis } from '../field.js'; import { ESP_RAMP } from '../palette-app.js'; import { availability } from '../shell/settings.js'; import { infoPrefs } from '../shell/stage-words.js';
import { createLight, summonLight } from '../light-window.js';   // 037 L1: THE LIGHTING WINDOW, CAMERA's sibling (lab/, not windows/); L4 its summons
import { createRampPanel } from '../mir/panels/ramp.js'; import { createUserPresets, uniqueName } from '../user-presets.js'; import { createCameraPanel, directionSphere } from '../mir/panels/camera.js'; import { PRESET_BY_ID as PALETTE_BY_ID, PRESET_GROUPS, rgbToHex, hexToRgb } from '../mir/palette.js';
export function createMaterial(app) {
  const { ui, device, mat, obs, PAL_DEF } = app, { schedule } = app.loop, { cameraPort } = app.host, { saveSettings } = app.sh, { mod, modHand, applyAccent, field } = app.ctl;
  const wObs = device({ id: 'observer', eyebrow: 'WAVE', status: '' });
  let paintBar = () => {};   // the ESP bar's colours (018 B5), set where the bar is built
  const wPal = device({ id: 'palette', eyebrow: 'PALETTE', status: '' });
  const wCam = device({ id: 'camera', eyebrow: 'CAMERA', status: '' });
  const wClip = device({ id: 'clip', eyebrow: 'CLIP', status: '' });   // 0.4.0 S3 (R-W3): CLIP, once SLICE / CLIP — the id stays
    const gSpace = group(wObs.body, 'SPACE');
    const gDraw = group(wObs.body, 'DRAW');
    {
      const r0 = el('div', 'row', gSpace);
      ui.spaceSeg = seg({ label: 'the same state, two exact pictures', value: 'x', options: [
        { id: 'x', label: 'POSITION ψ(x)', title: 'the wavefunction in space' },
        { id: 'p', label: 'MOMENTUM φ(p)', title: 'Momentum-space view of the state' }],
        onChange: (v) => { app.state.space = v; schedule(TIER.REBUILD); } });
      r0.appendChild(ui.spaceSeg.root);
      ui.spaceNote = el('div', 'sturm-note', gSpace); ui.spaceNote.hidden = true;          // its own class: the ⓘ sweep folds every .note away, and this one must be seen
      ui.spaceNote.innerHTML = '<b>STURMIAN:</b> momentum space is not built for the scaled radials (the Podolsky–Pauling transform would need its own table) — position space only until SCALE is back on HYDROGEN.';
    }
    const r1 = el('div', 'row', gSpace);
    /* iteration 008 W (Josh: "delta p AND Re+Im … where is this different from the other viewpoints other than color?"): FOUR observables.
       Re+Im was two pictures in one volume (PHASE carries both as hue); Δρ is MOLECULES' Δ beside KICK.  A saved one maps by waveView. */
    /* 040 I4 · THE MATH FACE (Josh 11-09: "the classical greek font they use in LaTeX math fonts; I think we already have one built in"): the
       announcement is the observable as LaTeX writes it, set by the page's KaTeX (the stage formula's); the plain line is its fallback */
    const VIEW_SAY = { density: ['ρ = |ψ|²', '\\rho = |\\psi|^2'], phase: ['arg ψ', '\\arg\\psi'], real: ['Re ψ', '\\operatorname{Re}\\psi'], imag: ['Im ψ', '\\operatorname{Im}\\psi'] };
    ui.viewSeg = seg({ label: 'OBSERVABLE (colour is semantic)', value: 'phase', options: [
      { id: 'density', label: '<m>ρ=|ψ|²</m>', title: 'Probability density (palette θ = 0; off: the old blue)' }, { id: 'phase', label: '<m>arg ψ</m>', title: 'phase as hue, density as opacity' },
      { id: 'real', label: '<m>Re ψ</m>', title: 'signed: palette 0 and π, or the original orange/blue' }, { id: 'imag', label: '<m>Im ψ</m>', title: 'signed: palette ±π/2, a quarter turn from Re' }],   // 038 F4
      onChange: (v) => { mat.view = VIEW[v]; schedule(TIER.PRESENT); if (app.state.stageText) app.state.stageText.say('view', VIEW_SAY[v][0], { tex: VIEW_SAY[v][1] }); } });
    r1.appendChild(ui.viewSeg.root).dataset.keyAction = 'view';
    const r2 = el('div', 'row tight', gSpace);
    ui.expK = knob({ label: 'EXPOSURE', min: 0.08, max: 12, value: 1, log: true, fmt: (v) => v.toFixed(2), onInput: (v) => { if (modHand('material.exposure', v)) return; mat.exposure = v; schedule(TIER.PRESENT); } }); r2.appendChild(ui.expK.root);
    ui.softK = knob({ label: 'SOFT', reverse: true, min: 0.3, max: 2.2, value: 0.7, fmt: (v) => 'γ' + v.toFixed(2), onInput: (v) => { if (modHand('material.softness', v)) return; mat.softness = v; schedule(TIER.PRESENT); } }); r2.appendChild(ui.softK.root);
    ui.hueK = knob({ label: 'HUE', min: 0, max: 1, value: 0, wrap: true, fmt: (v) => (v * 360).toFixed(0) + '°', onInput: (v) => { if (modHand('material.hue', v)) return; mat.hueShift = v; applyAccent(); paintBar(); schedule(TIER.PRESENT); } }); r2.appendChild(ui.hueK.root);
  function createDrawClipPaletteCamera() {   // the second seat: WAVE's DRAW · CLIP · PALETTE · INVERT · CAMERA
    const gd = group(gDraw, 'the transfer has a bounded ceiling');            // WAVE 56: DRAW STYLE (window id `style`) merged into WAVE (board #59); this block is the DRAW section of the WAVE window
    const rd = el('div', 'row tight', gd);
    ui.styleSeg = seg({ label: 'STYLE', value: 'cloud', options: [
      { id: 'cloud', label: 'CLOUD', title: 'the emission/absorption integral' },
      { id: 'solid', label: 'SOLID', title: 'Render a lit density shell' },
      { id: 'signed', label: 'SIGNED', title: 'Render signed lobes and nodal surfaces' },
      { id: 'dust', label: 'DUST', title: 'Grains fixed in the world, where the field is' },
      { id:'glass',label:'SHELL',title:'Render a translucent density shell' },
      { id: 'glassSigned', label: 'SHELL ±', title: 'SIGNED lobes as a translucent shell' },   // iteration 010 X7 (STYLE 8)
      { id:'additive',label:'ADD',title:'Additive emission through the field' },
      { id: 'bands', label: 'BANDS', title: 'One level surface per octave of the density, anchored at ISO' },
      { id: 'esp', label: 'ESP', title: 'ESP map on the surface (red −, blue +)' }],   // B3 (STYLE 11); 032 O1: BALLS (9) and STICKS (10) are SIZE and RADIUS > 0 now (the ids reserved)
      onChange: (v) => { const from = mat.style | 0; mat.style = STYLE[drawStyle(v)]; ui.styleRecall(from, mat.style); styleSync(); schedule(TIER.PRESENT); if (app.state.stageText) app.state.stageText.say('style', 'STYLE · ' + ui.styleSeg.button(v).textContent); } });   // iteration 007: INFORMATIONAL › STYLE · PALETTE · 038 K1: the hand's switch recalls
    rd.appendChild(ui.styleSeg.root).dataset.keyAction = 'style';
    /** 032 O1: the styles the seg offers now, in its order, with their words — the STYLE menus (the stage's, VIEW's) and the STYLE target's bands */
    ui.styleList = () => ui.styleSeg.spec.options.filter((o) => o.id !== 'esp' || !availability('wave.style.esp', app).hide).map((o) => [o.id, ui.styleSeg.button(o.id).textContent]);   // the law, not the DOM: a restore asks before the seg repaints
    /* 2026-09-10 (Josh): ISO, GRAIN and KNEE sit directly under EXPOSURE, SOFT and HUE — one six-knob
       material row above STYLE — instead of a second row below the style seg. */
    ui.isoK = knob({ label: 'ISO', reverse: true, min: 0.002, max: 0.9, value: 0.06, log: true, fmt: (v) => v.toFixed(3), onInput: (v) => { if (modHand('material.iso', v)) return; mat.iso = v; schedule(TIER.PRESENT); } }); ui.hueK.root.parentElement.appendChild(ui.isoK.root);
    ui.grainK = knob({ label: 'GRAIN', min: 0.02, max: 1, value: 0.35, log: true, fmt: (v) => v.toFixed(2), onInput: (v) => { if (modHand('material.grain', v)) return; mat.grain = v; schedule(TIER.PRESENT); } }); ui.hueK.root.parentElement.appendChild(ui.grainK.root);
    ui.kneeK = knob({ label: 'KNEE', reverse: true, min: 0.02, max: 8, value: KNEE_DEFAULT, log: true, fmt: (v) => v.toFixed(2), title: 'Opacity curve · 0.6 = exponential', onInput: (v) => { if (modHand('material.knee', v)) return; mat.knee = v; schedule(TIER.PRESENT); } }); ui.hueK.root.parentElement.appendChild(ui.kneeK.root);
    /* iteration 014 B · THE THREE VIEWS' controls (two rows, shown while BALLS, STICKS or ESP is drawn; a control the style does not read is dimmed,
       never moved).  The keys are written into `mat` only by a hand, so a project that never touched them serialises as before. */
    /* 020 S4: a.u. with fewer decimals the larger it is (RANGE reaches 50): 0.100 · 2.50 · 37.5 — the knob and the ESP bar's numbers */
    const auN = (v) => { const a = Math.abs(v); return a.toFixed(a >= 10 ? 1 : a >= 1 ? 2 : 3); }, pctF = (v) => Math.round(v * 100) + '%', au = (v) => '±' + auN(v);
    /* 032 O1 · THE ATOMS ARE KNOBS: SIZE > 0 draws the atoms and RADIUS > 0 the bonds under any style (field.js atomsOver; ESP keeps its sticks only),
       both 0 by default so no picture moved; an older BALLS / STICKS opens as SHELL with its knob raised (field.js liftAtomStyle) */
    ui.atomSizeK = knob({ label: 'SIZE', min: 0, max: 1.5, value: 0, fmt: pctF, title: 'SIZE > 0 draws the atoms (× van der Waals)', onInput: (v) => { mat.atomSize = v; ui.sliceCut?.sync(); schedule(TIER.PRESENT); } });
    ui.stickK = knob({ label: 'RADIUS', min: 0, max: 1.2, value: 0, fmt: (v) => v.toFixed(2), title: 'RADIUS > 0 draws the bonds (bohr)', onInput: (v) => { mat.stickR = v; ui.sliceCut?.sync(); schedule(TIER.PRESENT); } });
    ui.probeK = knob({ label: 'PROBE', min: 0.5, max: 5, value: PROBE_R, fmt: (v) => v.toFixed(2), title: 'Probe radius in bohr (2.65 = water)', onInput: (v) => { mat.probe = v; schedule(TIER.PRESENT); } });
    ui.espRangeK = knob({ label: 'RANGE', min: 0.002, max: 50, value: ESP_RANGE, log: true, fmt: au, title: 'ESP colour span ±RANGE Eh/e', onInput: (v) => { mat.espRange = v; styleSync(); schedule(TIER.PRESENT); } });
    ui.espSurfSeg = seg({ aria: 'potential surface', value: 'iso', options: [
      { id: 'iso', label: 'ISO', title: 'The density’s own surface, ρ = ISO/30' },
      { id: 'sas', label: 'SAS', title: 'Solvent-accessible surface (vdW + PROBE)' },
      { id: 'ses', label: 'SES', title: 'Solvent-excluded surface (crevices filled)' }],
      onChange: (v) => { mat.espSurf = v; styleSync(); schedule(TIER.PRESENT); } });
    /* iteration 016 S2 · MAP ONLY (Josh: "a toggle beside RADIUS hides the sticks under ESP so the map stands alone, and nothing is drawn underneath as its
       opacity falls"): `mat.espBare`, written only by a hand (absent = off, so an older file and the edit bytes are unchanged; an older build ignores it) */
    ui.espBareSw = sw({ label: 'MAP ONLY', value: false, title: 'ESP map alone, no sticks inside', onChange: (on) => { mat.espBare = on; ui.sliceCut?.sync(); schedule(TIER.PRESENT); } });
    ui.espLiveSw = sw({ label: 'LIVE · SLOW', value: false, title: 'ESP: re-solve live (≤ 1/s)', onChange: (on) => { mat.espLive = on; schedule(TIER.PRESENT); } });
    { const r = el('div', 'row tight', gd); for (const k of [ui.atomSizeK, ui.stickK, ui.espBareSw, ui.espSurfSeg]) r.appendChild(k.root); const r2 = el('div', 'row tight', gd); for (const k of [ui.probeK, ui.espRangeK, ui.espLiveSw]) r2.appendChild(k.root); }   // 018 B2 (native-ui.js seats the same two)
    /* the map's COLOUR BAR (Josh's answer 3): vertical, beside the map at the free stage's right, five numbers — the signed log's inverse at s = ±1, ±½, 0
       (iteration 015 W3: ±RANGE, ±RANGE·(√21 − 1)/20, 0).  Iteration 018 B5 (Josh: "the charge color strip … should change while summing all the hue
       changes from wave's hue knob, palette's hue rotate knob and invert"): the bar IS field.js espColour, sampled — PALETTE ON the LUT between its
       first and last stop (palSpan) offset by HUE × 256, PALETTE OFF the five-stop ramp through hueRot (Rodrigues about grey), then INVERT 1 − c; no
       CSS filter.  ROTATE follows because it rotates the stops the LUT is made of */
    const bar = el('div', 'lw-espbar', app.dom.stage); bar.hidden = true; bar.setAttribute('aria-hidden', 'true');
    const barRamp = el('i', 'lw-espbar-ramp', bar), barNums = [0, 1, 2, 3, 4].map(() => el('span', 'lw-espbar-n', bar));
    for (const [end, w] of [['pos', '+ POSITIVE'], ['neg', '− NEGATIVE']]) label(el('span', 'lw-espbar-n lw-espbar-w', bar), w).dataset.end = end;   // 039 X3: the key's words beyond its ends (film-bake draws every .lw-espbar-n)
    let barTimer = 0, barKey = '', palLut = null, lutN = 0;
    const RAMP = ESP_RAMP.map(hexToRgb), K3 = 1 / Math.sqrt(3);
    const hueRot = (c, h) => { if (!h) return c; const a = h * 2 * Math.PI, ca = Math.cos(a), sa = Math.sin(a), d = (c[0] + c[1] + c[2]) / 3 * (1 - ca);
      const x = [c[2] - c[1], c[0] - c[2], c[1] - c[0]]; return c.map((v, i) => Math.min(1, Math.max(0, v * ca + K3 * x[i] * sa + d))); };   // field.js hueRot: k = (1,1,1)/√3
    const espAt = (u) => {   // field.js espColour at the map's u ∈ [0, 1] (−RANGE … +RANGE)
      const h = mat.hueShift || 0; let c;
      if (mat.paletteOn && palLut) { const ps = palSorted(), a = Math.round(ps[0].at * 256), b = Math.min(255, Math.round(ps[ps.length - 1].at * 256));
        let x = a + (b - a) * u + h * 256; x -= 256 * Math.floor(x / 256); const i = Math.floor(x) % 256, j = (i + 1) % 256, f = x - Math.floor(x);
        c = [0, 1, 2].map((q) => palLut[i * 4 + q] + (palLut[j * 4 + q] - palLut[i * 4 + q]) * f); }
      else { const s = u * 4, k = Math.min(3, Math.floor(s)), f = s - k; c = hueRot(RAMP[k].map((v, q) => v + (RAMP[k + 1][q] - v) * f), h); }
      return mat.invert ? c.map((v) => 1 - v) : c; };
    /* 039 X3 · THE KEY UNDER MOLECULES' VIEW ESP (WALK-A #8: the walker pressed VIEW ESP, and the bar was STYLE ESP's alone): VIEW ESP draws Φ
       signed, READ as 'real' (field.js mode 2: + at the palette's 0.5 + HUE, − at its HUE; PALETTE OFF (1, .58, .16) and (.22, .5, 1); INVERT
       last), so the bar shows there too (`data-kind` view): the − colour, clear at 0, the + colour; its numbers blank but 0 */
    const molEsp = () => !!(app.state.chem && app.state.chem.on && app.state.chem.view === 'esp');
    const signedAt = (pos) => { let c; if (mat.paletteOn && palLut) { const x = (pos ? 0.5 : 0) + (mat.hueShift || 0), i = Math.floor((x - Math.floor(x)) * 256) % 256; c = [0, 1, 2].map((q) => palLut[i * 4 + q]); }
      else c = pos ? [1, 0.58, 0.16] : [0.22, 0.5, 1]; return mat.invert ? c.map((v) => 1 - v) : c; };
    paintBar = () => { if (bar.hidden) return; const sig = bar.dataset.kind === 'view', key = [sig, mat.paletteOn, mat.hueShift, mat.invert, lutN, bar.dataset.side].join();
      if (key === barKey) return; barKey = key; const to = 'linear-gradient(to ' + (/^(top|bottom)$/.test(bar.dataset.side) ? 'right' : 'top') + ', ', neg = rgbToHex(signedAt(false)), pos = rgbToHex(signedAt(true));
      barRamp.style.background = sig ? to + neg + ' 0%, ' + neg + '00 50%, ' + pos + '00 50%, ' + pos + ' 100%)' : to + Array.from({ length: 25 }, (_, i) => rgbToHex(espAt(i / 24)) + ' ' + (i / 24 * 100).toFixed(1) + '%').join(', ') + ')'; };
    /* iteration 018 B7 · THE BAR'S SEAT is INFORMATIONAL's (ESP BAR · SIDE · PAD in `lambdawaves.q0.info`): the free stage the formula's block reads (racks
       and a floating transport out), PAD a share of it from the SIDE's edge, centred along it; TOP and BOTTOM lie the bar down (data-side, lab.css).
       THE STAGE TEXT WINS: a bar that would cross the formula block steps clear of it, vertically — a TOP bar under it, a BOTTOM bar over it, a side
       bar away from it.  023 R6 (Josh: "If the ESP strip is either left or right, it shouldn't readjust whenever CSB … is open"): a LEFT or RIGHT bar is
       seated from the stage's edges and the racks only (`free(false)`), so the CSB opening, expanding, docking or folding moves it by 0 px; its unit
       (φ · a.u.) is ESP BAR's hint, not a caption on the strip.  039 F2 · THE WHOLE KEY IS SEATED (X-REVIEW #1: at 1000 × 700 "− NEGATIVE", 6 px past
       the ramp's foot, lay under the bar): the ramp, its numbers and its words are one box (`k`, bar px), and since THE BAR IS ON TOP that box steps clear
       of the bar's resting box where it would lie under it — the only time the bar moves a side strip */
    const IP = infoPrefs();
    const barSeat = () => {
      const st = app.state.stageText, sb = app.dom.stage.getBoundingClientRect(), side = IP.get('espBarSide'), pad = IP.get('espBarPad'), horiz = side === 'top' || side === 'bottom';
      if (bar.dataset.side !== side) { bar.dataset.side = side; barNums.forEach((n, i) => { n.style.top = horiz ? '' : i * 25 + '%'; n.style.left = horiz ? 100 - i * 25 + '%' : ''; }); paintBar(); }
      const F = st ? st.free(horiz) : { L: 16, R: sb.width - 16, T: 16, B: sb.height - 16 }, b = st && st.blockRect(), T = F.barBox, G = 12;
      const o = bar.getBoundingClientRect(), k = { x0: 0, y0: 0, x1: bar.offsetWidth, y1: bar.offsetHeight };
      for (const n of bar.children) { const r = n.getBoundingClientRect(); if (r.width) { k.x0 = Math.min(k.x0, r.left - o.left); k.y0 = Math.min(k.y0, r.top - o.top); k.x1 = Math.max(k.x1, r.right - o.left); k.y1 = Math.max(k.y1, r.bottom - o.top); } }
      const w = k.x1 - k.x0, h = k.y1 - k.y0, x = horiz ? (F.L + F.R - w) / 2 : side === 'left' ? F.L + pad * (F.R - F.L) : F.R - pad * (F.R - F.L) - w;
      let y = horiz ? (side === 'top' ? F.T + pad * (F.B - F.T) : F.B - pad * (F.B - F.T) - h) : (F.T + F.B - h) / 2;
      if (b && x < b.right + G && x + w > b.left - G && y < b.bottom + G && y + h > b.top - G) y = side === 'top' || (side !== 'bottom' && b.top + b.bottom < 2 * y + h) ? b.bottom + G : b.top - G - h;
      if (T && x < T.right && x + w > T.left && y < T.bottom + G && y + h > T.top - G) y = T.top + T.bottom < 2 * y + h ? T.bottom + G : T.top - G - h;
      bar.style.left = Math.round(x - k.x0) + 'px'; bar.style.top = Math.round(y - k.y0) + 'px'; };
    IP.subscribe((_, changed) => { if (changed.some((k) => /^(espBar|infoP)/.test(k))) styleSync(); });
    /* iteration 015 W1 · THE KNOBS FOLLOW THE STYLE (Josh: "Allow the knobs to be dynamically shown"): the table is RENDER_WGSL's own reads (SOFT is the
       power w = ρ^SOFT, which SOLID · SIGNED · SHELL · SHELL ± overwrite, and ESP's soft edge under its ISO surface since 016 S1; KNEE is the transmittance
       T_q, which ADD and the atom styles skip; ISO under ESP is its ISO surface's).  Iteration 016 V1 (Josh: "the knobs a style does not read are GREYED,
       not hidden … the seats stay put"): a control the style does not read is DISABLED in the kit's own muted look (`.disabled`, --state-disabled), never
       hidden, so no seat moves; a route on a greyed knob keeps running (its window wears W8's ACCENT B dot) */
    const S_ = STYLE, VOL = [S_.cloud, S_.solid, S_.signed, S_.bands, S_.dust, S_.glass, S_.glassSigned];
    const STYLE_READS = { isoK: [S_.solid, S_.signed, S_.bands, S_.glass, S_.glassSigned, S_.esp], kneeK: VOL, softK: [S_.cloud, S_.bands, S_.dust, S_.additive, S_.esp], grainK: [S_.dust],
      atomSizeK: [...VOL, S_.additive], stickK: [...VOL, S_.additive, S_.esp], espBareSw: [S_.esp], probeK: [S_.esp], espRangeK: [S_.esp], espSurfSeg: [S_.esp], espLiveSw: [S_.esp] };   // 032 O1: SIZE in every style but ESP (its sticks alone), RADIUS in every one
    /* 038 K1 · A STYLE REMEMBERS ITS KNOBS (Josh: "Each style mode … if not tethered to a macro/timeline clip should retain their information"): leaving a
       style keeps the knobs it reads (EXPOSURE and HUE always, SOFT · ISO · GRAIN · KNEE as STYLE_READS has them) in `mat.styleMem[<style>]`, and entering
       one puts its remembered values back.  A knob a route (the modulation window's list) or a timeline clip holds is TETHERED, skipped both ways: the route
       owns it (the routes and the clips are read; 040 A1 A ROUTED KNOB IGNORES THE STYLE'S MEMORY, Josh: "if exposure is now tied to the timeline, then it
       should completely ignore the style-parameter saving rule": a target a modulator is writing now — `isModulated`, a film's drive — is tethered too, so
       the automation's value always stands).  A hand's switch (the seg, C, the stage's STYLE ›) and the STYLE target's set only; a restore, an undo, a demo
       and LW.setStyle keep the file's own values.  `styleMem` rides presentation.mat (absent: nothing remembered; never in NEW; a link does not carry it);
       it is replaced, never mutated, because a restore hands it the history's own record.
       040 A2 · THE STYLE'S MEMORY SURVIVES AN EVENT (Josh: "If I change the exposure knob, and then the event switches to the next style and then returns
       back to the style, the exposure is different"): the STYLE target's set (an EVENT lane) saves and restores exactly as a hand's switch does; what a
       playing lane writes into the memory is derived, so projectKey leaves `styleMem` out (shell/notebook.js: A DEMO PLAYS CLEAN, 039 R4) */
    const MEM = [['expK', 'exposure', 'material.exposure'], ['hueK', 'hueShift', 'material.hue'], ['softK', 'softness', 'material.softness'],
      ['isoK', 'iso', 'material.iso'], ['grainK', 'grain', 'material.grain'], ['kneeK', 'knee', 'material.knee']];
    const tethered = () => { const h = mod.host, ed = app.state.tl && app.state.tl.editor, T = new Set(h ? h.model.routeList().map((r) => r.targetId) : []);
      if (ed && ed.model) { const doc = ed.model.state(), on = new Set(doc.clips.map((c) => c.curveId)); for (const c of doc.curves) if (on.has(c.id)) T.add(c.targetId); }
      if (h) for (const [, , id] of MEM) if (h.registry.has(id) && h.registry.isModulated(id)) T.add(id);   // 040 A1: and whatever a modulator writes now
      return T; };
    /* a tethered knob keeps its last hand-set number for when it is let go */
    ui.styleRecall = (from, to) => {
      if (from === to) return;
      const T = tethered(), M = { ...mat.styleMem }, keep = {}, back = M[drawStyle(to)] || {};
      for (const [k, key, id] of MEM) if ((k === 'expK' || k === 'hueK' || STYLE_READS[k].includes(from)) && !T.has(id) && Number.isFinite(mat[key])) keep[key] = mat[key];
      if (Object.keys(keep).length) { M[drawStyle(from)] = { ...M[drawStyle(from)], ...keep }; mat.styleMem = M; }
      for (const [k, key, id] of MEM) if (Number.isFinite(back[key]) && !T.has(id) && back[key] !== mat[key]) { mat[key] = back[key]; ui[k].set(back[key]); if (k === 'hueK') { applyAccent(); paintBar(); } }
    };
    /* the kit's muted look on the three shapes: a knob's own setDisabled, a switch's button, a seg's buttons */
    const mute = (c, off, why) => { if (c.setDisabled) c.setDisabled(off); else { c.root.classList.toggle('disabled', off); c.root.setAttribute('aria-disabled', String(off));
      for (const b of c.root.matches('button') ? [c.root] : c.root.querySelectorAll('button')) b.disabled = off; }
      whyHint(c.root, off ? why : ''); };
    /* iteration 017 W2 (Josh 2026-10-26: "Grey out anything from 'Wave' that shouldn't work when switching between molecules or atoms/hydrogen"):
       styleSync greys by MODE as well as by style, one button at a time in the kit's muted look (seats stay).  Under a molecule MOMENTUM φ(p) (a set
       molecule owns the volume; the eigenmode kernel and its SPACE stand down) and Im ψ unless the volume is a complex orbital (the density, Δρ and a
       real orbital write (√ρ | ψ, 0): Im ψ draws nothing — the molecule matrix road in field.js); under hydrogen / an atom BALLS · STICKS · ESP, the molecule's
       views (the shader draws them as CLOUD there).  Iteration 018 B1 (Josh: "If molecules is off, it should hide anything related to molecules … so
       that the window is much smaller for hydrogen"): under hydrogen / an atom BALLS · STICKS · ESP and the two molecule rows are HIDDEN, their seats
       collapse; under a molecule the style greys stand as in 017 */
    /* 022 E1 · A GREYED CONTROL KEEPS ITS HINT, `why` FIRST: the English hint the control had (kept once in data-hint0), prefixed while it is
       off; the kit's door (1.5.6-alpha.8) lets the hover reach a disabled knob, switch or seg button */
    const whyHint = (n, why) => { if (n.dataset.hint0 === undefined) n.dataset.hint0 = n.dataset.helpEn || n.dataset.tTitle || n.title || '';
      const t = why ? why + (n.dataset.hint0 ? ' · ' + n.dataset.hint0 : '') : n.dataset.hint0;
      if (t) hint(n, t); else { n.removeAttribute('title'); delete n.dataset.help; delete n.dataset.helpEn; } };   // the kit's hint hop keeps a title as data-help
    const modeMute = (s, id, a) => { const b = s.button(id); if (!b) return; b.disabled = !a.on; whyHint(b, a.on ? '' : a.why); };
    /* AVAILABILITY IS ONE LAW (022 E1, shell/settings.js `availability`): SPACE's MOMENTUM (a molecule, STURMIAN or a `noMomentum` operator),
       Im ψ on a real molecular volume, and the molecule-only rows — one call, asked by the mode, the operator, the scale and a restore alike */
    function modeSync() {
      const A = (c) => availability(c, app), p = A('wave.space.p');
      modeMute(ui.spaceSeg, 'p', p);
      if (!p.on && app.state.space === 'p') { app.state.space = 'x'; ui.spaceSeg.set('x'); schedule(TIER.REBUILD); }
      modeMute(ui.viewSeg, 'imag', A('wave.view.imag'));
      { const b = ui.styleSeg.button('esp'), hide = A('wave.style.esp').hide; if (b && b.hidden !== hide) { b.hidden = hide; if (app.state.tl) app.state.tl.editor.paint(); } }   // 032 O1: ESP the one MOLECULES-only style; W3: STYLE's bands moved, an EVENT clip drawn for the other count shows ⚠ now
      const esp = A('wave.esp').hide; for (const k of ['atomSizeK', 'stickK', 'espBareSw', 'probeK', 'espRangeK', 'espSurfSeg', 'espLiveSw']) ui[k].root.hidden = esp;
      if (ui.sliceCut) ui.sliceCut.row.hidden = esp;   // 038 F3: CLIP's CUT BALLS · CUT STICKS, MOLECULES' as SIZE · RADIUS
      if (ui.espBarRow) ui.espBarRow.hidden = A('info.espBar').hide;   // 018 B10: INFORMATIONAL's ESP BAR · SIDE · PAD   // an emptied row collapses (skin.css .wave-row:not(:has(…)))
    }
    ui.availSync = modeSync;
    function styleSync() {
      const st = mat.style | 0, esp = st === STYLE.esp, surf = mat.espSurf || 'iso';
      if (!Number.isFinite(mat.stickR)) ui.stickK.set(stickROf(mat));   // 032 O1: an untouched RADIUS reads 0, or ESP's own sticks
      const styleName = (ui.styleSeg.button(drawStyle(st)) || {}).textContent || 'this STYLE';
      for (const [k, on] of Object.entries(STYLE_READS)) { const styleOff = !on.includes(st);
        mute(ui[k], styleOff || (esp && ((k === 'probeK' && surf === 'iso') || ((k === 'isoK' || k === 'softK') && surf !== 'iso'))), styleOff ? 'off in ' + styleName : 'off with ' + surf.toUpperCase()); }
      modeSync(); ui.sliceCut?.sync();   // 038 F7: CLIP's CUT switches follow the drawn kinds
      const sig = !esp && molEsp(); bar.hidden = !(esp || sig) || !IP.get('espBar'); bar.dataset.kind = sig ? 'view' : 'style';   // 039 X3: STYLE ESP's values, or VIEW ESP's two colours
      if (!bar.hidden) {
        const R = Number.isFinite(mat.espRange) ? mat.espRange : ESP_RANGE, h = R * (Math.sqrt(21) - 1) / 20; paintBar();
        [R, h, 0, -h, -R].forEach((v, i) => { barNums[i].textContent = v === 0 ? '0' : sig ? '' : (v > 0 ? '+' : '−') + auN(v); });
        barSeat(); if (!barTimer) barTimer = setInterval(() => { if (bar.hidden) { clearInterval(barTimer); barTimer = 0; } else { barSeat(); paintBar(); } }, 500);   // the poll also catches a routed HUE and LW.setInvert
      }
    }
    /* a restore: the knobs from `mat` (an absent key is the default and leaves `mat`), then the rows and the bar */
    ui.styleSync = (pm) => {
      if (pm) { const q = { ...pm }; liftAtomStyle(q); for (const k of ['atomSize', 'stickR', 'probe', 'espRange', 'espSurf', 'espLive', 'espBare']) if (!(k in q)) delete mat[k]; }   // 032 O1: the keys a lifted BALLS / STICKS gained stay
      delete mat.espPal;   // iteration 015 W2: USE PALETTE is gone — PALETTE ON paints the map — so an older file's key leaves on every road in
      ui.atomSizeK.set(atomSizeOf(mat)); ui.stickK.set(stickROf(mat)); ui.probeK.set(Number.isFinite(mat.probe) ? mat.probe : PROBE_R);
      ui.espRangeK.set(Number.isFinite(mat.espRange) ? mat.espRange : ESP_RANGE); ui.espSurfSeg.set(mat.espSurf || 'iso'); ui.espLiveSw.set(!!mat.espLive); ui.espBareSw.set(!!mat.espBare);
      styleSync();
    };
    { const set0 = ui.styleSeg.set; ui.styleSeg.set = (v) => { set0(v); styleSync(); }; }   // LW.setStyle, a restore and a lane set mat.style first
    styleSync();   // the first paint: the boot's style shows only its own controls
    el('div', 'note', gd).innerHTML = '<b>Draw style.</b> KNEE bends how a ray’s opacity saturates: 0.6 is the plain exponential, higher a soft shoulder that lets dense cores show through (the default 3 keeps a dense core slightly see-through), lower a hard knee. ISO sets the SOLID, SHELL, SIGNED and SHELL ± surface and the octave BANDS are anchored on; GRAIN is how many DUST grains there are. Under MOLECULES, SIZE &gt; 0 draws the atoms and RADIUS &gt; 0 the bonds inside any style. ESP spans ±RANGE through a signed log, and beyond it the colour holds; LIVE solves φ again while the density moves, at most once a second — off, once per molecule, basis and VIEW.';   // iteration 008 W: DITHER left for SETTINGS › QUALITY · iteration 008 G: GRAIN joined DUST, KNEE moved to the ray

    const gs = group(wClip.body, 'observer only');
    const r3 = el('div', 'row fit', gs);   // 022 F2: ON · CLIP | SLAB · POS · THICK, one fit row
    /* wave 106: these two keep their handles for the same reason POS and THICK now do — an undo has to
       be able to MOVE a control, and a control nothing holds cannot be moved. */
    /* iteration 008 W (Josh: "Rename 'Volume' in the clip window to 'Full' or 'OFF/ON' with a light indicator"): VOLUME | CLIP | SLAB is an ON
       switch with its lamp (off = the full volume) and the kind CLIP | SLAB beside it, shown while on; the kind is remembered across an off.
       `mat.slice.mode` keeps 0 · 1 · 2, and `ui.sliceModeSeg` keeps the seg's get / set ('off' · 'clip' · 'slab') for restore and undo. */
    const SLICE_MODE = { off: 0, clip: 1, slab: 2 }; let sliceKind = 'clip';
    /* iteration 012 R3 (Josh 10-20: "Have On, Clip, Slab and the two knobs on the same row … Don't let Clip and Slab disappear when clip window is off"):
       CLIP | SLAB stays shown while off (dimmed, the remembered kind lit), and a press on either turns CLIP on with that kind */
    const sliceShow = (v) => { if (v !== 'off') sliceKind = v; clipSw.set(v !== 'off'); kindSeg.set(sliceKind); kindSeg.root.classList.toggle('clip-kind-off', v === 'off'); };
    const clipSw = sw({ label: 'ON', value: false, cls: 'clip-on', title: 'Cut by the plane (CLIP) or keep a slab (SLAB)',
      onChange: (on) => { const v = on ? sliceKind : 'off'; sliceShow(v); mat.slice.mode = SLICE_MODE[v]; schedule(TIER.PRESENT); } });
    const kindSeg = seg({ aria: 'clip kind', value: 'clip', options: [{ id: 'clip', label: 'CLIP', title: 'draw the half of the volume beyond the plane' }, { id: 'slab', label: 'SLAB', title: 'draw a slab THICK wide about the plane' }],
      onChange: (v) => { sliceShow(v); mat.slice.mode = SLICE_MODE[v]; schedule(TIER.PRESENT); } });
    ui.sliceModeSeg = { root: clipSw.root, kind: kindSeg, get: () => (clipSw.get() ? sliceKind : 'off'), set: sliceShow };
    r3.appendChild(clipSw.root); r3.appendChild(kindSeg.root); sliceShow('off');
    ui.sliceAxisSeg = seg({ aria: 'slice axis', value: 'z', options: [{ id: 'x', label: 'X' }, { id: 'y', label: 'Y' }, { id: 'z', label: 'Z' }], onChange: (v) => { mat.slice.axis = { x: 0, y: 1, z: 2 }[v]; delete mat.slice.normal; schedule(TIER.PRESENT); } });
    r3.appendChild(ui.sliceAxisSeg.root);
    const sliceNormals = [[1,0,0],[0,1,0],[0,0,1]];
    /* 037 H4 · THE CLIP'S FRAME (Josh: "'Lock' or 'Unlock' the clip to be separate from the camera"): CAMERA — the plane rides with the eye (its
       normal read in the eye's right · up · toward, field.js eyeTurn) — or OBJECT — fixed to the object, as before.  `mat.slice.frame` is
       'camera' or absent, written only by a hand, so NEW, a link and every older file open as OBJECT.  A press keeps the plane where it
       stands now (the normal re-read in the other frame through the same basis the field reads), so only what follows the press differs */
    const sliceN = () => mat.slice.normal || sliceNormals[mat.slice.axis | 0] || sliceNormals[2];
    ui.sliceFrameSeg = seg({ aria: 'clip frame', cls: 'clip-frame', value: 'object', options: [
      { id: 'camera', label: 'CAMERA', title: 'CAMERA · the plane rides with the eye' },
      { id: 'object', label: 'OBJECT', title: 'OBJECT · the plane stays with the object' }],
      onChange: (v) => { const was = mat.slice.frame === 'camera'; if ((v === 'camera') === was) return;
        const B = cameraBasis(obs), n = sliceN(), E = [B.right, B.up, B.dir];
        mat.slice.normal = was ? [0, 1, 2].map((i) => n[0] * E[0][i] + n[1] * E[1][i] + n[2] * E[2][i]) : E.map((a) => a[0] * n[0] + a[1] * n[1] + a[2] * n[2]);
        if (v === 'camera') mat.slice.frame = 'camera'; else delete mat.slice.frame; schedule(TIER.PRESENT); } });
    const planeRow = el('div', 'clip-plane', gs);   // 037 H4: the plane's picture and its frame side by side (a fifth cell in r3 wrapped THICK to a second line)
    /* 037 H5 · THE CLIP'S SPHERE (Josh: "Update 'Clip's XYZ sphere thing with Camera's XYZ thingy"): the camera's sphere taking a plane (MIR
       1.5.7-alpha.7) in place of the plane-model canvas — the normal as its tip, the plane as its film, no letters; under CAMERA the normal is
       the eye's own and the sphere draws it as the eye sees it (`view`), so the picture never lies about where the cut is.  rack.js paints it
       each frame CLIP shows; paint() redraws only on a change */
    const mini = directionSphere({ aria: 'Clip plane: drag to turn it; Home resets', plane: { normal: sliceN, pos: () => mat.slice.pos, view: () => mat.slice.frame === 'camera',
      set: (n) => { mat.slice.normal = n; schedule(TIER.PRESENT); } }, home: () => { mat.slice.normal = [0, 0, 1]; schedule(TIER.PRESENT); } });
    hint(mini.root, 'PLANE · drag to turn it; double-tap or Home resets'); planeRow.append(mini.root, ui.sliceFrameSeg.root);
    ui.sliceMini = mini;
    /* 038 F3 · THE CLIP'S TOGGLE (Josh: "include a toggle to include or not include the balls and/or sticks so that it only cuts the waves"): CUT BALLS ·
       CUT STICKS under the plane, lit = cut (as always); off writes `mat.slice.balls` / `mat.slice.sticks` = false, a hand's only, so NEW, a link and every
       older file open cut.  The row is MOLECULES' (hidden under hydrogen, as WAVE's SIZE · RADIUS: modeSync); a restore sets it (persist.js).  038 F7: a
       kind the look does not draw (SIZE or RADIUS at 0, ESP's map alone; ESP draws no balls) greys its switch in the kit's muted look, the reason first */
    const cutRow = el('div', 'row tight fit clip-cut', gs);
    const cutSw = (k, o) => sw({ ...o, value: true, onChange: (on) => { if (on) delete mat.slice[k]; else mat.slice[k] = false; schedule(TIER.PRESENT); } });
    ui.sliceCut = { row: cutRow, balls: cutSw('balls', { label: 'CUT BALLS', title: 'Cut the balls too; off, the balls stand whole' }),
      sticks: cutSw('sticks', { label: 'CUT STICKS', title: 'Cut the sticks too; off, the sticks stand whole' }),
      sync() { const C = ui.sliceCut, esp = (mat.style | 0) === STYLE.esp, bare = esp && !!mat.espBare;
        C.balls.set(mat.slice.balls !== false); C.sticks.set(mat.slice.sticks !== false);
        mute(C.balls, esp || !(atomSizeOf(mat) > 0), esp ? 'ESP draws no balls' : 'SIZE is 0: no balls drawn');
        mute(C.sticks, bare || !(stickROf(mat) > 0), bare ? 'MAP ONLY: no sticks drawn' : 'RADIUS is 0: no sticks drawn'); } };
    cutRow.append(ui.sliceCut.balls.root, ui.sliceCut.sticks.root); cutRow.hidden = availability('wave.esp', app).hide; ui.sliceCut.sync();
    ui.sliceAxisSeg.root.hidden = true;
    /* WAVE 106 · THESE TWO KEEP THEIR HANDLES NOW, and that is what makes them modulatable.  Both
       were built inline — `knob({...}).root` appended straight into the row — so the objects went
       out of scope the instant they were made and nothing could ever read or move them again.  A MIR
       target needs a `knob:` accessor to become a DROP target (registration alone only puts it in the
       picker), and `setKnob` needs the handle to move the needle when a macro drives it.
         `modHand` in front of each setter is the law every registered knob obeys (see ISO/GRAIN/KNEE):
       on a modulated parameter the hand's turn is a change to the BASE, routed through the registry,
       not a write straight to the instrument — otherwise `applyAll` stomps it on the next frame. */
    ui.slicePosK = knob({ label: 'POS', min: -1, max: 1, value: 0, fmt: (v) => v.toFixed(2), onInput: (v) => { if (modHand('material.slice.pos', v)) return; mat.slice.pos = v; schedule(TIER.PRESENT); } });
    r3.appendChild(ui.slicePosK.root);
    ui.sliceThickK = knob({ label: 'THICK', min: 0.01, max: 0.4, value: 0.03, log: true, fmt: (v) => v.toFixed(3), onInput: (v) => { if (modHand('material.slice.thick', v)) return; mat.slice.thick = v; schedule(TIER.PRESENT); } });
    r3.appendChild(ui.sliceThickK.root);
    /* 0.5.0 C1 · RAMP: the phase palette's editor is MIR's createRampPanel (panels/ramp.js — paletteview.js made generic, which leaves):
       the strip IS the phase circle (−π … +π, wrapping), its seam read in OKLab, the ring, the stops as handles, the presets in λWAVES'
       grouped order; the table is palette.js toLUT bit for bit.  PALETTE (on/off, the `palette` key) stays the app's switch, and the
       stops ride λWAVES' own project (`project: false`); `palette` keeps the editor's old API for serialize/restore, the link and LW. */
    const gp = group(wPal.body, 'COLOUR');
    const palOn = (v, keepView) => { mat.paletteOn = v; applyAccent(); if (v && !keepView) { mat.view = VIEW.phase; ui.viewSeg.set('phase'); } styleSync(); schedule(TIER.PRESENT); };   // keepView: a restore's own VIEW stands (016 P6 made a palette ON at an undo common enough to show it)
    const palSay = (t) => { if (app.state.stageText) app.state.stageText.say('style', t); };   // iteration 007: a hand's PALETTE on, off or preset (INFORMATIONAL › STYLE · PALETTE); a restore, a link or an undo say nothing
    const palSw = sw({ label: 'PALETTE', value: false, onChange: (v) => { palOn(v); palSay('PALETTE · ' + (v ? 'ON' : 'OFF')); } });
    const rowOn = el('div', 'row tight fit palette-enable', gp); rowOn.appendChild(palSw.root).dataset.keyAction = 'palette';
    const ang = (u) => ((2 * u - 1) * Math.PI).toFixed(3) + ' rad';   // the ONE function that prints a stop's angle (the reader, the float, the stops' aria-valuetext)
    /* iteration 013 S2 (Josh: "Remove the text that says 'the built in' for HSV and 'Re/Im Legible'"): the kit's words lose their parenthetical
       where the app shows them (the stepper's name, the list's rows, the toast) — HSV WHEEL, BIPOLAR; the kit's PRESETS are untouched */
    const palLabel = (P) => { const s = P.label.replace(/\s*\([^)]*\)$/, ''); return s.charAt(0).toUpperCase() + s.slice(1); };   // iteration 014 D4: 'sea' → 'Sea'
    let palId = PAL_DEF, palStops = PALETTE_BY_ID.get(PAL_DEF).stops, palQuiet = true;
    function palSorted() { return palStops.map((q) => ({ at: ((q.at % 1) + 1) % 1, rgb: q.rgb })).sort((x, y) => x.at - y.at); }   // palette.js normalize's order: ESP's span and bar (W2)   // quiet while the panel is built and while the app (a restore, a link, LW) loads the ramp
    /* iteration 015 P3 · SAVE A PALETTE (Josh: "fit in a floppy disk icon to save presets … at the very top, it will say 'User' (but don't show it if
       the user didn't save any yet)"): the reader's palettes are a PREFERENCE record (`lambdawaves.q0.palettes`, lab/user-presets.js — S4's store) of
       `{ name, data: { stops } }`; the kit's stepper lists USER · theirs · PRESETS · the kit's while one exists, and the plain list otherwise
       (createRampPanel's setPresets re-feeds it on every change).  A reader's palette is a `user:<name>` row: picking it loads its stops, but `palId`
       — the name a link and the settings carry — stays the last BUILT palette, so a reader's name never leaves the device (the stops travel as custom). */
    const PAL_BUILT = PRESET_GROUPS.flatMap((g) => g.items).map((P) => ({ ...P, label: palLabel(P) })), PU = 'user:', palUsers = createUserPresets('lambdawaves.q0.palettes');
    const palUserRows = () => palUsers.list().filter((u) => u.data && Array.isArray(u.data.stops) && u.data.stops.length >= 2).map((u) => ({ id: PU + u.name, label: u.name, stops: u.data.stops }));
    const palPresets = () => { const U = palUserRows(); return U.length ? [{ id: '#user', label: 'USER', coming: true }, ...U, { id: '#built', label: 'PRESETS', coming: true }, ...PAL_BUILT] : PAL_BUILT; };
    let palShown = palId;
    /* iteration 016 P6: the hand's window — set in the capture phase of a press or a key on the preset stepper or its open list (palPick), cleared a task
       later, so the kit's pick that the same event makes is known as a hand's; the history's own ramp restore and every app road pass outside it */
    let palHand = false; const palHandOn = (e) => { if (e.type === 'keydown' && (e.ctrlKey || e.metaKey || e.altKey || !/^(Arrow|Enter$| $|Home$|End$)/.test(e.key))) return;   // a chord (Ctrl+Z's undo) is no pick
      palHand = true; setTimeout(() => { palHand = false; }, 0); };
    const palHandWatch = (node) => { for (const t of ['pointerdown', 'pointerup', 'click', 'keydown']) node.addEventListener(t, palHandOn, true); };
    const rp = createRampPanel({ parent: gp, cyclic: true, project: false, presets: palPresets(),
      labels: { ticks: [], seam: 'SEAM at ±π', seamWarn: 'a visible seam at arg ψ = ±π', at: 'ARG ψ', fmt: ang },
      ramp: { get: () => ({ stops: palStops, preset: palId }), set: (s, o) => { palStops = s; const user = !!o.preset && o.preset.startsWith(PU);
        if (o.preset && o.preset !== palShown && !palQuiet && !o.live) { palSay('PALETTE · ' + (user ? o.preset.slice(PU.length) : palLabel(PALETTE_BY_ID.get(o.preset) || { label: o.preset })));
          if (palHand && !palSw.get()) { palSw.set(true); palOn(true); } }   // iteration 016 P6 (Josh: "picking a palette turns PALETTE on"): a HAND's pick only (palHand, below) — a restore, a link, LW and an undo never turn it on
        if (o.preset) { palShown = o.preset; if (!user) palId = o.preset; } },
        lut: (lut) => { palLut = lut; lutN++; const ps = palSorted(); if (field.ok) field.setPalette(lut, [ps[0].at, ps[ps.length - 1].at]); if (bar && !bar.hidden) styleSync(); applyAccent({ wheelStops: palStops }); schedule(TIER.PRESENT); } } }), rv = rp.view;   // the kit's accent takes stops: toLUT(palStops) is this lut bit for bit
    palQuiet = false;
    /* 0.5.3 M12 · PALETTE, SHORTER: the kit's rows re-seated from outside (MIR briefs filed): RESET beside PALETTE ON, INVERT right of ROTATE as the kit's half disk,
       and the selected stop's angle shown twice from showArg — a reader under ROTATE (CSS hides the knob's "turn") and a float over the stop (radians; degrees on hover).
       It watches the ARG ψ field (hidden) because that field is repainted on every select, edit and app pull, which `ramp.set` alone does not see. */
    const verbs = rv.root.querySelector('.mir-ramp-verbs'), argRo = readout({ label: 'STOP ANGLE' }), argFloat = el('i', 'pal-float', rv.strip);
    /* iteration 001 (Josh): RESET is a glyph.  Iteration 012 R3 (Josh 10-20: "move the Invert and color & delete controls to the bottom and move
       the 'reload' and 'Reverse' to the top … and vice versa"; "Make 'Add' a plus sign icon"): the top row is PALETTE · RELOAD (the kit's RESET,
       "reload the chosen preset") · REVERSE; the bottom row was ADD (the plus icon) · INVERT · the selected stop's swatch and × · ROTATE, and is ADD · ROTATE · … · INVERT since 016 P1 */
    const resetEl = rv.root.querySelector('.mir-ramp-reset'), [addEl, revEl] = verbs.querySelectorAll(':scope > .trig'), rotEl = verbs.querySelector(':scope > .k');
    chip(resetEl, 'reload', 'RELOAD'); rowOn.append(resetEl, revEl);   // 038 K2 (Josh: "reset (can be a reload icon; palette needs to update this as well)"): ↺, as LIGHTING's RESET
    revEl.classList.add('pal-rev'); chip(revEl, 'reverse'); revEl.setAttribute('aria-label', 'REVERSE'); revEl.title = 'REVERSE · run the ramp backwards';   // iteration 015 P2: the word is the hint
    rotEl.appendChild(argRo.root); argFloat.setAttribute('aria-hidden', 'true');
    ui.invertSw = sw({ label: 'INVERT', glyph: 'invertColors', cls: 'pal-invert', title: 'Invert field colour without changing ψ', onChange: (v) => { mat.invert = v; paintBar(); saveSettings(); schedule(TIER.PRESENT); } });
    addEl.after(rotEl, rv.root.querySelector('.mir-ramp-sel'), ui.invertSw.root);   // iteration 016 P1 (Josh: "swap INVERT and ROTATE"): ADD · ROTATE · the stop's swatch and × · INVERT
    addEl.classList.add('pal-add'); chip(addEl, 'plus'); addEl.setAttribute('aria-label', 'ADD — a stop opposite the selected one');
    /* iteration 012 R4 (Josh 10-20: "the palette window's preset picker ends up being too transparent, make it similar to the main menu and make the
       vertical gaps waayyy smaller … show the palette as a color strip aligned to the right side of the dropdown menu"): the kit's list pane, as it
       opens, wears the Picker's surface (`.lw-menu`, skin.css) and short rows, each with its palette's strip at the right; a pane opened upward keeps
       its foot where the kit placed it */
    const palPick = () => { const p = [...document.querySelectorAll('body > .mir-pick')].pop(); if (!p || p.classList.contains('lw-menu')) return;
      const r0 = p.getBoundingClientRect(); p.classList.add('lw-menu', 'pal-pick'); palHandWatch(p);
      const mine = new Map(palUserRows().map((u) => [u.id, u]));
      for (const b of p.querySelectorAll('.mir-pick-i')) { const P = PALETTE_BY_ID.get(b.dataset.id) || mine.get(b.dataset.id); if (!P) continue; const st = [...P.stops].sort((a, c) => a.at - c.at);
        el('span', 'pal-name', b).append(...[...b.childNodes].filter((n) => n.nodeType === 3));   // iteration 015 P1: the name its own flex item, the strip a column
        if (mine.has(b.dataset.id)) {   // P3: a reader's row carries its × between the name and the strip, so the strips stay one column
          const name = b.dataset.id.slice(PU.length), x = el('span', 'sp-prex', b, '×'); x.setAttribute('role', 'button'); x.title = 'remove ' + name; x.setAttribute('aria-label', 'remove ' + name);
          x.addEventListener('mousedown', (e) => e.preventDefault());
          x.addEventListener('click', (e) => { e.stopPropagation(); e.preventDefault(); if (palShown === PU + name) palShown = palId; palUsers.remove(name); b.remove();
            if (!p.querySelector('.mir-pick-i[data-id^="' + PU + '"]')) for (const h of p.querySelectorAll('.mir-pick-i[data-id^="#"]')) h.remove(); }); }
        el('i', 'pal-strip', b).style.background = 'linear-gradient(to right in oklab, ' + [...st, { at: 1, rgb: st[0].rgb }].map((q) => rgbToHex(q.rgb) + ' ' + (q.at * 100).toFixed(1) + '%').join(', ') + ')'; }
      const r1 = p.getBoundingClientRect(); if (p.dataset.dir === 'up') p.style.top = Math.max(8, r0.bottom - r1.height) + 'px';
      if (r1.right > innerWidth - 8) p.style.left = Math.max(8, innerWidth - 8 - r1.width) + 'px'; };
    /* P3 · the bare save glyph in a 26-px seat after the stepper (S4's `.sp-presave`); a press asks the name in the stepper's own seat — Enter keeps the
       current stops under it, Escape or a press elsewhere lets it go — and the list is re-fed with the reader's row shown */
    palUsers.watch(() => rp.setPresets(palPresets(), palShown));
    { const top = rv.root.querySelector('.mir-ramp-presets'), nm = top.querySelector('.mir-ramp-step .mir-step-name'), save = chip(el('button', 'sp-presave', top), 'saveInto'); save.type = 'button';
      save.setAttribute('aria-label', 'SAVE PALETTE'); save.title = 'SAVE · these stops as your own palette (kept on this device)';
      save.addEventListener('click', () => {
        if (top.querySelector('.sp-prename')) return;
        const f = el('input', 'sp-prename', null); f.type = 'text'; f.maxLength = 40; f.setAttribute('aria-label', 'palette name');
        f.value = 'My ' + (nm.textContent || 'palette').trim(); nm.parentElement.insertBefore(f, nm); nm.hidden = true;
        let done = false; const end = (keep, key) => { if (done) return; done = true; let n = f.value.trim(); f.remove(); nm.hidden = false;
          if (keep && n) { n = uniqueName(n, palUsers.list().map((x) => x.name)); palShown = PU + n; palUsers.add(n, { stops: rv.stops().map((s) => ({ at: s.at, rgb: mat.invert ? s.rgb.map((v) => 1 - v) : s.rgb.slice() })) }); }   /* 018 B6: INVERT on bakes the colours seen (1 − rgb); the switch stays */ if (key) nm.focus(); };
        f.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter') { e.preventDefault(); end(true, true); } else if (e.key === 'Escape') { e.preventDefault(); end(false, true); } });
        f.addEventListener('blur', () => end(false)); f.focus(); f.select();
      }); }
    palHandWatch(rv.root.querySelector('.mir-ramp-step'));
    { const n = rv.root.querySelector('.mir-ramp-step .mir-step-name'); if (n) { n.addEventListener('click', palPick); n.addEventListener('keydown', () => queueMicrotask(palPick)); } }
    const showArg = () => { const s = rv.stops()[rv.selected()]; if (!s) return; argRo.set(argFloat.textContent = ang(s.at)); argRo.root.title = argFloat.title = ((2 * s.at - 1) * 180).toFixed(1) + '°'; argFloat.style.setProperty('--at', s.at); };
    new MutationObserver(showArg).observe(gp.querySelector('.mir-ramp-at'), { childList: true, characterData: true, subtree: true }); showArg();
    el('div', 'note', gp).innerHTML = '<b>Phase palette.</b> The strip runs from arg ψ = −π to +π and wraps at the seam. Tap the strip to add a stop, drag one to move it, drag it off the strip to remove it. OKLab blending keeps transitions perceptually even.';
    app.state.palette = { get stops() { return rv.stops(); }, get selected() { return rv.selected(); }, get on() { return palSw.get(); }, get id() { return palId; },
      get groups() { return PRESET_GROUPS.map((g) => ({ points: g.points, items: g.items.map((p) => p.id) })); },
      setOn(v, keepView) { palSw.set(!!v); palOn(!!v, !!keepView); }, select: (id) => { palQuiet = true; try { return rv.preset(id); } finally { palQuiet = false; } },
      /** the file's own stops under its name (the preset is kept when the file names none, so RESET still reloads it); `selected` is the stop the hand had */
      load(s, selected = 0, id) { palQuiet = true; try { rv.load(s, PALETTE_BY_ID.get(id) ? id : palId); } finally { palQuiet = false; } const h = rv.handle(Math.max(0, Math.min(rv.stops().length - 1, Math.trunc(selected) || 0))); if (h) h.dispatchEvent(new FocusEvent('focus')); } };
    /* 0.5.0 C1 · THE CAMERA PANEL: MIR's createCameraPanel over A8's port, its rows built into this card now — HOME and the port's
       PAN HOME, CONTROL, the direction sphere (YAW · PITCH), the PAN pad (X · Y), ZOOM · FOV and the HAND (DRAG · FRICTION · FLING ·
       AUTO-ROTATE · SPIN).  No project part and no history: the pose rides λWAVES' own project and is no edit; the feel is a
       PREFERENCE, so a hand on it saves the settings (coalesced).  `mod` is the modulation port WITHOUT `add`: the panel registers no
       target — the saved observer.* routes stay the defs' below, whose knob accessors are these dials (camKnobs) — and a hand on a
       routed dial writes its base (modHand), as everywhere. */
    const gc = group(wCam.body, 'CAMERA'), FEEL = new Set(['friction', 'drag', 'fling']); let feelSave = 0;
    const camPanel = createCameraPanel({ mode: '3d', modPrefix: 'observer', project: false, mod, panWrap: 'plane',   // 038 K3 (Josh: "allow the XY thing to do the pacman tunnel effect"): MIR 1.5.7-alpha.13 — the pivot leaves one edge of the frame and comes in at the other
      port: { ...cameraPort, set(id, v) { cameraPort.set(id, v); if (FEEL.has(id)) { clearTimeout(feelSave); feelSave = setTimeout(saveSettings, 250); } },
        turn(dy, dp) { cameraPort.turn(dy, dp); const s = camView.sphere; s.yaw.set(cameraPort.get('yaw')); s.pitch.set(cameraPort.get('pitch')); } } });   // 0.5.3 M5: the kit's port.turn road never sets the sphere's arcs and its sync skips a sphere mid-drag, so the rings' arrow froze until a later notice (and each step turned from the stale arrow): it follows the hand here, per move (MIR-BRIEF-sphere.md)
    camPanel.spec.build(gc, null);
    const camView = camPanel.view(); camView.homeBtn.root.dataset.keyAction = 'camReset';
    app.state.camKnobs = Object.fromEntries(camView.targets().map((t) => [t.id, t.widget]));
    /* 0.5.3 M6 · LOCK, the classic camera (a PREFERENCE, `camLock`): the pan held at the centre and every zoom from it; the PAN pad rests while it holds */
    ui.camLockSw = sw({ label: 'LOCK', value: !!cameraPort.get('lock'), title: 'LOCK: pan and zoom at centre', onChange: (v) => { cameraPort.set('lock', v); saveSettings(); } });
    let lockShown = !!cameraPort.get('lock'); camView.pad.widget.setDisabled(lockShown);   // 037 H3: the LOCK is on from the boot, so the pad rests from its first paint
    cameraPort.subscribe(() => { const on = cameraPort.get('lock'); if (on !== lockShown) { lockShown = on; ui.camLockSw.set(on); camView.pad.widget.setDisabled(on); } });   // every road (the switch, the settings, LW) is a notice
    /* iteration 001 (Josh): CAMERA, SHORTER — the group's CAMERA word goes (the window says it), LOCK joins HOME · PAN HOME, and the PAN pad,
       the scales and the HAND fold behind (SET Δρ REF left at iteration 008) CONTROL's chevron (lab/fold.js): HOME, CONTROL, the sphere, ZOOM · FOV stay out */
    { const R = gc.querySelector('.mir-camera'), q = (c) => R.querySelector(':scope > ' + c), more = el('div', 'cam-more', R);
      gc.querySelector(':scope > .grp-lbl')?.remove();
      for (const c of ['.cam-pan', '.cam-scales', '.cam-hand']) { const n = q(c); if (n) more.appendChild(n); }
      /* iteration 018 B3 (Josh: "Move the 'auto-rotate' toggle to the same row as 'flip' … a bugged second 'flip' toggle underneath FOV"): ONE FLIP, the
         kit's (the port answers `flip`, iteration 014 C2's parity, a session's switch, never saved), and AUTO-ROTATE leave their rows for the verbs:
         PAN HOME · HOME · LOCK · FLIP · AUTO-ROTATE */
      const kitRoot = (id) => { const e = camView.controls.find((c) => c.vids[0] === id); return e && e.c.root; };
      /* 020 S3 (Josh: "Make two rows if needed for that super crammed top row"): PAN HOME · HOME on the kit's row, LOCK · FLIP · AUTO-ROTATE on a second
         one under it (also .cam-verbs, so skin.css and a reader of the verbs see both) */
      const v0 = q('.cam-verbs'), v = v0 ? el('div', 'cam-row cam-verbs cam-switches') : more; if (v0) v0.after(v);
      for (const n of [ui.camLockSw.root, kitRoot('flip'), kitRoot('autoRotate')]) if (n) v.appendChild(n); fold(q('.cam-mode') || R, more, { what: 'pan and hand' });
      /* 037 L4 (Josh: "the button in Camera window can summon the Lighting window aside from the finder"): LIGHTING — the sun and its word — at the
         foot of the extended body opens the LIGHTING card directly below CAMERA (light-window.js summonLight; from the FINDER it opens as any card) */
      el('div', 'cam-row cam-light row fit', more).appendChild(trig({ label: 'LIGHTING', glyph: 'sun', cls: 'cam-light-open', title: 'LIGHTING · open the light below CAMERA', onFire: () => summonLight(app, wCam.root) }).root);
      for (const r of R.querySelectorAll('.cam-verbs, .cam-handrow')) r.classList.add('row', 'fit'); }   // 022 F2: the two verb rows (020 S3) and the hand's dials are fit rows; the sphere's column and the PAN pad are not
    /* iteration 012 R3 (Josh 10-20: "Remove text that says 'control' and 'direction' in camera … Increase the size of the 3D thingy while moving Zoom
       and FOV under 'YAW' and 'PITCH' … Rename 'Hand' to 'Controls'"): the kit's two labels leave its DOM, ZOOM · FOV join the sphere's knob column
       under YAW · PITCH (the view row empties and goes), and skin.css draws the sphere bigger; the panel's own file is untouched */
    { const R = gc.querySelector('.mir-camera'), side = R.querySelector('.mir-camsphere-side'), view = R.querySelector(':scope > .cam-view');
      R.querySelector('.cam-mode .k-lbl')?.remove(); R.querySelector('.mir-camsphere > .k-lbl')?.remove();
      if (side && view) { side.append(...view.children); view.remove(); }
      /* 041 S5 · THE CAMERA WINDOW (Josh: "In the expanded camera window, remove text that says 'controls' and 'pan'. Also clicking on the XY pan
         thing re-activates pan and unlocks it"): the two words leave the kit's DOM (012 R3's road), and a press on the PAN pad's row while the LOCK
         holds releases it — the port's notice wakes the pad and the switch, and the choice is saved as the switch's own press is */
      R.querySelector('.cam-hand .cam-title')?.remove(); R.querySelector('.cam-pan .mir-xy > .k-lbl')?.remove();
      R.querySelector('.cam-pan')?.addEventListener('pointerdown', () => { if (cameraPort.get('lock')) { cameraPort.set('lock', false); saveSettings(); } }, true); }
    el('div', 'note', gc).innerHTML = '<b>Camera.</b> Drag the stage or the sphere to turn the view; Shift gives finer motion. Alt(+Shift)+Drag, two fingers or the PAN pad slide the picture 1:1 (Shift does not make the pan finer); the molecule stays the pivot. Double-click, double-tap or HOME restores the camera. LOCK is the classic camera: the pan stays at the centre and every zoom is from the centre.';
    createLight(app);   // 037 L1: the LIGHTING card (first run closed; in the FINDER; `window.light.*` with every registered card)
  }
  return { wObs, wPal, wCam, wClip, createDrawClipPaletteCamera };
}
