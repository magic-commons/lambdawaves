// 0.5.1 D10-24 · THE CURVES CARD: the kit's curves panel over the stage canvas, SCREEN ONLY, shipped closed, its grade a PREFERENCE.
// 018 D3: re-aimed at NODES (lab/nodes.js), the card that hosts it now; a saved layout's `curves` seat opens `nodes`.
// 020 X0: the default graph is empty — CURVES is added (setHas) before the grade.
//   1 shipped closed, in + and WINDOW, saying so in one line · 2 neutral reads `filter: none` · 3 a grade reaches the screen and NOT a picture
//   4 the card is a painted surface in the frame mask, open and floated · 5 the grade is PREFERENCE: its own record, surviving a reload, untouched by a project open, absent from the project and the undo ring
//   6 FORGET takes it away.
// Start tools/gate/server.py first; LW_PORT and GD_PORT must be unused/owned ports.
import assert from 'node:assert/strict';
import { open } from '../tools/gate/gatekit.mjs';
import { go } from '../tools/gate/drv.mjs';

const URL = `https://127.0.0.1:${process.env.LW_PORT || 8701}/lab/?warn=0`;
const g = await open(URL, { width: 1600, height: 1000, script: 120000 });
const KEY = 'lambdawaves.q0.curves';
const HELP = `window.__w = (n) => new Promise((r) => setTimeout(r, n));
  window.__filter = () => getComputedStyle(document.getElementById('field')).filter;
  window.__pic = async () => { const r = await __LW.capture.picture({ width: 320 }); if (!r || !r.ok) throw new Error('no picture');
    const h = await crypto.subtle.digest('SHA-256', await r.blob.arrayBuffer()); return [...new Uint8Array(h)].map((b) => b.toString(16).padStart(2, '0')).join(''); };
  window.__masks = []; { const f = __LW.field, o = f.setOcclusion; f.setOcclusion = function (rects) { window.__calls = (window.__calls || 0) + 1; window.__masks = rects.map((r) => r.slice()); return o.call(f, rects); }; }
  window.__remask = async () => { dispatchEvent(new Event('resize')); await __LW.settle(); await __w(400); };
  window.__mask = (id) => { const r = document.querySelector('.dev[data-id="' + id + '"]').getBoundingClientRect(), x = (r.left + r.right) / 2, y = (r.top + r.bottom) / 2;
    return __masks.some((m) => m[0] <= x && x < m[2] && m[1] <= y && y < m[3]); };
  __LW.pause(); await __LW.settle(); return 1;`;
