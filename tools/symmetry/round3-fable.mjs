#!/usr/bin/env node
/* tools/symmetry/round3-fable.mjs — ROUND 3 (Fable, lead) of the SOL THREAD: the independent re-measurement of Sol's
 * Round 2 numbers, and the experiment nobody had run — the SKELETON LOOP: md.js's own twoElectron with the petite list
 * applied to its live, screened shell-quartet loop and the tensor REBUILT from the representatives, timed against the
 * unmodified pass, on the same machine, in the same process, with the whole 36⁴ tensor compared slot for slot.
 *
 * lab/ is imported read-only.  md.js is instrumented IN MEMORY: its source is read, counters and two hooks are spliced in
 * at unique anchors, and the result is imported as a data: URL module.  Nothing under lab/ is written.
 *
 *   node tools/symmetry/round3-fable.mjs [--out research/release-0.4.0/measure/round3-fable.json] [--reps 5] [--no-census]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { MOLECULES, moleculeAtoms, moleculeCharge, CAP_MS } from '../../lab/molecules.js';
import { moleculeRHF } from '../../lab/rhf-molecule.js';
import { eigSym } from '../../lab/h2ci.js';
import { hessianBlocks } from '../../lab/rpa-inspector.js';

const ROOT = new URL('../../', import.meta.url);
const args = process.argv.slice(2);
const flag = (name, dflt) => { const i = args.indexOf(name); return i >= 0 && i + 1 < args.length ? args[i + 1] : dflt; };
const OUT = fileURLToPath(new URL(flag('--out', 'research/release-0.4.0/measure/round3-fable.json'), ROOT));
const REPS = +flag('--reps', 5);
const CENSUS = !args.includes('--no-census');
const record = JSON.parse(readFileSync(new URL('lab/vendor/bse/sto-3g-v1.json', ROOT), 'utf8'));
const out = { tool: 'tools/symmetry/round3-fable.mjs', node: process.version, date: '2026-10-07', reps: REPS };
const median = (xs) => { const s = xs.slice().sort((a, b) => a - b); return s[Math.floor(s.length / 2)]; };
const maxAbsDiff = (A, B) => { let m = 0; for (let i = 0; i < A.length; i++) { const d = Math.abs(A[i] - B[i]); if (d > m) m = d; } return m; };

/* ── 1 · md.js instrumented in memory (anchors must be unique or the splice refuses) ─────────────────────────── */
let src = readFileSync(new URL('lab/md.js', ROOT), 'utf8');
const inject = (anchor, replacement) => { const parts = src.split(anchor); if (parts.length !== 2) throw new Error(`md.js anchor is not unique: ${JSON.stringify(anchor)} (${parts.length - 1} hits)`); src = parts.join(replacement); };
inject('function twoElectron(basis) {',
  'export const T = { rep: null, reconstruct: null, main: false, quartets: 0, schwarzSkipped: 0, petiteSkipped: 0, rInto: 0, primSkipped: 0, NP: 0, pairs: null, reconstructMs: 0, writes: 0 };\n'
  + 'export function eriOnly(basis) { return twoElectron(basis); }\n'
  + 'function twoElectron(basis) {\n  T.main = false; T.quartets = 0; T.schwarzSkipped = 0; T.petiteSkipped = 0; T.rInto = 0; T.primSkipped = 0; T.reconstructMs = 0; T.writes = 0;');
inject('const NP = pairs.length, QN = new Float64Array(NP);', 'const NP = pairs.length, QN = new Float64Array(NP); T.NP = NP; T.pairs = pairs;');
inject('  for (let a = 0; a < NP; a++) {\n', '  T.main = true;\n  for (let a = 0; a < NP; a++) {\n');
inject('if (qa * QN[b] < TAU_SCHWARZ) continue;', 'if (qa * QN[b] < TAU_SCHWARZ) { T.schwarzSkipped++; continue; }\n      T.quartets++; if (T.rep !== null && T.rep[a * NP + b] === 0) { T.petiteSkipped++; continue; }');
inject('if (thr >= 0 && sk * Q.s[m] < thr) continue;', 'if (thr >= 0 && sk * Q.s[m] < thr) { if (T.main) T.primSkipped++; continue; }\n      if (T.main) T.rInto++;');
inject('  return g;\n}\n\nexport function nuclearRepulsion', '  T.main = false; if (T.reconstruct !== null) { const c0 = process.cpuUsage(), t0 = performance.now(); T.writes = T.reconstruct(g, pairs, n); T.reconstructMs = performance.now() - t0; const cu = process.cpuUsage(c0); T.reconstructCpuMs = (cu.user + cu.system) / 1000; }\n  return g;\n}\n\nexport function nuclearRepulsion');
/** wall and process-CPU milliseconds of one call: the CPU figure is the one a loaded shared machine cannot inflate */
const clock = (f) => { const c0 = process.cpuUsage(), t0 = performance.now(); const r = f(); const wall = performance.now() - t0, cu = process.cpuUsage(c0); return { r, wall, cpu: (cu.user + cu.system) / 1000 }; };
const md = await import('data:text/javascript;base64,' + Buffer.from(src).toString('base64'));
const T = md.T;

/* ── 2 · benzene: the live solve (the call ensureSolve makes) and the reference tensor ────────────────────────── */
const atoms = moleculeAtoms('C6H6');
let t0 = performance.now();
const sol = moleculeRHF({ atoms, basis: 'sto-3g', charge: moleculeCharge('C6H6'), record });
const solveMs = performance.now() - t0;
const n = sol.integrals.n, n2 = n * n, gRef = sol.integrals.eri, basis = sol.basis, shells = basis.shells;
out.benzene = { nAO: n, nocc: sol.nocc, energy: sol.energy, solveMs: +solveMs.toFixed(1), integralMs: sol.timings.integrals, shells: shells.length, shellPairsUnscreened: shells.length * (shells.length + 1) / 2 };
/* the instrumented module with every hook off must reproduce the solver's tensor EXACTLY */
T.rep = null; T.reconstruct = null;
const gPlain = md.eriOnly(basis);
out.instrumentation = { eriDifferenceHooksOff: maxAbsDiff(gPlain, gRef), NP: T.NP, quartets: T.quartets, schwarzSkipped: T.schwarzSkipped, rInto: T.rInto, primSkipped: T.primSkipped,
  primitiveTrips: T.rInto + T.primSkipped, primSkippedFraction: T.primSkipped / (T.rInto + T.primSkipped) };
const pairs = T.pairs, NP = T.NP;

