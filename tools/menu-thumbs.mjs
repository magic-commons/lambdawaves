/* tools/menu-thumbs.mjs — THE MAIN MENU'S PICTURES (iteration 003, Josh 2026-10-16): one square thumbnail per molecule in the store and one
 * per hydrogen subshell the periodic table names, rendered BY THE APP in headless Firefox (the gate kit) and written to lab/img/menu/.
 *
 *   python3 tools/gate/server.py . 9671 &                                   # serve this checkout
 *   GD_PORT=5681 LW_PORT=9671 node tools/menu-thumbs.mjs [--only H2O,C60,orb-3d] [--iso 0.03] [--size 160] [--q 0.72]
 *
 * THE LOOK (every picture the same, Josh's words: "density mode in Signed with a somewhat fat ISO, all in HSV colouring"):
 *   OBSERVABLE ρ = |ψ|² (density) · STYLE SIGNED · ISO 0.03 (the shipped 0.06 halved: a fatter shell) · PALETTE ON, 'wheel' (the kit's HSV
 *   wheel; density reads it at θ = 0) · FRAME off · AXIS off · camera the boot's HOME pose (never moved) · RATE paused · the field ALONE:
 *   capture.picture() renders the volume at the target size without the 2-D layers (stage formula, atom labels, skeleton, pop-ups — none
 *   of them is in a picture; atom labels are therefore OFF for every tile, consistently) and with no caption.
 * NO BACKGROUND, honestly: the present shader composites the march over the stage ground BEFORE the gamma (field.js: o = (col + bg·(1−α))^(1/γ),
 *   γ = 1 here, dither off), so two pictures of the same frame over two grounds give the alpha exactly: with the ground 0 the pixel is col,
 *   with the ground g(y) it is col + g(y)(1 − α), so α = 1 − (C₁ − C₀)/g(y) and the straight colour is C₀/α.  g(y) is the shader's own
 *   vertical gradient, read per row as the largest C₁ − C₀ on that row (an empty pixel shows the whole ground).
 * Then each picture is cropped square about its alpha box (12 % margin: every tile fills its square the same way, so a picture's size says
 * nothing about the molecule's) at 2 × --size, and PIL (python3) scales it to --size px and writes WebP with lossy alpha (quality --q,
 * alpha 60).  The set stays small (the precache has an 8 MiB ceiling): ~3 kB a picture.
 * MOLECULES: every row of the store (molecules.js MOLECULES + RECORD_ONLY, the picker's order), MOLECULES ON, the molecule picked by the
 *   card's hand road (a record-only row loads its library record), solved STO-3G RHF ground state.  The two disabled rows (CuH, ZnH₂ — no
 *   RHF minimum) have no picture: the menu shows them dimmed with the reason.
 * SUBSHELLS: hydrogen (n, l, m = 0), the 1s … 6d the table names (the register ends at n = 6: 7s and 7p have no picture), ATOMS mode.
 * Writes lab/img/menu/<id>.webp, lab/img/menu/orb-<nl>.webp and lab/img/menu/manifest.json (what exists + these settings). */
