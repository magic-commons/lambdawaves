/* w129-rack.mjs — the newcomer's rack on desktop / tablet / phone (headless Firefox, touch through LookAndFeel prefs, as
 * W125's w125-mobile.mjs): which windows are on the rack (not closed, not hidden), which are folded, and what the + list
 * offers.  LW_PORT=8744 GD_PORT=5255 node research/optimization-2026-09-24/probes/W129/w129-rack.mjs <tag> */
import { open } from '../../../../tools/gate/gatekit.mjs';
import fs from 'node:fs';
const PORT = process.env.LW_PORT || '8744';
const url = `https://127.0.0.1:${PORT}/lab/?sw=0`;
const TOUCH = { 'ui.primaryPointerCapabilities': 1, 'ui.allPointerCapabilities': 1 };
const READ = `const on = [...document.querySelectorAll('#rackL .dev, #rack .dev, #floats .dev')].filter(d => !d.hidden && !d.classList.contains('closed'));
  __LW.layout.addMenu.open(); const plus = [...document.querySelectorAll('#rackAddList .mb-item')].map(b => b.dataset.win); __LW.layout.addMenu.close();
  return { phone: __LW.layout.phone.on, tablet: __LW.layout.tablet.on,
    rack: on.map(d => d.dataset.id + (d.classList.contains('folded') ? '(folded)' : '')), plus, errors: (window.__e || []).slice(0, 5) };`;
const R = {};
for (const [name, opts] of [['desktop', { width: 1300, height: 850 }], ['tablet', { width: 1280, height: 900, prefs: TOUCH }], ['phone', { width: 560, height: 900, prefs: TOUCH }]]) {
  const g = await open(url, Object.assign({ script: 60000 }, opts));
  try { const w = await g.waitFor('window.__LW?.ready', 200, 150); if (!w || !w.ok) throw new Error('never ready'); R[name] = await g.ev(READ); }
  catch (e) { R[name] = { E: String(e && e.stack || e) }; } finally { await g.close(); }
}
console.log(JSON.stringify(R, null, 1));
fs.writeFileSync(new URL(`./w129-rack.${process.argv[2] || 'run'}.json`, import.meta.url), JSON.stringify(R, null, 1));
