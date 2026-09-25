/* n6-equal.mjs — lane N · N6's equality proofs, in node.
 *   (a) rack.js's block-local hexToRgb / rgbToHex (the SETTINGS stage-colour block) against the kit palette's exports,
 *       over every #rrggbb the colour input can hand over (a 1/17 lattice + random), and rgbToHex over every edge:
 *       NaN, ±0, ±Infinity, below 0, above 1, the 1/255 lattice, random reals — compared with Object.is per channel.
 *   (b) unproject: the pre-N6 body against pointerRay + the plane solve (the post-N6 body), same cameraBasis, over random
 *       canvases, poses and pointers, both camera modes — Object.is on every coordinate.
 *   node research/optimization-2026-09-24/probes/N/n6-equal.mjs */
import { hexToRgb, rgbToHex } from '../../../../lab/mir/palette.js';
import { cameraBasis, quatFromYawPitch } from '../../../../lab/field.js';

const localHexToRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
const localRgbToHex = (c) => '#' + c.map((v) => Math.round(Math.max(0, Math.min(1, v)) * 255).toString(16).padStart(2, '0')).join('');
let rnd = 12345; const R = () => ((rnd = (Math.imul(rnd, 1103515245) + 12345) >>> 0) / 4294967296);

let hexN = 0, hexBad = 0;
const hexes = [];
for (let r = 0; r < 256; r += 17) for (let g = 0; g < 256; g += 17) for (let b = 0; b < 256; b += 17) hexes.push([r, g, b]);
for (let i = 0; i < 20000; i++) hexes.push([0, 0, 0].map(() => Math.floor(R() * 256)));
for (const c of hexes) { const h = '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('');
  const a = localHexToRgb(h), b = hexToRgb(h); hexN++; if (!a.every((v, i) => Object.is(v, b[i]))) hexBad++; }

const edges = [NaN, 0, -0, Infinity, -Infinity, -1e-9, -0.5, 1 + 1e-9, 1.5, 1e300, -1e300, 0.5 / 255, 1.5 / 255, 254.5 / 255];
for (let k = 0; k <= 255; k++) edges.push(k / 255, (k + 0.5) / 255, (k - 0.5) / 255);
let rgbN = 0, rgbBad = 0; const badRgb = [];
const vals = [...edges]; for (let i = 0; i < 30000; i++) vals.push(R() * 1.4 - 0.2);
for (let i = 0; i < vals.length; i++) { const c = [vals[i], vals[(i * 7 + 3) % vals.length], vals[(i * 13 + 5) % vals.length]];
  const a = localRgbToHex(c), b = rgbToHex(c); rgbN++; if (a !== b) { rgbBad++; if (badRgb.length < 5) badRgb.push([c, a, b]); } }

/* (b) — the two bodies, verbatim but for the closure's free names passed in */
function unprojectOld(px, py, E) { const { dom, obs, domain, radius } = E;
  const W = dom.canvas.clientWidth, H = dom.canvas.clientHeight, B = cameraBasis(obs), D = obs.dist * domain.half;
  const tanH = Math.tan((obs.fov || 0.6) / 2), aspect = W / H, u = 2 * px / W - 1, v = 1 - 2 * py / H;
  const cam = [B.dir[0] * D, B.dir[1] * D, B.dir[2] * D];
  const d = [B.fwd[0] + u * tanH * aspect * B.right[0] + v * tanH * B.up[0], B.fwd[1] + u * tanH * aspect * B.right[1] + v * tanH * B.up[1], B.fwd[2] + u * tanH * aspect * B.right[2] + v * tanH * B.up[2]];
  const lam = -(cam[0] * B.fwd[0] + cam[1] * B.fwd[1] + cam[2] * B.fwd[2]) / (d[0] * B.fwd[0] + d[1] * B.fwd[1] + d[2] * B.fwd[2]);
  const p = [cam[0] + lam * d[0], cam[1] + lam * d[1], cam[2] + lam * d[2]];
  const a = radius, r = Math.hypot(...p), cap = 0.75 * a;
  return r > cap ? p.map((c) => c * cap / r) : p; }
function pointerRay(px, py, E) { const { dom, obs, domain } = E;
  const W = dom.canvas.clientWidth, H = dom.canvas.clientHeight, B = cameraBasis(obs), D = obs.dist * domain.half;
  const tanH = Math.tan((obs.fov || 0.6) / 2), aspect = W / H, u = 2 * px / W - 1, v = 1 - 2 * py / H;
  const cam = [B.dir[0] * D, B.dir[1] * D, B.dir[2] * D];
  const d = [B.fwd[0] + u * tanH * aspect * B.right[0] + v * tanH * B.up[0], B.fwd[1] + u * tanH * aspect * B.right[1] + v * tanH * B.up[1], B.fwd[2] + u * tanH * aspect * B.right[2] + v * tanH * B.up[2]];
  return { cam, d, B }; }
function unprojectNew(px, py, E) {
  const { cam, d, B } = pointerRay(px, py, E);
  const lam = -(cam[0] * B.fwd[0] + cam[1] * B.fwd[1] + cam[2] * B.fwd[2]) / (d[0] * B.fwd[0] + d[1] * B.fwd[1] + d[2] * B.fwd[2]);
  const p = [cam[0] + lam * d[0], cam[1] + lam * d[1], cam[2] + lam * d[2]];
  const a = E.radius, r = Math.hypot(...p), cap = 0.75 * a;
  return r > cap ? p.map((c) => c * cap / r) : p; }
let upN = 0, upBad = 0;
for (let i = 0; i < 20000; i++) {
  const yaw = R() * 20 - 10, pitch = (R() * 2 - 1) * 1.52, free = R() < 0.5;
  const obs = { yaw, pitch, dist: 1.2 + R() * 6.8, fov: R() < 0.1 ? 0 : 0.25 + R() * 0.95, mode: free ? 'free' : 'turntable', quat: free ? quatFromYawPitch(yaw + R(), pitch * 0.5) : quatFromYawPitch(yaw, pitch) };
  const E = { dom: { canvas: { clientWidth: 200 + Math.floor(R() * 2400), clientHeight: 150 + Math.floor(R() * 1400) } }, obs, domain: { half: 3 + R() * 137 }, radius: 3 + R() * 27 };
  const px = R() * E.dom.canvas.clientWidth, py = R() * E.dom.canvas.clientHeight;
  const a = unprojectOld(px, py, E), b = unprojectNew(px, py, E); upN++; if (!a.every((v, k) => Object.is(v, b[k]))) upBad++;
}
const out = { hexToRgb: { cases: hexN, differ: hexBad }, rgbToHex: { cases: rgbN, differ: rgbBad, bad: badRgb }, unproject: { cases: upN, differ: upBad } };
console.log(JSON.stringify(out));
process.exit(hexBad || rgbBad || upBad ? 1 : 0);
