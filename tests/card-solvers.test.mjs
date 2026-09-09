import { solveLadder } from '../lab/ladder-model.js';
import { h2CurveTable, sto3gH2, sto3gHydrogen } from '../lab/h2ci.js';

let failed = 0, total = 0;
function judge(name, ok, detail) {
  total++;
  if (!ok) { failed++; console.error('FAIL', name, detail ?? ''); }
}

const params = { nbar: 30, sigma: 2, d: 0, teeth: 8 };
const ladder = solveLadder(params);
judge('worker-ready ladder result preserves its requested parameters',
  Object.keys(params).every((key) => ladder.P[key] === params[key]), ladder.P);
judge('worker-ready ladder result contains the full recurrence and prediction payload',
  ladder.pops.length > 0 && ladder.pred.length === 121 && Number.isFinite(ladder.scan.aPeak)
    && Number.isFinite(ladder.sup.exact),
  { pops: ladder.pops.length, pred: ladder.pred.length, peak: ladder.scan.aPeak, exact: ladder.sup.exact });

const table = h2CurveTable(0.8, 2.4, 9);
const cloned = structuredClone(table);
judge('H2 curve table is serialisable and covers both requested endpoints',
  table.R.length === 9 && table.rhf.length === 9 && table.fci.length === 9
    && Math.abs(table.R[0] - 0.8) < 1e-12 && Math.abs(table.R[8] - 2.4) < 1e-12
    && cloned.R.length === 9,
  { lengths: [table.R.length, table.rhf.length, table.fci.length], endpoints: [table.R[0], table.R[8]] });
for (const i of [0, 4, 8]) {
  const direct = sto3gH2(table.R[i]);
  judge(`H2 curve sample ${i} is identical to the direct correlated solve`,
    Math.abs(table.rhf[i] - direct.rhf) < 1e-12 && Math.abs(table.fci[i] - direct.fci) < 1e-12,
    { table: [table.rhf[i], table.fci[i]], direct: [direct.rhf, direct.fci] });
}
judge('H2 curve carries the STO-3G dissociation limit used by the view',
  Math.abs(table.limit - 2 * sto3gHydrogen().E) < 1e-12, table.limit);

console.log((failed ? 'RED' : 'GREEN') + ` card-solvers.test — ${failed} failing of ${total}`);
process.exit(failed ? 1 : 0);
