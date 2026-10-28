/* label-fit.mjs — iteration 022 chain H's probe (a diagnostic, not a gate): A LABEL IS NEVER WIDER THAN ITS CONTROL.
 *   LW_PORT=9683 GD_PORT=5683 node tools/label-fit.mjs [--favs]
 * Opens every rack window (unfolded, every inner fold open) on the 300-px racks of a 1600 × 1000 page and counts the labels that NEED the
 * ellipsis: a knob's, a fader's, a switch's or a trigger's label whose scrollWidth exceeds its clientWidth.  --favs also seats EXPOSURE, RATE
 * and ZOOM on the CONTROL SURFACE's favourites (the store `lambdawaves.q0.csb`, then a reload; STRENGTH, ZEEMAN B and ROTATE z are no
 * modulation targets, so no favourites) and counts the strip's labels too. */
import { open } from './gate/gatekit.mjs';

const FAVS = process.argv.includes('--favs'), wait = (ms) => new Promise((r) => setTimeout(r, ms));
const g = await open(`https://127.0.0.1:${process.env.LW_PORT || 9683}/lab/?starter=home`, { width: 1600, height: 1000 });
try {
  if (!(await g.waitFor('window.__LW?.ready', 400, 100)).ok) throw new Error('the lab never came up');
  await wait(1200);
  if (FAVS) {   // the store is read at boot: write it, then load again
    await g.ev(`localStorage.setItem('lambdawaves.q0.csb', JSON.stringify({ v: 1, items: ['material.exposure', 'transport.rate', 'observer.zoom'] })); location.reload(); return 1;`);
    await wait(1500); if (!(await g.waitFor('window.__LW?.ready', 400, 100)).ok) throw new Error('the lab never came back'); await wait(1200);
  }
  const ids = await g.ev(`const ids = [...document.querySelectorAll('#rack > .dev, #rackL > .dev')].filter((d) => !d.hidden).map((d) => d.dataset.id);
    for (const id of ids) { __LW.run('window.' + id + '.open'); __LW.run('window.' + id + '.reset'); }
    const ex = document.querySelector('#transport .tr-expand'); if (ex && ex.getAttribute('aria-expanded') !== 'true') ex.click(); return ids;`);
  await wait(2500);
  const COUNT = `for (const b of document.querySelectorAll('.dev [data-fold][aria-expanded="false"]')) b.click(); await new Promise((q) => setTimeout(q, 1500));
    const out = [], seen = new Set(); let n = 0;
    for (const e of document.querySelectorAll('.k-lbl, .fd-lbl, .sw-lbl, .trig-l')) {
      if (seen.has(e) || !e.closest('#rack .dev, #rackL .dev, #transport .csb-favs') || !e.offsetParent || !e.textContent.trim()) continue; seen.add(e); n++;
      if (e.scrollWidth > e.clientWidth + 1) out.push([e.closest('.dev')?.dataset.id || 'favs', e.textContent.trim(), e.clientWidth, e.scrollWidth]);
    }
    return { labels: n, favs: [...document.querySelectorAll('#transport .csb-favs .k-lbl')].map((l) => l.textContent), over: out, racks: [...document.querySelectorAll('#rack, #rackL')].map((x) => Math.round(x.getBoundingClientRect().width)) };`;
  /* two passes: the boot's HYDROGEN mode, then MOLECULES on (its card and the register's) */
  for (const pass of ['hydrogen', 'molecules']) {
    if (pass === 'molecules') { await g.ev(`__LW.chem.setOn(true); return 1;`); await wait(5000); }
    const r = await g.ev(COUNT);
    console.log(JSON.stringify({ pass, windows: ids.length, racks: r.racks, labels: r.labels, favs: r.favs, overflowing: r.over.length }));
    for (const o of r.over) console.log('  ' + o.join(' · '));
  }
} finally { await g.close(); }
