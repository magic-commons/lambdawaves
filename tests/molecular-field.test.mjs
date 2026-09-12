import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { evaluator, uploadContract } from '../lab/molecular-field.js';

const close = (a, b, tol, what) => assert.ok(Math.abs(a - b) < tol, `${what}: ${a} vs ${b} (tol ${tol})`);
const fx = JSON.parse(readFileSync(new URL('./fixtures/h2o-field.json', import.meta.url)));
const D = Float64Array.from(fx.D), C = Float64Array.from(fx.C);

/* Gauss–Legendre nodes by Newton on P_n — the angular rule of the quadrature below. */
function gaussLegendre(n) {
  const x = new Float64Array(n), w = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    let z = Math.cos(Math.PI * (i + 0.75) / (n + 0.5)), p1 = 0, dp = 0;
    for (let it = 0; it < 100; it++) {
      let p0 = 1; p1 = z;
      for (let k = 2; k <= n; k++) { const p2 = ((2 * k - 1) * z * p1 - (k - 1) * p0) / k; p0 = p1; p1 = p2; }
      dp = n * (z * p1 - p0) / (z * z - 1);
      const dz = p1 / dp; z -= dz; if (Math.abs(dz) < 1e-16) break;
    }
    x[i] = z; w[i] = 2 / ((1 - z * z) * dp * dp);
  }
  return { x, w };
}
/* Becke's fuzzy-cell partition (J. Chem. Phys. 88, 2547 (1988)), third-order smoothing, no atomic-size adjustment. */
const f1 = (x) => 1.5 * x - 0.5 * x * x * x, s3 = (m) => 0.5 * (1 - f1(f1(f1(m))));
/* Becke radial map r = R_m(1+x)/(1−x) with Gauss–Chebyshev of the second kind, times a product angular rule. */
function beckeIntegral(atoms, Rm, nRad, nTh, nPh, f) {
  const { x: ux, w: uw } = gaussLegendre(nTh), A = atoms.length, R = [];
  for (let a = 0; a < A; a++) { R.push([]); for (let b = 0; b < A; b++) R[a].push(Math.hypot(...atoms[a].c.map((v, k) => v - atoms[b].c[k]))); }
  const d = new Float64Array(A), P = new Float64Array(A), pt = new Float64Array(3);
  let total = 0, points = 0;
  for (let a = 0; a < A; a++) for (let i = 1; i <= nRad; i++) {
    const th = i * Math.PI / (nRad + 1), xx = Math.cos(th), st = Math.sin(th);
    const r = Rm[a] * (1 + xx) / (1 - xx), wr = (Math.PI / (nRad + 1) * st * st / st) * r * r * 2 * Rm[a] / ((1 - xx) * (1 - xx));
    if (!Number.isFinite(wr) || wr === 0) continue;
    for (let t = 0; t < nTh; t++) { const u = ux[t], sn = Math.sqrt(1 - u * u);
      for (let p = 0; p < nPh; p++) {
        const ph = 2 * Math.PI * p / nPh;
        pt[0] = atoms[a].c[0] + r * sn * Math.cos(ph); pt[1] = atoms[a].c[1] + r * sn * Math.sin(ph); pt[2] = atoms[a].c[2] + r * u;
        for (let b = 0; b < A; b++) d[b] = Math.hypot(pt[0] - atoms[b].c[0], pt[1] - atoms[b].c[1], pt[2] - atoms[b].c[2]);
        let sum = 0;
        for (let b = 0; b < A; b++) { let pr = 1;
          for (let c = 0; c < A; c++) { if (c === b) continue; pr *= s3(Math.max(-1, Math.min(1, (d[b] - d[c]) / R[b][c]))); }
          P[b] = pr; sum += pr; }
        total += wr * uw[t] * (2 * Math.PI / nPh) * (P[a] / sum) * f(pt); points++;
      }
    }
  }
  return { total, points };
}

