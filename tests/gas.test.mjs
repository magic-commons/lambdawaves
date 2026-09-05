/* tests/gas.test.mjs — the node proof of THE AXIAL GAS (the box's second register, 256 modes, m = 0).
 *   node tests/gas.test.mjs
 * Oracles: orthonormality of the well basis by quadrature, the capture of a small packet, the free-Gaussian laws for
 * ⟨z⟩(t) and σ_z(t) before the wall, and the turn-around at the wall.
 */
import { createGas, sphj, zerosOf, legP } from '../lab/gas.js';

let FAILED = 0, TOTAL = 0;
function judge(name, ok, detail) {
  TOTAL++; if (!ok) FAILED++;
  console.log((ok ? 'GREEN ' : 'RED   ') + name + (detail === undefined ? '' : '\n      ' + JSON.stringify(detail).slice(0, 300)));
}
{
  const z0 = zerosOf(0, 3), z5 = zerosOf(5, 2), z15 = zerosOf(15, 1);
  judge('ZEROS: j₀ at nπ, j₅ near 9.356 / 12.966, the first zero of j₁₅ = 20.5402 (McMahon; my first guess of 20.12 was wrong)', Math.abs(z0[0] - Math.PI) < 1e-9 && Math.abs(z0[2] - 3 * Math.PI) < 1e-9 && Math.abs(z5[0] - 9.3558) < 2e-3 && Math.abs(z5[1] - 12.9665) < 2e-3 && Math.abs(z15[0] - 20.5402) < 2e-3, { z0, z5, z15 });
  judge('LEGENDRE: P₃(0.5) = −0.4375 and P₁₅(1) = 1 by the recurrence', Math.abs(legP(3, 0.5) + 0.4375) < 1e-12 && Math.abs(legP(15, 1) - 1) < 1e-12, { p3: legP(3, 0.5), p15: legP(15, 1) });
}
{
  const gas = createGas(10);
  const N = gas.modes.length;
  let worst = 0; for (const l of [0, 7, 15]) { const idx = gas.modes.map((m, i) => (m.l === l ? i : -1)).filter((i) => i >= 0).slice(0, 6); for (const a of idx) for (const b of idx) worst = Math.max(worst, Math.abs(gas.overlap(a, b) - (a === b ? 1 : 0))); }
  judge('THE BASIS: 256 modes (n_r ≤ 15, l ≤ 15), orthonormal on the quadrature grid to 5e-3 for l = 0, 7 and 15', N === 256 && worst < 5e-3, { N, worst });
  const P = gas.launch(-5, 2, 0.8, 0);
  const s0 = gas.stats(0, 1), s1 = gas.stats(1, 1);
  const sigmaFree = 0.8 * Math.sqrt(1 + (1 / (2 * 0.8 * 0.8)) ** 2);
  judge('A SMALL PACKET: σ = 0.8 a₀, k = 2 at z₀ = −5 in the a = 10 box is held to > 95 %, unit norm, centred at z₀ ± 0.05, and after t = 1 sits at z₀ + k·t ± 0.1 with the free-Gaussian width σ√(1 + (t/2σ²)²) ± 10 %',
    P.captured > 0.95 && Math.abs(gas.norm2(0) - 1) < 1e-12 && Math.abs(s0.z + 5) < 0.05 && Math.abs(s1.z + 3) < 0.1 && Math.abs(s1.sz - sigmaFree) < 0.1 * sigmaFree, { captured: P.captured, s0, s1, sigmaFree });
  const zs = [4, 6, 8, 10].map((t) => gas.stats(t, 2).z);
  judge('THE WALL: the centre never leaves the box (⟨z⟩ < a) and has turned around by t = 10 (⟨z⟩(10) < ⟨z⟩(8)) — a real reflection of the exact evolution', zs.every((z) => z < 10) && zs[3] < zs[2] && zs[1] > zs[0], { zs });
  const fm = gas.fieldModes(0);
  judge('THE RECORDS: the field gets ≤ 256 well records with the recurrence flag set (lag[2] = 1), l up to 15', fm.length > 100 && fm.length <= 256 && fm.every((m) => m.table.lag[2] === 1) && Math.max(...fm.map((m) => m.table.l)) >= 12, { count: fm.length, lmax: Math.max(...fm.map((m) => m.table.l)) });
}
console.log((FAILED ? 'RED ' : 'GREEN ') + 'gas.test — ' + FAILED + ' failing of ' + TOTAL);
process.exit(FAILED ? 1 : 0);
