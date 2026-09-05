/* bessel.js — the spherical Bessel function j_L(x), shared by the slap (kick.js) and the well (well.js).
 * Kept in its own module so that well → bessel and kick → bessel form no import cycle with hamiltonian.js.
 */
/** j_L(x) for L ≤ 12: series near zero, upward recurrence for x > L + 1, Miller's downward recurrence otherwise */
export function sphericalBessel(L, x) {
  if (x < 1e-6) { let s = 1; for (let i = 1; i <= L; i++) s *= x / (2 * i + 1); return s; }
  const j0 = Math.sin(x) / x;
  if (L === 0) return j0;
  const j1 = j0 / x - Math.cos(x) / x;
  if (L === 1) return j1;
  if (x > L + 1) { let a = j0, b = j1; for (let l = 1; l < L; l++) { const c = (2 * l + 1) / x * b - a; a = b; b = c; } return b; }
  const start = L + 30 + Math.ceil(x);                          // Miller: downward from a high order, then scale by j0
  let b = 0, a = 1e-300, out = 0;
  for (let l = start; l >= 1; l--) { const c = (2 * l + 1) / x * a - b; b = a; a = c; if (l - 1 === L) out = c; if (Math.abs(a) > 1e250) { a *= 1e-250; b *= 1e-250; out *= 1e-250; } }
  return out * j0 / a;                                           // a now holds the unnormalised j_0
}
