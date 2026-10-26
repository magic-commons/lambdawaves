/* lab/windows/static-field.js — THE FIELD card (iteration 008 S, id `staticfield`), created at its seat after SPECTRUM.  Josh (2026-10-18): the STATE
 * window "is one of the first windows added to the app … everything else has to go or be reworked into other windows".  What STATE held besides
 * A / B came here, moved verbatim with its comments: THE STATIC FIELD (ZEEMAN B · STARK F · INTER-SHELL · NO FIELD and the two readouts), THE DRIVES
 * (the three jog wheels ROTATE z · STARK K_z · DEFECT L² and the three rates SPIN z · SPIN K_z · SPIN L²), and behind the fold THE IMPULSE's knobs
 * (the Ctrl+drag feel PULL · RESPONSE · LIMIT, DRAG γ, and the OSCILLATOR's SQUEEZE r · SQUEEZE-IN · CAT with CAT's k).  The keyboard's impulse
 * (`app.hooks.slap`, the K key along the X · Y · Z axis) lives here too: RELEASE and ALONG were its buttons, and K is the road now.  LAST IMPULSE is
 * a METERS line (`ui.kickRo`, readouts.js).  Every PROJECT key is the one STATE wrote (`field.Bz/Fz/inter`, `mat.bow`, `damping`), every `ui.*` name
 * persist.js and the modulation seam read is the one STATE made, and the targets `state.rot.z` · `state.stark.kz` · `state.defect.l2` are unchanged.
 * Closed on a first run (rack.js' first-visit furniture lists it nowhere) and for a profile older than it (008 Q, settings.js applySettings: no `dither` in the blob, INFORMATIONAL's road), listed in + and WINDOW like every card; an ATOMS window (MOLECULES hides it). */
