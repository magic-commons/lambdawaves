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
    info.times = await g.ev(`return [...document.querySelectorAll('.ro.time')].map((e) => { const v = e.querySelector('.ro-val') || e, s = getComputedStyle(v), r = e.getBoundingClientRect();
      return { text: e.textContent.trim(), rect: [r.left, r.top, r.width, r.height].map(Math.round), font: s.fontFamily.slice(0, 32), size: s.fontSize, style: s.fontStyle, num: s.fontVariantNumeric }; });`);
  } else if (scene === 'magnet') {   // T5: the CSB's latch, then its door: both open, the modulation window on the timeline; then the timeline's door swaps
    const R = `const q = (s) => { const e = document.querySelector(s); if (!e || e.closest('[hidden]')) return null; const r = e.getBoundingClientRect(); return [r.left, r.top, r.right, r.bottom].map(Math.round); };
      return { tl: __LW.timeline.isOpen() ? q('.mir-timeline') : null, mod: __LW.layout.modulation.open ? q('[data-mir-window="modulation"]') : null };`;
    await g.ev(`document.querySelector('#transport .tr-open').click(); return 1;`); await wait(900);
    await g.ev(`document.querySelector('#transport .mod-exp').click(); return 1;`); await wait(1500);
    info.both = await g.ev(R);
    writeFileSync(OUT.replace(/\.png$/, '-both.png'), Buffer.from(await g.snap(), 'base64'));
    await g.ev(`document.querySelector('.mir-timeline .tl-transport .mod-exp').click(); return 1;`); await wait(1200);
    info.afterTimelineDoor = await g.ev(R);
    await g.ev(`document.querySelector('#transport .tr-open').click(); return 1;`); await wait(1500);
    info.timelineUnder = await g.ev(R);
  } else if (scene === 'mod') {
    await g.ev(`if (${JSON.stringify(process.env.THEME || '')}) __LW.setTheme(${JSON.stringify(process.env.THEME || '')}); __LW.layout.modulation.expand(); return 1;`); await wait(1500);
    info.workbar = await rect('.m2workbar.m2pre'); info.prebar = await rect('.m2prebar');
    info.seats = await g.ev(`return ['.m2preopen', '.m2presave', '.m2prename', '.modtap', '.modsync', '.m2hold', '.modtempo', '.modxport', '.m2-workspace-switch'].map((q) => { const e = document.querySelector('[data-mir-window="modulation"] ' + q); if (!e) return q + ' —'; const s = getComputedStyle(e), r = e.getBoundingClientRect();
      return q + ' ' + [Math.round(r.width) + '×' + Math.round(r.height), s.fontSize, s.fontFamily.slice(0, 12), s.borderRadius, s.backgroundColor, s.boxShadow.slice(0, 40)].join(' | '); });`);
  }
  writeFileSync(OUT, Buffer.from(await g.snap(), 'base64'));
  for (const [k, v] of Object.entries({ scene, OUT, ...info, errors: (await g.errors()).errs })) console.log(k, JSON.stringify(v));
} finally { await g.close(); }
