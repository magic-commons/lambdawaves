/* tests/well.test.mjs — the node proof of the infinite spherical well.
 *   node tests/well.test.mjs
 * Oracles: the known zeros of the spherical Bessel functions, normalisation and orthogonality by quadrature, the
 * hard wall, and the Schrödinger equation inside the well by finite differences.
 */
import { BASIS } from '../lab/hydrogen.js';
import { besselZeros, wellZ, wellEnergyOf, wellRadial, wellTable, wellFromTable, setWellRadius, wellTableFor, wellEnergy, wellPsiAt } from '../lab/well.js';

let FAILED = 0, TOTAL = 0;
function judge(name, ok, detail) {
  TOTAL++; if (!ok) FAILED++;
  console.log((ok ? 'GREEN ' : 'RED   ') + name + (detail === undefined ? '' : '\n      ' + JSON.stringify(detail).slice(0, 300)));
}
function simpson(f, a, b, N) { const h = (b - a) / N; let s = f(a) + f(b); for (let i = 1; i < N; i++) s += f(a + i * h) * (i % 2 ? 4 : 2); return s * h / 3; }
{
  const z0 = besselZeros(0, 3), z1 = besselZeros(1, 3), z2 = besselZeros(2, 2), z5 = besselZeros(5, 1);
  judge('W the zeros of j_l: j₀ at nπ; j₁ at 4.493409, 7.725252, 10.904122; j₂ at 5.763459, 9.095011; j₅ at 9.355812 (1e-6)',
    Math.abs(z0[0] - Math.PI) < 1e-10 && Math.abs(z0[2] - 3 * Math.PI) < 1e-10 && Math.abs(z1[0] - 4.493409) < 1e-6 && Math.abs(z1[1] - 7.725252) < 1e-6 && Math.abs(z1[2] - 10.904122) < 1e-6 && Math.abs(z2[0] - 5.763459) < 1e-6 && Math.abs(z2[1] - 9.095011) < 1e-6 && Math.abs(z5[0] - 9.355812) < 1e-6, { z0, z1, z2, z5 });
  judge('W the labels: (n,l) ↦ the (n−l)-th zero of j_l, so 1s → π, 2s → 2π, 2p → 4.4934, 3d → 5.7635; energies z²/(2a²)', Math.abs(wellZ(1, 0) - Math.PI) < 1e-10 && Math.abs(wellZ(2, 0) - 2 * Math.PI) < 1e-10 && Math.abs(wellZ(2, 1) - 4.493409) < 1e-6 && Math.abs(wellZ(3, 2) - 5.763459) < 1e-6 && Math.abs(wellEnergyOf(1, 0, 10) - Math.PI ** 2 / 200) < 1e-12);
}
{
  const a = 10; let worst = 0, worstO = 0;
  for (let n = 1; n <= 6; n++) for (let l = 0; l < n; l++) {
    const I = simpson((r) => { const R = wellRadial(n, l, r, a); return R * R * r * r; }, 0, a, 4000);
    worst = Math.max(worst, Math.abs(I - 1));
    for (let n2 = n + 1; n2 <= 6; n2++) if (n2 - 1 >= l) worstO = Math.max(worstO, Math.abs(simpson((r) => wellRadial(n, l, r, a) * wellRadial(n2, l, r, a) * r * r, 0, a, 4000)));
  }
  judge('W every radial function in the register is normalised (1e-9) and orthogonal to the others of its l (1e-9), inside a well of radius 10', worst < 1e-9 && worstO < 1e-9, { worst, worstO });
  judge('W the wall is hard: ψ(a) = 0 to 1e-12 for every (n,l), and ψ = 0 outside', Array.from({ length: 6 }, (_, i) => i + 1).every((n) => Array.from({ length: n }, (_, l) => Math.abs(wellRadial(n, l, a, a)) < 1e-12 && wellRadial(n, l, a + 0.1, a) === 0).every(Boolean)));
}
/* THE SCHRÖDINGER ORACLE inside the well: −½∇²ψ = Eψ, fourth-order finite differences at random interior points */
{
  setWellRadius(10);
  let worst = 0, where = null;
  let seed = 11; const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296 - 0.5; };
  for (const s of BASIS) {
    if ((s.n + s.l + s.m) % 2) continue;
    const T = wellTableFor(s), E = wellEnergy(s.index), h = 5e-3;
    for (let k = 0; k < 2; k++) {
      const x = rnd() * 10, y = rnd() * 10, z = rnd() * 10; if (Math.hypot(x, y, z) > 8.5) continue;
      const f = (dx, dy, dz) => wellFromTable(T, x + dx, y + dy, z + dz);
      const c = f(0, 0, 0);
      const lap = (part) => { let s2 = 0; for (const d of [[h, 0, 0], [0, h, 0], [0, 0, h]]) { const p1 = f(d[0], d[1], d[2])[part], m1 = f(-d[0], -d[1], -d[2])[part], p2 = f(2 * d[0], 2 * d[1], 2 * d[2])[part], m2 = f(-2 * d[0], -2 * d[1], -2 * d[2])[part]; s2 += (-p2 + 16 * p1 - 30 * c[part] + 16 * m1 - m2) / (12 * h * h); } return s2; };
      const scale = Math.hypot(c.re, c.im) + 1e-4;
      const d = Math.hypot(-0.5 * lap('re') - E * c.re, -0.5 * lap('im') - E * c.im) / scale;
      if (d > worst) { worst = d; where = s.id; }
    }
  }
  judge('W THE SCHRÖDINGER ORACLE: −½∇²ψ = (z²/2a²)ψ inside the well for half the register at random points, 1e-5 relative', worst < 1e-5, { worst, where });
  const re = new Float64Array(91), im = new Float64Array(91); re[0] = 0.6; im[4] = 0.8;
  const v = wellPsiAt(re, im, 1, 2, 3, [0, 4]);
  judge('W wellPsiAt superposes, and a point outside the wall gives exactly zero', Number.isFinite(v.re) && Math.hypot(v.re, v.im) > 0 && wellPsiAt(re, im, 20, 0, 0, [0, 4]).re === 0);
}

