/* tests/export3d.test.mjs — the node proof of THE SHAPE AND THE GRID (wave 134, lab/export3d.js).
 *   node tests/export3d.test.mjs
 * Marching cubes is judged on an ANALYTIC sphere (ρ = e^{−r²}, the ISO at r = 1): its area against 4π, its closure
 * (every edge in exactly two triangles), its normals (unit, outward) and its determinism.  Every file is then read
 * back by a reader written here, independently of the writer: the GLB's header, chunks, accessors and camera; the
 * OBJ's counts and indices; the STL's size and count; the NPZ's ZIP headers, .npy headers and bytes; the cube's
 * header, atoms, value count and spacing.  Last, the worker op end to end from half-float texels, as the field
 * hands them over.  What needs a GPU (the readback, the menu, the frame loop) is tests/export3d.browser-test.mjs. */
import assert from 'node:assert/strict';
import { marchingCubes, MC_CASES, phaseRGB, decodeGrid, glb, obj, stl, npz, cube, buildFile, quatOfBasis, EXPORTS, ascii } from '../lab/export3d.js';

const pass = (s) => console.log('PASS ' + s);

/* ── a grid of the lab's shape: voxel centres over [−half, half]³, index x + N·y + N²·z ── */
function grid(N, half, f) {
  const re = new Float32Array(N ** 3), im = new Float32Array(N ** 3);
  for (let k = 0; k < N; k++) for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const c = (q) => (q + 0.5) / N * 2 * half - half, [a, b] = f(c(i), c(j), c(k));
    re[i + N * j + N * N * k] = a; im[i + N * j + N * N * k] = b;
  }
  return { re, im };
}
/** float → IEEE half, round to nearest (the texel format the field writes) */
function toHalf(x) {
  const F = new Float32Array([x]), b = new Uint32Array(F.buffer)[0], s = (b >>> 16) & 0x8000, e = ((b >>> 23) & 0xff) - 112, m = b & 0x7fffff;
  if (e >= 31) return s | 0x7c00;
  if (e <= 0) return e < -10 ? s : s | (((m | 0x800000) >> (1 - e)) + 0x1000 >> 13);
  return s | ((e << 10) + ((m + 0x1000) >> 13));
}
const texelsOf = ({ re, im }) => { const T = new Uint16Array(4 * re.length); for (let v = 0; v < re.length; v++) { T[4 * v] = toHalf(re[v]); T[4 * v + 1] = toHalf(im[v]); } return T; };

/* ── 1 · the case table is the classic one: 256 cases, and every edge a case cuts has exactly one corner below the ISO ── */
{
  assert.equal(MC_CASES, 256);
  const CORNER_OF_EDGE = [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]];
  /* read the table back out of a one-cell grid: set the case's corners below the ISO, march, and see which edges carry a vertex */
  const CORNER = [[0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0], [0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]];
  let tris = 0;
  for (let c = 1; c < 255; c++) {
    const re = new Float32Array(8), im = new Float32Array(8);
    CORNER.forEach(([x, y, z], q) => { re[x + 2 * y + 4 * z] = (c >> q) & 1 ? 0.5 : 1.5; });
    const m = marchingCubes({ re, im, N: 2, half: 1, iso: 1 });
    tris += m.indices.length / 3;
    for (let v = 0; v < m.positions.length; v += 3) {                         // each vertex is the midpoint of a cut edge (ρ 0.25 ↔ 2.25, iso 1: t = 0.375)
      const p = [m.positions[v], m.positions[v + 1], m.positions[v + 2]].map((u) => u + 0.5);   // corner coordinates 0 or 1
      const e = CORNER_OF_EDGE.findIndex(([a, b]) => [0, 1, 2].every((ax) => Math.abs(p[ax] - (CORNER[a][ax] + CORNER[b][ax]) / 2) <= 0.5 * Math.abs(CORNER[a][ax] - CORNER[b][ax]) + 1e-9 && (CORNER[a][ax] === CORNER[b][ax] ? Math.abs(p[ax] - CORNER[a][ax]) < 1e-9 : true)));
      assert.ok(e >= 0, `case ${c}: a vertex off every edge`);
      const [a, b] = CORNER_OF_EDGE[e];
      assert.equal(((c >> a) & 1) ^ ((c >> b) & 1), 1, `case ${c}: edge ${e} is cut but its corners agree`);
    }
  }
  pass(`the case table: 256 cases, ${tris} triangles over the 254 mixed ones, and every vertex sits on an edge whose two corners straddle the ISO`);
}

