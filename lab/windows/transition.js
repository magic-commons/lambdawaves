/* lab/windows/transition.js — A ↔ B · TRANSITION (Rabi), SPECTRUM's block (iteration 018 C1; once the STATE card, lab/windows/state.js, 0.5.2 R2a).
 * Josh (2026-10-27): "Spectrum window should merge with the 'state' window and add it's features directly below the 140 table and above the presets
 * … Remove the text that says 'A/B'. Add a clear icon so that it clears anything stored in A or B."  The window `state` is retired; this module is
 * seated where its card was (before SPECTRUM, so `ui.ab`, `app.hooks.ab` and `ui.abSw` exist for every later seat as they did) and builds the block
 * DETACHED as `ui.abBox`, which windows/spectrum.js mounts between the 140 table and the presets row — the A/B deps live here, not in SPECTRUM
 * (the HINGE: spectrum.js is at 25).  STORE A · A · STORE B · B · CLEAR (the trash glyph: both stores emptied, a running transition stood down
 * keeping its mix), TRANSITION · RABI Ω and the readout; the words A / B are the block's `aria-label`.  `ui.ab`, `app.hooks.ab`, `state.rabi` and
 * the project's `ab` record are unchanged.  The register's CLEAR (the menubar's row) stays this module's function, and the link's note sits under
 * the block.  The lab's status sink (`app.w.wState`) is SPECTRUM's status line now (windows/spectrum.js). */
