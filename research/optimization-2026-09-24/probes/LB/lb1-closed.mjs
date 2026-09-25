/* lb1-closed.mjs — LANE LB · LB1 gate: the closed modulation window asks for no layout, and expand() opens once.
 * A = the frozen base tree copied to .tmp/base-lab/ (91c90bc's lab/), B = the built lab/.  Headless Firefox.
 *   LW_PORT=8725 GD_PORT=5244 node research/optimization-2026-09-24/probes/LB/lb1-closed.mjs neutral
 *   LW_PORT=8725 GD_PORT=5244 node research/optimization-2026-09-24/probes/LB/lb1-closed.mjs timing [runs]
 *   LW_PORT=8725 GD_PORT=5244 node research/optimization-2026-09-24/probes/LB/lb1-closed.mjs boot [runs]   (needs instrument-boot.mjs first)
 * neutral: the saved bytes of a project whose ENV is COMPACT with the window CLOSED (restore → paint → a changed
 *   source → a route onto a house knob → a resize while closed → open after the resize → close → reopen), the ring
 *   on the house knob, every rect of the closed subtree (must be the zero rect: that is the equivalence), the
 *   window's geometry and a computed-style digest of the open window — A and B must print the same JSON.
 * timing: per-open ms (expand + the layout it leaves), applySettings ms and a closed restoreModulation, A/B interleaved.
 * boot: the instrumented copies' boot marks (field → ready, applySettings, the modulation block, first two rAFs). */
import fs from 'node:fs';
import http from 'node:http';
import { open as open0 } from '../../../../tools/gate/gatekit.mjs';
/* a geckodriver from the previous session can hold GD_PORT for a moment after close(): wait for it */
const open = async (url, o) => { for (let i = 0; ; i++) { try { return await open0(url, o); } catch (e) { if (i > 20 || !/EADDRINUSE/.test(String(e && e.message || e))) throw e; await new Promise((r) => setTimeout(r, 1000)); } } };
const PORT = process.env.LW_PORT || '8725';
const mode = process.argv[2] || 'neutral';
const RUNS = +(process.argv[3] || 5);
const TREES = { A: '/.tmp/base-lab/', B: '/lab/' };
const OUT = 'research/optimization-2026-09-24/probes/LB/';
const setRect = (s, width, height) => new Promise((res, rej) => {
  const body = JSON.stringify({ width, height });
  const r = http.request({ host: '127.0.0.1', port: process.env.GD_PORT, path: '/session/' + s + '/window/rect', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } }, (x) => { let b = ''; x.on('data', (d) => b += d); x.on('end', () => res(b)); });
  r.on('error', rej); r.end(body);
});
const med = (a) => { const s = a.slice().sort((x, y) => x - y); return s.length ? s[s.length >> 1] : NaN; };

