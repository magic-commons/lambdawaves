/* valence.js — THE HIGHEST ORBITAL of an atom, one rule for the Picker's ATOMIC deck and the pictures it shows (tools/menu-thumbs.mjs).
 *
 * groundConfig(Z): atoms.js', the one source (iteration 008 A) — H–Rn are atoms.js' own ATOMS, past Rn the same Madelung order
 * (n + l, then n) filled to Z with the standard ground-state exceptions.  valenceOf(Z): the subshell that makes the atom — the open one (the
 * highest l, then the latest in the Madelung order), else the last one filled — and its LAST electron's m: the electrons of a subshell take
 * m = −l … l in order, the up spins first (Hund), so the k-th has m = −l + (k − 1) mod (2l + 1).
 * Pure: no DOM, no clock; node imports it. */
import { groundConfig } from './atoms.js';

const L = 'spdf', CAP = [2, 6, 10, 14], SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
const sup = (k) => String(k).split('').map((d) => SUP[d]).join('');
/** { n, l, occ, m, nl: '3d', label: '3d²' } — the subshell that makes the atom and the m of its last electron */
export function valenceOf(Z) {
  const c = groundConfig(Z), rank = (s) => (s.n + s.l) * 10 + s.n, sorted = c.slice().sort((a, b) => rank(a) - rank(b));
  const open = sorted.filter((s) => s.occ < CAP[s.l]).sort((a, b) => a.l - b.l || rank(a) - rank(b)); const v = (open.length ? open : sorted).at(-1);   // of two open (Cr 3d⁵ 4s¹, Ce 4f¹ 5d¹) the higher l makes it
  return { n: v.n, l: v.l, occ: v.occ, m: -v.l + (v.occ - 1) % (2 * v.l + 1), nl: v.n + L[v.l], label: v.n + L[v.l] + sup(v.occ) };
}
