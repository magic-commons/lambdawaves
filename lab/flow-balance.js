/* flow-balance.js — BALANCED FLOW's repair, pure; the cards worker runs it (`flow.balance`, mathworker.js; 0.6.2 H1, NACRE Round 1
 * T1 and Round 2 C5).  In a finite basis s = ∂ρ/∂t + ∇·j is not zero; BALANCED rides v + ∇φ with −∇·(ρ∇φ) = s − cρ, c = Σs/Σρ the
 * share no ∇φ can carry, on a cell-centred N³ grid over [−half, half]³: the floor mask ρ > 1e-7 and its largest 6-connected
 * component, harmonic-mean face weights, no-flux faces at the mask's edge, Jacobi-PCG to ‖r‖/‖b‖ < tol, φ = 0 when b = 0.  A cell's
 * ∇φ is its FACE FLUXES' mean w(φ₊ − φ₋)/h over ρ (Round 2: the centred gradient misses the dipole identity by 7 %, this closes it).
 * ∇·j is a centred difference of j over one cell — no AO second derivatives.  MEASURED on the breathing Gaussian (ρ-weighted ∇φ
 * error, tests/molecular-flow.test.mjs §5): 32³ 4.0 %, 48³ 1.75 % (Round 2: 1.75 %).
 */
import { createFlow } from './molecular-flow.js';
const FLOOR = 1e-7;

export function balance({ N, half, rho, src, j = null, tol = 1e-4, cap = 4000 }) {
  const N3 = N * N * N, h = 2 * half / N, ih2 = 1 / (h * h), S = [N * N, N, 1], ax = (c, a) => ((c / S[a]) | 0) % N;
  const comp = new Int32Array(N3).fill(-1), stack = []; let best = -1, most = 0;
  for (let c0 = 0; c0 < N3; c0++) if (rho[c0] > FLOOR && comp[c0] < 0) {          // the largest 6-connected component
    let cnt = 0; comp[c0] = c0; stack.push(c0);
    while (stack.length) { const c = stack.pop(); cnt++;
      for (let a = 0; a < 3; a++) for (let d = -1; d <= 1; d += 2) { const u = ax(c, a) + d, t = c + d * S[a]; if (u >= 0 && u < N && rho[t] > FLOOR && comp[t] < 0) { comp[t] = c0; stack.push(t); } } }
    if (cnt > most) { most = cnt; best = c0; } }
  const M = new Uint8Array(N3), W = [0, 1, 2].map(() => new Float64Array(N3)), diag = new Float64Array(N3);
  for (let c = 0; c < N3; c++) M[c] = comp[c] === best ? 1 : 0;
  for (let c = 0; c < N3; c++) if (M[c]) for (let a = 0; a < 3; a++) { const t = c + S[a];   // W[a][c]: the face between c and c + S[a], ×1/h²
    if (ax(c, a) + 1 < N && M[t]) { const w = 2 * rho[c] * rho[t] / (rho[c] + rho[t]) * ih2; W[a][c] = w; diag[c] += w; diag[t] += w; } }
  const Av = (p, o) => { for (let c = 0; c < N3; c++) { if (!M[c]) continue; let s = diag[c] * p[c];
    for (let a = 0; a < 3; a++) { const w = W[a][c]; if (w) s -= w * p[c + S[a]]; if (c >= S[a] && W[a][c - S[a]]) s -= W[a][c - S[a]] * p[c - S[a]]; } o[c] = s; } };
  let sS = 0, sR = 0; for (let c = 0; c < N3; c++) if (M[c]) { sS += src[c]; sR += rho[c]; }
  const cc = sR > 0 ? sS / sR : 0, b = new Float64Array(N3); let bn = 0;
  for (let c = 0; c < N3; c++) if (M[c]) { b[c] = src[c] - cc * rho[c]; bn += b[c] * b[c]; } bn = Math.sqrt(bn);
  const phi = new Float64Array(N3), r = Float64Array.from(b), z = new Float64Array(N3), p = new Float64Array(N3), Ap = new Float64Array(N3);
  let it = 0, rel = bn > 0 ? 1 : 0;
  if (bn > 0) {                                                                      // the zero-RHS guard: nothing to repair is φ = 0, not 0/0
    let rz = 0; for (let c = 0; c < N3; c++) if (M[c]) { z[c] = r[c] / (diag[c] || 1); rz += r[c] * z[c]; } p.set(z);
    while (it < cap) {
      Av(p, Ap); let pAp = 0, rn = 0; for (let c = 0; c < N3; c++) pAp += p[c] * Ap[c]; const al = rz / pAp;
      for (let c = 0; c < N3; c++) { phi[c] += al * p[c]; r[c] -= al * Ap[c]; rn += r[c] * r[c]; }
      it++; rel = Math.sqrt(rn) / bn; if (rel < tol) break;
      let rz2 = 0; for (let c = 0; c < N3; c++) if (M[c]) { z[c] = r[c] / (diag[c] || 1); rz2 += r[c] * z[c]; }
      const be = rz2 / rz; rz = rz2; for (let c = 0; c < N3; c++) p[c] = z[c] + be * p[c];
    }
  }
  const g = [0, 1, 2].map(() => new Float64Array(N3)); let kin = 0, ke = 0;
  for (let c = 0; c < N3; c++) if (M[c]) for (let a = 0; a < 3; a++) { const s = S[a], w = W[a][c], wm = c >= s ? W[a][c - s] : 0;   // the cell current: its two faces' mean flux
    const F = (w ? w * (phi[c + s] - phi[c]) : 0) + (wm ? wm * (phi[c] - phi[c - s]) : 0), nF = (w ? 1 : 0) + (wm ? 1 : 0);
    g[a][c] = nF ? F * h / nF / rho[c] : 0; kin += rho[c] * g[a][c] * g[a][c]; if (j) ke += j[a][c] * j[a][c] / rho[c];
  }
  return { phi, gx: g[0], gy: g[1], gz: g[2], c: cc, iterations: it, residual: rel, kinetic: ke > 0 ? kin / ke : NaN, cells: most };
}

