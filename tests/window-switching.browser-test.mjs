// iteration 015 T6 · FAST SWITCHING (Josh: "When multiple fast multiwindow switching happens, everything sort of fails to keep up").
// 30 presses in 3 s over the TIMELINE (the CSB's latch, the timeline's door), the modulation window (the CSB's door, its own switch), SPECTRUM's
// fold and WAVE's raise; then, once the motion has landed: every window's `hidden` matches what it says it is, the transport is not mid-move,
// the frame mask is the one a fresh refresh would hand over, and no console error.
import assert from 'node:assert/strict';
import { open } from '../tools/gate/gatekit.mjs';

const g = await open(`https://127.0.0.1:${process.env.LW_PORT || 8701}/lab/?warn=0`, { width: 1600, height: 1000 });
let failed = 0;
const law = (name, ok, detail) => { console.log((ok ? 'PASS ' : 'FAIL ') + name + (ok ? '' : ' — ' + JSON.stringify(detail))); if (!ok) failed++; };
try {
  assert.equal((await g.waitFor('window.__LW?.ready', 300, 100)).ok, 1);
  await g.ev(`const field = __LW.field, original = field.setOcclusion; window.__masks = []; window.__maskCalls = 0;
    field.setOcclusion = function (rects) { window.__masks = rects.map((r) => r.map(Math.round)); window.__maskCalls++; return original.call(field, rects); };
    __LW.mat.frame = true; await __LW.settle(); return 1;`);
  for (const seed of [1, 2]) {
    const log = await g.ev(`
      const q = (s) => document.querySelector(s), shown = (e) => e && !e.hidden && !e.closest('[hidden]');
      const acts = [
        ['csb latch', () => q('#transport .tr-open').click()],
        ['csb door', () => q('#transport .mod-exp').click()],
        ['timeline door', () => { const b = q('.mir-timeline .tl-transport .mod-exp'); if (shown(b)) b.click(); }],
        ['mod switch', () => { const b = q('[data-mir-window="modulation"] .mir-workspace-switch'); if (shown(b)) b.click(); }],
        ['spectrum fold', () => q('.dev[data-id="spectrum"] .dev-fold').click()],
        ['wave raise', () => __LW.layout.raise('observer')],
        ['wave fold', () => q('.dev[data-id="observer"] .dev-fold').click()]];
      let s = ${seed * 7919}; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647, done = [];
      for (let i = 0; i < 30; i++) { const [n, f] = acts[Math.floor(rnd() * acts.length)]; try { f(); done.push(n); } catch (e) { done.push(n + ' THREW ' + e.message); } await new Promise((r) => setTimeout(r, 100)); }
      return done;`);
    console.log('presses', seed, log.join(' · '));
    await new Promise((r) => setTimeout(r, 1500));   // every motion lands (the longest: presence ≈ 300 ms, the transport's two halves 300 ms)
    const s = await g.ev(`
      const tl = __LW.timeline, mw = document.querySelector('[data-mir-window="modulation"]'), rail = document.querySelector('[data-mir-rail="modulation"]');
      const card = (id) => { const d = document.querySelector('.dev[data-id="' + id + '"]'), b = d.querySelector('.dev-body'); return { folded: d.classList.contains('folded'), bodyH: Math.round(b.getBoundingClientRect().height), closed: d.classList.contains('closed'), hidden: d.hidden }; };
      const t = document.getElementById('transport');
      return { tl: { open: tl.isOpen(), hidden: tl.root.hidden, railHidden: tl.rail.el ? tl.rail.el.hidden : null },
        mod: { open: __LW.layout.modulation.open, hidden: mw.hidden, railHidden: rail ? rail.hidden : null, opacity: getComputedStyle(mw).opacity },
        spectrum: card('spectrum'), wave: card('observer'),
        transport: { animation: t.style.animation, anims: t.getAnimations().filter((a) => a.playState === 'running').length } };`);
    law(`[${seed}] TIMELINE: hidden follows open`, s.tl.hidden === !s.tl.open && (s.tl.railHidden === null || s.tl.railHidden === !s.tl.open), s.tl);
    law(`[${seed}] modulation window: hidden follows open, fully shown when open`, s.mod.hidden === !s.mod.open && s.mod.railHidden === !s.mod.open && (!s.mod.open || s.mod.opacity === '1'), s.mod);
    for (const k of ['spectrum', 'wave']) law(`[${seed}] ${k}: a folded body has no height, an open one has`, s[k].closed || s[k].hidden || (s[k].folded ? s[k].bodyH <= 1 : s[k].bodyH > 1), s[k]);
    law(`[${seed}] the transport is not mid-move`, !s.transport.animation && s.transport.anims === 0, s.transport);
    const seat = await g.ev(`const t = document.getElementById('transport'), r = t.getBoundingClientRect(), vw = innerWidth, vh = innerHeight, w = r.width, h = r.height, left = (vw - w) / 2;
      const at = (top) => ({ left, right: left + w, top, bottom: top + h }), hit = (a, b) => !(a.right <= b.left || a.left >= b.right || a.bottom <= b.top || a.top >= b.bottom);
      const wins = [__LW.timeline.isOpen() && __LW.timeline.root, __LW.layout.modulation.open && document.querySelector('[data-mir-window="modulation"]')].filter(Boolean).map((e) => e.getBoundingClientRect());
      const free = (top) => !wins.some((b) => hit(at(top), b)), bottom = vh - 60 - h, want = free(bottom) ? 'bottom' : free(52) ? 'top' : 'either';
      return { want, at: Math.abs(r.top - 52) < 4 ? 'top' : Math.abs(r.top - bottom) < 4 ? 'bottom' : Math.round(r.top), place: t.dataset.place || '', docked: t.classList.contains('docked') };`);
    law(`[${seed}] the transport sits where a fresh dodge would put it`, seat.docked || seat.place === 'free' || seat.want === 'either' || seat.want === seat.at, seat);
    const m = await g.ev(`const before = JSON.stringify(window.__masks), calls = window.__maskCalls; document.getElementById('floats').dispatchEvent(new Event('scroll'));   /* the ink's own dirty, no layout of its own */ await __LW.settle(); await new Promise((r) => setTimeout(r, 600));
      const now = window.__masks.map(String), was = JSON.parse(before).map(String); return { same: JSON.stringify(window.__masks) === before, calls: window.__maskCalls - calls, n: window.__masks.length, gone: was.filter((r) => !now.includes(r)), came: now.filter((r) => !was.includes(r)) };`);
    law(`[${seed}] the frame mask was current (a fresh refresh hands over the same rects)`, m.same, m);
  }
  const errs = (await g.errors()).errs;
  law('no console error', !errs.length, errs);
} finally { await g.close(); }
console.log(failed ? `RED window-switching.browser-test — ${failed} failing` : 'GREEN window-switching.browser-test');
process.exit(failed ? 1 : 0);