/* ── 3 · the groups on the live pair list: D2h as sign flips, D6h as the 24 matrices of benzene's own frame ──── */
const Rz = (t) => [Math.cos(t), -Math.sin(t), 0, Math.sin(t), Math.cos(t), 0, 0, 0, 1];
const mm3 = (A, B) => { const o = new Array(9).fill(0); for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) for (let k = 0; k < 3; k++) o[i * 3 + j] += A[i * 3 + k] * B[k * 3 + j]; return o; };
const mv = (R, v) => [R[0] * v[0] + R[1] * v[1] + R[2] * v[2], R[3] * v[0] + R[4] * v[1] + R[5] * v[2], R[6] * v[0] + R[7] * v[1] + R[8] * v[2]];
const diag3 = (a, b, c) => [a, 0, 0, 0, b, 0, 0, 0, c];
const D6H = [];
for (let k = 0; k < 6; k++) for (const sh of [diag3(1, 1, 1), diag3(1, 1, -1)]) for (const sv of [diag3(1, 1, 1), diag3(1, -1, 1)]) D6H.push({ name: `C6^${k}${sh[8] < 0 ? '·sh' : ''}${sv[4] < 0 ? '·sv0' : ''}`, R: mm3(Rz(k * Math.PI / 3), mm3(sh, sv)) });
const isSignDiag = (R) => [1, 2, 3, 5, 6, 7].every((i) => Math.abs(R[i]) < 1e-12) && [0, 4, 8].every((i) => Math.abs(Math.abs(R[i]) - 1) < 1e-12);
const D2H = D6H.filter((o) => isSignDiag(o.R));
if (D2H.length !== 8) throw new Error(`D2h ⊂ D6h: ${D2H.length} sign-diagonal operations`);
function atomPerm(R) {
  const perm = []; let worst = 0;
  for (const a of atoms) { const p = mv(R, [a.x, a.y, a.z]); let best = -1, bd = Infinity;
    atoms.forEach((b, ib) => { if (b.Z !== a.Z) return; const d = Math.hypot(b.x - p[0], b.y - p[1], b.z - p[2]); if (d < bd) { bd = d; best = ib; } });
    perm.push(best); worst = Math.max(worst, bd); }
  if (new Set(perm).size !== atoms.length || worst > 1e-8) throw new Error(`not a symmetry of benzene (worst ${worst})`);
  return { perm, worst };
}
const shellsOfAtom = atoms.map((_, a) => shells.map((s, i) => [s, i]).filter(([s]) => s.atom === a).map(([, i]) => i));
const aoToShell = new Int32Array(n); shells.forEach((s, i) => s.bfs.forEach((b) => { aoToShell[b.idx] = i; }));
const pairKey = (a, b) => (a <= b ? a * shells.length + b : b * shells.length + a);
const pairIndex = new Map(pairs.map((P, i) => [pairKey(aoToShell[P.ai[0]], aoToShell[P.bi[0]]), i]));
function prepare(ops) {
  return ops.map((o) => {
    const { perm, worst } = atomPerm(o.R);
    const shellPerm = new Int32Array(shells.length);
    shellsOfAtom.forEach((list, a) => list.forEach((sIdx, p) => { const img = shellsOfAtom[perm[a]][p]; if (shells[img].l !== shells[sIdx].l) throw new Error('shell lists differ'); shellPerm[sIdx] = img; }));
    const pairPerm = new Int32Array(NP);
    pairs.forEach((P, i) => { const j = pairIndex.get(pairKey(shellPerm[aoToShell[P.ai[0]]], shellPerm[aoToShell[P.bi[0]]])); if (j === undefined) throw new Error('the active pair list is not closed under the group'); pairPerm[i] = j; });
    /* the AO representation: s ↦ 1, p ↦ R (image component j of the image shell from source component i: R[j][i]) */
    const aoPerm = new Int32Array(n), aoSign = new Int8Array(n), signed = isSignDiag(o.R);
    shells.forEach((s, sIdx) => { const img = shells[shellPerm[sIdx]];
      if (s.l === 0) { aoPerm[s.bfs[0].idx] = img.bfs[0].idx; aoSign[s.bfs[0].idx] = 1; }
      else if (s.l === 1) { for (let i = 0; i < 3; i++) { if (s.bfs[i].l[i] !== 1 || img.bfs[i].l[i] !== 1) throw new Error('p components are not in x,y,z order'); if (signed) { aoPerm[s.bfs[i].idx] = img.bfs[i].idx; aoSign[s.bfs[i].idx] = o.R[i * 3 + i] > 0 ? 1 : -1; } } }
      else throw new Error('a d shell needs its own block'); });
    return { ...o, perm, worst, shellPerm, pairPerm, aoPerm, aoSign, signed, fixedAtoms: perm.filter((b, a) => b === a).length };
  });
}
const d2h = prepare(D2H), d6h = prepare(D6H);
/** orbits of the group on the live loop's units, (pair a ≤ pair b); the representative is the first met in loop order */
function orbits(ops) {
  const rep = new Uint8Array(NP * NP), repA = new Int32Array(NP * NP).fill(-1), repB = new Int32Array(NP * NP).fill(-1), opOf = new Int32Array(NP * NP).fill(-1);
  const visited = new Uint8Array(NP * NP), hist = {}; let count = 0, total = 0, primAll = 0, primRep = 0, compAll = 0, compRep = 0;
  for (let a = 0; a < NP; a++) for (let b = a; b < NP; b++) {
    total++; const P = pairs[a], Q = pairs[b]; primAll += P.np * Q.np; compAll += P.nc * Q.nc * P.np * Q.np;
    const k0 = a * NP + b; if (visited[k0]) continue;
    rep[k0] = 1; count++; primRep += P.np * Q.np; compRep += P.nc * Q.nc * P.np * Q.np;
    const seen = new Set();
    ops.forEach((o, oi) => { let x = o.pairPerm[a], y = o.pairPerm[b]; if (x > y) [x, y] = [y, x]; const k = x * NP + y; seen.add(k);
      if (!visited[k]) { visited[k] = 1; if (k !== k0) { repA[k] = a; repB[k] = b; opOf[k] = oi; } } });
    hist[seen.size] = (hist[seen.size] || 0) + 1;
  }
  return { rep, repA, repB, opOf, stats: { quartets: total, orbits: count, fraction: count / total, orbitSizes: hist, primitiveProductsAll: primAll, primitiveProductsRep: primRep, primitiveFraction: primRep / primAll,
    componentWeightedAll: compAll, componentWeightedRep: compRep, componentFraction: compRep / compAll } };
}
const orbD2h = orbits(d2h), orbD6h = orbits(d6h);
out.liveLoop = { D2h: orbD2h.stats, D6h: orbD6h.stats, fixedAtomsByOp: { D2h: d2h.map((o) => o.fixedAtoms), D6h: d6h.map((o) => [o.name, o.fixedAtoms]) } };

