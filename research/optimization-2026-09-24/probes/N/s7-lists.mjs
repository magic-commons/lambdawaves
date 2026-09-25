/* s7-lists.mjs — seam 7's behaviour read, BEFORE (probes/N/lab-pre-s7) against AFTER (/lab/): the + list (its rows, the ★
 * favourites mark, a click reopening a window, a SHIFT queue of three opening in picked order, Escape-free close on an
 * outside press) and the ☆ list (save two layouts, the rows, load one, forget one).  Equal JSON = the seam moved nothing.
 *   LW_PORT=8726 GD_PORT=5245 node research/optimization-2026-09-24/probes/N/s7-lists.mjs */
import { open } from '../../../../tools/gate/gatekit.mjs';
import fs from 'node:fs';
const PORT = process.env.LW_PORT || '8726';
const READ = String.raw`
  try { __LW.warning.dismiss(); } catch (_) {} __LW.pause();
  const L = __LW.layout, out = [];
  const rows = () => [...document.querySelectorAll('#rackAddList .mb-item')].map((b) => b.textContent + (b.classList.contains('queued') ? '#' : ''));
  const racks = () => [...document.querySelectorAll('#rackL .dev, #rack .dev')].filter((d) => !d.classList.contains('closed')).map((d) => d.dataset.id).join(',');
  L.addMenu.open(); out.push({ open: L.addMenu.shown, rows: rows(), aria: document.getElementById('rackAdd').getAttribute('aria-expanded') });
  document.querySelector('#rackAddList .mb-item[data-win="wigner"]').click(); out.push({ afterClick: racks(), shown: L.addMenu.shown });
  L.addMenu.open();
  for (const id of ['vortex', 'slice', 'atoms']) { const b = document.querySelector('#rackAddList .mb-item[data-win="' + id + '"]'); if (b) b.dispatchEvent(new MouseEvent('click', { shiftKey: true, bubbles: true })); }
  out.push({ queued: L.addMenu.queued, rows: rows() });
  window.dispatchEvent(new KeyboardEvent('keyup', { key: 'Shift' })); out.push({ afterCommit: racks(), shown: L.addMenu.shown });
  L.addMenu.open(); document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); out.push({ outside: L.addMenu.shown });
  L.saveLayout(1); L.saveLayout(3);
  L.favMenu.open(); out.push({ fav: L.favMenu.items.map((t) => t.replace(/\d\d:\d\d/, 'hh:mm')), shown: L.favMenu.shown });
  L.addMenu.open(); out.push({ starred: [...document.querySelectorAll('#rackAddList .mb-fav')].length, rows: rows() }); L.addMenu.close();
  L.forgetLayout(3); L.favMenu.redraw(); out.push({ afterForget: L.favMenu.items.map((t) => t.replace(/\d\d:\d\d/, 'hh:mm')) });
  L.favMenu.close(); out.push({ closed: !L.favMenu.shown, errors: (window.__e || []).slice(0, 5) });
  return out;`;
async function read(path) {
  const g = await open(`https://127.0.0.1:${PORT}/${path}?preset=1s%2B2pz&sw=0`, { width: 1440, height: 900, script: 600000 });
  try { await g.waitFor('window.__LW && __LW.ready', 3000, 20); return await g.ev(READ); } finally { await g.close(); }
}
const A = await read('research/optimization-2026-09-24/probes/N/lab-pre-s7/');
const B = await read('lab/');
const differ = A.map((a, i) => JSON.stringify(a) === JSON.stringify(B[i]) ? null : { i, a, b: B[i] }).filter(Boolean);
const out = { steps: A.length, differ: differ.length, first: differ.slice(0, 2), sample: A.slice(0, 3) };
console.log(JSON.stringify(out).slice(0, 1600));
fs.writeFileSync('research/optimization-2026-09-24/probes/N/s7-lists.json', JSON.stringify(out, null, 1));
process.exit(differ.length ? 1 : 0);
