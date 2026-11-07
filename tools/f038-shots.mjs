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
  if (scene === 'f5') {
    /* the check: benzene's balls and sticks over CLOUD and over ESP.  Mask off: alpha 255 everywhere.  setObjectMask(true): alpha 255 exactly on the
       pixels the atoms cover (the atoms-on minus atoms-off picture, at EXPOSURE 0) and 254 on the rest; the colour moves by ≤ 1 level (premultiplied);
       the frame and axes drawn over it change no alpha; the presented frame raises no GPU error; off again, the picture is the first one to the bit */
    await molecule('C6H6');
    await g.ev(`__LW.mat.atomSize = 0.35; __LW.mat.stickR = 0.3; __LW.schedule(4); await __LW.settle(); await __LW.settle(); return 1;`);
    out.mask = await g.ev(`const L = __LW, F = L.field, o = { ...L.obs, dist: 1.7 }, base = { ...L.mat, view: 1, style: 0, frame: false, axis: false, dither: 0 }; delete base.light;
      const a = (r) => { const n = {}; for (let y = 0; y < r.h; y++) for (let x = 0; x < r.w; x++) { const v = r.px[y * r.bpr + x * 4 + 3]; n[v] = (n[v] || 0) + 1; } return n; };
      const off0 = await __F.px(o, base, 480, 300), noAtoms = await __F.px(o, { ...base, exposure: 0, atomSize: 0, stickR: 0 }, 480, 300), atoms0 = await __F.px(o, { ...base, exposure: 0 }, 480, 300);
      let cover = 0; for (let i = 0; i < noAtoms.px.length; i += 4) if (noAtoms.px[i] !== atoms0.px[i] || noAtoms.px[i + 1] !== atoms0.px[i + 1] || noAtoms.px[i + 2] !== atoms0.px[i + 2]) cover++;
      const was = F.setObjectMask(true); const on = await __F.px(o, base, 480, 300), onLines = await __F.px(o, { ...base, frame: true, axis: true }, 480, 300), esp = await __F.px(o, { ...base, style: 11 }, 480, 300);
      let dmax = 0, dObj = 0; for (let y = 0; y < on.h; y++) for (let x = 0; x < on.w; x++) for (let c = 0; c < 3; c++) { const i = y * on.bpr + x * 4; const d = Math.abs(on.px[i + c] - off0.px[i + c]); dmax = Math.max(dmax, d); if (on.px[i + 3] === 255) dObj = Math.max(dObj, d); }
      L.schedule(4); await L.settle(); await L.settle(); const gpu = F.lastGpuError || null;
      const back = F.setObjectMask(false); const off1 = await __F.px(o, base, 480, 300);
      return { was, state: F.objectMask, off: a(off0), on: a(on), onLines: a(onLines), esp: a(esp), cover, dmax, dObj, gpu, back, same: off1.hash === off0.hash };`);
    { await g.ev(`__LW.field.setObjectMask(true); return 1;`);
      const r = await g.ev(`const L = __LW, mm = { ...L.mat, view: 1, style: 0, frame: false, axis: false, dither: 0 }; delete mm.light; const r = await __F.px({ ...L.obs, dist: 1.7 }, mm, 480, 300);
        const px = Array.from(r.px); for (let i = 0; i < px.length; i += 4) { const k = px[i + 3] === 255; px[i] = px[i + 1] = px[i + 2] = k ? 255 : 30; px[i + 3] = 255; } return { px, bpr: r.bpr };`);
      await g.ev(`__LW.field.setObjectMask(false); return 1;`);
      out.pic = jpeg('038-F5-benzene-object-mask', r.px, 480, 300, r.bpr); }
    /* the page as the reader sees it (the driver composites the real canvas): the mask on and off, compared level by level */
    const page = async (on) => { await g.ev(`__LW.field.setObjectMask(${on}); __LW.schedule(4); await __LW.settle(); await __LW.settle(); await new Promise((r) => setTimeout(r, 300)); return 1;`);
      const p = `.tmp/f-page-${on}.png`; writeFileSync(p, Buffer.from(await g.snap(), 'base64')); return p; };
    const pOff = await page(false), pOn = await page(true); await g.ev(`__LW.field.setObjectMask(false); return 1;`);
    out.pageDiff = execFileSync('python3', ['-I', '-c', `import sys
from PIL import Image, ImageChops
a = Image.open(sys.argv[1]).convert('RGB'); b = Image.open(sys.argv[2]).convert('RGB'); d = ImageChops.difference(a, b)
h = d.convert('L').histogram(); print(max(i for i, n in enumerate(h) if n), sum(n for i, n in enumerate(h) if i > 2))`, pOff, pOn]).toString().trim();
    const M = out.mask;
    /* `cover` is the atoms' footprint read by colour (a pixel whose atom matches the stage is missed), so it may fall a few pixels short of the mask's own */
    out.ok = M.was === true && Object.keys(M.off).join() === '255' && Object.keys(M.on).sort().join() === '254,255' && Math.abs(M.on['255'] - M.cover) <= 0.005 * M.cover
      && M.onLines['255'] === M.on['255'] && (M.esp['255'] || 0) > 0 && M.dmax <= 2 && M.dObj === 0 && !M.gpu && M.back === false && M.same;
  }
  if (scene === 'f6') {
    /* THE FINISH: (a) no black at ZOOM max with a light — arg ψ · Re ψ · Im ψ × SOLID · SHELL ± · CLOUD + GLASS × two lights, hydrogen then benzene;
       (b) CLIP: hydrogen (the row hidden) and benzene (shown) in light and dark, docked in the rack and floated wide — no scroll, the height, the words,
       the hints, the keyboard (Tab from THICK reaches CUT BALLS then CUT STICKS, Space toggles) */
    const LIGHTS = [{ rim: 0.2 }, { az: 180, el: 10, ambient: 0.4, specular: 0.6 }];
    const sweep = () => g.ev(`const L = __LW, o = { ...L.obs, dist: 1 }, res = {};
      for (const [v, vn] of [[1, 'arg'], [2, 're'], [3, 'im']]) for (const [k, m] of Object.entries({ solid: { style: 1 }, shellPM: { style: 8 }, glass: { style: 0, finish: 'glass' } }))
        for (let j = 0; j < ${LIGHTS.length}; j++) { const mm = { ...L.mat, view: v, frame: false, axis: false, dither: 0, ...m, light: ${JSON.stringify(LIGHTS)}[j] };
          res[vn + '/' + k + '/L' + j] = __F.black(await __F.px(o, mm, 960, 600)); }
      return res;`);
    out.blackH = await sweep();
    const card = (theme, tag) => g.ev(`__LW.look.set({ theme: ${JSON.stringify(theme)} }); await new Promise((r) => setTimeout(r, 400));
      const d = document.querySelector('.dev[data-id="clip"]'); if (d.classList.contains('folded')) d.querySelector('.dev-fold').click(); await new Promise((r) => setTimeout(r, 300));
      const b = d.querySelector('.dev-body'), row = d.querySelector('.clip-cut'), r = d.getBoundingClientRect(), sws = row ? [...row.querySelectorAll('button.sw')] : [];
      const wave = document.querySelector('.dev[data-id="observer"]');
      return { tag: ${JSON.stringify(tag)}, rect: [r.left, r.top, r.right, r.bottom].map(Math.round), h: Math.round(r.height), scroll: b.scrollHeight - b.clientHeight, rowHidden: row ? row.hidden : 'missing',
        words: sws.map((s) => s.textContent), upper: sws.every((s) => s.textContent === s.textContent.toUpperCase()), keys: sws.map((s) => s.querySelector('.sw-lbl')?.dataset.t), hints: sws.map((s) => s.dataset.tTitle || s.dataset.helpEn || s.dataset.help || s.title),
        rowFits: row && !row.hidden ? Math.round(row.scrollWidth - row.clientWidth) : null, waveH: wave ? Math.round(wave.getBoundingClientRect().height) : null };`);
    const pic = async (c) => shot('038-F6-clip-' + c.tag, [c.rect[0] - 8, c.rect[1] - 8, c.rect[2] + 8, c.rect[3] + 8]);
    out.cards = [];
    for (const [theme, tag] of [['light', 'hydrogen-light-rack']]) { const c = await card(theme, tag); out.cards.push(c); out['pic-' + tag] = await pic(c); }
    await molecule('C6H6');
    await g.ev(`__LW.mat.atomSize = 0.35; __LW.mat.stickR = 0.3; __LW.schedule(4); await __LW.settle(); return 1;`);
    out.blackMol = await sweep();
    for (const [theme, tag] of [['light', 'benzene-light-rack'], ['dark', 'benzene-dark-rack']]) { const c = await card(theme, tag); out.cards.push(c); out['pic-' + tag] = await pic(c); }
    await g.ev(`__LW.layout.raise('clip'); __LW.layout.popOut('clip', { x: 480, y: 90, w: 560 }); await new Promise((r) => setTimeout(r, 500)); return 1;`);
    { const c = await card('dark', 'benzene-dark-wide'); out.cards.push(c); out['pic-benzene-dark-wide'] = await pic(c); }
    /* the keyboard: focus THICK, a real Tab twice, a real Space on each */
    out.keys = [];
    await g.ev(`document.querySelector('.dev[data-id="clip"] .k[data-param="material.slice.thick"], .dev[data-id="clip"] .clip-plane ~ * .k, .dev[data-id="clip"] .row .k:last-of-type')?.focus(); return document.activeElement && document.activeElement.className;`);
    for (let i = 0; i < 4; i++) { await g.press(''); out.keys.push(await g.ev(`const a = document.activeElement; return a ? (a.textContent || a.getAttribute('aria-label') || a.className).trim().slice(0, 24) : null;`)); if (/CUT BALLS/.test(out.keys[out.keys.length - 1] || '')) break; }
    /* Space is the transport's (PLAY) app-wide, so a focused switch takes Enter */
    await g.press(''); out.afterSpace = await g.ev(`return { ...__LW.mat.slice };`); await g.press(''); out.afterSpace2 = await g.ev(`return { ...__LW.mat.slice };`);
    await g.ev(`__LW.look.set({ theme: 'light' }); return 1;`);
    const allBlack = [...Object.values(out.blackH), ...Object.values(out.blackMol)].reduce((a, b) => a + b, 0);
    out.ok = allBlack === 0 && out.cards[0].rowHidden === true && out.cards.slice(1).every((c) => c.rowHidden === false && c.scroll <= 0 && c.upper && c.hints.every(Boolean) && c.rowFits <= 0)
      && out.afterSpace.balls === false && !('balls' in out.afterSpace2);
  }
  if (scene === 'f7') {
    /* F7 · THE BURIED ATOM: the mask on, benzene's balls and sticks — at EXPOSURE 0 every footprint pixel is 255; under SOLID at ISO 0.02 (the surface
       wraps the carbons) a footprint pixel under the surface reads 254 and one the eye sees reads 255.  CLIP's switches: greyed with their reason while
       the look draws no such kind.  FOR-JOSH: the cloud in front of the atoms under HUE 0 and 0.5 at the default EXPOSURE (one picture).
       First THE TILE: orb-2p₀'s new tile against the same look on the live stage (menu-thumbs' ATOM_LOOK: Im ψ, SIGNED, ISO 0.03, EXPOSURE 0.5, HUE ⅛,
       the wheel, the corner pose, the cut) — the mean colour of the upper and the lower lobe in each */
    out.tile = await g.ev(`const L = __LW, H = await import('./hydrogen.js'), i = H.stateOf(2, 1, 0).index;
      L.palette.select('wheel'); L.palette.setOn(true); L.reg.clear(); L.reg.set(i, 0, 1); L.setMute(i, false); L.setView('imag'); L.setStyle('signed');
      L.mat.iso = 0.03; L.mat.exposure = 0.5; L.mat.hueShift = 0.125; L.mat.slice = Object.assign(L.mat.slice || {}, { mode: 1, pos: 0, normal: [1, 1, 1].map((x) => x / Math.sqrt(3)) });
      L.obs.yaw = Math.PI / 4; L.obs.pitch = Math.asin(1 / Math.sqrt(3)); L.schedule(L.TIER.REBUILD); await L.settle(); await L.settle(); await new Promise((r) => setTimeout(r, 700));
      const halves = (get, w, h, keep) => { const s = [[0, 0, 0, 0], [0, 0, 0, 0]]; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const p = get(x, y); if (!keep(p)) continue; const q = s[y < h / 2 ? 0 : 1]; q[0] += p[0]; q[1] += p[1]; q[2] += p[2]; q[3]++; }
        return s.map((q) => q[3] ? [q[0] / q[3], q[1] / q[3], q[2] / q[3]].map(Math.round) : null); };
      const r = await __F.px(L.obs, { ...L.mat, frame: false, axis: false, dither: 0 }, 400, 400);
      const stage = halves((x, y) => { const o = y * r.bpr + x * 4; return [r.px[o], r.px[o + 1], r.px[o + 2]]; }, 400, 400, (p) => Math.max(...p) - Math.min(...p) > 60);
      const bm = await createImageBitmap(await (await fetch('./img/menu/orb-2p_0.webp', { cache: 'reload' })).blob()), c = new OffscreenCanvas(bm.width, bm.height), cg = c.getContext('2d'); cg.drawImage(bm, 0, 0);
      const d = cg.getImageData(0, 0, bm.width, bm.height).data;
      const tile = halves((x, y) => { const o = (y * bm.width + x) * 4; return [d[o], d[o + 1], d[o + 2], d[o + 3]]; }, bm.width, bm.height, (p) => p[3] > 200);
      L.mat.slice.mode = 0; delete L.mat.slice.normal; return { stage, tile };`);
    { const T = out.tile, dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]); out.tile.match = dist(T.stage[0], T.tile[0]) < dist(T.stage[0], T.tile[1]) && dist(T.stage[1], T.tile[1]) < dist(T.stage[1], T.tile[0]); }
    await molecule('C6H6');
    out.cut0 = await g.ev(`__LW.layout.reopen('clip'); await new Promise((r) => setTimeout(r, 300)); const d = document.querySelector('.dev[data-id="clip"]'); if (d.classList.contains('folded')) d.querySelector('.dev-fold').click();
      const [b, s] = d.querySelectorAll('.clip-cut button.sw'); return { balls: [b.disabled, b.dataset.tTitle || b.dataset.helpEn || b.title], sticks: [s.disabled, s.dataset.tTitle || s.dataset.helpEn || s.title] };`);
    const cutNow = (setup) => g.ev(`const L = __LW, d = document.querySelector('.dev[data-id="clip"]'); ${setup}; await new Promise((r) => setTimeout(r, 200));
      const [b, s] = d.querySelectorAll('.clip-cut button.sw'); const h = (x) => x.title || x.dataset.help || ''; return { balls: [b.disabled, h(b)], sticks: [s.disabled, h(s)] };`);
    out.cutSize = await cutNow(`L.mat.atomSize = 0.35; L.mat.stickR = 0.3; L.setStyle('cloud')`);
    out.cutEsp = await cutNow(`L.setStyle('esp')`);
    out.cutBare = await cutNow(`[...document.querySelectorAll('.dev[data-id="observer"] button.sw')].find((x) => /MAP ONLY/.test(x.textContent)).click()`);
    await g.ev(`const x = [...document.querySelectorAll('.dev[data-id="observer"] button.sw')].find((x) => /MAP ONLY/.test(x.textContent)); if (x.classList.contains('on')) x.click(); __LW.setStyle('cloud'); __LW.schedule(4); await __LW.settle(); await __LW.settle(); return 1;`);
    out.mask = await g.ev(`const L = __LW, F = L.field, o = { ...L.obs, dist: 1.7 }, base = { ...L.mat, view: 0, style: 0, frame: false, axis: false, dither: 0, atomSize: 0.35, stickR: 0.3 }; delete base.light;
      F.setObjectMask(true);
      const foot = await __F.px(o, { ...base, exposure: 0 }, 480, 300), solid = await __F.px(o, { ...base, style: 1, iso: 0.02 }, 480, 300), cloud = await __F.px(o, base, 480, 300);
      F.setObjectMask(false);
      const A = (r, i) => r.px[i + 3]; let n = 0, solid255 = 0, solid254 = 0, cloud255 = 0;
      for (let y = 0; y < foot.h; y++) for (let x = 0; x < foot.w; x++) { const i = y * foot.bpr + x * 4; if (A(foot, i) !== 255) continue; n++; if (A(solid, i) === 255) solid255++; else solid254++; if (A(cloud, i) === 255) cloud255++; }
      return { footprint: n, solid255, solid254, cloud255, keep: { px: Array.from(solid.px), bpr: solid.bpr } };`);
    { const r = out.mask.keep; delete out.mask.keep; const px = r.px.slice(); for (let i = 0; i < px.length; i += 4) { const k = px[i + 3] === 255; px[i] = px[i + 1] = px[i + 2] = k ? 255 : 30; px[i + 3] = 255; }
      out.picMask = jpeg('038-F7-benzene-solid-mask', px, 480, 300, r.bpr); }
    /* FOR-JOSH: HUE 0 · HUE 0.5 side by side, the default EXPOSURE (1), CLOUD, the atoms on */
    const two = await g.ev(`const L = __LW, o = { ...L.obs, dist: 1.7 }, m = { ...L.mat, view: 1, style: 0, exposure: 1, frame: false, axis: false, dither: 0, atomSize: 0.35, stickR: 0.3, invert: false }; delete m.light;
      const a = await __F.px(o, { ...m, hueShift: 0 }, 480, 300), b = await __F.px(o, { ...m, hueShift: 0.5 }, 480, 300); return { a: Array.from(a.px), b: Array.from(b.px), bpr: a.bpr };`);
    { const W2 = 960, row = new Uint8Array(W2 * 300 * 4); [two.a, two.b].forEach((p, k) => { for (let y = 0; y < 300; y++) for (let x = 0; x < 480 * 4; x++) row[y * W2 * 4 + k * 1920 + x] = p[y * two.bpr + x]; });
      out.picHue = jpeg('038-F7-FOR-JOSH-benzene-hue-veil', row, W2, 300, W2 * 4); }
    const M = out.mask;
    out.ok = out.tile.match && M.footprint > 0 && M.solid254 > 0 && M.solid255 > 0 && M.solid255 < M.footprint && out.cut0.balls[0] && out.cut0.sticks[0] && !out.cutSize.balls[0] && !out.cutSize.sticks[0]
      && out.cutEsp.balls[0] && !out.cutEsp.sticks[0] && out.cutBare.sticks[0];
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
