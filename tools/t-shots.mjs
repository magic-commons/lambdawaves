/* t-shots.mjs — iteration 015 chain T's pictures (a diagnostic, not a gate).
 *   LW_PORT=9601 GD_PORT=5301 node tools/t-shots.mjs <scene> [out.png]
 * Scenes: bars (the CSB and the open TIMELINE's work bar, t at 1234.5) · mod (the modulation window open: its two bars).
 * Writes the driver's composite PNG and prints the rects it measured; python's PIL turns it into a small JPEG. */
import { writeFileSync } from 'node:fs';
import { open } from './gate/gatekit.mjs';

const scene = process.argv[2] || 'bars', OUT = process.argv[3] || `.tmp/t-${scene}.png`;
const g = await open(`https://127.0.0.1:${process.env.LW_PORT || 9601}/lab/?starter=home`, { width: 1600, height: 1000 });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const rect = (sel) => g.ev(`const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return null; const r = e.getBoundingClientRect(); return [r.left, r.top, r.width, r.height].map(Math.round);`);
try {
  if (!(await g.waitFor('window.__LW?.ready', 400, 100)).ok) throw new Error('the lab never came up');
  await wait(800);
  const info = {};
  if (scene === 'bars') {
    await g.ev(`__LW.timeline.open(); __LW.clock.t = 1234.5; __LW.layout.raise && 0; return 1;`); await wait(1500);
    info.csb = await rect('#transport');
    info.times = await g.ev(`return [...document.querySelectorAll('.ro.time')].map((e) => { const v = e.querySelector('.ro-v, .v') || e, s = getComputedStyle(v), r = e.getBoundingClientRect();
      return { text: e.textContent.trim(), rect: [r.left, r.top, r.width, r.height].map(Math.round), font: s.fontFamily.slice(0, 32), size: s.fontSize, style: s.fontStyle, num: s.fontVariantNumeric }; });`);
  } else if (scene === 'mod') {
    await g.ev(`__LW.layout.modulation.expand(); return 1;`); await wait(1500);
    info.workbar = await rect('.m2workbar'); info.prebar = await rect('.m2prebar');
  }
  writeFileSync(OUT, Buffer.from(await g.snap(), 'base64'));
  console.log(JSON.stringify({ scene, OUT, info, errors: (await g.errors()).errs }, null, 1));
} finally { await g.close(); }
