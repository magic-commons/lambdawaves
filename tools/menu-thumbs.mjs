/* tools/menu-thumbs.mjs — THE PICKER'S PICTURES (iteration 003, Josh 2026-10-16; iteration 004 2026-10-17): one square thumbnail per
 * molecule in the store, one per live element H–Kr and one per hydrogen subshell the dimmed elements past Kr name, rendered BY THE APP in
 * headless Firefox (the gate kit) and written to lab/img/menu/.
 *
 *   python3 tools/gate/server.py . 9671 &                                   # serve this checkout
 *   GD_PORT=5681 LW_PORT=9671 node tools/menu-thumbs.mjs [--set molecules,elements,orbitals] [--only H2O,el-Fe,orb-4d] [--iso 0.03] [--size 200] [--q 0.64]
 *
 * THE LOOK (every picture the same, Josh's words: "density mode in Signed with a somewhat fat ISO, all in HSV colouring"):
 *   OBSERVABLE ρ = |ψ|² (density) · STYLE SIGNED · ISO 0.03 (the shipped 0.06 halved: a fatter shell) · PALETTE ON, 'wheel' (the kit's HSV
 *   wheel; density reads it at θ = 0) · FRAME off · AXIS off · RATE paused · the field ALONE: capture.picture() renders the volume at the
 *   target size without the 2-D layers (stage formula, atom labels, skeleton, pop-ups — none of them is in a picture; atom labels are
 *   therefore OFF for every tile, consistently) and with no caption.
 * THE POSE: a molecule is seen from the boot's HOME pose (never moved); an atom or a subshell from THE CORNER (iteration 004, Josh: "corner
 *   angle view of the orbital as it is in lambdawaves"): the turntable looking down a cube diagonal, yaw π/4 (45°) and pitch asin(1/√3)
 *   (35.26°), set on __LW.obs and put back afterwards.
 * NO BACKGROUND, honestly: the present shader composites the march over the stage ground BEFORE the gamma (field.js: o = (col + bg·(1−α))^(1/γ),
 *   γ = 1 here, dither off), so two pictures of the same frame over two grounds give the alpha exactly: with the ground 0 the pixel is col,
 *   with the ground g(y) it is col + g(y)(1 − α), so α = 1 − (C₁ − C₀)/g(y) and the straight colour is C₀/α.  g(y) is the shader's own
 *   vertical gradient, read per row as the largest C₁ − C₀ on that row (an empty pixel shows the whole ground).
 * Then each picture is cropped square about its alpha box (8 % margin: every tile fills its square the same way, so a picture's size says
 * nothing about the molecule's or the atom's) at 2 × --size, and PIL (python3) scales it to --size px and writes WebP with lossy alpha
 * (quality --q, alpha 50).  The set stays small: the precache has an 8 MiB ceiling and the Picker's set is most of the room left under it.
 * MOLECULES: every row of the store (molecules.js MOLECULES + RECORD_ONLY, the Picker's order), MOLECULES ON, the molecule picked by the
 *   card's hand road (a record-only row loads its library record), solved STO-3G RHF ground state.  The two disabled rows (CuH, ZnH₂ — no
 *   RHF minimum) have no picture: the Picker shows them dimmed with the reason.
 * ELEMENTS (el-<symbol>): H–Kr, exactly what a press on the tile opens — the Picker's goAtom road: ATOMS mode, the ATOM system,
 *   setElement(Z), fillValence() (the outermost occupied shell of atoms.js' configuration, every m equal and in phase).
 * SUBSHELLS (orb-<nl>): the dimmed elements past Kr — hydrogen (n, l) with every m equal and in phase (amplitude 1/√(2l+1), phase 0), the
 *   subshells the table names past Kr up to n = 6 (the register ends there: 7s and 7p have no picture).
 * Writes lab/img/menu/<id>.webp, el-<sym>.webp, orb-<nl>.webp and lab/img/menu/manifest.json (what exists + these settings).
 * A VOLUME (iteration 004 V2, `--volume vol-1`): each molecule of <LW_VOLUMES>/dist/<vol>/index.json opened by the card's own road
 *   (__LW.chem.openVolume — the lowest rung, its record, no solve) at the HOME pose in the same look, into <dist>/<vol>/t/<id>.webp;
 *   no manifest (the packer's index carries `thumb`: run tools/volumes/pack.mjs --incremental after).  The page must serve the volume
 *   (the dev link lab/volumes). */
