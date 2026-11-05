/* lab/stage-window.js — STAGE (037 T1; Josh, BRIEF.md STAGE FX: "New MIR rack window called 'Stage' where the stage can have different effects …
 * for now, we can populate it with 'Settings > Display' > Frame options, Axes options and the stage color intensity, stage color picker and such").
 * A rack card, id `stage`: CLOSED on a first run (no first-run list names it), in + and WINDOW and the `window.stage.*` acts as every card is.
 * THE CONTROLS MOVE, THE ROADS DO NOT: FRAME · AXES · AXIS COLOUR (FIELD_CHROME, this browser's), the stage's colour · FOLLOW THEME and STAGE
 * (`presentation.ui.stage`, `material.stage`) and GAMMA (`presentation.mat.gamma`, `material.gamma`) are the very controls settings-card.js makes,
 * seated here; SETTINGS › DISPLAY keeps an EDIT STAGE trigger.  The body is short and never scrolls: FRAME, then AXES · AXIS COLOUR, then the
 * colour, then STAGE · GAMMA, then PULSE under a thin rule.  In lab/, not windows/: rack-deps admits only rack.js's planned modules there.
 * 037 T4 · PULSE, the first STAGE FX (Josh: "'Pulse In/Out' (Like the chosen color starting from the center or from the edges"): AMOUNT · SHAPE
 * (CENTRE | EDGE) · RATE, read by the field from `mat.stage` (lab/field.js stageWash, p16.w · p17.xyz); absent at the homes (AMOUNT 0 is the
 * shader's old arithmetic), PROJECT `presentation.stage` through stageOfProject / loadStage (shell/persist.js), targets `stage.pulse` ·
 * `stage.rate` (shell/modulation.js). */
import { el, knob, seg, group } from './mir/kit.js';
import { TIER } from './tier.js';
const HOME = Object.freeze({ pulse: 0, shape: 'centre', rate: 0 });
const clamp = (v, a, b) => (Number.isFinite(v) ? Math.min(b, Math.max(a, v)) : a);
/** `mat.stage` from a whole record: clamped, and deleted at the homes (NEW, the demos and every file before 037 carry none) */
function apply(mat, s) {
  const r = { pulse: clamp(+s.pulse, 0, 1), shape: s.shape === 'edge' ? 'edge' : 'centre', rate: clamp(+s.rate, 0, 2) };
  if (!(r.pulse > 0) && !(r.rate > 0) && r.shape === 'centre') delete mat.stage; else mat.stage = r;
}
let paint = null;   // the window's repaint of PULSE's rows, seated at its build
/** the project's record of STAGE's FX (persist.js serialize, both scopes), or null at the homes */
export function stageOfProject(mat) { const s = mat.stage; return s ? { pulse: s.pulse, shape: s.shape, rate: s.rate } : null; }
/** an open, a link, an undo: the file's record (absent: the homes) into mat, the rows repainted */
export function loadStage(mat, rec) { apply(mat, { ...HOME, ...(rec && typeof rec === 'object' ? rec : {}) }); if (paint) paint(); }
export function createStageWindow(app) {
  const { ui, device, mat } = app, { schedule } = app.loop, { modHand } = app.ctl;
  const w = device({ id: 'stage', eyebrow: 'STAGE', title: 'the stage and its effects', status: '' });
  w.root.classList.add('native-clean', 'closed', 'lw-stage-card'); app.host.rack.appendChild(w.root);
  const row = (cls, parent, ...cs) => { const r = el('div', 'row tight ' + cls, parent); for (const c of cs) r.appendChild(c.root); return r; };
  row('stage-frame', w.body, ui.frameSw);                  // native-ui.js turns FRAME and AXIS into their honest segs where they stand
  row('stage-axes', w.body, ui.axisSw, ui.axisInkSeg);
  row('stage-ground', w.body, ui.stageSeat);
  row('fit stage-knobs', w.body, ui.stageK, ui.gammaK);
  /* PULSE: a hand writes `mat.stage` and asks for a present; a modulator's set takes the same road (ui.setPulse) */
  const go = (p) => { apply(mat, { ...HOME, ...mat.stage, ...p }); schedule(TIER.PRESENT); };
  ui.setPulse = go;
  ui.pulseK = knob({ label: 'AMOUNT', title: 'How strongly the stage washes', min: 0, max: 1, value: 0, fmt: (v) => Math.round(v * 100) + '%',
    onInput: (v) => { if (!modHand('stage.pulse', v)) go({ pulse: v }); } });
  ui.pulseShapeSeg = seg({ label: 'SHAPE', value: 'centre', options: [
    { id: 'centre', label: 'CENTRE', title: 'The wash grows from the centre outward' },
    { id: 'edge', label: 'EDGE', title: 'The wash grows from the edge inward' }], onChange: (v) => go({ shape: v }) });
  ui.pulseRateK = knob({ label: 'RATE', title: 'Breaths a second while playing; 0 holds', min: 0, max: 2, value: 0, fmt: (v) => (v > 0 ? v.toFixed(2) + ' Hz' : 'HOLD'),
    onInput: (v) => { if (!modHand('stage.rate', v)) go({ rate: v }); } });
  row('fit stage-pulse', group(w.body, 'PULSE'), ui.pulseK, ui.pulseShapeSeg, ui.pulseRateK);
  paint = () => { const s = { ...HOME, ...mat.stage }, setKnob = app.ctl.setKnob; setKnob(ui.pulseK, s.pulse); setKnob(ui.pulseRateK, s.rate); if (ui.pulseShapeSeg.get() !== s.shape) ui.pulseShapeSeg.set(s.shape); };
  return w;
}
