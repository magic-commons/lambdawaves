/* d037-shots.mjs — iteration 037 chain D's pictures (a diagnostic, not a gate).
 *   LW_PORT=9697 GD_PORT=5697 node tools/d037-shots.mjs <scene> <out-dir>
 * Scenes: deck (D2: the MOLECULAR deck in DIAGRAM, dark and light, and THE LOOK DROP open) · csb (D3: MOLECULES' thumbnail of a catalogue
 * molecule in DIAGRAM, both themes) · vol (D4 · D6: VOL. III's view in DIAGRAM and the field looks its sheets carry; needs lab/volumes).
 * Writes JPEGs (python3 + PIL from the driver's PNG) and prints what each scene measured. */
import { writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { open } from './gate/gatekit.mjs';

const scene = process.argv[2] || 'deck', OUT = (process.argv[3] || '.tmp/d-shots').replace(/\/?$/, '/'); mkdirSync(OUT, { recursive: true });
const g = await open(`https://127.0.0.1:${process.env.LW_PORT || 9697}/lab/?menu=1&warn=0`, { width: 1600, height: 1000, script: 120000 });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
/* the driver's PNG → a JPEG, cropped to [x, y, w, h] when given */
const shot = async (name, crop = null) => { const png = OUT + name + '.png'; writeFileSync(png, Buffer.from(await g.snap(), 'base64'));
  const py = spawnSync('python3', ['-I', '-c', 'import sys,json\nfrom PIL import Image\nim=Image.open(sys.argv[1]).convert("RGB")\nc=json.loads(sys.argv[3])\nim=im.crop((c[0],c[1],c[0]+c[2],c[1]+c[3])) if c else im\nim.save(sys.argv[2],quality=84)',
    png, OUT + name + '.jpg', JSON.stringify(crop)], { encoding: 'utf8' }); if (py.status) throw new Error(py.stderr); console.log('  →', OUT + name + '.jpg'); };
const theme = (t) => g.ev(`__LW.look.set({ theme: ${JSON.stringify(t)} }); return 1;`);
const decks = () => g.ev(`const M = document.getElementById('lwMenu'); const d = M.querySelector('.mm-face:not([hidden]) .mm-door[data-door="library"]'); if (d) d.click(); return 1;`);
const tab = (i) => g.ev(`document.querySelectorAll('#lwMenu .mm-tab')[${i}].click(); return 1;`);
const look = (id) => g.ev(`document.querySelector('#lwMenu .mm-lookb').click(); await new Promise((r) => setTimeout(r, 400)); document.querySelector('#lwMenu .mm-lk[data-look="${id}"]').click(); return 1;`);
try {
  if (!(await g.waitFor('window.__LW?.ready && document.querySelector("#lwMenu")', 400, 100)).ok) throw new Error('the lab never came up');
  await wait(1500);
  if (scene === 'deck') {
    await decks(); await wait(900); await tab(1); await wait(900); await look('labels'); await wait(2500);
    for (const t of ['dark', 'light']) { await theme(t); await wait(1200);
      console.log(t, JSON.stringify(await g.ev(`const i = [...document.querySelectorAll('#lwMenu .mm-molecular img.mm-pic')].filter((x) => x.getClientRects().length); return { n: i.length, ink: i.filter((x) => x.classList.contains('pic-ink')).length, loaded: i.filter((x) => x.complete && x.naturalWidth).length, colour: i[0] && getComputedStyle(i[0]).backgroundColor };`)));
      await shot('037-D2-deck-' + t); }
    await g.ev(`document.querySelector('#lwMenu .mm-lookb').click(); return 1;`); await wait(800);
    const r = await g.ev(`const r = document.querySelector('#lwMenu .mm-lookdrop').getBoundingClientRect(); return [r.left, r.top, r.width, r.height].map(Math.round);`);
    await shot('037-D2-drop-light', [Math.max(0, r[0] - 160), Math.max(0, r[1] - 90), r[2] + 320, r[3] + 130]);
  }
  if (scene === 'csb') {   // a catalogue molecule picked by the hand road: MOLECULES' thumbnail in the CSB is its DIAGRAM, in the ink
    await g.ev(`const M = document.getElementById('lwMenu'); if (M && !M.hidden) document.getElementById('lwHome').click(); __LW.chem.setOn(true); await __LW.chem.pick('C6H6'); return 1;`); await wait(4000);
    for (const t of ['dark', 'light']) { await theme(t); await wait(1200);
      const r = await g.ev(`const i = document.querySelector('.mol-pick .mol-thumb'), b = i.getBoundingClientRect(), row = i.closest('.mol-pick').getBoundingClientRect();
        return { src: i.getAttribute('src'), hidden: i.hidden, ink: i.classList.contains('pic-ink'), colour: getComputedStyle(i).backgroundColor, box: [b.left, b.top, b.width, b.height].map(Math.round), row: [row.left, row.top, row.width, row.height].map(Math.round) };`);
      console.log(t, JSON.stringify(r));
      await shot('037-D3-csb-' + t, [Math.max(0, r.row[0] - 24), Math.max(0, r.row[1] - 24), r.row[2] + 48, r.row[3] + 48]); }
  }
  console.log(JSON.stringify((await g.errors()).errs.filter((e) => !/ResizeObserver/.test(e))));
} catch (e) { console.log('FAIL ' + (e && e.message)); process.exitCode = 1; }
await g.close();
