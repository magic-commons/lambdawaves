/* w125-mobile.mjs — W125-3's browser gate: headless Firefox made a TOUCH device through its own LookAndFeel prefs
 * (ui.primaryPointerCapabilities = ui.allPointerCapabilities = 1: a coarse pointer, no hover), so rack.js' OWN crossings
 * answer "mobile" — nothing in the app is stubbed.
 *   TABLET  1280×900: isTablet() (coarse + ≥ 600 px short side), not a phone.  A NEW browser → TINTED + FROST OFF; then a
 *           returning browser's stored choice (REFRACTIVE said + ALWAYS) → REFRACTIVE + ALWAYS; a card merely SAVED (not
 *           said) → the device's TINTED, its stored frost kept.
 *   PHONE   560×900: skin.css's --phone sentinel ((hover: none) and max-width 700).  A NEW browser → TINTED + FROST OFF; a
 *           stored REFRACTIVE + ALWAYS → REFRACTIVE (said: wins) and FROST OFF (the phone crossing's override, unchanged),
 *           with ALWAYS remembered to give back on the way out (phone.wasFrost, read through leaving the breakpoint).
 *   DESKTOP 1280×900, default prefs: REFRACTIVE + ALWAYS (the official defaults).
 *   LW_PORT=8729 GD_PORT=5247 node research/optimization-2026-09-24/probes/W125/w125-mobile.mjs <tag> */
import { open } from '../../../../tools/gate/gatekit.mjs';
import { go } from '../../../../tools/gate/drv.mjs';
import fs from 'node:fs';
const PORT = process.env.LW_PORT || '8729';
const url = `https://127.0.0.1:${PORT}/lab/?sw=0`;
const KEY = 'lambdawaves.q0.settings';
const TOUCH = { 'ui.primaryPointerCapabilities': 1, 'ui.allPointerCapabilities': 1 };
const READ = `return { card: __LW.cardStyle, frost: __LW.frost, frostClass: document.body.classList.contains('frost'),
  phone: __LW.layout.phone.on, tablet: __LW.layout.tablet.on,
  coarse: matchMedia('(hover: none) and (pointer: coarse)').matches, hoverNone: matchMedia('(hover: none)').matches,
  w: innerWidth, h: innerHeight, stored: localStorage.getItem('${KEY}'), errors: (window.__e || []).slice(0, 5) };`;
const R = {};
async function session(name, opts, steps) {
  const g = await open(url, Object.assign({ script: 60000 }, opts));
  try {
    const w = await g.waitFor('window.__LW?.ready', 200, 150); if (!w || !w.ok) throw new Error('never ready');
    R[name] = { fresh: await g.ev(READ) };
    for (const [label, settings] of steps) {
      await g.ev(`localStorage.setItem('${KEY}', ${JSON.stringify(JSON.stringify(settings))}); return 1;`);
      await go(g.s, url);
      const w2 = await g.waitFor('window.__LW?.ready', 200, 150); if (!w2 || !w2.ok) throw new Error('never ready after reload');
      R[name][label] = await g.ev(READ);
    }
    if (name === 'phone') {   // leave the breakpoint and come back (the --phone sentinel overridden inline, then released): the remembered policy
      R[name].leave = await g.ev(`const before = __LW.frost; document.documentElement.style.setProperty('--phone', '0'); __LW.layout.phone.sync(); const after = __LW.frost; document.documentElement.style.removeProperty('--phone'); __LW.layout.phone.sync(); return { before, afterLeaving: after, backOnPhone: __LW.frost };`);
    }
  } catch (e) { R[name] = Object.assign(R[name] || {}, { E: String(e && e.stack || e) }); }
  finally { await g.close(); }
}
const said = { card: 'refractive', cardSet: true, frost: 'always' };
const savedNotSaid = { card: 'refractive', frost: 'always' };
await session('tablet', { width: 1280, height: 900, prefs: TOUCH }, [['returningSaid', said], ['savedNotSaid', savedNotSaid]]);
await session('phone', { width: 560, height: 900, prefs: TOUCH }, [['returningSaid', said]]);
await session('desktop', { width: 1280, height: 900 }, []);
console.log(JSON.stringify(R, null, 1));
fs.writeFileSync(new URL(`./w125-mobile.${process.argv[2] || 'run'}.json`, import.meta.url), JSON.stringify(R, null, 1));