import { el, knob, sw, trig, readout, group, label } from '../mir/kit.js';
import { fold } from '../fold.js';
import { momentumZ, AXIS_TO_Z } from '../kick.js';
import { applyKickAlong, escaped, SQUEEZE, SQUEEZE_REFUSAL, SLAP_REFUSAL } from '../kick.js'; import { varianceZ } from '../calculus.js'; import { onHamiltonian } from '../hamiltonian.js';   // 0.8.0 G2 · SQUEEZE + CAT
import { applyRotor as rotorOnCopy } from '../frontier.js';
import { getHamiltonian, getZ } from '../hamiltonian.js';
import { saddle, polarizability } from '../stark.js';
export function createStaticField(app) {
  const { ui, device, reg, clock, mat, sturm } = app, { rack } = app.host, { modHand, ROT_LIMIT, setRotationRate, touchState } = app.ctl;
  const wField = device({ id: 'staticfield', eyebrow: 'FIELD', title: 'static field · drives', status: '' });
  wField.root.classList.add('closed');
  rack.appendChild(wField.root);

  /* ── THE STATIC FIELD ── */
  const gF = group(wField.body, 'STATIC FIELD');
  const rf = el('div', 'row tight', gF);
  ui.bz = knob({ label: 'ZEEMAN B', min: 0, max: 0.05, value: 0, fmt: (v) => v === 0 ? 'off' : v.toFixed(4), onInput: (v) => { reg.setField({ Bz: v }); touchState(); } });
  ui.fz = knob({ label: 'STARK F', min: 0, max: 0.01, value: 0, fmt: (v) => v === 0 ? 'off' : v.toExponential(1), onInput: (v) => { if (!getHamiltonian().stark || sturm.P) { ui.fz.set(0); return; } const c = reg.field.inter && reg.at(clock.t); reg.setField({ Fz: v }); if (c) reg.anchorFrom(c.re, c.im, clock.t); interSync(); touchState(); } });
  /* 0.8.0 G3 · INTER-SHELL: STARK F across shells — the register engages lab/stark.js' propagator (H = diag(E) + F·z over the 140 labels) at F > 0, c(t) continuous */
  ui.interSw = sw({ label: 'INTER-SHELL', value: false, title: 'STARK F across shells: H = diag(E) + F·z over all 140 labels, eigensolved once per F', onChange: (v) => {
    const why = !v ? '' : !getHamiltonian().stark ? 'hydrogen only' : sturm.P ? 'off under STURMIAN' : getZ() !== 1 ? 'Z = 1 only' : '';
    if (why) { ui.interSw.set(false); ui.interRo.set('refused', 'warn'); ui.interRo.setSub(`INTER-SHELL is ${why}: z is hydrogen's own dipole matrix over the n ≤ 7 labels`); return; }
    if (reg.transition && app.hooks.ab) app.hooks.ab.set(false);
    const c = reg.at(clock.t); reg.setField({ inter: v }); reg.anchorFrom(c.re, c.im, clock.t); interSync(); touchState(); } });
  rf.appendChild(ui.bz.root); rf.appendChild(ui.fz.root); rf.appendChild(ui.interSw.root);
  rf.appendChild(trig({ label: 'NO FIELD', onFire: () => { reg.setField({ Bz: 0, Fz: 0 }); ui.bz.set(0); ui.fz.set(0); touchState(); } }).root);
  /* 017 X1 · AN EFFECT SHOWS ITS WINDOW: the window's × or POWER OFF puts the field to zero (Fz · Bz · INTER-SHELL; c(t) continuous) and the knobs read 0 */
  const fieldDown = () => {
    const f = reg.field, drives = [ui.rotZRate, ui.kzRate, ui.defRate].some((K) => K.get() !== 0) || reg.damping !== 0;   // 017 call 9 (Josh: "Sure?"): the DRIVES and DRAG end with the window too
    if (!f.Fz && !f.Bz && !f.inter && !drives) return;
    const c = f.inter && reg.at(clock.t); reg.setField({ Fz: 0, Bz: 0, inter: false }); if (c) reg.anchorFrom(c.re, c.im, clock.t); ui.bz.set(0); ui.fz.set(0);
    for (const [k, K] of [['z', ui.rotZRate], ['kz', ui.kzRate], ['def', ui.defRate]]) { setRotationRate(k, 0); K.set(0); } reg.setDamping(0); ui.dragKnob.set(0); touchState(); };
  wField.root.addEventListener('devclose', fieldDown); wField.root.querySelector('.dev-power').addEventListener('click', () => { if (wField.root.classList.contains('off')) fieldDown(); });
  ui.fieldRo = readout({ label: 'H IN FORCE', value: 'H₀ (bare Coulomb)', cls: 'two', sub: '' });
  rf.appendChild(ui.fieldRo.root);
  ui.interRo = readout({ label: 'INTER-SHELL', value: 'off', cls: 'wide', sub: 'STARK F acts within each shell' }); el('div', 'row tight', gF).appendChild(ui.interRo.root);
  /* the propagator's stand-downs (the Sturmian's road: RATE · K_z · DEFECT · A⇄B) and the readout — every number computed; synced after any write of STARK F (a restore, an operator switch, NO FIELD) */
  function interSync() { const P = reg.P, S = !!(P && P.stark), F = reg.field.Fz; ui.interSw.set(!!reg.field.inter); if (app.hooks.status) app.hooks.status();
    for (const k of [ui.kzKnob, ui.defKnob, ui.kzRate, ui.defRate, ui.abOmega]) if (k) k.setDisabled(!!P);
    if (ui.abSw) { ui.abSw.root.disabled = !!P; ui.abSw.root.classList.toggle('disabled', !!P); }
    if (!S) { ui.interRo.set(reg.field.inter ? 'set STARK F' : 'off', ''); ui.interRo.setSub(reg.field.inter ? 'engages at F > 0' : 'STARK F acts within each shell'); ui.interRo.root.title = ''; return; }
    ui.kzRate.set(0); ui.defRate.set(0); setRotationRate('kz', 0); setRotationRate('def', 0);
    let k = 1, k1 = 0; while (k <= 7 && saddle(k) > F) k++; for (let j = 1; j < P.n; j++) if (Math.abs(P.C[j]) > Math.abs(P.C[k1])) k1 = j;   // k1: the eigenvector carrying 1s
    ui.interRo.set(`1s ${(P.E[k1] - P.H[0]).toExponential(1)} Eh · α(n ≤ 7) ${polarizability().toFixed(2)} of 4.5`, 'live');
    ui.interRo.setSub(k > 7 ? 'every shell below its saddle' : `saddle n = ${k} at ${saddle(k).toExponential(1)}: ${reg.nmax() >= k ? 'would ionise — this basis holds it' : 'nothing populated past it'}`);
    ui.interRo.root.title = `F = ${F} · NUMERICAL: eigensolve of diag(E) + F·z in the n ≤ 7 basis (${P.ms.toFixed(1)} ms), no continuum · RATE · K_z · DEFECT · A⇄B stand down`; }
  const fzSet = ui.fz.set; ui.fz.set = (v, q) => { fzSet(v, q); queueMicrotask(interSync); };
  el('div', 'note', gF).innerHTML = '<b>Fields.</b> ZEEMAN adds an orbital m-dependent phase. STARK mixes l within each shell and omits coupling between shells; keep F well below the limit shown in the readout. INTER-SHELL couples every shell (hydrogen only): an eigensolve in the n ≤ 7 basis, which has no continuum, so ionisation is said, never simulated.';

  /* ── THE DRIVES: three jog wheels (a DELTA each) over their three rates, the rotor grid STATE wore (skin.css .native-rotors) ── */
  const gD = group(wField.body, 'DRIVES');
  const rd = el('div', 'row tight native-rotors', gD);
  rd.appendChild(knob({ label: 'ROTATE z', min: 0, max: 2 * Math.PI, value: 0, wrap: true, cls: 'rot', fmt: () => 'D(R_z)', onDelta: (d) => { reg.rotateZ(d); touchState(); } }).root);
  ui.kzKnob = knob({ label: 'STARK K_z', min: 0, max: 2 * Math.PI, value: 0, wrap: true, cls: 'rot', fmt: () => 'e^{−iθK_z}', onDelta: (d) => { reg.rotateK(d); touchState(); } });
  rd.appendChild(ui.kzKnob.root);
  ui.defKnob = knob({ label: 'DEFECT L²', min: 0, max: 2 * Math.PI, value: 0, wrap: true, cls: 'rot', fmt: () => 'e^{iαL²}', onDelta: (d) => { reg.defectWait(d); touchState(); } });
  rd.appendChild(ui.defKnob.root);
  /* THE JOG WHEEL ABOVE AND THE DIAL BELOW ARE NOT TWO TRUTHS.  The wheel is a DELTA — one shove,
     applied and forgotten, holding nothing (mir/kit.js knob, `onDelta`).  This is a RATE, in rad/s, and it is a
     real stored number: rotRate.z IS what the registry reads and writes, so `get` cannot lie and
     modSyncBases cannot fight it.  Nothing anywhere accumulates the angle the two of them make. */
  ui.rotZRate = knob({ label: 'SPIN z', min: -ROT_LIMIT.z, max: ROT_LIMIT.z, value: 0, cls: 'rot',
    title: 'Continuous state rotation about z. Double-click to stop.',
    fmt: (v) => v === 0 ? '· still ·' : v.toFixed(3) + ' rad/s',
    onInput: (v) => { if (modHand('state.rot.z', v)) return; setRotationRate('z', v); } });
  rd.appendChild(ui.rotZRate.root);
  /* THE TWO DEFLECTION RATES.  Both setters CLAMP TO ZERO under STURMIAN rather than trusting the
     disable, because a modulated base survives a setDisabled(): the dial would sit dead while an
     LFO went on writing behind it.  A guard in rotStep alone would be worse — the dial would then
     read a rate that does nothing, and a knob that does not follow the value it owns is a knob
     that lies.  So: clamped here, zeroed and disabled in applySturmian, and ignored in rotStep. */
  ui.kzRate = knob({ label: 'SPIN K_z', min: -ROT_LIMIT.kz, max: ROT_LIMIT.kz, value: 0, cls: 'rot',
    title: 'Continuous Stark rotation. Double-click to stop.',
    fmt: (v) => v === 0 ? '· still ·' : v.toFixed(3) + ' rad/s',
    onInput: (v) => { const w = sturm.P ? 0 : v; if (w !== v) ui.kzRate.set(w); if (modHand('state.stark.kz', w)) return; setRotationRate('kz', w); } });
  rd.appendChild(ui.kzRate.root);
  ui.defRate = knob({ label: 'SPIN L²', min: -ROT_LIMIT.def, max: ROT_LIMIT.def, value: 0, cls: 'rot',
    title: 'Continuous l-dependent phase. Double-click to stop.',
    fmt: (v) => v === 0 ? '· still ·' : v.toFixed(3) + ' rad/s',
    onInput: (v) => { const w = sturm.P ? 0 : v; if (w !== v) ui.defRate.set(w); if (modHand('state.defect.l2', w)) return; setRotationRate('def', w); } });
  rd.appendChild(ui.defRate.root);
  el('div', 'note', gD).innerHTML = '<b>Drives.</b> ROTATE z changes m phase. STARK K_z mixes l within each (n,m) shell. DEFECT L² adds an l-dependent phase. The SPIN dials run each one continuously. Camera rotation changes only the view.';

  /* ── THE IMPULSE, behind the fold: the kick itself is the gesture (Ctrl+drag on the stage) and the K key (k = 0.2 along the axis X · Y · Z
     pick; Shift is the fine step) — STATE's RELEASE and ALONG were those two, and LAST IMPULSE reads in METERS ── */
  const gK = group(wField.body, ''), kHead = el('div', 'row tight lw-field-head', gK), kBody = el('div', '', gK);
  label(el('div', 'grp-lbl', kHead), 'IMPULSE  ·  a sudden momentum kick  <m>ψ ↦ e^{ik·x}ψ</m>');
  fold(kHead, kBody, { what: 'the impulse\'s knobs' });
  mat.bow = { gain: 1, curve: 1, limit: 3, ...(mat.bow || {}) };
  const feel = el('div', 'row tight bow-feel', kBody);
  ui.bowKnobs = {};
  for (const [key,label,min,max] of [['gain','PULL',.25,4],['curve','RESPONSE',.25,3],['limit','LIMIT',.1,3]]) {
    const k = knob({ label, min, max, value:mat.bow[key], fmt:v=>v.toFixed(2), title: key==='curve'?'Shape the response around linear':'Impulse '+label.toLowerCase(), onInput:v=>{mat.bow[key]=v;} }); ui.bowKnobs[key]=k; feel.appendChild(k.root);
  }
  ui.dragKnob = knob({ label: 'DRAG <m>γ</m>', min: 0, max: 0.5, value: 0, fmt: (v) => v === 0 ? 'off' : v.toFixed(3), onInput: (v) => { reg.setDamping(v); touchState(); } });
  feel.appendChild(ui.dragKnob.root);
  const rq = el('div', 'row tight', kBody);   // 0.8.0 G2 · SQUEEZE + CAT, the OSCILLATOR's: r rides in mat.bow.squeeze (PROJECT, absent until moved)
  let catK = 0.2;
  const sqK = knob({ label: 'SQUEEZE r', min: 0, max: 0.33, value: mat.bow.squeeze || 0, fmt: (v) => (+v || 0).toFixed(3), title: 'S(r) = e^{r(a² − a†²)/2} · capped at 0.33, where Var is within 4e-4 of e^{−2r}·Var₀ on the n ≤ 7 register: past it the register keeps the norm and loses the variance (r = 0.5: 0.015 % lost, 0.7 % wrong)', onInput: (v) => { mat.bow.squeeze = v || undefined; } });
  const catKnob = knob({ label: 'CAT  <m>k</m>', min: 0.01, max: 1.5, value: catK, log: true, fmt: (v) => v.toFixed(3) + ' a.u.', title: 'the ±k of CAT\'s two slaps (STATE\'s old STRENGTH)', onInput: (v) => { catK = v; } });
  const axis = () => (app.sh.keyState ? app.sh.keyState.axis : 'z');   // the K key's axis (X · Y · Z): STATE's ALONG
  const osc = [['SQUEEZE-IN', 'S(r) along the axis X · Y · Z pick', () => squeezeIn(sqK.get(), axis())], ['CAT', 'two slaps ±k of |0⟩ into A and B; the register is their normalised sum |α⟩ + |−α⟩', () => cat(catK, axis())]].map(([label, t, onFire]) => trig({ label, title: t + ' · ' + SQUEEZE_REFUSAL, onFire }).root);
  ui.bowKnobs.squeeze = { set: (x) => sqK.set(+x || 0) }; for (const e of [sqK.root, catKnob.root, ...osc]) rq.appendChild(e);
  const oscSync = () => { const off = getHamiltonian().id !== 'qho'; sqK.setDisabled(off); catKnob.setDisabled(off); for (const b of osc) b.disabled = off; }; oscSync(); onHamiltonian(oscSync);
  function squeezeIn(r, axis) { if (!reg.populated().length) reg.set(0, 1, 0, clock.t); const n0 = reg.norm2(), v0 = pAlong(axis, varianceZ); reg.squeeze(r, axis, clock.t); const v1 = pAlong(axis, varianceZ), want = Math.exp(-2 * r) * v0;
    SQUEEZE.said = `Var(${axis}) ${v1.toFixed(4)} · e^{−2r}·Var₀ = ${want.toFixed(4)} · error ${Math.abs(v1 / want - 1).toExponential(1)} · lost norm ${escaped(n0, reg.norm2()).toExponential(1)}`; ui.kickRo.setSub(SQUEEZE.said); touchState(); }
  function cat(k, axis) { const [A, B] = [1, -1].map((q) => { const s = { re: new Float64Array(reg.re0.length), im: new Float64Array(reg.re0.length) }; s.re[0] = 1; applyKickAlong(s.re, s.im, k, [...'xyz'].map((c) => c === axis ? q : 0)); return s; });   // ±d, k > 0: the boost's Bessel tables take k ≥ 0
    app.hooks.ab.setStores(A, B); reg.anchorFrom(A.re.map((v, i) => v + B.re[i]), A.im.map((v, i) => v + B.im[i]), clock.t); reg.normalize(); touchState(); }
  el('div', 'note', kBody).innerHTML = '<b>Impulse.</b> Ctrl-drag on the field sets direction and strength (PULL, RESPONSE and LIMIT shape that pull); K applies e<sup>ik·x</sup> with k = 0.2 along the axis X, Y or Z picked, and keeps only the part represented by n ≤ 7 — METERS\' IMPULSE line reports k, λ, the escaped norm and the momentum. DRAG γ damps excited amplitudes as a display model and discards the lost norm. On the OSCILLATOR, SQUEEZE-IN applies S(r) along the axis and METERS prints Var against e<sup>−2r</sup>·Var₀ beside the lost norm; CAT stores the ±k slaps of the ground state as A and B and sets their normalised sum.';
  function pAlong(axis, f = momentumZ) {
    const c = reg.at(clock.t);                                  // sum over the WHOLE register: a rotation moves amplitude between m
    if (axis === 'z') return f(c.re, c.im);
    const R = AXIS_TO_Z[axis], re = Float64Array.from(c.re), im = Float64Array.from(c.im);
    rotorOnCopy(re, im, { which: 'both', axis: R.axis, angle: R.angle });
    return f(re, im);
  }
  /** the keyboard's impulse (the K key: app.hooks.slap(0.2 · fine, axis)) — STATE's RELEASE along ALONG, said in METERS' IMPULSE line */
  function slap(k, axis) {
    if (getHamiltonian().separable) { ui.kickRo.set('—', 'warn'); ui.kickRo.setSub(SLAP_REFUSAL); return; }   // 0.9.4 S1
    const n0 = reg.norm2(), p0 = pAlong(axis);
    if (!reg.populated().length && getHamiltonian().id !== 'well') reg.set(0, 1, 0, clock.t);
    reg.kick(k, axis, clock.t);
    const n1 = reg.norm2(), p1 = pAlong(axis);
    const esc = n0 > 0 ? 1 - n1 / n0 : 0;
    ui.kickRo.set(`${(100 * esc).toFixed(2)}% · ${(p1 - p0).toFixed(4)}`, esc > 0.2 ? 'warn' : 'ok');
    ui.kickRo.setSub(`<m>k</m> = ${k.toFixed(3)} · <m>λ</m> = ${(2 * Math.PI / k).toFixed(1)} a₀ along ${axis} · Ehrenfest would give ${k.toFixed(3)}; the deficit is the continuum · <m>‖ψ‖</m> now ${Math.sqrt(n1).toFixed(4)}`);
    touchState();
  }
  app.hooks.slap = slap;
}