/** the worker's op: ρ, j and ρ̇ = Σ Re Ḋ χχ sampled at the cell centres from the SAME D the tracers ride, the defect, then the repair */
export function flowBalance({ shells, N = 32, half, Re, Im, dRe, solve = true }) {
  const t0 = performance.now(), N3 = N * N * N, h = 2 * half / N, S = [N * N, N, 1], F = createFlow(shells), D = createFlow(shells);
  F.set(Re, Im); D.set(dRe, new Float64Array(dRe.length));
  const rho = new Float64Array(N3), J = [0, 1, 2].map(() => new Float64Array(N3)), rd = new Float64Array(N3), src = new Float64Array(N3), X = [0, 0, 0];
  for (let c = 0; c < N3; c++) {
    for (let a = 0; a < 3; a++) X[a] = -half + ((((c / S[a]) | 0) % N) + 0.5) * h;
    const s = F.at(X[0], X[1], X[2]); rho[c] = s.rho; J[0][c] = s.j[0]; J[1][c] = s.j[1]; J[2][c] = s.j[2]; rd[c] = D.at(X[0], X[1], X[2]).rho;
  }
  let ss = 0, sr = 0;
  for (let c = 0; c < N3; c++) {
    let dj = 0; for (let a = 0; a < 3; a++) { const u = ((c / S[a]) | 0) % N, lo = u > 0 ? c - S[a] : c, hi = u < N - 1 ? c + S[a] : c; dj += (J[a][hi] - J[a][lo]) / ((hi - lo) / S[a] * h); }
    src[c] = rd[c] + dj; if (rho[c] > FLOOR) { ss += src[c] * src[c]; sr += rd[c] * rd[c]; }
  }
  const B = solve ? balance({ N, half, rho, src, j: J }) : null;
  return { N, half, defect: sr > 0 ? Math.sqrt(ss / sr) : NaN, ms: performance.now() - t0,
    ...(B && { gx: B.gx, gy: B.gy, gz: B.gz, c: B.c, iterations: B.iterations, residual: B.residual, kinetic: B.kinetic }) };
}
