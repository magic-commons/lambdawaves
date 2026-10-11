// (h) idea: the confined hydrogen atom through the RC road. Oracle (closed form, DERIVED-HERE): E_1s(R)=0 where the zero-energy s solution u=sqrt(r) J1(sqrt(8r)) vanishes: sqrt(8R)=j_{1,1}=3.831705970207512 -> R_c = j11^2/8.
import { numerov } from '/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/sos-s0/lab/cornell.js';
import fs from 'node:fs';
const V = (r) => -1 / r; const j11 = 3.831705970207512, Rc = j11 * j11 / 8;
const E = (R, N) => numerov(V, 1, 0, 1, { rmax: R, N, eMin: -1, eMax: 30 }).E;
const out = { Rc_exact: Rc, runs: [] };
for (const N of [4000, 16000, 64000]) { let lo = 1.0, hi = 3.0; for (let i = 0; i < 60; i++) { const mid = (lo + hi) / 2; if (E(mid, N) > 0) lo = mid; else hi = mid; } out.runs.push({ N, Rc_numerov: (lo + hi) / 2, absErr: Math.abs((lo + hi) / 2 - Rc) }); }
// free hydrogen (large R): E -> -0.5; and the textbook R=1: E=+2.374 (recalled)
out.E_R10 = E(10, 4000); out.E_R40 = E(40, 8000); out.E_R1 = E(1, 4000);
fs.writeFileSync(new URL('./sonnet0-h-confined-hydrogen.json', import.meta.url), JSON.stringify(out, null, 1)); console.log(out);
