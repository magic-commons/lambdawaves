// iteration 016 L1 · L2 · L3 · P3 · THE PICKER'S LOOKS, in the real page (research/iteration-016/L-BUILD.md):
//   P3 · with no `look` stored the ATOMIC deck draws Im ψ (its button reads `Im ψ`, an element tile its one picture) and the MOLECULAR deck arg ψ
//        (`<id>.phase.webp`); nothing is written until the reader picks;
//   L1 · THE LOOK DROP holds seven tiles, the seventh DIAGRAM (037 D2: a drawn wedge), and a pick of it draws `<id>.diagram.svg` in the ink;
//   L2 · one wheel detent over the drop steps one look, and the pick is the reader's (`look` + `lookHand` stored);
//   L3 · HYDROGEN is the 140 on one page: 140 tiles, fourteen columns, ten rows, every tile on screen, no page arrows.
// 039 S4 · A RED MEANS A BUG: every wait is on the state the next read means (the face, the decks, a tab's picture, the drop, a look's src, the
// 140 laid out and at rest) through __until, 25 ms apart with a ceiling; no sleep stands in for a landing.
// Start tools/gate/server.py first; LW_PORT and GD_PORT must be unused/owned ports.
import assert from 'node:assert/strict';
import { open } from '../tools/gate/gatekit.mjs';

const g = await open(`https://127.0.0.1:${process.env.LW_PORT || 8701}/lab/?starter=home&menu=1`, { width: 1600, height: 1000, script: 120000 });
const pass = (m) => console.log('PASS ' + m);
const ev = async (body) => { const r = await g.ev(body); assert.ok(r !== undefined && r !== null && !r.E, 'page threw: ' + JSON.stringify(r)); return r; };
const UNTIL = `window.__until = async (ok, ms = 15000) => { const t0 = performance.now(); for (;;) { let v = false; try { v = !!ok(); } catch (_) {}
    if (v) return Math.round(performance.now() - t0); if (performance.now() - t0 > ms) return -1; await new Promise((r) => setTimeout(r, 25)); } };
  window.__rest = () => !document.getAnimations().some((a) => a.playState === 'running' && a.effect && a.effect.getTiming().iterations !== Infinity);
  window.__shown = (q) => { const e = document.querySelector(q); return !!e && e.getClientRects().length > 0; };
  window.__last = null; window.__scrollRest = () => { const sc = document.querySelector('#lwMenu .mm-scroll'), at = sc ? sc.scrollLeft + ',' + sc.scrollTop : ''; const same = at === window.__last; window.__last = at; return same; };
  window.__tab = (i) => { const t = document.querySelectorAll('.mm-tab')[i]; return !!t && t.classList.contains('on') && __scrollRest() && __rest(); }; return 1;`;