/* ── 4 · the reconstruction: images of the representatives' blocks, written through the 8-fold symmetry ──────── */
const write8 = (g, i, j, k, l, v) => {
  const pij = (i * n + j) * n2, pji = (j * n + i) * n2, qij = i * n + j, qji = j * n + i, pkl = (k * n + l) * n2, plk = (l * n + k) * n2, qkl = k * n + l, qlk = l * n + k;
  g[pij + qkl] = v; g[pji + qkl] = v; g[pij + qlk] = v; g[pji + qlk] = v; g[pkl + qij] = v; g[plk + qij] = v; g[pkl + qji] = v; g[plk + qji] = v;
};
/** signed permutations (D2h): one read, one sign, eight writes per component */
function reconstructSigned(orb, ops) {
  return (g) => { let writes = 0;
    for (let a = 0; a < NP; a++) for (let b = a; b < NP; b++) { const key = a * NP + b; if (orb.rep[key]) continue;
      const P = pairs[orb.repA[key]], Q = pairs[orb.repB[key]], o = ops[orb.opOf[key]], perm = o.aoPerm, sg = o.aoSign;
      for (let ia = 0; ia < P.nc; ia++) { const i = P.ai[ia], j = P.bi[ia], s1 = sg[i] * sg[j], base = (i * n + j) * n2, pi = perm[i], pj = perm[j];
        for (let jc = 0; jc < Q.nc; jc++) { const k = Q.ai[jc], l = Q.bi[jc]; write8(g, pi, pj, perm[k], perm[l], s1 * sg[k] * sg[l] * g[base + k * n + l]); writes += 8; } } }
    return writes; };
}
/** general operations (D6h): the representative's shell block rotated by M_A ⊗ M_B ⊗ M_C ⊗ M_D (s: [1]; p: R) */
function reconstructGeneral(orb, ops) {
  const shellMat = (o, s) => (s.l === 0 ? [1] : o.R);
  const aoOf = (s) => s.bfs.map((b) => b.idx);
  const blk = new Float64Array(81), tmp = new Float64Array(81);
  return (g) => { let writes = 0;
    for (let a = 0; a < NP; a++) for (let b = a; b < NP; b++) { const key = a * NP + b; if (orb.rep[key]) continue;
      const P = pairs[orb.repA[key]], Q = pairs[orb.repB[key]], o = ops[orb.opOf[key]];
      const sA = shells[aoToShell[P.ai[0]]], sB = shells[aoToShell[P.bi[0]]], sC = shells[aoToShell[Q.ai[0]]], sD = shells[aoToShell[Q.bi[0]]];
      const S4 = [sA, sB, sC, sD], dims = S4.map((s) => s.bfs.length), ao = S4.map(aoOf), img = S4.map((s) => aoOf(shells[o.shellPerm[aoToShell[s.bfs[0].idx]]])), M = S4.map((s) => shellMat(o, s));
      const [nA, nB, nC, nD] = dims, size = nA * nB * nC * nD;
      for (let ia = 0; ia < nA; ia++) for (let ib = 0; ib < nB; ib++) for (let ic = 0; ic < nC; ic++) for (let id = 0; id < nD; id++) blk[((ia * nB + ib) * nC + ic) * nD + id] = g[((ao[0][ia] * n + ao[1][ib]) * n + ao[2][ic]) * n + ao[3][id]];
      /* four one-index transforms in place: axis by axis, out[j] = Σ_i M[j][i] in[i] */
      let cur = blk, nxt = tmp;
      const strides = [nB * nC * nD, nC * nD, nD, 1];
      for (let axis = 0; axis < 4; axis++) { const d = dims[axis], st = strides[axis], Mx = M[axis];
        if (d === 1) continue;
        for (let t = 0; t < size; t++) { const i0 = Math.floor(t / st) % d, baseIdx = t - i0 * st; let s = 0; for (let i = 0; i < d; i++) s += Mx[i0 * 3 + i] * cur[baseIdx + i * st]; nxt[t] = s; }
        [cur, nxt] = [nxt, cur]; }
      for (let ia = 0; ia < nA; ia++) for (let ib = 0; ib < nB; ib++) for (let ic = 0; ic < nC; ic++) for (let id = 0; id < nD; id++) { write8(g, img[0][ia], img[1][ib], img[2][ic], img[3][id], cur[((ia * nB + ib) * nC + ic) * nD + id]); writes += 8; }
    }
    return writes; };
}
const modes = {
  full: { rep: null, reconstruct: null },
  setupOnly: { rep: new Uint8Array(NP * NP), reconstruct: null },
  d2hSigned: { rep: orbD2h.rep, reconstruct: reconstructSigned(orbD2h, d2h) },
  d2hGeneral: { rep: orbD2h.rep, reconstruct: reconstructGeneral(orbD2h, d2h) },
  d6hGeneral: { rep: orbD6h.rep, reconstruct: reconstructGeneral(orbD6h, d6h) },
};
/* warm the JIT on the two code paths, then round-robin the modes so no mode owns the cache or the GC */
T.rep = null; T.reconstruct = null; md.eriOnly(basis); md.eriOnly(basis);
const samples = Object.fromEntries(Object.keys(modes).map((k) => [k, { passMs: [], passCpuMs: [], reconstructMs: [], reconstructCpuMs: [] }]));
const counters = {};
for (let r = 0; r < REPS; r++) for (const [name, m] of Object.entries(modes)) {
  T.rep = m.rep; T.reconstruct = m.reconstruct; T.reconstructMs = 0; T.reconstructCpuMs = 0;
  const { r: g, wall, cpu } = clock(() => md.eriOnly(basis));
  samples[name].passMs.push(wall); samples[name].passCpuMs.push(cpu); samples[name].reconstructMs.push(T.reconstructMs); samples[name].reconstructCpuMs.push(T.reconstructCpuMs || 0);
  if (!counters[name]) counters[name] = { quartetsVisited: T.quartets, schwarzSkipped: T.schwarzSkipped, quartetsSkippedByPetiteList: T.petiteSkipped, quartetsContracted: T.quartets - T.petiteSkipped, rIntoCalls: T.rInto, primitiveQuartetsSkipped: T.primSkipped, reconstructionWrites: T.writes, maxAbsDiffVsSolver: maxAbsDiff(g, gRef) };
}
T.rep = null; T.reconstruct = null;
const full = median(samples.full.passMs), fullCpu = median(samples.full.passCpuMs);
out.skeleton = Object.fromEntries(Object.entries(samples).map(([name, s]) => [name, { ...counters[name],
  passMsSamples: s.passMs.map((x) => +x.toFixed(2)), passMsMedian: +median(s.passMs).toFixed(2), reconstructMsMedian: +median(s.reconstructMs).toFixed(2), speedupVsFull: +(full / median(s.passMs)).toFixed(3), savedMsVsFull: +(full - median(s.passMs)).toFixed(1),
  passCpuMsSamples: s.passCpuMs.map((x) => +x.toFixed(2)), passCpuMsMedian: +median(s.passCpuMs).toFixed(2), reconstructCpuMsMedian: +median(s.reconstructCpuMs).toFixed(2), speedupVsFullCpu: +(fullCpu / median(s.passCpuMs)).toFixed(3), savedCpuMsVsFull: +(fullCpu - median(s.passCpuMs)).toFixed(1) }]));