import { open } from './gate/gatekit.mjs';
import { writeFileSync, mkdirSync, statSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { MOLECULES, RECORD_ONLY } from '../lab/molecules.js';

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const ISO = +arg('iso', 0.03), SIZE = +arg('size', 160), Q = +arg('q', 0.7), RENDER = 512;
const only = arg('only', '') ? arg('only', '').split(',') : null;
const OUT = new URL('../lab/img/menu/', import.meta.url).pathname; mkdirSync(OUT, { recursive: true });
const SUBSHELLS = [[1, 0], [2, 0], [2, 1], [3, 0], [3, 1], [3, 2], [4, 0], [4, 1], [4, 2], [4, 3], [5, 0], [5, 1], [5, 2], [5, 3], [6, 0], [6, 1], [6, 2]];
const nl = ([n, l]) => n + 'spdf'[l];
const mols = [...MOLECULES, ...RECORD_ONLY].filter((m) => !m.disabled);

const g = await open(`https://127.0.0.1:${process.env.LW_PORT || 9671}/lab/?menu=0`, { width: 1200, height: 900, script: 240000 });
const ok = await g.waitFor('window.__LW&&__LW.ready', 900, 100);
if (!ok.ok) { console.error('the lab did not come up', await g.errors()); await g.close(); process.exit(1); }

/* the look, once */
await g.ev(`const LW = __LW; LW.pause(); LW.setFrame(false); LW.setAxis(false); LW.setDither(0); LW.mat.gamma = 1;
  LW.setView('density'); LW.setStyle('signed'); LW.mat.iso = ${ISO};
  LW.palette.select('wheel'); LW.palette.setOn(true);
  /* the shot: two grounds, the matte, the crop, the encode — in the page, so the bytes never cross the wire twice */
  window.__thumb = async (size, q) => {
    const settle = async () => { const p = LW.stats.presents; for (let i = 0; i < 60 && LW.stats.presents < p + 2; i++) await new Promise((r) => setTimeout(r, 50)); };
    const grab = async (bg) => { LW.mat.bg = bg; LW.schedule(LW.TIER.PRESENT); await settle();
      const p = await LW.capture.picture({ width: ${RENDER}, height: ${RENDER}, caption: false }); if (!p.ok) throw new Error(p.error);
      const bm = await createImageBitmap(p.blob, { colorSpaceConversion: 'none', premultiplyAlpha: 'none' });
      const c = new OffscreenCanvas(bm.width, bm.height), x = c.getContext('2d'); x.drawImage(bm, 0, 0); return x.getImageData(0, 0, bm.width, bm.height); };
    const keep = LW.mat.bg.slice();
    const A = await grab([0, 0, 0]), B = await grab([0.78, 0.78, 0.78]); LW.mat.bg = keep; LW.schedule(LW.TIER.PRESENT);
    const W = A.width, H = A.height, out = new ImageData(W, H); let x0 = W, y0 = H, x1 = -1, y1 = -1;
    for (let y = 0; y < H; y++) {
      let gy = 1; for (let x = 0; x < W; x++) { const k = 4 * (y * W + x); gy = Math.max(gy, B.data[k] - A.data[k], B.data[k + 1] - A.data[k + 1], B.data[k + 2] - A.data[k + 2]); }
      for (let x = 0; x < W; x++) {
        const k = 4 * (y * W + x); let a = 0;
        for (let ch = 0; ch < 3; ch++) a += 1 - (B.data[k + ch] - A.data[k + ch]) / gy;
        a = Math.min(1, Math.max(0, a / 3)); if (a < 0.012) a = 0;
        for (let ch = 0; ch < 3; ch++) out.data[k + ch] = a ? Math.min(255, Math.round(A.data[k + ch] / a)) : 0;
        out.data[k + 3] = Math.round(a * 255);
        if (a > 0.04) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
      }
    }
    if (x1 < 0) return { empty: true };
    const full = new OffscreenCanvas(W, H); full.getContext('2d').putImageData(out, 0, 0);
    const side = Math.max(x1 - x0, y1 - y0) * 1.12 + 4, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    const c = new OffscreenCanvas(size, size), cg = c.getContext('2d'); cg.imageSmoothingQuality = 'high';
    cg.drawImage(full, cx - side / 2, cy - side / 2, side, side, 0, 0, size, size);
    const blob = await c.convertToBlob({ type: 'image/png' });   // lossless here; the WebP (lossy colour AND alpha) is PIL's, below
    const buf = new Uint8Array(await blob.arrayBuffer()); let s = ''; for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode.apply(null, buf.subarray(i, i + 0x8000));
    return { b64: btoa(s), bytes: buf.length, box: [x0, y0, x1, y1] };
  };
  return true;`);

const made = { molecules: [], orbitals: [] }; let total = 0;
/* the browser's WebP keeps the alpha LOSSLESS (no alpha_quality on a canvas) and that was ~6 kB a tile; PIL's lossy alpha is ~3 kB at the same look */
const TMP = tmpdir() + '/lw-menu-thumbs-' + process.pid + '-';
const save = (name, r) => { if (!r || r.E || r.empty) { console.log('  ✗', name, r && (r.E || 'empty')); return false; }
  writeFileSync(TMP + name + '.png', Buffer.from(r.b64, 'base64'));
  const py = spawnSync('python3', ['-I', '-c', 'import sys\nfrom PIL import Image\nIm=Image.open(sys.argv[1]).convert("RGBA").resize((int(sys.argv[3]),)*2, Image.LANCZOS)\nIm.save(sys.argv[2], "WEBP", quality=int(sys.argv[4]), alpha_quality=60, method=6)',
    TMP + name + '.png', OUT + name + '.webp', String(SIZE), String(Math.round(Q * 100))], { encoding: 'utf8' });
  if (py.status !== 0) { console.log('  ✗', name, py.stderr); return false; }
  const b = statSync(OUT + name + '.webp').size; total += b; console.log('  ✓', name, b, 'B'); return true; };

/* MOLECULES: ON once, then each row by the hand road, waited until THIS molecule's solve is the field's */
await g.ev(`__LW.chem.setOn(true); return true;`);
for (const { id, nAO } of mols) {
  if (only && !only.includes(id)) continue;
  const r = await g.ev(`const LW = __LW; await LW.chem.pick(${JSON.stringify(id)});
    for (let i = 0; i < 900; i++) { const c = LW.chem.state(), m = LW.molsession.state().molecule; if (c.preset === ${JSON.stringify(id)} && c.nAO === ${nAO} && m && m.nAO === ${nAO}) break; await new Promise((r) => setTimeout(r, 100)); }
    LW.setView('density'); LW.setStyle('signed'); LW.mat.iso = ${ISO};
    await new Promise((r) => setTimeout(r, 300));
    return await __thumb(${2 * SIZE}, ${Q});`);
  if (save(id, r)) made.molecules.push(id);
}

/* SUBSHELLS: ATOMS mode, hydrogen, one label at amplitude 1 */
await g.ev(`__LW.chem.setOn(false); __LW.setHamiltonian('hydrogen'); return true;`);
for (const s of SUBSHELLS) {
  const name = 'orb-' + nl(s); if (only && !only.includes(name)) continue;
  const r = await g.ev(`const LW = __LW, H = await import('./hydrogen.js'); const a = H.stateOf(${s[0]}, ${s[1]}, 0).index;
    LW.reg.clear(); LW.reg.set(a, 1, 0); LW.setMute(a, false);
    LW.setView('density'); LW.setStyle('signed'); LW.mat.iso = ${ISO};
    await new Promise((r) => setTimeout(r, 600));
    return await __thumb(${2 * SIZE}, ${Q});`);
  if (save(name, r)) made.orbitals.push(nl(s));
}

if (!only) writeFileSync(OUT + 'manifest.json', JSON.stringify({ tool: 'tools/menu-thumbs.mjs', size: SIZE, quality: Q, render: RENDER,
  look: { view: 'density', style: 'signed', iso: ISO, palette: 'wheel', frame: false, axis: false, camera: 'home', ground: 'none (two-ground matte)' },
  molecules: made.molecules, orbitals: made.orbitals }, null, 1) + '\n');
console.log(`${made.molecules.length} molecules, ${made.orbitals.length} subshells, ${(total / 1024).toFixed(1)} kB`, JSON.stringify((await g.errors()).errs.filter((e) => !/ResizeObserver/.test(e))));
await g.close(); process.exit(0);