/* ── 2 · the analytic sphere ── */
const N = 48, HALF = 2, sphere = grid(N, HALF, (x, y, z) => [Math.exp(-(x * x + y * y + z * z) / 2), 0]);   // ψ = e^{−r²/2}: ρ = e^{−r²}
const ISO = Math.exp(-1);
const mesh = marchingCubes({ re: sphere.re, im: sphere.im, N, half: HALF, iso: ISO, colour: {} });
const nv = mesh.positions.length / 3, nt = mesh.indices.length / 3;
{
  const P = mesh.positions, I = mesh.indices, NM = mesh.normals, edges = new Map();
  let area = 0, worstUnit = 0, worstOut = Infinity, faceOut = Infinity;
  for (let t = 0; t < I.length; t += 3) {
    const [a, b, c] = [I[t], I[t + 1], I[t + 2]];
    for (const [u, v] of [[a, b], [b, c], [c, a]]) { const k = Math.min(u, v) * 1e7 + Math.max(u, v); edges.set(k, (edges.get(k) || 0) + 1); }
    const u = [0, 1, 2].map((q) => P[3 * b + q] - P[3 * a + q]), w = [0, 1, 2].map((q) => P[3 * c + q] - P[3 * a + q]);
    const cr = [u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0]];
    area += Math.hypot(...cr) / 2;
    const ctr = [0, 1, 2].map((q) => (P[3 * a + q] + P[3 * b + q] + P[3 * c + q]) / 3);
    faceOut = Math.min(faceOut, (cr[0] * ctr[0] + cr[1] * ctr[1] + cr[2] * ctr[2]) / Math.hypot(...cr) / Math.hypot(...ctr));
  }
  for (let v = 0; v < nv; v++) {
    const n = [NM[3 * v], NM[3 * v + 1], NM[3 * v + 2]], r = [P[3 * v], P[3 * v + 1], P[3 * v + 2]];
    worstUnit = Math.max(worstUnit, Math.abs(Math.hypot(...n) - 1));
    worstOut = Math.min(worstOut, (n[0] * r[0] + n[1] * r[1] + n[2] * r[2]) / Math.hypot(...r));
  }
  const open = [...edges.values()].filter((k) => k !== 2).length;
  assert.ok(Math.abs(area / (4 * Math.PI) - 1) < 0.02, `area ${area} against 4π`);
  assert.equal(open, 0, 'every edge in exactly two triangles');
  assert.ok(worstUnit < 1e-6, 'unit normals'); assert.ok(worstOut > 0.99, 'outward normals, n · r̂ = ' + worstOut); assert.ok(faceOut > 0.9, 'the winding puts face normals outward');
  const again = marchingCubes({ re: sphere.re, im: sphere.im, N, half: HALF, iso: ISO, colour: {} });
  assert.equal(again.positions.length, mesh.positions.length); assert.deepEqual(again.indices, mesh.indices); assert.deepEqual(again.positions, mesh.positions);
  pass(`the sphere at N = ${N}: area ${area.toFixed(4)} = ${(area / (4 * Math.PI)).toFixed(5)} × 4π, ${nt} triangles on ${nv} shared vertices, ${edges.size} edges each in exactly two triangles, normals unit to ${worstUnit.toExponential(1)} and outward (min n · r̂ = ${worstOut.toFixed(4)}, face normals too, ${faceOut.toFixed(3)}), and a second march gives the same bytes`);
}

/* ── 3 · the colour is the phase view's lookup ── */
{
  const lut = new Float32Array(1024); for (let i = 0; i < 256; i++) { lut[4 * i] = i / 255; lut[4 * i + 1] = 1 - i / 255; lut[4 * i + 2] = 0.5; lut[4 * i + 3] = 1; }
  const o = new Float32Array(3);
  phaseRGB(1, 0, { lut, on: true }, o, 0); assert.deepEqual([...o], [...lut.slice(512, 515)]);                 // arg 0 → h = ½ → index 128, no blend
  phaseRGB(-1, -1e-12, { lut, on: true }, o, 0); assert.ok(Math.abs(o[0] - lut[0]) < 1e-6);                    // arg → −π: index 0
  phaseRGB(0, 1, { lut, on: true, hue: 0.25 }, o, 0); assert.deepEqual([...o], [...lut.slice(0, 3)]);          // arg π/2 and a quarter turn of HUE: h = 1 wraps to index 0
  phaseRGB(-1, 0, {}, o, 0); assert.deepEqual([...o].map((x) => +x.toFixed(6)), [1, 0.15, 0.15]);               // the wheel at h = 0: hsv(0, 0.85, 1)
  phaseRGB(-1, 0, { invert: true }, o, 0); assert.deepEqual([...o].map((x) => +x.toFixed(6)), [0, 0.85, 0.85]);
  phaseRGB(0, 0, { lut, on: true }, o, 0); assert.deepEqual([...o], [...lut.slice(512, 515)]);                 // a zero amplitude has phase 0, as on the GPU
  pass('the colour: arg ψ = 0 reads LUT[128] exactly, −π reads LUT[0], HUE turns the wheel, the built-in wheel is hsv(h, 0.85, 1), INVERT is 1 − c, and zero amplitude is phase 0');
}

