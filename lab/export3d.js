/* export3d.js — THE SHAPE AND THE GRID (wave 134, 0.3.3).  FILE › EXPORT SHAPE writes the density isosurface on screen
 * as GLB, OBJ or STL; FILE › EXPORT GRID writes the field's own N³ grid as a NumPy NPZ (ψ, complex64) or a Gaussian
 * cube (|ψ|², bohr).  What opens each file, and every convention below, is docs/EXPORT.md.
 *
 * THE LAW: WHAT IS ON SCREEN, BY THE ROAD IT CAME.  Nothing is recomputed.  The grid is the field's own rgba16float
 * cache (.r = Re ψ, .g = Im ψ), read back once through the diagnostic road (field.js readGrid, never the frame path);
 * the ISO is the shader's — mat.iso, a fraction of ρmax, where ρmax is stats[0], the very number the presenter divides
 * by; the colour is the phase view's lookup (RENDER_WGSL mode 1) into the 256-colour LUT the GPU holds, before the
 * gamut map, with HUE and INVERT; the camera is writeView's pose.  1 unit = 1 bohr (1 ħ/bohr on a momentum grid, and
 * the files say so).  The work — decode, march, write — is ONE maths-worker op (mathworker.js `export`), so a 128³
 * cube's two million formatted numbers never sit on the frame thread: the page reads, posts, and downloads through
 * capture.js's save().  The stored ZIP is render-exact.js's (EXPORT FRAMES'), not a copy.
 *
 * STATUS: EXACT file formats (proved by tests/export3d.test.mjs in node: an analytic sphere, every byte layout read
 * back); the surface is NUMERICAL — marching cubes on the grid, so a shape is exact up to the grid spacing. */
import { zipStored } from './render-exact.js';
import { slug, stamp, uniqueName } from './capture.js';

/** the five FILE rows (R6: no dialog; each row is one file and its tooltip names what opens it) */
export const EXPORTS = Object.freeze([
  { fmt: 'glb', kind: 'shape', mime: 'model/gltf-binary', row: 'EXPORT SHAPE · GLB', tip: 'the density isosurface on screen, phase as vertex colour, the camera included — Blender and Cinema 4D: File › Import › glTF' },
  { fmt: 'obj', kind: 'shape', mime: 'model/obj', row: 'EXPORT SHAPE · OBJ', tip: 'the same surface as Wavefront OBJ — opens everywhere; vertex colours where the importer reads them' },
  { fmt: 'stl', kind: 'shape', mime: 'model/stl', row: 'EXPORT SHAPE · STL', tip: 'the same surface for printing or any tool' },
  { fmt: 'npz', kind: 'grid', mime: 'application/zip', row: 'EXPORT GRID · NPZ', tip: "ψ on the grid for NumPy: np.load(file)['psi'], complex64, with the axis and a meta.json" },
  { fmt: 'cube', kind: 'grid', mime: 'chemical/x-cube', row: 'EXPORT GRID · CUBE', tip: 'the density as a Gaussian cube in bohr — Avogadro, VMD, VESTA, Blender add-ons' },
]);
export const NO_FIELD = 'needs the FIELD (WebGPU)';

/* ── THE GRID ─────────────────────────────────────────────────────────────────────────────────────────────── */
let F16 = null;
/** every half-float, decoded once (the inverse of the texel format); ±∞ and NaN decode as NaN */
function f16Table() {
  if (F16) return F16;
  F16 = new Float32Array(65536);
  for (let u = 0; u < 65536; u++) {
    const s = u & 0x8000 ? -1 : 1, e = (u >> 10) & 31, f = u & 1023;
    F16[u] = e === 0 ? s * f * 2 ** -24 : e === 31 ? NaN : s * (1 + f / 1024) * 2 ** (e - 15);
  }
  return F16;
}
/** the field's texels (four halves each: Re ψ, Im ψ, 0, 0) → { re, im } at index x + N·y + N²·z, the order the
 *  kernel stores (gid.x is world x).  A texel that is not finite reads 0 and is counted, as the presenter shows none. */
export function decodeGrid(texels, N) {
  const T = f16Table(), n3 = N * N * N, re = new Float32Array(n3), im = new Float32Array(n3);
  let nan = 0;
  for (let v = 0; v < n3; v++) {
    let a = T[texels[4 * v]], b = T[texels[4 * v + 1]];
    if (a !== a || b !== b) { a = 0; b = 0; nan++; }
    re[v] = a; im[v] = b;
  }
  return { re, im, nan };
}

