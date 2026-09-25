/* s2-busy.mjs — seam 2's behaviour read: LW.busy begin/end/flash/wrap, the host clone and its colours, the pointer ride.
 *   LW_PORT=8726 GD_PORT=5245 node research/optimization-2026-09-24/probes/N/s2-busy.mjs <tag> */
import { page, save } from './lib.mjs';
const g = await page();
const R = {};
try {
  R.read = await g.ev(`const B = __LW.busy, out = {};
    out.boot = { count: B.count, visible: B.visible, host: !!B.host, clone: B.host ? B.host.querySelectorAll('.mark rect').length : 0,
      fills: B.host ? [...B.host.querySelectorAll('.mark rect')].map((r) => r.getAttribute('fill')).join(',') === [...document.querySelectorAll('#title .mark rect')].map((r) => r.getAttribute('fill')).join(',') : false };
    B.begin(); out.up = { count: B.count, visible: B.visible, hidden: B.host.hidden, titleBusy: document.querySelector('#title .mark').classList.contains('busy') };
    window.dispatchEvent(new PointerEvent('pointermove', { clientX: 321, clientY: 123 })); out.at = B.at; out.moves = B.moves;
    B.end(); out.down = { count: B.count, visible: B.visible, hidden: B.host.hidden };
    B.flash(80); out.flash = B.visible; await new Promise((r) => setTimeout(r, 200)); out.flashEnd = B.visible;
    let res; const p = new Promise((r) => { res = r; }); B.wrap(p); out.wrapUp = B.count; res(1); await p; await new Promise((r) => setTimeout(r, 0)); out.wrapDown = B.count;
    out.errors = (window.__e || []).slice(); return out;`);
} catch (e) { R.error = String(e && e.stack || e); }
finally { await g.close(); }
console.log(JSON.stringify(R));
save(import.meta.url, R);
