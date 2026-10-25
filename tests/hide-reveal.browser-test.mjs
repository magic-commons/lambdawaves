// iteration 015 H3 · HIDE AND REVEAL, in the real page (research/iteration-015/H3-BUILD.md holds the audit's table; this suite carries the rows
// that can be asserted):
//   1 · H (the real key) takes EVERY surface out of paint — the racks, the FREE control surface, the TIMELINE, the modulation window, a floating
//       window, the menubar, the pills — so a grid of points over the screen reads only the stage; frame and axes go with it; H again brings
//       each back where it was, the frame and the axes as they were.
//   2 · B hides both racks and the stage's control surface; the pointer at the left edge peeks the left rack, at the right edge the right
//       rack, near the bar's seat the bar; in the middle nothing; B again shows them.
//   3 · every fold press (`.lw-fold`) opens and closes its bodies, and its chevron points right closed and down open; a window's own fold
//       (`.dev-fold`) and SPECTRUM's shell fold too.
//   4 · an open fold survives a real window resize and a whole serialize() → restore().
//   5 · a hover hint (#controlHelp) lies within the viewport and is the topmost thing over its whole box: on a control-surface seat, on a
//       window's knob and on a menubar row (the menubar is a top-layer popover — a hint under it was cropped).
// Start tools/gate/server.py first; LW_PORT and GD_PORT must be unused/owned ports.
import assert from 'node:assert/strict';
import http from 'node:http';
import { open } from '../tools/gate/gatekit.mjs';
import * as drv from '../tools/gate/drv.mjs';

