/* status.js — THE STATUS LINE (0.5.4 P4 · PLAN R8, R12, R14): ONE pure, DOM-free builder of what the stage may claim, in the badges' grammar — a STATE
 * word, EXACT (a closed form) · NUMERICAL (a solve checked against an oracle) · UNCHECKED (no oracle), and the PICTURE as a number saying its metric
 * (§J-2); VIEW adds its caveat.  Seats: THE HEAD's last line (word, oracle, geometry), INFORMATIONAL's STATUS row (per VIEW), chem.capability().  Built
 * on a landing, a VIEW change, a FLOW toggle or an owner change and kept, NEVER in a frame (`statusCalls`: the probe's witness).  Beside molecule-state.js,
 * not in it: that module's chemistry loads on the first solve (M8) and hydrogen's line is wanted before one.  tests/status.test.mjs is the table. */
/** THE FIELD LAW's bounds the picture quotes, named by metric: tests/helpers/field-law.mjs' members (P7c; tests/ is not served — tests/status.test.mjs holds
 *  them equal).  hydrogen: |Δψ| RMS, worst voxel; density: the worst voxel's |Δρ|/ρ, the one-ulp law's bound for ANY molecule, so ≤ that share of ρmax */
import { RELATIVITY_SHORT } from './atoms.js';   // the atom model's short name, typed once (009 MV, X6)
export const FIELD_LAW = Object.freeze({ hydrogen: Object.freeze({ rms: 3e-6, worst: 2e-4 }), density: Object.freeze({ worst: 2e-3 }) });
/** the catalogue's words (P3's `status.energy`) → the face's, written ONCE; absent → UNCHECKED; a closed form → EXACT */
export const STATE_WORD = Object.freeze({ MEASURED: 'NUMERICAL', IMPORTED: 'NUMERICAL', UNKNOWN: 'UNCHECKED' });
const VIEW = { density: ['DENSITY'], orbital: ['ORBITAL', 'sign and phase are arbitrary'], diff: ['Δρ', 'formed in double precision against its reference'], registry: ['MIX', 'a chosen superposition over the solve’s ladder, frozen'], flow: ['FLOW', 'direction exact, size qualitative'], esp: ['ESP', 'Φ at nuclei exact'], spin: ['SPIN', 'ρα − ρβ, signed'], dlda: ['Δ LDA−RHF', 'where LDA puts more density, D_LDA − D_RHF in double precision'] };
/** one figure, rounded UP: a number on the glass is never better than the one measured (a live |ΔE| never below the double's own |E|·ε) */
const up = (x) => { let [m, e] = x.toExponential(0).split('e').map(Number); if (Number(m + 'e' + e) < x) m++; return m > 9 ? '1e' + (e + 1) : m + 'e' + e; };
let calls = 0; export const statusCalls = () => calls;
/** statusOf({ owner, record | sol, oracle, view, label }) → { word, line, head, geometry }, or null for an owner it cannot speak for.  `record`: the
 *  catalogue row (oracle {what, delta}, geometry, status); `sol`: a live solve ({ energy }) checked against `oracle` ({ what, energy }). */
export function statusOf({ owner = 'molecule', record = null, sol = null, oracle = null, view = 'density', label = '', esp = null, Z = 0 } = {}) {   // esp: { N, min } once ESP's card landed · Z: the ATOM's element
  calls++;
  const S = sol && sol.model === 'UHF' ? (sol.multiplicity - 1) / 2 : null, s2 = S === null ? '' : `⟨S²⟩ ${sol.s2.toFixed(3)}`;   // 0.7.1: the contamination printed, never hidden
  const lda = !!sol && sol.model === 'RKS LDA';   // 0.7.3 K2: the method leads the line and ∫ρ (the grid's own quadrature error) rides with the energy
  const join = (...a) => a.filter(Boolean).join(' · '), said = (word, caveat, head, geometry = null) => ({ word, line: join(lda && 'RKS LDA', label || (lda && view === 'density' ? '' : VIEW[view][0]), s2 && 'UHF ' + s2, word, caveat),
    head: join(s2 && `${s2} (exact ${S * (S + 1)})`, head), geometry });   // the line keeps the 110-character budget; the head has room for S(S+1)
  if (owner === 'hydrogen') { const H = FIELD_LAW.hydrogen, p = `picture good to ${up(H.rms)} RMS (worst voxel ${up(H.worst)})`; label = label || 'HYDROGEN'; return said('EXACT', p, join(label !== 'HYDROGEN' && label, 'EXACT', p)); }   // 0.8.1 T2: a reduced mass rides in the label
  if (owner === 'stark') { label = label || 'HYDROGEN + F·z'; return said('NUMERICAL', 'eigensolve in the n ≤ 7 basis · no continuum: ionisation said, not simulated', join('NUMERICAL', 'INTER-SHELL STARK · eigensolve in the n ≤ 7 basis')); }   // 0.8.0 G3
  if (owner === 'atom') {   // iteration 008 A, A7, Z, 009 MV: past Kr the central field says it is scalar-relativistic without spin–orbit (atoms.js' header has the numbers); H–Kr keep no line
    if (!(Z > 36)) return null;
    const why = `scalar-relativistic (${RELATIVITY_SHORT}) Xα; spin–orbit not included`;
    const o = said('NUMERICAL', why, join('NUMERICAL', 'ATOM · ' + (label || 'Z = ' + Z), 'one Xα(2/3) + Latter-tail central field, scalar ZORA, MacDonald–Vosko exchange', 'no spin–orbit: a p or d level is its j = l ± ½ pair\'s average (Rn 6p splits by 3.6 eV)'));
    o.line = join(label, 'NUMERICAL', why); o.atom = true; return o;
  }
  if (owner !== 'molecule') return null;
  const o = oracle || (record && record.oracle) || null, st = record && record.status ? record.status.energy : o ? 'MEASURED' : 'UNKNOWN', word = STATE_WORD[st] || 'UNCHECKED';
  const d = o && Number.isFinite(o.delta) ? o.delta : o && sol ? Math.max(Math.abs(sol.energy - o.energy), Math.abs(o.energy) * Number.EPSILON) : NaN, geometry = (record && record.geometry) || null;
  const energy = join(st === 'IMPORTED' ? 'energy is PySCF\'s own' : Number.isFinite(d) ? `energy agrees with PySCF to ${up(Math.abs(d))} Eh` : '', lda && `∫ρ = ${sol.intRho.toFixed(6)}`);
  const out = said(word, view === 'density' ? join(energy, `picture good to ${+(FIELD_LAW.density.worst * 100).toPrecision(1)} % of ρmax`)
    : view === 'esp' && esp ? join(`${esp.N}³ grid`, VIEW.esp[1], `${esp.min < 0 ? '−' : ''}${Math.abs(esp.min).toFixed(2)} a.u. min`) : VIEW[view][1],
    join(word, energy, geometry && geometry !== 'experimental' ? 'geometry computed, not measured' : ''), geometry);
  if (lda) out.lda = 'RKS LDA' + (Number.isFinite(d) ? ' · PySCF ' + up(Math.abs(d)) : '');   // the export caption's method words
  return out;
}
