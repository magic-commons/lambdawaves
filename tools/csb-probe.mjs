/* csb-probe.mjs — iteration 015 T4: the CONTROL SURFACE's rect through every state that might move it (a diagnostic, not a gate).
 *   LW_PORT=9601 GD_PORT=5301 node tools/csb-probe.mjs [out.png]
 * Logs #transport's rect at boot, playing, t = 1234.5, a long t, with the expander open, in HYDROGEN and in MOLECULES, on the STAGE, FREE and
 * docked (RACK). The law it reads: on one seat the bar's width changes only between the two modes. */
import { writeFileSync } from 'node:fs';
import { open } from './gate/gatekit.mjs';

const OUT = process.argv[2] || '.tmp/csb-probe.png';
const g = await open(`https://127.0.0.1:${process.env.LW_PORT || 9601}/lab/?starter=home`, { width: 1600, height: 1000 });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const rows = [];
const row = async (what) => { const r = await g.ev(`const t = document.getElementById('transport'), r = t.getBoundingClientRect();
  return { place: t.dataset.place || (t.classList.contains('docked') ? 'rack' : 'stage'), mode: document.querySelector('#lwMode [aria-pressed="true"]')?.dataset.id || '?',
    rect: [r.left, r.top, r.width, r.height].map((v) => Math.round(v * 10) / 10), t: t.querySelector('.ro.time .ro-val')?.textContent };`);
  rows.push({ what, ...r }); console.log(what.padEnd(26), r.place.padEnd(6), r.mode.padEnd(10), JSON.stringify(r.rect), r.t); };
const mode = (id) => g.ev(`document.querySelector('#lwMode [data-id="${id}"]').click(); return 1;`);
const expander = () => g.ev(`document.querySelector('#transport .tr-expand').click(); return 1;`);
const cycle = () => g.ev(`document.querySelector('#transport .dock-btn').click(); return 1;`);
try {
  if (!(await g.waitFor('window.__LW?.ready', 400, 100)).ok) throw new Error('the lab never came up');
  await wait(1000);
  for (let seat = 0; seat < 3; seat++) {
    await row('boot');
    await g.ev(`__LW.mod.play(); return 1;`); await wait(700); await row('playing');
    await g.ev(`__LW.mod.stop(); __LW.clock.t = 1234.5; return 1;`); await wait(500); await row('t = 1234.5');
    await g.ev(`__LW.clock.t = 98765.43; return 1;`); await wait(500); await row('t = 98765.43 (long)');
    await expander(); await wait(700); await row('expander open');
    await expander(); await wait(700); await row('expander shut');
    await mode('molecules'); await wait(2500); await row('MOLECULES');
    await g.ev(`__LW.clock.t = 1234.5; return 1;`); await wait(400); await row('MOLECULES · t = 1234.5');
    await g.ev(`const o = document.querySelector('#transport .mol-pick .mir-sel-t'); if (o) o.textContent = '2-ACETOXYBENZOIC ACID · VOL. I · 6-31+G*'; return 1;`);   // 022 P3: the kit's select await wait(300); await row('MOLECULES · a long name');
    await expander(); await wait(700); await row('MOLECULES · expander');
    if (seat === 0) writeFileSync(OUT, Buffer.from(await g.snap(), 'base64'));
    await expander(); await wait(500);
    await mode('hydrogen'); await wait(1500); await row('HYDROGEN again');
    await g.ev(`__LW.clock.t = 0; return 1;`);
    await cycle(); await wait(1200);
  }
  const bySeat = {};
  for (const r of rows) (bySeat[r.place] ||= {})[r.mode] = [...new Set([...(bySeat[r.place][r.mode] || []), r.rect[2]])];
  console.log('widths by seat and mode', JSON.stringify(bySeat));
  console.log('errors', JSON.stringify((await g.errors()).errs));
} finally { await g.close(); }
