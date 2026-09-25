/* lb3-paint.mjs — LANE LB · LB3 gate: the open modulation window's paint() writes only what changed.
 * A = .tmp/base-lab/ (the frozen base), B = lab/.  Headless Firefox, µs timers.
 *   LW_PORT=8725 GD_PORT=5244 node research/optimization-2026-09-24/probes/LB/lb3-paint.mjs [runs]
 * Per tree: open the window, pause, settle; count MutationObserver records per FORCED paint (paused: every write is a
 * constant), then over 3 s of a RUNNING modulation clock (records per loop paint); the ms per paint over 300 forced
 * paints; and the window's serialized DOM (outerHTML of #modwin + its chip rail) after the paints — which must be the
 * same string in A and B. */
import fs from 'node:fs';
import { open as open0 } from '../../../../tools/gate/gatekit.mjs';
const open = async (url, o) => { for (let i = 0; ; i++) { try { return await open0(url, o); } catch (e) { if (i > 20 || !/EADDRINUSE/.test(String(e && e.message || e))) throw e; await new Promise((r) => setTimeout(r, 1000)); } } };
const PORT = process.env.LW_PORT || '8725', RUNS = +(process.argv[2] || 3);
const TREES = { A: '/.tmp/base-lab/', B: '/lab/' };
const med = (a) => { const s = a.slice().sort((x, y) => x - y); return s.length ? s[s.length >> 1] : NaN; };
async function one(label) {
  const g = await open(`https://127.0.0.1:${PORT}${TREES[label]}?preset=1s%2B2pz&sw=0`, { width: 1300, height: 850, script: 300000, prefs: { 'privacy.reduceTimerPrecision': false } });
  try {
    await g.waitFor('window.__LW && __LW.ready', 3000, 20);
    return await g.ev(`const L=__LW; L.pause(); L.governor.on=false; await L.settle();
      L.mod.expand(); await L.settle(); await new Promise((r)=>setTimeout(r,800)); await L.settle();
      const win=document.getElementById('modwin'), rail=document.querySelector('.kwin-chiprail[aria-label="MODULATION window controls"]');
      let recs=0, kinds={}; const mo=new MutationObserver((l)=>{ recs+=l.length; for (const r of l) { const k=r.type+':'+(r.target.className&&r.target.className.baseVal===undefined?String(r.target.className).split(' ')[0]:r.target.nodeName); kinds[k]=(kinds[k]||0)+1; } });
      for (const n of [win, rail]) mo.observe(n, { subtree:true, childList:true, characterData:true, attributes:true });
      const flush=()=>new Promise((r)=>setTimeout(r,0));
      L.mod.paint(); await flush(); recs=0; kinds={};
      const N=20; for (let i=0;i<N;i++) L.mod.paint(); await flush();
      const pausedPerPaint=recs/N, pausedKinds={...kinds};
      const H=(s)=>{ let h=2166136261>>>0; for (let i=0;i<s.length;i++){ h=(h^s.charCodeAt(i))>>>0; h=Math.imul(h,16777619)>>>0; } return h; };
      const domPaused=H(win.outerHTML+rail.outerHTML), domPausedLen=win.outerHTML.length;
      /* a running clock: route the LFO onto a house knob and play the modulation */
      const m=L.mod.model.macroList()[0].id, lfo=L.mod.model.sourceList().find((s)=>s.kind==='lfo').id;
      L.mod.route(m,'material.exposure',0,0.3); L.mod.bind(m,lfo); await L.settle(); await new Promise((r)=>setTimeout(r,300));
      L.mod.play(); await new Promise((r)=>setTimeout(r,500));
      const p0=L.mod.view.performance().paints; recs=0; kinds={};
      await new Promise((r)=>setTimeout(r,3000));
      const p1=L.mod.view.performance().paints; await flush();
      const runningPerPaint=recs/Math.max(1,p1-p0), runningPaints=p1-p0, runningKinds={...kinds};
      L.mod.stop(); await L.settle(); await new Promise((r)=>setTimeout(r,300));
      mo.disconnect();
      /* ms per forced paint, paused */
      const perf0=L.mod.view.performance(); for (let i=0;i<300;i++) L.mod.paint(); const perf1=L.mod.view.performance();
      const msPerPaint=(perf1.ms-perf0.ms)/(perf1.paints-perf0.paints);
      const textOnly=[...win.querySelectorAll('.modtempo b, .modhz, .modsync, .modcad, .m2predead, .m2bus, .m2envstage, .m2minstatus, .m2statusmain b')].every((e)=>[...e.childNodes].every((c)=>c.nodeType===3));
      return { pausedPerPaint, runningPerPaint, runningPaints, msPerPaint:+msPerPaint.toFixed(4), dom: domPaused, domLen: domPausedLen, textOnly,
        pausedKinds, runningKinds, errs:(window.__e||[]).length };`);
  } finally { await g.close(); }
}
const rows = { A: [], B: [] };
for (let i = 0; i < RUNS; i++) for (const L of (i % 2 ? ['B', 'A'] : ['A', 'B'])) rows[L].push(await one(L));
const sum = (L) => ({ pausedPerPaint: med(rows[L].map((r) => r.pausedPerPaint)), runningPerPaint: med(rows[L].map((r) => r.runningPerPaint)),
  msPerPaint: med(rows[L].map((r) => r.msPerPaint)), dom: [...new Set(rows[L].map((r) => r.dom))], textOnly: rows[L].every((r) => r.textOnly), errs: rows[L].map((r) => r.errs) });
const out = { A: sum('A'), B: sum('B'), kinds: { A: rows.A[0].pausedKinds, B: rows.B[0].pausedKinds, runA: rows.A[0].runningKinds, runB: rows.B[0].runningKinds } };
fs.writeFileSync('research/optimization-2026-09-24/probes/LB/lb3-paint.json', JSON.stringify({ out, rows }, null, 1));
console.log(JSON.stringify(out, null, 1));
