/* s5-sw.mjs — seam 5's behaviour read: LW.sw's offer, press, controllerchange (asked and not asked), the worker's messages,
 * the badge and SETTINGS' status line.  LW_PORT=8726 GD_PORT=5245 node research/optimization-2026-09-24/probes/N/s5-sw.mjs <tag> */
import { page, save } from './lib.mjs';
const g = await page();
const R = {};
try {
  R.read = await g.ev(`const S = __LW.sw, out = { mode: S.mode, state0: S.state };
    const badge = () => { const b = [...document.querySelectorAll('#badges .badge')].pop(); return { hidden: b.hidden, text: b.lastChild.textContent }; };
    const stat = () => document.querySelector('.dev[data-id="settings"] .dev-stat').textContent;
    let reloads = 0; S.reload = () => { reloads++; };
    let took = 0; out.ready = S.buildReady(() => { took++; }); out.afterReady = { state: S.state, badge: badge(), status: stat() };
    out.accept = S.accept(); out.afterAccept = { state: S.state, asked: S.asked, took, badge: badge(), status: stat() };
    out.changed = S.controllerChanged(); out.reloads = reloads; out.again = S.controllerChanged(); out.reloads2 = reloads;
    S.asked = false; out.told = S.controllerChanged(); out.afterTold = { state: S.state, badge: badge() };
    out.msgs = [S.message({ type: 'LW_SW_WAITING' }), S.message({ type: 'LW_SW_BUILD', build: 'x', files: 3, cache: 'c' }), S.message({ type: 'nope' }), S.message(null)];
    out.fields = { build: S.build, files: S.files, cache: S.cache, pending: !!S.pending };
    out.errors = (window.__e || []).slice(); return out;`);
} catch (e) { R.error = String(e && e.stack || e); }
finally { await g.close(); }
console.log(JSON.stringify(R));
save(import.meta.url, R);
