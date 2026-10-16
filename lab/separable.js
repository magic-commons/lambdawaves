/* separable.js — SEPARABLE (0.9.4 S1): THE CARTESIAN OSCILLATORS, the first system the register plays that is not central.  V = ½Σωᵢ²xᵢ², ħ = m = 1:
 *     ψ = ∏ᵢ (ωᵢ/π)^{1/4}/√(2^{nᵢ} nᵢ!) · H_{nᵢ}(√ωᵢ xᵢ) e^{−ωᵢxᵢ²/2},     E = Σ ωᵢ(nᵢ + ½).
 * THE LABELS: the 91 slots carry the 56 triples with N = n_x + n_y + n_z ≤ 5, by energy then lexicographically (re-sorted when ω moves); slots 56–90 are
 * UNUSED HERE — energy NaN, a zero record, "unused here" in the lane (CENTRAL's BOUND law).  THE RECORD for the kernel's space 7 (field.js) rides the packer's
 * own seats: (n, l, am, m) = (n_x, n_y, n_z, 0) is nlm, lag[0..2] = √ωᵢ is lag0.xyz, expo is c.w = the form (0 the oscillator; S2's cube 1, its L in lag0.w).
 * THE CUBE (S2): a box of side L, hard walls: ψ = (2/L)^{3/2} ∏ᵢ sin(nᵢπ(xᵢ/L + ½)), nᵢ ≥ 1, E = π²Σnᵢ²/(2L²) hartree; the 54 triples with Σnᵢ² ≤ 29 (whole
 * levels: the 56th would split the (1,2,5) sixfold); c.w = 1, lag0 = (nᵢπ/L, L).  No worker op: nothing is solved.  STATUS: EXACT. */