/* ── THE COLOUR: the phase view's own lookup ──────────────────────────────────────────────────────────────── */
/** arg ψ → sRGB 0–1 at out[o..o+2], exactly RENDER_WGSL's mode 1: h = arg/2π + ½ + HUE; the palette LUT (arg = −π at
 *  index 0) linearly interpolated and wrapping, else the built-in wheel hsv(h, 0.85, 1); INVERT last.  A zero
 *  amplitude has phase 0, as on the GPU.  C = { lut: Float32Array(1024), hue, invert, on }. */
export function phaseRGB(re, im, C, out, o) {
  let h = (re * re + im * im > 1e-30 ? Math.atan2(im, re) : 0) / (2 * Math.PI) + 0.5 + (C.hue || 0);
  h -= Math.floor(h);
  let r, g, b;
  if (C.on && C.lut) {
    const L = C.lut, u = h * 256, i0 = Math.floor(u) % 256, i1 = (i0 + 1) % 256, f = u - Math.floor(u);
    r = L[4 * i0] + (L[4 * i1] - L[4 * i0]) * f; g = L[4 * i0 + 1] + (L[4 * i1 + 1] - L[4 * i0 + 1]) * f; b = L[4 * i0 + 2] + (L[4 * i1 + 2] - L[4 * i0 + 2]) * f;
  } else {
    const ch = (k) => { let m = (h * 6 + k) / 6; m = (m - Math.floor(m)) * 6; return 1 - 0.85 * (1 - Math.min(1, Math.max(0, Math.abs(m - 3) - 1))); };
    r = ch(0); g = ch(4); b = ch(2);
  }
  if (C.invert) { r = 1 - r; g = 1 - g; b = 1 - b; }
  out[o] = r; out[o + 1] = g; out[o + 2] = b;
}

/* ── MARCHING CUBES ───────────────────────────────────────────────────────────────────────────────────────────
 * The classic case table (Lorensen & Cline 1987, as tabulated by Cory Gene Bloyd on Paul Bourke's page — public domain,
 * the table three.js ships), one string per case: hex edge indices, three per triangle.  Corners and edges are Bourke's:
 * corner q has bit q of the case set when its density is BELOW the ISO, and the table's winding then puts every face
 * normal toward the low side — outward for a density, so no triangle is ever flipped. */
const TRI = [
  ' 083 019 183981 12a 08312a 92a029 2832a8a98 3b2 0b28b0 19023b 1b219b98b 3a1ba3 0a108a8ba 3903b9ba9 98aa8b',
  '478 430734 019847 419471731 12a847 34730412a 92a902847 2a9297273794 8473b2 b47b24204 90184723b 47b94b9b2921 3a13ba784 1ba14b1047b4 47890b9bab03 47b4b99ba',
  '954 954083 054150 854835315 12a954 30812a495 52a542402 2a5325354348 95423b 0b208b495 05401523b 21525828b485 a3ba13954 4950818a18ba 54050b5bab03 54858aa8b',
  '978579 930953573 078017157 153357 978957a12 a12950530573 802825857a52 2a5253357 7957893b2 95797292027b 23b018178157 b21b17715 958857a13a3b 5705097b010aba0 ba0b03a50807570 ba57b5',
  'a65 0835a6 9015a6 1831985a6 165261 165126308 965906026 598582526328 23ba65 b08b20a65 01923b5a6 5a61929b298b 63b653513 08b0b50515b6 3b6036065059 65969bb98',
  '5a6478 43047365a 1905a6847 a65197173794 612651478 125526304347 847905065026 739794329596269 3b2784a65 5a647242027b 01947823b5a6 9219b294b7b45a6 8473b53515b6 51b5b610b7b404b 059065036b63847 65969b4797b9',
  'a4964a 4a649a083 a01a60640 83181686461a 149124264 308129249264 024426 832824426 a49a64b23 08228b49a4a6 3b201606461a 64161a48121b8b1 964936913b63 8b1810b61914641 3b6360064 648b68',
  '7a678a89a 0730a709a67a a671a7178180 a67a71173 126168189867 269291679093739 780706602 732672 23ba68a89867 20727b09767a9a7 1801781a767a23b b21b17a61671 896867916b63136 091b67 7807063b0b60 7b6',
  '76b 308b76 019b76 819831b76 a126b7 12a3086b7 2902a96b7 6b72a3a83a98 723627 708760620 276237019 162186198876 a76a17137 a7617a187108 03707a0a96a7 76a7a88a9',
  '684b86 36b306046 86b846901 946963931b36 6846b82a1 12a30b06b046 4b846b0292a9 a93a32943b36463 823842462 042462 190234246438 194142246 8138618466a1 a10a06604 4634386a3039a93 a946a4',
  '49576b 083495b76 50154076b b76834354315 954a1276b 6b712a083495 76b54a42a402 348354325a52b76 723762549 954086062687 362376150540 628687218485158 954a16176137 16a176107870954 40a4a503a6a737a 76a7a854a48a',
  '6956b9b89 36b063056095 0b805b01556b 6b3635531 12a95b9b8b56 0b306b09656912a b85b56805a52025 6b36352a3a53 589528562382 956960062 158180568382628 156216 13616a386569896 a10a06950560 03856a a56',
  'b5a75b b5ab75830 5b75ab190 a75ab7981831 b12b71751 08312717572b 9759279022b7 75272b592328982 25a235375 820852875a25 9015a35373a2 982921872a25752 135375 087071175 903935537 987597',
  '5845a8ab8 5045b05abb30 01984a8aba45 ab4a45b34941314 2512852b8458 04b0b345b2b151b 0250592b5458b85 9452b3 25a352345384 5a2524420 3a235a385458019 5a2524192942 845853351 045105 845853905035 945',
  '4b749b9ab 0834979b79ab 1ab1b414074b 3143481a474bab4 4b79b492b912 9749b791b2b1083 b74b42240 b74b42834324 29a279237749 9a7974a27870207 37a3a274a1a040a 1a2874 491417713 491417081871 403743 487',
  '9a8ab8 30939bb9a 01a0a88ab 31ab3a 12b1b99b8 30939b1292b9 02b80b 32b 23828aa89 9a2092 23828a0181a8 1a2 138918 091 038 ',
].join(' ').split(' ').map((s) => Int8Array.from(s, (c) => parseInt(c, 16)));
export const MC_CASES = TRI.length;                           // 256: the proof counts it
const CORNER = [[0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0], [0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]];
const EDGE = [[0, 0, 0, 0], [1, 1, 0, 0], [0, 0, 1, 0], [1, 0, 0, 0], [0, 0, 0, 1], [1, 1, 0, 1], [0, 0, 1, 1], [1, 0, 0, 1], [2, 0, 0, 0], [2, 1, 0, 0], [2, 1, 1, 0], [2, 0, 1, 0]];   // [axis, corner offset]: edge e runs from that corner along the axis