/* ── 4 · GLB, read back ── */
const camera = { position: [5, 0, 1], right: [0, 1, 0], up: [-0.196116, 0, 0.980581], dir: [0.980581, 0, 0.196116], yfov: 0.6, aspect: 1.5, znear: 0.05, zfar: 100 * HALF };
function readGLB(bytes) {
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const magic = dv.getUint32(0, true), version = dv.getUint32(4, true), total = dv.getUint32(8, true);
  const jl = dv.getUint32(12, true), jt = dv.getUint32(16, true), json = JSON.parse(new TextDecoder().decode(bytes.subarray(20, 20 + jl)));
  const bl = dv.getUint32(20 + jl, true), bt = dv.getUint32(24 + jl, true), bin = bytes.subarray(28 + jl, 28 + jl + bl);
  const acc = (i) => { const a = json.accessors[i], v = json.bufferViews[a.bufferView], C = a.componentType === 5126 ? Float32Array : Uint32Array, per = { VEC3: 3, SCALAR: 1 }[a.type];
    return new C(bin.slice(v.byteOffset, v.byteOffset + a.count * per * 4).buffer); };
  return { magic, version, total, jl, jt, bl, bt, json, acc };
}
{
  const bytes = glb(mesh, { name: 'λWAVES · test', camera }), G = readGLB(bytes), J = G.json;
  assert.equal(G.magic, 0x46546c67); assert.equal(new TextDecoder().decode(bytes.subarray(0, 4)), 'glTF'); assert.equal(G.version, 2); assert.equal(G.total, bytes.byteLength);
  assert.equal(G.jt, 0x4e4f534a); assert.equal(G.bt, 0x004e4942); assert.equal(G.jl % 4, 0); assert.equal(G.bl % 4, 0);
  assert.equal(J.asset.version, '2.0'); assert.equal(J.scenes[0].name, 'λWAVES · test');
  const prim = J.meshes[0].primitives[0];
  assert.deepEqual(prim.attributes, { POSITION: 0, NORMAL: 1, COLOR_0: 2 }); assert.equal(prim.indices, 3); assert.equal(prim.mode, 4);
  assert.deepEqual(J.accessors.map((a) => a.count), [nv, nv, nv, 3 * nt]);
  assert.deepEqual(J.accessors.map((a) => [a.componentType, a.type]), [[5126, 'VEC3'], [5126, 'VEC3'], [5126, 'VEC3'], [5125, 'SCALAR']]);
  for (const v of J.bufferViews) assert.equal(v.byteOffset % 4, 0);
  const P = G.acc(0), lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
  for (let v = 0; v < P.length; v += 3) for (let a = 0; a < 3; a++) { lo[a] = Math.min(lo[a], P[v + a]); hi[a] = Math.max(hi[a], P[v + a]); }
  assert.deepEqual(J.accessors[0].min, lo); assert.deepEqual(J.accessors[0].max, hi);
  assert.deepEqual([P[0], P[1], P[2]], [mesh.positions[0], mesh.positions[2], -mesh.positions[1] + 0].map((x) => Math.fround(x)));   // Y up: (x, z, −y)
  assert.deepEqual([...G.acc(3)], [...mesh.indices]);
  const C = G.acc(2); assert.ok(C.every((c) => c >= 0 && c <= 1));
  const cam = J.cameras[0], node = J.nodes.find((n) => n.camera === 0);
  assert.equal(cam.type, 'perspective'); assert.equal(cam.perspective.yfov, 0.6); assert.equal(cam.perspective.aspectRatio, 1.5); assert.equal(cam.perspective.znear, 0.05); assert.equal(cam.perspective.zfar, 200);
  assert.deepEqual(node.translation, [5, 1, 0]);
  /* the rotation carries the camera's own −Z onto the lab's forward (−dir) and its +Y onto up, both in Y-up axes */
  const [x, y, z, w] = node.rotation, rot = (v) => { const t = [2 * (y * v[2] - z * v[1]), 2 * (z * v[0] - x * v[2]), 2 * (x * v[1] - y * v[0])];
    return [v[0] + w * t[0] + (y * t[2] - z * t[1]), v[1] + w * t[1] + (z * t[0] - x * t[2]), v[2] + w * t[2] + (x * t[1] - y * t[0])]; };
  const fwd = rot([0, 0, -1]), up = rot([0, 1, 0]), yUp = (v) => [v[0], v[2], -v[1]];
  const near = (a, b) => a.every((q, i) => Math.abs(q - b[i]) < 1e-5);
  assert.ok(near(fwd, yUp(camera.dir.map((d) => -d))), 'the camera looks along −dir'); assert.ok(near(up, yUp(camera.up)), 'and its up is the observer\'s');
  assert.ok(near(quatOfBasis([1, 0, 0], [0, 1, 0], [0, 0, 1]), [0, 0, 0, 1]));
  pass(`GLB: magic glTF, version 2, length ${bytes.byteLength} = the header's, JSON and BIN chunks 4-aligned, accessors ${J.accessors.map((a) => a.count).join('/')} = the mesh's, POSITION min/max = the measured bounds, Y up, colours linear in 0–1, and the observer camera (yfov 0.6, aspect 1.5, near 0.05, far 100·half) looking along −dir with its up`);
}

