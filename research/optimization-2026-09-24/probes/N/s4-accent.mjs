/* s4-accent.mjs — seam 4's behaviour read, BEFORE (probes/N/lab-pre-s4: lab/ with the pre-seam rack.js) against AFTER
 * (/lab/): for 4 palettes × 2 themes × 3 hues × the palette switch, the two accents and the glow (--acc, --acc2,
 * --acc-glow, --acc-ink), every copy of the mark's fills and the λ colours, LW.logo.colours at 5 phases, the turn
 * keyframes' text (LW.logo.css), LW.ink.mark / stageMark over 12 angles, a STAGE move, a gamut round trip, and a
 * busy mark raised (its clone takes the colours).  Equal JSON = the seam moved no colour.
 *   LW_PORT=8726 GD_PORT=5245 node research/optimization-2026-09-24/probes/N/s4-accent.mjs */
import { open } from '../../../../tools/gate/gatekit.mjs';
import fs from 'node:fs';
const PORT = process.env.LW_PORT || '8726';
const READ = String.raw`
  const out = []; const H = (s) => { let h = 2166136261 >>> 0; for (let i = 0; i < s.length; i++) { h = (h ^ s.charCodeAt(i)) >>> 0; h = Math.imul(h, 16777619) >>> 0; } return h.toString(16); };
  try { __LW.warning.dismiss(); } catch (_) {} __LW.pause();
  const snap = (tag) => { const st = document.body.style; __LW.busy.begin();
    const r = { tag, acc: st.getPropertyValue('--acc'), acc2: st.getPropertyValue('--acc2'), glow: st.getPropertyValue('--acc-glow'), ink: st.getPropertyValue('--acc-ink'),
      fills: [...document.querySelectorAll('#title .mark rect, .nb-logo .mark rect, #busyMark .mark rect, .mod-logo .mark rect')].map((x) => x.getAttribute('fill') + '/' + x.getAttribute('class')).join(','),
      lam: [...document.querySelectorAll('#title .lam, .nb-logo .lam')].map((x) => x.style.color).join(','),
      logo: [0, 13, 90, 200, 359].map((p) => __LW.logo.colours(p).join('')).join('|'), css: H(__LW.logo.css),
      mark: [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((d) => __LW.ink.mark(d).join('.') + ':' + __LW.ink.stageMark(d).join('.')).join(','),
      ground: __LW.ink.ground.join('.') + '/' + __LW.ink.stageGround.join('.') };
    __LW.busy.end(); return r; };
  __LW.layout.notebook.open('about'); await __LW.settle();
  for (const theme of ['light', 'dark']) { __LW.setTheme(theme);
    for (const pal of ['prism', 'lambda', 'ember', 'aurora']) { __LW.setPalette(pal);
      for (const on of [false, true]) { if (__LW.palette.on !== on) __LW.palette.setOn(on);
        for (const hue of [0, 0.37, 0.81]) { __LW.mat.hueShift = hue; __LW.accent.set(30 + hue * 100, 300 - hue * 50); out.push(snap(theme + '/' + pal + '/' + on + '/' + hue)); } } } }
  __LW.setStage(0.6); out.push(snap('stage 0.6')); __LW.setStage(0.04);
  __LW.gamut.set('p3'); out.push(snap('p3')); __LW.gamut.set('srgb'); out.push(snap('srgb'));
  out.push({ errors: (window.__e || []).slice(0, 5) });
  return out;`;
async function read(path) {
  const g = await open(`https://127.0.0.1:${PORT}/${path}?preset=1s%2B2pz&sw=0`, { width: 1440, height: 900, script: 600000 });
  try { await g.waitFor('window.__LW && __LW.ready', 3000, 20); return await g.ev(READ); } finally { await g.close(); }
}
const A = await read('research/optimization-2026-09-24/probes/N/lab-pre-s4/');
const B = await read('lab/');
const differ = A.map((a, i) => JSON.stringify(a) === JSON.stringify(B[i]) ? null : { tag: a.tag, a, b: B[i] }).filter(Boolean);
const out = { snapshots: A.length - 1, differ: differ.length, first: differ.slice(0, 2), errors: [A[A.length - 1], B[B.length - 1]] };
console.log(JSON.stringify(out).slice(0, 1500));
fs.writeFileSync('research/optimization-2026-09-24/probes/N/s4-accent.json', JSON.stringify(out, null, 1));
process.exit(differ.length ? 1 : 0);
