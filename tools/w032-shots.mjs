/* w032-shots.mjs — iteration 032 chain W's pictures (a diagnostic, not a gate).
 *   LW_PORT=9699 GD_PORT=5699 node tools/w032-shots.mjs <scene> [out.png]
 * Scenes: field (H₂O on SHELL with SIZE and RADIUS raised, and WAVE's STYLE row) · bar (the CSB on the stage, docked, popped; the timeline's
 * work bar) · event (an EVENT clip on STYLE, then MOLECULES off).  Writes the driver's composite PNGs and prints what it measured. */
import { writeFileSync } from 'node:fs';
import { open } from './gate/gatekit.mjs';

const scene = process.argv[2] || 'field', OUT = process.argv[3] || `.tmp/w032-${scene}.png`;
const g = await open(`https://127.0.0.1:${process.env.LW_PORT || 9699}/lab/?starter=home`, { width: 1600, height: 1000 });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const shot = async (tag) => { const f = OUT.replace(/\.png$/, tag ? '-' + tag + '.png' : '.png'); writeFileSync(f, Buffer.from(await g.snap(), 'base64')); return f; };
const rect = (sel) => g.ev(`const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return null; const r = e.getBoundingClientRect(); return [r.left, r.top, r.width, r.height].map(Math.round);`);
const molecule = async (id) => { await g.ev(`__LW.verbs.run([{ verb: 'molecule', args: { id: ${JSON.stringify(id)} } }], { who: 'SHOTS' }); return 1;`);
  return g.waitFor('window.__LW.chem.on && window.__LW.chem.solution()', 600, 200); };
try {
  if (!(await g.waitFor('window.__LW?.ready', 400, 100)).ok) throw new Error('the lab never came up');
  await wait(800);
  const info = {};
  if (scene === 'field') {
    info.solved = (await molecule('H2O')).ok;
    await g.ev(`__LW.setStyle('glass'); const ks = [...document.querySelectorAll('.dev[data-id="observer"] .k')];
      const k = (w) => ks.find((x) => (x.querySelector('.k-lbl') || {}).textContent === w).mirKnob; k('SIZE').input(${+(process.env.SIZE ?? 0.3)}); k('RADIUS').input(${+(process.env.RADIUS ?? 0.4)}); if (${JSON.stringify(process.env.THEME || '')}) __LW.setTheme(${JSON.stringify(process.env.THEME || '')}); return 1;`);
    await g.ev(`__LW.layout.reveal ? __LW.layout.reveal('observer') : 0; return 1;`);
    await wait(2500);
    info.style = await g.ev(`return [__LW.mat.style, __LW.mat.atomSize, __LW.mat.stickR, __LW.field.espState().atoms];`);
    info.seg = await g.ev(`return [...document.querySelectorAll('.dev[data-id="observer"] [data-key-action="style"] .seg-b')].filter((b) => !b.hidden).map((b) => b.textContent);`);
    info.out = await shot();
    await g.ev(`const d = document.querySelector('.dev[data-id="observer"]'); if (d.classList.contains('folded')) __LW.run('window.observer.fold'); return 1;`); await wait(1200);
    info.wave = await rect('.dev[data-id="observer"]');
    info.knobs = await g.ev(`return ['atomSizeK', 'stickK'].map((k) => { const n = document.querySelector('.dev[data-id="observer"]'); return [...n.querySelectorAll('.k')].filter((x) => /SIZE|RADIUS/.test(x.textContent)).map((x) => x.textContent.trim() + (x.classList.contains('disabled') ? ' (off)' : '')); })[0];`);
    info.wave2 = await shot('wave');
  }
  for (const [k, v] of Object.entries({ scene, ...info, errors: (await g.errors()).errs })) console.log(k, JSON.stringify(v));
} finally { await g.close(); }
