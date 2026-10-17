#!/usr/bin/env node
/* tools/volumes/measure.mjs — THE PILOT'S NUMBERS (iteration 004 V1): bytes and solve time per rung against heavy-atom count, the
 * projected guess's effect, and the "how many molecules fit in a 5 GB volume" answer — read from what the pipeline left
 * (raw/<id>/meta.json: the solver's clocks; dist/<vol>/index.json and pack-report-<vol>.json: the bytes).  Markdown on stdout,
 * for research/iteration-004/V1-BUILD.md.  MEASURED rows are the pilot's; every MODEL row says it is a fit and from what.
 *   node tools/volumes/measure.mjs [--volume vol-1]                                                                          */
import { readFileSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';

const args = process.argv.slice(2), VOL = args.includes('--volume') ? args[args.indexOf('--volume') + 1] : 'vol-1';
const DATA = path.resolve(process.env.LW_VOLUMES || path.join(homedir(), 'Documents/LAMBDAWAVES-VOLUMES'));
const LADDER = ['sto-3g', 'sto-6g', '3-21g', '6-31g', '6-31g-star', '6-31+g-star'], LABEL = ['STO-3G', 'STO-6G', '3-21G', '6-31G', '6-31G*', '6-31+G*'];
const index = JSON.parse(readFileSync(path.join(DATA, 'dist', VOL, 'index.json'), 'utf8'));
const report = JSON.parse(readFileSync(path.join(DATA, `pack-report-${VOL}.json`), 'utf8'));
const rep = new Map(report.molecules.map((r) => [r.id, r]));
const rows = index.molecules.map((m) => {
  const meta = JSON.parse(readFileSync(path.join(DATA, 'raw', m.id, 'meta.json'), 'utf8'));
  const nH = meta.atomsBohr.filter((a) => a[0] === 1).length;
  return { id: m.id, heavy: m.heavy, nH, bytes: m.bytes, header: rep.get(m.id).headerBytes, rungs: meta.rungs, organic: meta.atomsBohr.every((a) => [1, 6, 7, 8, 9, 15, 16, 17].includes(a[0])) };
}).sort((a, b) => a.heavy - b.heavy || a.id.localeCompare(b.id));
const f = (x, d = 1) => (x == null ? '—' : x.toFixed(d)), kb = (b) => (b / 1024).toFixed(1);
const sec = (r) => (r && r.status === 'converged' ? r.seconds : null);
const out = [];
out.push(`### Per molecule (MEASURED: ${rows.length} molecules, ${VOL})`, '', `| molecule | heavy | H | nAO per rung (${LABEL.join(' · ')}) | solve s per rung | total s | .lwm KB | header KB |`, '|---|---|---|---|---|---|---|---|');
for (const r of rows) {
  const n = LADDER.map((b) => (r.rungs[b] && r.rungs[b].nAO) || '—'), s = LADDER.map((b) => f(sec(r.rungs[b])));
  const tot = LADDER.reduce((t, b) => t + (sec(r.rungs[b]) || 0), 0);
  out.push(`| ${r.id} | ${r.heavy} | ${r.nH} | ${n.join(' · ')} | ${s.join(' · ')} | ${f(tot)} | ${kb(r.bytes)} | ${kb(r.header)} |`);
}
/* per rung: bytes (C f32 + ε f64) and time against nAO; a power law t = a·nAO^p fitted over the molecules with nAO ≥ 60 at that rung */
const fit = (pts) => { const n = pts.length; if (n < 3) return null; const X = pts.map((p) => Math.log(p[0])), Y = pts.map((p) => Math.log(p[1]));
  const mx = X.reduce((s, v) => s + v, 0) / n, my = Y.reduce((s, v) => s + v, 0) / n; let sxy = 0, sxx = 0; X.forEach((x, i) => { sxy += (x - mx) * (Y[i] - my); sxx += (x - mx) ** 2; });
  const p = sxy / sxx; return { p, a: Math.exp(my - p * mx), n }; };
out.push('', '### Per rung (MEASURED, and a power-law fit of the time)', '', '| rung | nAO range | C + ε bytes, mean | solve s, mean (max) | time fit t = a·nAO^p (nAO ≥ 60) | cycles: projected guess | cycles: minao (guess study) | time: projected / minao |', '|---|---|---|---|---|---|---|---|');
const fits = {};
LADDER.forEach((b, k) => {
  const rs = rows.map((r) => r.rungs[b]).filter((r) => r && r.status === 'converged');
  if (!rs.length) return;
  const n = rs.map((r) => r.nAO), by = rs.map((r) => 4 * r.nAO * r.nAO + 8 * r.nAO), t = rs.map((r) => r.seconds);
  const F = fit(rs.filter((r) => r.nAO >= 60).map((r) => [r.nAO, r.seconds])); fits[b] = F;
  const st = rs.filter((r) => r.guessStudy && r.guessStudy.converged);
  const cp = st.reduce((s, r) => s + r.cycles, 0), cm = st.reduce((s, r) => s + r.guessStudy.cycles, 0), tp = st.reduce((s, r) => s + r.seconds, 0), tm = st.reduce((s, r) => s + r.guessStudy.seconds, 0);
  out.push(`| ${LABEL[k]} | ${Math.min(...n)}–${Math.max(...n)} | ${kb(by.reduce((s, v) => s + v, 0) / by.length)} KB | ${f(t.reduce((s, v) => s + v, 0) / t.length, 2)} (${f(Math.max(...t))}) | ${F ? `a = ${F.a.toExponential(2)}, p = ${F.p.toFixed(2)} (${F.n} molecules)` : '—'} | ${st.length ? `${cp} over ${st.length}` : 'minao (first rung)'} | ${st.length ? `${cm}` : '—'} | ${st.length ? `${f(tp)} s / ${f(tm)} s` : '—'} |`);
});
/* the 5 GB answer: the .lwm bytes are a quadratic in the heavy-atom count (C is Σ_rungs 4·nAO², nAO linear in the atoms): least squares
   over the pilot's ORGANIC molecules (H, C, N, O, F, P, S, Cl), then the mean over a population whose heavy count is uniform on its range */
const org = rows.filter((r) => r.organic && r.heavy >= 3);
const lsq = (pts, deg) => { const m = deg + 1, A = Array.from({ length: m }, () => new Float64Array(m)), y = new Float64Array(m);
  for (const [x, v] of pts) { const p = Array.from({ length: m }, (_, i) => x ** i); for (let i = 0; i < m; i++) { y[i] += p[i] * v; for (let j = 0; j < m; j++) A[i][j] += p[i] * p[j]; } }
  for (let i = 0; i < m; i++) for (let k = i + 1; k < m; k++) { const q = A[k][i] / A[i][i]; for (let j = i; j < m; j++) A[k][j] -= q * A[i][j]; y[k] -= q * y[i]; }
  const c = new Float64Array(m); for (let i = m - 1; i >= 0; i--) { let s = y[i]; for (let j = i + 1; j < m; j++) s -= A[i][j] * c[j]; c[i] = s / A[i][i]; } return c; };
const cb = lsq(org.map((r) => [r.heavy, r.bytes]), 2), bytesAt = (h) => cb[0] + cb[1] * h + cb[2] * h * h;
const tt = fit(org.filter((r) => r.heavy >= 6).map((r) => [r.heavy, LADDER.reduce((t, b) => t + (sec(r.rungs[b]) || 0), 0)]));
const timeAt = (h) => tt.a * h ** tt.p;
const GB5 = 5e9, POPS = [['small', 3, 10], ['drug-like', 11, 30], ['large', 31, 50]];
out.push('', `### How many molecules fit in a 5 GB volume (MODEL from the measured pilot)`, '',
  `.lwm bytes ≈ ${f(cb[0], 0)} + ${f(cb[1], 0)}·h + ${f(cb[2], 0)}·h² (least squares over ${org.length} organic pilot molecules, h = heavy atoms; the C blob is Σ_rungs 4·nAO² and nAO grows linearly with the atoms).`,
  `Total solve time per molecule ≈ ${tt.a.toExponential(2)}·h^${tt.p.toFixed(2)} s (power law over the ${tt.n} organic pilot molecules with h ≥ 6; one solver, 10 threads, niced, on this Ryzen 5 5600G shared with other work).`, '',
  '| population | heavy atoms | mean .lwm (model) | molecules in 5 GB (5×10⁹ B) | mean solve per molecule (model) | wall-clock to fill 5 GB, one solver |', '|---|---|---|---|---|---|');
const answer = {};
for (const [name, lo, hi] of POPS) {
  const hs = Array.from({ length: hi - lo + 1 }, (_, i) => lo + i), mb = hs.reduce((s, h) => s + bytesAt(h), 0) / hs.length, mt = hs.reduce((s, h) => s + timeAt(h), 0) / hs.length;
  const count = Math.floor(GB5 / mb), wall = count * mt; answer[name] = { mb, count, mt, wall };
  out.push(`| ${name} | ${lo}–${hi} | ${(mb / 1048576).toFixed(2)} MiB | ${count.toLocaleString('en')} | ${mt < 120 ? f(mt) + ' s' : f(mt / 60) + ' min'} | ${(wall / 86400).toFixed(1)} days |`);
}
const big = rows.filter((r) => r.heavy >= 31);
if (big.length) out.push('', `Large-population anchor (MEASURED): ${big.map((r) => `${r.id} (${r.heavy} heavy) ${(r.bytes / 1048576).toFixed(2)} MiB, ${f(LADDER.reduce((t, b) => t + (sec(r.rungs[b]) || 0), 0) / 60)} min`).join('; ')} — model at the same h: ${big.map((r) => `${(bytesAt(r.heavy) / 1048576).toFixed(2)} MiB, ${f(timeAt(r.heavy) / 60)} min`).join('; ')}.`);
const all = rows.reduce((s, r) => s + r.bytes, 0);
out.push('', `Pilot volume (MEASURED): ${rows.length} molecules, ${(all / 1048576).toFixed(2)} MiB, mean .lwm ${(all / rows.length / 1048576).toFixed(3)} MiB; headers ${(rows.reduce((s, r) => s + r.header, 0) / all * 100).toFixed(1)} % of the bytes.`);
console.log(out.join('\n'));
if (args.includes('--json')) console.error(JSON.stringify({ bytesFit: Array.from(cb), timeFit: tt, fits, answer }));
