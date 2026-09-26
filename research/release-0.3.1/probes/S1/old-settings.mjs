/* old-settings.mjs — 0.3.1 · S1: an older build's settings object (it still names a palette and a camera mode) is harmless.
 * Writes the settings a 0.3.0 browser could hold, reloads, and reads what the boot wears; then one preference change
 * (a theme flip and back) and the stored object again — the two dead keys must be gone and nothing else lost.
 *   LW_PORT=8731 GD_PORT=5231 node research/release-0.3.1/probes/S1/old-settings.mjs <tag> */
import { open } from '../../../../tools/gate/gatekit.mjs';
import { go } from '../../../../tools/gate/drv.mjs';
import fs from 'node:fs';
import path from 'node:path';
const PORT = process.env.LW_PORT || '8731';
const url = `https://127.0.0.1:${PORT}/lab/?sw=0`;
const g = await open(url, { width: 1600, height: 1000, script: 120000 });
const R = {};
try {
  await g.waitFor('window.__LW && __LW.ready', 3000, 20);
  R.seeded = await g.ev(`const s = JSON.parse(localStorage.getItem('lambdawaves.q0.settings') || '{}');
    Object.assign(s, { palette: 'lambda', camMode: 'turntable', friction: 0.5 });
    localStorage.setItem('lambdawaves.q0.settings', JSON.stringify(s)); return Object.keys(s).length;`);
  await go(g.s, url);
  await g.waitFor('window.__LW && __LW.ready', 3000, 20);
  R.boot = await g.ev(`return { paletteId: __LW.paletteId, camMode: __LW.camMode, friction: __LW.camera.friction,
    stored: (({ palette, camMode, friction }) => ({ palette, camMode, friction }))(JSON.parse(localStorage.getItem('lambdawaves.q0.settings'))), errs: (window.__e || []).map(String) };`);
  R.afterSave = await g.ev(`const t = __LW.themeChoice; __LW.setTheme(t === 'light' ? 'dark' : 'light'); __LW.setTheme(t);
    const s = JSON.parse(localStorage.getItem('lambdawaves.q0.settings'));
    return { palette: 'palette' in s, camMode: 'camMode' in s, friction: s.friction, theme: s.theme, keys: Object.keys(s).length, errs: (window.__e || []).map(String) };`);
} catch (e) { R.error = String(e && e.stack || e); console.error(e); }
finally { await g.close(); }
console.log(JSON.stringify(R, null, 1));
fs.writeFileSync(path.join(path.dirname(new URL(import.meta.url).pathname), `old-settings.${process.argv[2] || 'run'}.json`), JSON.stringify(R, null, 1));