import { BASIS, BASIS_INDEX } from './hydrogen.js'; import { el, knob, readout, stepper } from './mir/kit.js';
export const FORMS = { iso: ['ISOTROPIC', [1, 1, 1]], flat: ['2-D', [1, 1, 4]], aniso: ['ANISOTROPIC', [1, 1.5, 2.25]], cube: ['CUBE', [1, 1, 1]] };
const TRIPLES = []; for (let N = 0; N <= 5; N++) for (let x = 0; x <= N; x++) for (let y = 0; x + y <= N; y++) TRIPLES.push([x, y, N - x - y]);
const sq = (t) => t[0] * t[0] + t[1] * t[1] + t[2] * t[2], CUBES = []; for (let x = 1; x < 6; x++) for (let y = 1; y < 6; y++) for (let z = 1; z < 6; z++) if (sq([x, y, z]) < 30) CUBES.push([x, y, z]);
const RGB = [[255, 255, 255], [255, 190, 90], [120, 225, 240], [200, 140, 255], [140, 240, 160], [255, 120, 150]];   // the oscillator's shell colours, by N
const fact = (n) => (n < 2 ? 1 : n * fact(n - 1)), sum = (t) => t[0] + t[1] + t[2], sig = (t) => (form === 'cube' ? t.slice().sort().join() : sum(t));   // a level's members share sig, else it is mixed
let form = 'iso', W = [1, 1, 1], L = 12, NL = 56, LABELS = [], LE = [], KEY = [], GROUPS = [];
const tabs = new Map();
export let SEP = null;   // the card: the one handle (the app literal never gains a key)
/** the form, its ω and the cube's L (absent or not positive: the form's own, L = 12 a₀); LABELS re-sorted by energy, the levels regrouped to 1e-9, the records re-made */
export function configure(f, w, l) {
  form = FORMS[f] ? f : 'iso'; W = w && w.every((v) => v > 0) ? w.map(Number) : FORMS[form][1].slice(); L = l > 0 ? +l : 12;
  const E = (t) => (form === 'cube' ? (Math.PI ** 2 * sq(t)) / (2 * L * L) : t.reduce((s, n, i) => s + W[i] * (n + 0.5), 0));
  LABELS = (form === 'cube' ? CUBES : TRIPLES).slice().sort((p, q) => (Math.abs(E(p) - E(q)) > 1e-9 ? E(p) - E(q) : p[0] - q[0] || p[1] - q[1] || p[2] - q[2])); NL = LABELS.length; LE = LABELS.map(E); GROUPS = [];
  KEY = LE.map((e, a) => { const g = GROUPS[GROUPS.length - 1]; if (!g || e - g.E > 1e-9) GROUPS.push({ E: e, t: LABELS[a], deg: 0 }); const h = GROUPS[GROUPS.length - 1]; h.deg++; h.mixed ||= sig(LABELS[a]) !== sig(h.t); return GROUPS.length - 1; });
  tabs.clear(); if (SEP) SEP.sync();
}
configure('iso');
export const save = () => (form === 'iso' && W.every((w) => w === 1) && L === 12 ? undefined : { form, wx: W[0], wy: W[1], wz: W[2], L });
export const load = (r) => configure(r && r.form, r && [r.wx, r.wy, r.wz], r && r.L);
const energy = (a) => (a < NL ? LE[a] : NaN);
export const labelOf = (s) => { const a = s.index ?? BASIS_INDEX.get(`h:${s.n}:${s.l}:${s.m}`); return a < NL ? 'n_x n_y n_z = ' + LABELS[a].join(' ') : 'unused here'; };   // a bare { n, l, m } too (latex-state)
/** the kernel record of slot s (a zero one past NL); the cube's: c.w = expo = 1, lag = (nᵢπ/L, L) */
export function tableFor(s) {
  let T = tabs.get(s.index); if (T) return T; const t = LABELS[s.index] || [0, 0, 0];
  const cube = form === 'cube', norm = s.index < NL ? (cube ? (2 / L) ** 1.5 : t.reduce((p, n, i) => p * (W[i] / Math.PI) ** 0.25 / Math.sqrt(2 ** n * fact(n)), 1)) : 0;
  tabs.set(s.index, (T = { n: t[0], l: t[1], m: 0, am: t[2], norm, expo: +cube, lag: cube ? [...t.map((n) => (n * Math.PI) / L), L, 0, 0] : [...W.map(Math.sqrt), 0, 0, 0], leg: [1, 0, 0, 0, 0, 0], space: 'separable' })); return T;
}
/** H_n(x) by the kernel's own recurrence H_{k+1} = 2xH_k − 2kH_{k−1} */
const herm = (n, x) => { let a = 1, b = 2 * x; if (!n) return a; for (let k = 1; k < n; k++) [a, b] = [b, 2 * x * b - 2 * k * a]; return b; };
/** ψ(x) = Σ c_a ψ_a(x): the CPU twin of space 7 (the cube's sines behind expo, zero outside |xᵢ| < L/2) */
export function psiAt(re, im, x, y, z, ids) {
  let R = 0, I = 0; for (const a of ids) { if (!re[a] && !im[a]) continue; const T = tableFor(BASIS[a]), p = [x, y, z], u = p.map((v, i) => T.lag[i] * v), h = T.lag[3] / 2;
    const f = T.expo ? (p.every((v) => Math.abs(v) < h) ? u.reduce((s, v, i) => s * Math.sin(v + T.lag[i] * h), T.norm) : 0) : T.norm * herm(T.n, u[0]) * herm(T.l, u[1]) * herm(T.am, u[2]) * Math.exp(-0.5 * (u[0] * u[0] + u[1] * u[1] + u[2] * u[2])); R += re[a] * f; I += im[a] * f; }
  return { re: R, im: I };
}
/** the box: the widest classical turning point √((2nᵢ + 1)/ωᵢ) of the slots the register's nmax reaches, plus three widths; the cube's walls and 5 % */
const domainFor = (nmax) => { if (form === 'cube') return 0.525 * L; let r = 0; for (let a = 0; a < NL; a++) if (BASIS[a].n <= nmax) LABELS[a].forEach((n, i) => { r = Math.max(r, Math.sqrt((2 * n + 1) / W[i])); }); return r + 3; };
const levelName = (g) => form === 'cube' ? (g.mixed ? 'Σn²' + sq(g.t) : '(' + g.t + ')') + (g.deg > 1 ? ' ×' + g.deg : '') : (g.deg > 1 ? (g.mixed ? 'E' + +g.E.toFixed(2) : 'N' + sum(g.t)) + ' ×' + g.deg : g.t.join(''));   // a level of one N names it; a mixed one its E
export const SEPARABLE = {
  id: 'separable', get label() { return form === 'cube' ? `SEPARABLE  CUBE  hard walls  L = ${+L.toFixed(2)} a₀` : `SEPARABLE  ${FORMS[form][0]}  ½Σωᵢ²xᵢ²  ω = (${W.map((w) => +w.toFixed(3)).join(', ')})`; },
  short: 'SEP', get unit() { return form === 'cube' ? 'hartree' : 'ħω'; }, lengthUnit: 'a₀',
  energy, radial: () => 0, tableFor, momentumTableFor: tableFor, psiAt, phiAt: psiAt, domainFor, domainForP: domainFor,   // radial 0: the spherical readers stand down (separable)
  kernelSpace: { x: 7, p: 7 }, stark: false, hydrogenTheorems: false, noMomentum: true, separable: true, labelOf,
  get spectrum() { return { levels: GROUPS.map((g, k) => ({ key: k, E: g.E, label: levelName(g), rgb: RGB[(form === 'cube' ? k : sum(g.t)) % 6] })), levelKey: (a) => (a < NL ? KEY[a] : -1),
    Emin: 0, Etop: GROUPS[GROUPS.length - 1].E * 1.08, topLabel: '', nan: 'unused here', footer: `EIGENVALUE  E = ${form === 'cube' ? 'π²Σnᵢ²/(2L²)' : 'Σ ωᵢ(nᵢ + ½)'} · ${NL} of 91 labels · ${91 - NL} unused here` }; },
};
/** THE CARD: the FORM stepper, ω_x ω_y ω_z (the cube: L), the readout.  api = { apply(id) } — a change reconfigures and re-applies, so the register re-reads its energies */
export function createSeparable(host, api) {
  const step = stepper({ aria: 'Separable form', items: Object.entries(FORMS).map(([id, F]) => ({ id, label: F[0] })), value: form, cls: 'mol-step', onChange: (id) => pick(id, FORMS[id][1]) });
  const r1 = el('div', 'row', host), ro = readout({ label: 'LEVELS · DEGENERACY', value: '—', cls: 'wide' }); host.prepend(step.root);
  const kn = [...'xyz'].map((c, i) => knob({ label: 'ω_' + c, min: 0.5, max: 4, value: W[i], fmt: (v) => v.toFixed(2), onInput: (v) => pick(form, W.map((w, j) => (j === i ? v : w))) }));
  const kL = knob({ label: 'L', min: 4, max: 30, value: L, fmt: (v) => v.toFixed(1) + ' a₀', onInput: (v) => pick(form, W, v) });
  r1.append(...kn.map((k) => k.root), kL.root, ro.root);
  el('div', 'note', host).innerHTML = '<b>Separable.</b> V = ½(ω<sub>x</sub>²x² + ω<sub>y</sub>²y² + ω<sub>z</sub>²z²): each state is a product of three 1-D oscillators, labelled n<sub>x</sub> n<sub>y</sub> n<sub>z</sub>. The 56 triples with N ≤ 5 fill the register by energy; the other 35 labels are unused here. The slap and the radial tiles stand down: their integrals are spherical.'
    + ' <b>Cube.</b> A box of side L with hard walls: ψ ∝ ∏ sin(n<sub>i</sub>π(x<sub>i</sub>/L + ½)), n<sub>i</sub> ≥ 1, E = π²Σn<sub>i</sub>²/(2L²) — the whole levels to Σn<sub>i</sub>² = 29 (54 labels), the (1,1,2) threefold and the (1,2,3) sixfold among them. Its own gas is deferred: SPECTRUM\'s GAS launches into the spherical well.';
  function pick(f, w, l) { configure(f, w, l ?? L); api.apply('separable'); }
  function sync() { step.set(form); kn.forEach((k, i) => { if (k.get() !== W[i]) k.set(W[i]); k.root.style.display = form === 'cube' ? 'none' : ''; }); if (kL.get() !== L) kL.set(L); kL.root.style.display = form === 'cube' ? '' : 'none';
    ro.set(`E₀ = ${+GROUPS[0].E.toFixed(4)} ${SEPARABLE.unit} · ${GROUPS.length} levels of ${NL} labels · lowest shell ×${GROUPS[0].deg} · ${91 - NL} unused here`);
    ro.setSub(GROUPS.slice(0, 8).map((g) => `${+g.E.toPrecision(4)} ${levelName(g)}`).join(' · ') + (GROUPS.length > 8 ? ' · …' : '')); }
  sync();
  return (SEP = { prepare: sync, sync });
}
