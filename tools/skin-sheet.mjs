/* skin-sheet.mjs — iteration 022 chain S's picture loop (a diagnostic, not a gate): one contact sheet per skin × theme, and the ink.
 *   LW_PORT=9677 GD_PORT=5677 node tools/skin-sheet.mjs <tag> [look,…] [--css <file>]
 * Looks: lambdawaves-light (the first run) · lambdawaves-dark · frost|morph|classic|swift|aurora|neon - light|dark (default: all 14).
 * Each sheet (1600 × 1000): SETTINGS and WAVE open on the rack, NODES and MIR OPTIONS floating, the bar expanded, the WINDOW menu open
 * and a hover hint shown; written to research/iteration-022/S-shots/<tag>/<look>.jpg.  --css injects a sheet last (live token tuning).
 * THE INK, measured from the picture: a menu row's text and the hint tip's text against the pane under them (the median pixel of the
 * row's box; the ink is the computed colour composited over it), and the menu pane against the stage beside it (the edge); WCAG ratios. */
import { writeFileSync, readFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { open } from './gate/gatekit.mjs';
import * as drv from './gate/drv.mjs';

const args = process.argv.slice(2), css = args.includes('--css') ? readFileSync(args[args.indexOf('--css') + 1], 'utf8') : '';
const pos = args.filter((a, i) => !a.startsWith('--') && args[i - 1] !== '--css');
const TAG = pos[0] || 'shot', DIR = `research/iteration-022/S-shots/${TAG}`;
const ALL = ['lambdawaves', 'frost', 'morph', 'classic', 'swift', 'aurora', 'neon'].flatMap((s) => [s + '-light', s + '-dark']);
const LOOKS = pos[1] ? pos[1].split(',') : ALL;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
mkdirSync(DIR, { recursive: true });
/* the page side: where the ink is.  A row's ink is its first text-bearing element's colour; its box is the row's. */
const MEASURE = `const box = (e) => { const b = e.getBoundingClientRect(); return [b.left, b.top, b.right, b.bottom].map(Math.round); };
  const inkOf = (e) => { const w = document.createTreeWalker(e, NodeFilter.SHOW_TEXT); let t; while ((t = w.nextNode())) if (t.textContent.trim()) return getComputedStyle(t.parentElement).color; return getComputedStyle(e).color; };
  const list = [...document.querySelectorAll('#menubar .mb-list, .mb-list')].find((l) => l.offsetWidth && !l.hidden);
  const rows = list ? [...list.querySelectorAll('.mb-item')].filter((r) => r.offsetWidth && r.textContent.trim()).slice(0, 3) : [];
  const tip = document.getElementById('controlHelp'), tipOn = tip && !tip.hidden && tip.offsetWidth;
  const lb = list && list.getBoundingClientRect();
  return { rows: rows.map((r) => ({ box: box(r), ink: inkOf(r) })), pane: list ? box(list) : null,
    stage: lb ? [Math.round(lb.right + 24), Math.round(lb.top + 20), Math.round(lb.right + 64), Math.round(lb.top + 80)] : null,
    tip: tipOn ? { box: box(tip), ink: inkOf(tip), text: tip.textContent.slice(0, 40) } : null,
    text: document.body.dataset.text || null, card: document.body.dataset.card, preset: __LW.look.preset() };`;
/* the picture side (python PIL): median pane colour per box, the ink over it, the ratio */
const PY = `import sys, json
from PIL import Image
im = Image.open(sys.argv[1]).convert('RGB'); m = json.loads(sys.argv[2])
def med(b):
    x0, y0, x1, y1 = [max(0, int(v)) for v in b]; px = list(im.crop((x0 + 2, y0 + 1, max(x0 + 3, x1 - 2), max(y0 + 2, y1 - 1))).getdata())
    return [sorted(p[i] for p in px)[len(px) // 2] for i in range(3)] if px else [0, 0, 0]
def lum(c):
    f = lambda v: v / 12.92 if v <= .04045 else ((v + .055) / 1.055) ** 2.4
    r, g, b = [f(v / 255) for v in c]; return .2126 * r + .7152 * g + .0722 * b
def ratio(a, b):
    la, lb = sorted([lum(a), lum(b)], reverse=True); return round((la + .05) / (lb + .05), 2)
def ink(s, bg):
    v = [float(x) for x in s[s.index('(') + 1:s.index(')')].replace('/', ',').split(',')]; a = v[3] if len(v) > 3 else 1
    return [v[i] * a + bg[i] * (1 - a) for i in range(3)]
out = {}
if m['rows']:
    rs = [ratio(ink(r['ink'], med(r['box'])), med(r['box'])) for r in m['rows']]; out['row'] = min(rs); out['rowBg'] = med(m['rows'][0]['box'])
if m['pane'] and m['stage']:
    x0, y0, x1, y1 = m['pane']; h = y1 - y0; st = med(m['stage'])
    rim = [sorted(im.getpixel((x0, y)) for y in range(y0 + h // 4, y1 - h // 4))[(h // 2) // 2]]
    out['fill'] = ratio(med(m['pane']), st); out['rim'] = ratio(list(rim[0]), st); out['edge'] = max(out['fill'], out['rim'])
if m['tip']: bg = med(m['tip']['box']); out['tip'] = ratio(ink(m['tip']['ink'], bg), bg); out['tipBg'] = bg
print(json.dumps(out))`;
const g = await open(`https://127.0.0.1:${process.env.LW_PORT || 9677}/lab/?starter=home`, { width: 1900, height: 1100 });
let n = 0;
const hover = (x, y) => drv.actions(g.s, [{ type: 'pointer', id: 'sk' + (++n), parameters: { pointerType: 'mouse' }, actions: [
  { type: 'pointerMove', duration: 0, origin: 'viewport', x: 700, y: 20 }, { type: 'pointerMove', duration: 60, origin: 'viewport', x: Math.round(x), y: Math.round(y) }] }]);
const py = (src, ...a) => execFileSync('python3', ['-I', '-W', 'ignore', '-c', src, ...a]).toString();
try {
  if (!(await g.waitFor('window.__LW?.ready', 400, 100)).ok) throw new Error('the lab never came up');
  await wait(1500);
  if (css) await g.ev(`const s = document.createElement('style'); s.id = 'skinSheetLive'; s.textContent = ${JSON.stringify(css)}; document.head.append(s); return 1;`);
  /* the scene, once: SETTINGS and WAVE unfolded on the rack, NODES and MIR OPTIONS floating */
  await g.ev(`for (const id of ['settings', 'observer']) { const d = document.querySelector('.dev[data-id="' + id + '"]'); if (d && d.classList.contains('folded')) d.querySelector('.dev-fold').click(); }
    __LW.run('nodes'); __LW.run('gui'); return 1;`);
  await wait(1200);
  await g.ev(`const place = (sel, x, y) => { const w = document.querySelector(sel); if (w) { w.style.left = x + 'px'; w.style.top = y + 'px'; } };
    place('.mir-win[data-mir-window="gui"]', 450, 50); place('.mir-win[data-mir-window="nodes"]', 10, 110); return 1;`);
  await wait(600);
  const FLOATS = `document.querySelectorAll('.mir-win[data-mir-window="gui"], .mir-win[data-mir-window="nodes"]').forEach((w) => { w.style.visibility = %s; });`;
  for (const look of LOOKS) {
    const [skin, theme] = look.split('-');
    await g.ev(`const th = __LW.look.presetList.find((p) => p.id === ${JSON.stringify(skin)}); __LW.look.set({ ...th.values, ...th.tones[0].values }); __LW.look.set({ theme: ${JSON.stringify(theme)} }); return 1;`);
    await wait(1200);
    /* A · the windows and a hover hint (a real hover over WAVE's first knob) */
    await g.ev(FLOATS.replace('%s', "''") + ' return 1;');
    const k = await g.ev(`const k = document.querySelector('.dev[data-id="observer"] .k[data-help], .dev[data-id="observer"] [data-help]'); if (!k) return null; const b = k.getBoundingClientRect(); return [b.left + b.width / 2, b.top + b.height / 2];`);
    if (k) { await hover(k[0], k[1]); await wait(1400); }
    const mA = await g.ev(MEASURE);
    const pA = `.tmp/skin-${TAG}-${look}-a.png`; writeFileSync(pA, Buffer.from(await g.snap(), 'base64'));
    await hover(960, 600); await wait(200);
    /* B · the bar expanded and the WINDOW menu open, the floats hidden */
    await g.ev(FLOATS.replace('%s', "'hidden'") + ` const ex = document.querySelector('#transport .tr-expand'); if (ex && ex.getAttribute('aria-expanded') !== 'true') ex.click(); return 1;`);
    await wait(700);
    await g.ev(`__LW.layout.menu.open(); const btn = [...document.querySelectorAll('#menubar .mb-btn')].find((b) => b.dataset.menu === 'WINDOW'); if (btn) btn.click(); return 1;`);
    await wait(700);
    const mB = await g.ev(MEASURE);
    const pB = `.tmp/skin-${TAG}-${look}-b.png`; writeFileSync(pB, Buffer.from(await g.snap(), 'base64'));
    const ink = JSON.parse(py(PY, pB, JSON.stringify({ ...mB, tip: null })));
    if (mA.tip) Object.assign(ink, (({ tip, tipBg }) => ({ tip, tipBg }))(JSON.parse(py(PY, pA, JSON.stringify({ rows: [], pane: null, stage: null, tip: mA.tip })))));
    py(`import sys
from PIL import Image
a, b = Image.open(sys.argv[1]).convert('RGB'), Image.open(sys.argv[2]).convert('RGB'); s = .62
a = a.resize((int(a.width * s), int(a.height * s)), Image.LANCZOS); b = b.resize((int(b.width * s), int(b.height * s)), Image.LANCZOS)
c = Image.new('RGB', (a.width, a.height + b.height + 6), (128, 128, 128)); c.paste(a, (0, 0)); c.paste(b, (0, a.height + 6)); c.save(sys.argv[3], quality=70)`, pA, pB, `${DIR}/${look}.jpg`);
    console.log(JSON.stringify({ look, ...ink, text: mB.text, card: mB.card, preset: mB.preset, tipText: mA.tip && mA.tip.text, rowInk: mB.rows[0] && mB.rows[0].ink, tipInk: mA.tip && mA.tip.ink }));
    await g.ev(`const btn = [...document.querySelectorAll('#menubar .mb-btn')].find((b) => b.dataset.menu === 'WINDOW'); if (btn && btn.getAttribute('aria-expanded') === 'true') btn.click();
      document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); const ex = document.querySelector('#transport .tr-expand'); if (ex && ex.getAttribute('aria-expanded') === 'true') ex.click(); return 1;`);
    await wait(400);
  }
  console.log('errors', JSON.stringify((await g.errors()).errs).slice(0, 300));
} finally { await g.close(); }
