/* x-probe.mjs — iteration 020 chain X's probes and pictures (a diagnostic, not a gate).
 *   LW_PORT=9677 GD_PORT=5677 node tools/x-probe.mjs <scene> [--shot name]
 * Each scene runs in one Firefox page; it prints what it measured and, with --shot, writes the NODES window (cropped, JPEG) to
 * research/iteration-020/X-shots/<name>.jpg.  Scenes: x0 (the empty slate + the + menu) · x1 (a box selection at 1.5×) · x2 (a collapsed card,
 * its preview strip, a right-click menu) · x3 (VIEW HERE lit) · x4 (a masked node; CURVES alone is byte-identical — the describe() proof) */
import { writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { open } from './gate/gatekit.mjs';

const scene = process.argv[2] || 'x0', si = process.argv.indexOf('--shot'), SHOT = si > 0 ? process.argv[si + 1] : null;
const URL = `https://127.0.0.1:${process.env.LW_PORT || 9677}/lab/?warn=0`;
const g = await open(URL, { width: 1600, height: 1000 });
const W = '[data-mir-window="nodes"] ';
const PRE = `const w = (n) => new Promise((r) => setTimeout(r, n)), N = __LW.nodes, $ = (s) => document.querySelector('${W}' + s), $$ = (s) => [...document.querySelectorAll('${W}' + s)];
  const key = (k, o = {}) => $('.nodes-ground').dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true, ...o }));`;
const SCENES = {
  x0: `__LW.layout.finder.open(); await w(300); document.querySelector('.mir-window-picker .wp-row[data-win="nodes"]').click(); await w(800);
    const finder = { win: N.win.isOpen(), card: !document.querySelector('.dev[data-id="nodes"]').classList.contains('closed') }; N.win.place({ x: 480, y: 70, w: 620, h: 720 }); await w(300); N.views[1].place(); await w(300); const empty = { list: N.nodes().length, line: $('.nodes-empty').textContent, shown: !$('.nodes-empty').hidden };
    $('.nodes-add').click(); await w(200); const menu = { items: $$('.nodes-item[data-type]').length, seps: $$('.nodes-sep').length, icons: $$('.nodes-item .nodes-ico').length, focus: document.activeElement.className };
    const f = $('.nodes-find'); f.value = 'blu'; f.dispatchEvent(new Event('input')); const found = $$('.nodes-item').filter((i) => !i.hidden).map((i) => i.dataset.type || i.dataset.graph);
    f.value = ''; f.dispatchEvent(new Event('input')); await w(200);
    return { finder, empty, menu, found };`,
};
try {
  if (!(await g.waitFor('window.__LW?.ready', 400, 100)).ok) throw new Error('the lab never came up: ' + JSON.stringify(await g.errors()));
  await g.ev(`__LW.pause(); await __LW.settle(); return 1;`);
  const info = await g.ev(PRE + SCENES[scene]);
  if (SHOT) {
    const r = await g.ev(`const r = document.querySelector('${W.trim()}').getBoundingClientRect(); return [r.left, r.top, r.width, r.height].map(Math.round);`);
    mkdirSync('research/iteration-020/X-shots', { recursive: true });
    const png = '.tmp/x-' + SHOT + '.png'; mkdirSync('.tmp', { recursive: true }); writeFileSync(png, Buffer.from(await g.snap(), 'base64'));
    execFileSync('python3', ['-I', '-c', `import sys; from PIL import Image; x,y,w,h=map(int,sys.argv[3:7]); Image.open(sys.argv[1]).convert('RGB').crop((max(0,x-8),max(0,y-8),x+w+8,y+h+8)).save(sys.argv[2], quality=72)`,
      png, `research/iteration-020/X-shots/${SHOT}.jpg`, ...r.map(String)]);
  }
  console.log(JSON.stringify({ scene, info, errors: (await g.errors()).errs }, null, 1));
} finally { await g.close(); }
