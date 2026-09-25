/* occl.mjs — Lane C: the cost of rack.js refreshOcclusion (L5), replicated verbatim in the page (the function is a closure,
 * not reachable through __LW).  CLEAN = layout already flushed (the loop's common case: it runs first in the frame);
 * DIRTY = one text write before each call, so the call pays the forced style+layout itself (the worst case).
 * Also: the cost of toggling body.tablet-motion (the iPad rule `.dev * { box-shadow:none }`) with a forced style flush.
 *   LW_PORT=8721 GD_PORT=5233 node research/optimization-2026-09-24/probes/C/occl.mjs */
import { open } from '../../../../tools/gate/gatekit.mjs';
import fs from 'node:fs';
const PORT = process.env.LW_PORT || '8721';
const g = await open(`https://127.0.0.1:${PORT}/lab/?preset=1s%2B2pz&sw=0&warn=0`, { width: 1920, height: 1080, script: 600000, prefs: { 'privacy.reduceTimerPrecision': false } });
export const OCCL = String.raw`
const dom = { canvas: document.getElementById('field') }, rack = document.getElementById('rack'), rackL = document.getElementById('rackL'), floats = document.getElementById('floats');
function refreshOcclusion() {
  const cb = dom.canvas.getBoundingClientRect(), out = [], body = document.body;
  const rect = (el) => { if (!el || el.hidden || getComputedStyle(el).visibility === 'hidden') return null;
    const r = el.getBoundingClientRect(); if (r.width < 2 || r.height < 2) return null;
    let x0 = r.left - cb.left, y0 = r.top - cb.top, x1 = r.right - cb.left, y1 = r.bottom - cb.top;
    if (el.classList.contains('m2dev')) { const clip = el.closest('.m2run')?.getBoundingClientRect();
      if (clip) { x0 = Math.max(x0, clip.left - cb.left); y0 = Math.max(y0, clip.top - cb.top); x1 = Math.min(x1, clip.right - cb.left); y1 = Math.min(y1, clip.bottom - cb.top); } }
    return x1 - x0 < 2 || y1 - y0 < 2 || x1 <= 0 || y1 <= 0 || x0 >= cb.width || y0 >= cb.height ? null : [x0, y0, x1, y1]; };
  const add = (el) => { const r = rect(el); if (r) out.push(r); };
  const disconnected = body.classList.contains('disconnected') && !body.classList.contains('phone');
  const surfaces = (d) => { if (d.id === 'modwin') return d.querySelectorAll('.m2rail, .m2dev, .m2workbar'); if (d.classList.contains('kwin-chiprail')) return d.querySelectorAll('.crail-chip');
    if (disconnected && d.classList.contains('dev')) return [d.querySelector('.dev-head'), d.querySelector('.dev-body')]; return [d]; };
  const rackShown = !body.classList.contains('rack-hidden') || body.classList.contains('rack-peek');
  const cards = [];
  if (rackShown) for (const rk of [rack, rackL]) if (rk) for (const d of rk.children) if (d.classList.contains('dev') && !d.classList.contains('closed')) cards.push(d);
  for (const d of floats.children) if (!d.hidden && !d.classList.contains('closed')) for (const s of surfaces(d)) add(s);
  for (const id of ['transport', 'notebook', 'sheet', 'rackAddList', 'rackFavList', 'keysheet']) add(document.getElementById(id));
  add(document.querySelector('#keymap .km-panel'));
  const rackRects = [];
  for (const d of cards) for (const s of surfaces(d)) { const r = rect(s); if (r) rackRects.push(r); }
  if (out.length + rackRects.length <= 32) out.push(...rackRects); else if (rackShown) { add(rack); add(rackL); }
  return out.length;
}
const probe = document.querySelector('#transport .ro-val') || document.body;
const N = 60; let clean = 0, dirty = 0, n = 0;
for (let i = 0; i < N; i++) { void document.body.offsetHeight; let t = performance.now(); n = refreshOcclusion(); clean += performance.now() - t;
  probe.textContent = (i % 2 ? 'x' : 'y') + probe.textContent.slice(1); t = performance.now(); refreshOcclusion(); dirty += performance.now() - t; }
/* the tablet-motion toggle, flushed: every element under .dev re-matches body.tablet-motion .dev * */
const devs = document.querySelectorAll('.dev *').length; let tog = 0;
for (let i = 0; i < 10; i++) { const t = performance.now(); document.body.classList.toggle('tablet-motion'); getComputedStyle(document.querySelector('.dev .k-dial') || document.body).boxShadow; void document.body.offsetHeight; tog += performance.now() - t; }
document.body.classList.remove('tablet-motion');
/* frost-hold toggle, flushed (the STILL policy's per-play act) */
let hold = 0; for (let i = 0; i < 10; i++) { const t = performance.now(); document.body.classList.toggle('frost-hold'); getComputedStyle(document.querySelector('.dev') || document.body).backdropFilter; void document.body.offsetHeight; hold += performance.now() - t; }
document.body.classList.remove('frost-hold');
return { rects: n, cleanMs: +(clean / N).toFixed(3), dirtyMs: +(dirty / N).toFixed(3), tabletToggleMs: +(tog / 10).toFixed(3), frostHoldToggleMs: +(hold / 10).toFixed(3), devDescendants: devs, open: document.querySelectorAll('.dev:not(.closed)').length };
`;
const out = {};
try {
  await g.waitFor('window.__LW && __LW.ready', 3000, 20);
  await g.ev(`__LW.pause(); await __LW.settle(); return 1;`);
  out.defaultDisc = await g.ev(OCCL); console.log('default (disconnected)', JSON.stringify(out.defaultDisc));
  await g.ev(`__LW.setDisconnected(false); await __LW.settle(); return 1;`);
  out.defaultConnected = await g.ev(OCCL); console.log('connected', JSON.stringify(out.defaultConnected));
  await g.ev(`__LW.setDisconnected(true); for(const d of document.querySelectorAll('.dev')) d.classList.remove('closed','folded'); __LW.mod.expand(); await __LW.settle(); await new Promise(r=>setTimeout(r,800)); return 1;`);
  out.allOpenModwin = await g.ev(OCCL); console.log('every window + modwin (disconnected)', JSON.stringify(out.allOpenModwin));
} catch (e) { console.error('PROBE ERROR', e); out.error = String(e); }
finally { await g.close(); }
fs.writeFileSync('research/optimization-2026-09-24/probes/C/occl-ff.json', JSON.stringify(out, null, 1));
