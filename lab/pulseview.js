

import { createMO } from './mo.js';
import { createPulseRun, rabiRWA } from './pulse.js';
import { el, seg, knob, trig, readout, group, nRGB, themeInk, graphHover, fitText } from './mir/kit.js';

const KINDS = {
  lcao1s: { label: '1s LCAO', nMax: 1, n: 2, title: 'Two 1s functions: one bonding and one antibonding state' },
  sturmian: { label: 'STURMIAN n ≤ 3', nMax: 3, n: 12, title: 'Twelve Sturmian σ functions with field-coupled parity blocks' },
};
const BUDGET_MS = 6;                    // a frame's share of the drive, and the readout says when it is not enough
const LABEL = 'Finite-basis propagation · exponential midpoint · fixed nuclei · no ionisation continuum';

export function createPulse(host, api = {}) {
  let kind = 'lcao1s', lambda = 1.7611, R = 2, dt = 0.05;
  let amplitude = 0.02, omega = 0.3929175297217954, duration = 48, phase = 0;
  let mo = null, run = null, t0 = 0, held = false, rewound = false, behind = 0, lastMs = 0;
  const cache = new Map();
  const basis = () => { const key = kind + ':' + lambda; if (!cache.has(key)) cache.set(key, createMO({ kind, nMax: KINDS[kind].nMax, lambda })); return cache.get(key); };

  const box = group(host, 'PULSE');
  const rA = el('div', 'row tight', box);
  const kindSeg = seg({ label: 'BASIS', value: 'lcao1s', options: Object.keys(KINDS).map((k) => ({ id: k, label: KINDS[k].label, title: KINDS[k].title })),
    onChange: (v) => { kind = v; reset(); refresh(); } });
  rA.appendChild(kindSeg.root);
  const rKnob = knob({ label: 'R  (a₀)', min: 0.8, max: 6, value: 2, fmt: (v) => v.toFixed(2), onInput: (v) => { R = v; reset(); refresh(); } });
  rKnob.root.title = 'Fixed nuclear separation during the pulse';
  rA.appendChild(rKnob.root);
  const dtSeg = seg({ label: 'Δt  (a.u.)', value: '0.05', options: [{ id: '0.2', label: '0.2' }, { id: '0.1', label: '0.1' }, { id: '0.05', label: '0.05' }, { id: '0.025', label: '0.025' }],
    onChange: (v) => { dt = +v; reset(); refresh(); } });
  dtSeg.root.title = 'Set the integration step';
  rA.appendChild(dtSeg.root);

  const rB = el('div', 'row', box);
  const ampK = knob({ label: 'AMPLITUDE', min: 0, max: 0.2, value: 0.02, step: 0.001, fmt: (v) => v.toFixed(3) + ' Eh/a₀', onInput: (v) => { amplitude = v; reset(); refresh(); } });
  ampK.root.title = 'Peak electric field E₀ in atomic units';
  rB.appendChild(ampK.root);
  const omK = knob({ label: 'ω', min: 0.05, max: 2, value: 0.3929175, log: true, fmt: (v) => v.toFixed(4) + ' Eh', onInput: (v) => { omega = v; reset(); refresh(); } });
  omK.root.title = 'Carrier frequency. RESONANT sets the field-free energy gap.';
  rB.appendChild(omK.root);
  const durK = knob({ label: 'DURATION', min: 6, max: 200, value: 48, log: true, fmt: (v) => v.toFixed(0) + ' a.u.', onInput: (v) => { duration = v; reset(); refresh(); } });
  durK.root.title = 'Set pulse width';
  rB.appendChild(durK.root);
  const phK = knob({ label: 'PHASE', min: -Math.PI, max: Math.PI, value: 0, fmt: (v) => (v / Math.PI).toFixed(2) + 'π', onInput: (v) => { phase = v; reset(); refresh(); } });
  phK.root.title = 'Carrier-envelope phase φ in cos(ωu + φ)';
  rB.appendChild(phK.root);

  const rC = el('div', 'row tight', box);
  rC.appendChild(trig({ label: 'FIRE', title: 'Start the pulse at the current lab time', onFire: () => fire() }).root);
  rC.appendChild(trig({ label: 'HOLD', title: 'Stop the current run', onFire: () => { held = true; refresh(); } }).root);
  rC.appendChild(trig({ label: 'RESET', title: 'Reset to the field-free ground state', onFire: () => { reset(); refresh(); } }).root);
  rC.appendChild(trig({ label: 'RESONANT', title: 'Set ω to the field-free energy gap', onFire: () => { omega = gap(); omK.set(omega); reset(); refresh(); } }).root);

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
  el('div', 'note', box).innerHTML = '<b>Laser pulse.</b> A sin² electric-field envelope drives H₂⁺ in the length gauge. The midpoint propagator updates the selected finite basis at each step; NORM DRIFT and WORK BALANCE show integration error. The model uses fixed nuclei and has no ionisation continuum.';

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
      roP.set('—', ''); roP.setSub(`Ready · ${KINDS[kind].label} · ${basis().n} functions · gap ${gap().toFixed(6)} Eh${y ? ` · RWA ${y.population.toFixed(6)}` : ''}`);
      roZ.set('—', ''); roZ.setSub('Press FIRE to start at the current lab time');
      roE.set('—', ''); roE.setSub(`E₀ ${amplitude.toFixed(3)} · ω ${omega.toFixed(4)} · D ${duration.toFixed(0)} · φ ${(phase / Math.PI).toFixed(2)}π · Δt ${dt}`);
      if (shown()) paint(); return;
    }
    const s = run.read();
    roP.set(s.popOut.toFixed(7), s.done ? 'ok' : 'live');
    roP.setSub(`t ${s.t.toFixed(2)} / ${s.total.toFixed(0)} · step ${s.steps}/${s.N} · ground ${s.popGround.toFixed(7)}${rewound ? ' · RESET required after rewind' : behind > 1e-6 ? ` · ${behind.toFixed(2)} a.u. behind` : ''}`);
    roZ.set(s.z.toFixed(7), Math.abs(s.z) > 1e-9 ? 'ok' : '');
    roZ.setSub(`dipole ${s.electronDipole.toFixed(6)} · field ${s.field.toFixed(6)} · S norm ${s.norm.toFixed(12)} · drift ${s.normDrift.toExponential(2)}`);
    roE.set(s.absorbed.toExponential(6), Math.abs(s.balance) < 1e-5 ? 'ok' : 'warn');
    roE.setSub(`work ${s.work.toExponential(6)} · difference ${s.balance.toExponential(2)} · total ${s.instantaneousTotal.toFixed(8)} Eh`);
    if (shown()) paint();
  }
  /* OPTIMIZATION 2026-09-24 · M6(e): the legacy H₂⁺ card this panel lives in is `hidden` from boot, and paint() would force
     a layout only to read a zero width and return — at construction that was the boot's first full style + layout
     (24–33 ms, measured, once SLICE stopped paying it).  Neither test reads layout; the reveal road repaints through
     graphHover's ResizeObserver, exactly as a card that had no size does today (moleculeview.js has the same guard). */
  function shown() { return cv.isConnected && !cv.closest('[hidden]'); }

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
      save() { return { basis: kind, R, dt, pulse: pulseObj() }; }, load(o = {}) { if (typeof o.basis === 'string') this.setBasis(o.basis); if (Number.isFinite(o.R)) this.setR(o.R); if (Number.isFinite(o.dt)) this.setDt(o.dt); if (o.pulse) this.setPulse(o.pulse); reset(); refresh(); return this.save(); },
      /** run the whole schedule NOW, off the clock — the proof's road, and the only one that ignores the budget */
      runAll() { if (!run) fire(); if (!run) return null; run.advance(1e7); refresh(); return run.read(); },
      state() { const common = { kind, n: basis().n, label: LABEL, dt, R, pulse: pulseObj(), gap: gap(), held, rewound, behind };
        return run ? Object.assign(run.read(), common, { armed: true }) : Object.assign({ armed: false, t: 0, steps: 0 }, common); },
      get trace() { return run ? run.trace : []; }, digest: table },
  };
}
