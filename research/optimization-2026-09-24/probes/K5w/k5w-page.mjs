/* k5w-page.mjs — K5w page gate: SPECTRUM's AXIAL GAS readout computed in the maths worker.
 *   LW_PORT=8727 GD_PORT=5246 node research/optimization-2026-09-24/probes/K5w/k5w-page.mjs [runs]
 * A = /.tmp/base-lab/ (the merged tree before K5w, 729f1a1), B = /lab/.  Headless Firefox, µs timers.
 * S  strings: paused, the axial packet (z₀ = −5, k = 2, σ = 0.8) launched at t = 0, scrubbed to t_k = 0.1 k (k = 0…60, the
 *    6 s of play sampled every 100 ms); frames driven until a readout tick has run at t_k and every gas.stats reply has
 *    landed → the .ro-val text + class.  A and B must agree string for string.
 * P  play 6 s from a fresh launch at t = 0 with the instruments on: every rAF callback's duration (the loop is one),
 *    main-thread gas.stats calls (the page object's method wrapped), a MessageChannel heartbeat, the readout sampled
 *    every 100 ms, __LW.perf.loopMedian.  In B also every `gas.stats` message and its reply (Worker.prototype.postMessage
 *    snooped): each reply Object.is against the page's own stats(t) — worker vs frame thread, same engine — and every
 *    painted ⟨z⟩ string must be one of those t's formatted stats.
 * D  discard (B): a new LAUNCH made in the microtask after a request is posted → that reply is dropped (the readout keeps
 *    the launch text), and the next tick paints the NEW packet's stats.
 * serialize: __LW.serialize() of the gas scene after S, A vs B. */
