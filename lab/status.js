/* status.js — THE STATUS LINE (0.5.4 P4 · PLAN R8, R12, R14): ONE pure, DOM-free builder of what the stage may claim, in the badges' grammar — a STATE
 * word, EXACT (a closed form) · NUMERICAL (a solve checked against an oracle) · UNCHECKED (no oracle), and the PICTURE as a number saying its metric
 * (§J-2); VIEW adds its caveat.  Seats: THE HEAD's last line (word, oracle, geometry), INFORMATIONAL's STATUS row (per VIEW), chem.capability().  Built
 * on a landing, a VIEW change, a FLOW toggle or an owner change and kept, NEVER in a frame (`statusCalls`: the probe's witness).  Beside molecule-state.js,
 * not in it: that module's chemistry loads on the first solve (M8) and hydrogen's line is wanted before one.  tests/status.test.mjs is the table. */
/** THE FIELD LAW, each constant named by its metric — PROVISIONAL until PAIR B2's lands (tests/status.test.mjs holds it equal to tests/helpers/field-law.mjs;
 *  the integrator reconciles at merge): hydrogen's |ψ_GPU − ψ| RMS and worst voxel; a density's worst voxel |ρ_GPU − ρ_f64| as a share of ρmax */
export const FIELD_LAW = Object.freeze({ hydrogen: Object.freeze({ rms: 2e-5, worstVoxel: 2e-4 }), density: Object.freeze({ ofRhoMax: 3e-4 }) });
/** the catalogue's words (P3's `status.energy`) → the face's, written ONCE; absent → UNCHECKED; a closed form → EXACT */
export const STATE_WORD = Object.freeze({ MEASURED: 'NUMERICAL', IMPORTED: 'NUMERICAL', UNKNOWN: 'UNCHECKED' });
const VIEW = { density: ['DENSITY'], orbital: ['ORBITAL', 'sign and phase are arbitrary'], diff: ['Δρ', 'formed in double precision against its reference'], flow: ['FLOW', 'direction exact, size qualitative'] };
/** one figure, rounded UP: a number on the glass is never better than the one measured (a live |ΔE| never below the double's own |E|·ε) */
const up = (x) => { let [m, e] = x.toExponential(0).split('e').map(Number); if (Number(m + 'e' + e) < x) m++; return m > 9 ? '1e' + (e + 1) : m + 'e' + e; };
let calls = 0; export const statusCalls = () => calls;
/** statusOf({ owner, record | sol, oracle, view, label }) → { word, line, head, geometry }, or null for an owner it cannot speak for.  `record`: the
 *  catalogue row (oracle {what, delta}, geometry, status); `sol`: a live solve ({ energy }) checked against `oracle` ({ what, energy }). */
export function statusOf({ owner = 'molecule', record = null, sol = null, oracle = null, view = 'density', label = '' } = {}) {
  calls++;
  const join = (...a) => a.filter(Boolean).join(' · '), said = (word, caveat, head, geometry = null) => ({ word, line: join(label || VIEW[view][0], word, caveat), head, geometry });
  if (owner === 'hydrogen') { const H = FIELD_LAW.hydrogen, p = `picture good to ${up(H.rms)} RMS (worst voxel ${up(H.worstVoxel)})`; label = label || 'HYDROGEN'; return said('EXACT', p, join('EXACT', p)); }
  if (owner !== 'molecule') return null;
  const o = oracle || (record && record.oracle) || null, st = record && record.status ? record.status.energy : o ? 'MEASURED' : 'UNKNOWN', word = STATE_WORD[st] || 'UNCHECKED';
  const d = o && Number.isFinite(o.delta) ? o.delta : o && sol ? Math.max(Math.abs(sol.energy - o.energy), Math.abs(o.energy) * Number.EPSILON) : NaN, geometry = (record && record.geometry) || null;
  const energy = st === 'IMPORTED' ? 'energy is PySCF\'s own' : Number.isFinite(d) ? `energy agrees with PySCF to ${up(Math.abs(d))} Eh` : '';
  return said(word, view === 'density' ? join(energy, `picture good to ${+(FIELD_LAW.density.ofRhoMax * 100).toPrecision(1)} % of ρmax`) : VIEW[view][1],
    join(word, energy, geometry && geometry !== 'experimental' ? 'geometry computed, not measured' : ''), geometry);
}
