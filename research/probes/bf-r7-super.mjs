/* bf-r7-super.mjs — the superrevival law, all four residue classes, against the EXACT ladder sum.
 * The exact value uses clockAutocorr's integer phase reduction (t = πn̄⁵ ⇒ t/(4πn²) = n̄⁵/(4n²), rational),
 * so it is exact for any n̄; the prediction is the alias-summed cusp envelope with the Gauss-sum weights.
 */
import { packet, clockAutocorr, superrevival } from '../../lab/frontier.js';
console.log('   n̄    n̄%4  σ    γ_sr      γ₅        exact |A(T_sr)|   predicted       error     kind');
let worst = 0;
for (const [nbar, sigma] of [[2000, 3], [2000, 4], [4000, 4], [8000, 5], [400, 2], [2002, 4], [4002, 4], [8002, 5], [2001, 4], [2003, 4], [4001, 4], [2000, 2]]) {
  const S = superrevival(nbar, sigma), pops = packet({ nbar, sigma });
  const ex = clockAutocorr(pops, nbar, 1, 1, 5).abs;
  const err = Math.abs(ex - S.predicted);
  if (S.trustworthy) worst = Math.max(worst, err);
  console.log(`  ${String(nbar).padStart(5)}   ${S.cls}   ${String(sigma).padStart(2)}  ${S.gamma.toFixed(6)}  ${S.quintic.toExponential(2)}  ${ex.toFixed(9)}      ${S.predicted.toFixed(9)}   ${err.toExponential(2)}  ${S.kind}${S.trustworthy ? '' : '  (γ₅ large: not trustworthy)'}`);
}
console.log(`worst error where the quintic is small (γ₅ < 0.02): ${worst.toExponential(3)}`);
/* the other clocks, exactly: T_cl (A,B,M = 2,1,3), T_rev (4,3,4), T_4 (4,5,6) */
console.log('\nthe four clocks of one packet (n̄ = 2000, σ = 3), each evaluated by exact integer phase reduction:');
const pops = packet({ nbar: 2000, sigma: 3 });
for (const [name, A, B, M] of [['T_cl ', 2, 1, 3], ['T_rev', 4, 3, 4], ['T_sr ', 1, 1, 5], ['T_4  ', 4, 5, 6]])
  console.log(`  |A(${name})| = ${clockAutocorr(pops, 2000, A, B, M).abs.toFixed(10)}`);
console.log('\nthe same, with n̄ so large that a double loses the phase entirely (n̄ = 200000: t/(2n²) ≈ 1.6e19 rad):');
const big = packet({ nbar: 200000, sigma: 3 });
console.log(`  |A(T_sr)| = ${clockAutocorr(big, 200000, 1, 1, 5).abs.toFixed(10)}   predicted ${superrevival(200000, 3).predicted.toFixed(10)}`);
