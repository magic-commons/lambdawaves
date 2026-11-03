/* dft-grid.js — the molecular quadrature of RKS LDA (0.7.3 K1), PySCF's grid unpruned: per atom Treutler–Ahlrichs M4 radial points (JCP 102, 346 (1995),
 * ξ per element) × the 302-point Lebedev set (Lebedev & Laikov 1999, order 29: lab/lebedev-302.json), weighted by Becke's 1988 partition (three smoothing
 * iterations, no atomic-size adjustment).  Atomic units, atoms in bohr.  tests/rks.test.mjs holds ∫e^{−r²} = π^{3/2} on it and PySCF's energies through it. */
import LEB from './lebedev-302.js';   // 033: a JS module, never a JSON module import (nosniff + a worker: see lebedev-302.js)
const XI = [1, 0.8, 0.9, 1.8, 1.4, 1.3, 1.1, 0.9, 0.9, 0.9, 0.9, 1.4, 1.3, 1.3, 1.2, 1.1, 1, 1, 1, 1.5, 1.4, 1.3, 1.2, 1.2, 1.2, 1.2, 1.2, 1.2, 1.1, 1.1, 1.1, 1.1, 1, 0.9, 0.9, 0.9, 0.9];   // H–Kr

/** molecularGrid(atoms, { radial = 75, lebedev = 302 }) → { x, y, z, w } (Float64Array each, atom by atom, radial shell by shell) */
export function molecularGrid(atoms, { radial = 75, lebedev = 302 } = {}) {
  if (lebedev !== 302) throw new Error('dft-grid: only the 302-point Lebedev set is vendored');
  const A = atoms.length, L = LEB.xyzw, N = A * radial * 302, x = new Float64Array(N), y = new Float64Array(N), z = new Float64Array(N), w = new Float64Array(N);
  const inv = new Float64Array(A * A), d = new Float64Array(A), P = new Float64Array(A), step = Math.PI / (radial + 1);
  for (let i = 0; i < A; i++) for (let j = 0; j < i; j++) inv[i * A + j] = 1 / Math.hypot(atoms[i].x - atoms[j].x, atoms[i].y - atoms[j].y, atoms[i].z - atoms[j].z);
  let g = 0;
  for (let a = 0; a < A; a++) {
    const xi = XI[atoms[a].Z] / Math.LN2;
    for (let i = 0; i < radial; i++) {
      const c = Math.cos((i + 1) * step), f = xi * (1 + c) ** 0.6, lg = Math.log((1 - c) / 2), r = -f * lg;
      const wr = 4 * Math.PI * r * r * step * Math.sin((i + 1) * step) * f * (-0.6 / (1 + c) * lg + 1 / (1 - c));
      for (let k = 0; k < 302; k++, g++) {
        const px = x[g] = atoms[a].x + r * L[4 * k], py = y[g] = atoms[a].y + r * L[4 * k + 1], pz = z[g] = atoms[a].z + r * L[4 * k + 2];
        for (let b = 0; b < A; b++) { d[b] = Math.sqrt((px - atoms[b].x) ** 2 + (py - atoms[b].y) ** 2 + (pz - atoms[b].z) ** 2); P[b] = 1; }
        for (let b = 1; b < A; b++) for (let e = 0; e < b; e++) {
          let m = (d[b] - d[e]) * inv[b * A + e];
          for (let t = 0; t < 3; t++) m = 1.5 * m - 0.5 * m * m * m;
          P[b] *= 0.5 * (1 - m); P[e] *= 0.5 * (1 + m);
        }
        let s = 0; for (let b = 0; b < A; b++) s += P[b];
        w[g] = wr * L[4 * k + 3] * P[a] / s;
      }
    }
  }
  return { x, y, z, w };
}
