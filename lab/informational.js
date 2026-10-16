/* lab/informational.js — INFORMATIONAL (0.5.3 M9; Josh, PLAN §11 answer 3: "the two rows are correct but make them their own window called
 * 'Informational'"): what the stage writes, in its own rack card — STAGE FORMULA + SIZE (the formula, a preset's fade, the capture's caption) and
 * ATOM LABELS + SIZE (each MOLECULES nucleus's symbol).  Both pairs are PREFERENCE (`molFormula` / `molFormulaSize`, `atomLabels` / `atomLabelsSize`,
 * docs/STATE-SCOPES.md), saved and applied by shell/settings.js.  The kit's card in the native skin; CLOSED on a first run (no first-run list names it);
 * in + and WINDOW as every rack card is; opened UNDER SETTINGS.  0.5.4 P4 seats its STATUS line here.  In lab/, not windows/: rack-deps admits only rack.js's planned modules there. */
import { TIER } from './rack.js';
import { el, knob, sw, readout } from './mir/kit.js'; import { statusOf } from './status.js'; import { getHamiltonian } from './hamiltonian.js';
export function createInformational(app) {
  const { ui, device } = app, { schedule } = app.loop, save = () => app.sh.saveSettings(), T = () => app.state.stageText, pct = (v) => Math.round(v * 100) + '%';
  const w = device({ id: 'informational', eyebrow: 'INFORMATIONAL', title: 'what the stage writes', status: '' });
  w.root.classList.add('native-clean', 'closed'); app.host.rack.appendChild(w.root);
  ui.molFormulaSw = sw({ label: 'STAGE FORMULA', value: true, title: 'Write what is playing on the stage — the MOLECULES formula or the SPECTRUM states, a preset\'s name as it is pressed — and caption a picture or a recording with it and its STATUS word; off, an export carries neither',
    onChange: (v) => { document.body.classList.toggle('no-mol-formula', !v); if (T()) T().setOn(v); schedule(TIER.PRESENT); save(); } });
  ui.molFormulaK = knob({ label: 'SIZE', min: 0.5, max: 3, value: 1, fmt: pct, title: 'The STAGE FORMULA\'s size: 100% is the notebook\'s — the formula its title (34 px), an announcement its heading',
    onInput: (v) => { app.state.molFormulaScale = v; if (T()) T().setScale(v); schedule(TIER.PRESENT); }, onChange: save });
  ui.atomLabelsSw = sw({ label: 'ATOM LABELS', value: true, title: 'Mark each MOLECULES nucleus with its element symbol, inverting whatever is beneath it',
    onChange: (v) => { if (T()) T().setLabels(v); schedule(TIER.PRESENT); save(); } });
  ui.atomLabelsK = knob({ label: 'SIZE', min: 0.5, max: 3, value: 1, fmt: pct, title: 'The ATOM LABELS\' size: 100% is the notebook\'s body (14 px)',
    onInput: (v) => { app.state.atomLabelsScale = v; if (T()) T().setLabelScale(v); schedule(TIER.PRESENT); }, onChange: save });
  el('div', 'row tight', w.body).append(ui.molFormulaSw.root, ui.molFormulaK.root); el('div', 'row tight', w.body).append(ui.atomLabelsSw.root, ui.atomLabelsK.root);
  /* 0.5.4 P4 · STATUS (PLAN R8, Q12): lab/status.js' line for what owns the field — MOLECULES' kept one (per VIEW; its molecule-level line beneath), else the
     operator's — written by app.hooks.status on a landing, a VIEW or FLOW change, an owner or operator change, NEVER in a frame.  A tap: the MODEL sheet, its words. */
  const st = readout({ label: 'STATUS', cls: 'wide lw-status', value: '—' }); let was; el('div', 'row tight', w.body).append(st.root);
  st.root.title = 'What EXACT, NUMERICAL and UNCHECKED mean: the MODEL sheet'; st.root.addEventListener('click', () => { if (app.hooks.sheet) app.hooks.sheet(); });
  app.hooks.status = () => { const c = app.state.chem, k = c && c.on ? c.said : app.reg.P && app.reg.P.stark ? 'stark' : getHamiltonian().id, m = k === 'hydrogen' && getHamiltonian().mass, key = m ? k + m : k, s = key === was ? undefined : typeof k === 'string' ? statusOf({ owner: k, label: m && 'HYDROGEN · ' + m }) : k;
    if (s !== undefined) { was = key; st.set(s ? s.line : '—', s && s.word === 'UNCHECKED' ? 'warn' : ''); st.setSub(s && typeof k !== 'string' ? s.head : ''); } };
  app.hooks.status();
  /* UNDER SETTINGS: the kit opens a window at the top of its rack (and raise() puts it there after); once that press is done, the seat after
     SETTINGS — by the kit's own move(), so the rack's motion and its save follow — while SETTINGS stands open in a rack and this card is not floating */
  w.root.addEventListener('devopen', () => queueMicrotask(() => {
    const s = ui.set.root, rk = s.parentElement, list = rk ? [...rk.children].filter((c) => c.classList.contains('dev') && c !== w.root && !c.hidden && !c.classList.contains('closed')) : [];
    if (app.sh.rk && /^rackL?$/.test(rk && rk.id) && !s.classList.contains('closed') && !w.root.classList.contains('floating')) app.sh.rk.move('informational', { side: rk.id === 'rackL' ? 'left' : 'right', index: list.indexOf(s) + 1 });
  }));
  return w;
}