import { open } from './gate/gatekit.mjs';
import { writeFileSync, mkdirSync, statSync, existsSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir, homedir } from 'node:os';
import { MOLECULES, RECORD_ONLY } from '../lab/molecules.js';
import { ATOMS } from '../lab/atoms.js';

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const ISO = +arg('iso', 0.03), SIZE = +arg('size', 200), Q = +arg('q', 0.64), AQ = +arg('aq', 50), RENDER = +arg('render', 640);
const only = arg('only', '') ? arg('only', '').split(',') : null;
const VOL = arg('volume', null), VDIR = VOL && (process.env.LW_VOLUMES || homedir() + '/Documents/LAMBDAWAVES-VOLUMES') + '/dist/' + VOL + '/';
const sets = VOL ? ['volume'] : arg('set', 'molecules,elements,orbitals').split(',');
const OUT = VOL ? VDIR + 't/' : new URL('../lab/img/menu/', import.meta.url).pathname; mkdirSync(OUT, { recursive: true });
const SUBSHELLS = [[5, 0], [4, 2], [5, 1], [6, 0], [4, 3], [5, 2], [6, 1], [5, 3], [6, 2]];   // the valence subshells of Rb … Og, n ≤ 6
const nl = ([n, l]) => n + 'spdf'[l];
const mols = [...MOLECULES, ...RECORD_ONLY].filter((m) => !m.disabled);
const CORNER = { yaw: Math.PI / 4, pitch: Math.asin(1 / Math.sqrt(3)) };

const g = await open(`https://127.0.0.1:${process.env.LW_PORT || 9671}/lab/?menu=0`, { width: 1200, height: 900, script: 240000 });
const ok = await g.waitFor('window.__LW&&__LW.ready', 900, 100);
if (!ok.ok) { console.error('the lab did not come up', await g.errors()); await g.close(); process.exit(1); }

/* the look, once */
await g.ev(`const LW = __LW; LW.pause(); LW.setFrame(false); LW.setAxis(false); LW.setDither(0); LW.mat.gamma = 1;
  LW.setView('density'); LW.setStyle('signed'); LW.mat.iso = ${ISO};
  LW.palette.select('wheel'); LW.palette.setOn(true);
  if (LW.camMode !== 'turntable') LW.setCamMode('turntable', true);
  window.__home = { yaw: LW.obs.yaw, pitch: LW.obs.pitch };
  window.__pose = (p) => { LW.obs.yaw = p.yaw; LW.obs.pitch = p.pitch; LW.schedule(LW.TIER.PRESENT); };
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
    const side = Math.max(x1 - x0, y1 - y0) * 1.08 + 4, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    const c = new OffscreenCanvas(size, size), cg = c.getContext('2d'); cg.imageSmoothingQuality = 'high';
    cg.drawImage(full, cx - side / 2, cy - side / 2, side, side, 0, 0, size, size);
    const blob = await c.convertToBlob({ type: 'image/png' });   // lossless here; the WebP (lossy colour AND alpha) is PIL's, below
    const buf = new Uint8Array(await blob.arrayBuffer()); let s = ''; for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode.apply(null, buf.subarray(i, i + 0x8000));
    return { b64: btoa(s), bytes: buf.length, box: [x0, y0, x1, y1] };
  };
  return true;`);

const prior = existsSync(OUT + 'manifest.json') ? JSON.parse(readFileSync(OUT + 'manifest.json', 'utf8')) : {};
const made = { molecules: [], elements: [], orbitals: [] }; let total = 0;
/* the browser's WebP keeps the alpha LOSSLESS (no alpha_quality on a canvas); PIL's lossy alpha is about half the bytes at the same look */
const TMP = tmpdir() + '/lw-menu-thumbs-' + process.pid + '-';
const save = (name, r) => { if (!r || r.E || r.empty) { console.log('  ✗', name, r && (r.E || 'empty')); return false; }
  writeFileSync(TMP + name + '.png', Buffer.from(r.b64, 'base64'));
  const py = spawnSync('python3', ['-I', '-c', 'import sys\nfrom PIL import Image\nIm=Image.open(sys.argv[1]).convert("RGBA").resize((int(sys.argv[3]),)*2, Image.LANCZOS)\nIm.save(sys.argv[2], "WEBP", quality=int(sys.argv[4]), alpha_quality=int(sys.argv[5]), method=6)',
    TMP + name + '.png', OUT + name + '.webp', String(SIZE), String(Math.round(Q * 100)), String(AQ)], { encoding: 'utf8' });
  if (py.status !== 0) { console.log('  ✗', name, py.stderr); return false; }
  const b = statSync(OUT + name + '.webp').size; total += b; console.log('  ✓', name, b, 'B'); return true; };

/* MOLECULES: ON once, then each row by the hand road, waited until THIS molecule's solve is the field's; the HOME pose */
if (sets.includes('molecules')) {
  await g.ev(`__LW.chem.setOn(true); __pose(__home); return true;`);
  for (const { id, nAO } of mols) {
    if (only && !only.includes(id)) continue;
    const r = await g.ev(`const LW = __LW; await LW.chem.pick(${JSON.stringify(id)});
      for (let i = 0; i < 900; i++) { const c = LW.chem.state(), m = LW.molsession.state().molecule; if (c.preset === ${JSON.stringify(id)} && c.nAO === ${nAO} && m && m.nAO === ${nAO}) break; await new Promise((r) => setTimeout(r, 100)); }
      LW.setView('density'); LW.setStyle('signed'); LW.mat.iso = ${ISO};
      await new Promise((r) => setTimeout(r, 300));
      return await __thumb(${2 * SIZE}, ${Q});`);
    if (save(id, r)) made.molecules.push(id);
  }
}