import { TIER } from '../tier.js';
import { el, knob, sw, trig, readout, group, chip } from '../mir/kit.js';
import { N6, widen } from '../hydrogen.js';
export function createTransition(app) {
  const { ui, reg, hNote, clock, sturm } = app, { schedule } = app.loop, { touchState } = app.ctl;
  /* OPTIMIZATION 2026-09-24 · N1 · THE REGISTER'S CLEAR, NAMED: the menubar's "CLEAR the register" is this one function */
  function clearRegister() { reg.clear(); app.state.refSnapshot = null; clock.seek(0, { schedule: false }); touchState(); }   // 021 R3: THE ONE SEEK
  const gab = ui.abBox = group(null, ''); gab.classList.add('sp-ab'); gab.setAttribute('aria-label', 'A / B · TRANSITION (Rabi)');
  const rab = el('div', 'row tight native-ab', gab);   // 0.5.3 M11 (R7): ONE row STORE A · A · STORE B · B, a stored slot lit by `.stored` (lab.css ::after); 018 C1: + CLEAR
  let abA = null, abB = null, abOmega = 0.05;
  const SUB = 'store two states, then TRANSITION plays A → B → A at Ω';
  const snap = () => ({ re: Float64Array.from(reg.re0), im: Float64Array.from(reg.im0) });
  const recall = (S) => { if (!S) return; if (reg.transition) { reg.clearTransition(clock.t); ui.abSw.set(false); } reg.re0.set(S.re); reg.im0.set(S.im); reg.version++; touchState(); abStatus(); };
  ui.abRo = readout({ label: '', value: '—  /  —', sub: SUB }); ui.abRo.root.querySelector('.ro-lbl').remove(); ui.abRo.root.setAttribute('aria-label', 'A / B');
  rab.appendChild(trig({ label: 'STORE A', title: 'keep the register as it is now as state A', onFire: () => { abA = snap(); abStatus(); hNote(); } }).root).dataset.keyAction = 'ab.storeA';   // 021 I1: the actions press them
  const slotA = rab.appendChild(trig({ label: 'A', cls: 'ab-slot', title: 'recall state A', onFire: () => recall(abA) }).root);
  rab.appendChild(trig({ label: 'STORE B', title: 'keep the register as it is now as state B', onFire: () => { abB = snap(); abStatus(); hNote(); } }).root).dataset.keyAction = 'ab.storeB';
  const slotB = rab.appendChild(trig({ label: 'B', cls: 'ab-slot', title: 'recall state B', onFire: () => recall(abB) }).root);
  const clr = chip(el('button', 'sp-abclear', rab), 'trash'); clr.type = 'button'; clr.title = 'CLEAR · empty A and B'; clr.setAttribute('aria-label', 'CLEAR A and B');
  clr.addEventListener('click', () => { if (reg.transition) { reg.clearTransition(clock.t); ui.abSw.set(false); } abA = abB = null; touchState(); abStatus(); });
  const rab2 = el('div', 'row tight', gab);
  ui.abSw = sw({ label: 'TRANSITION', value: false, title: 'play the Rabi mix cos(Ω(t−t₀)/2)·A(t) + sin(Ω(t−t₀)/2)·B(t)', onChange: (v) => {
    if (v && sturm.P) { ui.abSw.set(false); ui.abRo.set('off under STURMIAN', 'warn'); ui.abRo.setSub('A / B TRANSITION is a diagonal-phase feature (two exact diagonal evolutions mixed): switch SCALE back to HYDROGEN'); return; }
    if (v) { if (!abA || !abB) { ui.abSw.set(false); ui.abRo.set('store A and B first', 'warn'); return; } reg.setTransition(abA, abB, abOmega, clock.t); if (!clock.playing) { clock.play(performance.now() / 1000); schedule(TIER.EVOLVE); } }
    else if (reg.transition) reg.clearTransition(clock.t);
    touchState(); abStatus();
  } });
  rab2.appendChild(ui.abSw.root);
  ui.abOmega = knob({ label: 'RABI  Ω', min: 0.005, max: 1, value: 0.05, log: true, fmt: (v) => v.toFixed(3), onInput: (v) => { if (reg.transition) { const th = reg.mixAngle(clock.t); reg.transition.omega = v; reg.transition.t0 = clock.t - 2 * th / v; } abOmega = v; } });
  rab2.appendChild(ui.abOmega.root);
  rab2.appendChild(ui.abRo.root);
  /* THE PROJECT'S ROAD (Josh, 2026-09-10: "state transitions don't keep"): both stores, Ω and whether the transition is running —
     plain arrays in the file, typed arrays in the block.  Iteration 008 A7: a store is written 91 wide while its n = 7 part is zero. */
  const cut = (S) => { const w = S.re.subarray(N6).some(Boolean) || S.im.subarray(N6).some(Boolean) ? S.re.length : N6; return { re: Array.from(S.re.subarray(0, w)), im: Array.from(S.im.subarray(0, w)) }; };
  ui.ab = {
    get: () => ({ a: abA ? cut(abA) : null, b: abB ? cut(abB) : null, omega: abOmega, on: !!reg.transition }),
    set(o) { if (!o) return; const W = reg.re0.length, pad = (v) => Float64Array.from(widen(v, 0, W)), take = (S) => (S && Array.isArray(S.re) && (S.re.length === N6 || S.re.length === W) && Array.isArray(S.im)) ? { re: pad(S.re), im: pad(S.im) } : null;   // a 91-wide store (an older file) pads n = 7 with zeros
      abA = take(o.a); abB = take(o.b); if (Number.isFinite(o.omega)) { abOmega = Math.max(0.005, Math.min(1, o.omega)); if (ui.abOmega) ui.abOmega.set(abOmega); }
      if (reg.transition) reg.clearTransition(clock.t);
      if (o.on && abA && abB && !sturm.P) { reg.setTransition(abA, abB, abOmega, clock.t); ui.abSw.set(true); } else ui.abSw.set(false);
      abStatus(); }
  };
  function abStatus() {
    slotA.classList.toggle('stored', !!abA); slotB.classList.toggle('stored', !!abB); clr.disabled = !abA && !abB;
    const count = (S) => S ? S.re.reduce((k, v, i) => k + ((v || S.im[i]) ? 1 : 0), 0) : 0, nA = count(abA), nB = count(abB);
    let ov = 0; if (abA && abB) { let r = 0, im = 0; for (let a = 0; a < abA.re.length; a++) { r += abA.re[a] * abB.re[a] + abA.im[a] * abB.im[a]; im += abA.re[a] * abB.im[a] - abA.im[a] * abB.re[a]; } ov = Math.hypot(r, im); }
    const exact = nA === 1 && nB === 1 && ov < 1e-9;
    ui.abRo.set((abA ? nA + (nA === 1 ? ' mode' : ' modes') : '—') + '  /  ' + (abB ? nB + (nB === 1 ? ' mode' : ' modes') : '—'), reg.transition ? (exact ? 'ok' : 'warn') : '');
    ui.abRo.setSub(reg.transition ? (exact ? 'two-level Rabi drive · |⟨A|B⟩| = ' + ov.toFixed(3) : 'composite-state envelope · |⟨A|B⟩| = ' + ov.toFixed(3)) : SUB);
  }
  abStatus();
  app.hooks.ab = { get A() { return abA; }, get B() { return abB; }, storeA() { abA = snap(); abStatus(); hNote(); }, storeB() { abB = snap(); abStatus(); hNote(); }, setStores(A, B) { abA = A ? { re: Float64Array.from(A.re), im: Float64Array.from(A.im) } : null; abB = B ? { re: Float64Array.from(B.re), im: Float64Array.from(B.im) } : null; abStatus(); }, recallA() { recall(abA); }, recallB() { recall(abB); }, set(v) { if (v && sturm.P) return false; ui.abSw.set(v); if (v) { if (!abA || !abB) return false; reg.setTransition(abA, abB, abOmega, clock.t); } else if (reg.transition) reg.clearTransition(clock.t); touchState(); abStatus(); return true; }, get on() { return !!reg.transition; }, get status() { return ui.abRo.root.textContent; },
    /* WAVE 106 · Ω REACHES THE DEFS THROUGH HERE: one truth for the rate, t0 re-solved so the mix angle θ = Ω(t − t0)/2 is CONTINUOUS across a change */
    get omega() { return abOmega; },
    setOmega(v) { const w = Math.max(0.005, Math.min(1, +v || 0.05));
      if (reg.transition) { const th = reg.mixAngle(clock.t); reg.transition.omega = w; reg.transition.t0 = clock.t - 2 * th / w; }
      abOmega = w; return w; } };
  /* THE PLACE THE LINK SPEAKS: a `.note` and not a hover (ANTI-PATTERNS 4) */
  ui.linkNote = el('div', 'note link-note', gab, ''); ui.linkNote.hidden = true;
  return { clearRegister };
}
