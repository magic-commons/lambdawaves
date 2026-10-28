/* edges-probe.mjs — iteration 022 chain E1's light check (a diagnostic, not a gate): the four edges, measured and pictured.
 *   LW_PORT=9675 GD_PORT=5675 node tools/edges-probe.mjs [tag]
 * 1 A GREYED CONTROL KEEPS ITS HINT, `why` first: MOLECULES on, a real mouse over WAVE's MOMENTUM and over a knob CLOUD does not read (ISO).
 * 2 H HOLDS THE WORDS: the formula block's rect before and after HIDE (pictures before/after).  3 THE SWITCH WEARS THE BUSY MARK: aria-busy and
 * the mark sampled each frame from MOLECULES ON until `molSession.selected`.  4 FROST in LIGHT: body[data-text], the label ink against its pane.
 * Pictures: research/iteration-022/E-shots/<tag>-*.jpg (python PIL). */
import { writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { open } from './gate/gatekit.mjs';
import * as drv from './gate/drv.mjs';

const TAG = process.argv[2] || 'e1', DIR = 'research/iteration-022/E-shots';
mkdirSync(DIR, { recursive: true });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const jpg = (png, name, crop) => { const p = `.tmp/e-${name}.png`; writeFileSync(p, Buffer.from(png, 'base64'));
  execFileSync('python3', ['-I', '-c', `import sys
from PIL import Image
i = Image.open(sys.argv[1]).convert('RGB'); c = sys.argv[3]
if c: i = i.crop(tuple(max(0, int(float(v))) for v in c.split(',')))
i.save(sys.argv[2], quality=72)`, p, `${DIR}/${TAG}-${name}.jpg`, crop ? crop.join(',') : '']); };
const g = await open(`https://127.0.0.1:${process.env.LW_PORT || 9675}/lab/?starter=home`, { width: 1600, height: 1000 });
let n = 0;
const hover = (x, y) => drv.actions(g.s, [{ type: 'pointer', id: 'ep' + (++n), parameters: { pointerType: 'mouse' }, actions: [
  { type: 'pointerMove', duration: 0, origin: 'viewport', x: 800, y: 500 }, { type: 'pointerMove', duration: 60, origin: 'viewport', x: Math.round(x), y: Math.round(y) }] }]);
const out = {};
try {
  if (!(await g.waitFor('window.__LW?.ready', 400, 100)).ok) throw new Error('the lab never came up');
  await wait(1200);
  /* 3 · the switch, from a cold molecule: sample every frame */
  out.switch = await g.ev(`const C = __LW.chem, t0 = performance.now(), seen = { busy: 0, mark: 0, frames: 0 };
    const drawn = () => { const s = __LW.molsession.state(); return !!s.selected && !!s.molecule && s.last.model === s.selected && s.last.hash === s.molecule.hash; };
    C.setOn(true); seen.busyAtPress = !!document.querySelector('#lwMode [aria-busy="true"]'); while ((!drawn() || document.querySelector('[aria-busy="true"]')) && performance.now() - t0 < 20000) { await new Promise((r) => requestAnimationFrame(r));
      seen.frames++; if (document.querySelector('#lwMode [data-id="molecules"][aria-busy="true"]')) seen.busy++; if (__LW.busy.visible) seen.mark++; }
    const ms = Math.round(performance.now() - t0); await new Promise((r) => setTimeout(r, 120));
    return { ms, ...seen, after: !!document.querySelector('[aria-busy="true"]'), markAfter: __LW.busy.visible };`);
  await g.ev(`await __LW.settle(); const d = document.querySelector('.dev[data-id="observer"]'); if (d && d.classList.contains('folded')) d.querySelector('.dev-fold').click(); __LW.setStyle('cloud'); return 1;`);
  await wait(900);
  /* 1 · the greyed controls' hints, under a real mouse */
  for (const [name, sel, word] of [['momentum', '.dev[data-id="observer"] .seg-b', 'MOMENTUM'], ['iso', '.dev[data-id="observer"] .k', 'ISO']]) {
    const r = await g.ev(`const e = [...document.querySelectorAll(${JSON.stringify(sel)})].find((x) => x.textContent.trim().startsWith(${JSON.stringify(word)})); if (!e) return null; e.scrollIntoView({ block: 'center' }); const b = e.getBoundingClientRect();
      return { x: b.left + b.width / 2, y: b.top + b.height / 2, disabled: e.disabled || e.classList.contains('disabled'), hit: e.contains(document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2)) };`);
    if (!r) { out[name] = 'not found'; continue; }
    await hover(r.x, r.y); await wait(900);
    out[name] = { ...r, tip: await g.ev(`const t = document.getElementById('controlHelp'); return t && !t.hidden ? t.textContent : null;`) };
    const tb = await g.ev(`const t = document.getElementById('controlHelp').getBoundingClientRect(); return [Math.min(t.left, ${r.x}) - 60, Math.min(t.top, ${r.y}) - 40, Math.max(t.right, ${r.x}) + 60, Math.max(t.bottom, ${r.y}) + 40];`);
    jpg(await g.snap(), 'hint-' + name, tb);
  }
  await hover(800, 500);
  /* 2 · H holds the words */
  const rect = `const b = document.querySelector('.mir-info.lw-stage .mir-info-block'); if (!b) return null; const r = b.getBoundingClientRect(); return [r.left, r.top, r.width, r.height].map(Math.round);`;
  out.words = { shown: await g.ev(rect) }; jpg(await g.snap(), 'hide-before');
  await g.ev(`__LW.run('hide'); return 1;`); await wait(1400);
  out.words.hidden = await g.ev(rect); jpg(await g.snap(), 'hide-after');
  await g.ev(`__LW.run('hide'); return 1;`); await wait(900);
  /* 4 · FROST in LIGHT and DARK: the ink on a window label against its pane's computed colour */
  for (const theme of ['light', 'dark']) {
    await g.ev(`const th = __LW.look.presetList.find((p) => p.id === 'frost'); __LW.look.set({ ...th.values, ...th.tones[0].values }); __LW.look.set({ theme: '${theme}' }); return 1;`); await wait(1200);
    out['frost-' + theme] = await g.ev(`const l = document.querySelector('.dev[data-id="observer"] .k-lbl'); return { text: document.body.dataset.text || null, preset: __LW.look.preset(),
      ink: getComputedStyle(l).color, fg: getComputedStyle(document.body).getPropertyValue('--fg').trim(), soft: getComputedStyle(document.body).getPropertyValue('--fg-soft').trim() };`);
    const w = await g.ev(`const b = document.querySelector('.dev[data-id="observer"]').getBoundingClientRect(); return [b.left - 10, b.top - 10, b.right + 10, Math.min(innerHeight, b.top + 420)];`);
    jpg(await g.snap(), 'frost-' + theme, w);
  }
  console.log(JSON.stringify(out, null, 1), JSON.stringify((await g.errors()).errs).slice(0, 300));
} finally { await g.close(); }
