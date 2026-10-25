/* emission-map.js — THE EMISSION SPECTRA's maps (iteration 016 E1 · E3): pure, DOM-free, node-testable.
 *
 * THE HYDROGEN STRIP.  Under a hydrogen-like operator every l of a shell is degenerate, so a line on the strip is a SHELL pair n → n′ (Hα = 3 → 2) and
 * its subshell lines (3d → 2p, 3p → 2s, 3s → 2p — dynamics.js lineList) are its PAIRS' sources; its name is the series' (LYMAN … HUMPHREYS) and the
 * Greek letter of Δn.  n ≤ 7 gives every series to its n = 7 member; the series limit (n → ∞) is a tick, past the register.
 * THE MEASURED LINES.  Under the ATOM the strip draws NIST ASD's lines (lab/vendor/nist/lines.json, tools/nist-lines.py): the ZORA Xα ε gaps miss by
 * tenths of an eV to an eV, with no terms and no spin–orbit, so sodium's D line would land in the wrong colour.  A line's picture is its ACTIVE
 * ELECTRON: the one orbital the upper configuration holds once more and the lower once less (parseConfig, activeElectron); anything else is "not a
 * one-electron line" (shown grey, never pressed), and an orbital past n = 7 is "past the register".  Several NIST lines on one orbital pair (He's
 * singlet and triplet 1s2p → 1s2s, sodium's D₁ and D₂) are ONE picture, listed together.
 * THE COLOUR of a wavelength is the CIE 1931 2° observer (Wyman, Sloan & Shirley 2013's multi-lobe fit) taken to sRGB, clipped and normalised,
 * dimmed toward the ends of the eye's range; outside 380–750 nm it is no colour (the strip draws grey). */
export const L_LETTER = 'spdfghik';
export const SERIES = Object.freeze([
  Object.freeze({ id: 'lyman', label: 'LYMAN', short: 'Ly', lower: 1 }), Object.freeze({ id: 'balmer', label: 'BALMER', short: 'H', lower: 2 }),
  Object.freeze({ id: 'paschen', label: 'PASCHEN', short: 'Pa', lower: 3 }), Object.freeze({ id: 'brackett', label: 'BRACKETT', short: 'Br', lower: 4 }),
  Object.freeze({ id: 'pfund', label: 'PFUND', short: 'Pf', lower: 5 }), Object.freeze({ id: 'humphreys', label: 'HUMPHREYS', short: 'Hu', lower: 6 })]);
const GREEK = 'αβγδεζη';
/** the strip's two ranges, in nm: VISIBLE linear, ALL logarithmic (Lyman's limit … Humphreys α) */
export const RANGES = Object.freeze({ visible: Object.freeze({ lo: 380, hi: 750, log: false }), all: Object.freeze({ lo: 90, hi: 12500, log: true }) });
/** x in [0, 1] of a wavelength on a range (outside: < 0 or > 1) */
export const xOf = (nm, R) => (R.log ? Math.log(nm / R.lo) / Math.log(R.hi / R.lo) : (nm - R.lo) / (R.hi - R.lo));

/** hydrogenStrip(lines) → the strip's lines from dynamics.js lineList: one per shell pair, { id ('3-2'), name ('Hα'), series, upper,
 *  lower (n), lambda (nm), subs (the subshell lines, strongest A first), A (the strongest subshell's tabulated A) }, shortest λ first */
export function hydrogenStrip(lines) {
  const by = new Map();
  for (const L of lines) {
    const k = L.upper.n + '-' + L.lower.n; let g = by.get(k);
    if (!g) {
      const s = SERIES[L.lower.n - 1];
      g = { id: k, name: s ? s.short + GREEK[L.upper.n - L.lower.n - 1] : `${L.upper.n} → ${L.lower.n}`, series: s ? s.id : '', upper: L.upper.n, lower: L.lower.n, lambda: L.lambda, subs: [] };
      by.set(k, g);
    }
    g.subs.push(L);
  }
  const out = [...by.values()];
  for (const g of out) { g.subs.sort((a, b) => b.A - a.A); g.A = g.subs[0].A; }
  return out.sort((a, b) => a.lambda - b.lambda);
}

/** parseConfig('2p6.3s') → Map 'n,l' → occupation, or null when a token is not a subshell (the coupling terms in ( ) and < > are dropped) */
export function parseConfig(s) {
  if (typeof s !== 'string' || !s.trim()) return null;
  const occ = new Map(), clean = s.replace(/\([^)]*\)/g, '').replace(/<[^>]*>/g, '').replace(/[*?]/g, '');
  for (const tok of clean.split('.')) {
    const t = tok.trim(); if (!t) continue;
    if (/^\d+$/.test(t)) { occ.set(t + ',-1', (occ.get(t + ',-1') || 0) + 1); continue; }   // a hydrogenic shell NIST names by n alone (H I's '3'): any l
    const m = /^(\d+)([spdfghik])(\d*)$/.exec(t); if (!m) return null;
    const n = +m[1], l = L_LETTER.indexOf(m[2]); if (!(l < n)) return null;
    const k = n + ',' + l; occ.set(k, (occ.get(k) || 0) + (m[3] === '' ? 1 : +m[3]));
  }
  return occ.size ? occ : null;
}
/** activeElectron(lowerConf, upperConf) → { upper: {n, l}, lower: {n, l} } — the one orbital the upper configuration holds once more and the
 *  lower once less, Δl = ±1 — or { why } ('not a one-electron line' · 'past the register (n > 7)') */
