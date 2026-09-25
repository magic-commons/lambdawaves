/* n8-canvas.mjs — lane N · N8's pixel gate, after probes/M/m6.mjs: a hash of EVERY 2D canvas (by card id + index) on a
 * fresh first visit — after boot, and again after the two guarded cards are OPENED (H₂ with its STO-3G curve landed,
 * MOLECULES with its ground state solved) — on the pre-N8 copy twice (the second run is the noise floor) and the N8 copy.
 *   LW_PORT=8726 GD_PORT=5245 node research/optimization-2026-09-24/probes/N/n8-canvas.mjs */
import { open } from '../../../../tools/gate/gatekit.mjs';
import fs from 'node:fs';
const PORT = process.env.LW_PORT || '8726';
const N = 'research/optimization-2026-09-24/probes/N/';
const out = {};
for (const [tag, p] of [['base', N + 'lab-n8-before/'], ['base2', N + 'lab-n8-before/'], ['built', N + 'lab-n8-after/']]) {
  const g = await open(`https://127.0.0.1:${PORT}/${p}?preset=1s%2B2pz&sw=0`, { width: 1600, height: 900, script: 600000, prefs: { 'privacy.reduceTimerPrecision': false, 'privacy.fingerprintingProtection': false, 'privacy.fingerprintingProtection.pbmode': false, 'privacy.resistFingerprinting': false, 'privacy.baselineFingerprintingProtection': false } });
  try {
    await g.waitFor('window.__LW && __LW.ready', 3000, 20);
    out[tag] = await g.ev(`
      const H = (s) => { let h = 2166136261 >>> 0; for (let i = 0; i < s.length; i++) { h = (h ^ s.charCodeAt(i)) >>> 0; h = Math.imul(h, 16777619) >>> 0; } return h; };
      const frames = (n) => new Promise((r) => { const f = () => (--n ? requestAnimationFrame(f) : r()); requestAnimationFrame(f); });
      const canv = () => { const o = {}; for (const c of document.querySelectorAll('canvas')) { if (c.id === 'field') continue; const dev = c.closest('.dev'); const k = (dev ? dev.dataset.id : c.id || c.className) + '#' + [...(dev || document).querySelectorAll('canvas')].indexOf(c) + ':' + c.className;
          let d = ''; try { d = c.width && c.height ? c.toDataURL() : 'empty'; } catch (e) { d = 'ERR'; } o[k] = c.width + 'x' + c.height + ':' + H(d); } return o; };
      await new Promise((r) => setTimeout(r, 600)); __LW.schedule(4); await __LW.settle();
      const closedAtBoot = { h2: document.querySelector('.dev[data-id="h2"]').classList.contains('closed'), chem: document.querySelector('.dev[data-id="chem"]').classList.contains('closed') };
      const boot = canv();
      __LW.layout.reopen('h2', 'R'); __LW.layout.reopen('chem', 'R'); __LW.layout.raise('h2'); __LW.layout.raise('chem');   /* reopen = devopen (the solves); raise = unfolded (KIND 'other' folds them at boot) */
      for (let i = 0; i < 600 && !(__LW.h2.curveReady && __LW.chem.solution()); i++) await new Promise((r) => setTimeout(r, 50));
      await frames(4); await new Promise((r) => setTimeout(r, 500)); __LW.schedule(4); await __LW.settle(); await frames(2);
      const opened = canv();
      const painted = (sel) => { const c = document.querySelector(sel); if (!c || !c.width) return 0; const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i]) n++; return n; };
      return { closedAtBoot, boot, opened, ready: { h2: __LW.h2.curveReady, chem: !!__LW.chem.solution() },
        paintedH2: painted('.dev[data-id="h2"] canvas.mol-c'), paintedChem: painted('.dev[data-id="chem"] canvas.mol-c'), errs: window.__e };`);
    console.log(tag, JSON.stringify({ closedAtBoot: out[tag].closedAtBoot, ready: out[tag].ready, paintedH2: out[tag].paintedH2, paintedChem: out[tag].paintedChem, errs: out[tag].errs }));
  } finally { await g.close(); }
}
const A = out.base, Z = out.base2, B = out.built;
const noisy = (k) => Object.keys(A[k]).filter((c) => A[k][c] !== Z[k][c]);
const diff = (k) => Object.keys({ ...A[k], ...B[k] }).filter((c) => A[k][c] !== B[k][c] && A[k][c] === Z[k][c]);
const res = { canvases: Object.keys(A.opened).length, bootDiff: diff('boot'), openedDiff: diff('opened'), noisyBoot: noisy('boot'), noisyOpened: noisy('opened'),
  h2: [A.opened['h2#0:mol-c'], B.opened['h2#0:mol-c']], chem: [A.opened['chem#0:mol-c'], B.opened['chem#0:mol-c']], errs: B.errs };
console.log(JSON.stringify(res, null, 1));
fs.writeFileSync(N + 'n8-canvas.json', JSON.stringify(res, null, 1));
const pass = res.bootDiff.length === 0 && res.openedDiff.length === 0 && B.paintedH2 > 0 && B.paintedChem > 0 && B.errs.length === 0;
console.log((pass ? 'GREEN' : 'RED') + ' N8: every 2D canvas identical at boot and with H₂ + MOLECULES opened; both opened plots painted');
process.exit(pass ? 0 : 1);
