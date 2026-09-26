// S4 probe: a REAL Shift-right-click on the first LFO's curve — what does it change, and is it one named row?
//   LW_PORT=8743 GD_PORT=5243 node research/release-0.3.1/probes/S4/curve-shiftclick.mjs
import { open } from '../../../../tools/gate/gatekit.mjs';
import { actions, relActions } from '../../../../tools/gate/drv.mjs';
const LAB = `https://127.0.0.1:${process.env.LW_PORT || 8743}/lab/`;
const g = await open(LAB, { width: 1500, height: 1000, script: 120000, prefs: { 'privacy.reduceTimerPrecision': false } });
try {
  if (!(await g.waitFor('window.__LW&&__LW.ready', 200, 100)).ok) throw new Error('not ready');
  const at = await g.ev(`__LW.layout.modulation.expand(); await new Promise((r) => setTimeout(r, 500));
    const H = __LW.history; H.flush(); await new Promise((r) => setTimeout(r, 450)); H.flush();
    window.__n0 = H.entries().length; window.__src0 = JSON.stringify(__LW.mod.model.sourceList().find((s) => s.kind === 'lfo'));
    const svg = document.querySelector('#modwin .m2dev.lfo .m2svg'), b = svg.getBoundingClientRect();
    for (const [u, v] of [[0.62, 0.12], [0.4, 0.88]]) { const x = b.left + b.width * u, y = b.top + b.height * v, h = document.elementFromPoint(x, y); if (h && svg.contains(h)) return { x, y, hit: String(h.className.baseVal ?? h.className) }; }
    return { E: 'covered' };`);
  if (!at || at.E) throw new Error(JSON.stringify(at));
  const p = [{ type: 'pointerMove', duration: 0, origin: 'viewport', x: Math.round(at.x), y: Math.round(at.y) }, { type: 'pointerDown', button: 2 }, { type: 'pointerUp', button: 2 }, { type: 'pause', duration: 0 }];
  const k = [{ type: 'keyDown', value: '' }, { type: 'pause', duration: 0 }, { type: 'pause', duration: 0 }, { type: 'keyUp', value: '' }];
  await actions(g.s, [{ type: 'key', id: 'sk', actions: k }, { type: 'pointer', id: 'rc', parameters: { pointerType: 'mouse' }, actions: p }]); await relActions(g.s);
  const r = await g.ev(`const H = __LW.history; await new Promise((r) => setTimeout(r, 520)); H.flush();
    const a = JSON.parse(window.__src0), b = __LW.mod.model.sourceList().find((s) => s.kind === 'lfo');
    const diff = (x, y, p = "", o = []) => { if (x && y && typeof x === "object" && typeof y === "object") { for (const k of new Set([...Object.keys(x), ...Object.keys(y)])) diff(x[k], y[k], p + "." + k, o); } else if (JSON.stringify(x) !== JSON.stringify(y)) o.push(p + ": " + JSON.stringify(x) + " → " + JSON.stringify(y)); return o; };
    return { diff: diff(a, JSON.parse(JSON.stringify(b))).slice(0, 20), rows: H.entries().slice(window.__n0).map((e) => e.label), pts: [(a.points || []).length, (b.points || []).length], mode: [a.shapeMode, b.shapeMode], wave: [a.wave, b.wave], preset: [a.preset, b.preset], errs: __e.slice() };`);
  console.log(JSON.stringify({ at, r }, null, 1));
} catch (e) { console.error(e); process.exitCode = 1; }
finally { await g.close(); }