out.skeleton.note = 'passMs = the whole twoElectron (pair tables, primitive and Schwarz screens, the loop, the reconstruction); setupOnly skips every quartet and reconstructs nothing, so pass(setupOnly) is the fixed cost the petite list cannot touch; *CpuMs = process.cpuUsage over the same call, the figure a loaded shared machine cannot inflate';
out.loadAverage = (await import('node:os')).loadavg();

/* ── 5 · the RPA arithmetic, independently, and the dense Hessian re-timed ───────────────────────────────────── */
{
  const nG = [9, 6, 2, 1, 1, 2, 6, 9], oG = [6, 3, 1, 1, 0, 1, 4, 5], vG = nG.map((v, i) => v - oG[i]);
  const mask = [0, 2, 1, 3, 4, 6, 5, 7];                       // Ag B1g B2g B3g Au B1u B2u B3u as (C2z, C2y, i) parity bits
  const prod = (a, b) => mask.indexOf(mask[a] ^ mask[b]);
  const mac = (axis, dims, target) => { let acc = 0; for (let a = 0; a < 8; a++) for (let b = 0; b < 8; b++) for (let c = 0; c < 8; c++) for (let d = 0; d < 8; d++) { if ((mask[a] ^ mask[b] ^ mask[c] ^ mask[d]) !== 0) continue; const gs = [a, b, c, d]; let p = target[gs[axis]]; for (let k = 0; k < 4; k++) p *= dims[k][gs[k]]; acc += p; } return acc; };
  const nocc = 21, nv = 15;
  /* the seven contractions as lab/rpa-inspector.js hessianBlocks writes them: A1 (μ→i), then half() twice: G (ν→a, λ→j, σ→b), Q (ν→j, λ→a, σ→b) */
  const dense = [n * nocc * n ** 3, nocc * n * nv * n2, nocc * nv * n * nocc * n, nv * nocc * nv * nocc * n, nocc * n * nocc * n2, nocc * nocc * n * nv * n, nv * nocc * nocc * nv * n];
  const blocked = [mac(0, [nG, nG, nG, nG], oG), mac(1, [oG, nG, nG, nG], vG), mac(2, [oG, vG, nG, nG], oG), mac(3, [oG, vG, oG, nG], vG), mac(1, [oG, nG, nG, nG], oG), mac(2, [oG, oG, nG, nG], vG), mac(3, [oG, oG, vG, nG], vG)];
  const sum = (a) => a.reduce((s, v) => s + v, 0);
  const mG = nG.map((_, lam) => oG.reduce((s, o, g) => s + o * vG[prod(g, lam)], 0));
  const ts = [], cs = []; for (let r = 0; r < REPS; r++) { const { wall, cpu } = clock(() => hessianBlocks({ eri: gRef, C: sol.C, eps: sol.orbitalEnergies, nocc, n })); ts.push(wall); cs.push(cpu); }
  out.rpa = { denseMacsBySte: dense, denseMacs: sum(dense), blockedMacs: sum(blocked), blockedFraction: sum(blocked) / sum(dense), closedForm: 2 * nocc * n ** 4 + 2 * nocc ** 2 * nv * n2 + 2 * nocc ** 2 * nv ** 2 * n,
    sourceCommentClaims: { multiplyAdds: 89e6, fullTransform: 242e6, fourQuarterTransformsN5: 4 * n ** 5 }, pairBlocks: mG, pairSpace: sum(mG), assemblyEntriesBlocked: sum(mG.map((v) => v * v)), assemblyEntriesDense: sum(mG) ** 2,
    denseHessianMsSamples: ts.map((x) => +x.toFixed(1)), denseHessianMsMedian: +median(ts).toFixed(1), denseHessianCpuMsSamples: cs.map((x) => +x.toFixed(1)), denseHessianCpuMsMedian: +median(cs).toFixed(1), fockInvariantContractionEntries: sum(nG.map((v) => v * v)) ** 2, fockDenseEntries: n ** 4 };
}

