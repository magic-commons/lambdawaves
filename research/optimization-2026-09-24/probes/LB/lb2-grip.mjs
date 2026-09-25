/* lb2-grip.mjs — LANE LB · LB2 gate: the modulation window's grip places once per frame, and lands where the hand let go.
 * A = .tmp/base-lab/ (frozen base), B = lab/.  Headless Firefox, µs timers.
 *   LW_PORT=8725 GD_PORT=5244 node research/optimization-2026-09-24/probes/LB/lb2-grip.mjs [runs]
 * 1 synthetic burst (refute-b's FE11b arm): 60 pointermoves, each followed by one forced layout standing in for the frame's,
 *   counting getBoundingClientRect calls and ms per move; then pointerup.  Final geometry + the saved modwin x/y.
 * 2 a REAL pointer drag (WebDriver actions, 40 steps over 400 ms) from the grip to a far point, then release: final
 *   geometry + saved x/y.  A and B must land on the same numbers. */
import fs from 'node:fs';
import { open as open0 } from '../../../../tools/gate/gatekit.mjs';
const drv = await import('../../../../tools/gate/drv.mjs');
const open = async (url, o) => { for (let i = 0; ; i++) { try { return await open0(url, o); } catch (e) { if (i > 20 || !/EADDRINUSE/.test(String(e && e.message || e))) throw e; await new Promise((r) => setTimeout(r, 1000)); } } };
const PORT = process.env.LW_PORT || '8725', RUNS = +(process.argv[2] || 3);
const TREES = { A: '/.tmp/base-lab/', B: '/lab/' };
const med = (a) => { const s = a.slice().sort((x, y) => x - y); return s.length ? s[s.length >> 1] : NaN; };
const GEO = `const geo=()=>{ const L=__LW, win=document.getElementById('modwin'), rail=document.querySelector('.kwin-chiprail[aria-label="MODULATION window controls"]'), gm=L.mod.view.geometry();
  const S=L.settings.modwin||{}; return { x: gm.x, y: gm.y, w: gm.w, h: gm.h, left: win.style.left, top: win.style.top, railLeft: rail.style.left, railTop: rail.style.top,
    pre: win.querySelector('.m2pre') ? win.querySelector('.m2pre').style.left : null, saved: [S.x, S.y], tr: (document.getElementById('transport')||{}).className }; };`;
async function one(label) {
  const g = await open(`https://127.0.0.1:${PORT}${TREES[label]}?preset=1s%2B2pz&sw=0`, { width: 1600, height: 1000, script: 300000, prefs: { 'privacy.reduceTimerPrecision': false } });
  try {
    await g.waitFor('window.__LW && __LW.ready', 3000, 20);
    const burst = await g.ev(`${GEO} const L=__LW; L.pause(); L.governor.on=false; await L.settle(); L.mod.expand(); await L.settle(); await new Promise((r)=>setTimeout(r,500));
      const grip=document.querySelector('.kwin-chiprail[aria-label="MODULATION window controls"] .crail-grip') || document.querySelector('.crail-grip');
      const b=grip.getBoundingClientRect(); let x=b.left+b.width/2, y=b.top+b.height/2;
      let gb=0; const og=Element.prototype.getBoundingClientRect; Element.prototype.getBoundingClientRect=function(...a){ gb++; return og.apply(this,a); };
      grip.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,clientX:x,clientY:y,pointerId:7,pointerType:'mouse',buttons:1}));
      const N=60, t0=performance.now(); for (let i=0;i<N;i++){ x+=(i%2?7:-3); y+=2; grip.dispatchEvent(new PointerEvent('pointermove',{bubbles:true,clientX:x,clientY:y,pointerId:7,pointerType:'mouse',buttons:1})); document.body.offsetWidth; }
      const per=(performance.now()-t0)/N, gbPer=gb/N;
      grip.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,clientX:x,clientY:y,pointerId:7,pointerType:'mouse'}));
      Element.prototype.getBoundingClientRect=og;
      await new Promise((r)=>setTimeout(r,120)); await L.settle();
      return { msPerMove:+per.toFixed(4), gbcrPerMove:+gbPer.toFixed(2), after: geo(), grip: [b.left+b.width/2, b.top+b.height/2] };`);
    /* a real pointer, from the driver's own input source */
    const [gx, gy] = burst.grip.map(Math.round);
    const start = await g.ev(`const grip=document.querySelector('.kwin-chiprail[aria-label="MODULATION window controls"] .crail-grip') || document.querySelector('.crail-grip'); const b=grip.getBoundingClientRect(); return [Math.round(b.left+b.width/2), Math.round(b.top+b.height/2)];`);
    const steps = [];
    for (let i = 1; i <= 40; i++) steps.push({ type: 'pointerMove', duration: 10, origin: 'viewport', x: start[0] + Math.round(i * 9.5), y: start[1] + Math.round(i * 4.25) });
    await drv.actions(g.s, [{ type: 'pointer', id: 'lbgrip', parameters: { pointerType: 'mouse' }, actions: [
      { type: 'pointerMove', duration: 0, origin: 'viewport', x: start[0], y: start[1] }, { type: 'pointerDown', button: 0 }, ...steps, { type: 'pointerUp', button: 0 }] }]);
    await drv.relActions(g.s);
    const real = await g.ev(`${GEO} await new Promise((r)=>setTimeout(r,150)); await __LW.settle(); return { after: geo(), errs: (window.__e||[]).length };`);
    return { burst, real, start, gx, gy };
  } finally { await g.close(); }
}
const rows = { A: [], B: [] };
for (let i = 0; i < RUNS; i++) for (const L of (i % 2 ? ['B', 'A'] : ['A', 'B'])) rows[L].push(await one(L));
const s = (L) => ({ msPerMove: med(rows[L].map((r) => r.burst.msPerMove)), gbcrPerMove: med(rows[L].map((r) => r.burst.gbcrPerMove)),
  burstAfter: [...new Set(rows[L].map((r) => JSON.stringify(r.burst.after)))], realAfter: [...new Set(rows[L].map((r) => JSON.stringify(r.real.after)))], errs: rows[L].map((r) => r.real.errs) });
const out = { A: s('A'), B: s('B') };
out.sameBurst = JSON.stringify(out.A.burstAfter) === JSON.stringify(out.B.burstAfter);
out.sameReal = JSON.stringify(out.A.realAfter) === JSON.stringify(out.B.realAfter);
fs.writeFileSync('research/optimization-2026-09-24/probes/LB/lb2-grip.json', JSON.stringify({ out, rows }, null, 1));
console.log(JSON.stringify(out, null, 1));