/** the density isosurface ρ = re² + im² = iso on the grid: voxel centres over [−half, half]³, index x + N·y + N²·z.
 *  Vertices sit on cell edges by linear interpolation of ρ, SHARED between the cells that meet there (one table per
 *  axis, keyed by the edge's first voxel), so the surface is closed wherever it does not leave the grid; normals are
 *  −∇ρ by central differences, interpolated along the edge and normalised (outward); colours are the phase view's at
 *  the interpolated amplitude; zero-area triangles are dropped.  → { positions, normals, colors (sRGB 0–1), indices } */
export function marchingCubes({ re, im, N, half, iso, colour = {} }) {
  const n = N, n2 = n * n, n3 = n2 * n, h = 2 * half / n, x0 = h / 2 - half, STEP = [1, n, n2];
  const rho = new Float32Array(n3);
  for (let v = 0; v < n3; v++) rho[v] = re[v] * re[v] + im[v] * im[v];
  const E = [new Int32Array(n3).fill(-1), new Int32Array(n3).fill(-1), new Int32Array(n3).fill(-1)];
  const COFF = CORNER.map(([a, b, c]) => a + n * b + n2 * c), EOFF = EDGE.map(([, a, b, c]) => a + n * b + n2 * c), EAX = EDGE.map((e) => e[0]);
  let P = new Float32Array(3 << 12), NM = new Float32Array(3 << 12), CL = new Float32Array(3 << 12), nv = 0;
  let I = new Uint32Array(3 << 13), ni = 0;
  const grad = (v, a) => {                                    // ∂ρ/∂x_a at voxel v; one-sided on the grid's faces
    const c = a === 0 ? v % n : a === 1 ? ((v / n) | 0) % n : (v / n2) | 0, s = STEP[a];
    const lo = c > 0 ? v - s : v, hi = c < n - 1 ? v + s : v;
    return (rho[hi] - rho[lo]) / (((hi - lo) / s) * h);
  };
  const vertex = (v, a) => {
    const id = E[a][v]; if (id >= 0) return id;
    if (3 * nv + 3 > P.length) { const grow = (A) => { const B = new Float32Array(A.length * 2); B.set(A); return B; }; P = grow(P); NM = grow(NM); CL = grow(CL); }
    const w = v + STEP[a], r0 = rho[v], d = rho[w] - r0, t = d !== 0 ? Math.min(1, Math.max(0, (iso - r0) / d)) : 0.5, o = 3 * nv;
    P[o] = x0 + (v % n) * h; P[o + 1] = x0 + (((v / n) | 0) % n) * h; P[o + 2] = x0 + ((v / n2) | 0) * h; P[o + a] += t * h;
    const g0 = grad(v, 0), g1 = grad(v, 1), g2 = grad(v, 2);
    const gx = g0 + (grad(w, 0) - g0) * t, gy = g1 + (grad(w, 1) - g1) * t, gz = g2 + (grad(w, 2) - g2) * t, L = Math.hypot(gx, gy, gz) || 1;
    NM[o] = -gx / L; NM[o + 1] = -gy / L; NM[o + 2] = -gz / L;
    phaseRGB(re[v] + (re[w] - re[v]) * t, im[v] + (im[w] - im[v]) * t, colour, CL, o);
    E[a][v] = nv; return nv++;
  };
  const tiny = 1e-18 * h ** 4;                                // |cross|² of a zero-area triangle (two vertices on one voxel)
  for (let k = 0; k < n - 1; k++) for (let j = 0; j < n - 1; j++) for (let i = 0; i < n - 1; i++) {
    const v = i + n * j + n2 * k;
    let c = 0;
    for (let q = 0; q < 8; q++) if (rho[v + COFF[q]] < iso) c |= 1 << q;
    if (c === 0 || c === 255) continue;
    const T = TRI[c];
    for (let q = 0; q < T.length; q += 3) {
      const A = vertex(v + EOFF[T[q]], EAX[T[q]]), B = vertex(v + EOFF[T[q + 1]], EAX[T[q + 1]]), C = vertex(v + EOFF[T[q + 2]], EAX[T[q + 2]]);
      const ux = P[3 * B] - P[3 * A], uy = P[3 * B + 1] - P[3 * A + 1], uz = P[3 * B + 2] - P[3 * A + 2];
      const wx = P[3 * C] - P[3 * A], wy = P[3 * C + 1] - P[3 * A + 1], wz = P[3 * C + 2] - P[3 * A + 2];
      const cx = uy * wz - uz * wy, cy = uz * wx - ux * wz, cz = ux * wy - uy * wx;
      if (cx * cx + cy * cy + cz * cz <= tiny) continue;
      if (ni + 3 > I.length) { const B2 = new Uint32Array(I.length * 2); B2.set(I); I = B2; }
      I[ni++] = A; I[ni++] = B; I[ni++] = C;
    }
  }
  return { positions: P.slice(0, 3 * nv), normals: NM.slice(0, 3 * nv), colors: CL.slice(0, 3 * nv), indices: I.slice(0, ni), iso, h };
}

