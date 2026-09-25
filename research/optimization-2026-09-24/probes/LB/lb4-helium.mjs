/* lb4-helium.mjs — LANE LB · LB4 gate: HELIUM's basis change no longer solves on the frame thread, and nothing that is
 * saved, settled or exported changes.  A = .tmp/base-lab/ (frozen base), B = lab/.  Headless Firefox, µs timers.
 *   LW_PORT=8725 GD_PORT=5244 node research/optimization-2026-09-24/probes/LB/lb4-helium.mjs [runs]
 * 1 stall: HELIUM ON and PLAYING, setBasis → ten, six, ten: the worst main-thread gap (a MessageChannel heartbeat) in the
 *   800 ms after each press (probe-f-busy's heliumBasisPlaying arm).
 * 2 settled: per basis, after the worker has landed, pause + REBUILD + settle → fieldDigest (must equal A's).
 * 3 export: basis changed and an EXACT render (2 frames, 96×64, stored deflate) started in the same task, before the
 *   worker lands → its frame digests; a PICTURE (128×96) taken the same way → its PNG hash; both must equal A's and
 *   equal the same export taken after the basis has settled. */
import fs from 'node:fs';
import { open as open0 } from '../../../../tools/gate/gatekit.mjs';
const open = async (url, o) => { for (let i = 0; ; i++) { try { return await open0(url, o); } catch (e) { if (i > 20 || !/EADDRINUSE/.test(String(e && e.message || e))) throw e; await new Promise((r) => setTimeout(r, 1000)); } } };
const PORT = process.env.LW_PORT || '8725', RUNS = +(process.argv[2] || 3);
const TREES = { A: '/.tmp/base-lab/', B: '/lab/', M: '/.tmp/mut-lab/' };   /* M: lab/ with the two export forces removed — the gate must see it */
const med = (a) => { const s = a.slice().sort((x, y) => x - y); return s.length ? s[s.length >> 1] : NaN; };
async function one(label) {
  const g = await open(`https://127.0.0.1:${PORT}${TREES[label]}?preset=1s%2B2pz&sw=0`, { width: 1400, height: 900, script: 300000, prefs: { 'privacy.reduceTimerPrecision': false } });
  try {
    await g.waitFor('window.__LW && __LW.ready', 3000, 20);
    return await g.ev(`const L=__LW; L.governor.on=false; L.quality.auto=false; L.setStyle('cloud'); L.quality.scale=1; L.quality.res=64; L.quality.steps=110; L.pause(); L.schedule(4); await L.settle();
      L.layout.reopen('helium','R'); await L.settle(); for (let i=0;i<400 && !L.helium.computed;i++) await new Promise((r)=>setTimeout(r,25));
      L.helium.setOn(true); await L.settle();
      const landed = async () => { for (let i=0;i<400 && !L.helium.computed;i++) await new Promise((r)=>setTimeout(r,25)); };
      const settled = async () => { L.schedule(L.TIER.REBUILD); await L.settle(); await new Promise((r)=>setTimeout(r,100)); await L.settle(); const d=await L.fieldDigest(); return d ? JSON.stringify(d) : null; };
      /* 1 · the stall while playing */
      L.play(); await new Promise((r)=>setTimeout(r,600));
      const meas = async (basis) => { let last=performance.now(), worst=0, on=true; const mc=new MessageChannel(); mc.port1.onmessage=()=>{ const n=performance.now(); worst=Math.max(worst,n-last); last=n; if (on) setTimeout(()=>mc.port2.postMessage(0),2); }; mc.port2.postMessage(0);
        await new Promise((r)=>setTimeout(r,200)); worst=0; L.helium.setBasis(basis); await new Promise((r)=>setTimeout(r,800)); on=false; return +worst.toFixed(1); };
      const stall = { ten: await meas('ten'), six: await meas('six'), ten2: await meas('ten') };
      await landed(); await new Promise((r)=>setTimeout(r,300));
      L.pause(); await L.settle();
      /* 2 · settled digests per basis */
      const digests = {};
      for (const b of ['six','ten','one','three']) { L.helium.setBasis(b); await landed(); digests[b] = await settled(); }
      /* 3 · exports started in the SAME task as the basis change, before the worker can land */
      const ex = L.captureUI.exact;
      const sched = { N: 2, fps: 12, mode: 'given', at: (k) => k * 0.5, off: (k) => k * 0.5 };
      const exact = async () => { const r = await ex.render({ schedule: sched, width: 96, height: 64, deflate: 'stored', label: 'lb4' }).done; return r.ok ? r.manifest.frames.map((f)=>f.digest).join(',') : ('FAILED ' + (r.message||r.error)); };
      const H=(u8)=>{ let h=2166136261>>>0; for (let i=0;i<u8.length;i++){ h=(h^u8[i])>>>0; h=Math.imul(h,16777619)>>>0; } return h; };
      const pic = async () => { const r = await L.capture.picture({ width: 128, height: 96 }); return r.ok ? H(new Uint8Array(await r.blob.arrayBuffer())) : 'FAILED ' + r.error; };
      L.helium.setBasis('six'); await landed(); await settled();
      L.helium.setBasis('ten'); const exactRaced = await exact(); const computedAfterExact = L.helium.computed;
      await landed(); await settled(); const exactSettled = await exact();
      L.helium.setBasis('three'); const picRaced = await pic();
      await landed(); await settled(); const picSettled = await pic();
      const final = await settled();
      L.helium.setOn(false); await L.settle();
      return { stall, digests, exactRaced, exactSettled, exactSame: exactRaced === exactSettled, picRaced, picSettled, picSame: picRaced === picSettled, computedAfterExact, final, errs: (window.__e||[]).map(String).slice(0,4) };`);
  } finally { await g.close(); }
}
const rows = { A: [], B: [] };
if (process.env.LB4_MUT) { rows.M = [await one('M')]; console.log('MUTANT', JSON.stringify({ exact: rows.M[0].exactRaced + ' | ' + rows.M[0].exactSettled, pic: rows.M[0].picRaced + ' | ' + rows.M[0].picSettled, stall: rows.M[0].stall })); process.exit(0); }
for (let i = 0; i < RUNS; i++) for (const L of (i % 2 ? ['B', 'A'] : ['A', 'B'])) rows[L].push(await one(L));
const s = (L) => ({ stallTen: med(rows[L].map((r) => r.stall.ten)), stallSix: med(rows[L].map((r) => r.stall.six)), stallTen2: med(rows[L].map((r) => r.stall.ten2)),
  digests: [...new Set(rows[L].map((r) => JSON.stringify(r.digests)))], exact: [...new Set(rows[L].map((r) => r.exactRaced + ' | ' + r.exactSettled))],
  pic: [...new Set(rows[L].map((r) => r.picRaced + ' | ' + r.picSettled))], exactSame: rows[L].every((r) => r.exactSame), picSame: rows[L].every((r) => r.picSame), errs: rows[L].map((r) => r.errs.length) });
const out = { A: s('A'), B: s('B') };
out.sameDigests = JSON.stringify(out.A.digests) === JSON.stringify(out.B.digests);
out.sameExact = JSON.stringify(out.A.exact) === JSON.stringify(out.B.exact);
out.samePic = JSON.stringify(out.A.pic) === JSON.stringify(out.B.pic);
fs.writeFileSync('research/optimization-2026-09-24/probes/LB/lb4-helium.json', JSON.stringify({ out, rows }, null, 1));
console.log(JSON.stringify(out, null, 1));
