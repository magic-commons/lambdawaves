/* tools/perf/packet-precision.mjs — THE ORBITAL PACKET'S PRECISION, MEASURED (0.5.4 P7a).  Packets are outside THE LOCK (no
 * time-dependent molecular packet is in it), so this measurement is the packet's gate.
 *
 *   node tools/perf/packet-precision.mjs                  the packet as the working tree's lab/orbitalsview.js builds it
 *   node tools/perf/packet-precision.mjs --rev 0591605    …as that revision built it (`git show <rev>:lab/orbitalsview.js`)
 *   options: --out <file.json>
 *
 * It runs the SHIPPED arithmetic, not a replica: `function vectors(t)` (MO-REGISTRY's per-frame contraction ψ_μ(t) = Σ_k |c_k|
 * e^{i(arg c_k − ε_k t)} C_μk, handed to the field as two Float32Array) is cut out of the file with its closure's `let` and `vec`
 * lines and run over the molecules' own library records (lab/library.js decodeRecord — the C and ε the worker's chem.open
 * serves).  Each packet is compared with the same sum done in f64 throughout; the reading is max_μ |ψ_packet − ψ_f64| (complex
 * modulus), absolute and relative to max_μ |ψ_f64|.  Selections: the register's presets HOMO + LUMO, FRONTIER FOUR, HOMO SET,
 * LUMO SET, OCCUPIED (every occupied orbital) and EVERY orbital the record carries (the most terms one frame can sum), at equal
 * amplitudes √(1/m) — the presets' own — with equal phases and with a fixed spread of phases, at t = 0, 1, 37.5, 1e3, 1e5 a.u.
 * C₆₀'s record carries 8 of its 300 columns (its HOMO and LUMO sets), so its selections are drawn from those. */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { decodeRecord } from '../../lab/library.js';
import { slerpCoefficients } from '../../lab/molecular-register.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const args = process.argv.slice(2), opt = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const REV = opt('--rev'), OUT = opt('--out');
const src = REV ? execFileSync('git', ['show', `${REV}:lab/orbitalsview.js`], { cwd: ROOT, encoding: 'utf8' }) : fs.readFileSync(path.join(ROOT, 'lab/orbitalsview.js'), 'utf8');

/* ── the shipped function, with the two closure lines it reads ── */
const line = (re) => { const m = src.match(re); if (!m) throw new Error('not found in orbitalsview.js: ' + re); return m[0]; };
const letLine = line(/^[ \t]*let re = null, im = null[^\n]*$/m), vecLine = line(/^[ \t]*const vec = \{ re: null, im: null \};[^\n]*$/m);
const a = src.indexOf('  function vectors(t) {'); if (a < 0) throw new Error('function vectors(t) not found');
let depth = 0, b = src.indexOf('{', a);
for (; b < src.length; b++) { if (src[b] === '{') depth++; else if (src[b] === '}' && --depth === 0) break; }
const fnText = src.slice(a, b + 1);
const build = new Function('nAO', 'sol', 'sel', 'morphOn', 'storeA', 'storeB', 'morphS', 'slerpCoefficients',
  `${letLine}\n${vecLine}\n${fnText}\nreturn vectors;`);

