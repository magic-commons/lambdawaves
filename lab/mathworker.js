/* mathworker.js — the maths that must never sit on the pointer, run off the frame thread (wave 45).
 *
 * STATUS: DETERMINISTIC — every op here is the same pure function the rack calls on the main thread, imported from
 * the same modules, so an answer from the worker is bit-identical to the synchronous road (kick.js, well.js,
 * period.js); the worker only moves WHEN the work happens.  Three ops, each a request/reply keyed by id:
 *   config  { id, ham, Z, radius }                 → the Hamiltonian selector mirrored (hydrogen with its Z, the oscillator, the BOX with its radius)
 *   warm    {}                                     → the SLAP tables built here, once, so the first bow pays nothing anywhere
 *   kick    { re, im, k, d, ham, Z, radius }       → the bow's slap e^{ik·x} on a snapshot of c(t): the kicked vector, ⟨p⟩ along d before and after
 *   packet  { x0, k, sigma, radius }               → the BOX bow: the Gaussian projected on the well's 91 eigenstates (well.js wellPacket)
 *   period  { energies, horizon }                  → the density's period / near-recurrence scan (period.js densityPeriod) for the transport's readout
 * The tabulated Hamiltonians (ATOM, QUARKONIUM) are not mirrored: the rack keeps their slap on the main thread.
 */
import { setHamiltonian, setZ, HAMILTONIANS } from './hamiltonian.js';
import { applyKickAlong, momentumZ, warmStep } from './kick.js';
import { applyRotor } from './frontier.js';
import { rotorsToZ } from './kick.js';
import { wellPacket } from './well.js';
import { densityPeriod } from './period.js';

function configure(m) {
  if (m.radius) HAMILTONIANS.well.setRadius(m.radius);
  if (m.ham) setHamiltonian(m.ham);
  if (m.Z) setZ(m.Z);
}
/** ⟨p⟩ along a unit direction: the register carried to z by the two rotors, then Heisenberg's p_z (as rack.js pAlongDir) */
function pAlong(re, im, d) {
  const r = Float64Array.from(re), i = Float64Array.from(im);
  for (const s of rotorsToZ(d)) applyRotor(r, i, { which: 'both', axis: s.axis, angle: s.angle });
  return momentumZ(r, i);
}
self.onmessage = (e) => {
  const m = e.data; let out = {}, transfer = [];
  try {
    if (m.op === 'config') { configure(m); out = { ok: true }; }
    else if (m.op === 'warm') { configure(m); while (!warmStep(1e9)) { /* to the end */ } const one = new Float64Array(91).fill(0.1), zero = new Float64Array(91); pAlong(one, zero, [0, 0, 1]); out = { ok: true }; }   // the tables AND the dipole quadratures momentumZ caches (the first bow's other 100 ms)
    else if (m.op === 'kick') {
      configure(m);
      const re = Float64Array.from(m.re), im = Float64Array.from(m.im);
      const p0 = pAlong(re, im, m.d);
      applyKickAlong(re, im, m.k, m.d);
      const p1 = pAlong(re, im, m.d);
      out = { re, im, p0, p1 }; transfer = [re.buffer, im.buffer];
    } else if (m.op === 'packet') {
      HAMILTONIANS.well.setRadius(m.radius);
      const P = wellPacket(m.x0, m.k, m.sigma);
      out = { re: P.re, im: P.im, captured: P.captured }; transfer = [P.re.buffer, P.im.buffer];
    } else if (m.op === 'period') { out = densityPeriod(m.energies, { horizon: m.horizon || 2e4 }); }
    else out = { error: 'unknown op ' + m.op };
  } catch (err) { out = { error: String(err && err.message || err) }; transfer = []; }
  self.postMessage(Object.assign({ id: m.id, op: m.op }, out), transfer);
};