const W0 = 1500, H0 = 1400;   // 016 W5: tall enough that the TIMELINE and the modulation window stack (a shorter stage cycles them, one at a time)
const g = await open(`https://127.0.0.1:${process.env.LW_PORT || 8701}/lab/?preset=1s%2B2pz`, { width: W0, height: H0, script: 120000 });
const pass = (m) => console.log('PASS ' + m);
const ev = async (body) => { const r = await g.ev(body); assert.ok(r !== undefined && r !== null && !r.E, 'page threw: ' + JSON.stringify(r)); return r; };
const rect = (w, h) => new Promise((res, rej) => {   // a REAL window resize (WebDriver Set Window Rect)
  const body = JSON.stringify({ width: w, height: h });
  const q = http.request({ host: '127.0.0.1', port: process.env.GD_PORT, path: '/session/' + g.s + '/window/rect', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } }, (x) => { let b = ''; x.on('data', (d) => b += d); x.on('end', () => res(b)); });
  q.on('error', rej); q.end(body);
});
let n = 0;
const hover = async (x, y) => {   // the driver's own mouse: control-help asks `:hover`, which a dispatched event never sets
  await drv.actions(g.s, [{ type: 'pointer', id: 'hp' + (++n), parameters: { pointerType: 'mouse' }, actions: [
    { type: 'pointerMove', duration: 0, origin: 'viewport', x: 1, y: 1 }, { type: 'pointerMove', duration: 60, origin: 'viewport', x: Math.round(x), y: Math.round(y) }] }]);
};
try {
  assert.equal((await g.waitFor('window.__LW&&__LW.ready', 200, 100)).ok, 1);
  await g.ev(`window.__w = (n) => new Promise((r) => setTimeout(r, n));
    window.__shown = (e) => { if (!e || !e.isConnected) return false; const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden') return false; const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && e.getClientRects().length > 0 && !e.closest('[hidden]'); };
    /* the topmost painted thing at a grid of points; pointer-events: none layers (the stage words, the pills, the hint) are lent a hit for the read */
    window.__grid = () => { const out = new Set(), lend = [...document.querySelectorAll('.rack-pills, #controlHelp')]; for (const e of lend) e.style.pointerEvents = 'auto';
      for (let i = 1; i < 16; i++) for (let j = 1; j < 10; j++) { const e = document.elementFromPoint(innerWidth * i / 16, innerHeight * j / 10); if (e) out.add(e.closest('#stage > canvas, canvas') ? 'canvas' : (e.id || e.tagName) + (e.closest('#floats, #rack, #rackL, #transport, #menubar, #title, .rack-pills, #notebook') ? '@' + e.closest('#floats, #rack, #rackL, #transport, #menubar, #title, .rack-pills, #notebook').id : '')); }
      for (const e of lend) e.style.pointerEvents = ''; return [...out]; };
    return 1;`);

  /* ── 1 · H ── */
  const t1 = await ev(`const L = __LW.layout, tr = document.getElementById('transport');
    for (let i = 0; i < 3 && tr.dataset.place !== 'free'; i++) { tr.querySelector('.dock-btn').click(); await __w(500); }
    __LW.timeline.open(); await __w(500); __LW.mod.expand(); await __w(500);
    L.reopen('camera'); L.popOut('camera', { x: 420, y: 140 }); await __w(400);
    const surf = () => ({ rackL: [...document.querySelectorAll('#rackL .dev > .dev-head')].some(__shown), rack: [...document.querySelectorAll('#rack .dev > .dev-head')].some(__shown), bar: __shown(tr), free: tr.dataset.place,
      tl: __shown(__LW.timeline.root), mod: __shown(document.getElementById('modwin')), float: __shown(document.querySelector('.dev[data-id="camera"] > .dev-head')) && __LW.layout.isFloating('camera'), title: __shown(document.getElementById('title')),
      pills: [...document.querySelectorAll('.rack-pills')].every((p) => getComputedStyle(p).display !== 'none') });
    const frame0 = __LW.mat.frame, axis0 = __LW.mat.axis, before = surf();
    return { before, frame0, axis0 };`);
  assert.ok(t1.before.free === 'free' && t1.before.bar && t1.before.tl && t1.before.mod && t1.before.float && t1.before.rackL && t1.before.rack, 'the surfaces did not open: ' + JSON.stringify(t1));
  await g.press('h'); await g.ev('await __w(500); return 1;');
  const t1h = await ev(`return { hidden: document.body.classList.contains('ui-hidden'), grid: __grid(), frame: __LW.mat.frame, axis: __LW.mat.axis,
    pills: [...document.querySelectorAll('.rack-pills')].every((p) => getComputedStyle(p).display === 'none') };`);
  const stray = t1h.grid.filter((k) => !/^(canvas|stage|lab|BODY|HTML|atomLabels|DIV|SPAN|P|I|svg)$/.test(k) || k.includes('@'));
  assert.ok(t1h.hidden && t1h.frame === false && t1h.axis === false && t1h.pills, 'H did not hide the frame, the axes or the pills: ' + JSON.stringify(t1h));
  assert.deepEqual(stray, [], 'H left interface in paint: ' + JSON.stringify(t1h.grid));
  await g.press('h'); await g.ev('await __w(600); return 1;');
  const t1b = await ev(`const tr = document.getElementById('transport');
    return { hidden: document.body.classList.contains('ui-hidden'), frame: __LW.mat.frame, axis: __LW.mat.axis, rackL: [...document.querySelectorAll('#rackL .dev > .dev-head')].some(__shown), rack: [...document.querySelectorAll('#rack .dev > .dev-head')].some(__shown),
      bar: __shown(tr), free: tr.dataset.place, tl: __shown(__LW.timeline.root), mod: __shown(document.getElementById('modwin')), float: __shown(document.querySelector('.dev[data-id="camera"] > .dev-head')) && __LW.layout.isFloating('camera'), title: __shown(document.getElementById('title')) };`);
  assert.ok(!t1b.hidden && t1b.frame === t1.frame0 && t1b.axis === t1.axis0, 'H did not bring the frame and the axes back as they were: ' + JSON.stringify({ t1, t1b }));
  for (const k of ['rackL', 'rack', 'bar', 'tl', 'mod', 'float', 'title']) assert.equal(t1b[k], true, 'H did not bring back ' + k + ': ' + JSON.stringify(t1b));
  assert.equal(t1b.free, 'free', 'H moved the control surface out of its FREE window');
  pass(`H took every surface out of paint (the grid read only ${t1h.grid.join(' · ')}), the frame and the axes with it; H again brought back both racks, the FREE control surface, the TIMELINE, the modulation window, the floating CAMERA and the title, the frame ${t1b.frame} and the axes ${t1b.axis} as they were`);

  /* put the room back for the rest: the bar on the stage, the windows closed, CAMERA home */
  await ev(`const tr = document.getElementById('transport'); for (let i = 0; i < 3 && tr.dataset.place !== 'stage'; i++) { tr.querySelector('.dock-btn').click(); await __w(500); }
    __LW.mod.collapse(); __LW.timeline.close(); __LW.layout.dockWindow('camera'); await __w(700); return 1;`);

  /* ── 2 · B and the peeks ── */
  await g.press('b'); await g.ev('await __w(600); return 1;');
  const t2 = await ev(`const tr = document.getElementById('transport'), vis = (e) => getComputedStyle(e).visibility === 'visible' && getComputedStyle(e).opacity !== '0';
    const L = document.getElementById('rackL'), R = document.getElementById('rack');
    const move = async (x, y) => { dispatchEvent(new PointerEvent('pointermove', { clientX: x, clientY: y, pointerType: 'mouse', bubbles: true })); await __w(450); };
    const at = () => ({ peek: [...document.body.classList].filter((c) => /peek/.test(c)).sort().join(' '), L: vis(L), R: vis(R), bar: vis(tr) });
    const hidden = { cls: document.body.classList.contains('rack-hidden'), ...at() };
    await move(innerWidth / 2, innerHeight / 2); const mid = at();
    await move(6, innerHeight / 2); const left = at();
    await move(innerWidth / 2, innerHeight / 2); const back = at();
    await move(innerWidth - 6, innerHeight / 2); const right = at();
    await move(innerWidth / 2, innerHeight / 3);
    const b = tr.getBoundingClientRect(), dy = new DOMMatrixReadOnly(getComputedStyle(tr).transform).f;   // the bar's REST seat: its rect less the hide's slide
    await move(b.left + b.width / 2, b.top - dy + b.height / 2); const bar = at();
    await move(innerWidth / 2, innerHeight / 3); const gone = at();
    return { place: tr.dataset.place, hidden, mid, left, back, right, bar, gone };`);
  assert.ok(t2.hidden.cls && !t2.hidden.L && !t2.hidden.R && !t2.hidden.bar, 'B did not hide both racks and the bar: ' + JSON.stringify(t2));
  assert.ok(!t2.mid.L && !t2.mid.R && t2.left.L && !t2.left.R && /rack-peek-left/.test(t2.left.peek) && !t2.back.L, 'the left peek: ' + JSON.stringify(t2));
  assert.ok(t2.right.R && !t2.right.L && /rack-peek-right/.test(t2.right.peek), 'the right peek: ' + JSON.stringify(t2));
  assert.ok(t2.bar.bar && /transport-peek/.test(t2.bar.peek) && !t2.gone.bar, 'the bar peek: ' + JSON.stringify(t2));
  await g.press('b'); await g.ev('await __w(600); return 1;');
  const t2b = await ev(`const vis = (e) => getComputedStyle(e).visibility === 'visible' && getComputedStyle(e).opacity !== '0';
    return { cls: document.body.classList.contains('rack-hidden'), L: vis(document.getElementById('rackL')), R: vis(document.getElementById('rack')), bar: vis(document.getElementById('transport')) };`);
  assert.deepEqual(t2b, { cls: false, L: true, R: true, bar: true }, 'B again did not show them: ' + JSON.stringify(t2b));
  pass(`B hid both racks and the stage bar; the pointer at the left edge peeked the left rack alone, at the right edge the right rack alone, over the bar's seat the bar (${t2.bar.peek}); the middle peeked nothing; B again showed all three`);

  /* ── 3 · every fold ── */
  const t3 = await ev(`const L = __LW.layout; for (const d of document.querySelectorAll('.dev[data-id]')) { if (d.closest('#floats')) continue; try { L.reopen(d.dataset.id); L.raise(d.dataset.id); } catch (e) {} }
    await __w(800);
    const rot = (b) => { const s = b.querySelector('svg'); return s ? getComputedStyle(s).transform : 'no svg'; };
    const CLOSED = 'matrix(0, -1, 1, 0, 0, 0)';
    const rows = [], bad = [];
    for (const b of document.querySelectorAll('.lw-fold')) {
      if (!__shown(b)) continue;
      const bodies = (b.getAttribute('aria-controls') || '').split(' ').map((id) => document.getElementById(id)).filter(Boolean);
      const state = () => ({ exp: b.getAttribute('aria-expanded') === 'true', open: bodies.length > 0 && bodies.every((x) => !x.hidden), shut: bodies.every((x) => x.hidden), rot: rot(b) });
      const s0 = state(); b.click(); await __w(60); const s1 = state(); b.click(); await __w(60); const s2 = state();
      const ok = (s) => (s.exp ? s.open && s.rot === 'none' : s.shut && s.rot === CLOSED);
      const row = { card: b.closest('.dev').dataset.id, key: b.dataset.fold || '(more)', s0, s1, s2 };
      rows.push(row.card + ':' + row.key);
      if (!(ok(s0) && ok(s1) && ok(s2) && s0.exp !== s1.exp && s2.exp === s0.exp)) bad.push(row);
    }
    /* a window's own fold, on SPECTRUM: the body goes, the chevron turns */
    const sp = document.querySelector('.dev[data-id="spectrum"]'), df = sp.querySelector('.dev-head .dev-fold');
    const card = () => ({ folded: sp.classList.contains('folded'), body: __shown(sp.querySelector(':scope > .dev-body')), exp: df.getAttribute('aria-expanded'), rot: rot(df) });
    const settled = async () => { await __w(400); await Promise.all(df.querySelector('svg').getAnimations().map((a) => a.finished)); };   // the chevron's 120 ms turn, on a busy page
    const c0 = card(); df.click(); await settled(); const c1 = card(); df.click(); await settled(); const c2 = card();
    /* SPECTRUM's shell fold: n = 7 folds and unfolds by its number */
    const n7 = sp.querySelector('.picker .pk-n[data-n="7"]'), nl = n7.querySelector('.pk-nl'); const f0 = n7.classList.contains('folded'); nl.click(); await __w(80); const f1 = n7.classList.contains('folded'); nl.click(); await __w(80); const f2 = n7.classList.contains('folded');
    return { rows, bad, card: [c0, c1, c2], shells: [f0, f1, f2] };`);
  assert.deepEqual(t3.bad, [], 'a fold press did not open and close, or its chevron pointed the wrong way: ' + JSON.stringify(t3.bad));
  assert.ok(t3.rows.length >= 5, 'too few folds found: ' + JSON.stringify(t3.rows));
  const [c0, c1, c2] = t3.card;
  assert.ok(!c0.folded && c0.body && c1.folded && !c1.body && !c2.folded && c2.body && c0.rot !== c1.rot && c2.rot === c0.rot, 'the window fold: ' + JSON.stringify(t3.card));
  assert.ok(t3.shells[0] !== t3.shells[1] && t3.shells[2] === t3.shells[0], 'the shell fold: ' + JSON.stringify(t3.shells));
  pass(`${t3.rows.length} fold presses opened and closed, chevron right when closed and down when open (${t3.rows.join(' · ')}); SPECTRUM's own fold and its n = 7 shell fold turned both ways`);

  /* ── 4 · a fold survives a resize and a restore ── */
  const pick = `[...document.querySelectorAll('.lw-fold[data-fold]')].filter((b) => __shown(b) && ['camera', 'shadow'].includes(b.closest('.dev').dataset.id))`;
  const t4a = await ev(`const bs = ${pick}; for (const b of bs) if (b.getAttribute('aria-expanded') !== 'true') b.click(); await __w(100); return bs.map((b) => b.dataset.fold);`);
  assert.ok(t4a.length === 2, 'CAMERA and SHADOW folds not found: ' + JSON.stringify(t4a));
  await rect(1240, 820); await g.ev('await __w(900); return 1;'); await rect(W0, H0); await g.ev('await __w(900); return 1;');
  const t4 = await ev(`const open = () => ${pick}.map((b) => b.getAttribute('aria-expanded') === 'true');
    const afterResize = open(), S = __LW.serialize();
    for (const b of ${pick}) b.click(); await __w(100); const shut = open();
    await __LW.restore(S); await __w(800); const restored = open();
    return { size: [innerWidth, innerHeight], afterResize, shut, restored };`);
  assert.deepEqual(t4.afterResize, [true, true], 'a resize closed a fold: ' + JSON.stringify(t4));
  assert.deepEqual(t4.shut, [false, false]); assert.deepEqual(t4.restored, [true, true], 'restore() did not reopen the folds it saved: ' + JSON.stringify(t4));
  pass(`the CAMERA and SHADOW folds stayed open through a real resize (1240 × 820 and back) and came back open from serialize() → restore() after being closed`);

  /* ── 5 · the hover hints are never cropped ── */
  const tipAt = async (sel, how) => {
    const p = await ev(`${how || ''} const e = ${sel}; if (!e) return { none: true }; e.scrollIntoView({ block: 'center' }); await __w(200); const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, help: e.dataset.help || e.closest('[data-help]')?.dataset.help };`);
    if (p.none) return p;
    await hover(p.x, p.y); await g.ev('await __w(1100); return 1;');
    return ev(`const t = document.getElementById('controlHelp'); if (!t || t.hidden) return { shown: false };
      const r = t.getBoundingClientRect(); t.style.pointerEvents = 'auto';
      const pts = [[r.left + 3, r.top + 3], [r.right - 3, r.top + 3], [r.left + 3, r.bottom - 3], [r.right - 3, r.bottom - 3], [(r.left + r.right) / 2, (r.top + r.bottom) / 2]];
      const top = pts.map(([x, y]) => { const e = document.elementFromPoint(x, y); return e === t || t.contains(e) ? 'tip' : (e ? (e.id || e.className || e.tagName).toString().slice(0, 30) : 'none'); });
      t.style.pointerEvents = '';
      return { shown: true, text: t.textContent.slice(0, 40), inside: r.left >= 0 && r.top >= 0 && r.right <= innerWidth && r.bottom <= innerHeight, top, r: [r.left, r.top, r.right, r.bottom].map(Math.round) };`);
  };
  await ev(`const tr = document.getElementById('transport'); for (let i = 0; i < 3 && tr.dataset.place !== 'stage'; i++) { tr.querySelector('.dock-btn').click(); await __w(500); } return tr.dataset.place;`);   // §3 raised the TRANSPORT card: the bar back on the stage
  /* a value bubble (.k-val) is a hover hint too: none may stick out of a box that clips its paint (contain: paint, overflow) */
  const t5 = await ev(`const out = [];
    for (const v of document.querySelectorAll('#transport .k-val, #transport .fd-val, .dev .k-val, .dev .fd-val')) {
      const r = v.getBoundingClientRect(); if (!r.width || !r.height || !v.getClientRects().length) continue;
      for (let a = v.parentElement; a && a !== document.body; a = a.parentElement) {
        const cs = getComputedStyle(a); if (!/paint|strict|content/.test(cs.contain) && cs.overflow === 'visible' && cs.overflowX === 'visible' && cs.overflowY === 'visible') continue;
        const b = a.getBoundingClientRect(), out1 = (q) => q.left < b.left - 0.5 || q.right > b.right + 0.5 || q.top < b.top - 0.5 || q.bottom > b.bottom + 0.5;
        const dial = (v.closest('.k, .fd') || v.parentElement).querySelector('.k-dial, .fd-track') || v.parentElement;   // a knob scrolled out of its rack is not a cropped bubble: only one whose control is in the box
        if (out1(r) && !out1(dial.getBoundingClientRect())) out.push((v.closest('[data-param]')?.dataset.param || v.closest('.dev, #transport').dataset.id || 'transport') + ' in ' + (a.id || a.className.toString().slice(0, 24)));
        break;
      }
    }
    return out;`);
  assert.deepEqual(t5, [], 'a value bubble is cropped by a box that clips its paint: ' + JSON.stringify(t5));
  const seat = await tipAt(`document.querySelector('#transport [data-help]')`);
  const knob = await tipAt(`[...document.querySelectorAll('.dev:not(.closed):not(.folded) .k[data-help], .dev:not(.closed):not(.folded) .k [data-help]')].find(__shown)`);
  const menu = await tipAt(`[...document.querySelectorAll('#menubar .mb-item[data-help], #menubar [data-help]')].find(__shown)`,
    `const tl = document.getElementById('title'); tl.click(); await __w(300); const b = document.querySelector('#menubar .mb-btn'); if (b) { b.click(); await __w(300); }`);
  for (const [name, t] of [['a control-surface seat', seat], ['a window knob', knob], ['a menubar row', menu]]) {
    assert.ok(t.shown, 'no hint on ' + name + ': ' + JSON.stringify(t));
    assert.ok(t.inside, 'the hint on ' + name + ' left the viewport: ' + JSON.stringify(t));
    assert.deepEqual(t.top, ['tip', 'tip', 'tip', 'tip', 'tip'], 'the hint on ' + name + ' is cropped (something paints over it): ' + JSON.stringify(t));
  }
  pass(`the hint is whole and inside the viewport on a control-surface seat ("${seat.text}"), a window knob ("${knob.text}") and a menubar row ("${menu.text}") — topmost at its four corners and its centre`);

  const errs = (await g.errors()).errs;
  assert.deepEqual(errs, [], 'page errors: ' + JSON.stringify(errs));
  console.log('GREEN hide-reveal');
} catch (e) {
  console.log('FAIL ' + (e && e.message || e)); process.exitCode = 1;
} finally { await g.close(); }
