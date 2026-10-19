/* tools/menu-thumbs.mjs — THE PICKER'S PICTURES (iteration 003, Josh 2026-10-16; iteration 004 2026-10-17): one square thumbnail per
 * molecule in the store, one per live element (H–Og since iteration 008 A7) and one per hydrogen subshell a dimmed element names, rendered BY THE APP in
 * headless Firefox (the gate kit) and written to lab/img/menu/.
 *
 *   python3 tools/gate/server.py . 9671 &                                   # serve this checkout
 *   GD_PORT=5681 LW_PORT=9671 node tools/menu-thumbs.mjs [--set molecules,elements,orbitals] [--only H2O,el-Fe,orb-4d_0] [--iso 0.03] [--size 200] [--q 0.64]
 *       atoms (011 Q3): [--cut camera|none|x,y,z] [--cutl all|0,1] [--style signed|glassSigned] [--res 128] [--aiso 0.03] [--own]
 *       trials: [--out DIR] (no manifest) [--orbs 1s,2s,7s] [--nuclei FILE] (each tile's nucleus, for tools/tile-layers.py)
 *
 * THE LOOK (a molecule, Josh's words: "density mode in Signed with a somewhat fat ISO, all in HSV colouring"; an atom, Josh 10-18: the
 *   signed Im view, the HSV wheel turned by l — s 0° · p 45° · d 90° · f 135° — and EXPOSURE 0.5, "so that the shells are a little see through"):
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
 * ELEMENTS (el-<symbol>): THE HIGHEST ORBITAL alone (Josh 10-18) — the highest occupied subshell (011 Q3: highest n, then highest l) and
 *   its last electron's m from lab/valence.js (the rule the Picker's caption line reads), amplitude 1, drawn as hydrogen's PURE orbital
 *   (011 Q3; --own: each element's own ATOM state, 008 A7's road) and cut through the nucleus facing THE CORNER's eye, so its n − l
 *   radial layers are rings.  A press on the tile still opens goAtom's fillValence (every valence subshell, every m, in phase; 008 Q).
 * SUBSHELLS (orb-<nl>_<m>): hydrogen's one state (n, l, m) for every m of the subshells past Kr up to n = 6 (once the dimmed elements'
 *   pictures); since iteration 008 A7 no tile shows these, they stay rendered in the same look.
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
import { valenceOf } from '../lab/valence.js';

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const ISO = +arg('iso', 0.03), AISO = +arg('aiso', ISO), SIZE = +arg('size', 200), Q = +arg('q', 0.64), AQ = +arg('aq', 50), RENDER = +arg('render', 640);
const EXPOSURE = +arg('exposure', 0.5);                      // the atoms: half the dial's 1, so a shell is a little see-through (Josh 10-18)
/* THE HALF-CUT (iteration 011 Q3, Josh 10-19: "the layered s orbitals … don't seem to satisfyingly show that layer it is"): the clip
   plane through the nucleus (the MATERIAL window's CLIP, pos 0) — `camera` faces THE CORNER's eye, (1, 1, 1)/√3, so the cut face is seen
   whole; or an explicit normal 'x,y,z' (iteration 008's '0,0,1'), or 'none'.  --cutl: which l are cut ('all', the default: every tile; '0' the s tiles alone) */
const CUT_ARG = arg('cut', 'camera'), CUT = CUT_ARG === 'none' ? null : CUT_ARG === 'camera' ? [1, 1, 1].map((x) => x / Math.sqrt(3)) : CUT_ARG.split(',').map(Number);
const CUT_L = arg('cutl', 'all') === 'all' ? [0, 1, 2, 3] : arg('cutl').split(',').map(Number);
const ATOM_STYLE = arg('style', 'signed');                   // the atoms' DRAW STYLE: SIGNED, or SHELL ± (iteration 010 X7, 'glassSigned')
const RES = +arg('res', 128);
const DOMAIN_K = +arg('domain', 1);                         // the hydrogen box as a share of DOMAIN AUTO's (hydrogen.js domainFor(n)): DOMAIN AUTO off and the knob turned, as a hand would                                // the GRID (SETTINGS · QUALITY's seg, 64 · 96 · 128): the finest, so an inner layer is not one voxel
const HUE_BY_L = [0, 0.125, 0.25, 0.375];                    // the atoms: the HSV wheel turned by l — every s at 0°, p 45°, d 90°, f 135° (SIGNED paints ± at hue ± 90°, so quarter turns would pair s with d and p with f)
/* an atom's one state (n, l, m) in the register at amplitude 1 (reg.set is re, im): m = 0 purely imaginary so the Im view holds R·Y_l0 (real,
   it would draw nothing); m ≠ 0 real, so Im ψ = R·P_lm·sin(mφ) — the real orbital's lobes, not the torus |ψ|² makes */
