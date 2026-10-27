/* lab/windows/material.js — WAVE (SPACE, OBSERVABLE, DRAW), CLIP, PALETTE · INVERT and CAMERA (0.5.2 R2c; moved verbatim out of lab/rack.js boot()) at TWO
 * seats around SETTINGS: createMaterial(app) makes the four cards and WAVE's head; boot() calls createDrawClipPaletteCamera() where DRAW stood. */
import { TIER } from '../rack.js';
import { el, knob, sw, seg, group, readout, chip, hint } from '../mir/kit.js'; import { fold } from '../fold.js'; import { VIEW, STYLE, drawStyle, KNEE_DEFAULT, STICK_R, PROBE_R, ESP_RANGE } from '../field.js'; import { ESP_RAMP } from '../palette-app.js'; import { planeModel } from '../native-ui.js';
import { createRampPanel } from '../mir/panels/ramp.js'; import { createUserPresets, uniqueName } from '../user-presets.js'; import { createCameraPanel } from '../mir/panels/camera.js'; import { PRESET_BY_ID as PALETTE_BY_ID, PRESET_GROUPS, rgbToHex } from '../mir/palette.js';
export function createMaterial(app) {
  const { ui, device, mat, PAL_DEF } = app, { schedule } = app.loop, { cameraPort } = app.host, { saveSettings } = app.sh, { mod, modHand, applyAccent, field } = app.ctl;
  const wObs = device({ id: 'observer', eyebrow: 'WAVE', status: '' });
  const wPal = device({ id: 'palette', eyebrow: 'PALETTE', status: '' });
  const wCam = device({ id: 'camera', eyebrow: 'CAMERA', status: '' });
  const wClip = device({ id: 'clip', eyebrow: 'CLIP', status: '' });   // 0.4.0 S3 (R-W3): CLIP, once SLICE / CLIP — the id stays
    const gSpace = group(wObs.body, 'SPACE');
    const gDraw = group(wObs.body, 'DRAW');
    {
      const r0 = el('div', 'row', gSpace);
      ui.spaceSeg = seg({ label: 'the same state, two exact pictures', value: 'x', options: [
        { id: 'x', label: 'POSITION ψ(x)', title: 'the wavefunction in space' },
        { id: 'p', label: 'MOMENTUM φ(p)', title: 'Momentum-space view of the current state' }],
        onChange: (v) => { app.state.space = v; schedule(TIER.REBUILD); } });
      r0.appendChild(ui.spaceSeg.root);
      ui.spaceNote = el('div', 'sturm-note', gSpace); ui.spaceNote.hidden = true;          // its own class: the ⓘ sweep folds every .note away, and this one must be seen
      ui.spaceNote.innerHTML = '<b>STURMIAN:</b> momentum space is not built for the scaled radials (the Podolsky–Pauling transform would need its own table) — position space only until SCALE is back on HYDROGEN.';
    }
    const r1 = el('div', 'row', gSpace);
    /* iteration 008 W (Josh: "delta p AND Re+Im … where is this different from the other viewpoints other than color?"): FOUR observables.
       Re+Im was two pictures in one volume (PHASE carries both as hue); Δρ is MOLECULES' Δ beside KICK.  A saved one maps by waveView. */
    ui.viewSeg = seg({ label: 'OBSERVABLE (colour is semantic)', value: 'phase', options: [
      { id: 'density', label: '<m>ρ=|ψ|²</m>', title: 'Probability density; palette θ = 0 when enabled, original blue when off' }, { id: 'phase', label: '<m>arg ψ</m>', title: 'phase as hue, density as opacity' },
      { id: 'real', label: '<m>Re ψ</m>', title: 'signed, diverging: palette ±π/2 or original orange/blue' }, { id: 'imag', label: '<m>Im ψ</m>' }],
      onChange: (v) => { mat.view = VIEW[v]; schedule(TIER.PRESENT); if (app.state.stageText) app.state.stageText.say('view', ui.viewSeg.button(v).textContent); } });
    r1.appendChild(ui.viewSeg.root).dataset.keyAction = 'view';
    const r2 = el('div', 'row tight', gSpace);
    ui.expK = knob({ label: 'EXPOSURE', min: 0.08, max: 12, value: 1, log: true, fmt: (v) => v.toFixed(2), onInput: (v) => { if (modHand('material.exposure', v)) return; mat.exposure = v; schedule(TIER.PRESENT); } }); r2.appendChild(ui.expK.root);
    ui.softK = knob({ label: 'SOFT', reverse: true, min: 0.3, max: 2.2, value: 0.7, fmt: (v) => 'γ' + v.toFixed(2), onInput: (v) => { if (modHand('material.softness', v)) return; mat.softness = v; schedule(TIER.PRESENT); } }); r2.appendChild(ui.softK.root);
    ui.hueK = knob({ label: 'HUE', min: 0, max: 1, value: 0, wrap: true, fmt: (v) => (v * 360).toFixed(0) + '°', onInput: (v) => { if (modHand('material.hue', v)) return; mat.hueShift = v; applyAccent(); schedule(TIER.PRESENT); } }); r2.appendChild(ui.hueK.root);
  function createDrawClipPaletteCamera() {   // the second seat: WAVE's DRAW · CLIP · PALETTE · INVERT · CAMERA
    const gd = group(gDraw, 'the transfer has a bounded ceiling');            // WAVE 56: DRAW STYLE (window id `style`) merged into WAVE (board #59); this block is the DRAW section of the WAVE window
    const rd = el('div', 'row tight', gd);
    ui.styleSeg = seg({ label: 'STYLE', value: 'cloud', options: [
      { id: 'cloud', label: 'CLOUD', title: 'the emission/absorption integral' },
      { id: 'solid', label: 'SOLID', title: 'Render a lit density shell' },
      { id: 'signed', label: 'SIGNED', title: 'Render signed lobes and nodal surfaces' },
      { id: 'dust', label: 'DUST', title: 'Grains fixed in the world, shown where the field is: GRAIN sets how many, nothing else' },
      { id:'glass',label:'SHELL',title:'Render a translucent density shell' },
      { id: 'glassSigned', label: 'SHELL ±', title: 'Render the signed lobes as a translucent shell: SHELL’s look on SIGNED’s geometry' },   // iteration 010 X7 (STYLE 8)
      { id:'additive',label:'ADD',title:'Additive emission through the field' },
      { id: 'bands', label: 'BANDS', title: 'One level surface per octave of the density, anchored at ISO' },
      { id: 'balls', label: 'BALLS', title: 'The molecule as space-filling CPK balls (van der Waals radii × SIZE), no sticks' },   // iteration 014 B1 (STYLE 9)
      { id: 'sticks', label: 'STICKS', title: 'The molecule as 3D sticks, each half in its atom’s colour (RADIUS)' },                // B2 (STYLE 10)
      { id: 'esp', label: 'ESP', title: 'THE POTENTIAL MAP: φ(r) = Σ Z/|r − R| − ∫ρ/|r − r′| painted on the density’s ISO surface, the SAS or the SES — red negative, blue positive' }],   // B3 (STYLE 11)
      onChange: (v) => { mat.style = STYLE[drawStyle(v)]; styleSync(); schedule(TIER.PRESENT); if (app.state.stageText) app.state.stageText.say('style', 'STYLE · ' + ui.styleSeg.button(v).textContent); } });   // iteration 007: INFORMATIONAL › STYLE · PALETTE
    rd.appendChild(ui.styleSeg.root).dataset.keyAction = 'style';
    /* 2026-09-10 (Josh): ISO, GRAIN and KNEE sit directly under EXPOSURE, SOFT and HUE — one six-knob
       material row above STYLE — instead of a second row below the style seg. */
    ui.isoK = knob({ label: 'ISO', reverse: true, min: 0.002, max: 0.9, value: 0.06, log: true, fmt: (v) => v.toFixed(3), onInput: (v) => { if (modHand('material.iso', v)) return; mat.iso = v; schedule(TIER.PRESENT); } }); ui.hueK.root.parentElement.appendChild(ui.isoK.root);
    ui.grainK = knob({ label: 'GRAIN', min: 0.02, max: 1, value: 0.35, log: true, fmt: (v) => v.toFixed(2), onInput: (v) => { if (modHand('material.grain', v)) return; mat.grain = v; schedule(TIER.PRESENT); } }); ui.hueK.root.parentElement.appendChild(ui.grainK.root);
    ui.kneeK = knob({ label: 'KNEE', reverse: true, min: 0.02, max: 8, value: KNEE_DEFAULT, log: true, fmt: (v) => v.toFixed(2), title: 'KNEE bends the ray’s opacity: 0.6 is the plain exponential, above it a soft shoulder (dense cores show through; the default 3 is somewhat opaque, slightly see-through), below it a hard knee (the silhouette closes sooner)', onInput: (v) => { if (modHand('material.knee', v)) return; mat.knee = v; schedule(TIER.PRESENT); } }); ui.hueK.root.parentElement.appendChild(ui.kneeK.root);
    /* iteration 014 B · THE THREE VIEWS' controls (two rows, shown while BALLS, STICKS or ESP is drawn; a control the style does not read is dimmed,
       never moved).  The keys are written into `mat` only by a hand, so a project that never touched them serialises as before. */
    const pctF = (v) => Math.round(v * 100) + '%', au = (v) => '±' + v.toFixed(3);
    ui.atomSizeK = knob({ label: 'SIZE', min: 0.2, max: 1.5, value: 1, fmt: pctF, title: 'BALLS: the van der Waals radius × SIZE (100 % is space-filling CPK)', onInput: (v) => { mat.atomSize = v; schedule(TIER.PRESENT); } });
    ui.stickK = knob({ label: 'RADIUS', min: 0.1, max: 1.2, value: STICK_R, log: true, fmt: (v) => v.toFixed(2), title: 'STICKS (and the sticks inside ESP): the stick radius in bohr', onInput: (v) => { mat.stickR = v; schedule(TIER.PRESENT); } });
    ui.probeK = knob({ label: 'PROBE', min: 0.5, max: 5, value: PROBE_R, fmt: (v) => v.toFixed(2), title: 'ESP · SAS / SES: the probe radius in bohr (2.65 = water’s 1.4 Å)', onInput: (v) => { mat.probe = v; schedule(TIER.PRESENT); } });
    ui.espRangeK = knob({ label: 'RANGE', min: 0.002, max: 5, value: ESP_RANGE, log: true, fmt: au, title: 'ESP: the colour map spans ±RANGE hartree/e through a signed log (the middle a real band, the ends only near ±RANGE); beyond it the colour holds', onInput: (v) => { mat.espRange = v; styleSync(); schedule(TIER.PRESENT); } });
    ui.espSurfSeg = seg({ aria: 'potential surface', value: 'iso', options: [
      { id: 'iso', label: 'ISO', title: 'the density’s own surface, ρ = ISO/30 a.u. (0.002 at the default ISO)' },
      { id: 'sas', label: 'SAS', title: 'the solvent-accessible surface: the van der Waals spheres grown by PROBE' },
      { id: 'ses', label: 'SES', title: 'the solvent-excluded surface: the van der Waals spheres with their crevices filled by the probe' }],
      onChange: (v) => { mat.espSurf = v; styleSync(); schedule(TIER.PRESENT); } });
    /* iteration 016 S2 · MAP ONLY (Josh: "a toggle beside RADIUS hides the sticks under ESP so the map stands alone, and nothing is drawn underneath as its
       opacity falls"): `mat.espBare`, written only by a hand (absent = off, so an older file and the edit bytes are unchanged; an older build ignores it) */
    ui.espBareSw = sw({ label: 'MAP ONLY', value: false, title: 'ESP: the map alone — no sticks inside it, and only the stage beneath it as EXPOSURE lowers its opacity', onChange: (on) => { mat.espBare = on; schedule(TIER.PRESENT); } });
    ui.espLiveSw = sw({ label: 'LIVE · SLOW', value: false, title: 'ESP: solve φ again while the density moves (RUN, a beating register), at most once a second — slow; off, φ is solved once per molecule, basis and VIEW', onChange: (on) => { mat.espLive = on; schedule(TIER.PRESENT); } });
    { const r = el('div', 'row tight', gd); for (const k of [ui.atomSizeK, ui.stickK, ui.espBareSw, ui.probeK, ui.espRangeK]) r.appendChild(k.root); const r2 = el('div', 'row tight', gd); for (const k of [ui.espSurfSeg, ui.espLiveSw]) r2.appendChild(k.root); }
    /* the map's COLOUR BAR (Josh's answer 3): vertical, beside the map at the free stage's right, five numbers — the signed log's inverse at s = ±1, ±½, 0
       (iteration 015 W3: ±RANGE, ±RANGE·(√21 − 1)/20, 0); PALETTE ON puts the palette in it from its first stop to its last, as the map reads it (W2);
       HUE turns it as it turns the map */
    const bar = el('div', 'lw-espbar', app.dom.stage); bar.hidden = true; bar.setAttribute('aria-hidden', 'true');
    const barRamp = el('i', 'lw-espbar-ramp', bar), barNums = [0, 1, 2, 3, 4].map((i) => { const n = el('span', 'lw-espbar-n', bar); n.style.top = (i * 25) + '%'; return n; });
    el('span', 'lw-espbar-u', bar).textContent = 'φ · a.u.';
    let barTimer = 0;
    const barSeat = () => { const r = app.host.rack, rr = r && !r.hidden && r.querySelector('.dev:not(.closed):not([hidden])') ? r.getBoundingClientRect() : null, sb = app.dom.stage.getBoundingClientRect();
      bar.style.right = Math.max(16, rr && rr.left > sb.left + sb.width / 2 && rr.left < sb.right ? sb.right - rr.left + 16 : 16) + 'px'; };
    /* iteration 015 W1 · THE KNOBS FOLLOW THE STYLE (Josh: "Allow the knobs to be dynamically shown"): the table is RENDER_WGSL's own reads (SOFT is the
       power w = ρ^SOFT, which SOLID · SIGNED · SHELL · SHELL ± overwrite, and ESP's soft edge under its ISO surface since 016 S1; KNEE is the transmittance
       T_q, which ADD and the atom styles skip; ISO under ESP is its ISO surface's).  Iteration 016 V1 (Josh: "the knobs a style does not read are GREYED,
       not hidden … the seats stay put"): a control the style does not read is DISABLED in the kit's own muted look (`.disabled`, --state-disabled), never
       hidden, so no seat moves; a route on a greyed knob keeps running (its window wears W8's ACCENT B dot) */
    const S_ = STYLE, VOL = [S_.cloud, S_.solid, S_.signed, S_.bands, S_.dust, S_.glass, S_.glassSigned];
    const STYLE_READS = { isoK: [S_.solid, S_.signed, S_.bands, S_.glass, S_.glassSigned, S_.esp], kneeK: VOL, softK: [S_.cloud, S_.bands, S_.dust, S_.additive, S_.esp], grainK: [S_.dust],
      atomSizeK: [S_.balls], stickK: [S_.sticks, S_.esp], espBareSw: [S_.esp], probeK: [S_.esp], espRangeK: [S_.esp], espSurfSeg: [S_.esp], espLiveSw: [S_.esp] };
    /* the kit's muted look on the three shapes: a knob's own setDisabled, a switch's button, a seg's buttons */
    const mute = (c, off) => { if (c.setDisabled) { c.setDisabled(off); return; } c.root.classList.toggle('disabled', off); c.root.setAttribute('aria-disabled', String(off));
      for (const b of c.root.matches('button') ? [c.root] : c.root.querySelectorAll('button')) b.disabled = off; };
    /* iteration 017 W2 (Josh 2026-10-26: "Grey out anything from 'Wave' that shouldn't work when switching between molecules or atoms/hydrogen"):
       styleSync greys by MODE as well as by style, one button at a time in the kit's muted look (seats stay).  Under a molecule MOMENTUM φ(p) (a set
       molecule owns the volume; the eigenmode kernel and its SPACE stand down) and Im ψ unless the volume is a complex orbital (the density, Δρ and a
       real orbital write (√ρ | ψ, 0): Im ψ draws nothing — the molecule matrix road in field.js); under hydrogen / an atom BALLS · STICKS · ESP, the molecule's
       views (the shader draws them as CLOUD there) */
    const modeMute = (s, id, off, why) => { const b = s.button(id); if (!b) return; b.disabled = off; const o = s.spec.options.find((q) => q.id === id), t = off ? why : o && o.title;
      if (t) hint(b, t); else { b.removeAttribute('title'); delete b.dataset.help; delete b.dataset.helpEn; } };   // the kit's hint hop keeps a title as data-help
    function modeSync() {
      const mol = !!(app.state.chem && app.state.chem.on);
      if (mol) modeMute(ui.spaceSeg, 'p', true, 'a molecule owns the volume: position space only while MOLECULES is on');
      else if (!(app.sturm && app.sturm.P)) modeMute(ui.spaceSeg, 'p', false);   // STURMIAN keeps its own grey (spectrum.js applySturmian)
      modeMute(ui.viewSeg, 'imag', mol && !(field && field.moleculeComplex), 'this molecular volume is real (ψ or √ρ): Im ψ is zero — the ORBITALS register draws a complex ψ');
      for (const id of ['balls', 'sticks', 'esp']) modeMute(ui.styleSeg, id, !mol, 'a molecule’s view: switch MOLECULES on');
    }
    function styleSync() {
      const st = mat.style | 0, esp = st === STYLE.esp, surf = mat.espSurf || 'iso';
      for (const [k, on] of Object.entries(STYLE_READS)) mute(ui[k], !on.includes(st) || (esp && ((k === 'probeK' && surf === 'iso') || ((k === 'isoK' || k === 'softK') && surf !== 'iso'))));
      modeSync();
      bar.hidden = !esp;
      if (esp) {
        const R = Number.isFinite(mat.espRange) ? mat.espRange : ESP_RANGE, h = R * (Math.sqrt(21) - 1) / 20, st2 = mat.paletteOn ? palSorted() : null, a = st2 && st2[0].at, w = st2 && (st2[st2.length - 1].at - a || 1);
        barRamp.style.background = st2 ? 'linear-gradient(to top in oklab, ' + st2.map((q) => rgbToHex(q.rgb) + ' ' + ((q.at - a) / w * 100).toFixed(1) + '%').join(', ') + ')' : 'linear-gradient(to top, ' + ESP_RAMP.join(', ') + ')';
        barRamp.style.filter = mat.hueShift ? `hue-rotate(${Math.round(mat.hueShift * 360)}deg)` : '';
        [R, h, 0, -h, -R].forEach((v, i) => { barNums[i].textContent = v === 0 ? '0' : (v > 0 ? '+' : '−') + Math.abs(v).toFixed(3); });
        barSeat(); if (!barTimer) barTimer = setInterval(() => { if (bar.hidden) { clearInterval(barTimer); barTimer = 0; } else barSeat(); }, 500);
      }
    }
    /* a restore: the knobs from `mat` (an absent key is the default and leaves `mat`), then the rows and the bar */
    ui.styleSync = (pm) => {
      if (pm) for (const k of ['atomSize', 'stickR', 'probe', 'espRange', 'espSurf', 'espLive', 'espBare']) if (!(k in pm)) delete mat[k];
      delete mat.espPal;   // iteration 015 W2: USE PALETTE is gone — PALETTE ON paints the map — so an older file's key leaves on every road in
      ui.atomSizeK.set(Number.isFinite(mat.atomSize) ? mat.atomSize : 1); ui.stickK.set(Number.isFinite(mat.stickR) ? mat.stickR : STICK_R); ui.probeK.set(Number.isFinite(mat.probe) ? mat.probe : PROBE_R);
      ui.espRangeK.set(Number.isFinite(mat.espRange) ? mat.espRange : ESP_RANGE); ui.espSurfSeg.set(mat.espSurf || 'iso'); ui.espLiveSw.set(!!mat.espLive); ui.espBareSw.set(!!mat.espBare);
      styleSync();
    };
    { const set0 = ui.styleSeg.set; ui.styleSeg.set = (v) => { set0(v); styleSync(); }; }   // LW.setStyle and a restore set mat.style first
    styleSync();   // the first paint: the boot's style shows only its own controls
    el('div', 'note', gd).innerHTML = '<b>Draw style.</b> KNEE bends how a ray’s opacity saturates: 0.6 is the plain exponential, higher a soft shoulder that lets dense cores show through (the default 3 keeps a dense core slightly see-through), lower a hard knee. ISO sets the SOLID, SHELL, SIGNED and SHELL ± surface and the octave BANDS are anchored on; GRAIN is how many DUST grains there are.';   // iteration 008 W: DITHER left for SETTINGS › QUALITY · iteration 008 G: GRAIN joined DUST, KNEE moved to the ray

    const gs = group(wClip.body, 'observer only');
    const r3 = el('div', 'row', gs);
    /* wave 106: these two keep their handles for the same reason POS and THICK now do — an undo has to
       be able to MOVE a control, and a control nothing holds cannot be moved. */
    /* iteration 008 W (Josh: "Rename 'Volume' in the clip window to 'Full' or 'OFF/ON' with a light indicator"): VOLUME | CLIP | SLAB is an ON
       switch with its lamp (off = the full volume) and the kind CLIP | SLAB beside it, shown while on; the kind is remembered across an off.
       `mat.slice.mode` keeps 0 · 1 · 2, and `ui.sliceModeSeg` keeps the seg's get / set ('off' · 'clip' · 'slab') for restore and undo. */
    const SLICE_MODE = { off: 0, clip: 1, slab: 2 }; let sliceKind = 'clip';
    /* iteration 012 R3 (Josh 10-20: "Have On, Clip, Slab and the two knobs on the same row … Don't let Clip and Slab disappear when clip window is off"):
       CLIP | SLAB stays shown while off (dimmed, the remembered kind lit), and a press on either turns CLIP on with that kind */
    const sliceShow = (v) => { if (v !== 'off') sliceKind = v; clipSw.set(v !== 'off'); kindSeg.set(sliceKind); kindSeg.root.classList.toggle('clip-kind-off', v === 'off'); };
    const clipSw = sw({ label: 'ON', value: false, cls: 'clip-on', title: 'CLIP on: cut the volume by the plane (CLIP) or keep a slab about it (SLAB); off draws the full volume',
      onChange: (on) => { const v = on ? sliceKind : 'off'; sliceShow(v); mat.slice.mode = SLICE_MODE[v]; schedule(TIER.PRESENT); } });
    const kindSeg = seg({ aria: 'clip kind', value: 'clip', options: [{ id: 'clip', label: 'CLIP', title: 'draw the half of the volume beyond the plane' }, { id: 'slab', label: 'SLAB', title: 'draw a slab THICK wide about the plane' }],
      onChange: (v) => { sliceShow(v); mat.slice.mode = SLICE_MODE[v]; schedule(TIER.PRESENT); } });
    ui.sliceModeSeg = { root: clipSw.root, kind: kindSeg, get: () => (clipSw.get() ? sliceKind : 'off'), set: sliceShow };
    r3.appendChild(clipSw.root); r3.appendChild(kindSeg.root); sliceShow('off');
    ui.sliceAxisSeg = seg({ aria: 'slice axis', value: 'z', options: [{ id: 'x', label: 'X' }, { id: 'y', label: 'Y' }, { id: 'z', label: 'Z' }], onChange: (v) => { mat.slice.axis = { x: 0, y: 1, z: 2 }[v]; delete mat.slice.normal; schedule(TIER.PRESENT); } });
    r3.appendChild(ui.sliceAxisSeg.root);
    const sliceNormals = [[1,0,0],[0,1,0],[0,0,1]];
    const mini = planeModel(gs, { getNormal:()=>mat.slice.normal || sliceNormals[mat.slice.axis|0] || sliceNormals[2], getPosition:()=>mat.slice.pos, onTurn:n=>{mat.slice.normal=n; schedule(TIER.PRESENT);} });
    ui.sliceMini = mini;
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
    const rowOn = el('div', 'row tight palette-enable', gp); rowOn.appendChild(palSw.root).dataset.keyAction = 'palette';
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
        lut: (lut) => { const ps = palSorted(); if (field.ok) field.setPalette(lut, [ps[0].at, ps[ps.length - 1].at]); if (bar && !bar.hidden) styleSync(); applyAccent({ wheelStops: palStops }); schedule(TIER.PRESENT); } } }), rv = rp.view;   // the kit's accent takes stops: toLUT(palStops) is this lut bit for bit
    palQuiet = false;
    /* 0.5.3 M12 · PALETTE, SHORTER: the kit's rows re-seated from outside (MIR briefs filed): RESET beside PALETTE ON, INVERT right of ROTATE as the kit's half disk,
       and the selected stop's angle shown twice from showArg — a reader under ROTATE (CSS hides the knob's "turn") and a float over the stop (radians; degrees on hover).
       It watches the ARG ψ field (hidden) because that field is repainted on every select, edit and app pull, which `ramp.set` alone does not see. */
    const verbs = rv.root.querySelector('.mir-ramp-verbs'), argRo = readout({ label: 'STOP ANGLE' }), argFloat = el('i', 'pal-float', rv.strip);
    /* iteration 001 (Josh): RESET is a glyph.  Iteration 012 R3 (Josh 10-20: "move the Invert and color & delete controls to the bottom and move
       the 'reload' and 'Reverse' to the top … and vice versa"; "Make 'Add' a plus sign icon"): the top row is PALETTE · RELOAD (the kit's RESET,
       "reload the chosen preset") · REVERSE; the bottom row was ADD (the plus icon) · INVERT · the selected stop's swatch and × · ROTATE, and is ADD · ROTATE · … · INVERT since 016 P1 */
    const resetEl = rv.root.querySelector('.mir-ramp-reset'), [addEl, revEl] = verbs.querySelectorAll(':scope > .trig'), rotEl = verbs.querySelector(':scope > .k');
    chip(resetEl, 'undo', 'RELOAD'); rowOn.append(resetEl, revEl);
    revEl.classList.add('pal-rev'); revEl.replaceChildren(el('span', 'lw-icon lw-icon-reverse')); revEl.setAttribute('aria-label', 'REVERSE'); revEl.title = 'REVERSE · run the ramp backwards';   // iteration 015 P2: the word is the hint
    rotEl.appendChild(argRo.root); argFloat.setAttribute('aria-hidden', 'true');
    ui.invertSw = sw({ label: 'INVERT', glyph: 'invertColors', cls: 'pal-invert', title: 'Invert field colour without changing ψ', onChange: (v) => { mat.invert = v; saveSettings(); schedule(TIER.PRESENT); } });
    addEl.after(rotEl, rv.root.querySelector('.mir-ramp-sel'), ui.invertSw.root);   // iteration 016 P1 (Josh: "swap INVERT and ROTATE"): ADD · ROTATE · the stop's swatch and × · INVERT
    addEl.classList.add('pal-add'); addEl.replaceChildren(el('span', 'lw-icon lw-icon-plus')); addEl.setAttribute('aria-label', 'ADD — a stop opposite the selected one');
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
    { const top = rv.root.querySelector('.mir-ramp-presets'), nm = top.querySelector('.mir-ramp-step .mir-step-name'), save = el('button', 'sp-presave', top); save.type = 'button';
      save.setAttribute('aria-label', 'SAVE PALETTE'); save.title = 'SAVE · these stops as your own palette (kept on this device)';
      save.addEventListener('click', () => {
        if (top.querySelector('.sp-prename')) return;
        const f = el('input', 'sp-prename', null); f.type = 'text'; f.maxLength = 40; f.setAttribute('aria-label', 'palette name');
        f.value = 'My ' + (nm.textContent || 'palette').trim(); nm.parentElement.insertBefore(f, nm); nm.hidden = true;
        let done = false; const end = (keep, key) => { if (done) return; done = true; let n = f.value.trim(); f.remove(); nm.hidden = false;
          if (keep && n) { n = uniqueName(n, palUsers.list().map((x) => x.name)); palShown = PU + n; palUsers.add(n, { stops: rv.stops().map((s) => ({ at: s.at, rgb: s.rgb.slice() })) }); } if (key) nm.focus(); };
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
    const gc = group(wCam.body, 'CAMERA'), FEEL = new Set(['spin', 'friction', 'drag', 'fling']); let feelSave = 0;
    const camPanel = createCameraPanel({ mode: '3d', modPrefix: 'observer', project: false, mod,
      port: { ...cameraPort, set(id, v) { cameraPort.set(id, v); if (FEEL.has(id)) { clearTimeout(feelSave); feelSave = setTimeout(saveSettings, 250); } },
        turn(dy, dp) { cameraPort.turn(dy, dp); const s = camView.sphere; s.yaw.set(cameraPort.get('yaw')); s.pitch.set(cameraPort.get('pitch')); } } });   // 0.5.3 M5: the kit's port.turn road never sets the sphere's arcs and its sync skips a sphere mid-drag, so the rings' arrow froze until a later notice (and each step turned from the stale arrow): it follows the hand here, per move (MIR-BRIEF-sphere.md)
    camPanel.spec.build(gc, null);
    const camView = camPanel.view(); camView.homeBtn.root.dataset.keyAction = 'camReset';
    app.state.camKnobs = Object.fromEntries(camView.targets().map((t) => [t.id, t.widget]));
    /* 0.5.3 M6 · LOCK, the classic camera (a PREFERENCE, `camLock`): the pan held at the centre and every zoom from it; the PAN pad rests while it holds */
    ui.camLockSw = sw({ label: 'LOCK', value: false, title: 'LOCK — the classic camera: the pan stays at the centre and every zoom is from the centre (CONTROL, the turn, ZOOM and FOV stay live)', onChange: (v) => { cameraPort.set('lock', v); saveSettings(); } });
    /* iteration 014 C2 · FLIP: the view's parity — the picture mirrored (an enantiomer, as a view); a session's switch beside LOCK, never saved */
    ui.camFlipSw = sw({ label: 'FLIP', value: false, title: 'FLIP — mirror the view: the molecule as its mirror image (its enantiomer). A view, not a new molecule; it is not saved', onChange: (v) => cameraPort.set('flip', v) });
    let lockShown = false;
    cameraPort.subscribe(() => { const on = cameraPort.get('lock'); if (on !== lockShown) { lockShown = on; ui.camLockSw.set(on); camView.pad.widget.setDisabled(on); } });   // every road (the switch, the settings, LW) is a notice
    /* iteration 001 (Josh): CAMERA, SHORTER — the group's CAMERA word goes (the window says it), LOCK joins HOME · PAN HOME, and the PAN pad,
       the scales and the HAND fold behind (SET Δρ REF left at iteration 008) CONTROL's chevron (lab/fold.js): HOME, CONTROL, the sphere, ZOOM · FOV stay out */
    { const R = gc.querySelector('.mir-camera'), q = (c) => R.querySelector(':scope > ' + c), more = el('div', 'cam-more', R);
      gc.querySelector(':scope > .grp-lbl')?.remove();
      for (const c of ['.cam-pan', '.cam-scales', '.cam-hand']) { const n = q(c); if (n) more.appendChild(n); }
      const v = q('.cam-verbs'); (v || more).appendChild(ui.camLockSw.root); (v || more).appendChild(ui.camFlipSw.root); if (v) v.dataset.n = String(v.children.length); fold(q('.cam-mode') || R, more, { what: 'pan and hand' }); }
    /* iteration 012 R3 (Josh 10-20: "Remove text that says 'control' and 'direction' in camera … Increase the size of the 3D thingy while moving Zoom
       and FOV under 'YAW' and 'PITCH' … Rename 'Hand' to 'Controls'"): the kit's two labels leave its DOM, ZOOM · FOV join the sphere's knob column
       under YAW · PITCH (the view row empties and goes), and skin.css draws the sphere bigger; the panel's own file is untouched */
    { const R = gc.querySelector('.mir-camera'), side = R.querySelector('.mir-camsphere-side'), view = R.querySelector(':scope > .cam-view');
      R.querySelector('.cam-mode .k-lbl')?.remove(); R.querySelector('.mir-camsphere > .k-lbl')?.remove();
      if (side && view) { side.append(...view.children); view.remove(); }
      const t = R.querySelector('.cam-hand .cam-title'); if (t) { t.textContent = 'CONTROLS'; t.dataset.t = 'CONTROLS'; } }
    el('div', 'note', gc).innerHTML = '<b>Camera.</b> Drag the stage or the sphere to turn the view; Shift gives finer motion. Alt(+Shift)+Drag, two fingers or the PAN pad slide the picture 1:1 (Shift does not make the pan finer); the molecule stays the pivot. Double-click, double-tap or HOME restores the camera.';
  }
  return { wObs, wPal, wCam, wClip, createDrawClipPaletteCamera };
}
