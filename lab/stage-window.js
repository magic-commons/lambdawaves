/* lab/stage-window.js — STAGE (037 T1; Josh, BRIEF.md STAGE FX: "New MIR rack window called 'Stage' where the stage can have different effects …
 * for now, we can populate it with 'Settings > Display' > Frame options, Axes options and the stage color intensity, stage color picker and such").
 * A rack card, id `stage`: CLOSED on a first run (no first-run list names it), in + and WINDOW and the `window.stage.*` acts as every card is.
 * THE CONTROLS MOVE, THE ROADS DO NOT: FRAME · AXES · AXIS COLOUR (FIELD_CHROME, this browser's), the stage's colour · FOLLOW THEME and STAGE
 * (`presentation.ui.stage`, `material.stage`) and GAMMA (`presentation.mat.gamma`, `material.gamma`) are the very controls settings-card.js makes,
 * seated here; SETTINGS › DISPLAY keeps an EDIT STAGE trigger.  The body is short and never scrolls: FRAME, then AXES · AXIS COLOUR, then the
 * colour, then STAGE · GAMMA, then the STAGE FX under thin rules.  In lab/, not windows/: rack-deps admits only rack.js's planned modules there.
 * 040 S2 · PULSE REDUX (Josh: "Redo the whole thing but keep the machinery. Have a 360 knob go from center to the edge and back to the glow of the
 * center; find a way to make it cyclic. That way I can modulate it … change 'amount' to 'intensity' … redo the rate knob into a band width knob"):
 * the wash is a BAND — INTENSITY (`pulse`) · POSITION (0° the centre's glow, 180° the edge, 360° the centre again; it wraps) · BAND WIDTH (`rate`,
 * A LABEL MOVES, A KEY STAYS: 0 a thin ring … 2 the whole stage).  STROBE (a flash on the beat: INTENSITY · RATE in beats · DUTY) and BEAM (a
 * wedge of light from the centre: INTENSITY · ANGLE, cyclic · WIDTH) are its festival kin.  Everything is home-off: `mat.stage` is absent at the
 * homes (the shader's old arithmetic), read by the field (lab/field.js stageWash, p16.w · p17.xyz · p18.xyz); PROJECT `presentation.stage` through
 * stageOfProject / loadStage (shell/persist.js); targets `stage.*` (shell/modulation.js).  A file from before 040 ({ pulse, shape, rate }: SHAPE
 * CENTRE | EDGE, RATE in Hz) opens as POSITION 0° or 180° at the full BAND WIDTH — the standing wash it drew. */
import { el, knob, label, sw } from './mir/kit.js'; import { fold } from './fold.js';
import { TIER } from './tier.js'; import { strobeBeats } from './field.js';
const HOME = Object.freeze({ pulse: 0, position: 0, rate: 2, strobe: 0, strobeRate: 1, strobeDuty: 0.5, beam: 0, beamAngle: 0, beamWidth: 30 });
const RANGE = { pulse: [0, 1], rate: [0, 2], strobe: [0, 1], strobeRate: [0.25, 4], strobeDuty: [0.05, 0.95], beam: [0, 1], beamWidth: [5, 180] }, KEYS = Object.keys(HOME);
/** `mat.stage` from a whole record: clamped (an angle wrapped), and deleted at the homes (NEW, the demos and every file before 037 carry none) */
function apply(mat, s) {
  const r = {};
  for (const k of KEYS) { const v = +s[k], R = RANGE[k]; r[k] = !Number.isFinite(v) ? HOME[k] : R ? Math.min(R[1], Math.max(R[0], v)) : ((v % 360) + 360) % 360; }
  if (KEYS.every((k) => r[k] === HOME[k])) delete mat.stage; else mat.stage = r;
}
let paint = null;   // the window's repaint of the FX rows, seated at its build
/** the project's record of STAGE's FX (persist.js serialize, both scopes), or null at the homes */
export function stageOfProject(mat) { return mat.stage ? { ...mat.stage } : null; }
/** an open, a link, an undo: the file's record (absent: the homes) into mat, the rows repainted.  A record without POSITION is from before 040 */
export function loadStage(mat, rec) {
  const s = rec && typeof rec === 'object' ? rec : {};
  apply(mat, Number.isFinite(+s.position) ? { ...HOME, ...s } : { ...HOME, pulse: s.pulse, position: s.shape === 'edge' ? 180 : 0 });
  if (paint) paint();
}
const pct = (v) => Math.round(v * 100) + '%', deg = (v) => Math.round(v) + '°';
const FX = [   // group · key · the knob's label · its hint · the knob's shape · the target's label (its id is `stage.<key>`, lower-case)
  ['PULSE', 'pulse', 'INTENSITY', 'How strongly the band washes the stage', { fmt: pct }, 'PULSE'],
  ['PULSE', 'position', 'POSITION', 'Where the band stands: 0° centre, 180° edge', { max: 360, wrap: true, fmt: deg }, 'PULSE POSITION'],
  ['PULSE', 'rate', 'BAND WIDTH', 'How wide the band is: a thin ring to the whole stage', { max: 2, fmt: (v) => pct(v / 2) }, 'PULSE BAND WIDTH'],
  ['STROBE', 'strobe', 'INTENSITY', 'How strongly the stage flashes on the beat', { fmt: pct }, 'STROBE'],
  ['STROBE', 'strobeRate', 'RATE', 'Beats between flashes', { min: 0.25, max: 4, log: true, fmt: (v) => { const b = strobeBeats(v); return (b < 1 ? '1/' + 1 / b : b) + ' BEAT'; } }, 'STROBE RATE'],
  ['STROBE', 'strobeDuty', 'DUTY', 'How much of each flash the stage stays lit', { min: 0.05, max: 0.95, fmt: pct }, 'STROBE DUTY'],
  ['BEAM', 'beam', 'INTENSITY', 'How strongly the beam lights the stage', { fmt: pct }, 'BEAM'],
  ['BEAM', 'beamAngle', 'ANGLE', 'Where the beam points: 0° up, turning clockwise', { max: 360, wrap: true, fmt: deg }, 'BEAM ANGLE'],
  ['BEAM', 'beamWidth', 'WIDTH', 'How wide the beam opens', { min: 5, max: 180, fmt: deg }, 'BEAM WIDTH']];