/* ELEMENTS: ATOMS mode, the ATOM system, the element, its valence filled — the Picker's own goAtom road — seen from THE CORNER */
if (sets.includes('elements')) {
  await g.ev(`__LW.chem.setOn(false); __LW.setHamiltonian('atom'); __pose(${JSON.stringify(CORNER)}); return true;`);
  for (const a of ATOMS) {
    const name = 'el-' + a.symbol; if (only && !only.includes(name)) continue;
    const r = await g.ev(`const LW = __LW; LW.setElement(${a.Z}); if (LW.hamiltonian !== 'atom') LW.setHamiltonian('atom'); const f = LW.fillValence();
      LW.setView('density'); LW.setStyle('signed'); LW.mat.iso = ${ISO}; __pose(${JSON.stringify(CORNER)});
      await new Promise((r) => setTimeout(r, 700));
      const t = await __thumb(${2 * SIZE}, ${Q}); if (t) t.shell = f; return t;`);
    if (save(name, r)) made.elements.push({ sym: a.symbol, Z: a.Z, shell: r.shell ? r.shell.n + 'spdf'[r.shell.l] : null });
  }
}

/* SUBSHELLS: ATOMS mode, hydrogen, every m of (n, l) equal and in phase, THE CORNER */
if (sets.includes('orbitals')) {
  await g.ev(`__LW.chem.setOn(false); __LW.setHamiltonian('hydrogen'); __pose(${JSON.stringify(CORNER)}); return true;`);
  for (const s of SUBSHELLS) {
    const name = 'orb-' + nl(s); if (only && !only.includes(name)) continue;
    const r = await g.ev(`const LW = __LW, H = await import('./hydrogen.js'), amp = 1 / Math.sqrt(${2 * s[1] + 1});
      LW.reg.clear(); for (let m = -${s[1]}; m <= ${s[1]}; m++) { const a = H.stateOf(${s[0]}, ${s[1]}, m).index; LW.reg.set(a, amp, 0); LW.setMute(a, false); }
      LW.setView('density'); LW.setStyle('signed'); LW.mat.iso = ${ISO}; __pose(${JSON.stringify(CORNER)});
      await new Promise((r) => setTimeout(r, 700));
      return await __thumb(${2 * SIZE}, ${Q});`);
    if (save(name, r)) made.orbitals.push(nl(s));
  }
}
/* A VOLUME: each molecule by the card's openVolume (its lowest rung), waited until it is the field's; the HOME pose */
if (VOL) {
  await g.ev(`__pose(__home); return true;`);
  for (const { id } of JSON.parse(readFileSync(VDIR + 'index.json', 'utf8')).molecules) {
    if (only && !only.includes(id)) continue;
    const r = await g.ev(`const LW = __LW; if (!(await LW.chem.openVolume(${JSON.stringify(VOL)}, ${JSON.stringify(id)}))) return { E: LW.chem.state().status };
      for (let i = 0; i < 900; i++) { const c = LW.chem.state(), m = LW.molsession.state().molecule; if (m && m.nAO === c.nAO) break; await new Promise((r) => setTimeout(r, 100)); }
      LW.setView('density'); LW.setStyle('signed'); LW.mat.iso = ${ISO}; __pose(__home);
      await new Promise((r) => setTimeout(r, 300));
      return await __thumb(${2 * SIZE}, ${Q});`);
    if (save(id, r)) made.molecules.push(id);
  }
}
await g.ev(`__pose(__home); return true;`);

/* the manifest keeps what this run did not redo (a --set or --only run updates its own rows only) */
const keepRows = (key, rows, id) => (sets.includes(key) && !only ? rows : [...(prior[key] || []).filter((p) => !rows.some((r) => id(r) === id(p))), ...rows]);
if (!VOL) writeFileSync(OUT + 'manifest.json', JSON.stringify({ tool: 'tools/menu-thumbs.mjs', size: SIZE, quality: Q, alphaQuality: AQ, render: RENDER,
  look: { view: 'density', style: 'signed', iso: ISO, palette: 'wheel', frame: false, axis: false, camera: { molecules: 'home', elements: 'corner (yaw 45°, pitch 35.26°)', orbitals: 'corner (yaw 45°, pitch 35.26°)' }, ground: 'none (two-ground matte)' },
  molecules: keepRows('molecules', made.molecules, (x) => x), elements: keepRows('elements', made.elements, (x) => x.sym), orbitals: keepRows('orbitals', made.orbitals, (x) => x) }, null, 1) + '\n');
console.log(`${made.molecules.length} molecules, ${made.elements.length} elements, ${made.orbitals.length} subshells, ${(total / 1024).toFixed(1)} kB`, JSON.stringify((await g.errors()).errs.filter((e) => !/ResizeObserver/.test(e))));
await g.close(); process.exit(0);