/* ── 6 · grids: orbits of the signed-permutation group of each framework on the 96³ cell-centred lattice ──────── */
const CUBE = []; { const perms = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]]; for (const p of perms) for (let k = 0; k < 8; k++) CUBE.push({ p, s: [k & 1 ? -1 : 1, k & 2 ? -1 : 1, k & 4 ? -1 : 1] }); }
const applyCube = (R, v) => [R.s[0] * v[R.p[0]], R.s[1] * v[R.p[1]], R.s[2] * v[R.p[2]]];
function frameworkOps(ats, centre, tol = 1e-8) {
  return CUBE.filter((R) => { const used = new Set(); for (const a of ats) { const v = applyCube(R, [a.x - centre[0], a.y - centre[1], a.z - centre[2]]).map((x, i) => x + centre[i]);
    let best = -1, bd = Infinity; ats.forEach((b, ib) => { if (b.Z !== a.Z) return; const d = Math.hypot(b.x - v[0], b.y - v[1], b.z - v[2]); if (d < bd) { bd = d; best = ib; } });
    if (bd > tol) return false; used.add(best); } return used.size === ats.length; });
}
const chargeCentre = (ats) => { let s = [0, 0, 0], Z = 0; for (const a of ats) { s = [s[0] + a.Z * a.x, s[1] + a.Z * a.y, s[2] + a.Z * a.z]; Z += a.Z; } return s.map((x) => x / Z); };
/** the cube operations that are symmetries of the framework about `centre`, each with its atom permutation */
function frameworkPerms(ats, centre, tol = 1e-8) {
  const outP = [];
  for (const R of CUBE) { const perm = []; let ok = true;
    for (const a of ats) { const v = applyCube(R, [a.x - centre[0], a.y - centre[1], a.z - centre[2]]).map((x, i) => x + centre[i]);
      let best = -1, bd = Infinity; ats.forEach((b, ib) => { if (b.Z !== a.Z) return; const d = Math.hypot(b.x - v[0], b.y - v[1], b.z - v[2]); if (d < bd) { bd = d; best = ib; } });
      if (bd > tol) { ok = false; break; } perm.push(best); }
    if (ok && new Set(perm).size === ats.length) outP.push({ R, perm }); }
  return outP;
}
/** the unscreened shell-quartet petite list of a framework under its cube subgroup: orbits of (pair i ≤ j) ≤ (pair k ≤ l) */
function shellPetite(shellList, perms) {
  const ns = shellList.length, byAtom = [];
  shellList.forEach((s, i) => (byAtom[s.atom] ??= []).push(i));
  const sp = perms.map(({ perm }) => { const p = new Int32Array(ns); byAtom.forEach((list, a) => list.forEach((sIdx, k) => { p[sIdx] = byAtom[perm[a]][k]; })); return p; });
  const pairOf = (a, b) => (a <= b ? a * ns + b : b * ns + a);
  const key = (a, b, c, d) => { let x = pairOf(a, b), y = pairOf(c, d); if (x > y) [x, y] = [y, x]; return x * ns * ns + y; };
  const seen = new Set(); let total = 0, count = 0;
  for (let a = 0; a < ns; a++) for (let b = a; b < ns; b++) for (let c = 0; c < ns; c++) for (let d = c; d < ns; d++) { if (a * ns + b > c * ns + d) continue; total++;
    const k0 = key(a, b, c, d); if (seen.has(k0)) continue; count++; for (const p of sp) seen.add(key(p[a], p[b], p[c], p[d])); }
  return { shellQuartets: total, shellOrbits: count, fraction: count / total };
}
function gridOrbits(ops, N = 96) {
  const seen = new Uint8Array(N ** 3), hist = {}; let count = 0, boundary = 0; const off = (N - 1) / 2;
  for (let idx = 0; idx < N ** 3; idx++) { if (seen[idx]) continue;
    const q = [Math.floor(idx / (N * N)) - off, Math.floor(idx / N) % N - off, idx % N - off], imgs = new Set();
    for (const R of ops) { const v = applyCube(R, q); imgs.add(((v[0] + off) * N + (v[1] + off)) * N + (v[2] + off)); }
    for (const j of imgs) seen[j] = 1; count++; hist[imgs.size] = (hist[imgs.size] || 0) + 1; if (imgs.size < ops.length) boundary += imgs.size; }
  return { order: ops.length, orbits: count, fraction: count / N ** 3, boundaryVoxels: boundary, boundaryFraction: boundary / N ** 3, orbitSizes: hist };
}
out.grids = {};
for (const id of ['H2O', 'NH3', 'CH4', 'BH3', 'C2H4', 'C2H6', 'C4H6', 'H2O2', 'CH3OH', 'C6H6', 'N2', 'BeH2', 'CO']) out.grids[id] = gridOrbits(frameworkOps(moleculeAtoms(id), [0, 0, 0]));
out.grids.Oh = gridOrbits(CUBE);
out.grids.burnside = { Td96: (96 ** 3 + 6 * 96 ** 2 + 8 * 96) / 24, Oh96: (96 ** 3 + 6 * 96 ** 2 + 8 * 96) / 48, stabilised96: 96 ** 3 - 96 * 94 * 92, C4v96: (96 ** 3 + 2 * 96 ** 2) / 8, D4h96: (96 ** 3 + 2 * 96 ** 2) / 16 };
/* Sol's off-axis reflection that maps a voxel centre onto a voxel centre: how many of the 96² (x, y) centres does it map onto centres? */
{ const N = 96, off = (N - 1) / 2; let hits = 0; for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) { const x = i - off, y = j - off, u = (3 * x + 4 * y) / 5, v = (4 * x - 3 * y) / 5; const okU = Math.abs(u - off - Math.round(u - off)) < 1e-9 && Math.abs(u) <= off + 1e-9, okV = Math.abs(v - off - Math.round(v - off)) < 1e-9 && Math.abs(v) <= off + 1e-9; if (okU && okV) hits++; }
  out.grids.solReflection = { matrix: [[0.6, 0.8, 0], [0.8, -0.6, 0], [0, 0, 1]], xyCentresMappedOntoCentres: hits, ofXYCentres: N * N, voxelsMapped: hits * N, example: { from: [0.5, 1.5, 0.5], to: [(3 * 0.5 + 4 * 1.5) / 5, (4 * 0.5 - 3 * 1.5) / 5, 0.5] } }; }