/* ── 5 · OBJ and STL, read back ── */
{
  const text = new TextDecoder().decode(obj(mesh, { head: ['lambdawaves 0.3.3-test', '1s₊0 · the density'] })), lines = text.split('\n');
  const V = lines.filter((l) => l.startsWith('v ')), VN = lines.filter((l) => l.startsWith('vn ')), F = lines.filter((l) => l.startsWith('f '));
  assert.equal(V.length, nv); assert.equal(VN.length, nv); assert.equal(F.length, nt);
  assert.ok(V.every((l) => l.split(' ').length === 7), 'v x y z r g b');
  for (const f of F) for (const tok of f.split(' ').slice(1)) { const [a, , b] = tok.split('/'); assert.equal(a, b); assert.ok(+a >= 1 && +a <= nv); }
  assert.ok(lines.slice(0, 2).every((l) => l.startsWith('# ')) && /1s\+0 - the density/.test(text) && /^[\x00-\x7f]*$/.test(text), 'an ASCII header');
  const s = stl(mesh, { header: 'lambdawaves 1s₊0' }), dv = new DataView(s.buffer);
  assert.equal(s.byteLength, 84 + 50 * nt); assert.equal(dv.getUint32(80, true), nt);
  assert.ok(!new TextDecoder().decode(s.subarray(0, 5)).startsWith('solid'));
  const n0 = [0, 1, 2].map((k) => dv.getFloat32(84 + 4 * k, true)); assert.ok(Math.abs(Math.hypot(...n0) - 1) < 1e-6);
  assert.equal(dv.getFloat32(84 + 12, true), mesh.positions[3 * mesh.indices[0]]);
  pass(`OBJ: ${nv} v (x y z r g b) and ${nv} vn and ${nt} f, every index 1…${nv}, an ASCII header; STL: 84 + 50·${nt} = ${s.byteLength} bytes, the header's count, unit face normals, not "solid"`);
}