const cutOf = (l) => (CUT && CUT_L.includes(l) ? CUT : null);
const ATOM_LOOK = (n, l, m) => `const i = H.stateOf(${n}, ${l}, ${m}).index; LW.reg.clear(); LW.reg.set(i, ${m === 0 ? '0, 1' : '1, 0'}); LW.setMute(i, false);
      LW.setView('imag'); LW.setStyle(${JSON.stringify(ATOM_STYLE)}); LW.mat.iso = ${AISO}; LW.mat.exposure = ${EXPOSURE}; LW.mat.hueShift = ${HUE_BY_L[l]};
      LW.mat.slice = Object.assign(LW.mat.slice || {}, { mode: ${cutOf(l) ? 1 : 0}, pos: 0 }); ${cutOf(l) ? `LW.mat.slice.normal = ${JSON.stringify(cutOf(l))};` : 'delete LW.mat.slice.normal;'}
      if (LW.hamiltonian === 'hydrogen' && ${DOMAIN_K} !== 1) { LW.domain.auto = false; LW.domain.half = ${DOMAIN_K} * H.domainFor(${n}); } else LW.domain.auto = true; LW.schedule(LW.TIER.REBUILD);`;
const only = arg('only', '') ? arg('only', '').split(',') : null;
const VOL = arg('volume', null), VDIR = VOL && (process.env.LW_VOLUMES || homedir() + '/Documents/LAMBDAWAVES-VOLUMES') + '/dist/' + VOL + '/';
const sets = VOL ? ['volume'] : arg('set', 'molecules,elements,orbitals').split(',');
const MENU = new URL('../lab/img/menu/', import.meta.url).pathname, OUT = VOL ? VDIR + 't/' : arg('out', null) ? arg('out').replace(/\/?$/, '/') : MENU; mkdirSync(OUT, { recursive: true });   // --out DIR: a trial run elsewhere (no manifest)
const SUBSHELLS = arg('orbs', null) ? arg('orbs').split(',').map((t) => [+t[0], 'spdf'.indexOf(t[1])]) : [[5, 0], [4, 2], [5, 1], [6, 0], [4, 3], [5, 2], [6, 1], [5, 3], [6, 2]];   // the valence subshells of Rb … Og, n ≤ 6 — since iteration 008 A7 every element H–Og is live (el-), so no tile shows these; 7s and 7p are not rendered (no dimmed element names them)
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
  window.__res = { res: LW.quality.res, steps: LW.quality.steps, scale: LW.quality.scale, gov: LW.governor.on };
  LW.governor.on = false; LW.quality.res = ${RES}; LW.quality.steps = { 64: 110, 96: 160, 128: 240 }[${RES}] || 240; LW.quality.scale = 1; LW.schedule(LW.TIER.REBUILD);   // SETTINGS · QUALITY's GRID, as its seg sets it
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
    return { b64: btoa(s), bytes: buf.length, box: [x0, y0, x1, y1], nucleus: [(W / 2 - cx) / side + 0.5, (H / 2 - cy) / side + 0.5] };   // the origin is the frame's centre (THE CORNER looks at it): where it lands on the tile, 0…1
  };
  return true;`);

const prior = existsSync(OUT + 'manifest.json') ? JSON.parse(readFileSync(OUT + 'manifest.json', 'utf8')) : {};
const made = { molecules: [], elements: [], orbitals: [] }, nuclei = {}; let total = 0;   // --nuclei FILE: where each tile's nucleus sits (tools/tile-layers.py reads it)
/* the browser's WebP keeps the alpha LOSSLESS (no alpha_quality on a canvas); PIL's lossy alpha is about half the bytes at the same look */
const TMP = tmpdir() + '/lw-menu-thumbs-' + process.pid + '-';
const save = (name, r) => { if (!r || r.E || r.empty) { console.log('  ✗', name, r && (r.E || 'empty')); return false; }
  writeFileSync(TMP + name + '.png', Buffer.from(r.b64, 'base64'));
  const py = spawnSync('python3', ['-I', '-c', 'import sys\nfrom PIL import Image\nIm=Image.open(sys.argv[1]).convert("RGBA").resize((int(sys.argv[3]),)*2, Image.LANCZOS)\nIm.save(sys.argv[2], "WEBP", quality=int(sys.argv[4]), alpha_quality=int(sys.argv[5]), method=6)',
    TMP + name + '.png', OUT + name + '.webp', String(SIZE), String(Math.round(Q * 100)), String(AQ)], { encoding: 'utf8' });
  if (py.status !== 0) { console.log('  ✗', name, py.stderr); return false; }
  const b = statSync(OUT + name + '.webp').size; total += b; nuclei[name] = r.nucleus.map((x) => +x.toFixed(4)); console.log('  ✓', name, b, 'B'); return true; };

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

/* ELEMENTS: the highest occupied subshell's (n, l, m) (valence.js) seen from THE CORNER.  Since iteration 011 Q3 (Josh 10-19: "it's really
   just an indicator and visual aid") it is drawn as the PURE orbital — hydrogen's (n, l, m), the same picture for every element that
   shares it (rendered once, written to each el-) — because the atom's own orbital folds its inner layers into the core: under the ATOM
   system Rb 5s, Cs 6s and Fr 7s all show 3 layers on a 200 px tile (Fr's six radial nodes lie within 2.15 bohr of a lobe that reaches 8).
   --own draws each element's own ATOM state instead (iteration 008 A7's road: setElement(Z), the ATOM system). */
if (sets.includes('elements')) {
  const own = process.argv.includes('--own'), cache = new Map();
  await g.ev(`__LW.chem.setOn(false); __LW.setHamiltonian(${JSON.stringify(own ? 'atom' : 'hydrogen')}); __pose(${JSON.stringify(CORNER)}); return true;`);
  for (const a of ATOMS) {
    const name = 'el-' + a.symbol; if (only && !only.includes(name)) continue;
    const v = valenceOf(a.Z), key = v.nl + '_' + v.m;
    const r = !own && cache.has(key) ? cache.get(key) : await g.ev(`const LW = __LW, H = await import('./hydrogen.js');
      ${own ? `LW.setElement(${a.Z}); if (LW.hamiltonian !== 'atom') LW.setHamiltonian('atom');` : ''}
      ${ATOM_LOOK(v.n, v.l, v.m)} __pose(${JSON.stringify(CORNER)});
      await new Promise((r) => setTimeout(r, 700));
      return await __thumb(${2 * SIZE}, ${Q});`);
    if (!own) cache.set(key, r);
    if (save(name, r)) made.elements.push({ sym: a.symbol, Z: a.Z, orbital: key, system: own ? 'atom' : 'hydrogen' });
  }
}

/* SUBSHELLS: ATOMS mode, hydrogen, one state (n, l, m) for every m of each valence subshell, THE CORNER */
if (sets.includes('orbitals')) {
  await g.ev(`__LW.chem.setOn(false); __LW.setHamiltonian('hydrogen'); __pose(${JSON.stringify(CORNER)}); return true;`);
  for (const s of SUBSHELLS) for (let m = -s[1]; m <= s[1]; m++) {
    const name = 'orb-' + nl(s) + '_' + m; if (only && !only.includes(name)) continue;
    const r = await g.ev(`const LW = __LW, H = await import('./hydrogen.js');
      ${ATOM_LOOK(s[0], s[1], m)} __pose(${JSON.stringify(CORNER)});
      await new Promise((r) => setTimeout(r, 700));
      return await __thumb(${2 * SIZE}, ${Q});`);
    if (save(name, r)) made.orbitals.push(nl(s) + '_' + m);
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
await g.ev(`__LW.domain.auto = true; Object.assign(__LW.quality, { res: __res.res, steps: __res.steps, scale: __res.scale }); __LW.governor.on = __res.gov; __LW.schedule(__LW.TIER.REBUILD);
  __LW.mat.exposure = 1; __LW.mat.hueShift = 0; if (__LW.mat.slice) { __LW.mat.slice.mode = 0; delete __LW.mat.slice.normal; } __LW.setView('density'); __pose(__home); return true;`);

/* the manifest keeps what this run did not redo (a --set or --only run updates its own rows only) */
const keepRows = (key, rows, id) => (sets.includes(key) && !only ? rows : [...(prior[key] || []).filter((p) => !rows.some((r) => id(r) === id(p))), ...rows]);
if (!VOL && OUT === MENU) writeFileSync(OUT + 'manifest.json', JSON.stringify({ tool: 'tools/menu-thumbs.mjs', size: SIZE, quality: Q, alphaQuality: AQ, render: RENDER,
  look: { view: 'density', style: 'signed', iso: ISO, palette: 'wheel', frame: false, axis: false, atoms: { view: 'imag', style: ATOM_STYLE, iso: AISO, exposure: EXPOSURE, hueByL: HUE_BY_L, phase: 'm = 0 imaginary, else real', cut: CUT && { l: CUT_L, normal: CUT.map((x) => +x.toFixed(6)), pos: 0, mode: 'clip' }, grid: RES, system: process.argv.includes('--own') ? 'atom (each element its own)' : 'hydrogen (the pure orbital)', subshell: 'highest n, then highest l (lab/valence.js)' }, camera: { molecules: 'home', elements: 'corner (yaw 45°, pitch 35.26°)', orbitals: 'corner (yaw 45°, pitch 35.26°)' }, ground: 'none (two-ground matte)' },
  molecules: keepRows('molecules', made.molecules, (x) => x), elements: keepRows('elements', made.elements, (x) => x.sym), orbitals: keepRows('orbitals', made.orbitals, (x) => x) }, null, 1) + '\n');
if (arg('nuclei', null)) writeFileSync(arg('nuclei'), JSON.stringify(nuclei, null, 1) + '\n');
console.log(`${made.molecules.length} molecules, ${made.elements.length} elements, ${made.orbitals.length} subshells, ${(total / 1024).toFixed(1)} kB`, JSON.stringify((await g.errors()).errs.filter((e) => !/ResizeObserver/.test(e))));
await g.close(); process.exit(0);