/* 1. The AO and density values at named points, against PySCF's eval_gto / eval_rho on the identical primitives. */
const ev = evaluator(fx.shells);
{
  assert.equal(ev.n, fx.n, 'component count');
  assert.equal(ev.groups.length, 4, 'four exponential groups for H₂O/STO-3G: O 1s, O sp, H, H');
  let worstRho = 0, worstAO = 0;
  for (const p of fx.points) {
    const v = ev.ao(p.r), rho = ev.density(D, p.r);
    for (let i = 0; i < fx.n; i++) worstAO = Math.max(worstAO, Math.abs(v[i] - p.ao[i]));
    worstRho = Math.max(worstRho, Math.abs(rho - p.rho));
  }
  assert.ok(worstAO < 1e-12, `AO values against PySCF eval_gto at ten points: worst ${worstAO}`);
  assert.ok(worstRho < 1e-9, `ρ against PySCF eval_rho at ten points: worst ${worstRho}`);
  const at = (name) => fx.points.find((p) => p.name === name);
  close(ev.density(D, at('O nucleus').r), 193.313905, 1e-5, 'ρ at the O nucleus');
  close(ev.density(D, at('H1 nucleus').r), 0.362710, 1e-5, 'ρ at an H nucleus');
  close(ev.density(D, at('O-H1 midpoint').r), 0.492165, 1e-5, 'ρ at the O–H midpoint');
  assert.ok(ev.density(D, at('12 bohr above O').r) < 1e-27, 'ρ twelve bohr out is under 1e-27');
  /* the orbitals are the same object: ρ = 2 Σ_occ ψ_k² for a closed shell */
  let worstPsi = 0;
  for (const p of fx.points) { let s = 0; for (let k = 0; k < fx.nocc; k++) s += 2 * ev.orbital(C, k, p.r) ** 2;
    worstPsi = Math.max(worstPsi, Math.abs(s - p.rho)); }
  assert.ok(worstPsi < 1e-9, `ρ = 2 Σ_occ ψ_k²: worst ${worstPsi}`);
  console.log(`PASS molecular field points: AO to ${worstAO.toExponential(2)} and ρ to ${worstRho.toExponential(2)} against PySCF at ten points;`
    + ` ρ(O) ${ev.density(D, at('O nucleus').r).toFixed(6)}, ρ(H) ${ev.density(D, at('H1 nucleus').r).toFixed(6)}, O–H midpoint ${ev.density(D, at('O-H1 midpoint').r).toFixed(6)},`
    + ` ρ(12 bohr) ${ev.density(D, at('12 bohr above O').r).toExponential(4)}; ρ = 2Σψ² to ${worstPsi.toExponential(2)}.`);
}

/* 2. Twelve exponentials per point, counted — not twenty-one. O 2s and O 2p share one three-exponent sp shell. */
{
  const naive = fx.shells.reduce((s, sh) => s + sh.bfs.length * sh.exps.length, 0);
  assert.equal(naive, 21, 'a per-component evaluation would take 21 exponentials (Sol\'s Round 1 figure)');
  assert.equal(ev.exponentialsPerPoint, 12, 'the shell-shared count is 12');
  const before = { ...ev.stats };
  ev.ao([0.3, -0.4, 0.9]);
  assert.equal(ev.stats.calls - before.calls, 1, 'one ao() call');
  assert.equal(ev.stats.exponentials - before.exponentials, 12, 'twelve Math.exp calls actually executed for that point');
  const c2 = { ...ev.stats };
  for (let k = 0; k < 100; k++) ev.density(D, [0.01 * k, 0.02 * k, 0.03 * k]);
  assert.equal(ev.stats.exponentials - c2.exponentials, 1200, '12 per point over 100 points, no per-component recomputation');
  console.log(`PASS exponential count: ${ev.exponentialsPerPoint} per point (naive per-component ${naive}); 1200 Math.exp calls counted over 100 density points.`);
}

/* 3. Support radii: conservative culling bounds, verified against the evaluator itself. */
{
  const radii = fx.shells.map((sh) => ev.supportRadius(sh, 1e-10));
  for (let s = 0; s < fx.shells.length; s++) {
    const sh = fx.shells[s], r = radii[s];
    for (const dir of [[1, 0, 0], [0, 1, 0], [0, 0, 1], [0.577350269, 0.577350269, 0.577350269]]) {
      const out = ev.ao(sh.c.map((v, k) => v + (r + 0.05) * dir[k]));
      for (const b of ev.components.filter((c) => c.shell === sh)) assert.ok(Math.abs(out[b.idx]) <= 1e-10,
        `component ${b.idx} is under 1e-10 beyond its support radius ${r}`);
    }
    const inside = ev.ao(sh.c.map((v, k) => v + 0.5 * r * [0, 0, 1][k]));
    assert.ok(Math.max(...ev.components.filter((c) => c.shell === sh).map((b) => Math.abs(inside[b.idx]))) > 1e-10,
      'the radius is not vacuously large: some component is above the threshold at half of it');
    assert.ok(ev.supportRadius(sh, 1e-6) < r, 'a looser threshold gives a smaller radius');
  }
  console.log(`PASS support radii at 1e-10 (bohr): ${radii.map((r) => r.toFixed(3)).join(', ')} for the O 1s, O 2s, O 2p, H, H shells.`);
}

