// iteration 016 L1 · L2 · L3 · P3 · THE PICKER'S LOOKS, in the real page (research/iteration-016/L-BUILD.md):
//   P3 · with no `look` stored the ATOMIC deck draws Im ψ (its button reads `Im ψ`, an element tile its one picture) and the MOLECULAR deck arg ψ
//        (`<id>.phase.webp`); nothing is written until the reader picks;
//   L1 · THE LOOK DROP holds seven tiles, the seventh ATOM LABELS (`Aa`), and a pick of it draws `<id>.labels.webp`;
//   L2 · one wheel detent over the drop steps one look, and the pick is the reader's (`look` + `lookHand` stored);
//   L3 · HYDROGEN is the 140 on one page: 140 tiles, fourteen columns, ten rows, every tile on screen, no page arrows.
// Start tools/gate/server.py first; LW_PORT and GD_PORT must be unused/owned ports.
import assert from 'node:assert/strict';
import { open } from '../tools/gate/gatekit.mjs';

const g = await open(`https://127.0.0.1:${process.env.LW_PORT || 8701}/lab/?starter=home&menu=1`, { width: 1600, height: 1000, script: 120000 });
const pass = (m) => console.log('PASS ' + m);
const ev = async (body) => { const r = await g.ev(body); assert.ok(r !== undefined && r !== null && !r.E, 'page threw: ' + JSON.stringify(r)); return r; };
try {
  assert.equal((await g.waitFor('window.__LW&&__LW.ready', 300, 100)).ok, 1);
  await ev(`localStorage.removeItem('lambdawaves.q0.picker'); location.reload(); return 1;`).catch(() => {});
  await new Promise((r) => setTimeout(r, 2500));
  assert.equal((await g.waitFor('window.__LW&&__LW.ready&&document.getElementById("lwMenu")', 300, 100)).ok, 1);
  const p3 = await ev(`const w = (n) => new Promise((r) => setTimeout(r, n)), M = document.getElementById('lwMenu'); if (M.hidden) document.getElementById('lwHome').click(); await w(800);
    const tab = (i) => document.querySelectorAll('.mm-tab')[i].click();
    tab(0); await w(900); const atomic = { look: document.querySelector('.mm-lookg').textContent, src: document.querySelector('.mm-el img.mm-pic').getAttribute('src') };
    tab(1); await w(1200); const molecular = { look: document.querySelector('.mm-lookg').textContent, src: document.querySelector('.mm-mol img.mm-pic').getAttribute('src') };
    return { atomic, molecular, stored: JSON.parse(localStorage.getItem('lambdawaves.q0.picker') || '{}').look || null };`);
  assert.ok(p3.atomic.look === 'Im ψ' && /\/el-[A-Za-z]+\.webp$/.test(p3.atomic.src), 'ATOMIC is not Im ψ by default: ' + JSON.stringify(p3));
  assert.ok(p3.molecular.look === 'arg ψ' && /\.phase\.webp$/.test(p3.molecular.src), 'MOLECULAR is not arg ψ by default: ' + JSON.stringify(p3));
  assert.equal(p3.stored, null, 'a look was written before the reader picked one');
  pass(`P3: no look stored → ATOMIC ${p3.atomic.look} (${p3.atomic.src}), MOLECULAR ${p3.molecular.look} (${p3.molecular.src}); nothing written`);

  const l12 = await ev(`const w = (n) => new Promise((r) => setTimeout(r, n)); document.querySelector('.mm-lookb').click(); await w(500);
    const tiles = [...document.querySelectorAll('.mm-lk')].map((b) => b.dataset.look), aa = document.querySelector('.mm-lk[data-look="labels"]').textContent;
    const dr = document.querySelector('.mm-lookdrop'), before = document.querySelector('.mm-lk.on').dataset.look;
    dr.dispatchEvent(new WheelEvent('wheel', { deltaY: 3, deltaMode: 1, bubbles: true, cancelable: true }));
    const after = document.querySelector('.mm-lk.on').dataset.look, stored = JSON.parse(localStorage.getItem('lambdawaves.q0.picker'));
    document.querySelector('.mm-lk[data-look="labels"]').click(); await w(1500);
    return { tiles, aa, before, after, stored, src: document.querySelector('.mm-mol img.mm-pic').getAttribute('src') };`);
  assert.deepEqual(l12.tiles, ['density', 'phase', 'im', 'balls', 'sticks', 'esp', 'labels'], 'the drop: ' + JSON.stringify(l12.tiles));
  assert.equal(l12.aa, 'Aa');
  assert.ok(l12.before === 'phase' && l12.after === 'im' && l12.stored.look === 'im' && l12.stored.lookHand === true, 'one detent did not step one look: ' + JSON.stringify(l12));
  assert.ok(/\.labels\.webp$/.test(l12.src), 'ATOM LABELS drew ' + l12.src);
  pass(`L1 · L2: seven tiles (${l12.tiles.join(' · ')}), the seventh "${l12.aa}"; one detent ${l12.before} → ${l12.after}, stored as the reader's; ATOM LABELS draws ${l12.src}`);

  const l3 = await ev(`const w = (n) => new Promise((r) => setTimeout(r, n)); document.querySelectorAll('.mm-tab')[0].click(); await w(900); document.querySelector('[data-amode="hydrogen"]').click(); await w(1200);
    const r = [...document.querySelectorAll('.mm-htable .mm-tile')].map((t) => t.getBoundingClientRect());
    return { n: r.length, cols: new Set(r.map((q) => Math.round(q.left))).size, rows: new Set(r.map((q) => Math.round(q.top))).size, on: r.filter((q) => q.top >= 0 && q.bottom <= innerHeight && q.left >= 0 && q.right <= innerWidth).length,
      arrows: [...document.querySelectorAll('.mm-atomic .mm-arrow')].filter((a) => a.getClientRects().length).length, t: Math.round(r[0].width) };`);
  assert.ok(l3.n === 140 && l3.cols === 14 && l3.rows === 10 && l3.on === 140 && l3.arrows === 0, 'THE 140 are not on one page: ' + JSON.stringify(l3));
  pass(`L3: ${l3.n} tiles, ${l3.cols} × ${l3.rows}, all ${l3.on} on screen, ${l3.t} px each, no arrows`);
  const errs = (await g.errors()).errs.filter((e) => !/ResizeObserver/.test(e));
  assert.equal(errs.length, 0, 'console: ' + JSON.stringify(errs));
  console.log('GREEN picker-looks');
} catch (e) { console.log('FAIL ' + (e && e.message)); process.exitCode = 1; }
await g.close();
