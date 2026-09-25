/* PACE · P2's browser proof: the first-run quality and the ceiling, on a TABLET (Firefox with the iPad's user agent — rack.js'
 * isTablet() reads the UA) and on the DESKTOP (no override), each from a fresh profile.
 *   LW_PORT=8734 GD_PORT=5250 node research/optimization-2026-09-24/probes/PACE/tablet-quality.mjs [tag]
 * Each boot reads the seed; then a desktop's 128³ × 240 × 1 with AUTO SCALE off is restored (LW.restore, the road a project,
 * a link and the quick save share); then the bundled WAVE DANCER opens through the projects road. */
import { page, save } from '../LA/lib.mjs';
const IPAD = 'Mozilla/5.0 (iPad; CPU OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/27.0 Mobile/15E148 Safari/604.1';
const R = {};
const read = `const q=__LW.quality; return { tablet:__LW.layout.tablet.on, phone:__LW.layout.phone.on, quality:{res:q.res, steps:q.steps, scale:q.scale, auto:q.auto},
  field:__LW.field.resolution, matSteps:__LW.mat.steps, dprCap:__LW.field.dprCap, grid:(document.querySelector('.seg[aria-label="GRID"] .on, .seg .on[data-id]')||{}).textContent||null,
  autoSw:([...document.querySelectorAll('button.sw')].find(b=>((b.querySelector('.sw-lbl')||{}).textContent||'').trim()==='AUTO SCALE')||{classList:{contains:()=>null}}).classList.contains('on'),
  card:document.body.dataset.card, frost:__LW.frost };`;
async function run(label, prefs) {
  const g = await page('preset=1s%2B2pz&sw=0', prefs ? { prefs: { 'privacy.reduceTimerPrecision': false, ...prefs } } : {});
  try {
    const out = {};
    out.boot = await g.ev(`__LW.pause(); await __LW.settle(); ${read}`);
    out.ua = await g.ev('return navigator.userAgent');
    out.restored128 = await g.ev(`const S=__LW.serialize(); S.presentation.quality={res:128, steps:240, scale:1, auto:false, autoScale:1, minScale:0.35};
      __LW.restore(S); await __LW.settle(); await __LW.settle(); ${read}`);
    out.serializeAfter = await g.ev(`const q=__LW.serialize().presentation.quality; return q;`);
    out.demo = await g.ev(`const w=n=>new Promise(r=>setTimeout(r,n)); __LW.layout.notebook.open('projects'); await w(200); document.querySelector('.pj-demo').click(); await w(1500); await __LW.settle();
      const nb=document.getElementById('notebook'); const r=(()=>{ ${read} })(); r.status=nb.querySelector('.pj-status')?.textContent||''; r.errs=(window.__e||[]).map(String).slice(0,5); return r;`);
    R[label] = out;
    console.log(label, JSON.stringify(out));
  } finally { await g.close(); }
}
await run('tablet', { 'general.useragent.override': IPAD });
await run('desktop', null);
console.log('wrote', save(import.meta.url, R));