/* ── 7 · the census: every library entry, its cube subgroup, the model's milliseconds and MEASURED solve milliseconds ── */
if (CENSUS) {
  const rows = [];
  for (const m of MOLECULES) {
    const ats = moleculeAtoms(m.id), originOrder = frameworkOps(ats, [0, 0, 0]).length, centredOrder = frameworkOps(ats, chargeCentre(ats)).length;
    let measuredMs = null, measuredCpuMs = null, integralMs = null, integralCpuMs = null, energy = null, converged = null, petite = null, eriSavedMs = null, eriSavedCpuMs = null;
    if (!m.disabled) { const { r: s, wall, cpu } = clock(() => moleculeRHF({ atoms: ats, basis: 'sto-3g', charge: moleculeCharge(m.id), record })); measuredMs = +wall.toFixed(1); measuredCpuMs = +cpu.toFixed(1); integralMs = s.timings.integrals; energy = s.energy; converged = s.converged;
      const eri = clock(() => { T.rep = null; T.reconstruct = null; return md.eriOnly(s.basis); }); integralCpuMs = +eri.cpu.toFixed(1);   // the ERI pass alone, CPU-clocked, through the instrumented module (hooks off)
      petite = shellPetite(s.basis.shells, frameworkPerms(ats, chargeCentre(ats))); eriSavedMs = +(integralMs * (1 - petite.fraction)).toFixed(2); eriSavedCpuMs = +(integralCpuMs * (1 - petite.fraction)).toFixed(2); }
    rows.push({ id: m.id, nAO: m.nAO, declaredGroup: m.symmetry.group, declaredFallback: m.symmetry.fallback?.group ?? null, predictedMs: m.predictedMs, disabled: !!m.disabled, originOrder, centredOrder, measuredMs, measuredCpuMs, integralMs, integralCpuMs, energy, converged,
      shellQuartets: petite?.shellQuartets ?? null, shellOrbits: petite?.shellOrbits ?? null, petiteFraction: petite?.fraction ?? null, eriSavedMs, eriSavedCpuMs });
    console.error(`census ${m.id} ${m.nAO} AO ${m.symmetry.group} order ${centredOrder} predicted ${m.predictedMs} measured ${measuredMs} cpu ${measuredCpuMs} eri cpu ${integralCpuMs} petite ${petite ? petite.fraction.toFixed(4) : '-'}`);
  }
  const share = (list, weight, pred) => { const tot = list.reduce((s, r) => s + (r[weight] || 0), 0), sym = list.filter(pred).reduce((s, r) => s + (r[weight] || 0), 0); return { records: list.length, totalMs: +tot.toFixed(1), symmetricMs: +sym.toFixed(1), fraction: tot ? sym / tot : null }; };
  const live = rows.filter((r) => !r.disabled), ge4 = (r) => r.centredOrder >= 4;
  out.census = { capMs: CAP_MS, rows,
    predictedAll: share(rows, 'predictedMs', ge4), predictedLive: share(live, 'predictedMs', ge4), measuredLive: share(live, 'measuredMs', ge4), measuredCpuLive: share(live, 'measuredCpuMs', ge4),
    measuredLiveOrder8plus: share(live, 'measuredMs', (r) => r.centredOrder >= 8), measuredCpuLiveOrder8plus: share(live, 'measuredCpuMs', (r) => r.centredOrder >= 8),
    measuredLiveExactNonAbelianOrDeclaredHigh: share(live, 'measuredMs', (r) => ['Td', 'D3h', 'D3d', 'D6h', 'D2h', 'Dinfh'].includes(r.declaredGroup)),
    lowSubgroupLive: live.filter((r) => !ge4(r)).map((r) => [r.id, r.declaredGroup, r.predictedMs, r.measuredMs, r.measuredCpuMs]),
    modelVsMeasured: { sumPredictedLive: live.reduce((s, r) => s + r.predictedMs, 0), sumMeasuredLive: +live.reduce((s, r) => s + r.measuredMs, 0).toFixed(1), sumMeasuredCpuLive: +live.reduce((s, r) => s + r.measuredCpuMs, 0).toFixed(1) },
    petiteList: { sumIntegralMsLive: +live.reduce((s, r) => s + r.integralMs, 0).toFixed(1), sumEriSavedMsLive: +live.reduce((s, r) => s + r.eriSavedMs, 0).toFixed(1),
      eriSavedShareOfSolveMs: live.reduce((s, r) => s + r.eriSavedMs, 0) / live.reduce((s, r) => s + r.measuredMs, 0),
      sumIntegralCpuMsLive: +live.reduce((s, r) => s + r.integralCpuMs, 0).toFixed(1), sumEriSavedCpuMsLive: +live.reduce((s, r) => s + r.eriSavedCpuMs, 0).toFixed(1),
      eriSavedShareOfSolveCpuMs: live.reduce((s, r) => s + r.eriSavedCpuMs, 0) / live.reduce((s, r) => s + r.measuredCpuMs, 0),
      entriesWithPetiteFractionOne: live.filter((r) => r.petiteFraction === 1).map((r) => r.id), entriesBelowHalf: live.filter((r) => r.petiteFraction < 0.5).map((r) => [r.id, +r.petiteFraction.toFixed(4)]),
      note: 'the petite list is the signed-permutation (cube) subgroup about the centre of nuclear charge on the UNSCREENED shell quartets (benzene: 11,678/45,150 against the live loop\'s 10,966/42,486 — within 0.2 %); eriSavedMs = integralMs × (1 − fraction) is the ceiling a petite-list loop could remove from one solve of that entry, before reconstruction and setup' } };
}