/* ── 6 · NPZ, read back through its own ZIP headers ── */
function unzip(z) {
  const dv = new DataView(z.buffer, z.byteOffset, z.byteLength), out = {}; let p = 0;
  while (dv.getUint32(p, true) === 0x04034b50) {
    const method = dv.getUint16(p + 8, true), size = dv.getUint32(p + 18, true), nl = dv.getUint16(p + 26, true), xl = dv.getUint16(p + 28, true);
    const name = new TextDecoder().decode(z.subarray(p + 30, p + 30 + nl)); assert.equal(method, 0);
    out[name] = z.subarray(p + 30 + nl + xl, p + 30 + nl + xl + size); p += 30 + nl + xl + size;
  }
  return out;
}
function readNpy(b) {
  assert.deepEqual([...b.subarray(0, 6)], [0x93, 0x4e, 0x55, 0x4d, 0x50, 0x59]);
  const hl = b[8] | (b[9] << 8), head = new TextDecoder().decode(b.subarray(10, 10 + hl));
  assert.equal((10 + hl) % 64, 0); assert.ok(head.endsWith('\n'));
  return { head, data: b.slice(10 + hl) };
}
{
  const n = 12, half = 3, g = grid(n, half, (x, y, z) => [x + 0.1 * y, z - 0.2 * x]);
  const f = unzip(npz({ re: g.re, im: g.im, N: n, half, space: 'r', t: 1.5, label: '1s₊0', build: 'test' }));
  assert.deepEqual(Object.keys(f), ['psi.npy', 'axis.npy', 'meta.json']);
  const psi = readNpy(f['psi.npy']), axis = readNpy(f['axis.npy']), meta = JSON.parse(new TextDecoder().decode(f['meta.json']));
  assert.match(psi.head, /'descr': '<c8'/); assert.match(psi.head, /'fortran_order': False/); assert.match(psi.head, new RegExp(`'shape': \\(${n}, ${n}, ${n}\\)`));
  assert.match(axis.head, /'descr': '<f4'/); assert.match(axis.head, new RegExp(`'shape': \\(${n},\\)`));
  const C = new Float32Array(psi.data.buffer), A = new Float32Array(axis.data.buffer);
  assert.equal(C.length, 2 * n ** 3);
  let worst = 0;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) for (let k = 0; k < n; k++) {
    const o = 2 * ((i * n + j) * n + k), s = i + n * j + n * n * k;
    worst = Math.max(worst, Math.abs(C[o] - g.re[s]), Math.abs(C[o + 1] - g.im[s]));
    assert.ok(Math.abs(C[o] - (A[i] + 0.1 * A[j])) < 1e-5 && Math.abs(C[o + 1] - (A[k] - 0.2 * A[i])) < 1e-5, 'psi[i, j, k] = ψ(x_i, y_j, z_k)');
  }
  assert.equal(worst, 0); assert.ok(Math.abs(A[0] - (-half + half / n)) < 1e-6 && Math.abs(A[n - 1] - (half - half / n)) < 1e-6);
  assert.equal(meta.N, n); assert.equal(meta.half, half); assert.equal(meta.space, 'r'); assert.equal(meta.t, 1.5); assert.equal(meta.units, 'bohr'); assert.equal(meta.label, '1s₊0');
  const p = JSON.parse(new TextDecoder().decode(unzip(npz({ re: g.re, im: g.im, N: n, half, space: 'p' }))['meta.json']));
  assert.equal(p.space, 'p'); assert.match(p.units, /hbar\/bohr/);
  pass(`NPZ: the stored ZIP's local headers name psi.npy, axis.npy, meta.json; psi.npy is <c8 (${n}, ${n}, ${n}) with psi[i, j, k] = ψ(x_i, y_j, z_k), bytes round-trip exactly; axis.npy <f4 (${n},) the voxel centres; meta.json carries N, half, space ('r' and 'p'), units, t`);
}

/* ── 7 · CUBE, read back ── */
{
  const n = 10, half = 2.5, g = grid(n, half, (x, y, z) => [Math.exp(-(x * x + y * y + z * z)), 0.3 * x]);
  const atoms = [{ Z: 8, x: 0, y: 0, z: 0.22 }, { Z: 1, x: 0, y: 1.43, z: -0.89 }, { Z: 1, x: 0, y: -1.43, z: -0.89 }];
  const text = new TextDecoder().decode(cube({ re: g.re, im: g.im, N: n, half, atoms, label: 'H2O', build: '0.3.3 · test' })), L = text.split('\n');
  assert.equal(L[0], 'H2O'); assert.match(L[1], /^density \|psi\|\^2 in bohr\^-3, lambdawaves 0\.3\.3 - test$/);
  const head = L[2].trim().split(/\s+/).map(Number), h = 2 * half / n;
  assert.equal(head[0], 3); assert.ok(head.slice(1).every((v) => Math.abs(v - (h / 2 - half)) < 1e-6));
  for (let a = 0; a < 3; a++) { const r = L[3 + a].trim().split(/\s+/).map(Number); assert.equal(r[0], n); assert.ok(r.slice(1).every((v, i) => Math.abs(v - (i === a ? h : 0)) < 1e-6)); }
  assert.equal(L[3].slice(5, 17), h.toFixed(6).padStart(12));
  atoms.forEach((a, q) => { const r = L[6 + q].trim().split(/\s+/).map(Number); assert.deepEqual([r[0], r[1]], [a.Z, a.Z]); assert.ok(Math.abs(r[2] - a.x) < 1e-6 && Math.abs(r[3] - a.y) < 1e-6 && Math.abs(r[4] - a.z) < 1e-6); });
  const vals = L.slice(9).join(' ').trim().split(/\s+/).map(Number);
  assert.equal(vals.length, n ** 3);
  const rows = L.slice(9).filter((l) => l.length); assert.ok(rows.every((l) => l.split(/\s+/).filter(Boolean).length <= 6));
  assert.ok(rows.every((l) => l.length % 13 === 0), 'every value %13.5E');
  let worst = 0;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) for (let k = 0; k < n; k++) { const s = i + n * j + n * n * k, rho = g.re[s] ** 2 + g.im[s] ** 2; worst = Math.max(worst, Math.abs(vals[(i * n + j) * n + k] - rho) / rho); }
  assert.ok(worst < 6e-6, 'x outer, z inner, 6 significant digits: ' + worst);
  pass(`CUBE: two comment lines, ${atoms.length} atoms at the first voxel centre, three axis lines with N = ${n} and the spacing 2·half/N = ${h} bohr, the atom block (Z, charge, position), exactly N³ = ${n ** 3} values at %13.5E, x outer and z inner, six to a line`);
}

