/* a7-occlusion-probe.mjs — 0.5.0 A7's parity probe for the occlusion providers (a diagnostic, not a gate).
 *   LW_PORT=8773 GD_PORT=5243 node tools/a7-occlusion-probe.mjs <out.json>
 * Wraps __LW.field.setOcclusion (as tests/frame-occlusion does) and walks that suite's seven scenes — lattice with the
 * modulation window expanded, box and dots, the rail dragged, the run scrolled, a rack window detached, its head dragged,
 * joined again — then a float moved by moveFloat, the racks scrolled, two cards folded, the keyboard window open, the
 * interface hidden and back, DISCONNECTED with every rack card open, then every one folded (more heads on screen) under the
 * modulation window (past the 32: the rack columns stand in).  After
 * each scene the app is quiet, a body-class flicker dirties the block, and the list handed to setOcclusion by that refresh
 * is written.  Run it on two trees (serve `git archive <base> lab tools` from .tmp/) and diff the two files: the
 * enumerator became providers, so every number must match. */
import { writeFileSync } from 'node:fs';
import { open } from './gate/gatekit.mjs';
import { actions, relActions } from './gate/drv.mjs';

const OUT = process.argv[2] || '.tmp/a7-occlusion-probe.json';
const g = await open(`https://127.0.0.1:${process.env.LW_PORT || 8773}/lab/?warn=0`, { width: 1920, height: 1080 });
const steps = [];
const snap = async (name, extra = '') => {
  const s = await g.ev(`await __LW.settle(); await new Promise((r) => setTimeout(r, 350)); await __LW.settle();
    window.__masks = null; document.body.classList.add('a7-probe'); document.body.classList.remove('a7-probe');
    for (let i = 0; i < 200 && !window.__masks; i++) await new Promise((r) => setTimeout(r, 20));
    const cb = document.getElementById('field').getBoundingClientRect(), m = window.__masks || [];
    const col = (id) => { const e = document.getElementById(id); if (!e) return false; const b = e.getBoundingClientRect();
      const w = [b.left - cb.left, b.top - cb.top, b.right - cb.left, b.bottom - cb.top]; return m.some((r) => r.every((n, i) => n === w[i])); };
    return { n: window.__masks ? m.length : null, masks: m, columns: [col('rack'), col('rackL')], disconnected: __LW.disconnected,
      X: ${extra ? '(() => { ' + extra + ' })()' : 'null'}, errors: (window.__e || []).slice() };`);
  steps.push([name, s]);
  console.log(name + ': ' + s.n + ' rects' + (s.columns.some(Boolean) ? ' (columns stand in)' : '') + (s.errors.length ? ' errors ' + JSON.stringify(s.errors) : ''));
};
const drag = async (id, x, y, dx, dy) => {
  await actions(g.s, [{ type: 'pointer', id, parameters: { pointerType: 'mouse' }, actions: [
    { type: 'pointerMove', origin: 'viewport', x, y, duration: 0 }, { type: 'pointerDown', button: 0 },
    { type: 'pointerMove', origin: 'viewport', x: x + dx, y: y + dy, duration: 150 }, { type: 'pointerUp', button: 0 }] }]);
  await relActions(g.s);
};
try {
  if (!(await g.waitFor('window.__LW?.ready', 300, 100)).ok) throw new Error('the lab never came up');
  await g.ev(`const f = __LW.field, o = f.setOcclusion; window.__masks = null;
    f.setOcclusion = function (rects) { window.__masks = rects.map((r) => r.slice()); return o.call(f, rects); };
    __LW.pause(); __LW.mat.frame = true; __LW.mat.frameMode = 'lattice'; __LW.setStyle('cloud');
    __LW.layout.modulation.expand(); await __LW.settle(); return 1;`);
  await snap('1 lattice, modulation expanded', 'return __LW.field.ok;');
  for (const mode of ['box', 'dots']) {
    await g.ev(`__LW.mat.frameMode = ${JSON.stringify(mode)}; __LW.setStyle('cloud'); return 1;`);
    await snap('2 ' + mode);
  }
  const grip = await g.ev(`const r = document.querySelector('[data-mir-rail="modulation"] [data-rail="drag"]').getBoundingClientRect();
    return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };`);
  await drag('mod-drag', grip.x, grip.y, 110, 80);
  await snap('3 the modulation window dragged', 'const b = document.querySelector(\'[data-mir-window="modulation"]\').getBoundingClientRect(); return [b.left, b.top];');
  await g.ev(`for (let i = 0; i < 4; i++) __LW.mod.addSource('lfo'); await new Promise((r) => setTimeout(r, 300));
    const run = document.querySelector('[data-mir-window="modulation"] .m2run'); run.scrollLeft = run.scrollWidth - run.clientWidth; return 1;`);
  await snap('4 the run scrolled', 'return document.querySelector(\'[data-mir-window="modulation"] .m2run\').scrollLeft;');
  await g.ev(`__LW.layout.modulation.collapse(); __LW.layout.popOut('shadow', { x: 700, y: 160, w: 280 }); return 1;`);
  await snap('5 a rack window detached', 'return __LW.layout.floating();');
  const head = await g.ev(`const b = document.querySelector('.dev[data-id="shadow"] .dev-head').getBoundingClientRect();
    return { x: Math.round(b.left + 35), y: Math.round(b.top + b.height / 2) };`);
  await drag('rack-drag', head.x, head.y, 90, 40);
  await snap('6 its head dragged', 'return __LW.layout.floatOf("shadow");');
  await g.ev(`__LW.setDisconnected(false); return 1;`);
  await snap('7 joined');
  await g.ev(`__LW.layout.moveFloat('shadow', 420, 300); return 1;`);
  await snap('8 a float moved', 'return __LW.layout.floatOf("shadow");');
  await g.ev(`for (const id of ['rack', 'rackL']) { const e = document.getElementById(id); if (e) e.scrollTop = e.scrollHeight; } return 1;`);
  await snap('9 the racks scrolled', 'return ["rack", "rackL"].map((id) => { const e = document.getElementById(id); return e ? [e.scrollTop, e.scrollHeight - e.clientHeight] : null; });');
  await g.ev(`const first = document.querySelector('#rack > .dev:not(.closed):not([hidden]):not(.folded)');
    for (const d of [document.querySelector('.dev[data-id="shadow"]'), first]) d.querySelector('.dev-fold').click(); window.__folded = first.dataset.id; return 1;`);
  await snap('10 two cards folded', 'return [...document.querySelectorAll(".dev.folded")].map((d) => d.dataset.id);');
  await g.ev(`__LW.keymap.open(); return 1;`);
  await snap('11 the keyboard window open', 'return !document.getElementById("keymap").hidden;');
  await g.ev(`__LW.keys.toggleUI(); return 1;`);
  await snap('12 the interface hidden', 'return __LW.uiHidden;');
  await g.ev(`__LW.keys.toggleUI(); return 1;`);
  await snap('13 the interface back', 'return __LW.uiHidden;');
  await g.ev(`__LW.keymap.close(); __LW.setDisconnected(true);
    for (const d of document.querySelectorAll('#rack > .dev.closed, #rackL > .dev.closed')) if (!d.hidden) __LW.layout.reopen(d.dataset.id);
    for (const id of ['rack', 'rackL']) { const e = document.getElementById(id); if (e) e.scrollTop = 0; } return 1;`);
  await snap('14 disconnected, every rack card open', 'return document.querySelectorAll("#rack > .dev:not(.closed), #rackL > .dev:not(.closed)").length;');
  await g.ev(`for (const d of document.querySelectorAll('#rack > .dev:not(.closed):not(.folded), #rackL > .dev:not(.closed):not(.folded)')) if (!d.hidden) d.querySelector('.dev-fold').click();
    __LW.layout.modulation.expand(); return 1;`);
  await snap('15 every rack card folded, the modulation window over them: past 32, the columns stand in', 'return document.querySelectorAll(".dev.folded").length;');
  writeFileSync(OUT, JSON.stringify(steps, null, 1) + '\n');
  console.log(`a7-occlusion-probe: ${steps.length} scenes -> ${OUT}`);
} finally { await g.close(); }
