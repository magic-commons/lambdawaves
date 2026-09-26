// S4 VERIFY item 3 (fresh context): STALE NAMES with REAL input (WebDriver pointer and keys), not synthetic presses.
// The S3 verifier's table, the deliberate cases (a real knob drag; a touch-order tap on KEPLER), and the grace window's edges:
// an unnamed edit 150 ms after a preference press; Ctrl+Z (real key) then an unnamed edit 100 ms later; the UNDO button with
// nothing to undo.
//   LW_PORT=8747 GD_PORT=5247 node research/release-0.3.1/probes/S4-verify/stale.mjs
import { lab } from '../S3-verify/kit.mjs';
const g = await lab();
const out = {};
const room = `if (__LW.history.entries().length > 40) __LW.history.clear();`;
/** settle, then press `sel` with a REAL click, wait `wait` ms, then run `then` (a page expression or an async driver fn); rows made */
async function pressThen(label, sel, then, wait = 600) {
  const at = await g.run(`await __settle(); ${room} window.__n0 = __LW.history.entries().length; window.__pre = __ser(); const e = ${sel}; if (!e) return { E: 'missing ${label}' }; const pg = e.closest('.settings-page'); if (pg && pg.hidden) { const vp = pg.parentElement, i = [...vp.children].indexOf(pg), lbl = ['LOOK', 'DISPLAY', 'QUALITY'][i]; const tb = [...vp.parentElement.querySelectorAll('.seg-b')].find((b) => b.textContent.trim() === lbl && !vp.contains(b)); if (tb) tb.click(); await __w(120); } const d0 = e.closest('.dev'); if (d0) __LW.layout.raise(d0.dataset.id); await __w(150); __show(e); await __w(80); return __at(e);`);
  if (!at || at.E) { out[label] = { E: at && at.E || 'covered ' + await g.run('return window.__coveredBy') }; console.log(label, JSON.stringify(out[label])); return; }
  await g.click(at[0], at[1]);
  await g.run(`await __w(${wait}); return 1;`);
  if (typeof then === 'function') await then(); else await g.run(then + '; return 1;');
  out[label] = await g.run(`await __w(560); __LW.history.flush(); return { rows: __LW.history.entries().slice(window.__n0).map((e) => e.label), pending: __LW.history.pendingLabel };`);
  console.log(label, JSON.stringify(out[label]));
}
const blur = () => g.run(`document.activeElement && document.activeElement.blur && document.activeElement.blur(); return 1;`);
try {
  const themeOther = `__segb('THEME', __LW.themeChoice === 'light' ? 'DARK' : 'LIGHT', 'settings')`;
  const themeBack = async () => { await g.run(`const e = __segb('THEME', 'DARK', 'settings'), b = e; const pg = e.closest('.settings-page'); if (pg && pg.hidden) { const vp = pg.parentElement, i = [...vp.children].indexOf(pg), lbl = ['LOOK', 'DISPLAY', 'QUALITY'][i]; const tb = [...vp.parentElement.querySelectorAll('.seg-b')].find((b) => b.textContent.trim() === lbl && !vp.contains(b)); if (tb) tb.click(); await __w(120); } __LW.layout.raise('settings'); await __w(150); __show(b); const xy = __at(b); window.__xy = xy; return 1;`); const xy = await g.run('return window.__xy'); await g.click(xy[0], xy[1]); await g.run(`await __settle(); return 1;`); };
  /* ── the S3 verifier's table, real presses ── */
  await pressThen('GRID 96³ then ] key', `__segb('GRID', '96³', 'settings')`, async () => { await blur(); await g.key(']'); });
  await pressThen('GRID 64³ then LW.setStage+note', `__segb('GRID', '64³', 'settings')`, `__LW.setStage(0.41); __LW.history.note()`);
  await pressThen('THEME other then LW.mod.addSource', themeOther, `__LW.mod.addSource('env')`); await themeBack();
  await pressThen('FRAME OFF then a stage edit', `__segb('FRAME', 'OFF', 'settings')`, `__LW.setStage(0.61); __LW.history.note()`);
  await pressThen('FRAME BOX back then nothing', `__segb('FRAME', 'BOX', 'settings')`, `0`);
  await pressThen('THEME other then C key 60 ms later', themeOther, async () => { await blur(); await g.key('c'); }, 60); await themeBack();
  await pressThen('THEME other, 5 s, then LW.setStage+note', themeOther, `__LW.setStage(0.47); __LW.history.note()`, 5000); await themeBack();
  /* UNDO button (real click) with an edit to undo, then an API edit */
  await g.run(`await __settle(); __LW.setStage(0.33); __LW.history.flush(); return 1;`);
  await pressThen('UNDO button (real) then API edit', `__trig('UNDO')`, `__LW.setStage(0.52); __LW.history.note()`, 100);
  /* UNDO button with NOTHING to undo (disabled?) then an API edit 100 ms later */
  await g.run(`await __settle(); __LW.history.clear(); await __w(100); return 1;`);
  out.undoDisabled = await g.run(`const t = __trig('UNDO'); return { disabled: t.disabled, aria: t.getAttribute('aria-disabled'), cls: t.className };`);
  await pressThen('UNDO button with nothing to undo, then API edit 100 ms later', `__trig('UNDO')`, `__LW.setStage(0.53); __LW.history.note()`, 100);
  /* ── the grace window: an unnamed edit 150 ms after a preference press takes its name (by design?) ── */
  await pressThen('THEME other then LW.setStage+note 150 ms later (inside the 400 ms grace)', themeOther, `__LW.setStage(0.44); __LW.history.note()`, 150); await themeBack();
  await pressThen('GRID 96³ then LW.loadPreset 150 ms later', `__segb('GRID', '96³', 'settings')`, `__LW.loadPreset('2p+')`, 150);
  /* ── Ctrl+Z (a REAL key, through keyEdit) then an unnamed edit 100 ms later ── */
  await g.run(`await __settle(); ${room} __LW.setStage(0.36); __LW.history.flush(); window.__n0 = __LW.history.entries().length; return 1;`);
  await blur(); await g.key('z', ['']);
  out.ctrlzPending = await g.run(`return { pending: __LW.history.pendingLabel, cursor: __LW.history.cursor };`);
  await g.run(`await __w(100); __LW.setStage(0.57); __LW.history.note(); return 1;`);
  out['Ctrl+Z then API edit 100 ms later'] = await g.run(`await __w(560); __LW.history.flush(); const E = __LW.history.entries(); return { rows: E.map((e) => e.label).slice(-3), cursor: __LW.history.cursor, n: E.length };`);
  console.log('Ctrl+Z pending', JSON.stringify(out.ctrlzPending), 'then API edit', JSON.stringify(out['Ctrl+Z then API edit 100 ms later']));
  /* ── the deliberate cases ── */
  /* a REAL knob drag (EXPOSURE) */
  const kn = await g.run(`await __settle(); ${room} window.__n0 = __LW.history.entries().length; const k = __knob('EXPOSURE'); if (!k) return { E: 'no EXPOSURE' }; __show(k); await __w(80); return __at(k.querySelector('.k-dial, svg, canvas') || k);`);
  if (kn && !kn.E) { await g.realDrag(g.line(kn[0], kn[1], 0, -60, 12), 0, 40); out.knobDrag = await g.run(`await __w(560); __LW.history.flush(); return { rows: __LW.history.entries().slice(window.__n0).map((e) => e.label) };`); }
  else out.knobDrag = kn;
  console.log('real knob drag', JSON.stringify(out.knobDrag));
  /* a TOUCH-ORDER tap on KEPLER ORBIT: pointerdown/up (touch), then the click 100 ms later */
  out.touchTap = await g.run(`await __settle(); ${room} const n0 = __LW.history.entries().length; const s = __sw('KEPLER ORBIT'); __show(s); await __w(80);
    const b = s.getBoundingClientRect(), x = b.left + b.width / 2, y = b.top + b.height / 2, t = document.elementFromPoint(x, y);
    const P = (type) => t.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, composed: true, pointerId: 4242, pointerType: 'touch', button: 0, buttons: type === 'pointerup' ? 0 : 1, isPrimary: true, clientX: x, clientY: y }));
    const was = __LW.serialize().presentation.overlays.kepler;
    P('pointerdown'); await __w(40); P('pointerup'); await __w(100); t.click(); await __w(600); __LW.history.flush();
    const rows = __LW.history.entries().slice(n0).map((e) => e.label), now = __LW.serialize().presentation.overlays.kepler;
    /* and back off, by the same tap */
    P('pointerdown'); await __w(40); P('pointerup'); await __w(100); t.click(); await __w(600); __LW.history.flush();
    return { was, now, rows, rows2: __LW.history.entries().slice(n0).map((e) => e.label), target: t.className };`);
  console.log('touch-order tap', JSON.stringify(out.touchTap));
  /* a touch-order tap whose click lands 450 ms after the release (past the 400 ms grace): does the row keep its name? */
  out.touchTapLate = await g.run(`await __settle(); ${room} const n0 = __LW.history.entries().length; const s = __sw('KEPLER ORBIT'); __show(s); await __w(80);
    const b = s.getBoundingClientRect(), x = b.left + b.width / 2, y = b.top + b.height / 2, t = document.elementFromPoint(x, y);
    const P = (type) => t.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, composed: true, pointerId: 4243, pointerType: 'touch', button: 0, buttons: type === 'pointerup' ? 0 : 1, isPrimary: true, clientX: x, clientY: y }));
    P('pointerdown'); await __w(40); P('pointerup'); await __w(450); t.click(); await __w(600); __LW.history.flush();
    const rows = __LW.history.entries().slice(n0).map((e) => e.label);
    P('pointerdown'); await __w(40); P('pointerup'); await __w(60); t.click(); await __w(600); __LW.history.flush();
    return { rows };`);
  console.log('touch-order tap, click 450 ms late', JSON.stringify(out.touchTapLate));
  out.errs = await g.run(`return __e.slice();`);
} catch (e) { console.error(e); out.error = String(e && e.stack || e); }
finally { await g.close(); }
console.log('errs', JSON.stringify(out.errs), out.error || '');