/* ── THE WRITERS (pure: a mesh or a grid in, a Uint8Array out) ─────────────────────────────────────────────── */
const enc = (s) => new TextEncoder().encode(s);
/** a header line every old parser reads: ASCII only (₊ → +, · → -, anything else outside ASCII dropped) */
export const ascii = (s) => String(s || '').replace(/·/g, '-').normalize('NFKD').replace(/\u2212/g, '-').replace(/[^\x20-\x7e]/g, '').replace(/\s+/g, ' ').trim();
const toLinear = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
/** a rotation's columns (the camera's right, up and back) → the unit quaternion [x, y, z, w] glTF asks for */
export function quatOfBasis(X, Y, Z) {
  const m00 = X[0], m10 = X[1], m20 = X[2], m01 = Y[0], m11 = Y[1], m21 = Y[2], m02 = Z[0], m12 = Z[1], m22 = Z[2], tr = m00 + m11 + m22;
  let q;
  if (tr > 0) { const s = 2 * Math.sqrt(tr + 1); q = [(m21 - m12) / s, (m02 - m20) / s, (m10 - m01) / s, s / 4]; }
  else if (m00 > m11 && m00 > m22) { const s = 2 * Math.sqrt(1 + m00 - m11 - m22); q = [s / 4, (m01 + m10) / s, (m02 + m20) / s, (m21 - m12) / s]; }
  else if (m11 > m22) { const s = 2 * Math.sqrt(1 + m11 - m00 - m22); q = [(m01 + m10) / s, s / 4, (m12 + m21) / s, (m02 - m20) / s]; }
  else { const s = 2 * Math.sqrt(1 + m22 - m00 - m11); q = [(m02 + m20) / s, (m12 + m21) / s, s / 4, (m10 - m01) / s]; }
  const L = Math.hypot(...q); return q.map((x) => x / L);
}
/* THE AXES.  λWAVES is z-up (z is the quantization axis).  glTF is Y-up by specification and Blender's and Cinema 4D's
   OBJ importers assume Y-up, so GLB and OBJ carry (x, z, −y) — a proper rotation, which every such importer turns back
   into z-up.  STL (printing, z-up by custom), the NPZ and the cube keep the lab's own axes. */
