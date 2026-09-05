/* OPUS Q4 — the rotation law of the k-fold patterns, and the PERIOD of Josh's four-channel state.
 * Round 1 C.2 offers the gate "rotate the clock by 201 a.u. and the 3-lobed pattern returns to itself".
 * 201.06 is the time for the pattern ANGLE to advance by 2pi.  A k-fold pattern returns to itself after
 * a turn of 2pi/k, so the period of the pattern is 2pi/(k*Omega) = 2pi/DeltaE, and for EVERY pair in
 * Josh's state |DeltaE| is the SAME number 3/32, so the WHOLE density is periodic with one period.
 */
import { BASIS, psiAt } from '../../lab/hydrogen.js';
const idx = (n, l, m) => BASIS.findIndex((s) => s.n === n && s.l === l && s.m === m);
const E = (n) => -0.5 / (n * n);
const ID = { p2m: idx(2,1,-1), p2p: idx(2,1,1), p4m: idx(4,1,-1), d4p: idx(4,2,2) };
const JOSH = [[ID.p2m, 0.5, 2], [ID.p2p, 0.5, 2], [ID.p4m, 0.5, 4], [ID.d4p, 0.5, 4]];

function amps(list, t) {
  const re = new Float64Array(91), im = new Float64Array(91), ids = [];
  for (const [a, c, n] of list) { const ph = -E(n) * t; re[a] = c * Math.cos(ph); im[a] = c * Math.sin(ph); ids.push(a); }
  return { re, im, ids };
}
function phiProfile(list, t, r, th, N = 720) {
  const { re, im, ids } = amps(list, t); const out = new Float64Array(N);
  for (let i = 0; i < N; i++) { const f = 2 * Math.PI * i / N;
    const p = psiAt(re, im, r*Math.sin(th)*Math.cos(f), r*Math.sin(th)*Math.sin(f), r*Math.cos(th), ids);
    out[i] = p.re*p.re + p.im*p.im; }
  return out;
}
/* the honest observable of a volume render: the density integrated over r and theta at each phi */
function columnPhi(list, t, N = 720, NR = 160, NT = 80, rmax = 40) {
  const { re, im, ids } = amps(list, t); const out = new Float64Array(N);
  const dr = rmax / NR, dth = Math.PI / NT;
  for (let i = 0; i < N; i++) { const f = 2*Math.PI*i/N; let s = 0;
    for (let a = 0; a < NR; a++) { const r = (a+0.5)*dr;
      for (let b = 0; b < NT; b++) { const th = (b+0.5)*dth;
        const p = psiAt(re, im, r*Math.sin(th)*Math.cos(f), r*Math.sin(th)*Math.sin(f), r*Math.cos(th), ids);
        s += (p.re*p.re + p.im*p.im) * r*r*Math.sin(th) * dr * dth; } }
    out[i] = s; }
  return out;
}
const maxima = (d) => { let n = 0; const N = d.length; for (let i = 0; i < N; i++) { const a = d[(i-1+N)%N], b = d[i], c = d[(i+1)%N]; if (b > a && b >= c && b > 1e-14) n++; } return n; };
function harm(d, K = 5) { const N = d.length, out = []; for (let k = 0; k <= K; k++) { let cr = 0, ci = 0; for (let i = 0; i < N; i++) { const f = 2*Math.PI*i/N; cr += d[i]*Math.cos(k*f); ci -= d[i]*Math.sin(k*f); } out.push({ amp: Math.hypot(cr,ci)/N*(k?2:1), ph: Math.atan2(ci,cr) }); } return out; }
const maxdiff = (a, b) => { let m = 0; for (let i = 0; i < a.length; i++) m = Math.max(m, Math.abs(a[i]-b[i])); return m; };

