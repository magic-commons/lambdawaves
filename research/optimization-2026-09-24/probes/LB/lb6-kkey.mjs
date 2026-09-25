/* lb6-kkey.mjs — LANE LB · LB6: the K key's press in the page (LW.kick → the slap hook → reg.kick + ⟨p⟩ readouts),
 * A = .tmp/base-lab/ vs B = lab/, headless Firefox, µs timers.  COLD: the first press before the idle warm (≤ 1.5 s after
 * ready); WARM: after the tables are built, five presses at the same impulse (z, x, y, z, x) and five at fresh impulses.
 * The landed register (reg.at(t)) after the same presses must be the same doubles in A and B.
 *   LW_PORT=8725 GD_PORT=5244 node research/optimization-2026-09-24/probes/LB/lb6-kkey.mjs [runs] */
import { open as open0 } from '../../../../tools/gate/gatekit.mjs';
const open = async (url, o) => { for (let i = 0; ; i++) { try { return await open0(url, o); } catch (e) { if (i > 20 || !/EADDRINUSE/.test(String(e && e.message || e))) throw e; await new Promise((r) => setTimeout(r, 1000)); } } };
const PORT = process.env.LW_PORT || '8725', RUNS = +(process.argv[2] || 3);
const TREES = { A: '/.tmp/base-lab/', B: '/lab/' };
const med = (a) => { const s = a.slice().sort((x, y) => x - y); return s[s.length >> 1]; };
const rows = { A: [], B: [] };
for (let i = 0; i < RUNS; i++) for (const L of (i % 2 ? ['B', 'A'] : ['A', 'B'])) {
  const g = await open(`https://127.0.0.1:${PORT}${TREES[L]}?preset=1s%2B2pz&sw=0`, { width: 1400, height: 900, script: 300000, prefs: { 'privacy.reduceTimerPrecision': false } });
  try {
    await g.waitFor('window.__LW && __LW.ready', 3000, 20);
    rows[L].push(await g.ev(`const Lw=__LW; Lw.pause(); const t=(f)=>{ const t0=performance.now(); f(); return performance.now()-t0; };
      const cold = t(()=>Lw.kick(0.2,'z'));
      await new Promise((r)=>setTimeout(r,6000));                   // the idle warm builds the tables
      const same=[], fresh=[]; const ax=['z','x','y','z','x'];
      for (let i=0;i<5;i++) same.push(t(()=>Lw.kick(0.2, ax[i])));
      for (let i=0;i<5;i++) fresh.push(t(()=>Lw.kick(0.21 + 0.013*i, ax[i])));
      const c = Lw.reg.at(Lw.clock.t); let h = 2166136261>>>0; const dv = new DataView(new ArrayBuffer(8));
      for (const arr of [c.re, c.im]) for (let a=0;a<arr.length;a++) { dv.setFloat64(0, arr[a]); for (let b=0;b<8;b++) { h=(h^dv.getUint8(b))>>>0; h=Math.imul(h,16777619)>>>0; } }
      const m=(a)=>+a.slice().sort((x,y)=>x-y)[a.length>>1].toFixed(2);
      return { cold:+cold.toFixed(1), sameK:m(same), freshK:m(fresh), register:h, errs:(window.__e||[]).length };`));
  } finally { await g.close(); }
}
const s = (L) => ({ cold: med(rows[L].map((r) => r.cold)), sameK: med(rows[L].map((r) => r.sameK)), freshK: med(rows[L].map((r) => r.freshK)), register: [...new Set(rows[L].map((r) => r.register))], errs: rows[L].map((r) => r.errs) });
const out = { A: s('A'), B: s('B') }; out.sameRegister = JSON.stringify(out.A.register) === JSON.stringify(out.B.register);
console.log(JSON.stringify(out));
