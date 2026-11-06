/* v037-shots.mjs — iteration 037 chain V's light checks and pictures (a diagnostic, not a gate).
 *   LW_PORT=9699 GD_PORT=5699 node tools/v037-shots.mjs <scene> [out-dir]
 * Scenes: v1 (the windows' own pictures, hashed at a fixed t: the seam changes nothing a window shows) · v2 (the visualizer kinds paint on the
 * stage with every window closed, follow the clock, and stand down under H) · v4 (each widget over SOLID and CLOUD, dark and light) · mgr (the
 * manager's gallery).  V_KINDS picks the kinds, V_WINS the windows (v1), V_MOL=1 solves benzene first, V_STATES=1 shows the REGISTRY's STATES pane.
 * JPEGs into <out-dir> (default .tmp/V-shots). */
import { writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { open } from './gate/gatekit.mjs';

const scene = process.argv[2] || 'v1', DIR = process.argv[3] || '.tmp/V-shots', URL0 = `https://127.0.0.1:${process.env.LW_PORT || 9699}/lab/?starter=home&menu=0`;
const KINDS = (process.env.V_KINDS || 'shadow,bloch,lattice,orbit,wigner,plane,emission,equalizer,spectrum,orbitals,states').split(',');
const WIN = { plane: 'slice', orbitals: 'chem', states: 'chem' };   // a kind's window, where its id differs
mkdirSync('.tmp', { recursive: true }); mkdirSync(DIR, { recursive: true });
const g = await open(URL0, { width: 1500, height: 950 });
async function shot(name, box) {
  const png = `.tmp/v-${name}.png`; writeFileSync(png, Buffer.from(await g.snap(), 'base64'));
  execFileSync('python3', ['-I', '-c', `import sys
from PIL import Image
im = Image.open(sys.argv[1]).convert('RGB'); b = sys.argv[3]
if b != '-': im = im.crop(tuple(int(v) for v in b.split(',')))
if im.width > 1200: im = im.resize((1200, round(im.height * 1200 / im.width)))
im.save(sys.argv[2], quality=78)`, png, `${DIR}/${name}.jpg`, box ? box.map(Math.round).join(',') : '-']);
  return `${DIR}/${name}.jpg`;
}
/* a canvas's pixels: an FNV-1a hash and the inked count (alpha > 0), in the page */
const PIX = `const pix = (c) => { if (!c || !c.width || !c.height) return { h: 0, ink: 0, w: c ? c.width : -1 }; const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let h = 2166136261, ink = 0;
  for (let i = 0; i < d.length; i++) { h = Math.imul(h ^ d[i], 16777619) >>> 0; if ((i & 3) === 3 && d[i]) ink++; } return { h: h.toString(16), ink, w: c.width, hh: c.height }; };`;
const boot = async () => { if (!(await g.waitFor('window.__LW?.ready', 400, 100)).ok) throw new Error('the lab never came up: ' + JSON.stringify((await g.errors()).errs));
  await g.ev(`__LW.pause(); return 1;`); };
const out = {};
try {
  await boot();
  if (scene === 'v1') {   /* the four windows open at t = 0, then t = 3: each window canvas hashed (equal before and after the seam) */
    const CV = { shadow: '.shadow-c', bloch: '.ladder-c canvas', lattice: '.ladder-c canvas', orbit: '.orbit-c', wigner: '.wig-c', slice: '.slice-c', emission: '.em-strip', equalizer: '.eq-grid', spectrum: '.ladder canvas', chem: process.env.V_SEL || 'canvas.mol-c:not(.reg-ladder)' };
    const wins = (process.env.V_WINS || 'shadow,bloch,lattice,orbit').split(',');
    out.win = await g.ev(`${PIX} __LW.windowActivity.presentOffscreen(true); __LW.seek(0); ${process.env.V_MOL ? `await __LW.chem.solve('C6H6'); __LW.chem.setOn(true);` : ''} for (const id of ${JSON.stringify(wins)}) __LW.actions.run('window.' + id + '.open'); ${process.env.V_STATES ? `__LW.register.setMode('states');` : ''}
      await new Promise((r) => setTimeout(r, ${+process.env.V_WAIT || 1500})); __LW.seek(3); await __LW.settle(); await new Promise((r) => setTimeout(r, 1500)); const o = {};
      for (const id of ${JSON.stringify(wins)}) o[id] = pix(document.querySelector('.dev[data-id="' + id + '"] ' + ${JSON.stringify(CV)}[id])); return o;`);
    out.ok = Object.values(out.win).every((p) => p.ink > 0);
  }
  if (scene === 'v2') {   /* every window closed: each kind's widget paints, a second of play moves its picture, H stands it down */
    out.add = await g.ev(`${PIX} __LW.seek(0); ${process.env.V_MOL ? `await __LW.chem.solve('C6H6'); __LW.chem.setOn(true);` : ''} ${process.env.V_STATES ? `__LW.register.setMode('states'); await new Promise((r) => setTimeout(r, ${+process.env.V_WAIT || 1500}));` : ''} for (const id of ${JSON.stringify([...new Set(KINDS.map((k) => WIN[k] || k))])}) __LW.actions.run('window.' + id + (id === 'chem' ? '.fold' : '.close'));   // MOLECULES folds: its close turns the molecule off
      __LW.widgets.restore(null); const ids = {}; for (const k of ${JSON.stringify(KINDS)}) ids[k] = __LW.widgets.add(k);
      await new Promise((r) => setTimeout(r, 1500)); await __LW.settle(); const ch = document.querySelector('.dev[data-id="chem"]');
      if (${KINDS.some((k) => WIN[k] === 'chem')} && ch && !ch.classList.contains('folded')) __LW.actions.run('window.chem.fold'); await new Promise((r) => setTimeout(r, 900));
      const cv = (k) => document.querySelector('#widgets .lw-widget[data-id="' + ids[k] + '"] canvas'), a = {}; for (const k in ids) a[k] = pix(cv(k));
      __LW.play(); await new Promise((r) => setTimeout(r, 1500)); __LW.pause(); await __LW.settle(); await new Promise((r) => setTimeout(r, 600));
      const b = {}; for (const k in ids) b[k] = pix(cv(k));
      const bg = getComputedStyle(document.querySelector('#widgets .lw-widget')).backgroundColor, P = __LW.perf || {}, work = {}; for (const k in ids) work[k] = +((P.profile || {})[${JSON.stringify(WIN)}[k] || k] || 0).toFixed(3);
      document.body.classList.add('ui-hidden'); __LW.widgets.root.querySelector('canvas').getContext('2d').clearRect(0, 0, 1e4, 1e4); __LW.play(); await new Promise((r) => setTimeout(r, 600)); __LW.pause();
      const hid = pix(cv(${JSON.stringify(KINDS[0])})).ink; document.body.classList.remove('ui-hidden');
      return { ids, a, b, bg, work, hid, closed: ${JSON.stringify([...new Set(KINDS.map((k) => WIN[k] || k))])}.map((id) => document.querySelector('.dev[data-id="' + id + '"]').classList.contains(id === 'chem' ? 'folded' : 'closed')) };`);
    out.ok = KINDS.every((k) => out.add.a[k].ink > 0) && out.add.bg === 'rgba(0, 0, 0, 0)';
  }
  if (scene === 'v4') {   /* every kind in a grid over the stage (windows closed), SOLID and CLOUD, dark and light; V_MOL=1 puts benzene in MOLECULES first */
    const n = KINDS.length, cols = n > 4 ? 3 : n, rows = Math.ceil(n / cols), W = 0.62 / cols, H = Math.min(0.24, 0.68 / rows - 0.02);   // clear of the racks and the transport
    const items = KINDS.map((k, i) => ({ id: 'w' + (i + 1), kind: k, x: +(0.17 + (i % cols) * W + 0.01).toFixed(4), y: +(0.09 + Math.floor(i / cols) * (H + 0.02)).toFixed(4), w: +(W - 0.02).toFixed(4), h: +H.toFixed(4), opts: {} }));
    await g.ev(`${process.env.V_MOL ? `await __LW.chem.solve('C6H6'); __LW.chem.setOn(true);` : ''} ${process.env.V_STATES ? `__LW.register.setMode('states'); await new Promise((r) => setTimeout(r, 8000));` : ''} for (const id of ['shadow', 'bloch', 'lattice', 'orbit', 'wigner', 'slice', 'emission', 'equalizer', 'spectrum', 'widgets']) __LW.actions.run('window.' + id + '.close'); ${process.env.V_MOL ? `__LW.actions.run('window.chem.fold');` : ''}
      __LW.widgets.restore({ items: ${JSON.stringify(items)} }); __LW.play(); await new Promise((r) => setTimeout(r, 1500)); __LW.pause(); await __LW.settle();
      const ch = document.querySelector('.dev[data-id="chem"]'); if (${!!process.env.V_MOL} && ch && !ch.classList.contains('folded')) __LW.actions.run('window.chem.fold'); await new Promise((r) => setTimeout(r, 600)); return 1;`);
    for (const style of ['solid', 'cloud']) for (const theme of ['dark', 'light']) {
      await g.ev(`__LW.setStyle('${style}'); __LW.look.set({ theme: '${theme}' }); await __LW.settle(); await new Promise((r) => setTimeout(r, 1200)); return 1;`);
      out[style + '-' + theme] = await shot(`037-V4-${process.env.V_TAG || 'all'}-${style}-${theme}`);
    }
  }
  if (scene === 'mgr') {   /* the manager's gallery with every kind registered: its tiles and the card's height */
    out.card = await g.ev(`__LW.widgets.restore(null); __LW.actions.run('window.widgets.open'); await new Promise((r) => setTimeout(r, 900));
      const c = document.querySelector('.dev[data-id="widgets"]'), r = c.getBoundingClientRect();
      return { tiles: [...c.querySelectorAll('.wg-kind')].map((t) => t.textContent.trim()), h: Math.round(r.height), box: [r.left - 8, r.top - 8, r.right + 8, r.bottom + 8] };`);
    out.pic = await shot('037-V4-manager', out.card.box);
  }
  out.errs = (await g.errors()).errs;
} finally { console.log(JSON.stringify(out, null, 1)); await g.close(); }
