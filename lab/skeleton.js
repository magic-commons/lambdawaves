/* skeleton.js — THE SKELETON (0.7.0 V2): the nuclei as beads, the bonds and the dipole arrow on the stage's own #skeleton canvas, through the one eye
 * (field.js toScreen).  A bead is 0.28 × the element's covalent radius (Cordero et al., Dalton Trans. 2008, 2832: H–Kr, Å → bohr) projected, so it
 * shrinks with distance, in the Jmol CPK colour; a bond is every pair within 1.3 × (rᵢ + rⱼ) (1.2 drops F₂, at 1.24) of the atoms AS PASSED, found again only when they move;
 * the dipole (a.u.) runs from the centre of nuclear charge, 2 bohr per a.u., in the accent.  The far half (depth past the origin's) is dimmed — since
 * iteration 012 O1 by a smooth glide across the molecule's depth, not angular-nodes.js' step.  Ink and accent are the kit's --fg / --acc, read when the theme changes.  Nothing changed: no paint; off: clear() once.
 * Iteration 011 Q1 (Josh 10-19: "remove the outline on the circles so that it's a flat colored disk"): a nucleus is a FLAT disk — no ink ring — of radius
 * `size` × 0.28 × r_cov (INFORMATIONAL › SKELETON › SIZE, the record's `skeletonSize`, 1.6 by default); the bonds and the dipole keep their 2 px.
 * Iteration 012 R1 (Josh 10-20): SKELETON is BALL AND STICK — `opacity` (its OPACITY knob) scales the beads and bonds; `sticks` false draws the atoms'
 * dipole arrow alone (MARKS › DIPOLE, its own switch now: the "weird arrow" Josh asked to separate). */
import { cameraKey, toScreen } from './field.js';
import { ANGSTROM } from './md.js'; import { moleculeCharge } from './molecules.js'; import { RCOV, CPK, bondsOf as pairsOf } from './elements.js';   // iteration 014 B: the element table; the skeleton's own bondsOf (D6: orders, rings, ionic, H-bonds) is below — field.js' sticks read elements.js' length rule   // iteration 014 B: the element table lives in elements.js


/* ── iteration 014 D6 · THE BONDS (Josh: "Let the Ball and stick model show double/triple bonds, whether a bond is sigma, or ionic, or different types
   of attraction, resonances (like benzene) and other 'sticks' you could think of. Let these be a customizable feature to be in the informational").
   bondsOf(atoms, { rec, charges }) → { bonds: [{ i, j, order, arom, ionic }], rings: [[i …]], hb: [[h, a]], road, ionicRoad }, found once per molecule:
   · THE STICKS are the 1.3 × (rᵢ + rⱼ) pairs above, or a record's own `bonds` [[i, j, order]] (order 1 · 2 · 3, 1.5 aromatic) when it carries them;
   · ORDER by length (no record): Pyykkö's single / double / triple covalent radii (Chem. Eur. J. 2009, 15, 186 · 2005, 11, 3511) between B C N O Si P S,
     order k when the length is 40 % of the way past order k − 1's toward k's; an atom whose neighbours already fill its valence keeps single bonds, and one past it is stepped down
     (CO₂'s 1.16 Å C–O reads double, not triple);
   · AROMATIC: a 5- or 6-ring of C N O S, each atom with ≤ 3 neighbours and every ring bond shorter than single (a ring O, S or 3-bonded N in a 5-ring
     exempt: furan's C–O) — drawn as single sticks with a dashed inner circle in the ring's plane; with a record, its 1.5 bonds' rings;
   · IONIC / DATIVE: Mulliken charges of opposite sign 0.8 e apart (a volume rung carries them), else Pauling Δχ ≥ 2 (≥ 1 to Li Na K Mg Ca); DATIVE a donor N O P S past its
     valence bound to B, Al, Be or a metal — both a dotted stick;
   · H-BOND: N/O/F–H···N/O/F, H to acceptor ≤ 2.5 Å, the angle at H ≥ 120°, the acceptor not the donor's neighbour — dotted, in the accent. */
