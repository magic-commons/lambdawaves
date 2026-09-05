/* P3 — HARTREE HELIUM on a radial grid: two 1s electrons, each in the nucleus + the classical electrostatic potential
 * of the other's density.  This is Josh's "dynamics based on classical electrostatics" made exact at the mean-field
 * level: the potential is the Coulomb potential of |ψ|² (P2's theorem), the orbital is the numerical solution.
 * Oracle: for He 1s² the Hartree equation with the self-interaction-free potential IS the Hartree–Fock equation
 * (two opposite spins in one orbital), so E must land on the HF value −2.86168 Eh, ε on −0.91796 Eh.
 * Method: −½u'' + [−Z/r + V_H(r)] u = ε u on r ∈ (0, R], Numerov shooting with bisection on the node count (as the
 * lab's Cornell solver), V_H(r) = (1/r)∫₀^r u² dr' + ∫_r^R u²/r' dr', linear mixing.  E = 2ε − J, J = ∫ u² V_H dr.
 */
const Z = 2, R = 30, N = 6000, h = R / N;
const r = new Float64Array(N + 1); for (let i = 0; i <= N; i++) r[i] = Math.max(1e-9, i * h);
function shoot(V, E, l = 0) {
  const u = new Float64Array(N + 1), k = new Float64Array(N + 1);
  for (let i = 0; i <= N; i++) k[i] = 2 * (V[i] - E) + l * (l + 1) / (r[i] * r[i]);
  u[0] = 0; u[1] = Math.pow(r[1], l + 1); let nodes = 0;
  const f = (i) => 1 - h * h * k[i] / 12;
  for (let i = 1; i < N; i++) { u[i + 1] = ((2 + 10 * h * h * k[i] / 12) * u[i] - f(i - 1) * u[i - 1]) / f(i + 1); if (u[i + 1] * u[i] < 0) nodes++; if (Math.abs(u[i + 1]) > 1e30) for (let j = 0; j <= i + 1; j++) u[j] *= 1e-30; }
  return { u, nodes };
}
function eigen(V, level = 1, lo = -4, hi = 0) {
  for (let it = 0; it < 80; it++) { const mid = (lo + hi) / 2; if (shoot(V, mid).nodes >= level) hi = mid; else lo = mid; if (hi - lo < 1e-11) break; }
  const E = (lo + hi) / 2, s = shoot(V, E), u = s.u;
  let it = N; for (let i = N; i >= 1; i--) if (V[i] < E) { it = i; break; }                       // the turning point
  let cut = N; for (let i = it + 1; i < N; i++) if (Math.abs(u[i + 1]) > Math.abs(u[i])) { cut = i; break; }
  for (let i = cut; i <= N; i++) u[i] = 0;
  let nrm = 0; for (let i = 0; i <= N; i++) nrm += u[i] * u[i] * h; const sc = 1 / Math.sqrt(nrm); for (let i = 0; i <= N; i++) u[i] *= sc;
  return { E, u };
}
function hartree(u) {                                                     // V_H(r) of the density u²/(4πr²): the exact classical potential
  const VH = new Float64Array(N + 1); const inner = new Float64Array(N + 1); let acc = 0;
  for (let i = 0; i <= N; i++) { acc += u[i] * u[i] * h; inner[i] = acc; }
  let outer = 0; for (let i = N; i >= 0; i--) { VH[i] = inner[i] / r[i] + outer; outer += u[i] * u[i] / r[i] * h; }
  return VH;
}
let V = new Float64Array(N + 1); for (let i = 0; i <= N; i++) V[i] = -Z / r[i];
let { E: eps, u } = eigen(V);
console.log('hydrogenic start: ε =', eps.toFixed(6), '(exact −2 for Z = 2)');
let VH = hartree(u), Etot = 0;
for (let it = 0; it < 40; it++) {
  for (let i = 0; i <= N; i++) V[i] = -Z / r[i] + VH[i];
  const s = eigen(V); eps = s.E;
  const VHn = hartree(s.u); for (let i = 0; i <= N; i++) VH[i] = 0.5 * VH[i] + 0.5 * VHn[i];   // mixing
  u = s.u;
  let J = 0; for (let i = 0; i <= N; i++) J += u[i] * u[i] * VH[i] * h;
  const Enew = 2 * eps - J;
  if (it % 5 === 0 || Math.abs(Enew - Etot) < 1e-8) console.log('iter', it, 'ε =', eps.toFixed(6), 'J =', J.toFixed(6), 'E = 2ε − J =', Enew.toFixed(6));
  if (Math.abs(Enew - Etot) < 1e-9) { Etot = Enew; break; }
  Etot = Enew;
}
console.log('HARTREE HELIUM  E =', Etot.toFixed(5), 'Eh   (Hartree–Fock −2.86168; exact −2.90372; Hylleraas-3 in the lab −2.90243)');
console.log('ε =', eps.toFixed(5), '(HF −0.91796); Koopmans ionisation −ε =', (-eps * 27.2114).toFixed(3), 'eV (measured 24.587 eV: the difference is relaxation + correlation)');
let r1 = 0; for (let i = 0; i <= N; i++) r1 += u[i] * u[i] * r[i] * h; console.log('⟨r⟩ =', r1.toFixed(4), 'a₀ (HF 0.9273)');
