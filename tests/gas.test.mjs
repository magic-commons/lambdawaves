/* tests/gas.test.mjs — the node proof of THE AXIAL GAS (the box's second register, 256 modes, m = 0).
 *   node tests/gas.test.mjs
 * Oracles: orthonormality of the well basis by quadrature, the capture of a small packet, the free-Gaussian laws for
 * ⟨z⟩(t) and σ_z(t) before the wall, and the turn-around at the wall.
 */
import { createGas, sphj, zerosOf, legP } from '../lab/gas.js';

let FAILED = 0, TOTAL = 0;
function judge(name, ok, detail) {
  TOTAL++; if (!ok) FAILED++;
  console.log((ok ? 'GREEN ' : 'RED   ') + name + (detail === undefined ? '' : '\n      ' + JSON.stringify(detail).slice(0, 300)));
}
{
  const z0 = zerosOf(0, 3), z5 = zerosOf(5, 2), z15 = zerosOf(15, 1);
  judge('ZEROS: j₀ at nπ, j₅ near 9.356 / 12.966, the first zero of j₁₅ = 20.5402 (McMahon; my first guess of 20.12 was wrong)', Math.abs(z0[0] - Math.PI) < 1e-9 && Math.abs(z0[2] - 3 * Math.PI) < 1e-9 && Math.abs(z5[0] - 9.3558) < 2e-3 && Math.abs(z5[1] - 12.9665) < 2e-3 && Math.abs(z15[0] - 20.5402) < 2e-3, { z0, z5, z15 });
  judge('LEGENDRE: P₃(0.5) = −0.4375 and P₁₅(1) = 1 by the recurrence', Math.abs(legP(3, 0.5) + 0.4375) < 1e-12 && Math.abs(legP(15, 1) - 1) < 1e-12, { p3: legP(3, 0.5), p15: legP(15, 1) });
}
{
  const gas = createGas(10);
  const N = gas.modes.length;
  let worst = 0; for (const l of [0, 7, 15]) { const idx = gas.modes.map((m, i) => (m.l === l ? i : -1)).filter((i) => i >= 0).slice(0, 6); for (const a of idx) for (const b of idx) worst = Math.max(worst, Math.abs(gas.overlap(a, b) - (a === b ? 1 : 0))); }
  judge('THE BASIS: 256 modes (n_r ≤ 15, l ≤ 15), orthonormal on the quadrature grid to 5e-3 for l = 0, 7 and 15', N === 256 && worst < 5e-3, { N, worst });
  const P = gas.launch(-5, 2, 0.8, 0);
  const s0 = gas.stats(0, 1), s1 = gas.stats(1, 1);
  const sigmaFree = 0.8 * Math.sqrt(1 + (1 / (2 * 0.8 * 0.8)) ** 2);
  judge('A SMALL PACKET: σ = 0.8 a₀, k = 2 at z₀ = −5 in the a = 10 box is held to > 95 %, unit norm, centred at z₀ ± 0.05, and after t = 1 sits at z₀ + k·t ± 0.1 with the free-Gaussian width σ√(1 + (t/2σ²)²) ± 10 %',
    P.captured > 0.95 && Math.abs(gas.norm2(0) - 1) < 1e-12 && Math.abs(s0.z + 5) < 0.05 && Math.abs(s1.z + 3) < 0.1 && Math.abs(s1.sz - sigmaFree) < 0.1 * sigmaFree, { captured: P.captured, s0, s1, sigmaFree });
  const zs = [4, 6, 8, 10].map((t) => gas.stats(t, 2).z);
  judge('THE WALL: the centre never leaves the box (⟨z⟩ < a) and has turned around by t = 10 (⟨z⟩(10) < ⟨z⟩(8)) — a real reflection of the exact evolution', zs.every((z) => z < 10) && zs[3] < zs[2] && zs[1] > zs[0], { zs });
  const fm = gas.fieldModes(0);
  judge('THE RECORDS: the field gets ≤ 256 well records with the recurrence flag set (lag[2] = 1), l up to 15', fm.length > 100 && fm.length <= 256 && fm.every((m) => m.table.lag[2] === 1) && Math.max(...fm.map((m) => m.table.l)) >= 12, { count: fm.length, lmax: Math.max(...fm.map((m) => m.table.l)) });
}
/* K7 (optimization 2026-09-24): the Hermite table.  The row a record points at must be its MODE index (l·16 + n_r, build()'s
   order), never its position in fieldModes' filtered list (REFUTE-F §2 (i)); OFF — a gas nobody asked, or `?gastab=0` — every
   record carries 0. */
{
  const { gasRadialTable, GAS_TABLE_N } = await import('../lab/gas.js');
  const gas = createGas(10, { warm: false });
  gas.launch(-5, 2, 0.8, 0);
  const off0 = gas.fieldModes(1.5).every((m) => m.table.lag[3] === 0);
  const refused = gas.setTable(true, () => false) === 'off' && gas.table === 'off' && gas.fieldModes(1.5).every((m) => m.table.lag[3] === 0);
  let handed = null; gas.setTable(true, (t) => { handed = t; return true; });
  const rowOk = (G) => { const fm = G.fieldModes(1.5); return fm.length > 100 && fm.every((R) => { const row = R.table.lag[3] - 1, M = G.modes[row]; return row >= 0 && !!M && row === M.l * 16 + M.nr && M.l === R.table.l && M.k === R.table.lag[0]; }); };
  const on = gas.table === 'on' && rowOk(gas);
  const T = gasRadialTable(), h = 1 / (GAS_TABLE_N - 1);
  let tabOk = handed === T && T.length === 256 * GAS_TABLE_N * 2;
  for (const row of [0, 37, 131, 255]) { const M = gas.modes[row]; for (const j of [0, 100, 255]) { const u = j * h; if (T[(row * GAS_TABLE_N + j) * 2] !== Math.fround(sphj(M.l, M.z * u))) tabOk = false; } }
  gas.setRadius(7.5); gas.launch(-3, 1, 1, 0);
  const afterRadius = rowOk(gas);
  gas.setTable(false);
  const off1 = gas.table === 'off' && gas.fieldModes(1.5).every((m) => m.table.lag[3] === 0);
  judge('THE TABLE (K7): off until asked (lag[3] = 0), a refused upload stays off, on → every emitted record carries its MODE row + 1 (row = l·16 + n_r, checked against the mode\'s own l and k), also after a radius change; the table rows are f32(j_l(z u)); off again → 0',
    off0 && refused && on && tabOk && afterRadius && off1, { off0, refused, on, tabOk, afterRadius, off1 });
}
/* W125 (2026-09-25): the table is the APP's default (rack.js arms it at boot; `?gastab=0` opts out), so ARMED must cost
   nothing: setTable(true) on a gas that holds no packet builds nothing and hands nothing to the field — the build starts at
   the first launch().  An upload answering null (NOT NOW: an export holds the loop) leaves every record on the recurrence. */
{
  const gas = createGas(10, { warm: false });
  let calls = 0, handed = null;
  const armed = gas.setTable(true, (t) => { calls++; handed = t; return true; });
  const waits = armed === 'building' && gas.table === 'building' && calls === 0;
  gas.launch(-5, 2, 0.8, 0);
  const rows = gas.fieldModes(1.5);
  const landed = calls === 1 && gas.table === 'on' && rows.length > 100 && rows.every((R) => R.table.lag[3] >= 1);
  const g2 = createGas(10, { warm: false });
  g2.setTable(true, () => null); g2.launch(-5, 2, 0.8, 0);
  const notNow = g2.table === 'building' && g2.fieldModes(1.5).every((R) => R.table.lag[3] === 0);
  const g3 = createGas(10, { warm: false });
  g3.setTable(true, () => { throw new Error('an opted-out table must never be uploaded'); }); g3.setTable(false); g3.launch(-5, 2, 0.8, 0);
  const optOut = g3.table === 'off' && g3.fieldModes(1.5).every((R) => R.table.lag[3] === 0);
  judge('THE TABLE ARMED (W125, the default): armed on an empty register builds and uploads nothing (\'building\', 0 uploads) until the first launch(), which lands it (1 upload, every record carries its row); an upload answering null (not now) keeps the recurrence; armed then opted out never uploads',
    waits && landed && notNow && optOut && !!handed, { armed, waits, landed, notNow, optOut, calls });
}
/* K5w (optimization 2026-09-24): SPECTRUM's readout runs the UNCHANGED stats() in the maths worker (mathworker.js gasStats,
   the `gas.stats` op).  The worker's gas builds its own tables from the posted radius, so its answer must be the page's
   object bit for bit: Object.is on every field, 9 times × 3 radii (and back to the first, through the worker's own
   setRadius rebuild), the message passed through structuredClone exactly as postMessage copies it — and a symmetric
   packet whose ⟨z⟩ is rounding noise, where the rejected factorisation flipped the printed sign (PLAN §9). */
{
  const { gasStats } = await import('../lab/mathworker.js');
  const T = [0, 0.3, 1, 2.5, 4, 6, 8, 10, 17.3];
  const rows = []; let same = true, fields = 0, fresh = true;
  for (const [A, z0, k, sigma, tl] of [[10, -5, 2, 0.8, 0], [7.5, 2, -1.5, 1, 0.7], [22.3, -8, 3, 1.2, 1.9], [10, 0, 0, 1, 0]]) {
    const page = createGas(A, { warm: false }); page.launch(z0, k, sigma, tl);
    for (const t of T) {
      const want = page.stats(t), msg = structuredClone({ op: 'gas.stats', radius: page.radius, t, ...page.register });
      fresh = fresh && msg.re0 !== page.register.re0;
      const got = gasStats(msg).stats;
      const keys = Object.keys(want);
      const ok = keys.length === Object.keys(got).length && keys.every((f) => Object.is(want[f], got[f]));
      fields += keys.length; if (!ok) { same = false; rows.push({ A, t, want, got }); }
      if (A === 10 && z0 === 0 && t === 0) rows.push({ symmetric: { z: want.z, printed: want.z.toFixed(2), worker: got.z.toFixed(2) } });
    }
  }
  judge('THE WORKER ROAD (K5w): the maths worker\'s gas.stats is the page\'s stats() bit for bit — Object.is on every field at 9 times × 3 radii and back, the register copied as postMessage copies it (a symmetric packet\'s noise ⟨z⟩ keeps its sign)',
    same && fresh && fields === 4 * 4 * T.length, { fields, fresh, rows });
}
console.log((FAILED ? 'RED ' : 'GREEN ') + 'gas.test — ' + FAILED + ' failing of ' + TOTAL);
process.exit(FAILED ? 1 : 0);
