// opus1-e-song-stepper — does hydrogen's FIRST drive (the song, 0.6.4) need a new STREAM queue and a new stepper, or is it the
// TD-CIS drive's own Strang step (mathworker.js:400–416 driveStep: free ½ · kick by the eigendecomposed operator at the midpoint
// field · free ½) handed hydrogen's energies and z matrix?  Read-only; the stepper below is driveStep with its two inputs
// (st.omega, op.U/op.values) made arguments — that is the whole "generalisation".
import { writeFileSync } from 'node:fs';
const T = '/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/sos-s0/';
const { dipoleMatrix } = await import(T + 'lab/radiation.js');
const { BASIS } = await import(T + 'lab/hydrogen.js');
const { eigSymQL } = await import(T + 'lab/linalg.js');
function setup(filter) {
  const idx = BASIS.map((s, i) => ({ ...s, i })).filter(filter), N = idx.length, Z = new Float64Array(N * N);
  for (let a = 0; a < N; a++) for (let b = 0; b < N; b++) Z[a * N + b] = dipoleMatrix(idx[a].i, idx[b].i).z.re;
  const t0 = performance.now(), op = eigSymQL(Z, N), eigMs = performance.now() - t0;
  return { idx, N, omega: idx.map((s) => -0.5 / (s.n * s.n)), op: { U: op.vectors, values: op.values }, eigMs };
}
function stepper(S) {                                      // driveStep, inputs as arguments
  const { N, omega, op } = S, br = new Float64Array(N), bi = new Float64Array(N), cr = new Float64Array(N), ci = new Float64Array(N);
  const free = (tau) => { for (let k = 0; k < N; k++) { const ph = -omega[k] * tau, c = Math.cos(ph), s = Math.sin(ph), x = br[k], y = bi[k]; br[k] = x * c - y * s; bi[k] = x * s + y * c; } };
  const kick = (theta) => { const U = op.U, r = op.values;
    for (let k = 0; k < N; k++) { let xr = 0, xi = 0; for (let i = 0; i < N; i++) { const u = U[i * N + k]; xr += u * br[i]; xi += u * bi[i]; } const ph = -theta * r[k], c = Math.cos(ph), s = Math.sin(ph); cr[k] = xr * c - xi * s; ci[k] = xr * s + xi * c; }
    for (let i = 0; i < N; i++) { let xr = 0, xi = 0; for (let k = 0; k < N; k++) { const u = U[i * N + k]; xr += u * cr[k]; xi += u * ci[k]; } br[i] = xr; bi[i] = xi; } };
  let t = 0; return { br, bi, step(h, field) { free(h / 2); kick(field(t + h / 2) * h); free(h / 2); t += h; }, get t() { return t; } };
}
const out = {};
for (const [name, filt] of [['m0 block (21)', (s) => s.m === 0], ['all 91 labels (z conserves m)', () => true]]) {
  const S = setup(filt), i1s = S.idx.findIndex((s) => s.n === 1 && s.l === 0 && s.m === 0), i2p = S.idx.findIndex((s) => s.n === 2 && s.l === 1 && s.m === 0);
  const mu = 128 * Math.SQRT2 / 243, w0 = 0.375, res = {};
  for (const [E0, dt] of [[1e-3, 0.5], [1e-3, 0.1], [1e-2, 0.5]]) {
    const D = stepper(S); D.br[i1s] = 1; const f = (t) => E0 * Math.cos(w0 * t), Om = E0 * mu, Tend = Math.PI / Om;
    const t0 = performance.now(); let n = 0, maxDev = 0; while (D.t < Tend) { D.step(dt, f); n++; if (n % 50 === 0) { const P = D.br[i2p] ** 2 + D.bi[i2p] ** 2; maxDev = Math.max(maxDev, Math.abs(P - Math.sin(Om * D.t / 2) ** 2)); } }
    const ms = performance.now() - t0; let nrm = 0; for (let k = 0; k < S.N; k++) nrm += D.br[k] ** 2 + D.bi[k] ** 2;
    res[`E0=${E0},dt=${dt}`] = { steps: n, msPer100: +(ms / n * 100).toFixed(2), unitarityErr: Math.abs(nrm - 1), maxDevFromRWA: +maxDev.toExponential(2) };
  }
  out[name] = { N: S.N, eigMs: +S.eigMs.toFixed(1), runs: res };
}
out.lines = { generaliseDriveStep_args: 4, hydrogenDriveInit_dipole_eig: 14, opsInWorker_init_run_set: 6, note: 'vs DRAFT 1 N1 +90 + STREAM queue +25: the request/reply chem.drive.{init,run,set} pattern (statesview.js:340–395) already streams a stateful drive to the clock (run to t, maxSteps, lag reported) — no new queue' };
writeFileSync(new URL('./opus1-e-song-stepper.json', import.meta.url), JSON.stringify(out, null, 1));
console.log(JSON.stringify(out, null, 1));
