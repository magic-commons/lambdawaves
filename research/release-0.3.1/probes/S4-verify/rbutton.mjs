// S4 VERIFY item 5 (fresh context): the RIGHT button, REAL WebDriver input on LFO 1's curve — a quick right-drag, a right-drag
// with a 700 ms rest, a Shift-right-click, a tension handle bent (left drag) then reset by right-click and by double-click, an
// Alt-left-click on a point; each: rows, name, undo byte-identical and the model back.  Then a LOST RELEASE: a pointerdown with
// no up (same pointerId as the next press, and a different one), and whether the ring still commits.
//   LW_PORT=8747 GD_PORT=5247 node research/release-0.3.1/probes/S4-verify/rbutton.mjs
import { lab } from '../S3-verify/kit.mjs';
import { actions, relActions } from '../../../../tools/gate/drv.mjs';
const g = await lab();
const out = {};
let n = 0;
const drive = async (a, keys) => { const seq = [{ type: 'pointer', id: 'rb' + (++n), parameters: { pointerType: 'mouse' }, actions: a }]; if (keys) seq.unshift({ type: 'key', id: 'rk' + n, actions: keys }); await actions(g.s, seq); await relActions(g.s); };
const mv = (x, y, d = 0) => ({ type: 'pointerMove', duration: d, origin: 'viewport', x: Math.round(x), y: Math.round(y) });
const open = () => g.run(`await __settle(); if (__LW.history.entries().length > 40) __LW.history.clear(); window.__n0 = __LW.history.entries().length; window.__pre = __ser();
  window.__m0 = JSON.stringify(__LW.mod.model.serialize().sources); return 1;`);
const close = (tag) => g.run(`await __w(600); const H = __LW.history; H.flush(); const E = H.entries(), post = __ser(), m1 = JSON.stringify(__LW.mod.model.serialize().sources);
  const r = { tag: ${JSON.stringify(tag)}, rows: E.slice(window.__n0).map((e) => e.label), changed: post !== window.__pre, modelChanged: m1 !== window.__m0 };
  if (r.rows.length) { H.undo(); await __w(250); r.undoBack = __ser() === window.__pre; r.modelBack = JSON.stringify(__LW.mod.model.serialize().sources) === window.__m0; H.redo(); await __w(250); r.redoSame = __ser() === post; await __w(500); H.flush(); r.after = H.entries().length - window.__n0; }
  return r;`);
