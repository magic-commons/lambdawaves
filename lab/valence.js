/* valence.js — THE HIGHEST ORBITAL of an atom, one rule for the Picker's ATOMIC deck and the pictures it shows (tools/menu-thumbs.mjs).
 *
 * configOf(Z): H–Kr read atoms.js' own ground configurations; past Kr the Madelung order (n + l, then n) filled to Z, then the
 * standard ground-state exceptions move k electrons from one subshell to another.  valenceOf(Z): the subshell that makes the
 * atom — the open one (the highest l, then the latest in the Madelung order), else the last one filled — and its LAST electron's
 * m: the electrons of a subshell take m = −l … l in order, the up spins first (Hund), so the k-th has m = −l + (k − 1) mod (2l + 1).
 * Pure: no DOM, no clock; node imports it. */
import { ATOMS } from './atoms.js';

const L = 'spdf', CAP = [2, 6, 10, 14], SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
const sup = (k) => String(k).split('').map((d) => SUP[d]).join('');
const ORDER = []; for (let s = 1; s <= 8; s++) for (let n = 1; n <= s; n++) { const l = s - n; if (l < n && l <= 3) ORDER.push([n, l]); }
const MOVE = { 41: ['5s', '4d', 1], 42: ['5s', '4d', 1], 44: ['5s', '4d', 1], 45: ['5s', '4d', 1], 46: ['5s', '4d', 2], 47: ['5s', '4d', 1], 57: ['4f', '5d', 1], 58: ['4f', '5d', 1],
  64: ['4f', '5d', 1], 78: ['6s', '5d', 1], 79: ['6s', '5d', 1], 89: ['5f', '6d', 1], 90: ['5f', '6d', 2], 91: ['5f', '6d', 1], 92: ['5f', '6d', 1], 93: ['5f', '6d', 1], 96: ['5f', '6d', 1], 103: ['6d', '7p', 1] };
export function configOf(Z) {
  const own = ATOMS.find((a) => a.Z === Z);
  if (own) return own.config.map((c) => ({ n: c.n, l: c.l, occ: c.occ }));
  const c = []; let left = Z; for (const [n, l] of ORDER) { if (left <= 0) break; const k = Math.min(left, CAP[l]); c.push({ n, l, occ: k }); left -= k; }
  const m = MOVE[Z]; if (m) { const key = (s) => s.n + L[s.l], from = c.find((s) => key(s) === m[0]); let to = c.find((s) => key(s) === m[1]);
    if (!to) { to = { n: +m[1][0], l: L.indexOf(m[1][1]), occ: 0 }; c.push(to); } from.occ -= m[2]; to.occ += m[2]; }
  return c.filter((s) => s.occ > 0);
}
/** { n, l, occ, m, nl: '3d', label: '3d²' } — the subshell that makes the atom and the m of its last electron */
export function valenceOf(Z) {
  const c = configOf(Z), rank = (s) => (s.n + s.l) * 10 + s.n, sorted = c.slice().sort((a, b) => rank(a) - rank(b));
  const open = sorted.filter((s) => s.occ < CAP[s.l]).sort((a, b) => a.l - b.l || rank(a) - rank(b)); const v = (open.length ? open : sorted).at(-1);   // of two open (Cr 3d⁵ 4s¹, Ce 4f¹ 5d¹) the higher l makes it
  return { n: v.n, l: v.l, occ: v.occ, m: -v.l + (v.occ - 1) % (2 * v.l + 1), nl: v.n + L[v.l], label: v.n + L[v.l] + sup(v.occ) };
}
