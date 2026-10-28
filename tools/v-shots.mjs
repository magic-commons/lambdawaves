/* v-shots.mjs — iteration 021 chain V: the cramped-space sheet and the icon sites (a diagnostic, not a gate; 022's baseline).
 *   LW_PORT=9683 GD_PORT=5683 node tools/v-shots.mjs <tag> [scene,…]
 * Scenes: stage-1600 · icons-1600 (bar · Picker · FINDER · NODES cards + its add menu) · options-1280 · keyboard-1280 · nodes-1280 ·
 * stage-1366 · stage-1280 · stage-1024 · stage-800 · phone.  Each writes research/iteration-021/V-shots/<tag>-<scene>[-part].jpg (python PIL)
 * and prints what it measured: the bar's rect against every open float, and the icon census (mask-image / --ico uses, <svg> in icon seats). */
import { writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { open } from './gate/gatekit.mjs';

const TAG = process.argv[2] || 'shot', DIR = 'research/iteration-021/V-shots';
const ALL = ['stage-1600', 'icons-1600', 'options-1280', 'keyboard-1280', 'nodes-1280', 'stage-1366', 'stage-1280', 'stage-1024', 'stage-800', 'phone'];
const SCENES = process.argv[3] ? process.argv[3].split(',') : ALL;
const SIZE = { 'stage-1600': [1600, 1000], 'icons-1600': [1600, 1000], 'options-1280': [1280, 720], 'keyboard-1280': [1280, 720], 'nodes-1280': [1280, 720],
  'stage-1366': [1366, 768], 'stage-1280': [1280, 720], 'stage-1024': [1024, 768], 'stage-800': [800, 600], phone: [390, 844] };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const jpg = (png, name, crop) => { const p = `.tmp/v-${name}.png`; writeFileSync(p, Buffer.from(png, 'base64'));
  execFileSync('python3', ['-I', '-c', `import sys
from PIL import Image
i = Image.open(sys.argv[1]).convert('RGB'); c = sys.argv[3]
if c: i = i.crop(tuple(max(0, int(float(v))) for v in c.split(',')))
i.save(sys.argv[2], quality=70)`, p, `${DIR}/${TAG}-${name}.jpg`, crop ? crop.join(',') : '']); };
/* the bar against every open float: which overlap it */
const BAR = `const r = (e) => { const b = e.getBoundingClientRect(); return [b.left, b.top, b.right, b.bottom].map(Math.round); };
  const t = document.getElementById('transport'), bar = t && t.offsetWidth ? r(t) : null, floats = [];
  for (const w of document.querySelectorAll('.mir-win:not([hidden]), .dev.floating')) { if (!w.offsetWidth) continue;
    const b = r(w); floats.push({ id: w.dataset.mirWindow || w.dataset.id, rect: b, over: !!bar && b[0] < bar[2] && b[2] > bar[0] && b[1] < bar[3] && b[3] > bar[1] }); }
  return { vw: innerWidth, vh: innerHeight, bar, body: document.body.className, floats,
    racks: [...document.querySelectorAll('.rack')].filter((k) => k.offsetWidth).map((k) => ({ side: k.dataset.side, rect: r(k) })) };`;
const CENSUS = `let masks = 0, ico = 0; const where = [];
  for (const e of document.querySelectorAll('*')) for (const pse of [null, '::before', '::after']) { const s = getComputedStyle(e, pse);
    const m = s.maskImage || s.webkitMaskImage || ''; if (/url\\(/.test(m)) { masks++; if (where.length < 12) where.push((e.id || (e.className && e.className.baseVal !== undefined ? e.className.baseVal : e.className) || e.tagName) + (pse || '')); }
    if (s.getPropertyValue('--ico').trim() || s.getPropertyValue('--icon').trim()) ico++; }
  const seats = [...document.querySelectorAll('.csb-ico-b, #rackToggle, #rackFav, .mm-ico, .wp-glyph, .nodes-ico, .mb-icon, .lw-icon, .mir-win-glyph, .dev-glyph')];
  const isSvg = (e) => e.tagName.toLowerCase() === 'svg' || !!e.querySelector('svg');
  return { masks, ico, where, seats: seats.length, svg: seats.filter(isSvg).length,
    empty: seats.filter((e) => !isSvg(e)).map((e) => String(e.className.baseVal !== undefined ? e.className.baseVal : e.className)).slice(0, 12) };`;
for (const scene of SCENES) {
  const [width, height] = SIZE[scene];
  const g = await open(`https://127.0.0.1:${process.env.LW_PORT || 9683}/lab/?starter=home`, { width, height });
  try {
    if (!(await g.waitFor('window.__LW?.ready', 400, 100)).ok) throw new Error('the lab never came up');
    await wait(1500);
    const run = (id) => g.ev(`__LW.run(${JSON.stringify(id)}); return 1;`);
    const info = {};
    if (scene === 'options-1280') { await run('gui'); await wait(1200); }
    if (scene === 'keyboard-1280') { await run('help'); await wait(1200); }
    if (scene === 'nodes-1280') { await run('nodes'); await wait(1200); }
    if (scene === 'icons-1600') {
      info.census = await g.ev(CENSUS);
      const bar = await g.ev(`const b = document.getElementById('transport').getBoundingClientRect(); return [b.left - 90, b.top - 8, b.right + 8, b.bottom + 8].map(Math.round);`);
      jpg(await g.snap(), scene + '-bar', bar);
      await run('windowPicker'); await wait(900);
      const fr = await g.ev(`const b = document.querySelector('.mir-window-picker').getBoundingClientRect(); return [b.left - 4, b.top - 4, b.right + 4, b.bottom + 4].map(Math.round);`);
      info.finder = await g.ev(CENSUS); jpg(await g.snap(), scene + '-finder', fr);
      await run('windowPicker'); await wait(500);
      await run('menu'); await wait(1800); info.picker = await g.ev(CENSUS); jpg(await g.snap(), scene + '-picker');
      await run('menu'); await wait(900);
      await g.ev(`__LW.nodes.setHas(true); for (const t of ['grain', 'blur', 'hue', 'vignette', 'levels']) __LW.nodes.add(t); return 1;`);
      await run('nodes'); await wait(1200);
      await g.ev(`document.querySelector('.mir-win[data-mir-window="nodes"] .nodes-add')?.click(); return 1;`); await wait(600);
      const nr = await g.ev(`const b = document.querySelector('.mir-win[data-mir-window="nodes"]').getBoundingClientRect(); return [b.left - 4, b.top - 4, b.right + 4, b.bottom + 4].map(Math.round);`);
      info.nodes = await g.ev(CENSUS); jpg(await g.snap(), scene + '-nodes', nr);
    } else {
      info.bar = await g.ev(BAR);
      jpg(await g.snap(), scene);
    }
    console.log(scene, JSON.stringify(info), JSON.stringify((await g.errors()).errs).slice(0, 300));
  } catch (e) { console.log(scene, 'FAILED', e.message); } finally { await g.close(); }
}