/* ── 8 · C60: Burnside by BigInt, the I_h group from the icosahedron, the Hückel spectrum named by irrep ───────── */
{
  const sym22 = (x, y, z) => { const a = (x * x + y) / 2n, b = (y * y + z) / 2n; return (a * a + b) / 2n; };
  const classes = [['E', 1n, 1, false], ['C2', 15n, 2, false], ['C3', 20n, 3, false], ['C5', 12n, 5, false], ['C5^2', 12n, 5, false], ['i', 1n, 1, true], ['sigma', 15n, 2, true], ['S6', 20n, 3, true], ['S10', 12n, 5, true], ['S10^3', 12n, 5, true]];
  const burnside = (dim, mirror) => { let s = 0n; for (const [, size, order, improper] of classes) { const chi = (k) => (k % order === 0 && (!improper || k % 2 === 0)) ? BigInt(dim) : (improper && order === 2 && k % 2 === 1) ? BigInt(mirror) : 0n; s += size * sym22(chi(1), chi(2), chi(4)); } if (s % 120n !== 0n) throw new Error('not an integer'); return s / 120n; };
  const PHI = (1 + Math.sqrt(5)) / 2;
  const ico = []; for (const a of [-1, 1]) for (const b of [-PHI, PHI]) ico.push([0, a, b], [b, 0, a], [a, b, 0]);
  const dist = (u, v) => Math.hypot(u[0] - v[0], u[1] - v[1], u[2] - v[2]);
  const edges = []; for (let i = 0; i < 12; i++) for (let j = 0; j < 12; j++) if (i !== j && Math.abs(dist(ico[i], ico[j]) - 2) < 1e-9) edges.push([i, j]);
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const cols = (u, v) => { const w = cross(u, v); return [u[0], v[0], w[0], u[1], v[1], w[1], u[2], v[2], w[2]]; };
  const inv3 = (A) => { const [a, b, c, d, e, f, g, h, i] = A, det = a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g); return [(e * i - f * h) / det, (c * h - b * i) / det, (b * f - c * e) / det, (f * g - d * i) / det, (a * i - c * g) / det, (c * d - a * f) / det, (d * h - e * g) / det, (b * g - a * h) / det, (a * e - b * d) / det]; };
  const B0inv = inv3(cols(ico[edges[0][0]], ico[edges[0][1]]));
  const rots = edges.map(([i, j]) => mm3(cols(ico[i], ico[j]), B0inv));
  const ops = rots.concat(rots.map((R) => R.map((x) => -x)));
  const tr = (R) => R[0] + R[4] + R[8], det = (R) => R[0] * (R[4] * R[8] - R[5] * R[7]) - R[1] * (R[3] * R[8] - R[5] * R[6]) + R[2] * (R[3] * R[7] - R[4] * R[6]);
  const classOf = (R) => { const d = det(R), t = tr(R), near = (x) => Math.abs(t - x) < 1e-6; if (d > 0) { if (near(3)) return 0; if (near(PHI)) return 1; if (near(1 - PHI)) return 2; if (near(0)) return 3; if (near(-1)) return 4; } else { if (near(-3)) return 5; if (near(-PHI)) return 6; if (near(PHI - 1)) return 7; if (near(0)) return 8; if (near(1)) return 9; } throw new Error(`unclassified ${d} ${t}`); };
  const CLS = ['E', '12C5', '12C5^2', '20C3', '15C2', 'i', '12S10', '12S10^3', '20S6', '15sigma'];
  const ITAB = { A: [1, 1, 1, 1, 1], T1: [3, PHI, 1 - PHI, 0, -1], T2: [3, 1 - PHI, PHI, 0, -1], G: [4, -1, -1, 1, 0], H: [5, 0, 0, -1, 1] };
  const IRR = ['Ag', 'T1g', 'T2g', 'Gg', 'Hg', 'Au', 'T1u', 'T2u', 'Gu', 'Hu'];
  const chiOf = (irr, c) => { const row = ITAB[irr.slice(0, -1)]; return c < 5 ? row[c] : row[c - 5] * (irr.endsWith('g') ? 1 : -1); };
  const cls = ops.map(classOf), sizes = CLS.map((_, c) => cls.filter((x) => x === c).length);
  if (sizes.join() !== '1,12,12,20,15,1,12,12,20,15') throw new Error(`I_h classes ${sizes}`);
  let tableDefect = 0; for (const a of IRR) for (const b of IRR) { let s = 0; for (let c = 0; c < 10; c++) s += sizes[c] * chiOf(a, c) * chiOf(b, c); tableDefect = Math.max(tableDefect, Math.abs(s - (a === b ? 120 : 0))); }
  const decompose = (chi) => { const m = {}; let resid = 0; for (const irr of IRR) { let s = 0; for (let k = 0; k < 120; k++) s += chi[k] * chiOf(irr, cls[k]); s /= 120; const r = Math.round(s); resid = Math.max(resid, Math.abs(s - r)); if (r) m[irr] = r; } return { m, resid }; };
  /* Sol's own fixture: the 60 coordinates of the ideal truncated icosahedron (both edge kinds 1.400 Å) */
  const solC60 = JSON.parse(readFileSync(new URL('tools/library/census/round2-sol-exact.json', ROOT), 'utf8')).directC60;
  const X = solC60.coordinatesAngstrom;
  const perms = ops.map((R) => X.map((p) => { const q = mv(R, p); let best = -1, bd = Infinity; X.forEach((r, k) => { const d = dist(q, r); if (d < bd) { bd = d; best = k; } }); if (bd > 1e-6) throw new Error('C60 is not I_h-symmetric'); return best; }));
  const fixed = perms.map((p) => p.filter((b, a) => b === a).length);
  const chiAO = perms.map((p, k) => fixed[k] * (2 + tr(ops[k]))), aoBlocks = decompose(chiAO);
  const dimOf = (irr) => ({ A: 1, T: 3, G: 4, H: 5 })[irr[0]];
  const adjacency = []; for (let i = 0; i < 60; i++) for (let j = i + 1; j < 60; j++) if (Math.abs(dist(X[i], X[j]) - 1.4) < 1e-6) adjacency.push([i, j]);
  const pentagonOf = X.map((p) => { let best = -1, bd = -Infinity; ico.forEach((u, k) => { const d = p[0] * u[0] + p[1] * u[1] + p[2] * u[2]; if (d > bd) { bd = d; best = k; } }); return best; });
  const edge66 = adjacency.filter(([i, j]) => pentagonOf[i] !== pentagonOf[j]), edge56 = adjacency.filter(([i, j]) => pentagonOf[i] === pentagonOf[j]);
  const huckel = (b66, b56) => {
    const H = new Float64Array(3600); for (const [i, j] of edge66) { H[i * 60 + j] = H[j * 60 + i] = b66; } for (const [i, j] of edge56) { H[i * 60 + j] = H[j * 60 + i] = b56; }
    const e = eigSym(H, 60), x = Array.from(e.values), order = x.map((_, i) => i).sort((a, b) => x[b] - x[a]);   // descending x = ascending Hückel energy (β < 0)
    const levels = []; let start = 0;
    for (let k = 1; k <= 60; k++) if (k === 60 || Math.abs(x[order[k]] - x[order[k - 1]]) > 1e-8) { const idx = order.slice(start, k);
      const chi = perms.map((p) => { let s = 0; for (const col of idx) for (let a = 0; a < 60; a++) s += e.vectors[p[a] * 60 + col] * e.vectors[a * 60 + col]; return s; });
      const { m, resid } = decompose(chi); levels.push({ x: +x[order[start]].toFixed(10), degeneracy: k - start, irrep: Object.entries(m).map(([k2, v]) => (v > 1 ? `${v}${k2}` : k2)).join('+'), residual: +resid.toExponential(2) }); start = k; }
    let filled = 0; const named = {}; for (const L of levels) { const key = L.irrep; named[key] = (named[key] || 0) + 1; L.name = `${named[key]}${key.toLowerCase()}`; L.electrons = Math.max(0, Math.min(2 * L.degeneracy, 60 - filled)); filled += 2 * L.degeneracy; }
    const homo = levels.filter((L) => L.electrons > 0).at(-1), lumo = levels.find((L) => L.electrons === 0);
    return { beta66: b66, beta56: b56, levels, distinctLevels: levels.length, homo: homo.name, lumo: lumo.name, gapInBetaUnits: +(homo.x - lumo.x).toFixed(6), hgLevels: levels.filter((L) => L.irrep === 'Hg').map((L) => L.x) };
  };
  out.c60 = { burnside: { canonicalShellQuartets: String(sym22(180n, 180n, 180n)), shellOrbitsIh: String(burnside(180, 12)), canonicalAoQuartets: String(sym22(300n, 300n, 300n)), independentErisIh: String(burnside(300, 12)),
      shellFraction: Number(burnside(180, 12)) / Number(sym22(180n, 180n, 180n)), aoFraction: Number(burnside(300, 12)) / Number(sym22(300n, 300n, 300n)) },
    group: { operations: ops.length, classSizes: sizes, tableDefect, fixedAtomsByClass: Object.fromEntries(CLS.map((c, k) => [c, fixed[cls.indexOf(k)]])), aoCharacterByClass: Object.fromEntries(CLS.map((c, k) => [c, chiAO[cls.indexOf(k)]])) },
    aoBlocks: aoBlocks.m, aoBlockResidual: aoBlocks.resid, aoBlockDimensionCheck: Object.entries(aoBlocks.m).reduce((s, [k, v]) => s + dimOf(k) * v, 0),
    fockEntriesInBlocks: Object.entries(aoBlocks.m).reduce((s, [k, v]) => s + dimOf(k) * v * v, 0), fockEntriesDense: 90000, eigensolveWorkInBlocks: Object.entries(aoBlocks.m).reduce((s, [k, v]) => s + dimOf(k) * v ** 3, 0), eigensolveWorkDense: 27e6, largestBlock: Math.max(...Object.values(aoBlocks.m)),
    piRepresentation: decompose(perms.map((p, k) => fixed[k])).m,
    edges: { total: adjacency.length, hexHex66: edge66.length, pentHex56: edge56.length }, huckelEqual: huckel(1, 1), huckelTwoWeights: huckel(1.1, 1.0) };
}