/* 4. The display grid is NOT a quadrature; a Becke grid is, and it returns the electron count. */
{
  const { N, L } = fx.grid96, step = 2 * L / N, out = new Float64Array(fx.n);
  const pt = new Float64Array(3);
  let sum = 0;
  for (let i = 0; i < N; i++) { pt[0] = -L + (i + 0.5) * step;
    for (let j = 0; j < N; j++) { pt[1] = -L + (j + 0.5) * step;
      for (let k = 0; k < N; k++) { pt[2] = -L + (k + 0.5) * step;
        const v = ev.ao(pt, out); let s = 0;
        for (let a = 0; a < fx.n; a++) { const va = v[a]; if (va === 0) continue; for (let b = 0; b < fx.n; b++) s += D[a * fx.n + b] * va * v[b]; }
        sum += s; } } }
  const voxels = sum * step ** 3;
  assert.equal(N ** 3, 884736, 'the 96³ display grid visits 884,736 voxels');
  close(voxels, 9.662692, 1e-3, 'the 96³ midpoint sum on the ±10.3 bohr box');
  close(voxels, fx.grid96.sum, 1e-6, 'the same sum as PySCF\'s eval_gto over the identical cell centres');
  assert.ok(Math.abs(voxels - 10) > 0.3, `the voxel sum is NOT the electron count: ${voxels} against 10 (${(100 * (1 - voxels / 10)).toFixed(1)} % short)`);
  const uc = uploadContract({ N });
  assert.equal(uc.bytes, 24772608, 'seven r32float layers of 96³ are 24,772,608 bytes');
  assert.equal(uc.bytes, fx.grid96.bytesSevenLayers);
  assert.match(uc.electronCount, /Tr\(DS\)/, 'the upload contract states the electron count comes from Tr(DS)');
  /* the quadrature that does work: Becke cells, Gauss–Chebyshev radial, Gauss–Legendre × uniform angular */
  const Rm = fx.atoms.map((a) => (a.Z === 1 ? 0.661 : 0.567));
  const q = beckeIntegral(fx.atoms, Rm, 80, 20, 40, (p) => ev.density(D, p));
  assert.equal(q.points, 192000, 'the Becke grid: 3 centres × 80 radial × 20 × 40 angular');
  close(q.total, 10, 1e-4, '∫ρ dV on the Becke grid');
  close(q.total, fx.becke['2'].integral, 1e-4, 'the same integral as PySCF\'s own level-2 Becke grid');
  close(fx.TrDS, 10, 1e-12, 'Tr(DS) is exactly the electron count');
  /* the same grid says the orbitals are orthonormal — the evaluator and the coefficients agree on the metric */
  let worstS = 0;
  for (let a = 0; a < 3; a++) for (let b = a; b < 3; b++) {
    const v = beckeIntegral(fx.atoms, Rm, 80, 20, 40, (p) => ev.orbital(C, a, p) * ev.orbital(C, b, p)).total;
    worstS = Math.max(worstS, Math.abs(v - (a === b ? 1 : 0)));
  }
  assert.ok(worstS < 1e-5, `⟨ψ_a|ψ_b⟩ = δ_ab on the Becke grid for the first three MOs: worst ${worstS}`);
  console.log(`PASS grid law: 96³ = ${N ** 3} voxels, midpoint sum ${voxels.toFixed(6)} electrons (PySCF ${fx.grid96.sum.toFixed(6)}), `
    + `${(100 * (1 - voxels / 10)).toFixed(2)} % short of 10 — not a quadrature; upload ${uc.bytes} bytes. `
    + `Becke ${q.points} points: ∫ρ = ${q.total.toFixed(9)} (PySCF level 2 ${fx.becke['2'].integral.toFixed(9)}), Tr(DS) = ${fx.TrDS}; MO orthonormality to ${worstS.toExponential(2)}.`);
}

/* 5. The refusals. */
{
  assert.throws(() => evaluator([]), /non-empty/, 'an empty shell list is refused');
  assert.throws(() => evaluator([{ c: [0, 0], l: 0, exps: [1], bfs: [{ l: [0, 0, 0], d: [1] }] }]), /c: \[x, y, z\]/, 'a two-component centre is refused');
  assert.throws(() => evaluator([{ c: [0, 0, 0], l: 0, exps: [1, 2], bfs: [{ l: [0, 0, 0], d: [1] }] }]), /one weight per exponent/, 'a weight/exponent mismatch is refused');
  assert.throws(() => ev.density(new Float64Array(4), [0, 0, 0]), /n×n/, 'a wrong-sized density is refused');
  assert.throws(() => ev.orbital(C, 7, [0, 0, 0]), /outside/, 'an orbital index outside the basis is refused');
  console.log('PASS molecular field refusals: empty shells, bad centre, weight/exponent mismatch, wrong density size, orbital index.');
}