/** the `stage` root's targets (shell/modulation.js): one a knob, the ranges the knobs' own.  The three INTENSITY dials reach the picture's
 *  luminance, so each declares its `flash` step (037 T4: a light stage's × 0.7 moves the picture 10 % at about a third of the range); POSITION and
 *  ANGLE wrap, and a wrap is outside the guard as HUE is (mod-port.js) */
export const stageTargets = (ui, mat, setKnob) => FX.map(([, k, , title, o, label]) => ({ id: 'stage.' + k.toLowerCase(), label, map: o.wrap ? 'wrap' : o.log ? 'log' : 'linear',
  min: o.min || 0, max: o.max || 1, def: HOME[k], group: 'stage', ...(RANGE[k] && RANGE[k][1] === 1 ? { flash: 0.3 } : {}), knob: () => ui.stageFx[k], hint: 'STAGE › ' + title,
  get: () => (mat.stage ? mat.stage[k] : HOME[k]), set: (v) => { ui.setPulse({ [k]: v }); setKnob(ui.stageFx[k], v); } }));
export function createStageWindow(app) {
  const { ui, device, mat } = app, { schedule } = app.loop, { modHand } = app.ctl;
  const w = device({ id: 'stage', eyebrow: 'STAGE', status: '' });
  w.root.classList.add('closed', 'lw-stage-card'); app.host.rack.appendChild(w.root);
  const row = (cls, parent, ...cs) => { const r = el('div', 'row tight ' + cls, parent); for (const c of cs) r.appendChild(c.root); return r; };
  row('stage-frame', w.body, ui.frameSw);                  // native-ui.js turns FRAME and AXIS into their honest segs where they stand
  /* 041 S3 · THE FRAME CAN STAY (Josh: "have an option in stage where the either box or frame remains in UI full Hide mode (not hide/mouse-reveal)"):
     a PREFERENCE (`frameStay`, FIELD_CHROME, absent = off) read by shell/keys.js toggleUI — under H the frame stays drawn, the axes go */
  ui.frameStaySw = sw({ label: 'KEEP IN HIDE', value: !!mat.frameStay, title: 'Keep the frame drawn while the interface is hidden (H)',
    onChange: (v) => { if (v) mat.frameStay = true; else delete mat.frameStay; app.sh.saveSettings(); } });
  /* 041 S4 · THE FRAME'S BRIGHTNESS: a PREFERENCE (`frameGain`, FIELD_CHROME, absent = 100 %, today's look — THE LOCK's), 25 % … 400 %, read by
     field.js writeLines: the box, the axes, the compass, the lattice and the dots; within 2 % of home it IS home */
  let gainSave = 0;
  ui.frameGainK = knob({ label: 'BRIGHTNESS', title: 'How bright the frame, axes, dots and lattice draw', min: 0.25, max: 4, log: true, value: mat.frameGain || 1, fmt: pct,
    onInput: (v) => { if (Math.abs(v - 1) < 0.02) delete mat.frameGain; else mat.frameGain = v; schedule(TIER.PRESENT); clearTimeout(gainSave); gainSave = setTimeout(app.sh.saveSettings, 250); } });
  row('fit stage-frame-more', w.body, ui.frameGainK, ui.frameStaySw);
  row('stage-axes', w.body, ui.axisSw, ui.axisInkSeg);
  row('stage-ground', w.body, ui.stageSeat);
  row('fit stage-knobs', w.body, ui.stageK, ui.gammaK);
  /* THE FX: a hand writes `mat.stage` and asks for a present; a modulator's set takes the same road (ui.setPulse, ui.stageFx[key]) */
  const go = (p) => { apply(mat, { ...HOME, ...mat.stage, ...p }); schedule(TIER.PRESENT); };
  ui.setPulse = go; ui.stageFx = {};
  const grp = {}, rows = {};
  for (const [g, key, name, title, o] of FX) {
    const k = ui.stageFx[key] = knob({ label: name, title, min: 0, max: 1, value: HOME[key], ...o, onInput: (v) => { if (!modHand('stage.' + key.toLowerCase(), v)) go({ [key]: v }); } });
    if (!grp[g]) { grp[g] = el('div', 'grp', w.body); label(el('div', 'grp-lbl', el('div', 'stage-fx-head', grp[g])), g); rows[g] = row('fit stage-pulse', grp[g]); }
    rows[g].appendChild(k.root);
  }
  fold(grp.PULSE.firstChild, [grp.STROBE, grp.BEAM], { what: 'the strobe and the beam', key: 'stage-festival' });   // the body stays short: the festival lights behind PULSE's chevron
  paint = () => { const s = { ...HOME, ...mat.stage }, setKnob = app.ctl.setKnob; for (const k of KEYS) setKnob(ui.stageFx[k], s[k]); };
  return w;
}