const yUp = (x, y, z) => [x, z, -y];

/** GLB (glTF 2.0 binary): one mesh, one primitive — POSITION, NORMAL, COLOR_0 (VEC3 float, LINEAR as glTF requires, so
 *  the sRGB palette is linearised), UNSIGNED_INT indices — a plain material, and the observer as a perspective camera.
 *  camera = { position, right, up, dir (lab axes), yfov, aspect, znear, zfar } */
export function glb(mesh, { name = 'lambdawaves', camera = null, extras = null, generator = 'lambdawaves' } = {}) {
  const nv = mesh.positions.length / 3, nt = mesh.indices.length / 3;
  const P = new Float32Array(3 * nv), NM = new Float32Array(3 * nv), CL = new Float32Array(3 * nv);
  const lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
  for (let v = 0; v < 3 * nv; v += 3) {
    const p = yUp(mesh.positions[v], mesh.positions[v + 1], mesh.positions[v + 2]), q = yUp(mesh.normals[v], mesh.normals[v + 1], mesh.normals[v + 2]);
    for (let a = 0; a < 3; a++) { P[v + a] = p[a]; NM[v + a] = q[a] + 0; CL[v + a] = toLinear(Math.min(1, Math.max(0, mesh.colors[v + a]))); if (P[v + a] < lo[a]) lo[a] = P[v + a]; if (P[v + a] > hi[a]) hi[a] = P[v + a]; }
  }
  const parts = [P, NM, CL, mesh.indices];
  let off = 0; const views = parts.map((A, i) => { const bv = { buffer: 0, byteOffset: off, byteLength: A.byteLength, target: i < 3 ? 34962 : 34963 }; off += A.byteLength; return bv; });
  const json = {
    asset: { version: '2.0', generator, extras: extras || undefined },
    scene: 0, scenes: [{ name, nodes: camera ? [0, 1] : [0] }],
    nodes: [{ name: 'psi', mesh: 0 }],
    meshes: [{ name: 'psi', primitives: [{ attributes: { POSITION: 0, NORMAL: 1, COLOR_0: 2 }, indices: 3, material: 0, mode: 4 }] }],
    materials: [{ name: 'phase', pbrMetallicRoughness: { baseColorFactor: [1, 1, 1, 1], metallicFactor: 0, roughnessFactor: 0.6 }, doubleSided: true }],
    accessors: [{ bufferView: 0, componentType: 5126, count: nv, type: 'VEC3', min: lo, max: hi },
      { bufferView: 1, componentType: 5126, count: nv, type: 'VEC3' }, { bufferView: 2, componentType: 5126, count: nv, type: 'VEC3' },
      { bufferView: 3, componentType: 5125, count: 3 * nt, type: 'SCALAR' }],
    bufferViews: views, buffers: [{ byteLength: off }],
  };
  if (camera) {
    json.cameras = [{ name: 'observer', type: 'perspective', perspective: { yfov: camera.yfov, aspectRatio: camera.aspect, znear: camera.znear, zfar: camera.zfar } }];
    json.nodes.push({ name: 'observer', camera: 0, translation: yUp(...camera.position), rotation: quatOfBasis(yUp(...camera.right), yUp(...camera.up), yUp(...camera.dir)) });
  }
  const J = enc(JSON.stringify(json));
  const jl = (J.length + 3) & ~3, bl = (off + 3) & ~3, total = 12 + 8 + jl + 8 + bl;
  const out = new Uint8Array(total), dv = new DataView(out.buffer);
  dv.setUint32(0, 0x46546c67, true); dv.setUint32(4, 2, true); dv.setUint32(8, total, true);
  dv.setUint32(12, jl, true); dv.setUint32(16, 0x4e4f534a, true); out.set(J, 20); out.fill(0x20, 20 + J.length, 20 + jl);
  dv.setUint32(20 + jl, bl, true); dv.setUint32(24 + jl, 0x004e4942, true);
  let p = 28 + jl; for (const A of parts) { out.set(new Uint8Array(A.buffer, A.byteOffset, A.byteLength), p); p += A.byteLength; }
  return out;
}