try {
  assert.equal((await g.waitFor('window.__LW&&__LW.ready', 300, 100)).ok, 1);
  await ev(`localStorage.removeItem('lambdawaves.q0.picker'); window.__before = 1; location.reload(); return 1;`).catch(() => {});
  /* the reload is a navigation: a read that meets the old document (it still holds __before) or the unload itself is asked again */
  let back = null; for (let k = 0; k < 300 && !(back && back.ok === 1); k++) { try { back = await g.waitFor('!window.__before&&window.__LW&&__LW.ready&&document.getElementById("lwMenu")', 300, 100); } catch (_) { await new Promise((r) => setTimeout(r, 100)); } }
  assert.equal(back && back.ok, 1, 'the reload never came back ready');
  await ev(UNTIL);
  const p3 = await ev(`const M = document.getElementById('lwMenu'); if (M.hidden) document.getElementById('lwHome').click();
    await __until(() => !M.hidden && (__shown('.mm-face:not([hidden]) .mm-door[data-door="library"]') || __shown('.mm-tab')) && __rest());
    const lib = M.querySelector('.mm-face:not([hidden]) .mm-door[data-door="library"]'); if (lib) { lib.click(); await __until(() => __shown('.mm-tab') && __rest()); }   // 034: an open lands on the face; LIBRARY is the decks
    const tab = (i) => document.querySelectorAll('.mm-tab')[i].click();
    tab(0); await __until(() => __tab(0) && __shown('.mm-el img.mm-pic')); const atomic = { look: document.querySelector('.mm-lookg').textContent, src: document.querySelector('.mm-el img.mm-pic').getAttribute('src') };
    tab(1); await __until(() => __tab(1) && __shown('.mm-mol img.mm-pic')); const molecular = { look: document.querySelector('.mm-lookg').textContent, src: document.querySelector('.mm-mol img.mm-pic').getAttribute('src') };
    return { atomic, molecular, stored: JSON.parse(localStorage.getItem('lambdawaves.q0.picker') || '{}').look || null };`);
  assert.ok(p3.atomic.look === 'Im ψ' && /\/el-[A-Za-z]+\.webp$/.test(p3.atomic.src), 'ATOMIC is not Im ψ by default: ' + JSON.stringify(p3));
  assert.ok(p3.molecular.look === 'arg ψ' && /\.phase\.webp$/.test(p3.molecular.src), 'MOLECULAR is not arg ψ by default: ' + JSON.stringify(p3));
  assert.equal(p3.stored, null, 'a look was written before the reader picked one');
  pass(`P3: no look stored → ATOMIC ${p3.atomic.look} (${p3.atomic.src}), MOLECULAR ${p3.molecular.look} (${p3.molecular.src}); nothing written`);

  const l12 = await ev(`document.querySelector('.mm-lookb').click(); await __until(() => document.querySelectorAll('.mm-lk').length === 7 && __shown('.mm-lookdrop') && __rest());
    const tiles = [...document.querySelectorAll('.mm-lk')].map((b) => b.dataset.look), aa = document.querySelector('.mm-lk[data-look="labels"] svg') ? 'wedge' : document.querySelector('.mm-lk[data-look="labels"]').textContent;
    const dr = document.querySelector('.mm-lookdrop'), before = document.querySelector('.mm-lk.on').dataset.look;
    dr.dispatchEvent(new WheelEvent('wheel', { deltaY: 3, deltaMode: 1, bubbles: true, cancelable: true }));
    const after = document.querySelector('.mm-lk.on').dataset.look, stored = JSON.parse(localStorage.getItem('lambdawaves.q0.picker'));
    document.querySelector('.mm-lk[data-look="labels"]').click(); await __until(() => /\\.diagram\\.svg$/.test(document.querySelector('.mm-mol img.mm-pic').getAttribute('src') || '') && __rest());
    const im = document.querySelector('.mm-mol img.mm-pic'); return { tiles, aa, before, after, stored, src: im.getAttribute('src'), ink: im.classList.contains('pic-ink') && getComputedStyle(im).maskImage.startsWith('url(') };`);
  assert.deepEqual(l12.tiles, ['density', 'phase', 'im', 'balls', 'sticks', 'esp', 'labels'], 'the drop: ' + JSON.stringify(l12.tiles));
  assert.equal(l12.aa, 'wedge');
  assert.ok(l12.before === 'phase' && l12.after === 'im' && l12.stored.look === 'im' && l12.stored.lookHand === true, 'one detent did not step one look: ' + JSON.stringify(l12));
  assert.ok(/\.diagram\.svg$/.test(l12.src) && l12.ink, 'DIAGRAM drew ' + l12.src + (l12.ink ? '' : ', not as a mask in the ink'));
  pass(`L1 · L2: seven tiles (${l12.tiles.join(' · ')}), the seventh "${l12.aa}"; one detent ${l12.before} → ${l12.after}, stored as the reader's; DIAGRAM draws ${l12.src} in the ink`);

  const l3 = await ev(`document.querySelectorAll('.mm-tab')[0].click(); await __until(() => __tab(0) && __shown('[data-amode="hydrogen"]')); document.querySelector('[data-amode="hydrogen"]').click();
    await __until(() => document.querySelectorAll('.mm-htable .mm-tile').length === 140 && __scrollRest() && __rest());
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