export function activeElectron(lowerConf, upperConf, nmax = 7) {
  const lo = parseConfig(lowerConf), up = parseConfig(upperConf); if (!lo || !up) return { why: 'not a one-electron line' };
  const plus = [], minus = [];
  for (const k of new Set([...lo.keys(), ...up.keys()])) { const d = (up.get(k) || 0) - (lo.get(k) || 0); if (d === 1) plus.push(k); else if (d === -1) minus.push(k); else if (d) return { why: 'not a one-electron line' }; }
  if (plus.length !== 1 || minus.length !== 1) return { why: 'not a one-electron line' };
  let [nu, lu] = plus[0].split(',').map(Number), [nl, ll] = minus[0].split(',').map(Number);
  if (ll < 0) ll = lu >= 0 ? (lu > 0 ? lu - 1 : 1) : Math.min(1, nl - 1);   // a shell named by n alone: the subshell pair the strongest line of the shells uses (Hα: 3d → 2p)
  if (lu < 0) lu = ll + 1 < nu ? ll + 1 : ll - 1;
  if (!(ll < nl) || !(lu < nu) || lu < 0 || Math.abs(lu - ll) !== 1) return { why: 'not a one-electron line' };
  if (nu > nmax || nl > nmax) return { why: `past the register (n > ${nmax})`, upper: { n: nu, l: lu }, lower: { n: nl, l: ll } };
  return { upper: { n: nu, l: lu }, lower: { n: nl, l: ll } };
}
/** the orbital's name: 3p */
export const orbName = (o) => o.n + L_LETTER[o.l];

/** atomStrip(table, Z) → the element's NIST lines from lines.json's rows [Z, λ, A, I, lowerConf, lowerTerm, upperConf, upperTerm]: { id, lambda, A,
 *  I, lower: { conf, term }, upper: { conf, term }, map ({ upper, lower } or null), why, group (the orbital pair's key, '' when unmapped) }, by λ;
 *  each line's `same` lists the other lines of its orbital pair */
export function atomStrip(rows, Z) {
  const out = [];
  for (const r of rows || []) {
    if (r[0] !== Z) continue;
    const m = activeElectron(r[4], r[6]), ok = !m.why;
    out.push({ id: 'nist:' + Z + ':' + r[1], lambda: r[1], A: r[2], I: r[3], lower: { conf: r[4], term: r[5] }, upper: { conf: r[6], term: r[7] },
      map: ok ? { upper: m.upper, lower: m.lower } : null, why: m.why || '', group: ok ? orbName(m.upper) + '-' + orbName(m.lower) : '' });
  }
  out.sort((a, b) => a.lambda - b.lambda);
  const G = new Map(); for (const L of out) if (L.group) { if (!G.has(L.group)) G.set(L.group, []); G.get(L.group).push(L); }
  for (const L of out) L.same = L.group ? G.get(L.group).filter((x) => x !== L) : [];
  return out;
}

/* ── the colour of a wavelength ──────────────────────────────────────────────────────────────────────────────────── */
const lobe = (x, mu, s1, s2) => { const t = (x - mu) / (x < mu ? s1 : s2); return Math.exp(-0.5 * t * t); };
const enc = (u) => (u <= 0.0031308 ? 12.92 * u : 1.055 * Math.pow(u, 1 / 2.4) - 0.055);
/** waveRGB(nm) → [r, g, b] 0…255 for 380–750 nm, else null */
export function waveRGB(nm) {
  if (!(nm >= 380 && nm <= 750)) return null;
  const X = 1.056 * lobe(nm, 599.8, 37.9, 31.0) + 0.362 * lobe(nm, 442.0, 16.0, 26.7) - 0.065 * lobe(nm, 501.1, 20.4, 26.2);
  const Y = 0.821 * lobe(nm, 568.8, 46.9, 40.5) + 0.286 * lobe(nm, 530.9, 16.3, 31.1);
  const Zc = 1.217 * lobe(nm, 437.0, 11.8, 36.0) + 0.681 * lobe(nm, 459.0, 26.0, 13.8);
  let r = 3.2406 * X - 1.5372 * Y - 0.4986 * Zc, g = -0.9689 * X + 1.8758 * Y + 0.0415 * Zc, b = 0.0557 * X - 0.2040 * Y + 1.0570 * Zc;
  r = Math.max(0, r); g = Math.max(0, g); b = Math.max(0, b);
  const top = Math.max(r, g, b) || 1, edge = nm < 420 ? 0.35 + 0.65 * (nm - 380) / 40 : nm > 700 ? 0.35 + 0.65 * (750 - nm) / 50 : 1;
  return [r, g, b].map((v) => Math.round(255 * enc(Math.min(1, v / top * edge))));
}