/** OBJ: `v x y z r g b` (sRGB; the vertex-colour extension Blender reads, others ignore the three), `vn`, `f a//a b//b c//c`, Y-up */
export function obj(mesh, { head = [] } = {}) {
  const nv = mesh.positions.length / 3, nt = mesh.indices.length / 3, P = mesh.positions, NM = mesh.normals, CL = mesh.colors;
  const f5 = (x) => String(+x.toFixed(5)), f4 = (x) => String(+x.toFixed(4));
  const L = head.map((s) => '# ' + ascii(s));
  L.push('o psi');
  for (let v = 0; v < 3 * nv; v += 3) L.push('v ' + f5(P[v]) + ' ' + f5(P[v + 2]) + ' ' + f5(-P[v + 1]) + ' ' + f4(CL[v]) + ' ' + f4(CL[v + 1]) + ' ' + f4(CL[v + 2]));
  for (let v = 0; v < 3 * nv; v += 3) L.push('vn ' + f4(NM[v]) + ' ' + f4(NM[v + 2]) + ' ' + f4(-NM[v + 1]));
  for (let t = 0; t < 3 * nt; t += 3) { const a = mesh.indices[t] + 1, b = mesh.indices[t + 1] + 1, c = mesh.indices[t + 2] + 1; L.push('f ' + a + '//' + a + ' ' + b + '//' + b + ' ' + c + '//' + c); }
  return enc(L.join('\n') + '\n');
}

/** STL, binary: an 80-byte ASCII header (never beginning "solid", which readers take for the text form), the triangle
 *  count, then per triangle the unit face normal, three vertices and a zero attribute word.  The lab's own z-up axes. */
export function stl(mesh, { header = 'lambdawaves' } = {}) {
  const nt = mesh.indices.length / 3, P = mesh.positions, I = mesh.indices;
  const out = new Uint8Array(84 + 50 * nt), dv = new DataView(out.buffer), hd = ascii(header).replace(/^solid/i, 'lambdawaves solid').slice(0, 80);
  for (let i = 0; i < 80; i++) out[i] = i < hd.length ? hd.charCodeAt(i) : 0x20;
  dv.setUint32(80, nt, true);
  for (let t = 0, p = 84; t < nt; t++, p += 50) {
    const a = 3 * I[3 * t], b = 3 * I[3 * t + 1], c = 3 * I[3 * t + 2];
    const ux = P[b] - P[a], uy = P[b + 1] - P[a + 1], uz = P[b + 2] - P[a + 2], wx = P[c] - P[a], wy = P[c + 1] - P[a + 1], wz = P[c + 2] - P[a + 2];
    let nx = uy * wz - uz * wy, ny = uz * wx - ux * wz, nz = ux * wy - uy * wx; const L = Math.hypot(nx, ny, nz) || 1; nx /= L; ny /= L; nz /= L;
    const f = [nx, ny, nz, P[a], P[a + 1], P[a + 2], P[b], P[b + 1], P[b + 2], P[c], P[c + 1], P[c + 2]];
    for (let k = 0; k < 12; k++) dv.setFloat32(p + 4 * k, f[k], true);
  }
  return out;
}

/** one .npy (format 1.0): the magic, the header dict padded with spaces to a 64-byte boundary, the raw little-endian data */
export function npy(descr, shape, data) {
  let head = `{'descr': '${descr}', 'fortran_order': False, 'shape': (${shape.join(', ')}${shape.length === 1 ? ',' : ''}), }`;
  head += ' '.repeat((64 - ((10 + head.length + 1) % 64)) % 64) + '\n';
  const out = new Uint8Array(10 + head.length + data.byteLength);
  out.set([0x93, 0x4e, 0x55, 0x4d, 0x50, 0x59, 1, 0, head.length & 255, head.length >> 8]);
  for (let i = 0; i < head.length; i++) out[10 + i] = head.charCodeAt(i);
  out.set(new Uint8Array(data.buffer, data.byteOffset, data.byteLength), 10 + head.length);
  return out;
}
/** the voxel-centre coordinates, the same on all three axes */
const axisOf = (N, half) => Float32Array.from({ length: N }, (_, i) => (i + 0.5) / N * 2 * half - half);

/** NPZ: psi.npy (<c8, shape (N, N, N), psi[i, j, k] = ψ(x_i, y_j, z_k) — the cube's order), axis.npy (<f4, N) and
 *  meta.json, in render-exact.js's stored ZIP */