import fs from 'node:fs';
import { open as open0 } from '../../../../tools/gate/gatekit.mjs';
const open = async (url, o) => { for (let i = 0; ; i++) { try { return await open0(url, o); } catch (e) { if (i > 20 || !/EADDRINUSE/.test(String(e && e.message || e))) throw e; await new Promise((r) => setTimeout(r, 1000)); } } };
const PORT = process.env.LW_PORT || '8727', RUNS = +(process.argv[2] || 1);
const TREES = { A: '/.tmp/base-lab/', B: '/lab/' };
async function one(label) {
  const g = await open(`https://127.0.0.1:${PORT}${TREES[label]}?preset=1s%2B2pz&sw=0`, { width: 1400, height: 900, script: 300000, prefs: { 'privacy.reduceTimerPrecision': false } });
  try {
    await g.waitFor('window.__LW && __LW.ready', 3000, 20);
    return await g.ev(`const L = __LW, B = ${label === 'B'};
      L.governor.on = false; L.quality.auto = false; L.quality.scale = 1; L.quality.res = 64; L.quality.steps = 110; L.pause(); L.schedule(4); await L.settle();
      L.layout.reopen('spectrum', 'R'); await L.settle();
      L.setHamiltonian('well'); L.setGasBasis('axial'); await L.settle();
      const dev = document.querySelector('.dev[data-id="spectrum"]');
      const ro = [...dev.querySelectorAll('.ro')].find((r) => /packet held by the box/.test((r.querySelector('.ro-lbl') || {}).textContent || ''));
      const val = ro.querySelector('.ro-val'), read = () => val.textContent + ' |' + val.className;
      const snoop = { req: [], rep: [] }, P0 = Worker.prototype.postMessage;
      Worker.prototype.postMessage = function (m, tr) {
        if (m && m.op === 'gas.stats') {
          snoop.req.push({ id: m.id, t: m.t, radius: m.radius, bytes: m.re0.byteLength + m.im0.byteLength, transfer: (tr || []).length, at: performance.now() });
          if (!this.__k5w) { this.__k5w = 1; this.addEventListener('message', (e) => { const d = e.data; if (d && d.op === 'gas.stats') snoop.rep.push({ id: d.id, stats: d.stats, error: d.error, at: performance.now(), text: read() }); }); }
          if (window.__k5wHook) { const f = window.__k5wHook; window.__k5wHook = null; queueMicrotask(f); }
        }
        return P0.call(this, m, tr);
      };
      const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
      const landed = async () => { for (let i = 0; i < 800 && snoop.rep.length < snoop.req.length; i++) await sleep(10); await sleep(0); };
      const tickAt = async (t) => { if (t !== null) L.scrub(t); const c0 = L.perf.counts.cpu; for (let i = 0; i < 60 && Math.floor(L.perf.counts.cpu / 6) === Math.floor(c0 / 6); i++) await L.settle(); await landed(); return read(); };
      /* S */
      L.pause(); L.scrub(0); L.launchPacket([0, 0, -5], [0, 0, 2], 0.8); await L.settle();
      const S = []; for (let k = 0; k <= 60; k++) S.push(await tickAt(+(0.1 * k).toFixed(1)));
      const serial = JSON.stringify(L.serialize());
      /* P */
      L.pause(); L.scrub(0); L.launchPacket([0, 0, -5], [0, 0, 2], 0.8); await L.settle(); await landed();
      const origStats = L.gas.stats, calls = [];
      L.gas.stats = function (t, s) { const a = performance.now(); const r = origStats(t, s); calls.push({ t, ms: performance.now() - a }); return r; };
      const R0 = window.requestAnimationFrame, frames = [];
      window.requestAnimationFrame = (cb) => R0.call(window, (ts) => { const a = performance.now(); try { cb(ts); } finally { frames.push(performance.now() - a); } });
      let hbLast = performance.now(), hbOn = true; const gaps = []; const mc = new MessageChannel();
      mc.port1.onmessage = () => { const n = performance.now(); gaps.push(n - hbLast); hbLast = n; if (hbOn) setTimeout(() => mc.port2.postMessage(0), 2); }; mc.port2.postMessage(0);
      const painted = []; const mo = new MutationObserver(() => { const s = val.textContent; if (!painted.length || painted[painted.length - 1] !== s) painted.push(s); }); mo.observe(val, { childList: true, characterData: true, subtree: true });
      const samples = []; const iv = setInterval(() => samples.push(read()), 100);
      const repStart = snoop.rep.length, reqStart = snoop.req.length;
      L.perf.resetRing(); L.play(); await sleep(6000);
      const loopMedian = L.perf.loopMedian, ownMedian = L.perf.median, fps = L.stats.fps;
      L.pause(); clearInterval(iv); hbOn = false; window.requestAnimationFrame = R0; L.gas.stats = origStats; await landed(); await sleep(50); mo.disconnect();
      const fmt = (s) => (100 * L.gas.captured).toFixed(1) + '% held · ⟨z⟩ ' + s.z.toFixed(2) + ' · σ_z ' + s.sz.toFixed(2);
      const byId = new Map(snoop.req.map((q) => [q.id, q])), expected = new Set(); let bitSame = true, checked = 0; const lagMs = [];
      for (const r of snoop.rep.slice(repStart)) { const q = byId.get(r.id); if (!q || !r.stats) continue; const w = origStats(q.t); checked++; lagMs.push(r.at - q.at);
        if (Object.keys(w).length !== Object.keys(r.stats).length || !Object.keys(w).every((k) => Object.is(w[k], r.stats[k]))) bitSame = false; expected.add(fmt(w)); }
      for (const c of calls) expected.add(fmt(origStats(c.t)));
      const zPainted = painted.filter((s) => s.includes('⟨z⟩')), strangers = zPainted.filter((s) => !expected.has(s));
      const q = (a, p) => { const s = a.slice().sort((x, y) => x - y); return s.length ? +s[Math.min(s.length - 1, Math.floor(p * s.length))].toFixed(2) : null; };
      const play = { fps: +fps.toFixed(1), loopMedian: +loopMedian.toFixed(3), ownMedian: +ownMedian.toFixed(3), frames: frames.length, frameMedian: q(frames, 0.5), frameP99: q(frames, 0.99), frameMax: q(frames, 1),
        framesOver5: frames.filter((d) => d > 5).length, framesOver5List: frames.filter((d) => d > 5).map((d) => +d.toFixed(1)).slice(0, 30),
        mainThreadStatsCalls: calls.length, mainThreadStatsMs: calls.map((c) => +c.ms.toFixed(1)), heartbeatMax: q(gaps, 1), heartbeatOver8: gaps.filter((d) => d > 8).length,
        requests: snoop.req.length - reqStart, replies: snoop.rep.length - repStart, repliesChecked: checked, workerBitIdentical: bitSame, lagMs: { med: q(lagMs, 0.5), max: q(lagMs, 1) },
        msgBytes: snoop.req.length ? snoop.req[0].bytes : 0, transferred: snoop.req.some((r) => r.transfer),
        zPainted: zPainted.length, strangers, sampled: samples.length, sampledZ: samples.filter((s) => s.includes('⟨z⟩')).length };
      /* D */
      let D = null;
      if (B) {
        L.pause(); await tickAt(1.0);
        const nRep = snoop.rep.length; window.__k5wHook = () => { L.launchPacket([0, 0, 3], [0, 0, -1], 1); };
        await tickAt(1.3);
        const stale = snoop.rep[nRep], afterLaunch = read();
        const fin = await tickAt(null), want = fmt(L.gas.stats(1.3)) + ' |ro-val ' + (L.gas.captured > 0.85 ? 'ok' : 'warn');
        D = { hookFired: window.__k5wHook === null, staleText: stale && stale.text, staleDropped: !!(stale && /axial/.test(stale.text) && !stale.text.includes('⟨z⟩')), afterLaunch, final: fin, want, finalIsNewPacket: fin === want };
      }
      return { S, serial, play, D, workerOk: L.maths.bow, errs: (window.__e || []).map(String).slice(0, 4) };`);
  } finally { await g.close(); }
}
const rows = { A: [], B: [] };
for (let i = 0; i < RUNS; i++) for (const L of (i % 2 ? ['B', 'A'] : ['A', 'B'])) rows[L].push(await one(L));
const a = rows.A[0], b = rows.B[0];
const unAt = (s) => { const o = JSON.parse(s); if (o.presentation && o.presentation.layout) delete o.presentation.layout.at; return JSON.stringify(o); };
const keyDiff = (x, y, p) => (typeof x !== 'object' || x === null || typeof y !== 'object' || y === null ? (Object.is(x, y) ? [] : [p])
  : [...new Set([...Object.keys(x), ...Object.keys(y)])].flatMap((k) => keyDiff(x[k], y[k], p + '.' + k)));
