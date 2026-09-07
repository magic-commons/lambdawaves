/* pulseview.js — the PULSE segment of the MOLECULE card (W-PULSE, board #24, ledger §2.6 C1).
 *
 * lab/modrive.js is Astra's field-driven H₂⁺ and lab/pulse.js is the run over it; nothing here re-derives either.
 * This is the face: four pulse parameters, a FIRE, and the three numbers the contract asks to be shown WHILE it
 * runs — the population that left the ground state, ⟨z⟩, and the absorbed energy — over a trace of all three.
 *
 * THE CLOCK IS THE LAB'S, and there is not a third one.  FIRE remembers the lab's logical time t₀; from then on the
 * drive's own time is t_lab − t₀, in the same atomic units, stepped in whole Δt until it catches the clock.  So
 * RATE decides how fast you WATCH the pulse and Δt decides how accurately it is SOLVED, and the two cannot be
 * confused: at the shipped rate of 4 a.u./s the default 96 a.u. run takes 24 seconds of wall.  Pausing stops it
 * where it is; scrubbing FORWARD runs it on; scrubbing BACK cannot un-integrate a driven state, so the run HOLDS
 * and says so rather than pretending (RESET re-arms it at the clock's new position).  A frame gets a 6 ms budget
 * and no more, and the readout says when the drive is behind the clock instead of eating the frame to catch up.
 *
 * THE FIELD SIGN IS kick.js'S — V = +E z for a charge of −1, so E > 0 pushes the electron toward −z, which is the
 * impulsive Stark limit kick.js already ships (Δp = −∫E dt).  Judged in tests/pulse.test.mjs P2.
 *
 * STATUS, in one line and also on the card: NUMERICAL propagation (exponential midpoint, second order in Δt,
 * S-unitary to 1e-13, no renormalisation) of a VARIATIONAL two-centre model with EXACT integrals — EXACT within
 * the basis at a constant field; the length of the free-evolution tail is a DESIGN CHOICE.
 */
import { createMO } from './mo.js';
import { createPulseRun, rabiRWA } from './pulse.js';
import { el, seg, knob, trig, readout, group, nRGB, themeInk, graphHover, fitText } from './kit.js';

const KINDS = {
  lcao1s: { label: '1s LCAO', nMax: 1, n: 2, title: 'one 1s on each proton — two functions, one g and one u, and the pulse drives exactly the g → u transition Astra\'s reference trace was built on' },
  sturmian: { label: 'STURMIAN n ≤ 3', nMax: 3, n: 12, title: 'the Coulomb Sturmians n ≤ 3 at λ = 1.7611 on both nuclei — twelve σ functions, whose g and u blocks the field couples at every step, so the drive solves the FULL matrix and not a parity block' },
};
const BUDGET_MS = 6;                    // a frame's share of the drive, and the readout says when it is not enough
const LABEL = 'NUMERICAL propagation (exponential midpoint, 2nd order in Δt, S-unitary, nothing renormalised) of a VARIATIONAL model with EXACT integrals — EXACT in the basis at constant field. The tail is a DESIGN CHOICE.';

