/* valence.js — THE HIGHEST ORBITAL of an atom, one rule for the Picker's ATOMIC deck and the pictures it shows (tools/menu-thumbs.mjs).
 *
 * groundConfig(Z): atoms.js', the one source (iteration 008 A) — H–Rn are atoms.js' own ATOMS, past Rn the same Madelung order
 * (n + l, then n) filled to Z with the standard ground-state exceptions.  valenceOf(Z): THE HIGHEST occupied subshell — the highest n,
 * then the highest l within it (iteration 011 Q3, Josh 10-19: "the orbitals aren't correctly their 'n' level … it's really just an
 * indicator and visual aid"), so a tile's n is the atom's outermost shell: Fe 4s (not 3d), Ce 6s (not 4f), Ga 4p, Pd 4d (no 5s: the one
 * element whose n is not its period), Lr 7p — and its LAST electron's m: the electrons of a subshell take m = −l … l in order, the up
 * spins first (Hund), so the k-th has m = −l + (k − 1) mod (2l + 1).
 * Pure: no DOM, no clock; node imports it. */
import { groundConfig } from './atoms.js';

const L = 'spdf', SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
const sup = (k) => String(k).split('').map((d) => SUP[d]).join('');
/** { n, l, occ, m, nl: '4s', label: '4s²' } — the highest occupied subshell and the m of its last electron */
export function valenceOf(Z) {
  const v = groundConfig(Z).slice().sort((a, b) => b.n - a.n || b.l - a.l)[0];   // the highest n, then the highest l in it (iteration 008's rule, the open subshell of the highest l, drew Fe 3d and Ce 4f)
  return { n: v.n, l: v.l, occ: v.occ, m: -v.l + (v.occ - 1) % (2 * v.l + 1), nl: v.n + L[v.l], label: v.n + L[v.l] + sup(v.occ) };
}
