/* failrestore.mjs — lane M · M5 gate (after probes/D/failrestore.mjs): a project whose restore() throws half-way,
 * opened through the real PROJECTS road, BASE (lab-base) vs built lab/, fresh headless Firefox each.
 *   LW_PORT=8723 GD_PORT=5242 node research/optimization-2026-09-24/probes/M/failrestore.mjs
 * Scenario A (D's): from a clean, different state with NO project current: open the broken file, then a plain SAVE
 *   (Ctrl+S = projects.save() onto `current`) — does it overwrite the broken file?
 * Scenario B: a GOOD project is open and clean: open the broken file, read current/notebook/recent/dirty/status,
 *   then a plain SAVE — what does it write, and over which file?
 * Also: a malformed open's λ marks are read (for M7) — logo colours + every mark rect fill/class. */
import { open } from '../../../../tools/gate/gatekit.mjs';
const PORT = process.env.LW_PORT || '8723';
const out = {};
for (const [tag, p] of [['base', 'research/optimization-2026-09-24/probes/M/lab-base/'], ['built', 'lab/']]) {
  const g = await open(`https://127.0.0.1:${PORT}/${p}?preset=1s%2B2pz&sw=0`, { width: 1600, height: 900 });
  try {
    await g.waitFor('window.__LW && __LW.ready', 3000, 20);
    out[tag] = await g.ev(`
      __LW.schedule(4); await __LW.settle();
      const P = __LW.layout.projects, KEY = 'lambdawaves.q0.projects';
      const items = () => JSON.parse(localStorage.getItem(KEY)).items;
      const good = JSON.parse(JSON.stringify(__LW.serialize()));
      const broken = JSON.parse(JSON.stringify(good)); broken.presentation.instruments.ladder = { nbar: 30, sigma: 2, d: 0, teeth: 8 }; broken.presentation.palette.stops = [5];
      const nbState = () => ({ text: document.querySelector('.nb-text').value, title: document.querySelector('.nb-title').value });
      const marks = () => ({ lam: [...document.querySelectorAll('#title .lam, .nb-logo .lam')].map((e) => e.style.color), rects: [...document.querySelectorAll('#title .mark rect, .nb-logo .mark rect, #busyMark .mark rect, .mod-logo .mark rect, .dev-loading .mark rect')].map((r) => r.getAttribute('fill') + '|' + r.getAttribute('class')).join(',') });
      const res = {};
      /* A */
      __LW.loadPreset('2pz'); await __LW.settle(); P.markClean();
      const pathA = P.importText(JSON.stringify({ lambdawaves: 'project', version: 1, path: 'probe/broken', data: broken, notebook: { title: 'broken', text: 'the broken notes' } }));
      let r0 = __LW.stats.rebuilds; const nb0 = nbState();
      const openedA = P.open(pathA); await __LW.settle(); await __LW.settle();
      const beforeA = JSON.stringify(items()[pathA].data);
      res.A = { opened: openedA, status: document.querySelector('.pj-status').textContent, current: P.current, dirty: P.dirty, rebuilds: __LW.stats.rebuilds - r0, notebookKept: JSON.stringify(nbState()) === JSON.stringify(nb0), recent: P.recent().slice(0, 3) };
      const savedA = P.save(); res.A.saved = savedA; res.A.saveOverwrote = savedA && beforeA !== JSON.stringify(items()[pathA].data);
      res.A.marks = marks();
      /* B */
      __LW.loadPreset('1s+2pz'); await __LW.settle();
      document.querySelector('.nb-text').value = 'good notes'; P.save('probe/good'); P.open('probe/good'); await __LW.settle();
      const goodBefore = JSON.stringify(items()['probe/good'].data); const nb1 = nbState();
      r0 = __LW.stats.rebuilds;
      const openedB = P.open(pathA); await __LW.settle(); await __LW.settle();
      res.B = { opened: openedB, status: document.querySelector('.pj-status').textContent, current: P.current, dirty: P.dirty, rebuilds: __LW.stats.rebuilds - r0, notebookKept: JSON.stringify(nbState()) === JSON.stringify(nb1), recent: P.recent().slice(0, 3) };
      const brokenBefore = JSON.stringify(items()[pathA].data);
      const savedB = P.save(); res.B.saved = savedB;
      res.B.overwroteBroken = savedB && brokenBefore !== JSON.stringify(items()[pathA].data);
      res.B.overwroteGood = savedB && goodBefore !== JSON.stringify(items()['probe/good'].data);
      res.errs = window.__e;
      return res;`);
    console.log(tag, JSON.stringify(out[tag]).slice(0, 1400));
  } finally { await g.close(); }
}
const b = out.built;
const pass = b.A.opened === false && /open failed/.test(b.A.status) && b.A.current === null && b.A.dirty === true && b.A.rebuilds >= 1 && b.A.notebookKept && b.A.saveOverwrote === false
  && b.B.opened === false && /open failed/.test(b.B.status) && b.B.current === 'probe/good' && b.B.notebookKept && b.B.overwroteBroken === false && (b.errs || []).length === 0;
console.log('base A:', JSON.stringify({ ...out.base.A, marks: undefined }), '\nbuilt A:', JSON.stringify({ ...b.A, marks: undefined }));
console.log('base B:', JSON.stringify(out.base.B), '\nbuilt B:', JSON.stringify(b.B));
console.log('marks after a malformed open, base == built:', JSON.stringify(out.base.A.marks) === JSON.stringify(b.A.marks));
console.log((pass ? 'GREEN' : 'RED') + ' M5: a failed open keeps current + notebook, is not clean, says "open failed", rebuilds, and a plain SAVE does not overwrite the broken file');
process.exit(pass ? 0 : 1);
