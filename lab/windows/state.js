/* lab/windows/state.js — the STATE card and its CLEAR (0.5.2 R2a; moved verbatim out of lab/rack.js boot()), created at the card's seat.  §0's consts,
 * the loop's schedule, the rack and the controller's names are handed over (backward); normalizeNow, shadowView and the persistence and link verbs are
 * read through their slots inside callbacks (forward).  It registers app.w.wState; boot() destructures the return. */
import { TIER } from '../rack.js';
import { el, knob, sw, seg, trig, readout, group } from '../mir/kit.js';
import { PRESETS } from '../state.js';
import { momentumZ, AXIS_TO_Z } from '../kick.js';
import { applyRotor as rotorOnCopy } from '../frontier.js';
import { getHamiltonian, getZ } from '../hamiltonian.js';
import { saddle, polarizability } from '../stark.js';
export function createStateCard(app) {
  const { ui, device, reg, hNote, clock, mat, sturm } = app, { schedule } = app.loop, { rack } = app.host, { modHand, ROT_LIMIT, setRotationRate, touchState, loadPreset } = app.ctl;
  /* OPTIMIZATION 2026-09-24 · N1 · STATE's CLEAR, NAMED.  The menubar's "CLEAR the register" pressed the FIRST `.trig`
     reading CLEAR in document order — SPECTRUM's head row on a first visit (c ↦ 0, no clock reset), the undo ring's own
     CLEAR once HISTORY floated (AUDIT-E FE1).  The register's CLEAR is this one function now, and both the STATE trigger
     and the menu row call it (the lead's ruling: STATE's CLEAR; Josh may reverse it). */
  function clearRegister() { reg.clear(); app.state.refSnapshot = null; clock.reset(); if (ui.scrub) ui.scrub.set(0); app.w.shadowView.clearTrail(); touchState(); }
  const wState = device({ id: 'state', eyebrow: 'STATE', status: '' });
  app.w.wState = wState;
  rack.appendChild(wState.root);
  {
    const r1 = wState.row();
    ui.presetSel = el('select', 'sel', r1); ui.presetSel.setAttribute('aria-label', 'preset superposition');
    for (const p of PRESETS) { const o = el('option', '', ui.presetSel, p.label); o.value = p.id; }
    ui.presetSel.addEventListener('change', () => loadPreset(ui.presetSel.value, { hand: true }));
    ui.presetSel.style.flex = '1 1 160px';


    r1.appendChild(trig({ label: 'RELOAD', title: 'Reload the selected preset and reset time', onFire: () => loadPreset(ui.presetSel.value, { hand: true }) }).root);
    r1.appendChild(sw({ label: 'PRESET VISUALS', value: true, onChange: (v) => { app.state.applyVisuals = v; } }).root);
    ui.presetNote = el('div', 'note', wState.body, '');
    const r2 = wState.row();
    r2.appendChild(trig({ label: 'NORMALIZE', title: 'Normalize the state coefficients', onFire: () => app.w.normalizeNow() }).root);


    r2.appendChild(trig({ label: 'CLEAR', onFire: () => clearRegister() }).root);
    r2.appendChild(knob({ label: 'ROTATE z', min: 0, max: 2 * Math.PI, value: 0, wrap: true, cls: 'rot', fmt: () => 'D(R_z)', onDelta: (d) => { reg.rotateZ(d); touchState(); } }).root);
    /* THE JOG WHEEL ABOVE AND THE DIAL BELOW ARE NOT TWO TRUTHS.  The wheel is a DELTA — one shove,
       applied and forgotten, holding nothing (mir/kit.js knob, `onDelta`).  This is a RATE, in rad/s, and it is a
       real stored number: rotRate.z IS what the registry reads and writes, so `get` cannot lie and
       modSyncBases cannot fight it.  Nothing anywhere accumulates the angle the two of them make. */
    ui.rotZRate = knob({ label: 'SPIN z', min: -ROT_LIMIT.z, max: ROT_LIMIT.z, value: 0, cls: 'rot',
      title: 'Continuous state rotation about z. Double-click to stop.',
      fmt: (v) => v === 0 ? '· still ·' : v.toFixed(3) + ' rad/s',
      onInput: (v) => { if (modHand('state.rot.z', v)) return; setRotationRate('z', v); } });
    r2.appendChild(ui.rotZRate.root);
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
      ui.abOmega = knob({ label: 'Ω  RABI', min: 0.005, max: 1, value: 0.05, log: true, fmt: (v) => v.toFixed(3), onInput: (v) => { if (reg.transition) { const th = reg.mixAngle(clock.t); reg.transition.omega = v; reg.transition.t0 = clock.t - 2 * th / v; } abOmega = v; } });
      rab2.appendChild(ui.abOmega.root);
      rab2.appendChild(ui.abRo.root);
      /* THE PROJECT'S ROAD (Josh, 2026-09-10: "state transitions don't keep"): both stores, Ω and whether the
         transition is running — plain arrays in the file, typed arrays in the block. */
      ui.ab = {
        get: () => ({ a: abA ? { re: Array.from(abA.re), im: Array.from(abA.im) } : null, b: abB ? { re: Array.from(abB.re), im: Array.from(abB.im) } : null, omega: abOmega, on: !!reg.transition }),
        set(o) { if (!o) return; const take = (S) => (S && Array.isArray(S.re) && S.re.length === 91 && Array.isArray(S.im)) ? { re: Float64Array.from(S.re), im: Float64Array.from(S.im) } : null;
          abA = take(o.a); abB = take(o.b); if (Number.isFinite(o.omega)) { abOmega = Math.max(0.005, Math.min(1, o.omega)); if (ui.abOmega) ui.abOmega.set(abOmega); }
          if (reg.transition) reg.clearTransition(clock.t);
          if (o.on && abA && abB && !sturm.P) { reg.setTransition(abA, abB, abOmega, clock.t); ui.abSw.set(true); } else ui.abSw.set(false);
          abStatus(); }
      };
      function abStatus() {
        slotA.classList.toggle('stored', !!abA); slotB.classList.toggle('stored', !!abB);
        const count = (S) => S ? S.re.reduce((k, v, i) => k + ((v || S.im[i]) ? 1 : 0), 0) : 0, nA = count(abA), nB = count(abB);
        let ov = 0; if (abA && abB) { let r = 0, im = 0; for (let a = 0; a < 91; a++) { r += abA.re[a] * abB.re[a] + abA.im[a] * abB.im[a]; im += abA.re[a] * abB.im[a] - abA.im[a] * abB.re[a]; } ov = Math.hypot(r, im); }
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
    ui.kzKnob = knob({ label: 'STARK K_z', min: 0, max: 2 * Math.PI, value: 0, wrap: true, cls: 'rot', fmt: () => 'e^{−iθK_z}', onDelta: (d) => { reg.rotateK(d); touchState(); } });
    r2.appendChild(ui.kzKnob.root);
    ui.defKnob = knob({ label: 'DEFECT L²', min: 0, max: 2 * Math.PI, value: 0, wrap: true, cls: 'rot', fmt: () => 'e^{iαL²}', onDelta: (d) => { reg.defectWait(d); touchState(); } });
    r2.appendChild(ui.defKnob.root);
    /* THE TWO DEFLECTION RATES.  Both setters CLAMP TO ZERO under STURMIAN rather than trusting the
       disable, because a modulated base survives a setDisabled(): the dial would sit dead while an
       LFO went on writing behind it.  A guard in rotStep alone would be worse — the dial would then
       read a rate that does nothing, and a knob that does not follow the value it owns is a knob
       that lies.  So: clamped here, zeroed and disabled in applySturmian, and ignored in rotStep. */
    ui.kzRate = knob({ label: 'SPIN K_z', min: -ROT_LIMIT.kz, max: ROT_LIMIT.kz, value: 0, cls: 'rot',
      title: 'Continuous Stark rotation. Double-click to stop.',
      fmt: (v) => v === 0 ? '· still ·' : v.toFixed(3) + ' rad/s',
      onInput: (v) => { const w = sturm.P ? 0 : v; if (w !== v) ui.kzRate.set(w); if (modHand('state.stark.kz', w)) return; setRotationRate('kz', w); } });
    r2.appendChild(ui.kzRate.root);
    ui.defRate = knob({ label: 'SPIN L²', min: -ROT_LIMIT.def, max: ROT_LIMIT.def, value: 0, cls: 'rot',
      title: 'Continuous l-dependent phase. Double-click to stop.',
      fmt: (v) => v === 0 ? '· still ·' : v.toFixed(3) + ' rad/s',
      onInput: (v) => { const w = sturm.P ? 0 : v; if (w !== v) ui.defRate.set(w); if (modHand('state.defect.l2', w)) return; setRotationRate('def', w); } });
    r2.appendChild(ui.defRate.root);
    el('div', 'note', wState.body).innerHTML = '<b>State transforms.</b> STATE ROTATE changes m phase. STARK ROTATE mixes l within each (n,m) shell. DEFECT WAIT adds an l-dependent phase. Camera rotation changes only the view.';


    const gK = group(wState.body, 'IMPULSE  ·  a sudden momentum kick  <m>ψ ↦ e^{ik·x}ψ</m>');
    mat.bow = { gain: 1, curve: 1, limit: 3, ...(mat.bow || {}) };
    const feel = el('div', 'row tight bow-feel', gK);
    ui.bowKnobs = {};
    for (const [key,label,min,max] of [['gain','PULL',.25,4],['curve','RESPONSE',.25,3],['limit','LIMIT',.1,3]]) {
      const k = knob({ label, min, max, value:mat.bow[key], fmt:v=>v.toFixed(2), title: key==='curve'?'Shape the response around linear':'Impulse '+label.toLowerCase(), onInput:v=>{mat.bow[key]=v;} }); ui.bowKnobs[key]=k; feel.appendChild(k.root);
    }
    el('div','bow-hint',gK,'Ctrl + drag · release to fire');
    const rk = el('div', 'row tight', gK);
    let kickK = 0.2, kickAxis = 'z';
    rk.appendChild(knob({ label: 'STRENGTH', min: 0.01, max: 1.5, value: 0.2, log: true, fmt: (v) => v.toFixed(3) + ' a.u.', onInput: (v) => { kickK = v; } }).root);
    ui.kickAxis = seg({ label: 'ALONG', value: 'z', options: [{ id: 'x', label: 'x' }, { id: 'y', label: 'y' }, { id: 'z', label: 'z' }], onChange: (v) => { kickAxis = v; } });
    rk.appendChild(ui.kickAxis.root);
    rk.appendChild(trig({ label: 'RELEASE', title: 'Apply ψ ↦ e^{ik·x}ψ on the selected axis', onFire: () => slap(kickK, kickAxis) }).root);
    ui.dragKnob = knob({ label: 'DRAG <m>γ</m>', min: 0, max: 0.5, value: 0, fmt: (v) => v === 0 ? 'off' : v.toFixed(3), onInput: (v) => { reg.setDamping(v); touchState(); } });
    rk.appendChild(ui.dragKnob.root);
    ui.kickRo = readout({ label: 'LAST IMPULSE · escaped / momentum', value: '—', cls: 'two', sub: 'no impulse yet' });
    rk.appendChild(ui.kickRo.root);
    el('div', 'note', gK).innerHTML = '<b>Impulse.</b> RELEASE applies e<sup>ik·x</sup> and keeps only the part represented by n ≤ 6; ESCAPED reports the omitted norm. Ctrl-drag on the field sets direction and strength. DRAG γ damps excited amplitudes as a display model and discards the lost norm.';
    function pAlong(axis) {
      const c = reg.at(clock.t);                                  // sum over the WHOLE register: a rotation moves amplitude between m
      if (axis === 'z') return momentumZ(c.re, c.im);
      const R = AXIS_TO_Z[axis], re = Float64Array.from(c.re), im = Float64Array.from(c.im);
      rotorOnCopy(re, im, { which: 'both', axis: R.axis, angle: R.angle });
      return momentumZ(re, im);
    }
    function slap(k, axis) {
      const n0 = reg.norm2(), p0 = pAlong(axis);
      if (!reg.populated().length && getHamiltonian().id !== 'well') reg.set(0, 1, 0, clock.t);
      reg.kick(k, axis, clock.t);
      const n1 = reg.norm2(), p1 = pAlong(axis);
      const esc = n0 > 0 ? 1 - n1 / n0 : 0;
      ui.kickRo.set(`${(100 * esc).toFixed(2)}% · ${(p1 - p0).toFixed(4)}`, esc > 0.2 ? 'warn' : 'ok');
      ui.kickRo.setSub(`<m>k</m> = ${k.toFixed(3)} along ${axis} · Ehrenfest would give ${k.toFixed(3)}; the deficit is the continuum · <m>‖ψ‖</m> now ${Math.sqrt(n1).toFixed(4)}`);
      touchState();
    }
    app.hooks.slap = slap;

    const gF = group(wState.body, 'STATIC FIELD');
    const rf = el('div', 'row tight', gF);
    ui.bz = knob({ label: 'ZEEMAN B', min: 0, max: 0.05, value: 0, fmt: (v) => v === 0 ? 'off' : v.toFixed(4), onInput: (v) => { reg.setField({ Bz: v }); touchState(); } });
    ui.fz = knob({ label: 'STARK F', min: 0, max: 0.01, value: 0, fmt: (v) => v === 0 ? 'off' : v.toExponential(1), onInput: (v) => { if (!getHamiltonian().stark || sturm.P) { ui.fz.set(0); return; } const c = reg.field.inter && reg.at(clock.t); reg.setField({ Fz: v }); if (c) reg.anchorFrom(c.re, c.im, clock.t); interSync(); touchState(); } });
    /* 0.8.0 G3 · INTER-SHELL: STARK F across shells — the register engages lab/stark.js' propagator (H = diag(E) + F·z over the 91 labels) at F > 0, c(t) continuous */
    ui.interSw = sw({ label: 'INTER-SHELL', value: false, title: 'STARK F across shells: H = diag(E) + F·z over all 91 labels, eigensolved once per F', onChange: (v) => {
      const why = !v ? '' : !getHamiltonian().stark ? 'hydrogen only' : sturm.P ? 'off under STURMIAN' : getZ() !== 1 ? 'Z = 1 only' : '';
      if (why) { ui.interSw.set(false); ui.interRo.set('refused', 'warn'); ui.interRo.setSub(`INTER-SHELL is ${why}: z is hydrogen's own dipole matrix over the n ≤ 6 labels`); return; }
      if (reg.transition && app.hooks.ab) app.hooks.ab.set(false);
      const c = reg.at(clock.t); reg.setField({ inter: v }); reg.anchorFrom(c.re, c.im, clock.t); interSync(); touchState(); } });
    rf.appendChild(ui.bz.root); rf.appendChild(ui.fz.root); rf.appendChild(ui.interSw.root);
    rf.appendChild(trig({ label: 'NO FIELD', onFire: () => { reg.setField({ Bz: 0, Fz: 0 }); ui.bz.set(0); ui.fz.set(0); touchState(); } }).root);
    ui.fieldRo = readout({ label: 'H IN FORCE', value: 'H₀ (bare Coulomb)', cls: 'two', sub: '' });
    rf.appendChild(ui.fieldRo.root);
    ui.interRo = readout({ label: 'INTER-SHELL', value: 'off', cls: 'wide', sub: 'STARK F acts within each shell' }); el('div', 'row tight', gF).appendChild(ui.interRo.root);
    /* the propagator's stand-downs (the Sturmian's road: RATE · K_z · DEFECT · A⇄B) and the readout — every number computed; synced after any write of STARK F (a restore, an operator switch, NO FIELD) */
    function interSync() { const P = reg.P, S = !!(P && P.stark), F = reg.field.Fz; ui.interSw.set(!!reg.field.inter); if (app.hooks.status) app.hooks.status();
      for (const k of [ui.kzKnob, ui.defKnob, ui.kzRate, ui.defRate, ui.abOmega]) if (k) k.setDisabled(!!P);
      if (ui.abSw) { ui.abSw.root.disabled = !!P; ui.abSw.root.classList.toggle('disabled', !!P); }
      if (!S) { ui.interRo.set(reg.field.inter ? 'set STARK F' : 'off', ''); ui.interRo.setSub(reg.field.inter ? 'engages at F > 0' : 'STARK F acts within each shell'); return; }
      ui.kzRate.set(0); ui.defRate.set(0); setRotationRate('kz', 0); setRotationRate('def', 0);
      let k = 1, k1 = 0; while (k <= 6 && saddle(k) > F) k++; for (let j = 1; j < 91; j++) if (Math.abs(P.C[j]) > Math.abs(P.C[k1])) k1 = j;   // k1: the eigenvector carrying 1s
      ui.interRo.set(`F ${+F.toPrecision(2)} · 1s shift ${(P.E[k1] - P.H[0]).toExponential(1)} Eh · α(n ≤ 6) ${polarizability().toFixed(2)} of 4.5 exact`, 'warn');
      ui.interRo.setSub((k > 6 ? 'every shell below its saddle' : `saddle n = ${k} at F = ${saddle(k).toExponential(1)}: ${reg.nmax() >= k ? 'past it, would ionise — this basis holds it' : 'no state that high'}`) + ` · NUMERICAL · eigensolve ${P.ms.toFixed(1)} ms · RATE · K_z · DEFECT · A⇄B stand down`); }
    const fzSet = ui.fz.set; ui.fz.set = (v, q) => { fzSet(v, q); queueMicrotask(interSync); };
    el('div', 'note', gF).innerHTML = '<b>Fields.</b> ZEEMAN adds an orbital m-dependent phase. STARK mixes l within each shell and omits coupling between shells; keep F well below the limit shown in the readout.';

    const r3 = wState.row();
    r3.appendChild(trig({ label: 'SAVE', title: 'Save the experiment and presentation separately', onFire: () => { app.sh.save(); } }).root);
    r3.appendChild(trig({ label: 'LOAD', onFire: () => { app.sh.restore(); } }).root);
    r3.appendChild(trig({ label: 'COPY JSON', onFire: () => app.sh.copyJSON() }).root);
    /* WAVE 56 (board #55): the whole session as a URL.  Its seat is beside SAVE / LOAD / COPY JSON because
       that is where "this state, made portable" already lives — and the FILE menu names it too. */
    r3.appendChild(trig({ label: 'COPY LINK', title: 'Copy a link to the current state and presentation', onFire: () => app.sh.copyLink() }).root);
    /* THE PLACE THE LINK SPEAKS.  A `.note` and not a hover: what a link dropped is information, and
       information reachable only by hover is unreachable on the iPad (ANTI-PATTERNS 4). */
    ui.linkNote = el('div', 'note link-note', wState.body, ''); ui.linkNote.hidden = true;
  }
  return { clearRegister, wState };
}