try {
  await g.run(`__LW.layout.modulation.expand(); await __w(700); return 1;`);
  await g.run(`window.__empty = () => { const svg = document.querySelector('#modwin .m2dev.lfo .m2svg'), b = svg.getBoundingClientRect();
      const marks = [...svg.querySelectorAll('.m2pt, .m2tn, .m2playdot')].map((e) => { const r = e.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; });
      let best = null, far = 0;
      for (let u = 0.12; u <= 0.88; u += 0.04) for (let v = 0.15; v <= 0.85; v += 0.05) { const x = b.left + b.width * u, y = b.top + b.height * v, h = document.elementFromPoint(x, y);
        if (!h || !svg.contains(h)) continue; const d = Math.min(...marks.map(([mx, my]) => Math.hypot(mx - x, my - y))); if (d > far) { far = d; best = [x, y]; } }
      return far >= 20 ? best : null; };
    window.__mark = (sel, k = 1) => { const svg = document.querySelector('#modwin .m2dev.lfo .m2svg'); const els = [...svg.querySelectorAll(sel)].filter((e) => { const r = e.getBoundingClientRect(); const h = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return r.width > 0 && h && (h === e || e.contains(h) || h.contains(e)); });
      const e = els[Math.min(k, els.length - 1)]; if (!e) return null; const r = e.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2, els.length]; };
    return { mode: __LW.mod.model.sourceList().find((s) => s.kind === 'lfo').shapeMode };`);
  /* 1 · a quick right-drag on empty space */
  let at = await g.run(`return __empty();`); await open();
  await drive([mv(at[0], at[1]), { type: 'pointerDown', button: 2 }, ...Array.from({ length: 6 }, (_, i) => mv(at[0] + 4 * (i + 1), at[1] + 3 * (i + 1), 30)), { type: 'pointerUp', button: 2 }]);
  out.quick = await close('right-drag, quick'); console.log(JSON.stringify(out.quick));
  /* 2 · a right-drag with a 700 ms rest */
  at = await g.run(`return __empty();`); await open();
  await drive([mv(at[0], at[1]), { type: 'pointerDown', button: 2 }, mv(at[0] + 10, at[1] + 8, 60), { type: 'pause', duration: 700 }, mv(at[0] + 20, at[1] + 12, 60), { type: 'pointerUp', button: 2 }]);
  out.rest = await close('right-drag, 700 ms rest'); console.log(JSON.stringify(out.rest));
  /* 3 · Shift-right-click */
  at = await g.run(`return __empty();`); await open();
  await drive([mv(at[0], at[1]), { type: 'pause', duration: 0 }, { type: 'pointerDown', button: 2 }, { type: 'pointerUp', button: 2 }, { type: 'pause', duration: 0 }], [{ type: 'pause', duration: 0 }, { type: 'keyDown', value: '' }, { type: 'pause', duration: 0 }, { type: 'pause', duration: 0 }, { type: 'keyUp', value: '' }]);
  out.shift = await close('Shift-right-click'); console.log(JSON.stringify(out.shift));
  /* 4 · a tension handle: bend it (left drag), then reset it by right-click, then bend and reset by double-click */
  let tn = await g.run(`return __mark('.m2tn', 1);`);
  out.tnCount = tn && tn[2];
  if (tn) {
    await open(); await drive([mv(tn[0], tn[1]), { type: 'pointerDown', button: 0 }, ...Array.from({ length: 6 }, (_, i) => mv(tn[0], tn[1] - 5 * (i + 1), 30)), { type: 'pointerUp', button: 0 }]);
    out.bend = await close('tension bent (left drag)'); console.log(JSON.stringify(out.bend));
    tn = await g.run(`return __mark('.m2tn', 1);`);
    await open(); await drive([mv(tn[0], tn[1]), { type: 'pointerDown', button: 2 }, { type: 'pointerUp', button: 2 }]);
    out.rreset = await close('tension reset (right-click)'); console.log(JSON.stringify(out.rreset));
    tn = await g.run(`return __mark('.m2tn', 1);`);
    await drive([mv(tn[0], tn[1]), { type: 'pointerDown', button: 0 }, ...Array.from({ length: 6 }, (_, i) => mv(tn[0], tn[1] + 5 * (i + 1), 30)), { type: 'pointerUp', button: 0 }]);
    await g.run(`await __w(600); __LW.history.flush(); return 1;`);
    tn = await g.run(`return __mark('.m2tn', 1);`);
    await open(); await drive([mv(tn[0], tn[1]), { type: 'pointerDown', button: 0 }, { type: 'pointerUp', button: 0 }, { type: 'pause', duration: 60 }, { type: 'pointerDown', button: 0 }, { type: 'pointerUp', button: 0 }]);
    out.dreset = await close('tension reset (double-click)'); console.log(JSON.stringify(out.dreset));
  } else console.log('no tension handle found');
  /* 5 · Alt-left-click on a point */
  const pt = await g.run(`return __mark('.m2pt', 2);`);
  if (pt) { await open(); await drive([mv(pt[0], pt[1]), { type: 'pause', duration: 0 }, { type: 'pointerDown', button: 0 }, { type: 'pointerUp', button: 0 }, { type: 'pause', duration: 0 }], [{ type: 'pause', duration: 0 }, { type: 'keyDown', value: '' }, { type: 'pause', duration: 0 }, { type: 'pause', duration: 0 }, { type: 'keyUp', value: '' }]);
    out.altDel = await close('Alt-left-click on a point'); console.log(JSON.stringify(out.altDel)); }
  /* 6 · a right-click on the stage canvas and on a rack knob: rows? the ring still commits after? */
  out.rclickElse = await g.run(`return 1;`);
  const cv = await g.run(`const c = document.querySelector('canvas'); const b = c.getBoundingClientRect(); return [b.left + b.width * 0.45, b.top + b.height * 0.5];`);
  await open(); await drive([mv(cv[0], cv[1]), { type: 'pointerDown', button: 2 }, { type: 'pointerUp', button: 2 }]);
  out.rStage = await g.run(`await __w(100); __LW.setStage(0.66); __LW.history.note(); await __w(600); return { rows: __LW.history.entries().slice(window.__n0).map((e) => e.label) };`);
  console.log('right-click on the stage, then an API edit', JSON.stringify(out.rStage));
  /* 7 · LOST RELEASES (synthetic: a pointerdown whose up never comes) */
  out.lost = await g.run(`const H = __LW.history; await __settle(); if (H.entries().length > 40) H.clear();
    const k = __knob('EXPOSURE'); __show(k); await __w(100); const b = k.getBoundingClientRect(), x = b.left + b.width / 2, y = b.top + b.height / 2;
    const PE = (type, id, btn = 0) => k.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, composed: true, pointerId: id, pointerType: id > 100 ? 'touch' : 'mouse', button: btn, buttons: type === 'pointerup' ? 0 : (btn === 2 ? 2 : 1), isPrimary: true, clientX: x, clientY: y }));
    const probe = async () => { const n0 = H.entries().length; __LW.setStage(0.3 + Math.random() * 0.4); H.note(); await __w(650); return H.entries().length - n0; };
    const r = {};
    PE('pointerdown', 1, 2); await __w(50); r.whileStale = await probe();                 /* a right press whose up was lost: does a keyboard/API edit commit? */
    PE('pointerdown', 1, 0); await __w(30); PE('pointerup', 1, 0); await __w(50); r.afterSameIdPress = await probe();
    PE('pointerdown', 201, 0); await __w(50); PE('pointerdown', 202, 0); await __w(30); PE('pointerup', 202, 0); await __w(50); r.afterOtherIdPress = await probe();   /* touch: a new finger has a new id */
    await __w(5200); r.after5s = await probe();
    window.dispatchEvent(new Event('blur')); await __w(50); r.afterBlur = await probe();
    return r;`);
  console.log('lost releases (1 = the probe edit committed as its own row)', JSON.stringify(out.lost));
  out.errs = await g.run(`return __e.slice();`);
} catch (e) { console.error(e); out.error = String(e && e.stack || e); }
finally { await g.close(); }
console.log('errs', JSON.stringify(out.errs), out.error || '');