/* THE GAS: a packet in the box moves at its momentum and bounces, by the exact evolution of the truncated register */
{
  const { wellPacket, wellCentroid } = await import('../lab/well.js');
  setWellRadius(10);
  const P = wellPacket([0, 0, -4], [0, 0, 0.8], 1.6);
  const ids = []; for (let a = 0; a < 91; a++) if (Math.hypot(P.re[a], P.im[a]) > 1e-12) ids.push(a);
  let n2 = 0; for (const a of ids) n2 += P.re[a] ** 2 + P.im[a] ** 2;
  judge('W a Gaussian packet (σ = 1.6) at z = −4 with momentum 0.8 is held by the box\'s 91 states to 96.68% (reproducible to 5e-4) — the register resolves ≈ a/6 — and is normalised as a new state', Math.abs(P.captured - 0.96683) < 5e-4 && Math.abs(n2 - 1) < 1e-12 && ids.length > 20, { captured: P.captured, states: ids.length });
  const c0 = wellCentroid(P.re, P.im, ids, { G: 32 });
  const at = (t) => { const re = new Float64Array(91), im = new Float64Array(91); for (const a of ids) { const E = wellEnergy(a), c = Math.cos(E * t), s = Math.sin(E * t); re[a] = P.re[a] * c + P.im[a] * s; im[a] = P.im[a] * c - P.re[a] * s; } return { re, im }; };
  const c3 = at(3), x3 = wellCentroid(c3.re, c3.im, ids, { G: 32 });
  judge('W it starts where it was put (centroid z = −4 within 0.3) and three time units later has moved by ≈ k·t = 2.4 (Ehrenfest, until the wall)', Math.abs(c0[2] + 4) < 0.3 && Math.abs(x3[2] - (c0[2] + 2.4)) < 0.6 && Math.abs(c0[0]) < 0.3 && Math.abs(c0[1]) < 0.3, { c0, x3 });
  const c14 = at(14), x14 = wellCentroid(c14.re, c14.im, ids, { G: 32 });
  let n14 = 0; for (const a of ids) n14 += c14.re[a] ** 2 + c14.im[a] ** 2;
  judge('W at t = 14 it has met the wall: the centroid is still inside the box, the norm is still 1, and it is no longer where free motion would have taken it (z = 7.2)', Math.hypot(...x14) < 10 && Math.abs(n14 - 1) < 1e-12 && Math.abs(x14[2] - 7.2) > 0.8, { x14, n14 });
}
console.log((FAILED ? 'RED' : 'GREEN') + ' well.test — ' + FAILED + ' failing of ' + TOTAL);
process.exit(FAILED ? 1 : 0);