console.log('='.repeat(104));
console.log('1. THE FREQUENCY LIST of Josh\'s state 2p-1 + 2p+1 + 4p-1 + 4d+2');
const labs = [['2p-1',ID.p2m,-1,2],['2p+1',ID.p2p,1,2],['4p-1',ID.p4m,-1,4],['4d+2',ID.d4p,2,4]];
for (let i = 0; i < 4; i++) for (let j = i+1; j < 4; j++) {
  const dm = labs[j][2]-labs[i][2], dE = E(labs[j][3])-E(labs[i][3]);
  const om = dm ? dE/dm : NaN;
  console.log(`   ${labs[j][0]} x ${labs[i][0]}:  k=|dm|=${Math.abs(dm)}  dE=${dE.toFixed(6)}  Omega=dE/dm=${dm?om.toFixed(6):'  (dm=0)'}  turn-of-2pi=${dm?(2*Math.PI/Math.abs(om)).toFixed(2):'-'}  pattern period 2pi/|dE|=${dE?(2*Math.PI/Math.abs(dE)).toFixed(4):'inf (static)'}`);
}
const T = 2*Math.PI/(3/32);
console.log(`   EVERY nonzero |dE| in this state equals 3/32 = 0.09375 -> the FULL density is periodic with`);
console.log(`   T = 2pi/(3/32) = ${T.toFixed(4)} a.u. = ${(T*24.188843e-3).toFixed(3)} fs.  Round 1's 201.06 = 3T.`);

console.log();
console.log('='.repeat(104));
console.log('2. THE GATE, RUN.  max |rho(0) - rho(t)| over phi for the full four-channel state (r=6, th=75deg)');
const base = phiProfile(JOSH, 0, 6, Math.PI/2.4);
for (const t of [T/4, T/3, T/2, 2*T/3, T, 1.5*T, 2*T, 3*T]) {
  const d = phiProfile(JOSH, t, 6, Math.PI/2.4);
  console.log(`   t = ${t.toFixed(4).padStart(9)} (= ${(t/T).toFixed(4)} T)   max|drho| = ${maxdiff(base,d).toExponential(3)}   ${maxdiff(base,d) < 1e-13 ? '<- returns' : ''}`);
}
console.log('   -> the period is 67.0206, not 201.06.  201.06 passes the gate only because it is 3 x 67.0206.');
const pure = [[ID.d4p, 1/Math.SQRT2, 4], [ID.p2m, 1/Math.SQRT2, 2]];
const pb = phiProfile(pure, 0, 4, Math.PI/2.4);
console.log('   the PURE 3-fold pair 4d+2 + 2p-1 alone:');
for (const t of [T/2, T, 201.0619]) console.log(`     t = ${t.toFixed(4).padStart(9)}   max|drho| = ${maxdiff(pb, phiProfile(pure,t,4,Math.PI/2.4)).toExponential(3)}`);

console.log();
console.log('='.repeat(104));
console.log('3. THE ROTATION LAW Omega = dE/dm, measured (pure pair 4d+2 + 2p-1, argmax of rho(phi))');
for (const t of [0, 20, 40, 60, 80, 100]) {
  const d = phiProfile(pure, t, 4, Math.PI/2.4);
  let k = 0; for (let i = 1; i < d.length; i++) if (d[i] > d[k]) k = i;
  console.log(`   t = ${String(t).padStart(4)}   first maximum at phi = ${(k*0.5).toFixed(2).padStart(7)} deg -> mod 120 = ${((k*0.5)%120).toFixed(2).padStart(7)} deg   predicted (Omega t mod 120) = ${(((1/32)*t*180/Math.PI)%120).toFixed(2).padStart(7)} deg`);
}