async function neutral(label) {
  const g = await open(`https://127.0.0.1:${PORT}${TREES[label]}?preset=1s%2B2pz&sw=0`, { width: 1300, height: 850, script: 300000 });
  try {
    await g.waitFor('window.__LW && __LW.ready', 3000, 20);
    const R = {};
    const zeroFn = `const ser = () => { const p = __LW.serialize(); if (p.presentation.layout) delete p.presentation.layout.at; return JSON.stringify(p); };   /* layout.at is a wall-clock stamp */
    const zeroAll = () => { const win=document.getElementById('modwin'), rail=document.querySelector('.kwin-chiprail[aria-label="MODULATION window controls"]');
      const els=[win, ...win.querySelectorAll('*'), rail, ...rail.querySelectorAll('*')]; let nz=0;
      for (const e of els) { const r=e.getBoundingClientRect(); if (r.x||r.y||r.width||r.height) nz++; } return { nodes: els.length, nonZero: nz, hidden: win.hidden && rail.hidden }; };`;
    R.step1 = await g.ev(`${zeroFn} const L=__LW; L.pause(); await L.settle();
      const p = L.serialize(); const pr = p.presentation;
      const env = pr.modulation.sources.find((s) => s.kind === 'env');
      env.timeScale = 3.21; pr.modwin.modes = { [env.id]: 'C' }; pr.modwin.open = false;
      L.restore(p); window.__lbEnv = env.id;
      const s1 = ser();
      L.mod.paint();                                            // a forced paint with the window closed: the compact ENV fit
      const s2 = ser();
      L.mod.model.setSource(env.id, { a: 0.7, d: 0.9 }); L.mod.paint();
      const s3 = ser();
      const macro = L.mod.model.macroList()[0].id;
      L.mod.route(macro, 'material.exposure', 0, 0.4); L.mod.bind(macro, env.id);
      L.mod.paint();
      const s4 = ser();
      return { closed: zeroAll(), env: env.id, s1, s2, s3, s4, ts: L.mod.model.sourceOf(env.id).timeScale,
        ring: L.mod.view.ring('material.exposure'), rings: L.mod.view.rings(), expanded: L.mod.expanded };`);
    await setRect(g.s, 1500, 900);
    await new Promise((r) => setTimeout(r, 600));
    R.step2 = await g.ev(`${zeroFn} const L=__LW; L.mod.paint(); L.mod.view.sync();
      const s5 = ser();
      return { closed: zeroAll(), s5, inner: [innerWidth, innerHeight], ring: L.mod.view.ring('material.exposure') };`);
    const styleDigest = `const ser = () => { const p = __LW.serialize(); if (p.presentation.layout) delete p.presentation.layout.at; return JSON.stringify(p); };
      const H=(s)=>{ let h=2166136261>>>0; for (let i=0;i<s.length;i++){ h=(h^s.charCodeAt(i))>>>0; h=Math.imul(h,16777619)>>>0; } return h; };
      const digest=()=>{ const win=document.getElementById('modwin'), rail=document.querySelector('.kwin-chiprail[aria-label="MODULATION window controls"]');
        const els=[win, ...win.querySelectorAll('*'), rail, ...rail.querySelectorAll('*')]; let all='', geo='', attrs='';
        for (const e of els) { const cs=getComputedStyle(e); let s=''; for (let i=0;i<cs.length;i++) s+=cs[i]+':'+cs.getPropertyValue(cs[i])+';'; all+=s+'|';
          const r=e.getBoundingClientRect(); geo+=[r.x,r.y,r.width,r.height].map((v)=>v.toFixed(2)).join(',')+'|';
          attrs+=[...e.attributes].map((a)=>a.name+'='+a.value).join('&')+'|'; }
        const tr=document.getElementById('transport');
        return { nodes: els.length, style: H(all), geo: H(geo), attrs: H(attrs), transport: tr ? tr.className + ' ' + (tr.style.animation||'') : null }; };`;
    R.step3 = await g.ev(`${styleDigest} const L=__LW; L.mod.expand(); await L.settle(); await new Promise((r)=>setTimeout(r,700)); await L.settle();
      const d = digest(), geom = L.mod.view.geometry(), s6 = ser();
      const perf = L.mod.view.performance();
      L.mod.collapse(); await L.settle(); await new Promise((r)=>setTimeout(r,400));
      const s7 = ser();
      L.mod.expand(); await L.settle(); await new Promise((r)=>setTimeout(r,700)); await L.settle();
      const d2 = digest(), geom2 = L.mod.view.geometry(), s8 = ser();
      return { d, geom, s6, s7, d2, geom2, s8, curve: L.mod.view.curve(window.__lbEnv), ring: L.mod.view.ring('material.exposure'), errs: (window.__e||[]).slice(0,5) };`);
    return R;
  } finally { await g.close(); }
}

async function timing(label) {
  const g = await open(`https://127.0.0.1:${PORT}${TREES[label]}?preset=1s%2B2pz&sw=0`, { width: 1300, height: 850, script: 300000, prefs: { 'privacy.reduceTimerPrecision': false } });
  try {
    await g.waitFor('window.__LW && __LW.ready', 3000, 20);
    return await g.ev(`const L=__LW; L.pause(); L.governor.on=false; await L.settle(); await new Promise((r)=>setTimeout(r,1500));
      const opens=[], apply=[], rest=[], paints=[];
      for (let i=0;i<6;i++) {
        await new Promise((r)=>setTimeout(r,250));
        const p0=L.mod.view.performance().paints;
        let t0=performance.now(); L.mod.expand(); document.body.offsetWidth; opens.push(performance.now()-t0);
        paints.push(L.mod.view.performance().paints-p0);
        await L.settle(); await new Promise((r)=>setTimeout(r,250));
        L.mod.collapse(); await L.settle();
      }
      for (let i=0;i<6;i++) { await new Promise((r)=>setTimeout(r,150)); document.body.offsetWidth; const t0=performance.now(); L.applySettings(); document.body.offsetWidth; apply.push(performance.now()-t0); }
      for (let i=0;i<6;i++) { await new Promise((r)=>setTimeout(r,150)); document.body.offsetWidth; const o=L.mod.serialize(); const t0=performance.now(); L.mod.restore(o); document.body.offsetWidth; rest.push(performance.now()-t0); }
      const m=(a)=>{ const s=a.slice().sort((x,y)=>x-y); return +s[s.length>>1].toFixed(2); };
      return { openMs: m(opens), openAll: opens.map((v)=>+v.toFixed(1)), paintsPerOpen: m(paints), applySettingsMs: m(apply), restoreModClosedMs: m(rest), errs: (window.__e||[]).length };`);
  } finally { await g.close(); }
}

