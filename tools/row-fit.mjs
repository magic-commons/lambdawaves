/* row-fit.mjs — iteration 022 chain F's probe (a diagnostic, not a gate): A ROW FITS.
 *   LW_PORT=9687 GD_PORT=5687 node tools/row-fit.mjs <tag> [window …]
 * On the 300-px racks of a 1600 × 1600 page, opens each of the twelve windows ALONE (open · reset · solo, every inner fold open; SPECTRUM
 * as HYDROGEN, GAS as SPECTRUM's BOX, MOLECULES on), then NODES and the CONTROL SURFACE expanded, and prints per window
 * rows · controls · cells wrapped · height (the `.dev`'s offsetHeight), and per row of ≥ 2 controls: class · n · lines · wrapped ·
 * height · width · the smallest knob face. A picture per window goes to research/iteration-022/F-shots/<tag>/<name>.jpg. */
import { writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { open } from './gate/gatekit.mjs';

const [TAG = 'now', ...ONLY] = process.argv.slice(2), DIR = `research/iteration-022/F-shots/${TAG}`, wait = (ms) => new Promise((r) => setTimeout(r, ms));
const PAGE = (w) => `[...document.querySelectorAll('.dev[data-id="settings"] .seg-b')].find((b) => b.textContent.trim() === '${w}').click()`;
const ALL = [['settings', 'settings', PAGE('DISPLAY')], ['settings', 'settings-q', PAGE('QUALITY'), '', PAGE('DISPLAY')], ['palette'], ['observer', 'wave'], ['observer', 'wave-esp', `__LW.chem.setOn(true); setTimeout(() => __LW.setStyle('esp'), 3000)`, '', `__LW.setStyle('cloud'); __LW.chem.setOn(false)`], ['camera'], ['clip'], ['spectrum', 'spectrum', `__LW.setHamiltonian('hydrogen')`],
  ['spectrum', 'gas', `__LW.setHamiltonian('well')`], ['informational'], ['staticfield', 'field'], ['equalizer'],
  ['chem', 'molecules', `__LW.chem.setOn(true)`, '', `__LW.chem.setOn(false)`], ['nodes', 'nodes', `__LW.nodes.add('levels'); __LW.nodes.add('invert')`, '.mir-win:has(.nodes-host)'],
  ['transport', 'csb', `const x = document.querySelector('#transport .tr-expand'); if (x && x.getAttribute('aria-expanded') !== 'true') x.click()`, '#transport']];
const CASES = ALL.filter(([id, name]) => !ONLY.length || ONLY.includes(name || id));
mkdirSync(DIR, { recursive: true });
const g = await open(`https://127.0.0.1:${process.env.LW_PORT || 9687}/lab/?starter=home`, { width: 1600, height: 1600 });
const out = [];
try {
  if (!(await g.waitFor('window.__LW?.ready', 400, 100)).ok) throw new Error('the lab never came up');
  await wait(1500);
  for (const [id, name = id, setup = '', sel = '', after = ''] of CASES) {
    await g.ev(`__LW.run('window.${id}.open'); __LW.run('window.${id}.reset'); __LW.run('window.${id}.solo'); ${setup}; return 1;`); await wait(/molecules|esp/.test(name) ? 6000 : 1500);
    await g.ev(`for (const b of document.querySelectorAll('.dev[data-id="${id}"] [data-fold][aria-expanded="false"], #transport [data-fold][aria-expanded="false"]')) b.click(); return 1;`); await wait(1200);
    const r = await g.ev(`const d = document.querySelector(${JSON.stringify(sel || `.dev[data-id="${id}"]`)}); if (!d) return null;
      d.scrollIntoView({ block: 'start', behavior: 'instant' });
      const CTL = '.k, .sw, .segw, .seg, .trig, .ro, .fd', rows = new Map();
      for (const c of d.querySelectorAll(CTL)) { const p = c.parentElement; if (!c.offsetParent || p.closest(CTL)) continue; if (!rows.has(p)) rows.set(p, []); rows.get(p).push(c); }
      const list = [];
      for (const [p, kids] of rows) { if (kids.length < 2) continue;
        const box = kids.map((k) => k.getBoundingClientRect()), line = new Array(kids.length).fill(0); let lines = 0, bottom = -1e9;   // a new line starts below every box of the last
        for (const i of kids.map((_, i) => i).sort((x, y) => box[x].top - box[y].top)) { if (box[i].top >= bottom - 2) { lines++; bottom = box[i].bottom; } else bottom = Math.max(bottom, box[i].bottom); line[i] = lines; }
        const faces = [...p.querySelectorAll(':scope > .k > .k-dial')].map((x) => Math.round(x.getBoundingClientRect().width)), cells = [...p.querySelectorAll(':scope > .k')].map((x) => Math.round(x.getBoundingClientRect().width));
        const W = p.getBoundingClientRect().width, narrow = (k) => k.getBoundingClientRect().width < 0.9 * W;   // a control as wide as its row is a line by design, not a wrap
        list.push({ cls: (p.className || p.tagName).toString().split(' ').slice(0, 3).join('.'), n: kids.length, lines, wrapped: kids.filter((k, i) => line[i] > 1 && narrow(k)).length,
          h: Math.round(p.getBoundingClientRect().height), w: Math.round(W), face: faces.length ? Math.min(...faces) + '–' + Math.max(...faces) + ' in ' + Math.min(...cells) + '–' + Math.max(...cells) : '' }); }
      const b = d.getBoundingClientRect();
      const cut = [...d.querySelectorAll('.k-lbl, .sw-lbl, .trig-l')].filter((e) => e.offsetParent && e.scrollWidth > e.clientWidth + 1).map((e) => e.textContent.trim());
      return { cut, height: d.offsetHeight, width: Math.round(b.width), body: Math.round((d.querySelector('.dev-body') || d).clientWidth), box: [b.left, b.top, b.right, b.bottom].map(Math.round), rows: list };`);
    if (!r) { console.log(name, 'not found'); continue; }
    const wr = r.rows.reduce((s, x) => s + x.wrapped, 0), ctl = r.rows.reduce((s, x) => s + x.n, 0);
    console.log(`${name.padEnd(13)} rows ${String(r.rows.length).padStart(2)} · controls ${String(ctl).padStart(3)} · wrapped ${String(wr).padStart(2)} · height ${r.height} · width ${r.width} · body ${r.body}${r.cut.length ? ' · labels cut: ' + r.cut.join(', ') : ''}`);
    for (const x of r.rows) console.log(`    ${x.cls.padEnd(34).slice(0, 34)} n ${x.n} · lines ${x.lines} · wrapped ${x.wrapped} · h ${x.h} · w ${x.w}${x.face ? ' · face ' + x.face : ''}`);
    out.push({ name, ...r });
    writeFileSync('.tmp/row-fit.png', Buffer.from(await g.snap(), 'base64'));
    execFileSync('python3', ['-I', '-c', `import sys, json
from PIL import Image
b = json.loads(sys.argv[1]); im = Image.open('.tmp/row-fit.png').convert('RGB')
im.crop((max(0, b[0] - 8), max(0, b[1] - 8), min(im.width, b[2] + 8), min(im.height, b[3] + 8))).save(sys.argv[2], quality=70)`, JSON.stringify(r.box), `${DIR}/${name}.jpg`]);
    await g.ev(`__LW.run('window.${id}.reset'); ${after}; return 1;`);
  }
  writeFileSync(`${DIR}/rows.json`, JSON.stringify(out, null, 1));
  console.log('errors', JSON.stringify((await g.errors()).errs).slice(0, 300));
} finally { await g.close(); }