/* ── 9 · the approximate rings: the C2 axis two ways (Sol: through the ring centroid; lab/names.js: from the charge centre to atom 0) ── */
out.approximateRings = {};
for (const id of ['C4H4O', 'C5H5N']) {
  const ats = moleculeAtoms(id), nr = id === 'C4H4O' ? 5 : 6;
  const residualAbout = (centre) => { const u = [ats[0].x - centre[0], ats[0].y - centre[1], 0], nu = Math.hypot(...u); u[0] /= nu; u[1] /= nu;
    const R = [2 * u[0] * u[0] - 1, 2 * u[0] * u[1], 0, 2 * u[1] * u[0], 2 * u[1] * u[1] - 1, 0, 0, 0, -1];
    let worst = 0; for (const a of ats) { const q = mv(R, [a.x - centre[0], a.y - centre[1], a.z - centre[2]]).map((x, i) => x + centre[i]); let bd = Infinity; for (const b of ats) if (b.Z === a.Z) bd = Math.min(bd, Math.hypot(b.x - q[0], b.y - q[1], b.z - q[2])); worst = Math.max(worst, bd); } return worst; };
  const centroid = [0, 1, 2].map((k) => ats.slice(0, nr).reduce((s, a) => s + [a.x, a.y, a.z][k], 0) / nr), cc = chargeCentre(ats);
  out.approximateRings[id] = { c2ThroughRingCentroidBohr: residualAbout(centroid), c2ThroughChargeCentreBohr: residualAbout(cc), mirrorPlaneExact: Math.max(...ats.map((a) => Math.abs(a.z))) };
}

writeFileSync(OUT, JSON.stringify(out, null, 1) + '\n');
const sk = out.skeleton;
console.log(`\n# ROUND 3 — benzene ${n} AO · E = ${sol.energy.toFixed(9)} · live loop NP ${out.instrumentation.NP}, quartets ${out.instrumentation.quartets}, Schwarz skipped ${out.instrumentation.schwarzSkipped}, rInto ${out.instrumentation.rInto}, primitive skipped ${out.instrumentation.primSkipped}; hooks-off tensor difference ${out.instrumentation.eriDifferenceHooksOff}`);
console.log(`orbits D2h ${out.liveLoop.D2h.orbits}/${out.liveLoop.D2h.quartets} = ${out.liveLoop.D2h.fraction.toFixed(10)} ${JSON.stringify(out.liveLoop.D2h.orbitSizes)} prim ${out.liveLoop.D2h.primitiveFraction.toFixed(10)} comp ${out.liveLoop.D2h.componentFraction.toFixed(10)}`);
console.log(`orbits D6h ${out.liveLoop.D6h.orbits}/${out.liveLoop.D6h.quartets} = ${out.liveLoop.D6h.fraction.toFixed(10)} ${JSON.stringify(out.liveLoop.D6h.orbitSizes)} prim ${out.liveLoop.D6h.primitiveFraction.toFixed(10)} comp ${out.liveLoop.D6h.componentFraction.toFixed(10)}`);
for (const k of ['full', 'setupOnly', 'd2hSigned', 'd2hGeneral', 'd6hGeneral']) console.log(`${k.padEnd(11)} pass ${String(sk[k].passMsMedian).padStart(7)} ms (reconstruct ${sk[k].reconstructMsMedian} ms) · contracted ${sk[k].quartetsContracted} · rInto ${sk[k].rIntoCalls} · writes ${sk[k].reconstructionWrites} · max|Δ| ${sk[k].maxAbsDiffVsSolver.toExponential(2)} · ×${sk[k].speedupVsFull}`);
console.log(`rpa dense ${out.rpa.denseMacs} blocked ${out.rpa.blockedMacs} (${(100 * out.rpa.blockedFraction).toFixed(4)} %) assembly ${out.rpa.assemblyEntriesBlocked}/${out.rpa.assemblyEntriesDense} · dense Hessian ${out.rpa.denseHessianMsMedian} ms`);
console.log(`grids ${Object.entries(out.grids).filter(([k]) => !['burnside', 'solReflection'].includes(k)).map(([k, v]) => `${k}:${v.order}:${v.orbits}:${v.boundaryVoxels}`).join(' ')} · Sol reflection maps ${out.grids.solReflection.voxelsMapped} voxel centres onto centres`);
if (out.census) console.log(`census predicted live ${(100 * out.census.predictedLive.fraction).toFixed(4)} % · measured live ${(100 * out.census.measuredLive.fraction).toFixed(4)} % (Σ measured ${out.census.modelVsMeasured.sumMeasuredLive} ms vs Σ predicted ${out.census.modelVsMeasured.sumPredictedLive} ms) · order ≥ 8: ${(100 * out.census.measuredLiveOrder8plus.fraction).toFixed(4)} %`);
console.log(`c60 shells ${out.c60.burnside.shellOrbitsIh}/${out.c60.burnside.canonicalShellQuartets} AO ${out.c60.burnside.independentErisIh}/${out.c60.burnside.canonicalAoQuartets} · blocks ${JSON.stringify(out.c60.aoBlocks)} (Σ d·n = ${out.c60.aoBlockDimensionCheck}, largest ${out.c60.largestBlock}) · Hückel(1,1) HOMO ${out.c60.huckelEqual.homo} LUMO ${out.c60.huckelEqual.lumo} gap ${out.c60.huckelEqual.gapInBetaUnits}|β| · ${out.c60.huckelEqual.distinctLevels} levels`);
console.log(`rings ${JSON.stringify(out.approximateRings)}`);
console.log(`wrote ${OUT}`);
