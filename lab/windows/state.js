/* lab/windows/state.js — the STATE card (0.5.2 R2a; moved verbatim out of lab/rack.js boot()), created at the card's seat.
 * Iteration 008 S (Josh, 2026-10-18: "States should simply be the A to B and Store A/B with transition on and 'rabi' knob"): the card is
 * STORE A · A · STORE B · B, TRANSITION and RABI with the A / B readout, and nothing else.  Its other rows went home (research/iteration-008/
 * S-BUILD.md): the PRESET stepper to SPECTRUM's head, EMPTY ↔ FILL ALL to SPECTRUM's grid (a hand stroke normalises at its end), the static
 * field, the drives and the impulse's knobs to FIELD (lab/windows/static-field.js), LAST IMPULSE to METERS, SAVE / LOAD to FILE and FOLDERS,
 * COPY JSON / COPY LINK to EDIT.  The id `state`, its WORKSPACE seat, `ui.ab`, `app.hooks.ab` and `state.rabi` are unchanged; the card's status
 * line stays the lab's one sink (keys, links, undo, restore) and the link's note stays under it.  CLEAR the register (the menubar's row and
 * SPECTRUM's EMPTY) stays this module's function.  It registers app.w.wState; boot() destructures the return. */
import { TIER } from '../rack.js';
import { el, knob, sw, trig, readout, group } from '../mir/kit.js';
export function createStateCard(app) {
  const { ui, device, reg, hNote, clock, sturm } = app, { schedule } = app.loop, { rack } = app.host, { touchState } = app.ctl;
  /* OPTIMIZATION 2026-09-24 · N1 · THE REGISTER'S CLEAR, NAMED.  The menubar's "CLEAR the register" pressed the FIRST `.trig`
     reading CLEAR in document order — SPECTRUM's head row on a first visit (c ↦ 0, no clock reset), the undo ring's own
     CLEAR once HISTORY floated (AUDIT-E FE1).  The register's CLEAR is this one function: the menu row and SPECTRUM's EMPTY call it. */
  function clearRegister() { reg.clear(); app.state.refSnapshot = null; clock.reset(); if (ui.scrub) ui.scrub.set(0); app.w.shadowView.clearTrail(); touchState(); }
  const wState = device({ id: 'state', eyebrow: 'STATE', status: '' });
  app.w.wState = wState;
  rack.appendChild(wState.root);
  {
    {
      const gab = group(wState.body, 'A / B  ·  TRANSITION  (Rabi)');
      const rab = el('div', 'row tight native-ab', gab);   // 0.5.3 M11 (R7): ONE row STORE A · A · STORE B · B, a stored slot lit by `.stored` (lab.css ::after)
      let abA = null, abB = null, abOmega = 0.05;
      const snap = () => ({ re: Float64Array.from(reg.re0), im: Float64Array.from(reg.im0) });
      const recall = (S) => { if (!S) return; if (reg.transition) { reg.clearTransition(clock.t); ui.abSw.set(false); } reg.re0.set(S.re); reg.im0.set(S.im); reg.version++; touchState(); abStatus(); };
      ui.abRo = readout({ label: 'A / B', value: '—  /  —', sub: 'store two states, then TRANSITION plays A → B → A at Ω' });
      rab.appendChild(trig({ label: 'STORE A', title: 'keep the register as it is now as state A', onFire: () => { abA = snap(); abStatus(); hNote(); } }).root);
      const slotA = rab.appendChild(trig({ label: 'A', cls: 'ab-slot', title: 'recall state A', onFire: () => recall(abA) }).root);
      rab.appendChild(trig({ label: 'STORE B', title: 'keep the register as it is now as state B', onFire: () => { abB = snap(); abStatus(); hNote(); } }).root);
      const slotB = rab.appendChild(trig({ label: 'B', cls: 'ab-slot', title: 'recall state B', onFire: () => recall(abB) }).root);
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
      /* THE PROJECT'S ROAD (Josh, 2026-09-10: "state transitions don't keep"): both stores, Ω and whether the
         transition is running — plain arrays in the file, typed arrays in the block. */
      /* iteration 008 A7: a store is written 91 wide while its n = 7 part is zero, so an older file's bytes never move */
      const cut = (S) => { const w = S.re.subarray(91).some(Boolean) || S.im.subarray(91).some(Boolean) ? S.re.length : 91; return { re: Array.from(S.re.subarray(0, w)), im: Array.from(S.im.subarray(0, w)) }; };
      ui.ab = {
        get: () => ({ a: abA ? cut(abA) : null, b: abB ? cut(abB) : null, omega: abOmega, on: !!reg.transition }),
        set(o) { if (!o) return; const W = reg.re0.length, pad = (v) => { const o2 = new Float64Array(W); o2.set(v.slice(0, W)); return o2; }, take = (S) => (S && Array.isArray(S.re) && (S.re.length === 91 || S.re.length === W) && Array.isArray(S.im)) ? { re: pad(S.re), im: pad(S.im) } : null;   // a 91-wide store (an older file) pads n = 7 with zeros
          abA = take(o.a); abB = take(o.b); if (Number.isFinite(o.omega)) { abOmega = Math.max(0.005, Math.min(1, o.omega)); if (ui.abOmega) ui.abOmega.set(abOmega); }
          if (reg.transition) reg.clearTransition(clock.t);
          if (o.on && abA && abB && !sturm.P) { reg.setTransition(abA, abB, abOmega, clock.t); ui.abSw.set(true); } else ui.abSw.set(false);
          abStatus(); }
      };
      function abStatus() {
        slotA.classList.toggle('stored', !!abA); slotB.classList.toggle('stored', !!abB);
        const count = (S) => S ? S.re.reduce((k, v, i) => k + ((v || S.im[i]) ? 1 : 0), 0) : 0, nA = count(abA), nB = count(abB);
        let ov = 0; if (abA && abB) { let r = 0, im = 0; for (let a = 0; a < abA.re.length; a++) { r += abA.re[a] * abB.re[a] + abA.im[a] * abB.im[a]; im += abA.re[a] * abB.im[a] - abA.im[a] * abB.re[a]; } ov = Math.hypot(r, im); }
        const exact = nA === 1 && nB === 1 && ov < 1e-9;
        ui.abRo.set((abA ? nA + (nA === 1 ? ' mode' : ' modes') : '—') + '  /  ' + (abB ? nB + (nB === 1 ? ' mode' : ' modes') : '—'), reg.transition ? (exact ? 'ok' : 'warn') : '');
        ui.abRo.setSub(reg.transition ? (exact ? 'two-level Rabi drive · |⟨A|B⟩| = ' + ov.toFixed(3) : 'composite-state envelope · |⟨A|B⟩| = ' + ov.toFixed(3)) : 'store two states, then TRANSITION plays A → B → A at Ω');
      }
      app.hooks.ab = { get A() { return abA; }, get B() { return abB; }, storeA() { abA = snap(); abStatus(); hNote(); }, storeB() { abB = snap(); abStatus(); hNote(); }, setStores(A, B) { abA = A ? { re: Float64Array.from(A.re), im: Float64Array.from(A.im) } : null; abB = B ? { re: Float64Array.from(B.re), im: Float64Array.from(B.im) } : null; abStatus(); }, recallA() { recall(abA); }, recallB() { recall(abB); }, set(v) { if (v && sturm.P) return false; ui.abSw.set(v); if (v) { if (!abA || !abB) return false; reg.setTransition(abA, abB, abOmega, clock.t); } else if (reg.transition) reg.clearTransition(clock.t); touchState(); abStatus(); return true; }, get on() { return !!reg.transition; }, get status() { return ui.abRo.root.textContent; },
        /* WAVE 106 · Ω REACHES THE DEFS THROUGH HERE, and it has to.  `abOmega` is block-local (it is
           `let` a few lines up) and the MIR `defs` array is far outside this block, so a target could
           not see it.  Worse, a setter that wrote only `reg.transition.omega` would leave `abOmega`
           stale and the NEXT `setTransition` would start the mix at the old rate — two truths for one
           number.  This writes both, and re-solves t0 exactly as the knob does so the mix angle is
           CONTINUOUS across a change: theta = Omega*(t - t0)/2, so holding theta while Omega moves
           means t0 = t - 2*theta/Omega.  A modulator sweeping Omega therefore bends the rate without
           ever jumping the phase. */
        get omega() { return abOmega; },
        setOmega(v) { const w = Math.max(0.005, Math.min(1, +v || 0.05));
          if (reg.transition) { const th = reg.mixAngle(clock.t); reg.transition.omega = w; reg.transition.t0 = clock.t - 2 * th / w; }
          abOmega = w; return w; } };
      el('div', 'note', gab).innerHTML = '<b>A / B.</b> STORE A and STORE B capture two states. TRANSITION mixes them at Ω; composite states use the same envelope as an illustrative model. Turning the transition off keeps the current mix.';
    }
    /* THE PLACE THE LINK SPEAKS.  A `.note` and not a hover: what a link dropped is information, and
       information reachable only by hover is unreachable on the iPad (ANTI-PATTERNS 4). */
    ui.linkNote = el('div', 'note link-note', wState.body, ''); ui.linkNote.hidden = true;
  }
  return { clearRegister, wState };
}
