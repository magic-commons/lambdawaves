/* s6-badges.mjs — seam 6's behaviour read, BEFORE (probes/N/lab-pre-s6: lab/ with the pre-seam rack.js) against AFTER (/lab/):
 * the five badges (text, class, hidden, aria-expanded), the canvas's aria-label sentence and H IN FORCE, over a walk of
 * states — the boot, momentum space, a STARK field, a ZEEMAN field, a muted mode, playing, the BOX, 128³ — each after a
 * forced badges.update() (the meters' tick: LW.meters()-free, via the METERS window's own road) and a settle.
 *   LW_PORT=8726 GD_PORT=5245 node research/optimization-2026-09-24/probes/N/s6-badges.mjs */
import { open } from '../../../../tools/gate/gatekit.mjs';
import fs from 'node:fs';
const PORT = process.env.LW_PORT || '8726';
const READ = String.raw`
  try { __LW.warning.dismiss(); } catch (_) {} __LW.pause(); __LW.scrub(0);
  __LW.layout.reopen('meters', 'R'); __LW.windowActivity.presentOffscreen(true);
  const tick = async () => { __LW.schedule(1); await __LW.settle(); await __LW.settle(); await new Promise((r) => setTimeout(r, 150)); await __LW.settle(); };
  const snap = (tag) => ({ tag, badges: [...document.querySelectorAll('#badges .badge')].map((b) => [b.className, b.hidden, b.getAttribute('aria-expanded'), b.lastChild.textContent].join('|')),
    say: document.getElementById('field').getAttribute('aria-label'),
    fieldRo: (document.querySelector('.dev[data-id="state"] .ro.two') || {}).textContent || '' });
  const out = [];
  await tick(); out.push(snap('boot'));
  __LW.setSpace('p'); await tick(); out.push(snap('momentum')); __LW.setSpace('x');
  __LW.reg.setField({ Fz: 0.002 }); __LW.schedule(2); await tick(); out.push(snap('stark')); __LW.reg.setField({ Fz: 0 });
  __LW.reg.setField({ Bz: 0.01 }); __LW.schedule(2); await tick(); out.push(snap('zeeman')); __LW.reg.setField({ Bz: 0 });
  __LW.setMute(0, true); await tick(); out.push(snap('muted')); __LW.setMute(0, false);
  __LW.play(); await new Promise((r) => setTimeout(r, 400)); __LW.pause(); __LW.scrub(1.5); await tick(); out.push(snap('paused at 1.5'));
  document.querySelector('#badges .badge').click(); out.push(snap('sheet open')); document.querySelector('#badges .badge').click();
  __LW.enterBox(); __LW.pause(); __LW.scrub(0); await tick(); out.push(snap('box'));
  out.push({ errors: (window.__e || []).slice(0, 5) });
  return out;`;
async function read(path) {
  const g = await open(`https://127.0.0.1:${PORT}/${path}?preset=1s%2B2pz&sw=0`, { width: 1440, height: 900, script: 600000 });
  try { await g.waitFor('window.__LW && __LW.ready', 3000, 20); return await g.ev(READ); } finally { await g.close(); }
}
const A = await read('research/optimization-2026-09-24/probes/N/lab-pre-s6/');
const B = await read('lab/');
const differ = A.map((a, i) => JSON.stringify(a) === JSON.stringify(B[i]) ? null : { tag: a.tag, a, b: B[i] }).filter(Boolean);
const out = { snapshots: A.length - 1, differ: differ.length, first: differ.slice(0, 2), sample: A[0], errors: [A[A.length - 1], B[B.length - 1]] };
console.log(JSON.stringify(out).slice(0, 1800));
fs.writeFileSync('research/optimization-2026-09-24/probes/N/s6-badges.json', JSON.stringify(out, null, 1));
process.exit(differ.length ? 1 : 0);
