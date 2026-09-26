// VERIFY item 12 (confirm and MEASURE the two recorded edges, not fix): (a) a named press that commits nothing leaves its name pending
// and the next unnamed edit takes it; (b) a right-button curve gesture in the modulation window commits as an unnamed 'edit' row.
// Plus: keyboard edits (C style, V view, P palette, ] turn ψ, K slap) — does each make its own row?
import { lab } from './kit.mjs';
const g = await lab();
const out = {};
const clean = () => g.run(`await __settle(); __LW.history.clear('probe'); return 1;`);
const rowsNow = () => g.run(`await __w(550); __LW.history.flush(); return __rows();`);
const spress = (expr) => g.run(`const e = ${expr}; if (!e) return { E: 'missing' }; __show(e); await __w(60); await __spress(e); return 1;`);
try {
  /* ── keyboard edits on a clean ring (focus on the stage) ── */
  out.keys = {};
  for (const [name, key] of [['C (cycle style)', 'c'], ['V (cycle view)', 'v'], ['P (palette on/off)', 'p'], ['] (turn ψ +)', ']'], ['K (impulse)', 'k']]) {
    await clean(); await g.run(`document.activeElement && document.activeElement.blur && document.activeElement.blur(); document.body.focus(); return 1;`);
    const s0 = await g.run(`return __ser();`); await g.key(key); const rows = await rowsNow(); const moved = await g.run(`return __ser() !== ${JSON.stringify('')} ;`);
    out.keys[name] = { rows, editMoved: (await g.run(`return __ser();`)) !== s0 }; console.log('key', name, JSON.stringify(out.keys[name]));
  }
  /* ── (a) THE STALE NAME: a press that commits nothing, then an unnamed edit ── */
  out.a = {};
  await g.run(`const b = __segb('', 'QUALITY', 'settings'); __show(b); await __spress(b); await __w(150); return 1;`);
  await clean(); await spress(`__segb('GRID', '96³', 'settings')`); await g.run(`await __w(600); return 1;`); await g.key(']');
  out.a.gridThenKey = await rowsNow();
  await clean(); await spress(`__segb('GRID', '64³', 'settings')`); await g.run(`await __w(600); __LW.setStage(0.41); __LW.history.note(); return 1;`);
  out.a.gridThenApi = await rowsNow();
  await g.run(`const b = __segb('', 'DISPLAY', 'settings'); __show(b); await __spress(b); await __w(150); return 1;`);
  await clean(); await spress(`__segb('THEME', 'LIGHT', 'settings')`); await g.run(`await __w(600); __LW.mod.addSource('env'); return 1;`);
  out.a.themeThenModApi = await rowsNow();
  await clean(); await spress(`__segb('THEME', 'DARK', 'settings')`); await g.run(`await __w(600); return 1;`); await g.key('c');
  out.a.themeThenKeyC = await rowsNow();
  /* the stale name survives any delay: a theme press, 5 s of nothing, then an API edit */
  await clean(); await spress(`__segb('THEME', 'SYSTEM', 'settings')`); await g.run(`await __w(5000); __LW.setStage(0.47); __LW.history.note(); return 1;`);
  out.a.themeWait5sThenApi = await rowsNow();
  await g.run(`const b = __segb('THEME', 'DARK', 'settings'); await __spress(b); await __settle(); return 1;`);
  console.log('(a)', JSON.stringify(out.a));

  /* ── (b) RIGHT-BUTTON CURVE GESTURES in the modulation window ── */
  await g.run(`__LW.layout.modulation.expand(); await __w(600); return 1;`);
  out.curveEl = await g.ev(`const cands = [...document.querySelectorAll('#modwin .m2edit, #modwin .m2svg, #modwin svg')].filter((e) => { const b = e.getBoundingClientRect(); return b.width > 40 && b.height > 20; });
    const e = cands[0]; if (!e) return { E: 'no curve surface' }; const b = e.getBoundingClientRect(); const x = b.left + b.width * 0.37, y = b.top + b.height * 0.3, h = document.elementFromPoint(x, y);
    return { cls: String(e.className.baseVal !== undefined ? e.className.baseVal : e.className), rect: [b.left, b.top, b.width, b.height].map(Math.round), p: [x, y], hitInside: !!(h && e.contains(h)) || h === e, hit: h ? String(h.className && h.className.baseVal !== undefined ? h.className.baseVal : h.className) : null,
      pts: document.querySelectorAll('#modwin .m2pt').length };`);
  console.log('curve surface', JSON.stringify(out.curveEl));
  if (out.curveEl && !out.curveEl.E) {
    const [x, y] = out.curveEl.p;
    const probeCurve = async (label, pts, button, gap, pause) => {
      await clean(); const m0 = await g.run(`return JSON.stringify(__LW.mod.model.serialize().sources);`);
      if (pause) { await g.realDrag(pts.slice(0, 6), button, gap); } // placeholder, replaced below
      return m0;
    };
    /* one right-drag on empty curve space, 12 moves 30 ms apart */
    await clean(); let s0 = await g.run(`return JSON.stringify(__LW.mod.model.serialize().sources);`);
    await g.realDrag(g.line(x, y, 30, 25, 12), 2, 30);
    out.rightDrag = { rows: await rowsNow(), modelMoved: (await g.run(`return JSON.stringify(__LW.mod.model.serialize().sources);`)) !== s0, pts: await g.run(`return document.querySelectorAll('#modwin .m2pt').length;`) };
    const u = await g.run(`const H = __LW.history, pre = __ser(); const ok = H.undo(); await __w(300); return { ok, rows: __rows() };`);
    out.rightDrag.undo = u;
    console.log('(b) one right-drag', JSON.stringify(out.rightDrag));
    /* a slow right-drag: two halves with a 700 ms hold in the middle (the quiet window is 400 ms and nothing holds it off) */
    await clean(); s0 = await g.run(`return JSON.stringify(__LW.mod.model.serialize().sources);`);
    {
      const { actions, relActions } = await import('../../../../tools/gate/drv.mjs');
      const a = [{ type: 'pointerMove', duration: 0, origin: 'viewport', x: Math.round(x + 10), y: Math.round(y + 40) }, { type: 'pointerDown', button: 2 }];
      for (let i = 1; i <= 6; i++) a.push({ type: 'pointerMove', duration: 30, origin: 'viewport', x: Math.round(x + 10 + 4 * i), y: Math.round(y + 40 - 3 * i) });
      a.push({ type: 'pause', duration: 700 });
      for (let i = 7; i <= 12; i++) a.push({ type: 'pointerMove', duration: 30, origin: 'viewport', x: Math.round(x + 10 + 4 * i), y: Math.round(y + 40 - 3 * i) });
      a.push({ type: 'pointerUp', button: 2 });
      await actions(g.s, [{ type: 'pointer', id: 'slowR', parameters: { pointerType: 'mouse' }, actions: a }]); await relActions(g.s);
    }
    out.slowRightDrag = { rows: await rowsNow(), modelMoved: (await g.run(`return JSON.stringify(__LW.mod.model.serialize().sources);`)) !== s0 };
    console.log('(b) slow right-drag (700 ms hold mid-gesture)', JSON.stringify(out.slowRightDrag));
    /* control: a LEFT drag of a curve point (held by the capture) */
    const ptxy = await g.ev(`const p = [...document.querySelectorAll('#modwin .m2pt')].find((e) => { const b = e.getBoundingClientRect(); const h = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2); return b.width > 0 && h && (h === e || e.contains(h)); }); if (!p) return null; const b = p.getBoundingClientRect(); return [b.left + b.width / 2, b.top + b.height / 2];`);
    if (ptxy) { await clean(); await g.realDrag(g.line(ptxy[0], ptxy[1], 8, 12, 10), 0, 30); out.leftPointDrag = { rows: await rowsNow() }; console.log('control: left drag of a point', JSON.stringify(out.leftPointDrag)); }
  }
  out.errs = await g.run(`return __e.slice();`);
} catch (e) { console.error(e); out.error = String(e && e.stack || e); }
finally { await g.close(); }
console.log('errs', JSON.stringify(out.errs), out.error || '');
