// S4 VERIFY item 4 (fresh context): KEYBOARD EDITS through keyEdit, REAL keys.  A knob drag then C within ~150 ms (two rows?);
// C three times 150 ms apart (one row or three?); keys that change no edit key (an unbound key, H, M, Space, W, X, 1) make no
// row and leave no name standing; the long action names in the card (ellipsis, the key hidden?); G (modBar) and K rows.
//   LW_PORT=8747 GD_PORT=5247 node research/release-0.3.1/probes/S4-verify/keys.mjs
import { lab } from '../S3-verify/kit.mjs';
const g = await lab();
const out = {};
const blur = () => g.run(`document.activeElement && document.activeElement.blur && document.activeElement.blur(); return 1;`);
const start = () => g.run(`await __settle(); if (__LW.history.entries().length > 40) __LW.history.clear(); window.__n0 = __LW.history.entries().length; window.__pre = __ser(); return 1;`);
const rows = () => g.run(`await __w(600); __LW.history.flush(); return { rows: __LW.history.entries().slice(window.__n0).map((e) => e.label), pending: __LW.history.pendingLabel, moved: __ser() !== window.__pre };`);
try {
  /* 1 · a real knob drag, then C ~100 ms after the release */
  await start();
  const kn = await g.run(`const k = __knob('EXPOSURE'); __show(k); await __w(80); return __at(k);`);
  await g.realDrag(g.line(kn[0], kn[1], 0, -50, 10), 0, 40);
  await g.run(`await __w(80); return 1;`); await blur(); await g.key('c');
  out.dragThenC = await rows(); console.log('knob drag then C ~100 ms', JSON.stringify(out.dragThenC));
  /* 1b · a knob drag, then C ~250 ms after the release */
  await start();
  await g.realDrag(g.line(kn[0], kn[1], 0, 40, 10), 0, 40);
  await g.run(`await __w(250); return 1;`); await blur(); await g.key('c');
  out.dragThenC250 = await rows(); console.log('knob drag then C ~250 ms', JSON.stringify(out.dragThenC250));
  /* 2 · C three times, ~150 ms apart */
  await start(); for (let i = 0; i < 3; i++) { await blur(); await g.key('c'); await g.run(`await __w(120); return 1;`); }
  out.cThrice = await rows(); out.cThrice.undo1 = await g.run(`const s = __LW.mat.style; __LW.history.undo(); await __w(100); return { before: s, after: __LW.mat.style, pre: __ser() === window.__pre };`);
  console.log('C ×3 150 ms apart', JSON.stringify(out.cThrice));
  /* 2b · C then V ~150 ms apart */
  await start(); await blur(); await g.key('c'); await g.run(`await __w(120); return 1;`); await blur(); await g.key('v');
  out.cThenV = await rows(); console.log('C then V 150 ms', JSON.stringify(out.cThenV));
  /* 3 · keys that change no edit key */
  out.noRow = {};
  for (const [label, key, mods] of [['unbound L', 'l', []], ['H hide UI', 'h', []], ['H back', 'h', []], ['M modulation window', 'm', []], ['M back', 'm', []], ['Space play', '', []], ['Space pause', '', []], ['W orbit', 'w', []], ['X axis', 'x', []], ['1 rotor', '1', []], ['N help', 'n', []], ['N back', 'n', []]]) {
    await start(); await blur(); await g.key(key, mods); const p = await g.run(`return __LW.history.pendingLabel;`);
    out.noRow[label] = { ...(await rows()), pendingRightAfter: p };
  }
  console.log('no-row keys', JSON.stringify(out.noRow, null, 0));
  /* 3b · a no-op key's name, then an unnamed edit 150 ms later: does the edit take the key's name? */
  await start(); await blur(); await g.key('x'); await g.run(`await __w(150); __LW.setStage(0.58); __LW.history.note(); return 1;`);
  out.xThenApi = await rows(); console.log('X then API edit 150 ms', JSON.stringify(out.xThenApi));
  /* 4 · G (modBar) and K (slap): rows and how the card shows their names */
  await start(); await blur(); await g.key('g'); out.G = await rows();
  await start(); await blur(); await g.key('k'); out.K = await rows();
  out.card = await g.run(`const d = document.querySelector('.dev[data-id="history"]'); __LW.layout.reopen('history'); await __w(200); __show(d.querySelector('.hist-list')); await new Promise((r) => requestAnimationFrame(r)); await __w(50);
    return [...d.querySelectorAll('.hist-row')].slice(0, 6).map((b) => { const l = b.querySelector('.hist-lbl'); return { text: l.textContent, cut: l.scrollWidth > l.clientWidth + 1, w: l.clientWidth, title: b.title }; });`);
  console.log('G', JSON.stringify(out.G), 'K', JSON.stringify(out.K));
  console.log('card', JSON.stringify(out.card, null, 0));
  out.errs = await g.run(`return __e.slice();`);
} catch (e) { console.error(e); out.error = String(e && e.stack || e); }
finally { await g.close(); }
console.log('errs', JSON.stringify(out.errs), out.error || '');
