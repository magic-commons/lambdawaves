/* boot.mjs — LANE D: where the time to LW.ready goes.
 *   LW_PORT=8721 GD_PORT=5234 node research/optimization-2026-09-24/probes/D/boot.mjs [runs] [out.json]
 * Runs `runs` fresh headless-Firefox sessions against the INSTRUMENTED copy (probes/D/lab-i, built by instrument.py:
 * the shipped rack.js plus performance.mark statements and counters), then `runs` against the real /lab/ for the
 * uninstrumented ready time.  Every number is read inside the page. */
import { open } from '../../../../tools/gate/gatekit.mjs';
import fs from 'node:fs';
const PORT = process.env.LW_PORT || '8721';
const RUNS = +(process.argv[2] || 3);
const OUT = process.argv[3] || 'research/optimization-2026-09-24/probes/D/boot.json';
const prefs = { 'privacy.reduceTimerPrecision': false };
const COLLECT = `
  const nav = performance.getEntriesByType('navigation')[0] || {};
  const res = performance.getEntriesByType('resource');
  const marks = performance.getEntriesByType('mark').map(m => [m.name, +m.startTime.toFixed(1)]);
  const js = res.filter(r => /\\.js(\\?|$)/.test(r.name)), css = res.filter(r => /\\.css(\\?|$)/.test(r.name)), fonts = res.filter(r => /\\.woff2/.test(r.name));
  const mx = (a, k) => a.length ? +Math.max(...a.map(r => r[k])).toFixed(1) : 0, mn = (a, k) => a.length ? +Math.min(...a.map(r => r[k])).toFixed(1) : 0;
  const sum = (a, k) => a.reduce((s, r) => s + (r[k] || 0), 0);
  const devs = [...document.querySelectorAll('.dev')].map(d => ({ id: d.dataset.id, closed: d.classList.contains('closed'), hidden: d.hidden, folded: d.classList.contains('folded'), els: d.getElementsByTagName('*').length, canvases: d.getElementsByTagName('canvas').length, knobs: d.querySelectorAll('.k').length }));
  const canv = [...document.getElementsByTagName('canvas')].map(c => [c.id || c.className || '?', c.width, c.height]);
  return { nav: { domInteractive: +(nav.domInteractive||0).toFixed(1), dcl: +(nav.domContentLoadedEventEnd||0).toFixed(1), load: +(nav.loadEventEnd||0).toFixed(1), responseEnd: +(nav.responseEnd||0).toFixed(1) },
    res: { n: res.length, js: js.length, jsBytes: sum(js, 'encodedBodySize'), jsFirstStart: mn(js, 'startTime'), jsLastEnd: mx(js, 'responseEnd'), css: css.length, cssBytes: sum(css, 'encodedBodySize'), cssLastEnd: mx(css, 'responseEnd'), fonts: fonts.map(f => [f.name.split('/').pop(), +f.startTime.toFixed(0), +f.responseEnd.toFixed(0)]), all: res.map(r => [r.name.replace(/^.*?\\/(lab|lab-i)\\//, ''), +r.startTime.toFixed(1), +r.responseEnd.toFixed(1), r.encodedBodySize, r.initiatorType]) },
    marks, cnt: window.__P ? __P.cnt : null, t: window.__P ? Object.fromEntries(Object.entries(__P.t).map(([k, v]) => [k, +v.toFixed(2)])) : null,
    dom: { elements: document.getElementsByTagName('*').length, rackEls: (document.getElementById('rack')||{getElementsByTagName:()=>[]}).getElementsByTagName('*').length, floatsEls: document.getElementById('floats').getElementsByTagName('*').length, transportEls: document.getElementById('transport').getElementsByTagName('*').length, styleSheets: document.styleSheets.length, cssRules: [...document.styleSheets].reduce((n, s) => { try { return n + s.cssRules.length; } catch (e) { return n; } }, 0) },
    devs, canv, slow: window.__P ? __P.slow : null, errs: window.__e, ready: window.__LW && __LW.ready, fieldOk: window.__LW && __LW.field.ok };`;
const R = { at: new Date().toISOString(), inst: [], plain: [] };
for (let i = 0; i < RUNS; i++) {
  const g = await open(`https://127.0.0.1:${PORT}/research/optimization-2026-09-24/probes/D/lab-i/?preset=1s%2B2pz&sw=0`, { width: 1920, height: 1080, prefs });
  try {
    await g.waitFor('window.__LW && __LW.ready', 3000, 10);
    await g.ev('await new Promise(r => setTimeout(r, 400)); return 1;');
    const r = await g.ev(COLLECT); R.inst.push(r);
    const m = Object.fromEntries(r.marks);
    console.log('inst', i, 'ready', m['lw-ready'], 'field', m['field-start'], '→', m['field-end'], 'dcl', r.nav.dcl, 'jsLastEnd', r.res.jsLastEnd, 'els', r.dom.elements);
  } finally { await g.close(); }
}
for (let i = 0; i < RUNS; i++) {
  const g = await open(`https://127.0.0.1:${PORT}/lab/?preset=1s%2B2pz&sw=0`, { width: 1920, height: 1080, prefs });
  try {
    const w = await g.ev(`for (let i = 0; i < 4000; i++) { if (window.__LW && __LW.ready) return +performance.now().toFixed(1); await new Promise(r => setTimeout(r, 2)); } return -1;`);
    await g.ev('await new Promise(r => setTimeout(r, 400)); return 1;');
    const r = await g.ev(COLLECT); r.readyPolled = w; R.plain.push(r);
    console.log('plain', i, 'ready≈', w, 'dcl', r.nav.dcl, 'jsLastEnd', r.res.jsLastEnd, 'els', r.dom.elements);
  } finally { await g.close(); }
}
fs.writeFileSync(OUT, JSON.stringify(R, null, 1));
console.log('wrote', OUT);
