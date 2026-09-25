/* abkeys.mjs — lane M · M4 gate (after probes/D/abkeys.mjs): is the ABOUT face's remembered size (abW/abH, written by
 * nbSaveSize) carried by saveSettings()?  BASE (lab-base) vs built lab/, fresh headless Firefox each.  Also: the
 * settings bytes after a theme flip on a browser that never resized ABOUT are identical base vs built.
 *   LW_PORT=8723 GD_PORT=5242 node research/optimization-2026-09-24/probes/M/abkeys.mjs */
import { open } from '../../../../tools/gate/gatekit.mjs';
const PORT = process.env.LW_PORT || '8723';
const out = {};
for (const [tag, p] of [['base', 'research/optimization-2026-09-24/probes/M/lab-base/'], ['built', 'lab/']]) {
  const g = await open(`https://127.0.0.1:${PORT}/${p}?preset=1s%2B2pz&sw=0`, { width: 1600, height: 900 });
  try {
    await g.waitFor('window.__LW && __LW.ready', 3000, 20);
    out[tag] = await g.ev(`
      __LW.setTheme('dark'); const untouched = localStorage.getItem('lambdawaves.q0.settings'); __LW.setTheme('light');
      __LW.notebook.open('about'); __LW.layout.notebookResize(520, 600);
      const afterResize = JSON.parse(localStorage.getItem('lambdawaves.q0.settings') || '{}');
      __LW.setTheme('dark');
      const afterTheme = JSON.parse(localStorage.getItem('lambdawaves.q0.settings') || '{}');
      __LW.notebook.close(); __LW.notebook.open('about');
      return { untouched, afterResize: { abW: afterResize.abW, abH: afterResize.abH }, afterTheme: { abW: afterTheme.abW, abH: afterTheme.abH },
        reopenedSize: document.getElementById('notebook').style.width + ' × ' + document.getElementById('notebook').style.height, errs: window.__e };`);
    console.log(tag, JSON.stringify({ ...out[tag], untouched: out[tag].untouched.length }));
  } finally { await g.close(); }
}
const b = out.built;
const pass = b.afterTheme.abW === 520 && b.afterTheme.abH === 600 && /520px × 600px/.test(b.reopenedSize) && out.base.untouched === b.untouched && b.errs.length === 0;
console.log('settings bytes with ABOUT never resized, base == built:', out.base.untouched === b.untouched);
console.log((pass ? 'GREEN' : 'RED') + ' M4: ABOUT 520 × 600 survives a theme flip and reopens at that size');
process.exit(pass ? 0 : 1);
