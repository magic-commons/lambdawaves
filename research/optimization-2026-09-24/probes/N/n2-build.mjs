/* n2-build.mjs — N2's gate: the build line the three readers show (ABOUT's version line, LW.build, the COPY DUMP text).
 *   LW_PORT=8726 GD_PORT=5245 node research/optimization-2026-09-24/probes/N/n2-build.mjs <tag> */
import { page, save } from './lib.mjs';
const g = await page();
const R = {};
try {
  R.read = await g.ev(`__LW.layout.notebook.open('about'); await __LW.settle();
    const v = document.querySelector('.nb-aboutface .ab-version');
    const dump = __LW.layout.notebook.dump();
    return { build: __LW.build, about: v ? v.textContent : null, tag: v && v.querySelector('.ab-tag') ? v.querySelector('.ab-tag').textContent : null,
      dumpLine: (dump.split('\\n').find((l) => l.indexOf('0.2.3-') >= 0) || '') + ' | ' + (dump.split('\\n').find((l) => /2026-09-2\\d/.test(l) && l.length < 80) || ''), errors: (window.__e || []).slice() };`);
} catch (e) { R.error = String(e && e.stack || e); }
finally { await g.close(); }
console.log(JSON.stringify(R));
save(import.meta.url, R);