const ready = async () => { assert.equal((await g.waitFor('window.__LW&&__LW.ready', 300, 100)).ok, 1); await g.ev(HELP); };
let failed = false;
try {
  await ready();

  /* 1 · closed on a first run; in the FINDER and WINDOW; the one line */
  const first = await g.ev(`const d = document.querySelector('.dev[data-id="nodes"]');
    __LW.layout.finder.open(); const plus = [...document.querySelectorAll('.mir-window-picker .wp-row:not(.off)')].map((i) => i.dataset.win); __LW.layout.finder.close();
    __LW.layout.menu.open(); const b = [...document.getElementById('menubar').querySelectorAll('.mb-btn')].find((x) => x.dataset.menu === 'WINDOW'); b.click();
    const tools = [...b.parentElement.querySelectorAll('.mb-item')].find((i) => /^TOOLS/.test(i.textContent.trim())); if (tools) { tools.click(); await new Promise((r) => setTimeout(r, 200)); }   // 021 I3: NODES lives in WINDOW › TOOLS
    const win = [...document.querySelectorAll('#menubar .mb-lbl, .mb-list .mb-lbl, [role="menu"] .mb-lbl')].map((l) => l.textContent.trim()); b.click();
    return { made: !!d, closed: d.classList.contains('closed'), side: d.parentElement.id, plus: plus.includes('nodes'), win: win.some((t) => /NODES$/.test(t)),
      note: d.querySelector('.note').textContent, errs: __e.slice() };`);
  assert.equal(first.made, true); assert.equal(first.closed, true); assert.equal(first.side, 'rack');
  assert.equal(first.plus, true); assert.equal(first.win, true);
  assert.equal(first.note, 'Grades the screen only — pictures and films are untouched.'); assert.deepEqual(first.errs, []);
  console.log('PASS NODES (CURVES\' heir) ships closed on the right rack, in the FINDER and WINDOW, and says in one line that it grades the screen only');

  /* 2 · neutral costs nothing */
  assert.equal(await g.ev('return __filter();'), 'none');
  assert.equal(await g.ev(`return localStorage.getItem('${KEY}');`), null);
  console.log('PASS neutral: the stage canvas\'s computed filter is `none`, and no record is written');

  /* 3 · a grade reaches the screen, not a picture, and is no undo row */
  const before = await g.ev('await __LW.settle(); return { pic: await __pic(), rows: __LW.history.entries().length };');
  const shot0 = await g.snapHash();
  /* 020 X0: THE DEFAULT GRAPH IS EMPTY — a first run has no CURVES node: add one (the rack's door), then grade */
  assert.deepEqual(await g.ev(`return __LW.nodes.nodes().map((q) => q.type);`), []);
  await g.ev(`__LW.nodes.setHas(true); __LW.curves.preset('MASTER', 'S'); await __w(300); await __LW.settle(); return 1;`);
  const graded = await g.ev(`return { filter: __filter(), table: __LW.nodes.filter.describe().table, pic: await __pic(), rows: __LW.history.entries().length };`);
  const shot1 = await g.snapHash();
  assert.match(graded.filter, /^url\(/); assert.equal(graded.table, true);
  assert.notEqual(shot0, shot1);
  assert.equal(graded.pic, before.pic);
  assert.equal(graded.rows, before.rows);
  console.log('PASS an S-curve on MASTER changes the screen (driver screenshot), not the exported picture (same sha-256), and adds no undo row');

  /* 4 · a painted surface: the closed card masks nothing; the open, the floated and the folded card are surfaces in the frame mask */
  await g.ev(`__LW.mat.frame = true; __LW.mat.frameMode = 'lattice'; __LW.setStyle('cloud'); await __remask(); return 1;`);
  const at = () => g.ev(`const e = document.querySelector('.dev[data-id="nodes"]'), r = e.getBoundingClientRect(); return { masked: __mask('nodes'), n: __masks.length, closed: e.classList.contains('closed'),
    floating: e.classList.contains('floating'), deep: __masks.some((m) => m[0] <= (r.left + r.right) / 2 && (r.left + r.right) / 2 < m[2] && m[1] <= r.bottom - 20 && r.bottom - 20 < m[3]) };`);
  const shut = await at();
  await g.ev(`__LW.layout.reopen('nodes'); await __remask(); return 1;`); const opened = await at();
  await g.ev(`__LW.layout.popOut('nodes', { x: 640, y: 120, w: 300 }); await __remask(); return 1;`); const floated = await at();
  await g.ev(`document.querySelector('.dev[data-id="nodes"] .dev-fold').click(); await __remask(); return 1;`); const folded = await at();
  assert.equal(shut.closed, true); assert.equal(opened.masked, true, JSON.stringify(opened)); assert.ok(opened.n > shut.n && opened.n <= 32);
  assert.equal(floated.floating, true); assert.equal(floated.masked, true, JSON.stringify(floated)); assert.equal(floated.deep, true);
  assert.equal(folded.masked, true, JSON.stringify(folded));
  console.log('PASS the closed card masks nothing; the open, the floated and the folded card are painted surfaces in the frame mask');

  /* 5 · PREFERENCE */
  const rec = await g.ev(`await __w(400); __LW.saveSettings(); await __w(60);
    const j = () => JSON.stringify(__LW.serialize(), (k, v) => (k === 'at' ? 0 : v)), a = j(); __LW.curves.preset('MASTER', 'LINEAR'); const b = j(); __LW.curves.preset('MASTER', 'S'); await __w(400);
    return { raw: localStorage.getItem('${KEY}'), inBlob: 'curves' in JSON.parse(localStorage.getItem('lambdawaves.q0.settings') || '{}'), same: a === b };`);
  assert.ok(rec.raw); const parsed = JSON.parse(rec.raw); assert.equal(parsed.v, 1); assert.ok(parsed.curves.MASTER.length >= 3);
  assert.equal(rec.inBlob, false); assert.equal(rec.same, true);
  await g.ev(`window.confirm = () => true; await __LW.layout.projects.requestFresh();   /* NEW asks first when the project is dirty (the steps above dirty it); the subject here is the grade, so it says yes */ await __w(600); await __LW.settle(); return 1;`);
  const after = await g.ev(`return { raw: localStorage.getItem('${KEY}'), filter: __filter() };`);
  assert.equal(after.raw, rec.raw); assert.match(after.filter, /^url\(/);
  console.log('PASS the grade is PREFERENCE: its own record, not in the settings blob or the project; a project open (NEW) leaves it and the screen as they were');
  await go(g.s, URL); await g.armErrors(); await ready();
  const back = await g.ev(`return { raw: localStorage.getItem('${KEY}'), pts: __LW.curves.points('MASTER').length, filter: __filter(), closed: document.querySelector('.dev[data-id="nodes"]').classList.contains('closed') };`);
  assert.equal(back.raw, rec.raw); assert.ok(back.pts >= 3); assert.match(back.filter, /^url\(/);
  console.log('PASS the grade survives a reload (restored before the first frame, the canvas graded)');

  /* 018 D3 · a saved layout naming the retired `curves` opens `nodes` (settings.js RETIRED_WINDOWS) */
  const alias = await g.ev(`const L = __LW.layout.captureLayout(), rest = L.cards.filter((c) => c.id !== 'nodes');
    __LW.layout.applyLayout({ ...L, cards: rest.concat([{ id: 'nodes', side: 'R', open: false }]) }); await __w(400);
    if (!document.querySelector('.dev[data-id="nodes"]').classList.contains('closed')) return 'nodes did not close';
    __LW.layout.applyLayout({ ...L, cards: rest.concat([{ id: 'curves', side: 'R', open: true }]) }); await __w(600); return { open: !document.querySelector('.dev[data-id="nodes"]').classList.contains('closed'), curves: !!document.querySelector('.dev[data-id="curves"]') };`);
  assert.deepEqual(alias, { open: true, curves: false });
  console.log('PASS a saved layout naming the retired CURVES card opens NODES');

  /* 6 · FORGET */
  await g.ev(`[...document.querySelectorAll('button')].find((x) => x.textContent.trim() === 'FORGET').click(); return 1;`);
  await new Promise((r) => setTimeout(r, 3000)); await ready();
  assert.equal(await g.ev(`return localStorage.getItem('${KEY}');`), null);
  assert.equal(await g.ev('return __filter();'), 'none');
  console.log('PASS FORGET takes the grade away and the canvas is neutral again');
} catch (e) { failed = true; console.error(e); } finally { await g.close(); }
console.log(failed ? 'RED curves.browser-test' : 'GREEN curves.browser-test');
process.exit(failed ? 1 : 0);
