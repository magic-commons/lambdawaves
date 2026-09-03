/* bf-r8-chirp.mjs — Round 8 (Fable): does restoring the chirp actually improve the fold prediction?
 * Round 6: "the residual chirp δ = 3πxσ²/n̄ is 67.5× β₄ at (600, 2, 0.5); restoring it cuts the error 5.6×."
 * Test against the EXACT ladder sum (not against either prediction).
 */
import { packet, ladderAutocorr, revivalClocks, poissonAiry, poissonAiryChirped } from '../../lab/frontier.js';
console.log('  n̄    σ     x      δ = 3πxσ²/n̄   β₄         exact      Airy       chirped    err(Airy)  err(chirp)  gain');
let sumA = 0, sumC = 0;
for (const [nbar, sigma] of [[600, 2], [300, 2], [150, 2]]) {
  const { Tcl, Trev, beta4 } = revivalClocks(nbar, sigma), pops = packet({ nbar, sigma });
  for (const x of [0, 0.13, -0.31, 0.5, 0.27]) {
    const exact = ladderAutocorr(pops, Trev + x * Tcl).abs;
    const a = poissonAiry(nbar, sigma, x), c = poissonAiryChirped(nbar, sigma, x);
    const ea = Math.abs(a - exact), ec = Math.abs(c - exact);
    sumA += ea; sumC += ec;
    const delta = 3 * Math.PI * x * sigma * sigma / nbar;
    console.log(`  ${String(nbar).padStart(4)} ${String(sigma).padStart(2)}  ${String(x).padStart(5)}  ${delta.toFixed(6).padStart(12)}  ${beta4.toExponential(2)}  ${exact.toFixed(6)}  ${a.toFixed(6)}  ${c.toFixed(6)}  ${ea.toExponential(2)}  ${ec.toExponential(2)}  ${(ea / ec).toFixed(1)}×`);
  }
}
console.log(`total error: Airy ${sumA.toExponential(3)} → chirped ${sumC.toExponential(3)}  (${(sumA / sumC).toFixed(2)}× better)`);
