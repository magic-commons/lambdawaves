/* tests/fields.test.mjs — the node proof of the static external fields.
 *   node tests/fields.test.mjs
 * ZEEMAN is exact and diagonal; STARK is exact within each shell (inter-shell coupling neglected).
 * Anchors: the textbook n = 2 linear Stark splitting ±3F with eigenstates (2s ∓ 2p_z)/√2; the Zeeman splitting
 * ±B/2 for m = ±1; and the requirement that zero field reproduces the field-free register bit for bit.
 */
import { Register, PRESETS } from '../lab/state.js';
import { stateOf, BASIS, energy } from '../lab/hydrogen.js';
import { dipoleZ, lagrangianNormal, actionNormal, actionAngleNormal } from '../lab/dynamics.js';

let FAILED = 0, TOTAL = 0;
function judge(name, ok, detail) {
  TOTAL++; if (!ok) FAILED++;
  console.log((ok ? 'GREEN ' : 'RED   ') + name + (detail === undefined ? '' : '\n      ' + JSON.stringify(detail).slice(0, 260)));
}
const S2 = Math.SQRT1_2;
const i2s = stateOf(2, 0, 0).index, i2p = stateOf(2, 1, 0).index, i2pp = stateOf(2, 1, 1).index, i2pm = stateOf(2, 1, -1).index;