/** the same sum, f64 throughout: the reference */
function exact(sol, sel, t) {
  const n = sol.nAO, R = new Float64Array(n), I = new Float64Array(n);
  for (const [k, c] of sel) {
    const th = c.phase - sol.eps[k] * t, cr = c.amp * Math.cos(th), ci = c.amp * Math.sin(th);
    for (let mu = 0; mu < n; mu++) { const w = sol.C[mu * n + k]; R[mu] += cr * w; I[mu] += ci * w; }
  }
  return { R, I };
}
const record = (id) => {
  const row = JSON.parse(fs.readFileSync(path.join(ROOT, 'lab/library.json'), 'utf8')).rows.find((r) => r.id === id && r.basis === 'sto-3g');
  const R = decodeRecord(JSON.parse(fs.readFileSync(path.join(ROOT, 'lab/library', row.hash + '.json'), 'utf8')));
  return { id, hash: row.hash, sol: { nAO: R.ground.nAO, nocc: R.ground.nocc, eps: R.eps, C: R.C, cols: R.cols || null } };
};
const DEG = 1e-6, TIMES = [0, 1, 37.5, 1e3, 1e5];
function selections(sol) {
  const n = sol.nAO, h = sol.nocc - 1, l = sol.nocc, have = (k) => k >= 0 && k < n && (!sol.cols || sol.cols.includes(k));
  const level = (k) => { let p = k, q = k; while (p > 0 && Math.abs(sol.eps[p - 1] - sol.eps[k]) < DEG) p--; while (q + 1 < n && Math.abs(sol.eps[q + 1] - sol.eps[k]) < DEG) q++; return Array.from({ length: q - p + 1 }, (_, i) => p + i); };
  const all = sol.cols ? [...sol.cols] : Array.from({ length: n }, (_, k) => k);
  const S = { 'HOMO + LUMO': [h, l], 'FRONTIER FOUR': [h - 1, h, l, l + 1], 'HOMO SET': level(h), 'LUMO SET': level(l),
    OCCUPIED: all.filter((k) => k <= h), [`EVERY CARRIED ORBITAL (${all.length})`]: all };
  return Object.entries(S).filter(([, ks]) => ks.length && ks.every(have));
}
const report = { rev: REV || 'working tree', file: 'lab/orbitalsview.js', vectors: fnText.split('\n').length + ' lines', molecules: [] };
for (const id of ['C6H6', 'C60']) {
  const { sol, hash } = record(id), out = { id, hash: hash.slice(0, 12), nAO: sol.nAO, cols: sol.cols ? sol.cols.length : sol.nAO, rows: [] };
  let worstAbs = 0, worstRel = 0, worstAt = null;
  for (const [name, ks] of selections(sol)) for (const spread of [false, true]) {
    const amp = Math.sqrt(1 / ks.length), sel = new Map(ks.map((k, j) => [k, { amp, phase: spread ? (j * 2.399963) % (2 * Math.PI) : 0 }]));
    const vectors = build(() => sol.nAO, sol, sel, false, null, null, 0, slerpCoefficients);
    let rowAbs = 0, rowRel = 0;
    for (const t of TIMES) {
      const v = vectors(t), { R, I } = exact(sol, sel, t);
      let d = 0, m = 0;
      for (let mu = 0; mu < sol.nAO; mu++) { d = Math.max(d, Math.hypot(v.re[mu] - R[mu], v.im[mu] - I[mu])); m = Math.max(m, Math.hypot(R[mu], I[mu])); }
      const rel = m ? d / m : 0;
      if (d > rowAbs) rowAbs = d; if (rel > rowRel) rowRel = rel;
      if (d > worstAbs) { worstAbs = d; worstAt = { selection: name, phases: spread ? 'spread' : 'equal', t }; }
      if (rel > worstRel) worstRel = rel;
    }
    out.rows.push({ selection: name, terms: ks.length, phases: spread ? 'spread' : 'equal', maxAbs: +rowAbs.toExponential(3), maxRel: +rowRel.toExponential(3) });
  }
  Object.assign(out, { maxAbs: +worstAbs.toExponential(3), maxRel: +worstRel.toExponential(3), worstAt });
  report.molecules.push(out);
}
for (const m of report.molecules) {
  console.log(`${m.id} (${m.nAO} AO, ${m.cols} columns carried) · packet vs f64: max |Δψ| ${m.maxAbs} · relative to max |ψ| ${m.maxRel} · worst at ${JSON.stringify(m.worstAt)}`);
  for (const r of m.rows) console.log(`   ${r.selection.padEnd(28)} ${String(r.terms).padStart(3)} terms · ${r.phases.padEnd(6)} · ${r.maxAbs} abs · ${r.maxRel} rel`);
}
console.log(`(${report.rev}; the f32 rounding of one value is ≤ 2⁻²⁴ ≈ 5.96e-8 relative; the texel budget is ≈ 1e-3)`);
if (OUT) fs.writeFileSync(OUT, JSON.stringify(report, null, 2) + '\n');