console.log();
console.log('='.repeat(104));
console.log('4. WHICH HARMONIC WINS, AND WHERE.  |rho_k|/rho_0 of the four-channel state vs radius, t=0');
console.log('   r     k=1      k=2      k=3    | maxima in phi | 3-fold split: static(4d+2 x 4p-1) / rotating(4d+2 x 2p-1)');
for (const r of [2, 3, 4, 6, 8, 10, 12, 16, 20]) {
  const d = phiProfile(JOSH, 0, r, Math.PI/2.4); const h = harm(d);
  const stat = phiProfile([[ID.p4m,0.5,4],[ID.d4p,0.5,4]], 0, r, Math.PI/2.4);
  const rot  = phiProfile([[ID.p2m,0.5,2],[ID.d4p,0.5,4]], 0, r, Math.PI/2.4);
  const hs = harm(stat)[3].amp, hr = harm(rot)[3].amp;
  console.log(`  ${String(r).padStart(3)}  ${(h[1].amp/h[0].amp).toFixed(4)}  ${(h[2].amp/h[0].amp).toFixed(4)}  ${(h[3].amp/h[0].amp).toFixed(4)}  |     ${maxima(d)}         | ${hs.toExponential(3)} / ${hr.toExponential(3)}  ratio ${(hs/hr).toFixed(3)}`);
}
console.log();
console.log('5. WHAT A VOLUME RENDER SHOWS: the density integrated over r and theta at each phi');
for (const t of [0, T/6, T/3, T/2, 2*T/3, T]) {
  const c = columnPhi(JOSH, t); const h = harm(c);
  console.log(`   t = ${t.toFixed(3).padStart(8)}   maxima in phi = ${maxima(c)}   |rho_1|/rho_0=${(h[1].amp/h[0].amp).toFixed(4)}  |rho_2|/rho_0=${(h[2].amp/h[0].amp).toFixed(4)}  |rho_3|/rho_0=${(h[3].amp/h[0].amp).toFixed(4)}   arg(rho_3)/3 = ${(-h[3].ph/3*180/Math.PI).toFixed(2).padStart(7)} deg   arg(rho_2)/2 = ${(-h[2].ph/2*180/Math.PI).toFixed(2).padStart(7)} deg`);
}

console.log();
console.log('='.repeat(104));
console.log('6. C.3 AUDIT — "orbits are faster near the centre" as a NUMBER, and the correspondence principle');
console.log('   <v_phi> for 2p+1 = int |psi|^2 m/(r sin th) d^3x = 3 pi/32 =', (3*Math.PI/32).toFixed(6),
            'a.u.  (Bohr n=2 circular orbit speed 1/n = 0.5: the eigenstate flows 41% slower)');
console.log('   n :  |E_n|=1/2n^2    E_{n+1}-E_n     Kepler 1/n^3    (E_{n+1}-E_n)/(1/n^3)');
for (let n = 1; n <= 6; n++) {
  const dE = E(n+1) - E(n), kep = 1/(n*n*n);
  console.log(`   ${n} :  ${(0.5/n/n).toFixed(6)}      ${dE.toFixed(6)}       ${kep.toFixed(6)}         ${(dE/kep).toFixed(4)}`);
}
console.log('   -> the beat frequency approaches the Kepler frequency only as 1 - 3/2n + ...: at n=6 it is');
console.log('      still 20% low, at n=1 it is 2.7x low.  |E_n| is NOT the Kepler frequency (they cross at n=2 by accident).');

console.log();
console.log('='.repeat(104));
console.log('7. THE PHASE OF THE 3-FOLD IN THE VOLUME-INTEGRATED DENSITY over one full period (mod 120 deg)');
{
  let lo = 1e9, hi = -1e9, alo = 1e9, ahi = -1e9;
  for (let i = 0; i <= 24; i++) { const t = i*T/24; const c = columnPhi(JOSH, t, 360, 120, 60, 40); const h = harm(c);
    let ph = (-h[3].ph/3*180/Math.PI); ph = ((ph % 120) + 120) % 120; const a = h[3].amp/h[0].amp;
    lo = Math.min(lo, ph); hi = Math.max(hi, ph); alo = Math.min(alo, a); ahi = Math.max(ahi, a);
    if (i % 3 === 0) console.log(`   t/T = ${(i/24).toFixed(4)}   |rho_3|/rho_0 = ${a.toFixed(4)}   arg/3 mod 120 = ${ph.toFixed(3).padStart(8)} deg`); }
  console.log(`   -> over one period the 3-fold pattern LIBRATES through ${(hi-lo).toFixed(2)} deg (a full turn would be 120)`);
  console.log(`      while its amplitude BREATHES between ${alo.toFixed(4)} and ${ahi.toFixed(4)} (factor ${(ahi/alo).toFixed(2)}).`);
  console.log('      The 2-fold (2p-1 x 2p+1, dE = 0) is exactly static.  So the filmed object is a STANDING');
  console.log('      three-lobed figure that beats, not a pattern that turns once every 201 a.u.');
}
