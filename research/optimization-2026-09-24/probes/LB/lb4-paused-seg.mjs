/* lb4-paused-seg.mjs — LANE LB · LB4: the PAUSED road.  The HYLLERAAS TERMS segment asks for a REBUILD at once; with the
 * worker still solving, that frame shows the previous basis (B) — the landing must then ask for the frame that shows the
 * new one by itself, with nobody scheduling anything.  Reads the field digest 600 ms after the worker lands, with no
 * explicit schedule, and compares it to the settled digest of that basis.  A and B.
 *   LW_PORT=8725 GD_PORT=5244 node research/optimization-2026-09-24/probes/LB/lb4-paused-seg.mjs */
import { open as open0 } from '../../../../tools/gate/gatekit.mjs';
const open = async (url, o) => { for (let i = 0; ; i++) { try { return await open0(url, o); } catch (e) { if (i > 20 || !/EADDRINUSE/.test(String(e && e.message || e))) throw e; await new Promise((r) => setTimeout(r, 1000)); } } };
const PORT = process.env.LW_PORT || '8725';
for (const [label, tree] of [['A', '/.tmp/base-lab/'], ['B', '/lab/']]) {
  const g = await open(`https://127.0.0.1:${PORT}${tree}?preset=1s%2B2pz&sw=0`, { width: 1400, height: 900, script: 300000 });
  try {
    await g.waitFor('window.__LW && __LW.ready', 3000, 20);
    console.log(label, JSON.stringify(await g.ev(`const L=__LW; L.governor.on=false; L.quality.auto=false; L.quality.res=64; L.pause(); L.schedule(4); await L.settle();
      L.layout.reopen('helium','R'); await L.settle(); for (let i=0;i<400 && !L.helium.computed;i++) await new Promise((r)=>setTimeout(r,25));
      L.helium.setOn(true); L.schedule(L.TIER.REBUILD); await L.settle();
      const seg = (label) => [...document.querySelectorAll('.dev[data-id="helium"] .seg-b')].find((b)=>b.textContent.trim()===label);
      const out = {};
      for (const [lab, basis] of [['10','ten'],['3','three'],['6','six']]) {
        const b = seg(lab); if (!b) return { error: 'no seg ' + lab };
        const g0 = L.field.stats.generation;
        b.click();                                                    // the segment's own road: basis, sol=null, api.repaint(true)
        await new Promise((r)=>setTimeout(r,40));
        const genAfterClick = L.field.stats.generation - g0;
        for (let i=0;i<400 && !L.helium.computed;i++) await new Promise((r)=>setTimeout(r,25));
        await new Promise((r)=>setTimeout(r,600));
        const alone = (await L.fieldDigest()).hash;                   // nobody scheduled anything after the landing
        L.schedule(L.TIER.REBUILD); await L.settle();
        const forced = (await L.fieldDigest()).hash;
        out[basis] = { alone, forced, same: alone === forced, computed: L.helium.basis === basis && L.helium.computed, framesAfterClick: genAfterClick };
      }
      L.helium.setOn(false); return { out, errs: (window.__e||[]).length };`)));
  } finally { await g.close(); }
}