/* ── 8 · the worker op end to end, from the field's own texels ── */
{
  const tex = texelsOf(sphere), d = decodeGrid(tex, N);
  let worst = 0; for (let v = 0; v < d.re.length; v++) worst = Math.max(worst, Math.abs(d.re[v] - sphere.re[v]) / Math.max(1e-4, Math.abs(sphere.re[v])));
  assert.ok(worst < 1e-3, 'the half-float decode: ' + worst); assert.equal(d.nan, 0);
  const bad = new Uint16Array(tex); bad[4 * 7] = 0x7e00; assert.equal(decodeGrid(bad, N).nan, 1);
  let rhoMax = 0; for (let v = 0; v < sphere.re.length; v++) rhoMax = Math.max(rhoMax, sphere.re[v] ** 2);
  const base = { texels: tex, N, half: HALF, rhoMax, isoFrac: ISO / rhoMax, label: '1s₊0', build: 'test', space: 'r', t: 0, atoms: [{ Z: 1, x: 0, y: 0, z: 0 }],
    colour: { on: false }, camera: { dir: [1, 0, 0], right: [0, 1, 0], up: [0, 0, 1], dist: 3.3, yfov: 0.6, aspect: 1.6 } };
  const out = Object.fromEntries(EXPORTS.map((e) => [e.fmt, buildFile({ ...base, fmt: e.fmt })]));
  for (const [f, r] of Object.entries(out)) assert.ok(!r.error && r.bytes instanceof Uint8Array && r.bytes.byteLength > 0, f + ' ' + r.error);
  const G = readGLB(out.glb.bytes);
  assert.equal(G.json.accessors[3].count / 3, out.glb.triangles); assert.equal(new DataView(out.stl.bytes.buffer).getUint32(80, true), out.glb.triangles);
  assert.ok(Math.abs(out.glb.triangles - nt) / nt < 0.05, 'the f16 grid marches to the f32 one\'s surface');
  assert.deepEqual(G.json.nodes[1].translation, [3.3 * HALF, 0, 0]);
  assert.equal(out.obj.triangles, out.glb.triangles);
  assert.equal(new TextDecoder().decode(out.cube.bytes).split('\n').slice(7).join(' ').trim().split(/\s+/).length, N ** 3);
  assert.ok(buildFile({ ...base, fmt: 'glb', rhoMax: 0 }).error); assert.ok(buildFile({ ...base, fmt: 'glb', isoFrac: 2 }).error); assert.ok(buildFile({ ...base, fmt: 'x' }).error);
  assert.equal(ascii('0.3.2-alpha · the offer'), '0.3.2-alpha - the offer'); assert.equal(ascii('2p₋1 + 3d₊2'), '2p-1 + 3d+2');
  pass(`the worker op from half-float texels: all five files (${EXPORTS.map((e) => e.fmt + ' ' + out[e.fmt].bytes.byteLength).join(', ')} bytes), the GLB's and the STL's triangle counts agree (${out.glb.triangles}), the camera sits at dist·half, and an empty field, an ISO above the peak and an unknown format are refused`);
}
console.log('GREEN export3d.test');
