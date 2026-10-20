/* valence.js — THE BLOCK'S ORBITAL of an atom, one rule for the Picker's ATOMIC deck and the pictures it shows (tools/menu-thumbs.mjs).
 *
 * groundConfig(Z): atoms.js', the one source (iteration 008 A) — H–Rn are atoms.js' own ATOMS, past Rn the same Madelung order
 * (n + l, then n) filled to Z with the standard ground-state exceptions.
 * blockSubshell(Z): THE BLOCK'S ORBITAL (iteration 011 Q3b, Josh 10-19 with his table beside GunnarDraft's: "Ermmm is this correct? …
 * I want the highest orbital chosen on my app") — the differentiating subshell, the last electron the Aufbau adds, read from the REAL
 * ground configuration: the occupied subshell that comes LAST in the Madelung order 1s 2s 2p 3s 3p 4s 3d 4p 5s 4d 5p 6s 4f 5d 6p 7s 5f
 * 6d 7p — so the s block shows ns, the p block np, the d block (n−1)d (Fe 3d, Cr 3d, Cu 3d, Zn 3d, Pd 4d, Au 5d), with one f rule: a
 * ground state that holds an OPEN f shell shows it (Ce 4f¹ 5d¹ and Gd 4f⁷ 5d¹ show 4f, U 5f³ 6d¹ shows 5f — the 5d/6d electron is the
 * configuration's exception, not the block's), while a ground state with no f (La 5d, Ac 6d, Th 6d²) or a closed one (Lu 5d, Lr 7p)
 * keeps its Madelung last.  Q3's "highest n, then l" (Fe 4s, Ce 6s) turned every d and f tile into an s picture; it is gone.
 * valenceOf(Z): that subshell and its LAST electron's m: the electrons of a subshell take m = −l … l in order, the up spins first
 * (Hund), so the k-th has m = −l + (k − 1) mod (2l + 1).
 * Pure: no DOM, no clock; node imports it. */
import { groundConfig } from './atoms.js';

const L = 'spdf', SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
const sup = (k) => String(k).split('').map((d) => SUP[d]).join('');
/** { n, l, occ } — the block's subshell of Z: an open f shell if the ground state holds one, else the occupied subshell last in Madelung order */
export function blockSubshell(Z) {
  const cfg = groundConfig(Z), openF = cfg.find((c) => c.l === 3 && c.occ < 14);
  const v = openF || cfg.slice().sort((a, b) => a.n + a.l - (b.n + b.l) || a.n - b.n).at(-1);
  return { n: v.n, l: v.l, occ: v.occ };
}
/** { n, l, occ, m, nl: '3d', label: '3d⁶' } — the block's subshell and the m of its last electron */
export function valenceOf(Z) {
  const v = blockSubshell(Z);
  return { n: v.n, l: v.l, occ: v.occ, m: -v.l + (v.occ - 1) % (2 * v.l + 1), nl: v.n + L[v.l], label: v.n + L[v.l] + sup(v.occ) };
}
