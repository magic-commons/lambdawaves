/* lab/windows/material.js — WAVE (SPACE, OBSERVABLE, DRAW), CLIP, PALETTE · INVERT and CAMERA (0.5.2 R2c; moved verbatim out of lab/rack.js boot()) at TWO
 * seats around SETTINGS: createMaterial(app) makes the four cards and WAVE's head; boot() calls createDrawClipPaletteCamera() where DRAW stood. */
import { TIER } from '../rack.js';
import { el, knob, sw, seg, trig, group, readout, chip } from '../mir/kit.js'; import { fold } from '../fold.js'; import { VIEW, STYLE } from '../field.js'; import { planeModel } from '../native-ui.js';
import { createRampPanel } from '../mir/panels/ramp.js'; import { createCameraPanel } from '../mir/panels/camera.js'; import { PRESET_BY_ID as PALETTE_BY_ID, PRESET_GROUPS } from '../mir/palette.js';
export function createMaterial(app) {
  const { ui, device, mat, PAL_DEF } = app, { schedule } = app.loop, { cameraPort } = app.host, { saveSettings } = app.sh, { mod, modHand, applyAccent, field, setReference } = app.ctl;
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
    ui.viewSeg = seg({ label: 'OBSERVABLE (colour is semantic)', value: 'phase', options: [
      { id: 'density', label: '<m>ρ=|ψ|²</m>', title: 'Probability density; palette θ = 0 when enabled, original blue when off' }, { id: 'phase', label: '<m>arg ψ</m>', title: 'phase as hue, density as opacity' },
      { id: 'real', label: '<m>Re ψ</m>', title: 'signed, diverging: palette ±π/2 or original orange/blue' }, { id: 'imag', label: '<m>Im ψ</m>' }, { id: 'diff', label: '<m>Δρ</m>', title: 'ρ(t) − ρ_ref: palette −π/2 gain and +π/2 loss, or original yellow/blue' }, { id: 'reim', label: '<m>Re+Im</m>', title: 'Overlay real and imaginary parts in one volume' }],
      onChange: (v) => { mat.view = VIEW[v]; schedule(TIER.PRESENT); if (app.state.stageText) app.state.stageText.pop(ui.viewSeg.button(v).textContent); } });
    r1.appendChild(ui.viewSeg.root).dataset.keyAction = 'view';
    const r2 = el('div', 'row tight', gSpace);
    ui.expK = knob({ label: 'EXPOSURE', min: 0.08, max: 12, value: 1, log: true, fmt: (v) => v.toFixed(2), onInput: (v) => { if (modHand('material.exposure', v)) return; mat.exposure = v; schedule(TIER.PRESENT); } }); r2.appendChild(ui.expK.root);
    ui.softK = knob({ label: 'SOFT', min: 0.3, max: 2.2, value: 0.7, fmt: (v) => 'γ' + v.toFixed(2), onInput: (v) => { if (modHand('material.softness', v)) return; mat.softness = v; schedule(TIER.PRESENT); } }); r2.appendChild(ui.softK.root);
    ui.hueK = knob({ label: 'HUE', min: 0, max: 1, value: 0, wrap: true, fmt: (v) => (v * 360).toFixed(0) + '°', onInput: (v) => { if (modHand('material.hue', v)) return; mat.hueShift = v; applyAccent(); schedule(TIER.PRESENT); } }); r2.appendChild(ui.hueK.root);
  function createDrawClipPaletteCamera() {   // the second seat: WAVE's DRAW · CLIP · PALETTE · INVERT · CAMERA
    const gd = group(gDraw, 'the transfer has a bounded ceiling');            // WAVE 56: DRAW STYLE (window id `style`) merged into WAVE (board #59); this block is the DRAW section of the WAVE window
    const rd = el('div', 'row tight', gd);
    ui.styleSeg = seg({ label: 'STYLE', value: 'cloud', options: [
      { id: 'cloud', label: 'CLOUD', title: 'the emission/absorption integral' },
      { id: 'solid', label: 'SOLID', title: 'Render a lit density shell' },
      { id: 'grain', label: 'GRAIN', title: 'Render a sparse particle field' },
      { id: 'signed', label: 'SIGNED', title: 'Render signed lobes and nodal surfaces' },
      { id:'dust',label:'DUST',title:'World-locked fine particles; GRAIN controls their count' },
      { id:'glass',label:'SHELL',title:'Render a translucent density shell' },
      { id:'additive',label:'ADD',title:'Additive emission through the field' },
      { id: 'bands', label: 'BANDS', title: 'Draw amplitude level bands; GRAIN sets their count' }],
      onChange: (v) => { mat.style = STYLE[v]; schedule(TIER.PRESENT); } });
    rd.appendChild(ui.styleSeg.root).dataset.keyAction = 'style';
    /* 2026-09-10 (Josh): ISO, GRAIN and KNEE sit directly under EXPOSURE, SOFT and HUE — one six-knob
       material row above STYLE — instead of a second row below the style seg. */
    ui.isoK = knob({ label: 'ISO', min: 0.002, max: 0.9, value: 0.06, log: true, fmt: (v) => v.toFixed(3), onInput: (v) => { if (modHand('material.iso', v)) return; mat.iso = v; schedule(TIER.PRESENT); } }); ui.hueK.root.parentElement.appendChild(ui.isoK.root);
    ui.grainK = knob({ label: 'GRAIN', min: 0.02, max: 1, value: 0.35, log: true, fmt: (v) => v.toFixed(2), onInput: (v) => { if (modHand('material.grain', v)) return; mat.grain = v; schedule(TIER.PRESENT); } }); ui.hueK.root.parentElement.appendChild(ui.grainK.root);
    ui.kneeK = knob({ label: 'KNEE', min: 0.02, max: 8, value: 0.6, log: true, fmt: (v) => v.toFixed(2), onInput: (v) => { if (modHand('material.knee', v)) return; mat.knee = v; schedule(TIER.PRESENT); } }); ui.hueK.root.parentElement.appendChild(ui.kneeK.root);
    const rdd = el('div', 'row tight', gd);
    ui.ditherSeg = seg({ label: 'DITHER', value: 'off', options: [
      { id: 'off', label: 'OFF', title: 'the colour goes to the 8-bit swapchain as it is' },
      { id: 'ordered', label: 'ORDERED 8×8', title: 'Apply ordered dithering to reduce 8-bit colour bands' }],
      onChange: (v) => { mat.dither = v === 'off' ? 0 : (ui.ditherK ? ui.ditherK.get() : 1); if (ui.ditherK) ui.ditherK.setDisabled(v === 'off'); schedule(TIER.PRESENT); } });
    rdd.appendChild(ui.ditherSeg.root);
    ui.ditherK = knob({ label: 'STRENGTH', min: 0.25, max: 2, value: 1, fmt: (v) => '±' + (v / 2).toFixed(2) + ' LSB', onInput: (v) => { if (ui.ditherSeg.get() !== 'off') { mat.dither = v; schedule(TIER.PRESENT); } } });
    ui.ditherK.root.title = 'Dither strength in 8-bit output levels; 1 is ±½ level';
    ui.ditherK.setDisabled(true);
    rdd.appendChild(ui.ditherK.root);
    el('div', 'note', gd).innerHTML = '<b>Draw style.</b> KNEE limits opacity growth. ISO sets the solid or shell threshold; GRAIN controls particle density or band count. Ordered dithering reduces colour steps; strength 1 is ±½ output level.';

    const gs = group(wClip.body, 'observer only');
    const r3 = el('div', 'row', gs);
    /* wave 106: these two keep their handles for the same reason POS and THICK now do — an undo has to
       be able to MOVE a control, and a control nothing holds cannot be moved. */
    ui.sliceModeSeg = seg({ aria: 'slice mode', value: 'off', options: [{ id: 'off', label: 'VOLUME' }, { id: 'clip', label: 'CLIP' }, { id: 'slab', label: 'SLAB' }], onChange: (v) => { mat.slice.mode = { off: 0, clip: 1, slab: 2 }[v]; schedule(TIER.PRESENT); } });
    r3.appendChild(ui.sliceModeSeg.root);
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
    const palOn = (v) => { mat.paletteOn = v; applyAccent(); if (v) { mat.view = VIEW.phase; ui.viewSeg.set('phase'); } schedule(TIER.PRESENT); };
    const palSw = sw({ label: 'PALETTE', value: false, onChange: palOn });
    const rowOn = el('div', 'row tight palette-enable', gp); rowOn.appendChild(palSw.root).dataset.keyAction = 'palette';
    const ang = (u) => ((2 * u - 1) * Math.PI).toFixed(3) + ' rad';   // the ONE function that prints a stop's angle (the reader, the float, the stops' aria-valuetext)
    let palId = PAL_DEF, palStops = PALETTE_BY_ID.get(PAL_DEF).stops;
    const rv = createRampPanel({ parent: gp, cyclic: true, project: false, presets: PRESET_GROUPS.flatMap((g) => g.items),
      labels: { ticks: [], seam: 'SEAM at ±π', seamWarn: 'a visible seam at arg ψ = ±π', at: 'ARG ψ', fmt: ang },
      ramp: { get: () => ({ stops: palStops, preset: palId }), set: (s, o) => { palStops = s; if (o.preset) palId = o.preset; },
        lut: (lut) => { if (field.ok) field.setPalette(lut); applyAccent({ wheelStops: palStops }); schedule(TIER.PRESENT); } } }).view;   // the kit's accent takes stops: toLUT(palStops) is this lut bit for bit
    /* 0.5.3 M12 · PALETTE, SHORTER: the kit's rows re-seated from outside (MIR briefs filed): RESET beside PALETTE ON, INVERT right of ROTATE as the kit's half disk,
       and the selected stop's angle shown twice from showArg — a reader under ROTATE (CSS hides the knob's "turn") and a float over the stop (radians; degrees on hover).
       It watches the ARG ψ field (hidden) because that field is repainted on every select, edit and app pull, which `ramp.set` alone does not see. */
    const verbs = rv.root.querySelector('.mir-ramp-verbs'), argRo = readout({ label: 'STOP ANGLE' }), argFloat = el('i', 'pal-float', rv.strip);
    rowOn.appendChild(rv.root.querySelector('.mir-ramp-reset'));
    /* iteration 001 (Josh): RESET is a glyph and the selected stop's swatch and × join this row — one row fewer */
    chip(rowOn.lastElementChild, 'undo', 'RESET'); rowOn.appendChild(rv.root.querySelector('.mir-ramp-sel')); verbs.querySelector('.k').appendChild(argRo.root); argFloat.setAttribute('aria-hidden', 'true');
    ui.invertSw = sw({ label: 'INVERT', glyph: 'invertColors', cls: 'pal-invert', title: 'Invert field colour without changing ψ', onChange: (v) => { mat.invert = v; saveSettings(); schedule(TIER.PRESENT); } });
    verbs.appendChild(ui.invertSw.root);
    const showArg = () => { const s = rv.stops()[rv.selected()]; if (!s) return; argRo.set(argFloat.textContent = ang(s.at)); argRo.root.title = argFloat.title = ((2 * s.at - 1) * 180).toFixed(1) + '°'; argFloat.style.setProperty('--at', s.at); };
    new MutationObserver(showArg).observe(gp.querySelector('.mir-ramp-at'), { childList: true, characterData: true, subtree: true }); showArg();
    el('div', 'note', gp).innerHTML = '<b>Phase palette.</b> The strip runs from arg ψ = −π to +π and wraps at the seam. Tap the strip to add a stop, drag one to move it, drag it off the strip to remove it. OKLab blending keeps transitions perceptually even.';
    app.state.palette = { get stops() { return rv.stops(); }, get selected() { return rv.selected(); }, get on() { return palSw.get(); }, get id() { return palId; },
      get groups() { return PRESET_GROUPS.map((g) => ({ points: g.points, items: g.items.map((p) => p.id) })); },
      setOn(v) { palSw.set(!!v); palOn(!!v); }, select: (id) => rv.preset(id),
      /** the file's own stops under its name (the preset is kept when the file names none, so RESET still reloads it); `selected` is the stop the hand had */
      load(s, selected = 0, id) { rv.load(s, PALETTE_BY_ID.get(id) ? id : palId); const h = rv.handle(Math.max(0, Math.min(rv.stops().length - 1, Math.trunc(selected) || 0))); if (h) h.dispatchEvent(new FocusEvent('focus')); } };
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
    const rRef = el('div', 'row tight', gc); rRef.appendChild(trig({ label: 'SET Δρ REF', title: 'Use the current density as the difference reference', onFire: () => { setReference(); ui.viewSeg.set('diff'); mat.view = VIEW.diff; } }).root);
    /* 0.5.3 M6 · LOCK, the classic camera (a PREFERENCE, `camLock`): the pan held at the centre and every zoom from it; the PAN pad rests while it holds */
    ui.camLockSw = sw({ label: 'LOCK', value: false, title: 'LOCK — the classic camera: the pan stays at the centre and every zoom is from the centre (CONTROL, the turn, ZOOM and FOV stay live)', onChange: (v) => { cameraPort.set('lock', v); saveSettings(); } });
    rRef.appendChild(ui.camLockSw.root); let lockShown = false;
    cameraPort.subscribe(() => { const on = cameraPort.get('lock'); if (on !== lockShown) { lockShown = on; ui.camLockSw.set(on); camView.pad.widget.setDisabled(on); } });   // every road (the switch, the settings, LW) is a notice
    /* iteration 001 (Josh): CAMERA, SHORTER — the group's CAMERA word goes (the window says it), LOCK joins HOME · PAN HOME, and the PAN pad,
       the scales, the HAND and SET Δρ REF fold behind CONTROL's chevron (lab/fold.js): HOME, CONTROL, the sphere, ZOOM · FOV stay out */
    { const R = gc.querySelector('.mir-camera'), q = (c) => R.querySelector(':scope > ' + c), more = el('div', 'cam-more', R);
      gc.querySelector(':scope > .grp-lbl')?.remove();
      for (const c of ['.cam-pan', '.cam-scales', '.cam-hand']) { const n = q(c); if (n) more.appendChild(n); }
      more.appendChild(rRef); const v = q('.cam-verbs'); if (v) { v.appendChild(ui.camLockSw.root); v.dataset.n = String(v.children.length); } fold(q('.cam-mode') || R, more, { what: 'pan, hand and the Δρ reference' }); }
    el('div', 'note', gc).innerHTML = '<b>Camera.</b> Drag the stage or the sphere to turn the view; Shift gives finer motion. Alt(+Shift)+Drag, two fingers or the PAN pad slide the picture 1:1 (Shift does not make the pan finer); the molecule stays the pivot. Double-click, double-tap or HOME restores the camera.';
  }
  return { wObs, wPal, wCam, wClip, createDrawClipPaletteCamera };
}
