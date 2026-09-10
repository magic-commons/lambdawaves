/* period.js — THE CLOCK's law: when does a register state's density repeat?
 *
 * The density of Σ c_a ψ_a e^{−iE_a t} is Σ_ab c_a c_b* ψ_a ψ_b* e^{−i(E_a − E_b)t}: it repeats when every difference
 * ΔE_ab · T is a multiple of 2π — i.e. when the differences are commensurate, T = 2π / gcd{|ΔE_ab|}.  For hydrogen
 * (E_n = −1/2n², n ≤ 6, Z = 1) every difference is an integer multiple of 1/7200 (lcm(1…6)² = 3600), so the period is
 * exact and at most 2π·7200 = 45 238.93 a.u. = 1.094 ps (any set of shells whose differences have no common factor,
 * e.g. {3, 4, 5}); {2, 4} gives 64π/3 = 67.021, {1, 2} gives 16π/3 = 16.755 (the Lyman-α beat).  For Z ≠ 1 the
 * energies scale by Z² and the period by 1/Z².  For the oscillator the differences are integers, T = 2π/gcd.  For
 * the box, the quarkonium and any state under a Stark field the differences are in general incommensurate: there is no
 * exact period, and this says so — with the best near-recurrence it can find within a horizon, and its error.
 *
 * STATUS: EXACT where it reports a period (a theorem about the energies in force, and the gcd it rests on is VERIFIED
 * against every difference to 1e-9 of a turn before it is reported — wave 42); the near-recurrence is a search.
 */
const gcdInt = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) { const t = a % b; a = b; b = t; } return a; };
/** the best rational p/q ≈ x with q ≤ qmax (continued fractions); null when |x − p/q| > tol·|x| */
export function rational(x, qmax = 1e6, tol = 1e-9) {
  if (!isFinite(x)) return null;
  const sign = x < 0 ? -1 : 1; x = Math.abs(x);
  let h0 = 0, h1 = 1, k0 = 1, k1 = 0, r = x;
  for (let i = 0; i < 64; i++) {
    const a = Math.floor(r), h2 = a * h1 + h0, k2 = a * k1 + k0;
    if (k2 > qmax) break;
    h0 = h1; h1 = h2; k0 = k1; k1 = k2;
    if (Math.abs(x - h1 / k1) <= tol * Math.max(1, x)) return { p: sign * h1, q: k1 };
    const frac = r - a; if (frac < 1e-15) break; r = 1 / frac;
  }
  return Math.abs(x - h1 / k1) <= tol * Math.max(1, x) ? { p: sign * h1, q: k1 } : null;
}

function periodDifferences(energies) {
  const E = []; for (const e of [...energies].sort((a, b) => a - b)) if (!E.length || Math.abs(e - E[E.length - 1]) > 1e-12) E.push(e);
  const d = []; for (let i = 0; i < E.length; i++) for (let j = i + 1; j < E.length; j++) { const v = Math.abs(E[j] - E[i]); if (v > 1e-12) d.push(v); }
  return { E, d };
}

/* The exact/commensurate half is quick even for a full register. Exposing it lets
   the UI answer common hydrogen and oscillator states without starting a worker;
   null means the bounded near-recurrence scan is genuinely needed. */
export function densityPeriodExact(energies, { tol = 1e-10, qmax = 20000 } = {}) {
  const { E, d } = periodDifferences(energies);
  return exactFromDifferences(E, d, tol, qmax);
}
function exactFromDifferences(E, d, tol, qmax) {
  if (E.length < 2 || !d.length) return { exact: true, T: 0, g: 0, stationary: true };
  const dmin = Math.min(...d);
  const rats = d.map((v) => rational(v / dmin, qmax, tol));
  if (!rats.every(Boolean)) return null;
  let L = 1; for (const r of rats) L = L / gcdInt(L, r.q) * r.q;
  let G = 0; for (const r of rats) G = gcdInt(G, Math.round(r.p * L / r.q));
  const g = dmin * G / L;
  let verr = 0; for (const v of d) { const x = v / g; verr = Math.max(verr, Math.abs(x - Math.round(x))); }
  return verr < 1e-9 ? { exact: true, T: 2 * Math.PI / g, g, count: E.length, pairs: d.length, verified: verr } : null;
}
/**
 * densityPeriod(energies) — energies: the distinct energies (a.u.) of the populated labels.
 * Returns { exact: true, T, g } with T in a.u. (g = gcd of the differences), or { exact: false, T, err } for the best
 * near-recurrence within `horizon` a.u. (max over pairs of the distance of ΔE·T/2π from an integer), or { exact: true,
 * T: 0 } for a single energy (a stationary state).
 */
