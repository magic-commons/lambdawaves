// S4 probe: a REAL right-drag (WebDriver input, button 2) on the first LFO's curve editor in the modulation window.
// How many rows, what are they called, and does one undo put the edit scope back byte for byte?
//   LW_PORT=8743 GD_PORT=5243 node research/release-0.3.1/probes/S4/curve-rdrag.mjs
import { open } from '../../../../tools/gate/gatekit.mjs';
import { actions, relActions } from '../../../../tools/gate/drv.mjs';
const LAB = `https://127.0.0.1:${process.env.LW_PORT || 8743}/lab/`;
const g = await open(LAB, { width: 1500, height: 1000, script: 120000, prefs: { 'privacy.reduceTimerPrecision': false } });
try {
  if (!(await g.waitFor('window.__LW&&__LW.ready', 200, 100)).ok) throw new Error('not ready');
  const at = await g.ev(`__LW.layout.modulation.expand(); await new Promise((r) => setTimeout(r, 500));
    const H = __LW.history; H.flush(); await new Promise((r) => setTimeout(r, 450)); H.flush();
    window.__n0 = H.entries().length; window.__pre = JSON.stringify(__LW.serialize({ scope: 'edit' }));
    const svg = document.querySelector('#modwin .m2dev.lfo .m2svg'); if (!svg) return { E: 'no LFO curve' };
    const b = svg.getBoundingClientRect();
    /* an empty spot: the upper-left quarter, off the curve (a sine through the middle) and off the points */
    for (const [u, v] of [[0.3, 0.12], [0.62, 0.88], [0.4, 0.15], [0.7, 0.2]]) { const x = b.left + b.width * u, y = b.top + b.height * v, h = document.elementFromPoint(x, y); if (h && svg.contains(h)) return { x, y, w: b.width, h: b.height, mode: __LW.mod.model.sourceList().find((s) => s.kind === 'lfo').shapeMode, pts: (__LW.mod.model.sourceList().find((s) => s.kind === 'lfo').points || []).length }; }
    return { E: 'the curve is covered', b: [b.left, b.top, b.width, b.height] };`);
  if (!at || at.E) throw new Error(JSON.stringify(at));
  const a = [{ type: 'pointerMove', duration: 0, origin: 'viewport', x: Math.round(at.x), y: Math.round(at.y) }, { type: 'pointerDown', button: 2 }];
  for (let i = 1; i <= 8; i++) a.push({ type: 'pointerMove', duration: 60, origin: 'viewport', x: Math.round(at.x + 30 * i / 8), y: Math.round(at.y + 20 * i / 8) });
  a.push({ type: 'pause', duration: 600 });   // a hand that rests mid-drag longer than the quiet window
  a.push({ type: 'pointerMove', duration: 60, origin: 'viewport', x: Math.round(at.x + 40), y: Math.round(at.y + 24) });
  a.push({ type: 'pointerUp', button: 2 });
  await actions(g.s, [{ type: 'pointer', id: 'rdrag', parameters: { pointerType: 'mouse' }, actions: a }]); await relActions(g.s);
  const r = await g.ev(`const H = __LW.history; await new Promise((r) => setTimeout(r, 520)); H.flush();
    const rows = H.entries().slice(window.__n0 - 1).map((e) => e.label), post = JSON.stringify(__LW.serialize({ scope: 'edit' }));
    const lfo = __LW.mod.model.sourceList().find((s) => s.kind === 'lfo');
    let undos = 0; while (JSON.stringify(__LW.serialize({ scope: 'edit' })) !== window.__pre && undos < 5 && H.undo()) undos++;
    return { rows, added: H.entries().length - window.__n0, changed: post !== window.__pre, pts: (lfo.points || []).length, mode: lfo.shapeMode, undosToPre: undos, back: JSON.stringify(__LW.serialize({ scope: 'edit' })) === window.__pre, errs: __e.slice() };`);
  console.log(JSON.stringify({ at, r }, null, 1));
} catch (e) { console.error(e); process.exitCode = 1; }
finally { await g.close(); }
