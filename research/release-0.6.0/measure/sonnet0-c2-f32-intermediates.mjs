// (c2) the f32 INTERMEDIATES of the kernel's space-0 line  f = c.z * exp(-0.5*rho) * ipow(rho,l) * L * ipow(st,am) * D  for circular |n,n-1,n-1>
// computed in log10 with lgamma (f64), no tree import needed except constants quoted: FACT limit 24 at hydrogen.js:31-32; F32 min normal 1.1755e-38, max 3.4028e38.
import fs from 'node:fs';
const lg = (z) => { const g = 7, c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7]; z -= 1; let x = c[0]; for (let i = 1; i < g + 2; i++) x += c[i] / (z + i); const t = z + g + 0.5; return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x); };
const L10 = Math.log(10), MINN = Math.log10(1.17549435e-38), MAXF = Math.log10(3.4028235e38);
const rows = [];
for (let n = 10; n <= 32; n++) {
  const l = n - 1, m = l;
  const lnRad = 0.5 * (3 * Math.log(2 / n) + lg(1) - Math.log(2 * n) - lg(2 * n));          // ln radialNorm(n,l)  ((n-l-1)! = 1, (n+l)! = (2n-1)!)
  const lnYlm = 0.5 * (Math.log((2 * l + 1) / (4 * Math.PI)) + lg(1) - lg(2 * l + 1));       // ylmNorm(l,l): (l-m)!=1, (l+m)! = (2l)!
  const lnD = lg(2 * l + 1) - l * Math.log(2) - lg(l + 1);                                   // leg coefficient of d^l P_l/dx^l = (2l)!/(2^l l!)
  const lnC = lnRad + lnYlm;                                                                 // T.norm (c.z)
  const rhoPk = 2 * n;
  const log10 = (x) => x / L10;
  const cz = log10(lnC), cExp = log10(lnC - rhoPk / 2), ip = log10(l * Math.log(rhoPk)), prod = log10(lnC - rhoPk / 2 + l * Math.log(rhoPk));
  rows.push({ n, l, log10_normC: +cz.toFixed(2), log10_legCoeff: +log10(lnD).toFixed(2), log10_cz_times_exp_at_peak: +cExp.toFixed(2), log10_ipow_at_peak: +ip.toFixed(2),
    log10_full_f_at_peak_without_D: +prod.toFixed(2),
    legOverflowsF32: log10(lnD) > MAXF, czTimesExpBelowF32Normal: cExp < MINN, czBelowF32Normal: cz < MINN, ipowOverflowsF32: ip > MAXF });
}
const first = (k) => rows.find((r) => r[k])?.n;
const summary = { firstN_czTimesExpBelowF32Normal: first('czTimesExpBelowF32Normal'), firstN_ipowOverflows: first('ipowOverflowsF32'), firstN_legOverflows: first('legOverflowsF32'), firstN_czBelowNormal: first('czBelowF32Normal'),
  reading: 'the left-to-right product c.z*exp(-rho/2)*ipow(rho,l) leaves f32 normal range at the first listed n for its column; ipow overflow is the last-to-go only because the exp factor underflows earlier' };
fs.writeFileSync(new URL('./sonnet0-c2-f32-intermediates.json', import.meta.url), JSON.stringify({ summary, rows }, null, 1));
console.log(summary); for (const r of rows.filter((r) => [14, 16, 18, 19, 20, 21, 22, 24, 26, 28, 30].includes(r.n))) console.log(JSON.stringify(r));
