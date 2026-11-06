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
  if (scene === 'f2') {
    /* the check: benzene's balls and sticks with the cloud at EXPOSURE 0 (the march adds nothing, the pixel is the atom or the stage): HUE 0.5 and INVERT
       leave the picture's hash as it was; a light off its home (RIM 0.4) moves it.  Then the picture: the cloud on, HUE 0.5 + INVERT (the cloud turns, the atoms are CPK) */
    await molecule('C6H6');
    await g.ev(`__LW.mat.atomSize = 0.35; __LW.mat.stickR = 0.3; __LW.schedule(4); await __LW.settle(); await __LW.settle(); return 1;`);
    out.hash = await g.ev(`const L = __LW, base = { ...L.mat, view: 1, style: 0, exposure: 0, frame: false, axis: false, dither: 0, hueShift: 0, invert: false }; delete base.light;
      const h = async (m) => (await __F.px(L.obs, { ...base, ...m }, 640, 400)).hash;
      return { plain: await h({}), hue: await h({ hueShift: 0.5 }), invert: await h({ invert: true }), both: await h({ hueShift: 0.5, invert: true }), rim: await h({ light: { rim: 0.4 } }) };`);
    for (const [tag, m] of [['plain', '{ hueShift: 0, invert: false }'], ['hue-invert', '{ hueShift: 0.25, invert: true }']]) {
      const r = await g.ev(`const L = __LW, mm = { ...L.mat, view: 1, style: 0, frame: false, axis: false, dither: 0, ...${m} }; delete mm.light; const r = await __F.px({ ...L.obs, dist: 1.7 }, mm, 640, 400); return { px: Array.from(r.px), bpr: r.bpr };`);
      out['pic-' + tag] = jpeg('038-F2-benzene-' + tag, r.px, 640, 400, r.bpr);
    }
    const H = out.hash; out.ok = H.plain === H.hue && H.plain === H.invert && H.plain === H.both && H.plain !== H.rim;
  }
  if (scene === 'f4') {
    /* the check: hydrogen 2p₀ alone, PALETTE ON, CLOUD — at t = 0 (ψ real) Re ψ's picture is arg ψ's to the level (+ at arg 0, − at π); at t = 4π
       (ψ = iφ) Im ψ's is arg ψ's (+ at +π/2, − at −π/2); before, both took −π/2 · +π/2.  Then the picture: t = 2π (ψ = e^{iπ/4}φ), arg ψ · Re ψ · Im ψ */
    const tag = process.argv[4] || 'after';
    await g.ev(`const L = __LW; L.loadPreset('2pz'); L.pause(); L.clock.scrub(0); await L.settle(); return { palette: L.paletteId, lut: !!L.field.paletteLUT().lut };`);
    const at = (t) => g.ev(`const L = __LW; L.pause(); L.clock.scrub(${t}); L.schedule(4); await L.settle(); await L.settle();
      const m = { ...L.mat, paletteOn: true, style: 0, frame: false, axis: false, dither: 0, hueShift: 0, invert: false }; delete m.light;
      const o = {}; for (const [k, v] of [['arg', 1], ['re', 2], ['im', 3]]) { const r = await __F.px(L.obs, { ...m, view: v }, 400, 400); o[k] = { px: Array.from(r.px), bpr: r.bpr, hash: r.hash }; } return o;`);
    const maxd = (a, b) => { let d = 0; for (let i = 0; i < a.px.length; i++) if ((i & 3) !== 3) d = Math.max(d, Math.abs(a.px[i] - b.px[i])); return d; };
    const t0 = await at(0), t4 = await at(4 * Math.PI), t2 = await at(2 * Math.PI);
    out.check = { reVsArgAt0: maxd(t0.re, t0.arg), imVsArgAt4pi: maxd(t4.im, t4.arg), reVsImAt2pi: maxd(t2.re, t2.im) };
    /* the three side by side (arg · Re · Im), 1200 × 400 */
    const W3 = 1200, bpr = t2.arg.bpr, row = new Uint8Array(W3 * 400 * 4);
    [t2.arg, t2.re, t2.im].forEach((p, k) => { for (let y = 0; y < 400; y++) for (let x = 0; x < 400 * 4; x++) row[y * W3 * 4 + k * 1600 + x] = p.px[y * bpr + x]; });
    out.pic = jpeg('038-F4-2p0-arg-re-im-' + tag, row, W3, 400, W3 * 4);
    out.ok = out.check.reVsArgAt0 <= 2 && out.check.imVsArgAt4pi <= 2;
  }
  if (scene === 'f3') {
    /* the check: benzene's balls and sticks at EXPOSURE 0 (the picture is the atoms alone) — the CLIP on cuts them as before; CUT BALLS and CUT STICKS off
       draw them exactly as the CLIP off does (CLIP and SLAB); one kind off leaves the other cut.  The switches: hidden under hydrogen, shown under
       MOLECULES, a real press writes the key and a second press takes it away.  Then the pictures: the cloud on, CLIP on, cut and uncut */
    out.hydrogenRow = await g.ev(`__LW.layout.reopen('clip'); await new Promise((r) => setTimeout(r, 300)); const r = document.querySelector('.dev[data-id="clip"] .clip-cut'); return r ? r.hidden : 'missing';`);
    await molecule('C6H6');
    await g.ev(`__LW.mat.atomSize = 0.35; __LW.mat.stickR = 0.3; __LW.schedule(4); await __LW.settle(); await __LW.settle(); return 1;`);
    out.hash = await g.ev(`const L = __LW, base = { ...L.mat, view: 1, style: 0, exposure: 0, frame: false, axis: false, dither: 0 }; delete base.light;
      const h = async (slice) => (await __F.px({ ...L.obs, dist: 1.7 }, { ...base, slice }, 640, 400)).hash, clip = { mode: 1, axis: 2, pos: 0.02, thick: 0.03, normal: [0.6, 0, 0.8] };
      return { off: await h({ ...clip, mode: 0 }), cut: await h(clip), uncut: await h({ ...clip, balls: false, sticks: false }), slabCut: await h({ ...clip, mode: 2, thick: 0.05 }),
        slabUncut: await h({ ...clip, mode: 2, thick: 0.05, balls: false, sticks: false }), ballsOnly: await h({ ...clip, balls: false }), sticksOnly: await h({ ...clip, sticks: false }) };`);
    out.press = await g.ev(`const d = document.querySelector('.dev[data-id="clip"]'); if (d.classList.contains('folded')) d.querySelector('.dev-fold').click(); await new Promise((r) => setTimeout(r, 300));
      const row = d.querySelector('.clip-cut'), [b, s] = row.querySelectorAll('button.sw'); const seen = { shown: !row.hidden, words: [b.textContent, s.textContent], hints: [b.title, s.title], lit: [b.classList.contains('on'), s.classList.contains('on')] };
      b.click(); seen.afterBalls = { ...__LW.mat.slice }; s.click(); seen.afterSticks = { ...__LW.mat.slice }; b.click(); s.click(); seen.back = { ...__LW.mat.slice }; return seen;`);
    for (const [tag, cut] of [['cut', '{}'], ['uncut', '{ balls: false, sticks: false }']]) {
      const r = await g.ev(`const L = __LW, mm = { ...L.mat, view: 1, style: 0, frame: false, axis: false, dither: 0, slice: { mode: 1, axis: 2, pos: 0.02, thick: 0.03, normal: [0.6, 0, 0.8], ...${cut} } }; delete mm.light;
        const r = await __F.px({ ...L.obs, dist: 1.7 }, mm, 640, 400); return { px: Array.from(r.px), bpr: r.bpr };`);
      out['pic-' + tag] = jpeg('038-F3-benzene-clip-' + tag, r.px, 640, 400, r.bpr);
    }
    const H = out.hash, P = out.press;
    out.ok = out.hydrogenRow === true && H.cut !== H.off && H.uncut === H.off && H.slabUncut === H.off && H.slabCut !== H.off && H.ballsOnly !== H.cut && H.ballsOnly !== H.off && H.sticksOnly !== H.cut && H.sticksOnly !== H.off
      && P.shown && P.lit.every(Boolean) && P.afterBalls.balls === false && P.afterSticks.sticks === false && !('balls' in P.back) && !('sticks' in P.back);
  }
} catch (e) { out.error = String(e && e.stack || e); }
finally { await g.close(); }
console.log(JSON.stringify(out, null, 1));
process.exit(out.ok ? 0 : 1);
