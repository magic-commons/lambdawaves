/* Fixed-nuclei, one-electron molecular pulse prototype, atomic units.
 * i S dc/dt = (H0 + E_z(t) Z) c, Z_ij = <chi_i|z|chi_j>.
 * Exponential midpoint: exactly S-unitary up to eigensolver/roundoff error, second order for varying E(t),
 * exact within this finite basis for a constant field. No renormalisation, RWA, nuclear motion or SCF.
 * H0 excludes nuclear repulsion. Diagnostics add it once. deltaDensity is electron number-density change,
 * not signed orbital amplitude or electric charge density. This module is not yet connected to the UI.
 */
import { generalisedEigen } from './sturmian.js';

export function createMODrive(mo, { R, c0 = null, field = () => 0, t0 = 0 } = {}) {
  if (!(Number.isFinite(R) && R > 0)) throw new Error('modrive: R must be positive and finite');
  if (!Number.isFinite(t0) || typeof field !== 'function') throw new Error('modrive: invalid time or field');
  const { S, H: H0, positionZ: Z } = mo.basisAt(R).M, n = mo.n;
  if (!Z || Z.length !== n * n) throw new Error('modrive: positionZ matrix required');
  let c = c0 ? { re: Float64Array.from(c0.re || c0), im: Float64Array.from(c0.im || new Float64Array(n)) }
    : { re: mo.vector(mo.solve(R)), im: new Float64Array(n) };
  if (c.re.length !== n || c.im.length !== n || ![...c.re, ...c.im].every(Number.isFinite))
    throw new Error('modrive: invalid coefficient vector');
  let t = t0, steps = 0, lastField = NaN, eig = null;
  const quadratic = (A) => {
    let v = 0;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++)
      v += A[i * n + j] * (c.re[i] * c.re[j] + c.im[i] * c.im[j]);
    return v;
  };
  const initialNorm = quadratic(S);
  if (!(initialNorm > 0) || Math.abs(initialNorm - 1) > 1e-8)
    throw new Error('modrive: initial state must have unit S-norm');
  const initialState = mo.state(R, c), initialPsi = initialState.psiAt;
  const normPsi = (f) => f.re * f.re + f.im * f.im;
  function fieldAt(time) {
    const v = field(time);
    if (!Number.isFinite(v)) throw new Error('modrive: field must return a finite number');
    return v;
  }
  function step(dt) {
    if (!Number.isFinite(dt) || !Number.isFinite(t + dt)) throw new Error('modrive: invalid timestep');
    if (dt === 0) return self;
    const Efield = fieldAt(t + dt / 2);
    if (Efield !== lastField) {
      const H = Float64Array.from(H0, (v, k) => v + Efield * Z[k]);
      // The electric field breaks inversion symmetry. Solve the FULL matrix, including g/u coupling.
      const next = generalisedEigen(S, H);
      if (next.rank !== n || ![...next.E, ...next.C].every(Number.isFinite))
        throw new Error('modrive: singular basis; rebuild with explicit overlap-rank handling');
      eig = next; lastField = Efield;
    }
    const { E, C } = eig, sr = new Float64Array(n), si = new Float64Array(n);
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      sr[i] += S[i * n + j] * c.re[j]; si[i] += S[i * n + j] * c.im[j];
    }
    const re = new Float64Array(n), im = new Float64Array(n);
    for (let k = 0; k < n; k++) {
      let ar = 0, ai = 0;
      for (let i = 0; i < n; i++) { ar += C[i * n + k] * sr[i]; ai += C[i * n + k] * si[i]; }
      const cs = Math.cos(E[k] * dt), sn = Math.sin(E[k] * dt);
      const br = ar * cs + ai * sn, bi = ai * cs - ar * sn;
      for (let i = 0; i < n; i++) { re[i] += C[i * n + k] * br; im[i] += C[i * n + k] * bi; }
    }
    c = { re, im }; t += dt; steps++;
    return self;
  }
  function observables() {
    const norm = quadratic(S), z = quadratic(Z) / norm, electronic = quadratic(H0) / norm;
    const Enuc = mo.Z_A * mo.Z_B / R, nuclearDipole = (mo.Z_B - mo.Z_A) * R / 2;
    const Ez = fieldAt(t), totalDipole = nuclearDipole - z;
    return { t, R, steps, norm, normDrift: norm - initialNorm, z, electronDipole: -z, totalDipole, field: Ez,
      electronic, fieldFreeTotal: electronic + Enuc,
      instantaneousTotal: electronic + Enuc - Ez * totalDipole,
      populations: Array.from(mo.state(R, c).populations) };
  }
  function snapshot() {
    const norm = quadratic(S), psi = mo.state(R, c).psiAt;
    // mo.state returns a normalised view; multiply back so this renderer exposes propagation norm errors.
    const density = (x, y, z) => norm * normPsi(psi(x, y, z));
    return { ...observables(), density,
      deltaDensity: (x, y, z) => density(x, y, z) - initialNorm * normPsi(initialPsi(x, y, z)) };
  }
  const self = { step, observables, snapshot,
    get t() { return t; }, get c() { return { re: Float64Array.from(c.re), im: Float64Array.from(c.im) }; },
    model: 'one electron; fixed nuclei; finite LCAO; length gauge; exponential midpoint' };
  return self;
}

/** Smooth finite pulse. Integrate across start/end with timestep refinement; carrier phase is explicit. */
export function sin2Pulse({ amplitude, omega, duration, start = 0, phase = 0 }) {
  if (![amplitude, omega, duration, start, phase].every(Number.isFinite) || duration <= 0 || omega < 0)
    throw new Error('modrive: invalid pulse parameters');
  return (t) => {
    const u = t - start;
    return u <= 0 || u >= duration ? 0 : amplitude * Math.sin(Math.PI * u / duration) ** 2 * Math.cos(omega * u + phase);
  };
}
