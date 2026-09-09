/* Pure, serialisable LADDER solve. Keeping the expensive numerical pass here lets the card and the worker use the
 * same implementation; moving it off the UI thread changes when it runs, never the mathematics it runs. */
import { revivalClocks, packet, revivalScan, poissonAiryChirped, combVerdict, cubicPeak, peakLaw, clockAutocorr, superrevival } from './frontier.js';

export function solveLadder(params) {
  const P = { nbar: params.nbar, sigma: params.sigma, d: params.d, teeth: params.teeth };
  const clocks = revivalClocks(P.nbar, P.sigma);
  const pops = packet({ nbar: P.nbar, sigma: P.sigma, d: P.d, teeth: P.teeth });
  const scan = revivalScan(pops, P.nbar, { maxPeriods: 400, perPeriod: 20, fine: 601, fineHalf: 1.5 });
  const law = peakLaw(clocks.beta3);
  const pred = []; const NP = 121;
  for (let i = 0; i < NP; i++) { const x = -0.5 + i / (NP - 1); pred.push([x, poissonAiryChirped(P.nbar, P.sigma, x)]); }
  let comb = null;
  if (P.d >= 1) { const v = combVerdict(P.nbar, P.d); comb = { ...v, ...cubicPeak(pops, v.a, v.b) }; }
  const sup = superrevival(P.nbar, P.sigma);
  sup.exact = clockAutocorr(pops, P.nbar, 1, 1, 5).abs;
  return { P, clocks, pops, scan, law, pred, comb, sup };
}