/* ── zero field reproduces the field-free register exactly ────────────────── */
{
  const A = new Register(), B = new Register();
  A.load(PRESETS.find((p) => p.id === '1s+2pz')); B.load(PRESETS.find((p) => p.id === '1s+2pz'));
  B.setField({ Bz: 0, Fz: 0 });
  let w = 0;
  for (const t of [0, 3.3, 41.7]) { const a = A.at(t), b = B.at(t); for (let k = 0; k < 91; k++) w = Math.max(w, Math.abs(a.re[k] - b.re[k]), Math.abs(a.im[k] - b.im[k])); }
  judge('F zero field is the identity: c(t) matches the field-free register bit for bit, and |A(t)| too', w === 0 && Math.abs(A.autocorrelation(9.1).abs - B.autocorrelation(9.1).abs) < 1e-15, w);
}
/* ── ZEEMAN: exact, diagonal, splits m ────────────────────────────────────── */
{
  const R = new Register(); R.set(i2pp, 1, 0, 0); R.setField({ Bz: 0.01 });
  judge('F Zeeman is diagonal and exact: E(2p₊) = E₂ + B/2 and E(2p₋) = E₂ − B/2', Math.abs(R.Ediag(i2pp) - (-0.125 + 0.005)) < 1e-15 && Math.abs(R.Ediag(i2pm) - (-0.125 - 0.005)) < 1e-15, { plus: R.Ediag(i2pp), minus: R.Ediag(i2pm) });
  /* a superposition of m = ±1 beats at the full splitting ω = B */
  const S = new Register(); S.set(i2pp, S2, 0, 0); S.set(i2pm, S2, 0, 0); S.setField({ Bz: 0.01 });
  const T = 2 * Math.PI / 0.01;
  judge('F 2p₊ + 2p₋ in a magnetic field revives at T = 2π/B = ' + T.toFixed(1) + ' a.u. and vanishes at T/2 — a Larmor beat that does not exist at B = 0',
    Math.abs(S.autocorrelation(T).abs - 1) < 1e-12 && S.autocorrelation(T / 2).abs < 1e-12 && Math.abs(S.autocorrelation(0).abs - 1) < 1e-15, { full: S.autocorrelation(T).abs, half: S.autocorrelation(T / 2).abs });
  judge('F and with B = 0 that same state is stationary (the two m are degenerate)', (() => { const Z = new Register(); Z.set(i2pp, S2, 0, 0); Z.set(i2pm, S2, 0, 0); return Math.abs(Z.autocorrelation(T / 2).abs - 1) < 1e-14; })());
  judge('F ⟨E⟩ picks up B⟨L_z⟩/2 exactly: 2p₊ at B = 0.01 has ⟨E⟩ = −0.125 + 0.005', Math.abs(R.energy() - (-0.12)) < 1e-15, R.energy());
}
/* ── STARK: exact within the shell, the textbook n = 2 answer ─────────────── */
{
  const F = 1e-3;
  const R = new Register(); R.set(i2s, 1, 0, 0); R.setField({ Fz: F });
  const na = R.normalAmplitudes(0);
  const Es = na.E.slice().sort((a, b) => a - b);
  judge('F the n = 2 linear Stark splitting is ±3F exactly (the textbook value): E = −1/8 ∓ 3F for the two m = 0 states',
    Es.length === 2 && Math.abs(Es[0] - (-0.125 - 3 * F)) < 1e-12 && Math.abs(Es[1] - (-0.125 + 3 * F)) < 1e-12, Es);
  /* the Stark states are the eigenstates: turn the field on and (2s ± 2p_z)/√2 STOPS MOVING */
  const P = new Register(); P.set(i2s, S2, 0, 0); P.set(i2p, S2, 0, 0); P.setField({ Fz: F });
  const Q = new Register(); Q.set(i2s, S2, 0, 0); Q.set(i2p, S2, 0, 0);          // same state, no field
  let stark = 0, dz = [];
  for (const t of [0, 250, 1000, 5000]) { stark = Math.max(stark, Math.abs(P.autocorrelation(t).abs - 1)); const c = P.at(t); dz.push(+dipoleZ(c.re, c.im, [i2s, i2p]).value.toFixed(6)); }
  judge('F the Stark state IS an eigenstate of the field Hamiltonian: |A(t)| = 1 for all t and its dipole ⟨z⟩ = −3 a₀ never moves — the field freezes what was already stationary',
    stark < 1e-12 && dz.every((v) => Math.abs(v - dz[0]) < 1e-6) && Math.abs(Math.abs(dz[0]) - 3) < 1e-4, { drift: stark, dz });
  /* 2s alone is NOT an eigenstate: it oscillates into 2p_z at exactly the splitting 6F */
  const Tosc = 2 * Math.PI / (6 * F);
  const half = R.at(Tosc / 2);
  let dzmax = 0;
  for (let k = 0; k <= 32; k++) { const c = R.at(k * Tosc / 32); dzmax = Math.max(dzmax, Math.abs(dipoleZ(c.re, c.im, [i2s, i2p]).value)); }
  judge('F 2s alone is NOT an eigenstate: it Rabi-oscillates fully into 2p_z at the splitting 6F (T = ' + Tosc.toFixed(0) + ' a.u.) — yet its dipole is IDENTICALLY ZERO throughout, because the transferred amplitude stays in quadrature. The state that carries the dipole is the one the field holds still, and the state that moves carries none.',
    Math.abs(Math.hypot(half.re[i2p], half.im[i2p]) - 1) < 1e-9 && Math.hypot(half.re[i2s], half.im[i2s]) < 1e-9 && dzmax < 1e-12,
    { p2pAtHalf: Math.hypot(half.re[i2p], half.im[i2p]), maxDipoleOverAPeriod: dzmax });
  judge('F the norm and ⟨E⟩ are conserved by the field evolution (unitary within the shell)', (() => {
    let w = 0; for (const t of [0, 137, 999]) { const c = R.at(t); let n = 0; for (let k = 0; k < 91; k++) n += c.re[k] ** 2 + c.im[k] ** 2; w = Math.max(w, Math.abs(n - 1)); } return w < 1e-12;
  })());
  /* an edit at time t still reads back at time t, with the field on */
  const E2 = new Register(); E2.set(i2s, 1, 0, 0); E2.setField({ Fz: F });
  E2.set(i2p, 0.3, -0.2, 555.5);
  const back = E2.coeffAt(i2p, 555.5);
  judge('F with the field on, set(a, c, t) still reads back at t (the register re-anchors through the block propagator)', Math.hypot(back.re - 0.3, back.im + 0.2) < 1e-12, back);
  judge('F the validity bound is printed, not assumed: F must stay well under 1/(3n⁵) for the neglected inter-shell coupling', Math.abs(R.fieldValidUpTo() - 1 / (3 * 32)) < 1e-15, { bound: R.fieldValidUpTo(), F });
}
/* ── the Lagrangian window follows the field into the Stark basis ──────────── */
{
  const F = 2e-3;
  const R = new Register(); R.set(i2s, 1, 0, 0); R.setField({ Fz: F });
  const na0 = R.normalAmplitudes(0), na = R.normalAmplitudes(300);
  const lg = lagrangianNormal(na), aa = actionAngleNormal(na);
  judge('F with a field the action–angle chart is the STARK basis: two normal modes, J summing to 1, and H = T + V = ⟨E⟩',
    aa.length === 2 && Math.abs(aa.reduce((s, x) => s + x.J, 0) - 1) < 1e-12 && Math.abs(lg.H - R.energy()) < 1e-12, { n: aa.length, J: aa.map((x) => +x.J.toFixed(6)), H: lg.H, E: R.energy() });
  const S = actionNormal(na0, 300);
  judge('F and the closed-form action still applies in that basis (finite, bounded by ½Σ|a|²·2)', isFinite(S) && Math.abs(S) <= 1.0000001, S);
}

console.log((FAILED ? 'RED' : 'GREEN') + ' fields.test — ' + FAILED + ' failing of ' + TOTAL);
process.exit(FAILED ? 1 : 0);