async function boot(label) {
  const tree = label === 'A' ? '/.tmp/instA/' : '/.tmp/instB/';
  const g = await open(`https://127.0.0.1:${PORT}${tree}?preset=1s%2B2pz&sw=0`, { width: 1920, height: 1080, script: 120000, prefs: { 'privacy.reduceTimerPrecision': false } });
  try {
    await g.waitFor('window.__LW && __LW.ready && window.__LWBOOT && window.__LWBOOT.f2', 3000, 20);
    return await g.ev(`const B=window.__LWBOOT, at=(n)=>(B.marks.find((m)=>m[0]===n)||[0,NaN])[1];
      return { field: at('field created'), ready: +B.ready.toFixed(2), f1: +B.f1.toFixed(2), f2: +B.f2.toFixed(2),
        afterField: +(B.ready - at('field created')).toFixed(2), mod: +(at('modulation: end') - at('modulation: start')).toFixed(2),
        applySettings: +(at('go: openLink') - at('go: applySettings')).toFixed(2), modwinMs: +B.mw.toFixed(2), modwinCalls: B.mwn, errs: (window.__e||[]).length };`);
  } finally { await g.close(); }
}

if (mode === 'neutral') {
  const A = await neutral('A'), B = await neutral('B');
  const strip = (R) => JSON.parse(JSON.stringify(R, (k, v) => (k === 'perf' || k === 'errs' ? undefined : v)));
  const a = JSON.stringify(strip(A)), b = JSON.stringify(strip(B));
  const diffs = [];
  const walk = (x, y, path) => { if (JSON.stringify(x) === JSON.stringify(y)) return; if (x && y && typeof x === 'object' && typeof y === 'object') { for (const k of new Set([...Object.keys(x), ...Object.keys(y)])) walk(x[k], y[k], path + '.' + k); } else diffs.push({ path, A: String(x).slice(0, 160), B: String(y).slice(0, 160) }); };
  walk(strip(A), strip(B), '');
  const out = { identical: a === b, bytes: a.length, diffs: diffs.slice(0, 20),
    closedA: [A.step1.closed, A.step2.closed], closedB: [B.step1.closed, B.step2.closed],
    tsFit: [A.step1.ts, B.step1.ts], s1vs2Changed: A.step1.s1 !== A.step1.s2, geomB: B.step3.geom, errs: [A.step3.errs, B.step3.errs] };
  fs.writeFileSync(OUT + 'lb1-neutral.json', JSON.stringify({ out, A, B }, null, 1));
  console.log(JSON.stringify(out, null, 1));
} else {
  const fn = mode === 'timing' ? timing : boot, rows = { A: [], B: [] };
  for (let i = 0; i < RUNS; i++) for (const L of (i % 2 ? ['B', 'A'] : ['A', 'B'])) { rows[L].push(await fn(L)); await new Promise((r) => setTimeout(r, 1500)); }
  const keys = Object.keys(rows.A[0]).filter((k) => typeof rows.A[0][k] === 'number');
  const summary = Object.fromEntries(['A', 'B'].map((L) => [L, Object.fromEntries(keys.map((k) => [k, med(rows[L].map((r) => r[k]))]))]));
  fs.writeFileSync(OUT + 'lb1-' + mode + '.json', JSON.stringify({ runs: RUNS, summary, rows }, null, 1));
  console.log(JSON.stringify(summary, null, 1));
}