const PYK = { 1: [32], 5: [85, 78, 73], 6: [75, 67, 60], 7: [71, 60, 54], 8: [63, 57, 53], 14: [116, 107, 102], 15: [111, 102, 94], 16: [103, 94, 95] };   // pm
const VAL = { 1: 1, 5: 3, 6: 4, 7: 3, 8: 2, 9: 1, 14: 4, 15: 5, 16: 6, 17: 1, 35: 1 };   // the most bonds an atom takes (S and P expand)
const CHI = [0, 2.20, 0, 0.98, 1.57, 2.04, 2.55, 3.04, 3.44, 3.98, 0, 0.93, 1.31, 1.61, 1.90, 2.19, 2.58, 3.16, 0, 0.82, 1.00, 1.36, 1.54, 1.63, 1.66, 1.55, 1.83, 1.88, 1.91, 1.90, 1.65, 1.81, 2.01, 2.18, 2.55, 2.96, 3.00];   // Pauling
const ACCEPTOR = (Z) => Z === 3 || Z === 4 || Z === 5 || Z === 11 || Z === 12 || Z === 13 || (Z >= 19 && Z <= 31);
const DONOR = { 7: 3, 8: 2, 15: 3, 16: 2 }, METAL = (Z) => Z === 3 || Z === 11 || Z === 12 || Z === 19 || Z === 20;   // METAL: the alkali and alkaline-earth atoms an ionic bond reads at Δχ ≥ 1
const PM = ANGSTROM / 100;   // bohr per pm
export function bondsOf(atoms, { rec = null, charges = null } = {}) {
  const n = atoms.length, d = (i, j) => Math.hypot(atoms[i].x - atoms[j].x, atoms[i].y - atoms[j].y, atoms[i].z - atoms[j].z);
  const recB = Array.isArray(rec) && rec.length && rec.every((b) => Array.isArray(b) && b[0] < n && b[1] < n) ? rec : null;
  const bonds = [];
  if (recB) for (const [i, j, o] of recB) bonds.push({ i: Math.min(i, j), j: Math.max(i, j), order: o === 1.5 || o === 4 || o === 12 ? 1 : Math.max(1, Math.min(3, Math.round(+o || 1))), arom: o === 1.5 || o === 4 || o === 12, ionic: false });
  else for (const [i, j] of pairsOf(atoms)) bonds.push({ i, j, order: 1, arom: false, ionic: false });   // 021 G4: elements.js' 1.3 × (rᵢ + rⱼ) pairs, the one rule (field.js' sticks read it too)
  const nb = atoms.map(() => []); for (const b of bonds) { nb[b.i].push(b); nb[b.j].push(b); }
  const other = (b, k) => (b.i === k ? b.j : b.i);
  if (!recB) {
    for (const b of bonds) { const A = PYK[atoms[b.i].Z], B = PYK[atoms[b.j].Z]; if (!A || !B || A.length < 3 || B.length < 3) continue;
      if (nb[b.i].length >= VAL[atoms[b.i].Z] || nb[b.j].length >= VAL[atoms[b.j].Z]) continue;   // a saturated atom keeps single bonds
      const L = d(b.i, b.j), p = [0, 1, 2].map((k) => (A[k] + B[k]) * PM);
      b.order = L < p[1] - 0.4 * (p[1] - p[2]) ? 3 : L < p[0] - 0.4 * (p[0] - p[1]) ? 2 : 1; }   // 40 % of the way to the shorter: O₂'s 1.21 Å reads double
    if (n > 2) for (let k = 0; k < n; k++) { const v = VAL[atoms[k].Z]; if (!v) continue;   // past the valence (never a diatomic: CO keeps its triple): step the highest order down, one at a time
      for (let s = nb[k].reduce((t, b) => t + b.order, 0); s > v; s--) { const b = nb[k].filter((x) => x.order > 1).sort((x, y) => y.order - x.order)[0]; if (!b) break; b.order--; } }
  }
  /* the 5- and 6-rings (each once, from its lowest atom) */
  const ringAtom = (k) => [6, 7, 8, 16].includes(atoms[k].Z) && nb[k].length <= 3, rings = [], seen = new Set();
  const walk = (start, path) => { const k = path[path.length - 1];
    for (const b of nb[k]) { const m = other(b, k); if (m === start && path.length >= 5) { const key = [...path].sort((x, y) => x - y).join(); if (!seen.has(key)) { seen.add(key); rings.push(path.slice()); } continue; }
      if (m <= start || path.includes(m) || path.length >= 6 || !(recB ? b.arom : ringAtom(m))) continue; path.push(m); walk(start, path); path.pop(); } };
  for (let k = 0; k < n; k++) if (recB ? nb[k].some((b) => b.arom) : ringAtom(k)) walk(k, [k]);
  const edge = (a, c) => nb[a].find((b) => other(b, a) === c), arom = [];
  for (const r of rings) { const es = r.map((a, q) => edge(a, r[(q + 1) % r.length]));
    if (!recB) { const ok = es.every((b) => { const zi = atoms[b.i].Z, zj = atoms[b.j].Z, A = PYK[zi], B = PYK[zj]; if (!A || !B) return false;
        const lone = (k) => r.length === 5 && ((atoms[k].Z === 8 || atoms[k].Z === 16) || (atoms[k].Z === 7 && nb[k].length === 3));
        return lone(b.i) || lone(b.j) || d(b.i, b.j) < (A[0] + B[0] - 5) * PM; }) && r.every((k) => atoms[k].Z !== 6 || nb[k].length === 3);
      if (!ok) continue; for (const b of es) { b.arom = true; b.order = 1; } }
    arom.push(r); }
  /* ionic and dative */
  const q = Array.isArray(charges) || ArrayBuffer.isView(charges) ? (charges.length === n ? charges : null) : null;
  for (const b of bonds) { const zi = atoms[b.i].Z, zj = atoms[b.j].Z;
    const dx = CHI[zi] && CHI[zj] ? Math.abs(CHI[zi] - CHI[zj]) : 0, ion = q ? q[b.i] * q[b.j] < 0 && Math.abs(q[b.i] - q[b.j]) >= 0.8 : dx >= 2 || (dx >= 1 && (METAL(zi) || METAL(zj)));
    const dative = (k, m) => DONOR[atoms[k].Z] && nb[k].length > DONOR[atoms[k].Z] && ACCEPTOR(atoms[m].Z);
    b.ionic = ion || dative(b.i, b.j) || dative(b.j, b.i); }
  /* hydrogen bonds */
  const hb = [], HX = (Z) => Z === 7 || Z === 8 || Z === 9;
  for (let h = 0; h < n; h++) { if (atoms[h].Z !== 1 || nb[h].length !== 1) continue; const D = other(nb[h][0], h); if (!HX(atoms[D].Z)) continue;
    for (let a = 0; a < n; a++) { if (a === D || !HX(atoms[a].Z) || edge(h, a) || edge(D, a) || d(h, a) > 2.5 * ANGSTROM) continue;
      const u = ['x', 'y', 'z'].map((c) => atoms[D][c] - atoms[h][c]), w = ['x', 'y', 'z'].map((c) => atoms[a][c] - atoms[h][c]);
      const cos = (u[0] * w[0] + u[1] * w[1] + u[2] * w[2]) / (Math.hypot(...u) * Math.hypot(...w)); if (cos <= -0.5) hb.push([h, a]); } }
  return { bonds, rings: arom, hb, road: recB ? 'record' : 'length', ionicRoad: q ? 'Mulliken' : 'Δχ' };
}
/** 0.8.2 P3 · a molecule's bead: the electron density's centroid (ΣZ_A R_A − μ)/N_e, N_e = ΣZ − q (μ is nuclear minus electronic, rhf-molecule.js) */
export function centroid(atoms, mu, id) { if (!mu || !atoms.length) return null; let Z = 0; const C = [0, 0, 0]; for (const a of atoms) { Z += a.Z; C[0] += a.Z * a.x; C[1] += a.Z * a.y; C[2] += a.Z * a.z; }
  const N = Z - moleculeCharge(id); return { r: C.map((v, q) => (v - mu[q]) / N), T: Infinity, key: id, t: 0 }; }
