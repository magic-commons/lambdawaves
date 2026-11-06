/* f038-shots.mjs — iteration 038 chain F's one check per row and its pictures (a diagnostic, not a gate).
 *   LW_PORT=9693 GD_PORT=5693 node tools/f038-shots.mjs <scene> [out-dir]
 * Scenes: f1 (THE BLACK PIXELS: pure-black pixels at ZOOM max with a light set, hydrogen and benzene, SHELL ± · SHELL · GLASS) · f2 (THE SKELETON
 * KEEPS ITS COLOUR: the balls and sticks under HUE and INVERT) · f3 (THE CLIP'S TOGGLE: the cut and the uncut atoms) · f4 (IM A QUARTER TURN:
 * hydrogen 2p₀ in Re, Im and arg ψ) · f5 (THE OBJECT MASK: the alpha the field writes).  JPEGs into <out-dir> (default .tmp/F-shots). */
import { writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { open } from './gate/gatekit.mjs';

const scene = process.argv[2] || 'f1', DIR = process.argv[3] || '.tmp/F-shots';
mkdirSync('.tmp', { recursive: true }); mkdirSync(DIR, { recursive: true });
const W = 1500, H = 950;
const g = await open(`https://127.0.0.1:${process.env.LW_PORT || 9693}/lab/?starter=home&warn=0&sw=0`, { width: W, height: H,
  prefs: { 'ui.primaryPointerCapabilities': 6, 'ui.allPointerCapabilities': 6 } });
/** a readPixels picture (rgba, w × h) as a JPEG: the field alone, no page */
function jpeg(name, px, w, h, bpr) {
  const raw = `.tmp/f-${name}.rgba`; const out = Buffer.alloc(w * h * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < w * 4; x++) out[y * w * 4 + x] = px[y * bpr + x];
  writeFileSync(raw, out);
  execFileSync('python3', ['-I', '-c', `import sys
from PIL import Image
im = Image.frombytes('RGBA', (int(sys.argv[3]), int(sys.argv[4])), open(sys.argv[1], 'rb').read()).convert('RGB'); im.save(sys.argv[2], quality=84)`, raw, `${DIR}/${name}.jpg`, String(w), String(h)]);
  return `${DIR}/${name}.jpg`;
}
async function shot(name, box) {
  const png = `.tmp/f-${name}.png`; writeFileSync(png, Buffer.from(await g.snap(), 'base64'));
  execFileSync('python3', ['-I', '-c', `import sys
from PIL import Image
im = Image.open(sys.argv[1]).convert('RGB'); b = sys.argv[3]
if b != '-': x0, y0, x1, y1 = (int(v) for v in b.split(',')); im = im.crop((x0, y0, min(x1, im.width), min(y1, im.height)))
if im.width > 1200: im = im.resize((1200, round(im.height * 1200 / im.width)))
im.save(sys.argv[2], quality=84)`, png, `${DIR}/${name}.jpg`, box ? box.map(Math.round).join(',') : '-']);
  return `${DIR}/${name}.jpg`;
}
/* the page's helpers: a pinned readPixels of a material over a pose, and the count of pure-black pixels in it */
const HELP = `window.__F = {
  px: async (o, m, w, h) => { const F = __LW.field; F.stats.presents = 13; const r = await F.readPixels(o, m, w, h, true); return r; },
  black: (r) => { let n = 0; for (let y = 0; y < r.h; y++) for (let x = 0; x < r.w; x++) { const i = y * r.bpr + x * 4; if (!r.px[i] && !r.px[i + 1] && !r.px[i + 2]) n++; } return n; },
}; return 1;`;
const out = {};
try {
  if (!(await g.waitFor('window.__LW?.ready', 400, 100)).ok) throw new Error('the lab never came up: ' + JSON.stringify((await g.errors()).errs));
  await g.ev(`__LW.loadPreset('1s+2pz'); __LW.pause(); await __LW.settle(); ${HELP}`);
  const molecule = async (id) => { await g.ev(`__LW.verbs.run([{ verb: 'molecule', args: { id: ${JSON.stringify(id)} } }], { who: 'SHOTS' }); return 1;`);
    await g.waitFor('window.__LW.chem.on && window.__LW.chem.solution()', 900, 200); await g.ev(`await __LW.settle(); await __LW.settle(); return 1;`); };
  if (scene === 'f1') {
    /* the check: pure-black (0,0,0) pixels at 960 × 600 over a light stage, the frame and axes off — Re ψ, SHELL ± / SHELL / CLOUD + GLASS / SOLID, RIM 0.2 (a
       light off its home: THE LEGACY GATE open) at ZOOM's near end (dist 1) and 1.2, 1.5 and home; then benzene's density the same */
    const run = (tag) => g.ev(`const L = __LW, o0 = JSON.parse(JSON.stringify(L.obs)), res = {};
      for (const [k, m] of Object.entries({ shellPM: { style: 8 }, shell: { style: 6 }, glass: { style: 0, finish: 'glass' }, solid: { style: 1 }, cloud: { style: 0 } }))
        for (const d of [1, 1.2, 1.5, 3.3]) { const mm = { ...L.mat, view: 2, frame: false, axis: false, dither: 0, light: { rim: 0.2 }, ...m }, o = { ...o0, dist: d };
          res[k + '@' + d] = __F.black(await __F.px(o, mm, 960, 600)); }
      { const mm = { ...L.mat, view: 2, style: 8, frame: false, axis: false, dither: 0 }; delete mm.light; res['shellPM-nolight@1'] = __F.black(await __F.px({ ...o0, dist: 1 }, mm, 960, 600)); }
      return res;`);
    out.hydrogen = await run('h');
    await molecule('C6H6');
    await g.ev(`__LW.chem.setView('density'); await __LW.settle(); return 1;`);
    out.benzene = await run('mol');
    { const r = await g.ev(`const L = __LW, mm = { ...L.mat, view: 2, style: 8, frame: false, axis: false, dither: 0, light: { rim: 0.2 } }; const r = await __F.px({ ...L.obs, dist: 1 }, mm, 960, 600); return { px: Array.from(r.px), bpr: r.bpr };`);
      out.pic = jpeg('038-F1-benzene-zoommax-rim', r.px, 960, 600, r.bpr); }
    out.total = Object.values(out.hydrogen).concat(Object.values(out.benzene)).reduce((a, b) => a + b, 0);
    out.ok = out.total === 0;
  }
} catch (e) { out.error = String(e && e.stack || e); }
finally { await g.close(); }
console.log(JSON.stringify(out, null, 1));
process.exit(out.ok ? 0 : 1);