export function npz({ re, im, N, half, space = 'r', t = 0, label = '', build = '' }) {
  const n = N, psi = new Float32Array(2 * n * n * n);
  for (let i = 0, o = 0; i < n; i++) for (let j = 0; j < n; j++) for (let k = 0; k < n; k++, o += 2) { const s = i + n * j + n * n * k; psi[o] = re[s]; psi[o + 1] = im[s]; }
  const meta = { label, t, half, N: n, spacing: 2 * half / n, space, units: space === 'p' ? 'hbar/bohr (momentum space)' : 'bohr',
    index: 'psi[i, j, k] = psi(axis[i], axis[j], axis[k]) — x, y, z (the cube file\'s order); axis = voxel centres', build, generator: 'lambdawaves' };
  return zipStored([{ name: 'psi.npy', bytes: npy('<c8', [n, n, n], psi) }, { name: 'axis.npy', bytes: npy('<f4', [n], axisOf(n, half)) },
    { name: 'meta.json', bytes: enc(JSON.stringify(meta, null, 1) + '\n') }]);
}

/** %13.5E, as Gaussian writes a cube value */
const e13 = (v) => {
  if (!(v !== 0) || !Number.isFinite(v)) return '  0.00000E+00';
  const s = v.toExponential(5), k = s.indexOf('e'), x = s.slice(k + 2);
  return (v < 0 ? ' ' : '  ') + s.slice(0, k) + 'E' + s[k + 1] + (x.length < 2 ? '0' + x : x);
};
/** the Gaussian cube of the DENSITY |ψ|²: two comment lines, the atom count and the first voxel centre, three axis lines
 *  (N and the spacing 2·half/N; N > 0 means bohr), the atoms (Z, charge, position), then the values x outer, z inner,
 *  six to a line and a new line for each (x, y) column */
export function cube({ re, im, N, half, atoms = [], label = '', build = '', space = 'r' }) {
  const n = N, h = 2 * half / n, x0 = h / 2 - half, I5 = (v) => String(v).padStart(5), F = (v) => (+v).toFixed(6).padStart(12);
  const L = [ascii(label) || 'lambdawaves',
    (space === 'p' ? 'momentum density |phi|^2 in (hbar/bohr)^-3, axes in hbar/bohr' : 'density |psi|^2 in bohr^-3') + ', lambdawaves ' + ascii(build),
    I5(atoms.length) + F(x0) + F(x0) + F(x0), I5(n) + F(h) + F(0) + F(0), I5(n) + F(0) + F(h) + F(0), I5(n) + F(0) + F(0) + F(h)];
  for (const a of atoms) L.push(I5(a.Z) + F(a.Z) + F(a.x) + F(a.y) + F(a.z));
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    let row = '';
    for (let k = 0; k < n; k++) { const s = i + n * j + n * n * k; row += e13(re[s] * re[s] + im[s] * im[s]); if (k % 6 === 5 && k < n - 1) row += '\n'; }
    L.push(row);
  }
  return enc(L.join('\n') + '\n');
}

/* ── THE WORKER OP: one message in (the grid and the scene at the press), one file out ─────────────────────── */
const nowMs = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
/** mathworker.js `export`: { fmt, texels, N, half, rhoMax, isoFrac, colour, camera, atoms, label, build, space, t } →
 *  { bytes, … } or { error }.  The camera arrives as the pose (dir, right, up, dist, yfov, aspect); its position is
 *  writeView's, dist·half along dir, with THIS grid's half. */
export function buildFile(m) {
  const t0 = nowMs(), spec = EXPORTS.find((e) => e.fmt === m.fmt);
  if (!spec) return { error: 'unknown export ' + m.fmt };
  const N = m.N, half = m.half, label = m.label || '', build = m.build || '', space = m.space === 'p' ? 'p' : 'r';
  const { re, im, nan } = decodeGrid(m.texels, N);
  if (spec.kind === 'grid') {
    const bytes = m.fmt === 'npz' ? npz({ re, im, N, half, space, t: m.t || 0, label, build }) : cube({ re, im, N, half, atoms: m.atoms || [], label, build, space });
    return { bytes, N, nan, ms: nowMs() - t0 };
  }
  const isoFrac = Math.max(m.isoFrac === undefined ? 0.06 : m.isoFrac, 1e-6), iso = isoFrac * m.rhoMax;
  if (!(iso > 0)) return { error: 'the field is empty: no surface' };
  const t1 = nowMs(), mesh = marchingCubes({ re, im, N, half, iso, colour: m.colour || {} }), marchMs = nowMs() - t1;
  const triangles = mesh.indices.length / 3, vertices = mesh.positions.length / 3;
  if (!triangles) return { error: `no surface at the ISO on screen (${isoFrac} of ρmax)` };
  const units = space === 'p' ? 'hbar/bohr (momentum space)' : 'bohr';
  let bytes;
  if (m.fmt === 'glb') {
    const c = m.camera, cam = c ? { position: c.dir.map((d) => d * c.dist * half), right: c.right, up: c.up, dir: c.dir, yfov: c.yfov, aspect: c.aspect, znear: 0.05, zfar: 100 * half } : null;
    bytes = glb(mesh, { name: 'λWAVES · ' + label + ' · ' + build, camera: cam, generator: 'lambdawaves ' + ascii(build),
      extras: { state: label, units, iso: { rho: iso, ofMax: isoFrac }, grid: N, half, axes: 'Y up: (x, z, -y) of the lab, whose z is up' } });
  } else if (m.fmt === 'obj') {
    bytes = obj(mesh, { head: ['lambdawaves ' + build, label + ' - the density isosurface on screen, rho = ' + iso.toExponential(4) + ' (' + isoFrac + ' of rho max, the ISO on screen), ' + N + '^3 grid',
      'units: 1 = 1 ' + units + ' - Y up: (x, z, -y) of the lab, which a Y-up importer turns back into z up', 'v x y z r g b: sRGB vertex colour = the phase palette on screen'] });
  } else bytes = stl(mesh, { header: 'lambdawaves ' + label + ' iso ' + isoFrac + ' of rhomax, 1 = 1 ' + (space === 'p' ? 'hbar/bohr' : 'bohr') + ', z up' });
  return { bytes, triangles, vertices, iso, isoFrac, N, nan, marchMs, ms: nowMs() - t0 };
}

