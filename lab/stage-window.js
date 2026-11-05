/* lab/stage-window.js — STAGE (037 T1; Josh, BRIEF.md STAGE FX: "New MIR rack window called 'Stage' where the stage can have different effects …
 * for now, we can populate it with 'Settings > Display' > Frame options, Axes options and the stage color intensity, stage color picker and such").
 * A rack card, id `stage`: CLOSED on a first run (no first-run list names it), in + and WINDOW and the `window.stage.*` acts as every card is.
 * THE CONTROLS MOVE, THE ROADS DO NOT: FRAME · AXES · AXIS COLOUR (FIELD_CHROME, this browser's), the stage's colour · FOLLOW THEME and STAGE
 * (`presentation.ui.stage`, `material.stage`) and GAMMA (`presentation.mat.gamma`, `material.gamma`) are the very controls settings-card.js makes,
 * seated here; SETTINGS › DISPLAY keeps an EDIT STAGE trigger.  The body is short and never scrolls: FRAME, then AXES · AXIS COLOUR, then the
 * colour, then STAGE · GAMMA.  In lab/, not windows/: rack-deps admits only rack.js's planned modules there. */
import { el } from './mir/kit.js';
export function createStageWindow(app) {
  const { ui, device } = app;
  const w = device({ id: 'stage', eyebrow: 'STAGE', title: 'the stage and its effects', status: '' });
  w.root.classList.add('native-clean', 'closed', 'lw-stage-card'); app.host.rack.appendChild(w.root);
  const row = (cls, ...cs) => { const r = el('div', 'row tight ' + cls, w.body); for (const c of cs) r.appendChild(c.root); return r; };
  row('stage-frame', ui.frameSw);                  // native-ui.js turns FRAME and AXIS into their honest segs where they stand
  row('stage-axes', ui.axisSw, ui.axisInkSeg);
  row('stage-ground', ui.stageSeat);
  row('fit stage-knobs', ui.stageK, ui.gammaK);
  return w;
}