export function createPulse(host, api = {}) {
  let kind = 'lcao1s', lambda = 1.7611, R = 2, dt = 0.05;
  let amplitude = 0.02, omega = 0.3929175297217954, duration = 48, phase = 0;
  let mo = null, run = null, t0 = 0, held = false, rewound = false, behind = 0, lastMs = 0;
  const cache = new Map();
  const basis = () => { const key = kind + ':' + lambda; if (!cache.has(key)) cache.set(key, createMO({ kind, nMax: KINDS[kind].nMax, lambda })); return cache.get(key); };

  const box = group(host, 'PULSE  ·  i S ċ = (H₀ + E_z(t) Z) c  ·  LENGTH GAUGE, FIXED NUCLEI');
  const rA = el('div', 'row tight', box);
  const kindSeg = seg({ label: 'BASIS', value: 'lcao1s', options: Object.keys(KINDS).map((k) => ({ id: k, label: KINDS[k].label, title: KINDS[k].title })),
    onChange: (v) => { kind = v; reset(); refresh(); } });
  rA.appendChild(kindSeg.root);
  const rKnob = knob({ label: 'R  (a₀)', min: 0.8, max: 6, value: 2, fmt: (v) => v.toFixed(2), onInput: (v) => { R = v; reset(); refresh(); } });
  rKnob.root.title = 'the nuclei are FIXED at this separation for the whole pulse — R = 2 is the reference trace\'s own';
  rA.appendChild(rKnob.root);
  const dtSeg = seg({ label: 'Δt  (a.u.)', value: '0.05', options: [{ id: '0.2', label: '0.2' }, { id: '0.1', label: '0.1' }, { id: '0.05', label: '0.05' }, { id: '0.025', label: '0.025' }],
    onChange: (v) => { dt = +v; reset(); refresh(); } });
  dtSeg.root.title = 'the timestep the equation is SOLVED at — not the speed it is watched at, which is RATE. The scheme is second order: halving this quarters the error (9.27e-5 · 2.32e-5 · 5.80e-6 against the reference at 0.2 · 0.1 · 0.05)';
  rA.appendChild(dtSeg.root);

  const rB = el('div', 'row', box);
  const ampK = knob({ label: 'AMPLITUDE', min: 0, max: 0.2, value: 0.02, step: 0.001, fmt: (v) => v.toFixed(3) + ' Eh/a₀', onInput: (v) => { amplitude = v; reset(); refresh(); } });
  ampK.root.title = 'the peak electric field E₀ in atomic units. 0.02 is the reference pulse: weak, a Rabi angle of 0.30 rad';
  rB.appendChild(ampK.root);
  const omK = knob({ label: 'ω', min: 0.05, max: 2, value: 0.3929175, log: true, fmt: (v) => v.toFixed(4) + ' Eh', onInput: (v) => { omega = v; reset(); refresh(); } });
  omK.root.title = 'the carrier frequency. RESONANT sets it to the field-free gap E₁ − E₀ at this R and basis';
  rB.appendChild(omK.root);
  const durK = knob({ label: 'DURATION', min: 6, max: 200, value: 48, log: true, fmt: (v) => v.toFixed(0) + ' a.u.', onInput: (v) => { duration = v; reset(); refresh(); } });
  durK.root.title = 'the sin² envelope\'s full width. The run is this long, then an equal tail of FREE evolution, so the default ends at t = 96';
  rB.appendChild(durK.root);
  const phK = knob({ label: 'PHASE', min: -Math.PI, max: Math.PI, value: 0, fmt: (v) => (v / Math.PI).toFixed(2) + 'π', onInput: (v) => { phase = v; reset(); refresh(); } });
  phK.root.title = 'the carrier–envelope phase φ in cos(ωu + φ). It is a real physical parameter of a short pulse, not a cosmetic offset';
  rB.appendChild(phK.root);

  const rC = el('div', 'row tight', box);
  rC.appendChild(trig({ label: 'FIRE', title: 'arm the drive at the lab clock\'s current time and let the pulse run with it — the drive\'s t is t_lab − t₀ in the same atomic units', onFire: () => fire() }).root);
  rC.appendChild(trig({ label: 'HOLD', title: 'stop advancing; the state stays exactly where the drive left it', onFire: () => { held = true; refresh(); } }).root);
  rC.appendChild(trig({ label: 'RESET', title: 'throw the run away and go back to the field-free ground state at this R', onFire: () => { reset(); refresh(); } }).root);
  rC.appendChild(trig({ label: 'RESONANT', title: 'set ω to the field-free gap E₁ − E₀ at this R and basis — 0.3929 at the 1s LCAO, R = 2', onFire: () => { omega = gap(); omK.set(omega); reset(); refresh(); } }).root);

  const cv = el('canvas', 'mol-c', box);
  const g = cv.getContext('2d');
  let rect = null, hovers = [];
  const hover = graphHover(cv, { repaint: () => paint(), plot: () => rect });

  const rr = el('div', 'row tight', box);
  const roP = readout({ label: 'POPULATION OUT OF THE GROUND STATE', value: '—', sub: '' });
  const roZ = readout({ label: '⟨z⟩  (a₀)', value: '—', sub: '' });
  const roE = readout({ label: 'ABSORBED  ⟨H₀⟩ − ⟨H₀⟩₀  (hartree)', cls: 'wide', value: '—', sub: '' });
  rr.appendChild(roP.root); rr.appendChild(roZ.root); rr.appendChild(roE.root);
  const lab = el('div', 'sturm-note', box);                 // the LABEL line: its own class, so the ⓘ sweep cannot fold the one sentence that says what this is
  lab.textContent = LABEL;
  el('div', 'note', box).innerHTML = '<b>The molecule in a laser pulse.</b> A sin² envelope on a cosine carrier, E(t) = E₀sin²(πu/D)cos(ωu + φ), enters the Hamiltonian in the <b>length gauge</b> as H₀ + E(t)z — the electron\'s charge is −1, so a positive field pushes it toward −z, which is exactly <b>kick.js</b>\'s own impulsive Stark limit (Δp = −∫E dt). The propagator is the <b>exponential midpoint</b>: the full generalised eigenproblem is re-solved at every distinct field value, including the g/u coupling the field creates, and the state is carried forward with no renormalisation anywhere — <b>c†Sc is conserved by the equation itself</b> and is reported, not repaired. <b>It is second order in Δt and that is the claim that matters</b>: against an independent DOP853 integration the worst amplitude error is 9.27e-5, 2.32e-5 and 5.80e-6 at Δt = 0.2, 0.1 and 0.05 — <b>halving Δt quarters it</b>, twice, and a scheme that ran without that would be moving rather than working. The <b>absorbed energy</b> is shown against its own work integral ∫Ė⟨z⟩dt, which the identity d⟨H₀⟩/dt = −E d⟨z⟩/dt makes exact: the two are computed on the same trace by different routes, so their difference measures the scheme (5.4e-7 at Δt = 0.05, and second order down to 8.4e-9 at 0.00625). Numbers to land on, at R = 2 with the shipped pulse: <b>0.0852227 out of the ground state and ⟨z⟩ = −0.0170653 at t = 96</b>, an absorbed 3.3487e-2 hartree, and an S-norm that has not moved by 1e-12. The <b>Sturmian n ≤ 3</b> basis runs the same pulse in twelve functions and stays S-unitary to 2e-10. Everything here is <b>fixed nuclei, one electron, no ionisation and no continuum</b>: population that would leave the molecule has nowhere to go but the highest function in the basis, and the basis is the approximation.';

  /* ── the run ────────────────────────────────────────────────────────────────────────────────────────────────── */
  function gap() { const sol = basis().solve(R); return sol.E[1] - sol.E[0]; }
  function pulseObj() { return { amplitude, omega, duration, phase, start: 0 }; }
  function reset() { run = null; held = false; rewound = false; behind = 0; lastMs = 0; paint(); }
  function fire() {
    mo = basis();
    try { run = createPulseRun(mo, { R, pulse: pulseObj(), dt }); } catch (e) { run = null; roP.set('—', 'warn'); roP.setSub(String(e && e.message || e)); return; }
    t0 = api.now ? api.now() : 0; held = false; rewound = false; behind = 0;
    refresh();
  }
  /** ONE frame's share: step until the drive has caught the lab clock, the run ends, or 6 ms have gone */
  function update(t) {
    if (!run || held || run.done) return;
    const want = t - t0;
    if (want < run.t - 1e-9) { rewound = true; refresh(); return; }              // scrubbed BACK: a driven state cannot be un-integrated
    rewound = false;
    const a = performance.now();
    /* WHOLE STEPS ONLY, AND NEVER PAST THE CLOCK.  A chunk of a fixed size overshoots by up to a chunk — the drive
       would read AHEAD of the time it is supposed to be showing — so the count is floored to the steps that FIT,
       and the drive lags the clock by less than one Δt, which is the most an integrator on a grid can promise. */
    while (!run.done && performance.now() - a < BUDGET_MS) {
      const need = Math.floor((want - run.t) / dt + 1e-9);
      if (need < 1) break;
      run.advance(Math.min(64, need));
    }
    lastMs = performance.now() - a;
    behind = Math.max(0, Math.min(want, run.total) - run.t);
    refresh();
  }
  function refresh() {
    if (!run) {
      const y = KINDS[kind].n === 2 ? rabiRWA(basis(), R, pulseObj()) : null;
      roP.set('—', ''); roP.setSub(`armed: ${KINDS[kind].label}, ${basis().n} functions at R = ${R.toFixed(2)} · gap E₁ − E₀ = ${gap().toFixed(6)} Eh${y ? ` · RWA area ${y.area.toFixed(4)} rad predicts ${y.population.toFixed(6)}` : ''}`);
      roZ.set('—', ''); roZ.setSub('press FIRE: the pulse runs on the lab clock from that moment');
      roE.set('—', ''); roE.setSub(`E₀ ${amplitude.toFixed(3)} · ω ${omega.toFixed(4)} · D ${duration.toFixed(0)} · φ ${(phase / Math.PI).toFixed(2)}π · Δt ${dt} → ${Math.round(duration * 2 / dt)} steps over ${(duration * 2).toFixed(0)} a.u.`);
      paint(); return;
    }
    const s = run.read();
    roP.set(s.popOut.toFixed(7), s.done ? 'ok' : 'live');
    roP.setSub(`t = ${s.t.toFixed(2)} / ${s.total.toFixed(0)} a.u. · step ${s.steps} of ${s.N} at Δt = ${dt} · ground ${s.popGround.toFixed(7)}${rewound ? ' · HELD: the clock went back and a driven state cannot be un-integrated — RESET to re-arm' : behind > 1e-6 ? ` · ${behind.toFixed(2)} a.u. behind the clock (${lastMs.toFixed(1)} ms of budget spent)` : ''}`);
    roZ.set(s.z.toFixed(7), Math.abs(s.z) > 1e-9 ? 'ok' : '');
    roZ.setSub(`electron dipole ${s.electronDipole.toFixed(6)} · E(t) = ${s.field.toFixed(6)} · S-norm ${s.norm.toFixed(12)} (drift ${s.normDrift.toExponential(2)}, nothing renormalised)`);
    roE.set(s.absorbed.toExponential(6), Math.abs(s.balance) < 1e-5 ? 'ok' : 'warn');
    roE.setSub(`= ∫Ė⟨z⟩dt ${s.work.toExponential(6)} to ${s.balance.toExponential(2)} — the same trace by two routes, so the gap is the SCHEME (second order in Δt) · instantaneous total ${s.instantaneousTotal.toFixed(8)} Eh`);
    paint();
  }

  /* ── the trace ──────────────────────────────────────────────────────────────────────────────────────────────── */
  function paint() {
    const W = cv.clientWidth, H = cv.clientHeight, dpr = Math.min(2, window.devicePixelRatio || 1);
    if (W < 32 || H < 32) return;
    if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
    g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
    const L = 40, Rt = W - 10, Tp = 12;
    g.font = '8px ui-monospace, monospace';
    const CAP = 'E(t)/E₀ · population out of the ground state · ⟨z⟩, each to its own scale';
    const capLines = []; { let ln = '';
      for (const word of CAP.split(' ')) { const nx = ln ? ln + ' ' + word : word; if (ln && g.measureText(nx).width > Rt - L) { capLines.push(ln); ln = word; } else ln = nx; }
      if (ln) capLines.push(ln); }
    const Bt = H - 6 - capLines.length * 9;
    const T = themeInk(g);
    rect = { x0: L, y0: Tp, x1: Rt, y1: Bt }; hovers = [];
    const total = run ? run.total : duration * 2;
    const x = (t) => L + (t / total) * (Rt - L), mid = (Tp + Bt) / 2;
    g.strokeStyle = T.ink(0.3); g.setLineDash([2, 3]); g.beginPath(); g.moveTo(L, mid); g.lineTo(Rt, mid); g.stroke(); g.setLineDash([]);
    g.font = '9px ui-monospace, monospace'; g.textBaseline = 'middle'; g.textAlign = 'right';
    g.fillStyle = T.ink(0.7); g.fillText('0', L - 3, mid);
    const tr = run ? run.trace : [];
    if (tr.length > 1) {
      /* the three spans are computed ONCE per paint, not once per point: a scale read inside the plotting loop is
         an O(n²) sweep of a 600-point trace on every frame, which is the kind of thing that never shows up until
         the card is open beside twenty other readers */
      let spanPop = 0, spanZ = 0;
      for (const p of tr) { const a = Math.abs(p.popOut), b = Math.abs(p.z); if (a > spanPop) spanPop = a; if (b > spanZ) spanZ = b; }
      spanPop = spanPop || 1; spanZ = spanZ || 1;
      const lanes = [['E(t)/E₀', 1, (p) => p.field / (amplitude || 1), 'the driving field, scaled to its own peak'],
        [KINDS[kind].n === 2 ? 'popU' : '1 − p₀', 2, (p) => p.popOut / spanPop, 'the population that left the ground state'],
        ['⟨z⟩', 4, (p) => p.z / spanZ, 'the electron\'s position along the bond, in a₀']];
      for (const [name, ni, val, what] of lanes) {
        const rgb = nRGB(ni), col = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0.95)`, pts = [];
        g.strokeStyle = col; g.lineWidth = 1.4; g.beginPath();
        tr.forEach((p, i) => { const px = x(p.t), py = mid - val(p) * (Bt - Tp) * 0.46; pts.push(px, py); if (i === 0) g.moveTo(px, py); else g.lineTo(px, py); });
        g.stroke();
        const last = tr[tr.length - 1];
        hovers.push({ kind: 'curve', key: name, points: pts, lw: 1.4, colour: col,
          info: `${name} — ${what}  ·  at t = ${last.t.toFixed(2)} a.u.  ${name === '⟨z⟩' ? last.z.toFixed(6) + ' a₀' : name.startsWith('E') ? last.field.toFixed(6) + ' Eh/a₀' : last.popOut.toFixed(7)}` });
      }
      g.strokeStyle = T.ink(0.5); g.beginPath(); g.moveTo(x(tr[tr.length - 1].t), Tp); g.lineTo(x(tr[tr.length - 1].t), Bt); g.stroke();
    }
    g.strokeStyle = T.ink(0.35); g.setLineDash([1, 3]); g.beginPath(); g.moveTo(x(duration), Tp); g.lineTo(x(duration), Bt); g.stroke(); g.setLineDash([]);
    g.fillStyle = T.ink(0.75); g.textAlign = 'center'; g.font = '8px ui-monospace, monospace';
    fitText(g, 'pulse ends', x(duration), Tp + 5, { x0: L, y0: 0, x1: Rt, y1: Bt }, 'center', true);
    g.textAlign = 'left'; g.textBaseline = 'alphabetic'; g.fillStyle = T.ink(0.8);
    capLines.forEach((t, i) => fitText(g, t, L, H - 3 - (capLines.length - 1 - i) * 9, { x0: 4, y0: 0, x1: W - 4, y1: H }, 'left', true));
    hover.set(hovers, rect);
  }

  /** the copyable digest rows, appended to the MOLECULE window's own */
  function table() {
    const rows = ['THE PULSE  ·  E(t) = E₀ sin²(πu/D) cos(ωu + φ)  ·  length gauge, +E z for a charge of −1',
      `basis\t${KINDS[kind].label}\t${basis().n} functions`, `R (fixed)\t${R.toFixed(4)}`,
      `E₀ · ω · D · φ\t${amplitude.toFixed(4)}\t${omega.toFixed(7)}\t${duration.toFixed(2)}\t${phase.toFixed(4)}`,
      `Δt\t${dt}`, `gap E₁ − E₀\t${gap().toFixed(9)}`, `label\t${LABEL}`];
    if (KINDS[kind].n === 2) { const y = rabiRWA(basis(), R, pulseObj()); rows.push(`RWA ⟨0|z|1⟩ · area · sin²\t${y.dipole.toFixed(9)}\t${y.area.toFixed(6)}\t${y.population.toFixed(8)}`); }
    if (run) { const s = run.read();
      rows.push('', `t\t${s.t.toFixed(4)}`, `steps\t${s.steps} of ${s.N}`, `population out of the ground state\t${s.popOut.toFixed(9)}`,
        `⟨z⟩\t${s.z.toFixed(9)}`, `absorbed ⟨H₀⟩ − ⟨H₀⟩₀\t${s.absorbed.toExponential(8)}`,
        `∫Ėdt⟨z⟩\t${s.work.toExponential(8)}`, `balance\t${s.balance.toExponential(3)}`,
        `S-norm\t${s.norm.toFixed(14)}`, `norm drift\t${s.normDrift.toExponential(3)}`); }
    return rows.join('\n');
  }

  window.addEventListener('resize', () => paint());
  refresh();
  return {
    update, refresh, paint, table,
    api: { fire, reset, hold: () => { held = true; refresh(); }, get held() { return held; }, get rewound() { return rewound; },
      setBasis(k) { if (!KINDS[k]) return false; kind = k; kindSeg.set(k); reset(); refresh(); return true; }, get basisKind() { return kind; },
      setR(v) { R = v; rKnob.set(v); reset(); refresh(); return R; }, get R() { return R; },
      setDt(v) { dt = +v; dtSeg.set(String(v)); reset(); refresh(); return dt; }, get dt() { return dt; },
      setPulse(o = {}) { if (o.amplitude !== undefined) { amplitude = +o.amplitude; ampK.set(amplitude); } if (o.omega !== undefined) { omega = +o.omega; omK.set(omega); } if (o.duration !== undefined) { duration = +o.duration; durK.set(duration); } if (o.phase !== undefined) { phase = +o.phase; phK.set(phase); } reset(); refresh(); return pulseObj(); },
      get pulse() { return pulseObj(); }, gap, resonant() { omega = gap(); omK.set(omega); reset(); refresh(); return omega; },
      /** run the whole schedule NOW, off the clock — the proof's road, and the only one that ignores the budget */
      runAll() { if (!run) fire(); if (!run) return null; run.advance(1e7); refresh(); return run.read(); },
      state() { const common = { kind, n: basis().n, label: LABEL, dt, R, pulse: pulseObj(), gap: gap(), held, rewound, behind };
        return run ? Object.assign(run.read(), common, { armed: true }) : Object.assign({ armed: false, t: 0, steps: 0 }, common); },
      get trace() { return run ? run.trace : []; }, digest: table },
  };
}
