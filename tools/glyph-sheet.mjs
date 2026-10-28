/* glyph-sheet.mjs — iteration 022 chain E2: the contact sheet of EVERY glyph the app can draw — the kit's table and λWAVES' own (lab/icons.js,
 * through the kit's registerGlyphs) — at 16, 20 and 24 px, on light and on dark: the icons' picture loop and Gemini's brief (a diagnostic, not a gate).
 *   LW_PORT=9675 GD_PORT=5675 node tools/glyph-sheet.mjs
 * Writes research/iteration-022/E-shots/glyphs-{16,20,24}-{light,dark}.png (python PIL crops the driver's picture); λWAVES' names are tinted
 * the accent, the kit's the ink, each with its name under it.  The sheet is built by a module script in the PAGE's realm (the driver's own
 * script realm has a module map of its own, where no app glyph is registered). */
import { writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { open } from './gate/gatekit.mjs';

const DIR = 'research/iteration-022/E-shots';
mkdirSync(DIR, { recursive: true });
const g = await open(`https://127.0.0.1:${process.env.LW_PORT || 9675}/lab/?starter=home`, { width: 1400, height: 1000 });
const SHEET = (theme, px) => `import * as G from '/lab/mir/glyph.js';
  const app = new Set(G.appGlyphNames()), names = [...G.glyphNames().filter((n) => !app.has(n)), ...app];
  const ink = '${theme}' === 'light' ? ['#f4f6f8', '#1b2430', '#0b7a75'] : ['#11161c', '#e8edf2', '#5fd3c8'];
  document.getElementById('glyphSheet')?.remove(); const s = document.createElement('div'); s.id = 'glyphSheet';
  s.style.cssText = 'position:fixed;left:0;top:0;z-index:2147483647;display:grid;grid-template-columns:repeat(14,96px);gap:2px 0;padding:10px;background:' + ink[0] + ';font:9px/1.2 system-ui,sans-serif';
  for (const n of names) { const c = document.createElement('div'); c.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:3px;height:${px + 22}px;color:' + (app.has(n) ? ink[2] : ink[1]);
    c.innerHTML = G.glyphSvg(n).replace('<svg', '<svg width="${px}" height="${px}"'); const t = document.createElement('span'); t.textContent = n; t.style.color = ink[1]; c.append(t); s.append(c); }
  document.body.append(s); s.dataset.done = names.length + ',' + app.size;`;
try {
  if (!(await g.waitFor('window.__LW?.ready', 400, 100)).ok) throw new Error('the lab never came up');
  for (const theme of ['light', 'dark']) for (const px of [16, 20, 24]) {
    const box = await g.ev(`document.getElementById('glyphSheet')?.remove(); const m = document.createElement('script'); m.type = 'module'; m.textContent = ${JSON.stringify(SHEET(theme, px))}; document.head.append(m);
      for (let i = 0; i < 100 && !document.getElementById('glyphSheet')?.dataset.done; i++) await new Promise((r) => setTimeout(r, 50));
      const s = document.getElementById('glyphSheet'), b = s.getBoundingClientRect(); return [0, 0, Math.ceil(b.right), Math.ceil(b.bottom), ...s.dataset.done.split(',')];`);
    await new Promise((r) => setTimeout(r, 300));
    const png = `.tmp/glyphs-${px}-${theme}.png`; writeFileSync(png, Buffer.from(await g.snap(), 'base64'));
    execFileSync('python3', ['-I', '-c', 'import sys\nfrom PIL import Image\nImage.open(sys.argv[1]).crop(tuple(int(v) for v in sys.argv[3].split(","))).save(sys.argv[2])',
      png, `${DIR}/glyphs-${px}-${theme}.png`, box.slice(0, 4).join(',')]);
    console.log(`glyphs-${px}-${theme}.png: ${box[4]} glyphs (${box[5]} λWAVES')`);
  }
} finally { await g.close(); }
