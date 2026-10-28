/* csb-sheet.mjs — iteration 022 chain C's picture loop (a diagnostic, not a gate): the CONTROL SURFACE collapsed and EXPANDED in its seats.
 *   LW_PORT=9683 GD_PORT=5683 node tools/csb-sheet.mjs <before|after>
 * Seats: STAGE at 1600 and at 840, docked (RACK) and FREE at 1600; looks: the first run (lambdawaves light) and MORPH dark.  Three macros
 * and five favourites are put in first (the store `lambdawaves.q0.csb`, then a reload), so the sections have something to show.  Writes one
 * JPEG per look × seat × state into research/iteration-022/C-shots/<tag>/ and prints each seat's heights and any inner scroller. */
import { writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { open } from './gate/gatekit.mjs';

const TAG = process.argv[2] || 'shot', DIR = `research/iteration-022/C-shots/${TAG}`, wait = (ms) => new Promise((r) => setTimeout(r, ms));
const FAVS = ['material.exposure', 'material.gamma', 'observer.dist', 'palette.invert', 'wave.space'];
mkdirSync(DIR, { recursive: true });
const BOX = `const T = document.getElementById('transport'), host = T.closest('.dev, .mir-win') || T, P = T.querySelector('.native-tempo');
  const u = [host, T.querySelector('.csb-play')].filter(Boolean).map((e) => e.getBoundingClientRect());
  const box = [Math.min(...u.map((b) => b.left)), Math.min(...u.map((b) => b.top)), Math.max(...u.map((b) => b.right)), Math.max(...u.map((b) => b.bottom))].map(Math.round);
  const scrollers = P && !P.hidden ? [...P.querySelectorAll('*')].filter((e) => e.scrollHeight > e.clientHeight + 1 && /auto|scroll/.test(getComputedStyle(e).overflowY)).map((e) => e.className) : [];
  return { place: T.dataset.place || (T.classList.contains('docked') ? 'rack' : 'stage'), box, bar: Math.round(T.getBoundingClientRect().height), w: Math.round(T.getBoundingClientRect().width),
    host: Math.round(host.getBoundingClientRect().height), panel: P && !P.hidden ? Math.round(P.getBoundingClientRect().height) : 0, scrollers };`;
async function seats(width, places) {
  const g = await open(`https://127.0.0.1:${process.env.LW_PORT || 9683}/lab/?starter=home`, { width, height: 1000 });
  try {
    if (!(await g.waitFor('window.__LW?.ready', 400, 100)).ok) throw new Error('the lab never came up');
    await g.ev(`localStorage.setItem('lambdawaves.q0.csb', JSON.stringify({ v: 1, items: ${JSON.stringify(FAVS)} })); location.reload(); return 1;`).catch(() => {});
    await wait(1500); await g.waitFor('window.__LW?.ready', 400, 100); await wait(1500);
    await g.ev(`for (let i = 0; i < 3; i++) __LW.mod.addMacro(); return 1;`);
    for (const look of ['lambdawaves-light', 'morph-dark']) {
      const [skin, theme] = look.split('-');
      if (skin !== 'lambdawaves') await g.ev(`const th = __LW.look.presetList.find((p) => p.id === '${skin}'); __LW.look.set({ ...th.values, ...th.tones[0].values }); __LW.look.set({ theme: '${theme}' }); return 1;`);
      for (const place of places) {
        for (let i = 0; i < 3 && (await g.ev(`const T = document.getElementById('transport'); return T.dataset.place || (T.classList.contains('docked') ? 'rack' : 'stage');`)) !== place; i++) {
          await g.ev(`document.querySelector('#transport .dock-btn').click(); return 1;`); await wait(900); }
        await g.ev(`const T = document.getElementById('transport'); (T.closest('.dev') || T).scrollIntoView({ block: 'start' }); return 1;`); await wait(600);
        for (const state of ['collapsed', 'expanded']) {
          if (state === 'expanded') { await g.ev(`document.querySelector('#transport .tr-expand').click(); return 1;`); await wait(900); }
          const m = await g.ev(BOX), png = `.tmp/csb-${TAG}.png`, name = `${look}-${place}-${width}-${state}`;
          writeFileSync(png, Buffer.from(await g.snap(), 'base64'));
          execFileSync('python3', ['-I', '-c', `import sys
from PIL import Image
x0, y0, x1, y1 = [int(v) for v in sys.argv[2].split(',')]; im = Image.open(sys.argv[1]).convert('RGB')
im.crop((max(0, x0 - 12), max(0, y0 - 12), min(im.width, x1 + 12), min(im.height, y1 + 12))).save(sys.argv[3], quality=78)`, png, m.box.join(','), `${DIR}/${name}.jpg`]);
          console.log(name.padEnd(40), JSON.stringify({ bar: m.bar, w: m.w, host: m.host, panel: m.panel, scrollers: m.scrollers }));
        }
        await g.ev(`document.querySelector('#transport .tr-expand').click(); return 1;`); await wait(600);
      }
    }
    console.log('errors', JSON.stringify((await g.errors()).errs).slice(0, 300));
  } finally { await g.close(); }
}
await seats(1600, ['stage', 'rack', 'free']);
await seats(840, ['stage']);