/* ── THE PAGE: read, post, download ───────────────────────────────────────────────────────────────────────── */
const sizeOf = (b) => (b >= 1e5 ? (b / 1e6).toFixed(1) + ' MB' : Math.max(1, Math.round(b / 1e3)) + ' kB');
/** env = { field: () → the field, scene: () → { label, build, t, space, isoFrac, colour, camera, atoms } (what is on
 *  screen, read at the press), post: (msg, transfer) → the worker's reply, or null when there is no worker (the same
 *  function then runs here), save: ({ blob, name }) → the download (capture.js), status: (text, cls) → SETTINGS' line }.
 *  One export at a time: a second press while one is in flight is refused, and the rows are disabled. */
export function createExporter(env) {
  let busy = false, last = null;
  const taken = new Set();
  async function run(fmt) {
    const spec = EXPORTS.find((e) => e.fmt === fmt);
    if (!spec) return { ok: false, error: 'unknown export ' + fmt };
    if (busy) return { ok: false, refused: true, error: 'an export is already in flight' };
    const f = env.field();
    if (!f || !f.ok || typeof f.readGrid !== 'function') { env.status('EXPORT · ' + NO_FIELD, 'warn'); return { ok: false, error: NO_FIELD }; }
    busy = true;
    const t0 = nowMs();
    try {
      const scene = env.scene();
      const g = await f.readGrid();
      const readMs = nowMs() - t0, t1 = nowMs();
      const msg = Object.assign({ op: 'export', fmt, texels: g.texels, N: g.N, half: g.half, rhoMax: g.rhoMax }, scene);
      let r = await env.post(msg, [g.texels.buffer]);
      if (r === null && g.texels.byteLength) r = buildFile(msg);          // no worker at all: the same function, on this thread
      if (!r || r.error) throw new Error(r && r.error || 'the maths worker did not answer');
      const roundTripMs = nowMs() - t1;
      const name = uniqueName(`lambdawaves-${slug(scene.label) || 'state'}-${stamp().slice(0, 13)}.${fmt}`, taken);
      env.save({ blob: new Blob([r.bytes], { type: spec.mime }), name });
      const totalMs = nowMs() - t0;
      last = { ok: true, fmt, kind: spec.kind, name, bytes: r.bytes.byteLength, triangles: r.triangles || 0, vertices: r.vertices || 0, iso: r.iso, isoFrac: r.isoFrac,
        N: g.N, half: g.half, space: scene.space, rhoMax: g.rhoMax, nan: r.nan, readMs, workerMs: r.ms, marchMs: r.marchMs, roundTripMs, totalMs };
      env.status(`EXPORTED ${spec.kind}.${fmt} · ${spec.kind === 'shape' ? (r.triangles >= 1000 ? Math.round(r.triangles / 1000) + ' k' : r.triangles) + ' triangles' : g.N + '³ grid'} · ${sizeOf(last.bytes)} · ${(totalMs / 1000).toFixed(2)} s`, 'live');
      return last;
    } catch (e) {
      const why = String(e && e.message || e);
      env.status('EXPORT FAILED · ' + why, 'warn');
      return (last = { ok: false, fmt, error: why });
    } finally { busy = false; }
  }
  return { run, get busy() { return busy; }, get last() { return last; } };
}