const diffS = a.S.map((s, k) => (s === b.S[k] ? null : { k, A: s, B: b.S[k] })).filter(Boolean);
const out = { stringsCompared: a.S.length, stringsZ: a.S.filter((s) => s.includes('⟨z⟩')).length, stringsDiffer: diffS.length, diffS: diffS.slice(0, 5),
  sameAcrossRuns: { A: rows.A.every((r) => JSON.stringify(r.S) === JSON.stringify(a.S)), B: rows.B.every((r) => JSON.stringify(r.S) === JSON.stringify(b.S)) },
  /* presentation.layout.at is the save's wall clock (Date.now()): it differs between any two runs, A vs A included */
  serializeSame: [...rows.A, ...rows.B].every((r) => unAt(r.serial) === unAt(a.serial)), serializeBytes: [a.serial.length, b.serial.length],
  serializeDiffers: [...new Set([...rows.A.slice(1), ...rows.B].flatMap((r) => keyDiff(JSON.parse(a.serial), JSON.parse(r.serial), '')))],
  playA: rows.A.map((r) => r.play), playB: rows.B.map((r) => r.play), D: rows.B.map((r) => r.D), errs: { A: rows.A.map((r) => r.errs), B: rows.B.map((r) => r.errs) },
  sample: { first: a.S[0], mid: a.S[30], last: a.S[60] } };
fs.writeFileSync(new URL('./k5w-page.out.json', import.meta.url), JSON.stringify({ out, rows }, null, 1));
console.log(JSON.stringify(out, null, 1));
