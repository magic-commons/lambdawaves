// sonnet2-d: recompute D.18 from D.1-D.14 (every row's delta), the risk column, the Sigma row, and a sensitivity to the overrun multiplier (the 1.4 is the MEAN of FOUR BUILD pairs).
import fs from 'node:fs';
// per-row Delta, transcribed from PLAN-DRAFT-2 D.1-D.14 (line numbers of the plan in the comment)
const cuts = [
 { cut:'0.6.0', rows:[['FIELD OWNER',20],['C2 period guard',1],['M2+M2p equalizer',125],['C1 nodes',6],['M3 period',8],['M11a routes',12],['FLASH law',10],['N6+floor tile',15],['dephasing caption',1],['catalogue rows',0]], sub:18, subNote:'-8 stand-downs, -10 stale', ui:0 },       // D.1 :232-247
 { cut:'0.6.1', rows:[['M4 factor road',150],['M10 symmetry',15],['N6 VALENCE',5]], sub:0, ui:15 },                                                             // D.2 :254-256
 { cut:'0.6.2', rows:[['M1 continuity',155],['M7 gated',12],['M11b pitch',12],['N6 honest',10],['C4 H2',8]], sub:0, ui:0 },                                  // D.3
 { cut:'0.6.3', rows:[['M8 classifier',40],["M8' nodes",40],['M5a+b',100],['M6 core',15]], sub:20, ui:40 },                                                       // D.4 (the sum is 195)
 { cut:'0.6.4', rows:[['N1',75],['M12 chord',60],['film-safe',30]], sub:85, ui:60 },                                                                            // D.5
 { cut:'0.6.5', rows:[['N2 potential',140],['card road',35]], sub:90, ui:0 },                                                                                       // D.6
 { cut:'0.7.0', rows:[['N3 vibrate',80],['skeleton',60],['pulses',20],['spin-1/2',25]], sub:0, ui:60 },                                                          // D.7
 { cut:'0.7.1', rows:[['uhf etc (<=140)',140],['H2 curve (+50 inside?)',0]], sub:70, ui:0, note:'D.8: brief-named <=140 + skeleton if slipped; the H2 curve +50 is listed INSIDE D.8 but D.18 prints <=140 (+60)' },
 { cut:'0.7.2', rows:[['N4 lattice',120],['RM volume',31],['presets',0],['A-B patch',30]], sub:70, ui:0 },                                                          // D.9 :  181 incl +1 MODEL_RANK? (120+31+30=181)
 { cut:'0.7.3', rows:[['Kohn-Sham',180]], sub:0, ui:0 },
 { cut:'0.7.4', rows:[['catalogue',40],['shelves',52]], sub:0, ui:92 },
 { cut:'0.8.0', rows:[['generic H + five',84],['squeeze+cat',40],['inter-shell STARK',50]], sub:0, ui:0 },
 { cut:'0.8.1', rows:[['Rabi+LZ',50],['mass',10],['presets',20],['RU records',50]], sub:0, ui:0 },
 { cut:'0.8.2', rows:[['QHO Wigner',40],['coherence',30],['A(t)',30],['bead+ray',50],['ellipsoid',50]], sub:0, ui:200 },
];
const printed = { '0.6.0':[198,18,180,268], '0.6.1':[170,0,170,238], '0.6.2':[197,0,197,276], '0.6.3':[195,20,175,263], '0.6.4':[165,85,80,189], '0.6.5':[175,90,85,200], '0.7.0':[185,0,185,259], '0.7.1':[140,70,130,249], '0.7.2':[181,70,111,218], '0.7.3':[180,0,180,252], '0.7.4':[92,0,92,184], '0.8.0':[174,0,174,244], '0.8.1':[130,0,130,182], '0.8.2':[200,0,200,280] };
const res = []; let S = { new: 0, sub: 0, net: 0, printedNew: 0 };
for (const c of cuts) {
  const sum = c.rows.reduce((a, r) => a + r[1], 0); const p = printed[c.cut];
  const net = sum - c.sub; const risk14 = sum * 1.4 - c.sub * 0.5;
  // UI rows at 2x, the rest at 1.4
  const riskUI = (sum - c.ui) * 1.4 + c.ui * 2 - c.sub * 0.5;
  const r2 = sum * 2.02 - c.sub * 0.5, r1 = sum * 1.0 - c.sub * 0.5;
  res.push({ cut: c.cut, rowsSum: sum, printedNew: p[0], dNew: sum - p[0], sub: c.sub, printedSub: p[1], net, printedNet: p[2], dNet: net - p[2], risk14: +risk14.toFixed(1), printedRisk: p[3], dRisk: +(risk14 - p[3]).toFixed(1),
    riskUIrowsAt2: +riskUI.toFixed(1), uiRows: c.ui, risk_at_1_0: +r1.toFixed(1), risk_at_2_02: +r2.toFixed(1), over280_at_1_43: sum * 1.43 - c.sub * 0.5 > 280, over280_ui2: riskUI > 280, over280_at_2_02: r2 > 280, note: c.note || '' });
  S.new += sum; S.sub += c.sub; S.net += net; S.printedNew += p[0];
}
const printedSumNew = 2382, printedSub = 353, printedNet = 2029;
// recompute the printed column sums
const pNew = Object.values(printed).reduce((a, p) => a + p[0], 0), pSub = Object.values(printed).reduce((a, p) => a + p[1], 0), pNet = Object.values(printed).reduce((a, p) => a + p[2], 0);
const out = { tag: 'DERIVED-HERE (arithmetic on the plan\'s printed per-row deltas)', cuts: res,
  sums: { fromRows: S, printedColumnsRecomputed: { new: pNew, sub: pSub, net: pNet }, printedSigma: { new: printedSumNew, sub: printedSub, net: printedNet }, halfSub: pSub / 2,
          netAtHalfSub: pNew - pSub / 2 },
  multiplier: { addPairs: [1.12, 1.98, 0.58, 2.02], mean: (1.12 + 1.98 + 0.58 + 2.02) / 4, sd: 0, subPairs: [0.78, 0.48, 0.5], meanSub: (0.78 + 0.48 + 0.5) / 3 } };
const a = out.multiplier.addPairs, m = out.multiplier.mean; out.multiplier.sd = +Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / (a.length - 1)).toFixed(3); out.multiplier.se = +(out.multiplier.sd / 2).toFixed(3);
out.multiplier.medianTrue = +((0.58 + 0.58 * 0 + 1.12 + 1.98) / 1 && ([0.58,1.12,1.98,2.02][1] + [0.58,1.12,1.98,2.02][2]) / 2).toFixed(3);
out.sensitivity = ['1.0', '1.43', '2.02'].map((k) => ({ mult: +k, cutsOver280: res.filter((r) => (r.rowsSum * +k - r.sub * 0.5) > 280).map((r) => r.cut) }));
fs.writeFileSync(new URL('./sonnet2-d-d18.json', import.meta.url), JSON.stringify(out, null, 1));
console.log(JSON.stringify({ sums: out.sums, multiplier: out.multiplier, sensitivity: out.sensitivity }, null, 1));
for (const r of res) console.log(r.cut, 'rows', r.rowsSum, 'printed', r.printedNew, 'd', r.dNew, '| sub', r.sub, '| net', r.net, r.printedNet, '| risk', r.risk14, r.printedRisk, 'd', r.dRisk, '| uiAt2', r.riskUIrowsAt2, '| @2.02', r.risk_at_2_02, r.note);