export function densityPeriod(energies, { horizon = 2e4, tol = 1e-10, qmax = 20000 } = {}) {
  /* the commensurability test must be STRICTER than Dirichlet: any real is within 1/q² of some p/q, so at q ≤ 2·10⁴ a
     random ratio is matched to ~1e-9; a true rational of the register (denominators ≤ 7200) is matched to 1e-15.
     The energies are NOT rounded before the test (a 12-digit rounding once perturbed the {3,4,5} ratios past 1e-11) */
  const { E, d } = periodDifferences(energies);
  const exact = exactFromDifferences(E, d, tol, qmax);
  if (exact) return exact;
  /* incommensurate: the best near-recurrence up to the horizon (a scan on the finest beat, refined).
     THE SCAN STARTS AT ONE FULL TURN OF THE FASTEST BEAT (k = 64 · step = 2π/max ΔE), never at its own first step:
     every spectrum has an arbitrarily good "recurrence" at T → 0, where nothing has moved yet, and for a WIDE
     spectrum that degenerate answer WON — {0, 1, e, π, 50} used to report T = 1.96e-3 a.u. with err = 1/64 exactly,
     the k = 1 sample, a time at which the slow pairs have turned by a thousandth of a cycle.  A recurrence shorter
     than one turn of the fastest beat is not a recurrence (the same law the transport already applies under
     STURMIAN, rack.js periodText), so the scan below cannot see one. */
  let best = { T: 0, err: 1 };
  const step = 2 * Math.PI / Math.max(...d) / 64, N = Math.min(2e6, Math.floor(horizon / step));
  for (let k = 64; k <= N; k++) { const T = k * step; let e = 0; for (const v of d) { const x = v * T / (2 * Math.PI); const f = Math.abs(x - Math.round(x)); if (f > e) e = f; } if (e < best.err) best = { T, err: e }; if (best.err < 1e-4) break; }
  return { exact: false, T: best.T, err: best.err, count: E.length, pairs: d.length };
}
/** the hydrogen shells' law, closed form: T = 2π·7200/gcd for shells n ⊂ {1…6} at Z = 1 — the table's oracle */
export function hydrogenShellPeriod(shells, Z = 1) {
  const S = [...new Set(shells)].sort((a, b) => a - b); if (S.length < 2) return 0;
  let g = 0; for (let i = 0; i < S.length; i++) for (let j = i + 1; j < S.length; j++) g = gcdInt(g, Math.round(3600 / (S[i] * S[i]) - 3600 / (S[j] * S[j])));
  return 2 * Math.PI * 7200 / g / (Z * Z);
}
export const AU_FS = 0.02418884326;
export function fmtPeriod(T) {
  if (!T || !Number.isFinite(T)) return '—';
  const fs = T * AU_FS;
  const au = Math.abs(T) >= 1e6 ? T.toExponential(2).replace('e+', 'e')
    : T >= 1000 ? T.toFixed(0) : T >= 100 ? T.toFixed(1) : T.toFixed(2);
  const units = [['fs', 1], ['ps', 1e3], ['ns', 1e6], ['µs', 1e9], ['ms', 1e12], ['s', 1e15], ['min', 6e16], ['h', 3.6e18], ['d', 8.64e19]];
  let i = 0;
  while (i + 1 < units.length && Math.abs(fs) >= units[i + 1][1]) i++;
  const q = fs / units[i][1];
  const physical = Math.abs(q) >= 1e4 ? q.toExponential(2).replace('e+', 'e')
    : i === 0 ? (Math.abs(q) >= 10 ? q.toFixed(1) : q.toFixed(3))
    : Math.abs(q) >= 100 ? q.toFixed(1) : Math.abs(q) >= 10 ? q.toFixed(2) : q.toFixed(3);
  return au + ' a.u. · ' + physical + ' ' + units[i][0];
}