export function createSkeleton(cv, say = null) {   // say(line): the BONDS' road, told when it changes (INFORMATIONAL's status)
  const g = cv.getContext('2d'); let key = '', atomsKey = '', bonds = [], found = null, said = '', theme = null, ink = '', acc = '', drawn = false, trail = [], trailKey = null, trailT = -Infinity;   // THE BEAD's trail (0.8.2 P3): 64 points over its last period
  function clear() { key = ''; if (!drawn) return; g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, cv.width, cv.height); drawn = false; }
  function draw(atoms, dipole, obs, half, bead = null, size = 1, opacity = 1, sticks = true, bo = null, box = null) {   // bo: { order, aromatic, ionic, hbond, charges, rec } (iteration 014 D6) or null; box: { W, H, dpr } a film's own size (025 B2)
    const W = box ? box.W : cv.clientWidth, H = box ? box.H : cv.clientHeight, dpr = box ? box.dpr : Math.min(2, window.devicePixelRatio || 1), th = document.body.dataset.theme || 'dark'; atoms = atoms || [];
    if ((!atoms.length && !bead) || W < 1 || H < 1) return clear();
    if (!bead || bead.key !== trailKey || bead.t < trailT) { trail = []; trailKey = bead && bead.key; trailT = -Infinity; }   // a new state, or the clock run back: the trail starts again
    if (bead && bead.t - trailT >= bead.T / 64) { trail.push(bead.r); trailT = bead.t; if (trail.length > 64) trail.shift(); }
    const ak = atoms.map((a) => `${a.Z},${a.x.toFixed(4)},${a.y.toFixed(4)},${a.z.toFixed(4)}`).join(';');
    const k = [ak, dipole ? dipole.map((v) => v.toFixed(4)).join() : '', cameraKey(obs), obs.dist.toFixed(4), obs.fov, half, W, H, dpr, th, bead ? bead.r.map((v) => v.toFixed(4)).join() + ':' + trail.length + ':' + trailT : '', bead && bead.ell ? bead.ell.S.flat().map((v) => v.toFixed(4)).join() : '', size, opacity, sticks, bo ? [bo.order, bo.aromatic, bo.ionic, bo.hbond].map(Number).join('') : ''].join('|');
    const fk = ak + '|' + (bo && bo.charges ? bo.charges.length + ':' + bo.charges[0] : '') + '|' + (bo && bo.rec ? bo.rec.length : '');
    if (k + fk === key) return; key = k + fk;
    if (fk !== atomsKey) { atomsKey = fk; found = bondsOf(atoms, { rec: bo && bo.rec, charges: bo && bo.charges }); bonds = found.bonds; }
    if (say && sticks && bo) { const line = 'BONDS · ' + (found.road === 'record' ? 'orders from the record' : 'orders by length (Pyykkö radii; no record bonds)') + ' · ionic by ' + (found.ionicRoad === 'Mulliken' ? 'Mulliken charges' : 'Pauling Δχ'); if (line !== said) { said = line; say(line); } }
    if (th !== theme) { theme = th; const cs = getComputedStyle(document.body); ink = cs.getPropertyValue('--fg').trim() || cs.color; acc = cs.getPropertyValue('--acc').trim() || ink; }
    if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
    g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H); drawn = true;
    const S = toScreen(obs, half, W, H), c0 = S.at(0, 0, 0), zc = c0 ? c0[2] : Infinity, rt = S.basis.right, P = atoms.map((a) => S.at(a.x, a.y, a.z, []));
    /* iteration 012 O1 (Josh: "when ball and stick goes to the back and front, it fades out/in … make the transition less intense"): the far half
       was a STEP at the origin's depth (a bead 0.9 → 0.35, a bond 0.7 → 0.25 the frame it crossed).  Now the alpha GLIDES across the molecule's
       own depth: s = smoothstep over (z − z₀)/w ∈ [−1, 1], w the farthest atom's |z − z₀|, and a bead reads 0.9 − 0.4 s (0.9 nearest, 0.5
       farthest), a bond 0.7 − 0.35 s — continuous, so a turn never pops a bead, and the back stays legible */
    let w = 1e-6; for (const p of P) if (p) w = Math.max(w, Math.abs(p[2] - zc));
    const back = (z) => { const u = Math.max(0, Math.min(1, ((z - zc) / w + 1) / 2)); return u * u * (3 - 2 * u); };
    g.strokeStyle = ink; g.lineWidth = 2; g.lineCap = 'round';
    if (sticks) for (const b of bonds) { const p = P[b.i], q = P[b.j]; if (!p || !q) continue; g.globalAlpha = opacity * (0.7 - 0.35 * back((p[2] + q[2]) / 2));
      const o = bo && bo.order ? b.order : 1, dot = bo && bo.ionic && b.ionic, L = Math.hypot(q[0] - p[0], q[1] - p[1]) || 1, nx = -(q[1] - p[1]) / L, ny = (q[0] - p[0]) / L;
      g.setLineDash(dot ? [1, 4] : []); g.lineWidth = o === 1 ? 2 : o === 2 ? 1.6 : 1.4;   // iteration 014 D6: ORDER's parallel sticks, IONIC's dots
      for (const s of o === 1 ? [0] : o === 2 ? [-3, 3] : [-4.5, 0, 4.5]) { g.beginPath(); g.moveTo(p[0] + s * nx, p[1] + s * ny); g.lineTo(q[0] + s * nx, q[1] + s * ny); g.stroke(); } }
    g.setLineDash([]); g.lineWidth = 2;
    if (sticks && bo && bo.aromatic) for (const r of found.rings) {   // AROMATIC: a dashed circle in the ring's plane, 0.6 of its mean radius
      const c = [0, 1, 2].map((k) => r.reduce((t, i) => t + [atoms[i].x, atoms[i].y, atoms[i].z][k], 0) / r.length), v0 = [atoms[r[0]].x - c[0], atoms[r[0]].y - c[1], atoms[r[0]].z - c[2]], v1 = [atoms[r[1]].x - c[0], atoms[r[1]].y - c[1], atoms[r[1]].z - c[2]];
      const nn = [v0[1] * v1[2] - v0[2] * v1[1], v0[2] * v1[0] - v0[0] * v1[2], v0[0] * v1[1] - v0[1] * v1[0]], u = v0.map((x) => x / Math.hypot(...v0)), w0 = [nn[1] * u[2] - nn[2] * u[1], nn[2] * u[0] - nn[0] * u[2], nn[0] * u[1] - nn[1] * u[0]], w = w0.map((x) => x / (Math.hypot(...w0) || 1));
      const R = 0.6 * r.reduce((t, i) => t + Math.hypot(atoms[i].x - c[0], atoms[i].y - c[1], atoms[i].z - c[2]), 0) / r.length, pc = S.at(c[0], c[1], c[2]); if (!pc) continue;
      g.globalAlpha = opacity * (0.7 - 0.35 * back(pc[2])); g.lineWidth = 1.5; g.setLineDash([4, 4]); g.beginPath();
      for (let s = 0; s <= 48; s++) { const f = s * Math.PI / 24, e = S.at(...[0, 1, 2].map((k) => c[k] + R * (Math.cos(f) * u[k] + Math.sin(f) * w[k]))); if (e) (s ? g.lineTo(e[0], e[1]) : g.moveTo(e[0], e[1])); }
      g.stroke(); g.setLineDash([]); g.lineWidth = 2; }
    if (sticks && bo && bo.hbond && found.hb.length) { g.strokeStyle = acc; g.lineWidth = 1.6; g.setLineDash([1, 5]);   // H-BOND: dotted, in the accent
      for (const [h, a] of found.hb) { const p = P[h], q = P[a]; if (!p || !q) continue; g.globalAlpha = opacity * (0.8 - 0.35 * back((p[2] + q[2]) / 2)); g.beginPath(); g.moveTo(p[0], p[1]); g.lineTo(q[0], q[1]); g.stroke(); }
      g.setLineDash([]); g.strokeStyle = ink; g.lineWidth = 2; }
    if (sticks) for (const i of P.map((_, i) => i).filter((i) => P[i]).sort((i, j) => P[j][2] - P[i][2])) {   // far to near: a near bead covers a far one
      const a = atoms[i], p = P[i], R = size * 0.28 * (RCOV[a.Z] || 1.5 * ANGSTROM), e = S.at(a.x + R * rt[0], a.y + R * rt[1], a.z + R * rt[2]); if (!e) continue;
      g.globalAlpha = opacity * (0.9 - 0.4 * back(p[2])); g.fillStyle = CPK[a.Z] || '#ff1493'; g.beginPath(); g.arc(p[0], p[1], Math.hypot(e[0] - p[0], e[1] - p[1]), 0, 2 * Math.PI); g.fill();   // flat: no outline (iteration 011 Q1)
    }
    if (dipole && Math.hypot(dipole[0], dipole[1], dipole[2]) >= 0.01) {
    let Z = 0; const C = [0, 0, 0]; for (const a of atoms) { Z += a.Z; C[0] += a.Z * a.x; C[1] += a.Z * a.y; C[2] += a.Z * a.z; }
    const p = S.at(C[0] / Z, C[1] / Z, C[2] / Z), q = S.at(C[0] / Z + 2 * dipole[0], C[1] / Z + 2 * dipole[1], C[2] / Z + 2 * dipole[2]); if (p && q) {
    const L = Math.hypot(q[0] - p[0], q[1] - p[1]) || 1, ux = (q[0] - p[0]) / L, uy = (q[1] - p[1]) / L, bx = q[0] - 6 * ux, by = q[1] - 6 * uy;
    g.globalAlpha = 0.95; g.strokeStyle = g.fillStyle = acc; g.lineWidth = 2; g.lineCap = 'butt'; g.beginPath(); g.moveTo(p[0], p[1]); g.lineTo(bx, by); g.stroke();
    g.beginPath(); g.moveTo(q[0], q[1]); g.lineTo(bx - 3.5 * uy, by + 3.5 * ux); g.lineTo(bx + 3.5 * uy, by - 3.5 * ux); g.closePath(); g.fill(); } }
    if (!bead) return; const B = trail.map((r) => S.at(r[0], r[1], r[2])).filter(Boolean), b = S.at(bead.r[0], bead.r[1], bead.r[2]); g.strokeStyle = g.fillStyle = acc; g.lineWidth = 1.5; g.lineCap = 'round';   // THE BEAD, after the skeleton
    for (let i = 1; i < B.length; i++) { g.globalAlpha = 0.85 * i / B.length; g.beginPath(); g.moveTo(B[i - 1][0], B[i - 1][1]); g.lineTo(B[i][0], B[i][1]); g.stroke(); }
    if (b) { g.globalAlpha = b[2] > zc ? 0.8 : 1; g.beginPath(); g.arc(b[0], b[1], 6, 0, 2 * Math.PI); g.fill(); g.strokeStyle = ink; g.lineWidth = 1; g.stroke(); }
    const E = b && bead.ell; if (!E) return; const L = E.lam.map((l) => Math.sqrt(Math.max(0, l))), at = (j, k, f) => S.at(...[0, 1, 2].map((q) => bead.r[q] + L[j] * Math.cos(f) * E.axes[j][q] + L[k] * Math.sin(f) * E.axes[k][q]));   // 0.8.3 B3 THE ELLIPSOID: its three principal circles, √λ_k about the bead
    g.strokeStyle = acc; g.lineWidth = 1.25; for (const far of [true, false]) { g.globalAlpha = far ? 0.22 : 0.9; g.beginPath(); for (const [j, k] of [[0, 1], [0, 2], [1, 2]]) for (let i = 0, q = at(j, k, 0); i < 64; i++) { const p = at(j, k, (i + 1) * Math.PI / 32); if (p && q && (p[2] + q[2]) / 2 > b[2] === far) { g.moveTo(q[0], q[1]); g.lineTo(p[0], p[1]); } q = p; } g.stroke(); }   // the far half dimmed, as angular-nodes.js dims
  }
  return { draw, clear };
}
